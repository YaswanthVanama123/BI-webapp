import React, { useMemo, useState } from 'react';
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
  { key: 'customer', header: 'Customer' },
  { key: 'routeCode', header: 'Route' },
  { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.revenue) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'avgPerStop', header: 'Rev / stop', align: 'right', render: (r) => formatCurrency(r.avgPerStop) },
  { key: 'pct', header: '% of revenue', align: 'right', render: (r) => formatPercent(r.pct) },
];

export default function RevenueByCustomer() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [q, setQ] = useState('');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.revenueByCustomer({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => (term ? rows.filter((r) => `${r.customer} ${r.routeCode}`.toLowerCase().includes(term)) : rows), [rows, term]);
  const topChart = useMemo(() => rows.slice(0, 15), [rows]);

  return (
    <div>
      <PageHeader title="Revenue by Customer" subtitle="Client-level closed-invoice revenue, stops, and revenue per stop." />
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
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Revenue" value={formatCurrency(k.revenue)} tone="success" />
              <StatCard label="Customers" value={formatNumber(k.customers)} />
              <StatCard label="Avg / customer" value={formatCurrency(k.avgPerCustomer)} />
              <StatCard label="Top customer" value={k.topCustomer || '—'} tone="info" />
            </div>
            <BarChartCard title="Top 15 customers by revenue" data={topChart} xKey="customer" bars={[{ key: 'revenue', label: 'Revenue', color: '#2563EB' }]} />
            <DataTable columns={columns} rows={filtered} exportFilename="revenue-by-customer" initialSort={{ key: 'revenue', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
