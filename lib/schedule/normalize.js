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
