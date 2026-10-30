/** Красивые Excel-выгрузки журнала (xlsx-js-style). */

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx-js-style');

const COLORS = Object.freeze({
  brand: '157A4B',
  brandDeep: '0A241C',
  cream: 'EEF6F1',
  paper: 'FFFFFF',
  ink: '0F1713',
  muted: '5C6B62',
  line: 'C8D4CC',
  zebra: 'F4FAF6',
  metaKey: 'E8F3EC',
  amber: 'F5E6C8',
  amberInk: '8A5A00',
  redSoft: 'FDECEC',
  red: 'B42318',
  blueSoft: 'E6F3F8',
  blue: '1F6F8A',
  greenSoft: 'DCEFE4',
  goldSoft: 'EEF3F0',
});

const THIN = { style: 'thin', color: { rgb: COLORS.line } };
const BORDER = { top: THIN, left: THIN, bottom: THIN, right: THIN };

const STATUS_FILL = Object.freeze({
  'Был': { bg: COLORS.greenSoft, ink: COLORS.brand },
  'Присутствовал': { bg: COLORS.greenSoft, ink: COLORS.brand },
  'Опоздал': { bg: COLORS.amber, ink: COLORS.amberInk },
  'Уваж.': { bg: COLORS.blueSoft, ink: COLORS.blue },
  'Уважительная': { bg: COLORS.blueSoft, ink: COLORS.blue },
  'Ув. причина': { bg: COLORS.blueSoft, ink: COLORS.blue },
  'Не был': { bg: COLORS.redSoft, ink: COLORS.red },
  'Отсутствовал': { bg: COLORS.redSoft, ink: COLORS.red },
  'Не отмечен': { bg: COLORS.goldSoft, ink: COLORS.muted },
  'Пусто': { bg: COLORS.goldSoft, ink: COLORS.muted },
  'Зачёт': { bg: COLORS.greenSoft, ink: COLORS.brand },
  'Незачёт': { bg: COLORS.redSoft, ink: COLORS.red },
  'Отлично': { bg: COLORS.greenSoft, ink: COLORS.brand },
  'Хорошо': { bg: COLORS.blueSoft, ink: COLORS.blue },
  'Внимание': { bg: COLORS.amber, ink: COLORS.amberInk },
  'Плохо': { bg: COLORS.redSoft, ink: COLORS.red },
  'Нет данных': { bg: COLORS.goldSoft, ink: COLORS.muted },
  'Да': { bg: COLORS.greenSoft, ink: COLORS.brand },
  'Нет': { bg: COLORS.goldSoft, ink: COLORS.muted },
  'Активен': { bg: COLORS.greenSoft, ink: COLORS.brand },
  'Отключён': { bg: COLORS.redSoft, ink: COLORS.red },
});

const GRADE_FILL = Object.freeze({
  5: { bg: COLORS.greenSoft, ink: COLORS.brand },
  4: { bg: COLORS.blueSoft, ink: COLORS.blue },
  3: { bg: COLORS.amber, ink: COLORS.amberInk },
  2: { bg: COLORS.redSoft, ink: COLORS.red },
});

function isEmptyRow(row) {
  if (!row || !row.length) return true;
  return row.every((cell) => cell == null || String(cell).trim() === '');
}

function filledCount(row) {
  return (row || []).filter((cell) => cell != null && String(cell).trim() !== '').length;
}

function looksLikeMetaRow(row) {
  const n = filledCount(row);
  if (n === 0 || n > 3) return false;
  if ((row || []).length > 4 && filledCount(row.slice(2)) > 0 && n > 2) return false;
  const first = String(row?.[0] ?? '').trim();
  if (!first) return false;
  if (/^(заведение|подзаголовок|выгрузка|дата|ученик|группа|email|доступ|логин|показатель|общая|пар в)/i.test(first)) {
    return true;
  }
  return n <= 2 && first.length <= 40;
}

function looksLikeHeaderRow(row) {
  if (!row || filledCount(row) < 2) return false;
  const values = row.map((cell) => String(cell ?? '').trim()).filter(Boolean);
  if (!values.length) return false;
  const numericish = values.filter((v) => /^[\d.,%]+$/.test(v)).length;
  if (numericish > values.length * 0.35) return false;
  return true;
}

/**
 * Размечает AOA: title / meta / blank / header / data / section.
 * @returns {Array<{ type: string, row: any[] }>}
 */
