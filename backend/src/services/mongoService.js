/**
 * mongoService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * MongoDB persistence layer for ARX IT CLUB.
 * Exports the same interface as the legacy fileService.js so db.js is untouched:
 *   readDb()       – synchronous (returns in-memory cached snapshot or null)
 *   readDbAsync()  – async, fetches the latest state from MongoDB
 *   writeDb(data)  – async, persists the full state snapshot to MongoDB
 *   dbFileExists() – returns true when MongoDB is configured
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Connection string resolution ──────────────────────────────────────────────
const MONGO_URI = (
  process.env.MONGODB_URI ||
  process.env.MONGO_URI   ||
  process.env.DATABASE_URL ||
  ''
).trim();

export const isMongoConfigured = Boolean(
  MONGO_URI &&
  (MONGO_URI.startsWith('mongodb://') || MONGO_URI.startsWith('mongodb+srv://'))
);

// ── Fallback local-file paths (used when MongoDB is not configured) ──────────
const PROJECT_DB_PATH = path.resolve(__dirname, '../../../arx_database.json');
const TMP_DB_PATH     = path.join(
  process.env.TMPDIR || process.env.TEMP || '/tmp',
  'arx_database.json'
);

// ── In-memory cache (so readDb() can return synchronously) ───────────────────
let _cache = null;
let _connected = false;

// ── Mongoose schema ──────────────────────────────────────────────────────────
const stateSchema = new mongoose.Schema(
  {
    key:        { type: String, required: true, unique: true, index: true },
    payload:    { type: mongoose.Schema.Types.Mixed, required: true },
    exportedAt: { type: Date, default: Date.now }
  },
  { collection: 'arx_state', timestamps: true }
);

// Lazy model reference
let ArxState = null;

function getModel() {
  if (!ArxState) {
    ArxState = mongoose.models.ArxState || mongoose.model('ArxState', stateSchema);
  }
  return ArxState;
}

// ── Connection ────────────────────────────────────────────────────────────────
async function ensureConnected() {
  if (_connected || mongoose.connection.readyState === 1) {
    _connected = true;
    return true;
  }
  if (!isMongoConfigured) return false;

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS:          30000,
      maxPoolSize:              10,
    });
    _connected = true;
    console.log('[MongoDB] ✅ Connected successfully to MongoDB Atlas.');
    return true;
  } catch (err) {
    console.warn('[MongoDB] ⚠️  Connection failed:', err?.message || err);
    _connected = false;
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  _connected = false;
  console.warn('[MongoDB] ⚠️  Disconnected. Will reconnect on next operation.');
});

// ── Local file helpers (cache / fallback) ────────────────────────────────────
function localRead() {
  if (fs.existsSync(PROJECT_DB_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(PROJECT_DB_PATH, 'utf8'));
      if (data && typeof data === 'object') return data;
    } catch { /* fall through */ }
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

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Synchronous read – returns whatever is currently in the local cache.
 * Used during the first synchronous tick of startup before async init.
 */
export function readDb() {
  if (_cache) return _cache;
  const local = localRead();
  if (local) _cache = local;
  return _cache;
}

/**
 * Async read – fetches the latest state from MongoDB, falls back to local file.
 * Called by db.js ensureInitialized().
 */
export async function readDbAsync() {
  const local = localRead();

  if (isMongoConfigured) {
    const ok = await ensureConnected();
    if (ok) {
      try {
        const Model  = getModel();
        const doc    = await Model.findOne({ key: 'global' }).lean().exec();
        if (doc && doc.payload && doc.payload.members && doc.payload.members.length > 0) {
          const data = doc.payload;
          // Merge with local: keep local as base, overlay MongoDB data, and merge members by ID
          const localMembers = Array.isArray(local?.members) ? local.members : [];
          const remoteMembers = Array.isArray(data?.members) ? data.members : [];
          const memberMap = new Map();
          for (const m of remoteMembers) if (m && m.id) memberMap.set(m.id, m);
          for (const m of localMembers) if (m && m.id) memberMap.set(m.id, m);
          const mergedMembers = Array.from(memberMap.values());

          const merged = { ...local, ...data, members: mergedMembers };
          _cache = merged;
          localWrite(merged);
          console.log('[MongoDB] ✅ State loaded from MongoDB. Members:', mergedMembers.length);
          return merged;
        } else if (local) {
          // MongoDB is empty – seed it from local JSON
          console.log('[MongoDB] ℹ️  Database is empty. Seeding initial state from local file...');
          await _writeMongo(local);
          _cache = local;
          return local;
        }
      } catch (err) {
        console.warn('[MongoDB] ⚠️  Read error (falling back to local):', err?.message || err);
      }
    }
  }

  // Fallback: local file only
  if (local) {
    _cache = local;
    return local;
  }

  return null;
}

/**
 * Internal MongoDB write helper.
 */
async function _writeMongo(data) {
  if (!isMongoConfigured) return false;
  const ok = await ensureConnected();
  if (!ok) return false;
  try {
    const Model = getModel();
    await Model.findOneAndUpdate(
      { key: 'global' },
      {
        $set: {
          key:        'global',
          payload:    data,
          exportedAt: new Date()
        }
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    ).exec();
    return true;
  } catch (err) {
    console.warn('[MongoDB] ⚠️  Write error:', err?.message || err);
    return false;
  }
}

/**
 * Async write – persists the full state snapshot to MongoDB + local file.
 * Called by db.js _saveToFile().
 */
export async function writeDb(data) {
  if (!data) return false;

  // Always write locally first (fast, synchronous cache)
  _cache = data;
  localWrite(data);

  // Then asynchronously persist to MongoDB
  if (isMongoConfigured) {
    const ok = await _writeMongo(data);
    if (ok) return true;
    // MongoDB write failed – local file is our fallback
    console.warn('[MongoDB] ⚠️  Failed to sync to MongoDB. Data is saved locally.');
  }

  return true; // local write always succeeds from in-process perspective
}

/**
 * Returns true when a persistence backend is available.
 */
export function dbFileExists() {
  if (isMongoConfigured) return true;
  return [PROJECT_DB_PATH, TMP_DB_PATH].some(fp => {
    try { return fs.existsSync(fp); } catch { return false; }
  });
}
