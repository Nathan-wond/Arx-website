/**
 * fileService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified persistence service.
 * Priority order:
 *   1. MongoDB Atlas (via mongoService.js) — when MONGODB_URI is set
 *   2. Neon PostgreSQL (via neonPostgresService.js) — when DATABASE_URL is set
 *   3. Local JSON file (arx_database.json) — always available as fallback
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  isNeonConfigured,
  initNeonSchema,
  syncStateToNeon,
  fetchStateFromNeon
} from './neonPostgresService.js';
import {
  isMongoConfigured,
  readDb   as mongoReadDb,
  readDbAsync as mongoReadDbAsync,
  writeDb  as mongoWriteDb,
  dbFileExists as mongoDbFileExists
} from './mongoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const PROJECT_DB_PATH = path.resolve(__dirname, '../../../arx_database.json');
const TMP_DB_PATH     = path.join(
  process.env.TMPDIR || process.env.TEMP || '/tmp',
  'arx_database.json'
);

// ── Local file helpers ───────────────────────────────────────────────────────

function localRead() {
  if (fs.existsSync(PROJECT_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROJECT_DB_PATH, 'utf8'));
      if (data && typeof data === 'object') return data;
    } catch { /* fallback to tmp */ }
  }
  if (fs.existsSync(TMP_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(TMP_DB_PATH, 'utf8'));
      if (data && typeof data === 'object') return data;
    } catch { /* ignore */ }
  }
  return null;
}

function localWrite(data) {
  const payload = JSON.stringify(data, null, 2);
  try {
    const tmp = PROJECT_DB_PATH + '.tmp';
    fs.writeFileSync(tmp, payload, 'utf8');
    fs.renameSync(tmp, PROJECT_DB_PATH);
  } catch { /* read-only on serverless */ }
  try {
    const tmp = TMP_DB_PATH + '.tmp';
    fs.writeFileSync(tmp, payload, 'utf8');
    fs.renameSync(tmp, TMP_DB_PATH);
  } catch { /* ignore */ }
}

// ── Public Persistence API ───────────────────────────────────────────────────

let neonInitialized = false;

/**
 * Synchronous read — returns whatever is cached locally.
 */
export function readDb() {
  // MongoDB has its own local cache layer
  if (isMongoConfigured) return mongoReadDb();
  return localRead();
}

/**
 * Async read — fetches from the best available backend.
 * Priority: MongoDB → Neon PostgreSQL → local file.
 */
export async function readDbAsync() {
  // ── 1. MongoDB Atlas (highest priority) ──────────────────────────────────
  if (isMongoConfigured) {
    try {
      const data = await mongoReadDbAsync();
      if (data) return data;
    } catch (err) {
      console.warn('[Persistence] MongoDB read failed, trying fallback:', err?.message);
    }
  }

  const local = localRead();

  // ── 2. Neon PostgreSQL ───────────────────────────────────────────────────
  if (isNeonConfigured) {
    try {
      if (!neonInitialized) {
        await initNeonSchema();
        neonInitialized = true;
      }
      const neonData = await fetchStateFromNeon();
      if (neonData && neonData.members && neonData.members.length > 0) {
        const merged = { ...local, ...neonData };
        localWrite(merged);
        return merged;
      } else if (local) {
        console.log('[Neon PostgreSQL] Database empty. Seeding from local store...');
        await syncStateToNeon(local);
        return local;
      }
    } catch (neonErr) {
      console.warn('[Neon PostgreSQL Read Warning]:', neonErr?.message || neonErr);
    }
  }

  return local;
}

/**
 * Write to the best available backend(s).
 */
export async function writeDb(data) {
  if (!data) return false;

  // ── 1. MongoDB Atlas ─────────────────────────────────────────────────────
  if (isMongoConfigured) {
    return mongoWriteDb(data);
  }

  // Always write locally
  localWrite(data);

  // ── 2. Neon PostgreSQL ───────────────────────────────────────────────────
  if (isNeonConfigured) {
    try {
      if (!neonInitialized) {
        await initNeonSchema();
        neonInitialized = true;
      }
      syncStateToNeon(data).catch(err =>
        console.warn('[Neon PostgreSQL Background Sync Warning]:', err?.message)
      );
      return true;
    } catch (err) {
      console.warn('[Neon PostgreSQL Sync Error]:', err?.message);
    }
  }

  return true;
}

export function dbFileExists() {
  if (isMongoConfigured) return mongoDbFileExists();
  if (isNeonConfigured) return true;
  return [PROJECT_DB_PATH, TMP_DB_PATH].some(fp => {
    try { return fs.existsSync(fp); } catch { return false; }
  });
}
