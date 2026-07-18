import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard } from '@/components/charts';
import { formatMinutes, formatNumber } from '@/utils/format';

const columns = [
  { key: 'technician', header: 'Technician' },
  { key: 'stops', header: 'Total stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'activeDays', header: 'Active days', align: 'right', render: (r) => formatNumber(r.activeDays) },
  { key: 'avgStopsPerDay', header: 'Avg / day', align: 'right', render: (r) => formatNumber(r.avgStopsPerDay) },
  { key: 'serviceMinutes', header: 'Service time', align: 'right', render: (r) => formatMinutes(r.serviceMinutes) },
  { key: 'avgServicePerStop', header: 'Svc / stop', align: 'right', render: (r) => formatMinutes(r.avgServicePerStop) },
];

export default function StopsPerTechnician() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.stopsPerTechnician({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const chart = useMemo(() => rows.slice(0, 25), [rows]);

  return (
    <div>
      <PageHeader title="Stops per Technician" subtitle="Completed stops per technician over the period, with average stops per active day." />
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
              <StatCard label="Total stops" value={formatNumber(k.stops)} tone="info" />
              <StatCard label="Technicians" value={formatNumber(k.technicians)} />
              <StatCard label="Avg stops / tech" value={formatNumber(k.avgStopsPerTech)} />
              <StatCard label="Busiest tech" value={k.busiest || '—'} tone="success" />
            </div>
            <BarChartCard title="Total stops by technician" data={chart} xKey="technician" bars={[{ key: 'stops', label: 'Stops', color: '#2563EB' }]} />
            <BarChartCard title="Avg stops per active day" data={chart} xKey="technician" bars={[{ key: 'avgStopsPerDay', label: 'Stops/day', color: '#10B981' }]} />
            <DataTable columns={columns} rows={rows} exportFilename="stops-per-technician" initialSort={{ key: 'stops', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
