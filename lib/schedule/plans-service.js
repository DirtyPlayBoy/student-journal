import {
  MAX_CYCLE_LENGTH,
  PLAN_MODES,
  createDefaultWeeks,
  resolvePlanWeek,
  legacyWeekTypeFromWeek,
} from './calendar-resolver.js';
import { getOrCreatePlanForGroup } from './migrate.js';
import { emptyParserConfig, parseWithConfig } from './engine.js';
import {
  saveUploadBuffer,
  fetchRemoteWorkbook,
  loadStoredBuffer,
  previewFromBuffer,
} from './source-manager.js';
import { makePlanWeekSlotKey } from './diff.js';
import { splitTeacherAndRoom } from '../teachers.js';

function sanitizeSlotTeacher(slot) {
  if (!slot || !slot.teacher) return slot;
  const { teacher, room } = splitTeacherAndRoom(slot.teacher);
  return {
    ...slot,
    teacher,
    room: (slot.room || '').trim() ? slot.room : room,
  };
}

export function mapPlan(plan, weeks = []) {
  if (!plan) return null;
  return {
    id: plan.id,
    groupId: plan.group_id,
    mode: plan.mode,
    cycleLength: plan.cycle_length,
    weekStartDay: plan.week_start_day,
    anchorDate: plan.anchor_date,
    anchorWeekIndex: plan.anchor_week_index,
    sourceId: plan.source_id,
    active: plan.active === 1,
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    weeks: weeks.map(mapWeek),
  };
}

export function mapWeek(week) {
  return {
    id: week.id,
    planId: week.plan_id,
    weekIndex: week.week_index,
    label: week.label,
    legacyCode: week.legacy_code,
    dateFrom: week.date_from,
    dateTo: week.date_to,
    sortOrder: week.sort_order,
  };
}

export function loadPlanBundle(db, groupId) {
  const plan = getOrCreatePlanForGroup(db, groupId);
  const weeks = db.prepare(`
    SELECT * FROM schedule_plan_weeks WHERE plan_id = ? ORDER BY week_index ASC
  `).all(plan.id);
  const activeConfig = db.prepare(`
    SELECT id, plan_id, version, name, config_json, is_active, is_draft, created_at
    FROM schedule_parser_configs
    WHERE plan_id = ? AND is_active = 1
    ORDER BY version DESC LIMIT 1
  `).get(plan.id);
  const source = plan.source_id
    ? db.prepare('SELECT * FROM schedule_sources WHERE id = ?').get(plan.source_id)
    : null;
  return {
    plan: mapPlan(plan, weeks),
    weeks: weeks.map(mapWeek),
    activeConfig: activeConfig ? {
      id: activeConfig.id,
      version: activeConfig.version,
      name: activeConfig.name,
      config: JSON.parse(activeConfig.config_json || '{}'),
      isActive: true,
      createdAt: activeConfig.created_at,
    } : null,
    source: source ? {
      id: source.id,
      kind: source.kind,
      url: source.url,
      originalName: source.original_name,
      contentHash: source.content_hash,
      updatedAt: source.updated_at,
    } : null,
  };
}

