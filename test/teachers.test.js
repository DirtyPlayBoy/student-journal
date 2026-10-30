import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanTeacherCell,
  splitTeacherAndRoom,
  shortNameFromFull,
  normalizeTeacherName,
  teacherNamesMatch,
  teacherCellMatches,
  extractTeacherNames,
  extractPlausibleTeacherName,
  parseTeacherNameParts,
} from '../lib/teachers.js';

test('strips room without period: ауд 705', () => {
  assert.equal(cleanTeacherCell('Сивкова М.М. ауд 705'), 'Сивкова М.М.');
  assert.deepEqual(splitTeacherAndRoom('Сивкова М.М. ауд 705'), {
    teacher: 'Сивкова М.М.',
    room: '705',
  });
  assert.equal(shortNameFromFull('Сивкова М.М. ауд 705'), 'Сивкова М.М.');
});

test('strips room with period and colon', () => {
  assert.equal(cleanTeacherCell('Истратова Л.Э. ауд. 406'), 'Истратова Л.Э.');
  assert.equal(splitTeacherAndRoom('Петров П.П. ауд: 202').room, '202');
  assert.equal(cleanTeacherCell('Беликова Е.А. каб 12'), 'Беликова Е.А.');
});

test('keeps clean names untouched', () => {
  assert.equal(cleanTeacherCell('Колчин А.И.'), 'Колчин А.И.');
  assert.equal(shortNameFromFull('Колчин А.И.'), 'Колчин А.И.');
  assert.equal(normalizeTeacherName('Колчин А.И.'), 'колчин аи');
});

test('compound surname Абдель Хафез', () => {
  const name = 'Абдель Хафез Е.А.';
  assert.equal(cleanTeacherCell(name), 'Абдель Хафез Е.А.');
  assert.equal(normalizeTeacherName(name), 'абдельхафез еа');
  assert.equal(shortNameFromFull(name), 'Абдель Хафез Е.А.');
  assert.deepEqual(parseTeacherNameParts(name), {
    surname: 'Абдель Хафез',
    initials: 'еа',
    display: 'Абдель Хафез Е.А.',
    tokens: ['Абдель', 'Хафез', 'е', 'а'],
  });
  assert.equal(teacherNamesMatch(name, 'Абдель Хафес Е.А.'), true);
  assert.equal(teacherNamesMatch(name, 'Абель Хафез Е.А.'), true);
  assert.equal(teacherCellMatches('преп. Абдель Хафез Е.А. ауд. 710', name), true);
});

test('strips новый корпус / bare room / н/к tail', () => {
  assert.equal(cleanTeacherCell('Украинцева С.Д. новый корпус'), 'Украинцева С.Д.');
  assert.equal(cleanTeacherCell('Беликова Н.Л. 702'), 'Беликова Н.Л.');
  assert.equal(shortNameFromFull('Соболева Э.П. новый корпус'), 'Соболева Э.П.');
  assert.equal(normalizeTeacherName('Бурцев Е.А. с/з'), 'бурцев еа');
});

test('extracts FIO from mashed schedule cells', () => {
  assert.equal(
    extractPlausibleTeacherName('Коньков П.А. до 23.11; История России (практ. занятие) преп. Коньков П.А. 07.12'),
    'Коньков П.А.',
  );
  assert.deepEqual(
    extractTeacherNames('Абдель Хафез Е.А.; Сивкова М.М. ауд 705'),
    ['Абдель Хафез Е.А.', 'Сивкова М.М.'],
  );
});

test('teacher match ignores leaked room', () => {
  assert.equal(teacherNamesMatch('Сивкова М.М. ауд 705', 'Сивкова М.М.'), true);
  assert.equal(teacherCellMatches('Сивкова М.М. ауд 709', 'Сивкова М.М.'), true);
});

test('parseCellText separates bare ауд via safety-net', async () => {
  const { parseCellText, DEFAULT_SEPARATOR_RULES } = await import('../lib/schedule/text-parser.js');
  const { fields } = parseCellText(
    'Право (лекция) преп. Сивкова М.М. ауд 705',
    DEFAULT_SEPARATOR_RULES,
  );
  assert.equal(fields.teacher, 'Сивкова М.М.');
  assert.equal(fields.room, '705');
});

test('parseCellText keeps compound teacher surname', async () => {
  const { parseCellText, DEFAULT_SEPARATOR_RULES } = await import('../lib/schedule/text-parser.js');
  const { fields } = parseCellText(
    'Коммуникативный практикум (лекция) преп. Абдель Хафез Е.А. ауд. 710',
    DEFAULT_SEPARATOR_RULES,
  );
  assert.equal(fields.teacher, 'Абдель Хафез Е.А.');
  assert.equal(fields.room, '710');
});
