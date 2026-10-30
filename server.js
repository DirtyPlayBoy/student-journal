// Локальный журнал: node server.js
// База: data/journal.db
// С телефона откройте ссылку, которую сервер напечатает в консоли.

import { createServer } from 'node:http';
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import Database from 'better-sqlite3';
import XLSX from 'xlsx';
import {
  DEFAULT_SHEET_URLS,
  importFromUrls,
  weekTypeForDate,
  weekdayOfDate,
  normalizeGroupCode,
  displayGroupName,
  normalizeSubjectKey,
  normalizeSheetUrl,
  makeSlotKey,
  rowToScheduleEntry,
  diffSchedule,
  summarizeScheduleCodes,
  pickUrlForGroupCode,
  SCHEDULE_FIELDS,
  fieldDiff,
  ensureUniversalScheduleSchema,
  migrateLegacyWeekTypes,
  backupDatabase,
  emptyParserConfig,
  DEFAULT_SEPARATOR_RULES,
  assertSafeExternalUrl,
} from './lib/schedule.js';
import * as schedulePlans from './lib/schedule/plans-service.js';
import {
  ROLE_KEYS,
  PERMISSION_KEYS,
  catalog as permissionsCatalog,
  defaultPermissionsForRole,
  isRole,
  normalizePermissionList,
  permissionsEqual,
  roleLabel,
} from './lib/permissions.js';
import {
  smtpConfigured,
  sendMail,
  accessCredentialsEmail,
} from './lib/mail.js';
import {
  normalizeTeacherName,
  teacherNamesMatch,
  teacherCellMatches,
  cleanTeacherCell,
  cleanTeacherName,
  splitTeacherAndRoom,
  shortNameFromFull,
  suggestUsernameFromName,
  stripTeacherPrefix,
} from './lib/teachers.js';
import {
  createTelegramBot,
  normalizeTelegramSettings,
} from './lib/telegram-bot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, 'public');
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(dataDir, 'uploads');
const PORT = Number(process.env.PORT) || 8787;
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const IS_PROD = process.env.NODE_ENV === 'production' || PORT === 80;
const MAX_BODY = 3_500_000;
const MAX_PHOTO_BYTES = 2_000_000;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 30;
const loginAttempts = new Map();

mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'journal.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 4000');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    must_change INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    UNIQUE (name, group_id)
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    lesson_date TEXT NOT NULL,
    topic TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS attendance (
    lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    comment TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (lesson_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    credit_date TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('credit', 'exam')),
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS credit_results (
    credit_id INTEGER NOT NULL REFERENCES credits(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (result IN ('pass', 'fail', '2', '3', '4', '5')),
    PRIMARY KEY (credit_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS works (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    work_date TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS grades (
    work_id INTEGER NOT NULL REFERENCES works(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value BETWEEN 2 AND 5),
    PRIMARY KEY (work_id, student_id)
  );

  CREATE INDEX IF NOT EXISTS idx_students_group ON students(group_id);
  CREATE INDEX IF NOT EXISTS idx_subjects_group ON subjects(group_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_subject ON lessons(subject_id);
  CREATE INDEX IF NOT EXISTS idx_credits_subject ON credits(subject_id);
  CREATE INDEX IF NOT EXISTS idx_works_subject ON works(subject_id);

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS schedule_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_code TEXT NOT NULL,
    group_id INTEGER,
    week_type TEXT NOT NULL,
    weekday INTEGER NOT NULL,
    pair_num INTEGER NOT NULL,
    time_start TEXT NOT NULL DEFAULT '',
    time_end TEXT NOT NULL DEFAULT '',
    subject_name TEXT NOT NULL,
    lesson_kind TEXT NOT NULL DEFAULT '',
    teacher TEXT NOT NULL DEFAULT '',
    room TEXT NOT NULL DEFAULT '',
    raw_text TEXT NOT NULL DEFAULT '',
    source_sheet TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_schedule_group ON schedule_entries(group_code, week_type, weekday);
`);

function ensureColumn(table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

ensureColumn('groups', 'schedule_code', 'schedule_code TEXT');
ensureColumn('groups', 'schedule_url', "schedule_url TEXT NOT NULL DEFAULT ''");
ensureColumn('groups', 'schedule_aliases', "schedule_aliases TEXT NOT NULL DEFAULT '[]'");
ensureColumn('groups', 'schedule_synced_at', 'schedule_synced_at INTEGER');
ensureColumn('groups', 'schedule_sync_error', "schedule_sync_error TEXT NOT NULL DEFAULT ''");
ensureColumn('lessons', 'pair_num', 'pair_num INTEGER');
ensureColumn('lessons', 'time_start', "time_start TEXT NOT NULL DEFAULT ''");
ensureColumn('lessons', 'time_end', "time_end TEXT NOT NULL DEFAULT ''");
ensureColumn('lessons', 'teacher', "teacher TEXT NOT NULL DEFAULT ''");
ensureColumn('lessons', 'room', "room TEXT NOT NULL DEFAULT ''");
ensureColumn('lessons', 'week_type', "week_type TEXT NOT NULL DEFAULT ''");
ensureColumn('lessons', 'schedule_entry_id', 'schedule_entry_id INTEGER');
ensureColumn('attendance', 'comment', "comment TEXT NOT NULL DEFAULT ''");
ensureColumn('subjects', 'norm_key', "norm_key TEXT NOT NULL DEFAULT ''");
ensureColumn('sessions', 'user_id', 'user_id INTEGER');
ensureColumn('schedule_entries', 'slot_key', "slot_key TEXT NOT NULL DEFAULT ''");
ensureColumn('schedule_entries', 'locked', 'locked INTEGER NOT NULL DEFAULT 0');
ensureColumn('schedule_entries', 'updated_at', 'updated_at INTEGER');

(() => {
  const rows = db.prepare(`
    SELECT id, group_id, week_type, weekday, pair_num, slot_key FROM schedule_entries
  `).all();
  const update = db.prepare('UPDATE schedule_entries SET slot_key = ? WHERE id = ?');
  for (const row of rows) {
    if (!row.group_id) continue;
    const key = makeSlotKey(row.group_id, row.week_type, row.weekday, row.pair_num);
    if (row.slot_key !== key) update.run(key, row.id);
  }
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_slot
      ON schedule_entries(group_id, week_type, weekday, pair_num)
      WHERE group_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_schedule_slot_key ON schedule_entries(slot_key);
  `);
})();

(() => {
  try {
    backupDatabase(path.join(dataDir, 'journal.db'), path.join(dataDir, 'backups'));
  } catch { /* ignore backup errors on first boot */ }
  ensureUniversalScheduleSchema(db);
  migrateLegacyWeekTypes(db);
})();

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    email TEXT NOT NULL DEFAULT '',
    display_name TEXT NOT NULL DEFAULT '',
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'elder', 'student')),
    active INTEGER NOT NULL DEFAULT 1,
    must_change INTEGER NOT NULL DEFAULT 1,
    permissions_custom INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_groups (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    group_role TEXT NOT NULL DEFAULT 'member' CHECK (group_role IN ('member', 'teacher', 'elder', 'student')),
    PRIMARY KEY (user_id, group_id)
  );
  CREATE INDEX IF NOT EXISTS idx_user_groups_group ON user_groups(group_id);
  CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_key TEXT NOT NULL,
    PRIMARY KEY (user_id, permission_key)
  );
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at INTEGER NOT NULL,
    user_id INTEGER,
    username TEXT NOT NULL DEFAULT '',
    display_name TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    action TEXT NOT NULL,
    entity TEXT NOT NULL DEFAULT '',
    entity_id INTEGER,
    group_id INTEGER,
    summary TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '',
    ip TEXT NOT NULL DEFAULT ''
  );
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
  CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
`);

(() => {
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get()?.sql || '';
  if (!sql) return;
  const needsRole = !sql.includes("'elder'") || !sql.includes("'student'");
  const cols = new Set(db.prepare('PRAGMA table_info(users)').all().map((row) => row.name));
  const needsCols = !cols.has('email') || !cols.has('display_name') || !cols.has('permissions_custom');
  if (!needsRole && !needsCols) return;
  const emailExpr = cols.has('email') ? "COALESCE(email, '')" : "''";
  const nameExpr = cols.has('display_name') ? "COALESCE(display_name, '')" : "''";
  const customExpr = cols.has('permissions_custom') ? 'COALESCE(permissions_custom, 0)' : '0';
  db.exec(`
    CREATE TABLE users__rbac (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      email TEXT NOT NULL DEFAULT '',
      display_name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'elder', 'student')),
      active INTEGER NOT NULL DEFAULT 1,
      must_change INTEGER NOT NULL DEFAULT 1,
      permissions_custom INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    INSERT INTO users__rbac (
      id, username, email, display_name, password_hash, salt, role, active, must_change, permissions_custom, created_at
    )
    SELECT
      id,
      username,
      ${emailExpr},
      ${nameExpr},
      password_hash,
      salt,
      CASE WHEN role IN ('admin', 'teacher', 'elder', 'student') THEN role ELSE 'teacher' END,
      active,
      must_change,
      ${customExpr},
      created_at
    FROM users;
    DROP TABLE users;
    ALTER TABLE users__rbac RENAME TO users;
  `);
})();

(() => {
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_groups'").get()?.sql || '';
  if (sql.includes('group_role')) return;
  db.exec(`
    CREATE TABLE user_groups__rbac (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      group_role TEXT NOT NULL DEFAULT 'member' CHECK (group_role IN ('member', 'teacher', 'elder', 'student')),
      PRIMARY KEY (user_id, group_id)
    );
    INSERT INTO user_groups__rbac (user_id, group_id, group_role)
      SELECT user_id, group_id, 'member' FROM user_groups;
    DROP TABLE user_groups;
    ALTER TABLE user_groups__rbac RENAME TO user_groups;
    CREATE INDEX IF NOT EXISTS idx_user_groups_group ON user_groups(group_id);
  `);
})();

(() => {
  const sql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='user_groups'").get()?.sql || '';
  if (!sql || sql.includes("'student'")) return;
  db.exec(`
    CREATE TABLE user_groups__student (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      group_role TEXT NOT NULL DEFAULT 'member' CHECK (group_role IN ('member', 'teacher', 'elder', 'student')),
      PRIMARY KEY (user_id, group_id)
    );
    INSERT INTO user_groups__student (user_id, group_id, group_role)
      SELECT user_id, group_id, group_role FROM user_groups;
    DROP TABLE user_groups;
    ALTER TABLE user_groups__student RENAME TO user_groups;
    CREATE INDEX IF NOT EXISTS idx_user_groups_group ON user_groups(group_id);
  `);
})();

ensureColumn('groups', 'elder_user_id', 'elder_user_id INTEGER');
ensureColumn('students', 'photo_path', "photo_path TEXT NOT NULL DEFAULT ''");
ensureColumn('students', 'email', "email TEXT NOT NULL DEFAULT ''");
ensureColumn('students', 'user_id', 'user_id INTEGER');
ensureColumn('users', 'student_id', 'student_id INTEGER');
ensureColumn('users', 'teacher_id', 'teacher_id INTEGER');

db.exec(`
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    short_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    photo_path TEXT NOT NULL DEFAULT '',
    user_id INTEGER,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(full_name COLLATE NOCASE);
  CREATE TABLE IF NOT EXISTS student_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    author_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_student_notes_student ON student_notes(student_id, created_at DESC);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_students_user ON students(user_id) WHERE user_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_student ON users(student_id) WHERE student_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_users_teacher ON users(teacher_id) WHERE teacher_id IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_user ON teachers(user_id) WHERE user_id IS NOT NULL;
  CREATE TABLE IF NOT EXISTS teacher_groups (
    teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    PRIMARY KEY (teacher_id, group_id)
  );
  CREATE INDEX IF NOT EXISTS idx_teacher_groups_group ON teacher_groups(group_id);
`);

for (const sub of ['students', 'teachers']) {
  const dir = path.join(uploadsDir, sub);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

(() => {
  const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='attendance'").get();
  const sql = row?.sql || '';
  if (sql.includes("'excused'")) return;
  db.exec(`
    CREATE TABLE attendance__new (
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
      comment TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (lesson_id, student_id)
    );
    INSERT INTO attendance__new (lesson_id, student_id, status, comment)
      SELECT lesson_id, student_id, status, IFNULL(comment, '') FROM attendance;
    DROP TABLE attendance;
    ALTER TABLE attendance__new RENAME TO attendance;
  `);
})();

const ATTENDANCE_STATUSES = ['present', 'late', 'absent', 'excused'];

function normalizeComment(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, 240);
}

function markPayload(status, comment = '') {
  return { status, comment: comment || '' };
}

const INSTITUTION_KINDS = new Set(['college', 'university', 'school']);

const SETTINGS_DEFAULTS = {
  institutionName: 'Электронный журнал',
  institutionSubtitle: 'Посещаемость · расписание · оценки',
  institutionKind: 'college',
  excelEnabled: '1',
  scheduleAutoSync: '1',
  scheduleAutoSyncMinutes: '5',
  attendanceExcellent: '90',
  attendanceGood: '75',
  attendanceWarn: '60',
  scheduleUrls: JSON.stringify(DEFAULT_SHEET_URLS),
  gradesEnabled: '1',
  smtpEnabled: '0',
  smtpHost: '',
  smtpPort: '587',
  smtpSecure: '0',
  smtpUser: '',
  smtpPass: '',
  smtpFrom: '',
  smtpFromName: '',
  telegramEnabled: '0',
  telegramBotToken: '',
  telegramChatId: '',
  telegramAdminIds: '',
  telegramMultiMode: '0',
  telegramBindings: '[]',
  telegramSchedulePosts: '[]',
};

/** Последний прогон фоновой сверки с Excel */
let scheduleSyncState = {
  running: false,
  lastStartedAt: null,
  lastFinishedAt: null,
  lastError: '',
  lastResult: null,
};

/** Telegram-бот (инициализируется после helper-функций журнала) */
let telegramBot = null;

function parseBoolSetting(value, fallback = true) {
  if (value == null) return fallback;
  const text = String(value).trim().toLowerCase();
  if (['0', 'false', 'off', 'no', 'нет'].includes(text)) return false;
  if (['1', 'true', 'on', 'yes', 'да'].includes(text)) return true;
  return fallback;
}

function getSettings() {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const map = { ...SETTINGS_DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  let scheduleUrls = DEFAULT_SHEET_URLS;
  try {
    const parsed = JSON.parse(map.scheduleUrls || SETTINGS_DEFAULTS.scheduleUrls);
    if (Array.isArray(parsed)) scheduleUrls = parsed.map(String);
  } catch { /* defaults */ }
  const kind = INSTITUTION_KINDS.has(map.institutionKind) ? map.institutionKind : 'college';
  const autoMinutes = Math.min(120, Math.max(1, Number(map.scheduleAutoSyncMinutes) || 5));
  const smtpPort = Math.min(65535, Math.max(1, Number(map.smtpPort) || 587));
  return {
    institutionName: String(map.institutionName || SETTINGS_DEFAULTS.institutionName).slice(0, 120),
    institutionSubtitle: String(map.institutionSubtitle || '').slice(0, 160),
    institutionKind: kind,
    excelEnabled: parseBoolSetting(map.excelEnabled, true),
    gradesEnabled: parseBoolSetting(map.gradesEnabled, true),
    scheduleAutoSync: parseBoolSetting(map.scheduleAutoSync, true),
    scheduleAutoSyncMinutes: autoMinutes,
    attendanceExcellent: Math.min(100, Math.max(50, Number(map.attendanceExcellent) || 90)),
    attendanceGood: Math.min(100, Math.max(40, Number(map.attendanceGood) || 75)),
    attendanceWarn: Math.min(100, Math.max(20, Number(map.attendanceWarn) || 60)),
    scheduleUrls,
    smtpEnabled: parseBoolSetting(map.smtpEnabled, false),
    smtpHost: String(map.smtpHost || '').trim().slice(0, 200),
    smtpPort,
    smtpSecure: parseBoolSetting(map.smtpSecure, smtpPort === 465),
    smtpUser: String(map.smtpUser || '').trim().slice(0, 160),
    smtpPass: String(map.smtpPass || ''),
    smtpFrom: String(map.smtpFrom || '').trim().slice(0, 160),
    smtpFromName: String(map.smtpFromName || '').trim().slice(0, 120),
    ...normalizeTelegramSettings(map),
  };
}

function publicSettings(settings = getSettings()) {
  const { smtpPass, telegramBotToken, ...rest } = settings;
  return {
    ...rest,
    smtpPassSet: Boolean(smtpPass),
    smtpPass: '',
    smtpConfigured: smtpConfigured(settings),
    telegramBotTokenSet: Boolean(telegramBotToken),
    telegramBotToken: '',
    telegramStatus: telegramBot?.getStatus?.() || null,
  };
}

function setSettings(patch) {
  const current = getSettings();
  const excelEnabled = patch.excelEnabled != null
    ? parseBoolSetting(patch.excelEnabled, current.excelEnabled)
    : current.excelEnabled;
  const gradesEnabled = patch.gradesEnabled != null
    ? parseBoolSetting(patch.gradesEnabled, current.gradesEnabled)
    : current.gradesEnabled;
  const scheduleAutoSync = patch.scheduleAutoSync != null
    ? parseBoolSetting(patch.scheduleAutoSync, current.scheduleAutoSync)
    : current.scheduleAutoSync;
  let scheduleAutoSyncMinutes = current.scheduleAutoSyncMinutes;
  if (patch.scheduleAutoSyncMinutes != null) {
    scheduleAutoSyncMinutes = Math.min(120, Math.max(1, Number(patch.scheduleAutoSyncMinutes) || 5));
  }
  let scheduleUrls = current.scheduleUrls;
  if (patch.scheduleUrls != null) {
    const list = (Array.isArray(patch.scheduleUrls) ? patch.scheduleUrls : String(patch.scheduleUrls).split(/\n+/))
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    scheduleUrls = list.length ? assertSafeScheduleUrls(list) : [];
  }
  const kindRaw = patch.institutionKind != null ? String(patch.institutionKind) : current.institutionKind;
  const institutionKind = INSTITUTION_KINDS.has(kindRaw) ? kindRaw : current.institutionKind;
  const smtpEnabled = patch.smtpEnabled != null
    ? parseBoolSetting(patch.smtpEnabled, current.smtpEnabled)
    : current.smtpEnabled;
  let smtpPort = current.smtpPort;
  if (patch.smtpPort != null) smtpPort = Math.min(65535, Math.max(1, Number(patch.smtpPort) || 587));
  const smtpSecure = patch.smtpSecure != null
    ? parseBoolSetting(patch.smtpSecure, smtpPort === 465)
    : current.smtpSecure;
  let smtpPass = current.smtpPass;
  if (patch.smtpPass != null && String(patch.smtpPass).length) {
    smtpPass = String(patch.smtpPass).slice(0, 200);
  }
  const telegramEnabled = patch.telegramEnabled != null
    ? parseBoolSetting(patch.telegramEnabled, current.telegramEnabled)
    : current.telegramEnabled;
  const telegramMultiMode = patch.telegramMultiMode != null
    ? parseBoolSetting(patch.telegramMultiMode, current.telegramMultiMode)
    : current.telegramMultiMode;
  let telegramBotToken = current.telegramBotToken;
  if (patch.telegramBotToken != null && String(patch.telegramBotToken).trim().length) {
    telegramBotToken = String(patch.telegramBotToken).trim().slice(0, 200);
  }
  let telegramBindings = current.telegramBindings;
  if (patch.telegramBindings != null) {
    const list = Array.isArray(patch.telegramBindings)
      ? patch.telegramBindings
      : (() => { try { return JSON.parse(patch.telegramBindings || '[]'); } catch { return []; } })();
    telegramBindings = (Array.isArray(list) ? list : []).map((row) => ({
      groupId: Number(row.groupId) || 0,
      chatId: String(row.chatId || '').trim().slice(0, 40),
      topicId: row.topicId != null && String(row.topicId).trim() !== ''
        ? Number(row.topicId)
        : null,
    })).filter((row) => row.groupId > 0);
  }
  let telegramSchedulePosts = current.telegramSchedulePosts;
  if (patch.telegramSchedulePosts != null) {
    const list = Array.isArray(patch.telegramSchedulePosts)
      ? patch.telegramSchedulePosts
      : (() => { try { return JSON.parse(patch.telegramSchedulePosts || '[]'); } catch { return []; } })();
    telegramSchedulePosts = (Array.isArray(list) ? list : []).map((row) => ({
      groupId: Number(row.groupId) || 0,
      chatId: String(row.chatId || '').trim().slice(0, 40),
      topicId: row.topicId != null && String(row.topicId).trim() !== ''
        ? Number(row.topicId)
        : null,
      mode: ['off', 'daily', 'weekdays', 'weekly'].includes(row.mode) ? row.mode : 'off',
      time: /^\d{2}:\d{2}$/.test(String(row.time || '')) ? String(row.time) : '08:00',
      weekday: Math.min(7, Math.max(1, Number(row.weekday) || 1)),
      lastPostedKey: String(row.lastPostedKey || '').slice(0, 40),
    })).filter((row) => row.groupId > 0);
  }
  const next = {
    institutionName: patch.institutionName != null
      ? cleanText(patch.institutionName, 'название заведения', 120)
      : current.institutionName,
    institutionSubtitle: patch.institutionSubtitle != null
      ? String(patch.institutionSubtitle ?? '').trim().replace(/\s+/g, ' ').slice(0, 160)
      : current.institutionSubtitle,
    institutionKind,
    excelEnabled,
    gradesEnabled,
    scheduleAutoSync,
    scheduleAutoSyncMinutes,
    attendanceExcellent: patch.attendanceExcellent != null
      ? Number(patch.attendanceExcellent)
      : current.attendanceExcellent,
    attendanceGood: patch.attendanceGood != null
      ? Number(patch.attendanceGood)
      : current.attendanceGood,
    attendanceWarn: patch.attendanceWarn != null
      ? Number(patch.attendanceWarn)
      : current.attendanceWarn,
    scheduleUrls,
    smtpEnabled,
    smtpHost: patch.smtpHost != null ? String(patch.smtpHost ?? '').trim().slice(0, 200) : current.smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser: patch.smtpUser != null ? String(patch.smtpUser ?? '').trim().slice(0, 160) : current.smtpUser,
    smtpPass,
    smtpFrom: patch.smtpFrom != null ? String(patch.smtpFrom ?? '').trim().slice(0, 160) : current.smtpFrom,
    smtpFromName: patch.smtpFromName != null
      ? String(patch.smtpFromName ?? '').trim().slice(0, 120)
      : current.smtpFromName,
    telegramEnabled,
    telegramBotToken,
    telegramChatId: patch.telegramChatId != null
      ? String(patch.telegramChatId ?? '').trim().slice(0, 40)
      : current.telegramChatId,
    telegramAdminIds: patch.telegramAdminIds != null
      ? String(patch.telegramAdminIds ?? '').trim().replace(/\s+/g, ' ').slice(0, 400)
      : current.telegramAdminIds,
    telegramMultiMode,
    telegramBindings,
    telegramSchedulePosts,
  };
  for (const key of ['attendanceExcellent', 'attendanceGood', 'attendanceWarn']) {
    if (!Number.isFinite(next[key]) || next[key] < 0 || next[key] > 100) fail(400, 'Пороги посещаемости — числа от 0 до 100');
  }
  if (!(next.attendanceExcellent >= next.attendanceGood && next.attendanceGood >= next.attendanceWarn)) {
    fail(400, 'Пороги: отлично ≥ хорошо ≥ внимание');
  }
  if (next.smtpFrom && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(next.smtpFrom)) fail(400, 'Некорректный email отправителя');
  if (next.telegramBotToken && !/^\d+:[A-Za-z0-9_-]+$/.test(next.telegramBotToken)) {
    fail(400, 'Некорректный токен Telegram-бота');
  }
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);
  const tx = db.transaction(() => {
    upsert.run('institutionName', next.institutionName);
    upsert.run('institutionSubtitle', next.institutionSubtitle);
    upsert.run('institutionKind', next.institutionKind);
    upsert.run('excelEnabled', next.excelEnabled ? '1' : '0');
    upsert.run('gradesEnabled', next.gradesEnabled ? '1' : '0');
    upsert.run('scheduleAutoSync', next.scheduleAutoSync ? '1' : '0');
    upsert.run('scheduleAutoSyncMinutes', String(next.scheduleAutoSyncMinutes));
    upsert.run('attendanceExcellent', String(next.attendanceExcellent));
    upsert.run('attendanceGood', String(next.attendanceGood));
    upsert.run('attendanceWarn', String(next.attendanceWarn));
    upsert.run('scheduleUrls', JSON.stringify(next.scheduleUrls));
    upsert.run('smtpEnabled', next.smtpEnabled ? '1' : '0');
    upsert.run('smtpHost', next.smtpHost);
    upsert.run('smtpPort', String(next.smtpPort));
    upsert.run('smtpSecure', next.smtpSecure ? '1' : '0');
    upsert.run('smtpUser', next.smtpUser);
    upsert.run('smtpPass', next.smtpPass);
    upsert.run('smtpFrom', next.smtpFrom);
    upsert.run('smtpFromName', next.smtpFromName);
    upsert.run('telegramEnabled', next.telegramEnabled ? '1' : '0');
    upsert.run('telegramBotToken', next.telegramBotToken);
    upsert.run('telegramChatId', next.telegramChatId);
    upsert.run('telegramAdminIds', next.telegramAdminIds);
    upsert.run('telegramMultiMode', next.telegramMultiMode ? '1' : '0');
    upsert.run('telegramBindings', JSON.stringify(next.telegramBindings));
    upsert.run('telegramSchedulePosts', JSON.stringify(next.telegramSchedulePosts));
  });
  const telegramConnChanged = (
    current.telegramEnabled !== next.telegramEnabled
    || current.telegramBotToken !== next.telegramBotToken
    || current.telegramChatId !== next.telegramChatId
    || current.telegramAdminIds !== next.telegramAdminIds
    || current.telegramMultiMode !== next.telegramMultiMode
    || JSON.stringify(current.telegramBindings) !== JSON.stringify(next.telegramBindings)
  );
  tx();
  restartScheduleAutoSyncTimer();
  if (telegramConnChanged) queueTelegramBotRestart();
  return getSettings();
}

function assertGradesEnabled() {
  if (!getSettings().gradesEnabled) fail(403, 'Оценки отключены в настройках');
}

function simpleTempPassword() {
  const n = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return String(n).padStart(6, '0');
}

function photoUrl(photoPath) {
  if (!photoPath) return '';
  return `/uploads/${String(photoPath).replace(/^\/+/, '')}`;
}

function mapStudentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name || row.fullName,
    groupId: row.group_id ?? row.groupId,
    groupName: row.groupName || row.group_name || '',
    email: row.email || '',
    photoUrl: photoUrl(row.photo_path || row.photoPath || ''),
    userId: row.user_id ?? row.userId ?? null,
    hasAccess: Boolean(row.user_id ?? row.userId),
  };
}

function mapTeacherRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name || row.fullName,
    shortName: row.short_name || row.shortName || '',
    email: row.email || '',
    photoUrl: photoUrl(row.photo_path || row.photoPath || ''),
    userId: row.user_id ?? row.userId ?? null,
    hasAccess: Boolean(row.user_id ?? row.userId),
    createdAt: row.created_at || row.createdAt || null,
  };
}

async function savePhotoFromBody(kind, id, body) {
  const dataUrl = String(body.photo || body.data || body.image || '').trim();
  if (!dataUrl) fail(400, 'Нет файла фото');
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-zA-Z0-9+/=\s]+)$/i);
  if (!match) fail(400, 'Фото: только JPEG, PNG или WebP (data URL)');
  const mime = match[1].toLowerCase().replace('image/jpg', 'image/jpeg');
  const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
  if (!buffer.length) fail(400, 'Пустой файл');
  if (buffer.length > MAX_PHOTO_BYTES) fail(400, 'Фото больше 2 МБ');
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const rel = `${kind}/${id}.${ext}`;
  const full = path.join(uploadsDir, rel);
  await mkdir(path.dirname(full), { recursive: true });
  for (const oldExt of ['jpg', 'jpeg', 'png', 'webp']) {
    const old = path.join(uploadsDir, kind, `${id}.${oldExt}`);
    if (old !== full && existsSync(old)) {
      try { await unlink(old); } catch { /* ignore */ }
    }
  }
  await writeFile(full, buffer);
  return rel.replace(/\\/g, '/');
}

function findUserByLogin(identifier) {
  const raw = String(identifier ?? '').trim();
  if (!raw) return null;
  const byUser = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(raw);
  if (byUser) return byUser;
  const email = raw.toLowerCase();
  if (!email.includes('@')) return null;
  return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE AND email != \'\'').get(email);
}

function uniqueUsername(base) {
  let candidate = String(base || 'user').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 60) || 'user';
  if (candidate.length < 3) candidate = `${candidate}123`.slice(0, 80);
  let n = 0;
  while (db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(candidate)) {
    n += 1;
    candidate = `${String(base || 'user').toLowerCase().replace(/[^a-z0-9._-]/g, '').slice(0, 50)}${n}`;
  }
  return candidate;
}

function appUrlFromReq(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || `localhost:${listenPort}`).split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  return `${proto}://${host}`;
}

