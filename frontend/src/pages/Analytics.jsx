import React, { useEffect, useState } from 'react';
import { analyticsApi } from '../api';
import { Spinner } from '../components';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

const COLORS = ['#9333ea','#3b82f6','#10b981','#f59e0b','#ef4444','#06b6d4'];

function StatCard({ label, value, sub }) {
  return (
    <div className="card">
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Analytics() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.get().then(r=>setData(r.data)).finally(()=>setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data)   return <p className="text-red-500">Failed to load analytics.</p>;

  const monthlyData = data.revenue_by_month.map(r=>({
    month: r.period, revenue: Number(r.revenue), orders: r.orders,
  }));

  const catData = data.revenue_by_category.map(r=>({
    name: r.category, value: Number(r.revenue),
  }));

  const channelData = Object.entries(data.online_vs_store).map(([k,v])=>({
    name: k === 'ONLINE' ? 'Online' : 'In-Store', value: v,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics & Reports</h1>
        <p className="text-slate-500 text-sm mt-0.5">Business performance overview.</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={`$${Number(data.total_revenue).toFixed(2)}`} />
        <StatCard label="Total Orders"  value={data.total_orders} />
        <StatCard label="Avg Order Value" value={`$${Number(data.avg_order_value).toFixed(2)}`} />
      </div>

      {/* Revenue by month */}
      <div className="card">
        <h2 className="font-semibold text-slate-700 mb-4">Revenue by Month</h2>
        {monthlyData.length === 0
          ? <p className="text-slate-400 text-sm text-center py-10">No sales data yet.</p>
          : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#9333ea" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{fontSize:12}} />
                <YAxis tick={{fontSize:12}} tickFormatter={v=>`$${v}`} />
                <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`,'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#9333ea" strokeWidth={2} fill="url(#grad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Top Products by Revenue</h2>
          {data.top_products.length === 0
            ? <p className="text-slate-400 text-sm text-center py-10">No sales yet.</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.top_products.map(p=>({ name: p.name.length>20?p.name.slice(0,20)+'…':p.name, revenue: Number(p.total_revenue), sold: p.total_sold }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{fontSize:10}} />
                  <YAxis tick={{fontSize:11}} tickFormatter={v=>`$${v}`} />
                  <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`,'Revenue']} />
                  <Bar dataKey="revenue" fill="#9333ea" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Revenue by category */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Revenue by Category</h2>
          {catData.length === 0
            ? <p className="text-slate-400 text-sm text-center py-10">No sales yet.</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v=>[`$${Number(v).toFixed(2)}`,'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Online vs In-store */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Sales by Channel</h2>
          {channelData.length === 0
            ? <p className="text-slate-400 text-sm text-center py-10">No orders yet.</p>
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={channelData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={80} label={({name,value})=>`${name}: ${value}`}>
                    <Cell fill="#9333ea" /><Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
        </div>

        {/* Top products table */}
        <div className="card">
          <h2 className="font-semibold text-slate-700 mb-4">Top Products Detail</h2>
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="th">Product</th><th className="th">Units Sold</th><th className="th">Revenue</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.top_products.map(p=>(
                <tr key={p.product_id} className="hover:bg-slate-50">
                  <td className="td">
                    <div className="font-medium text-slate-700">{p.name}</div>
                    <div className="text-xs text-slate-400 font-mono">{p.sku}</div>
                  </td>
                  <td className="td font-semibold">{p.total_sold}</td>
                  <td className="td font-semibold text-emerald-600">${Number(p.total_revenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
