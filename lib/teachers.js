/** Нормализация и сопоставление ФИО педагогов из расписания. */

const TITLE_RE = /^\s*(преп\.?|преподаватель|доц\.?|профессор|проф\.?|ст\.?\s*преп\.?)\s+/i;
/** Без \b: в JS граница слова не видит кириллицу, поэтому «ауд 705» раньше не срезалось. */
const ROOM_TAIL_RE = /(?:^|[\s,;|/])(?:ауд\.?:?|каб\.?:?|комн\.?:?|аудитория|кабинет)\s*([0-9]{1,4}[а-яa-z]?|н\/к)?\s*$/i;
const ROOM_INLINE_RE = /(?:^|[\s,;|/])(?:ауд\.?:?|каб\.?:?|комн\.?:?|аудитория|кабинет)\s*[0-9]{1,4}[а-яa-z]?(?=[\s,;|/]|$)/gi;
const STADIUM_TAIL_RE = /(?:^|[\s,;|/])(стадион\s*.*)$/i;
const NK_TAIL_RE = /(?:^|[\s,;|/])(н\/к)(?:\s+\d{1,4}[а-яa-z]?)?\s*$/i;
const BARE_ROOM_RE = /(?:^|[\s,;|/])\d{3,4}[а-яa-z]?(?=[\s,;|/]|$)/g;
const TRAILING_NOISE_RE = /(?:^|[\s,;|/])(?:новый\s+корпус|с\/з|спорт\.?\s*зал|спортзал|до\s+\d{1,2}[./]\d{2}\b.*)$/i;
/** Мусор из «схлопнутых» ячеек Excel: предмет/вид занятия вместо ФИО. */
const LESSON_NOISE_RE = /(?:лекция|практ\.?\s*занят|лаб\.?|семинар|дисциплин|история\s+россии|преп\.?)/i;
/** Без однобуквенных «и»/«с» — они же бывают инициалами (А.И., С.В.). */
const NOISE_TOKENS = new Set([
  'ауд', 'каб', 'комн', 'аудитория', 'кабинет', 'стадион', 'или', '/',
  'новый', 'корпус', 'сз', 'нк',
]);

/**
 * Известные кураторы: ФИО (как в Excel) → коды групп.
 * Куратор видит полное расписание группы и может отмечать явку, даже если своих пар там нет.
 */
export const KNOWN_TEACHER_CURATORS = Object.freeze([
  { name: 'Абдель Хафез Е.А.', aliases: ['Абдель Хафес Е.А.', 'Абель Хафез Е.А.'], groups: ['ИК-31/9'] },
]);

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
    room = cleanCellTail(match[0]) || 'н/к';
  } else if ((match = text.match(TRAILING_NOISE_RE))) {
    text = text.slice(0, match.index).trim();
  }

  // Голая аудитория в хвосте: «Беликова Н.Л. 702»
  const bare = text.match(/(?:^|[\s,;|/])(\d{3,4}[а-яa-z]?)\s*$/i);
  if (bare && !room) {
    text = text.slice(0, bare.index).trim();
    room = bare[1];
  }

  const teacher = text.replace(/[,;|/]+$/g, '').trim();
  return { teacher, room };
}

function cleanCellTail(chunk) {
  return String(chunk || '').replace(/^[\s,;|/]+/, '').replace(/\s+/g, ' ').trim();
}

export function cleanTeacherName(raw) {
  return splitTeacherAndRoom(raw).teacher;
}

/** Убирает аудитории/мусор из ячейки Excel, оставляет ФИО. */
export function cleanTeacherCell(raw) {
  let text = stripTeacherPrefix(raw);
  if (!text) return '';
  const split = splitTeacherAndRoom(text);
  text = split.teacher;
  text = text
    .replace(ROOM_INLINE_RE, ' ')
    .replace(BARE_ROOM_RE, ' ')
    .replace(TRAILING_NOISE_RE, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[|/]+/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/[,;]+$/g, '')
    .trim();
  return text;
}

function isNameToken(token) {
  if (!token) return false;
  const lower = token.toLowerCase().replace(/\.+$/, '');
  if (NOISE_TOKENS.has(lower)) return false;
  if (/^\d+[а-яa-z]?$/i.test(token)) return false;
  if (/^\d{1,2}[./]\d{2}/.test(token)) return false;
  return /[a-zа-яё]/i.test(token);
}

function isInitialToken(token) {
  const bare = String(token || '').replace(/\.+$/g, '');
  return /^[a-zа-яё]$/i.test(bare);
}

/**
 * Разбирает ФИО с составной фамилией: «Абдель Хафез Е.А.» →
 * { surname: 'Абдель Хафез', initials: 'еа', display: 'Абдель Хафез Е.А.' }
 */