async function grantEntityAccess({
  role, entityId, username, email, displayName, groupId, req, actor,
}) {
  const settings = getSettings();
  const cleanMail = email ? cleanEmail(email) : '';
  let login = String(username || '').trim().toLowerCase();
  if (login) {
    if (!/^[a-z0-9._-]{3,80}$/i.test(login)) fail(400, 'Логин: латиница, цифры, ._- (от 3 символов)');
  } else if (cleanMail) {
    login = uniqueUsername(cleanMail.split('@')[0]);
  } else {
    fail(400, 'Укажите логин или email');
  }
  const tempPassword = simpleTempPassword();
  const { salt, hash } = hashPassword(tempPassword);
  let userId;
  const existingByLogin = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(login);
  const existingByEmail = cleanMail
    ? db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE AND email != \'\'').get(cleanMail)
    : null;

  const tx = db.transaction(() => {
    if (role === 'student') {
      const student = db.prepare('SELECT * FROM students WHERE id = ?').get(entityId);
      if (!student) fail(404, 'Ученик не найден');
      if (student.user_id) {
        const linked = getUserById(student.user_id);
        if (linked && linked.id !== existingByLogin?.id && linked.id !== existingByEmail?.id) {
          db.prepare(`
            UPDATE users SET password_hash = ?, salt = ?, must_change = 1, active = 1,
              email = CASE WHEN ? != '' THEN ? ELSE email END,
              display_name = COALESCE(NULLIF(?, ''), display_name)
            WHERE id = ?
          `).run(hash, salt, cleanMail, cleanMail, displayName || student.full_name, linked.id);
          if (cleanMail) db.prepare('UPDATE students SET email = ? WHERE id = ?').run(cleanMail, entityId);
          userId = linked.id;
          return;
        }
      }
    }
    if (role === 'teacher') {
      const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(entityId);
      if (!teacher) fail(404, 'Педагог не найден');
      if (teacher.user_id) {
        const linked = getUserById(teacher.user_id);
        if (linked) {
          db.prepare(`
            UPDATE users SET password_hash = ?, salt = ?, must_change = 1, active = 1,
              email = CASE WHEN ? != '' THEN ? ELSE email END,
              display_name = COALESCE(NULLIF(?, ''), display_name)
            WHERE id = ?
          `).run(hash, salt, cleanMail, cleanMail, displayName || teacher.full_name, linked.id);
          if (cleanMail) db.prepare('UPDATE teachers SET email = ? WHERE id = ?').run(cleanMail, entityId);
          userId = linked.id;
          syncTeacherGroupsFromSchedule(teacher, { onlyIfEmpty: true });
          const assigned = listTeacherAssignedGroups(entityId);
          if (assigned.length) {
            replaceUserGroups(userId, assigned.map((item) => ({ groupId: item.groupId, groupRole: 'teacher' })));
          }
          return;
        }
      }
    }

    const clash = existingByLogin || existingByEmail;
    if (clash && clash.role !== role) fail(400, 'Этот логин/email уже занят другой ролью');
    if (clash) {
      db.prepare(`
        UPDATE users SET password_hash = ?, salt = ?, must_change = 1, active = 1, role = ?,
          email = CASE WHEN ? != '' THEN ? ELSE email END,
          display_name = COALESCE(NULLIF(?, ''), display_name),
          student_id = CASE WHEN ? = 'student' THEN ? ELSE student_id END,
          teacher_id = CASE WHEN ? = 'teacher' THEN ? ELSE teacher_id END
        WHERE id = ?
      `).run(
        hash, salt, role, cleanMail, cleanMail, displayName || '',
        role, role === 'student' ? entityId : null,
        role, role === 'teacher' ? entityId : null,
        clash.id,
      );
      userId = clash.id;
    } else {
      const info = db.prepare(`
        INSERT INTO users (
          username, email, display_name, password_hash, salt, role, active, must_change, permissions_custom, created_at,
          student_id, teacher_id
        ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0, ?, ?, ?)
      `).run(
        login,
        cleanMail,
        displayName || '',
        hash,
        salt,
        role,
        Date.now(),
        role === 'student' ? entityId : null,
        role === 'teacher' ? entityId : null,
      );
      userId = Number(info.lastInsertRowid);
    }

    if (role === 'student') {
      db.prepare('UPDATE students SET user_id = ?, email = CASE WHEN ? != \'\' THEN ? ELSE email END WHERE id = ?')
        .run(userId, cleanMail, cleanMail, entityId);
      db.prepare('UPDATE users SET student_id = ? WHERE id = ?').run(entityId, userId);
      if (groupId) replaceUserGroups(userId, [{ groupId, groupRole: 'student' }]);
    }
    if (role === 'teacher') {
      db.prepare('UPDATE teachers SET user_id = ?, email = CASE WHEN ? != \'\' THEN ? ELSE email END WHERE id = ?')
        .run(userId, cleanMail, cleanMail, entityId);
      db.prepare('UPDATE users SET teacher_id = ? WHERE id = ?').run(entityId, userId);
      const teacherRow = db.prepare('SELECT * FROM teachers WHERE id = ?').get(entityId);
      syncTeacherGroupsFromSchedule(teacherRow, { onlyIfEmpty: true });
      const assigned = listTeacherAssignedGroups(entityId);
      if (assigned.length) {
        replaceUserGroups(userId, assigned.map((item) => ({ groupId: item.groupId, groupRole: 'teacher' })));
      } else {
        const fromSchedule = listTeacherScheduleGroups(teacherRow)
          .map((item) => item.groupId)
          .filter(Boolean);
        if (fromSchedule.length) {
          replaceTeacherGroups(entityId, fromSchedule);
        }
      }
    }
  });
  tx();

  let mailed = false;
  let mailError = '';
  if (cleanMail && smtpConfigured(settings)) {
    try {
      const mail = accessCredentialsEmail({
        institutionName: settings.institutionName,
        displayName: displayName || '',
        roleLabel: roleLabel(role),
        username: getUserById(userId)?.username || login,
        email: cleanMail,
        tempPassword,
        appUrl: appUrlFromReq(req),
      });
      await sendMail(settings, { to: cleanMail, ...mail });
      mailed = true;
    } catch (error) {
      mailError = error.message || 'Не удалось отправить письмо';
    }
  }

  writeAudit(actor, {
    action: role === 'student' ? 'students.access' : 'teachers.access',
    entity: role,
    entityId,
    groupId: groupId || null,
    summary: `Выдан доступ (${role}): ${login}`,
    details: { username: login, email: cleanMail, mailed },
  }, req);

  return {
    ok: true,
    userId,
    username: getUserById(userId)?.username || login,
    email: cleanMail,
    tempPassword,
    mustChange: true,
    mailed,
    mailError: mailError || undefined,
    smtpConfigured: smtpConfigured(settings),
  };
}

function revokeEntityAccess(role, entityId, actor, req) {
  const tx = db.transaction(() => {
    if (role === 'student') {
      const student = db.prepare('SELECT * FROM students WHERE id = ?').get(entityId);
      if (!student) fail(404, 'Ученик не найден');
      if (student.user_id) {
        db.prepare('UPDATE users SET active = 0, student_id = NULL WHERE id = ?').run(student.user_id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(student.user_id);
      }
      db.prepare('UPDATE students SET user_id = NULL WHERE id = ?').run(entityId);
      return student;
    }
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(entityId);
    if (!teacher) fail(404, 'Педагог не найден');
    if (teacher.user_id) {
      db.prepare('UPDATE users SET active = 0, teacher_id = NULL WHERE id = ?').run(teacher.user_id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(teacher.user_id);
    }
    db.prepare('UPDATE teachers SET user_id = NULL WHERE id = ?').run(entityId);
    return teacher;
  });
  const row = tx();
  writeAudit(actor, {
    action: role === 'student' ? 'students.access_revoke' : 'teachers.access_revoke',
    entity: role,
    entityId,
    summary: `Отозван доступ: ${row.full_name}`,
  }, req);
  return { ok: true };
}

function teacherMatchNames(teacher) {
  return [teacher?.full_name, teacher?.short_name, teacher?.fullName, teacher?.shortName]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function teacherMatchesEntry(teacher, entryTeacher, rawText = '') {
  if (!teacher) return false;
  const names = teacherMatchNames(teacher);
  if (!names.length) return false;
  const cell = String(entryTeacher || '').trim();
  if (cell && names.some((name) => teacherCellMatches(cell, name))) return true;
  const raw = String(rawText || '').trim();
  if (raw && raw !== cell && names.some((name) => teacherCellMatches(raw, name))) return true;
  return false;
}

function listTeacherSchedule(teacher, weekType) {
  const entries = db.prepare(`
    SELECT e.*, g.name AS group_name
    FROM schedule_entries e
    LEFT JOIN groups g ON g.id = e.group_id
    ORDER BY e.weekday, e.pair_num, e.group_code, g.name COLLATE NOCASE
  `).all().filter((row) => teacherMatchesEntry(teacher, row.teacher, row.raw_text));
  const filtered = weekType && weekType !== 'all'
    ? entries.filter((row) => row.week_type === weekType || row.week_type === 'all')
    : entries;
  return filtered.map((row) => ({
    ...rowToScheduleEntry(row),
    groupId: row.group_id || null,
    groupName: row.group_name || row.group_code || '',
    groupCode: row.group_code || '',
  }));
}

function findGroupByScheduleCode(code) {
  const norm = normalizeGroupCode(code) || String(code || '').trim();
  if (!norm) return null;
  const groups = db.prepare(`
    SELECT id, name, schedule_code, schedule_url, schedule_aliases FROM groups
  `).all();
  return groups.find((group) => groupScheduleCodes(group).includes(norm)) || null;
}

function ensureGroupForScheduleCode(code, { scheduleUrl = '' } = {}) {
  const norm = normalizeGroupCode(code) || String(code || '').trim();
  if (!norm) return null;
  const existing = findGroupByScheduleCode(norm);
  if (existing) {
    if (scheduleUrl && !existing.schedule_url) {
      db.prepare('UPDATE groups SET schedule_url = ? WHERE id = ?').run(scheduleUrl, existing.id);
      existing.schedule_url = scheduleUrl;
    }
    return existing;
  }
  const name = displayGroupName(norm) || norm;
  const aliases = [];
  const info = db.prepare(`
    INSERT INTO groups (name, schedule_code, schedule_url, schedule_aliases, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(name, norm, scheduleUrl || '', JSON.stringify(aliases), Date.now());
  return db.prepare(`
    SELECT id, name, schedule_code, schedule_url, schedule_aliases FROM groups WHERE id = ?
  `).get(Number(info.lastInsertRowid));
}

function collectScheduleSourceUrls() {
  const urls = new Set();
  for (const url of DEFAULT_SHEET_URLS) {
    if (url) urls.add(url);
  }
  try {
    const settings = getSettings();
    for (const url of settings.scheduleUrls || []) {
      if (url) urls.add(url);
    }
  } catch { /* settings may be mid-init */ }
  for (const row of db.prepare(`
    SELECT schedule_url AS url FROM groups WHERE TRIM(COALESCE(schedule_url, '')) != ''
  `).all()) {
    if (row.url) urls.add(row.url);
  }
  return [...urls];
}

/**
 * Если у педагога 0 пар в БД — дотягиваем из Excel: создаём недостающие группы по кодам
 * и импортируем сетку, затем перепривязываем teacher_groups.
 */
async function enrichTeacherScheduleFromExcel(teacher, { force = false } = {}) {
  if (!teacher?.id) return { ok: false, reason: 'no_teacher' };
  const before = listTeacherSchedule(teacher);
  if (before.length && !force) {
    return { ok: true, skipped: true, pairs: before.length };
  }
  const urls = collectScheduleSourceUrls();
  if (!urls.length) return { ok: false, reason: 'no_urls', pairs: 0 };

  let parsed = [];
  try {
    const result = await importFromUrls(urls);
    parsed = result.entries || [];
  } catch (error) {
    return { ok: false, reason: error.message || 'fetch_failed', pairs: 0 };
  }

  const mine = parsed.filter((entry) => teacherMatchesEntry(teacher, entry.teacher, entry.rawText));
  if (!mine.length) return { ok: true, pairs: 0, matchedCodes: [] };

  const byCode = new Map();
  for (const entry of mine) {
    const code = normalizeGroupCode(entry.groupCode) || entry.groupCode;
    if (!code) continue;
    if (!byCode.has(code)) byCode.set(code, entry.sourceUrl || '');
  }

  const imported = [];
  for (const [code, sourceUrl] of byCode) {
    const group = ensureGroupForScheduleCode(code, { scheduleUrl: sourceUrl });
    if (!group) continue;
    const urlList = sourceUrl
      ? [sourceUrl, ...urls.filter((item) => item !== sourceUrl)]
      : urls;
    try {
      const result = await importScheduleForGroup(group.id, {
        persistUrl: true,
        urls: urlList,
      });
      imported.push({
        groupId: group.id,
        code,
        matchedEntries: result.matchedEntries,
      });
    } catch (error) {
      imported.push({ groupId: group.id, code, error: error.message || 'import_failed' });
    }
  }

  const row = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacher.id);
  syncTeacherGroupsFromSchedule(row || teacher, { onlyIfEmpty: false });
  const pairs = listTeacherSchedule(row || teacher);
  return {
    ok: true,
    pairs: pairs.length,
    matchedCodes: [...byCode.keys()],
    imported,
    createdOrUpdated: imported.length,
  };
}

function listTeacherScheduleGroups(teacher, entries = null) {
  const rows = entries || listTeacherSchedule(teacher);
  const byId = new Map();
  for (const entry of rows) {
    const id = entry.groupId || null;
    const key = id || `code:${entry.groupCode || entry.groupName || ''}`;
    if (!entry.groupName && !entry.groupCode && !id) continue;
    const prev = byId.get(key) || {
      groupId: id,
      name: entry.groupName || entry.groupCode || '',
      code: entry.groupCode || '',
      pairs: 0,
    };
    prev.pairs += 1;
    if (!prev.name && entry.groupName) prev.name = entry.groupName;
    byId.set(key, prev);
  }
  return [...byId.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'ru'));
}

function listTeacherAssignedGroups(teacherId) {
  return db.prepare(`
    SELECT g.id AS groupId, g.name AS name, g.schedule_code AS code
    FROM teacher_groups tg
    JOIN groups g ON g.id = tg.group_id
    WHERE tg.teacher_id = ?
    ORDER BY g.name COLLATE NOCASE
  `).all(teacherId);
}

function replaceTeacherGroups(teacherId, groupIds) {
  const ids = [...new Set((groupIds || []).map(parseId).filter(Boolean))];
  for (const groupId of ids) requireGroup(groupId);
  db.prepare('DELETE FROM teacher_groups WHERE teacher_id = ?').run(teacherId);
  const insert = db.prepare('INSERT INTO teacher_groups (teacher_id, group_id) VALUES (?, ?)');
  for (const groupId of ids) insert.run(teacherId, groupId);
  const teacher = db.prepare('SELECT user_id FROM teachers WHERE id = ?').get(teacherId);
  if (teacher?.user_id) {
    replaceUserGroups(teacher.user_id, ids.map((groupId) => ({ groupId, groupRole: 'teacher' })));
  }
  return listTeacherAssignedGroups(teacherId);
}

function syncTeacherGroupsFromSchedule(teacher, { onlyIfEmpty = true } = {}) {
  const teacherId = teacher.id;
  if (onlyIfEmpty) {
    const count = db.prepare('SELECT COUNT(*) AS c FROM teacher_groups WHERE teacher_id = ?').get(teacherId)?.c || 0;
    if (count) return listTeacherAssignedGroups(teacherId);
  }
  const groups = listTeacherScheduleGroups(teacher)
    .map((item) => item.groupId)
    .filter(Boolean);
  if (!groups.length) return listTeacherAssignedGroups(teacherId);
  if (onlyIfEmpty) {
    const insert = db.prepare('INSERT OR IGNORE INTO teacher_groups (teacher_id, group_id) VALUES (?, ?)');
    for (const groupId of groups) insert.run(teacherId, groupId);
    const row = db.prepare('SELECT user_id FROM teachers WHERE id = ?').get(teacherId);
    if (row?.user_id) {
      const current = listUserGroupLinks(row.user_id).map((item) => item.groupId);
      const merged = [...new Set([...current, ...groups])];
      replaceUserGroups(row.user_id, merged.map((groupId) => ({ groupId, groupRole: 'teacher' })));
    }
    return listTeacherAssignedGroups(teacherId);
  }
  return replaceTeacherGroups(teacherId, groups);
}

function sanitizeTeacherRecords() {
  const rows = db.prepare('SELECT * FROM teachers ORDER BY id').all();
  const byNorm = new Map();
  let cleaned = 0;
  for (const row of rows) {
    const full = cleanTeacherCell(row.full_name) || stripTeacherPrefix(row.full_name);
    const short = shortNameFromFull(full || row.full_name);
    if (full && (full !== row.full_name || short !== row.short_name)) {
      db.prepare('UPDATE teachers SET full_name = ?, short_name = ? WHERE id = ?').run(full, short, row.id);
      row.full_name = full;
      row.short_name = short;
      cleaned += 1;
    }
    const key = normalizeTeacherName(row.full_name) || normalizeTeacherName(row.short_name);
    if (!key) continue;
    const prev = byNorm.get(key);
    if (!prev) {
      byNorm.set(key, row);
      continue;
    }
    // merge duplicate dirty discover rows into the earlier teacher
    const dupGroups = db.prepare('SELECT group_id FROM teacher_groups WHERE teacher_id = ?').all(row.id);
    const insertGroup = db.prepare('INSERT OR IGNORE INTO teacher_groups (teacher_id, group_id) VALUES (?, ?)');
    for (const item of dupGroups) insertGroup.run(prev.id, item.group_id);
    db.prepare('DELETE FROM teacher_groups WHERE teacher_id = ?').run(row.id);
    if (row.user_id && !prev.user_id) {
      db.prepare('UPDATE teachers SET user_id = ? WHERE id = ?').run(row.user_id, prev.id);
      db.prepare('UPDATE users SET teacher_id = ? WHERE id = ?').run(prev.id, row.user_id);
      prev.user_id = row.user_id;
    }
    if (row.email && !prev.email) {
      db.prepare('UPDATE teachers SET email = ? WHERE id = ?').run(row.email, prev.id);
    }
    if (row.photo_path && !prev.photo_path) {
      db.prepare('UPDATE teachers SET photo_path = ? WHERE id = ?').run(row.photo_path, prev.id);
    }
    db.prepare('DELETE FROM teachers WHERE id = ?').run(row.id);
    cleaned += 1;
  }
  for (const row of db.prepare('SELECT * FROM teachers').all()) {
    syncTeacherGroupsFromSchedule(row, { onlyIfEmpty: true });
  }
  return cleaned;
}

function sanitizeScheduleTeacherBleed() {
  const rows = db.prepare(`
    SELECT id, teacher, room FROM schedule_entries
    WHERE teacher LIKE '%ауд%' OR teacher LIKE '%каб%' OR teacher LIKE '%комн%'
       OR teacher LIKE '%стадион%' OR teacher LIKE '%н/к%' OR teacher LIKE '%аудитор%'
  `).all();
  const update = db.prepare('UPDATE schedule_entries SET teacher = ?, room = ? WHERE id = ?');
  let fixed = 0;
  for (const row of rows) {
    const { teacher, room } = splitTeacherAndRoom(row.teacher);
    if (!teacher || teacher === String(row.teacher || '').trim()) continue;
    update.run(teacher, (row.room || '').trim() ? row.room : room, row.id);
    fixed += 1;
  }
  return fixed;
}

sanitizeScheduleTeacherBleed();
sanitizeTeacherRecords();

function listStudentNotes(studentId) {
  return db.prepare(`
    SELECT n.id, n.body, n.created_at AS createdAt, n.updated_at AS updatedAt,
      n.author_user_id AS authorUserId,
      u.display_name AS authorName, u.username AS authorUsername
    FROM student_notes n
    JOIN users u ON u.id = n.author_user_id
    WHERE n.student_id = ?
    ORDER BY n.created_at DESC, n.id DESC
  `).all(studentId).map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    authorUserId: row.authorUserId,
    authorName: row.authorName || row.authorUsername || 'Преподаватель',
  }));
}

function discoverTeachersFromSchedule() {
  const rows = db.prepare(`
    SELECT DISTINCT teacher FROM schedule_entries WHERE TRIM(teacher) != ''
  `).all();
  const existing = db.prepare('SELECT id, full_name, short_name FROM teachers').all();
  const created = [];
  const seen = new Set();
  for (const row of rows) {
    const names = cleanTeacherName(row.teacher)
      .split(/[,;]+/)
      .map((part) => cleanTeacherName(part))
      .filter(Boolean);
    for (const full of names) {
      const key = normalizeTeacherName(full);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const short = shortNameFromFull(full);
      const hit = existing.find((t) => teacherCellMatches(full, t.full_name) || teacherCellMatches(full, t.short_name));
      if (hit) {
        syncTeacherGroupsFromSchedule(hit, { onlyIfEmpty: true });
        continue;
      }
      const info = db.prepare(`
        INSERT INTO teachers (full_name, short_name, email, photo_path, user_id, created_at)
        VALUES (?, ?, '', '', NULL, ?)
      `).run(full, short || key, Date.now());
      const item = { id: Number(info.lastInsertRowid), fullName: full, shortName: short };
      const rowTeacher = { id: item.id, full_name: full, short_name: short };
      existing.push(rowTeacher);
      syncTeacherGroupsFromSchedule(rowTeacher, { onlyIfEmpty: false });
      created.push(item);
    }
  }
  return created;
}

function assertExcelEnabled() {
  if (!getSettings().excelEnabled) {
    fail(400, 'Режим Excel выключен. Включите в настройках или правьте расписание вручную.');
  }
}

function rateLevel(rate, settings = getSettings()) {
  if (rate == null || Number.isNaN(rate)) return 'empty';
  if (rate >= settings.attendanceExcellent) return 'excellent';
  if (rate >= settings.attendanceGood) return 'good';
  if (rate >= settings.attendanceWarn) return 'warn';
  return 'bad';
}

function pct(part, whole) {
  if (!whole) return null;
  return Math.round((part / whole) * 1000) / 10;
}

const PBKDF2_ITERS = 120_000;

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = pbkdf2Sync(String(password), salt, PBKDF2_ITERS, 32, 'sha256').toString('hex');
  return { salt, hash };
}

function checkPassword(password, salt, hash) {
  const got = pbkdf2Sync(String(password), salt, PBKDF2_ITERS, 32, 'sha256');
  const exp = Buffer.from(hash, 'hex');
  if (got.length !== exp.length) return false;
  return timingSafeEqual(got, exp);
}

const BOOTSTRAP_ADMIN = {
  username: process.env.ADMIN_USER || 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@example.com',
  displayName: process.env.ADMIN_NAME || 'Администратор',
  password: process.env.ADMIN_PASSWORD || 'admin123',
};

const adminExists = db.prepare('SELECT id FROM admin WHERE id = 1').get();
if (!adminExists) {
  const { salt, hash } = hashPassword(BOOTSTRAP_ADMIN.password);
  db.prepare(`
    INSERT INTO admin (id, username, password_hash, salt, must_change)
    VALUES (1, ?, ?, ?, 0)
  `).run(BOOTSTRAP_ADMIN.username, hash, salt);
}

(() => {
  let adminUser = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get()
    || db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(BOOTSTRAP_ADMIN.username);
  const mirror = db.prepare('SELECT * FROM admin WHERE id = 1').get();
  const needsBootstrap = !adminUser
    || !String(adminUser.email || '').trim()
    || adminUser.must_change === 1
    || process.env.RESET_ADMIN === '1';

  if (!adminUser) {
    const { salt, hash } = hashPassword(BOOTSTRAP_ADMIN.password);
    const info = db.prepare(`
      INSERT INTO users (
        username, email, display_name, password_hash, salt, role, active, must_change, permissions_custom, created_at
      ) VALUES (?, ?, ?, ?, ?, 'admin', 1, 0, 0, ?)
    `).run(
      BOOTSTRAP_ADMIN.username,
      BOOTSTRAP_ADMIN.email,
      BOOTSTRAP_ADMIN.displayName,
      hash,
      salt,
      Date.now(),
    );
    adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid));
  } else if (needsBootstrap) {
    const { salt, hash } = hashPassword(BOOTSTRAP_ADMIN.password);
    db.prepare(`
      UPDATE users
      SET username = ?, email = ?, display_name = ?, password_hash = ?, salt = ?,
          role = 'admin', active = 1, must_change = 0, permissions_custom = 0
      WHERE id = ?
    `).run(
      BOOTSTRAP_ADMIN.username,
      BOOTSTRAP_ADMIN.email,
      BOOTSTRAP_ADMIN.displayName || adminUser.display_name || '',
      hash,
      salt,
      adminUser.id,
    );
    db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(adminUser.id);
    adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminUser.id);
  } else {
    db.prepare(`
      UPDATE users SET username = ?, email = ?, display_name = COALESCE(NULLIF(display_name, ''), ?)
      WHERE id = ?
    `).run(
      BOOTSTRAP_ADMIN.username,
      BOOTSTRAP_ADMIN.email,
      BOOTSTRAP_ADMIN.displayName,
      adminUser.id,
    );
    adminUser = db.prepare('SELECT * FROM users WHERE id = ?').get(adminUser.id);
  }

  if (adminUser) {
    db.prepare(`
      UPDATE admin SET username = ?, password_hash = ?, salt = ?, must_change = ? WHERE id = 1
    `).run(adminUser.username, adminUser.password_hash, adminUser.salt, adminUser.must_change ? 1 : 0);
  } else if (mirror) {
    db.prepare(`
      INSERT INTO users (
        username, email, display_name, password_hash, salt, role, active, must_change, permissions_custom, created_at
      ) VALUES (?, ?, ?, ?, ?, 'admin', 1, ?, 0, ?)
    `).run(
      mirror.username,
      BOOTSTRAP_ADMIN.email,
      BOOTSTRAP_ADMIN.displayName,
      mirror.password_hash,
      mirror.salt,
      mirror.must_change ? 1 : 0,
      Date.now(),
    );
  }

  for (const row of db.prepare('SELECT id, name, norm_key FROM subjects').all()) {
    const key = normalizeSubjectKey(row.name);
    if (row.norm_key !== key) db.prepare('UPDATE subjects SET norm_key = ? WHERE id = ?').run(key, row.id);
  }
})();

function fail(code, message) {
  const err = new Error(message);
  err.status = code;
  throw err;
}

function cleanText(value, label, max = 120) {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!text) fail(400, `Укажите ${label}`);
  if (text.length > max) fail(400, 'Слишком длинный текст');
  return text;
}

function todayIsoDate() {
  const date = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}

function cleanDate(value) {
  const text = String(value ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) fail(400, 'Укажите дату');
  const [year, month, day] = text.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    fail(400, 'Некорректная дата');
  }
  return text;
}

function todayISO() {
  const date = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${z(date.getMonth() + 1)}-${z(date.getDate())}`;
}

function todayMonth() {
  return todayISO().slice(0, 7);
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) fail(400, 'Некорректный идентификатор');
  return id;
}

function constraintMessage(error, message) {
  if (String(error.code || '').startsWith('SQLITE_CONSTRAINT')) fail(400, message);
  throw error;
}

function requireGroup(id) {
  const group = db.prepare('SELECT id, name, schedule_code FROM groups WHERE id = ?').get(parseId(id));
  if (!group) fail(400, 'Группа не найдена');
  return group;
}

function requireSubject(id) {
  const subject = db.prepare(`
    SELECT s.id, s.name, s.group_id AS groupId, g.name AS groupName
    FROM subjects s JOIN groups g ON g.id = s.group_id
    WHERE s.id = ?
  `).get(parseId(id));
  if (!subject) fail(404, 'Предмет не найден');
  return subject;
}

function studentIdsOfGroup(groupId) {
  return new Set(db.prepare('SELECT id FROM students WHERE group_id = ?').all(groupId).map((row) => row.id));
}

function requireStudentInGroup(studentId, groupId) {
  const id = parseId(studentId);
  if (!studentIdsOfGroup(groupId).has(id)) fail(400, 'Ученик не из этой группы');
  return id;
}

let listenPort = PORT;

function listUserGroupLinks(userId) {
  return db.prepare(`
    SELECT ug.group_id AS groupId, ug.group_role AS groupRole, g.name AS groupName
    FROM user_groups ug
    JOIN groups g ON g.id = ug.group_id
    WHERE ug.user_id = ?
    ORDER BY g.name COLLATE NOCASE
  `).all(userId);
}

function resolvePermissionSet(row) {
  if (!row) return new Set();
  if (row.role === 'admin') return new Set(['*', ...PERMISSION_KEYS]);
  if (row.permissions_custom === 1) {
    return new Set(
      db.prepare('SELECT permission_key AS k FROM user_permissions WHERE user_id = ?').all(row.id).map((item) => item.k),
    );
  }
  return new Set(defaultPermissionsForRole(row.role));
}

function mapUser(row) {
  if (!row) return null;
  const groups = row.role === 'admin' ? null : listUserGroupLinks(row.id);
  const permissions = [...resolvePermissionSet(row)].filter((key) => key !== '*').sort();
  return {
    id: row.id,
    username: row.username,
    email: row.email || '',
    displayName: row.display_name || '',
    role: row.role,
    roleLabel: roleLabel(row.role),
    active: row.active === 1,
    mustChange: row.must_change === 1,
    permissionsCustom: row.permissions_custom === 1,
    permissions,
    groupIds: groups == null ? null : groups.map((item) => item.groupId),
    groups,
    studentId: row.student_id || null,
    teacherId: row.teacher_id || null,
  };
}

function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const set = user.permissions instanceof Set
    ? user.permissions
    : new Set(user.permissions || []);
  return set.has('*') || set.has(permission);
}

function assertPermission(user, permission) {
  if (!hasPermission(user, permission)) fail(403, 'Недостаточно прав');
}

function assertAdmin(user) {
  assertPermission(user, 'users.manage');
}

function assertGroupAccess(user, groupId) {
  if (!user) fail(401, 'Нужен вход');
  if (user.role === 'admin' || hasPermission(user, 'users.manage')) return;
  const id = parseId(groupId);
  const ok = db.prepare('SELECT 1 AS ok FROM user_groups WHERE user_id = ? AND group_id = ?').get(user.id, id);
  if (!ok) fail(403, 'Нет доступа к этой группе');
}

function assertSubjectAccess(user, subjectId) {
  const subject = requireSubject(subjectId);
  assertGroupAccess(user, subject.groupId);
  return subject;
}

function syncAdminMirror(user) {
  if (!user || user.role !== 'admin') return;
  db.prepare(`
    UPDATE admin SET username = ?, password_hash = ?, salt = ?, must_change = ? WHERE id = 1
  `).run(user.username, user.password_hash, user.salt, user.must_change ? 1 : 0);
}

function cleanEmail(value) {
  const email = String(value ?? '').trim().toLowerCase().slice(0, 160);
  if (!email) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Некорректный email');
  return email;
}

function parseGroupAssignments(body, role) {
  if (role === 'admin') return [];
  const raw = Array.isArray(body.groups) ? body.groups : null;
  if (raw) {
    return raw.map((item) => {
      const groupId = parseId(item.groupId ?? item.id);
      requireGroup(groupId);
      let groupRole = String(item.groupRole || item.role || 'member');
      if (!['member', 'teacher', 'elder', 'student'].includes(groupRole)) groupRole = 'member';
      if (role === 'elder') groupRole = 'elder';
      if (role === 'teacher' && groupRole === 'member') groupRole = 'teacher';
      if (role === 'student') groupRole = 'student';
      return { groupId, groupRole };
    });
  }
  const ids = [...new Set((body.groupIds || []).map(parseId))];
  for (const groupId of ids) requireGroup(groupId);
  const fallback = role === 'elder' ? 'elder' : role === 'teacher' ? 'teacher' : role === 'student' ? 'student' : 'member';
  return ids.map((groupId) => ({ groupId, groupRole: fallback }));
}

function replaceUserGroups(userId, assignments) {
  db.prepare('DELETE FROM user_groups WHERE user_id = ?').run(userId);
  const insert = db.prepare(`
    INSERT INTO user_groups (user_id, group_id, group_role) VALUES (?, ?, ?)
  `);
  for (const item of assignments) insert.run(userId, item.groupId, item.groupRole);
}

function replaceUserPermissions(userId, role, permissionsInput) {
  db.prepare('DELETE FROM user_permissions WHERE user_id = ?').run(userId);
  if (role === 'admin') {
    db.prepare('UPDATE users SET permissions_custom = 0 WHERE id = ?').run(userId);
    return;
  }
  if (permissionsInput == null) {
    db.prepare('UPDATE users SET permissions_custom = 0 WHERE id = ?').run(userId);
    return;
  }
  const next = normalizePermissionList(permissionsInput);
  const defaults = defaultPermissionsForRole(role);
  if (permissionsEqual(next, defaults)) {
    db.prepare('UPDATE users SET permissions_custom = 0 WHERE id = ?').run(userId);
    return;
  }
  const insert = db.prepare('INSERT INTO user_permissions (user_id, permission_key) VALUES (?, ?)');
  for (const key of next) insert.run(userId, key);
  db.prepare('UPDATE users SET permissions_custom = 1 WHERE id = ?').run(userId);
}

function setGroupElder(groupId, elderUserId) {
  const group = requireGroup(groupId);
  if (elderUserId == null || elderUserId === '' || elderUserId === 0) {
    db.prepare('UPDATE groups SET elder_user_id = NULL WHERE id = ?').run(group.id);
    return null;
  }
  const id = parseId(elderUserId);
  const elder = getUserById(id);
  if (!elder || elder.active !== 1) fail(400, 'Пользователь для старосты не найден');
  if (elder.role === 'admin') fail(400, 'Администратора нельзя сделать старостой группы');
  const link = db.prepare('SELECT group_role FROM user_groups WHERE user_id = ? AND group_id = ?').get(elder.id, group.id);
  if (!link) {
    db.prepare(`
      INSERT INTO user_groups (user_id, group_id, group_role) VALUES (?, ?, 'elder')
    `).run(elder.id, group.id);
  } else {
    db.prepare(`
      UPDATE user_groups SET group_role = 'elder' WHERE user_id = ? AND group_id = ?
    `).run(elder.id, group.id);
  }
  if (elder.role === 'teacher') {
    /* преподаватель может быть старостой доступа по группе */
  } else if (elder.role !== 'elder') {
    db.prepare(`UPDATE users SET role = 'elder' WHERE id = ?`).run(elder.id);
  }
  db.prepare('UPDATE groups SET elder_user_id = ? WHERE id = ?').run(elder.id, group.id);
  return elder.id;
}

function publicMeta() {
  const settings = getSettings();
  const admin = db.prepare("SELECT must_change FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get()
    || db.prepare('SELECT must_change FROM admin WHERE id = 1').get();
  return {
    institutionName: settings.institutionName,
    institutionSubtitle: settings.institutionSubtitle,
    institutionKind: settings.institutionKind,
    excelEnabled: settings.excelEnabled,
    gradesEnabled: settings.gradesEnabled,
    _mustChange: admin?.must_change === 1,
  };
}

function securityHeaders(extra = {}) {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cache-Control': 'no-store',
    ...extra,
  };
}

function clientIp(req) {
  const raw = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  return raw || 'unknown';
}

function assertLoginAllowed(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const row = loginAttempts.get(ip) || { count: 0, start: now };
  if (now - row.start > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 0, start: now });
    return;
  }
  if (row.count >= LOGIN_MAX_ATTEMPTS) fail(429, 'Слишком много попыток входа. Подождите 15 минут.');
}

