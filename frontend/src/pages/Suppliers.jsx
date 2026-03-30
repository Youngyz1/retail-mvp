import React, { useEffect, useState, useCallback } from 'react';
import { suppliersApi, purchaseOrdersApi, productsApi } from '../api';
import { Modal, PageHeader, Spinner, EmptyState, ErrorBanner } from '../components';
import { PlusIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

function SupplierForm({ initial, onSave, onClose }) {
  const EMPTY = { name:'', contact_email:'', phone:'', address:'', lead_time_days:7 };
  const [form, setForm] = useState(initial || EMPTY);
  const [err, setErr]   = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      if (initial?.id) await suppliersApi.update(initial.id, form);
      else             await suppliersApi.create(form);
      onSave();
    } catch(ex) { setErr(ex.response?.data?.detail||'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <ErrorBanner message={err} />}
      <div><label className="label">Name *</label>
        <input className="input" required value={form.name} onChange={e=>set('name',e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Email</label>
          <input className="input" type="email" value={form.contact_email||''} onChange={e=>set('contact_email',e.target.value)} /></div>
        <div><label className="label">Phone</label>
          <input className="input" value={form.phone||''} onChange={e=>set('phone',e.target.value)} /></div>
      </div>
      <div><label className="label">Address</label>
        <textarea className="input" rows={2} value={form.address||''} onChange={e=>set('address',e.target.value)} /></div>
      <div><label className="label">Lead Time (days)</label>
        <input className="input" type="number" min="1" value={form.lead_time_days} onChange={e=>set('lead_time_days',Number(e.target.value))} /></div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':'Save'}</button>
      </div>
    </form>
  );
}

function NewPOModal({ suppliers, onSave, onClose }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ supplier_id:'', notes:'', expected_at:'', items:[] });
  const [err, setErr]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { productsApi.list().then(r=>setProducts(r.data)); }, []);

  const addItem = () => setForm(f=>({...f,items:[...f.items,{product_id:'',quantity:1,unit_cost:''}]}));
  const removeItem = i => setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}));
  const setItem = (i,k,v) => setForm(f=>{const items=[...f.items];items[i]={...items[i],[k]:v};return{...f,items};});

  const poTotal = form.items.reduce((s,i) => s + (Number(i.unit_cost||0) * Number(i.quantity||0)), 0);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await purchaseOrdersApi.create({
        supplier_id: Number(form.supplier_id),
        notes: form.notes,
        expected_at: form.expected_at || null,
        items: form.items.map(i=>({ product_id:Number(i.product_id), quantity:Number(i.quantity), unit_cost:Number(i.unit_cost) })),
      });
      onSave();
    } catch(ex) { setErr(ex.response?.data?.detail||'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <ErrorBanner message={err} />}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className="label">Supplier *</label>
          <select className="input" required value={form.supplier_id} onChange={e=>setForm(f=>({...f,supplier_id:e.target.value}))}>
            <option value="">— Select —</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select></div>
        <div><label className="label">Expected Date</label>
          <input className="input" type="date" value={form.expected_at} onChange={e=>setForm(f=>({...f,expected_at:e.target.value}))} /></div>
        <div><label className="label">Notes</label>
          <input className="input" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label mb-0">Items *</label>
          <button type="button" className="btn-secondary btn-sm flex items-center gap-1" onClick={addItem}>
            <PlusIcon className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>
        {form.items.length===0 && <p className="text-slate-400 text-sm">No items yet.</p>}
        <div className="space-y-2">
          {form.items.map((item,i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-end border border-slate-200 rounded-lg p-3">
              <div className="col-span-6"><label className="label">Product</label>
                <select className="input" required value={item.product_id} onChange={e=>setItem(i,'product_id',e.target.value)}>
                  <option value="">— Select —</option>
                  {products.map(p=><option key={p.id} value={p.id}>{p.name} (cost: ${Number(p.cost_price).toFixed(2)})</option>)}
                </select></div>
              <div className="col-span-3"><label className="label">Qty</label>
                <input className="input" type="number" min="1" required value={item.quantity} onChange={e=>setItem(i,'quantity',e.target.value)} /></div>
              <div className="col-span-3"><label className="label">Unit Cost ($)</label>
                <input className="input" type="number" step="0.01" min="0" required value={item.unit_cost} onChange={e=>setItem(i,'unit_cost',e.target.value)} /></div>
              <div className="col-span-12 flex justify-end">
                <button type="button" className="text-red-400 hover:text-red-600 text-xs" onClick={()=>removeItem(i)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {form.items.length>0 && (
          <div className="mt-3 flex justify-end">
            <p className="text-sm font-semibold text-slate-700">PO Total: <span className="text-brand-600">${poTotal.toFixed(2)}</span></p>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving?'Creating…':'Create PO'}</button>
      </div>
    </form>
  );
}

const PO_STATUS_COLORS = { DRAFT:'badge-slate', SENT:'badge-blue', RECEIVED:'badge-green', CANCELLED:'badge-red' };
const PO_NEXT = { DRAFT:'SENT', SENT:'RECEIVED' };

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [pos,       setPOs]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [selected, setSelected]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([suppliersApi.list(), purchaseOrdersApi.list()])
      .then(([s,p]) => { setSuppliers(s.data); setPOs(p.data); })
      .finally(()=>setLoading(false));
  }, []);

  useEffect(()=>{load();},[load]);

  const handleDeleteSup = async (id) => {
    if (!window.confirm('Delete supplier?')) return;
    await suppliersApi.delete(id); load();
  };
  const handleDeletePO = async (id) => {
    if (!window.confirm('Delete this PO?')) return;
    await purchaseOrdersApi.delete(id); load();
  };
  const handleAdvancePO = async (po) => {
    const next = PO_NEXT[po.status];
    if (!next) return;
    const msg = next==='RECEIVED' ? 'Mark as RECEIVED? This will add stock to inventory.' : 'Mark as SENT?';
    if (!window.confirm(msg)) return;
    await purchaseOrdersApi.updateStatus(po.id, { status: next }); load();
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Suppliers & Purchasing"
        action={
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2" onClick={()=>setModal('po')}>
              <PlusIcon className="w-4 h-4" /> New Purchase Order
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={()=>{setSelected(null);setModal('supplier');}}>
              <PlusIcon className="w-4 h-4" /> Add Supplier
            </button>
          </div>
        }
      />

      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">Suppliers</h2>
        {loading ? <Spinner /> : suppliers.length===0 ? <EmptyState /> : (
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="th">Name</th><th className="th">Email</th><th className="th">Phone</th>
              <th className="th">Lead Time</th><th className="th">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map(s=>(
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="td font-medium">{s.name}</td>
                  <td className="td text-slate-500">{s.contact_email||'—'}</td>
                  <td className="td text-slate-500">{s.phone||'—'}</td>
                  <td className="td text-slate-500">{s.lead_time_days}d</td>
                  <td className="td">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded hover:bg-blue-50 text-blue-600" onClick={()=>{setSelected(s);setModal('supplier');}}>
                        <PencilIcon className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-red-500" onClick={()=>handleDeleteSup(s.id)}>
                        <TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">Purchase Orders</h2>
        {pos.length===0 ? <EmptyState message="No purchase orders." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr>
                <th className="th">PO Ref</th><th className="th">Supplier</th><th className="th">Items</th>
                <th className="th">Total</th><th className="th">Status</th>
                <th className="th">Expected</th><th className="th">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {pos.map(po=>(
                  <tr key={po.id} className="hover:bg-slate-50">
                    <td className="td font-mono text-xs">{po.po_ref}</td>
                    <td className="td font-medium">{po.supplier?.name}</td>
                    <td className="td text-slate-500">{po.items?.length}</td>
                    <td className="td font-semibold">${Number(po.total).toFixed(2)}</td>
                    <td className="td"><span className={PO_STATUS_COLORS[po.status]||'badge-slate'}>{po.status}</span></td>
                    <td className="td text-slate-400">{po.expected_at||'—'}</td>
                    <td className="td">
                      <div className="flex items-center gap-1">
                        {PO_NEXT[po.status] && (
                          <button title={`Advance to ${PO_NEXT[po.status]}`}
                            className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                            onClick={()=>handleAdvancePO(po)}>
                            <CheckIcon className="w-4 h-4" />
                          </button>
                        )}
                        {po.status==='DRAFT' && (
                          <button className="p-1.5 rounded hover:bg-red-50 text-red-500" onClick={()=>handleDeletePO(po.id)}>
                            <TrashIcon className="w-4 h-4" />
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

      {modal==='supplier' && (
        <Modal title={selected?'Edit Supplier':'Add Supplier'} onClose={()=>setModal(null)}>
          <SupplierForm initial={selected} onSave={()=>{setModal(null);load();}} onClose={()=>setModal(null)} />
        </Modal>
      )}
      {modal==='po' && (
        <Modal title="New Purchase Order" onClose={()=>setModal(null)} wide>
          <NewPOModal suppliers={suppliers} onSave={()=>{setModal(null);load();}} onClose={()=>setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
