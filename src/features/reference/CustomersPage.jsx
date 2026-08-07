import React, { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { RefreshCw, MapPin, Calendar, Trash2, Eye } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge, Modal, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { statusTone, formatNumber, formatCurrency } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/InvoiceLinesModal';
import FetchRowsModal from '@/features/reference/FetchRowsModal';

const columns = [
  { key: 'customerName', header: 'Customer' },
  { key: 'routeStarCustomerId', header: 'RouteStar ID' },
  { key: 'routeStarAccountNumber', header: 'Account #', render: (r) => r.routeStarAccountNumber || <span className="text-dark-300">—</span> },
  { key: 'routeCode', header: 'Route' },
  { key: 'frequency', header: 'Frequency' },
  { key: 'customerStatus', header: 'Status', render: (r) => <Badge tone={statusTone(r.customerStatus)}>{r.customerStatus}</Badge> },
  { key: 'createdDate', header: 'Created', render: (r) => r.createdDate || '—' },
];

const pricingColumns = [
  { key: 'item', header: 'Item' },
  { key: 'description', header: 'Description' },
  { key: 'salesPrice', header: 'Price', align: 'right', render: (r) => (r.salesPrice != null ? `$${formatNumber(r.salesPrice)}` : '—') },
  { key: 'defaultQty', header: 'Qty', align: 'right', render: (r) => r.defaultQty || '—' },
  { key: 'frequency', header: 'Frequency', render: (r) => r.frequency || '—' },
];
const invoiceColumns = [
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'date', header: 'Completed' },
  { key: 'checkIn', header: 'Check-in', render: (r) => r.checkIn || '-' },
  { key: 'checkOut', header: 'Check-out', render: (r) => r.checkOut || '-' },
  { key: 'lineCount', header: 'Items', align: 'right', render: (r) => formatNumber(r.lineCount) },
  { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
];
const itemColumns = [
  { key: 'item', header: 'Item' },
  { key: 'category', header: 'Category' },
  { key: 'qty', header: 'Qty', align: 'right', render: (r) => formatNumber(r.qty) },
  { key: 'lines', header: 'Line count', align: 'right', render: (r) => formatNumber(r.lines) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
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

function TabBtn({ active, first, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={clsx('px-4 py-2 text-sm', !first && 'border-l border-dark-200', active ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 hover:bg-dark-50')}>
      {children}
    </button>
  );
}

function CustomerDetailModal({ customerId, onClose }) {
  const { data, loading, error, reload } = useApi(() => biService.customerAccount(customerId), [customerId]);
  const drill = useApi(() => biService.revenueDrill({ customerId }), [customerId]);
  const [tab, setTab] = useState('invoices');
  const [invoice, setInvoice] = useState(null);
  const invoices = (drill.data && drill.data.invoices) || [];
  const items = (drill.data && drill.data.items) || [];
  const dk = drill.data && drill.data.kpis;

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

            {dk && (
              <div className="grid grid-cols-3 gap-3">
                <StatCard label="Invoiced (all time)" value={formatCurrency(dk.invoiced)} tone="success" />
                <StatCard label="Invoices" value={formatNumber(dk.stops)} />
                <StatCard label="Items" value={formatNumber(dk.items)} />
              </div>
            )}

            <div className="inline-flex rounded-md border border-dark-300 overflow-hidden">
              <TabBtn first active={tab === 'invoices'} onClick={() => setTab('invoices')}>Invoices ({invoices.length})</TabBtn>
              <TabBtn active={tab === 'items'} onClick={() => setTab('items')}>Items ({items.length})</TabBtn>
              <TabBtn active={tab === 'routes'} onClick={() => setTab('routes')}>Routes ({d.routes?.length || 0})</TabBtn>
              <TabBtn active={tab === 'pricing'} onClick={() => setTab('pricing')}>Pricing ({d.pricing?.length || 0})</TabBtn>
            </div>

            {tab === 'invoices' && (
              drill.loading ? <div className="text-sm text-dark-400">Loading invoices…</div>
                : invoices.length ? <DataTable columns={invoiceColumns} rows={invoices} exportFilename={`invoices-${d.customerId}`} onRowClick={(r) => setInvoice(r.invoiceNumber)} initialSort={{ key: 'date', dir: 'desc' }} />
                : <div className="text-sm text-dark-400">No invoices created for this customer.</div>
            )}
            {tab === 'items' && (
              drill.loading ? <div className="text-sm text-dark-400">Loading items…</div>
                : items.length ? <DataTable columns={itemColumns} rows={items} exportFilename={`items-${d.customerId}`} initialSort={{ key: 'invoiced', dir: 'desc' }} />
                : <div className="text-sm text-dark-400">No invoiced items for this customer.</div>
            )}
            {tab === 'routes' && (
              d.routes && d.routes.length
                ? <DataTable columns={routeColumns(d.routes)} rows={d.routes} exportFilename={`routes-${d.customerId}`} paginated={false} />
                : <div className="text-sm text-dark-400">No routes for this customer.</div>
            )}
            {tab === 'pricing' && (
              d.pricing && d.pricing.length
                ? <DataTable columns={pricingColumns} rows={d.pricing} exportFilename={`pricing-${d.customerId}`} paginated={false} />
                : <div className="text-sm text-dark-400">No pricing captured yet — run Sync to fetch it.</div>
            )}

            <div className="text-xs text-dark-400">Source: {d.source}{d.fetchedAt ? ` · fetched ${new Date(d.fetchedAt).toLocaleString()}` : ''}</div>
          </div>
        )}
      </AsyncSection>
      {invoice && <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} />}
    </Modal>
  );
}

export default function Customers() {
  const [q, setQ] = useState('');
  const [range, setRange] = useState({ preset: 'all_time', from: '', to: '' });
  const [selected, setSelected] = useState(null);
  const [job, setJob] = useState(null);
  const [cdJob, setCdJob] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState(null);
  const [rowsOpen, setRowsOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const pollRef = useRef(null);
  const cdPollRef = useRef(null);
  const running = !!job?.running;
  const cdRunning = !!cdJob?.running;
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(() => biService.customers({ from: from || undefined, to: to || undefined }), [from, to]);
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
    try { const res = await biService.syncCustomerAccounts(); setJob(res?.data?.job || { running: true, phase: 'discovering' }); }
    catch (e) { setJob({ running: false, phase: 'error', error: e?.message }); }
  };

  const doReFetchAll = async () => {
    try { const res = await biService.syncCustomerAccounts({ all: true }); setJob(res?.data?.job || { running: true, phase: 'discovering' }); }
    catch (e) { setJob({ running: false, phase: 'error', error: e?.message }); }
  };
  const onReFetchAll = () => {
    if (running || cdRunning) return;
    setConfirm({
      title: 'Re-fetch all customers?',
      message: 'Re-fetches every customer from RouteStar (account #, pricing, routes, activity) to backfill customers whose data was captured before a fix. It runs in the background, can take a while, and never removes existing data.',
      confirmLabel: 'Re-fetch all',
      onConfirm: doReFetchAll,
    });
  };

  const doDeleteAll = async () => {
    setDeleting(true); setDeleteMsg(null);
    try {
      const res = await biService.deleteAllCustomerAccounts();
      setDeleteMsg(`Deleted ${formatNumber(res?.data?.deleted || 0)} fetched customer records.`);
      reload();
    } catch (e) {
      setDeleteMsg(`Delete failed: ${e?.response?.data?.error?.message || e?.message || 'error'}`);
    } finally { setDeleting(false); }
  };
  const onDeleteAll = () => {
    if (running || cdRunning) return;
    setConfirm({
      title: 'Delete all fetched data?',
      message: 'This deletes ALL fetched customer data (account #, service address, pricing, routes and activity) from the BI database. It cannot be undone. RouteStar itself is not touched — you can re-fetch afterward.',
      confirmLabel: 'Delete all',
      danger: true,
      onConfirm: doDeleteAll,
    });
  };

  const fetchCdStatus = useCallback(async () => {
    try { const res = await biService.customerCreatedDatesSyncStatus(); setCdJob(res?.data || null); return res?.data || null; }
    catch { return null; }
  }, []);
  useEffect(() => { fetchCdStatus(); }, [fetchCdStatus]);
  useEffect(() => {
    if (!cdRunning) return undefined;
    cdPollRef.current = setInterval(async () => {
      const j = await fetchCdStatus();
      if (j && !j.running) { clearInterval(cdPollRef.current); reload(); }
    }, 4000);
    return () => clearInterval(cdPollRef.current);
  }, [cdRunning, fetchCdStatus, reload]);

  const onFetchCreated = async () => {
    try { const res = await biService.syncCustomerCreatedDates(); setCdJob(res?.data?.job || { running: true, phase: 'fetching' }); }
    catch (e) { setCdJob({ running: false, phase: 'error', error: e?.message }); }
  };

  const msg = job && (job.phase === 'discovering'
    ? `Step 1 — checking all customers (create new / update existing)… ${formatNumber(job.scanned || 0)} scanned, ${formatNumber(job.discovered || 0)} new.`
    : job.phase === 'fetching'
    ? `Step 2 — fetching details for customers without data… ${formatNumber(job.stored || 0)}/${formatNumber(job.total || 0)} done${job.discovered ? ` (${formatNumber(job.discovered)} new customers found)` : ''}. You can leave this page.`
    : job.phase === 'done' ? `Fetch complete: ${formatNumber(job.stored || 0)} customers fetched${job.discovered ? `, ${formatNumber(job.discovered)} newly discovered` : ''} (${formatNumber(job.withAccount || 0)} with an account #).`
    : job.phase === 'error' ? `Fetch failed: ${job.error || 'error'}` : null);

  const cdMsg = cdJob && (cdJob.phase === 'fetching'
    ? `Fetching created dates in the background… ${formatNumber(cdJob.stored || 0)} stored / ${formatNumber(cdJob.scanned || 0)} scanned. You can leave this page.`
    : cdJob.phase === 'done' ? `Created dates fetched: ${formatNumber(cdJob.stored || 0)} customers updated.`
    : cdJob.phase === 'error' ? `Created-date fetch failed: ${cdJob.error || 'error'}` : null);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Keyed on stable RouteStar IDs — never on display name. Click a row for address, invoices, items, routes & pricing."
        actions={<div className="flex gap-2">
          <button className="btn-secondary" disabled={cdRunning} onClick={onFetchCreated}><Calendar size={16} className={cdRunning ? 'animate-spin' : ''} /> {cdRunning ? 'Fetching…' : 'Fetch created dates'}</button>
          <button className="btn-primary" disabled={running} onClick={onSync}><RefreshCw size={16} className={running ? 'animate-spin' : ''} /> {running ? 'Fetching…' : 'Fetch customer data'}</button>
          <button className="btn-secondary" disabled={running || cdRunning} onClick={onReFetchAll}><RefreshCw size={16} /> Re-fetch all</button>
          <button className="btn-secondary" onClick={() => setRowsOpen(true)}><Eye size={16} /> Fetched rows</button>
          <button className="btn-danger" disabled={deleting || running || cdRunning} onClick={onDeleteAll}><Trash2 size={16} /> {deleting ? 'Deleting…' : 'Delete all'}</button>
        </div>}
      />
      <div className="card p-3 mb-3 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
        <input className="field grow max-w-sm" placeholder="Search name / account # / RouteStar ID…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {msg && <div className="card p-3 mb-4 text-sm text-dark-600 flex items-center gap-2">{running && <RefreshCw size={14} className="animate-spin" />}{msg}</div>}
      {cdMsg && <div className="card p-3 mb-4 text-sm text-dark-600 flex items-center gap-2">{cdRunning && <RefreshCw size={14} className="animate-spin" />}{cdMsg}</div>}
      {deleteMsg && <div className="card p-3 mb-4 text-sm text-dark-600 flex items-center gap-2">{deleteMsg}</div>}

      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {() => <DataTable columns={columns} rows={rows} exportFilename="customers" searchable={false} initialSort={{ key: 'customerName', dir: 'asc' }} onRowClick={(r) => setSelected(r.routeStarCustomerId)} />}
      </AsyncSection>

      {selected && <CustomerDetailModal customerId={selected} onClose={() => setSelected(null)} />}
      {rowsOpen && <FetchRowsModal runId={job?.runId} onClose={() => setRowsOpen(false)} />}
      {confirm && (
        <Modal open onClose={() => setConfirm(null)} title={confirm.title}>
          <div className="space-y-4 max-w-md">
            <p className="text-sm text-dark-600 whitespace-pre-line">{confirm.message}</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setConfirm(null)}>Cancel</button>
              <button
                className={confirm.danger ? 'btn-danger' : 'btn-primary'}
                onClick={() => { const fn = confirm.onConfirm; setConfirm(null); if (fn) fn(); }}
              >
                {confirm.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
