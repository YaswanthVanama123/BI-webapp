import React, { useState } from 'react';
import { Check } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { severityTone, formatDateShort, statusTone } from '@/utils/format';

export default function DataQuality() {
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('open');
  const [resolved, setResolved] = useState({});
  const params = { ...(severity !== 'all' && { severity }), ...(status !== 'all' && { resolutionStatus: status }) };
  const { data, loading, error, reload } = useApi(() => biService.dataQualityIssues(params), [severity, status]);

  const resolve = async (id) => {
    await biService.resolveDataQualityIssue(id, { resolutionStatus: 'resolved', resolvedBy: 'ui', resolutionNotes: 'Resolved from dashboard' });
    setResolved((r) => ({ ...r, [id]: true }));
  };

  const columns = [
    { key: 'severity', header: 'Severity', render: (r) => <Badge tone={severityTone(r.severity)}>{r.severity}</Badge> },
    { key: 'issueType', header: 'Type' },
    { key: 'collectionName', header: 'Collection' },
    { key: 'description', header: 'Description' },
    { key: 'detectedAt', header: 'Detected', render: (r) => formatDateShort(r.detectedAt) },
    {
      key: 'resolutionStatus', header: 'Status', sortable: false,
      render: (r) => <Badge tone={resolved[r._id] ? 'success' : statusTone(r.resolutionStatus)}>{resolved[r._id] ? 'resolved' : r.resolutionStatus}</Badge>,
      csv: (r) => (resolved[r._id] ? 'resolved' : r.resolutionStatus),
    },
    {
      key: 'action', header: '', sortable: false, exportable: false,
      render: (r) => (resolved[r._id] ? null : <button className="btn-secondary py-1" onClick={() => resolve(r._id)}><Check size={14} /> Resolve</button>),
    },
  ];

  return (
    <div>
      <PageHeader title="Data Quality" subtitle="Automated checks & reconciliation issues — resolve or export for review" />
      <div className="flex flex-wrap gap-3 mb-4">
        <select className="field max-w-[180px]" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          {['all', 'critical', 'error', 'warning', 'info'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All severities' : s}</option>)}
        </select>
        <select className="field max-w-[180px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          {['all', 'open', 'acknowledged', 'resolved', 'ignored'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s}</option>)}
        </select>
      </div>
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => <DataTable columns={columns} rows={rows} exportFilename="data-quality-issues" />}
      </AsyncSection>
    </div>
  );
}
