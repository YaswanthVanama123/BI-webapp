import React, { useState } from 'react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Modal } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { formatNumber } from '@/utils/format';

const columns = [
  { key: 'sourceItemCode', header: 'Source item code' },
  { key: 'sourceDescription', header: 'Description' },
  { key: 'count', header: 'Lines affected', align: 'right', render: (r) => formatNumber(r.count) },
];

function MappingModal({ item, categoryOptions, onSaved, onClose }) {
  const [category, setCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const save = async () => {
    if (!category) { setErr('Choose a service category.'); return; }
    setBusy(true); setErr(null);
    try {
      await biService.createItemCategoryMapping({ matchType: 'exact_code', matchValue: item.sourceItemCode, serviceCategoryId: category, priority: 100, reviewStatus: 'approved' });
      await onSaved();
      onClose();
    } catch (e) {
      setErr((e && e.message) || 'Could not create mapping.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={item.sourceItemCode} subtitle={item.sourceDescription}>
      <div className="space-y-4">
        <div><div className="field-label">Lines affected</div><div className="text-dark-800">{formatNumber(item.count)}</div></div>
        <label className="flex flex-col"><span className="field-label">Service category</span>
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select a category…</option>
            {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        {err && <div className="text-xs text-danger-600">{err}</div>}
        <button className="btn-primary" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save mapping'}</button>
      </div>
    </Modal>
  );
}

export default function UnmappedItems() {
  const [selected, setSelected] = useState(null);
  const { data, loading, error, reload } = useApi(() => biService.unmappedServiceItems({}), []);
  const cats = useApi(() => biService.serviceCategories({}), []);
  const categoryOptions = (cats.data || []).map((c) => {
    const val = typeof c === 'string' ? c : (c._id || c.serviceCategoryId || c.categoryCode || c.name);
    const lbl = typeof c === 'string' ? c : (c.name || c.categoryCode || String(val));
    return { value: val, label: lbl };
  });

  return (
    <div>
      <PageHeader title="Unmapped Service Items" subtitle="RouteStar items with no category mapping — click a row to map it and pull it out of the Unmapped bucket." />
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {(rows) => <DataTable columns={columns} rows={rows} exportFilename="unmapped-service-items" initialSort={{ key: 'count', dir: 'desc' }} onRowClick={(r) => setSelected(r)} />}
      </AsyncSection>
      {selected && <MappingModal item={selected} categoryOptions={categoryOptions} onSaved={reload} onClose={() => setSelected(null)} />}
    </div>
  );
}
