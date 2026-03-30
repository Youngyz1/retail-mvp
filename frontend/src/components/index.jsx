import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, wide = false }) {
  React.useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full mx-4 max-h-[90vh] flex flex-col ${wide ? 'max-w-3xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><XMarkIcon className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── PageHeader ────────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}
export function EmptyState({ message = 'No records found.' }) {
  return <div className="text-center py-16 text-slate-400 text-sm">{message}</div>;
}
export function ErrorBanner({ message }) {
  return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{message}</div>;
}

// ── Status badges ─────────────────────────────────────────────────────────────
export function OrderStatusBadge({ status }) {
  const map = {
    PENDING:   'badge-yellow', CONFIRMED: 'badge-blue',
    SHIPPED:   'badge-purple', DELIVERED: 'badge-green',
    CANCELLED: 'badge-red',   RETURNED:  'badge-slate',
  };
  return <span className={map[status] || 'badge-slate'}>{status}</span>;
}
export function PaymentBadge({ status }) {
  const map = { UNPAID:'badge-red', PARTIAL:'badge-yellow', PAID:'badge-green', REFUNDED:'badge-slate' };
  return <span className={map[status] || 'badge-slate'}>{status}</span>;
}
export function TierBadge({ tier }) {
  const map = { STANDARD:'badge-slate', SILVER:'badge-blue', GOLD:'badge-yellow', VIP:'badge-purple' };
  return <span className={map[tier] || 'badge-slate'}>{tier}</span>;
}
export function ChannelBadge({ channel }) {
  return channel === 'ONLINE'
    ? <span className="badge-blue">Online</span>
    : <span className="badge-slate">In-Store</span>;
}
