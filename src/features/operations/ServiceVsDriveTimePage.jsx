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
import { formatMinutes, formatNumber, formatPercent, formatDateShort } from '@/utils/format';

const GRANULARITIES = ['day', 'week', 'month'];

const splitBars = [
  { key: 'service', label: 'Service (on-site)', color: '#10B981', stackId: 't' },
  { key: 'drive', label: 'Drive', color: '#2563EB', stackId: 't' },
  { key: 'idle', label: 'Idle / paperwork', color: '#F59E0B', stackId: 't' },
];

const mkColumns = (keyName, keyHeader) => [
  { key: keyName, header: keyHeader },
  { key: 'service', header: 'Service', align: 'right', render: (r) => formatMinutes(r.service) },
  { key: 'drive', header: 'Drive', align: 'right', render: (r) => formatMinutes(r.drive) },
  { key: 'idle', header: 'Idle', align: 'right', render: (r) => formatMinutes(r.idle) },
  { key: 'gap', header: 'Between stops', align: 'right', render: (r) => formatMinutes(r.gap != null ? r.gap : (r.drive || 0) + (r.idle || 0)) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'legs', header: 'Legs', align: 'right', render: (r) => formatNumber(r.legs) },
];

const dayColumns = [
  { key: 'date', header: 'Date', render: (r) => formatDateShort(r.date), sortValue: (r) => r.date || '' },
  { key: 'routeCode', header: 'Route' },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'legs', header: 'Legs', align: 'right', render: (r) => formatNumber(r.legs) },
  { key: 'service', header: 'Service', align: 'right', render: (r) => formatMinutes(r.service) },
  { key: 'drive', header: 'Drive', align: 'right', render: (r) => formatMinutes(r.drive) },
  { key: 'idle', header: 'Idle / paperwork', align: 'right', render: (r) => formatMinutes(r.idle) },
  { key: 'gap', header: 'Between stops', align: 'right', render: (r) => formatMinutes(r.gap != null ? r.gap : (r.drive || 0) + (r.idle || 0)) },
  { key: 'servicePct', header: 'Service % of active', align: 'right', render: (r) => (r.servicePct != null ? <Badge tone={r.servicePct >= 60 ? 'success' : 'warning'}>{formatPercent(r.servicePct)}</Badge> : '-'), csv: (r) => r.servicePct },
];

export default function ServiceVsDriveTime() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [granularity, setGranularity] = useState('month');
  const { from, to } = range;

  const { data, meta, loading, error, reload } = useApi(
    () => (from && to ? biService.serviceVsDriveTime({ from, to, routeCode, granularity }) : Promise.resolve({ data: null })),
    [from, to, routeCode, granularity],
  );

  const routeCodes = (opts.data && opts.data.routeCodes) || [];
  const k = data && data.kpis;
  const byRouteDay = (data && data.byRouteDay) || [];
  const dayGroups = useMemo(() => {
    const m = new Map();
    for (const r of byRouteDay) { if (!m.has(r.routeCode)) m.set(r.routeCode, []); m.get(r.routeCode).push(r); }
    return [...m.entries()].map(([rc, rows]) => ({ routeCode: rc, rows })).sort((a, b) => a.routeCode.localeCompare(b.routeCode));
  }, [byRouteDay]);
  const splitData = useMemo(() => (k ? [
    { name: 'Service', value: k.serviceMinutes },
    { name: 'Drive', value: k.driveMinutes },
    { name: 'Idle / paperwork', value: k.idleMinutes },
  ] : []), [k]);

  return (
    <div>
      <PageHeader
        title="Service vs Drive Time"
        subtitle="On-site service time vs Mapbox drive time between consecutive stops, and the non-driving idle gap (paperwork/travel slack). Per route (NRV1…) per day below."
      />

      <div className="card p-3 mb-3 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} min={opts.data?.earliestDate} max={opts.data?.latestDate} />
        <label className="flex flex-col"><span className="field-label">Granularity</span>
          <select className="field" value={granularity} onChange={(e) => setGranularity(e.target.value)}>
            {GRANULARITIES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        {meta?.unsyncedLegs > 0 && <span className="text-xs text-warning-600 pb-2">{formatNumber(meta.unsyncedLegs)} legs lack a synced drive time — run the Distances Sync to fill them.</span>}
      </div>
      <RouteTabs routes={routeCodes} value={routeCode} onChange={setRouteCode} className="mb-5" />

      <AsyncSection loading={loading || opts.loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
              <StatCard label="Service (on-site)" value={formatMinutes(k.serviceMinutes)} sublabel={`${formatPercent(k.servicePct)} of active`} tone="success" />
              <StatCard label="Drive time" value={formatMinutes(k.driveMinutes)} sublabel={`${formatPercent(k.drivePct)} of active`} tone="info" />
              <StatCard label="Idle / paperwork" value={formatMinutes(k.idleMinutes)} sublabel={`${formatPercent(k.idlePct)} of active`} tone={k.idlePct > 30 ? 'warning' : 'neutral'} />
              <StatCard label="Stops" value={formatNumber(k.stops)} sublabel={`${formatNumber(k.technicians)} techs · ${formatNumber(k.days)} days`} />
              <StatCard label="Avg service / stop" value={formatMinutes(k.avgServicePerStop)} />
              <StatCard label="Avg drive / leg" value={formatMinutes(k.avgDrivePerLeg)} sublabel={`${formatNumber(k.distanceMiles)} mi`} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <PieChartCard title="Where the day goes" subtitle="service vs drive vs idle" data={splitData} nameKey="name" valueKey="value" />
              <div className="lg:col-span-2">
                <BarChartCard title={`Service vs drive vs idle by ${granularity}`} data={data.series} xKey="bucket" bars={splitBars} />
              </div>
            </div>

            <BarChartCard title="By route (minutes)" data={data.byRoute} xKey="routeCode" bars={splitBars} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">By route</h3>
                <DataTable columns={mkColumns('routeCode', 'Route')} rows={data.byRoute} exportFilename="service-vs-drive-by-route" paginated={false} initialSort={{ key: 'drive', dir: 'desc' }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-dark-700 mb-2">By technician</h3>
                <DataTable columns={mkColumns('technician', 'Technician')} rows={data.byTechnician} exportFilename="service-vs-drive-by-tech" paginated={false} initialSort={{ key: 'drive', dir: 'desc' }} />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-dark-700 mb-2">Day by day (per route)</h3>
              <div className="space-y-4">
                {dayGroups.map((g) => {
                  const svc = g.rows.reduce((t, r) => t + r.service, 0);
                  const drv = g.rows.reduce((t, r) => t + r.drive, 0);
                  const idl = g.rows.reduce((t, r) => t + r.idle, 0);
                  return (
                    <Card key={g.routeCode} className="p-0 overflow-hidden">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dark-100 px-4 py-3">
                        <div className="font-semibold text-dark-800">Route {g.routeCode}</div>
                        <div className="flex items-center gap-4 text-xs text-dark-500">
                          <span>{formatNumber(g.rows.length)} day(s)</span>
                          <span>service {formatMinutes(svc)}</span>
                          <span>drive {formatMinutes(drv)}</span>
                          <span>idle {formatMinutes(idl)}</span>
                        </div>
                      </div>
                      <DataTable columns={dayColumns} rows={g.rows} exportFilename={`service-vs-drive-${g.routeCode}`} paginated={false} initialSort={{ key: 'date', dir: 'desc' }} />
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
