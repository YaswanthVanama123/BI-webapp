import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, MapPin } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge, Modal } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { statusTone, formatNumber } from '@/utils/format';

const columns = [
  { key: 'customerName', header: 'Customer' },
  { key: 'routeStarCustomerId', header: 'RouteStar ID' },
  { key: 'routeStarAccountNumber', header: 'Account #', render: (r) => r.routeStarAccountNumber || <span className="text-dark-300">—</span> },
  { key: 'routeCode', header: 'Route' },
  { key: 'frequency', header: 'Frequency' },
  { key: 'customerStatus', header: 'Status', render: (r) => <Badge tone={statusTone(r.customerStatus)}>{r.customerStatus}</Badge> },
];

const pricingColumns = [
  { key: 'item', header: 'Item' },
  { key: 'description', header: 'Description' },
  { key: 'salesPrice', header: 'Price', align: 'right', render: (r) => (r.salesPrice != null ? `$${formatNumber(r.salesPrice)}` : '—') },
  { key: 'defaultQty', header: 'Qty', align: 'right', render: (r) => r.defaultQty || '—' },
  { key: 'frequency', header: 'Frequency', render: (r) => r.frequency || '—' },
];

const addrLine = (a) => [a?.line1, a?.line2, a?.line3].filter(Boolean).join(', ');
const cityLine = (a) => [a?.city, a?.state, a?.zip].filter(Boolean).join(', ');

const ROUTE_PREFERRED = ['Route', 'Frequency', 'Day', 'Date', 'Assigned To', 'Stop', 'Category', 'StartTime', 'Budget (mins).', 'Drive Time (mins).', 'Account #', 'Notes'];
function routeColumns(routes) {
  const keys = new Set();
  routes.forEach((r) => Object.keys(r).forEach((k) => { if (r[k] != null && String(r[k]).trim() !== '') keys.add(k); }));
  const ordered = [...ROUTE_PREFERRED.filter((k) => keys.has(k)), ...[...keys].filter((k) => !ROUTE_PREFERRED.includes(k))];
  return ordered.map((k) => ({ key: k, header: k.replace(/\.$/, ''), render: (r) => (r[k] != null && r[k] !== '' ? r[k] : '—') }));
}

function CustomerDetailModal({ customerId, onClose }) {
  const { data, loading, error, reload } = useApi(() => biService.customerAccount(customerId), [customerId]);
  return (
    <Modal open onClose={onClose} title={data?.customerName || 'Customer detail'} size="lg">
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(d) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="field-label">Account #</div><div className="text-dark-800">{d.accountNumber || '—'}</div></div>
              <div><div className="field-label">RouteStar ID</div><div className="text-dark-800">{d.customerId}</div></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-3">
                <div className="flex items-center gap-2 mb-1 font-semibold text-dark-700"><MapPin size={15} /> Service address</div>
                <div className="text-sm text-dark-700">{addrLine(d.service) || '—'}</div>
                <div className="text-sm text-dark-500">{cityLine(d.service)}</div>
                {(d.service?.latitude != null) && <div className="text-xs text-dark-400 mt-1">lat {d.service.latitude}, lng {d.service.longitude}{d.service.zone ? ` · zone ${d.service.zone}` : ''}</div>}
              </div>
              <div className="card p-3">
                <div className="font-semibold text-dark-700 mb-1">Billing address</div>
                <div className="text-sm text-dark-700">{addrLine(d.billing) || '—'}</div>
                <div className="text-sm text-dark-500">{cityLine(d.billing)}</div>
              </div>
            </div>

            <div>
              <div className="field-label mb-1">Pricing ({d.pricing?.length || 0})</div>
              {d.pricing && d.pricing.length
                ? <DataTable columns={pricingColumns} rows={d.pricing} exportFilename={`pricing-${d.customerId}`} paginated={false} />
                : <div className="text-sm text-dark-400">No pricing captured yet — run Sync to fetch it.</div>}
            </div>

            <div>
              <div className="field-label mb-1">Routes ({d.routes?.length || 0})</div>
              {d.routes && d.routes.length
                ? <DataTable columns={routeColumns(d.routes)} rows={d.routes} exportFilename={`routes-${d.customerId}`} paginated={false} />
                : <div className="text-sm text-dark-400">No routes for this customer.</div>}
            </div>
            <div className="text-xs text-dark-400">Source: {d.source}{d.fetchedAt ? ` · fetched ${new Date(d.fetchedAt).toLocaleString()}` : ''}</div>
          </div>
        )}
      </AsyncSection>
    </Modal>
  );
}

export default function Customers() {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [job, setJob] = useState(null);
  const pollRef = useRef(null);
  const running = !!job?.running;

  const { data, loading, error, reload } = useApi(() => biService.customers({}), []);
  const rows = (data || []).filter((c) => !q || `${c.customerName} ${c.routeStarAccountNumber} ${c.routeStarCustomerId}`.toLowerCase().includes(q.toLowerCase()));

  const fetchStatus = useCallback(async () => {
    try { const res = await biService.customerAccountSyncStatus(); setJob(res?.data || null); return res?.data || null; }
    catch { return null; }
  }, []);
  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => {
    if (!running) return undefined;
    pollRef.current = setInterval(async () => {
      const j = await fetchStatus();
      if (j && !j.running) { clearInterval(pollRef.current); reload(); }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [running, fetchStatus, reload]);

  const onSync = async () => {
    try { const res = await biService.syncCustomerAccounts(); setJob(res?.data?.job || { running: true, phase: 'fetching' }); }
    catch (e) { setJob({ running: false, phase: 'error', error: e?.message }); }
  };

  const msg = job && (job.phase === 'fetching'
    ? `Syncing account numbers in the background… ${formatNumber(job.stored || 0)}/${formatNumber(job.total || 0)} done. You can leave this page.`
    : job.phase === 'done' ? `Sync complete: ${formatNumber(job.stored || 0)} customers updated (${formatNumber(job.withAccount || 0)} with an account #).`
    : job.phase === 'error' ? `Sync failed: ${job.error || 'error'}` : null);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Keyed on stable RouteStar IDs — never on display name. Click a row for service address + pricing."
        actions={<button className="btn-primary" disabled={running} onClick={onSync}><RefreshCw size={16} className={running ? 'animate-spin' : ''} /> {running ? 'Syncing…' : 'Sync account numbers'}</button>}
      />
      <div className="mb-3">
        <input className="field max-w-sm" placeholder="Search name / account # / RouteStar ID…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {msg && <div className="card p-3 mb-4 text-sm text-dark-600 flex items-center gap-2">{running && <RefreshCw size={14} className="animate-spin" />}{msg}</div>}

      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {() => <DataTable columns={columns} rows={rows} exportFilename="customers" initialSort={{ key: 'customerName', dir: 'asc' }} onRowClick={(r) => setSelected(r.routeStarCustomerId)} />}
      </AsyncSection>

      {selected && <CustomerDetailModal customerId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
