import { fetchRemoteWorkbook } from './source-manager.js';
import { parseWorkbookBuffer } from './presets/rggu.js';
import {
  resolvePlanWeek,
  LEGACY_RGGU_ANCHOR,
  legacyWeekTypeFromWeek,
  weekdayOfDate as wdOfDate,
} from './calendar-resolver.js';
import { normalizeGroupCode as normCode } from './normalize.js';

export {
  MAX_CYCLE_LENGTH,
  PLAN_MODES,
  parseISODate,
  formatISODate,
  weekdayOfDate,
  weekStartUtc,
  resolvePlanWeek,
  legacyWeekTypeFromWeek,
  LEGACY_RGGU_ANCHOR,
  createDefaultWeeks,
} from './calendar-resolver.js';

export { cleanCell, DEFAULT_SEPARATOR_RULES, parseCellText, suggestRulesFromExample } from './text-parser.js';
export { suggestDayMappings, applySuggestionToConfig } from './layout-suggest.js';
export {
  colToLetter, letterToCol, parseA1, toA1, parseRange, readWorkbook,
  getSheetByName, getCellValue, cellsInRange,
} from './workbook-reader.js';
export {
  parseWeekdayLabel, parsePairLabel, parseDateFromLabel,
  resolveDayCells, mapWorkbookToSlots,
} from './mapping-engine.js';
export {
  MAX_UPLOAD_BYTES, hashBuffer, assertSafeExternalUrl, fetchRemoteWorkbook,
  ensureUploadDir, saveUploadBuffer, loadStoredBuffer, previewFromBuffer,
} from './source-manager.js';
export { validateSlots } from './validator.js';
export { emptyParserConfig, parseWithConfig, previewWorkbookGrid } from './engine.js';
export { normalizeSheetUrl } from './url.js';
export {
  normalizeGroupCode,
  displayGroupName,
  normalizeSubjectKey,
  parseGroupCodeParts,
  bumpGroupCourse,
  cohortYearFromSuffix,
  studyYearsLabel,
} from './normalize.js';
export {
  scheduleSlotKey, makeSlotKey, makePlanWeekSlotKey, scheduleEntryKey,
  SCHEDULE_FIELDS, fieldDiff, rowToScheduleEntry, diffSchedule,
} from './diff.js';
export {
  backupDatabase, ensureUniversalScheduleSchema, migrateLegacyWeekTypes, getOrCreatePlanForGroup,
} from './migrate.js';
export { parseWorkbookBuffer, buildRgguParserConfig, RGGU_PRESET_META } from './presets/rggu.js';

/** Default Excel/Sheets URLs — empty in the open-source build; set in Settings. */
export const DEFAULT_SHEET_URLS = [];

/** Legacy helper: upper/lower for dates using the default 2-week cycle anchor */
export function weekTypeForDate(isoDate) {
  const plan = {
    mode: 'cycle',
    cycle_length: 2,
    week_start_day: 1,
    anchor_date: LEGACY_RGGU_ANCHOR.anchorDate,
    anchor_week_index: LEGACY_RGGU_ANCHOR.anchorWeekIndex,
  };
  const weeks = [
    { week_index: 0, label: 'ВЕРХ', legacy_code: 'upper' },
    { week_index: 1, label: 'НИЗ', legacy_code: 'lower' },
  ];
  const resolved = resolvePlanWeek(plan, weeks, isoDate);
  return legacyWeekTypeFromWeek(resolved.week, plan) || 'upper';
}

export async function fetchSheet(url) {
  const { buffer } = await fetchRemoteWorkbook(url);
  return buffer;
}

export async function importFromUrls(urls = DEFAULT_SHEET_URLS) {
  const all = [];
  const sources = [];
  for (const url of urls) {
    const { buffer } = await fetchRemoteWorkbook(url);
    const parsed = parseWorkbookBuffer(buffer, url).map((entry) => ({
      ...entry,
      sourceUrl: url,
    }));
    all.push(...parsed);
    const codes = [...new Set(parsed.map((e) => normCode(e.groupCode) || e.groupCode).filter(Boolean))];
    sources.push({ url, entries: parsed.length, codes });
  }
  const uniq = new Map();
  for (const entry of all) {
    const key = [
      entry.groupCode, entry.weekType, entry.weekday, entry.pairNum,
      entry.subjectName, entry.teacher, entry.room, entry.timeStart,
    ].join('|');
    uniq.set(key, entry);
  }
  return { entries: [...uniq.values()], sources };
}

/** URL книги, где реально есть код группы (не первая из списка по умолчанию). */
export function pickUrlForGroupCode(sources, groupCodes) {
  const want = new Set(
    (Array.isArray(groupCodes) ? groupCodes : [groupCodes])
      .map((code) => normCode(code) || String(code || '').trim())
      .filter(Boolean),
  );
  if (!want.size || !Array.isArray(sources)) return '';
  for (const src of sources) {
    const codes = (src.codes || []).map((c) => normCode(c) || c);
    if (codes.some((code) => want.has(code))) return src.url || '';
  }
  return sources[0]?.url || '';
}

export function summarizeScheduleCodes(entries) {
  const byCode = new Map();
  for (const entry of entries) {
    const code = normCode(entry.groupCode) || entry.groupCode;
    if (!code) continue;
    if (!byCode.has(code)) {
      byCode.set(code, {
        code,
        entries: 0,
        weekTypes: new Set(),
        weekdays: new Set(),
        sheets: new Set(),
        subjects: new Set(),
      });
    }
    const row = byCode.get(code);
    row.entries += 1;
    if (entry.weekType) row.weekTypes.add(entry.weekType);
    if (entry.weekday) row.weekdays.add(entry.weekday);
    if (entry.sourceSheet) row.sheets.add(entry.sourceSheet);
    if (entry.subjectName) row.subjects.add(entry.subjectName);
  }
  return [...byCode.values()]
    .map((row) => ({
      code: row.code,
      entries: row.entries,
      weekTypes: [...row.weekTypes],
      weekdays: [...row.weekdays].sort((a, b) => a - b),
      sheets: [...row.sheets],
      subjectSample: [...row.subjects].slice(0, 6),
      subjectCount: row.subjects.size,
    }))
    .sort((a, b) => a.code.localeCompare(b.code, 'ru'));
}

export function entriesForDay(entries, { groupCode, date }) {
  const code = normCode(groupCode);
  const weekType = weekTypeForDate(date);
  const weekday = wdOfDate(date);
  return entries
    .filter((entry) => entry.groupCode === code)
    .filter((entry) => entry.weekday === weekday)
    .filter((entry) => entry.weekType === 'all' || entry.weekType === weekType)
    .sort((a, b) => a.pairNum - b.pairNum || a.timeStart.localeCompare(b.timeStart));
}
