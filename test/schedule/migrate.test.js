import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import {
  ensureUniversalScheduleSchema,
  migrateLegacyWeekTypes,
} from '../../lib/schedule/migrate.js';

test('migration creates N-week plans without changing entry ids', () => {
  const db = new Database(':memory:');
  db.exec(`
    CREATE TABLE groups (id INTEGER PRIMARY KEY, name TEXT, schedule_code TEXT);
    CREATE TABLE schedule_entries (
      id INTEGER PRIMARY KEY,
      group_code TEXT,
      group_id INTEGER,
      week_type TEXT,
      weekday INTEGER,
      pair_num INTEGER,
      time_start TEXT DEFAULT '',
      time_end TEXT DEFAULT '',
      subject_name TEXT,
      lesson_kind TEXT DEFAULT '',
      teacher TEXT DEFAULT '',
      room TEXT DEFAULT '',
      raw_text TEXT DEFAULT '',
      source_sheet TEXT DEFAULT '',
      created_at INTEGER,
      slot_key TEXT DEFAULT '',
      locked INTEGER DEFAULT 0,
      updated_at INTEGER
    );
  `);
  db.prepare('INSERT INTO groups (id, name, schedule_code) VALUES (1, \'ДК-11/9\', \'ДК-11/9\')').run();
  db.prepare(`
    INSERT INTO schedule_entries (id, group_code, group_id, week_type, weekday, pair_num, subject_name, created_at)
    VALUES (101, 'ДК-11/9', 1, 'upper', 1, 1, 'Математика', 1),
           (102, 'ДК-11/9', 1, 'lower', 1, 1, 'Физика', 1),
           (103, 'ДК-11/9', 1, 'all', 2, 1, 'Химия', 1)
  `).run();

  ensureUniversalScheduleSchema(db);
  const stats = migrateLegacyWeekTypes(db);
  assert.equal(stats.plansCreated, 1);

  const plan = db.prepare('SELECT * FROM schedule_plans WHERE group_id = 1').get();
  assert.equal(plan.mode, 'cycle');
  assert.equal(plan.cycle_length, 2);
  const weeks = db.prepare('SELECT * FROM schedule_plan_weeks WHERE plan_id = ? ORDER BY week_index').all(plan.id);
  assert.equal(weeks.length, 2);
  assert.equal(weeks[0].legacy_code, 'upper');
  assert.equal(weeks[1].legacy_code, 'lower');

  const e101 = db.prepare('SELECT * FROM schedule_entries WHERE id = 101').get();
  const e102 = db.prepare('SELECT * FROM schedule_entries WHERE id = 102').get();
  const e103 = db.prepare('SELECT * FROM schedule_entries WHERE id = 103').get();
  assert.equal(e101.id, 101);
  assert.equal(e101.plan_week_id, weeks[0].id);
  assert.equal(e102.plan_week_id, weeks[1].id);
  assert.equal(e103.applies_all_weeks, 1);
});
