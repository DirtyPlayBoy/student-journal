/**
 * Schema + data migration: universal schedule plans / weeks.
 * Preserves schedule_entries.id so lessons.schedule_entry_id stay valid.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { LEGACY_RGGU_ANCHOR, createDefaultWeeks } from './calendar-resolver.js';

export function backupDatabase(dbPath, backupsDir) {
  mkdirSync(backupsDir, { recursive: true });
  if (!existsSync(dbPath)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(backupsDir, `journal-${stamp}.db`);
  copyFileSync(dbPath, dest);
  return dest;
}

export function ensureUniversalScheduleSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schedule_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL UNIQUE,
      mode TEXT NOT NULL DEFAULT 'cycle',
      cycle_length INTEGER NOT NULL DEFAULT 2,
      week_start_day INTEGER NOT NULL DEFAULT 1,
      anchor_date TEXT NOT NULL DEFAULT '',
      anchor_week_index INTEGER NOT NULL DEFAULT 0,
      source_id INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_plan_weeks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      week_index INTEGER NOT NULL,
      label TEXT NOT NULL,
      legacy_code TEXT NOT NULL DEFAULT '',
      date_from TEXT,
      date_to TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      UNIQUE(plan_id, week_index)
    );

    CREATE TABLE IF NOT EXISTS schedule_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      kind TEXT NOT NULL DEFAULT 'url',
      url TEXT NOT NULL DEFAULT '',
      file_path TEXT NOT NULL DEFAULT '',
      original_name TEXT NOT NULL DEFAULT '',
      content_hash TEXT NOT NULL DEFAULT '',
      meta_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS schedule_source_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL,
      content_hash TEXT NOT NULL,
      file_path TEXT NOT NULL DEFAULT '',
      size INTEGER NOT NULL DEFAULT 0,
      fetched_at INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS schedule_parser_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      name TEXT NOT NULL DEFAULT 'default',
      config_json TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0,
      is_draft INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      UNIQUE(plan_id, version)
    );

    CREATE TABLE IF NOT EXISTS schedule_time_grids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      plan_week_id INTEGER,
      pair_num INTEGER NOT NULL,
      time_start TEXT NOT NULL DEFAULT '',
      time_end TEXT NOT NULL DEFAULT '',
      UNIQUE(plan_id, plan_week_id, pair_num)
    );

    CREATE TABLE IF NOT EXISTS schedule_occurrences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      group_id INTEGER NOT NULL,
      lesson_date TEXT NOT NULL,
      pair_num INTEGER NOT NULL,
      schedule_entry_id INTEGER,
      status TEXT NOT NULL DEFAULT 'override',
      subject_name TEXT NOT NULL DEFAULT '',
      lesson_kind TEXT NOT NULL DEFAULT '',
      teacher TEXT NOT NULL DEFAULT '',
      room TEXT NOT NULL DEFAULT '',
      time_start TEXT NOT NULL DEFAULT '',
      time_end TEXT NOT NULL DEFAULT '',
      raw_text TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      UNIQUE(group_id, lesson_date, pair_num)
    );

    CREATE TABLE IF NOT EXISTS schedule_sync_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      plan_id INTEGER,
      source_id INTEGER,
      status TEXT NOT NULL DEFAULT 'ok',
      started_at INTEGER NOT NULL,
      finished_at INTEGER,
      added_count INTEGER NOT NULL DEFAULT 0,
      changed_count INTEGER NOT NULL DEFAULT 0,
      removed_count INTEGER NOT NULL DEFAULT 0,
      error TEXT NOT NULL DEFAULT '',
      meta_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE INDEX IF NOT EXISTS idx_plan_weeks_plan ON schedule_plan_weeks(plan_id);
    CREATE INDEX IF NOT EXISTS idx_parser_configs_plan ON schedule_parser_configs(plan_id, is_active);
    CREATE INDEX IF NOT EXISTS idx_occurrences_date ON schedule_occurrences(group_id, lesson_date);
    CREATE INDEX IF NOT EXISTS idx_sync_runs_group ON schedule_sync_runs(group_id, started_at);
  `);

  ensureColumn(db, 'schedule_entries', 'plan_id', 'plan_id INTEGER');
  ensureColumn(db, 'schedule_entries', 'plan_week_id', 'plan_week_id INTEGER');
  ensureColumn(db, 'schedule_entries', 'week_index', 'week_index INTEGER');
  ensureColumn(db, 'schedule_entries', 'source_cell', "source_cell TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, 'schedule_entries', 'applies_all_weeks', 'applies_all_weeks INTEGER NOT NULL DEFAULT 0');
  ensureColumn(db, 'groups', 'schedule_plan_id', 'schedule_plan_id INTEGER');
}

function ensureColumn(db, table, column, ddl) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name);
  if (!cols.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

function mapLegacyWeek(weekType) {
  const t = String(weekType || '').toLowerCase();
  if (t === 'upper') return { weekIndex: 0, legacyCode: 'upper', label: 'ВЕРХ' };
  if (t === 'lower') return { weekIndex: 1, legacyCode: 'lower', label: 'НИЗ' };
  if (t === 'all') return { weekIndex: null, legacyCode: 'all', label: 'all' };
  return { weekIndex: 0, legacyCode: t || 'w0', label: t || 'Неделя 1' };
}

/**
 * For every group that has schedule_entries (or any group), ensure a plan exists.
 * Migrates upper/lower → cycle length 2 without changing entry ids.
 */
