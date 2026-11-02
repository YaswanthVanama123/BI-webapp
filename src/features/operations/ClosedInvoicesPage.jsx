import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge, Modal, Spinner } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import RouteTabs from '@/components/filters/RouteTabs';
import { formatCurrency, formatDateShort, formatNumber, statusTone } from '@/utils/format';
import LineStatusNotice from '@/features/revenue/LineStatusNotice';

const columns = [
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'dateCompleted', header: 'Completed', render: (r) => formatDateShort(r.dateCompleted), sortValue: (r) => r.dateCompleted || '' },
  { key: 'customer', header: 'Customer' },
  { key: 'assignedTo', header: 'Technician' },
  { key: 'invoiceType', header: 'Type' },
  { key: 'status', header: 'Status', render: (r) => (r.status ? <Badge tone={statusTone(r.status)}>{r.status}</Badge> : '-') },
  { key: 'arrivalTime', header: 'Arrival' },
  { key: 'departureTime', header: 'Departure' },
  { key: 'elapsedTime', header: 'Elapsed' },
  { key: 'lineItemCount', header: 'Items', align: 'right' },
  { key: 'subtotal', header: 'Subtotal', align: 'right', render: (r) => formatCurrency(r.subtotal) },
  { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
];

const lineColumns = [
  { key: 'name', header: 'Item' },
  { key: 'description', header: 'Description' },
  { key: 'quantity', header: 'Qty', align: 'right', render: (r) => formatNumber(r.quantity) },
  { key: 'rate', header: 'Rate', align: 'right', render: (r) => formatCurrency(r.rate) },
  { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
  { key: 'frequency', header: 'Frequency', render: (r) => r.frequency || '—' },
  { key: 'class', header: 'Class' },
  { key: 'warehouse', header: 'Warehouse' },
  { key: 'taxCode', header: 'Tax' },
  { key: 'location', header: 'Location' },
];

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-dark-400">{label}</div>
      <div className="text-sm text-dark-800">{children ?? '-'}</div>
    </div>
  );
}

function InvoiceDetailModal({ invoiceNumber, onClose }) {
  const { data, loading, error } = useApi(() => biService.invoiceDetail(invoiceNumber), [invoiceNumber]);
  return (
    <Modal open onClose={onClose} title={`Invoice ${invoiceNumber}`} subtitle="Read directly from RouteStar (inventory_db)">
      {loading && <Spinner />}
      {error && <p className="text-sm text-danger-600">{error}</p>}
      {data && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Customer">{data.customer}</Field>
            <Field label="Technician">{data.assignedTo}</Field>
            <Field label="Status"><Badge tone={statusTone(data.status)}>{data.status}</Badge></Field>
            <Field label="Type">{data.invoiceType}</Field>
            <Field label="Invoice date">{formatDateShort(data.invoiceDate)}</Field>
            <Field label="Completed">{formatDateShort(data.dateCompleted)}</Field>
            <Field label="Arrival → Departure">{[data.arrivalTime, data.departureTime].filter(Boolean).join(' → ') || '-'}</Field>
            <Field label="Elapsed">{data.elapsedTime}</Field>
            <Field label="Subtotal">{formatCurrency(data.subtotal)}</Field>
            <Field label="Tax">{formatCurrency(data.tax)}</Field>
            <Field label="Total">{formatCurrency(data.total)}</Field>
            <Field label="Customer grouping">{data.customerGrouping}</Field>
          </div>
          {(data.serviceNotes || data.memo || data.signedBy) && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Service notes">{data.serviceNotes}</Field>
              <Field label="Memo">{data.memo}</Field>
              <Field label="Signed by">{data.signedBy}</Field>
            </div>
          )}
          <LineStatusNotice invoice={data} />
          <div>
            <div className="text-sm font-semibold text-dark-800 mb-2">Items ({data.lineItems.length})</div>
            <DataTable columns={lineColumns} rows={data.lineItems} exportFilename={`invoice-${invoiceNumber}-lines`} paginated={false} />
          </div>
        </div>
      )}
    </Modal>
  );
}

