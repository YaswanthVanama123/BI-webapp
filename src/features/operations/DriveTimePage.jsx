import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge, Card } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import RouteTabs from '@/components/filters/RouteTabs';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard } from '@/components/charts';
import { formatMinutes, formatNumber, formatDateShort, statusTone, toNumber } from '@/utils/format';

const legColumns = [
  { key: 'fromInvoiceNumber', header: 'From #' },
  { key: 'fromCustomer', header: 'From customer' },
  { key: 'toInvoiceNumber', header: 'To #' },
  { key: 'toCustomer', header: 'To customer' },
  { key: 'fromDeparture', header: 'Departure', render: (r) => r.fromDeparture || '-' },
  { key: 'toArrival', header: 'Next arrival', render: (r) => r.toArrival || '-' },
  { key: 'observedGapMinutes', header: 'Observed gap', align: 'right', render: (r) => (r.observedGapMinutes != null ? formatMinutes(r.observedGapMinutes) : '-'), csv: (r) => r.observedGapMinutes },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', render: (r) => (r.drivingMinutes != null ? formatMinutes(r.drivingMinutes) : '-'), csv: (r) => r.drivingMinutes },
  { key: 'distanceMiles', header: 'Miles', align: 'right', render: (r) => (r.distanceMiles != null ? formatNumber(r.distanceMiles) : '-'), csv: (r) => r.distanceMiles },
  {
    key: 'extraTimeMinutes', header: 'Extra (idle)', align: 'right',
    render: (r) => (r.extraTimeMinutes != null ? <Badge tone={r.extraTimeMinutes > 15 ? 'warning' : 'neutral'}>{formatMinutes(r.extraTimeMinutes)}</Badge> : '-'),
    csv: (r) => r.extraTimeMinutes,
  },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
];

const summaryColumns = [
  { key: 'date', header: 'Date', render: (r) => formatDateShort(r.date), sortValue: (r) => r.date || '' },
  { key: 'routeCode', header: 'Route' },
  { key: 'legCount', header: 'Legs', align: 'right', render: (r) => formatNumber(r.legCount) },
  { key: 'invoiceNumbers', header: 'Invoice #', render: (r) => ((r.invoiceNumbers && r.invoiceNumbers.length) ? r.invoiceNumbers.join(', ') : '-'), csv: (r) => (r.invoiceNumbers || []).join(' ') },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', render: (r) => formatMinutes(r.drivingMinutes) },
  { key: 'observedGapMinutes', header: 'Observed gap', align: 'right', render: (r) => formatMinutes(r.observedGapMinutes) },
  { key: 'extraTimeMinutes', header: 'Extra (idle)', align: 'right', render: (r) => <Badge tone={toNumber(r.extraTimeMinutes) > 60 ? 'warning' : 'neutral'}>{formatMinutes(r.extraTimeMinutes)}</Badge>, csv: (r) => r.extraTimeMinutes },
  { key: 'distanceMiles', header: 'Miles', align: 'right', render: (r) => formatNumber(r.distanceMiles) },
];

