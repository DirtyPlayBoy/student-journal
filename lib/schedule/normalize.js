export function normalizeGroupCode(value) {
  const text = String(value || '')
    .toUpperCase()
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, '')
    .replace(/–|—/g, '-');
  const match = text.match(/([А-ЯЁA-Z]{1,4})-?(\d{2})\/(\d{1,2})/);
  if (!match) return '';
  return `${match[1]}-${match[2]}/${match[3]}`;
}

export function displayGroupName(code) {
  const n = normalizeGroupCode(code);
  return n ? n.replace('-', ' ') : String(code || '').trim();
}

/** @returns {{ prefix: string, course: number, index: number, cohort: number, code: string } | null} */
export function parseGroupCodeParts(value) {
  const code = normalizeGroupCode(value);
  if (!code) return null;
  const match = code.match(/^([А-ЯЁA-Z]{1,4})-(\d)(\d)\/(\d{1,2})$/);
  if (!match) return null;
  return {
    prefix: match[1],
    course: Number(match[2]),
    index: Number(match[3]),
    cohort: Number(match[4]),
    code,
  };
}

/** Суффикс /9 → 2019, /24 → 2024 (короткий год набора). */
export function cohortYearFromSuffix(cohort, nowYear = new Date().getFullYear()) {
  const c = Number(cohort);
  if (!Number.isFinite(c) || c < 0 || c >= 100) {
    if (Number.isFinite(c) && c >= 1000) return c;
    return null;
  }
  if (c >= 10) {
    let year = 2000 + c;
    if (year > nowYear + 1) year -= 100;
    return year;
  }
  // Одна цифра: обычно набор ’9 → 2019
  let year = 2010 + c;
  if (year > nowYear + 1) year = 2000 + c;
  return year;
}

/**
 * @param {string} value
 * @param {{ delta?: number, maxCourse?: number, course?: number }} [opts]
 * @returns {string|null} новый код или null если нельзя повысить / не распарсили
 */
export function bumpGroupCourse(value, opts = {}) {
  const parts = parseGroupCodeParts(value);
  if (!parts) return null;
  const maxCourse = Math.min(9, Math.max(1, Number(opts.maxCourse) || 4));
  let nextCourse = parts.course;
  if (opts.course != null) {
    nextCourse = Math.min(maxCourse, Math.max(1, Number(opts.course) || parts.course));
  } else {
    const delta = Number(opts.delta);
    nextCourse = parts.course + (Number.isFinite(delta) ? delta : 1);
  }
  if (nextCourse < 1 || nextCourse > maxCourse) return null;
  if (nextCourse === parts.course && opts.course == null) return null;
  return `${parts.prefix}-${nextCourse}${parts.index}/${parts.cohort}`;
}

export function studyYearsLabel(startYear, endYear) {
  const a = Number(startYear);
  const b = Number(endYear);
  if (Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
    return a === b ? String(a) : `${a}–${b}`;
  }
  if (Number.isFinite(a) && a > 0) return String(a);
  if (Number.isFinite(b) && b > 0) return String(b);
  return '';
}

export function normalizeSubjectKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»""„‟‹›'\u0060´]/g, '')
    .replace(/№\s*/g, ' ')
    .replace(/[.,;:!?()[\]{}]/g, ' ')
    .replace(/[-–—_/\\|+＋]+/g, ' ')
    .replace(/(?:^|\s)(?:лекция|лекции|лекц|практика|практики|практ|семинар|семинары|сем|лабораторная|лабораторные|лаб|консультация|конс)(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
