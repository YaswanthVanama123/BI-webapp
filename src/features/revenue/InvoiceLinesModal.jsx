import React from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { Modal } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatNumber } from '@/utils/format';

const lineColumns = [
  { key: 'name', header: 'Item' },
  { key: 'description', header: 'Description' },
  { key: 'quantity', header: 'Qty', align: 'right', render: (r) => formatNumber(r.quantity) },
  { key: 'rate', header: 'Rate', align: 'right', render: (r) => formatCurrency(r.rate) },
  { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
  { key: 'frequency', header: 'Frequency', render: (r) => r.frequency || '—' },
];

export default function InvoiceLinesModal({ invoiceNumber, onClose }) {
  const { data, loading, error, reload } = useApi(() => biService.invoiceDetail(invoiceNumber), [invoiceNumber]);
  return (
    <Modal open onClose={onClose} title={`Invoice ${invoiceNumber}`} subtitle={data ? `${data.customer || ''} · ${formatCurrency(data.total)}` : ''}>
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(d) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div><div className="field-label">Technician</div><div className="text-dark-800">{d.assignedTo || '—'}</div></div>
              <div><div className="field-label">Completed</div><div className="text-dark-800">{d.dateCompleted ? new Date(d.dateCompleted).toLocaleDateString() : '—'}</div></div>
              <div><div className="field-label">Subtotal</div><div className="text-dark-800">{formatCurrency(d.subtotal)}</div></div>
              <div><div className="field-label">Total</div><div className="text-dark-800">{formatCurrency(d.total)}</div></div>
            </div>
            <div className="field-label">Line items ({d.lineItems ? d.lineItems.length : 0})</div>
            <DataTable columns={lineColumns} rows={d.lineItems || []} exportFilename={`invoice-${invoiceNumber}-lines`} paginated={false} />
          </div>
        )}
      </AsyncSection>
    </Modal>
  );
}