function noteLoginFailure(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const row = loginAttempts.get(ip);
  if (!row || now - row.start > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, start: now });
    return;
  }
  row.count += 1;
  loginAttempts.set(ip, row);
}

function clearLoginFailures(req) {
  loginAttempts.delete(clientIp(req));
}

const AUDIT_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const AUDIT_MAX_ROWS = 20_000;

function writeAudit(actor, {
  action,
  entity = '',
  entityId = null,
  groupId = null,
  summary = '',
  details = null,
} = {}, req = null) {
  if (!action) return;
  try {
    const payload = details == null ? '' : JSON.stringify(details).slice(0, 4000);
    db.prepare(`
      INSERT INTO audit_log (
        created_at, user_id, username, display_name, role,
        action, entity, entity_id, group_id, summary, details, ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      Date.now(),
      actor?.id ?? null,
      String(actor?.username || '').slice(0, 80),
      String(actor?.displayName || actor?.display_name || '').slice(0, 120),
      String(actor?.role || '').slice(0, 40),
      String(action).slice(0, 80),
      String(entity || '').slice(0, 60),
      entityId == null || entityId === '' ? null : Number(entityId),
      groupId == null || groupId === '' ? null : Number(groupId),
      String(summary || '').slice(0, 400),
      payload,
      req ? clientIp(req) : '',
    );
    if (Math.random() < 0.02) {
      const cutoff = Date.now() - AUDIT_RETENTION_MS;
      db.prepare('DELETE FROM audit_log WHERE created_at < ?').run(cutoff);
      const count = db.prepare('SELECT COUNT(*) AS c FROM audit_log').get().c;
      if (count > AUDIT_MAX_ROWS) {
        db.prepare(`
          DELETE FROM audit_log WHERE id IN (
            SELECT id FROM audit_log ORDER BY created_at ASC LIMIT ?
          )
        `).run(count - AUDIT_MAX_ROWS);
      }
    }
  } catch (error) {
    console.warn('audit:', error.message);
  }
}

function attendanceStatusLabel(status) {
  if (status === 'present') return 'здесь';
  if (status === 'late') return 'опоздание';
  if (status === 'absent') return 'нет';
  if (status === 'excused') return 'уважительная';
  if (!status) return 'снято';
  return String(status);
}

function listAudit({
  limit = 100,
  offset = 0,
  q = '',
  action = '',
  userId = null,
  groupId = null,
} = {}) {
  const take = Math.min(200, Math.max(1, Number(limit) || 100));
  const skip = Math.max(0, Number(offset) || 0);
  const where = [];
  const params = [];
  if (q) {
    where.push(`(
      summary LIKE ? OR username LIKE ? OR display_name LIKE ? OR action LIKE ? OR details LIKE ?
    )`);
    const like = `%${q}%`;
    params.push(like, like, like, like, like);
  }
  if (action) {
    where.push('action = ?');
    params.push(action);
  }
  if (userId) {
    where.push('user_id = ?');
    params.push(parseId(userId));
  }
  if (groupId) {
    where.push('group_id = ?');
    params.push(parseId(groupId));
  }
  const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) AS c FROM audit_log ${clause}`).get(...params).c;
  const rows = db.prepare(`
    SELECT
      a.id,
      a.created_at AS createdAt,
      a.user_id AS userId,
      a.username,
      a.display_name AS displayName,
      a.role,
      a.action,
      a.entity,
      a.entity_id AS entityId,
      a.group_id AS groupId,
      g.name AS groupName,
      a.summary,
      a.details,
      a.ip
    FROM audit_log a
    LEFT JOIN groups g ON g.id = a.group_id
    ${clause}
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT ? OFFSET ?
  `).all(...params, take, skip);

  const actions = db.prepare(`
    SELECT action, COUNT(*) AS count
    FROM audit_log
    GROUP BY action
    ORDER BY count DESC, action ASC
  `).all();

  return {
    total,
    limit: take,
    offset: skip,
    actions,
    items: rows.map((row) => {
      let details = null;
      if (row.details) {
        try { details = JSON.parse(row.details); } catch { details = row.details; }
      }
      return {
        id: row.id,
        createdAt: row.createdAt,
        userId: row.userId,
        username: row.username,
        displayName: row.displayName,
        role: row.role,
        roleLabel: roleLabel(row.role),
        action: row.action,
        entity: row.entity,
        entityId: row.entityId,
        groupId: row.groupId,
        groupName: row.groupName || null,
        summary: row.summary,
        details,
        ip: row.ip || '',
      };
    }),
  };
}

function requireAuth(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token || token.length < 32 || token.length > 128 || !/^[a-f0-9]+$/i.test(token)) {
    fail(401, 'Нужен вход');
  }
  const session = db.prepare('SELECT token, expires_at, user_id AS userId FROM sessions WHERE token = ?').get(token);
  if (!session || session.expires_at < Date.now()) {
    if (session) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    fail(401, 'Сессия истекла, войдите снова');
  }
  let userRow = session.userId ? getUserById(session.userId) : null;
  if (!userRow) {
    userRow = db.prepare("SELECT * FROM users WHERE role = 'admin' ORDER BY id LIMIT 1").get();
    if (userRow) db.prepare('UPDATE sessions SET user_id = ? WHERE token = ?').run(userRow.id, token);
  }
  if (!userRow || userRow.active !== 1) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    fail(401, 'Пользователь недоступен');
  }
  db.prepare('UPDATE sessions SET expires_at = ? WHERE token = ?').run(Date.now() + SESSION_MS, token);
  if (Math.random() < 0.05) {
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
  }
  return { token, user: mapUser(userRow), userRow };
}

function assertSafeScheduleUrls(urls) {
  if (!Array.isArray(urls) || !urls.length) fail(400, 'Нет ссылок на расписание');
  if (urls.length > 12) fail(400, 'Слишком много ссылок');
  const out = [];
  for (const raw of urls) {
    let url;
    try { url = new URL(String(raw).trim()); } catch { fail(400, 'Некорректная ссылка на таблицу'); }
    if (url.protocol !== 'https:') fail(400, 'Ссылки на расписание только по HTTPS');
    if (!/(^|\.)docs\.google\.com$/i.test(url.hostname) && !/(^|\.)googleusercontent\.com$/i.test(url.hostname)) {
      fail(400, 'Разрешены только Google Sheets');
    }
    out.push(normalizeSheetUrl(url.toString()) || url.toString());
  }
  return out;
}

function parseScheduleAliases(raw) {
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((item) => normalizeGroupCode(item) || String(item || '').trim()).filter(Boolean))];
  }
  if (raw == null || raw === '') return [];
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parseScheduleAliases(parsed);
    } catch { /* comma / newline list */ }
    return [...new Set(
      text.split(/[,;\n+|]+/).map((part) => normalizeGroupCode(part) || part.trim()).filter(Boolean),
    )];
  }
  return [];
}

function normalizeScheduleUrlInput(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  assertSafeScheduleUrls([text]);
  return text;
}

function groupScheduleCodes(group) {
  const primary = normalizeGroupCode(group.schedule_code || group.scheduleCode || group.name)
    || String(group.schedule_code || group.scheduleCode || '').trim();
  const aliases = parseScheduleAliases(group.schedule_aliases ?? group.scheduleAliases);
  return [...new Set([primary, ...aliases].filter(Boolean))];
}

function mapGroupRow(group) {
  if (!group) return null;
  const aliases = parseScheduleAliases(group.schedule_aliases ?? group.scheduleAliases);
  return {
    id: group.id,
    name: group.name,
    scheduleCode: group.schedule_code ?? group.scheduleCode ?? null,
    scheduleUrl: group.schedule_url ?? group.scheduleUrl ?? '',
    scheduleAliases: aliases,
    scheduleCodes: groupScheduleCodes(group),
    scheduleSyncedAt: group.schedule_synced_at ?? group.scheduleSyncedAt ?? null,
    scheduleSyncError: group.schedule_sync_error ?? group.scheduleSyncError ?? '',
    elderUserId: group.elder_user_id ?? group.elderUserId ?? null,
  };
}

function loadGroupSchedule(id) {
  return db.prepare(`
    SELECT id, name, schedule_code, schedule_url, schedule_aliases,
      schedule_synced_at, schedule_sync_error, elder_user_id
    FROM groups WHERE id = ?
  `).get(parseId(id));
}

function markGroupScheduleSync(groupId, { error = '', at = Date.now() } = {}) {
  db.prepare(`
    UPDATE groups SET schedule_synced_at = ?, schedule_sync_error = ? WHERE id = ?
  `).run(at, String(error || '').slice(0, 300), Number(groupId));
}

function buildCodeToGroupId(groups) {
  const byCode = new Map();
  for (const group of groups) {
    for (const code of groupScheduleCodes(group)) {
      if (!byCode.has(code)) byCode.set(code, group.id);
    }
  }
  return byCode;
}

function resolveScheduleUrlsForImport({ groupId, urls } = {}) {
  const settings = getSettings();
  if (Array.isArray(urls) && urls.length) return assertSafeScheduleUrls(urls.map(String));
  if (groupId) {
    const group = loadGroupSchedule(groupId);
    if (!group) fail(404, 'Группа не найдена');
    if (group.schedule_url) return assertSafeScheduleUrls([group.schedule_url]);
  }
  return assertSafeScheduleUrls(settings.scheduleUrls);
}

function overview(user) {
  const allowed = (user?.role === 'admin' || hasPermission(user, 'users.manage'))
    ? null
    : new Set((user?.groupIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0));
  const globalUrls = getSettings().scheduleUrls || [];
  let groups = db.prepare(`
    SELECT g.id, g.name, g.schedule_code AS scheduleCode,
      g.schedule_url AS scheduleUrl,
      g.schedule_aliases AS scheduleAliasesRaw,
      g.schedule_synced_at AS scheduleSyncedAt,
      g.schedule_sync_error AS scheduleSyncError,
      g.elder_user_id AS elderUserId,
      u.username AS elderUsername,
      u.display_name AS elderDisplayName,
      (SELECT COUNT(*) FROM students s WHERE s.group_id = g.id) AS studentCount,
      (SELECT COUNT(*) FROM subjects j WHERE j.group_id = g.id) AS subjectCount,
      (SELECT COUNT(*) FROM schedule_entries e WHERE e.group_id = g.id) AS scheduleCount
    FROM groups g
    LEFT JOIN users u ON u.id = g.elder_user_id
  `).all().map((group) => {
    const aliases = parseScheduleAliases(group.scheduleAliasesRaw);
    const scheduleCodes = [...new Set([
      normalizeGroupCode(group.scheduleCode || group.name) || group.scheduleCode || '',
      ...aliases,
    ].filter(Boolean))];
    const hasCode = !!group.scheduleCode;
    const hasSource = !!(group.scheduleUrl || globalUrls.length);
    return {
      id: group.id,
      name: group.name,
      scheduleCode: group.scheduleCode,
      scheduleUrl: group.scheduleUrl || '',
      scheduleAliases: aliases,
      scheduleCodes,
      scheduleSyncedAt: group.scheduleSyncedAt || null,
      scheduleSyncError: group.scheduleSyncError || '',
      elderUserId: group.elderUserId,
      elderUsername: group.elderUsername,
      elderDisplayName: group.elderDisplayName,
      elderName: group.elderDisplayName || group.elderUsername || null,
      studentCount: group.studentCount,
      subjectCount: group.subjectCount,
      scheduleCount: group.scheduleCount,
      scheduleBound: hasCode && hasSource,
      scheduleReady: hasCode && hasSource,
    };
  });
  if (allowed) groups = groups.filter((group) => allowed.has(Number(group.id)));
  const groupIds = new Set(groups.map((group) => Number(group.id)));
  let students = db.prepare(`
    SELECT s.id, s.full_name AS fullName, s.group_id AS groupId, g.name AS groupName,
      s.email, s.photo_path AS photoPath, s.user_id AS userId
    FROM students s JOIN groups g ON g.id = s.group_id
  `).all().map((row) => ({
    id: row.id,
    fullName: row.fullName,
    groupId: Number(row.groupId),
    groupName: row.groupName,
    email: row.email || '',
    photoUrl: photoUrl(row.photoPath),
    userId: row.userId || null,
    hasAccess: Boolean(row.userId),
  }));
  let subjects = db.prepare(`
    SELECT j.id, j.name, j.group_id AS groupId, g.name AS groupName,
      (SELECT COUNT(*) FROM lessons l WHERE l.subject_id = j.id) AS lessonCount,
      (SELECT COUNT(*) FROM credits c WHERE c.subject_id = j.id) AS creditCount,
      (SELECT COUNT(*) FROM works w WHERE w.subject_id = j.id) AS workCount,
      (SELECT COUNT(*) FROM schedule_entries e
        WHERE e.group_id = j.group_id
          AND lower(replace(replace(e.subject_name, 'ё', 'е'), 'Ё', 'Е'))
            = lower(replace(replace(j.name, 'ё', 'е'), 'Ё', 'Е'))
      ) AS scheduleCount
    FROM subjects j JOIN groups g ON g.id = j.group_id
  `).all().map((row) => ({ ...row, groupId: Number(row.groupId) }));
  if (allowed) {
    students = students.filter((row) => groupIds.has(Number(row.groupId)));
    subjects = subjects.filter((row) => groupIds.has(Number(row.groupId)));
  }
  groups.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  students.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru') || a.groupName.localeCompare(b.groupName, 'ru'));
  subjects.sort((a, b) => a.groupName.localeCompare(b.groupName, 'ru') || a.name.localeCompare(b.name, 'ru'));
  const settings = getSettings();
  return {
    groups,
    students,
    subjects,
    permissions: user?.permissions || [],
    can: Object.fromEntries(PERMISSION_KEYS.map((key) => [key, hasPermission(user, key)])),
    settings: {
      gradesEnabled: settings.gradesEnabled,
      excelEnabled: settings.excelEnabled,
      institutionName: settings.institutionName,
      institutionSubtitle: settings.institutionSubtitle,
      institutionKind: settings.institutionKind,
    },
  };
}

function journal(subjectId) {
  const subject = requireSubject(subjectId);
  const students = db.prepare(`
    SELECT id, full_name AS fullName FROM students WHERE group_id = ?
  `).all(subject.groupId);
  students.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));

  const lessonRows = db.prepare(`
    SELECT id, lesson_date AS date, topic
    FROM lessons WHERE subject_id = ?
    ORDER BY lesson_date DESC, id DESC
  `).all(subject.id);
  const attendance = db.prepare(`
    SELECT a.lesson_id, a.student_id, a.status, a.comment
    FROM attendance a JOIN lessons l ON l.id = a.lesson_id
    WHERE l.subject_id = ?
  `).all(subject.id);
  const marksByLesson = new Map();
  for (const row of attendance) {
    if (!marksByLesson.has(row.lesson_id)) marksByLesson.set(row.lesson_id, {});
    marksByLesson.get(row.lesson_id)[row.student_id] = markPayload(row.status, row.comment);
  }

  const creditRows = db.prepare(`
    SELECT id, title, credit_date AS date, kind
    FROM credits WHERE subject_id = ?
    ORDER BY credit_date DESC, id DESC
  `).all(subject.id);
  const resultRows = db.prepare(`
    SELECT r.credit_id, r.student_id, r.result
    FROM credit_results r JOIN credits c ON c.id = r.credit_id
    WHERE c.subject_id = ?
  `).all(subject.id);
  const resultsByCredit = new Map();
  for (const row of resultRows) {
    if (!resultsByCredit.has(row.credit_id)) resultsByCredit.set(row.credit_id, {});
    resultsByCredit.get(row.credit_id)[row.student_id] = row.result;
  }

  const workRows = db.prepare(`
    SELECT id, title, work_date AS date
    FROM works WHERE subject_id = ?
    ORDER BY work_date DESC, id DESC
  `).all(subject.id);
  const gradeRows = db.prepare(`
    SELECT g.work_id, g.student_id, g.value
    FROM grades g JOIN works w ON w.id = g.work_id
    WHERE w.subject_id = ?
  `).all(subject.id);
  const gradesByWork = new Map();
  for (const row of gradeRows) {
    if (!gradesByWork.has(row.work_id)) gradesByWork.set(row.work_id, {});
    gradesByWork.get(row.work_id)[row.student_id] = row.value;
  }

  return {
    subject,
    students,
    lessons: lessonRows.map((row) => ({ ...row, marks: marksByLesson.get(row.id) || {} })),
    credits: creditRows.map((row) => ({ ...row, results: resultsByCredit.get(row.id) || {} })),
    works: workRows.map((row) => ({ ...row, grades: gradesByWork.get(row.id) || {} })),
  };
}

function attendanceBundle({ groupId, subjectId, studentId } = {}) {
  const settings = getSettings();
  let studentsQuery = `
    SELECT s.id, s.full_name AS fullName, s.group_id AS groupId, g.name AS groupName,
      s.email, s.photo_path AS photoPath, s.user_id AS userId
    FROM students s JOIN groups g ON g.id = s.group_id
  `;
  const studentParams = [];
  const studentWhere = [];
  if (groupId) {
    studentWhere.push('s.group_id = ?');
    studentParams.push(parseId(groupId));
  }
  if (studentId) {
    studentWhere.push('s.id = ?');
    studentParams.push(parseId(studentId));
  }
  if (studentWhere.length) studentsQuery += ` WHERE ${studentWhere.join(' AND ')}`;
  const students = db.prepare(studentsQuery).all(...studentParams).map((row) => ({
    ...row,
    email: row.email || '',
    photoUrl: photoUrl(row.photoPath),
    hasAccess: Boolean(row.userId),
  }));
  students.sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru') || a.groupName.localeCompare(b.groupName, 'ru'));

  let lessonsQuery = `
    SELECT l.id, l.lesson_date AS date, l.topic, l.subject_id AS subjectId,
      s.name AS subjectName, s.group_id AS groupId, g.name AS groupName
    FROM lessons l
    JOIN subjects s ON s.id = l.subject_id
    JOIN groups g ON g.id = s.group_id
  `;
  const lessonParams = [];
  const lessonWhere = [];
  if (groupId) {
    lessonWhere.push('s.group_id = ?');
    lessonParams.push(parseId(groupId));
  }
  if (subjectId) {
    lessonWhere.push('l.subject_id = ?');
    lessonParams.push(parseId(subjectId));
  }
  if (studentId) {
    const student = students[0];
    if (!student) return { settings, students: [], lessons: [], marks: [], totals: emptyTotals(), groups: [] };
    lessonWhere.push('s.group_id = ?');
    lessonParams.push(student.groupId);
  }
  if (lessonWhere.length) lessonsQuery += ` WHERE ${lessonWhere.join(' AND ')}`;
  lessonsQuery += ' ORDER BY l.lesson_date ASC, l.id ASC';
  const lessons = db.prepare(lessonsQuery).all(...lessonParams);

  const lessonIds = lessons.map((row) => row.id);
  let marks = [];
  if (lessonIds.length) {
    const placeholders = lessonIds.map(() => '?').join(',');
    marks = db.prepare(`
      SELECT lesson_id AS lessonId, student_id AS studentId, status, comment
      FROM attendance WHERE lesson_id IN (${placeholders})
    `).all(...lessonIds);
  }
  if (studentId) marks = marks.filter((row) => row.studentId === parseId(studentId));

  const markMap = new Map();
  for (const row of marks) markMap.set(`${row.lessonId}:${row.studentId}`, row);

  const perStudent = students.map((student) => {
    const relevant = lessons.filter((lesson) => lesson.groupId === student.groupId);
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;
    let unmarked = 0;
    const history = [];
    for (const lesson of relevant) {
      const mark = markMap.get(`${lesson.id}:${student.id}`);
      const status = mark?.status || '';
      if (status === 'present') present += 1;
      else if (status === 'late') late += 1;
      else if (status === 'absent') absent += 1;
      else if (status === 'excused') excused += 1;
      else unmarked += 1;
      history.push({
        lessonId: lesson.id,
        date: lesson.date,
        topic: lesson.topic,
        subjectId: lesson.subjectId,
        subjectName: lesson.subjectName,
        status: status || null,
        comment: mark?.comment || '',
      });
    }
    const total = relevant.length;
    const marked = present + late + absent + excused;
    const attended = present + late;
    const rateBase = present + late + absent; // уваж. не портит явку
    const rate = pct(attended, rateBase || total);
    const markedRate = pct(attended, present + late + absent || marked);
    return {
      id: student.id,
      fullName: student.fullName,
      groupId: student.groupId,
      groupName: student.groupName,
      email: student.email || '',
      photoUrl: student.photoUrl || '',
      hasAccess: Boolean(student.hasAccess),
      total,
      present,
      late,
      absent,
      excused,
      unmarked,
      marked,
      attended,
      rate,
      markedRate,
      level: rateLevel(rate, settings),
      history,
    };
  });

  const totals = {
    students: perStudent.length,
    lessons: lessons.length,
    present: perStudent.reduce((sum, row) => sum + row.present, 0),
    late: perStudent.reduce((sum, row) => sum + row.late, 0),
    absent: perStudent.reduce((sum, row) => sum + row.absent, 0),
    excused: perStudent.reduce((sum, row) => sum + (row.excused || 0), 0),
    unmarked: perStudent.reduce((sum, row) => sum + row.unmarked, 0),
  };
  totals.attended = totals.present + totals.late;
  totals.slots = totals.present + totals.late + totals.absent + totals.unmarked; // уваж. вне явки
  totals.rate = pct(totals.attended, totals.present + totals.late + totals.absent || totals.slots);
  totals.level = rateLevel(totals.rate, settings);
  totals.excellent = perStudent.filter((row) => row.level === 'excellent').length;
  totals.good = perStudent.filter((row) => row.level === 'good').length;
  totals.warn = perStudent.filter((row) => row.level === 'warn').length;
  totals.bad = perStudent.filter((row) => row.level === 'bad').length;
  totals.empty = perStudent.filter((row) => row.level === 'empty').length;

  const byGroup = new Map();
  for (const student of perStudent) {
    if (!byGroup.has(student.groupId)) {
      byGroup.set(student.groupId, {
        id: student.groupId,
        name: student.groupName,
        students: 0,
        present: 0,
        late: 0,
        absent: 0,
        unmarked: 0,
        slots: 0,
      });
    }
    const group = byGroup.get(student.groupId);
    group.students += 1;
    group.present += student.present;
    group.late += student.late;
    group.absent += student.absent;
    group.excused = (group.excused || 0) + (student.excused || 0);
    group.unmarked += student.unmarked;
    group.slots += student.total;
  }
  const groups = [...byGroup.values()].map((group) => {
    const attended = group.present + group.late;
    const rate = pct(attended, group.present + group.late + group.absent || group.slots);
    return { ...group, attended, rate, level: rateLevel(rate, settings) };
  }).sort((a, b) => a.name.localeCompare(b.name, 'ru'));

  return { settings, students: perStudent, lessons, totals, groups };
}

function emptyTotals() {
  return {
    students: 0, lessons: 0, present: 0, late: 0, absent: 0, excused: 0, unmarked: 0,
    attended: 0, slots: 0, rate: null, level: 'empty',
    excellent: 0, good: 0, warn: 0, bad: 0, empty: 0,
  };
}

