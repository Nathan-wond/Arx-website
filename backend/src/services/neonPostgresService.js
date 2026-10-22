import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = (
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL ||
  ''
).trim();

export const isNeonConfigured = Boolean(
  databaseUrl &&
  databaseUrl.startsWith('postgres') &&
  databaseUrl !== '-'
);

let pool = null;

if (isNeonConfigured) {
  try {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.warn('[Neon PostgreSQL Pool Warning]:', err.message);
    });

    console.log('[Neon PostgreSQL] Initialized client pool with secure SSL connection.');
  } catch (err) {
    console.error('[Neon PostgreSQL] Failed to initialize connection pool:', err.message);
    pool = null;
  }
} else {
  console.log('[Neon PostgreSQL] DATABASE_URL not set or inactive. Running in local JSON persistence mode with fallback cache.');
}

export async function queryNeon(text, params = []) {
  if (!pool) return null;
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.warn('[Neon PostgreSQL Query Error]:', err.message);
    return null;
  }
}

export async function initNeonSchema() {
  if (!pool) return false;
  try {
    const migrationPath = path.resolve(__dirname, '../../../migrations/001_initial_neon_schema.sql');
    if (fs.existsSync(migrationPath)) {
      const sql = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(sql);
      console.log('[Neon PostgreSQL] Schema tables and indexes successfully verified/created.');
      return true;
    }
  } catch (err) {
    console.warn('[Neon PostgreSQL Schema Init Warning]:', err.message);
    return false;
  }
  return false;
}

export async function syncStateToNeon(data) {
  if (!pool || !data || typeof data !== 'object') return false;

  try {
    // 1. Settings
    if (data.settings) {
      await pool.query(
        `INSERT INTO arx_settings (key, value, updated_at) 
         VALUES ('global_settings', $1, NOW()) 
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [JSON.stringify(data.settings)]
      );
    }

    // 2. Members sync (upsert key attributes)
    if (Array.isArray(data.members)) {
      for (const m of data.members) {
        if (!m || !m.id || !m.memberId) continue;
        await pool.query(
          `INSERT INTO arx_members (
            id, member_id, student_name, first_name, second_name, last_name, 
            student_class, phone_number, email, telegram_username, telegram_user_id, 
            telegram_activated, role, status, is_approved, password_hash, award, 
            created_at, updated_at, data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          ON CONFLICT (id) DO UPDATE SET 
            student_name = EXCLUDED.student_name,
            role = EXCLUDED.role,
            status = EXCLUDED.status,
            is_approved = EXCLUDED.is_approved,
            telegram_activated = EXCLUDED.telegram_activated,
            telegram_user_id = EXCLUDED.telegram_user_id,
            telegram_username = EXCLUDED.telegram_username,
            password_hash = COALESCE(EXCLUDED.password_hash, arx_members.password_hash),
            updated_at = NOW(),
            data = EXCLUDED.data`,
          [
            m.id,
            m.memberId,
            m.studentName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Club Member',
            m.firstName || null,
            m.secondName || null,
            m.lastName || null,
            m.class || 'N/A',
            m.phoneNumber || null,
            m.email || null,
            m.telegramUsername || null,
            m.telegramUserId || null,
            Boolean(m.telegramActivated),
            m.role || 'member',
            m.status || 'pending',
            Boolean(m.isApproved),
            m.passwordHash || null,
            m.award || null,
            m.createdAt ? new Date(m.createdAt) : new Date(),
            m.updatedAt ? new Date(m.updatedAt) : new Date(),
            JSON.stringify(m)
          ]
        );
      }
    }

    // 3. Courses sync
    if (Array.isArray(data.courses)) {
      for (const c of data.courses) {
        if (!c || !c.id) continue;
        await pool.query(
          `INSERT INTO arx_courses (id, title, category, description, duration, prerequisites, status, is_published, data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             title = EXCLUDED.title,
             category = EXCLUDED.category,
             description = EXCLUDED.description,
             status = EXCLUDED.status,
             is_published = EXCLUDED.is_published,
             data = EXCLUDED.data,
             updated_at = NOW()`,
          [
            c.id,
            c.title || 'Course',
            c.category || 'Technology',
            c.description || '',
            c.duration || '6 Weeks',
            c.prerequisites || '',
            c.status || 'Available',
            c.isPublished !== false,
            JSON.stringify(c)
          ]
        );
      }
    }

    // 4. Attendance sessions & records
    if (Array.isArray(data.attendanceSessions)) {
      for (const s of data.attendanceSessions) {
        if (!s || !s.id) continue;
        await pool.query(
          `INSERT INTO arx_attendance_sessions (
            id, course_id, course_title, title, date, 
            ethiopian_open_time, ethiopian_present_cutoff, ethiopian_late_cutoff,
            international_open_time, international_present_cutoff, international_late_cutoff,
            status, created_by, created_at, data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            finalized_by = EXCLUDED.finalized_by,
            finalized_at = EXCLUDED.finalized_at,
            data = EXCLUDED.data,
            updated_at = NOW()`,
          [
            s.id,
            s.courseId || null,
            s.courseTitle || null,
            s.title || 'Attendance Session',
            s.date || new Date().toISOString().slice(0, 10),
            s.ethiopianOpenTime || '7:00',
            s.ethiopianPresentCutoff || '7:30',
            s.ethiopianLateCutoff || '7:40',
            s.internationalOpenTime || '13:00',
            s.internationalPresentCutoff || '13:30',
            s.internationalLateCutoff || '13:40',
            s.status || 'published',
            s.createdBy || 'Admin',
            s.createdAt ? new Date(s.createdAt) : new Date(),
            JSON.stringify(s)
          ]
        );
      }
    }

    // 5. Bot commands
    if (Array.isArray(data.botCommands)) {
      for (const cmd of data.botCommands) {
        if (!cmd || !cmd.command) continue;
        await pool.query(
          `INSERT INTO arx_bot_commands (command, description, category, is_enabled, custom_reply, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (command) DO UPDATE SET
             description = EXCLUDED.description,
             is_enabled = EXCLUDED.is_enabled,
             custom_reply = EXCLUDED.custom_reply,
             updated_at = NOW()`,
          [
            cmd.command,
            cmd.description || '',
            cmd.category || 'General',
            cmd.isEnabled !== false,
            cmd.customReply || null
          ]
        );
      }
    }

    return true;
  } catch (err) {
    console.warn('[Neon PostgreSQL Sync Warning]:', err.message);
    return false;
  }
}

export async function fetchStateFromNeon() {
  if (!pool) return null;
  try {
    const settingsRes = await pool.query(`SELECT value FROM arx_settings WHERE key = 'global_settings' LIMIT 1`);
    const membersRes = await pool.query(`SELECT data FROM arx_members`);
    const coursesRes = await pool.query(`SELECT data FROM arx_courses`);
    const sessionsRes = await pool.query(`SELECT data FROM arx_attendance_sessions`);
    const certsRes = await pool.query(`SELECT data FROM arx_certificates`);

    if (membersRes.rows.length === 0 && !settingsRes.rows[0]) {
      // Empty database
      return null;
    }

    const state = {
      settings: settingsRes.rows[0]?.value || undefined,
      members: membersRes.rows.map(r => r.data),
      courses: coursesRes.rows.map(r => r.data),
      attendanceSessions: sessionsRes.rows.map(r => r.data),
      certificates: certsRes.rows.map(r => r.data)
    };
    return state;
  } catch (err) {
    console.warn('[Neon PostgreSQL Fetch Warning]:', err.message);
    return null;
  }
}
