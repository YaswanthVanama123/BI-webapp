import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { LineChartCard, BarChartCard } from '@/components/charts';
import { formatCurrency, formatNumber } from '@/utils/format';

const GRANULARITIES = ['day', 'week', 'month'];

const seriesColumns = [
  { key: 'bucket', header: 'Period' },
  { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.revenue) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'revenuePerStop', header: 'Rev / stop', align: 'right', render: (r) => formatCurrency(r.revenuePerStop) },
];
const routeColumns = [
  { key: 'routeCode', header: 'Route' },
  { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.revenue) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'revenuePerStop', header: 'Rev / stop', align: 'right', render: (r) => formatCurrency(r.revenuePerStop) },
];

export default function RevenuePerStop() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [granularity, setGranularity] = useState('month');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.revenuePerStop({ from, to, routeCode, granularity }) : Promise.resolve({ data: null })),
    [from, to, routeCode, granularity],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;

  return (
    <div>
      <PageHeader title="Revenue per Stop" subtitle="Closed-invoice revenue ÷ completed stops, over time and by route." />
      <div className="card p-3 mb-5 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={opts.data?.earliestDate} max={opts.data?.latestDate} />
        <label className="flex flex-col"><span className="field-label">Route</span>
          <select className="field" value={routeCode} onChange={(e) => setRouteCode(e.target.value)}>
            <option value="all">All routes</option>
            {routeCodes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex flex-col"><span className="field-label">Granularity</span>
          <select className="field" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
            {GRANULARITIES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
      </div>

      <AsyncSection loading={loading || opts.loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Revenue / stop" value={formatCurrency(k.revenuePerStop)} tone="success" />
              <StatCard label="Total revenue" value={formatCurrency(k.revenue)} />
              <StatCard label="Stops" value={formatNumber(k.stops)} />
              <StatCard label="Routes" value={formatNumber(k.routes)} />
            </div>
            <LineChartCard title={`Revenue per stop by ${granularity}`} data={data.series} xKey="bucket" lines={[{ key: 'revenuePerStop', label: 'Rev / stop', color: '#10B981' }]} />
            <BarChartCard title="Revenue per stop by route" data={data.byRoute} xKey="routeCode" bars={[{ key: 'revenuePerStop', label: 'Rev / stop', color: '#2563EB' }]} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">By period</h3>
                <DataTable columns={seriesColumns} rows={data.series} exportFilename="revenue-per-stop-by-period" paginated={false} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">By route</h3>
                <DataTable columns={routeColumns} rows={data.byRoute} exportFilename="revenue-per-stop-by-route" paginated={false} initialSort={{ key: 'revenuePerStop', dir: 'desc' }} />
              </div>
            </div>
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