function studentDetailStats(studentId, subjectId) {
  const id = parseId(studentId);
  const student = db.prepare(`
    SELECT s.id, s.full_name AS fullName, s.group_id AS groupId, g.name AS groupName,
      s.email, s.photo_path AS photoPath, s.user_id AS userId
    FROM students s JOIN groups g ON g.id = s.group_id WHERE s.id = ?
  `).get(id);
  if (!student) fail(404, 'Ученик не найден');
  const accessUser = student.userId ? getUserById(student.userId) : null;

  const filter = subjectId ? { studentId: id, subjectId } : { studentId: id };
  const bundle = attendanceBundle(filter);
  const row = bundle.students[0] || null;

  const subjects = db.prepare(`
    SELECT j.id, j.name,
      (SELECT COUNT(*) FROM lessons l WHERE l.subject_id = j.id) AS lessonCount
    FROM subjects j WHERE j.group_id = ?
    ORDER BY j.name COLLATE NOCASE
  `).all(student.groupId);

  const bySubject = subjects.map((subject) => {
    const part = attendanceBundle({ studentId: id, subjectId: subject.id }).students[0];
    return {
      id: subject.id,
      name: subject.name,
      lessonCount: subject.lessonCount,
      present: part?.present || 0,
      late: part?.late || 0,
      absent: part?.absent || 0,
      unmarked: part?.unmarked || 0,
      total: part?.total || 0,
      rate: part?.rate ?? null,
      level: part?.level || 'empty',
    };
  });

  const gradeRows = db.prepare(`
    SELECT g.value, w.title, w.work_date AS date, s.name AS subjectName, s.id AS subjectId
    FROM grades g
    JOIN works w ON w.id = g.work_id
    JOIN subjects s ON s.id = w.subject_id
    WHERE g.student_id = ? AND s.group_id = ?
    ORDER BY w.work_date DESC, w.id DESC
  `).all(id, student.groupId);
  const gradeValues = gradeRows.map((row) => row.value);
  const gradeAvg = gradeValues.length
    ? Math.round((gradeValues.reduce((a, b) => a + b, 0) / gradeValues.length) * 10) / 10
    : null;

  const creditRows = db.prepare(`
    SELECT r.result, c.title, c.credit_date AS date, c.kind, s.name AS subjectName
    FROM credit_results r
    JOIN credits c ON c.id = r.credit_id
    JOIN subjects s ON s.id = c.subject_id
    WHERE r.student_id = ? AND s.group_id = ?
    ORDER BY c.credit_date DESC, c.id DESC
  `).all(id, student.groupId);

  return {
    student: {
      id: student.id,
      fullName: student.fullName,
      groupId: student.groupId,
      groupName: student.groupName,
      email: student.email || '',
      photoUrl: photoUrl(student.photoPath),
      userId: student.userId || null,
      hasAccess: Boolean(student.userId),
      accessUsername: accessUser?.username || '',
      accessEmail: accessUser?.email || student.email || '',
      accessActive: accessUser ? accessUser.active === 1 : false,
    },
    attendance: row,
    bySubject,
    grades: { rows: gradeRows, average: gradeAvg, count: gradeValues.length },
    credits: creditRows,
    settings: bundle.settings,
    totals: bundle.totals,
  };
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[;"\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvEscape).join(';')).join('\r\n');
}

function statusRu(status) {
  if (status === 'present') return 'Присутствовал';
  if (status === 'late') return 'Опоздал';
  if (status === 'absent') return 'Отсутствовал';
  if (status === 'excused') return 'Уважительная';
  return '';
}

function attendanceStatusOf(value) {
  if (!value) return '';
  return typeof value === 'string' ? value : (value.status || '');
}

function levelRu(level) {
  return ({
    excellent: 'Отлично',
    good: 'Хорошо',
    warn: 'Внимание',
    bad: 'Плохо',
    empty: 'Нет данных',
  })[level] || level;
}

function exportAttendance({ groupId, subjectId }) {
  const settings = getSettings();
  const bundle = attendanceBundle({ groupId, subjectId });
  const header = [
    'Ученик', 'Группа', 'Занятий', 'Присутствовал', 'Опоздал', 'Уваж.', 'Отсутствовал',
    'Не отмечен', 'Был на занятии', 'Посещаемость %', 'Уровень',
  ];
  const body = bundle.students.map((row) => [
    row.fullName, row.groupName, row.total, row.present, row.late, row.excused || 0, row.absent,
    row.unmarked, row.attended, row.rate == null ? '' : String(row.rate).replace('.', ','),
    levelRu(row.level),
  ]);
  const detailHeader = ['Ученик', 'Группа', 'Предмет', 'Дата', 'Тема', 'Отметка', 'Комментарий'];
  const detail = [];
  for (const student of bundle.students) {
    for (const item of student.history) {
      detail.push([
        student.fullName, student.groupName, item.subjectName, item.date,
        item.topic || '', statusRu(item.status), item.comment || '',
      ]);
    }
  }
  const summary = [
    ['Заведение', settings.institutionName],
    ['Выгрузка', 'Посещаемость'],
    ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
    [],
    header,
    ...body,
    [],
    ['Детализация по занятиям'],
    detailHeader,
    ...detail,
  ];
  return {
    filename: 'poseschaemost.csv',
    csv: toCsv(summary),
    rows: summary,
    detailRows: [detailHeader, ...detail],
    studentRows: [header, ...body],
    matrixRows: attendanceMatrixRows(bundle),
  };
}

function exportGrades({ groupId, subjectId }) {
  const settings = getSettings();
  let query = `
    SELECT st.full_name AS fullName, g.name AS groupName, s.name AS subjectName,
      w.title AS workTitle, w.work_date AS date, gr.value
    FROM grades gr
    JOIN works w ON w.id = gr.work_id
    JOIN subjects s ON s.id = w.subject_id
    JOIN groups g ON g.id = s.group_id
    JOIN students st ON st.id = gr.student_id
  `;
  const where = [];
  const params = [];
  if (groupId) { where.push('s.group_id = ?'); params.push(parseId(groupId)); }
  if (subjectId) { where.push('s.id = ?'); params.push(parseId(subjectId)); }
  if (where.length) query += ` WHERE ${where.join(' AND ')}`;
  query += ' ORDER BY g.name, st.full_name, s.name, w.work_date, w.id';
  const dataRows = db.prepare(query).all(...params);
  const table = [
    ['Заведение', settings.institutionName],
    ['Выгрузка', 'Оценки'],
    ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
    [],
    ['Ученик', 'Группа', 'Предмет', 'Работа', 'Дата', 'Оценка'],
    ...dataRows.map((row) => [row.fullName, row.groupName, row.subjectName, row.workTitle, row.date, row.value]),
  ];
  return { filename: 'ocenki.csv', csv: toCsv(table), rows: table };
}

function exportCredits({ groupId, subjectId }) {
  const settings = getSettings();
  let query = `
    SELECT st.full_name AS fullName, g.name AS groupName, s.name AS subjectName,
      c.title, c.credit_date AS date, c.kind, r.result
    FROM credit_results r
    JOIN credits c ON c.id = r.credit_id
    JOIN subjects s ON s.id = c.subject_id
    JOIN groups g ON g.id = s.group_id
    JOIN students st ON st.id = r.student_id
  `;
  const where = [];
  const params = [];
  if (groupId) { where.push('s.group_id = ?'); params.push(parseId(groupId)); }
  if (subjectId) { where.push('s.id = ?'); params.push(parseId(subjectId)); }
  if (where.length) query += ` WHERE ${where.join(' AND ')}`;
  query += ' ORDER BY g.name, st.full_name, s.name, c.credit_date, c.id';
  const dataRows = db.prepare(query).all(...params);
  const resultRu = (kind, result) => {
    if (result === 'pass') return 'Зачёт';
    if (result === 'fail') return 'Незачёт';
    return result;
  };
  const table = [
    ['Заведение', settings.institutionName],
    ['Выгрузка', 'Зачёты и экзамены'],
    ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
    [],
    ['Ученик', 'Группа', 'Предмет', 'Название', 'Дата', 'Вид', 'Результат'],
    ...dataRows.map((row) => [
      row.fullName, row.groupName, row.subjectName, row.title, row.date,
      row.kind === 'exam' ? 'Экзамен' : 'Зачёт', resultRu(row.kind, row.result),
    ]),
  ];
  return { filename: 'zachety.csv', csv: toCsv(table), rows: table };
}

function exportSummary({ groupId, subjectId }) {
  const settings = getSettings();
  const bundle = attendanceBundle({ groupId, subjectId });
  const table = [
    ['Заведение', settings.institutionName],
    ['Выгрузка', 'Сводная статистика посещаемости'],
    ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
    ['Общая посещаемость %', bundle.totals.rate == null ? '' : String(bundle.totals.rate).replace('.', ',')],
    [],
    ['Ученик', 'Группа', 'Занятий', 'Был', 'Опоздал', 'Уваж.', 'Не был', 'Не отмечен', '%', 'Уровень'],
    ...bundle.students.map((row) => [
      row.fullName, row.groupName, row.total, row.present, row.late, row.excused || 0, row.absent, row.unmarked,
      row.rate == null ? '' : String(row.rate).replace('.', ','), levelRu(row.level),
    ]),
  ];
  return { filename: 'svodka-poseschaemost.csv', csv: toCsv(table), rows: table };
}

function exportFileSlug(text, fallback = 'export') {
  const slug = String(text || '')
    .trim()
    .replace(/[^\w.\-а-яА-ЯёЁ]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
  return slug || fallback;
}

function exportMetaRows(title, extra = []) {
  const settings = getSettings();
  return [
    ['Заведение', settings.institutionName],
    ['Подзаголовок', settings.institutionSubtitle || ''],
    ['Выгрузка', title],
    ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
    ...extra,
    [],
  ];
}

function exportRoster({ groupId } = {}) {
  let query = `
    SELECT s.id, s.full_name AS fullName, g.name AS groupName, s.email,
      s.user_id AS userId, u.username, u.email AS userEmail, u.active
    FROM students s
    JOIN groups g ON g.id = s.group_id
    LEFT JOIN users u ON u.id = s.user_id
  `;
  const params = [];
  if (groupId) {
    query += ' WHERE s.group_id = ?';
    params.push(parseId(groupId));
  }
  query += ' ORDER BY g.name COLLATE NOCASE, s.full_name COLLATE NOCASE';
  const rows = db.prepare(query).all(...params);
  const header = ['№', 'Ученик', 'Группа', 'Email', 'Доступ', 'Логин', 'Статус доступа'];
  const body = rows.map((row, index) => [
    index + 1,
    row.fullName,
    row.groupName,
    row.email || row.userEmail || '',
    row.userId ? 'Да' : 'Нет',
    row.username || '',
    row.userId ? (row.active === 1 ? 'Активен' : 'Отключён') : '',
  ]);
  const table = [
    ...exportMetaRows(groupId ? 'Список учеников группы' : 'Список учеников'),
    header,
    ...body,
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = groupId ? `-group-${groupId}` : '';
  return {
    filename: `ucheniki${suffix}-${stamp}.csv`,
    csv: toCsv(table),
    rows: table,
  };
}

function exportGroupsList() {
  const rows = db.prepare(`
    SELECT g.id, g.name, g.schedule_code AS scheduleCode, g.schedule_url AS scheduleUrl,
      (SELECT COUNT(*) FROM students s WHERE s.group_id = g.id) AS studentCount,
      (SELECT COUNT(*) FROM subjects j WHERE j.group_id = g.id) AS subjectCount,
      (SELECT COUNT(*) FROM schedule_entries e WHERE e.group_id = g.id) AS scheduleCount,
      u.display_name AS elderName, u.username AS elderUsername
    FROM groups g
    LEFT JOIN users u ON u.id = g.elder_user_id
    ORDER BY g.name COLLATE NOCASE
  `).all();
  const header = [
    '№', 'Группа', 'Учеников', 'Предметов', 'Пар в сетке',
    'Староста', 'Код Excel', 'Ссылка Excel',
  ];
  const body = rows.map((row, index) => [
    index + 1,
    row.name,
    row.studentCount,
    row.subjectCount,
    row.scheduleCount,
    row.elderName || row.elderUsername || '',
    row.scheduleCode || '',
    row.scheduleUrl || '',
  ]);
  const table = [
    ...exportMetaRows('Группы'),
    header,
    ...body,
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  return { filename: `gruppy-${stamp}.csv`, csv: toCsv(table), rows: table };
}

function exportSubjectsList({ groupId } = {}) {
  let query = `
    SELECT j.name AS subjectName, g.name AS groupName,
      (SELECT COUNT(*) FROM lessons l WHERE l.subject_id = j.id) AS lessonCount,
      (SELECT COUNT(*) FROM schedule_entries e
        WHERE e.group_id = j.group_id
          AND lower(replace(replace(e.subject_name, 'ё', 'е'), 'Ё', 'Е'))
            = lower(replace(replace(j.name, 'ё', 'е'), 'Ё', 'Е'))) AS scheduleCount,
      (SELECT COUNT(*) FROM works w WHERE w.subject_id = j.id) AS workCount,
      (SELECT COUNT(*) FROM credits c WHERE c.subject_id = j.id) AS creditCount
    FROM subjects j
    JOIN groups g ON g.id = j.group_id
  `;
  const params = [];
  if (groupId) {
    query += ' WHERE j.group_id = ?';
    params.push(parseId(groupId));
  }
  query += ' ORDER BY g.name COLLATE NOCASE, j.name COLLATE NOCASE';
  const rows = db.prepare(query).all(...params);
  const header = ['№', 'Предмет', 'Группа', 'Занятий', 'Пар в сетке', 'Работ (оценки)', 'Зачётов'];
  const body = rows.map((row, index) => [
    index + 1, row.subjectName, row.groupName,
    row.lessonCount, row.scheduleCount, row.workCount, row.creditCount,
  ]);
  const table = [
    ...exportMetaRows(groupId ? 'Предметы группы' : 'Предметы'),
    header,
    ...body,
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = groupId ? `-group-${groupId}` : '';
  return { filename: `predmety${suffix}-${stamp}.csv`, csv: toCsv(table), rows: table };
}

function exportTeachersList() {
  const rows = db.prepare('SELECT * FROM teachers ORDER BY full_name COLLATE NOCASE').all().map((row) => {
    const mapped = mapTeacherRow(row);
    const schedule = listTeacherSchedule(row);
    const groups = listTeacherAssignedGroups(row.id);
    return {
      ...mapped,
      scheduleCount: schedule.length,
      groupNames: groups.map((item) => item.name).join(', '),
    };
  });
  const header = ['№', 'ФИО', 'Кратко', 'Email', 'Группы', 'Пар в расписании', 'Доступ'];
  const body = rows.map((row, index) => [
    index + 1,
    row.fullName,
    row.shortName || '',
    row.email || '',
    row.groupNames || '',
    row.scheduleCount,
    row.userId ? 'Да' : 'Нет',
  ]);
  const table = [
    ...exportMetaRows('Педагоги'),
    header,
    ...body,
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  return { filename: `pedagogi-${stamp}.csv`, csv: toCsv(table), rows: table };
}

function exportStudentCard({ studentId }) {
  const detail = studentDetailStats(studentId);
  const student = detail.student;
  const att = detail.attendance || {
    present: 0, late: 0, absent: 0, excused: 0, unmarked: 0, rate: null, level: 'empty', total: 0, attended: 0, history: [],
  };
  const overview = [
    ...exportMetaRows('Карточка ученика', [
      ['Ученик', student.fullName],
      ['Группа', student.groupName],
      ['Email', student.email || ''],
      ['Доступ в дневник', student.hasAccess ? 'Да' : 'Нет'],
      ['Логин', student.accessUsername || ''],
    ]),
    ['Показатель', 'Значение'],
    ['Посещаемость %', att.rate == null ? '' : String(att.rate).replace('.', ',')],
    ['Уровень', levelRu(att.level)],
    ['Занятий', att.total || 0],
    ['Был', att.present || 0],
    ['Опоздал', att.late || 0],
    ['Уваж.', att.excused || 0],
    ['Не был', att.absent || 0],
    ['Не отмечен', att.unmarked || 0],
    ['Средний балл', detail.grades?.average == null ? '' : String(detail.grades.average).replace('.', ',')],
    ['Оценок', detail.grades?.count || 0],
    ['Зачётов / экзаменов', (detail.credits || []).length],
  ];
  const bySubject = [
    ['Предмет', 'Занятий', 'Был', 'Опоздал', 'Не был', 'Пусто', '%', 'Уровень'],
    ...(detail.bySubject || []).map((row) => [
      row.name, row.total, row.present, row.late, row.absent, row.unmarked,
      row.rate == null ? '' : String(row.rate).replace('.', ','), levelRu(row.level),
    ]),
  ];
  const history = [
    ['Дата', 'Предмет', 'Тема', 'Отметка', 'Комментарий'],
    ...(att.history || []).map((item) => [
      item.date, item.subjectName, item.topic || '', statusRu(item.status), item.comment || '',
    ]),
  ];
  const grades = [
    ['Дата', 'Предмет', 'Работа', 'Оценка'],
    ...(detail.grades?.rows || []).map((row) => [row.date, row.subjectName, row.title, row.value]),
  ];
  const credits = [
    ['Дата', 'Предмет', 'Название', 'Вид', 'Результат'],
    ...(detail.credits || []).map((row) => [
      row.date,
      row.subjectName,
      row.title,
      row.kind === 'exam' ? 'Экзамен' : 'Зачёт',
      row.result === 'pass' ? 'Зачёт'
        : row.result === 'fail' ? 'Незачёт'
          : row.result,
    ]),
  ];
  const slug = exportFileSlug(student.fullName, `student-${student.id}`);
  const stamp = new Date().toISOString().slice(0, 10);
  const sheets = [
    { name: 'Карточка', rows: overview },
    { name: 'По предметам', rows: bySubject },
    { name: 'История явки', rows: history },
    { name: 'Оценки', rows: grades },
    { name: 'Зачёты', rows: credits },
  ];
  const csv = toCsv([
    ...overview,
    ['По предметам'],
    ...bySubject,
    [],
    ['История явки'],
    ...history,
  ]);
  return {
    filename: `uchenik-${slug}-${stamp}.xlsx`,
    csvFilename: `uchenik-${slug}-${stamp}.csv`,
    csv,
    sheets,
    rows: overview,
  };
}

function buildStudentWorkbook(studentId) {
  const file = exportStudentCard({ studentId });
  return rowsToXlsx(file.filename, file.sheets);
}

function attendanceMatrixRows(bundle) {
  const lessons = bundle.lessons || [];
  const header = ['Ученик', 'Группа', ...lessons.map((lesson) => `${lesson.date} · ${lesson.subjectName}`)];
  const body = bundle.students.map((student) => {
    const byLesson = new Map((student.history || []).map((item) => [item.lessonId, item]));
    return [
      student.fullName,
      student.groupName,
      ...lessons.map((lesson) => {
        if (lesson.groupId !== student.groupId) return '';
        return statusRu(byLesson.get(lesson.id)?.status || '');
      }),
    ];
  });
  return [header, ...body];
}

function sheetFromAoa(name, rows) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const widths = [];
  for (const row of rows.slice(0, 80)) {
    row.forEach((cell, index) => {
      const len = String(cell ?? '').length;
      widths[index] = Math.min(42, Math.max(widths[index] || 10, len + 2));
    });
  }
  sheet['!cols'] = widths.map((width) => ({ wch: width }));
  return { name: name.slice(0, 31), sheet };
}

function buildWorkbook({ groupId, subjectId } = {}) {
  const settings = getSettings();
  const bundle = attendanceBundle({ groupId, subjectId });
  const attendance = exportAttendance({ groupId, subjectId });
  const grades = exportGrades({ groupId, subjectId });
  const credits = exportCredits({ groupId, subjectId });
  const summary = exportSummary({ groupId, subjectId });
  const overview = [
    ['Заведение', settings.institutionName],
    ['Подзаголовок', settings.institutionSubtitle],
    ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
    ['Общая явка %', bundle.totals.rate == null ? '' : String(bundle.totals.rate).replace('.', ',')],
    ['Учеников', bundle.students.length],
    ['Занятий', bundle.lessons.length],
    ['Был', bundle.totals.present],
    ['Опоздал', bundle.totals.late],
    ['Уваж.', bundle.totals.excused || 0],
    ['Не был', bundle.totals.absent],
    ['Не отмечен', bundle.totals.unmarked],
  ];
  const roster = exportRoster({ groupId });
  const subjects = exportSubjectsList({ groupId });
  const schedule = exportSchedule({ groupId });
  const sheets = [
    sheetFromAoa('Обзор', overview),
    sheetFromAoa('Сводка', summary.rows || summary.csv.split('\r\n').map((line) => line.split(';'))),
    sheetFromAoa('Ученики', [
      ['Ученик', 'Группа', 'Занятий', 'Был', 'Опоздал', 'Уваж.', 'Не был', 'Пусто', '%', 'Уровень'],
      ...bundle.students.map((row) => [
        row.fullName, row.groupName, row.total, row.present, row.late, row.excused || 0, row.absent, row.unmarked,
        row.rate == null ? '' : String(row.rate).replace('.', ','), levelRu(row.level),
      ]),
    ]),
    sheetFromAoa('Список', roster.rows || [['Нет данных']]),
    sheetFromAoa('Матрица явки', attendanceMatrixRows(bundle)),
    sheetFromAoa('Детализация', attendance.detailRows || [['Нет данных']]),
    sheetFromAoa('Оценки', grades.rows || [['Нет данных']]),
    sheetFromAoa('Зачёты', credits.rows || [['Нет данных']]),
    sheetFromAoa('Предметы', subjects.rows || [['Нет данных']]),
    sheetFromAoa('Расписание', schedule.rows || [['Нет данных']]),
  ];
  const wb = XLSX.utils.book_new();
  for (const item of sheets) XLSX.utils.book_append_sheet(wb, item.sheet, item.name);
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const stamp = new Date().toISOString().slice(0, 10);
  const scope = groupId ? `group-${groupId}` : (subjectId ? `subject-${subjectId}` : 'all');
  return {
    filename: `zhurnal-${scope}-${stamp}.xlsx`,
    buffer,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

function rowsToXlsx(filename, sheets) {
  const wb = XLSX.utils.book_new();
  for (const item of sheets) {
    const built = sheetFromAoa(item.name, item.rows);
    XLSX.utils.book_append_sheet(wb, built.sheet, built.name);
  }
  return {
    filename,
    buffer: XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

function sendCsv(res, filename, csv) {
  const safe = filename.replace(/[^\w.\-а-яА-ЯёЁ]+/gi, '_');
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(`\uFEFF${csv}`);
}

function sendBinary(res, filename, buffer, contentType) {
  const safe = filename.replace(/[^\w.\-а-яА-ЯёЁ]+/gi, '_');
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(buffer),
  });
  res.end(buffer);
}

function findSubjectInGroup(groupId, name) {
  const key = normalizeSubjectKey(name);
  if (!key) return null;
  const byKey = db.prepare(`
    SELECT id, name, group_id AS groupId, norm_key AS normKey
    FROM subjects WHERE group_id = ? AND norm_key = ?
  `).get(groupId, key);
  if (byKey) return byKey;
  const exact = db.prepare('SELECT id, name, group_id AS groupId, norm_key AS normKey FROM subjects WHERE group_id = ? AND name = ?')
    .get(groupId, name);
  if (exact) return exact;
  const rows = db.prepare('SELECT id, name, group_id AS groupId, norm_key AS normKey FROM subjects WHERE group_id = ?').all(groupId);
  return rows.find((row) => normalizeSubjectKey(row.name) === key) || null;
}

function ensureSubject(groupId, name) {
  const subjectName = cleanText(name, 'предмет', 200);
  const key = normalizeSubjectKey(subjectName);
  if (!key) fail(400, 'Укажите предмет');
  const existing = findSubjectInGroup(groupId, subjectName);
  if (existing) {
    if (!existing.normKey || existing.normKey !== key) {
      db.prepare('UPDATE subjects SET norm_key = ? WHERE id = ?').run(key, existing.id);
    }
    return existing;
  }
  try {
    const info = db.prepare('INSERT INTO subjects (name, group_id, created_at, norm_key) VALUES (?, ?, ?, ?)')
      .run(subjectName, groupId, Date.now(), key);
    return { id: Number(info.lastInsertRowid), name: subjectName, groupId, normKey: key };
  } catch (error) {
    if (String(error.code || '').startsWith('SQLITE_CONSTRAINT')) {
      const again = findSubjectInGroup(groupId, subjectName);
      if (again) return again;
    }
    throw error;
  }
}

function listSubjectDuplicates(groupId) {
  let rows;
  if (groupId) {
    requireGroup(groupId);
    rows = db.prepare(`
      SELECT s.id, s.name, s.group_id AS groupId, g.name AS groupName, s.norm_key AS normKey
      FROM subjects s JOIN groups g ON g.id = s.group_id
      WHERE s.group_id = ?
      ORDER BY s.name COLLATE NOCASE
    `).all(parseId(groupId));
  } else {
    rows = db.prepare(`
      SELECT s.id, s.name, s.group_id AS groupId, g.name AS groupName, s.norm_key AS normKey
      FROM subjects s JOIN groups g ON g.id = s.group_id
      ORDER BY g.name, s.name COLLATE NOCASE
    `).all();
  }
  const buckets = new Map();
  for (const row of rows) {
    const key = `${row.groupId}|${row.normKey || normalizeSubjectKey(row.name)}`;
    const list = buckets.get(key) || [];
    list.push(row);
    buckets.set(key, list);
  }
  const clusters = [];
  for (const list of buckets.values()) {
    if (list.length < 2) continue;
    clusters.push({
      key: list[0].normKey || normalizeSubjectKey(list[0].name),
      groupId: list[0].groupId,
      groupName: list[0].groupName,
      subjects: list,
    });
  }
  return { clusters, count: clusters.length };
}

function subjectActivityScore(id, name, groupId) {
  const lessons = db.prepare('SELECT COUNT(*) AS c FROM lessons WHERE subject_id = ?').get(id).c;
  const credits = db.prepare('SELECT COUNT(*) AS c FROM credits WHERE subject_id = ?').get(id).c;
  const works = db.prepare('SELECT COUNT(*) AS c FROM works WHERE subject_id = ?').get(id).c;
  const key = normalizeSubjectKey(name);
  const schedule = db.prepare('SELECT subject_name FROM schedule_entries WHERE group_id = ?').all(groupId)
    .filter((row) => normalizeSubjectKey(row.subject_name) === key).length;
  return lessons * 1000 + credits * 100 + works * 100 + schedule * 10 + String(name || '').length;
}

function pickCanonicalSubjectName(subjects) {
  return [...subjects].sort((a, b) => {
    const la = String(a.name || '').length;
    const lb = String(b.name || '').length;
    if (lb !== la) return lb - la;
    return a.id - b.id;
  })[0].name;
}

function rewriteScheduleSubjectNames(groupId, fromNames, toName) {
  const keys = new Set([normalizeSubjectKey(toName), ...fromNames.map(normalizeSubjectKey)].filter(Boolean));
  const rows = db.prepare('SELECT id, subject_name FROM schedule_entries WHERE group_id = ?').all(groupId);
  const update = db.prepare('UPDATE schedule_entries SET subject_name = ? WHERE id = ?');
  for (const row of rows) {
    if (keys.has(normalizeSubjectKey(row.subject_name))) update.run(toName, row.id);
  }
}

function mergeSubjects(keepId, mergeIds, options = {}) {
  const keep = requireSubject(keepId);
  const ids = [...new Set((mergeIds || []).map(parseId))].filter((id) => id !== keep.id);
  if (!ids.length) fail(400, 'Укажите предметы для объединения');
  const names = [keep.name];
  const tx = db.transaction(() => {
    for (const id of ids) {
      const other = requireSubject(id);
      if (other.groupId !== keep.groupId) fail(400, 'Можно объединять только предметы одной группы');
      names.push(other.name);
      db.prepare('UPDATE lessons SET subject_id = ? WHERE subject_id = ?').run(keep.id, id);
      db.prepare('UPDATE credits SET subject_id = ? WHERE subject_id = ?').run(keep.id, id);
      db.prepare('UPDATE works SET subject_id = ? WHERE subject_id = ?').run(keep.id, id);
      db.prepare('DELETE FROM subjects WHERE id = ?').run(id);
    }
    const finalName = options.canonicalName || pickCanonicalSubjectName(
      names.map((name, index) => ({ id: index === 0 ? keep.id : ids[index - 1] || keep.id, name })),
    );
    const key = normalizeSubjectKey(finalName);
    db.prepare('UPDATE subjects SET name = ?, norm_key = ? WHERE id = ?').run(finalName, key, keep.id);
    rewriteScheduleSubjectNames(keep.groupId, names, finalName);
  });
  tx();
  return { ok: true, keepId: keep.id, merged: ids.length, name: requireSubject(keep.id).name };
}

function autoMergeSubjectDuplicates(groupId) {
  const { clusters } = listSubjectDuplicates(groupId);
  let merged = 0;
  for (const cluster of clusters) {
    const scored = cluster.subjects
      .map((subject) => ({ ...subject, score: subjectActivityScore(subject.id, subject.name, subject.groupId) }))
      .sort((a, b) => b.score - a.score || a.id - b.id);
    const keep = scored[0];
    const rest = scored.slice(1);
    if (!rest.length) continue;
    const canonicalName = pickCanonicalSubjectName(cluster.subjects);
    mergeSubjects(keep.id, rest.map((s) => s.id), { canonicalName });
    merged += rest.length;
  }
  return { clusters: clusters.length, merged };
}

function cleanupOrphanSubjects() {
  const dedupe = autoMergeSubjectDuplicates();
  const subjects = db.prepare('SELECT id, name, group_id AS groupId FROM subjects').all();
  const scheduleKeys = new Map();
  for (const row of db.prepare('SELECT group_id, subject_name FROM schedule_entries').all()) {
    if (!row.group_id) continue;
    const set = scheduleKeys.get(row.group_id) || new Set();
    set.add(normalizeSubjectKey(row.subject_name));
    scheduleKeys.set(row.group_id, set);
  }
  let removed = 0;
  const del = db.prepare('DELETE FROM subjects WHERE id = ?');
  for (const subject of subjects) {
    const used = db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM lessons WHERE subject_id = ?) +
        (SELECT COUNT(*) FROM credits WHERE subject_id = ?) +
        (SELECT COUNT(*) FROM works WHERE subject_id = ?) AS c
    `).get(subject.id, subject.id, subject.id).c;
    if (used) continue;
    const keys = scheduleKeys.get(subject.groupId);
    if (keys?.has(normalizeSubjectKey(subject.name))) continue;
    del.run(subject.id);
    removed += 1;
  }
  return { removed, deduped: dedupe.merged, clusters: dedupe.clusters };
}

function clearScheduleForGroup(groupId, weekType) {
  const group = requireGroup(groupId);
  if (weekType && weekType !== 'all') {
    if (!['upper', 'lower'].includes(weekType)) fail(400, 'Укажите upper или lower');
    const result = db.prepare(`
      DELETE FROM schedule_entries WHERE group_id = ? AND week_type = ?
    `).run(group.id, weekType);
    return { removed: result.changes, groupId: group.id, weekType };
  }
  const result = db.prepare('DELETE FROM schedule_entries WHERE group_id = ?').run(group.id);
  return { removed: result.changes, groupId: group.id, weekType: 'all' };
}

function copyScheduleWeek(groupId, fromWeekType, toWeekType) {
  const group = requireGroup(groupId);
  if (!['upper', 'lower'].includes(fromWeekType) || !['upper', 'lower'].includes(toWeekType)) {
    fail(400, 'Копирование только между верхней и нижней неделей');
  }
  if (fromWeekType === toWeekType) fail(400, 'Укажите разные типы недели');
  const source = db.prepare(`
    SELECT * FROM schedule_entries WHERE group_id = ? AND (week_type = ? OR week_type = 'all')
  `).all(group.id, fromWeekType);
  const insert = db.prepare(`
    INSERT INTO schedule_entries (
      group_code, group_id, week_type, weekday, pair_num, time_start, time_end,
      subject_name, lesson_kind, teacher, room, raw_text, source_sheet, created_at,
      slot_key, locked, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  let copied = 0;
  const now = Date.now();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM schedule_entries WHERE group_id = ? AND week_type = ? AND locked = 0').run(group.id, toWeekType);
    for (const row of source) {
      if (findScheduleDuplicate({
        groupId: group.id,
        weekType: toWeekType,
        weekday: row.weekday,
        pairNum: row.pair_num,
        subjectName: row.subject_name,
      })) continue;
      const slotKey = makeSlotKey(group.id, toWeekType, row.weekday, row.pair_num);
      insert.run(
        row.group_code, group.id, toWeekType, row.weekday, row.pair_num,
        row.time_start, row.time_end, row.subject_name, row.lesson_kind,
        row.teacher, row.room, row.raw_text, 'copy', now,
        slotKey, row.locked ? 1 : 0, now,
      );
      ensureSubject(group.id, row.subject_name);
      copied += 1;
    }
  });
  tx();
  return { copied, fromWeekType, toWeekType, groupId: group.id };
}

const WEEKDAY_NAMES = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const WEEK_TYPE_NAMES = { upper: 'Верхняя', lower: 'Нижняя', all: 'Каждая' };

function mapScheduleRow(row) {
  const slotKey = row.slot_key || (row.group_id
    ? makeSlotKey(row.group_id, row.week_type, row.weekday, row.pair_num)
    : '');
  return {
    id: row.id,
    groupId: row.group_id,
    groupCode: row.group_code,
    groupName: row.groupName || null,
    weekType: row.week_type,
    weekIndex: row.week_index ?? null,
    planId: row.plan_id ?? null,
    planWeekId: row.plan_week_id ?? null,
    appliesAllWeeks: row.applies_all_weeks === 1,
    weekday: row.weekday,
    weekdayName: WEEKDAY_NAMES[row.weekday] || String(row.weekday),
    pairNum: row.pair_num,
    timeStart: row.time_start,
    timeEnd: row.time_end,
    subjectName: row.subject_name,
    lessonKind: row.lesson_kind,
    teacher: row.teacher,
    room: row.room,
    rawText: row.raw_text,
    sourceSheet: row.source_sheet,
    sourceCell: row.source_cell || '',
    slotKey,
    locked: row.locked === 1,
    updatedAt: row.updated_at || row.created_at || null,
    fields: {
      subjectName: row.subject_name || '',
      lessonKind: row.lesson_kind || '',
      teacher: row.teacher || '',
      room: row.room || '',
      timeStart: row.time_start || '',
      timeEnd: row.time_end || '',
    },
  };
}

function listScheduleEntries({ groupId, weekType } = {}) {
  let sql = `
    SELECT e.*, g.name AS groupName
    FROM schedule_entries e
    LEFT JOIN groups g ON g.id = e.group_id
    WHERE 1=1
  `;
  const params = [];
  if (groupId) {
    sql += ' AND e.group_id = ?';
    params.push(parseId(groupId));
  }
  if (weekType && weekType !== 'all') {
    sql += " AND (e.week_type = ? OR e.week_type = 'all')";
    params.push(weekType);
  }
  sql += ' ORDER BY e.group_code, e.week_type, e.weekday, e.pair_num, e.id';
  return db.prepare(sql).all(...params).map(mapScheduleRow);
}

function findScheduleDuplicate({ groupId, weekType, weekday, pairNum, subjectName, excludeId }) {
  const key = normalizeSubjectKey(subjectName);
  const rows = db.prepare(`
    SELECT * FROM schedule_entries
    WHERE group_id = ? AND week_type = ? AND weekday = ? AND pair_num = ?
  `).all(groupId, weekType, weekday, pairNum);
  const others = rows.filter((row) => !(excludeId && row.id === excludeId));
  if (!others.length) return null;
  // одна пара на слот; также ловим точный дубль предмета
  return others.find((row) => normalizeSubjectKey(row.subject_name) === key) || others[0];
}

function parseScheduleBody(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.groupId != null) {
    const group = requireGroup(body.groupId);
    out.groupId = group.id;
    out.groupCode = normalizeGroupCode(body.groupCode || group.schedule_code || group.name)
      || normalizeGroupCode(group.name)
      || cleanText(group.name, 'код группы', 40);
  }
  if (!partial || body.weekType != null) {
    const weekType = String(body.weekType || 'all');
    if (!['upper', 'lower', 'all'].includes(weekType)) fail(400, 'Тип недели: upper, lower или all');
    out.weekType = weekType;
  }
  if (!partial || body.weekday != null) {
    const weekday = Number(body.weekday);
    if (!Number.isInteger(weekday) || weekday < 1 || weekday > 6) fail(400, 'День недели — число от 1 до 6');
    out.weekday = weekday;
  }
  if (!partial || body.pairNum != null) {
    const pairNum = Number(body.pairNum);
    if (!Number.isInteger(pairNum) || pairNum < 1 || pairNum > 12) fail(400, 'Номер пары от 1 до 12');
    out.pairNum = pairNum;
  }
  if (!partial || body.subjectName != null) {
    out.subjectName = cleanText(body.subjectName, 'предмет', 200);
  }
  if (!partial || body.timeStart != null) out.timeStart = String(body.timeStart || '').trim().slice(0, 8);
  if (!partial || body.timeEnd != null) out.timeEnd = String(body.timeEnd || '').trim().slice(0, 8);
  if (!partial || body.lessonKind != null) out.lessonKind = String(body.lessonKind || '').trim().slice(0, 80);
  if (!partial || body.teacher != null || body.room != null) {
    const rawTeacher = body.teacher != null ? String(body.teacher || '').trim() : '';
    const rawRoom = body.room != null ? String(body.room || '').trim() : '';
    if (body.teacher != null) {
      const split = splitTeacherAndRoom(rawTeacher);
      out.teacher = split.teacher.slice(0, 120);
      if (!rawRoom && split.room) out.room = split.room.slice(0, 80);
    }
    if (body.room != null && rawRoom) out.room = rawRoom.slice(0, 80);
    else if (body.room != null && !out.room) out.room = '';
  }
  if (!partial || body.rawText != null) out.rawText = String(body.rawText || '').trim().slice(0, 500);
  return out;
}

function createScheduleEntry(body) {
  const data = parseScheduleBody(body);
  if (findScheduleDuplicate(data)) fail(400, 'Этот слот уже занят (день · номер пары). Измените существующую пару.');
  ensureSubject(data.groupId, data.subjectName);
  const now = Date.now();
  const slotKey = makeSlotKey(data.groupId, data.weekType, data.weekday, data.pairNum);
  const locked = body.locked ? 1 : 0;
  const info = db.prepare(`
    INSERT INTO schedule_entries (
      group_code, group_id, week_type, weekday, pair_num, time_start, time_end,
      subject_name, lesson_kind, teacher, room, raw_text, source_sheet, created_at,
      slot_key, locked, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    data.groupCode, data.groupId, data.weekType, data.weekday, data.pairNum,
    data.timeStart || '', data.timeEnd || '', data.subjectName, data.lessonKind || '',
    data.teacher || '', data.room || '', data.rawText || data.subjectName, 'manual', now,
    slotKey, locked, now,
  );
  const row = db.prepare(`
    SELECT e.*, g.name AS groupName FROM schedule_entries e
    LEFT JOIN groups g ON g.id = e.group_id WHERE e.id = ?
  `).get(Number(info.lastInsertRowid));
  return mapScheduleRow(row);
}

function updateScheduleEntry(id, body) {
  const existing = db.prepare('SELECT * FROM schedule_entries WHERE id = ?').get(parseId(id));
  if (!existing) fail(404, 'Пара не найдена');
  const patch = parseScheduleBody({
    groupId: body.groupId ?? existing.group_id,
    groupCode: body.groupCode ?? existing.group_code,
    weekType: body.weekType ?? existing.week_type,
    weekday: body.weekday ?? existing.weekday,
    pairNum: body.pairNum ?? existing.pair_num,
    subjectName: body.subjectName ?? existing.subject_name,
    timeStart: body.timeStart ?? existing.time_start,
    timeEnd: body.timeEnd ?? existing.time_end,
    lessonKind: body.lessonKind ?? existing.lesson_kind,
    teacher: body.teacher ?? existing.teacher,
    room: body.room ?? existing.room,
    rawText: body.rawText ?? existing.raw_text,
  });
  if (findScheduleDuplicate({ ...patch, excludeId: existing.id })) {
    fail(400, 'Этот слот уже занят (день · номер пары). Измените существующую пару.');
  }
  ensureSubject(patch.groupId, patch.subjectName);
  const slotKey = makeSlotKey(patch.groupId, patch.weekType, patch.weekday, patch.pairNum);
  const locked = body.locked == null ? existing.locked : (body.locked ? 1 : 0);
  const now = Date.now();
  db.prepare(`
    UPDATE schedule_entries SET
      group_code = ?, group_id = ?, week_type = ?, weekday = ?, pair_num = ?,
      time_start = ?, time_end = ?, subject_name = ?, lesson_kind = ?,
      teacher = ?, room = ?, raw_text = ?, slot_key = ?, locked = ?, updated_at = ?
    WHERE id = ?
  `).run(
    patch.groupCode, patch.groupId, patch.weekType, patch.weekday, patch.pairNum,
    patch.timeStart || '', patch.timeEnd || '', patch.subjectName, patch.lessonKind || '',
    patch.teacher || '', patch.room || '', patch.rawText || patch.subjectName,
    slotKey, locked, now,
    existing.id,
  );
  const row = db.prepare(`
    SELECT e.*, g.name AS groupName FROM schedule_entries e
    LEFT JOIN groups g ON g.id = e.group_id WHERE e.id = ?
  `).get(existing.id);
  return mapScheduleRow(row);
}

function deleteScheduleEntry(id) {
  const existing = db.prepare('SELECT id FROM schedule_entries WHERE id = ?').get(parseId(id));
  if (!existing) fail(404, 'Пара не найдена');
  db.prepare('DELETE FROM schedule_entries WHERE id = ?').run(existing.id);
  return { ok: true };
}

function exportSchedule({ groupId } = {}) {
  const rows = listScheduleEntries({ groupId });
  const table = [
    ['Группа', 'Код', 'Неделя', 'День', 'Пара', 'Начало', 'Конец', 'Предмет', 'Вид', 'Преподаватель', 'Аудитория'],
    ...rows.map((row) => [
      row.groupName || '',
      row.groupCode,
      WEEK_TYPE_NAMES[row.weekType] || row.weekType,
      row.weekdayName,
      row.pairNum,
      row.timeStart,
      row.timeEnd,
      row.subjectName,
      row.lessonKind,
      row.teacher,
      row.room,
    ]),
  ];
  const suffix = groupId ? `-group-${groupId}` : '';
  return { filename: `raspisanie${suffix}.csv`, csv: toCsv(table), rows: table };
}

function currentEntriesAsImportShape() {
  return db.prepare('SELECT * FROM schedule_entries').all().map((row) => ({
    ...rowToScheduleEntry(row),
    groupCode: normalizeGroupCode(row.group_code) || row.group_code,
  }));
}

async function previewScheduleImport(urls, { groupId = null } = {}) {
  const { entries, sources } = await importFromUrls(urls);
  const groups = db.prepare(`
    SELECT id, name, schedule_code, schedule_aliases FROM groups
  `).all().filter((group) => !groupId || group.id === Number(groupId));
  const byCode = buildCodeToGroupId(groups);
  const relevant = entries.filter((entry) => {
    const code = normalizeGroupCode(entry.groupCode) || entry.groupCode;
    return byCode.has(code);
  });
  const knownCodes = new Set(byCode.keys());
  const current = currentEntriesAsImportShape().filter((entry) => {
    if (groupId) return Number(entry.groupId) === Number(groupId);
    const code = normalizeGroupCode(entry.groupCode);
    return knownCodes.has(code) || (entry.groupId && groups.some((g) => g.id === entry.groupId));
  });
  const diff = diffSchedule(current, relevant.map((entry) => {
    const code = normalizeGroupCode(entry.groupCode) || entry.groupCode;
    const gid = byCode.get(code);
    const primary = groups.find((g) => g.id === gid);
    return {
      ...entry,
      groupCode: normalizeGroupCode(primary?.schedule_code || primary?.name) || entry.groupCode,
      groupId: gid,
    };
  }));
  const codes = summarizeScheduleCodes(entries);
  return {
    sources,
    totalParsed: entries.length,
    matchedEntries: relevant.length,
    matchedGroups: new Set(relevant.map((e) => byCode.get(normalizeGroupCode(e.groupCode) || e.groupCode))).size,
    codes,
    linkedCodes: codes.filter((row) => byCode.has(row.code)),
    unlinkedCodes: codes.filter((row) => !byCode.has(row.code)),
    weekTypeToday: weekTypeForDate(todayISO()),
    fields: SCHEDULE_FIELDS,
    ...diff,
    sampleAdded: diff.added.slice(0, 12),
    sampleRemoved: diff.removed.slice(0, 12),
    sampleChanged: diff.changed.slice(0, 12).map((item) => ({
      ...item,
      fields: item.fields || fieldDiff(item.from, item.to),
    })),
    sampleLocked: (diff.lockedSkipped || []).slice(0, 8),
  };
}

async function importScheduleForGroup(groupId, { persistUrl = false, urls } = {}) {
  const scopeGroupId = parseId(groupId);
  const resolved = resolveScheduleUrlsForImport({
    groupId: scopeGroupId,
    urls: Array.isArray(urls) && urls.length ? urls : undefined,
  });
  const { entries, sources } = await importFromUrls(resolved);
  const before = currentEntriesAsImportShape().filter((e) => Number(e.groupId) === scopeGroupId);
  const groups = db.prepare(`
    SELECT id, name, schedule_code, schedule_aliases FROM groups WHERE id = ?
  `).all(scopeGroupId);
  const byCode = buildCodeToGroupId(groups);
  const primaryById = new Map(groups.map((group) => [
    group.id,
    normalizeGroupCode(group.schedule_code || group.name) || group.schedule_code || '',
  ]));
  const relevant = entries
    .filter((e) => byCode.has(normalizeGroupCode(e.groupCode) || e.groupCode))
    .map((entry) => {
      const code = normalizeGroupCode(entry.groupCode) || entry.groupCode;
      const gid = byCode.get(code);
      return {
        ...entry,
        groupId: gid,
        groupCode: primaryById.get(gid) || code,
      };
    });
  const diff = diffSchedule(before, relevant);
  const saved = saveScheduleEntries(entries, { groupId: scopeGroupId });
  const dedupe = autoMergeSubjectDuplicates(scopeGroupId);
  if (persistUrl) {
    const codes = groupScheduleCodes(groups[0] || {});
    const bestUrl = pickUrlForGroupCode(sources, codes) || (relevant.length ? relevant[0].sourceUrl : '') || '';
    if (bestUrl) {
      db.prepare('UPDATE groups SET schedule_url = ? WHERE id = ?').run(bestUrl, scopeGroupId);
    }
  }
  markGroupScheduleSync(scopeGroupId, { error: '' });
  return {
    saved,
    sources,
    totalParsed: entries.length,
    matchedEntries: relevant.length,
    dedupedSubjects: dedupe.merged,
    groupId: scopeGroupId,
    urls: resolved,
    boundUrl: persistUrl
      ? (pickUrlForGroupCode(sources, groupScheduleCodes(groups[0] || {})) || null)
      : null,
    diff: {
      addedCount: diff.addedCount,
      removedCount: diff.removedCount,
      changedCount: diff.changedCount,
      keptCount: diff.keptCount,
      lockedCount: diff.lockedCount || 0,
    },
  };
}

async function syncOneGroupFromExcel(group, { force = false } = {}) {
  const urls = resolveScheduleUrlsForImport({ groupId: group.id });
  const preview = await previewScheduleImport(urls, { groupId: group.id });
  const changed = !!(preview.addedCount || preview.removedCount || preview.changedCount);
  if (!changed && !force) {
    markGroupScheduleSync(group.id, { error: '' });
    return {
      groupId: group.id,
      groupName: group.name,
      ok: true,
      changed: false,
      matchedEntries: preview.matchedEntries || 0,
      diff: {
        addedCount: 0,
        removedCount: 0,
        changedCount: 0,
        keptCount: preview.keptCount || 0,
        lockedCount: preview.lockedCount || 0,
      },
    };
  }
  const result = await importScheduleForGroup(group.id, { urls });
  return {
    groupId: group.id,
    groupName: group.name,
    ok: true,
    changed: true,
    matchedEntries: result.matchedEntries,
    saved: result.saved,
    diff: result.diff,
  };
}

function boundGroupsForSync({ groupId = null } = {}) {
  const rows = db.prepare(`
    SELECT id, name, schedule_code, schedule_url, schedule_aliases,
      schedule_synced_at, schedule_sync_error
    FROM groups
    WHERE IFNULL(schedule_code, '') != ''
  `).all();
  const globalUrls = getSettings().scheduleUrls || [];
  return rows.filter((group) => {
    if (groupId && Number(group.id) !== Number(groupId)) return false;
    return !!(group.schedule_url || globalUrls.length);
  });
}

async function runScheduleAutoSync({ groupId = null, force = false, reason = 'timer' } = {}) {
  const settings = getSettings();
  if (!settings.excelEnabled) {
    return { skipped: true, reason: 'excel-off', groups: [] };
  }
  if (scheduleSyncState.running) {
    return { skipped: true, reason: 'busy', ...scheduleSyncState };
  }
  scheduleSyncState.running = true;
  scheduleSyncState.lastStartedAt = Date.now();
  scheduleSyncState.lastError = '';
  const groups = boundGroupsForSync({ groupId });
  const results = [];
  try {
    for (const group of groups) {
      try {
        const row = await syncOneGroupFromExcel(group, { force });
        results.push(row);
      } catch (error) {
        const message = error?.message || String(error);
        markGroupScheduleSync(group.id, { error: message });
        results.push({
          groupId: group.id,
          groupName: group.name,
          ok: false,
          error: message,
        });
      }
    }
    const summary = {
      reason,
      at: Date.now(),
      groups: results.length,
      ok: results.filter((row) => row.ok).length,
      failed: results.filter((row) => !row.ok).length,
      updated: results.filter((row) => row.changed).length,
      results,
    };
    scheduleSyncState.lastFinishedAt = Date.now();
    scheduleSyncState.lastResult = summary;
    return summary;
  } catch (error) {
    scheduleSyncState.lastError = error?.message || String(error);
    scheduleSyncState.lastFinishedAt = Date.now();
    throw error;
  } finally {
    scheduleSyncState.running = false;
  }
}

let scheduleAutoSyncTimer = null;
let scheduleAutoSyncStartup = null;
let scheduleAutoSyncBooted = false;

function restartScheduleAutoSyncTimer() {
  if (scheduleAutoSyncTimer) {
    clearInterval(scheduleAutoSyncTimer);
    scheduleAutoSyncTimer = null;
  }
  const settings = getSettings();
  if (!settings.excelEnabled || !settings.scheduleAutoSync) return;
  const ms = Math.max(60_000, (settings.scheduleAutoSyncMinutes || 5) * 60_000);
  scheduleAutoSyncTimer = setInterval(() => {
    runScheduleAutoSync({ reason: 'timer' }).catch((error) => {
      console.warn('Автосверка Excel:', error.message);
    });
  }, ms);
  if (!scheduleAutoSyncBooted) {
    scheduleAutoSyncBooted = true;
    if (scheduleAutoSyncStartup) clearTimeout(scheduleAutoSyncStartup);
    scheduleAutoSyncStartup = setTimeout(() => {
      if (!getSettings().excelEnabled || !getSettings().scheduleAutoSync) return;
      runScheduleAutoSync({ reason: 'startup' }).catch((error) => {
        console.warn('Стартовая сверка Excel:', error.message);
      });
    }, 15_000);
  }
}

function findOrCreateLessonFromPair({ groupId, date, entry }) {
  const subject = ensureSubject(groupId, entry.subject_name || entry.subjectName);
  const pairNum = Number(entry.pair_num ?? entry.pairNum);
  const existing = db.prepare(`
    SELECT id FROM lessons
    WHERE subject_id = ? AND lesson_date = ? AND IFNULL(pair_num, -1) = ?
  `).get(subject.id, date, pairNum);
  if (existing) {
    return { lessonId: existing.id, subjectId: subject.id, created: false };
  }
  const topic = [
    entry.lesson_kind || entry.lessonKind || '',
    entry.teacher ? `преп. ${entry.teacher}` : '',
    entry.room ? `ауд. ${entry.room}` : '',
  ].filter(Boolean).join(' · ');
  const info = db.prepare(`
    INSERT INTO lessons (
      subject_id, lesson_date, topic, created_at,
      pair_num, time_start, time_end, teacher, room, week_type, schedule_entry_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    subject.id,
    date,
    topic,
    Date.now(),
    pairNum,
    entry.time_start || entry.timeStart || '',
    entry.time_end || entry.timeEnd || '',
    entry.teacher || '',
    entry.room || '',
    entry.week_type || entry.weekType || weekTypeForDate(date),
    entry.id || entry.schedule_entry_id || null,
  );
  return { lessonId: Number(info.lastInsertRowid), subjectId: subject.id, created: true };
}

function scheduleEntriesForDay(group, date) {
  const resolved = schedulePlans.resolveEntriesForDate(db, group, date);
  if (resolved.entries?.length || resolved.resolved?.empty === false) {
    return resolved.entries;
  }
  // Legacy fallback before plan weeks linked
  const weekType = weekTypeForDate(date);
  const weekday = weekdayOfDate(date);
  const full = loadGroupSchedule(group.id) || group;
  const codes = groupScheduleCodes(full);
  if (!codes.length) {
    return db.prepare(`
      SELECT * FROM schedule_entries
      WHERE group_id = ?
        AND weekday = ?
        AND (week_type = 'all' OR week_type = ?)
      ORDER BY pair_num ASC, time_start ASC, id ASC
    `).all(group.id, weekday, weekType);
  }
  const placeholders = codes.map(() => '?').join(',');
  return db.prepare(`
    SELECT * FROM schedule_entries
    WHERE weekday = ?
      AND (week_type = 'all' OR week_type = ?)
      AND (
        group_id = ?
        OR (group_id IS NULL AND group_code IN (${placeholders}))
      )
    ORDER BY pair_num ASC, time_start ASC, id ASC
  `).all(weekday, weekType, group.id, ...codes);
}

function scheduleDayMeta(group, date) {
  return schedulePlans.resolveEntriesForDate(db, group, date);
}

function calendarMonth(groupId, month) {
  const group = db.prepare('SELECT id, name, schedule_code FROM groups WHERE id = ?').get(parseId(groupId));
  if (!group) fail(404, 'Группа не найдена');
  if (!/^\d{4}-\d{2}$/.test(month)) fail(400, 'Укажите месяц YYYY-MM');
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const studentCount = db.prepare('SELECT COUNT(*) AS c FROM students WHERE group_id = ?').get(group.id).c;
  const days = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${month}-${String(day).padStart(2, '0')}`;
    const weekday = weekdayOfDate(iso);
    const dayMeta = scheduleDayMeta(group, iso);
    const weekType = dayMeta.weekLabel
      || dayMeta.resolved?.week?.legacy_code
      || weekTypeForDate(iso);
    const emptyPlan = dayMeta.resolved?.empty === true;
    const entries = weekday === 7 || emptyPlan ? [] : (dayMeta.entries || scheduleEntriesForDay(group, iso));
    const lessons = db.prepare(`
      SELECT l.id, l.pair_num AS pairNum,
        (SELECT COUNT(*) FROM attendance a WHERE a.lesson_id = l.id) AS marked,
        (SELECT COUNT(*) FROM attendance a WHERE a.lesson_id = l.id AND a.status IN ('present','late')) AS here,
        (SELECT COUNT(*) FROM attendance a WHERE a.lesson_id = l.id AND a.status = 'absent') AS absent
      FROM lessons l
      JOIN subjects s ON s.id = l.subject_id
      WHERE s.group_id = ? AND l.lesson_date = ?
    `).all(group.id, iso);
    const markedPairs = lessons.filter((row) => row.marked > 0).length;
    const lessonByPair = new Map(lessons.map((row) => [Number(row.pairNum), row]));
    const pairs = entries.map((entry) => {
      const lesson = lessonByPair.get(Number(entry.pair_num));
      return {
        pairNum: entry.pair_num,
        timeStart: entry.time_start,
        timeEnd: entry.time_end,
        subjectName: entry.subject_name,
        lessonKind: entry.lesson_kind,
        teacher: entry.teacher,
        room: entry.room,
        weekType: entry.week_type,
        marked: Boolean(lesson && lesson.marked > 0),
        here: lesson?.here || 0,
        absent: lesson?.absent || 0,
      };
    });
    days.push({
      date: iso,
      weekday,
      weekType,
      weekIndex: dayMeta.weekIndex ?? null,
      weekLabel: dayMeta.weekLabel || '',
      noSchedule: emptyPlan,
      pairCount: entries.length,
      markedPairs,
      studentCount,
      here: lessons.reduce((sum, row) => sum + row.here, 0),
      absent: lessons.reduce((sum, row) => sum + row.absent, 0),
      hasLessons: lessons.length > 0,
      pairs,
    });
  }
  return {
    group: { id: group.id, name: group.name, scheduleCode: group.schedule_code },
    plan: schedulePlans.loadPlanBundle(db, group.id).plan,
    month,
    days,
  };
}

function calendarDay(groupId, date) {
  cleanDate(date);
  const group = db.prepare('SELECT id, name, schedule_code FROM groups WHERE id = ?').get(parseId(groupId));
  if (!group) fail(404, 'Группа не найдена');
  const students = db.prepare(`
    SELECT id, full_name AS fullName FROM students WHERE group_id = ? ORDER BY full_name COLLATE NOCASE
  `).all(group.id);
  const dayMeta = scheduleDayMeta(group, date);
  const entries = dayMeta.resolved?.empty ? [] : (dayMeta.entries || scheduleEntriesForDay(group, date));
  const pairs = entries.map((entry) => {
    const subject = findSubjectInGroup(group.id, entry.subject_name);
    let lesson = null;
    if (subject) {
      lesson = db.prepare(`
        SELECT id, topic FROM lessons
        WHERE subject_id = ? AND lesson_date = ? AND IFNULL(pair_num, -1) = ?
      `).get(subject.id, date, entry.pair_num);
    }
    let marks = {};
    let stats = { marked: 0, present: 0, late: 0, absent: 0, excused: 0 };
    if (lesson) {
      const rows = db.prepare('SELECT student_id, status, comment FROM attendance WHERE lesson_id = ?').all(lesson.id);
      for (const row of rows) {
        marks[row.student_id] = markPayload(row.status, row.comment);
        stats.marked += 1;
        if (row.status === 'present') stats.present += 1;
        if (row.status === 'late') stats.late += 1;
        if (row.status === 'absent') stats.absent += 1;
        if (row.status === 'excused') stats.excused += 1;
      }
    }
    return {
      scheduleEntryId: entry.id,
      pairNum: entry.pair_num,
      timeStart: entry.time_start,
      timeEnd: entry.time_end,
      subjectName: entry.subject_name,
      lessonKind: entry.lesson_kind,
      teacher: entry.teacher,
      room: entry.room,
      weekType: entry.week_type,
      weekIndex: entry.week_index ?? dayMeta.weekIndex ?? null,
      changeStatus: entry.occurrence_status || null,
      subjectId: subject?.id || null,
      lessonId: lesson?.id || null,
      marks,
      stats,
      here: stats.present + stats.late,
      totalStudents: students.length,
    };
  });
  return {
    group: { id: group.id, name: group.name, scheduleCode: group.schedule_code },
    date,
    weekday: weekdayOfDate(date),
    weekType: dayMeta.weekLabel || dayMeta.resolved?.week?.legacy_code || weekTypeForDate(date),
    weekIndex: dayMeta.weekIndex ?? null,
    weekLabel: dayMeta.weekLabel || '',
    noSchedule: dayMeta.resolved?.empty === true,
    noScheduleReason: dayMeta.resolved?.reason || null,
    plan: dayMeta.plan || null,
    students,
    pairs,
  };
}

function saveScheduleEntries(entries, { groupId = null, replaceUnlocked = true } = {}) {
  const groups = db.prepare(`
    SELECT id, name, schedule_code, schedule_aliases FROM groups
  `).all().filter((group) => !groupId || group.id === Number(groupId));
  const byCode = buildCodeToGroupId(groups);
  const primaryById = new Map(groups.map((group) => [
    group.id,
    normalizeGroupCode(group.schedule_code || group.name) || group.schedule_code || '',
  ]));
  const scopeIds = new Set(
    groupId ? [Number(groupId)] : [...new Set([...byCode.values()])],
  );

  const insertEntry = db.prepare(`
    INSERT INTO schedule_entries (
      group_code, group_id, week_type, weekday, pair_num, time_start, time_end,
      subject_name, lesson_kind, teacher, room, raw_text, source_sheet, created_at,
      slot_key, locked, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);
  const updateEntry = db.prepare(`
    UPDATE schedule_entries SET
      group_code = ?, time_start = ?, time_end = ?, subject_name = ?, lesson_kind = ?,
      teacher = ?, room = ?, raw_text = ?, source_sheet = ?, slot_key = ?, updated_at = ?
    WHERE id = ? AND locked = 0
  `);
  const findBySlot = db.prepare(`
    SELECT * FROM schedule_entries
    WHERE group_id = ? AND week_type = ? AND weekday = ? AND pair_num = ?
  `);

  const now = Date.now();
  const stats = { saved: 0, inserted: 0, updated: 0, keptLocked: 0, removed: 0 };
  const incomingSlots = new Set();

  const tx = db.transaction((rows) => {
    for (const entry of rows) {
      const code = normalizeGroupCode(entry.groupCode) || entry.groupCode;
      const entryGroupId = byCode.get(code) || null;
      if (!entryGroupId || !scopeIds.has(entryGroupId)) continue;
      const storeCode = primaryById.get(entryGroupId) || code;
      const slotKey = makeSlotKey(entryGroupId, entry.weekType, entry.weekday, entry.pairNum);
      if (incomingSlots.has(slotKey)) continue;
      incomingSlots.add(slotKey);

      const existing = findBySlot.get(entryGroupId, entry.weekType, entry.weekday, entry.pairNum);
      if (existing) {
        if (existing.locked === 1) {
          stats.keptLocked += 1;
          continue;
        }
        updateEntry.run(
          storeCode, entry.timeStart || '', entry.timeEnd || '', entry.subjectName,
          entry.lessonKind || '', entry.teacher || '', entry.room || '',
          entry.rawText || entry.subjectName, entry.sourceSheet || 'import',
          slotKey, now, existing.id,
        );
        ensureSubject(entryGroupId, entry.subjectName);
        stats.updated += 1;
        stats.saved += 1;
        continue;
      }

      insertEntry.run(
        storeCode, entryGroupId, entry.weekType, entry.weekday, entry.pairNum,
        entry.timeStart || '', entry.timeEnd || '', entry.subjectName, entry.lessonKind || '',
        entry.teacher || '', entry.room || '', entry.rawText || entry.subjectName,
        entry.sourceSheet || 'import', now, slotKey, now,
      );
      ensureSubject(entryGroupId, entry.subjectName);
      stats.inserted += 1;
      stats.saved += 1;
    }

    if (replaceUnlocked) {
      for (const gid of scopeIds) {
        const current = db.prepare(`
          SELECT id, slot_key, locked, week_type, weekday, pair_num, group_id
          FROM schedule_entries WHERE group_id = ?
        `).all(gid);
        for (const row of current) {
          const key = row.slot_key || makeSlotKey(row.group_id, row.week_type, row.weekday, row.pair_num);
          if (incomingSlots.has(key)) continue;
          if (row.locked === 1) {
            stats.keptLocked += 1;
            continue;
          }
          db.prepare('DELETE FROM schedule_entries WHERE id = ?').run(row.id);
          stats.removed += 1;
        }
      }
    }
  });
  tx(entries);
  return stats.saved;
}

function saveDaySchedule({ groupId, weekType, weekday, pairs }) {
  const group = requireGroup(groupId);
  if (!['upper', 'lower', 'all'].includes(weekType)) fail(400, 'Тип недели: upper, lower или all');
  const day = Number(weekday);
  if (!Number.isInteger(day) || day < 1 || day > 6) fail(400, 'День недели — число от 1 до 6');
  if (!Array.isArray(pairs)) fail(400, 'Ожидается список пар');

  const groupCode = normalizeGroupCode(group.schedule_code || group.name)
    || normalizeGroupCode(group.name)
    || cleanText(group.name, 'код группы', 40);
  const now = Date.now();
  const keepIds = new Set();
  const result = { saved: 0, removed: 0, entries: [] };

  const tx = db.transaction(() => {
    for (const raw of pairs) {
      const pairNum = Number(raw.pairNum);
      if (!Number.isInteger(pairNum) || pairNum < 1 || pairNum > 12) continue;
      const subjectName = String(raw.subjectName || '').trim();
      if (!subjectName) continue;
      const data = parseScheduleBody({
        groupId: group.id,
        weekType,
        weekday: day,
        pairNum,
        subjectName,
        timeStart: raw.timeStart,
        timeEnd: raw.timeEnd,
        lessonKind: raw.lessonKind,
        teacher: raw.teacher,
        room: raw.room,
      });
      const slotKey = makeSlotKey(group.id, weekType, day, pairNum);
      const locked = raw.locked ? 1 : 0;
      const existing = db.prepare(`
        SELECT * FROM schedule_entries
        WHERE group_id = ? AND week_type = ? AND weekday = ? AND pair_num = ?
      `).get(group.id, weekType, day, pairNum);

      ensureSubject(group.id, data.subjectName);
      if (existing) {
        db.prepare(`
          UPDATE schedule_entries SET
            group_code = ?, time_start = ?, time_end = ?, subject_name = ?, lesson_kind = ?,
            teacher = ?, room = ?, raw_text = ?, slot_key = ?, locked = ?, updated_at = ?
          WHERE id = ?
        `).run(
          groupCode, data.timeStart || '', data.timeEnd || '', data.subjectName,
          data.lessonKind || '', data.teacher || '', data.room || '',
          data.subjectName, slotKey, locked, now, existing.id,
        );
        keepIds.add(existing.id);
      } else {
        const info = db.prepare(`
          INSERT INTO schedule_entries (
            group_code, group_id, week_type, weekday, pair_num, time_start, time_end,
            subject_name, lesson_kind, teacher, room, raw_text, source_sheet, created_at,
            slot_key, locked, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          groupCode, group.id, weekType, day, pairNum,
          data.timeStart || '', data.timeEnd || '', data.subjectName, data.lessonKind || '',
          data.teacher || '', data.room || '', data.subjectName, 'manual', now,
          slotKey, locked, now,
        );
        keepIds.add(Number(info.lastInsertRowid));
      }
      result.saved += 1;
    }

    const current = db.prepare(`
      SELECT id, locked FROM schedule_entries
      WHERE group_id = ? AND week_type = ? AND weekday = ?
    `).all(group.id, weekType, day);
    for (const row of current) {
      if (keepIds.has(row.id)) continue;
      if (row.locked === 1) continue;
      db.prepare('DELETE FROM schedule_entries WHERE id = ?').run(row.id);
      result.removed += 1;
    }
  });
  tx();

  result.entries = listScheduleEntries({ groupId: group.id, weekType })
    .filter((entry) => Number(entry.weekday) === day);
  return result;
}

function clearStudentOutsideGroup(studentId, groupId) {
  db.prepare(`
    DELETE FROM attendance
    WHERE student_id = ?
      AND lesson_id IN (
        SELECT l.id FROM lessons l
        JOIN subjects s ON s.id = l.subject_id
        WHERE s.group_id != ?
      )
  `).run(studentId, groupId);
  db.prepare(`
    DELETE FROM credit_results
    WHERE student_id = ?
      AND credit_id IN (
        SELECT c.id FROM credits c
        JOIN subjects s ON s.id = c.subject_id
        WHERE s.group_id != ?
      )
  `).run(studentId, groupId);
  db.prepare(`
    DELETE FROM grades
    WHERE student_id = ?
      AND work_id IN (
        SELECT w.id FROM works w
        JOIN subjects s ON s.id = w.subject_id
        WHERE s.group_id != ?
      )
  `).run(studentId, groupId);
}

async function readBody(req, { maxBytes = MAX_BODY } = {}) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) fail(413, 'Слишком большой запрос');
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    fail(400, 'Некорректный JSON');
  }
}

function send(res, code, payload) {
  res.writeHead(code, securityHeaders({
    'Content-Type': 'application/json; charset=utf-8',
  }));
  res.end(JSON.stringify(payload));
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

async function serveStatic(res, urlPath) {
  const raw = decodeURIComponent(urlPath);
  const rel = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
  const full = path.normalize(path.join(publicDir, rel));
  const relative = path.relative(publicDir, full);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Не найдено');
    return;
  }
  try {
    const data = await readFile(full);
    const ext = path.extname(full).toLowerCase();
    res.writeHead(200, securityHeaders({
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'no-cache',
      ...(ext === '.html' ? {
        'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; script-src 'self'; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
      } : {}),
    }));
    res.end(data);
  } catch {
    res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
    res.end('Не найдено');
  }
}

async function handleApi(req, res, path) {
  const method = req.method;

  if (method === 'GET' && path === '/api/hint') {
    const meta = publicMeta();
    send(res, 200, {
      institutionName: meta.institutionName,
      institutionSubtitle: meta.institutionSubtitle,
    });
    return;
  }

  if (method === 'POST' && path === '/api/login') {
    assertLoginAllowed(req);
    const body = await readBody(req);
    const username = String(body.username ?? body.login ?? body.email ?? '').trim().slice(0, 80);
    const password = String(body.password ?? '').slice(0, 200);
    if (!username || !password) fail(400, 'Введите логин (или email) и пароль');
    const userRow = findUserByLogin(username);
    if (!userRow || userRow.active !== 1 || !checkPassword(password, userRow.salt, userRow.password_hash)) {
      noteLoginFailure(req);
      fail(401, 'Неверный логин или пароль');
    }
    clearLoginFailures(req);
    db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
    if (IS_PROD && userRow.role === 'admin') {
      db.prepare('DELETE FROM sessions WHERE user_id = ? OR user_id IS NULL').run(userRow.id);
    }
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token, expires_at, user_id) VALUES (?, ?, ?)').run(token, Date.now() + SESSION_MS, userRow.id);
    const user = mapUser(userRow);
    writeAudit(user, {
      action: 'auth.login',
      entity: 'user',
      entityId: user.id,
      summary: `Вход: ${user.displayName || user.username}`,
    }, req);
    send(res, 200, {
      token,
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      roleLabel: user.roleLabel,
      mustChange: user.mustChange,
      groupIds: user.groupIds,
      permissions: user.permissions,
      studentId: user.studentId,
      teacherId: user.teacherId,
    });
    return;
  }

  const auth = requireAuth(req);
  const token = auth.token;
  const user = auth.user;

  if (method === 'POST' && path === '/api/logout') {
    writeAudit(user, {
      action: 'auth.logout',
      entity: 'user',
      entityId: user.id,
      summary: `Выход: ${user.displayName || user.username}`,
    }, req);
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    send(res, 200, { ok: true });
    return;
  }

  if (method === 'GET' && path === '/api/audit') {
    if (user.role !== 'admin' && !hasPermission(user, 'users.manage')) {
      fail(403, 'Журнал изменений доступен администратору');
    }
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    send(res, 200, listAudit({
      limit: url.searchParams.get('limit') || 80,
      offset: url.searchParams.get('offset') || 0,
      q: String(url.searchParams.get('q') || '').trim().slice(0, 120),
      action: String(url.searchParams.get('action') || '').trim().slice(0, 80),
      userId: url.searchParams.get('userId') || null,
      groupId: url.searchParams.get('groupId') || null,
    }));
    return;
  }

  if (method === 'GET' && path === '/api/me') {
    const full = publicSettings();
    const settings = {
      ...full,
      telegramBotToken: '',
      telegramBotTokenSet: false,
      telegramAdminIds: hasPermission(user, 'settings.manage') ? full.telegramAdminIds : '',
      telegramBindings: hasPermission(user, 'settings.manage') ? full.telegramBindings : [],
      telegramSchedulePosts: hasPermission(user, 'settings.manage') ? full.telegramSchedulePosts : [],
      telegramStatus: hasPermission(user, 'settings.manage') ? full.telegramStatus : null,
      smtpPassSet: false,
      smtpUser: hasPermission(user, 'settings.manage') ? full.smtpUser : '',
      smtpHost: hasPermission(user, 'settings.manage') ? full.smtpHost : '',
      smtpPass: '',
    };
    let linkedStudent = null;
    let linkedTeacher = null;
    if (user.studentId) {
      const row = db.prepare(`
        SELECT s.id, s.full_name AS fullName, s.group_id AS groupId, g.name AS groupName,
          s.email, s.photo_path AS photoPath
        FROM students s JOIN groups g ON g.id = s.group_id WHERE s.id = ?
      `).get(user.studentId);
      if (row) linkedStudent = { ...row, photoUrl: photoUrl(row.photoPath) };
    }
    if (user.teacherId) {
      const row = db.prepare('SELECT * FROM teachers WHERE id = ?').get(user.teacherId);
      if (row) linkedTeacher = mapTeacherRow(row);
    }
    send(res, 200, {
      ...user,
      settings,
      permissionCatalog: permissionsCatalog(),
      linkedStudent,
      linkedTeacher,
    });
    return;
  }

  if (method === 'GET' && path === '/api/permissions') {
    assertPermission(user, 'users.manage');
    send(res, 200, permissionsCatalog());
    return;
  }

  if (method === 'GET' && path === '/api/settings') {
    assertPermission(user, 'settings.manage');
    send(res, 200, publicSettings());
    return;
  }

  if (method === 'PUT' && path === '/api/settings') {
    assertPermission(user, 'settings.manage');
    const body = await readBody(req);
    const next = setSettings(body);
    writeAudit(user, {
      action: 'settings.update',
      entity: 'settings',
      summary: 'Изменены настройки заведения',
      details: {
        institutionName: next.institutionName,
        excelEnabled: next.excelEnabled,
        gradesEnabled: next.gradesEnabled,
        smtpEnabled: next.smtpEnabled,
        scheduleAutoSync: next.scheduleAutoSync,
        telegramEnabled: next.telegramEnabled,
        telegramMultiMode: next.telegramMultiMode,
      },
    }, req);
    send(res, 200, publicSettings(next));
    return;
  }

  if (method === 'POST' && path === '/api/settings/smtp-test') {
    assertPermission(user, 'settings.manage');
    const body = await readBody(req);
    const settings = getSettings();
    const to = cleanEmail(body.to || user.email || settings.smtpFrom || settings.smtpUser);
    if (!to) fail(400, 'Укажите email для проверки');
    if (!smtpConfigured(settings)) fail(400, 'Заполните и включите SMTP');
    try {
      await sendMail(settings, {
        to,
        subject: `Проверка SMTP · ${settings.institutionName}`,
        text: `Письмо-проверка из «${settings.institutionName}». SMTP работает.`,
        html: `<p>Письмо-проверка из <b>${settings.institutionName}</b>. SMTP работает.</p>`,
      });
      send(res, 200, { ok: true, to });
    } catch (error) {
      fail(400, `SMTP: ${error.message || 'ошибка отправки'}`);
    }
    return;
  }

  if (method === 'POST' && path === '/api/settings/telegram-test') {
    assertPermission(user, 'settings.manage');
    if (!telegramBot) fail(500, 'Бот не инициализирован');
    try {
      const result = await telegramBot.sendTest(
        `✅ Бот журнала «${getSettings().institutionName}» подключён.\nКоманды: /commands`,
      );
      send(res, 200, { ok: true, messageId: result?.message_id || null, status: telegramBot.getStatus() });
    } catch (error) {
      fail(400, `Telegram: ${error.message || 'ошибка'}`);
    }
    return;
  }

  if (method === 'POST' && path === '/api/settings/telegram-restart') {
    assertPermission(user, 'settings.manage');
    if (!telegramBot) fail(500, 'Бот не инициализирован');
    const result = await telegramBot.restart();
    send(res, 200, { ok: true, result, status: telegramBot.getStatus() });
    return;
  }

  if (method === 'GET' && path === '/api/me/diary') {
    assertPermission(user, 'diary.own');
    if (!user.studentId) fail(403, 'Аккаунт не привязан к ученику');
    const detail = studentDetailStats(user.studentId);
    const settings = getSettings();
    send(res, 200, {
      ...detail,
      grades: settings.gradesEnabled ? detail.grades : { rows: [], average: null, count: 0 },
      gradesEnabled: settings.gradesEnabled,
    });
    return;
  }

  if (method === 'GET' && path === '/api/users') {
    assertPermission(user, 'users.manage');
    const rows = db.prepare(`
      SELECT * FROM users ORDER BY
        CASE role WHEN 'admin' THEN 0 WHEN 'teacher' THEN 1 WHEN 'elder' THEN 2 WHEN 'student' THEN 3 ELSE 4 END,
        username COLLATE NOCASE
    `).all();
    send(res, 200, {
      users: rows.map((row) => ({
        ...mapUser(row),
        createdAt: row.created_at,
      })),
      catalog: permissionsCatalog(),
    });
    return;
  }

  if (method === 'POST' && path === '/api/users') {
    assertPermission(user, 'users.manage');
    const body = await readBody(req);
    const username = cleanText(body.username, 'логин', 80).toLowerCase();
    if (!/^[a-z0-9._-]{3,80}$/i.test(username)) fail(400, 'Логин: латиница, цифры, ._- (от 3 символов)');
    const role = isRole(body.role) ? body.role : '';
    if (!role) fail(400, `Роль: ${ROLE_KEYS.join(', ')}`);
    const email = cleanEmail(body.email);
    const displayName = body.displayName != null
      ? cleanText(body.displayName, 'имя', 120)
      : '';
    const password = String(body.password ?? '');
    if (password.length < 6) fail(400, 'Пароль минимум 6 символов');
    if (password.length > 80) fail(400, 'Слишком длинный пароль');
    const assignments = parseGroupAssignments(body, role);
    if ((role === 'teacher' || role === 'elder' || role === 'student') && !assignments.length) {
      fail(400, 'Назначьте хотя бы одну группу');
    }
    const { salt, hash } = hashPassword(password);
    let id;
    const tx = db.transaction(() => {
      try {
        const info = db.prepare(`
          INSERT INTO users (
            username, email, display_name, password_hash, salt, role, active, must_change, permissions_custom, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0, ?)
        `).run(username, email, displayName, hash, salt, role, Date.now());
        id = Number(info.lastInsertRowid);
      } catch (error) {
        constraintMessage(error, 'Такой логин уже занят');
      }
      replaceUserGroups(id, assignments);
      replaceUserPermissions(id, role, body.permissions);
      for (const item of assignments) {
        if (item.groupRole === 'elder') {
          const current = db.prepare('SELECT elder_user_id AS id FROM groups WHERE id = ?').get(item.groupId);
          if (!current?.id) db.prepare('UPDATE groups SET elder_user_id = ? WHERE id = ?').run(id, item.groupId);
        }
      }
    });
    tx();
    writeAudit(user, {
      action: 'users.create',
      entity: 'user',
      entityId: id,
      summary: `Создан пользователь ${displayName || username} (${roleLabel(role)})`,
      details: { username, role, groupIds: assignments.map((item) => item.groupId) },
    }, req);
    send(res, 201, mapUser(getUserById(id)));
    return;
  }

  let userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (userMatch && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'users.manage');
    const id = parseId(userMatch[1]);
    const target = getUserById(id);
    if (!target) fail(404, 'Пользователь не найден');
    if (method === 'DELETE') {
      if (target.role === 'admin') {
        const admins = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND active = 1").get().c;
        if (admins <= 1) fail(400, 'Нельзя удалить последнего администратора');
      }
      if (target.id === user.id) fail(400, 'Нельзя удалить себя');
      const tx = db.transaction(() => {
        db.prepare('UPDATE groups SET elder_user_id = NULL WHERE elder_user_id = ?').run(id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
        db.prepare('DELETE FROM users WHERE id = ?').run(id);
      });
      tx();
      writeAudit(user, {
        action: 'users.delete',
        entity: 'user',
        entityId: id,
        summary: `Удалён пользователь ${target.display_name || target.username}`,
        details: { username: target.username, role: target.role },
      }, req);
      send(res, 200, { ok: true });
      return;
    }
    const body = await readBody(req);
    const nextRole = body.role != null ? (isRole(body.role) ? body.role : '') : target.role;
    if (!nextRole) fail(400, `Роль: ${ROLE_KEYS.join(', ')}`);
    if (target.role === 'admin' && nextRole !== 'admin') {
      const admins = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND active = 1").get().c;
      if (admins <= 1) fail(400, 'Нужен хотя бы один администратор');
    }
    const active = body.active == null ? target.active : (body.active ? 1 : 0);
    if (target.id === user.id && !active) fail(400, 'Нельзя отключить себя');
    let username = target.username;
    if (body.username != null) {
      username = cleanText(body.username, 'логин', 80).toLowerCase();
      if (!/^[a-z0-9._-]{3,80}$/i.test(username)) fail(400, 'Логин: латиница, цифры, ._- (от 3 символов)');
    }
    const email = body.email != null ? cleanEmail(body.email) : (target.email || '');
    const displayName = body.displayName != null
      ? (String(body.displayName).trim() ? cleanText(body.displayName, 'имя', 120) : '')
      : (target.display_name || '');
    const assignments = nextRole === 'admin'
      ? []
      : (body.groups != null || body.groupIds != null)
        ? parseGroupAssignments(body, nextRole)
        : listUserGroupLinks(id).map((item) => ({ groupId: item.groupId, groupRole: item.groupRole }));
    if ((nextRole === 'teacher' || nextRole === 'elder' || nextRole === 'student') && !assignments.length) {
      fail(400, 'Назначьте хотя бы одну группу');
    }
    const tx = db.transaction(() => {
      try {
        db.prepare(`
          UPDATE users SET username = ?, email = ?, display_name = ?, role = ?, active = ? WHERE id = ?
        `).run(username, email, displayName, nextRole, active, id);
      } catch (error) {
        constraintMessage(error, 'Такой логин уже занят');
      }
      replaceUserGroups(id, assignments);
      if (body.permissions !== undefined) replaceUserPermissions(id, nextRole, body.permissions);
      else if (body.role != null && !target.permissions_custom) replaceUserPermissions(id, nextRole, null);
      for (const item of assignments) {
        if (item.groupRole === 'elder') {
          const current = db.prepare('SELECT elder_user_id AS id FROM groups WHERE id = ?').get(item.groupId);
          if (!current?.id) db.prepare('UPDATE groups SET elder_user_id = ? WHERE id = ?').run(id, item.groupId);
        }
      }
      if (nextRole === 'admin' || !assignments.some((item) => item.groupRole === 'elder')) {
        db.prepare('UPDATE groups SET elder_user_id = NULL WHERE elder_user_id = ? AND id NOT IN (SELECT group_id FROM user_groups WHERE user_id = ? AND group_role = ?)').run(id, id, 'elder');
      }
      if (body.password) {
        const password = String(body.password);
        if (password.length < 6) fail(400, 'Пароль минимум 6 символов');
        if (password.length > 80) fail(400, 'Слишком длинный пароль');
        const { salt, hash } = hashPassword(password);
        db.prepare('UPDATE users SET password_hash = ?, salt = ?, must_change = 1 WHERE id = ?').run(hash, salt, id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
      }
      if (!active) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    });
    tx();
    const updated = getUserById(id);
    syncAdminMirror(updated);
    writeAudit(user, {
      action: 'users.update',
      entity: 'user',
      entityId: id,
      summary: `Изменён пользователь ${updated.display_name || updated.username}`,
      details: {
        username: updated.username,
        role: updated.role,
        active: updated.active === 1,
        passwordChanged: Boolean(body.password),
      },
    }, req);
    send(res, 200, mapUser(updated));
    return;
  }

  if (method === 'GET' && path === '/api/stats') {
    assertPermission(user, 'stats.view');
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const groupId = url.searchParams.get('groupId');
    const subjectId = url.searchParams.get('subjectId');
    if (subjectId) assertSubjectAccess(user, subjectId);
    if (groupId) {
      requireGroup(groupId);
      assertGroupAccess(user, groupId);
    } else if (user.role !== 'admin' && !hasPermission(user, 'users.manage') && !subjectId) {
      const ids = user.groupIds || [];
      if (!ids.length) fail(403, 'Нет доступа к группам');
      send(res, 200, attendanceBundle({ groupId: ids[0] }));
      return;
    }
    send(res, 200, attendanceBundle({
      groupId: groupId || undefined,
      subjectId: subjectId || undefined,
    }));
    return;
  }

  let match = path.match(/^\/api\/stats\/students\/(\d+)$/);
  if (match && method === 'GET') {
    const studentId = parseId(match[1]);
    const isOwn = user.studentId === studentId && hasPermission(user, 'diary.own');
    if (!isOwn) assertPermission(user, 'stats.view');
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const subjectId = url.searchParams.get('subjectId');
    if (subjectId && !isOwn) assertSubjectAccess(user, subjectId);
    const student = db.prepare('SELECT group_id AS groupId FROM students WHERE id = ?').get(studentId);
    if (!student) fail(404, 'Ученик не найден');
    if (!isOwn) assertGroupAccess(user, student.groupId);
    const detail = studentDetailStats(studentId, isOwn ? undefined : (subjectId || undefined));
    const payload = { ...detail };
    if (hasPermission(user, 'notes.manage') || user.role === 'admin') {
      payload.notes = listStudentNotes(studentId);
    }
    if (!getSettings().gradesEnabled && (isOwn || user.role === 'student')) {
      payload.grades = { rows: [], average: null, count: 0 };
    }
    send(res, 200, payload);
    return;
  }

  match = path.match(/^\/api\/export\/(attendance|grades|credits|summary|schedule|workbook|roster|groups|subjects|teachers|student)$/);
  if (match && method === 'GET') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const groupId = url.searchParams.get('groupId') || undefined;
    const subjectId = url.searchParams.get('subjectId') || undefined;
    const studentIdParam = url.searchParams.get('studentId') || undefined;
    const format = String(url.searchParams.get('format') || '').toLowerCase();
    const kind = match[1];

    if (kind === 'student') {
      const studentId = parseId(studentIdParam);
      const isOwn = user.studentId === studentId && hasPermission(user, 'diary.own');
      if (!isOwn) assertPermission(user, 'stats.view');
      const student = db.prepare('SELECT group_id AS groupId FROM students WHERE id = ?').get(studentId);
      if (!student) fail(404, 'Ученик не найден');
      if (!isOwn) assertGroupAccess(user, student.groupId);
      if (format === 'csv') {
        const file = exportStudentCard({ studentId });
        sendCsv(res, file.csvFilename, file.csv);
        return;
      }
      const book = buildStudentWorkbook(studentId);
      sendBinary(res, book.filename, book.buffer, book.contentType);
      return;
    }

    if (kind === 'teachers') {
      if (!hasPermission(user, 'stats.view') && !hasPermission(user, 'teachers.manage')) {
        fail(403, 'Недостаточно прав');
      }
    } else if (kind === 'roster' || kind === 'groups' || kind === 'subjects') {
      if (
        !hasPermission(user, 'stats.view')
        && !hasPermission(user, 'students.manage')
        && !hasPermission(user, 'subjects.manage')
        && !hasPermission(user, 'groups.manage')
      ) {
        fail(403, 'Недостаточно прав');
      }
    } else {
      assertPermission(user, 'stats.view');
    }

    if (subjectId) assertSubjectAccess(user, subjectId);
    if (groupId) {
      requireGroup(groupId);
      assertGroupAccess(user, groupId);
    }

    if (kind === 'workbook' || (format === 'xlsx' && kind === 'summary')) {
      const book = kind === 'workbook'
        ? buildWorkbook({ groupId, subjectId })
        : rowsToXlsx('svodka.xlsx', [
          { name: 'Сводка', rows: exportSummary({ groupId, subjectId }).rows },
          { name: 'Матрица', rows: attendanceMatrixRows(attendanceBundle({ groupId, subjectId })) },
          { name: 'Список', rows: exportRoster({ groupId }).rows },
        ]);
      sendBinary(res, book.filename, book.buffer, book.contentType);
      return;
    }
    if (format === 'xlsx') {
      const stamp = new Date().toISOString().slice(0, 10);
      const exporters = {
        attendance: () => {
          const file = exportAttendance({ groupId, subjectId });
          return rowsToXlsx(`poseschaemost-${stamp}.xlsx`, [
            { name: 'Сводка', rows: file.studentRows },
            { name: 'Матрица', rows: file.matrixRows },
            { name: 'Детализация', rows: file.detailRows },
          ]);
        },
        grades: () => rowsToXlsx(`ocenki-${stamp}.xlsx`, [{ name: 'Оценки', rows: exportGrades({ groupId, subjectId }).rows }]),
        credits: () => rowsToXlsx(`zachety-${stamp}.xlsx`, [{ name: 'Зачёты', rows: exportCredits({ groupId, subjectId }).rows }]),
        schedule: () => {
          const file = exportSchedule({ groupId });
          return rowsToXlsx(file.filename.replace(/\.csv$/i, '.xlsx'), [{ name: 'Расписание', rows: file.rows }]);
        },
        roster: () => {
          const file = exportRoster({ groupId });
          return rowsToXlsx(file.filename.replace(/\.csv$/i, '.xlsx'), [{ name: 'Ученики', rows: file.rows }]);
        },
        groups: () => {
          const file = exportGroupsList();
          return rowsToXlsx(file.filename.replace(/\.csv$/i, '.xlsx'), [{ name: 'Группы', rows: file.rows }]);
        },
        subjects: () => {
          const file = exportSubjectsList({ groupId });
          return rowsToXlsx(file.filename.replace(/\.csv$/i, '.xlsx'), [{ name: 'Предметы', rows: file.rows }]);
        },
        teachers: () => {
          const file = exportTeachersList();
          return rowsToXlsx(file.filename.replace(/\.csv$/i, '.xlsx'), [{ name: 'Педагоги', rows: file.rows }]);
        },
      };
      const build = exporters[kind];
      if (!build) fail(404, 'Неизвестный тип выгрузки');
      const book = build();
      sendBinary(res, book.filename, book.buffer, book.contentType);
      return;
    }
    const exporters = {
      attendance: exportAttendance,
      grades: exportGrades,
      credits: exportCredits,
      summary: exportSummary,
      schedule: exportSchedule,
      roster: exportRoster,
      groups: () => exportGroupsList(),
      subjects: exportSubjectsList,
      teachers: () => exportTeachersList(),
    };
    const build = exporters[kind];
    if (!build) fail(404, 'Неизвестный тип выгрузки');
    const file = build({ groupId, subjectId });
    sendCsv(res, file.filename, file.csv);
    return;
  }

  if (method === 'POST' && path === '/api/password') {
    const body = await readBody(req);
    const current = String(body.current ?? '');
    const next = String(body.next ?? '');
    if (next.length < 6) fail(400, 'Пароль минимум 6 символов');
    if (next.length > 80) fail(400, 'Слишком длинный пароль');
    if (next === current) fail(400, 'Новый пароль должен отличаться');
    if (/^(admin|123456|password|qwerty)$/i.test(next)) fail(400, 'Слишком простой пароль');
    const row = getUserById(user.id);
    if (!row || !checkPassword(current, row.salt, row.password_hash)) fail(400, 'Текущий пароль неверный');
    const { salt, hash } = hashPassword(next);
    db.prepare('UPDATE users SET password_hash = ?, salt = ?, must_change = 0 WHERE id = ?').run(hash, salt, row.id);
    syncAdminMirror(getUserById(row.id));
    db.prepare('DELETE FROM sessions WHERE user_id = ? OR token = ?').run(row.id, token);
    const newToken = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token, expires_at, user_id) VALUES (?, ?, ?)').run(newToken, Date.now() + SESSION_MS, row.id);
    send(res, 200, { ok: true, token: newToken });
    return;
  }

  if (method === 'GET' && path === '/api/overview') {
    send(res, 200, overview(user));
    return;
  }

  if (method === 'GET' && path === '/api/calendar') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const groupId = url.searchParams.get('groupId');
    const month = url.searchParams.get('month') || todayMonth();
    if (!groupId) fail(400, 'Укажите группу');
    assertGroupAccess(user, groupId);
    send(res, 200, calendarMonth(groupId, month));
    return;
  }

  if (method === 'GET' && path === '/api/calendar/day') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const groupId = url.searchParams.get('groupId');
    const date = url.searchParams.get('date');
    if (!groupId || !date) fail(400, 'Укажите группу и дату');
    assertGroupAccess(user, groupId);
    send(res, 200, calendarDay(groupId, date));
    return;
  }

  if (method === 'POST' && path === '/api/calendar/open-pair') {
    assertPermission(user, 'attendance.mark');
    const body = await readBody(req);
    const group = requireGroup(body.groupId);
    assertGroupAccess(user, group.id);
    const date = cleanDate(body.date);
    const entryId = parseId(body.scheduleEntryId);
    const entry = db.prepare('SELECT * FROM schedule_entries WHERE id = ?').get(entryId);
    if (!entry || (entry.group_id && entry.group_id !== group.id)) fail(404, 'Пара не найдена');
    const result = findOrCreateLessonFromPair({ groupId: group.id, date, entry });
    send(res, 200, {
      lessonId: result.lessonId,
      subjectId: result.subjectId,
      created: result.created,
      day: calendarDay(group.id, date),
    });
    return;
  }

  if (method === 'PUT' && path === '/api/calendar/pair-attendance') {
    assertPermission(user, 'attendance.mark');
    const body = await readBody(req);
    const group = requireGroup(body.groupId);
    assertGroupAccess(user, group.id);
    const date = cleanDate(body.date);
    const entryId = parseId(body.scheduleEntryId);
    const entry = db.prepare('SELECT * FROM schedule_entries WHERE id = ?').get(entryId);
    if (!entry || (entry.group_id && entry.group_id !== group.id)) fail(404, 'Пара не найдена');
    const { lessonId } = findOrCreateLessonFromPair({ groupId: group.id, date, entry });

    if (body.fill === 'present') {
      const students = db.prepare('SELECT id FROM students WHERE group_id = ?').all(group.id);
      const upsert = db.prepare(`
        INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, 'present', '')
        ON CONFLICT(lesson_id, student_id) DO UPDATE SET status = 'present'
      `);
      const tx = db.transaction((rows) => { for (const row of rows) upsert.run(lessonId, row.id); });
      tx(students);
      writeAudit(user, {
        action: 'attendance.fill',
        entity: 'lesson',
        entityId: lessonId,
        groupId: group.id,
        summary: `Все «здесь» · ${group.name} · ${entry.pair_num} пара · ${date}`,
        details: {
          fill: 'present',
          pairNum: entry.pair_num,
          subjectName: entry.subject_name,
          date,
          count: students.length,
        },
      }, req);
      send(res, 200, { ok: true, lessonId, day: calendarDay(group.id, date) });
      return;
    }

    if (body.fill === 'absent-open') {
      const students = db.prepare('SELECT id FROM students WHERE group_id = ?').all(group.id);
      const marked = new Set(
        db.prepare('SELECT student_id FROM attendance WHERE lesson_id = ?').all(lessonId).map((row) => row.student_id),
      );
      const insert = db.prepare(`
        INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, 'absent', '')
      `);
      let filled = 0;
      const tx = db.transaction((rows) => {
        for (const row of rows) {
          if (!marked.has(row.id)) {
            insert.run(lessonId, row.id);
            filled += 1;
          }
        }
      });
      tx(students);
      writeAudit(user, {
        action: 'attendance.fill',
        entity: 'lesson',
        entityId: lessonId,
        groupId: group.id,
        summary: `Пустых → «нет» · ${group.name} · ${entry.pair_num} пара · ${date}`,
        details: {
          fill: 'absent-open',
          pairNum: entry.pair_num,
          subjectName: entry.subject_name,
          date,
          count: filled,
        },
      }, req);
      send(res, 200, { ok: true, lessonId, day: calendarDay(group.id, date) });
      return;
    }

    if (body.fill === 'clear') {
      const deleted = db.prepare('DELETE FROM attendance WHERE lesson_id = ?').run(lessonId).changes;
      writeAudit(user, {
        action: 'attendance.clear',
        entity: 'lesson',
        entityId: lessonId,
        groupId: group.id,
        summary: `Очищен список · ${group.name} · ${entry.pair_num} пара · ${date}`,
        details: {
          fill: 'clear',
          pairNum: entry.pair_num,
          subjectName: entry.subject_name,
          date,
          count: deleted,
        },
      }, req);
      send(res, 200, { ok: true, lessonId, cleared: deleted, day: calendarDay(group.id, date) });
      return;
    }

    const studentId = requireStudentInGroup(body.studentId, group.id);
    const studentRow = db.prepare('SELECT full_name AS fullName FROM students WHERE id = ?').get(studentId);
    const comment = normalizeComment(body.comment);
    let nextStatus = body.status;
    if (body.status == null || body.status === '') {
      if (comment) {
        db.prepare(`
          INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, 'excused', ?)
          ON CONFLICT(lesson_id, student_id) DO UPDATE SET comment = excluded.comment
        `).run(lessonId, studentId, comment);
        nextStatus = 'excused';
      } else {
        db.prepare('DELETE FROM attendance WHERE lesson_id = ? AND student_id = ?').run(lessonId, studentId);
        nextStatus = null;
      }
    } else {
      if (!ATTENDANCE_STATUSES.includes(body.status)) fail(400, 'Некорректная отметка');
      const keepComment = body.comment === undefined
        ? (db.prepare('SELECT comment FROM attendance WHERE lesson_id = ? AND student_id = ?').get(lessonId, studentId)?.comment || '')
        : comment;
      db.prepare(`
        INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, ?, ?)
        ON CONFLICT(lesson_id, student_id) DO UPDATE SET status = excluded.status, comment = excluded.comment
      `).run(lessonId, studentId, body.status, keepComment);
    }
    writeAudit(user, {
      action: 'attendance.mark',
      entity: 'lesson',
      entityId: lessonId,
      groupId: group.id,
      summary: `${studentRow?.fullName || 'Ученик'}: ${attendanceStatusLabel(nextStatus)} · ${group.name} · ${entry.pair_num} пара`,
      details: {
        studentId,
        studentName: studentRow?.fullName || '',
        status: nextStatus,
        pairNum: entry.pair_num,
        subjectName: entry.subject_name,
        date,
        comment: comment || undefined,
      },
    }, req);
    send(res, 200, { ok: true, lessonId, day: calendarDay(group.id, date) });
    return;
  }

  if (method === 'POST' && path === '/api/calendar/copy-pair-attendance') {
    assertPermission(user, 'attendance.mark');
    const body = await readBody(req);
    const group = requireGroup(body.groupId);
    assertGroupAccess(user, group.id);
    const date = cleanDate(body.date);
    const fromId = parseId(body.fromScheduleEntryId);
    const toId = parseId(body.toScheduleEntryId);
    if (fromId === toId) fail(400, 'Выберите другую пару');
    const fromEntry = db.prepare('SELECT * FROM schedule_entries WHERE id = ?').get(fromId);
    const toEntry = db.prepare('SELECT * FROM schedule_entries WHERE id = ?').get(toId);
    if (!fromEntry || (fromEntry.group_id && fromEntry.group_id !== group.id)) fail(404, 'Исходная пара не найдена');
    if (!toEntry || (toEntry.group_id && toEntry.group_id !== group.id)) fail(404, 'Целевая пара не найдена');

    const fromLesson = findOrCreateLessonFromPair({ groupId: group.id, date, entry: fromEntry });
    const toLesson = findOrCreateLessonFromPair({ groupId: group.id, date, entry: toEntry });
    const mode = ['fill-empty', 'here-only', 'away-only'].includes(body.mode) ? body.mode : 'replace';

    const source = db.prepare(`
      SELECT student_id AS studentId, status, comment
      FROM attendance WHERE lesson_id = ?
    `).all(fromLesson.lessonId);
    if (!source.length) fail(400, 'На исходной паре ещё нет отметок');

    const students = new Set(
      db.prepare('SELECT id FROM students WHERE group_id = ?').all(group.id).map((row) => row.id),
    );
    let rows = source.filter((row) => students.has(row.studentId));
    if (mode === 'here-only') {
      rows = rows.filter((row) => row.status === 'present' || row.status === 'late');
    } else if (mode === 'away-only') {
      rows = rows.filter((row) => row.status === 'absent' || row.status === 'excused');
    }
    if (!rows.length) fail(400, 'Нечего переносить');

    const existing = new Set(
      db.prepare('SELECT student_id FROM attendance WHERE lesson_id = ?')
        .all(toLesson.lessonId)
        .map((row) => row.student_id),
    );

    const upsert = db.prepare(`
      INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, ?, ?)
      ON CONFLICT(lesson_id, student_id) DO UPDATE SET
        status = excluded.status,
        comment = excluded.comment
    `);
    const insertOnly = db.prepare(`
      INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, ?, ?)
    `);

    let copied = 0;
    let skipped = 0;
    const tx = db.transaction((list) => {
      if (mode === 'replace' || mode === 'here-only' || mode === 'away-only') {
        if (mode === 'replace') {
          db.prepare('DELETE FROM attendance WHERE lesson_id = ?').run(toLesson.lessonId);
        }
        for (const row of list) {
          upsert.run(toLesson.lessonId, row.studentId, row.status, row.comment || '');
          copied += 1;
        }
        return;
      }
      for (const row of list) {
        if (existing.has(row.studentId)) {
          skipped += 1;
          continue;
        }
        insertOnly.run(toLesson.lessonId, row.studentId, row.status, row.comment || '');
        copied += 1;
      }
    });
    tx(rows);

    writeAudit(user, {
      action: 'attendance.copy',
      entity: 'lesson',
      entityId: toLesson.lessonId,
      groupId: group.id,
      summary: `Перенос явки ${fromEntry.pair_num}→${toEntry.pair_num} · ${group.name} · ${date} · ${copied}`,
      details: {
        mode,
        copied,
        skipped,
        fromPairNum: fromEntry.pair_num,
        toPairNum: toEntry.pair_num,
        fromSubject: fromEntry.subject_name,
        toSubject: toEntry.subject_name,
        date,
      },
    }, req);

    send(res, 200, {
      ok: true,
      mode,
      copied,
      skipped,
      fromPairNum: fromEntry.pair_num,
      toPairNum: toEntry.pair_num,
      fromLessonId: fromLesson.lessonId,
      toLessonId: toLesson.lessonId,
      day: calendarDay(group.id, date),
    });
    return;
  }

  if (method === 'GET' && path === '/api/schedule') {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const groupId = url.searchParams.get('groupId') || undefined;
    const weekType = url.searchParams.get('weekType') || undefined;
    const weekIndex = url.searchParams.get('weekIndex');
    if (groupId) {
      requireGroup(groupId);
      assertGroupAccess(user, groupId);
    } else if (user.role !== 'admin' && !hasPermission(user, 'users.manage')) {
      fail(400, 'Укажите группу');
    }
    let entries = listScheduleEntries({ groupId, weekType });
    if (weekIndex != null && weekIndex !== '' && groupId) {
      const wi = Number(weekIndex);
      entries = entries.filter((e) => e.weekIndex === wi || e.week_index === wi
        || (e.appliesAllWeeks && wi === 0)
        || (e.weekType === 'all'));
    }
    const planBundle = groupId ? schedulePlans.loadPlanBundle(db, Number(groupId)) : null;
    const todayMeta = groupId
      ? scheduleDayMeta({ id: Number(groupId) }, todayISO())
      : null;
    send(res, 200, {
      count: entries.length,
      weekTypeToday: todayMeta?.weekLabel || weekTypeForDate(todayISO()),
      weekIndexToday: todayMeta?.weekIndex ?? null,
      fields: SCHEDULE_FIELDS,
      plan: planBundle?.plan || null,
      source: planBundle?.source || null,
      activeConfig: planBundle?.activeConfig || null,
      entries,
    });
    return;
  }

  // --- Universal parser / plan APIs ---
  if (method === 'GET' && path.match(/^\/api\/schedule\/plans\/\d+$/)) {
    assertPermission(user, 'schedule.view');
    const groupId = parseId(path.split('/').pop());
    assertGroupAccess(user, groupId);
    send(res, 200, schedulePlans.loadPlanBundle(db, groupId));
    return;
  }

  if (method === 'PUT' && path.match(/^\/api\/schedule\/plans\/\d+$/)) {
    assertPermission(user, 'schedule.import');
    const groupId = parseId(path.split('/').pop());
    assertGroupAccess(user, groupId);
    const body = await readBody(req);
    send(res, 200, schedulePlans.updatePlan(db, groupId, body));
    return;
  }

  if (method === 'POST' && path.match(/^\/api\/schedule\/plans\/\d+\/weeks$/)) {
    assertPermission(user, 'schedule.import');
    const groupId = parseId(path.split('/')[4]);
    assertGroupAccess(user, groupId);
    const body = await readBody(req);
    send(res, 200, schedulePlans.addPlanWeek(db, groupId, body));
    return;
  }

  match = path.match(/^\/api\/schedule\/plans\/(\d+)\/weeks\/(\d+)$/);
  if (match && method === 'PATCH') {
    assertPermission(user, 'schedule.import');
    const groupId = parseId(match[1]);
    assertGroupAccess(user, groupId);
    const body = await readBody(req);
    send(res, 200, schedulePlans.patchPlanWeek(db, groupId, parseId(match[2]), body));
    return;
  }
  if (match && method === 'DELETE') {
    assertPermission(user, 'schedule.import');
    const groupId = parseId(match[1]);
    assertGroupAccess(user, groupId);
    send(res, 200, schedulePlans.removePlanWeek(db, groupId, parseId(match[2])));
    return;
  }

  if (method === 'POST' && path === '/api/schedule/sources/upload') {
    assertPermission(user, 'schedule.import');
    assertExcelEnabled();
    const body = await readBody(req, { maxBytes: 20_000_000 });
    const groupId = body.groupId ? parseId(body.groupId) : null;
    if (groupId) assertGroupAccess(user, groupId);
    const b64 = String(body.fileBase64 || body.contentBase64 || '');
    if (!b64) fail(400, 'Передайте fileBase64');
    const buffer = Buffer.from(b64.replace(/^data:[^;]+;base64,/, ''), 'base64');
    const result = schedulePlans.createSourceFromUpload(db, dataDir, {
      groupId,
      buffer,
      originalName: body.fileName || body.originalName || 'schedule.xlsx',
    });
    const preview = schedulePlans.previewSource(db, dataDir, result.sourceId, {
      maxRows: Number(body.maxRows) || 80,
      maxCols: Number(body.maxCols) || 30,
    });
    send(res, 200, { ...result, preview });
    return;
  }

  if (method === 'POST' && path === '/api/schedule/sources/link') {
    assertPermission(user, 'schedule.import');
    assertExcelEnabled();
    const body = await readBody(req);
    const groupId = body.groupId ? parseId(body.groupId) : null;
    if (groupId) assertGroupAccess(user, groupId);
    try {
      assertSafeExternalUrl(body.url);
    } catch (err) {
      fail(err.status || 400, err.message);
    }
    const result = await schedulePlans.createSourceFromUrl(db, dataDir, {
      groupId,
      url: body.url,
    });
    const preview = schedulePlans.previewSource(db, dataDir, result.sourceId, {
      maxRows: 80,
      maxCols: 30,
    });
    send(res, 200, { ...result, preview });
    return;
  }

  match = path.match(/^\/api\/schedule\/sources\/(\d+)\/preview$/);
  if (match && method === 'GET') {
    assertPermission(user, 'schedule.import');
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    send(res, 200, schedulePlans.previewSource(db, dataDir, parseId(match[1]), {
      maxRows: Number(url.searchParams.get('maxRows')) || 80,
      maxCols: Number(url.searchParams.get('maxCols')) || 30,
    }));
    return;
  }

  if (method === 'GET' && path.match(/^\/api\/schedule\/parser-configs\/\d+$/)) {
    assertPermission(user, 'schedule.import');
    const planId = parseId(path.split('/').pop());
    const rows = db.prepare(`
      SELECT id, plan_id AS planId, version, name, config_json AS configJson,
        is_active AS isActive, is_draft AS isDraft, created_at AS createdAt
      FROM schedule_parser_configs WHERE plan_id = ? ORDER BY version DESC
    `).all(planId);
    send(res, 200, {
      configs: rows.map((r) => ({
        ...r,
        isActive: !!r.isActive,
        isDraft: !!r.isDraft,
        config: JSON.parse(r.configJson || '{}'),
        configJson: undefined,
      })),
      defaults: {
        emptyConfig: emptyParserConfig(),
        separators: DEFAULT_SEPARATOR_RULES,
      },
    });
    return;
  }

  if (method === 'PUT' && path.match(/^\/api\/schedule\/parser-configs\/\d+$/)) {
    assertPermission(user, 'schedule.import');
    const planId = parseId(path.split('/').pop());
    const plan = db.prepare('SELECT group_id AS groupId FROM schedule_plans WHERE id = ?').get(planId);
    if (!plan) fail(404, 'План не найден');
    assertGroupAccess(user, plan.groupId);
    const body = await readBody(req);
    send(res, 200, schedulePlans.saveParserConfig(db, plan.groupId, {
      name: body.name || 'default',
      config: body.config,
      activate: !!body.activate,
      draft: body.draft !== false,
    }));
    return;
  }

  if (method === 'POST' && path === '/api/schedule/parser/preview') {
    assertPermission(user, 'schedule.import');
    assertExcelEnabled();
    const body = await readBody(req, { maxBytes: 20_000_000 });
    if (body.groupId) assertGroupAccess(user, body.groupId);
    let buffer = null;
    if (body.fileBase64) {
      buffer = Buffer.from(String(body.fileBase64).replace(/^data:[^;]+;base64,/, ''), 'base64');
    }
    const result = schedulePlans.runParserPreview(db, dataDir, {
      sourceId: body.sourceId ? parseId(body.sourceId) : null,
      config: body.config,
      buffer,
    });
    send(res, 200, result);
    return;
  }

  if (method === 'POST' && path === '/api/schedule/parser/apply') {
    assertPermission(user, 'schedule.import');
    assertExcelEnabled();
    const body = await readBody(req, { maxBytes: 20_000_000 });
    const groupId = parseId(body.groupId);
    assertGroupAccess(user, groupId);
    let buffer = null;
    if (body.fileBase64) {
      buffer = Buffer.from(String(body.fileBase64).replace(/^data:[^;]+;base64,/, ''), 'base64');
    }
    const preview = schedulePlans.runParserPreview(db, dataDir, {
      sourceId: body.sourceId ? parseId(body.sourceId) : null,
      config: body.config,
      buffer,
    });
    if (!preview.validation.ok && !body.force) {
      fail(400, `Ошибки парсинга: ${preview.validation.errors.length}. Передайте force=true чтобы сохранить.`);
    }
    schedulePlans.saveParserConfig(db, groupId, {
      name: body.name || 'active',
      config: body.config,
      activate: true,
      draft: false,
    });
    const applied = schedulePlans.applyParsedSlots(db, groupId, preview.slots, {
      replaceUnlocked: body.replaceUnlocked !== false,
    });
    send(res, 200, { ok: true, applied, preview, plan: schedulePlans.loadPlanBundle(db, groupId) });
    return;
  }

  if (method === 'POST' && path === '/api/schedule/parser/copy') {
    assertPermission(user, 'schedule.import');
    const body = await readBody(req);
    const config = schedulePlans.copyParserSection(body.config, body);
    send(res, 200, { config });
    return;
  }

  if (method === 'PUT' && path === '/api/schedule/day') {
    assertPermission(user, 'schedule.manage');
    const body = await readBody(req);
    assertGroupAccess(user, body.groupId);
    send(res, 200, saveDaySchedule(body));
    return;
  }

  if (method === 'POST' && path === '/api/schedule/entries') {
    assertPermission(user, 'schedule.manage');
    const body = await readBody(req);
    assertGroupAccess(user, body.groupId);
    send(res, 201, createScheduleEntry(body));
    return;
  }

  match = path.match(/^\/api\/schedule\/entries\/(\d+)$/);
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'schedule.manage');
    const existing = db.prepare('SELECT group_id AS groupId FROM schedule_entries WHERE id = ?').get(parseId(match[1]));
    if (!existing) fail(404, 'Пара не найдена');
    if (existing.groupId) assertGroupAccess(user, existing.groupId);
    if (method === 'DELETE') {
      send(res, 200, deleteScheduleEntry(match[1]));
      return;
    }
    const body = await readBody(req);
    if (body.groupId != null) assertGroupAccess(user, body.groupId);
    send(res, 200, updateScheduleEntry(match[1], body));
    return;
  }

  if (method === 'POST' && path === '/api/schedule/probe') {
    assertPermission(user, 'schedule.import');
    assertExcelEnabled();
    const body = await readBody(req);
    const groupId = body.groupId ? parseId(body.groupId) : null;
    if (groupId) assertGroupAccess(user, groupId);
    const urls = resolveScheduleUrlsForImport({
      groupId,
      urls: Array.isArray(body.urls) && body.urls.length
        ? body.urls
        : (body.url ? [body.url] : undefined),
    });
    const { entries, sources } = await importFromUrls(urls);
    const codes = summarizeScheduleCodes(entries);
    const groups = db.prepare(`
      SELECT id, name, schedule_code, schedule_aliases FROM groups
    `).all();
    const byCode = buildCodeToGroupId(groups);
    const linked = codes.filter((row) => byCode.has(row.code)).map((row) => ({
      ...row,
      groupId: byCode.get(row.code),
      groupName: groups.find((g) => g.id === byCode.get(row.code))?.name || null,
    }));
    const unlinked = codes.filter((row) => !byCode.has(row.code));
    const group = groupId ? mapGroupRow(loadGroupSchedule(groupId)) : null;
    send(res, 200, {
      sources,
      totalParsed: entries.length,
      codes,
      linked,
      unlinked,
      group,
      urls,
    });
    return;
  }

  if (method === 'POST' && path === '/api/schedule/preview') {
    assertPermission(user, 'schedule.import');
    assertExcelEnabled();
    const body = await readBody(req);
    const scopeGroupId = body.groupId ? parseId(body.groupId) : null;
    if (scopeGroupId) assertGroupAccess(user, scopeGroupId);
    const urls = resolveScheduleUrlsForImport({
      groupId: scopeGroupId,
      urls: Array.isArray(body.urls) && body.urls.length ? body.urls : undefined,
    });
    const preview = await previewScheduleImport(urls, { groupId: scopeGroupId });
    send(res, 200, preview);
    return;
  }

  if (method === 'POST' && path === '/api/schedule/import') {
    assertPermission(user, 'schedule.import');
    assertExcelEnabled();
    const body = await readBody(req);
    const scopeGroupId = body.groupId ? parseId(body.groupId) : null;
    if (scopeGroupId) assertGroupAccess(user, scopeGroupId);
    if (scopeGroupId) {
      const result = await importScheduleForGroup(scopeGroupId, {
        persistUrl: !!body.persistUrl,
        urls: Array.isArray(body.urls) && body.urls.length ? body.urls : undefined,
      });
      const group = requireGroup(scopeGroupId);
      writeAudit(user, {
        action: 'schedule.import',
        entity: 'group',
        entityId: scopeGroupId,
        groupId: scopeGroupId,
        summary: `Импорт расписания · ${group.name} · ${result.saved || 0} пар`,
        details: {
          saved: result.saved,
          diff: result.diff || null,
        },
      }, req);
      send(res, 200, result);
      return;
    }
    const urls = resolveScheduleUrlsForImport({
      urls: Array.isArray(body.urls) && body.urls.length ? body.urls : undefined,
    });
    const { entries, sources } = await importFromUrls(urls);
    const before = currentEntriesAsImportShape();
    const groups = db.prepare(`
      SELECT id, name, schedule_code, schedule_aliases FROM groups
    `).all();
    const byCode = buildCodeToGroupId(groups);
    const primaryById = new Map(groups.map((group) => [
      group.id,
      normalizeGroupCode(group.schedule_code || group.name) || group.schedule_code || '',
    ]));
    const relevant = entries
      .filter((e) => byCode.has(normalizeGroupCode(e.groupCode) || e.groupCode))
      .map((entry) => {
        const code = normalizeGroupCode(entry.groupCode) || entry.groupCode;
        const gid = byCode.get(code);
        return {
          ...entry,
          groupId: gid,
          groupCode: primaryById.get(gid) || code,
        };
      });
    const knownGroupIds = new Set([...byCode.values()]);
    const diff = diffSchedule(
      before.filter((e) => knownGroupIds.has(Number(e.groupId))
        || byCode.has(normalizeGroupCode(e.groupCode) || e.groupCode)),
      relevant,
    );
    const saved = saveScheduleEntries(entries, { groupId: null });
    const dedupe = autoMergeSubjectDuplicates();
    db.prepare(`
      INSERT INTO settings (key, value) VALUES ('scheduleUrls', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(JSON.stringify(urls));
    const now = Date.now();
    for (const gid of knownGroupIds) markGroupScheduleSync(gid, { at: now, error: '' });
    writeAudit(user, {
      action: 'schedule.import',
      entity: 'schedule',
      summary: `Импорт расписания · всех групп · ${saved} пар`,
      details: {
        saved,
        matchedEntries: relevant.length,
        diff: {
          addedCount: diff.addedCount,
          removedCount: diff.removedCount,
          changedCount: diff.changedCount,
        },
      },
    }, req);
    send(res, 200, {
      saved,
      sources,
      totalParsed: entries.length,
      matchedEntries: relevant.length,
      dedupedSubjects: dedupe.merged,
      groupId: null,
      urls,
      diff: {
        addedCount: diff.addedCount,
        removedCount: diff.removedCount,
        changedCount: diff.changedCount,
        keptCount: diff.keptCount,
        lockedCount: diff.lockedCount || 0,
      },
    });
    return;
  }

  if (method === 'GET' && path === '/api/schedule/sync-status') {
    assertPermission(user, 'schedule.import');
    const settings = getSettings();
    const groups = boundGroupsForSync().map((group) => ({
      id: group.id,
      name: group.name,
      scheduleCode: group.schedule_code,
      scheduleUrl: group.schedule_url || '',
      scheduleSyncedAt: group.schedule_synced_at || null,
      scheduleSyncError: group.schedule_sync_error || '',
    }));
    send(res, 200, {
      excelEnabled: settings.excelEnabled,
      autoSync: settings.scheduleAutoSync,
      autoSyncMinutes: settings.scheduleAutoSyncMinutes,
      running: scheduleSyncState.running,
      lastStartedAt: scheduleSyncState.lastStartedAt,
      lastFinishedAt: scheduleSyncState.lastFinishedAt,
      lastError: scheduleSyncState.lastError,
      lastResult: scheduleSyncState.lastResult,
      groups,
    });
    return;
  }

  if (method === 'POST' && path === '/api/schedule/autosync') {
    assertPermission(user, 'schedule.import');
    assertExcelEnabled();
    const body = await readBody(req);
    const scopeGroupId = body.groupId ? parseId(body.groupId) : null;
    if (scopeGroupId) assertGroupAccess(user, scopeGroupId);
    const summary = await runScheduleAutoSync({
      groupId: scopeGroupId,
      force: !!body.force,
      reason: 'manual',
    });
    send(res, 200, summary);
    return;
  }

  if (method === 'POST' && path === '/api/schedule/clear') {
    assertPermission(user, 'schedule.manage');
    const body = await readBody(req);
    assertGroupAccess(user, body.groupId);
    send(res, 200, clearScheduleForGroup(body.groupId, body.weekType));
    return;
  }

  if (method === 'POST' && path === '/api/schedule/copy-week') {
    assertPermission(user, 'schedule.manage');
    const body = await readBody(req);
    assertGroupAccess(user, body.groupId);
    send(res, 200, copyScheduleWeek(body.groupId, body.fromWeekType, body.toWeekType));
    return;
  }

  if (method === 'GET' && path === '/api/subjects/duplicates') {
    assertPermission(user, 'subjects.manage');
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const groupId = url.searchParams.get('groupId') || undefined;
    if (groupId) assertGroupAccess(user, groupId);
    else assertPermission(user, 'users.manage');
    send(res, 200, listSubjectDuplicates(groupId));
    return;
  }

  if (method === 'POST' && path === '/api/subjects/merge') {
    assertPermission(user, 'subjects.manage');
    const body = await readBody(req);
    const keep = requireSubject(body.keepId);
    assertGroupAccess(user, keep.groupId);
    const result = mergeSubjects(body.keepId, body.mergeIds || body.ids || []);
    writeAudit(user, {
      action: 'subjects.merge',
      entity: 'subject',
      entityId: keep.id,
      groupId: keep.groupId,
      summary: `Объединены предметы → «${keep.name}»`,
      details: result,
    }, req);
    send(res, 200, result);
    return;
  }

  if (method === 'POST' && path === '/api/subjects/dedupe') {
    assertPermission(user, 'subjects.manage');
    const body = await readBody(req);
    if (body.groupId) assertGroupAccess(user, body.groupId);
    else assertPermission(user, 'users.manage');
    const result = autoMergeSubjectDuplicates(body.groupId || undefined);
    writeAudit(user, {
      action: 'subjects.dedupe',
      entity: 'subject',
      groupId: body.groupId || null,
      summary: `Автообъединение дублей предметов · ${result.merged || 0}`,
      details: result,
    }, req);
    send(res, 200, result);
    return;
  }

  if (method === 'POST' && path === '/api/subjects/cleanup') {
    assertPermission(user, 'subjects.manage');
    assertPermission(user, 'users.manage');
    const result = cleanupOrphanSubjects();
    writeAudit(user, {
      action: 'subjects.cleanup',
      entity: 'subject',
      summary: `Очистка пустых предметов · ${result.removed || 0}`,
      details: result,
    }, req);
    send(res, 200, result);
    return;
  }

  if (method === 'POST' && path === '/api/groups') {
    assertPermission(user, 'groups.manage');
    const body = await readBody(req);
    const name = cleanText(body.name, 'название группы');
    const scheduleCode = body.scheduleCode != null && String(body.scheduleCode).trim()
      ? (normalizeGroupCode(body.scheduleCode) || cleanText(body.scheduleCode, 'код расписания', 40))
      : (normalizeGroupCode(name) || null);
    const scheduleUrl = body.scheduleUrl != null ? normalizeScheduleUrlInput(body.scheduleUrl) : '';
    const aliases = parseScheduleAliases(body.scheduleAliases)
      .filter((code) => code !== scheduleCode);
    try {
      const info = db.prepare(`
        INSERT INTO groups (name, schedule_code, schedule_url, schedule_aliases, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(name, scheduleCode, scheduleUrl, JSON.stringify(aliases), Date.now());
      const id = Number(info.lastInsertRowid);
      writeAudit(user, {
        action: 'groups.create',
        entity: 'group',
        entityId: id,
        groupId: id,
        summary: `Создана группа ${name}`,
        details: { scheduleCode, scheduleUrl: scheduleUrl || undefined },
      }, req);
      send(res, 201, { id, group: overview(user).groups.find((item) => item.id === id) });
    } catch (error) {
      constraintMessage(error, 'Группа с таким названием уже есть');
    }
    return;
  }

  match = path.match(/^\/api\/groups\/(\d+)\/elder$/);
  if (match && method === 'PUT') {
    assertPermission(user, 'elders.appoint');
    const id = parseId(match[1]);
    const group = requireGroup(id);
    assertGroupAccess(user, id);
    const body = await readBody(req);
    const elderId = setGroupElder(id, body.userId ?? body.elderUserId ?? null);
    const elder = elderId ? getUserById(elderId) : null;
    const overviewGroup = overview(user).groups.find((item) => item.id === id);
    writeAudit(user, {
      action: 'groups.elder',
      entity: 'group',
      entityId: id,
      groupId: id,
      summary: elder
        ? `Староста ${group.name}: ${elder.display_name || elder.username}`
        : `Снят староста группы ${group.name}`,
      details: { elderUserId: elderId },
    }, req);
    send(res, 200, { ok: true, elderUserId: elderId, group: overviewGroup });
    return;
  }

  match = path.match(/^\/api\/groups\/(\d+)$/);
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    const id = parseId(match[1]);
    const group = db.prepare('SELECT id, name FROM groups WHERE id = ?').get(id);
    if (!group) fail(404, 'Группа не найдена');
    if (method === 'DELETE') {
      assertPermission(user, 'groups.manage');
      db.prepare('DELETE FROM groups WHERE id = ?').run(id);
      writeAudit(user, {
        action: 'groups.delete',
        entity: 'group',
        entityId: id,
        groupId: id,
        summary: `Удалена группа ${group.name}`,
      }, req);
      send(res, 200, { ok: true });
      return;
    }
    const body = await readBody(req);
    assertGroupAccess(user, id);
    if (body.name != null || body.scheduleCode != null || body.scheduleUrl != null || body.scheduleAliases != null) {
      if (!hasPermission(user, 'groups.rename') && !hasPermission(user, 'groups.manage')) {
        fail(403, 'Недостаточно прав для настройки группы');
      }
    }
    if (body.elderUserId !== undefined || body.userId !== undefined) {
      assertPermission(user, 'elders.appoint');
    }
    const name = body.name != null ? cleanText(body.name, 'название группы') : null;
    const scheduleCode = body.scheduleCode != null
      ? (String(body.scheduleCode).trim() ? normalizeGroupCode(body.scheduleCode) || cleanText(body.scheduleCode, 'код расписания', 40) : null)
      : undefined;
    const scheduleUrl = body.scheduleUrl != null
      ? normalizeScheduleUrlInput(body.scheduleUrl)
      : undefined;
    const aliases = body.scheduleAliases != null
      ? parseScheduleAliases(body.scheduleAliases)
      : undefined;
    try {
      const current = loadGroupSchedule(id);
      const nextCode = scheduleCode !== undefined ? scheduleCode : current.schedule_code;
      const nextAliases = aliases !== undefined
        ? aliases.filter((code) => code && code !== nextCode)
        : parseScheduleAliases(current.schedule_aliases).filter((code) => code && code !== nextCode);
      if (name != null) {
        db.prepare(`
          UPDATE groups SET name = ?, schedule_code = ?, schedule_url = ?, schedule_aliases = ?
          WHERE id = ?
        `).run(
          name,
          nextCode,
          scheduleUrl !== undefined ? scheduleUrl : (current.schedule_url || ''),
          JSON.stringify(nextAliases),
          id,
        );
      } else {
        db.prepare(`
          UPDATE groups SET schedule_code = ?, schedule_url = ?, schedule_aliases = ?
          WHERE id = ?
        `).run(
          nextCode,
          scheduleUrl !== undefined ? scheduleUrl : (current.schedule_url || ''),
          JSON.stringify(nextAliases),
          id,
        );
      }
    } catch (error) {
      constraintMessage(error, 'Группа с таким названием уже есть');
    }
    if (body.elderUserId !== undefined || body.userId !== undefined) {
      setGroupElder(id, body.elderUserId ?? body.userId ?? null);
    }
    writeAudit(user, {
      action: 'groups.update',
      entity: 'group',
      entityId: id,
      groupId: id,
      summary: `Изменена группа ${name || group.name}`,
      details: {
        name: name || undefined,
        scheduleCode: scheduleCode !== undefined ? scheduleCode : undefined,
        elderChanged: body.elderUserId !== undefined || body.userId !== undefined,
      },
    }, req);
    send(res, 200, { ok: true, group: overview(user).groups.find((item) => item.id === id) });
    return;
  }

  if (method === 'POST' && path === '/api/students') {
    assertPermission(user, 'students.manage');
    const body = await readBody(req);
    const fullName = cleanText(body.fullName, 'имя ученика');
    const group = requireGroup(body.groupId);
    assertGroupAccess(user, group.id);
    const email = body.email ? cleanEmail(body.email) : '';
    const info = db.prepare(`
      INSERT INTO students (full_name, group_id, created_at, email) VALUES (?, ?, ?, ?)
    `).run(fullName, group.id, Date.now(), email);
    const studentId = Number(info.lastInsertRowid);
    writeAudit(user, {
      action: 'students.create',
      entity: 'student',
      entityId: studentId,
      groupId: group.id,
      summary: `Добавлен ученик ${fullName} · ${group.name}`,
    }, req);
    send(res, 201, { id: studentId });
    return;
  }

  match = path.match(/^\/api\/students\/(\d+)\/access$/);
  if (match && method === 'POST') {
    assertPermission(user, 'users.manage');
    const id = parseId(match[1]);
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) fail(404, 'Ученик не найден');
    assertGroupAccess(user, student.group_id);
    const body = await readBody(req);
    const result = await grantEntityAccess({
      role: 'student',
      entityId: id,
      username: body.username,
      email: body.email || student.email,
      displayName: student.full_name,
      groupId: student.group_id,
      req,
      actor: user,
    });
    send(res, 200, result);
    return;
  }
  if (match && method === 'DELETE') {
    assertPermission(user, 'users.manage');
    const id = parseId(match[1]);
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) fail(404, 'Ученик не найден');
    assertGroupAccess(user, student.group_id);
    send(res, 200, revokeEntityAccess('student', id, user, req));
    return;
  }

  match = path.match(/^\/api\/students\/(\d+)\/photo$/);
  if (match && method === 'POST') {
    assertPermission(user, 'students.manage');
    const id = parseId(match[1]);
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) fail(404, 'Ученик не найден');
    assertGroupAccess(user, student.group_id);
    const body = await readBody(req);
    const rel = await savePhotoFromBody('students', id, body);
    db.prepare('UPDATE students SET photo_path = ? WHERE id = ?').run(rel, id);
    writeAudit(user, {
      action: 'students.photo',
      entity: 'student',
      entityId: id,
      groupId: student.group_id,
      summary: `Фото ученика ${student.full_name}`,
    }, req);
    send(res, 200, { ok: true, photoUrl: photoUrl(rel) });
    return;
  }
  if (match && method === 'DELETE') {
    assertPermission(user, 'students.manage');
    const id = parseId(match[1]);
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) fail(404, 'Ученик не найден');
    assertGroupAccess(user, student.group_id);
    if (student.photo_path) {
      const full = path.join(uploadsDir, student.photo_path);
      try { await unlink(full); } catch { /* ignore */ }
    }
    db.prepare('UPDATE students SET photo_path = \'\' WHERE id = ?').run(id);
    send(res, 200, { ok: true });
    return;
  }

  match = path.match(/^\/api\/students\/(\d+)\/notes$/);
  if (match && method === 'GET') {
    assertPermission(user, 'notes.manage');
    const id = parseId(match[1]);
    const student = db.prepare('SELECT group_id FROM students WHERE id = ?').get(id);
    if (!student) fail(404, 'Ученик не найден');
    assertGroupAccess(user, student.group_id);
    send(res, 200, { notes: listStudentNotes(id) });
    return;
  }
  if (match && method === 'POST') {
    assertPermission(user, 'notes.manage');
    const id = parseId(match[1]);
    const student = db.prepare('SELECT group_id, full_name FROM students WHERE id = ?').get(id);
    if (!student) fail(404, 'Ученик не найден');
    assertGroupAccess(user, student.group_id);
    const body = await readBody(req);
    const text = cleanText(body.body || body.text, 'заметка', 2000);
    const now = Date.now();
    const info = db.prepare(`
      INSERT INTO student_notes (student_id, author_user_id, body, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, user.id, text, now, now);
    send(res, 201, { id: Number(info.lastInsertRowid), notes: listStudentNotes(id) });
    return;
  }

  match = path.match(/^\/api\/students\/(\d+)\/notes\/(\d+)$/);
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'notes.manage');
    const studentId = parseId(match[1]);
    const noteId = parseId(match[2]);
    const student = db.prepare('SELECT group_id FROM students WHERE id = ?').get(studentId);
    if (!student) fail(404, 'Ученик не найден');
    assertGroupAccess(user, student.group_id);
    const note = db.prepare('SELECT * FROM student_notes WHERE id = ? AND student_id = ?').get(noteId, studentId);
    if (!note) fail(404, 'Заметка не найдена');
    if (method === 'DELETE') {
      db.prepare('DELETE FROM student_notes WHERE id = ?').run(noteId);
      send(res, 200, { ok: true, notes: listStudentNotes(studentId) });
      return;
    }
    const body = await readBody(req);
    const text = cleanText(body.body || body.text, 'заметка', 2000);
    db.prepare('UPDATE student_notes SET body = ?, updated_at = ? WHERE id = ?').run(text, Date.now(), noteId);
    send(res, 200, { ok: true, notes: listStudentNotes(studentId) });
    return;
  }

  match = path.match(/^\/api\/students\/(\d+)$/);
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'students.manage');
    const id = parseId(match[1]);
    const student = db.prepare('SELECT id, group_id, full_name, email, user_id FROM students WHERE id = ?').get(id);
    if (!student) fail(404, 'Ученик не найден');
    assertGroupAccess(user, student.group_id);
    if (method === 'DELETE') {
      if (student.user_id) revokeEntityAccess('student', id, user, req);
      db.prepare('DELETE FROM students WHERE id = ?').run(id);
      writeAudit(user, {
        action: 'students.delete',
        entity: 'student',
        entityId: id,
        groupId: student.group_id,
        summary: `Удалён ученик ${student.full_name}`,
      }, req);
      send(res, 200, { ok: true });
      return;
    }
    const body = await readBody(req);
    const fullName = cleanText(body.fullName, 'имя ученика');
    const group = requireGroup(body.groupId);
    assertGroupAccess(user, group.id);
    const email = body.email != null ? (body.email ? cleanEmail(body.email) : '') : student.email;
    const tx = db.transaction(() => {
      db.prepare('UPDATE students SET full_name = ?, group_id = ?, email = ? WHERE id = ?')
        .run(fullName, group.id, email, id);
      if (group.id !== student.group_id) clearStudentOutsideGroup(id, group.id);
    });
    tx();
    writeAudit(user, {
      action: 'students.update',
      entity: 'student',
      entityId: id,
      groupId: group.id,
      summary: `Изменён ученик ${fullName}`,
      details: { fromGroupId: student.group_id, toGroupId: group.id, prevName: student.full_name },
    }, req);
    send(res, 200, { ok: true });
    return;
  }

  if (method === 'GET' && path === '/api/teachers') {
    assertPermission(user, 'teachers.manage');
    const rows = db.prepare('SELECT * FROM teachers ORDER BY full_name COLLATE NOCASE').all().map((row) => {
      const mapped = mapTeacherRow(row);
      const schedule = listTeacherSchedule(row);
      const groups = listTeacherAssignedGroups(row.id);
      return {
        ...mapped,
        scheduleCount: schedule.length,
        groupCount: groups.length,
        groups,
        scheduleGroups: listTeacherScheduleGroups(row, schedule),
      };
    });
    send(res, 200, { teachers: rows });
    return;
  }

  if (method === 'POST' && path === '/api/teachers') {
    assertPermission(user, 'teachers.manage');
    const body = await readBody(req);
    if (body.discover) {
      const created = discoverTeachersFromSchedule();
      send(res, 200, { created, teachers: db.prepare('SELECT * FROM teachers ORDER BY full_name COLLATE NOCASE').all().map(mapTeacherRow) });
      return;
    }
    const fullName = cleanTeacherCell(cleanText(body.fullName, 'ФИО педагога')) || cleanText(body.fullName, 'ФИО педагога');
    const shortName = body.shortName
      ? cleanTeacherCell(cleanText(body.shortName, 'краткое имя', 80)) || cleanText(body.shortName, 'краткое имя', 80)
      : shortNameFromFull(fullName);
    const email = body.email ? cleanEmail(body.email) : '';
    const info = db.prepare(`
      INSERT INTO teachers (full_name, short_name, email, photo_path, user_id, created_at)
      VALUES (?, ?, ?, '', NULL, ?)
    `).run(fullName, shortName, email, Date.now());
    const id = Number(info.lastInsertRowid);
    const teacherRow = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    syncTeacherGroupsFromSchedule(teacherRow, { onlyIfEmpty: false });
    writeAudit(user, {
      action: 'teachers.create',
      entity: 'teacher',
      entityId: id,
      summary: `Добавлен педагог ${fullName}`,
    }, req);
    const schedule = listTeacherSchedule(teacherRow);
    send(res, 201, {
      ...mapTeacherRow(teacherRow),
      scheduleCount: schedule.length,
      groups: listTeacherAssignedGroups(id),
    });
    return;
  }

  if (method === 'GET' && path === '/api/teachers/me/schedule') {
    if (!user.teacherId) fail(403, 'Аккаунт не привязан к педагогу');
    let teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(user.teacherId);
    if (!teacher) fail(404, 'Педагог не найден');
    syncTeacherGroupsFromSchedule(teacher, { onlyIfEmpty: true });
    if (!listTeacherSchedule(teacher).length) {
      await enrichTeacherScheduleFromExcel(teacher, { force: true });
      teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(user.teacherId) || teacher;
    }
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const weekType = String(url.searchParams.get('weekType') || '').trim();
    const entries = listTeacherSchedule(teacher, weekType);
    send(res, 200, {
      teacher: mapTeacherRow(teacher),
      weekTypeToday: weekTypeForDate(todayIsoDate()),
      entries,
      scheduleGroups: listTeacherScheduleGroups(teacher, entries),
      groups: listTeacherAssignedGroups(teacher.id),
    });
    return;
  }

  match = path.match(/^\/api\/teachers\/(\d+)\/schedule$/);
  if (match && method === 'GET') {
    const teacherId = parseId(match[1]);
    if (!hasPermission(user, 'teachers.manage') && user.teacherId !== teacherId) {
      fail(403, 'Недостаточно прав');
    }
    let teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherId);
    if (!teacher) fail(404, 'Педагог не найден');
    syncTeacherGroupsFromSchedule(teacher, { onlyIfEmpty: true });
    if (!listTeacherSchedule(teacher).length) {
      await enrichTeacherScheduleFromExcel(teacher, { force: true });
      teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherId) || teacher;
    }
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const weekType = String(url.searchParams.get('weekType') || '').trim();
    const entries = listTeacherSchedule(teacher, weekType);
    send(res, 200, {
      teacher: mapTeacherRow(teacher),
      weekTypeToday: weekTypeForDate(todayIsoDate()),
      entries,
      scheduleGroups: listTeacherScheduleGroups(teacher, entries),
      groups: listTeacherAssignedGroups(teacher.id),
    });
    return;
  }

  match = path.match(/^\/api\/teachers\/(\d+)\/groups$/);
  if (match && method === 'PUT') {
    assertPermission(user, 'teachers.manage');
    const id = parseId(match[1]);
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    if (!teacher) fail(404, 'Педагог не найден');
    const body = await readBody(req);
    const groupIds = Array.isArray(body.groupIds) ? body.groupIds : (body.groups || []).map((item) => item.groupId ?? item.id);
    const groups = replaceTeacherGroups(id, groupIds);
    send(res, 200, { ok: true, groups });
    return;
  }

  match = path.match(/^\/api\/teachers\/(\d+)\/access$/);
  if (match && method === 'POST') {
    assertPermission(user, 'users.manage');
    const id = parseId(match[1]);
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    if (!teacher) fail(404, 'Педагог не найден');
    const body = await readBody(req);
    const result = await grantEntityAccess({
      role: 'teacher',
      entityId: id,
      username: body.username || suggestUsernameFromName(teacher.full_name),
      email: body.email || teacher.email,
      displayName: teacher.full_name,
      req,
      actor: user,
    });
    send(res, 200, result);
    return;
  }
  if (match && method === 'DELETE') {
    assertPermission(user, 'users.manage');
    const id = parseId(match[1]);
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    if (!teacher) fail(404, 'Педагог не найден');
    send(res, 200, revokeEntityAccess('teacher', id, user, req));
    return;
  }

  match = path.match(/^\/api\/teachers\/(\d+)\/photo$/);
  if (match && method === 'POST') {
    assertPermission(user, 'teachers.manage');
    const id = parseId(match[1]);
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    if (!teacher) fail(404, 'Педагог не найден');
    const body = await readBody(req);
    const rel = await savePhotoFromBody('teachers', id, body);
    db.prepare('UPDATE teachers SET photo_path = ? WHERE id = ?').run(rel, id);
    send(res, 200, { ok: true, photoUrl: photoUrl(rel) });
    return;
  }

  match = path.match(/^\/api\/teachers\/(\d+)$/);
  if (match && method === 'GET') {
    const teacherId = parseId(match[1]);
    if (!hasPermission(user, 'teachers.manage') && user.teacherId !== teacherId) {
      fail(403, 'Недостаточно прав');
    }
    let teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherId);
    if (!teacher) fail(404, 'Педагог не найден');
    syncTeacherGroupsFromSchedule(teacher, { onlyIfEmpty: true });
    if (!listTeacherSchedule(teacher).length) {
      await enrichTeacherScheduleFromExcel(teacher, { force: true });
      teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(teacherId) || teacher;
    }
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const weekType = String(url.searchParams.get('weekType') || '').trim();
    const schedule = listTeacherSchedule(teacher, weekType || undefined);
    send(res, 200, {
      teacher: mapTeacherRow(teacher),
      schedule,
      scheduleGroups: listTeacherScheduleGroups(teacher, schedule),
      groups: listTeacherAssignedGroups(teacher.id),
      allGroups: db.prepare('SELECT id, name, schedule_code AS code FROM groups ORDER BY name COLLATE NOCASE').all(),
      accessUser: teacher.user_id ? mapUser(getUserById(teacher.user_id)) : null,
    });
    return;
  }
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'teachers.manage');
    const id = parseId(match[1]);
    const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    if (!teacher) fail(404, 'Педагог не найден');
    if (method === 'DELETE') {
      if (teacher.user_id) revokeEntityAccess('teacher', id, user, req);
      db.prepare('DELETE FROM teacher_groups WHERE teacher_id = ?').run(id);
      db.prepare('DELETE FROM teachers WHERE id = ?').run(id);
      writeAudit(user, {
        action: 'teachers.delete',
        entity: 'teacher',
        entityId: id,
        summary: `Удалён педагог ${teacher.full_name}`,
      }, req);
      send(res, 200, { ok: true });
      return;
    }
    const body = await readBody(req);
    const fullName = body.fullName != null
      ? (cleanTeacherCell(cleanText(body.fullName, 'ФИО педагога')) || cleanText(body.fullName, 'ФИО педагога'))
      : teacher.full_name;
    const shortName = body.shortName != null
      ? (cleanTeacherCell(cleanText(body.shortName, 'краткое имя', 80)) || cleanText(body.shortName, 'краткое имя', 80))
      : (teacher.short_name || shortNameFromFull(fullName));
    const email = body.email != null ? (body.email ? cleanEmail(body.email) : '') : teacher.email;
    db.prepare('UPDATE teachers SET full_name = ?, short_name = ?, email = ? WHERE id = ?')
      .run(fullName, shortName, email, id);
    const updated = db.prepare('SELECT * FROM teachers WHERE id = ?').get(id);
    if (body.groupIds != null || body.groups != null) {
      const groupIds = Array.isArray(body.groupIds)
        ? body.groupIds
        : (body.groups || []).map((item) => item.groupId ?? item.id);
      replaceTeacherGroups(id, groupIds);
    } else if (body.fullName != null || body.shortName != null) {
      syncTeacherGroupsFromSchedule(updated, { onlyIfEmpty: true });
    }
    const schedule = listTeacherSchedule(updated);
    send(res, 200, {
      ...mapTeacherRow(updated),
      scheduleCount: schedule.length,
      groups: listTeacherAssignedGroups(id),
      scheduleGroups: listTeacherScheduleGroups(updated, schedule),
    });
    return;
  }

  if (method === 'POST' && path === '/api/subjects') {
    assertPermission(user, 'subjects.manage');
    const body = await readBody(req);
    const name = cleanText(body.name, 'название предмета');
    const group = requireGroup(body.groupId);
    assertGroupAccess(user, group.id);
    const existing = findSubjectInGroup(group.id, name);
    if (existing) fail(400, `Такой предмет уже есть: «${existing.name}»`);
    try {
      const key = normalizeSubjectKey(name);
      const info = db.prepare(`
        INSERT INTO subjects (name, group_id, created_at, norm_key) VALUES (?, ?, ?, ?)
      `).run(name, group.id, Date.now(), key);
      const subjectId = Number(info.lastInsertRowid);
      writeAudit(user, {
        action: 'subjects.create',
        entity: 'subject',
        entityId: subjectId,
        groupId: group.id,
        summary: `Добавлен предмет «${name}» · ${group.name}`,
      }, req);
      send(res, 201, { id: subjectId });
    } catch (error) {
      constraintMessage(error, 'Такой предмет уже есть в этой группе');
    }
    return;
  }

  match = path.match(/^\/api\/subjects\/(\d+)$/);
  if (match && method === 'GET') {
    assertSubjectAccess(user, match[1]);
    send(res, 200, journal(parseId(match[1])));
    return;
  }
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'subjects.manage');
    const subject = assertSubjectAccess(user, match[1]);
    if (method === 'DELETE') {
      db.prepare('DELETE FROM subjects WHERE id = ?').run(subject.id);
      writeAudit(user, {
        action: 'subjects.delete',
        entity: 'subject',
        entityId: subject.id,
        groupId: subject.groupId,
        summary: `Удалён предмет «${subject.name}»`,
      }, req);
      send(res, 200, { ok: true });
      return;
    }
    const body = await readBody(req);
    const name = cleanText(body.name, 'название предмета');
    const clash = findSubjectInGroup(subject.groupId, name);
    if (clash && clash.id !== subject.id) fail(400, `Такой предмет уже есть: «${clash.name}»`);
    try {
      const key = normalizeSubjectKey(name);
      db.prepare('UPDATE subjects SET name = ?, norm_key = ? WHERE id = ?').run(name, key, subject.id);
      rewriteScheduleSubjectNames(subject.groupId, [subject.name, name], name);
    } catch (error) {
      constraintMessage(error, 'Такой предмет уже есть в этой группе');
    }
    writeAudit(user, {
      action: 'subjects.update',
      entity: 'subject',
      entityId: subject.id,
      groupId: subject.groupId,
      summary: `Предмет «${subject.name}» → «${name}»`,
    }, req);
    send(res, 200, { ok: true });
    return;
  }

  match = path.match(/^\/api\/subjects\/(\d+)\/lessons$/);
  if (match && method === 'POST') {
    assertPermission(user, 'attendance.mark');
    const subject = assertSubjectAccess(user, match[1]);
    const body = await readBody(req);
    const date = cleanDate(body.date);
    const topic = String(body.topic ?? '').trim().replace(/\s+/g, ' ').slice(0, 200);
    const info = db.prepare(`
      INSERT INTO lessons (subject_id, lesson_date, topic, created_at) VALUES (?, ?, ?, ?)
    `).run(subject.id, date, topic, Date.now());
    send(res, 201, { id: Number(info.lastInsertRowid) });
    return;
  }

  match = path.match(/^\/api\/subjects\/(\d+)\/credits$/);
  if (match && method === 'POST') {
    assertPermission(user, 'grades.manage');
    const subject = assertSubjectAccess(user, match[1]);
    const body = await readBody(req);
    const title = cleanText(body.title, 'название зачёта');
    const date = cleanDate(body.date);
    const kind = body.kind === 'exam' ? 'exam' : body.kind === 'credit' ? 'credit' : '';
    if (!kind) fail(400, 'Выберите зачёт или экзамен');
    const info = db.prepare(`
      INSERT INTO credits (subject_id, title, credit_date, kind, created_at) VALUES (?, ?, ?, ?, ?)
    `).run(subject.id, title, date, kind, Date.now());
    send(res, 201, { id: Number(info.lastInsertRowid) });
    return;
  }

  match = path.match(/^\/api\/subjects\/(\d+)\/works$/);
  if (match && method === 'POST') {
    assertPermission(user, 'grades.manage');
    assertGradesEnabled();
    const subject = assertSubjectAccess(user, match[1]);
    const body = await readBody(req);
    const title = cleanText(body.title, 'название работы');
    const date = cleanDate(body.date);
    const info = db.prepare(`
      INSERT INTO works (subject_id, title, work_date, created_at) VALUES (?, ?, ?, ?)
    `).run(subject.id, title, date, Date.now());
    send(res, 201, { id: Number(info.lastInsertRowid) });
    return;
  }

  match = path.match(/^\/api\/lessons\/(\d+)$/);
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'attendance.mark');
    const id = parseId(match[1]);
    const lesson = db.prepare('SELECT id, subject_id FROM lessons WHERE id = ?').get(id);
    if (!lesson) fail(404, 'Занятие не найдено');
    assertSubjectAccess(user, lesson.subject_id);
    if (method === 'DELETE') {
      db.prepare('DELETE FROM lessons WHERE id = ?').run(id);
      send(res, 200, { ok: true });
      return;
    }
    const body = await readBody(req);
    const date = cleanDate(body.date);
    const topic = String(body.topic ?? '').trim().replace(/\s+/g, ' ').slice(0, 200);
    db.prepare('UPDATE lessons SET lesson_date = ?, topic = ? WHERE id = ?').run(date, topic, id);
    send(res, 200, { ok: true });
    return;
  }

  match = path.match(/^\/api\/lessons\/(\d+)\/attendance$/);
  if (match && method === 'PUT') {
    assertPermission(user, 'attendance.mark');
    const id = parseId(match[1]);
    const lesson = db.prepare('SELECT id, subject_id, lesson_date AS date, topic FROM lessons WHERE id = ?').get(id);
    if (!lesson) fail(404, 'Занятие не найдено');
    const subject = assertSubjectAccess(user, lesson.subject_id);
    const body = await readBody(req);
    if (body.fill === 'present') {
      const students = db.prepare('SELECT id FROM students WHERE group_id = ?').all(subject.groupId);
      if (!students.length) fail(400, 'В группе нет учеников');
      const upsert = db.prepare(`
        INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, 'present', '')
        ON CONFLICT(lesson_id, student_id) DO UPDATE SET status = 'present'
      `);
      const tx = db.transaction((rows) => {
        for (const row of rows) upsert.run(id, row.id);
      });
      tx(students);
      writeAudit(user, {
        action: 'attendance.fill',
        entity: 'lesson',
        entityId: id,
        groupId: subject.groupId,
        summary: `Все «здесь» · ${subject.groupName} · ${subject.name}`,
        details: { fill: 'present', subject: subject.name, date: lesson.date, count: students.length },
      }, req);
      send(res, 200, { ok: true });
      return;
    }
    const studentId = requireStudentInGroup(body.studentId, subject.groupId);
    const studentRow = db.prepare('SELECT full_name AS fullName FROM students WHERE id = ?').get(studentId);
    const comment = normalizeComment(body.comment);
    let nextStatus = body.status;
    if (body.status == null || body.status === '') {
      if (comment) {
        db.prepare(`
          INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, 'excused', ?)
          ON CONFLICT(lesson_id, student_id) DO UPDATE SET comment = excluded.comment
        `).run(id, studentId, comment);
        nextStatus = 'excused';
      } else {
        db.prepare('DELETE FROM attendance WHERE lesson_id = ? AND student_id = ?').run(id, studentId);
        nextStatus = null;
      }
      writeAudit(user, {
        action: 'attendance.mark',
        entity: 'lesson',
        entityId: id,
        groupId: subject.groupId,
        summary: `${studentRow?.fullName || 'Ученик'}: ${attendanceStatusLabel(nextStatus)} · ${subject.name}`,
        details: { studentId, status: nextStatus, subject: subject.name, date: lesson.date },
      }, req);
      send(res, 200, { ok: true });
      return;
    }
    if (!ATTENDANCE_STATUSES.includes(body.status)) fail(400, 'Некорректная отметка');
    const keepComment = body.comment === undefined
      ? (db.prepare('SELECT comment FROM attendance WHERE lesson_id = ? AND student_id = ?').get(id, studentId)?.comment || '')
      : comment;
    db.prepare(`
      INSERT INTO attendance (lesson_id, student_id, status, comment) VALUES (?, ?, ?, ?)
      ON CONFLICT(lesson_id, student_id) DO UPDATE SET status = excluded.status, comment = excluded.comment
    `).run(id, studentId, body.status, keepComment);
    writeAudit(user, {
      action: 'attendance.mark',
      entity: 'lesson',
      entityId: id,
      groupId: subject.groupId,
      summary: `${studentRow?.fullName || 'Ученик'}: ${attendanceStatusLabel(body.status)} · ${subject.name}`,
      details: { studentId, status: body.status, subject: subject.name, date: lesson.date },
    }, req);
    send(res, 200, { ok: true });
    return;
  }

  match = path.match(/^\/api\/credits\/(\d+)$/);
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'grades.manage');
    const id = parseId(match[1]);
    const credit = db.prepare('SELECT id, kind, subject_id FROM credits WHERE id = ?').get(id);
    if (!credit) fail(404, 'Зачёт не найден');
    assertSubjectAccess(user, credit.subject_id);
    if (method === 'DELETE') {
      db.prepare('DELETE FROM credits WHERE id = ?').run(id);
      send(res, 200, { ok: true });
      return;
    }
    const body = await readBody(req);
    const title = cleanText(body.title, 'название');
    const date = cleanDate(body.date);
    const kind = body.kind === 'exam' ? 'exam' : body.kind === 'credit' ? 'credit' : '';
    if (!kind) fail(400, 'Выберите зачёт или экзамен');
    const tx = db.transaction(() => {
      db.prepare('UPDATE credits SET title = ?, credit_date = ?, kind = ? WHERE id = ?').run(title, date, kind, id);
      if (kind !== credit.kind) {
        if (kind === 'credit') {
          db.prepare(`DELETE FROM credit_results WHERE credit_id = ? AND result NOT IN ('pass', 'fail')`).run(id);
        } else {
          db.prepare(`DELETE FROM credit_results WHERE credit_id = ? AND result NOT IN ('2', '3', '4', '5')`).run(id);
        }
      }
    });
    tx();
    send(res, 200, { ok: true });
    return;
  }

  match = path.match(/^\/api\/credits\/(\d+)\/results$/);
  if (match && method === 'PUT') {
    assertPermission(user, 'grades.manage');
    const id = parseId(match[1]);
    const credit = db.prepare(`
      SELECT c.id, c.kind, c.subject_id AS subjectId, s.group_id AS groupId
      FROM credits c JOIN subjects s ON s.id = c.subject_id
      WHERE c.id = ?
    `).get(id);
    if (!credit) fail(404, 'Зачёт не найден');
    assertGroupAccess(user, credit.groupId);
    const body = await readBody(req);
    const studentId = requireStudentInGroup(body.studentId, credit.groupId);
    if (body.result == null || body.result === '') {
      db.prepare('DELETE FROM credit_results WHERE credit_id = ? AND student_id = ?').run(id, studentId);
      send(res, 200, { ok: true });
      return;
    }
    const result = String(body.result);
    if (credit.kind === 'credit' && !['pass', 'fail'].includes(result)) fail(400, 'Для зачёта отметьте «зачёт» или «незачёт»');
    if (credit.kind === 'exam' && !['2', '3', '4', '5'].includes(result)) fail(400, 'Для экзамена оценка от 2 до 5');
    db.prepare(`
      INSERT INTO credit_results (credit_id, student_id, result) VALUES (?, ?, ?)
      ON CONFLICT(credit_id, student_id) DO UPDATE SET result = excluded.result
    `).run(id, studentId, result);
    send(res, 200, { ok: true });
    return;
  }

  match = path.match(/^\/api\/works\/(\d+)$/);
  if (match && (method === 'PATCH' || method === 'DELETE')) {
    assertPermission(user, 'grades.manage');
    assertGradesEnabled();
    const id = parseId(match[1]);
    const work = db.prepare('SELECT id, subject_id FROM works WHERE id = ?').get(id);
    if (!work) fail(404, 'Работа не найдена');
    assertSubjectAccess(user, work.subject_id);
    if (method === 'DELETE') {
      db.prepare('DELETE FROM works WHERE id = ?').run(id);
      send(res, 200, { ok: true });
      return;
    }
    const body = await readBody(req);
    const title = cleanText(body.title, 'название работы');
    const date = cleanDate(body.date);
    db.prepare('UPDATE works SET title = ?, work_date = ? WHERE id = ?').run(title, date, id);
    send(res, 200, { ok: true });
    return;
  }

  match = path.match(/^\/api\/works\/(\d+)\/grades$/);
  if (match && method === 'PUT') {
    assertPermission(user, 'grades.manage');
    assertGradesEnabled();
    const id = parseId(match[1]);
    const work = db.prepare(`
      SELECT w.id, s.group_id AS groupId
      FROM works w JOIN subjects s ON s.id = w.subject_id
      WHERE w.id = ?
    `).get(id);
    if (!work) fail(404, 'Работа не найдена');
    assertGroupAccess(user, work.groupId);
    const body = await readBody(req);
    const studentId = requireStudentInGroup(body.studentId, work.groupId);
    if (body.value == null || body.value === '') {
      db.prepare('DELETE FROM grades WHERE work_id = ? AND student_id = ?').run(id, studentId);
      send(res, 200, { ok: true });
      return;
    }
    const value = Number(body.value);
    if (!Number.isInteger(value) || value < 2 || value > 5) fail(400, 'Оценка от 2 до 5');
    db.prepare(`
      INSERT INTO grades (work_id, student_id, value) VALUES (?, ?, ?)
      ON CONFLICT(work_id, student_id) DO UPDATE SET value = excluded.value
    `).run(id, studentId, value);
    send(res, 200, { ok: true });
    return;
  }

  fail(404, 'Не найдено');
}