export function classifyAoaRows(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const out = [];
  let seenHeader = false;
  let metaDone = false;

  for (let i = 0; i < list.length; i += 1) {
    const row = list[i] || [];
    if (isEmptyRow(row)) {
      out.push({ type: 'blank', row });
      if (seenHeader) seenHeader = false;
      metaDone = true;
      continue;
    }

    const next = list[i + 1];
    const singleWide = filledCount(row) === 1 && String(row[0] || '').length > 8;

    if (!metaDone && !seenHeader && looksLikeMetaRow(row)) {
      out.push({ type: 'meta', row });
      continue;
    }

    if (singleWide && (!next || isEmptyRow(next) || looksLikeHeaderRow(next))) {
      out.push({ type: 'section', row });
      seenHeader = false;
      metaDone = true;
      continue;
    }

    if (!seenHeader && looksLikeHeaderRow(row)) {
      out.push({ type: 'header', row });
      seenHeader = true;
      metaDone = true;
      continue;
    }

    out.push({ type: 'data', row });
    seenHeader = true;
    metaDone = true;
  }
  return out;
}

function statusStyle(raw) {
  if (raw == null || raw === '') return null;
  const text = String(raw).trim();
  const status = STATUS_FILL[text];
  if (status) {
    return {
      fill: { patternType: 'solid', fgColor: { rgb: status.bg } },
      font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: status.ink } },
      alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
      border: BORDER,
    };
  }
  if (/^[2-5]$/.test(text)) {
    const grade = GRADE_FILL[Number(text)];
    if (grade) {
      return {
        fill: { patternType: 'solid', fgColor: { rgb: grade.bg } },
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: grade.ink } },
        alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        border: BORDER,
      };
    }
  }
  return null;
}

function setCell(sheet, address, value, style) {
  sheet[address] = {
    v: value == null ? '' : value,
    t: typeof value === 'number' ? 'n' : 's',
    s: style,
  };
}

function encodeCell(r, c) {
  return XLSX.utils.encode_cell({ r, c });
}

