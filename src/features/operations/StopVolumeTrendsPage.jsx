import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { LineChartCard, BarChartCard } from '@/components/charts';
import { formatNumber } from '@/utils/format';

const GRANULARITIES = ['day', 'week', 'month'];

const seriesColumns = [
  { key: 'bucket', header: 'Period' },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
];
const routeColumns = [
  { key: 'routeCode', header: 'Route' },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
];

export default function StopVolumeTrends() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [granularity, setGranularity] = useState('month');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.stopVolumeTrends({ from, to, routeCode, granularity }) : Promise.resolve({ data: null })),
    [from, to, routeCode, granularity],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;

  return (
    <div>
      <PageHeader title="Stop Volume Trends" subtitle="Completed stop volume over time, by route and by weekday." />
      <div className="card p-3 mb-5 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={opts.data?.earliestDate} max={opts.data?.latestDate} />
        <label className="flex flex-col"><span className="field-label">Route</span>
          <select className="field" value={routeCode} onChange={(e) => setRouteCode(e.target.value)}>
            <option value="all">All routes</option>
            {routeCodes.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="flex flex-col"><span className="field-label">Granularity</span>
          <select className="field" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
            {GRANULARITIES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
      </div>

      <AsyncSection loading={loading || opts.loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard label="Total stops" value={formatNumber(k.stops)} tone="info" />
              <StatCard label={`Avg / ${granularity}`} value={formatNumber(k.avgPerBucket)} />
              <StatCard label="Busiest period" value={k.busiestBucket || '—'} sublabel={`${formatNumber(k.busiestBucketStops)} stops`} tone="success" />
              <StatCard label="Routes" value={formatNumber(k.routes)} />
              <StatCard label="Periods" value={formatNumber(k.buckets)} />
            </div>
            <LineChartCard title={`Stops by ${granularity}`} data={data.series} xKey="bucket" lines={[{ key: 'stops', label: 'Stops', color: '#2563EB' }]} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <BarChartCard title="Stops by route" data={data.byRoute} xKey="routeCode" bars={[{ key: 'stops', label: 'Stops', color: '#10B981' }]} />
              <BarChartCard title="Stops by weekday" data={data.byWeekday} xKey="day" bars={[{ key: 'stops', label: 'Stops', color: '#8B5CF6' }]} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">By period</h3>
                <DataTable columns={seriesColumns} rows={data.series} exportFilename="stop-volume-by-period" paginated={false} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">By route</h3>
                <DataTable columns={routeColumns} rows={data.byRoute} exportFilename="stop-volume-by-route" paginated={false} initialSort={{ key: 'stops', dir: 'desc' }} />
              </div>
            </div>
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
