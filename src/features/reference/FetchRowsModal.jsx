import React from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { Modal } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatNumber } from '@/utils/format';

const fetchRowCols = [
  { key: 'customerName', header: 'Customer' },
  { key: 'customerId', header: 'RouteStar ID' },
  { key: 'accountNumber', header: 'Account #', render: (r) => r.accountNumber || '—' },
  { key: 'pricingCount', header: 'Pricing', align: 'right', render: (r) => formatNumber(r.pricingCount) },
  { key: 'routesCount', header: 'Routes', align: 'right', render: (r) => formatNumber(r.routesCount) },
  { key: 'activityCount', header: 'Activity', align: 'right', render: (r) => formatNumber(r.activityCount) },
  { key: 'status', header: 'Fetch status', render: (r) => r.status || '—' },
  { key: 'fetchedAt', header: 'Fetched at', render: (r) => (r.fetchedAt ? new Date(r.fetchedAt).toLocaleString() : '—') },
];

export default function FetchRowsModal({ runId, onClose }) {
  const { data, meta, loading, error, reload } = useApi(
    () => biService.accountFetchRows({ runId: runId || undefined, pageSize: 'all' }),
    [runId],
  );
  const rows = data || [];
  const run = meta?.run;
  const total = meta?.total || rows.length;
  return (
    <Modal open onClose={onClose} title="Data stored in this sync" subtitle={`${formatNumber(total)} customer(s) stored${meta?.runId ? ` · run ${meta.runId}` : ''}`} size="lg">
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {() => (
          <div className="space-y-3">
            {run && (
              <div className="text-xs text-dark-500">
                Started {new Date(run.startedAt).toLocaleString()} · {run.status}
                {run.summary ? ` · discovered ${formatNumber(run.summary.discovered || 0)}, fetched ${formatNumber(run.summary.stored || 0)}, with account # ${formatNumber(run.summary.withAccount || 0)}` : ''}
              </div>
            )}
            {rows.length
              ? <DataTable columns={fetchRowCols} rows={rows} exportFilename="fetched-rows" initialSort={{ key: 'customerName', dir: 'asc' }} />
              : <div className="text-sm text-dark-400">No customer rows were stored in this run.</div>}
          </div>
        )}
      </AsyncSection>
    </Modal>
  );
}
