import { cleanCell } from './text-parser.js';
import { normalizeGroupCode, normalizeSubjectKey } from './normalize.js';

export function scheduleSlotKey(entry) {
  if (entry.planWeekId != null || entry.plan_week_id != null) {
    return [
      `pw:${entry.planWeekId ?? entry.plan_week_id}`,
      entry.weekday,
      entry.pairNum ?? entry.pair_num,
    ].join('|');
  }
  const groupPart = entry.groupId != null && entry.groupId !== ''
    ? `id:${entry.groupId}`
    : `code:${normalizeGroupCode(entry.groupCode || entry.group_code || '') || entry.groupCode || entry.group_code || ''}`;
  return [
    groupPart,
    entry.weekType || entry.week_type || '',
    entry.weekday,
    entry.pairNum ?? entry.pair_num,
  ].join('|');
}

export function makeSlotKey(groupId, weekType, weekday, pairNum) {
  return scheduleSlotKey({ groupId, weekType, weekday, pairNum });
}

export function makePlanWeekSlotKey(planWeekId, weekday, pairNum) {
  return scheduleSlotKey({ planWeekId, weekday, pairNum });
}

export function scheduleEntryKey(entry) {
  return [
    scheduleSlotKey(entry),
    normalizeSubjectKey(entry.subjectName || entry.subject_name || ''),
    cleanCell(entry.teacher || ''),
    cleanCell(entry.room || ''),
    cleanCell(entry.timeStart || entry.time_start || ''),
    cleanCell(entry.lessonKind || entry.lesson_kind || ''),
  ].join('::');
}

export const SCHEDULE_FIELDS = Object.freeze([
  { key: 'subjectName', label: 'Предмет', required: true },
  { key: 'lessonKind', label: 'Вид занятия' },
  { key: 'teacher', label: 'Преподаватель' },
  { key: 'room', label: 'Аудитория' },
  { key: 'timeStart', label: 'Начало' },
  { key: 'timeEnd', label: 'Конец' },
]);

export function fieldDiff(from, to) {
  const changes = [];
  for (const field of SCHEDULE_FIELDS) {
    const a = cleanCell(from?.[field.key] ?? '');
    const b = cleanCell(to?.[field.key] ?? '');
    if (a !== b) changes.push({ field: field.key, label: field.label, from: a, to: b });
  }
  return changes;
}

export function rowToScheduleEntry(row) {
  return {
    id: row.id,
    groupCode: row.group_code || row.groupCode,
    groupId: row.group_id ?? row.groupId ?? null,
    weekType: row.week_type || row.weekType,
    weekIndex: row.week_index ?? row.weekIndex ?? null,
    planId: row.plan_id ?? row.planId ?? null,
    planWeekId: row.plan_week_id ?? row.planWeekId ?? null,
    weekday: row.weekday,
    pairNum: row.pair_num ?? row.pairNum,
    timeStart: row.time_start || row.timeStart || '',
    timeEnd: row.time_end || row.timeEnd || '',
    subjectName: row.subject_name || row.subjectName || '',
    lessonKind: row.lesson_kind || row.lessonKind || '',
    teacher: row.teacher || '',
    room: row.room || '',
    rawText: row.raw_text || row.rawText || '',
    sourceSheet: row.source_sheet || row.sourceSheet || '',
    sourceCell: row.source_cell || row.sourceCell || '',
    slotKey: row.slot_key || row.slotKey || '',
    locked: row.locked === 1 || row.locked === true,
    appliesAllWeeks: row.applies_all_weeks === 1 || row.appliesAllWeeks === true,
  };
}

export function diffSchedule(currentRows, incomingEntries) {
  const current = currentRows.map(rowToScheduleEntry);
  const incoming = incomingEntries.map(rowToScheduleEntry);
  const curBySlot = new Map();
  for (const e of current) {
    const slot = scheduleSlotKey(e);
    if (!curBySlot.has(slot)) curBySlot.set(slot, e);
  }
  const nextBySlot = new Map();
  for (const e of incoming) {
    const slot = scheduleSlotKey(e);
    if (!nextBySlot.has(slot)) nextBySlot.set(slot, e);
  }

  const added = [];
  const removed = [];
  const changed = [];
  const kept = [];
  const lockedSkipped = [];

  for (const [slot, next] of nextBySlot) {
    const old = curBySlot.get(slot);
    if (!old) {
      added.push(next);
      continue;
    }
    if (old.locked) {
      lockedSkipped.push({ from: old, to: next, slot });
      kept.push({ ...old });
      continue;
    }
    const changes = fieldDiff(old, next);
    if (!changes.length) {
      kept.push({ ...next, id: old.id, locked: old.locked });
    } else {
      changed.push({ from: old, to: { ...next, id: old.id }, fields: changes, slot });
    }
  }

  for (const [slot, old] of curBySlot) {
    if (nextBySlot.has(slot)) continue;
    if (old.locked) {
      lockedSkipped.push({ from: old, to: null, slot });
      kept.push(old);
    } else {
      removed.push(old);
    }
  }

  return {
    added,
    removed,
    changed,
    kept,
    lockedSkipped,
    addedCount: added.length,
    removedCount: removed.length,
    changedCount: changed.length,
    keptCount: kept.length,
    lockedCount: lockedSkipped.length,
    totalCurrent: current.length,
    totalIncoming: incoming.length,
  };
}
