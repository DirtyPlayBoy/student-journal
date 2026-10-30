/**
 * Suggest parser day mappings from a workbook preview grid.
 * Works for common college layouts: day headers in a column, or vertical day blocks.
 */
import { cleanCell } from './text-parser.js';
import { parseWeekdayLabel, parsePairLabel } from './mapping-engine.js';
import { colToLetter, toA1 } from './workbook-reader.js';

function cell(sheet, r, c) {
  return cleanCell(sheet?.rows?.[r]?.[c]);
}

/**
 * @param {object} sheet preview sheet { rows, rowCount, colCount, name }
 * @param {{ groupCode?: string }} opts
 */
export function suggestDayMappings(sheet, opts = {}) {
  if (!sheet?.rows?.length) {
    return { mode: null, confidence: 0, weeksHint: [], days: {}, message: 'Нет данных листа' };
  }
  const groupCode = cleanCell(opts.groupCode || '').toUpperCase();
  const rowCount = Math.min(sheet.rowCount || sheet.rows.length, sheet.rows.length);
  const colCount = Math.min(sheet.colCount || (sheet.rows[0]?.length || 0), 40);

  // 1) Find day column + pair column + discipline column (classic 3-col block)
  let dayCol = -1;
  let pairCol = -1;
  let discCol = -1;
  let headerRow = 0;

  for (let r = 0; r < Math.min(12, rowCount); r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const v = cell(sheet, r, c).toLowerCase();
      if (/день|дни\s*недели|weekday/i.test(v) && dayCol < 0) dayCol = c;
      if (/^пара$|№\s*пары|номер\s*пары/i.test(v) && pairCol < 0) pairCol = c;
      if (/дисциплин|предмет|название\s*занят/i.test(v) && discCol < 0) discCol = c;
      if (groupCode && cell(sheet, r, c).toUpperCase().includes(groupCode) && discCol < 0) {
        discCol = c;
        headerRow = r;
      }
    }
  }

  // Heuristic: scan for weekday labels stacked in a column
  if (dayCol < 0) {
    const scores = Array.from({ length: colCount }, () => 0);
    for (let c = 0; c < colCount; c += 1) {
      for (let r = 0; r < rowCount; r += 1) {
        if (parseWeekdayLabel(cell(sheet, r, c))) scores[c] += 1;
      }
    }
    const best = scores.indexOf(Math.max(...scores));
    if (scores[best] >= 2) dayCol = best;
  }

  if (pairCol < 0 && dayCol >= 0) {
    const c = dayCol + 1;
    let hits = 0;
    for (let r = 0; r < rowCount; r += 1) {
      if (parsePairLabel(cell(sheet, r, c))) hits += 1;
    }
    if (hits >= 2) pairCol = c;
  }

  if (discCol < 0 && pairCol >= 0) discCol = pairCol + 1;
  if (discCol < 0 && dayCol >= 0) discCol = dayCol + 2;

  const days = {};
  let mapped = 0;

  if (dayCol >= 0 && discCol >= 0) {
    // by_day_header: capture blocks under each weekday label
    for (let weekday = 1; weekday <= 6; weekday += 1) {
      days[String(weekday)] = {
        mode: 'by_day_header',
        dayCol,
        pairCol: pairCol >= 0 ? pairCol : dayCol + 1,
        discCol,
        weekday,
        skipEmpty: true,
      };
      mapped += 1;
    }
    return {
      mode: 'by_day_header',
      confidence: mapped >= 5 ? 0.85 : 0.6,
      days,
      meta: { dayCol, pairCol, discCol, headerRow, sheet: sheet.name },
      message: `Найдены столбцы: день ${colToLetter(dayCol)}, пары ${colToLetter(pairCol >= 0 ? pairCol : dayCol + 1)}, предметы ${colToLetter(discCol)}`,
    };
  }

  // 2) Fallback: vertical ranges per weekday if day headers appear in one column of subjects
  const weekdayRows = [];
  for (let r = 0; r < rowCount; r += 1) {
    for (let c = 0; c < Math.min(3, colCount); c += 1) {
      const wd = parseWeekdayLabel(cell(sheet, r, c));
      if (wd) weekdayRows.push({ row: r, weekday: wd, col: c });
    }
  }
  if (weekdayRows.length >= 2) {
    const subjectCol = Math.min(colCount - 1, (weekdayRows[0].col || 0) + 2);
    for (let i = 0; i < weekdayRows.length; i += 1) {
      const cur = weekdayRows[i];
      const next = weekdayRows[i + 1];
      const from = cur.row + 1;
      const to = (next ? next.row - 1 : rowCount - 1);
      if (to < from) continue;
      const a1from = toA1(from, subjectCol);
      const a1to = toA1(to, subjectCol);
      days[String(cur.weekday)] = {
        mode: 'range',
        range: `${a1from}:${a1to}`,
        pairCol: subjectCol - 1,
        startPair: 1,
        skipEmpty: true,
      };
      mapped += 1;
    }
    return {
      mode: 'range',
      confidence: mapped >= 3 ? 0.7 : 0.45,
      days,
      meta: { subjectCol, sheet: sheet.name },
      message: `Собраны диапазоны по заголовкам дней (${mapped} дн.)`,
    };
  }

  return {
    mode: null,
    confidence: 0,
    days: {},
    message: 'Не удалось угадать раскладку — отметьте ячейки вручную или выберите пресет',
  };
}

export function applySuggestionToConfig(config, suggestion, { sheetName } = {}) {
  if (!config || !suggestion?.days) return config;
  const next = structuredClone(config);
  if (sheetName) next.sheet = sheetName;
  for (const week of next.weeks || []) {
    if (sheetName) week.sheet = sheetName;
    week.days = { ...suggestion.days };
  }
  return next;
}
