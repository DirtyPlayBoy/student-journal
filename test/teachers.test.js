import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanTeacherCell,
  splitTeacherAndRoom,
  shortNameFromFull,
  normalizeTeacherName,
  teacherNamesMatch,
  teacherCellMatches,
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
