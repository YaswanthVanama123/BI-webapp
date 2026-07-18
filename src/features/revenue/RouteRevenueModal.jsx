import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { Modal, StatCard, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/format';
import CustomerRevenueModal from './CustomerRevenueModal';

const pctTone = (p) => (p == null ? 'neutral' : p >= 90 ? 'success' : p >= 50 ? 'warning' : 'danger');

const customerColumns = [
  { key: 'customer', header: 'Customer' },
  { key: 'expected', header: 'Expected (yr)', align: 'right', render: (r) => formatCurrency(r.expected) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
  { key: 'remaining', header: 'Remaining', align: 'right', render: (r) => formatCurrency(r.remaining) },
  { key: 'pct', header: 'Collected', align: 'right', render: (r) => (r.pct != null ? <Badge tone={pctTone(r.pct)}>{formatPercent(r.pct)}</Badge> : '—') },
  { key: 'invoices', header: 'Stops', align: 'right', render: (r) => formatNumber(r.invoices) },
];

export default function RouteRevenueModal({ routeCode, range, onClose }) {
  const { from, to } = range || {};
  const { data, loading, error, reload } = useApi(() => biService.revenueByCustomer({ from, to, routeCode }), [routeCode, from, to]);
  const [customer, setCustomer] = useState(null);
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  return (
    <Modal open onClose={onClose} title={`Route ${routeCode}`} subtitle="Customers on this route — click a customer for items & invoices">
      <AsyncSection loading={loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Expected (yr)" value={formatCurrency(k.expected)} tone="info" />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
              <StatCard label="Remaining" value={formatCurrency(k.remaining)} tone={k.remaining > 0 ? 'warning' : 'success'} />
              <StatCard label="Customers" value={formatNumber(k.customers)} />
            </div>
            <DataTable columns={customerColumns} rows={rows} exportFilename={`revenue-route-${routeCode}`} onRowClick={(r) => setCustomer(r.customerId)} initialSort={{ key: 'invoiced', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
      {customer && <CustomerRevenueModal customerId={customer} range={range} onClose={() => setCustomer(null)} />}
    </Modal>
  );
}
