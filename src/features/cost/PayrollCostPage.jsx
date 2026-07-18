import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useFilters } from '@/contexts/FiltersContext';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatCurrency, formatNumber } from '@/utils/format';

const columns = [
  { key: 'employee', header: 'Employee' },
  { key: 'department', header: 'Department' },
  { key: 'appliedRate', header: 'Rate', align: 'right', render: (r) => formatCurrency(r.appliedRate) },
  { key: 'regularHours', header: 'Regular hrs', align: 'right', render: (r) => formatNumber(r.regularHours) },
  { key: 'overtimeHours', header: 'OT hrs', align: 'right', render: (r) => formatNumber(r.overtimeHours) },
  { key: 'grossPay', header: 'Gross pay', align: 'right', render: (r) => formatCurrency(r.grossPay) },
  { key: 'burdenedCost', header: 'Burdened cost', align: 'right', render: (r) => formatCurrency(r.burdenedCost) },
];

function UploadPayroll({ onDone }) {
  const inputRef = useRef(null);
  const [state, setState] = useState({ busy: false, msg: null, tone: 'neutral' });

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setState({ busy: true, msg: `Uploading ${file.name}…`, tone: 'neutral' });
    try {
      const res = await biService.uploadPayrollCsv(file);
      const d = res?.data || {};
      const c = d.counts || {};
      setState({ busy: false, tone: 'success', msg: `Imported ${d.rowsParsed} rows (ins ${c.inserted || 0}, upd ${c.updated || 0}, rej ${c.rejected || 0}).` });
      onDone?.();
    } catch (err) {
      setState({ busy: false, tone: 'danger', msg: err?.message || 'Upload failed' });
    }
  };

  return (
    <div className="flex items-center gap-3">
      {state.msg && (
        <span className={state.tone === 'success' ? 'text-xs text-success-700' : state.tone === 'danger' ? 'text-xs text-danger-700' : 'text-xs text-dark-500'}>
          {state.msg}
        </span>
      )}
      <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
      <button className="btn-primary" disabled={state.busy} onClick={() => inputRef.current?.click()}>
        <Upload size={16} /> {state.busy ? 'Uploading…' : 'Upload payroll CSV'}
      </button>
    </div>
  );
}

export default function PayrollCost() {
  const { filters } = useFilters();
  const { data, loading, error, reload } = useApi(() => biService.payrollCost(filters), [JSON.stringify(filters)]);
  return (
    <div>
      <PageHeader
        title="Payroll Cost"
        subtitle="ADP payroll by employee. Upload a payroll CSV to import hours — stored automatically and folded into utilization."
        actions={<UploadPayroll onDone={reload} />}
      />
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => <DataTable columns={columns} rows={rows} exportFilename="payroll-cost" initialSort={{ key: 'burdenedCost', dir: 'desc' }} />}
      </AsyncSection>
    </div>
  );
}
