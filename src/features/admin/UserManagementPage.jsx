import React, { useState } from 'react';
import { RefreshCw, UserPlus, Trash2 } from 'lucide-react';
import useApi from '@/hooks/useApi';
import biService from '@/services/biService';
import { PageHeader, Badge, Modal } from '@/components/ui';
import AsyncSection from '@/components/ui/AsyncSection';
import DataTable from '@/components/ui/DataTable';
import { useAuth } from '@/contexts/AuthContext';

const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');

function UserFormModal({ user, onClose, onSaved }) {
  const editing = !!user;
  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'user');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setBusy(true);
    try {
      if (editing) {
        const body = { name, role };
        if (password) body.password = password;
        await biService.updateUser(user.id, body);
      } else {
        await biService.createUser({ username: username.trim(), name, role, password });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || 'Could not save user.');
    } finally { setBusy(false); }
  };

  return (
    <Modal open onClose={onClose} title={editing ? `Edit ${user.username}` : 'Add user'}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block"><span className="field-label">Username</span>
          <input className="field w-full" value={username} disabled={editing} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. jsmith" />
        </label>
        <label className="block"><span className="field-label">Full name</span>
          <input className="field w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
        </label>
        <label className="block"><span className="field-label">Role</span>
          <select className="field w-full" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <label className="block"><span className="field-label">{editing ? 'New password (leave blank to keep)' : 'Password'}</span>
          <input type="password" className="field w-full" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={editing ? '••••••••' : 'min 6 characters'} />
        </label>
        {error && <div className="rounded-md bg-danger-50 border border-danger-200 px-3 py-2 text-sm text-danger-700">{error}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={busy || (!editing && (!username || !password))}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function UserManagement() {
  const { user: current } = useAuth();
  const { data, loading, error, reload } = useApi(() => biService.users(), []);
  const [editing, setEditing] = useState(null);
  const rows = (data && (data.data || data)) || [];

  const toggleActive = async (u) => {
    try { await biService.updateUser(u.id, { active: !u.active }); reload(); }
    catch (e) { alert(e?.message || 'Could not update user.'); }
  };
  const remove = async (u) => {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try { await biService.deleteUser(u.id); reload(); }
    catch (e) { alert(e?.message || 'Could not delete user.'); }
  };

  const columns = [
    { key: 'username', header: 'Username' },
    { key: 'name', header: 'Name' },
    { key: 'role', header: 'Role', render: (r) => <Badge tone={r.role === 'admin' ? 'info' : 'neutral'}>{r.role}</Badge> },
    { key: 'active', header: 'Status', render: (r) => <Badge tone={r.active ? 'success' : 'danger'}>{r.active ? 'active' : 'disabled'}</Badge> },
    { key: 'lastLoginAt', header: 'Last login', render: (r) => fmtDate(r.lastLoginAt) },
    {
      key: '_actions', header: 'Actions', sortable: false, render: (r) => (
        <div className="flex items-center gap-2">
          <button className="text-primary-600 hover:underline text-xs" onClick={(e) => { e.stopPropagation(); setEditing(r); }}>Edit</button>
          {r.id !== current?.id && (
            <>
              <button className="text-dark-500 hover:underline text-xs" onClick={(e) => { e.stopPropagation(); toggleActive(r); }}>{r.active ? 'Disable' : 'Enable'}</button>
              <button className="text-danger-600 hover:underline text-xs inline-flex items-center gap-1" onClick={(e) => { e.stopPropagation(); remove(r); }}><Trash2 size={12} /></button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="User Management"
        subtitle="Create and manage login accounts. Admins can manage users; users get read access to the dashboard."
        actions={<div className="flex gap-2">
          <button className="btn-secondary" onClick={reload}><RefreshCw size={16} /> Refresh</button>
          <button className="btn-primary" onClick={() => setEditing({})}><UserPlus size={16} /> Add user</button>
        </div>}
      />
      <AsyncSection loading={loading} error={error} data={data} reload={reload} minEmpty>
        {() => <DataTable columns={columns} rows={rows} exportFilename="users" searchable={rows.length > 5} initialSort={{ key: 'username', dir: 'asc' }} onRowClick={(r) => setEditing(r)} />}
      </AsyncSection>
      {editing && <UserFormModal user={editing.id ? editing : null} onClose={() => setEditing(null)} onSaved={reload} />}
    </div>
  );
}
