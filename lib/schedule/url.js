/** Google Sheets / Excel URL helpers */

export function normalizeSheetUrl(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  let url;
  try { url = new URL(text); } catch { return text; }

  const idMatch = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) {
    if (url.pathname.includes('/export')) return url.toString();
    return text;
  }
  const id = idMatch[1];
  let gid = url.searchParams.get('gid');
  if (!gid && url.hash) {
    const hashGid = url.hash.match(/(?:^|[&#])gid=(\d+)/);
    if (hashGid) gid = hashGid[1];
  }
  const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${id}/export`);
  exportUrl.searchParams.set('format', 'xlsx');
  if (gid) exportUrl.searchParams.set('gid', gid);
  return exportUrl.toString();
}
