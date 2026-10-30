/**
 * Built-in college schedule parser preset (3-column group blocks).
 * Compatible with common Excel / Google Sheets layouts where each group
 * owns day + pair + subject columns.
 */
import XLSX from 'xlsx';
import { cleanCell, parseCellText, DEFAULT_SEPARATOR_RULES } from '../text-parser.js';
import { normalizeGroupCode } from '../normalize.js';

function parseWeekday(text) {
  const raw = cleanCell(text).toLowerCase();
  if (!raw) return null;
  const map = {
    понедельник: 1, вторник: 2, среда: 3, четверг: 4, пятница: 5, суббота: 6, воскресенье: 7,
  };
  for (const [name, num] of Object.entries(map)) {
    if (raw.startsWith(name)) return num;
  }
  return null;
}

function parsePair(text) {
  const raw = cleanCell(text);
  const match = raw.match(/^(\d+)\s*\.?\s*(?:(\d{1,2}[.:]\d{2})\s*[-–—]\s*(\d{1,2}[.:]\d{2}))?/i);
  if (!match) return null;
  const norm = (t) => (t || '').replace('.', ':').padStart(5, '0');
  return {
    pairNum: Number(match[1]),
    timeStart: match[2] ? norm(match[2]) : '',
    timeEnd: match[3] ? norm(match[3]) : '',
  };
}

function extractGroupBlocks(headerRows) {
  const found = [];
  const seen = new Set();
  for (const row of headerRows) {
    for (let col = 0; col < row.length; col += 1) {
      const cell = cleanCell(row[col]);
      if (!cell) continue;
      const parts = cell.split('+').map((part) => normalizeGroupCode(part)).filter(Boolean);
      if (!parts.length) continue;
      let discCol = col;
      if (/дни\s*недели|пара|название/i.test(cell)) continue;
      let dayCol = discCol - 2;
      let pairCol = discCol - 1;
      if (dayCol < 0) {
        dayCol = discCol;
        pairCol = discCol + 1;
        discCol = discCol + 2;
      }
      for (const code of parts) {
        const key = `${code}:${discCol}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ code, dayCol, pairCol, discCol });
      }
    }
  }
  return found;
}

function sheetWeekType(sheetName) {
  const name = String(sheetName).toLowerCase();
  if (name.includes('верх')) return 'upper';
  if (name.includes('нижн')) return 'lower';
  return 'all';
}

export const RGGU_PRESET_META = Object.freeze({
  id: 'college-blocks',
  name: 'Блоки групп (3 колонки)',
  description: 'Автоопределение групп по заголовкам, дни вертикально, дисциплина в одной ячейке с преп./ауд.',
});

export function buildRgguParserConfig({ groupCode = '', groupId = null, weekTypes = ['upper', 'lower'] } = {}) {
  return {
    version: 1,
    preset: RGGU_PRESET_META.id,
    groupCode,
    groupId,
    separators: DEFAULT_SEPARATOR_RULES.map((r) => ({ ...r })),
    timePriority: 'excel',
    timeGrid: [],
    weeks: weekTypes.map((code, i) => ({
      weekIndex: i,
      label: code === 'upper' ? 'ВЕРХ' : code === 'lower' ? 'НИЗ' : `Неделя ${i + 1}`,
      legacyCode: code,
      sheet: '',
      days: {},
      auto: true,
    })),
    autoDetect: {
      type: 'rggu_blocks',
    },
  };
}

/** Original buffer parser used by seed/import until a custom config exists */
export function parseWorkbookBuffer(buffer, sourceLabel = '') {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const entries = [];

  for (const sheetName of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, defval: '', raw: false });
    if (!rows.length) continue;
    const weekType = sheetWeekType(sheetName);
    const blocks = extractGroupBlocks(rows.slice(0, 3));
    if (!blocks.length) continue;

    const weekdayByBlock = new Map(blocks.map((b) => [b.code + ':' + b.discCol, null]));

    for (let r = 0; r < rows.length; r += 1) {
      const row = rows[r];
      let rowWeekday = null;
      for (let c = 0; c < row.length; c += 3) {
        const wd = parseWeekday(row[c]);
        if (wd) { rowWeekday = wd; break; }
      }

      for (const block of blocks) {
        const key = block.code + ':' + block.discCol;
        const dayText = cleanCell(row[block.dayCol]);
        const wd = parseWeekday(dayText) || rowWeekday || weekdayByBlock.get(key);
        if (parseWeekday(dayText) || rowWeekday) weekdayByBlock.set(key, wd);

        const pairInfo = parsePair(row[block.pairCol]);
        const discRaw = row[block.discCol];
        const parsed = parseCellText(discRaw, DEFAULT_SEPARATOR_RULES);
        if (!pairInfo || !parsed.fields || !wd) continue;

        entries.push({
          groupCode: block.code,
          weekType,
          weekIndex: weekType === 'lower' ? 1 : weekType === 'upper' ? 0 : 0,
          weekday: wd,
          pairNum: pairInfo.pairNum,
          timeStart: pairInfo.timeStart,
          timeEnd: pairInfo.timeEnd,
          subjectName: parsed.fields.subjectName,
          lessonKind: parsed.fields.lessonKind,
          teacher: parsed.fields.teacher,
          room: parsed.fields.room,
          rawText: parsed.fields.rawText,
          sourceSheet: sheetName,
          sourceLabel,
          sourceCell: null,
        });
      }
    }
  }

  const uniq = new Map();
  for (const entry of entries) {
    const key = [
      entry.groupCode, entry.weekType, entry.weekday, entry.pairNum,
      entry.subjectName, entry.teacher, entry.room, entry.timeStart,
    ].join('|');
    uniq.set(key, entry);
  }
  return [...uniq.values()];
}
