import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { normalizeSheetUrl } from './url.js';
import { readWorkbook } from './workbook-reader.js';

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
export const ALLOWED_HOST_SUFFIXES = [
  'docs.google.com',
  'googleusercontent.com',
  'drive.google.com',
];

export function hashBuffer(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

export function assertSafeExternalUrl(raw, { allowDirectExcel = true } = {}) {
  let url;
  try {
    url = new URL(String(raw || '').trim());
  } catch {
    throw Object.assign(new Error('Некорректная ссылка'), { status: 400 });
  }
  if (url.protocol !== 'https:') {
    throw Object.assign(new Error('Ссылки только по HTTPS'), { status: 400 });
  }
  const host = url.hostname.toLowerCase();
  // Block obvious SSRF targets
  if (
    host === 'localhost'
    || host.endsWith('.local')
    || host.endsWith('.internal')
    || /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)
    || host === '[::1]'
  ) {
    throw Object.assign(new Error('Внутренние адреса запрещены'), { status: 400 });
  }

  const isGoogle = ALLOWED_HOST_SUFFIXES.some((s) => host === s || host.endsWith(`.${s}`));
  const looksExcel = /\.(xlsx|xls)(\?|$)/i.test(url.pathname);
  if (!isGoogle && !(allowDirectExcel && looksExcel)) {
    throw Object.assign(new Error('Разрешены Google Sheets / Drive или прямые HTTPS-ссылки на .xlsx/.xls'), { status: 400 });
  }
  return normalizeSheetUrl(url.toString()) || url.toString();
}

export async function fetchRemoteWorkbook(rawUrl) {
  const exportUrl = assertSafeExternalUrl(rawUrl);
  const response = await fetch(exportUrl, {
    headers: {
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream,*/*',
      'User-Agent': 'student-journal/1.0',
    },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw Object.assign(new Error(`Не удалось скачать таблицу (${response.status})`), { status: 400 });
  }
  const type = String(response.headers.get('content-type') || '');
  if (/text\/html/i.test(type)) {
    throw Object.assign(
      new Error('Таблица недоступна по ссылке. Откройте доступ «всем, у кого есть ссылка».'),
      { status: 400 },
    );
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw Object.assign(new Error('Файл слишком большой (макс. 15 МБ)'), { status: 400 });
  }
  return { buffer, url: exportUrl, hash: hashBuffer(buffer) };
}

export function ensureUploadDir(rootDir) {
  const dir = path.join(rootDir, 'schedule-uploads');
  mkdirSync(dir, { recursive: true });
  return dir;
}

export function saveUploadBuffer(rootDir, buffer, { originalName = 'schedule.xlsx', sourceId = null } = {}) {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw Object.assign(new Error('Ожидался бинарный файл'), { status: 400 });
  }
  const buf = Buffer.from(buffer);
  if (buf.length > MAX_UPLOAD_BYTES) {
    throw Object.assign(new Error('Файл слишком большой (макс. 15 МБ)'), { status: 400 });
  }
  const lower = String(originalName || '').toLowerCase();
  if (!/\.(xlsx|xls)$/.test(lower)) {
    throw Object.assign(new Error('Поддерживаются только .xlsx и .xls'), { status: 400 });
  }
  // Reject OLE macro-heavy hint only by extension policy; xlsx lib does not execute macros.
  const hash = hashBuffer(buf);
  const dir = ensureUploadDir(rootDir);
  const safeBase = String(originalName).replace(/[^\w.\-а-яёА-ЯЁ]+/gi, '_').slice(0, 80);
  const fileName = `${Date.now()}-${hash.slice(0, 12)}-${safeBase}`;
  const fullPath = path.join(dir, fileName);
  writeFileSync(fullPath, buf);
  return {
    hash,
    fileName,
    relativePath: path.join('schedule-uploads', fileName),
    fullPath,
    size: buf.length,
    originalName,
    sourceId,
  };
}

export function loadStoredBuffer(rootDir, relativePath) {
  const full = path.isAbsolute(relativePath) ? relativePath : path.join(rootDir, relativePath);
  if (!existsSync(full)) {
    throw Object.assign(new Error('Файл источника не найден'), { status: 404 });
  }
  return readFileSync(full);
}

export function previewFromBuffer(buffer, options) {
  return readWorkbook(buffer, options);
}
