import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard, Badge, Modal } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { defaultRange } from '@/utils/dateRanges';
import { BarChartCard } from '@/components/charts';
import { formatMinutes, formatNumber, formatCurrency, formatDateShort, statusTone } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/InvoiceLinesModal';

const columns = (open) => [
  { key: 'technician', header: 'Technician' },
  { key: 'stops', header: 'Total stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'activeDays', header: 'Active days', align: 'right', render: (r) => formatNumber(r.activeDays) },
  { key: 'avgStopsPerDay', header: 'Avg / day', align: 'right', render: (r) => formatNumber(r.avgStopsPerDay) },
  { key: 'serviceMinutes', header: 'Service time', align: 'right', render: (r) => formatMinutes(r.serviceMinutes) },
  { key: 'avgServicePerStop', header: 'Svc / stop', align: 'right', render: (r) => formatMinutes(r.avgServicePerStop) },
];

const stopColumns = [
  { key: 'invoiceNumber', header: 'Invoice #' },
  { key: 'invoiceDate', header: 'Date', render: (r) => formatDateShort(r.invoiceDate), sortValue: (r) => r.invoiceDate || '' },
  { key: 'customer', header: 'Customer' },
  { key: 'status', header: 'Status', render: (r) => (r.status ? <Badge tone={statusTone(r.status)}>{r.status}</Badge> : '-') },
  { key: 'arrivalTime', header: 'Arrival', render: (r) => r.arrivalTime || '-' },
  { key: 'departureTime', header: 'Departure', render: (r) => r.departureTime || '-' },
  { key: 'lineItemCount', header: 'Lines', align: 'right', render: (r) => formatNumber(r.lineItemCount) },
  { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
];

function TechnicianStopsModal({ technician, range, onClose }) {
  const { from, to } = range;
  const { data, loading, error, reload } = useApi(() => biService.closedInvoices({ from, to, routeCode: technician, pageSize: 'all' }), [technician, from, to]);
  const [invoice, setInvoice] = useState(null);
  const rows = data || [];
  return (
    <Modal open onClose={onClose} title={`Stops — ${technician}`} subtitle={`${rows.length} closed invoices in range — click a row for line items`}>
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {() => (
          <DataTable columns={stopColumns} rows={rows} exportFilename={`stops-${technician}`} onRowClick={(r) => setInvoice(r.invoiceNumber)} initialSort={{ key: 'invoiceDate', dir: 'desc' }} />
        )}
      </AsyncSection>
      {invoice && <InvoiceLinesModal invoiceNumber={invoice} onClose={() => setInvoice(null)} />}
    </Modal>
  );
}

export default function StopsPerTechnician() {
  const opts = useApi(() => biService.driveTimeOptions(), []);
  const [range, setRange] = useState(defaultRange());
  const [routeCode, setRouteCode] = useState('all');
  const [selected, setSelected] = useState(null);
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
      <PageHeader title="Stops per Technician" subtitle="Completed stops per technician over the period. Click a technician to see their stops (invoices) and line items." />
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
            <DataTable columns={columns(setSelected)} rows={rows} exportFilename="stops-per-technician" initialSort={{ key: 'stops', dir: 'desc' }} onRowClick={(r) => setSelected(r.technician)} />
          </div>
        )}
      </AsyncSection>

      {selected && <TechnicianStopsModal technician={selected} range={range} onClose={() => setSelected(null)} />}
    </div>
  );
}
