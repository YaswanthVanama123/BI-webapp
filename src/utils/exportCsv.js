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
