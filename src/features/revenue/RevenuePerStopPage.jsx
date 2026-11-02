import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange, rangeLabel } from '@/utils/dateRanges';
import { BarChartCard } from '@/components/charts';
import { formatCurrency, formatNumber } from '@/utils/format';
import RouteRevenueModal from './RouteRevenueModal';
import CustomerRevenueModal from './CustomerRevenueModal';

const routeColumns = [
  { key: 'routeCode', header: 'Route' },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'revenuePerStop', header: 'Rev / stop', align: 'right', render: (r) => formatCurrency(r.revenuePerStop) },
];
const customerColumns = [
  { key: 'customer', header: 'Customer' },
  { key: 'routeCode', header: 'Route' },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'revenuePerStop', header: 'Rev / stop', align: 'right', render: (r) => formatCurrency(r.revenuePerStop) },
];

export default function RevenuePerStop() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;
  const { data, loading, error, reload } = useApi(() => biService.revenuePerStop({ from, to, routeCode }), [from, to, routeCode]);
  const [route, setRoute] = useState(null);
  const [customer, setCustomer] = useState(null);
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const byRoute = (data && data.byRoute) || [];
  const byCustomer = (data && data.byCustomer) || [];

  return (
    <div>
      <PageHeader title="Revenue per Stop" subtitle="Invoiced revenue (before tax) ÷ stops, overall and by route. A stop is one closed invoice, including $0 invoices — not a count of physical visits." />
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
              <StatCard label="Revenue / stop" value={formatCurrency(k.revenuePerStop)} sublabel="per closed invoice" tone="success" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} sublabel={`${rangeLabel(range)} · before tax`} />
              <StatCard label="Stops" value={formatNumber(k.stops)} sublabel="closed invoices, incl. $0" />
              <StatCard label="Routes" value={formatNumber(k.routes)} />
            </div>
            <BarChartCard title="Revenue per stop by route" data={byRoute} xKey="routeCode" bars={[{ key: 'revenuePerStop', label: 'Rev / stop', color: '#2563EB' }]} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">By route</h3>
                <DataTable columns={routeColumns} rows={byRoute} exportFilename="revenue-per-stop-by-route" paginated={false} onRowClick={(r) => setRoute(r.routeCode)} initialSort={{ key: 'revenuePerStop', dir: 'desc' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">Top customers</h3>
                <DataTable columns={customerColumns} rows={byCustomer} exportFilename="revenue-per-stop-by-customer" onRowClick={(r) => setCustomer(r.customerId)} initialSort={{ key: 'invoiced', dir: 'desc' }} />
              </div>
            </div>
          </div>
        )}
      </AsyncSection>
      {route && <RouteRevenueModal routeCode={route} range={range} onClose={() => setRoute(null)} />}
      {customer && <CustomerRevenueModal customerId={customer} range={range} onClose={() => setCustomer(null)} />}
    </div>
  );
}
