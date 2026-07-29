import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard, PieChartCard } from '@/components/charts';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import DrillModal from './DrillModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

export default function RevenueByCategory() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [selected, setSelected] = useState(null);
  const { from, to } = range;
  const isAllTime = range.preset === 'all_time';

  const { data, loading, error, reload } = useApi(() => biService.revenueByCategory({ from, to, routeCode }), [from, to, routeCode]);
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const pie = useMemo(() => rows.slice(0, 8).map((r) => ({ name: r.category, value: r.invoiced })), [rows]);
  const columns = useMemo(() => [
    { key: 'category', header: 'Category' },
    { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
    ...(isAllTime ? [{ key: 'remaining', header: 'Remaining', align: 'right', render: (r) => formatCurrency(r.remaining) }] : []),
    { key: 'pct', header: 'Collected', align: 'right', render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
  ], [isAllTime]);

  return (
    <div>
      <PageHeader title="Revenue by Category" subtitle="Invoiced revenue per service category for the selected period (Remaining vs annual expected shows on All time). Click a category for its customers, invoices and items." />
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
              {isAllTime && <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />}
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              {isAllTime && <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />}
              <StatCard label="Categories" value={formatNumber(k.categories)} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PieChartCard title="Invoiced share" subtitle="top 8" data={pie} nameKey="name" valueKey="value" />
              <div className="lg:col-span-2">
                <BarChartCard title={isAllTime ? 'Invoiced vs remaining by category' : 'Invoiced by category'} data={rows.slice(0, 15)} xKey="category"
                  bars={isAllTime
                    ? [{ key: 'invoiced', label: 'Invoiced', color: '#10B981', stackId: 'c' }, { key: 'remaining', label: 'Remaining', color: '#F59E0B', stackId: 'c' }]
                    : [{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }]} />
              </div>
            </div>
            <DataTable columns={columns} rows={rows} exportFilename="revenue-by-category" initialSort={{ key: 'invoiced', dir: 'desc' }} onRowClick={(r) => setSelected(r.category)} />
          </div>
        )}
      </AsyncSection>

      {selected && (
        <DrillModal
          title={`Category: ${selected}`}
          subtitle="Customers, invoices and items for this category in the selected period"
          filter={{ category: selected, routeCode: routeCode === 'all' ? undefined : routeCode }}
          range={range}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
