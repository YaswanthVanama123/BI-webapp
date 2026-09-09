import React, { useEffect, useState } from 'react';
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
import DrillModal from '@/features/revenue/DrillModal';

const NotRecorded = () => <span className="text-dark-400">Not recorded</span>;

const legColumns = [
  { key: 'fromInvoiceNumber', header: 'From #' },
  { key: 'fromCustomer', header: 'From customer' },
  { key: 'toInvoiceNumber', header: 'To #' },
  { key: 'toCustomer', header: 'To customer' },
  { key: 'fromDeparture', header: 'Departure', render: (r) => r.fromDeparture || <NotRecorded /> },
  { key: 'toArrival', header: 'Next arrival', render: (r) => r.toArrival || <NotRecorded /> },
  { key: 'observedGapMinutes', header: 'Observed gap', align: 'right', render: (r) => formatMinutes(r.observedGapMinutes ?? 0), csv: (r) => formatMinutes(r.observedGapMinutes ?? 0) },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', render: (r) => formatMinutes(r.drivingMinutes ?? 0), csv: (r) => formatMinutes(r.drivingMinutes ?? 0) },
  { key: 'distanceMiles', header: 'Miles', align: 'right', render: (r) => formatNumber(r.distanceMiles ?? 0), csv: (r) => r.distanceMiles ?? 0 },
  {
    key: 'extraTimeMinutes', header: 'Extra (idle)', align: 'right',
    render: (r) => <Badge tone={(r.extraTimeMinutes ?? 0) > 15 ? 'warning' : 'neutral'}>{formatMinutes(r.extraTimeMinutes ?? 0)}</Badge>,
    csv: (r) => formatMinutes(r.extraTimeMinutes ?? 0),
  },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
];

const summaryColumns = [
  { key: 'date', header: 'Completed', render: (r) => formatDateShort(r.date), sortValue: (r) => r.date || '' },
  { key: 'routeCode', header: 'Route' },
  { key: 'legCount', header: 'Legs', align: 'right', render: (r) => formatNumber(r.legCount) },
  { key: 'invoiceNumbers', header: 'Invoice #', render: (r) => ((r.invoiceNumbers && r.invoiceNumbers.length) ? r.invoiceNumbers.join(', ') : <NotRecorded />), csv: (r) => (r.invoiceNumbers || []).join(' ') },
  { key: 'drivingMinutes', header: 'Driving', align: 'right', render: (r) => formatMinutes(r.drivingMinutes ?? 0), csv: (r) => formatMinutes(r.drivingMinutes ?? 0) },
  { key: 'observedGapMinutes', header: 'Observed gap', align: 'right', render: (r) => formatMinutes(r.observedGapMinutes ?? 0), csv: (r) => formatMinutes(r.observedGapMinutes ?? 0) },
  { key: 'extraTimeMinutes', header: 'Extra (idle)', align: 'right', render: (r) => <Badge tone={toNumber(r.extraTimeMinutes) > 60 ? 'warning' : 'neutral'}>{formatMinutes(r.extraTimeMinutes ?? 0)}</Badge>, csv: (r) => formatMinutes(r.extraTimeMinutes ?? 0) },
  { key: 'distanceMiles', header: 'Miles', align: 'right', render: (r) => formatNumber(r.distanceMiles ?? 0) },
];

const allLegColumns = [
  { key: 'date', header: 'Completed', render: (r) => formatDateShort(r.date), sortValue: (r) => r.date || '' },
  { key: 'routeCode', header: 'Route' },
  ...legColumns,
];

