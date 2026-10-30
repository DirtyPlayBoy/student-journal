import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseCellText,
  DEFAULT_SEPARATOR_RULES,
  emptyParserConfig,
  parseWithConfig,
} from '../../lib/schedule/index.js';
import XLSX from 'xlsx';

test('parses classic discipline cell', () => {
  const { fields } = parseCellText(
    'Русский язык (практ. занятие) преп. Истратова Л.Э. ауд. 406',
    DEFAULT_SEPARATOR_RULES,
  );
  assert.equal(fields.subjectName, 'Русский язык');
  assert.equal(fields.lessonKind, 'практ. занятие');
  assert.equal(fields.teacher, 'Истратова Л.Э.');
  assert.equal(fields.room, '406');
});

test('optional fields do not break parser', () => {
  const a = parseCellText('Математика').fields;
  assert.equal(a.subjectName, 'Математика');
  assert.equal(a.teacher, '');
  assert.equal(a.room, '');

  const b = parseCellText('Математика (лекция)').fields;
  assert.equal(b.lessonKind, 'лекция');
  assert.equal(b.teacher, '');
});

test('empty / dash cells return null fields', () => {
  assert.equal(parseCellText('').fields, null);
  assert.equal(parseCellText('—').fields, null);
});

test('config engine maps manual cells from workbook', () => {
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ['День', 'Пара', 'Дисциплина'],
    ['ПОНЕДЕЛЬНИК', '1. 09.00-10.30', 'Информатика (лекция) преп. Иванов И.И. ауд. 101'],
    ['', '2. 11.00-12.30', ''],
    ['', '3. 13.00-14.30', 'Физика преп. Петров П.П. ауд. 202'],
  ]);
  XLSX.utils.book_append_sheet(wb, sheet, 'Лист1');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const config = emptyParserConfig({ cycleLength: 1 });
  config.weeks[0].sheet = 'Лист1';
  config.weeks[0].days = {
    1: {
      mode: 'manual',
      cells: [
        { a1: 'C2', pairNum: 1 },
        { a1: 'C4', pairNum: 3 },
      ],
    },
  };
  config.timePriority = 'manual';

  const result = parseWithConfig(buffer, config);
  assert.equal(result.slots.length, 2);
  assert.equal(result.slots[0].subjectName, 'Информатика');
  assert.equal(result.slots[0].teacher, 'Иванов И.И.');
  assert.equal(result.slots[0].room, '101');
  assert.equal(result.slots[1].pairNum, 3);
  assert.equal(result.validation.ok, true);
});
