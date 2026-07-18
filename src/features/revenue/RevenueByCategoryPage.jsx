import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard, PieChartCard } from '@/components/charts';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';

const columns = [
  { key: 'category', header: 'Category' },
  { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.revenue) },
  { key: 'pct', header: '% of revenue', align: 'right', render: (r) => formatPercent(r.pct) },
  { key: 'lines', header: 'Line items', align: 'right', render: (r) => formatNumber(r.lines) },
];

export default function RevenueByCategory() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.revenueByCategory({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const pie = useMemo(() => rows.slice(0, 8).map((r) => ({ name: r.category, value: r.revenue })), [rows]);

  return (
    <div>
      <PageHeader title="Revenue by Category" subtitle="Invoice line-item (pre-tax) revenue grouped by service category." />
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
              <StatCard label="Revenue (line items)" value={formatCurrency(k.revenue)} tone="success" />
              <StatCard label="Categories" value={formatNumber(k.categories)} />
              <StatCard label="Top category" value={k.topCategory || '—'} tone="info" />
              <StatCard label="Invoices" value={formatNumber(k.invoices)} sublabel={`${formatNumber(k.lines)} lines`} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PieChartCard title="Category revenue share" subtitle="top 8" data={pie} nameKey="name" valueKey="value" />
              <div className="lg:col-span-2">
                <BarChartCard title="Revenue by category" data={rows.slice(0, 15)} xKey="category" bars={[{ key: 'revenue', label: 'Revenue', color: '#2563EB' }]} />
              </div>
            </div>
            <DataTable columns={columns} rows={rows} exportFilename="revenue-by-category" initialSort={{ key: 'revenue', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
