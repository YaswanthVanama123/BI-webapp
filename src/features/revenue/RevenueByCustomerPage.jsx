import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard } from '@/components/charts';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import CustomerRevenueModal from './CustomerRevenueModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const columns = [
  { key: 'customer', header: 'Customer' },
  { key: 'routeCode', header: 'Route' },
  { key: 'expected', header: 'Expected (yr)', align: 'right', render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', render: (r) => <span className={r.remaining < 0 ? 'text-success-700' : 'text-dark-700'}>{formatCurrency(r.remaining)}</span> },
  { key: 'pct', header: 'Collected', align: 'right', render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
  { key: 'invoices', header: 'Invoices', align: 'right', render: (r) => formatNumber(r.invoices) },
];

export default function RevenueByCustomer() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(() => biService.revenueByCustomer({ from, to, routeCode }), [from, to, routeCode]);
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const term = q.trim().toLowerCase();
  const filtered = useMemo(() => (term ? rows.filter((r) => `${r.customer} ${r.routeCode}`.toLowerCase().includes(term)) : rows), [rows, term]);
  const topChart = useMemo(() => rows.slice(0, 15), [rows]);

  return (
    <div>
      <PageHeader title="Revenue by Customer" subtitle="Expected annual (pricing × frequency) vs actually invoiced vs remaining. Click a customer for the per-item breakdown and their invoices." />
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
              <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Collected" value={k.collectedPct != null ? formatPercent(k.collectedPct) : '—'} sublabel={`${formatNumber(k.customers)} customers`} tone={pctTone(k.collectedPct)} />
            </div>
            <BarChartCard title="Top 15 by invoiced revenue" data={topChart} xKey="customer" bars={[{ key: 'invoiced', label: 'Invoiced', color: '#10B981' }, { key: 'remaining', label: 'Remaining', color: '#F59E0B' }]} />
            <DataTable columns={columns} rows={filtered} exportFilename="revenue-by-customer" initialSort={{ key: 'invoiced', dir: 'desc' }} onRowClick={(r) => setSelected(r.customerId)} />
          </div>
        )}
      </AsyncSection>

      {selected && <CustomerRevenueModal customerId={selected} range={range} onClose={() => setSelected(null)} />}
    </div>
  );
}
