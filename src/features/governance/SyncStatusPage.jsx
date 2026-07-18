import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { statusTone, formatNumber } from '@/utils/format';

const dt = (v) => (v ? new Date(v).toLocaleString() : '—');
const dur = (ms) => {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
};
const summaryText = (s) => (s && typeof s === 'object' ? Object.entries(s).filter(([, v]) => v != null && v !== '').map(([kk, v]) => `${kk}: ${v}`).join(' · ') : '');

const historyColumns = [
  { key: 'label', header: 'Sync' },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status === 'done' ? 'ok' : r.status)}>{r.status}</Badge> },
  { key: 'startedAt', header: 'Started', render: (r) => dt(r.startedAt), sortValue: (r) => r.startedAt || '' },
  { key: 'finishedAt', header: 'Finished', render: (r) => dt(r.finishedAt) },
  { key: 'durationMs', header: 'Duration', align: 'right', render: (r) => dur(r.durationMs) },
  { key: 'summary', header: 'Result', render: (r) => (r.error ? <span className="text-red-600">{r.error}</span> : <span className="text-dark-600">{summaryText(r.summary)}</span>) },
];

export default function SyncStatus() {
  const { data, loading, error, reload } = useApi(() => biService.syncStatus({}), []);
  const [tick, setTick] = useState(0);
  const pollRef = useRef(null);
  const running = (data && data.running) || [];

  const refetch = useCallback(() => { reload(); setTick((t) => t + 1); }, [reload]);

  // Auto-refresh every 5s while a job is in progress.
  useEffect(() => {
    if (!running.length) { if (pollRef.current) clearInterval(pollRef.current); return undefined; }
    pollRef.current = setInterval(() => reload(), 5000);
    return () => clearInterval(pollRef.current);
  }, [running.length, reload]);

  const history = (data && data.history) || [];

  return (
    <div>
      <PageHeader
        title="Sync Status"
        subtitle="Background sync jobs — what's running now and the recent run history."
        actions={<button className="btn-secondary" onClick={refetch}><RefreshCw size={16} /> Refresh</button>}
      />

      <AsyncSection loading={loading} error={error} data={data ? [data] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-dark-700 mb-2">In progress</h3>
              {running.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {running.map((j) => (
                    <div key={j.type} className="card p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-dark-800 flex items-center gap-2"><RefreshCw size={15} className="animate-spin text-primary-600" /> {j.label}</div>
                        <Badge tone="info">{j.phase}</Badge>
                      </div>
                      <div className="text-sm text-dark-600 mt-2">{summaryText(j.progress)}</div>
                      <div className="text-xs text-dark-400 mt-1">started {dt(j.startedAt)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-4 text-sm text-dark-400">No sync running right now.</div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-dark-700 mb-2">Run history</h3>
              {history.length
                ? <DataTable columns={historyColumns} rows={history} exportFilename="sync-history" initialSort={{ key: 'startedAt', dir: 'desc' }} />
                : <div className="card p-4 text-sm text-dark-400">No sync runs recorded yet — trigger a Sync (Customers or Distances) and it will appear here.</div>}
            </div>
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
