import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { RefreshCw, Database, CheckCircle2, XCircle, FileDown } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import { formatNumber } from '@/utils/format';
import { getExportFormat, setExportFormat, onExportFormatChange } from '@/utils/appSettings';

function ExportFormatSetting() {
  const [fmt, setFmt] = useState(getExportFormat());
  useEffect(() => onExportFormatChange(setFmt), []);
  const choose = (f) => { setExportFormat(f); setFmt(f); };
  const option = (val, title, desc) => (
    <button
      type="button"
      onClick={() => choose(val)}
      className={clsx('flex-1 text-left rounded-lg border px-4 py-3 transition',
        fmt === val ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500' : 'border-dark-200 hover:border-dark-300')}
    >
      <div className="flex items-center gap-2 font-semibold text-dark-800">
        {title}
        {fmt === val && <Badge tone="success">Default</Badge>}
      </div>
      <div className="text-xs text-dark-500 mt-1">{desc}</div>
    </button>
  );
  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center gap-2 mb-1">
        <FileDown size={18} className="text-dark-400" />
        <div className="font-semibold text-dark-800">Default export format</div>
      </div>
      <div className="text-xs text-dark-400 mb-3">Applies to every “Export” button across the app. Excel files open with column filters (AutoFilter) enabled automatically.</div>
      <div className="flex flex-col sm:flex-row gap-3">
        {option('excel', 'Excel (.xlsx)', 'Filters enabled automatically; numbers and dates typed correctly.')}
        {option('csv', 'CSV (.csv)', 'Plain comma-separated values; opens anywhere.')}
      </div>
    </div>
  );
}

function SourceCard({ s }) {
  const ok = s.connected;
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database size={18} className="text-dark-400" />
          <div>
            <div className="font-semibold text-dark-800">{s.label}</div>
            <div className="text-xs text-dark-400">{s.role}</div>
          </div>
        </div>
        <Badge tone={ok ? 'success' : 'danger'}>
          {ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {ok ? 'Connected' : 'Not connected'}
        </Badge>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <dt className="text-dark-400">Cluster</dt><dd className="text-dark-700 truncate" title={s.cluster}>{s.cluster}</dd>
        <dt className="text-dark-400">Database</dt><dd className="text-dark-700">{s.db}</dd>
        <dt className="text-dark-400">Configured</dt><dd className="text-dark-700">{s.configured ? 'yes' : 'no'}</dd>
        {s.readyState && (<><dt className="text-dark-400">State</dt><dd className="text-dark-700">{s.readyState}</dd></>)}
      </dl>

      {s.collections && (
        <div className="mt-4">
          <div className="field-label mb-1">Collections (live counts)</div>
          <div className="space-y-1">
            {Object.entries(s.collections).map(([name, n]) => (
              <div key={name} className="flex justify-between text-sm border-t border-dark-100 py-1">
                <span className="text-dark-600">{name}</span>
                <span className="font-medium text-dark-800">{n == null ? '—' : formatNumber(n)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {s.error && <div className="mt-3 text-sm text-red-600 bg-red-50 rounded px-3 py-2">{s.error}</div>}
    </div>
  );
}

export default function Connections() {
  const { data, meta, loading, error, reload } = useApi(() => biService.connections(), []);
  return (
    <div>
      <PageHeader
        title="Data Connections"
        subtitle="Live status of every database the BI platform reads: the inventory / RouteStar source and the EnviroMaster server (mapdistance) source. Green means the API connected and can read that DB."
        actions={<button className="btn-secondary" onClick={reload}><RefreshCw size={16} /> Refresh</button>}
      />
      {meta?.generatedAt && <div className="text-xs text-dark-400 mb-4">Checked {new Date(meta.generatedAt).toLocaleString()}</div>}
      <ExportFormatSetting />
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rows.map((s) => <SourceCard key={s.key} s={s} />)}
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
