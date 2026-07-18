import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge, Modal, Spinner } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatDateShort, formatNumber, statusTone } from '@/utils/format';

const columns = [
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'invoiceDate', header: 'Date', render: (r) => formatDateShort(r.invoiceDate), sortValue: (r) => r.invoiceDate || '' },
  { key: 'customer', header: 'Customer' },
  { key: 'assignedTo', header: 'Technician' },
  { key: 'invoiceType', header: 'Type' },
  { key: 'status', header: 'Status', render: (r) => (r.status ? <Badge tone={statusTone(r.status)}>{r.status}</Badge> : '-') },
  { key: 'arrivalTime', header: 'Arrival' },
  { key: 'departureTime', header: 'Departure' },
  { key: 'elapsedTime', header: 'Elapsed' },
  { key: 'lineItemCount', header: 'Lines', align: 'right' },
  { key: 'subtotal', header: 'Subtotal', align: 'right', render: (r) => formatCurrency(r.subtotal) },
  { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
  { key: 'dateCompleted', header: 'Completed', render: (r) => formatDateShort(r.dateCompleted), sortValue: (r) => r.dateCompleted || '' },
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
          <div>
            <div className="text-sm font-semibold text-dark-800 mb-2">Line items ({data.lineItems.length})</div>
            <DataTable columns={lineColumns} rows={data.lineItems} exportFilename={`invoice-${invoiceNumber}-lines`} paginated={false} />
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function ClosedInvoices() {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const { data, meta, loading, error, reload } = useApi(() => biService.closedInvoices({}), []);
  const term = q.trim().toLowerCase();
  const rows = (data || []).filter((r) => !term
    || `${r.invoiceNumber} ${r.customer} ${r.assignedTo || ''} ${r.status || ''}`.toLowerCase().includes(term));

  const subtitle = meta
    ? `Read directly from RouteStar (inventory_db). Showing ${formatNumber(meta.returned)} of ${formatNumber(meta.total)}${meta.truncated ? ' (most recent)' : ''}. Click a row for line items.`
    : 'Closed invoices with stop times, read directly from RouteStar. Click a row for line items.';

  return (
    <div>
      <PageHeader title="Closed Invoices" subtitle={subtitle} />
      <div className="mb-4">
        <input className="field max-w-sm" placeholder="Search invoice # / customer / technician / status…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {() => <DataTable columns={columns} rows={rows} exportFilename="closed-invoices" initialSort={{ key: 'invoiceDate', dir: 'desc' }} onRowClick={(r) => setSelected(r.invoiceNumber)} />}
      </AsyncSection>
      {selected && <InvoiceDetailModal invoiceNumber={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
