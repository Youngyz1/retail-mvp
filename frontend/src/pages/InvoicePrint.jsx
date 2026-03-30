import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { invoicesApi } from '../api';

export default function InvoicePrint() {
  const { id } = useParams();
  const [inv, setInv]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoicesApi.get(id).then(r=>setInv(r.data)).finally(()=>setLoading(false));
  }, [id]);

  useEffect(() => {
    if (inv) setTimeout(()=>window.print(), 500);
  }, [inv]);

  if (loading) return <div className="p-10 text-slate-500 text-center">Loading…</div>;
  if (!inv)    return <div className="p-10 text-red-500 text-center">Invoice not found.</div>;

  const order    = inv.order;
  const customer = order?.customer;
  const items    = order?.items || [];

  return (
    <div className="max-w-2xl mx-auto p-10 font-sans text-slate-800 print:p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-brand-700">RetailOS</h1>
          <p className="text-slate-400 text-sm">Business Management System</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-700">INVOICE</p>
          <p className="font-mono text-sm text-slate-500">{inv.invoice_ref}</p>
          <p className="text-sm text-slate-400">{new Date(inv.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Customer & Order */}
      <div className="grid grid-cols-2 gap-6 mb-8 bg-slate-50 rounded-xl p-5">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Bill To</p>
          <p className="font-semibold text-slate-800">{customer?.name}</p>
          <p className="text-sm text-slate-500">{customer?.ref}</p>
          {customer?.email && <p className="text-sm text-slate-500">{customer.email}</p>}
          {customer?.phone && <p className="text-sm text-slate-500">{customer.phone}</p>}
          {customer?.address && <p className="text-sm text-slate-500">{customer.address}</p>}
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Order Details</p>
          <p className="text-sm"><span className="text-slate-500">Order Ref:</span> <strong>{order?.order_ref}</strong></p>
          <p className="text-sm"><span className="text-slate-500">Channel:</span> {order?.channel?.replace('_',' ')}</p>
          <p className="text-sm"><span className="text-slate-500">Due Date:</span> {inv.due_date || '—'}</p>
          <p className="text-sm mt-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
              inv.payment_status==='PAID' ? 'bg-emerald-100 text-emerald-800' :
              inv.payment_status==='PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
            }`}>{inv.payment_status}</span>
          </p>
        </div>
      </div>

      {/* Line items */}
      <table className="w-full mb-6">
        <thead>
          <tr className="border-b-2 border-slate-200">
            <th className="text-left py-2 text-sm font-semibold text-slate-600">Product</th>
            <th className="text-right py-2 text-sm font-semibold text-slate-600">Qty</th>
            <th className="text-right py-2 text-sm font-semibold text-slate-600">Unit Price</th>
            <th className="text-right py-2 text-sm font-semibold text-slate-600">Subtotal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map(item=>(
            <tr key={item.id}>
              <td className="py-2.5 text-sm">{item.product?.name}</td>
              <td className="py-2.5 text-sm text-right">{item.quantity}</td>
              <td className="py-2.5 text-sm text-right">${Number(item.unit_price).toFixed(2)}</td>
              <td className="py-2.5 text-sm text-right font-medium">${Number(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {Number(inv.discount)>0 && (
            <tr><td colSpan={3} className="pt-2 text-right text-sm text-slate-500">Discount</td>
              <td className="pt-2 text-right text-sm text-red-600">-${Number(inv.discount).toFixed(2)}</td></tr>
          )}
          {Number(inv.tax)>0 && (
            <tr><td colSpan={3} className="text-right text-sm text-slate-500">Tax</td>
              <td className="text-right text-sm">${Number(inv.tax).toFixed(2)}</td></tr>
          )}
          <tr className="border-t-2 border-slate-200">
            <td colSpan={3} className="pt-3 text-right font-bold text-slate-700">Total</td>
            <td className="pt-3 text-right font-bold text-xl text-brand-700">${Number(inv.total).toFixed(2)}</td>
          </tr>
          {Number(inv.amount_paid)>0 && (
            <tr><td colSpan={3} className="text-right text-sm text-slate-500">Amount Paid</td>
              <td className="text-right text-sm text-emerald-600">${Number(inv.amount_paid).toFixed(2)}</td></tr>
          )}
          {Number(inv.total)-Number(inv.amount_paid)>0 && (
            <tr><td colSpan={3} className="text-right font-semibold text-slate-700">Balance Due</td>
              <td className="text-right font-bold text-red-600">${(Number(inv.total)-Number(inv.amount_paid)).toFixed(2)}</td></tr>
          )}
        </tfoot>
      </table>

      <div className="mt-6 text-center text-slate-400 text-xs border-t border-slate-200 pt-4">
        Thank you for your business · Generated by RetailOS · {new Date().toLocaleDateString()}
      </div>

      <div className="mt-6 print:hidden">
        <button className="btn-primary" onClick={()=>window.print()}>Print / Save PDF</button>
      </div>
    </div>
  );
}
