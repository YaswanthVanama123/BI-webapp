import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard } from '@/components/charts';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';

const columns = [
  { key: 'routeCode', header: 'Route' },
  { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.revenue) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'revenuePerStop', header: 'Rev / stop', align: 'right', render: (r) => formatCurrency(r.revenuePerStop) },
  { key: 'pct', header: '% of revenue', align: 'right', render: (r) => formatPercent(r.pct) },
];

export default function RevenueByRoute() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.revenueByRoute({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];

  return (
    <div>
      <PageHeader title="Revenue by Route" subtitle="Closed-invoice revenue grouped by the customer's operational route." />
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
              <StatCard label="Revenue" value={formatCurrency(k.revenue)} tone="success" />
              <StatCard label="Routes" value={formatNumber(k.routes)} />
              <StatCard label="Stops" value={formatNumber(k.stops)} />
              <StatCard label="Revenue / stop" value={formatCurrency(k.revenuePerStop)} tone="info" />
            </div>
            <BarChartCard title="Revenue by route" data={rows} xKey="routeCode" bars={[{ key: 'revenue', label: 'Revenue', color: '#2563EB' }]} />
            <BarChartCard title="Revenue per stop by route" data={rows} xKey="routeCode" bars={[{ key: 'revenuePerStop', label: 'Rev / stop', color: '#10B981' }]} />
            <DataTable columns={columns} rows={rows} exportFilename="revenue-by-route" initialSort={{ key: 'revenue', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
