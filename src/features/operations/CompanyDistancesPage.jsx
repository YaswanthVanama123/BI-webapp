import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge, SearchSelect } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatMinutes, formatNumber, formatDateShort, statusTone } from '@/utils/format';

const PAGE_SIZE = 25;
const STATUS_OPTIONS = ['all', 'synced', 'pending', 'ok', 'same_location', 'missing_coords', 'mapbox_failed'];

const columns = [
  { key: 'fromCompany', header: 'From company' },
  { key: 'toCompany', header: 'To company' },
  { key: 'distanceMiles', header: 'Distance (mi)', align: 'right', render: (r) => (r.distanceMiles != null ? formatNumber(r.distanceMiles) : '—'), csv: (r) => r.distanceMiles },
  {
    key: 'drivingMinutes', header: 'Driving time', align: 'right',
    render: (r) => (r.drivingMinutes != null ? formatMinutes(r.drivingMinutes) : <span className="text-dark-300">null</span>),
    csv: (r) => r.drivingMinutes,
  },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  { key: 'syncedAt', header: 'Synced', render: (r) => (r.syncedAt ? formatDateShort(r.syncedAt) : '—') },
];

function jobMessage(job) {
  if (!job) return null;
  if (job.phase === 'discovering') return 'Sync running in background: discovering company pairs…';
  if (job.phase === 'syncing') return `Sync running in background: ${formatNumber(job.synced || 0)} driving times computed, ${job.remaining != null ? formatNumber(job.remaining) : '…'} still pending. You can leave this page — it keeps running.`;
  if (job.phase === 'error') return `Sync failed: ${job.error || 'error'}`;
  if (job.phase === 'done') return `Sync complete: ${formatNumber(job.synced || 0)} driving times computed${job.failed ? `, ${formatNumber(job.failed)} could not be resolved` : ''}.`;
  return null;
}

export default function CompanyDistances() {
  const [status, setStatus] = useState('all');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [page, setPage] = useState(1);
  const [job, setJob] = useState(null);
  const pollRef = useRef(null);

  const running = !!job?.running;

  const { data: optionsData } = useApi(() => biService.companyDistanceOptions(), []);
  const fromOptions = useMemo(() => (optionsData?.from || []).map((o) => ({ value: o.id, label: o.name })), [optionsData]);
  const toOptions = useMemo(() => (optionsData?.to || []).map((o) => ({ value: o.id, label: o.name })), [optionsData]);

  const { data, meta, page: pageMeta, loading, error, reload } = useApi(
    () => biService.companyDistances({ status, from: fromId, to: toId, page, pageSize: PAGE_SIZE }),
    [status, fromId, toId, page],
  );

  const fetchStatus = useCallback(async () => {
    try { const res = await biService.companyDistanceSyncStatus(); setJob(res?.data || null); return res?.data || null; }
    catch { return null; }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (!running) return undefined;
    pollRef.current = setInterval(async () => {
      const j = await fetchStatus();
      if (j && !j.running) { clearInterval(pollRef.current); reload(); }
    }, 3000);
    return () => clearInterval(pollRef.current);
  }, [running, fetchStatus, reload]);

  const onSync = async () => {
    try {
      const res = await biService.syncCompanyDistances();
      setJob(res?.data?.job || { running: true, phase: 'discovering' });
    } catch (e) {
      setJob({ running: false, phase: 'error', error: e?.message || 'could not start' });
    }
  };

  const totalPages = pageMeta?.totalPages || 1;
  const filtered = pageMeta?.total ?? 0;
  const msg = jobMessage(job);

  return (
    <div>
      <PageHeader
        title="Distances / Driving Time"
        subtitle="RouteStar from→to company pairs (from the enviromaster mapdistance data). Distance is from RouteStar; driving time is null until you Sync. Sync runs in the background (keeps going if you refresh) and computes only the pairs still pending."
        actions={<button className="btn-primary" disabled={running} onClick={onSync}><RefreshCw size={16} className={running ? 'animate-spin' : ''} /> {running ? 'Syncing…' : 'Sync with Mapbox'}</button>}
      />

      {meta && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard label="Total pairs" value={formatNumber(meta.total)} tone="info" />
          <StatCard label="Synced" value={formatNumber(meta.synced)} tone="success" />
          <StatCard label="Pending (null)" value={formatNumber(meta.pending)} tone={meta.pending ? 'warning' : 'success'} />
        </div>
      )}

      {msg && <div className="card p-3 mb-4 text-sm text-dark-600 flex items-center gap-2">{running && <RefreshCw size={14} className="animate-spin" />}{msg}</div>}

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <label className="flex flex-col"><span className="field-label">Status</span>
          <select className="field" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s === 'synced' ? 'synced (has driving time)' : s}</option>)}
          </select>
        </label>
        <div className="flex flex-col"><span className="field-label">From company</span>
          <SearchSelect value={fromId} onChange={(v) => { setFromId(v); setPage(1); }} options={fromOptions} placeholder="All companies" allLabel="All companies" />
        </div>
        <div className="flex flex-col"><span className="field-label">Destination company</span>
          <SearchSelect value={toId} onChange={(v) => { setToId(v); setPage(1); }} options={toOptions} placeholder="All destinations" allLabel="All destinations" />
        </div>
      </div>

      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => (
          <>
            <DataTable columns={columns} rows={rows} exportFilename="company-distances" exportable={false} paginated={false} />
            <div className="flex items-center justify-between mt-3 text-sm text-dark-500">
              <span>{filtered === 0 ? 'No matching pairs' : `Page ${page} of ${totalPages} · ${formatNumber(filtered)} pairs`}</span>
              <div className="flex items-center gap-2">
                <button className="btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft size={16} /> Prev</button>
                <button className="btn-secondary" disabled={page >= totalPages || loading} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next <ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}
      </AsyncSection>
    </div>
  );
}
