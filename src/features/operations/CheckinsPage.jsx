import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge, Card } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import RouteTabs from '@/components/filters/RouteTabs';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard, PieChartCard } from '@/components/charts';
import { formatMinutes, formatNumber, formatPercent, formatDateShort, statusTone } from '@/utils/format';

const stopColumns = [
  { key: 'seq', header: '#', align: 'right', accessor: (r) => r.__seq },
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'customer', header: 'Customer' },
  { key: 'checkIn', header: 'Check-in', render: (r) => r.checkIn || '-' },
  { key: 'checkOut', header: 'Check-out', render: (r) => r.checkOut || '-' },
  { key: 'serviceMinutes', header: 'Service', align: 'right', render: (r) => (r.serviceMinutes != null ? formatMinutes(r.serviceMinutes) : '-'), csv: (r) => r.serviceMinutes },
  { key: 'gapToNextMinutes', header: 'Idle to next', align: 'right', render: (r) => (r.gapToNextMinutes != null ? formatMinutes(r.gapToNextMinutes) : '-'), csv: (r) => r.gapToNextMinutes },
  { key: 'elapsedStatus', header: 'Check', render: (r) => <Badge tone={statusTone(r.elapsedStatus)}>{r.elapsedStatus}</Badge> },
];

const routeSummaryColumns = [
  { key: 'date', header: 'Date', render: (r) => formatDateShort(r.date), sortValue: (r) => r.date || '' },
  { key: 'route', header: 'Route' },
  { key: 'stopCount', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stopCount) },
  { key: 'invoiceNumbers', header: 'Invoice #', render: (r) => ((r.invoiceNumbers && r.invoiceNumbers.length) ? r.invoiceNumbers.join(', ') : '-'), csv: (r) => (r.invoiceNumbers || []).join(' ') },
  { key: 'firstCheckIn', header: 'First in', render: (r) => r.firstCheckIn || '-' },
  { key: 'lastCheckOut', header: 'Last out', render: (r) => r.lastCheckOut || '-' },
  { key: 'spanMinutes', header: 'Day span', align: 'right', render: (r) => (r.spanMinutes != null ? formatMinutes(r.spanMinutes) : '-'), csv: (r) => r.spanMinutes },
  { key: 'totalServiceMinutes', header: 'Service', align: 'right', render: (r) => formatMinutes(r.totalServiceMinutes) },
  { key: 'totalGapMinutes', header: 'Idle', align: 'right', render: (r) => formatMinutes(r.totalGapMinutes || 0) },
  {
    key: 'servicePct', header: 'Service % of day', align: 'right',
    render: (r) => (r.servicePct != null ? <Badge tone={r.servicePct >= 60 ? 'success' : 'warning'}>{formatPercent(r.servicePct)}</Badge> : '-'),
    csv: (r) => r.servicePct,
  },
  { key: 'flaggedStops', header: 'Flagged', align: 'right', render: (r) => (r.flaggedStops ? <Badge tone="warning">{r.flaggedStops}</Badge> : '0') },
];

