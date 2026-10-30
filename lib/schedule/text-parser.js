/** Configurable text field extraction from a single Excel cell */

import { splitTeacherAndRoom } from '../teachers.js';

export function cleanCell(value) {
  return String(value ?? '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Длинные маркеры раньше коротких («аудитория» до «ауд»), иначе «ауд» съест начало. */
export const DEFAULT_SEPARATOR_RULES = Object.freeze([
  {
    id: 'teacher',
    field: 'teacher',
    type: 'start_marker',
    markers: ['преподаватель', 'преп.', 'преп:', 'преп'],
    untilMarkers: ['аудитория', 'ауд.', 'ауд:', 'ауд', 'кабинет', 'каб.', 'каб', 'стадион', 'н/к'],
  },
  {
    id: 'room',
    field: 'room',
    type: 'start_marker',
    markers: ['аудитория', 'ауд.', 'ауд:', 'ауд', 'кабинет', 'каб.', 'каб'],
    untilMarkers: ['преподаватель', 'преп.', 'преп:', 'преп'],
  },
  {
    id: 'stadium',
    field: 'room',
    type: 'regex',
    pattern: 'стадион\\s*[«"]?([^»"]+)[»"]?',
    flags: 'i',
    group: 0,
    prefix: 'стадион ',
  },
  {
    id: 'kind_parens',
    field: 'lessonKind',
    type: 'between_markers',
    start: '(',
    end: ')',
  },
  {
    id: 'subject',
    field: 'subjectName',
    type: 'remainder',
  },
]);

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function markerRegex(markers) {
  const parts = (markers || []).map((m) => escapeRegExp(cleanCell(m))).filter(Boolean);
  if (!parts.length) return null;
  return new RegExp(`(?:${parts.join('|')})`, 'i');
}

/**
 * Apply ordered separator rules to raw cell text.
 * @returns {{ fields: object, warnings: string[], segments: Array }}
 */
export function parseCellText(rawText, rules = DEFAULT_SEPARATOR_RULES) {
  const raw = cleanCell(rawText);
  const warnings = [];
  const fields = {
    subjectName: '',
    lessonKind: '',
    teacher: '',
    room: '',
  };
  const segments = [];

  if (!raw || raw === '-' || raw === '—') {
    return { fields: null, warnings: ['empty'], segments, rawText: raw };
  }

  let remaining = raw;

  for (const rule of rules) {
    if (!rule || !rule.field) continue;
    const field = rule.field;
    if (fields[field] && rule.type !== 'remainder') continue;

    try {
      if (rule.type === 'start_marker') {
        const startRe = markerRegex(rule.markers);
        if (!startRe) continue;
        const searchIn = remaining.includes(rule.markers?.[0] || '') ? remaining : raw;
        const match = searchIn.match(new RegExp(`(?:^|\\s)(${startRe.source})\\s*(.+)`, startRe.flags));
        if (!match) continue;
        let value = cleanCell(match[2]);
        const untilRe = markerRegex(rule.untilMarkers);
        let consumed = match[0];
        if (untilRe) {
          const cut = value.search(new RegExp(`\\s*${untilRe.source}`, untilRe.flags));
          if (cut >= 0) {
            consumed = match[1] + ' ' + value.slice(0, cut);
            value = cleanCell(value.slice(0, cut));
          }
        }
        value = value.replace(/,+$/, '');
        if (!value) continue;
        fields[field] = rule.prefix ? `${rule.prefix}${value}` : value;
        segments.push({ field, text: consumed, value: fields[field] });
        remaining = cleanCell(remaining.replace(consumed, ' ').replace(match[0], ' '));
      } else if (rule.type === 'between_markers') {
        const start = rule.start ?? '(';
        const end = rule.end ?? ')';
        const re = new RegExp(`${escapeRegExp(start)}([^${escapeRegExp(end)}]+)${escapeRegExp(end)}\\s*$`);
        const match = remaining.match(re) || raw.match(re);
        if (!match) continue;
        fields[field] = cleanCell(match[1]);
        segments.push({ field, text: match[0], value: fields[field] });
        remaining = cleanCell(remaining.replace(match[0], ' '));
      } else if (rule.type === 'regex') {
        const re = new RegExp(rule.pattern, rule.flags || 'i');
        const match = raw.match(re);
        if (!match) continue;
        const idx = rule.group == null ? 1 : rule.group;
        const captured = cleanCell(match[idx] ?? match[0]);
        if (!captured) continue;
        fields[field] = rule.prefix ? `${rule.prefix}${captured}` : captured;
        segments.push({ field, text: match[0], value: fields[field] });
      } else if (rule.type === 'split') {
        const sep = rule.separator || ',';
        const parts = raw.split(sep).map(cleanCell).filter(Boolean);
        const index = Number(rule.index) || 0;
        if (parts[index]) {
          fields[field] = parts[index];
          segments.push({ field, text: parts[index], value: fields[field] });
        }
      } else if (rule.type === 'newline') {
        const lines = String(rawText || '').split(/\r?\n/).map(cleanCell).filter(Boolean);
        const index = Number(rule.index) || 0;
        if (lines[index]) {
          fields[field] = lines[index];
          segments.push({ field, text: lines[index], value: fields[field] });
        }
      } else if (rule.type === 'literal') {
        // no-op marker definition
      } else if (rule.type === 'remainder') {
        let body = remaining;
        // strip already extracted kind in parens if still present
        body = cleanCell(body)
          .replace(/,\s*/g, ', ')
          .replace(/\s+/g, ' ')
          .replace(/[.,;]+$/, '');
        if (body) {
          fields[field] = body;
          segments.push({ field, text: body, value: body });
        }
      }
    } catch (err) {
      warnings.push(`rule_${rule.id || field}: ${err.message}`);
    }
  }

  if (!fields.subjectName) {
    // fallback: whole text before known markers (\b ненадёжен для кириллицы)
    let body = raw;
    const teacherCut = body.search(/\s(?:преп\.?|преподаватель)(?:\s|$)/i);
    if (teacherCut >= 0) body = body.slice(0, teacherCut);
    const roomCut = body.search(/\s(?:ауд\.?:?|аудитория|каб\.?:?|кабинет|стадион)(?:\s|$)/i);
    if (roomCut >= 0) body = body.slice(0, roomCut);
    const kindMatch = body.match(/\(([^)]+)\)\s*$/);
    if (kindMatch && !fields.lessonKind) {
      fields.lessonKind = cleanCell(kindMatch[1]);
      body = body.slice(0, kindMatch.index);
    }
    fields.subjectName = cleanCell(body).replace(/[.,;]+$/, '');
  }

  // Safety-net: «ауд 705» без точки часто остаётся в teacher
  if (fields.teacher) {
    const split = splitTeacherAndRoom(fields.teacher);
    fields.teacher = split.teacher;
    if (split.room && !fields.room) fields.room = split.room;
  }

  if (!fields.subjectName) {
    return { fields: null, warnings: [...warnings, 'no_subject'], segments, rawText: raw };
  }

  return {
    fields: {
      subjectName: fields.subjectName,
      lessonKind: fields.lessonKind || '',
      teacher: fields.teacher || '',
      room: fields.room || '',
      rawText: raw,
    },
    warnings,
    segments,
    rawText: raw,
  };
}

/** Suggest separator rules from a labeled example (simple heuristic). */
export function suggestRulesFromExample(rawText, labels = {}) {
  const rules = [];
  const raw = String(rawText || '');
  if (labels.teacher || /преп/i.test(raw)) {
    rules.push({ ...DEFAULT_SEPARATOR_RULES[0] });
  }
  if (labels.room || /ауд|кабинет|стадион/i.test(raw)) {
    rules.push({ ...DEFAULT_SEPARATOR_RULES[1] });
    rules.push({ ...DEFAULT_SEPARATOR_RULES[2] });
  }
  if (labels.lessonKind || /\([^)]+\)/.test(raw)) {
    rules.push({ ...DEFAULT_SEPARATOR_RULES[3] });
  }
  rules.push({ ...DEFAULT_SEPARATOR_RULES[4] });
  return rules;
}
