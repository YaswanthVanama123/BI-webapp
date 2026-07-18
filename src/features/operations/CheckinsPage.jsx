import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge, Card } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
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
  { key: 'sourceElapsedMinutes', header: 'Source elapsed', align: 'right', render: (r) => (r.sourceElapsedMinutes != null ? formatMinutes(r.sourceElapsedMinutes) : '-'), csv: (r) => r.sourceElapsedMinutes },
  { key: 'elapsedStatus', header: 'Check', render: (r) => <Badge tone={statusTone(r.elapsedStatus)}>{r.elapsedStatus}</Badge> },
  { key: 'gapToNextMinutes', header: 'Gap to next', align: 'right', render: (r) => (r.gapToNextMinutes != null ? formatMinutes(r.gapToNextMinutes) : '-'), csv: (r) => r.gapToNextMinutes },
];

const techSummaryColumns = [
  { key: 'date', header: 'Date', render: (r) => formatDateShort(r.date), sortValue: (r) => r.date || '' },
  { key: 'technician', header: 'Technician' },
  { key: 'stopCount', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stopCount) },
  { key: 'firstCheckIn', header: 'First in', render: (r) => r.firstCheckIn || '-' },
  { key: 'lastCheckOut', header: 'Last out', render: (r) => r.lastCheckOut || '-' },
  { key: 'spanMinutes', header: 'Day span', align: 'right', render: (r) => (r.spanMinutes != null ? formatMinutes(r.spanMinutes) : '-'), csv: (r) => r.spanMinutes },
  { key: 'totalServiceMinutes', header: 'Service', align: 'right', render: (r) => formatMinutes(r.totalServiceMinutes) },
  { key: 'totalGapMinutes', header: 'Idle gap', align: 'right', render: (r) => formatMinutes(r.totalGapMinutes || 0) },
  {
    key: 'servicePct', header: 'Service % of day', align: 'right',
    render: (r) => { const p = r.spanMinutes ? (r.totalServiceMinutes / r.spanMinutes) * 100 : null; return p != null ? <Badge tone={p >= 60 ? 'success' : 'warning'}>{formatPercent(p)}</Badge> : '-'; },
    csv: (r) => (r.spanMinutes ? Math.round((r.totalServiceMinutes / r.spanMinutes) * 1000) / 10 : ''),
  },
  { key: 'flaggedStops', header: 'Flagged', align: 'right', render: (r) => (r.flaggedStops ? <Badge tone="warning">{r.flaggedStops}</Badge> : '0') },
];

export default function Checkins() {
  const opts = useApi(() => biService.checkinOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [tech, setTech] = useState('all');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.checkins({ from, to, technician: tech }) : Promise.resolve({ data: [] })),
    [from, to, tech],
  );

  const technicians = (opts.data && opts.data.technicians) || [];
  const earliest = opts.data && opts.data.earliestDate;
  const latest = opts.data && opts.data.latestDate;
  const groups = data || [];
  const rangeError = from && to && from > to;

  const kpi = useMemo(() => {
    const totalStops = groups.reduce((t, g) => t + g.stopCount, 0);
    const totalService = groups.reduce((t, g) => t + (g.totalServiceMinutes || 0), 0);
    const totalGap = groups.reduce((t, g) => t + (g.totalGapMinutes || 0), 0);
    const flagged = groups.reduce((t, g) => t + (g.flaggedStops || 0), 0);
    const techsSet = new Set(groups.map((g) => g.technician));
    const daysSet = new Set(groups.map((g) => g.date));
    return {
      techs: techsSet.size,
      days: daysSet.size,
      totalStops,
      totalService,
      avgServicePerStop: totalStops ? totalService / totalStops : 0,
      totalGap,
      flagged,
    };
  }, [groups]);

  const perTech = useMemo(() => {
    const m = new Map();
    for (const g of groups) {
      const a = m.get(g.technician) || { technician: g.technician, stops: 0, service: 0, gap: 0 };
      a.stops += g.stopCount; a.service += g.totalServiceMinutes || 0; a.gap += g.totalGapMinutes || 0;
      m.set(g.technician, a);
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
      <PageHeader title="Check-in / Check-out" subtitle="Technician check-in/out per stop from RouteStar arrival & departure times (read directly, per day)." />

      <div className="card p-3 mb-5 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={earliest} max={latest} />
        <label className="flex flex-col">
          <span className="field-label">Technician</span>
          <select className="field" value={tech} onChange={(e) => setTech(e.target.value)}>
            <option value="all">All technicians</option>
            {technicians.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        {latest && <span className="text-xs text-dark-400 pb-2">data: {formatDateShort(earliest)} – {formatDateShort(latest)}</span>}
        {rangeError && <span className="text-xs text-danger-600 pb-2">“From” is after “To”.</span>}
      </div>

      <AsyncSection loading={loading || opts.loading} error={error} data={data} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <StatCard label="Technicians" value={formatNumber(kpi.techs)} sublabel={`${formatNumber(kpi.days)} day(s)`} tone="info" />
              <StatCard label="Stops" value={formatNumber(kpi.totalStops)} tone="success" />
              <StatCard label="Service time" value={formatMinutes(kpi.totalService)} sublabel="on-site" />
              <StatCard label="Avg / stop" value={formatMinutes(kpi.avgServicePerStop)} />
              <StatCard label="Idle between stops" value={formatMinutes(kpi.totalGap)} tone="warning" />
              <StatCard label="Flagged stops" value={formatNumber(kpi.flagged)} sublabel="variance/negative/missing" tone={kpi.flagged ? 'warning' : 'success'} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <BarChartCard title="Stops per technician" subtitle="total over range" data={perTech} xKey="technician" bars={[{ key: 'stops', label: 'Stops' }]} />
              <BarChartCard title="Time on-site vs idle between stops (min)" subtitle="over range" data={perTech} xKey="technician"
                bars={[{ key: 'service', label: 'Service (min)', color: '#10B981', stackId: 't' }, { key: 'gap', label: 'Idle gap (min)', color: '#F59E0B', stackId: 't' }]} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PieChartCard title="Elapsed-time check" subtitle="source vs computed" data={statusData} nameKey="name" valueKey="value" />
              <div className="lg:col-span-2">
                <DataTable columns={techSummaryColumns} rows={groups} exportFilename={`checkins-summary-${from}_${to}`} initialSort={{ key: 'date', dir: 'desc' }} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-dark-700 mb-2">Stop detail</h3>
              <div className="space-y-4">
                {groups.map((g) => (
                  <Card key={`${g.technician}|${g.date}`} className="p-0 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-100 px-4 py-3">
                      <div className="font-semibold text-dark-800">{g.technician}</div>
                      <div className="flex items-center gap-4 text-xs text-dark-500">
                        <span>{formatDateShort(g.date)}</span>
                        <span>{formatNumber(g.stopCount)} stops</span>
                        <span>service {formatMinutes(g.totalServiceMinutes)}</span>
                        <span>idle {formatMinutes(g.totalGapMinutes || 0)}</span>
                        <span>{g.firstCheckIn || '-'} → {g.lastCheckOut || '-'}</span>
                      </div>
                    </div>
                    <DataTable columns={stopColumns} rows={g.stops.map((s, i) => ({ ...s, __seq: i + 1 }))} exportable={false} paginated={false} />
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
