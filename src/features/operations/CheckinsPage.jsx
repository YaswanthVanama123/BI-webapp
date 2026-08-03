import React, { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import RouteTabs from '@/components/filters/RouteTabs';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard, PieChartCard } from '@/components/charts';
import { formatMinutes, formatNumber, formatPercent, formatDateShort, statusTone } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/InvoiceLinesModal';

const stopColumns = [
  { key: 'seq', header: '#', align: 'right', accessor: (r) => r.__seq },
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'customer', header: 'Customer' },
  { key: 'checkIn', header: 'Check-in', render: (r) => r.checkIn || '-' },
  { key: 'checkOut', header: 'Check-out', render: (r) => r.checkOut || '-' },
  { key: 'serviceMinutes', header: 'Service', align: 'right', render: (r) => (r.serviceMinutes != null ? formatMinutes(r.serviceMinutes) : '-'), csv: (r) => formatMinutes(r.serviceMinutes) },
  { key: 'gapToNextMinutes', header: 'Idle to next', align: 'right', render: (r) => (r.gapToNextMinutes != null ? formatMinutes(r.gapToNextMinutes) : '-'), csv: (r) => formatMinutes(r.gapToNextMinutes) },
  { key: 'elapsedStatus', header: 'Check', render: (r) => <Badge tone={statusTone(r.elapsedStatus)}>{r.elapsedStatus}</Badge> },
];

const allStopColumns = [
  stopColumns[0],
  { key: 'dateCompleted', header: 'Completed', render: (r) => formatDateShort(r.dateCompleted), sortValue: (r) => r.dateCompleted || '' },
  { key: 'route', header: 'Route' },
  ...stopColumns.slice(1),
];

const routeSummaryColumns = [
  { key: 'date', header: 'Completed', render: (r) => formatDateShort(r.date), sortValue: (r) => r.date || '' },
  { key: 'route', header: 'Route' },
  { key: 'stopCount', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stopCount) },
  { key: 'invoiceNumbers', header: 'Invoice #', render: (r) => ((r.invoiceNumbers && r.invoiceNumbers.length) ? r.invoiceNumbers.join(', ') : '-'), csv: (r) => (r.invoiceNumbers || []).join(' ') },
  { key: 'firstCheckIn', header: 'First in', render: (r) => r.firstCheckIn || '-' },
  { key: 'lastCheckOut', header: 'Last out', render: (r) => r.lastCheckOut || '-' },
  { key: 'spanMinutes', header: 'Day span', align: 'right', render: (r) => (r.spanMinutes != null ? formatMinutes(r.spanMinutes) : '-'), csv: (r) => formatMinutes(r.spanMinutes) },
  { key: 'totalServiceMinutes', header: 'Service', align: 'right', render: (r) => formatMinutes(r.totalServiceMinutes), csv: (r) => formatMinutes(r.totalServiceMinutes) },
  { key: 'totalGapMinutes', header: 'Idle', align: 'right', render: (r) => formatMinutes(r.totalGapMinutes || 0), csv: (r) => formatMinutes(r.totalGapMinutes || 0) },
  {
    key: 'servicePct', header: 'Service % of day', align: 'right',
    render: (r) => (r.servicePct != null ? <Badge tone={r.servicePct >= 60 ? 'success' : 'warning'}>{formatPercent(r.servicePct)}</Badge> : '-'),
    csv: (r) => r.servicePct,
  },
  { key: 'flaggedStops', header: 'Flagged', align: 'right', render: (r) => (r.flaggedStops ? <Badge tone="warning">{r.flaggedStops}</Badge> : '0') },
];

