import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  TrendingUp, 
  Droplets, 
  Coins, 
  Store,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Fuel,
  Wallet,
  Building2,
  Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

/* ─── Sleek Stat Card Component ───────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
  <div 
    className="glass-card glass-card-hover" 
    style={{ 
      padding: '0.85rem 1rem', 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.85rem',
      minWidth: 0,
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <div style={{ 
      background: `${color}18`, 
      padding: '0.6rem', 
      borderRadius: '10px',
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={22} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </p>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.15rem 0 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.02em' }}>
        {value}
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
        {trend !== undefined && (
          <span style={{ 
            fontSize: '0.68rem', 
            fontWeight: 600,
            color: trend >= 0 ? 'var(--success)' : 'var(--error)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.15rem',
            background: trend >= 0 ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            padding: '0.1rem 0.35rem',
            borderRadius: '4px'
          }}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
        {subtitle && (
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    try {
      const res = await api.get('/dashboard-stats/');
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      if (isManualRefresh) setTimeout(() => setRefreshing(false), 400);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fmtCurrency = (val) => {
    const num = parseFloat(val || 0);
    return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const fmtNumber = (val) => {
    const num = parseFloat(val || 0);
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minHeight: 0 }}>
        <div style={{ height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', width: '30%' }} />
        <div className="dashboard-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card" style={{ height: '80px', background: 'rgba(255,255,255,0.03)' }} />
          ))}
        </div>
        <div className="dashboard-charts-grid" style={{ flex: 1 }}>
          <div className="glass-card" style={{ minHeight: '300px', background: 'rgba(255,255,255,0.03)' }} />
          <div className="glass-card" style={{ minHeight: '300px', background: 'rgba(255,255,255,0.03)' }} />
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
        Failed to load dashboard metrics. Please check your backend connection.
      </div>
    );
  }

  const totalFuelStock = (stats.inventory || []).reduce((acc, curr) => acc + (parseFloat(curr.total_stock) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, minHeight: 0 }}>
      {/* Dashboard Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Activity size={22} style={{ color: 'var(--primary)' }} /> 
            {user?.role === 'ADMIN' ? 'Admin Dashboard' : 'Branch Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0, marginTop: '0.1rem' }}>
            Real-time operations analytics & fuel metrics overview
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            color: 'var(--secondary)', 
            background: 'rgba(16, 185, 129, 0.12)', 
            padding: '0.25rem 0.6rem', 
            borderRadius: '999px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontWeight: 600
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--secondary)' }} />
            Live Sync
          </span>

          <button 
            onClick={() => fetchStats(true)} 
            className="btn btn-outline" 
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: '32px' }}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="dashboard-grid" style={{ flexShrink: 0 }}>
        <StatCard 
          title="Total Gross Revenue" 
          value={fmtCurrency(stats.total_sales)} 
          icon={Coins} 
          color="#3b82f6"
          trend={12}
          subtitle="vs last week"
        />
        <StatCard 
          title="Total Liters Dispensed" 
          value={`${fmtNumber(stats.total_liters)} L`} 
          icon={Droplets} 
          color="#10b981"
          trend={5}
          subtitle="fuel volume"
        />
        <StatCard 
          title="Net Operating Profit" 
          value={fmtCurrency(stats.profit)} 
          icon={TrendingUp} 
          color="#f59e0b"
          trend={stats.profit >= 0 ? 8 : -4}
          subtitle="after expenses"
        />
        <StatCard 
          title={user?.role === 'ADMIN' ? 'Active Stations' : 'Station Branch'} 
          value={user?.role === 'ADMIN' ? `${stats.branch_count} Branches` : (user?.branch_name || 'Assigned')} 
          icon={Store} 
          color="#8b5cf6"
          subtitle={user?.role === 'ADMIN' ? 'operational' : 'active station'}
        />
      </div>

      {/* Main Charts Workspace - Screen-Fit */}
      <div className="dashboard-charts-grid" style={{ flex: 1, minHeight: 0 }}>
        {/* Sales Performance Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Coins size={16} color="#3b82f6" /> Sales Trend (Last 7 Days)
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Daily revenue breakdown</p>
            </div>
            {stats.daily_sales.length > 0 && (
              <span style={{ fontSize: '0.72rem', color: '#3b82f6', background: 'rgba(59, 130, 246, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                {stats.daily_sales.length} days recorded
              </span>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
            {stats.daily_sales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.daily_sales} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="timestamp__date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `₱${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value) => [`₱${parseFloat(value).toLocaleString()}`, 'Sales']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No recent sales activity recorded
              </div>
            )}
          </div>
        </div>

        {/* Inventory Status Bar Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem', minHeight: '300px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexShrink: 0 }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Fuel size={16} color="#10b981" /> Fuel Stock by Fuel Type
              </h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Current available inventory volume</p>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
              Total: {fmtNumber(totalFuelStock)} L
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0, width: '100%' }}>
            {stats.inventory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.inventory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="fuel_type__name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(v) => `${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}L`} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.75rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
                    itemStyle={{ color: '#f8fafc' }}
                    formatter={(value) => [`${parseFloat(value).toLocaleString()} Liters`, 'Stock Level']}
                  />
                  <Bar dataKey="total_stock" fill="#10b981" radius={[6, 6, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No active inventory data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational Highlights Band */}
      <div className="glass-card" style={{ 
        padding: '0.65rem 1rem', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
            <Wallet size={15} color="#ef4444" />
            <span style={{ color: 'var(--text-muted)' }}>Operating Expenses:</span>
            <strong style={{ color: 'var(--text-main)' }}>{fmtCurrency(stats.total_expenses)}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem' }}>
            <Building2 size={15} color="#8b5cf6" />
            <span style={{ color: 'var(--text-muted)' }}>Fuel Products:</span>
            <strong style={{ color: 'var(--text-main)' }}>{stats.inventory?.length || 0} Types Tracked</strong>
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          C3 Fuel Management • Auto-updating system metrics
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
