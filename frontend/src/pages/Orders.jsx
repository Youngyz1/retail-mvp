import React, { useEffect, useState, useCallback } from 'react';
import { ordersApi, customersApi, productsApi } from '../api';
import { Modal, PageHeader, Spinner, EmptyState, ErrorBanner, OrderStatusBadge, PaymentBadge, ChannelBadge } from '../components';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const STATUSES = ['PENDING','CONFIRMED','SHIPPED','DELIVERED','CANCELLED','RETURNED'];

function NewOrderModal({ onSave, onClose }) {
  const [customers, setCustomers] = useState([]);
  const [products,  setProducts]  = useState([]);
  const [form, setForm] = useState({ customer_id:'', channel:'IN_STORE', payment_method:'', discount:'0', notes:'', items:[] });
  const [err, setErr]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([customersApi.list(), productsApi.list()])
      .then(([c,p]) => { setCustomers(c.data); setProducts(p.data); });
  }, []);

  const addItem = () => setForm(f => ({ ...f, items:[...f.items,{product_id:'',quantity:1}] }));
  const removeItem = i => setForm(f => ({ ...f, items: f.items.filter((_,idx)=>idx!==i) }));
  const setItem = (i,k,v) => setForm(f => {
    const items=[...f.items]; items[i]={...items[i],[k]:v}; return {...f,items};
  });

  const orderTotal = () => form.items.reduce((s,item) => {
    const p = products.find(x => x.id === Number(item.product_id));
    return s + (p ? Number(p.sell_price) * Number(item.quantity||0) : 0);
  }, 0) - Number(form.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await ordersApi.create({
        customer_id: Number(form.customer_id),
        channel: form.channel,
        payment_method: form.payment_method || null,
        discount: Number(form.discount||0),
        notes: form.notes,
        items: form.items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) })),
      });
      onSave();
    } catch(ex) { setErr(ex.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <ErrorBanner message={err} />}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Customer *</label>
          <select className="input" required value={form.customer_id} onChange={e=>setForm(f=>({...f,customer_id:e.target.value}))}>
            <option value="">— Select Customer —</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.name} ({c.ref})</option>)}
          </select>
        </div>
        <div><label className="label">Channel</label>
          <select className="input" value={form.channel} onChange={e=>setForm(f=>({...f,channel:e.target.value}))}>
            <option value="IN_STORE">In-Store</option><option value="ONLINE">Online</option>
          </select></div>
        <div><label className="label">Payment Method</label>
          <select className="input" value={form.payment_method} onChange={e=>setForm(f=>({...f,payment_method:e.target.value}))}>
            <option value="">— None yet —</option>
            <option value="CASH">Cash</option><option value="CARD">Card</option>
            <option value="TRANSFER">Transfer</option><option value="INSTALLMENT">Installment</option>
          </select></div>
        <div><label className="label">Discount ($)</label>
          <input className="input" type="number" min="0" step="0.01" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} /></div>
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
          {form.items.map((item,i) => {
            const p = products.find(x=>x.id===Number(item.product_id));
            return (
              <div key={i} className="grid grid-cols-12 gap-2 items-end border border-slate-200 rounded-lg p-3">
                <div className="col-span-7">
                  <label className="label">Product</label>
                  <select className="input" required value={item.product_id} onChange={e=>setItem(i,'product_id',e.target.value)}>
                    <option value="">— Select —</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.name} – ${Number(p.sell_price).toFixed(2)} (stock:{p.quantity})</option>)}
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="label">Qty</label>
                  <input className="input" type="number" min="1" required value={item.quantity} onChange={e=>setItem(i,'quantity',e.target.value)} />
                </div>
                <div className="col-span-2 text-right">
                  <p className="text-xs text-slate-500 mb-1">Sub</p>
                  <p className="text-sm font-medium">${p ? (Number(p.sell_price)*Number(item.quantity||0)).toFixed(2) : '—'}</p>
                </div>
                <div className="col-span-12 flex justify-end">
                  <button type="button" className="text-red-400 hover:text-red-600 text-xs" onClick={()=>removeItem(i)}>Remove</button>
                </div>
              </div>
            );
          })}
        </div>
        {form.items.length > 0 && (
          <div className="mt-3 flex justify-end">
            <p className="text-sm font-semibold text-slate-700">Order Total: <span className="text-brand-600">${orderTotal().toFixed(2)}</span></p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving?'Placing…':'Place Order'}</button>
      </div>
    </form>
  );
}

function StatusUpdateModal({ order, onSave, onClose }) {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await ordersApi.updateStatus(order.id,{status}); onSave(); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div><label className="label">New Status</label>
        <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select></div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':'Update'}</button>
      </div>
    </form>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [modal, setModal]   = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (statusFilter)  params.status  = statusFilter;
    if (channelFilter) params.channel = channelFilter;
    ordersApi.list(params).then(r=>setOrders(r.data)).finally(()=>setLoading(false));
  }, [statusFilter, channelFilter]);

  useEffect(()=>{load();},[load]);

  const totalRevenue = orders.reduce((s,o) => s + o.items.reduce((si,i) => si + Number(i.subtotal),0), 0);

  return (
    <div>
      <PageHeader title="Orders & Sales" subtitle={`${orders.length} orders · $${totalRevenue.toFixed(2)} total`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={()=>setModal('new')}>
            <PlusIcon className="w-4 h-4" /> New Order
          </button>
        }
      />

      <div className="card">
        <div className="flex gap-3 mb-4">
          <select className="input max-w-xs" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input max-w-xs" value={channelFilter} onChange={e=>setChannelFilter(e.target.value)}>
            <option value="">All Channels</option>
            <option value="ONLINE">Online</option><option value="IN_STORE">In-Store</option>
          </select>
        </div>

        {loading ? <Spinner /> : orders.length===0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr>
                <th className="th">Ref</th><th className="th">Customer</th><th className="th">Channel</th>
                <th className="th">Items</th><th className="th">Total</th>
                <th className="th">Status</th><th className="th">Payment</th>
                <th className="th">Date</th><th className="th">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(o => {
                  const total = o.items.reduce((s,i)=>s+Number(i.subtotal),0) - Number(o.discount||0);
                  return (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="td font-mono text-xs">{o.order_ref}</td>
                      <td className="td font-medium">{o.customer?.name}</td>
                      <td className="td"><ChannelBadge channel={o.channel} /></td>
                      <td className="td text-slate-500">{o.items?.length}</td>
                      <td className="td font-semibold">${total.toFixed(2)}</td>
                      <td className="td"><OrderStatusBadge status={o.status} /></td>
                      <td className="td"><PaymentBadge status={o.payment_status} /></td>
                      <td className="td text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                      <td className="td">
                        <button title="Update Status" className="p-1.5 rounded hover:bg-brand-50 text-brand-600"
                          onClick={()=>{setSelected(o);setModal('status');}}>
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal==='new' && (
        <Modal title="New Order" onClose={()=>setModal(null)} wide>
          <NewOrderModal onSave={()=>{setModal(null);load();}} onClose={()=>setModal(null)} />
        </Modal>
      )}
      {modal==='status' && selected && (
        <Modal title={`Update Order ${selected.order_ref}`} onClose={()=>setModal(null)}>
          <StatusUpdateModal order={selected} onSave={()=>{setModal(null);load();}} onClose={()=>setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
