import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGroupCode,
  displayGroupName,
  parseGroupCodeParts,
  bumpGroupCourse,
  cohortYearFromSuffix,
  studyYearsLabel,
} from '../../lib/schedule/normalize.js';

describe('group course normalize', () => {
  it('normalizes and displays codes', () => {
    assert.equal(normalizeGroupCode('ИК 31/9'), 'ИК-31/9');
    assert.equal(displayGroupName('ИК-31/9'), 'ИК 31/9');
  });

  it('parses course parts', () => {
    const p = parseGroupCodeParts('ИК 31/9');
    assert.deepEqual(p, {
      prefix: 'ИК',
      course: 3,
      index: 1,
      cohort: 9,
      code: 'ИК-31/9',
    });
  });

  it('bumps course digit', () => {
    assert.equal(bumpGroupCourse('ИК-31/9'), 'ИК-41/9');
    assert.equal(bumpGroupCourse('ИК-41/9', { maxCourse: 4 }), null);
    assert.equal(bumpGroupCourse('ИК-21/9', { course: 3 }), 'ИК-31/9');
    assert.equal(displayGroupName(bumpGroupCourse('ДК-11/9')), 'ДК 21/9');
  });

  it('maps cohort suffix to year', () => {
    assert.equal(cohortYearFromSuffix(9, 2026), 2019);
    assert.equal(cohortYearFromSuffix(24, 2026), 2024);
  });

  it('formats study years', () => {
    assert.equal(studyYearsLabel(2019, 2023), '2019–2023');
    assert.equal(studyYearsLabel(2020, 2020), '2020');
  });
});
