import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, Outlet } from 'react-router-dom';
import {
  HomeIcon, CubeIcon, ShoppingCartIcon, UsersIcon,
  TruckIcon, DocumentTextIcon, ChartBarIcon, BuildingStorefrontIcon,
  Cog6ToothIcon, ArrowRightOnRectangleIcon, SunIcon, MoonIcon
} from '@heroicons/react/24/outline';
import { analyticsApi } from './api';

import { AuthProvider, useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard     from './pages/Dashboard';
import Products      from './pages/Products';
import Orders        from './pages/Orders';
import Customers     from './pages/Customers';
import Invoices      from './pages/Invoices';
import Suppliers     from './pages/Suppliers';
import Analytics     from './pages/Analytics';
import InvoicePrint  from './pages/InvoicePrint';
import Login         from './pages/Login';
import Register      from './pages/Register';
import UserManagement from './pages/UserManagement';

const NAV = [
  { to: '/',               label: 'Dashboard',       Icon: HomeIcon },
  { to: '/products',       label: 'Products',         Icon: CubeIcon },
  { to: '/orders',         label: 'Orders & Sales',   Icon: ShoppingCartIcon },
  { to: '/customers',      label: 'Customers',        Icon: UsersIcon },
  { to: '/invoices',       label: 'Invoices',         Icon: DocumentTextIcon },
  { to: '/suppliers',      label: 'Suppliers & POs',  Icon: TruckIcon },
  { to: '/analytics',      label: 'Analytics',        Icon: ChartBarIcon },
];

function Clock() {
  const [time, setTime] = React.useState(new Date());
  
  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="mt-4 flex items-center justify-center bg-slate-800/50 rounded-lg py-2 border border-slate-700/50 shadow-inner" title={time.toLocaleDateString()}>
      <span className="text-white font-mono text-sm font-bold tracking-wider drop-shadow-md">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
}

function Sidebar({ lowStock }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 flex flex-col fixed left-0 top-0 bottom-0 z-30 shadow-xl">
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <BuildingStorefrontIcon className="w-7 h-7 text-brand-400" />
          <span className="text-white font-bold text-xl tracking-tight">RetailOS</span>
        </div>
        <p className="text-slate-400 text-xs mt-0.5">Business Management System</p>
        <Clock />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {label === 'Products' && lowStock > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                {lowStock > 9 ? '9+' : lowStock}
              </span>
            )}
          </NavLink>
        ))}
        
        {/* Admin only navigation */}
        {user?.role === 'Admin' && (
           <NavLink
           to="/users"
           className={({ isActive }) =>
             `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-4 ${
               isActive ? 'bg-brand-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
             }`
           }
         >
           <Cog6ToothIcon className="w-5 h-5 flex-shrink-0" />
           <span className="flex-1">User Management</span>
         </NavLink>
        )}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700 bg-slate-800/30">
        <div className="flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{user?.fullName || 'User'}</span>
              <span className="text-xs text-slate-400">{user?.email}</span>
           </div>
           <div className="flex items-center gap-1">
             <button onClick={toggleTheme} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
             </button>
             <button onClick={logout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors" title="Logout">
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
             </button>
           </div>
        </div>
      </div>
    </aside>
  );
}

function DashboardLayout() {
  const [lowStock, setLowStock] = React.useState(0);

  React.useEffect(() => {
    analyticsApi.dashboard()
      .then(r => setLowStock(r.data.low_stock_count))
      .catch(() => {});
  }, []);

  return (
    <div className="flex">
      <Sidebar lowStock={lowStock} />
      <main className="ml-64 flex-1 min-h-screen p-8 bg-slate-50 dark:bg-slate-950">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes inside Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
             <Route element={<DashboardLayout />}>
                <Route path="/"                    element={<Dashboard />} />
                <Route path="/products"            element={<Products />} />
                <Route path="/orders"              element={<Orders />} />
                <Route path="/customers"           element={<Customers />} />
                <Route path="/invoices"            element={<Invoices />} />
                <Route path="/suppliers"           element={<Suppliers />} />
                <Route path="/analytics"           element={<Analytics />} />
                <Route path="/invoices/:id/print"  element={<InvoicePrint />} />
                
                {/* Admin Only Route */}
                <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
                   <Route path="/users" element={<UserManagement />} />
                </Route>

                <Route path="*"                    element={<Navigate to="/" />} />
             </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
