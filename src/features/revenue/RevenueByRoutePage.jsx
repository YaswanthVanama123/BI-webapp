import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard } from '@/components/charts';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import RouteRevenueModal from './RouteRevenueModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const columns = [
  { key: 'routeCode', header: 'Route' },
  { key: 'expected', header: 'Expected (yr)', align: 'right', render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', render: (r) => formatCurrency(r.remaining) },
  { key: 'pct', header: 'Collected', align: 'right', render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'customers', header: 'Customers', align: 'right', render: (r) => formatNumber(r.customers) },
];

export default function RevenueByRoute() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const { from, to } = range;
  const { data, loading, error, reload } = useApi(() => biService.revenueByRoute({ from, to }), [from, to]);
  const [route, setRoute] = useState(null);
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];

  return (
    <div>
      <PageHeader title="Revenue by Route" subtitle="Expected annual vs invoiced vs remaining per route (= technician serving the customer). Click a route to drill into its customers." />
      <div className="card p-3 mb-5 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={opts.data?.earliestDate} max={opts.data?.latestDate} />
      </div>

      <AsyncSection loading={loading || opts.loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Routes" value={formatNumber(k.routes)} />
            </div>
            <BarChartCard title="Invoiced vs remaining by route" data={rows} xKey="routeCode"
              bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981', stackId: 'r' }, { key: 'remaining', label: 'Remaining', color: '#F59E0B', stackId: 'r' }]} />
            <DataTable columns={columns} rows={rows} exportFilename="revenue-by-route" onRowClick={(r) => setRoute(r.routeCode)} initialSort={{ key: 'invoiced', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
      {route && <RouteRevenueModal routeCode={route} range={range} onClose={() => setRoute(null)} />}
    </div>
  );
}
