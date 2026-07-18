import React from 'react';
import { Download } from 'lucide-react';
import { exportRowsToCsv } from '@/utils/exportCsv';

export default function ExportButton({ rows, columns, filename = 'export', label = 'Export CSV', disabled }) {
  const empty = !rows || rows.length === 0;
  return (
    <button
      type="button"
      className="btn-secondary"
      disabled={disabled || empty}
      title={empty ? 'Nothing to export' : `Export ${rows.length} rows to CSV`}
      onClick={() => exportRowsToCsv(rows, columns, filename)}
    >
      <Download size={16} />
      {label}
    </button>
  );
}
