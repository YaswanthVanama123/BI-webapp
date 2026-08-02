import React, { useState } from 'react';
import clsx from 'clsx';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { Modal, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatNumber } from '@/utils/format';
import InvoiceLinesModal from './InvoiceLinesModal';

const customerColumns = [
  { key: 'customer', header: 'Customer' },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
];
const invoiceColumns = [
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'customer', header: 'Customer' },
  { key: 'date', header: 'Date' },
  { key: 'lineCount', header: 'Lines', align: 'right', render: (r) => formatNumber(r.lineCount) },
  { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
];
const itemColumns = [
  { key: 'item', header: 'Item' },
  { key: 'category', header: 'Category' },
  { key: 'qty', header: 'Qty', align: 'right', render: (r) => formatNumber(r.qty) },
  { key: 'lines', header: 'Line count', align: 'right', render: (r) => formatNumber(r.lines) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
];

function TabBtn({ active, first, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={clsx('px-4 py-2 text-sm', !first && 'border-l border-dark-200', active ? 'bg-primary-600 text-white' : 'bg-white text-dark-600 hover:bg-dark-50')}>
      {children}
    </button>
  );
}

export default function DrillModal({ title, subtitle, filter, range, onClose }) {
  const { from, to } = range || {};
  const showCustomers = !filter.customerId;
  const { data, loading, error, reload } = useApi(
    () => biService.revenueDrill({ ...filter, from, to }),
    [filter.routeCode, filter.customerId, filter.category, from, to],
  );
  const [tab, setTab] = useState(showCustomers ? 'customers' : 'invoices');
  const [drillCustomer, setDrillCustomer] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const k = data && data.kpis;
  const customers = (data && data.customers) || [];
  const invoices = (data && data.invoices) || [];
  const items = (data && data.items) || [];
  const resolvedTitle = title || (customers[0] && customers[0].customer) || 'Details';

  return (
    <Modal open onClose={onClose} title={resolvedTitle} subtitle={subtitle || 'Invoiced work for the selected period'}>
      <AsyncSection loading={loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Stops" value={formatNumber(k.stops)} />
              {showCustomers && <StatCard label="Customers" value={formatNumber(k.customers)} />}
              <StatCard label="Items" value={formatNumber(k.items)} />
            </div>
            <div className="inline-flex rounded-md border border-dark-300 overflow-hidden">
              {showCustomers && <TabBtn first active={tab === 'customers'} onClick={() => setTab('customers')}>Customers ({customers.length})</TabBtn>}
              <TabBtn first={!showCustomers} active={tab === 'invoices'} onClick={() => setTab('invoices')}>Invoices ({invoices.length})</TabBtn>
              <TabBtn active={tab === 'items'} onClick={() => setTab('items')}>Items ({items.length})</TabBtn>
            </div>
            {tab === 'customers' && (
              <DataTable columns={customerColumns} rows={customers} exportFilename="drill-customers" onRowClick={(r) => setDrillCustomer(r)} initialSort={{ key: 'invoiced', dir: 'desc' }} />
            )}
            {tab === 'invoices' && (
              <DataTable columns={invoiceColumns} rows={invoices} exportFilename="drill-invoices" onRowClick={(r) => setInvoice(r.invoiceNumber)} initialSort={{ key: 'date', dir: 'desc' }} />
            )}
            {tab === 'items' && (
              <DataTable columns={itemColumns} rows={items} exportFilename="drill-items" initialSort={{ key: 'invoiced', dir: 'desc' }} />
            )}
          </div>
        )}
      </AsyncSection>
      {drillCustomer && (
        <DrillModal
          title={drillCustomer.customer}
          subtitle={`${formatNumber(drillCustomer.stops)} stop(s) for the selected period`}
          filter={{ ...filter, customerId: drillCustomer.customerId }}
          range={range}
          onClose={() => setDrillCustomer(null)}
        />
      )}
      {invoice && <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} />}
    </Modal>
  );
}
