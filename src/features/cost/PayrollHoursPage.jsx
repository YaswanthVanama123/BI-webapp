import React, { useEffect, useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatMinutes, formatNumber } from '@/utils/format';
import { getPayrollAnchor, onPayrollAnchorChange } from '@/utils/appSettings';

const toYMD = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseYMD = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmtShort = (ymd) => parseYMD(ymd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function buildPeriods(anchorYMD, count = 12) {
  const anchor = anchorYMD ? parseYMD(anchorYMD) : new Date();
  const out = [];
  for (let k = 0; k < count; k++) {
    const end = addDays(anchor, -14 * k);
    const start = addDays(end, -13);
    out.push({ from: toYMD(start), to: toYMD(end), label: `${fmtShort(toYMD(start))} – ${fmtShort(toYMD(end))}` });
  }
  return out;
}

const columns = [
  { key: 'technician', header: 'Technician' },
  { key: 'days', header: 'Days', align: 'right', render: (r) => formatNumber(r.days) },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'serviceMinutes', header: 'Service time', align: 'right', render: (r) => formatMinutes(r.serviceMinutes), csv: (r) => formatMinutes(r.serviceMinutes) },
  { key: 'drivingMinutes', header: 'Driving time', align: 'right', render: (r) => formatMinutes(r.drivingMinutes), csv: (r) => formatMinutes(r.drivingMinutes) },
  { key: 'lunchMinutes', header: 'Lunch', align: 'right', render: (r) => formatMinutes(r.lunchMinutes), csv: (r) => formatMinutes(r.lunchMinutes) },
  { key: 'totalMinutes', header: 'Total hours', align: 'right', render: (r) => formatMinutes(r.totalMinutes), csv: (r) => formatMinutes(r.totalMinutes) },
];

export default function PayrollHours() {
  const [anchor, setAnchor] = useState(getPayrollAnchor());
  useEffect(() => onPayrollAnchorChange(setAnchor), []);
  const periods = useMemo(() => buildPeriods(anchor), [anchor]);
  const [idx, setIdx] = useState(0);
  const period = periods[idx] || periods[0];

  useEffect(() => { setIdx(0); }, [anchor]);

  const { data, meta, loading, error, reload } = useApi(
    () => biService.payrollHours({ from: period.from, to: period.to }),
    [period.from, period.to],
  );
  const rows = data || [];

  return (
    <div>
      <PageHeader
        title="Payroll Hours"
        subtitle="Estimated hours worked per technician for a bi-weekly payroll period — invoice service time + driving time between stops + 1 hour lunch per working day."
      />
      <div className="card p-3 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <div className="field-label">Payroll period (bi-weekly)</div>
          <select className="field" value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
            {periods.map((p, i) => <option key={p.from} value={i}>{p.label}{i === 0 ? ' (latest)' : ''}</option>)}
          </select>
        </div>
        {!anchor && <div className="text-xs text-dark-400 max-w-sm">No payroll anchor set — using today as the anchor. Set the payroll date in Data Connections for accurate periods.</div>}
      </div>

      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {() => (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="Total hours" value={formatMinutes(meta?.totalMinutes || 0)} tone="success" />
              <StatCard label="Technicians" value={formatNumber(meta?.technicians || rows.length)} />
              <StatCard label="Days worked" value={formatNumber(meta?.days || 0)} />
              <StatCard label="Stops" value={formatNumber(meta?.stops || 0)} />
            </div>
            <DataTable columns={columns} rows={rows} exportFilename={`payroll-hours-${period.from}_${period.to}`} initialSort={{ key: 'totalMinutes', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
