import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard, LineChartCard, PieChartCard } from '@/components/charts';
import { formatCurrency, formatNumber, formatPercent, formatMinutes } from '@/utils/format';

export default function Dashboard() {
  const [range, setRange] = useState(defaultRange());
  const { from, to } = range;
  const ready = !!(from && to);
  const call = (fn, extra) => () => (ready ? fn({ from, to, ...extra }) : Promise.resolve({ data: null }));

  const route = useApi(call(biService.revenueByRoute), [from, to]);
  const category = useApi(call(biService.revenueByCategory), [from, to]);
  const volume = useApi(call(biService.stopVolumeTrends, { granularity: 'month' }), [from, to]);
  const util = useApi(call(biService.technicianUtilization), [from, to]);
  const svc = useApi(call(biService.serviceVsDriveTime, { granularity: 'month' }), [from, to]);

  const loading = route.loading || category.loading || volume.loading || util.loading || svc.loading;
  const error = route.error || category.error || volume.error || util.error || svc.error;
  const reload = () => { route.reload(); category.reload(); volume.reload(); util.reload(); svc.reload(); };

  const rk = route.data?.kpis;
  const vk = volume.data?.kpis;
  const uk = util.data?.kpis;
  const sk = svc.data?.kpis;

  const catPie = useMemo(() => (category.data?.rows || []).slice(0, 8).map((r) => ({ name: r.category, value: r.revenue })), [category.data]);
  const splitPie = useMemo(() => (sk ? [
    { name: 'Service', value: sk.serviceMinutes }, { name: 'Drive', value: sk.driveMinutes }, { name: 'Idle', value: sk.idleMinutes },
  ] : []), [sk]);
  const utilBars = useMemo(() => (util.data?.rows || []).slice(0, 15), [util.data]);

  const anyData = rk || vk || uk || sk;

  return (
    <div>
      <PageHeader title="Operations & Finance Overview" subtitle="Revenue, capacity, and time-use at a glance — straight from RouteStar closed invoices." />

      <div className="card p-3 mb-5 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      <AsyncSection loading={loading} error={error} data={anyData ? [anyData] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard label="Revenue" value={formatCurrency(rk?.revenue || 0)} tone="success" />
              <StatCard label="Stops" value={formatNumber(vk?.stops || rk?.stops || 0)} sublabel={`${formatNumber(vk?.routes || rk?.routes || 0)} routes`} tone="info" />
              <StatCard label="Revenue / stop" value={formatCurrency(rk?.revenuePerStop || 0)} />
              <StatCard label="Avg utilization" value={formatPercent(uk?.avgUtilizationPct || 0)} tone={(uk?.avgUtilizationPct || 0) >= 60 ? 'success' : 'warning'} sublabel={`${formatNumber(uk?.technicians || 0)} techs`} />
              <StatCard label="Idle / paperwork" value={formatMinutes(sk?.idleMinutes || 0)} sublabel={sk ? `${formatPercent(sk.idlePct)} of active` : ''} tone={(sk?.idlePct || 0) > 30 ? 'warning' : 'neutral'} />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <LineChartCard title="Stop volume by month" data={volume.data?.series || []} xKey="bucket" lines={[{ key: 'stops', label: 'Stops', color: '#2563EB' }]} />
              <PieChartCard title="Revenue by category" subtitle="top 8" data={catPie} nameKey="name" valueKey="value" />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <BarChartCard title="Revenue by route" data={route.data?.rows || []} xKey="routeCode" bars={[{ key: 'revenue', label: 'Revenue', color: '#2563EB' }]} />
              </div>
              <PieChartCard title="Where the day goes" subtitle="service vs drive vs idle" data={splitPie} nameKey="name" valueKey="value" />
            </div>

            <BarChartCard title="Technician utilization (%)" data={utilBars} xKey="technician" bars={[{ key: 'utilizationPct', label: 'Utilization %', color: '#10B981' }]} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