export function migrateLegacyWeekTypes(db) {
  const now = Date.now();
  const groups = db.prepare('SELECT id, name, schedule_code FROM groups').all();
  const insertPlan = db.prepare(`
    INSERT INTO schedule_plans (
      group_id, mode, cycle_length, week_start_day, anchor_date, anchor_week_index,
      active, created_at, updated_at
    ) VALUES (?, 'cycle', 2, 1, ?, 0, 1, ?, ?)
  `);
  const insertWeek = db.prepare(`
    INSERT INTO schedule_plan_weeks (
      plan_id, week_index, label, legacy_code, sort_order
    ) VALUES (?, ?, ?, ?, ?)
  `);
  const updateGroup = db.prepare('UPDATE groups SET schedule_plan_id = ? WHERE id = ?');
  const updateEntry = db.prepare(`
    UPDATE schedule_entries
    SET plan_id = ?, plan_week_id = ?, week_index = ?, applies_all_weeks = ?
    WHERE id = ?
  `);

  const stats = { plansCreated: 0, entriesLinked: 0, groups: 0 };

  const tx = db.transaction(() => {
    for (const group of groups) {
      stats.groups += 1;
      let plan = db.prepare('SELECT * FROM schedule_plans WHERE group_id = ?').get(group.id);
      if (!plan) {
        const info = insertPlan.run(group.id, LEGACY_RGGU_ANCHOR.anchorDate, now, now);
        const planId = Number(info.lastInsertRowid);
        const weeks = createDefaultWeeks(2);
        for (const w of weeks) {
          insertWeek.run(planId, w.weekIndex, w.label, w.legacyCode, w.weekIndex);
        }
        updateGroup.run(planId, group.id);
        plan = db.prepare('SELECT * FROM schedule_plans WHERE id = ?').get(planId);
        stats.plansCreated += 1;
      } else if (!group.schedule_plan_id) {
        updateGroup.run(plan.id, group.id);
      }

      const weekRows = db.prepare('SELECT * FROM schedule_plan_weeks WHERE plan_id = ?').all(plan.id);
      const byIndex = new Map(weekRows.map((w) => [w.week_index, w]));
      const byLegacy = new Map(weekRows.map((w) => [w.legacy_code, w]));

      const entries = db.prepare(`
        SELECT id, week_type, plan_id, plan_week_id FROM schedule_entries WHERE group_id = ?
      `).all(group.id);

      for (const entry of entries) {
        if (entry.plan_week_id && entry.plan_id) continue;
        const mapped = mapLegacyWeek(entry.week_type);
        if (mapped.legacyCode === 'all') {
          // Link to week 0 and mark applies_all_weeks; calendar resolver still filters by week
          const w0 = byIndex.get(0) || weekRows[0];
          updateEntry.run(plan.id, w0?.id || null, 0, 1, entry.id);
        } else {
          const w = byLegacy.get(mapped.legacyCode) || byIndex.get(mapped.weekIndex) || weekRows[0];
          updateEntry.run(plan.id, w?.id || null, mapped.weekIndex ?? 0, 0, entry.id);
        }
        stats.entriesLinked += 1;
      }
    }
  });
  tx();
  return stats;
}

export function getOrCreatePlanForGroup(db, groupId) {
  let plan = db.prepare('SELECT * FROM schedule_plans WHERE group_id = ?').get(groupId);
  if (plan) return plan;
  migrateLegacyWeekTypes(db);
  plan = db.prepare('SELECT * FROM schedule_plans WHERE group_id = ?').get(groupId);
  if (plan) return plan;
  const now = Date.now();
  const info = db.prepare(`
    INSERT INTO schedule_plans (
      group_id, mode, cycle_length, week_start_day, anchor_date, anchor_week_index,
      active, created_at, updated_at
    ) VALUES (?, 'cycle', 2, 1, ?, 0, 1, ?, ?)
  `).run(groupId, LEGACY_RGGU_ANCHOR.anchorDate, now, now);
  const planId = Number(info.lastInsertRowid);
  const weeks = createDefaultWeeks(2);
  const insertWeek = db.prepare(`
    INSERT INTO schedule_plan_weeks (plan_id, week_index, label, legacy_code, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const w of weeks) insertWeek.run(planId, w.weekIndex, w.label, w.legacyCode, w.weekIndex);
  db.prepare('UPDATE groups SET schedule_plan_id = ? WHERE id = ?').run(planId, groupId);
  return db.prepare('SELECT * FROM schedule_plans WHERE id = ?').get(planId);
}
