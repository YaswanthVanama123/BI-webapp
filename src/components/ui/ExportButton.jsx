import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { exportRowsToExcel, exportRowsToCsv } from '@/utils/exportCsv';
import { getExportFormat, onExportFormatChange } from '@/utils/appSettings';

export default function ExportButton({ rows, columns, filename = 'export', label, disabled }) {
  const [fmt, setFmt] = useState(getExportFormat());
  useEffect(() => onExportFormatChange(setFmt), []);
  const empty = !rows || rows.length === 0;
  const run = () => {
    const r = (fmt === 'csv' ? exportRowsToCsv : exportRowsToExcel)(rows, columns, filename);
    if (r && typeof r.catch === 'function') r.catch(() => {});
  };
  const text = label || (fmt === 'csv' ? 'Export CSV' : 'Export Excel');
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={disabled || empty}
      title={empty ? 'Nothing to export' : `Export ${rows.length} rows as ${fmt === 'csv' ? 'CSV' : 'Excel'}`}
      onClick={run}
    >
      <Download size={16} />
      {text}
    </button>
  );
}
