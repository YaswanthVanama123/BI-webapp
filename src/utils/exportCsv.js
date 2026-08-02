import Papa from 'papaparse';

function triggerDownload(csv, filename) {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function timestamp() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function excelValue(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return Number.isFinite(v) ? v : '';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') {
    if (v.$numberDecimal !== undefined) { const n = Number(v.$numberDecimal); return Number.isNaN(n) ? '' : n; }
    if (v instanceof Date) return v;
    return JSON.stringify(v);
  }
  const s = String(v);
  if (ISO_DATETIME.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
  return s;
}

function cellFor(col, row) {
  const raw = col.csv ? col.csv(row) : col.accessor ? col.accessor(row) : row[col.key];
  return excelValue(raw);
}

export async function exportRowsToExcel(rows, columns, filenameBase = 'export') {
  const mod = await import('xlsx');
  const XLSX = mod.utils ? mod : mod.default;
  const cols = (columns || []).filter((c) => c.exportable !== false);
  const header = cols.map((c) => c.header || c.key);
  const body = (rows || []).map((row) => cols.map((c) => cellFor(c, row)));
  const aoa = [header, ...body];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const lastRow = Math.max(0, aoa.length - 1);
  const lastCol = Math.max(0, cols.length - 1);
  ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: lastRow, c: lastCol } }) };
  ws['!cols'] = cols.map((c, i) => {
    let w = String(c.header || c.key || '').length;
    for (const r of body) { const cell = r[i]; const len = cell == null ? 0 : String(cell).length; if (len > w) w = len; }
    return { wch: Math.min(45, Math.max(10, w + 2)) };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${filenameBase}-${timestamp()}.xlsx`);
  return body.length;
}

export function exportRowsToCsv(rows, columns, filenameBase = 'export') {
  const cols = (columns || []).filter((c) => c.exportable !== false);
  const records = (rows || []).map((row) => {
    const rec = {};
    for (const col of cols) {
      const raw = col.csv ? col.csv(row) : col.accessor ? col.accessor(row) : row[col.key];
      rec[col.header || col.key] = normalizeCell(raw);
    }
    return rec;
  });
  const csv = Papa.unparse(records, { quotes: true });
  triggerDownload(csv, `${filenameBase}-${timestamp()}`);
  return records.length;
}

export function exportObjectsToCsv(rows, filenameBase = 'export') {
  const csv = Papa.unparse((rows || []).map((r) => mapCells(r)), { quotes: true });
  triggerDownload(csv, `${filenameBase}-${timestamp()}`);
  return (rows || []).length;
}

function mapCells(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) out[k] = normalizeCell(v);
  return out;
}

function normalizeCell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') {
    if (v.$numberDecimal !== undefined) return v.$numberDecimal;
    if (v instanceof Date) return v.toISOString();
    return JSON.stringify(v);
  }
  return v;
}
