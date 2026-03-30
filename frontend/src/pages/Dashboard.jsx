import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { analyticsApi } from '../api';
import { Spinner, OrderStatusBadge, ChannelBadge } from '../components';
import {
  CubeIcon, UsersIcon, ShoppingCartIcon, CurrencyDollarIcon,
  ExclamationTriangleIcon, ClockIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

function StatCard({ icon: Icon, label, value, sub, color, to }) {
  const inner = (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-800 truncate">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.dashboard().then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data)   return <p className="text-red-500">Failed to load dashboard.</p>;

  const chartData = data.monthly_revenue.map(r => ({
    month: r.period,
    revenue: Number(r.revenue),
    orders: r.orders,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Your store at a glance — today & this month.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={CurrencyDollarIcon} label="Revenue Today"      value={`$${Number(data.revenue_today).toFixed(2)}`}          color="bg-emerald-500" to="/orders" />
        <StatCard icon={ArrowTrendingUpIcon} label="Revenue This Month" value={`$${Number(data.revenue_this_month).toFixed(2)}`}     color="bg-brand-600"   to="/analytics" />
        <StatCard icon={ShoppingCartIcon}   label="Orders Today"       value={data.orders_today}  sub={`${data.pending_orders} pending`} color="bg-blue-500"    to="/orders" />
        <StatCard icon={CurrencyDollarIcon} label="Unpaid Invoices"    value={`$${Number(data.unpaid_invoices_total).toFixed(2)}`}  color="bg-amber-500"   to="/invoices" />
        <StatCard icon={CubeIcon}           label="Total Products"     value={data.total_products} sub={`${data.low_stock_count} low stock`} color="bg-violet-500" to="/products" />
        <StatCard icon={UsersIcon}          label="Total Customers"    value={data.total_customers}                                 color="bg-pink-500"    to="/customers" />
        <StatCard icon={ShoppingCartIcon}   label="Online Orders"      value={data.channel_split?.ONLINE || 0}                     color="bg-cyan-500"    to="/orders" />
        <StatCard icon={ShoppingCartIcon}   label="In-Store Orders"    value={data.channel_split?.IN_STORE || 0}                   color="bg-orange-500"  to="/orders" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="xl:col-span-2 card">
          <h2 className="font-semibold text-slate-700 mb-4">Monthly Revenue (last 6 months)</h2>
          {chartData.length === 0
            ? <p className="text-slate-400 text-sm text-center py-10">No data yet.</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#9333ea" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `$${v}`} />
                  <Tooltip formatter={v => [`$${Number(v).toFixed(2)}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={2} fill="url(#rev)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Low stock alerts */}
          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
              Low Stock Alerts
            </h2>
            {data.low_stock_alerts.length === 0
              ? <p className="text-emerald-600 text-sm">✓ All stock levels OK</p>
              : (
                <ul className="space-y-2">
                  {data.low_stock_alerts.map(p => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 font-medium truncate">{p.name}</span>
                      <span className="badge-red ml-2 flex-shrink-0">{p.quantity} left</span>
                    </li>
                  ))}
                </ul>
              )}
          </div>

          {/* Channel split */}
          <div className="card">
            <h2 className="font-semibold text-slate-700 mb-3">Sales Channels</h2>
            {Object.keys(data.channel_split).length === 0
              ? <p className="text-slate-400 text-sm">No orders yet.</p>
              : (
                <div className="space-y-2">
                  {Object.entries(data.channel_split).map(([ch, cnt]) => (
                    <div key={ch} className="flex items-center justify-between text-sm">
                      <ChannelBadge channel={ch} />
                      <span className="font-semibold text-slate-700">{cnt} orders</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">Recent Orders</h2>
        {data.recent_orders.length === 0
          ? <p className="text-slate-400 text-sm">No orders yet.</p>
          : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Order</th><th className="th">Customer</th>
                    <th className="th">Channel</th><th className="th">Status</th>
                    <th className="th">Total</th><th className="th">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recent_orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="td font-mono text-xs">{o.order_ref}</td>
                      <td className="td font-medium">{o.customer?.name}</td>
                      <td className="td"><ChannelBadge channel={o.channel} /></td>
                      <td className="td"><OrderStatusBadge status={o.status} /></td>
                      <td className="td font-semibold">
                        ${o.items?.reduce((s, i) => s + Number(i.subtotal), 0).toFixed(2)}
                      </td>
                      <td className="td text-slate-400">{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}
