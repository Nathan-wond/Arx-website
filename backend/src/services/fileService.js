/**
 * fileService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified persistence service.
 * Priority order:
 *   1. MongoDB Atlas (via mongoService.js) — when MONGODB_URI is set
 *   2. Neon PostgreSQL (via neonPostgresService.js) — when DATABASE_URL is set
 *   3. Supabase Storage legacy fallback — when SUPABASE_URL/KEY are set
 *   4. Local JSON file (arx_database.json) — always available as fallback
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

// ── Supabase legacy helpers ──────────────────────────────────────────────────

function isValidSupabaseUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '-' || trimmed.length < 10) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch { return false; }
}

function isValidSupabaseKey(key) {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return trimmed !== '-' && trimmed.length > 20;
}

const rawSupabaseUrl = process.env.SUPABASE_URL;
const rawSupabaseKey = process.env.SUPABASE_SECRET_KEY;

const SUPABASE_URL  = isValidSupabaseUrl(rawSupabaseUrl)  ? rawSupabaseUrl.trim().replace(/\/$/, '') : null;
const SUPABASE_KEY  = isValidSupabaseKey(rawSupabaseKey)  ? rawSupabaseKey.trim()                    : null;
const BUCKET        = 'arx-database';
const OBJECT_NAME   = 'arx_database.json';
const STORAGE_BASE  = SUPABASE_URL && SUPABASE_KEY
  ? `${SUPABASE_URL}/storage/v1/object`
  : null;

const PROJECT_DB_PATH = path.resolve(__dirname, '../../../arx_database.json');
const TMP_DB_PATH     = path.join(
  process.env.TMPDIR || process.env.TEMP || '/tmp',
  'arx_database.json'
);

// ── Supabase Storage legacy helpers ─────────────────────────────────────────

async function supabaseDownload() {
  if (!STORAGE_BASE) return null;
  try {
    const res = await fetch(`${STORAGE_BASE}/${BUCKET}/${OBJECT_NAME}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function supabaseUpload(data) {
  if (!STORAGE_BASE) return false;
  try {
    const body = JSON.stringify(data, null, 2);
    let res = await fetch(`${STORAGE_BASE}/${BUCKET}/${OBJECT_NAME}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body
    });
    if (!res.ok && res.status !== 404) {
      res = await fetch(`${STORAGE_BASE}/${BUCKET}/${OBJECT_NAME}`, {
        method: 'PUT',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'x-upsert': 'true'
        },
        body
      });
    }
    return res.ok;
  } catch { return false; }
}

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
 * Priority: MongoDB → Neon PostgreSQL → Supabase → local file.
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

  // ── 3. Legacy Supabase Storage ───────────────────────────────────────────
  const remote = await supabaseDownload();
  if (remote && local) {
    const localTime  = new Date(local.exportedAt  || 0).getTime();
    const remoteTime = new Date(remote.exportedAt || 0).getTime();
    if (localTime > remoteTime) {
      supabaseUpload(local).catch(() => {});
      return local;
    } else {
      localWrite(remote);
      return remote;
    }
  }
  if (remote) { localWrite(remote); return remote; }

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

  // ── 3. Legacy Supabase Storage ───────────────────────────────────────────
  try {
    return await supabaseUpload(data);
  } catch { return false; }
}

export function dbFileExists() {
  if (isMongoConfigured) return mongoDbFileExists();
  if (isNeonConfigured || STORAGE_BASE) return true;
  return [PROJECT_DB_PATH, TMP_DB_PATH].some(fp => {
    try { return fs.existsSync(fp); } catch { return false; }
  });
}
