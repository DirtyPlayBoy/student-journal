/** Нормализация и сопоставление ФИО педагогов из расписания. */

const TITLE_RE = /^\s*(преп\.?|преподаватель|доц\.?|профессор|проф\.?|ст\.?\s*преп\.?)\s+/i;
/** Без \b: в JS граница слова не видит кириллицу, поэтому «ауд 705» раньше не срезалось. */
const ROOM_TAIL_RE = /(?:^|[\s,;|/])(?:ауд\.?:?|каб\.?:?|комн\.?:?|аудитория|кабинет)\s*([0-9]{1,4}[а-яa-z]?|н\/к)?\s*$/i;
const ROOM_INLINE_RE = /(?:^|[\s,;|/])(?:ауд\.?:?|каб\.?:?|комн\.?:?|аудитория|кабинет)\s*[0-9]{1,4}[а-яa-z]?(?=[\s,;|/]|$)/gi;
const STADIUM_TAIL_RE = /(?:^|[\s,;|/])(стадион\s*.*)$/i;
const NK_TAIL_RE = /(?:^|[\s,;|/])(н\/к)\s*$/i;
const BARE_ROOM_RE = /(?:^|[\s,;|/])\d{3,4}[а-яa-z]?(?=[\s,;|/]|$)/g;
/** Без однобуквенных «и»/«с» — они же бывают инициалами (А.И., С.В.). */
const NOISE_TOKENS = new Set(['ауд', 'каб', 'комн', 'аудитория', 'кабинет', 'стадион', 'или', '/']);

export function stripTeacherPrefix(raw) {
  return String(raw || '')
    .replace(/\u00A0/g, ' ')
    .replace(TITLE_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Отделяет аудиторию от ФИО: «Сивкова М.М. ауд 705» → { teacher, room }.
 * Нужен как safety-net, когда в Excel «ауд» без точки.
 */
export function splitTeacherAndRoom(raw) {
  let text = stripTeacherPrefix(raw);
  if (!text) return { teacher: '', room: '' };

  let room = '';
  let match = text.match(ROOM_TAIL_RE);
  if (match) {
    text = text.slice(0, match.index).trim();
    room = String(match[1] || '').trim();
  } else if ((match = text.match(STADIUM_TAIL_RE))) {
    text = text.slice(0, match.index).trim();
    room = String(match[1] || '').trim();
  } else if ((match = text.match(NK_TAIL_RE))) {
    text = text.slice(0, match.index).trim();
    room = 'н/к';
  }

  const teacher = text.replace(/[,;|/]+$/g, '').trim();
  return { teacher, room };
}

export function cleanTeacherName(raw) {
  return splitTeacherAndRoom(raw).teacher;
}

/** Убирает аудитории/мусор из ячейки Excel, оставляет ФИО. */
export function cleanTeacherCell(raw) {
  let text = stripTeacherPrefix(raw);
  if (!text) return '';
  // Сначала хвостовую аудиторию, потом встроенные «ауд N» посреди списка
  const split = splitTeacherAndRoom(text);
  text = split.teacher;
  text = text
    .replace(ROOM_INLINE_RE, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[|/]+/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/[,;]+$/g, '')
    .trim();
  return text;
}

/** Несколько преподавателей в одной ячейке. */
export function splitTeacherNames(raw) {
  return cleanTeacherCell(raw)
    .split(/[,;]+/)
    .map((part) => part
      .replace(BARE_ROOM_RE, ' ')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean);
}

function isNameToken(token) {
  if (!token) return false;
  const lower = token.toLowerCase().replace(/\.+$/, '');
  if (NOISE_TOKENS.has(lower)) return false;
  if (/^\d+[а-яa-z]?$/i.test(token)) return false;
  return /[a-zа-яё]/i.test(token);
}

/** Ключ для матча: фамилия + инициалы, lower, ё→е */
export function normalizeTeacherName(raw) {
  const text = cleanTeacherCell(raw)
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/\./g, ' ')
    .replace(/[,;]+/g, ' ')
    .replace(BARE_ROOM_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  const parts = text.split(' ').filter(isNameToken);
  if (!parts.length) return '';
  const surname = parts[0].replace(/-/g, '');
  const initials = parts.slice(1).map((p) => p[0]).join('');
  return `${surname}${initials ? ` ${initials}` : ''}`.trim();
}

export function teacherNamesMatch(a, b) {
  const left = normalizeTeacherName(a);
  const right = normalizeTeacherName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const [ls, ...li] = left.split(' ');
  const [rs, ...ri] = right.split(' ');
  if (ls !== rs) return false;
  const liJoin = li.join('');
  const riJoin = ri.join('');
  if (!liJoin || !riJoin) return true;
  return liJoin.startsWith(riJoin) || riJoin.startsWith(liJoin);
}

/** Ячейка расписания может содержать ФИО + аудиторию или двух преподавателей. */
export function teacherCellMatches(cell, teacherName) {
  if (!teacherName) return false;
  if (teacherNamesMatch(cell, teacherName)) return true;
  return splitTeacherNames(cell).some((part) => teacherNamesMatch(part, teacherName));
}

export function shortNameFromFull(fullName) {
  const cleaned = cleanTeacherCell(fullName);
  if (!cleaned) return '';
  const norm = normalizeTeacherName(cleaned);
  if (!norm) return cleaned.split(/\s+/).filter(isNameToken)[0] || '';
  const [surnameKey, initials = ''] = norm.split(' ');
  const originalSurname = cleaned.split(/\s+/).filter(isNameToken)[0] || surnameKey;
  const pretty = initials
    ? `${originalSurname} ${[...initials].map((ch) => `${ch.toUpperCase()}.`).join('')}`
    : originalSurname;
  return pretty.trim();
}

export function suggestUsernameFromName(fullName) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const cleaned = cleanTeacherCell(fullName);
  const base = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .join('.')
    .split('')
    .map((ch) => (/[a-z0-9]/.test(ch) ? ch : (map[ch] ?? (ch === '.' || ch === '-' || ch === '_' ? ch : ''))))
    .join('')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '')
    .slice(0, 40);
  return base || 'teacher';
}
