import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { exportRowsToExcel, exportRowsToCsv } from '@/utils/exportCsv';
import { getExportFormat, onExportFormatChange } from '@/utils/appSettings';

export default function ExportButton({ rows, columns, filename = 'export', label, disabled, fetchRows }) {
  const [fmt, setFmt] = useState(getExportFormat());
  const [busy, setBusy] = useState(false);
  useEffect(() => onExportFormatChange(setFmt), []);
  const empty = !fetchRows && (!rows || rows.length === 0);
  const run = async () => {
    try {
      setBusy(true);
      const data = fetchRows ? await fetchRows() : rows;
      const r = (fmt === 'csv' ? exportRowsToCsv : exportRowsToExcel)(data || [], columns, filename);
      if (r && typeof r.catch === 'function') await r.catch(() => {});
    } finally {
      setBusy(false);
    }
  };
  const text = label || (fmt === 'csv' ? 'Export CSV' : 'Export Excel');
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={disabled || empty || busy}
      title={empty ? 'Nothing to export' : `Export all rows as ${fmt === 'csv' ? 'CSV' : 'Excel'}`}
      onClick={run}
    >
      <Download size={16} />
      {busy ? 'Exporting…' : text}
    </button>
  );
}
