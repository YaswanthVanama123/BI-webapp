import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import useDebounce from '@/hooks/useDebounce';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard, PieChartCard, LineChartCard } from '@/components/charts';
import { formatCurrency, formatNumber } from '@/utils/format';
import CustomerRevenueModal from '@/features/revenue/CustomerRevenueModal';

const columns = [
  { key: 'customer', header: 'Customer' },
  { key: 'routeCode', header: 'Route' },
  { key: 'invoices', header: 'Invoices created', align: 'right', render: (r) => formatNumber(r.invoices) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'avgInvoice', header: 'Avg / invoice', align: 'right', render: (r) => formatCurrency(r.avgInvoice) },
  { key: 'firstDate', header: 'First invoice' },
  { key: 'lastDate', header: 'Last invoice' },
];
const newCustomerColumns = [
  { key: 'customer', header: 'Customer' },
  { key: 'routeCode', header: 'Route' },
  { key: 'accountNumber', header: 'Account #', render: (r) => r.accountNumber || '—' },
  { key: 'createdDate', header: 'Created' },
];

export default function CustomerOverview() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const { from, to } = range;
  const dq = useDebounce(q, 400);

  const { data, loading, error, reload } = useApi(
    () => biService.customersOverview({ from, to, routeCode: routeCode === 'all' ? undefined : routeCode, q: dq || undefined }),
    [from, to, routeCode, dq],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const topByInvoices = (data && data.topByInvoices) || [];
  const topByRevenue = (data && data.topByRevenue) || [];
  const byRoute = (data && data.byRoute) || [];
  const months = (data && data.months) || [];
  const newByMonth = (data && data.newByMonth) || [];
  const newCustomers = (data && data.newCustomerRows) || [];
  const filtered = rows;

  return (
    <div>
      <PageHeader title="Customer Overview" subtitle="New customers created and how many invoices each customer created in the selected period, with revenue, routes and trend." />
      <div className="card p-3 mb-5 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={opts.data?.earliestDate} max={opts.data?.latestDate} />
        <label className="flex flex-col"><span className="field-label">Route</span>
          <select className="field" value={routeCode} onChange={(e) => setRouteCode(e.target.value)}>
            <option value="all">All routes</option>
            {routeCodes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex flex-col"><span className="field-label">Search customer</span>
          <input className="field" placeholder="name / route…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <AsyncSection loading={loading || opts.loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              <StatCard label="New customers" value={formatNumber(k.newCustomers)} tone="info" />
              <StatCard label="Active customers" value={formatNumber(k.customers)} />
              <StatCard label="Invoices created" value={formatNumber(k.invoices)} tone="success" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Avg invoices / customer" value={formatNumber(k.avgInvoicesPerCustomer)} />
              <StatCard label="Avg revenue / customer" value={formatCurrency(k.avgRevenuePerCustomer)} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <LineChartCard title="Invoices created per month" data={months} xKey="month"
                lines={[{ key: 'invoices', label: 'Invoices', color: '#4F46E5' }]} />
              <LineChartCard title="New customers created per month" data={newByMonth} xKey="month"
                lines={[{ key: 'newCustomers', label: 'New customers', color: '#10B981' }]} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <BarChartCard title="Top customers by invoices created" data={topByInvoices} xKey="customer"
                bars={[{ key: 'invoices', label: 'Invoices', color: '#4F46E5' }]} />
              <BarChartCard title="Top customers by invoiced revenue" data={topByRevenue} xKey="customer"
                bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }]} />
              <PieChartCard title="Customers by route" data={byRoute} nameKey="routeCode" valueKey="customers" />
            </div>

            <div>
              <div className="field-label mb-1">New customers created ({newCustomers.length})</div>
              {newCustomers.length
                ? <DataTable columns={newCustomerColumns} rows={newCustomers} exportFilename="new-customers" searchable={false} initialSort={{ key: 'createdDate', dir: 'desc' }} onRowClick={(r) => setSelected(r)} />
                : <div className="card p-3 text-sm text-dark-400">No new customers created in this period.</div>}
            </div>
            <div>
              <div className="field-label mb-1">All active customers ({filtered.length})</div>
              <DataTable columns={columns} rows={filtered} exportFilename="customer-overview" searchable={false} initialSort={{ key: 'invoices', dir: 'desc' }} onRowClick={(r) => setSelected(r)} />
            </div>
          </div>
        )}
      </AsyncSection>

      {selected && <CustomerRevenueModal customerId={selected.customerId} customerName={selected.customer} routes={selected.routeCode ? [selected.routeCode] : undefined} range={range} onClose={() => setSelected(null)} />}
    </div>
  );
}