function LineRefreshBar({ onDone }) {
  const [status, setStatus] = useState(null);
  const [note, setNote] = useState(null);
  const pollRef = useRef(null);
  const job = status && status.job;
  const health = status && status.health;
  const running = !!(job && job.running);

  const fetchStatus = useCallback(async () => {
    try { const res = await biService.invoiceRefreshStatus(); setStatus(res?.data || null); return res?.data || null; }
    catch (e) { void e; return null; }
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    if (!running) return undefined;
    pollRef.current = setInterval(async () => {
      const s = await fetchStatus();
      if (s && s.job && !s.job.running) { clearInterval(pollRef.current); onDone(); }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [running, fetchStatus, onDone]);

  const start = async () => {
    setNote(null);
    try {
      const res = await biService.refreshInvoiceLines();
      const d = res?.data || {};
      if (d.busy) setNote(`RouteStar is busy with another sync (${d.busy}) — try again when it finishes.`);
      if (d.job) setStatus((s) => ({ ...(s || {}), job: d.job }));
    } catch (e) { setNote(e?.message || 'Could not start the refresh.'); }
  };

  let text = 'Checking invoice line items…';
  if (running) text = `Re-reading line items from RouteStar: ${formatNumber((job.refreshed || 0) + (job.failed || 0))} of ${formatNumber(job.total || 0)} done (${formatNumber(job.fixed || 0)} now match their subtotal).`;
  else if (health && health.mismatched) text = `${formatNumber(health.mismatched)} invoices have line items that don't add up to their subtotal (${formatCurrency(health.mismatchAmount)} in total). Revenue totals use the subtotal; refresh to re-read those lines from RouteStar.`;
  else if (health) text = `All invoice line items add up to their subtotal${health.refreshed ? ` (${formatNumber(health.refreshed)} re-read from RouteStar)` : ''}.`;
  const last = job && !running && job.phase === 'done' ? ` Last refresh: ${formatNumber(job.refreshed || 0)} re-read, ${formatNumber(job.failed || 0)} failed.` : '';
  const failed = job && job.phase === 'error' ? ` Last refresh failed: ${job.error}.` : '';

  return (
    <div className="card p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-dark-600 min-w-0 flex-1">{text}{last}{failed}{note ? ` ${note}` : ''}</div>
      <button type="button" className="btn-secondary" disabled={running || !health || !health.pending} onClick={start} title={health && !health.pending ? 'Nothing to refresh' : 'Re-read stale invoices from RouteStar'}>
        <RefreshCw size={16} className={running ? 'animate-spin' : ''} /> {running ? 'Refreshing…' : 'Refresh stale invoice lines'}
      </button>
    </div>
  );
}

export default function ClosedInvoices() {
  const PAGE_SIZE = 25;
  const [q, setQ] = useState('');
  const [route, setRoute] = useState('all');
  const [range, setRange] = useState({ preset: 'all_time', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const { from, to } = range;

  useEffect(() => { setPage(1); }, [q, from, to, route]);

  const opts = useApi(() => biService.checkinOptions(), []);
  const routes = (opts.data && opts.data.routes) || [];
  const params = { from: from || undefined, to: to || undefined, routeCode: route !== 'all' ? route : undefined, q: q || undefined };
  const { data, meta, page: pageInfo, loading, error, reload } = useApi(
    () => biService.closedInvoices({ ...params, page, pageSize: PAGE_SIZE }),
    [from, to, route, q, page],
  );
  const rows = data || [];
  const total = (pageInfo && pageInfo.total) || (meta && meta.total) || 0;

  const subtitle = `Read directly from RouteStar (inventory_db). ${formatNumber(total)} closed invoices — loaded one page at a time. Export downloads them all. Click a row for line items.`;

  const exportAll = async () => {
    const res = await biService.closedInvoices({ ...params, pageSize: 'all' });
    return (res && res.data) || [];
  };

  return (
    <div>
      <PageHeader title="Closed Invoices" subtitle={subtitle} />
      <div className="card p-3 mb-4 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>
      <LineRefreshBar onDone={reload} />
      <RouteTabs routes={routes} value={route} onChange={setRoute} allLabel="All" className="mb-4" />
      <AsyncSection loading={loading} error={error} data={data} reload={reload}>
        {() => (
          <DataTable
            columns={columns}
            rows={rows}
            exportFilename="closed-invoices"
            searchable
            onServerSearch={setQ}
            searchPlaceholder="Search invoice # / customer / technician / status…"
            initialSort={{ key: 'dateCompleted', dir: 'desc' }}
            onRowClick={(r) => setSelected(r.invoiceNumber)}
            serverSide
            serverTotal={total}
            page={page}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            onExportAll={exportAll}
          />
        )}
      </AsyncSection>
      {selected && <InvoiceDetailModal invoiceNumber={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
