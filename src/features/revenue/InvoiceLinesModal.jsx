import React from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { Modal, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatDateShort, statusTone } from '@/utils/format';

const lineColumns = [
  { key: 'name', header: 'Item' },
  { key: 'description', header: 'Description' },
  { key: 'quantity', header: 'Qty', align: 'right', render: (r) => formatNumber(r.quantity) },
  { key: 'rate', header: 'Rate', align: 'right', render: (r) => formatCurrency(r.rate) },
  { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
  { key: 'frequency', header: 'Frequency', render: (r) => r.frequency || '—' },
];

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-dark-400">{label}</div>
      <div className="text-sm text-dark-800">{children ?? '-'}</div>
    </div>
  );
}

export default function InvoiceLinesModal({ invoiceNumber, onClose }) {
  const { data, loading, error, reload } = useApi(() => biService.invoiceDetail(invoiceNumber), [invoiceNumber]);
  return (
    <Modal open onClose={onClose} title={`Invoice ${invoiceNumber}`} subtitle={data ? `${data.customer || ''} · ${formatCurrency(data.total)}` : 'Read directly from RouteStar (inventory_db)'}>
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(d) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Customer">{d.customer}</Field>
              <Field label="Technician">{d.assignedTo}</Field>
              <Field label="Status">{d.status ? <Badge tone={statusTone(d.status)}>{d.status}</Badge> : '-'}</Field>
              <Field label="Type">{d.invoiceType}</Field>
              <Field label="Invoice date">{formatDateShort(d.invoiceDate)}</Field>
              <Field label="Completed">{formatDateShort(d.dateCompleted)}</Field>
              <Field label="Arrival → Departure">{[d.arrivalTime, d.departureTime].filter(Boolean).join(' → ') || '-'}</Field>
              <Field label="Elapsed">{d.elapsedTime}</Field>
              <Field label="Subtotal">{formatCurrency(d.subtotal)}</Field>
              <Field label="Tax">{formatCurrency(d.tax)}</Field>
              <Field label="Total">{formatCurrency(d.total)}</Field>
              <Field label="Customer grouping">{d.customerGrouping}</Field>
            </div>
            {(d.serviceNotes || d.memo || d.signedBy) && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Service notes">{d.serviceNotes}</Field>
                <Field label="Memo">{d.memo}</Field>
                <Field label="Signed by">{d.signedBy}</Field>
              </div>
            )}
            <div>
              <div className="text-sm font-semibold text-dark-800 mb-2">Items ({d.lineItems ? d.lineItems.length : 0})</div>
              <DataTable columns={lineColumns} rows={d.lineItems || []} exportFilename={`invoice-${invoiceNumber}-lines`} paginated={false} />
            </div>
          </div>
        )}
      </AsyncSection>
    </Modal>
  );
}
