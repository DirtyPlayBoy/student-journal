/** Universal calendar week resolver: same | cycle | calendar_weeks | combined */

export const MAX_CYCLE_LENGTH = 52;
export const PLAN_MODES = Object.freeze(['same', 'cycle', 'calendar_weeks', 'combined']);

const DAY_MS = 86400000;

export function parseISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  if (!y || !m || !d) throw new Error(`Некорректная дата: ${iso}`);
  return Date.UTC(y, m - 1, d);
}

export function formatISODate(utcMs) {
  const dt = new Date(utcMs);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO weekday 1=Mon … 7=Sun */
export function weekdayOfDate(isoDate) {
  const utc = parseISODate(isoDate);
  const day = new Date(utc).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Monday (or weekStartDay) of the academic week containing isoDate */
export function weekStartUtc(isoDate, weekStartDay = 1) {
  const utc = parseISODate(isoDate);
  const wd = weekdayOfDate(isoDate); // 1..7
  const start = ((Number(weekStartDay) || 1) - 1 + 7) % 7 + 1; // 1..7
  let delta = wd - start;
  if (delta < 0) delta += 7;
  return utc - delta * DAY_MS;
}

/**
 * Resolve which plan week applies to a calendar date.
 * @param {object} plan { mode, cycle_length|cycleLength, week_start_day|weekStartDay, anchor_date|anchorDate, anchor_week_index|anchorWeekIndex }
 * @param {Array} weeks [{ id, week_index|weekIndex, label, date_from|dateFrom, date_to|dateTo }]
 * @param {string} isoDate YYYY-MM-DD
 * @returns {{ week: object|null, weekIndex: number|null, empty: boolean, reason?: string }}
 */
export function resolvePlanWeek(plan, weeks, isoDate) {
  if (!plan) {
    return { week: null, weekIndex: null, empty: true, reason: 'no_plan' };
  }
  const mode = plan.mode || 'cycle';
  const list = [...(weeks || [])].sort(
    (a, b) => (a.week_index ?? a.weekIndex) - (b.week_index ?? b.weekIndex),
  );

  if (mode === 'same') {
    const week = list.find((w) => (w.week_index ?? w.weekIndex) === 0) || list[0] || null;
    return week
      ? { week, weekIndex: week.week_index ?? week.weekIndex, empty: false }
      : { week: null, weekIndex: null, empty: true, reason: 'no_weeks' };
  }

  if (mode === 'calendar_weeks' || mode === 'combined') {
    const hit = list.find((w) => {
      const from = w.date_from || w.dateFrom;
      const to = w.date_to || w.dateTo;
      if (!from || !to) return false;
      return isoDate >= from && isoDate <= to;
    });
    if (hit) {
      return { week: hit, weekIndex: hit.week_index ?? hit.weekIndex, empty: false };
    }
    if (mode === 'calendar_weeks') {
      return { week: null, weekIndex: null, empty: true, reason: 'outside_ranges' };
    }
    // combined: fall through to cycle/same
  }

  const cycleLength = Math.max(1, Math.min(MAX_CYCLE_LENGTH, Number(plan.cycle_length ?? plan.cycleLength) || list.length || 1));
  const weekStartDay = Number(plan.week_start_day ?? plan.weekStartDay) || 1;
  const anchorDate = plan.anchor_date || plan.anchorDate;
  const anchorWeekIndex = Number(plan.anchor_week_index ?? plan.anchorWeekIndex) || 0;

  if (!anchorDate || !list.length) {
    // Legacy fallback: treat as same if only one week
    if (list.length === 1) {
      return { week: list[0], weekIndex: list[0].week_index ?? list[0].weekIndex, empty: false };
    }
    return { week: null, weekIndex: null, empty: true, reason: 'missing_anchor' };
  }

  const anchorStart = weekStartUtc(anchorDate, weekStartDay);
  const targetStart = weekStartUtc(isoDate, weekStartDay);
  const weeksDiff = Math.round((targetStart - anchorStart) / (7 * DAY_MS));
  let idx = ((anchorWeekIndex + weeksDiff) % cycleLength + cycleLength) % cycleLength;
  const week = list.find((w) => (w.week_index ?? w.weekIndex) === idx) || null;
  if (!week) {
    return { week: null, weekIndex: idx, empty: true, reason: 'week_missing' };
  }
  return { week, weekIndex: idx, empty: false };
}

/** Legacy bridge: map resolved week to upper/lower/all-like token for old callers */
export function legacyWeekTypeFromWeek(week, plan) {
  if (!week) return '';
  const label = String(week.label || '').toLowerCase();
  const code = String(week.code || week.legacy_code || '').toLowerCase();
  if (code === 'upper' || label.includes('верх')) return 'upper';
  if (code === 'lower' || label.includes('ниж')) return 'lower';
  if ((plan?.cycle_length || plan?.cycleLength) === 1 || plan?.mode === 'same') return 'all';
  return code || `w${week.week_index ?? week.weekIndex}`;
}

/**
 * Default 2-week cycle anchor (upper/lower style schedules).
 * Week index 0 = «верхняя», index 1 = «нижняя».
 */
export const LEGACY_RGGU_ANCHOR = Object.freeze({
  anchorDate: '2026-10-26',
  anchorWeekIndex: 0,
  cycleLength: 2,
  weekStartDay: 1,
});

export function createDefaultWeeks(cycleLength, { twoWeekLabels = true } = {}) {
  const n = Math.max(1, Math.min(MAX_CYCLE_LENGTH, Number(cycleLength) || 1));
  const weeks = [];
  for (let i = 0; i < n; i += 1) {
    let label = `Неделя ${i + 1}`;
    let legacyCode = `w${i}`;
    if (n === 2 && twoWeekLabels) {
      label = i === 0 ? 'ВЕРХ' : 'НИЗ';
      legacyCode = i === 0 ? 'upper' : 'lower';
    } else if (n === 1) {
      label = 'Каждую неделю';
      legacyCode = 'all';
    }
    weeks.push({ weekIndex: i, label, legacyCode });
  }
  return weeks;
}