export default function DriveTime() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.driveTime({ from, to, routeCode }) : Promise.resolve({ data: [] })),
    [from, to, routeCode],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const groups = data || [];
  const hasData = opts.data && opts.data.latestDate;

  const kpi = useMemo(() => {
    const legs = groups.reduce((t, g) => t + g.legCount, 0);
    const driving = groups.reduce((t, g) => t + (g.drivingMinutes || 0), 0);
    const observed = groups.reduce((t, g) => t + (g.observedGapMinutes || 0), 0);
    const extra = groups.reduce((t, g) => t + (g.extraTimeMinutes || 0), 0);
    const distance = groups.reduce((t, g) => t + (g.distanceMiles || 0), 0);
    return { legs, driving, observed, extra, distance, avgExtra: legs ? extra / legs : 0 };
  }, [groups]);

  const perRoute = useMemo(() => {
    const m = new Map();
    for (const g of groups) {
      const a = m.get(g.routeCode) || { routeCode: g.routeCode, driving: 0, extra: 0, distance: 0, legs: 0 };
      a.driving += g.drivingMinutes || 0; a.extra += g.extraTimeMinutes || 0; a.distance += g.distanceMiles || 0; a.legs += g.legCount;
      m.set(g.routeCode, a);
    }
    return [...m.values()].sort((a, b) => b.extra - a.extra);
  }, [groups]);

  return (
    <div>
      <PageHeader
        title="Drive Time by Route"
        subtitle="Mapbox driving time between consecutive stops (same route, same day). Extra = observed gap (next arrival − prev departure) − driving time."
      />

      <div className="card p-3 mb-3 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={opts.data?.earliestDate} max={opts.data?.latestDate} />
        {hasData && <span className="text-xs text-dark-400 pb-2">data: {formatDateShort(opts.data.earliestDate)} – {formatDateShort(opts.data.latestDate)}</span>}
      </div>
      <RouteTabs routes={routeCodes} value={routeCode} onChange={setRouteCode} className="mb-5" />

      {!opts.loading && !hasData && (
        <Card className="text-center text-sm text-dark-500">
          No drive-time data yet. Run <code className="text-dark-700">npm run compute:drive-time -- --from=YYYY-MM-DD --to=YYYY-MM-DD</code> (needs MAPBOX_TOKEN) to compute &amp; cache legs.
        </Card>
      )}

      {hasData && (
        <AsyncSection loading={loading || opts.loading} error={error} data={data} reload={reload} minEmpty>
          {() => (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
                <StatCard label="Legs" value={formatNumber(kpi.legs)} tone="info" />
                <StatCard label="Driving time" value={formatMinutes(kpi.driving)} tone="success" />
                <StatCard label="Observed gap" value={formatMinutes(kpi.observed)} sublabel="departure → next arrival" />
                <StatCard label="Extra (idle) time" value={formatMinutes(kpi.extra)} tone="warning" />
                <StatCard label="Avg extra / leg" value={formatMinutes(kpi.avgExtra)} tone={kpi.avgExtra > 15 ? 'warning' : 'neutral'} />
                <StatCard label="Distance" value={`${formatNumber(kpi.distance)} mi`} />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <BarChartCard title="Extra (idle) time by route" subtitle="gap beyond driving, over range" data={perRoute} xKey="routeCode" bars={[{ key: 'extra', label: 'Extra (min)', color: '#F59E0B' }]} />
                <BarChartCard title="Driving vs extra by route (min)" data={perRoute} xKey="routeCode"
                  bars={[{ key: 'driving', label: 'Driving (min)', color: '#2563EB', stackId: 't' }, { key: 'extra', label: 'Extra (min)', color: '#F59E0B', stackId: 't' }]} />
              </div>

              <DataTable columns={summaryColumns} rows={groups} exportFilename={`drive-time-${from}_${to}`} initialSort={{ key: 'extraTimeMinutes', dir: 'desc' }} />

              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">Leg detail</h3>
                <div className="space-y-4">
                  {groups.map((g) => (
                    <Card key={`${g.routeCode}|${g.date}`} className="p-0 overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-100 px-4 py-3">
                        <div className="font-semibold text-dark-800">Route {g.routeCode}</div>
                        <div className="flex items-center gap-4 text-xs text-dark-500">
                          <span>{formatDateShort(g.date)}</span>
                          <span>{formatNumber(g.legCount)} legs</span>
                          <span>driving {formatMinutes(g.drivingMinutes)}</span>
                          <span>extra {formatMinutes(g.extraTimeMinutes)}</span>
                          <span>{formatNumber(g.distanceMiles)} mi</span>
                        </div>
                      </div>
                      <DataTable columns={legColumns} rows={g.legs} exportFilename={`drive-legs-${g.routeCode}-${g.date}`} paginated={false} />
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </AsyncSection>
      )}
    </div>
  );
}
