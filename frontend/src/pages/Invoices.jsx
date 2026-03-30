import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { invoicesApi } from '../api';
import { Modal, PageHeader, Spinner, EmptyState, ErrorBanner, PaymentBadge } from '../components';
import { PrinterIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';

function PaymentModal({ invoice, onSave, onClose }) {
  const [amount, setAmount]   = useState(Number(invoice.total).toFixed(2));
  const [method, setMethod]   = useState(invoice.payment_method || 'CASH');
  const [err, setErr]         = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await invoicesApi.recordPayment(invoice.id, { amount_paid: Number(amount), payment_method: method });
      onSave();
    } catch(ex) { setErr(ex.response?.data?.detail||'Failed'); }
    finally { setSaving(false); }
  };

  const balance = Number(invoice.total) - Number(invoice.amount_paid);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <ErrorBanner message={err} />}
      <div className="bg-slate-50 rounded-lg p-4 text-sm space-y-1">
        <div className="flex justify-between"><span className="text-slate-500">Invoice Total</span><span className="font-semibold">${Number(invoice.total).toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Paid So Far</span><span>${Number(invoice.amount_paid).toFixed(2)}</span></div>
        <div className="flex justify-between border-t border-slate-200 pt-1 mt-1"><span className="font-medium">Balance Due</span><span className={`font-bold ${balance>0?'text-red-600':'text-emerald-600'}`}>${balance.toFixed(2)}</span></div>
      </div>
      <div><label className="label">Amount to Record ($)</label>
        <input className="input" type="number" step="0.01" min="0" value={amount} onChange={e=>setAmount(e.target.value)} /></div>
      <div><label className="label">Payment Method</label>
        <select className="input" value={method} onChange={e=>setMethod(e.target.value)}>
          <option value="CASH">Cash</option><option value="CARD">Card</option>
          <option value="TRANSFER">Transfer</option><option value="INSTALLMENT">Installment</option>
        </select></div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving?'Saving…':'Record Payment'}</button>
      </div>
    </form>
  );
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('');
  const [modal, setModal]       = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = filter ? { status: filter } : {};
    invoicesApi.list(params).then(r=>setInvoices(r.data)).finally(()=>setLoading(false));
  }, [filter]);

  useEffect(()=>{load();},[load]);

  const unpaidTotal = invoices
    .filter(i=>i.payment_status!=='PAID')
    .reduce((s,i)=>s+Number(i.total)-Number(i.amount_paid),0);

  return (
    <div>
      <PageHeader title="Invoices & Payments"
        subtitle={`${invoices.length} invoices · $${unpaidTotal.toFixed(2)} outstanding`}
      />
      <div className="card">
        <div className="mb-4">
          <select className="input max-w-xs" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="UNPAID">Unpaid</option><option value="PARTIAL">Partial</option>
            <option value="PAID">Paid</option><option value="REFUNDED">Refunded</option>
          </select>
        </div>
        {loading ? <Spinner /> : invoices.length===0 ? <EmptyState /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50"><tr>
                <th className="th">Invoice</th><th className="th">Customer</th><th className="th">Order</th>
                <th className="th">Total</th><th className="th">Paid</th><th className="th">Balance</th>
                <th className="th">Status</th><th className="th">Due</th><th className="th">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv=>{
                  const balance = Number(inv.total) - Number(inv.amount_paid);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="td font-mono text-xs">{inv.invoice_ref}</td>
                      <td className="td font-medium">{inv.order?.customer?.name||'—'}</td>
                      <td className="td font-mono text-xs text-slate-500">{inv.order?.order_ref}</td>
                      <td className="td font-semibold">${Number(inv.total).toFixed(2)}</td>
                      <td className="td text-emerald-600">${Number(inv.amount_paid).toFixed(2)}</td>
                      <td className={`td font-semibold ${balance>0?'text-red-600':'text-slate-400'}`}>${balance.toFixed(2)}</td>
                      <td className="td"><PaymentBadge status={inv.payment_status} /></td>
                      <td className={`td text-sm ${inv.due_date && new Date(inv.due_date)<new Date() && inv.payment_status!=='PAID' ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                        {inv.due_date||'—'}
                      </td>
                      <td className="td">
                        <div className="flex items-center gap-1">
                          {inv.payment_status!=='PAID' && (
                            <button title="Record Payment" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                              onClick={()=>{setSelected(inv);setModal('payment');}}>
                              <CurrencyDollarIcon className="w-4 h-4" />
                            </button>
                          )}
                          <Link to={`/invoices/${inv.id}/print`} target="_blank"
                            className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Print">
                            <PrinterIcon className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal==='payment' && selected && (
        <Modal title={`Record Payment — ${selected.invoice_ref}`} onClose={()=>setModal(null)}>
          <PaymentModal invoice={selected} onSave={()=>{setModal(null);load();}} onClose={()=>setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
