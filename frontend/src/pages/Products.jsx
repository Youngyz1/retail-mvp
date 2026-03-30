import React, { useEffect, useState, useCallback } from 'react';
import { productsApi, categoriesApi, suppliersApi } from '../api';
import { Modal, PageHeader, Spinner, EmptyState, ErrorBanner } from '../components';
import { PlusIcon, PencilIcon, TrashIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';

const EMPTY = { sku:'', name:'', description:'', category_id:'', supplier_id:'',
                cost_price:'', sell_price:'', quantity:0, min_threshold:5,
                channel:'IN_STORE', is_active:true };

function ProductForm({ initial, categories, suppliers, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [err, setErr]   = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      const payload = { ...form,
        category_id: form.category_id ? Number(form.category_id) : null,
        supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
        quantity: Number(form.quantity), min_threshold: Number(form.min_threshold),
      };
      if (initial?.id) await productsApi.update(initial.id, payload);
      else             await productsApi.create(payload);
      onSave();
    } catch (ex) { setErr(ex.response?.data?.detail || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <ErrorBanner message={err} />}
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">SKU *</label>
          <input className="input" required value={form.sku} onChange={e=>set('sku',e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Name *</label>
          <input className="input" required value={form.name} onChange={e=>set('name',e.target.value)} /></div>
        <div className="col-span-2"><label className="label">Description</label>
          <textarea className="input" rows={2} value={form.description} onChange={e=>set('description',e.target.value)} /></div>
        <div><label className="label">Category</label>
          <select className="input" value={form.category_id} onChange={e=>set('category_id',e.target.value)}>
            <option value="">— None —</option>
            {categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div><label className="label">Supplier</label>
          <select className="input" value={form.supplier_id} onChange={e=>set('supplier_id',e.target.value)}>
            <option value="">— None —</option>
            {suppliers.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select></div>
        <div><label className="label">Cost Price ($) *</label>
          <input className="input" type="number" step="0.01" min="0" required value={form.cost_price} onChange={e=>set('cost_price',e.target.value)} /></div>
        <div><label className="label">Sell Price ($) *</label>
          <input className="input" type="number" step="0.01" min="0" required value={form.sell_price} onChange={e=>set('sell_price',e.target.value)} /></div>
        <div><label className="label">Quantity</label>
          <input className="input" type="number" min="0" value={form.quantity} onChange={e=>set('quantity',e.target.value)} /></div>
        <div><label className="label">Min Threshold</label>
          <input className="input" type="number" min="0" value={form.min_threshold} onChange={e=>set('min_threshold',e.target.value)} /></div>
        <div><label className="label">Channel</label>
          <select className="input" value={form.channel} onChange={e=>set('channel',e.target.value)}>
            <option value="IN_STORE">In-Store</option>
            <option value="ONLINE">Online</option>
          </select></div>
        <div className="flex items-center gap-2 pt-6">
          <input type="checkbox" id="active" checked={form.is_active} onChange={e=>set('is_active',e.target.checked)} />
          <label htmlFor="active" className="text-sm text-slate-700">Active</label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':'Save'}</button>
      </div>
    </form>
  );
}

function StockModal({ product, onClose, onDone }) {
  const [type, setType]   = useState('IN');
  const [qty, setQty]     = useState(1);
  const [reason, setReason] = useState('');
  const [err, setErr]     = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await productsApi.adjustStock(product.id, { product_id: product.id, type, quantity: Number(qty), reason });
      onDone();
    } catch (ex) { setErr(ex.response?.data?.detail || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <ErrorBanner message={err} />}
      <p className="text-sm text-slate-500">Adjusting: <strong>{product.name}</strong> (current: {product.quantity})</p>
      <div><label className="label">Type</label>
        <select className="input" value={type} onChange={e=>setType(e.target.value)}>
          <option value="IN">Stock In</option><option value="OUT">Stock Out</option><option value="ADJ">Adjustment (set to)</option>
        </select></div>
      <div><label className="label">Quantity</label>
        <input className="input" type="number" min="0" required value={qty} onChange={e=>setQty(e.target.value)} /></div>
      <div><label className="label">Reason</label>
        <input className="input" value={reason} onChange={e=>setReason(e.target.value)} /></div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':'Adjust'}</button>
      </div>
    </form>
  );
}

export default function Products() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [modal, setModal]           = useState(null);
  const [selected, setSelected]     = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([productsApi.list({ search }), categoriesApi.list(), suppliersApi.list()])
      .then(([p,c,s]) => { setProducts(p.data); setCategories(c.data); setSuppliers(s.data); })
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await productsApi.delete(id);
    load();
  };

  const margin = p => p.cost_price && p.sell_price
    ? (((Number(p.sell_price) - Number(p.cost_price)) / Number(p.sell_price)) * 100).toFixed(0)
    : 0;

  return (
    <div>
      <PageHeader title="Products & Inventory" subtitle={`${products.length} products`}
        action={
          <button className="btn-primary flex items-center gap-2" onClick={()=>{setSelected(null);setModal('form');}}>
            <PlusIcon className="w-4 h-4" /> Add Product
          </button>
        }
      />
      <div className="card">
        <div className="flex gap-3 mb-4">
          <input className="input max-w-xs" placeholder="Search name or SKU…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {loading ? <Spinner /> : products.length === 0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr>
                <th className="th">SKU</th><th className="th">Name</th><th className="th">Category</th>
                <th className="th">Stock</th><th className="th">Cost</th><th className="th">Price</th>
                <th className="th">Margin</th><th className="th">Channel</th><th className="th">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="td font-mono text-xs text-slate-500">{p.sku}</td>
                    <td className="td font-medium">
                      {p.name}
                      {p.quantity < p.min_threshold && <span className="badge-red ml-2">Low</span>}
                      {!p.is_active && <span className="badge-slate ml-2">Inactive</span>}
                    </td>
                    <td className="td text-slate-500">{p.category?.name || '—'}</td>
                    <td className={`td font-semibold ${p.quantity < p.min_threshold ? 'text-red-600' : 'text-slate-700'}`}>{p.quantity}</td>
                    <td className="td text-slate-500">${Number(p.cost_price).toFixed(2)}</td>
                    <td className="td font-medium">${Number(p.sell_price).toFixed(2)}</td>
                    <td className="td"><span className="badge-green">{margin(p)}%</span></td>
                    <td className="td">{p.channel === 'ONLINE' ? <span className="badge-blue">Online</span> : <span className="badge-slate">In-Store</span>}</td>
                    <td className="td">
                      <div className="flex items-center gap-1">
                        <button title="Adjust Stock" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                          onClick={()=>{setSelected(p);setModal('stock');}}>
                          <ArrowsUpDownIcon className="w-4 h-4" />
                        </button>
                        <button title="Edit" className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                          onClick={()=>{setSelected(p);setModal('form');}}>
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button title="Delete" className="p-1.5 rounded hover:bg-red-50 text-red-500"
                          onClick={()=>handleDelete(p.id)}>
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal==='form') && (
        <Modal title={selected?'Edit Product':'Add Product'} onClose={()=>setModal(null)} wide>
          <ProductForm initial={selected} categories={categories} suppliers={suppliers}
            onSave={()=>{setModal(null);load();}} onClose={()=>setModal(null)} />
        </Modal>
      )}
      {modal==='stock' && selected && (
        <Modal title="Adjust Stock" onClose={()=>setModal(null)}>
          <StockModal product={selected} onClose={()=>setModal(null)} onDone={()=>{setModal(null);load();}} />
        </Modal>
      )}
    </div>
  );
}
