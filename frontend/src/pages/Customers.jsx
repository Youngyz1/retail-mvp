import React, { useEffect, useState, useCallback } from 'react';
import { customersApi } from '../api';
import { Modal, PageHeader, Spinner, EmptyState, ErrorBanner, TierBadge, OrderStatusBadge } from '../components';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

const EMPTY = { ref:'', name:'', email:'', phone:'', address:'', date_of_birth:'', tier:'STANDARD', notes:'' };

function CustomerForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [err, setErr]   = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const payload = { ...form, date_of_birth: form.date_of_birth || null };
      if (initial?.id) await customersApi.update(initial.id, payload);
      else             await customersApi.create(payload);
      onSave();
    } catch(ex) { setErr(ex.response?.data?.detail||'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <ErrorBanner message={err} />}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Ref *</label>
          <input className="input" required value={form.ref} onChange={e=>set('ref',e.target.value)} placeholder="CUS-001" /></div>
        <div><label className="label">Name *</label>
          <input className="input" required value={form.name} onChange={e=>set('name',e.target.value)} /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={e=>set('email',e.target.value)} /></div>
        <div><label className="label">Phone</label>
          <input className="input" value={form.phone} onChange={e=>set('phone',e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Address</label>
          <input className="input" value={form.address} onChange={e=>set('address',e.target.value)} /></div>
        <div><label className="label">Date of Birth</label>
          <input className="input" type="date" value={form.date_of_birth||''} onChange={e=>set('date_of_birth',e.target.value)} /></div>
        <div><label className="label">Tier</label>
          <select className="input" value={form.tier} onChange={e=>set('tier',e.target.value)}>
            {['STANDARD','SILVER','GOLD','VIP'].map(t=><option key={t} value={t}>{t}</option>)}
          </select></div>
        <div className="col-span-2"><label className="label">Notes</label>
          <textarea className="input" rows={2} value={form.notes||''} onChange={e=>set('notes',e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':'Save'}</button>
      </div>
    </form>
  );
}

function OrderHistory({ customerId, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    customersApi.orders(customerId).then(r=>setOrders(r.data)).finally(()=>setLoading(false));
  }, [customerId]);
  return (
    <div>
      {loading ? <Spinner /> : orders.length===0 ? <EmptyState message="No orders yet." /> : (
        <table className="w-full">
          <thead className="bg-slate-50"><tr>
            <th className="th">Ref</th><th className="th">Total</th><th className="th">Status</th><th className="th">Date</th>
          </tr></thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map(o => {
              const total = (o.items || []).reduce((s,i)=>s+Number(i.subtotal),0);
              return (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="td font-mono text-xs">{o.order_ref}</td>
                  <td className="td font-semibold">${total.toFixed(2)}</td>
                  <td className="td"><OrderStatusBadge status={o.status} /></td>
                  <td className="td text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="flex justify-end pt-4"><button className="btn-secondary" onClick={onClose}>Close</button></div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    customersApi.list({ search }).then(r=>setCustomers(r.data)).finally(()=>setLoading(false));
  }, [search]);

  useEffect(()=>{load();},[load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    await customersApi.delete(id); load();
  };

  return (
    <div>
      <PageHeader title="Customers (CRM)" subtitle={`${customers.length} customers`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={()=>{setSelected(null);setModal('form');}}>
            <PlusIcon className="w-4 h-4" /> Add Customer
          </button>
        }
      />
      <div className="card">
        <div className="mb-4">
          <input className="input max-w-xs" placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {loading ? <Spinner /> : customers.length===0 ? <EmptyState /> : (
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="th">Ref</th><th className="th">Name</th><th className="th">Email</th>
              <th className="th">Phone</th><th className="th">Tier</th><th className="th">Since</th><th className="th">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map(c=>(
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="td font-mono text-xs text-slate-500">{c.ref}</td>
                  <td className="td font-medium">{c.name}</td>
                  <td className="td text-slate-500">{c.email||'—'}</td>
                  <td className="td text-slate-500">{c.phone||'—'}</td>
                  <td className="td"><TierBadge tier={c.tier} /></td>
                  <td className="td text-slate-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="td">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded hover:bg-violet-50 text-violet-600" onClick={()=>{setSelected(c);setModal('history');}}>
                        <EyeIcon className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600" onClick={()=>{setSelected(c);setModal('form');}}>
                        <PencilIcon className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-red-500" onClick={()=>handleDelete(c.id)}>
                        <TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal==='form' && (
        <Modal title={selected?'Edit Customer':'Add Customer'} onClose={()=>setModal(null)}>
          <CustomerForm initial={selected} onSave={()=>{setModal(null);load();}} onClose={()=>setModal(null)} />
        </Modal>
      )}
      {modal==='history' && selected && (
        <Modal title={`Orders — ${selected.name}`} onClose={()=>setModal(null)} wide>
          <OrderHistory customerId={selected.id} onClose={()=>setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