function authFromReq(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    return String(url.searchParams.get('token') || '').trim();
  } catch {
    return '';
  }
}

async function serveUpload(req, res, urlPath) {
  const token = authFromReq(req);
  if (!token || token.length < 32 || token.length > 128 || !/^[a-f0-9]+$/i.test(token)) {
    fail(401, 'Нужен вход');
  }
  const session = db.prepare('SELECT token, expires_at, user_id AS userId FROM sessions WHERE token = ?').get(token);
  if (!session || session.expires_at < Date.now()) fail(401, 'Сессия истекла, войдите снова');
  const rel = decodeURIComponent(urlPath.replace(/^\/uploads\/?/, '')).replace(/^\/+/, '');
  if (!rel || rel.includes('..') || path.isAbsolute(rel)) {
    res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
    res.end('Не найдено');
    return;
  }
  const full = path.normalize(path.join(uploadsDir, rel));
  const relative = path.relative(uploadsDir, full);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
    res.end('Не найдено');
    return;
  }
  try {
    const data = await readFile(full);
    const ext = path.extname(full).toLowerCase();
    const type = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    res.writeHead(200, securityHeaders({
      'Content-Type': type,
      'Cache-Control': 'private, max-age=3600',
    }));
    res.end(data);
  } catch {
    res.writeHead(404, securityHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }));
    res.end('Не найдено');
  }
}

