import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestDayMappings } from '../../lib/schedule/layout-suggest.js';

test('suggests by_day_header when weekday column present', () => {
  const rows = [
    ['День', 'Пара', 'Дисциплина'],
    ['Понедельник', '1. 09:00-10:30', 'Математика преп. Иванов ауд. 1'],
    ['', '2. 10:40-12:10', 'Физика'],
    ['Вторник', '1. 09:00-10:30', 'История'],
    ['', '2', 'Химия'],
    ['Среда', '1', 'Литература'],
  ];
  const sheet = { name: 'Лист1', rows, rowCount: rows.length, colCount: 3 };
  const out = suggestDayMappings(sheet, {});
  assert.equal(out.mode, 'by_day_header');
  assert.ok(out.confidence >= 0.5);
  assert.equal(out.days['1'].mode, 'by_day_header');
  assert.equal(out.days['1'].discCol, 2);
});
