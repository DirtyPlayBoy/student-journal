import { cleanCell, parseCellText, DEFAULT_SEPARATOR_RULES } from './text-parser.js';
import { getSheetByName, getCellValue, cellsInRange, parseA1, toA1 } from './workbook-reader.js';

const WEEKDAY_MAP = {
  понедельник: 1,
  вторник: 2,
  среда: 3,
  четверг: 4,
  пятница: 5,
  суббота: 6,
  воскресенье: 7,
};

export function parseWeekdayLabel(text) {
  const raw = cleanCell(text).toLowerCase();
  if (!raw) return null;
  for (const [name, num] of Object.entries(WEEKDAY_MAP)) {
    if (raw.startsWith(name) || raw.includes(name)) return num;
  }
  return null;
}

export function parsePairLabel(text) {
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

export function parseDateFromLabel(text) {
  const raw = cleanCell(text).toLowerCase();
  const months = {
    января: 1, февраля: 2, марта: 3, апреля: 4, мая: 5, июня: 6,
    июля: 7, августа: 8, сентября: 9, октября: 10, ноября: 11, декабря: 12,
  };
  const m = raw.match(/(\d{1,2})\s+([а-яё]+)\s+(\d{4})/);
  if (!m) return null;
  const month = months[m[2]];
  if (!month) return null;
  const d = String(m[1]).padStart(2, '0');
  const mo = String(month).padStart(2, '0');
  return `${m[3]}-${mo}-${d}`;
}

function timeFromGrid(timeGrid, pairNum) {
  if (!Array.isArray(timeGrid)) return { timeStart: '', timeEnd: '' };
  const row = timeGrid.find((t) => Number(t.pairNum ?? t.pair_num) === Number(pairNum));
  if (!row) return { timeStart: '', timeEnd: '' };
  return {
    timeStart: row.timeStart || row.time_start || '',
    timeEnd: row.timeEnd || row.time_end || '',
  };
}

/**
 * Resolve lesson cells for one day mapping.
 * mapping modes: manual | range | dynamic | by_day_header
 */
export function resolveDayCells(sheet, dayMapping = {}) {
  const mode = dayMapping.mode || (dayMapping.cells ? 'manual' : dayMapping.range ? 'range' : 'manual');
  const warnings = [];
  const items = [];

  if (mode === 'manual' && Array.isArray(dayMapping.cells)) {
    for (const cell of dayMapping.cells) {
      const a1 = typeof cell === 'string' ? cell : cell.a1 || cell.cell;
      const pairNum = typeof cell === 'object' ? Number(cell.pairNum || cell.pair) : null;
      const value = getCellValue(sheet, a1);
      items.push({ a1, pairNum, value, pairCell: cell.pairCell || null, timeCell: cell.timeCell || null });
    }
    return { items, warnings };
  }

  if ((mode === 'range' || mode === 'dynamic') && dayMapping.range) {
    const cells = cellsInRange(sheet, dayMapping.range);
    const step = Math.max(1, Number(dayMapping.rowStep) || 1);
    const pairCol = dayMapping.pairCol != null ? Number(dayMapping.pairCol) : null;
    let pair = Number(dayMapping.startPair) || 1;
    for (let i = 0; i < cells.length; i += step) {
      const cell = cells[i];
      if (dayMapping.skipEmpty && !cleanCell(cell.value)) continue;
      let pairNum = pair;
      let timeStart = '';
      let timeEnd = '';
      if (pairCol != null) {
        const pairText = getCellValue(sheet, cell.row, pairCol);
        const parsed = parsePairLabel(pairText);
        if (parsed) {
          pairNum = parsed.pairNum;
          timeStart = parsed.timeStart;
          timeEnd = parsed.timeEnd;
        }
      }
      items.push({
        a1: cell.a1,
        pairNum,
        value: cell.value,
        timeStart,
        timeEnd,
      });
      pair += 1;
    }
    return { items, warnings };
  }

  if (mode === 'by_day_header') {
    const dayCol = Number(dayMapping.dayCol ?? 0);
    const discCol = Number(dayMapping.discCol ?? dayCol + 2);
    const pairCol = Number(dayMapping.pairCol ?? dayCol + 1);
    const weekday = Number(dayMapping.weekday);
    let capturing = false;
    for (let r = 0; r < sheet.rowCount; r += 1) {
      const dayText = getCellValue(sheet, r, dayCol);
      const wd = parseWeekdayLabel(dayText);
      if (wd) {
        capturing = wd === weekday;
        continue;
      }
      if (!capturing) continue;
      const disc = getCellValue(sheet, r, discCol);
      const pairInfo = parsePairLabel(getCellValue(sheet, r, pairCol));
      if (!pairInfo) {
        if (!disc && dayMapping.stopOnEmpty !== false) break;
        continue;
      }
      items.push({
        a1: toA1(r, discCol),
        pairNum: pairInfo.pairNum,
        value: disc,
        timeStart: pairInfo.timeStart,
        timeEnd: pairInfo.timeEnd,
        pairCell: toA1(r, pairCol),
        dayCell: toA1(r, dayCol),
      });
    }
    return { items, warnings };
  }

  warnings.push('no_day_mapping');
  return { items, warnings };
}

/**
 * Build schedule slots from workbook + parser config.
 * config shape:
 * {
 *   groupCode, groupId,
 *   separators: [],
 *   timeGrid: [{pairNum,timeStart,timeEnd}],
 *   timePriority: 'manual'|'excel',
 *   weeks: [{
 *     weekIndex, label, legacyCode,
 *     sheet,
 *     days: {
 *       "1": { mode, cells|range|..., sourceId? },
 *       ...
 *     }
 *   }]
 * }
 */
export function mapWorkbookToSlots(workbook, config = {}) {
  const separators = config.separators || DEFAULT_SEPARATOR_RULES;
  const timeGrid = config.timeGrid || [];
  const timePriority = config.timePriority || 'manual';
  const slots = [];
  const warnings = [];
  const weeks = config.weeks || [];

  for (const week of weeks) {
    const sheet = getSheetByName(workbook, week.sheet || config.sheet);
    if (!sheet) {
      warnings.push({ weekIndex: week.weekIndex, message: 'sheet_not_found', sheet: week.sheet });
      continue;
    }
    const days = week.days || {};
    for (const [dayKey, dayMapping] of Object.entries(days)) {
      const weekday = Number(dayKey);
      if (!weekday) continue;
      const { items, warnings: dayWarn } = resolveDayCells(sheet, dayMapping);
      for (const w of dayWarn) warnings.push({ weekIndex: week.weekIndex, weekday, message: w });

      for (const item of items) {
        if (!cleanCell(item.value)) {
          continue; // empty pair slot — skip silently
        }
        const parsed = parseCellText(item.value, separators);
        if (!parsed.fields) {
          warnings.push({
            weekIndex: week.weekIndex,
            weekday,
            a1: item.a1,
            message: 'parse_failed',
            rawText: item.value,
          });
          continue;
        }
        const pairNum = Number(item.pairNum) || slots.filter((s) => s.weekIndex === week.weekIndex && s.weekday === weekday).length + 1;
        const gridTime = timeFromGrid(timeGrid, pairNum);
        let timeStart = item.timeStart || '';
        let timeEnd = item.timeEnd || '';
        if (timePriority === 'manual') {
          timeStart = gridTime.timeStart || timeStart;
          timeEnd = gridTime.timeEnd || timeEnd;
        } else {
          timeStart = timeStart || gridTime.timeStart;
          timeEnd = timeEnd || gridTime.timeEnd;
        }

        const dayHeader = dayMapping.dayHeaderCell
          ? getCellValue(sheet, dayMapping.dayHeaderCell)
          : '';
        const lessonDate = dayHeader ? parseDateFromLabel(dayHeader) : null;

        slots.push({
          groupCode: config.groupCode || '',
          groupId: config.groupId ?? null,
          weekIndex: week.weekIndex,
          weekLabel: week.label || '',
          weekType: week.legacyCode || week.code || `w${week.weekIndex}`,
          weekday,
          pairNum,
          timeStart,
          timeEnd,
          subjectName: parsed.fields.subjectName,
          lessonKind: parsed.fields.lessonKind,
          teacher: parsed.fields.teacher,
          room: parsed.fields.room,
          rawText: parsed.fields.rawText,
          sourceSheet: sheet.name,
          sourceCell: item.a1,
          lessonDate,
          segments: parsed.segments,
          status: parsed.warnings.length ? 'warn' : 'ok',
          parseWarnings: parsed.warnings,
        });
      }
    }
  }

  return { slots, warnings };
}
