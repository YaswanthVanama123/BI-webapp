import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { Modal, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import InvoiceLinesModal from './InvoiceLinesModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const itemColumns = [
  { key: 'item', header: 'Item' },
  { key: 'category', header: 'Category' },
  { key: 'frequency', header: 'Frequency', render: (r) => r.frequency || '—' },
  { key: 'expected', header: 'Expected (yr)', align: 'right', render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', render: (r) => formatCurrency(r.remaining) },
];
const invoiceColumns = [
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'date', header: 'Date' },
  { key: 'route', header: 'Route' },
  { key: 'lineCount', header: 'Lines', align: 'right', render: (r) => formatNumber(r.lineCount) },
  { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
];

export default function CustomerRevenueModal({ customerId, range, onClose }) {
  const { from, to } = range || {};
  const { data, loading, error, reload } = useApi(() => biService.revenueCustomerDetail(customerId, { from, to }), [customerId, from, to]);
  const [invoice, setInvoice] = useState(null);
  return (
    <Modal open onClose={onClose} title={data?.customer || 'Customer'} subtitle={data ? `Route ${data.routeCode}` : ''}>
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(d) => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Expected (yr)" value={formatCurrency(d.expected)} />
              <StatCard label="Invoiced" value={formatCurrency(d.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(d.remaining)} tone={d.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Collected" value={d.pct != null ? formatPercent(d.pct) : '—'} tone={pctTone(d.pct)} />
            </div>
            <div>
              <div className="field-label mb-1">Per item — expected vs invoiced vs remaining ({d.items.length})</div>
              <DataTable columns={itemColumns} rows={d.items} exportFilename={`revenue-${d.customerId}-items`} paginated={false} initialSort={{ key: 'expected', dir: 'desc' }} />
            </div>
            <div>
              <div className="field-label mb-1">Invoices ({d.invoices.length}) — click a row for line items</div>
              <DataTable columns={invoiceColumns} rows={d.invoices} exportFilename={`revenue-${d.customerId}-invoices`} onRowClick={(r) => setInvoice(r.invoiceNumber)} />
            </div>
          </div>
        )}
      </AsyncSection>
      {invoice && <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} />}
    </Modal>
  );
}