async function onRequest(req, res) {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    let reqPath = url.pathname;
    if (reqPath.length > 1 && reqPath.endsWith('/')) reqPath = reqPath.slice(0, -1);
    if (reqPath.startsWith('/api/')) {
      await handleApi(req, res, reqPath);
      return;
    }
    if (reqPath.startsWith('/uploads/')) {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Метод не поддерживается');
        return;
      }
      await serveUpload(req, res, reqPath);
      return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Метод не поддерживается');
      return;
    }
    await serveStatic(res, reqPath);
  } catch (error) {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    if (!res.headersSent) send(res, status, { error: status >= 500 ? 'Внутренняя ошибка' : error.message });
  }
}

function listen(port) {
  const server = createServer(onRequest);
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && port < PORT + 15) {
      listen(port + 1);
      return;
    }
    console.error(error);
    process.exit(1);
  });
  server.listen(port, '0.0.0.0', () => {
    listenPort = server.address().port;
    const meta = publicMeta();
    console.log('');
    console.log('  Журнал запущен');
    console.log(`  Локально:  http://localhost:${listenPort}`);
    if (!IS_PROD && meta._mustChange) console.log('  Вход:      admin / admin');
    console.log('');
  });
}

process.on('SIGINT', async () => {
  try { await telegramBot?.stop?.({ silent: true }); } catch { /* */ }
  try { db.close(); } catch { /* already closed */ }
  process.exit(0);
});

