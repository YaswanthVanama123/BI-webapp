import React from 'react';
import { useFilters } from '@/contexts/FiltersContext';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { BarChartCard } from '@/components/charts';
import { formatCurrency, formatNumber, formatPercent, toNumber } from '@/utils/format';

const columns = [
  { key: 'routeCode', header: 'Route' },
  { key: 'totalRevenue', header: 'Revenue', align: 'right', render: (r) => formatCurrency(r.totalRevenue) },
  { key: 'laborCost', header: 'Labor', align: 'right', render: (r) => formatCurrency(r.laborCost) },
  { key: 'supplyCost', header: 'Supply', align: 'right', render: (r) => formatCurrency(r.supplyCost) },
  { key: 'vehicleCost', header: 'Vehicle*', align: 'right', render: (r) => formatCurrency(r.vehicleCost) },
  { key: 'estContributionMargin', header: 'Contribution', align: 'right', render: (r) => formatCurrency(r.estContributionMargin) },
  { key: 'contributionPerStop', header: 'Contribution / stop', align: 'right', render: (r) => formatCurrency(r.contributionPerStop) },
  { key: 'marginPct', header: 'Margin', align: 'right', render: (r) => <Badge tone={toNumber(r.marginPct) >= 60 ? 'success' : 'warning'}>{formatPercent(r.marginPct)}</Badge>, csv: (r) => r.marginPct },
];

export default function RouteProfitability() {
  const { filters } = useFilters();
  const { data, loading, error, reload } = useApi(() => biService.routeProfitability(filters.routeCode, filters), [JSON.stringify(filters)]);
  return (
    <div>
      <PageHeader title="Route Profitability" subtitle="Revenue − allocated labor/supply/vehicle. *Vehicle allocation basis is business-confirmable." />
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => (
          <div className="space-y-4">
            <BarChartCard title="Revenue vs cost stack by route" data={rows} xKey="routeCode" bars={[
              { key: 'laborCost', label: 'Labor', color: '#F59E0B', stackId: 'c' },
              { key: 'supplyCost', label: 'Supply', color: '#8B5CF6', stackId: 'c' },
              { key: 'vehicleCost', label: 'Vehicle', color: '#EF4444', stackId: 'c' },
              { key: 'estContributionMargin', label: 'Contribution', color: '#10B981', stackId: 'c' },
            ]} />
            <DataTable columns={columns} rows={rows} exportFilename="route-profitability" initialSort={{ key: 'estContributionMargin', dir: 'desc' }} />
          </div>
        )}
      </AsyncSection>
    </div>
  );
}
