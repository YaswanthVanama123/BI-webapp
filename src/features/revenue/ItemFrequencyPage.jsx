import React, { useMemo, useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, StatCard } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import DateRangeFilter from '@/components/filters/DateRangeFilter';
import RouteTabs from '@/components/filters/RouteTabs';
import { defaultRange } from '@/utils/dateRanges';
import { formatCurrency, formatNumber } from '@/utils/format';
import DrillModal from './DrillModal';

const columns = [
  { key: 'item', header: 'Item' },
  { key: 'category', header: 'Category' },
  { key: 'frequency', header: 'Frequency', render: (r) => r.frequency || '—' },
  { key: 'perYear', header: 'Per year', align: 'right', render: (r) => (r.perYear ? formatNumber(r.perYear) : '—') },
  { key: 'invoices', header: 'Invoices', align: 'right', render: (r) => formatNumber(r.invoices) },
  { key: 'customers', header: 'Customers', align: 'right', render: (r) => formatNumber(r.customers) },
  { key: 'qty', header: 'Qty', align: 'right', render: (r) => formatNumber(r.qty) },
  { key: 'invoiced', header: 'Invoiced', align: 'right', render: (r) => formatCurrency(r.invoiced) },
];

export default function ItemFrequency() {
  const [range, setRange] = useState(defaultRange());
  const [freq, setFreq] = useState('all');
  const [selected, setSelected] = useState(null);
  const { from, to } = range;
  const { data, loading, error, reload } = useApi(() => biService.itemFrequency({ from, to }), [from, to]);
  const k = data && data.kpis;
  const rows = (data && data.rows) || [];
  const freqOptions = useMemo(() => [...new Set(rows.map((r) => r.frequency).filter(Boolean))].sort(), [rows]);
  const filtered = useMemo(() => rows.filter((r) => freq === 'all' || r.frequency === freq), [rows, freq]);

  return (
    <div>
      <PageHeader title="Item Frequency" subtitle="Every service item invoiced in the selected period, with its billing frequency and how many invoices/customers it appears on. Click an item to see the invoices that contain it." />
      <div className="card p-3 mb-4 flex flex-wrap items-end gap-3">
        <DateRangeFilter value={range} onChange={setRange} />
      </div>
      <RouteTabs routes={freqOptions} value={freq} onChange={setFreq} allLabel="All frequencies" className="mb-4" />

      <AsyncSection loading={loading} error={error} data={k ? [k] : null} reload={reload} minEmpty>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Items" value={formatNumber(k.items)} tone="info" />
              <StatCard label="Line occurrences" value={formatNumber(k.occurrences)} />
              <StatCard label="Invoices" value={formatNumber(k.invoices)} />
              <StatCard label="Invoiced" value={formatCurrency(k.invoiced)} tone="success" />
            </div>
            <DataTable columns={columns} rows={filtered} exportFilename="item-frequency" initialSort={{ key: 'invoiced', dir: 'desc' }} onRowClick={(r) => setSelected(r)} />
          </div>
        )}
      </AsyncSection>

      {selected && (
        <DrillModal
          title={`${selected.item}${selected.frequency ? ` · ${selected.frequency}` : ''}`}
          subtitle="Invoices containing this item at this frequency"
          filter={{ category: selected.item, frequency: selected.frequency || '(none)' }}
          range={range}
          defaultTab="invoices"
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