export default function Checkins() {
  const opts = useApi(() => biService.checkinOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [route, setRoute] = useState('all');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.checkins({ from, to, route }) : Promise.resolve({ data: [] })),
    [from, to, route],
  );

  const routes = (opts.data && opts.data.routes) || [];
  const earliest = opts.data && opts.data.earliestDate;
  const latest = opts.data && opts.data.latestDate;
  const groups = data || [];
  const rangeError = from && to && from > to;

  const kpi = useMemo(() => {
    const totalStops = groups.reduce((t, g) => t + g.stopCount, 0);
    const totalService = groups.reduce((t, g) => t + (g.totalServiceMinutes || 0), 0);
    const totalGap = groups.reduce((t, g) => t + (g.totalGapMinutes || 0), 0);
    const totalSpan = groups.reduce((t, g) => t + (g.spanMinutes || 0), 0);
    const flagged = groups.reduce((t, g) => t + (g.flaggedStops || 0), 0);
    const routesSet = new Set(groups.map((g) => g.route));
    const daysSet = new Set(groups.map((g) => g.date));
    return {
      routes: routesSet.size,
      days: daysSet.size,
      totalStops,
      totalService,
      avgServicePerStop: totalStops ? totalService / totalStops : 0,
      totalGap,
      flagged,
      servicePct: totalSpan ? (totalService / totalSpan) * 100 : 0,
    };
  }, [groups]);

  const perRoute = useMemo(() => {
    const m = new Map();
    for (const g of groups) {
      const a = m.get(g.route) || { route: g.route, stops: 0, service: 0, gap: 0 };
      a.stops += g.stopCount; a.service += g.totalServiceMinutes || 0; a.gap += g.totalGapMinutes || 0;
      m.set(g.route, a);
    }
    return [...m.values()].sort((a, b) => b.stops - a.stops);
  }, [groups]);

  const statusData = useMemo(() => {
    const counts = {};
    groups.forEach((g) => g.stops.forEach((s) => { counts[s.elapsedStatus] = (counts[s.elapsedStatus] || 0) + 1; }));
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [groups]);

  return (
    <div>
      <PageHeader title="Check-in / Check-out" subtitle="Per route (NRV1…) per day: day span = first arrival → last departure; idle = gaps between consecutive stops; service% = on-site ÷ day span." />

      <div className="card p-3 mb-3 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={earliest} max={latest} />
        {latest && <span className="text-xs text-dark-400 pb-2">data: {formatDateShort(earliest)} – {formatDateShort(latest)}</span>}
        {rangeError && <span className="text-xs text-danger-600 pb-2">“From” is after “To”.</span>}
      </div>
      <RouteTabs routes={routes} value={route} onChange={setRoute} className="mb-5" />

      <AsyncSection loading={loading || opts.loading} error={error} data={data} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <StatCard label="Routes" value={formatNumber(kpi.routes)} sublabel={`${formatNumber(kpi.days)} day(s)`} tone="info" />
              <StatCard label="Stops" value={formatNumber(kpi.totalStops)} tone="success" />
              <StatCard label="Service time" value={formatMinutes(kpi.totalService)} sublabel="on-site" />
              <StatCard label="Avg / stop" value={formatMinutes(kpi.avgServicePerStop)} />
              <StatCard label="Idle between stops" value={formatMinutes(kpi.totalGap)} tone="warning" />
              <StatCard label="Service % of day" value={formatPercent(kpi.servicePct)} tone={kpi.servicePct >= 60 ? 'success' : 'warning'} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <BarChartCard title="Stops per route" subtitle="total over range" data={perRoute} xKey="route" bars={[{ key: 'stops', label: 'Stops' }]} />
              <BarChartCard title="Time on-site vs idle between stops (min)" subtitle="over range" data={perRoute} xKey="route"
                bars={[{ key: 'service', label: 'Service (min)', color: '#10B981', stackId: 't' }, { key: 'gap', label: 'Idle (min)', color: '#F59E0B', stackId: 't' }]} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PieChartCard title="Elapsed-time check" subtitle="source vs computed" data={statusData} nameKey="name" valueKey="value" />
              <div className="lg:col-span-2">
                <DataTable columns={routeSummaryColumns} rows={groups} exportFilename={`checkins-summary-${from}_${to}`} initialSort={{ key: 'date', dir: 'desc' }} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-dark-700 mb-2">Stop detail (by route / day)</h3>
              <div className="space-y-4">
                {groups.map((g) => (
                  <Card key={`${g.route}|${g.date}`} className="p-0 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-100 px-4 py-3">
                      <div className="font-semibold text-dark-800">Route {g.route}</div>
                      <div className="flex items-center gap-4 text-xs text-dark-500">
                        <span>{formatDateShort(g.date)}</span>
                        <span>{formatNumber(g.stopCount)} stops</span>
                        <span>span {g.spanMinutes != null ? formatMinutes(g.spanMinutes) : '-'}</span>
                        <span>service {formatMinutes(g.totalServiceMinutes)}</span>
                        <span>idle {formatMinutes(g.totalGapMinutes || 0)}</span>
                        <span>{g.firstCheckIn || '-'} → {g.lastCheckOut || '-'}</span>
                      </div>
                    </div>
                    <DataTable columns={stopColumns} rows={g.stops.map((s, i) => ({ ...s, __seq: i + 1 }))} exportFilename={`checkins-${g.route}-${g.date}`} paginated={false} />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
