/**
 * Demo seed: empty institution with a couple of sample groups (no real people).
 * Usage: npm run seed:demo
 */
import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data');
mkdirSync(dataDir, { recursive: true });
const db = new Database(join(dataDir, 'journal.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    schedule_code TEXT,
    schedule_url TEXT DEFAULT '',
    schedule_aliases TEXT DEFAULT '[]',
    created_at INTEGER
  );
`);

const upsert = db.prepare(`
  INSERT INTO settings (key, value) VALUES (?, ?)
  ON CONFLICT(key) DO UPDATE SET value = excluded.value
`);

upsert.run('institutionName', 'Электронный журнал');
upsert.run('institutionSubtitle', 'Демо · посещаемость и расписание');
upsert.run('institutionKind', 'college');
upsert.run('excelEnabled', '1');
upsert.run('scheduleUrls', '[]');

const count = db.prepare('SELECT COUNT(*) AS n FROM groups').get().n;
if (!count) {
  const now = Date.now();
  const insert = db.prepare(`
    INSERT INTO groups (name, schedule_code, schedule_url, schedule_aliases, created_at)
    VALUES (?, ?, '', '[]', ?)
  `);
  insert.run('Группа А-101', 'А-101', now);
  insert.run('Группа Б-202', 'Б-202', now);
  console.log('Созданы демо-группы: А-101, Б-202');
} else {
  console.log(`Группы уже есть (${count}), пропуск.`);
}

console.log('Демо-настройки записаны. Запустите: npm start');
console.log('Вход по умолчанию: admin / admin123 (смените пароль в профиле).');
db.close();
