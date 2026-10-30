import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolvePlanWeek,
  createDefaultWeeks,
  weekTypeForDate,
  LEGACY_RGGU_ANCHOR,
} from '../../lib/schedule/index.js';

test('createDefaultWeeks supports arbitrary N', () => {
  assert.equal(createDefaultWeeks(1).length, 1);
  assert.equal(createDefaultWeeks(4).length, 4);
  assert.equal(createDefaultWeeks(7).length, 7);
  assert.equal(createDefaultWeeks(2)[0].legacyCode, 'upper');
  assert.equal(createDefaultWeeks(2)[1].legacyCode, 'lower');
});

test('cycle resolver uses academic weeks not month weeks', () => {
  const plan = {
    mode: 'cycle',
    cycle_length: 4,
    week_start_day: 1,
    anchor_date: '2026-10-26',
    anchor_week_index: 0,
  };
  const weeks = createDefaultWeeks(4).map((w) => ({
    week_index: w.weekIndex,
    label: w.label,
    legacy_code: w.legacyCode,
  }));
  assert.equal(resolvePlanWeek(plan, weeks, '2026-10-26').weekIndex, 0);
  assert.equal(resolvePlanWeek(plan, weeks, '2026-11-02').weekIndex, 1);
  assert.equal(resolvePlanWeek(plan, weeks, '2026-11-09').weekIndex, 2);
  assert.equal(resolvePlanWeek(plan, weeks, '2026-11-16').weekIndex, 3);
  assert.equal(resolvePlanWeek(plan, weeks, '2026-11-23').weekIndex, 0);
});

test('calendar_weeks does not auto-repeat', () => {
  const plan = { mode: 'calendar_weeks', cycle_length: 1, week_start_day: 1 };
  const weeks = [{
    week_index: 0,
    label: 'Таблица 1',
    date_from: '2026-10-26',
    date_to: '2026-11-01',
  }];
  assert.equal(resolvePlanWeek(plan, weeks, '2026-10-28').empty, false);
  const miss = resolvePlanWeek(plan, weeks, '2026-11-10');
  assert.equal(miss.empty, true);
  assert.equal(miss.reason, 'outside_ranges');
});

test('legacy weekTypeForDate matches upper/lower around anchor', () => {
  assert.equal(weekTypeForDate(LEGACY_RGGU_ANCHOR.anchorDate), 'upper');
  assert.equal(weekTypeForDate('2026-10-19'), 'lower');
});
