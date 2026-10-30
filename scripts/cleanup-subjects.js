import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const db = new Database(path.join(root, 'data', 'journal.db'));
const result = db.prepare(`
  DELETE FROM subjects
  WHERE id NOT IN (
    SELECT DISTINCT subject_id FROM lessons
    UNION SELECT subject_id FROM credits
    UNION SELECT subject_id FROM works
  )
  AND name NOT IN (SELECT DISTINCT subject_name FROM schedule_entries)
`).run();
console.log('removed', result.changes);
console.log(db.prepare(`
  SELECT g.name AS groupName, COUNT(*) AS subjects
  FROM subjects s JOIN groups g ON g.id = s.group_id
  GROUP BY g.id ORDER BY g.name
`).all());
db.close();
