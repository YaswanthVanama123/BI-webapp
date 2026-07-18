import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge, Modal } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard, PieChartCard } from '@/components/charts';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import InvoiceLinesModal from './InvoiceLinesModal';
import CustomerRevenueModal from './CustomerRevenueModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const columns = [
  { key: 'category', header: 'Category' },
  { key: 'expected', header: 'Expected (yr)', align: 'right', render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', render: (r) => formatCurrency(r.remaining) },
  { key: 'pct', header: 'Collected', align: 'right', render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
];
const custColumns = [
  { key: 'customer', header: 'Customer' },
  { key: 'routeCode', header: 'Route' },
  { key: 'expected', header: 'Expected (yr)', align: 'right', render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', render: (r) => formatCurrency(r.remaining) },
];
const invColumns = [
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'customer', header: 'Customer' },
  { key: 'date', header: 'Date' },
  { key: 'amount', header: 'Amount (this category)', align: 'right', render: (r) => formatCurrency(r.amount) },
];

function CategoryModal({ category, range, routeCode, onClose }) {
  const { from, to } = range;
  const { data, loading, error, reload } = useApi(() => biService.revenueCategoryDetail({ name: category, from, to, routeCode }), [category, from, to, routeCode]);
  const [invoice, setInvoice] = useState(null);
  const [customer, setCustomer] = useState(null);
  return (
    <Modal open onClose={onClose} title={`Category: ${category}`}>
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(d) => (
          <div className="space-y-5">
            <div>
              <div className="field-label mb-1">Customers ({d.customers.length}) — click for their items & invoices</div>
              <DataTable columns={custColumns} rows={d.customers} exportFilename={`category-${category}-customers`} paginated={false} onRowClick={(r) => setCustomer(r.customerId)} initialSort={{ key: 'invoiced', dir: 'desc' }} />
            </div>
            <div>
              <div className="field-label mb-1">Invoices with {category} lines ({d.invoices.length}) — click for line items</div>
              <DataTable columns={invColumns} rows={d.invoices} exportFilename={`category-${category}-invoices`} onRowClick={(r) => setInvoice(r.invoiceNumber)} initialSort={{ key: 'amount', dir: 'desc' }} />
            </div>
          </div>
        )}
      </AsyncSection>
      {invoice && <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} />}
      {customer && <CustomerRevenueModal customerId={customer} range={range} onClose={() => setCustomer(null)} />}
    </Modal>
  );
}

export default function RevenueByCategory() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [selected, setSelected] = useState(null);
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(() => biService.revenueByCategory({ from, to, routeCode }), [from, to, routeCode]);
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const pie = useMemo(() => rows.slice(0, 8).map((r) => ({ name: r.category, value: r.invoiced })), [rows]);

  return (
    <div>
      <PageHeader title="Revenue by Category" subtitle="Expected annual vs invoiced vs remaining per service category. Click a category for its customers and invoices." />
      <div className="card p-3 mb-5 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={opts.data?.earliestDate} max={opts.data?.latestDate} />
        <label className="flex flex-col"><span className="field-label">Route</span>
          <select className="field" value={routeCode} onChange={(e) => setRouteCode(e.target.value)}>
            <option value="all">All routes</option>
            {routeCodes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
      </div>

      <AsyncSection loading={loading || opts.loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Categories" value={formatNumber(k.categories)} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PieChartCard title="Invoiced share" subtitle="top 8" data={pie} nameKey="name" valueKey="value" />
              <div className="lg:col-span-2">
                <BarChartCard title="Invoiced vs remaining by category" data={rows.slice(0, 15)} xKey="category"
                  bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981', stackId: 'c' }, { key: 'remaining', label: 'Remaining', color: '#F59E0B', stackId: 'c' }]} />
              </div>
            </div>
            <DataTable columns={columns} rows={rows} exportFilename="revenue-by-category" initialSort={{ key: 'invoiced', dir: 'desc' }} onRowClick={(r) => setSelected(r.category)} />
          </div>
        )}
      </AsyncSection>

      {selected && <CategoryModal category={selected} range={range} routeCode={routeCode} onClose={() => setSelected(null)} />}
    </div>
  );
}
