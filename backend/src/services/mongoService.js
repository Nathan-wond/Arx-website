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
import dns from 'dns';

// Fix Windows / local ISP DNS refusal on querySrv for mongodb+srv://
if (typeof dns.setServers === 'function') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (_) {}
}

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

function sanitizeMongoUri(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let uri = raw.trim();
  return uri.replace(/^(mongodb(?:\+srv)?:\/\/)(?:<([^>]+)>|([^:]+)):(?:<([^>]+)>|([^@]+))@/i, (_match, prefix, u1, u2, p1, p2) => {
    const user = u1 || u2 || '';
    const pass = p1 || p2 || '';
    return prefix + user + ':' + pass + '@';
  });
}

// ── Connection string resolution ──────────────────────────────────────────────
const RAW_MONGO_URI = (
  process.env.MONGODB_URI ||
  process.env.MONGO_URI   ||
  process.env.DATABASE_URL ||
  ''
).trim();

const MONGO_URI = sanitizeMongoUri(RAW_MONGO_URI);

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
let _connectingPromise = null;

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
  // Reuse existing connection if already established
  if (_connected || mongoose.connection.readyState === 1) {
    _connected = true;
    return true;
  }
  if (_connectingPromise) {
    return _connectingPromise;
  }

  if (!isMongoConfigured) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.error('[MongoDB] ❌ CRITICAL: Production environment requires MongoDB Atlas. Set MONGODB_URI in environment variables.');
      throw new Error('MongoDB connection required in production but MONGODB_URI not configured');
    }
    return false;
  }

  _connectingPromise = (async () => {
  try {
    // Serverless-optimized connection settings
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS:          30000,
      maxPoolSize:              10,
      minPoolSize:              2,
      maxIdleTimeMS:            10000,
      retryWrites:              true,
      retryReads:               true,
      w:                        'majority'
    });
    _connected = true;

    // Extract database name from URI for logging (without credentials)
    const dbMatch = MONGO_URI.match(/\/([^/?]+)(\?|$)/);
    const dbName = dbMatch ? dbMatch[1] : 'unknown';
    console.log(`[MongoDB] ✅ Connected successfully to database: ${dbName}`);

    return true;
  } catch (err) {
    console.error('[MongoDB] ❌ Connection failed:', err?.message || err);
    _connected = false;

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      // In production, MongoDB failure is fatal
      throw new Error(`Production MongoDB connection failed: ${err?.message}`);
    }
    return false;
  }
})().finally(() => {
    _connectingPromise = null;
  });
  return _connectingPromise;
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
  const isProduction = process.env.NODE_ENV === 'production';

  if (isMongoConfigured) {
    const ok = await ensureConnected();
    if (ok) {
      try {
        const Model  = getModel();
        const doc    = await Model.findOne({ key: 'global' }).lean().exec();

        if (doc && doc.payload) {
          const data = doc.payload;
          _cache = data;

          // Also write to local file for development convenience (but MongoDB is authoritative)
          if (!isProduction) {
            localWrite(data);
          }

          const memberCount = Array.isArray(data.members) ? data.members.length : 0;
          console.log(`[MongoDB] ✅ State loaded from MongoDB. Members: ${memberCount}, Settings: ${data.settings ? 'present' : 'missing'}`);
          return data;
        } else {
          // MongoDB document exists but payload is empty - initialize from local if available
          const local = localRead();
          if (local) {
            console.log('[MongoDB] ℹ️  Empty MongoDB document found. Initializing from local state...');
            await _writeMongo(local);
            _cache = local;
            return local;
          }

          // No local state either - return null to trigger default initialization
          console.log('[MongoDB] ℹ️  MongoDB and local state both empty. Will initialize with defaults.');
          return null;
        }
      } catch (err) {
        console.error('[MongoDB] ❌ Read error:', err?.message || err);
        if (isProduction) {
          throw new Error(`Production MongoDB read failed: ${err?.message}`);
        }
        // Development: fall through to local file fallback
      }
    } else if (isProduction) {
      throw new Error('Production requires MongoDB but connection failed');
    }
  } else if (isProduction) {
    throw new Error('Production requires MongoDB but MONGODB_URI not configured');
  }

  // Development fallback: local file only
  const local = localRead();
  if (local) {
    _cache = local;
    console.log('[MongoDB] ⚠️  Using local file storage (development only)');
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
    const result = await Model.findOneAndUpdate(
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

    if (result) {
      const memberCount = Array.isArray(data.members) ? data.members.length : 0;
      console.log(`[MongoDB] ✅ Write successful. Members: ${memberCount}, Timestamp: ${new Date().toISOString()}`);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[MongoDB] ❌ Write error:', err?.message || err);
    return false;
  }
}

/**
 * Async write – persists the full state snapshot to MongoDB + local file.
 * Called by db.js _saveToFile().
 */
export async function writeDb(data) {
  if (!data) return false;

  const isProduction = process.env.NODE_ENV === 'production';

  // Update in-memory cache immediately
  _cache = data;

  // MongoDB write is REQUIRED in production, optional in development
  if (isMongoConfigured) {
    const ok = await _writeMongo(data);
    if (ok) {
      // Success - also write to local file in development for convenience
      if (!isProduction) {
        localWrite(data);
      }
      return true;
    } else {
      // MongoDB write failed
      if (isProduction) {
        console.error('[MongoDB] ❌ CRITICAL: Production write failed. Data not persisted.');
        throw new Error('Production MongoDB write failed - data persistence failure');
      }
      console.warn('[MongoDB] ⚠️  MongoDB write failed. Falling back to local file (development only).');
    }
  } else if (isProduction) {
    console.error('[MongoDB] ❌ CRITICAL: Production requires MongoDB but MONGODB_URI not configured.');
    throw new Error('Production requires MongoDB but MONGODB_URI not configured');
  }

  // Development fallback: write to local file only
  localWrite(data);
  console.log('[MongoDB] ⚠️  Using local file storage (development only)');
  return true;
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
