import { readWorkbook } from './workbook-reader.js';
import { mapWorkbookToSlots } from './mapping-engine.js';
import { validateSlots } from './validator.js';
import { DEFAULT_SEPARATOR_RULES } from './text-parser.js';
import { createDefaultWeeks } from './calendar-resolver.js';

export function emptyParserConfig({ groupCode = '', groupId = null, cycleLength = 1 } = {}) {
  const weeks = createDefaultWeeks(cycleLength).map((w) => ({
    weekIndex: w.weekIndex,
    label: w.label,
    legacyCode: w.legacyCode,
    sheet: '',
    days: {},
  }));
  return {
    version: 1,
    groupCode,
    groupId,
    sheet: '',
    separators: DEFAULT_SEPARATOR_RULES.map((r) => ({ ...r })),
    timeGrid: [
      { pairNum: 1, timeStart: '09:00', timeEnd: '10:30' },
      { pairNum: 2, timeStart: '10:40', timeEnd: '12:10' },
      { pairNum: 3, timeStart: '12:20', timeEnd: '13:50' },
      { pairNum: 4, timeStart: '14:00', timeEnd: '15:30' },
      { pairNum: 5, timeStart: '15:40', timeEnd: '17:10' },
    ],
    timePriority: 'manual',
    weeks,
  };
}

export function parseWithConfig(buffer, config) {
  const workbook = readWorkbook(buffer);
  const { slots, warnings } = mapWorkbookToSlots(workbook, config || emptyParserConfig());
  const validation = validateSlots(slots);
  return {
    workbook: {
      sheetNames: workbook.sheetNames,
      sheets: workbook.sheets.map((s) => ({
        name: s.name,
        rowCount: s.rowCount,
        colCount: s.colCount,
      })),
    },
    slots,
    mappingWarnings: warnings,
    validation,
  };
}

export function previewWorkbookGrid(buffer, options) {
  return readWorkbook(buffer, options);
}
