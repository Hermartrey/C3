import React, { useEffect, useState } from 'react';
import api from '../api';
import { Plus, History, ListFilter, Calendar, X, Store, Coins, Droplets, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SalesTracking = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    branch: user?.branch || '',
    timestamp: today,
  });
  const [branchInventory, setBranchInventory] = useState([]);
  const [salesInputs, setSalesInputs] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch branch inventory when selected branch changes in form
  useEffect(() => {
    if (formData.branch) {
      fetchInventory(formData.branch);
    } else {
      setBranchInventory([]);
    }
  }, [formData.branch]);

  // Pre-populate input states when form opens
  useEffect(() => {
    if (showForm) {
      const initial = {};
      fuelTypes.forEach(t => {
        initial[t.id] = { quantity: '', unit_price: '' };
      });
      setSalesInputs(initial);
    }
  }, [showForm, fuelTypes]);

  const fetchInventory = async (branchId) => {
    try {
      const res = await api.get(`/inventory/?branch=${branchId}`);
      setBranchInventory(res.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [salesRes, typesRes, branchesRes] = await Promise.all([
        api.get('/sales/'),
        api.get('/fuel-types/'),
        user?.role === 'ADMIN' ? api.get('/branches/') : Promise.resolve({ data: [] })
      ]);
      setSales(salesRes.data);
      setFuelTypes(typesRes.data);
      setBranches(branchesRes.data);

      const activeBranchId = user?.branch || formData.branch;
      if (activeBranchId) {
        const invRes = await api.get(`/inventory/?branch=${activeBranchId}`);
        setBranchInventory(invRes.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fuelTypeId, field, value) => {
    setSalesInputs(prev => ({
      ...prev,
      [fuelTypeId]: {
        ...prev[fuelTypeId],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.branch) {
        alert("Please select a branch.");
        return;
      }

      const salesToSend = [];
      for (const type of fuelTypes) {
        const input = salesInputs[type.id];
        if (!input) continue;

        const qtyStr = input.quantity.toString().trim();
        const priceStr = input.unit_price.toString().trim();

        if (qtyStr === '' && priceStr === '') {
          continue;
        }

        if (qtyStr === '' || priceStr === '') {
          alert(`Please fill out both Quantity and Unit Price for ${type.name}.`);
          return;
        }

        const qty = parseFloat(qtyStr);
        const price = parseFloat(priceStr);

        if (isNaN(qty) || qty <= 0) {
          alert(`Quantity for ${type.name} must be greater than zero.`);
          return;
        }

        if (isNaN(price) || price <= 0) {
          alert(`Unit Price for ${type.name} must be greater than zero.`);
          return;
        }

        salesToSend.push({
          fuel_type: type.id,
          quantity: qty,
          unit_price: price
        });
      }

      if (salesToSend.length === 0) {
        alert("Please enter at least one fuel sale transaction.");
        return;
      }

      // Send timestamp as full ISO datetime (noon to avoid timezone edge cases)
      const payload = {
        branch: formData.branch,
        timestamp: `${formData.timestamp}T12:00:00`,
        sales: salesToSend
      };

      await api.post('/sales/bulk-create/', payload);
      setShowForm(false);
      setFormData({ branch: user?.branch || '', timestamp: today });
      setSalesInputs({});
      fetchData();
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.error || data?.detail || 'Error recording sales. Check inventory levels.';
      alert(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const groupSales = (salesList) => {
    const groups = {};
    salesList.forEach(sale => {
      const dateKey = new Date(sale.timestamp).toLocaleDateString();
      const key = `${dateKey}_${sale.branch}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          timestamp: sale.timestamp,
          dateStr: dateKey,
          branch: sale.branch,
          branch_name: sale.branch_name,
          recorder_name: sale.recorder_name,
          fuels: [],
          total_quantity: 0,
          total_amount: 0
        };
      }

      const existingFuel = groups[key].fuels.find(f => f.name === sale.fuel_type_name);
      if (existingFuel) {
        existingFuel.quantity += parseFloat(sale.quantity);
        existingFuel.total_amount += parseFloat(sale.total_amount);
        existingFuel.unit_price = existingFuel.total_amount / existingFuel.quantity;
      } else {
        groups[key].fuels.push({
          name: sale.fuel_type_name,
          quantity: parseFloat(sale.quantity),
          unit_price: parseFloat(sale.unit_price),
          total_amount: parseFloat(sale.total_amount)
        });
      }

      groups[key].total_quantity += parseFloat(sale.quantity);
      groups[key].total_amount += parseFloat(sale.total_amount);
    });
    return Object.values(groups).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  };

  const groupedSales = groupSales(sales);

  // Filter Sales by Date Range and Branch
  const filteredGroupedSales = groupedSales.filter(group => {
    const saleDateStr = new Date(group.timestamp).toISOString().split('T')[0];
    if (dateFrom && saleDateStr < dateFrom) return false;
    if (dateTo && saleDateStr > dateTo) return false;
    if (selectedBranch && group.branch?.toString() !== selectedBranch.toString()) return false;
    return true;
  });

  const totalFilteredAmount = filteredGroupedSales.reduce((acc, curr) => acc + curr.total_amount, 0);
  const totalFilteredVolume = filteredGroupedSales.reduce((acc, curr) => acc + curr.total_quantity, 0);

  const isManager = user?.role !== 'ADMIN';

  if (loading) return <div>Loading Sales Data...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem' }}>Sales</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor and record fuel transactions across stations</p>
        </div>
        {user?.role === 'MANAGER' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={20} /> Record Daily Sales
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card" style={{ marginBottom: '2rem', maxWidth: '800px' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Record Daily Transactions</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ marginBottom: '0.5rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={14} /> Date of Sale
                </label>
                <input
                  id="sale-date-input"
                  type="date"
                  className="input"
                  value={formData.timestamp}
                  onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                  required
                />
              </div>
              {user?.role === 'ADMIN' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Branch</label>
                  <select
                    className="input"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Fuel Type</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Available Stock</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-muted)', width: '180px' }}>Quantity Sold (Liters)</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-muted)', width: '180px' }}>Unit Price (₱/L)</th>
                    <th style={{ padding: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>Total (₱)</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelTypes.map(type => {
                    const invItem = branchInventory.find(i => i.fuel_type === type.id);
                    const currentStock = invItem ? parseFloat(invItem.current_stock) : 0;
                    const input = salesInputs[type.id] || { quantity: '', unit_price: '' };
                    const subtotal = (parseFloat(input.quantity) || 0) * (parseFloat(input.unit_price) || 0);

                    return (
                      <tr key={type.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{type.name}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span className="badge" style={{
                            background: currentStock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: currentStock > 0 ? 'var(--success, #10b981)' : 'var(--danger, #ef4444)'
                          }}>
                            {currentStock.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L available
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="input"
                            style={{ padding: '0.375rem 0.75rem' }}
                            value={input.quantity}
                            onChange={(e) => handleInputChange(type.id, 'quantity', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="input"
                            style={{ padding: '0.375rem 0.75rem' }}
                            value={input.unit_price}
                            onChange={(e) => handleInputChange(type.id, 'unit_price', e.target.value)}
                          />
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                          ₱{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save Daily Sales</button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction History Glass Card */}
      <div className="glass-card">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem'
        }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <History size={20} /> Transaction History
          </h3>

          {/* Date & Branch Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {user?.role === 'ADMIN' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Store size={15} style={{ color: 'var(--primary)' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Branch:</span>
                <select
                  id="admin-sales-branch-filter"
                  className="input"
                  style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', width: 'auto', minWidth: '150px' }}
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>From:</span>
              <input
                id="sales-date-from"
                type="date"
                className="input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>To:</span>
              <input
                id="sales-date-to"
                type="date"
                className="input"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {(dateFrom || dateTo || selectedBranch) && (
              <button
                id="clear-sales-filters-btn"
                onClick={() => { setDateFrom(''); setDateTo(''); setSelectedBranch(''); }}
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                title="Clear all filters"
              >
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Summary Metrics */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          marginBottom: '1rem',
          padding: '0.55rem 0.85rem',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          fontSize: '0.78rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Transactions:</span>
            <strong style={{ color: 'var(--text-main)' }}>{filteredGroupedSales.length} batches</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Droplets size={14} style={{ color: 'var(--secondary)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Total Volume:</span>
            <strong style={{ color: 'var(--secondary)' }}>
              {totalFilteredVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
            </strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Coins size={14} style={{ color: 'var(--primary)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Total Revenue:</span>
            <strong style={{ color: 'var(--primary)' }}>
              ₱{totalFilteredAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          {selectedBranch && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', fontSize: '0.72rem' }}>
                🏢 Station: {branches.find(b => b.id.toString() === selectedBranch.toString())?.name || 'Selected'}
              </span>
            </div>
          )}
        </div>

        <div className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Date</th>
                {!isManager && (
                  <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Branch</th>
                )}
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>Fuels Sold</th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Total Liters</th>
                <th style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Total Revenue</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroupedSales.length > 0 ? filteredGroupedSales.map(group => (
                <tr key={group.key} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 500 }}>{group.dateStr}</td>
                  {!isManager && (
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        <Store size={14} style={{ color: '#8b5cf6' }} />
                        {group.branch_name}
                      </span>
                    </td>
                  )}
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {group.fuels.map((f, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '0.15rem 0.45rem', fontSize: '0.75rem' }}>
                            {f.name}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {f.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L @ ₱{f.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 500 }}>
                    {group.total_quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: '700', textAlign: 'right', color: 'var(--primary)' }}>
                    ₱{group.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={isManager ? 4 : 5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {(dateFrom || dateTo || selectedBranch) ? 'No transactions found matching the selected branch or date range.' : 'No sales transactions recorded yet.'}
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

export default SalesTracking;