export default function Checkins() {
  const opts = useApi(() => biService.checkinOptions(), []);
  const [invoice, setInvoice] = useState(null);
  const [range, setRange] = useState(defaultRange());
  const [route, setRoute] = useState('all');
  const [sumPage, setSumPage] = useState(1);
  const [stopPage, setStopPage] = useState(1);
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.checkins({ from, to, route }) : Promise.resolve({ data: null })),
    [from, to, route],
  );

  useEffect(() => { setSumPage(1); setStopPage(1); }, [from, to, route]);

  const summaryApi = useApi(
    () => (from && to ? biService.checkins({ from, to, route, page: sumPage, pageSize: 25 }) : Promise.resolve({ data: null })),
    [from, to, route, sumPage],
  );
  const stopsApi = useApi(
    () => (from && to ? biService.checkinStops({ from, to, route, page: stopPage, pageSize: 25 }) : Promise.resolve({ data: [] })),
    [from, to, route, stopPage],
  );

  const routes = (opts.data && opts.data.routes) || [];
  const earliest = opts.data && opts.data.earliestDate;
  const latest = opts.data && opts.data.latestDate;
  const rangeError = from && to && from > to;

  const kpi = (data && data.kpis) || { routes: 0, days: 0, totalStops: 0, totalService: 0, avgServicePerStop: 0, totalGap: 0, servicePct: 0 };
  const perRoute = (data && data.perRoute) || [];
  const statusData = (data && data.statusData) || [];

  const summaryRows = (summaryApi.data && summaryApi.data.summary) || [];
  const summaryTotal = (summaryApi.page && summaryApi.page.total) || 0;
  const exportSummary = async () => {
    const res = await biService.checkins({ from, to, route, pageSize: 'all' });
    return (res && res.data && res.data.summary) || [];
  };

  const stopRows = ((stopsApi.data || [])).map((s, i) => ({ ...s, __seq: (stopPage - 1) * 25 + i + 1 }));
  const stopTotal = (stopsApi.page && stopsApi.page.total) || 0;
  const exportStops = async () => {
    const res = await biService.checkinStops({ from, to, route, pageSize: 'all' });
    return ((res && res.data) || []).map((s, i) => ({ ...s, __seq: i + 1 }));
  };

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
              <BarChartCard title="Day span per route (min)" subtitle="total first-in → last-out over range" data={perRoute} xKey="route" bars={[{ key: 'span', label: 'Day span (min)', color: '#2563EB' }]} valueFormatter={formatMinutes} />
              <BarChartCard title="Time on-site vs idle between stops (min)" subtitle="over range" data={perRoute} xKey="route"
                bars={[{ key: 'service', label: 'Service (min)', color: '#10B981', stackId: 't' }, { key: 'gap', label: 'Idle (min)', color: '#F59E0B', stackId: 't' }]} valueFormatter={formatMinutes} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PieChartCard title="Elapsed-time check" subtitle="source vs computed" data={statusData} nameKey="name" valueKey="value" />
              <div className="lg:col-span-2">
                <DataTable
                  columns={routeSummaryColumns}
                  rows={summaryRows}
                  exportFilename={`checkins-summary-${from}_${to}`}
                  searchable={false}
                  initialSort={{ key: 'date', dir: 'desc' }}
                  serverSide
                  serverTotal={summaryTotal}
                  page={sumPage}
                  onPageChange={setSumPage}
                  pageSize={25}
                  onExportAll={exportSummary}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-dark-700 mb-2">Stop detail (all stops, completed date ascending)</h3>
              <DataTable
                columns={allStopColumns}
                rows={stopRows}
                exportFilename={`checkins-stops-${from}_${to}`}
                searchable={false}
                initialSort={{ key: 'dateCompleted', dir: 'asc' }}
                onRowClick={(r) => r.invoiceNumber && setInvoice(r.invoiceNumber)}
                serverSide
                serverTotal={stopTotal}
                page={stopPage}
                onPageChange={setStopPage}
                pageSize={25}
                onExportAll={exportStops}
              />
            </div>
          </div>
        )}
      </AsyncSection>
      {invoice && <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} />}
    </div>
  );
}
