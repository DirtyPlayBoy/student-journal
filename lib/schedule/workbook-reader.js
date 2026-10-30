import XLSX from 'xlsx';
import { cleanCell } from './text-parser.js';

export function colToLetter(col) {
  let n = Number(col) + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s || 'A';
}

export function letterToCol(letter) {
  const text = String(letter || '').toUpperCase().replace(/[^A-Z]/g, '');
  let n = 0;
  for (const ch of text) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function parseA1(ref) {
  const m = String(ref || '').trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  return { col: letterToCol(m[1]), row: Number(m[2]) - 1, a1: `${m[1]}${m[2]}` };
}

export function toA1(row, col) {
  return `${colToLetter(col)}${row + 1}`;
}

export function parseRange(ref) {
  const text = String(ref || '').trim().toUpperCase();
  if (!text) return null;
  if (/^[A-Z]+$/.test(text)) {
    const col = letterToCol(text);
    return { type: 'column', col, start: null, end: null };
  }
  const parts = text.split(':');
  if (parts.length === 1) {
    const cell = parseA1(parts[0]);
    return cell ? { type: 'cell', start: cell, end: cell } : null;
  }
  const start = parseA1(parts[0]);
  const end = parseA1(parts[1]);
  if (!start || !end) return null;
  return { type: 'range', start, end };
}

function expandMerges(sheet) {
  const merges = sheet['!merges'] || [];
  const map = new Map();
  for (const m of merges) {
    const master = toA1(m.s.r, m.s.c);
    for (let r = m.s.r; r <= m.e.r; r += 1) {
      for (let c = m.s.c; c <= m.e.c; c += 1) {
        map.set(toA1(r, c), {
          master,
          rowspan: m.e.r - m.s.r + 1,
          colspan: m.e.c - m.s.c + 1,
          isMaster: r === m.s.r && c === m.s.c,
        });
      }
    }
  }
  return map;
}

/**
 * Read workbook buffer into a normalized structure for UI + parsing.
 */
export function readWorkbook(buffer, { maxRows = 200, maxCols = 40 } = {}) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: false, dense: false });
  const sheets = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const ref = sheet['!ref'] || 'A1';
    const range = XLSX.utils.decode_range(ref);
    const rowsCount = Math.min(range.e.r + 1, maxRows);
    const colsCount = Math.min(range.e.c + 1, maxCols);
    const merges = expandMerges(sheet);
    const rows = [];
    const matrix = [];
    for (let r = 0; r < rowsCount; r += 1) {
      const row = [];
      const cells = [];
      for (let c = 0; c < colsCount; c += 1) {
        const a1 = toA1(r, c);
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[addr];
        let value = '';
        if (cell != null) {
          value = cell.w != null ? String(cell.w) : cleanCell(cell.v);
        }
        const merge = merges.get(a1);
        if ((!value || value === '') && merge && !merge.isMaster) {
          const masterCell = sheet[XLSX.utils.encode_cell(parseA1(merge.master))];
          if (masterCell) {
            value = masterCell.w != null ? String(masterCell.w) : cleanCell(masterCell.v);
          }
        }
        row.push(value);
        cells.push({
          a1,
          row: r,
          col: c,
          value,
          merge: merge || null,
        });
      }
      matrix.push(row);
      rows.push(cells);
    }
    sheets.push({
      name,
      rows: matrix,
      cells: rows,
      merges: sheet['!merges'] || [],
      rowCount: rowsCount,
      colCount: colsCount,
    });
  }
  return {
    sheetNames: wb.SheetNames,
    sheets,
  };
}

export function getSheetByName(workbook, sheetName) {
  if (!workbook?.sheets?.length) return null;
  if (!sheetName) return workbook.sheets[0];
  return workbook.sheets.find((s) => s.name === sheetName) || workbook.sheets[0];
}

export function getCellValue(sheet, a1OrRow, col) {
  if (!sheet) return '';
  let row;
  let c;
  if (typeof a1OrRow === 'string') {
    const parsed = parseA1(a1OrRow);
    if (!parsed) return '';
    row = parsed.row;
    c = parsed.col;
  } else {
    row = a1OrRow;
    c = col;
  }
  return cleanCell(sheet.rows?.[row]?.[c] ?? '');
}

export function cellsInRange(sheet, rangeRef) {
  const range = typeof rangeRef === 'string' ? parseRange(rangeRef) : rangeRef;
  if (!range || !sheet) return [];
  if (range.type === 'column') {
    const out = [];
    for (let r = 0; r < sheet.rowCount; r += 1) {
      out.push({
        a1: toA1(r, range.col),
        row: r,
        col: range.col,
        value: getCellValue(sheet, r, range.col),
      });
    }
    return out;
  }
  const r0 = Math.min(range.start.row, range.end.row);
  const r1 = Math.max(range.start.row, range.end.row);
  const c0 = Math.min(range.start.col, range.end.col);
  const c1 = Math.max(range.start.col, range.end.col);
  const out = [];
  for (let r = r0; r <= r1; r += 1) {
    for (let c = c0; c <= c1; c += 1) {
      out.push({ a1: toA1(r, c), row: r, col: c, value: getCellValue(sheet, r, c) });
    }
  }
  return out;
}
