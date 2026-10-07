import React, { useEffect, useState } from 'react';
import api from '../api';
import { Wallet, Plus, Calendar, History, AlertCircle, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Expenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchDescription, setSearchDescription] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    timestamp: today,
    branch: user?.branch || '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expRes, branchRes] = await Promise.all([
        api.get('/expenses/'),
        api.get('/branches/'),
      ]);
      setExpenses(expRes.data);
      setBranches(branchRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        timestamp: `${formData.timestamp}T12:00:00`,
      };
      // Managers don't need to send branch (backend sets it automatically)
      if (user?.role === 'MANAGER') {
        delete payload.branch;
      }
      await api.post('/expenses/', payload);
      setShowForm(false);
      setFormData({ description: '', amount: '', timestamp: today, branch: user?.branch || '' });
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.detail || data?.error || 'Error recording expense.';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n) =>
    parseFloat(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // Filter expenses by description (and branch if admin)
  const filteredExpenses = expenses.filter((exp) => {
    const matchesDesc = !searchDescription || (exp.description || '').toLowerCase().includes(searchDescription.toLowerCase());
    const matchesBranch = !selectedBranch || (exp.branch && exp.branch.toString() === selectedBranch.toString());
    return matchesDesc && matchesBranch;
  });

  const totalExpenses = filteredExpenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0);

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>;

  const isManager = user?.role !== 'ADMIN';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={28} style={{ color: 'var(--primary)' }} /> Expenses
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Record and track operating expenses for your branch</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} /> Log Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.85rem', borderRadius: '12px', color: '#ef4444' }}>
            <Wallet size={26} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {searchDescription ? 'Filtered Total' : 'Total Expenses'}
            </p>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>₱{fmt(totalExpenses)}</h3>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.85rem', borderRadius: '12px', color: '#3b82f6' }}>
            <History size={26} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Records Count</p>
            <h3 style={{ fontSize: '1.5rem', marginTop: '0.2rem' }}>{filteredExpenses.length} Expenses</h3>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glass-card" style={{ marginBottom: '1.5rem', maxWidth: '640px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Log New Expense</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Description</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Electricity Bill, Wages, Maintenance"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} /> Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.timestamp}
                  onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                  required
                />
              </div>
              {user?.role === 'ADMIN' && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Branch</label>
                  <select
                    className="input"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense Log */}
      <div className="glass-card">
        <div style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <History size={20} /> Expense Log
          </h3>

          {/* Description Filter Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {user?.role === 'ADMIN' && (
              <select
                className="input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}

            <div style={{ position: 'relative', width: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Filter by description..."
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
                style={{ paddingLeft: '2.3rem', paddingRight: searchDescription ? '2.2rem' : '0.75rem', fontSize: '0.85rem' }}
              />
              {searchDescription && (
                <button
                  onClick={() => setSearchDescription('')}
                  style={{
                    position: 'absolute',
                    right: '0.6rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Clear filter"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Date</th>
                {!isManager && (
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Branch</th>
                )}
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Description</th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500, textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? filteredExpenses.map((exp) => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>
                    {new Date(exp.timestamp).toLocaleDateString()}
                  </td>
                  {!isManager && (
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.875rem' }}>{exp.branch_name}</td>
                  )}
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{exp.description}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#ef4444', textAlign: 'right' }}>₱{fmt(exp.amount)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isManager ? 3 : 4} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <AlertCircle size={20} style={{ opacity: 0.4, display: 'block', margin: '0 auto 0.5rem' }} />
                    {searchDescription ? `No expenses matching "${searchDescription}"` : 'No expenses recorded yet.'}
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

export default Expenses;