function buildSheetAoA({
  title,
  subtitle,
  institution,
  rows,
  branded = true,
}) {
  const classified = classifyAoaRows(rows || []);
  const colCount = Math.max(
    1,
    ...(rows || []).map((row) => (Array.isArray(row) ? row.length : 1)),
    3,
  );

  const out = [];
  const merges = [];
  const styles = []; // parallel to out rows: array of style objects per cell
  let firstHeaderRow = -1;
  let dataIndex = 0;

  const pushStyled = (values, cellStyles, { merge = false } = {}) => {
    const rowIndex = out.length;
    const padded = Array.from({ length: colCount }, (_, i) => values[i] ?? '');
    out.push(padded);
    styles.push(Array.from({ length: colCount }, (_, i) => cellStyles[i] || cellStyles[0] || {}));
    if (merge) {
      merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: colCount - 1 } });
    }
    return rowIndex;
  };

  if (branded) {
    pushStyled(
      [institution || title || 'Электронный журнал'],
      [{
        font: { name: 'Calibri', sz: 16, bold: true, color: { rgb: COLORS.paper } },
        fill: { patternType: 'solid', fgColor: { rgb: COLORS.brandDeep } },
        alignment: { vertical: 'center', horizontal: 'left', indent: 1 },
      }],
      { merge: true },
    );
    pushStyled(
      [[title, subtitle].filter(Boolean).join(' · ') || 'Выгрузка'],
      [{
        font: { name: 'Calibri', sz: 11, color: { rgb: COLORS.cream } },
        fill: { patternType: 'solid', fgColor: { rgb: COLORS.brand } },
        alignment: { vertical: 'center', horizontal: 'left', indent: 1 },
      }],
      { merge: true },
    );
    pushStyled(Array(colCount).fill(''), [{}]);
  }

  for (const item of classified) {
    const values = item.row || [];

    if (item.type === 'blank') {
      pushStyled(Array(colCount).fill(''), [{}]);
      continue;
    }

    if (item.type === 'section') {
      pushStyled(
        [values[0] ?? ''],
        [{
          font: { name: 'Calibri', sz: 12, bold: true, color: { rgb: COLORS.brandDeep } },
          fill: { patternType: 'solid', fgColor: { rgb: COLORS.cream } },
          alignment: { vertical: 'center', horizontal: 'left', indent: 1 },
        }],
        { merge: true },
      );
      continue;
    }

    if (item.type === 'meta') {
      const cellStyles = Array.from({ length: colCount }, (_, c) => ({
        font: {
          name: 'Calibri',
          sz: 10,
          bold: c === 0,
          color: { rgb: c === 0 ? COLORS.muted : COLORS.ink },
        },
        fill: {
          patternType: 'solid',
          fgColor: { rgb: c === 0 ? COLORS.metaKey : COLORS.paper },
        },
        alignment: { vertical: 'center', wrapText: true },
        border: BORDER,
      }));
      pushStyled(values, cellStyles);
      continue;
    }

    if (item.type === 'header') {
      if (firstHeaderRow < 0) firstHeaderRow = out.length;
      const cellStyles = Array.from({ length: colCount }, () => ({
        font: { name: 'Calibri', sz: 10, bold: true, color: { rgb: COLORS.paper } },
        fill: { patternType: 'solid', fgColor: { rgb: COLORS.brand } },
        alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
        border: BORDER,
      }));
      pushStyled(values, cellStyles);
      continue;
    }

    const zebra = dataIndex % 2 === 1;
    dataIndex += 1;
    const cellStyles = Array.from({ length: colCount }, (_, c) => {
      const raw = values[c];
      const special = statusStyle(raw);
      if (special) return special;
      const numeric = typeof raw === 'number' || /^[\d.,]+%?$/.test(String(raw ?? ''));
      return {
        font: { name: 'Calibri', sz: 10, color: { rgb: COLORS.ink } },
        fill: {
          patternType: 'solid',
          fgColor: { rgb: zebra ? COLORS.zebra : COLORS.paper },
        },
        alignment: {
          vertical: 'center',
          horizontal: numeric ? 'center' : 'left',
          wrapText: true,
        },
        border: BORDER,
      };
    });
    pushStyled(values, cellStyles);
  }

  const sheet = XLSX.utils.aoa_to_sheet(out);
  sheet['!merges'] = merges;
  if (firstHeaderRow >= 0) {
    sheet['!freeze'] = { xSplit: 0, ySplit: firstHeaderRow + 1, topLeftCell: encodeCell(firstHeaderRow + 1, 0), activePane: 'bottomLeft', state: 'frozen' };
  }

  // Apply styles cell-by-cell (aoa_to_sheet doesn't keep them)
  for (let r = 0; r < out.length; r += 1) {
    for (let c = 0; c < colCount; c += 1) {
      const addr = encodeCell(r, c);
      const style = styles[r]?.[c];
      if (!sheet[addr]) {
        if (!style || !Object.keys(style).length) continue;
        setCell(sheet, addr, '', style);
        continue;
      }
      if (style && Object.keys(style).length) sheet[addr].s = style;
    }
  }

  const widths = [];
  for (const row of out.slice(0, 120)) {
    row.forEach((cell, index) => {
      const len = String(cell ?? '').length + 2;
      widths[index] = Math.min(42, Math.max(widths[index] || 10, len, 10));
    });
  }
  sheet['!cols'] = widths.map((wch) => ({ wch: wch || 10 }));
  sheet['!rows'] = out.map((row, index) => {
    if (branded && index === 0) return { hpt: 28 };
    if (branded && index === 1) return { hpt: 20 };
    return { hpt: 18 };
  });

  return sheet;
}

/**
 * Собирает .xlsx buffer.
 * @param {{
 *   filename: string,
 *   sheets: Array<{ name: string, rows: any[][], title?: string, subtitle?: string, branded?: boolean }>,
 *   institution?: string,
 *   subtitle?: string,
 * }} opts
 */
export async function buildStyledXlsx({
  filename,
  sheets = [],
  institution = '',
  subtitle = '',
} = {}) {
  const wb = XLSX.utils.book_new();
  wb.Props = {
    Title: subtitle || 'Выгрузка',
    Subject: institution || 'Электронный журнал',
    Author: institution || 'Электронный журнал',
    CreatedDate: new Date(),
  };

  const list = sheets.length ? sheets : [{ name: 'Данные', rows: [['Нет данных']] }];
  for (const item of list) {
    const name = String(item.name || 'Лист').slice(0, 31) || 'Лист';
    const sheet = buildSheetAoA({
      title: item.title || name,
      subtitle: item.subtitle || subtitle,
      institution,
      rows: item.rows || [['Нет данных']],
      branded: item.branded !== false,
    });
    XLSX.utils.book_append_sheet(wb, sheet, name);
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
  return {
    filename: filename || 'export.xlsx',
    buffer: Buffer.from(buffer),
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

export const EXCEL_COLORS = COLORS;