export default function DriveTime() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [drill, setDrill] = useState(null);
  const [legPage, setLegPage] = useState(1);
  const [sumPage, setSumPage] = useState(1);
  const [legQ, setLegQ] = useState('');
  const [sumQ, setSumQ] = useState('');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.driveTime({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );

  useEffect(() => { setLegPage(1); setSumPage(1); }, [from, to, routeCode]);
  useEffect(() => { setSumPage(1); }, [sumQ]);
  useEffect(() => { setLegPage(1); }, [legQ]);
  const legsApi = useApi(
    () => (from && to ? biService.driveTimeLegs({ from, to, routeCode, q: legQ || undefined, page: legPage, pageSize: 25 }) : Promise.resolve({ data: [] })),
    [from, to, routeCode, legQ, legPage],
  );
  const legRows = legsApi.data || [];
  const legTotal = (legsApi.page && legsApi.page.total) || 0;
  const exportLegs = async () => {
    const res = await biService.driveTimeLegs({ from, to, routeCode, q: legQ || undefined, pageSize: 'all' });
    return (res && res.data) || [];
  };

  const summaryApi = useApi(
    () => (from && to ? biService.driveTime({ from, to, routeCode, q: sumQ || undefined, page: sumPage, pageSize: 25 }) : Promise.resolve({ data: null })),
    [from, to, routeCode, sumQ, sumPage],
  );
  const summaryRows = (summaryApi.data && summaryApi.data.summary) || [];
  const summaryTotal = (summaryApi.page && summaryApi.page.total) || 0;
  const exportSummary = async () => {
    const res = await biService.driveTime({ from, to, routeCode, q: sumQ || undefined, pageSize: 'all' });
    return (res && res.data && res.data.summary) || [];
  };

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const hasData = opts.data && opts.data.latestDate;

  const kpi = (data && data.kpis) || { legs: 0, driving: 0, observed: 0, extra: 0, distance: 0, avgExtra: 0 };
  const perRoute = (data && data.perRoute) || [];

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

              {kpi.unsyncedLegs > 0 && (
                <Card className="text-sm text-dark-600">
                  <span className="font-semibold text-warning-700">{formatNumber(kpi.unsyncedLegs)}</span> of {formatNumber(kpi.legs)} legs have no Mapbox distance yet — the customer pair is not in the distance table, so Driving / Miles / Extra show 0 and those legs are excluded from the totals above. The “Pending (null)” tile on <span className="font-semibold">Distances / Driving Time</span> only counts pairs that already exist, so it can read 0 while these legs are still unresolved. Run <span className="font-semibold">Sync</span> there to discover and fill them in.
                </Card>
              )}

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <BarChartCard title="Extra (idle) time by route" subtitle="gap beyond driving, over range" data={perRoute} xKey="routeCode" bars={[{ key: 'extra', label: 'Extra (min)', color: '#F59E0B' }]} valueFormatter={formatMinutes} />
                <BarChartCard title="Driving vs extra by route (min)" data={perRoute} xKey="routeCode"
                  bars={[{ key: 'driving', label: 'Driving (min)', color: '#2563EB', stackId: 't' }, { key: 'extra', label: 'Extra (min)', color: '#F59E0B', stackId: 't' }]} valueFormatter={formatMinutes} />
              </div>

              <DataTable columns={summaryColumns} rows={summaryRows} exportFilename={`drive-time-${from}_${to}`} searchable onServerSearch={setSumQ} searchPlaceholder="Search route / invoice…" initialSort={{ key: 'extraTimeMinutes', dir: 'desc' }} onRowClick={(r) => setDrill(r)} serverSide serverTotal={summaryTotal} page={sumPage} onPageChange={setSumPage} pageSize={25} onExportAll={exportSummary} />

              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">Leg detail (all routes)</h3>
                <DataTable
                  columns={allLegColumns}
                  rows={legRows}
                  exportFilename={`drive-legs-${from}_${to}`}
                  searchable
                  onServerSearch={setLegQ}
                  searchPlaceholder="Search customer / invoice…"
                  initialSort={{ key: 'date', dir: 'desc' }}
                  serverSide
                  serverTotal={legTotal}
                  page={legPage}
                  onPageChange={setLegPage}
                  pageSize={25}
                  onExportAll={exportLegs}
                />
              </div>
            </div>
          )}
        </AsyncSection>
      )}
      {drill && (
        <DrillModal
          title={`${drill.routeCode} · ${formatDateShort(drill.date)}`}
          subtitle="Invoices completed by this route on the selected day"
          filter={{ routeCode: drill.routeCode }}
          range={{ from: drill.date, to: drill.date }}
          defaultTab="invoices"
          onClose={() => setDrill(null)}
        />
      )}
    </div>
  );
}