export function parseTeacherNameParts(raw) {
  const cleaned = cleanTeacherCell(raw);
  if (!cleaned) return { surname: '', initials: '', display: '', tokens: [] };

  const spaced = cleaned
    .replace(/\./g, ' ')
    .replace(/[,;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const tokens = spaced.split(' ').filter(isNameToken);
  if (!tokens.length) return { surname: '', initials: '', display: '', tokens: [] };

  const initials = [];
  while (tokens.length > 1 && isInitialToken(tokens[tokens.length - 1])) {
    initials.unshift(tokens.pop().replace(/\.+$/g, '')[0].toLowerCase().replace(/ё/g, 'е'));
  }

  // Если инициалов нет, но последний токен короткий «ЕА»/«АИ» без точек — не трогаем:
  // одно слово остаётся фамилией (редкий кейс).
  const surnameTokens = tokens;
  const surname = surnameTokens.join(' ');
  const initialsJoined = initials.join('');
  const display = initialsJoined
    ? `${surname} ${[...initialsJoined].map((ch) => `${ch.toUpperCase()}.`).join('')}`
    : surname;

  return {
    surname,
    initials: initialsJoined,
    display,
    tokens: [...surnameTokens, ...initials],
  };
}

/** Несколько преподавателей в одной ячейке + вытаскивание ФИО из «грязных» хвостов. */
export function splitTeacherNames(raw) {
  const cleaned = cleanTeacherCell(raw);
  if (!cleaned) return [];
  const parts = cleaned
    .split(/[,;]+/)
    .map((part) => part.replace(BARE_ROOM_RE, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const out = [];
  for (const part of parts) {
    const name = extractPlausibleTeacherName(part);
    if (name) out.push(name);
  }
  return out;
}

/** Достаёт одно валидное ФИО из куска ячейки (отбрасывает предметы/даты). */
export function extractPlausibleTeacherName(raw) {
  let text = cleanTeacherCell(raw);
  if (!text) return '';

  // Если в хвосте остался предмет после «;» или даты — берём только ведущее ФИО.
  if (LESSON_NOISE_RE.test(text) || /\bдо\s+\d{1,2}[./]\d{2}/i.test(text)) {
    const fio = text.match(
      /^([А-ЯЁA-Z][а-яёa-zА-ЯЁA-Z\-]+(?:\s+[А-ЯЁA-Z][а-яёa-zА-ЯЁA-Z\-]+)*\s+[А-ЯA-Z]\.?\s*[А-ЯA-Z]\.?)/,
    );
    text = fio ? fio[1].trim() : '';
  }
  if (!text || LESSON_NOISE_RE.test(text)) return '';

  const parts = parseTeacherNameParts(text);
  if (!parts.surname) return '';
  // Фамилия должна быть словом ≥2 букв; голые инициалы не считаем педагогом.
  if (!/[a-zа-яё]{2,}/i.test(parts.surname.replace(/-/g, ''))) return '';
  return parts.display || parts.surname;
}

/** Все уникальные ФИО из ячейки (для discover). */
export function extractTeacherNames(raw) {
  const found = [];
  const push = (value) => {
    const name = extractPlausibleTeacherName(value);
    if (name) found.push(name);
  };

  for (const part of splitTeacherNames(raw)) push(part);

  // «… преп. Абдель Хафез Е.А. ауд. 710» — ФИО не в начале ячейки
  const markerRe = /(?:^|[\s,;])(?:преп\.?|преподаватель)\s+(.+?)(?=\s+(?:ауд\.?:?|каб\.?:?|комн\.?:?|аудитория|кабинет|стадион|н\/к)(?:\s|$)|[,;]|$)/gi;
  let match;
  const text = String(raw || '');
  while ((match = markerRe.exec(text))) {
    push(match[1]);
  }

  if (!found.length) push(raw);

  return [...new Set(found)];
}

/** Ключ для матча: фамилия (составная без пробелов) + инициалы, lower, ё→е */
export function normalizeTeacherName(raw) {
  const parts = parseTeacherNameParts(raw);
  if (!parts.surname) return '';
  const surname = parts.surname
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[-\s]+/g, '');
  return `${surname}${parts.initials ? ` ${parts.initials}` : ''}`.trim();
}

function editDistance(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;
  const prev = new Array(right.length + 1);
  const cur = new Array(right.length + 1);
  for (let j = 0; j <= right.length; j += 1) prev[j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    cur[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      cur[j] = Math.min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= right.length; j += 1) prev[j] = cur[j];
  }
  return prev[right.length];
}

/** Сравнение уже нормализованных ключей «фамилия инициалы». */
export function teacherNormKeysMatch(left, right) {
  if (!left || !right) return false;
  if (left === right) return true;
  const [ls, ...li] = left.split(' ');
  const [rs, ...ri] = right.split(' ');
  const liJoin = li.join('');
  const riJoin = ri.join('');
  const initialsOk = !liJoin || !riJoin
    || liJoin.startsWith(riJoin)
    || riJoin.startsWith(liJoin);
  if (!initialsOk) return false;
  if (ls === rs) return true;
  // Опечатки вроде «Абель» / «Абдель» при тех же инициалах
  const maxDist = Math.max(ls.length, rs.length) >= 6 ? 2 : 1;
  return editDistance(ls, rs) <= maxDist;
}

export function teacherNamesMatch(a, b) {
  return teacherNormKeysMatch(normalizeTeacherName(a), normalizeTeacherName(b));
}

/** Ячейка расписания может содержать ФИО + аудиторию или двух преподавателей. */
export function teacherCellMatches(cell, teacherName) {
  if (!teacherName) return false;
  if (teacherNamesMatch(cell, teacherName)) return true;
  return extractTeacherNames(cell).some((part) => teacherNamesMatch(part, teacherName));
}

export function shortNameFromFull(fullName) {
  const parts = parseTeacherNameParts(fullName);
  if (!parts.surname) {
    const cleaned = cleanTeacherCell(fullName);
    return cleaned.split(/\s+/).filter(isNameToken)[0] || '';
  }
  return parts.display || parts.surname;
}

export function suggestUsernameFromName(fullName) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  const parts = parseTeacherNameParts(fullName);
  const baseSource = parts.surname
    ? `${parts.surname}${parts.initials ? `.${parts.initials}` : ''}`
    : cleanTeacherCell(fullName);
  const base = baseSource
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
