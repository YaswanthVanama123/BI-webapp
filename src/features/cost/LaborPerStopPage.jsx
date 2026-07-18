import React from 'react';
import { useFilters } from '@/contexts/FiltersContext';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { BarChartCard } from '@/components/charts';
import { formatCurrency, formatNumber } from '@/utils/format';

const columns = [
  { key: 'routeCode', header: 'Route' },
  { key: 'stops', header: 'Stops', align: 'right', render: (r) => formatNumber(r.stops) },
  { key: 'laborCost', header: 'Labor cost', align: 'right', render: (r) => formatCurrency(r.laborCost) },
  { key: 'laborCostPerStop', header: 'Labor / stop', align: 'right', render: (r) => formatCurrency(r.laborCostPerStop) },
  { key: 'revenuePerStop', header: 'Revenue / stop', align: 'right', render: (r) => formatCurrency(r.revenuePerStop) },
  { key: 'contributionPerStop', header: 'Contribution / stop', align: 'right', render: (r) => formatCurrency(r.contributionPerStop) },
];

export default function LaborPerStop() {
  const { filters } = useFilters();
  const { data, loading, error, reload } = useApi(() => biService.laborCostPerStop(filters), [JSON.stringify(filters)]);
  return (
    <div>
      <PageHeader title="Labor Cost per Stop" subtitle="Allocated labor cost ÷ completed stops, and contribution per stop by route" />
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => (
          <div className="space-y-4">
            <BarChartCard title="Revenue vs labor vs contribution per stop" data={rows} xKey="routeCode" bars={[
              { key: 'revenuePerStop', label: 'Revenue / stop', color: '#2563EB' },
              { key: 'laborCostPerStop', label: 'Labor / stop', color: '#F59E0B' },
              { key: 'contributionPerStop', label: 'Contribution / stop', color: '#10B981' },
            ]} />
            <DataTable columns={columns} rows={rows} exportFilename="labor-cost-per-stop" initialSort={{ key: 'contributionPerStop', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
