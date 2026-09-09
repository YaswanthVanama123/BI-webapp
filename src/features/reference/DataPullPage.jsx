import React, { useEffect, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import { formatCurrency, formatDateShort, formatMinutes, formatNumber } from '@/utils/format';
import InvoiceLinesModal from '@/features/revenue/InvoiceLinesModal';

const NotSynced = () => <span className="text-dark-400">Not synced</span>;
const NotRecorded = () => <span className="text-dark-400">Not recorded</span>;

const columns = [
  { key: 'serviceDate', header: 'Service date', render: (r) => formatDateShort(r.serviceDate), sortValue: (r) => r.serviceDate || '' },
  { key: 'stopId', header: 'Stop ID' },
  { key: 'customerId', header: 'Customer ID' },
  { key: 'accountNumber', header: 'Account #', render: (r) => r.accountNumber || '—' },
  { key: 'customerName', header: 'Customer name' },
  { key: 'serviceAddress', header: 'Service address', render: (r) => r.serviceAddress || '—' },
  { key: 'routeId', header: 'Route ID' },
  { key: 'stopSequence', header: 'Stop seq', align: 'right', render: (r) => formatNumber(r.stopSequence) },
  { key: 'technicianId', header: 'Technician ID' },
  { key: 'serviceNotes', header: 'Technician type', render: (r) => r.serviceNotes || <NotRecorded /> },
  { key: 'checkIn', header: 'Check-in', render: (r) => r.checkIn || <NotRecorded /> },
  { key: 'checkOut', header: 'Check-out', render: (r) => r.checkOut || <NotRecorded /> },
  { key: 'travelMinutes', header: 'Travel time', align: 'right', render: (r) => (r.travelMinutes != null ? formatMinutes(r.travelMinutes) : <NotSynced />), csv: (r) => (r.travelMinutes != null ? formatMinutes(r.travelMinutes) : '') },
  { key: 'travelMiles', header: 'Travel miles', align: 'right', render: (r) => (r.travelMiles != null ? formatNumber(r.travelMiles) : <NotSynced />), csv: (r) => (r.travelMiles != null ? r.travelMiles : '') },
  { key: 'serviceCategory', header: 'Service category', render: (r) => r.serviceCategory || <NotRecorded /> },
  { key: 'serviceFrequency', header: 'Service frequency', render: (r) => r.serviceFrequency || '—' },
  { key: 'servicePhase', header: 'Service phase', render: (r) => r.servicePhase || '—' },
  { key: 'revenueAmount', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.revenueAmount), csv: (r) => formatCurrency(r.revenueAmount) },
  { key: 'chemicalSupplyCost', header: 'Chemical/supply cost', align: 'right', render: (r) => (r.chemicalSupplyCost != null ? formatCurrency(r.chemicalSupplyCost) : '—'), csv: (r) => (r.chemicalSupplyCost != null ? formatCurrency(r.chemicalSupplyCost) : '') },
  { key: 'accountStatus', header: 'Account status', render: (r) => r.accountStatus || '—' },
  { key: 'statusDate', header: 'Status date', render: (r) => (r.statusDate ? formatDateShort(r.statusDate) : '—') },
  { key: 'billingCadence', header: 'Billing cadence', render: (r) => r.billingCadence || '—' },
  { key: 'billingAmount', header: 'Billing amount', align: 'right', render: (r) => (r.billingAmount != null ? formatCurrency(r.billingAmount) : '—'), csv: (r) => (r.billingAmount != null ? formatCurrency(r.billingAmount) : '') },
];

const PAGE_SIZE = 50;

export default function DataPull() {
  const [range, setRange] = useState({ preset: 'this_year', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const { from, to } = range;

  useEffect(() => { setPage(1); }, [from, to, q]);
  const { data, meta, page: pageInfo, loading, error, reload } = useApi(
    () => biService.dataPull({ from: from || undefined, to: to || undefined, q: q || undefined, page, pageSize: PAGE_SIZE }),
    [from, to, q, page],
  );
  const rows = data || [];
  const total = (pageInfo && pageInfo.total) || (meta && meta.total) || 0;

  const exportAll = async () => {
    const res = await biService.dataPull({ from: from || undefined, to: to || undefined, q: q || undefined, pageSize: 'all' });
    return (res && res.data) || [];
  };

  const subtitle = `One row per completed stop, joined from RouteStar invoices, customer accounts and Mapbox distances. ${formatNumber(total)} stops. Export downloads all rows.`;

  return (
    <div>
      <PageHeader title="Data Export" subtitle={subtitle} />
      <div className="card p-3 mb-4 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>
      <div className="text-xs text-dark-400 mb-3">
        Travel time / miles are 0 for the first stop of a route-day and for back-to-back stops at the same customer. “Not synced” means the Mapbox distance for that customer pair has not been computed yet — run Sync on Distances / Driving Time; it exports as an empty cell so totals are not skewed. “Not recorded” means the field is empty on the RouteStar invoice. Chemical/supply cost comes from an external source (EnviroMaster Store / Bigin) not yet connected. Status date is the customer’s most recent activity date. Service phase is derived from frequency (recurring vs one-time).
      </div>
      <AsyncSection loading={loading} error={error} data={data} reload={reload}>
        {() => (
          <DataTable
            columns={columns}
            rows={rows}
            exportFilename="bi-data-pull"
            searchable
            searchPlaceholder="Search all stops…"
            onServerSearch={setQ}
            serverSide
            serverTotal={total}
            page={page}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            onExportAll={exportAll}
            onRowClick={(r) => r.stopId && setSelected(r.stopId)}
          />
        )}
      </AsyncSection>
      {selected && <InvoiceLinesModal invoiceNumber={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
