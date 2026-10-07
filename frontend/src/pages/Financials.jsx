import React, { useEffect, useState, useCallback } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3, Coins, TrendingUp, TrendingDown,
  Wallet, Droplets, Filter, RefreshCw, Store, Calendar, Printer
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

/* ── Mini Stat Card ───────────────────────────────────── */
const MiniStat = ({ title, value, icon: Icon, color, subtitle }) => (
  <div className="glass-card" style={{
    padding: '0.45rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    overflow: 'hidden'
  }}>
    <div style={{
      background: `${color}18`,
      padding: '0.4rem',
      borderRadius: '8px',
      color: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={16} />
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value}
        </h4>
        {subtitle && (
          <span style={{ fontSize: '0.62rem', color: color, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  </div>
);

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

/* ── Main Page ───────────────────────────────────────── */
const Financials = () => {
  const { user } = useAuth();
  const [report, setReport] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pl'); // 'pl' = Profit & Loss, 'bs' = Balance Sheet

  const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const today    = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState({ date_from: firstDay, date_to: today, branch: '' });

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to)   params.append('date_to',   filters.date_to);
      if (filters.branch)    params.append('branch',    filters.branch);
      const res = await api.get(`/financial-report/?${params}`);
      setReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchReport();
    api.get('/branches/').then(r => setBranches(r.data)).catch(() => {});
  }, [fetchReport]);

  const fmt = (n) =>
    parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const incomeRows = report ? [
    { label: 'Gross Sales Revenue',    value: report.total_revenue,  color: '#3b82f6', indent: false },
    { label: 'Cost of Goods Sold (Deliveries)', value: -report.cogs, color: '#ef4444', indent: true },
    { label: 'Gross Profit',           value: report.gross_profit,   color: '#10b981', indent: false, bold: true },
    { label: 'Operating Expenses',     value: -report.total_expenses,color: '#ef4444', indent: true },
    { label: 'Net Profit',             value: report.net_profit,     color: report.net_profit >= 0 ? '#10b981' : '#ef4444', indent: false, bold: true, size: '0.95rem' },
  ] : [];

  const balanceSheetRows = report?.balance_sheet ? [
    { type: 'header', label: 'ASSETS' },
    { type: 'subheader', label: 'Current Assets' },
    { type: 'item', label: 'Cash & Cash Equivalents', value: report.balance_sheet.cash, color: 'var(--text-main)', indent: true },
    { type: 'item', label: 'Fuel Inventory Value', value: report.balance_sheet.inventory_value, color: 'var(--text-main)', indent: true },
    { type: 'total', label: 'Total Assets', value: report.balance_sheet.total_assets, color: '#10b981', bold: true },
    { type: 'divider' },
    { type: 'header', label: 'LIABILITIES' },
    { type: 'subheader', label: 'Current Liabilities' },
    { type: 'item', label: 'Accounts Payable', value: report.balance_sheet.liabilities, color: 'var(--text-main)', indent: true },
    { type: 'total', label: 'Total Liabilities', value: report.balance_sheet.liabilities, color: '#ef4444', bold: true },
    { type: 'divider' },
    { type: 'header', label: 'EQUITY' },
    { type: 'item', label: 'Retained Earnings', value: report.balance_sheet.equity, color: 'var(--text-main)', indent: true },
    { type: 'total', label: 'Total Equity', value: report.balance_sheet.equity, color: '#3b82f6', bold: true },
    { type: 'divider' },
    { type: 'grand_total', label: 'TOTAL LIABILITIES & EQUITY', value: parseFloat(report.balance_sheet.liabilities) + parseFloat(report.balance_sheet.equity), color: '#10b981', bold: true, size: '0.9rem' }
  ] : [];

  // P&L Trend chart data
  const dailyData = (report?.daily_revenue || []).map(d => ({
    date: d.timestamp__date,
    Revenue: parseFloat(d.revenue),
  }));

  // Expense pie chart
  const pieData = (report?.expense_breakdown || []).map(e => ({
    name: e.description,
    value: parseFloat(e.total),
  }));

  // Monthly bar chart
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const monthlyData = (report?.monthly || []).map(m => ({
    month: `${monthNames[(m.timestamp__month || 1) - 1]} ${m.timestamp__year}`,
    Revenue: parseFloat(m.revenue),
  }));

  // Balance Sheet Charts
  const bsAssetData = report?.balance_sheet ? [
    { name: 'Cash & Eq.', value: parseFloat(report.balance_sheet.cash || 0) },
    { name: 'Inventory', value: parseFloat(report.balance_sheet.inventory_value || 0) },
  ] : [];

  const bsLiabEquityData = report?.balance_sheet ? [
    { name: 'Total Assets', value: parseFloat(report.balance_sheet.total_assets || 0), color: '#10b981' },
    { name: 'Liabilities', value: parseFloat(report.balance_sheet.liabilities || 0), color: '#ef4444' },
    { name: 'Equity', value: parseFloat(report.balance_sheet.equity || 0), color: '#3b82f6' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Print Only Header */}
      <div className="print-only" style={{ marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '0.75rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 0.4rem 0', color: '#000' }}>C3 Fuels Station</h1>
        <h2 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 0.2rem 0', color: '#000' }}>
          {activeTab === 'pl' ? 'Profit & Loss (Income) Statement' : 'Balance Sheet'}
        </h2>
        <p style={{ fontSize: '13px', color: '#555', margin: '0 0 0.2rem 0' }}>
          {activeTab === 'pl' 
            ? `Reporting Period: ${filters.date_from || 'Inception'} to ${filters.date_to || 'Present'}`
            : `As of Date: ${report?.balance_sheet?.as_of_date || today}`
          }
        </p>
        <p style={{ fontSize: '13px', color: '#555', margin: '0' }}>
          Branch: {filters.branch ? branches.find(b => b.id.toString() === filters.branch.toString())?.name : (user?.role === 'ADMIN' ? 'All Branches' : user?.branch_name || 'My Branch')}
        </p>
      </div>

      {/* Screen Header & Controls Toolbar */}
      <div className="no-print" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.65rem',
        background: 'var(--glass)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.55rem 0.9rem'
      }}>
        {/* Left: Title & Tab Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontWeight: 700 }}>
            <BarChart3 size={20} style={{ color: 'var(--primary)' }} /> Financial Reports
          </h2>

          {report && (
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '2px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setActiveTab('pl')}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'pl' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'pl' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                Profit & Loss
              </button>
              <button 
                onClick={() => setActiveTab('bs')}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: activeTab === 'bs' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'bs' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease'
                }}
              >
                Balance Sheet
              </button>
            </div>
          )}
        </div>

        {/* Right: Filters & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>From:</span>
            <input 
              type="date" 
              className="input" 
              style={{ padding: '0.25rem 0.45rem', fontSize: '0.78rem', width: 'auto' }}
              value={filters.date_from}
              onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} 
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>To:</span>
            <input 
              type="date" 
              className="input" 
              style={{ padding: '0.25rem 0.45rem', fontSize: '0.78rem', width: 'auto' }}
              value={filters.date_to}
              onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} 
            />
          </div>
          {user?.role === 'ADMIN' && (
            <select 
              className="input" 
              style={{ padding: '0.25rem 0.45rem', fontSize: '0.78rem', width: 'auto' }}
              value={filters.branch}
              onChange={e => setFilters(f => ({ ...f, branch: e.target.value }))}>
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }} onClick={fetchReport}>
            <Filter size={13} /> Apply
          </button>
          {report && (
            <button className="btn btn-outline" onClick={() => window.print()} style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }}>
              <Printer size={13} /> Print
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} style={{ opacity: 0.4, animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Loading financial data…</p>
        </div>
      ) : report && (
        <>
          {/* KPI Metrics Summary Band */}
          {activeTab === 'pl' && (
            <div className="no-print" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.5rem'
            }}>
              <MiniStat title="Total Revenue"      value={`₱${fmt(report.total_revenue)}`}   icon={Coins}        color="#3b82f6" />
              <MiniStat title="Cost of Goods"      value={`₱${fmt(report.cogs)}`}            icon={TrendingDown} color="#ef4444" />
              <MiniStat title="Gross Profit"       value={`₱${fmt(report.gross_profit)}`}    icon={TrendingUp}   color="#10b981" />
              <MiniStat title="Expenses"          value={`₱${fmt(report.total_expenses)}`}  icon={Wallet}       color="#f59e0b" />
              <MiniStat 
                title="Net Profit"         
                value={`₱${fmt(report.net_profit)}`}     
                icon={BarChart3}     
                color={report.net_profit >= 0 ? '#10b981' : '#ef4444'} 
                subtitle={report.net_profit >= 0 ? 'Profitable' : 'Loss'}
              />
              <MiniStat title="Liters Sold"        value={`${fmt(report.total_liters)} L`}   icon={Droplets}     color="#8b5cf6" />
            </div>
          )}

          {/* Main Dashboard Workspace (Statement & Visualizations Side-by-Side) */}
          <div className="financial-workspace no-print" style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) minmax(380px, 1.15fr)',
            gap: '0.65rem',
            height: activeTab === 'pl' ? 'calc(100vh - 215px)' : 'calc(100vh - 150px)',
            minHeight: '440px'
          }}>
            {/* Left Column: Financial Statement Card */}
            <div className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '0.75rem 0.85rem',
              height: '100%',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
                paddingBottom: '0.35rem',
                borderBottom: '1px solid var(--border)'
              }}>
                <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontWeight: 700 }}>
                  <BarChart3 size={15} style={{ color: 'var(--primary)' }} />
                  {activeTab === 'pl' ? 'Profit & Loss Statement' : 'Balance Sheet Statement'}
                </h3>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                  {activeTab === 'pl' ? `${filters.date_from} to ${filters.date_to}` : `As of ${report?.balance_sheet?.as_of_date || today}`}
                </span>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem' }}>
                {activeTab === 'pl' ? (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <tbody>
                      {incomeRows.map((row, idx) => (
                        <tr key={idx} style={{
                          borderBottom: idx < incomeRows.length - 1 ? '1px solid var(--border)' : 'none',
                          background: row.bold ? 'rgba(59, 130, 246, 0.05)' : 'transparent'
                        }}>
                          <td style={{
                            padding: '0.5rem 0.5rem',
                            paddingLeft: row.indent ? '1.5rem' : '0.5rem',
                            fontWeight: row.bold ? '700' : '400',
                            fontSize: row.size || '0.82rem',
                            color: 'var(--text-main)',
                            borderTop: row.bold ? '1px solid var(--border)' : 'none',
                          }}>
                            {row.label}
                          </td>
                          <td style={{
                            padding: '0.5rem 0.5rem',
                            textAlign: 'right',
                            fontWeight: row.bold ? '700' : '600',
                            fontSize: row.size || '0.82rem',
                            color: row.color,
                            borderTop: row.bold ? '1px solid var(--border)' : 'none',
                          }}>
                            {row.value < 0 ? `(₱${fmt(Math.abs(row.value))})` : `₱${fmt(row.value)}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <tbody>
                      {balanceSheetRows.map((row, idx) => {
                        if (row.type === 'header') {
                          return (
                            <tr key={idx}>
                              <td colSpan="2" style={{
                                padding: '0.5rem 0.4rem 0.2rem 0.4rem',
                                fontWeight: '700',
                                fontSize: '0.85rem',
                                color: 'var(--primary)',
                                letterSpacing: '0.04em',
                                borderBottom: '1px solid var(--border)'
                              }}>
                                {row.label}
                              </td>
                            </tr>
                          );
                        }
                        if (row.type === 'subheader') {
                          return (
                            <tr key={idx}>
                              <td colSpan="2" style={{
                                padding: '0.35rem 0.4rem 0.15rem 1rem',
                                fontWeight: '600',
                                fontSize: '0.78rem',
                                color: 'var(--text-muted)'
                              }}>
                                {row.label}
                              </td>
                            </tr>
                          );
                        }
                        if (row.type === 'divider') {
                          return (
                            <tr key={idx}>
                              <td colSpan="2" style={{ padding: '0.15rem 0' }}>
                                <div style={{ height: '1px', background: 'var(--border)' }} />
                              </td>
                            </tr>
                          );
                        }
                        
                        const isGrand = row.type === 'grand_total';
                        const isTotal = row.type === 'total';
                        const isItem = row.type === 'item';
                        
                        return (
                          <tr key={idx} style={{ 
                            borderBottom: isItem ? '1px solid rgba(255,255,255,0.03)' : 'none',
                            background: isGrand ? 'rgba(59, 130, 246, 0.08)' : isTotal ? 'rgba(255,255,255,0.02)' : 'transparent'
                          }}>
                            <td style={{
                              padding: '0.4rem 0.5rem',
                              paddingLeft: row.indent ? '1.5rem' : '0.5rem',
                              fontWeight: (isTotal || isGrand) ? '700' : '400',
                              fontSize: row.size || '0.8rem',
                              color: 'var(--text-main)',
                              borderTop: isTotal ? '1px solid var(--border)' : 'none',
                            }}>
                              {row.label}
                            </td>
                            <td style={{
                              padding: '0.4rem 0.5rem',
                              textAlign: 'right',
                              fontWeight: (isTotal || isGrand) ? '700' : '600',
                              fontSize: row.size || '0.8rem',
                              color: row.color,
                              borderTop: isTotal ? '1px solid var(--border)' : 'none',
                            }}>
                              {row.value < 0 ? `(₱${fmt(Math.abs(row.value))})` : `₱${fmt(row.value)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Right Column: Visualizations Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: '100%', overflow: 'hidden' }}>
              {activeTab === 'pl' ? (
                <>
                  {/* Top Chart: Daily Revenue Trend */}
                  <div className="glass-card" style={{ flex: '1 1 50%', minHeight: 0, padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <TrendingUp size={14} style={{ color: '#3b82f6' }} /> Daily Revenue Trend
                    </h4>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      {dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px', padding: '6px 10px' }} itemStyle={{ color: '#f8fafc' }} />
                            <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGrad)" name="Revenue (₱)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          No daily sales data for this period.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Row: 2 Sub-charts side by side */}
                  <div style={{ flex: '1 1 50%', minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    {/* Monthly Bar */}
                    <div className="glass-card" style={{ padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <BarChart3 size={14} style={{ color: '#10b981' }} /> Monthly Revenue
                      </h4>
                      <div style={{ flex: 1, minHeight: 0 }}>
                        {monthlyData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                              <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                              <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px', padding: '6px 10px' }} itemStyle={{ color: '#f8fafc' }} />
                              <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue (₱)" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            No monthly data.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expense Pie */}
                    <div className="glass-card" style={{ padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                      <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Wallet size={14} style={{ color: '#f59e0b' }} /> Expense Breakdown
                      </h4>
                      <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}>
                        {pieData.length > 0 ? (
                          <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}>
                            <div style={{ width: '42%', height: '100%' }}>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="value" nameKey="name" paddingAngle={2}>
                                    {pieData.map((_, idx) => (
                                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} formatter={(val) => `₱${fmt(val)}`} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div style={{ width: '58%', overflowY: 'auto', maxHeight: '100%', paddingLeft: '0.3rem' }}>
                              {pieData.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.15rem 0', fontSize: '0.7rem' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: PIE_COLORS[idx % PIE_COLORS.length], flexShrink: 0 }} />
                                    {item.name}
                                  </span>
                                  <span style={{ fontWeight: 600, color: '#ef4444', marginLeft: '0.2rem' }}>₱{fmt(item.value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            No expenses logged.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Balance Sheet Visualizations */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: '100%' }}>
                  {/* Asset Allocation Chart */}
                  <div className="glass-card" style={{ flex: '1 1 50%', minHeight: 0, padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Coins size={14} style={{ color: '#10b981' }} /> Asset Allocation
                    </h4>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      {bsAssetData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={bsAssetData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} formatter={(v) => `₱${fmt(v)}`} />
                            <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} name="Amount (₱)" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          No asset data available.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Liabilities & Equity Structure */}
                  <div className="glass-card" style={{ flex: '1 1 50%', minHeight: 0, padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Wallet size={14} style={{ color: '#3b82f6' }} /> Capital & Liabilities Structure
                    </h4>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      {bsLiabEquityData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={bsLiabEquityData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                            <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px' }} formatter={(v) => `₱${fmt(v)}`} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Amount (₱)">
                              {bsLiabEquityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                          No liability/equity data available.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Printable Statements (Hidden on screen, rendered cleanly for printing) */}
          <div className="print-only">
            {activeTab === 'pl' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {incomeRows.map((row, idx) => (
                    <tr key={idx}>
                      <td style={{
                        padding: '0.6rem 1rem',
                        paddingLeft: row.indent ? '2rem' : '1rem',
                        fontWeight: row.bold ? '700' : '400',
                        fontSize: '14px',
                      }}>
                        {row.label}
                      </td>
                      <td style={{
                        padding: '0.6rem 1rem',
                        textAlign: 'right',
                        fontWeight: row.bold ? '700' : '600',
                        fontSize: '14px',
                      }}>
                        {row.value < 0 ? `(₱${fmt(Math.abs(row.value))})` : `₱${fmt(row.value)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {balanceSheetRows.map((row, idx) => {
                    if (row.type === 'header') return <tr key={idx}><td colSpan="2" style={{ fontWeight: '700', padding: '1rem 0 0.5rem 0' }}>{row.label}</td></tr>;
                    if (row.type === 'subheader') return <tr key={idx}><td colSpan="2" style={{ fontWeight: '600', padding: '0.5rem 0 0.25rem 1rem' }}>{row.label}</td></tr>;
                    if (row.type === 'divider') return null;
                    return (
                      <tr key={idx}>
                        <td style={{ padding: '0.5rem 1rem', paddingLeft: row.indent ? '2rem' : '1rem', fontWeight: (row.type === 'total' || row.type === 'grand_total') ? '700' : '400' }}>{row.label}</td>
                        <td style={{ padding: '0.5rem 1rem', textAlign: 'right', fontWeight: (row.type === 'total' || row.type === 'grand_total') ? '700' : '600' }}>{row.value < 0 ? `(₱${fmt(Math.abs(row.value))})` : `₱${fmt(row.value)}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Financials;

