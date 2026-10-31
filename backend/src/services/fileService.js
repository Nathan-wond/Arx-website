/**
 * fileService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Persistence service selected by DATABASE_PROVIDER.
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

const defaultProvider = process.env.NODE_ENV === 'production'
  ? (isMongoConfigured ? 'mongodb' : isNeonConfigured ? 'neon' : 'local')
  : 'local';
const requestedProvider = (process.env.DATABASE_PROVIDER || defaultProvider).trim().toLowerCase();
const providerAliases = {
  mongo: 'mongodb',
  postgres: 'neon'
};

export const PERSISTENCE_PROVIDER = providerAliases[requestedProvider] || requestedProvider;

if (!['local', 'mongodb', 'neon'].includes(PERSISTENCE_PROVIDER)) {
  throw new Error(`Unsupported DATABASE_PROVIDER "${requestedProvider}". Use local, mongodb, or neon.`);
}
if (PERSISTENCE_PROVIDER === 'mongodb' && !isMongoConfigured) {
  throw new Error('DATABASE_PROVIDER is mongodb, but MONGODB_URI is not configured.');
}
if (PERSISTENCE_PROVIDER === 'neon' && !isNeonConfigured) {
  throw new Error('DATABASE_PROVIDER is neon, but DATABASE_URL is not configured.');
}
if (PERSISTENCE_PROVIDER === 'local' && process.env.NODE_ENV === 'production') {
  throw new Error('Local JSON persistence is not durable in production. Configure DATABASE_PROVIDER=mongodb or neon.');
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
  fs.mkdirSync(path.dirname(PROJECT_DB_PATH), { recursive: true });
  const tmp = PROJECT_DB_PATH + '.tmp';
  fs.writeFileSync(tmp, payload, 'utf8');
  fs.renameSync(tmp, PROJECT_DB_PATH);

  try {
    const tmp = TMP_DB_PATH + '.tmp';
    fs.mkdirSync(path.dirname(TMP_DB_PATH), { recursive: true });
    fs.writeFileSync(tmp, payload, 'utf8');
    fs.renameSync(tmp, TMP_DB_PATH);
  } catch (err) {
    console.warn('[Persistence] Could not update temporary database backup:', err.message);
  }
}

// ── Public Persistence API ───────────────────────────────────────────────────

let neonInitialized = false;

/**
 * Synchronous read — returns whatever is cached locally.
 */
export function readDb() {
  if (PERSISTENCE_PROVIDER === 'mongodb') return mongoReadDb();
  return localRead();
}

/**
 * Async read — fetches from the configured backend.
 */
export async function readDbAsync() {
  if (PERSISTENCE_PROVIDER === 'mongodb') {
    return mongoReadDbAsync();
  }

  const local = localRead();
  if (PERSISTENCE_PROVIDER === 'neon') {
    if (!neonInitialized) {
      const initialized = await initNeonSchema();
      if (!initialized) throw new Error('Could not initialize the Neon PostgreSQL schema.');
      neonInitialized = true;
    }
    const neonData = await fetchStateFromNeon();
    if (neonData) return { ...local, ...neonData };
    if (local) {
      console.log('[Neon PostgreSQL] Database empty. Seeding from local store...');
      await syncStateToNeon(local);
      return local;
    }
    return null;
  }

  return local;
}

/**
 * Write to the configured backend.
 */
export async function writeDb(data) {
  if (!data) return false;

  if (PERSISTENCE_PROVIDER === 'mongodb') {
    return mongoWriteDb(data);
  }

  if (PERSISTENCE_PROVIDER === 'local') {
    localWrite(data);
    return true;
  }

  if (!neonInitialized) {
    const initialized = await initNeonSchema();
    if (!initialized) throw new Error('Could not initialize the Neon PostgreSQL schema.');
    neonInitialized = true;
  }
  localWrite(data);
  const synced = await syncStateToNeon(data);
  if (!synced) {
    throw new Error('Could not persist state to Neon PostgreSQL.');
  }
  return true;
}

export function getPersistenceProvider() {
  return PERSISTENCE_PROVIDER;
}

export function dbFileExists() {
  if (PERSISTENCE_PROVIDER === 'mongodb') return mongoDbFileExists();
  if (PERSISTENCE_PROVIDER === 'neon') return true;
  return [PROJECT_DB_PATH, TMP_DB_PATH].some(fp => {
    try { return fs.existsSync(fp); } catch { return false; }
  });
}
