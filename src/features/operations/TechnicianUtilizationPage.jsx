import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard } from '@/components/charts';
import { formatMinutes, formatNumber, formatPercent } from '@/utils/format';

const columns = [
  { key: 'technician', header: 'Technician' },
  { key: 'utilizationPct', header: 'Utilization', align: 'right', render: (r) => <Badge tone={r.utilizationPct >= 60 ? 'success' : r.utilizationPct >= 40 ? 'warning' : 'danger'}>{formatPercent(r.utilizationPct)}</Badge>, sortValue: (r) => r.utilizationPct },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'days', header: 'Days', align: 'right', render: (r) => formatNumber(r.days) },
  { key: 'avgStopsPerDay', header: 'Stops/day', align: 'right', render: (r) => formatNumber(r.avgStopsPerDay) },
  { key: 'serviceMinutes', header: 'Service', align: 'right', render: (r) => formatMinutes(r.serviceMinutes) },
  { key: 'spanMinutes', header: 'Working span', align: 'right', render: (r) => formatMinutes(r.spanMinutes) },
  { key: 'idleMinutes', header: 'Idle', align: 'right', render: (r) => formatMinutes(r.idleMinutes) },
  { key: 'avgServicePerStop', header: 'Svc/stop', align: 'right', render: (r) => formatMinutes(r.avgServicePerStop) },
];

export default function TechnicianUtilization() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const { from, to } = range;

  const { data, loading, error, reload } = useApi(
    () => (from && to ? biService.technicianUtilization({ from, to, routeCode }) : Promise.resolve({ data: null })),
    [from, to, routeCode],
  );
  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const chart = useMemo(() => rows.slice(0, 20).map((r) => ({ technician: r.technician, service: r.serviceMinutes, idle: r.idleMinutes })), [rows]);

  return (
    <div>
      <PageHeader title="Technician Utilization" subtitle="On-site service time as a share of each technician's working-day span (first check-in → last check-out)." />
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
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard label="Avg utilization" value={formatPercent(k.avgUtilizationPct)} tone={k.avgUtilizationPct >= 60 ? 'success' : 'warning'} />
              <StatCard label="Technicians" value={formatNumber(k.technicians)} />
              <StatCard label="Stops" value={formatNumber(k.stops)} sublabel={`${formatNumber(k.avgStopsPerTech)}/tech`} />
              <StatCard label="Service time" value={formatMinutes(k.serviceMinutes)} tone="success" />
              <StatCard label="Idle (in span)" value={formatMinutes(k.idleMinutes)} tone="warning" />
            </div>
            <BarChartCard title="Service vs idle within the working day (min)" data={chart} xKey="technician"
              bars={[{ key: 'service', label: 'Service', color: '#10B981', stackId: 't' }, { key: 'idle', label: 'Idle', color: '#F59E0B', stackId: 't' }]} />
            <DataTable columns={columns} rows={rows} exportFilename="technician-utilization" initialSort={{ key: 'utilizationPct', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
