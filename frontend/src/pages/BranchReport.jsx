import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  ArrowLeft, Store, MapPin, Coins,
  Droplets, TrendingUp, Fuel, Wallet,
  AlertTriangle, CheckCircle2, History, Truck, MessageSquare
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

/* ── Stat Card ─────────────────────────────────────────────────── */
const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
    <div style={{ background: `${color}18`, padding: '0.85rem', borderRadius: '12px', color }}>
      <Icon size={26} />
    </div>
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{title}</p>
      <h3 style={{ fontSize: '1.4rem', marginTop: '0.2rem' }}>{value}</h3>
    </div>
  </div>
);

/* ── Main Page ─────────────────────────────────────────────────── */
const BranchReport = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();

  const [branch, setBranch]       = useState(null);
  const [sales, setSales]         = useState([]);
  const [inventory, setInventory] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [expenses, setExpenses]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [branchRes, salesRes, invRes, delRes, expRes] = await Promise.all([
          api.get(`/branches/${branchId}/`),
          api.get(`/sales/?branch=${branchId}`),
          api.get(`/inventory/?branch=${branchId}`),
          api.get(`/deliveries/?branch=${branchId}`),
          api.get(`/expenses/?branch=${branchId}`),
        ]);
        setBranch(branchRes.data);
        setSales(salesRes.data);
        setInventory(invRes.data);
        setDeliveries(delRes.data);
        setExpenses(expRes.data);
      } catch (err) {
        setError('Failed to load branch details. Branch may not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [branchId]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      Loading branch details...
    </div>
  );

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
      <AlertTriangle size={40} color="#ef4444" />
      <p style={{ color: '#ef4444' }}>{error}</p>
      <button className="btn btn-outline" onClick={() => navigate('/branches')}>
        <ArrowLeft size={16} /> Back to Branches
      </button>
    </div>
  );

  /* ── Computed stats ── */
  const totalSales    = sales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
  const totalLiters   = sales.reduce((sum, s) => sum + parseFloat(s.quantity || 0), 0);
  const totalCost     = deliveries.reduce((sum, d) => sum + parseFloat(d.quantity || 0) * parseFloat(d.cost_price || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
  const netProfit     = totalSales - totalCost - totalExpenses;

  /* ── Daily sales chart data (last 14 days) ── */
  const dailyMap = {};
  sales.forEach((s) => {
    const date = new Date(s.timestamp).toLocaleDateString('en-CA'); // YYYY-MM-DD
    dailyMap[date] = (dailyMap[date] || 0) + parseFloat(s.total_amount || 0);
  });
  const dailySales = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, amount]) => ({ date, amount: parseFloat(amount.toFixed(2)) }));

  /* ── Inventory chart data ── */
  const inventoryChart = inventory.map((item) => ({
    name: item.fuel_type_name,
    stock: parseFloat(parseFloat(item.current_stock).toFixed(2)),
    capacity: parseFloat(parseFloat(item.capacity).toFixed(2)),
  }));

  const fmt = (n) => parseFloat(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const groupSales = (salesList) => {
    const groups = {};
    salesList.forEach(sale => {
      const key = `${sale.timestamp}_${sale.branch}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          timestamp: sale.timestamp,
          branch_name: sale.branch_name,
          recorder_name: sale.recorder_name,
          fuels: [],
          total_quantity: 0,
          total_amount: 0
        };
      }
      groups[key].fuels.push({
        name: sale.fuel_type_name,
        quantity: parseFloat(sale.quantity),
        unit_price: parseFloat(sale.unit_price),
        total_amount: parseFloat(sale.total_amount)
      });
      groups[key].total_quantity += parseFloat(sale.quantity);
      groups[key].total_amount += parseFloat(sale.total_amount);
    });
    return Object.values(groups).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const groupedSales = groupSales(sales);

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          id="back-to-branches-btn"
          className="btn btn-outline"
          style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}
          onClick={() => navigate('/branches')}
        >
          <ArrowLeft size={16} /> Back to Branches
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(139,92,246,0.12)', padding: '0.9rem', borderRadius: '14px', color: '#8b5cf6' }}>
              <Store size={28} />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem' }}>{branch.name}</h1>
              <p style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                <MapPin size={14} /> {branch.location}{branch.address ? ` — ${branch.address}` : ''}
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/messages?branch=${branch.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <MessageSquare size={18} /> Message Branch Manager
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '2rem' }}>
        <StatCard title="Total Revenue"    value={`₱${fmt(totalSales)}`}   icon={Coins}  color="#3b82f6" />
        <StatCard title="Total Liters Sold" value={`${fmt(totalLiters)} L`} icon={Droplets}    color="#10b981" />
        <StatCard title="Total Expenses"    value={`₱${fmt(totalExpenses)}`} icon={Wallet}    color="#ef4444" />
        <StatCard title="Net Profit"        value={`₱${fmt(netProfit)}`}    icon={TrendingUp}  color="#f59e0b" />
        <StatCard title="Fuel Types Stocked" value={inventory.length}       icon={Fuel}        color="#8b5cf6" />
      </div>

      {/* ── Charts Row ── */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', marginBottom: '2rem' }}>

        {/* Sales trend */}
        <div className="glass-card" style={{ height: '360px' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Sales Revenue Trend</h3>
          {dailySales.length > 0 ? (
            <ResponsiveContainer width="100%" height="82%">
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="branchSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} itemStyle={{ color: '#f8fafc' }} />
                <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="url(#branchSalesGrad)" name="Revenue (₱)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '82%', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
              <TrendingUp size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>No sales recorded yet for this branch.</p>
            </div>
          )}
        </div>

        {/* Inventory bar chart */}
        <div className="glass-card" style={{ height: '360px' }}>
          <h3 style={{ marginBottom: '1.25rem' }}>Inventory by Fuel Type</h3>
          {inventoryChart.length > 0 ? (
            <ResponsiveContainer width="100%" height="82%">
              <BarChart data={inventoryChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} itemStyle={{ color: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                <Bar dataKey="stock"    fill="#10b981" name="Current Stock (L)" radius={[4,4,0,0]} />
                <Bar dataKey="capacity" fill="#334155" name="Capacity (L)"       radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '82%', color: 'var(--text-muted)', flexDirection: 'column', gap: '0.5rem' }}>
              <Fuel size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '0.875rem' }}>No inventory records for this branch.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Inventory Status Cards ── */}
      {inventory.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Fuel size={18} /> Live Inventory Status
          </h3>
          <div className="dashboard-grid">
            {inventory.map((item) => {
              const pct = (parseFloat(item.current_stock) / parseFloat(item.capacity)) * 100 || 0;
              const isLow = pct < 20;
              return (
                <div key={item.id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4>{item.fuel_type_name}</h4>
                    {isLow
                      ? <AlertTriangle color="#ef4444" size={20} />
                      : <CheckCircle2  color="#22c55e"  size={20} />}
                  </div>
                  <div style={{ margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Current</span>
                      <span style={{ fontWeight: 600 }}>{fmt(item.current_stock)} L</span>
                    </div>
                    <div style={{ height: '7px', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${Math.min(pct, 100)}%`,
                        background: isLow ? 'var(--error)' : 'var(--success)',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                    <div style={{ textAlign: 'right', marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      of {fmt(item.capacity)} L capacity ({pct.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Sales History Table ── */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} /> Sales Transactions
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            {groupedSales.length} daily record{groupedSales.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Fuels Sold', 'Total Liters', 'Total Revenue', 'Recorded By'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groupedSales.length > 0 ? groupedSales.map((group) => (
                <tr key={group.key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>{new Date(group.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {group.fuels.map((f, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className="badge" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--primary)', padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}>
                            {f.name}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {f.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L @ ₱{f.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>{group.total_quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>₱{fmt(group.total_amount)}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{group.recorder_name}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transactions found for this branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Delivery Log Table ── */}
      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Truck size={18} /> Delivery Log
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            {deliveries.length} record{deliveries.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Fuel Type', 'Quantity', 'Cost / L', 'Total Cost', 'Recorder'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deliveries.length > 0 ? deliveries.map((d) => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>{new Date(d.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                      {d.fuel_type_name}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>{d.quantity} L</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>₱{fmt(d.cost_price)}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                    ₱{fmt(parseFloat(d.quantity) * parseFloat(d.cost_price))}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{d.recorder_name}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No deliveries recorded for this branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Expenses Log Table ── */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wallet size={18} /> Expenses Log
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            {expenses.length} record{expenses.length !== 1 ? 's' : ''}
          </span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Description', 'Amount', 'Recorded By'].map((h) => (
                  <th key={h} style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.length > 0 ? expenses.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>{new Date(e.timestamp).toLocaleString()}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>{e.description}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#ef4444' }}>₱{fmt(e.amount)}</td>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{e.recorder_name}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="4" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No expenses recorded for this branch.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BranchReport;