export function updatePlan(db, groupId, body = {}) {
  const plan = getOrCreatePlanForGroup(db, groupId);
  const mode = body.mode != null ? String(body.mode) : plan.mode;
  if (!PLAN_MODES.includes(mode)) {
    const err = new Error('Неизвестный тип расписания');
    err.status = 400;
    throw err;
  }
  let cycleLength = body.cycleLength != null ? Number(body.cycleLength) : plan.cycle_length;
  if (!Number.isFinite(cycleLength) || cycleLength < 1 || cycleLength > MAX_CYCLE_LENGTH) {
    const err = new Error(`Количество недель: от 1 до ${MAX_CYCLE_LENGTH}`);
    err.status = 400;
    throw err;
  }
  if (mode === 'same') cycleLength = 1;

  const weekStartDay = body.weekStartDay != null ? Number(body.weekStartDay) : plan.week_start_day;
  const anchorDate = body.anchorDate != null ? String(body.anchorDate) : plan.anchor_date;
  const anchorWeekIndex = body.anchorWeekIndex != null ? Number(body.anchorWeekIndex) : plan.anchor_week_index;

  db.prepare(`
    UPDATE schedule_plans SET
      mode = ?, cycle_length = ?, week_start_day = ?,
      anchor_date = ?, anchor_week_index = ?, updated_at = ?
    WHERE id = ?
  `).run(mode, cycleLength, weekStartDay || 1, anchorDate || '', anchorWeekIndex || 0, Date.now(), plan.id);

  // Resize weeks if cycle length changed
  const existing = db.prepare('SELECT * FROM schedule_plan_weeks WHERE plan_id = ? ORDER BY week_index').all(plan.id);
  if (existing.length < cycleLength) {
    const insert = db.prepare(`
      INSERT INTO schedule_plan_weeks (plan_id, week_index, label, legacy_code, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);
    const defaults = createDefaultWeeks(cycleLength, { twoWeekLabels: cycleLength === 2 });
    for (let i = existing.length; i < cycleLength; i += 1) {
      const d = defaults[i];
      insert.run(plan.id, i, d.label, d.legacyCode, i);
    }
  } else if (existing.length > cycleLength) {
    db.prepare(`
      DELETE FROM schedule_plan_weeks WHERE plan_id = ? AND week_index >= ?
    `).run(plan.id, cycleLength);
  }

  if (Array.isArray(body.weeks)) {
    const upd = db.prepare(`
      UPDATE schedule_plan_weeks
      SET label = ?, legacy_code = COALESCE(?, legacy_code), date_from = ?, date_to = ?
      WHERE plan_id = ? AND week_index = ?
    `);
    for (const w of body.weeks) {
      upd.run(
        w.label ?? `Неделя ${(Number(w.weekIndex) || 0) + 1}`,
        w.legacyCode ?? null,
        w.dateFrom ?? null,
        w.dateTo ?? null,
        plan.id,
        Number(w.weekIndex),
      );
    }
  }

  return loadPlanBundle(db, groupId);
}

export function addPlanWeek(db, groupId, body = {}) {
  const plan = getOrCreatePlanForGroup(db, groupId);
  const existing = db.prepare('SELECT COUNT(*) AS c FROM schedule_plan_weeks WHERE plan_id = ?').get(plan.id).c;
  if (existing >= MAX_CYCLE_LENGTH) {
    const err = new Error(`Максимум ${MAX_CYCLE_LENGTH} недель`);
    err.status = 400;
    throw err;
  }
  const weekIndex = existing;
  const label = body.label || `Неделя ${weekIndex + 1}`;
  const legacyCode = body.legacyCode || `w${weekIndex}`;
  db.prepare(`
    INSERT INTO schedule_plan_weeks (plan_id, week_index, label, legacy_code, sort_order, date_from, date_to)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(plan.id, weekIndex, label, legacyCode, weekIndex, body.dateFrom || null, body.dateTo || null);
  db.prepare('UPDATE schedule_plans SET cycle_length = ?, updated_at = ? WHERE id = ?')
    .run(weekIndex + 1, Date.now(), plan.id);
  return loadPlanBundle(db, groupId);
}

export function patchPlanWeek(db, groupId, weekId, body = {}) {
  const plan = getOrCreatePlanForGroup(db, groupId);
  const week = db.prepare('SELECT * FROM schedule_plan_weeks WHERE id = ? AND plan_id = ?').get(weekId, plan.id);
  if (!week) {
    const err = new Error('Неделя не найдена');
    err.status = 404;
    throw err;
  }
  db.prepare(`
    UPDATE schedule_plan_weeks SET
      label = COALESCE(?, label),
      legacy_code = COALESCE(?, legacy_code),
      date_from = COALESCE(?, date_from),
      date_to = COALESCE(?, date_to)
    WHERE id = ?
  `).run(
    body.label ?? null,
    body.legacyCode ?? null,
    body.dateFrom !== undefined ? body.dateFrom : null,
    body.dateTo !== undefined ? body.dateTo : null,
    weekId,
  );
  return loadPlanBundle(db, groupId);
}

export function removePlanWeek(db, groupId, weekId) {
  const plan = getOrCreatePlanForGroup(db, groupId);
  const week = db.prepare('SELECT * FROM schedule_plan_weeks WHERE id = ? AND plan_id = ?').get(weekId, plan.id);
  if (!week) {
    const err = new Error('Неделя не найдена');
    err.status = 404;
    throw err;
  }
  const count = db.prepare('SELECT COUNT(*) AS c FROM schedule_plan_weeks WHERE plan_id = ?').get(plan.id).c;
  if (count <= 1) {
    const err = new Error('Нельзя удалить последнюю неделю');
    err.status = 400;
    throw err;
  }
  db.prepare('DELETE FROM schedule_plan_weeks WHERE id = ?').run(weekId);
  // Reindex
  const left = db.prepare('SELECT * FROM schedule_plan_weeks WHERE plan_id = ? ORDER BY week_index').all(plan.id);
  const upd = db.prepare('UPDATE schedule_plan_weeks SET week_index = ?, sort_order = ? WHERE id = ?');
  left.forEach((w, i) => upd.run(i, i, w.id));
  db.prepare('UPDATE schedule_plans SET cycle_length = ?, updated_at = ? WHERE id = ?')
    .run(left.length, Date.now(), plan.id);
  return loadPlanBundle(db, groupId);
}

export function saveParserConfig(db, groupId, { name = 'default', config, activate = false, draft = true } = {}) {
  const plan = getOrCreatePlanForGroup(db, groupId);
  const maxVer = db.prepare('SELECT COALESCE(MAX(version), 0) AS v FROM schedule_parser_configs WHERE plan_id = ?')
    .get(plan.id).v;
  const version = maxVer + 1;
  if (activate) {
    db.prepare('UPDATE schedule_parser_configs SET is_active = 0 WHERE plan_id = ?').run(plan.id);
  }
  const info = db.prepare(`
    INSERT INTO schedule_parser_configs (plan_id, version, name, config_json, is_active, is_draft, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(plan.id, version, name, JSON.stringify(config || emptyParserConfig()), activate ? 1 : 0, draft ? 1 : 0, Date.now());
  return {
    id: Number(info.lastInsertRowid),
    version,
    name,
    config,
    isActive: !!activate,
  };
}

export function createSourceFromUpload(db, dataDir, { groupId, buffer, originalName }) {
  const saved = saveUploadBuffer(dataDir, buffer, { originalName });
  const now = Date.now();
  const info = db.prepare(`
    INSERT INTO schedule_sources (group_id, kind, url, file_path, original_name, content_hash, meta_json, created_at, updated_at)
    VALUES (?, 'file', '', ?, ?, ?, '{}', ?, ?)
  `).run(groupId || null, saved.relativePath, saved.originalName, saved.hash, now, now);
  const sourceId = Number(info.lastInsertRowid);
  db.prepare(`
    INSERT INTO schedule_source_versions (source_id, content_hash, file_path, size, fetched_at, note)
    VALUES (?, ?, ?, ?, ?, 'upload')
  `).run(sourceId, saved.hash, saved.relativePath, saved.size, now);
  if (groupId) {
    const plan = getOrCreatePlanForGroup(db, groupId);
    db.prepare('UPDATE schedule_plans SET source_id = ?, updated_at = ? WHERE id = ?').run(sourceId, now, plan.id);
  }
  return { sourceId, ...saved };
}

export async function createSourceFromUrl(db, dataDir, { groupId, url }) {
  const remote = await fetchRemoteWorkbook(url);
  const saved = saveUploadBuffer(dataDir, remote.buffer, { originalName: 'remote.xlsx' });
  const now = Date.now();
  const info = db.prepare(`
    INSERT INTO schedule_sources (group_id, kind, url, file_path, original_name, content_hash, meta_json, created_at, updated_at)
    VALUES (?, 'url', ?, ?, ?, ?, '{}', ?, ?)
  `).run(groupId || null, remote.url, saved.relativePath, 'remote.xlsx', remote.hash, now, now);
  const sourceId = Number(info.lastInsertRowid);
  db.prepare(`
    INSERT INTO schedule_source_versions (source_id, content_hash, file_path, size, fetched_at, note)
    VALUES (?, ?, ?, ?, ?, 'link')
  `).run(sourceId, remote.hash, saved.relativePath, saved.size, now);
  if (groupId) {
    const plan = getOrCreatePlanForGroup(db, groupId);
    db.prepare('UPDATE schedule_plans SET source_id = ?, updated_at = ? WHERE id = ?').run(sourceId, now, plan.id);
  }
  return { sourceId, url: remote.url, hash: remote.hash, relativePath: saved.relativePath, size: saved.size };
}

export function getSourceBuffer(db, dataDir, sourceId) {
  const source = db.prepare('SELECT * FROM schedule_sources WHERE id = ?').get(sourceId);
  if (!source) {
    const err = new Error('Источник не найден');
    err.status = 404;
    throw err;
  }
  const buffer = loadStoredBuffer(dataDir, source.file_path);
  return { source, buffer };
}

export function previewSource(db, dataDir, sourceId, options) {
  const { source, buffer } = getSourceBuffer(db, dataDir, sourceId);
  const workbook = previewFromBuffer(buffer, options);
  return {
    source: {
      id: source.id,
      kind: source.kind,
      url: source.url,
      originalName: source.original_name,
      contentHash: source.content_hash,
    },
    workbook,
  };
}

export function runParserPreview(db, dataDir, { sourceId, config, buffer }) {
  let buf = buffer;
  if (!buf && sourceId) {
    buf = getSourceBuffer(db, dataDir, sourceId).buffer;
  }
  if (!buf) {
    const err = new Error('Нет данных Excel для разбора');
    err.status = 400;
    throw err;
  }
  return parseWithConfig(buf, config || emptyParserConfig());
}

export function applyParsedSlots(db, groupId, slots, { replaceUnlocked = true } = {}) {
  const plan = getOrCreatePlanForGroup(db, groupId);
  const weeks = db.prepare('SELECT * FROM schedule_plan_weeks WHERE plan_id = ?').all(plan.id);
  const byIndex = new Map(weeks.map((w) => [w.week_index, w]));
  const group = db.prepare('SELECT id, name, schedule_code FROM groups WHERE id = ?').get(groupId);
  const now = Date.now();

  const insert = db.prepare(`
    INSERT INTO schedule_entries (
      group_code, group_id, week_type, weekday, pair_num, time_start, time_end,
      subject_name, lesson_kind, teacher, room, raw_text, source_sheet, created_at,
      slot_key, locked, updated_at, plan_id, plan_week_id, week_index, source_cell, applies_all_weeks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, 0)
  `);
  const update = db.prepare(`
    UPDATE schedule_entries SET
      time_start = ?, time_end = ?, subject_name = ?, lesson_kind = ?, teacher = ?, room = ?,
      raw_text = ?, source_sheet = ?, source_cell = ?, updated_at = ?, slot_key = ?,
      plan_id = ?, plan_week_id = ?, week_index = ?, week_type = ?
    WHERE id = ? AND locked = 0
  `);
  const find = db.prepare(`
    SELECT * FROM schedule_entries
    WHERE group_id = ? AND plan_week_id = ? AND weekday = ? AND pair_num = ?
  `);
  const delUnlocked = db.prepare(`
    DELETE FROM schedule_entries
    WHERE group_id = ? AND plan_id = ? AND locked = 0
      AND id NOT IN (SELECT value FROM json_each(?))
  `);

  const keptIds = [];
  const tx = db.transaction(() => {
    for (const rawSlot of slots) {
      const slot = sanitizeSlotTeacher(rawSlot);
      const week = byIndex.get(Number(slot.weekIndex));
      if (!week) continue;
      const weekType = slot.weekType || week.legacy_code || legacyWeekTypeFromWeek(week, plan);
      const slotKey = makePlanWeekSlotKey(week.id, slot.weekday, slot.pairNum);
      const existing = find.get(groupId, week.id, slot.weekday, slot.pairNum);
      if (existing) {
        if (existing.locked) {
          keptIds.push(existing.id);
          continue;
        }
        update.run(
          slot.timeStart || '', slot.timeEnd || '', slot.subjectName, slot.lessonKind || '',
          slot.teacher || '', slot.room || '', slot.rawText || '', slot.sourceSheet || '',
          slot.sourceCell || '', now, slotKey, plan.id, week.id, week.week_index, weekType,
          existing.id,
        );
        keptIds.push(existing.id);
      } else {
        const info = insert.run(
          group.schedule_code || group.name,
          groupId,
          weekType,
          slot.weekday,
          slot.pairNum,
          slot.timeStart || '',
          slot.timeEnd || '',
          slot.subjectName,
          slot.lessonKind || '',
          slot.teacher || '',
          slot.room || '',
          slot.rawText || '',
          slot.sourceSheet || '',
          now,
          slotKey,
          now,
          plan.id,
          week.id,
          week.week_index,
          slot.sourceCell || '',
        );
        keptIds.push(Number(info.lastInsertRowid));
      }
    }
    if (replaceUnlocked) {
      delUnlocked.run(groupId, plan.id, JSON.stringify(keptIds));
    }
  });
  tx();
  return { count: keptIds.length, ids: keptIds };
}

export function resolveEntriesForDate(db, group, date) {
  const plan = db.prepare('SELECT * FROM schedule_plans WHERE group_id = ?').get(group.id);
  if (!plan) {
    return { entries: [], resolved: { empty: true, reason: 'no_plan' }, weekLabel: '' };
  }
  const weeks = db.prepare('SELECT * FROM schedule_plan_weeks WHERE plan_id = ?').all(plan.id);
  const resolved = resolvePlanWeek(plan, weeks, date);
  if (resolved.empty || !resolved.week) {
    return { entries: [], resolved, weekLabel: '', plan: mapPlan(plan, weeks) };
  }

  const weekday = (() => {
    const [y, m, d] = String(date).split('-').map(Number);
    const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return day === 0 ? 7 : day;
  })();

  let entries = db.prepare(`
    SELECT * FROM schedule_entries
    WHERE group_id = ?
      AND weekday = ?
      AND (
        plan_week_id = ?
        OR applies_all_weeks = 1
        OR (plan_week_id IS NULL AND (week_type = ? OR week_type = 'all'))
      )
    ORDER BY pair_num ASC, time_start ASC, id ASC
  `).all(
    group.id,
    weekday,
    resolved.week.id,
    resolved.week.legacy_code || legacyWeekTypeFromWeek(resolved.week, plan),
  );

  // Apply date occurrences (Phase 1 schema readiness)
  const occurrences = db.prepare(`
    SELECT * FROM schedule_occurrences WHERE group_id = ? AND lesson_date = ?
  `).all(group.id, date);
  if (occurrences.length) {
    const byPair = new Map(entries.map((e) => [e.pair_num, e]));
    for (const occ of occurrences) {
      if (occ.status === 'cancelled') {
        byPair.delete(occ.pair_num);
        continue;
      }
      const base = byPair.get(occ.pair_num) || {};
      byPair.set(occ.pair_num, {
        ...base,
        id: occ.schedule_entry_id || base.id,
        pair_num: occ.pair_num,
        subject_name: occ.subject_name || base.subject_name,
        lesson_kind: occ.lesson_kind || base.lesson_kind,
        teacher: occ.teacher || base.teacher,
        room: occ.room || base.room,
        time_start: occ.time_start || base.time_start,
        time_end: occ.time_end || base.time_end,
        raw_text: occ.raw_text || base.raw_text,
        occurrence_status: occ.status,
      });
    }
    entries = [...byPair.values()].sort((a, b) => a.pair_num - b.pair_num);
  }

  return {
    entries,
    resolved,
    weekLabel: resolved.week.label,
    weekIndex: resolved.weekIndex,
    plan: mapPlan(plan, weeks),
  };
}

export function copyParserSection(config, { fromWeekIndex, toWeekIndex, section = 'all' }) {
  const next = JSON.parse(JSON.stringify(config || emptyParserConfig()));
  const from = (next.weeks || []).find((w) => Number(w.weekIndex) === Number(fromWeekIndex));
  const to = (next.weeks || []).find((w) => Number(w.weekIndex) === Number(toWeekIndex));
  if (!from || !to) return next;
  if (section === 'days' || section === 'all') to.days = JSON.parse(JSON.stringify(from.days || {}));
  if (section === 'sheet' || section === 'all') to.sheet = from.sheet;
  if (section === 'separators' || section === 'all') {
    /* separators are global */
  }
  if (section === 'time' || section === 'all') {
    /* timeGrid is global unless extended later */
  }
  return next;
}