if (!existsSync(publicDir)) {
  console.error('Нет папки public');
  process.exit(1);
}

try {
  const cleaned = autoMergeSubjectDuplicates();
  if (cleaned.merged) console.log(`  Дубли предметов объединены: ${cleaned.merged}`);
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_group_norm ON subjects(group_id, norm_key)');
} catch (error) {
  console.warn('Не удалось объединить дубли предметов при старте:', error.message);
}

function listGroupsForTelegram() {
  return db.prepare(`
    SELECT id, name, schedule_code, schedule_aliases FROM groups ORDER BY name COLLATE NOCASE
  `).all().map((row) => ({
    id: row.id,
    name: row.name,
    scheduleCode: row.schedule_code || '',
    scheduleAliases: parseScheduleAliases(row.schedule_aliases),
  }));
}

let telegramRestartTimer = null;
function queueTelegramBotRestart() {
  if (!telegramBot) return;
  if (telegramRestartTimer) clearTimeout(telegramRestartTimer);
  telegramRestartTimer = setTimeout(() => {
    telegramBot.restart().catch((error) => {
      console.warn('[telegram] restart:', error.message || error);
    });
  }, 400);
}

telegramBot = createTelegramBot({
  getSettings,
  patchSettings: (patch) => setSettings(patch),
  listGroups: listGroupsForTelegram,
  calendarDay,
  weekdayOfDate,
  log: (msg) => console.log(`[telegram] ${msg}`),
});

restartScheduleAutoSyncTimer();
queueTelegramBotRestart();
listen(PORT);
