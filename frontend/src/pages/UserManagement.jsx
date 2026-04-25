import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api';
import { Modal, Spinner, EmptyState, ErrorBanner } from '../components';
import { PlusIcon, PencilIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';

const EMPTY = { name: '', email: '', password: '', role: 'User' };

function UserForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    try {
      if (initial?.id) {
        await usersApi.update(initial.id, { name: form.name, email: form.email, role: form.role });
      } else {
        await usersApi.create(form);
      }
      onSave();
    } catch (ex) {
      setErr(ex.response?.data?.detail || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <ErrorBanner message={err} />}
      <div className="space-y-3">
        <div>
          <label className="label">Name *</label>
          <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="label">Email *</label>
          <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} />
        </div>
        {!initial?.id && (
          <div>
            <label className="label">Password *</label>
            <input className="input" type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Role</label>
          <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
            <option value="User">User</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Cashier">Cashier</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </form>
  );
}

export default function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    usersApi.list().then(r => setUsers(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'Active' ? 'activate' : 'revoke access for'} this user?`)) return;
    try {
      await usersApi.updateStatus(id, { status: newStatus });
      load();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="mt-1 text-sm text-slate-500">Manage system administrators and staff accounts.</p>
        </div>
        <button 
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 flex items-center gap-2"
          onClick={() => { setSelected(null); setModal(true); }}
        >
          <PlusIcon className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? <div className="p-8"><Spinner /></div> : users.length === 0 ? <div className="p-8"><EmptyState /></div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {users.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold uppercase">
                          {person.name?.charAt(0) || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">{person.name}</div>
                          <div className="text-sm text-slate-500">{person.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${person.role === 'Admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {person.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${person.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {person.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" 
                          onClick={() => { setSelected(person); setModal(true); }}
                          title="Edit User"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        
                        {person.email !== user.email && (
                          <button 
                            className={`p-1.5 rounded transition-colors ${person.status === 'Active' ? 'hover:bg-red-50 text-red-600' : 'hover:bg-green-50 text-green-600'}`}
                            onClick={() => handleToggleStatus(person.id, person.status)}
                            title={person.status === 'Active' ? "Revoke Access" : "Activate"}
                          >
                            {person.status === 'Active' ? <LockClosedIcon className="w-5 h-5" /> : <LockOpenIcon className="w-5 h-5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <Modal title={selected ? 'Edit User' : 'Add User'} onClose={() => setModal(false)}>
          <UserForm 
            initial={selected} 
            onSave={() => { setModal(false); load(); }} 
            onClose={() => setModal(false)} 
          />
        </Modal>
      )}
    </div>
  );
}
