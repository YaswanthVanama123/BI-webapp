import React from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatNumber } from '@/utils/format';

const columns = [
  { key: 'sourceItemCode', header: 'Source item code' },
  { key: 'sourceDescription', header: 'Description' },
  { key: 'count', header: 'Lines affected', align: 'right', render: (r) => formatNumber(r.count) },
];

export default function UnmappedItems() {
  const { data, loading, error, reload } = useApi(() => biService.unmappedServiceItems({}), []);
  return (
    <div>
      <PageHeader title="Unmapped Service Items" subtitle="RouteStar items with no category mapping — add a mapping to pull them out of the Unmapped bucket" />
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => <DataTable columns={columns} rows={rows} exportFilename="unmapped-service-items" initialSort={{ key: 'count', dir: 'desc' }} />}
      </AsyncSection>
    </div>
  );
}
