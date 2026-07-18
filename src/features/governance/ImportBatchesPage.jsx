import React from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatDateShort, formatNumber, statusTone } from '@/utils/format';

const columns = [
  { key: 'sourceSystem', header: 'Source' },
  { key: 'sourceEntity', header: 'Entity' },
  { key: 'status', header: 'Status', render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
  { key: 'startedAt', header: 'Started', render: (r) => formatDateShort(r.startedAt) },
  { key: 'read', header: 'Read', align: 'right', render: (r) => formatNumber(r.counts?.read), csv: (r) => r.counts?.read },
  { key: 'inserted', header: 'Inserted', align: 'right', render: (r) => formatNumber(r.counts?.inserted), csv: (r) => r.counts?.inserted },
  { key: 'updated', header: 'Updated', align: 'right', render: (r) => formatNumber(r.counts?.updated), csv: (r) => r.counts?.updated },
  { key: 'unchanged', header: 'Unchanged', align: 'right', render: (r) => formatNumber(r.counts?.unchanged), csv: (r) => r.counts?.unchanged },
  { key: 'rejected', header: 'Rejected', align: 'right', render: (r) => formatNumber(r.counts?.rejected), csv: (r) => r.counts?.rejected },
];

export default function ImportBatches() {
  const { data, loading, error, reload } = useApi(() => biService.importBatches({}), []);
  return (
    <div>
      <PageHeader title="Import Batches" subtitle="ETL run history and reconciliation counts per source" />
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => <DataTable columns={columns} rows={rows} exportFilename="import-batches" initialSort={{ key: 'startedAt', dir: 'desc' }} />}
      </AsyncSection>
    </div>
  );
}
