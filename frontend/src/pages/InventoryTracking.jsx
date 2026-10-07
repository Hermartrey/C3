import React, { useEffect, useState } from 'react';
import api from '../api';
import { Truck, History, Store, Edit2, Plus, X, Save, AlertCircle, Fuel, BarChart3, Droplets } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';

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

const InventoryTracking = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [fuelTypes, setFuelTypes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('');

  // Manager Tank Refill Delivery Form
  const [formData, setFormData] = useState({
    fuel_type: '',
    quantity: '',
    cost_price: '',
    branch: user?.branch || ''
  });

  // Owner Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState({ current_stock: '', capacity: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Owner Add/Initialize Inventory Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({ branch: '', fuel_type: '', current_stock: '', capacity: '' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, typeRes, delRes, branchRes] = await Promise.all([
        api.get('/inventory/'),
        api.get('/fuel-types/'),
        api.get('/deliveries/'),
        user?.role === 'ADMIN' ? api.get('/branches/') : Promise.resolve({ data: [] })
      ]);
      setInventory(invRes.data);
      setFuelTypes(typeRes.data);
      setDeliveries(delRes.data);
      setBranches(branchRes.data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Manager Delivery Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deliveries/', formData);
      setShowForm(false);
      setFormData({ fuel_type: '', quantity: '', cost_price: '', branch: user?.branch || '' });
      fetchData();
    } catch (err) {
      alert('Error recording delivery');
    }
  };

  // Handle Owner Edit Click
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditFormData({
      current_stock: item.current_stock,
      capacity: item.capacity
    });
    setEditError('');
  };

  // Handle Owner Edit Submit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setEditLoading(true);
    setEditError('');

    try {
      await api.patch(`/inventory/${editingItem.id}/`, {
        current_stock: parseFloat(editFormData.current_stock),
        capacity: parseFloat(editFormData.capacity)
      });
      setEditingItem(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update inventory:', err);
      setEditError(err.response?.data?.error || err.response?.data?.detail || 'Failed to save inventory updates.');
    } finally {
      setEditLoading(false);
    }
  };

  // Handle Owner Add Submit
  const handleSaveAdd = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError('');

    try {
      await api.post('/inventory/', {
        branch: addFormData.branch,
        fuel_type: addFormData.fuel_type,
        current_stock: parseFloat(addFormData.current_stock || 0),
        capacity: parseFloat(addFormData.capacity || 0)
      });
      setShowAddModal(false);
      setAddFormData({ branch: '', fuel_type: '', current_stock: '', capacity: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add inventory:', err);
      setAddError(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to create inventory record.');
    } finally {
      setAddLoading(false);
    }
  };

  const groupInventoryByBranch = (inventoryItems) => {
    const groups = {};
    inventoryItems.forEach(item => {
      const branchName = item.branch_name || 'Unassigned Branch';
      if (!groups[branchName]) {
        groups[branchName] = [];
      }
      groups[branchName].push(item);
    });
    return groups;
  };

  const filteredInventory = (user?.role === 'ADMIN' && selectedBranch)
    ? inventory.filter(item => String(item.branch) === String(selectedBranch) || item.branch_name === selectedBranch)
    : inventory;

  const filteredDeliveries = (user?.role === 'ADMIN' && selectedBranch)
    ? deliveries.filter(del => String(del.branch) === String(selectedBranch) || del.branch_name === selectedBranch)
    : deliveries;

  const groupedInventory = groupInventoryByBranch(filteredInventory);

  const totalCurrentStock = filteredInventory.reduce((sum, item) => sum + parseFloat(item.current_stock || 0), 0);
  const totalCapacity = filteredInventory.reduce((sum, item) => sum + parseFloat(item.capacity || 0), 0);
  const overallPercent = totalCapacity > 0 ? ((totalCurrentStock / totalCapacity) * 100).toFixed(0) : 0;

  const chartData = filteredInventory.map(item => ({
    name: user?.role === 'ADMIN' ? `${item.branch_name?.split(' ')[0]} - ${item.fuel_type_name}` : item.fuel_type_name,
    'Current Stock': parseFloat(item.current_stock || 0),
    'Total Capacity': parseFloat(item.capacity || 0)
  }));

  const fmt = (n) => parseFloat(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      Loading Inventory Data...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
      {/* Screen Header & Controls Toolbar */}
      <div className="no-print" style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.65rem',
        background: 'var(--glass)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '0.55rem 0.9rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontWeight: 700 }}>
            <Fuel size={20} style={{ color: 'var(--primary)' }} /> Inventory Tracking
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
            {user?.role === 'ADMIN' ? 'All Branch Fuel Tanks' : `${user?.branch_name || 'My Branch'} Fuel Stock`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {user?.role === 'ADMIN' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Store size={14} style={{ color: 'var(--text-muted)' }} />
                <select
                  id="admin-inventory-branch-filter"
                  className="input"
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.78rem', width: 'auto', minWidth: '140px' }}
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                >
                  <option value="">All Branches</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }} onClick={() => setShowAddModal(true)}>
                <Plus size={14} /> Initialize Stock
              </button>
            </>
          )}
          {user?.role === 'MANAGER' && (
            <button className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }} onClick={() => setShowForm(!showForm)}>
              <Truck size={14} /> Record Delivery
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Summary Band */}
      <div className="no-print" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.5rem'
      }}>
        <MiniStat title="Total Fuel Available" value={`${fmt(totalCurrentStock)} L`} icon={Droplets} color="#3b82f6" />
        <MiniStat title="Total Tank Capacity"  value={`${fmt(totalCapacity)} L`}     icon={Fuel}     color="#8b5cf6" />
        <MiniStat 
          title="Overall Fill Level"    
          value={`${overallPercent}%`} 
          icon={BarChart3} 
          color={overallPercent < 30 ? '#ef4444' : '#10b981'} 
          subtitle={overallPercent < 30 ? 'Low Stock Warning' : 'Healthy Stock'}
        />
        <MiniStat title="Active Tanks"         value={`${filteredInventory.length} Tanks`}    icon={Store}    color="#f59e0b" />
        <MiniStat title="Deliveries Logged"    value={`${filteredDeliveries.length} Records`} icon={History}  color="#10b981" />
      </div>

      {/* Main Dashboard Workspace */}
      <div className="financial-workspace no-print" style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 1fr) minmax(380px, 1.15fr)',
        gap: '0.65rem',
        height: 'calc(100vh - 215px)',
        minHeight: '440px'
      }}>
        {/* Left Column: Branch Fuel Stock Levels */}
        <div className="glass-card" style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0.75rem 0.85rem',
          height: '100%',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
            paddingBottom: '0.35rem',
            borderBottom: '1px solid var(--border)'
          }}>
            <h3 style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0, fontWeight: 700 }}>
              <Fuel size={15} style={{ color: 'var(--primary)' }} /> Fuel Stock Levels
            </h3>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {filteredInventory.length} Tanks Monitored
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.2rem' }}>
            {Object.keys(groupedInventory).length > 0 ? (
              Object.entries(groupedInventory).map(([branchName, items]) => (
                <div key={branchName} style={{ marginBottom: '0.85rem' }}>
                  {user?.role === 'ADMIN' && (
                    <h4 style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      marginBottom: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      color: 'var(--primary)'
                    }}>
                      <Store size={14} /> {branchName}
                    </h4>
                  )}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '0.35rem 0.4rem' }}>Fuel</th>
                        <th style={{ padding: '0.35rem 0.4rem' }}>Fill Level</th>
                        <th style={{ padding: '0.35rem 0.4rem', textAlign: 'right' }}>Stock (L)</th>
                        <th style={{ padding: '0.35rem 0.4rem', textAlign: 'right' }}>Capacity (L)</th>
                        {user?.role === 'ADMIN' && <th style={{ padding: '0.35rem 0.4rem', textAlign: 'right' }}>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const percent = (parseFloat(item.current_stock) / parseFloat(item.capacity)) * 100 || 0;
                        const isLow = percent < 20;

                        return (
                          <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '0.45rem 0.4rem', fontWeight: '600' }}>{item.fuel_type_name}</td>
                            <td style={{ padding: '0.45rem 0.4rem', width: '130px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${Math.min(percent, 100)}%`,
                                    background: isLow ? 'var(--error)' : 'var(--success)',
                                    transition: 'width 0.4s ease'
                                  }} />
                                </div>
                                <span style={{ fontSize: '0.68rem', color: isLow ? '#ef4444' : 'var(--text-muted)', fontWeight: '600', minWidth: '28px' }}>
                                  {percent.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.45rem 0.4rem', textAlign: 'right', fontWeight: '700', color: isLow ? '#ef4444' : 'var(--text-main)' }}>
                              {fmt(item.current_stock)}
                            </td>
                            <td style={{ padding: '0.45rem 0.4rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                              {fmt(item.capacity)}
                            </td>
                            {user?.role === 'ADMIN' && (
                              <td style={{ padding: '0.45rem 0.4rem', textAlign: 'right' }}>
                                <button
                                  className="btn btn-outline"
                                  onClick={() => handleOpenEdit(item)}
                                  style={{ padding: '0.15rem 0.45rem', fontSize: '0.7rem' }}
                                >
                                  <Edit2 size={11} /> Edit
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No inventory records found.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stock Visualizations & Delivery Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', height: '100%', overflow: 'hidden' }}>
          {/* Top Half: Fuel Tank Level Visualization Chart */}
          <div className="glass-card" style={{ flex: '1 1 50%', minHeight: 0, padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <BarChart3 size={14} style={{ color: '#3b82f6' }} /> Fuel Tank Levels vs Capacity
            </h4>
            <div style={{ flex: 1, minHeight: 0 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                    <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '11px', padding: '6px 10px' }} formatter={(val) => `${fmt(val)} L`} />
                    <Bar dataKey="Current Stock" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Total Capacity" fill="#3b82f6" opacity={0.3} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  No tank visualization data.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Half: Recent Delivery Log Table */}
          <div className="glass-card" style={{ flex: '1 1 50%', minHeight: 0, padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <History size={14} style={{ color: '#f59e0b' }} /> Delivery History Log
            </h4>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredDeliveries.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.35rem 0.4rem' }}>Date</th>
                      <th style={{ padding: '0.35rem 0.4rem' }}>Fuel</th>
                      <th style={{ padding: '0.35rem 0.4rem', textAlign: 'right' }}>Qty</th>
                      <th style={{ padding: '0.35rem 0.4rem', textAlign: 'right' }}>Cost/L</th>
                      <th style={{ padding: '0.35rem 0.4rem' }}>Recorded By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDeliveries.map(del => (
                      <tr key={del.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '0.4rem 0.4rem', color: 'var(--text-muted)' }}>{new Date(del.timestamp).toLocaleDateString()}</td>
                        <td style={{ padding: '0.4rem 0.4rem', fontWeight: '600' }}>{del.fuel_type_name}</td>
                        <td style={{ padding: '0.4rem 0.4rem', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>{fmt(del.quantity)} L</td>
                        <td style={{ padding: '0.4rem 0.4rem', textAlign: 'right' }}>₱{fmt(del.cost_price)}</td>
                        <td style={{ padding: '0.4rem 0.4rem', color: 'var(--text-muted)' }}>{del.recorder_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                  No delivery logs recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Owner Edit Stock Modal */}
      {editingItem && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '440px', background: '#1e293b', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Edit Fuel Stock</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {editingItem.branch_name} — {editingItem.fuel_type_name}
                </p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '0.55rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={16} /> {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: '500' }}>
                  Current Stock (Liters)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  value={editFormData.current_stock}
                  onChange={(e) => setEditFormData({ ...editFormData, current_stock: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem', fontWeight: '500' }}>
                  Tank Capacity (Liters)
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  value={editFormData.capacity}
                  onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }} onClick={() => setEditingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }} disabled={editLoading}>
                  <Save size={14} /> {editLoading ? 'Saving...' : 'Save Stock Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Owner Initialize/Add Stock Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '460px', background: '#1e293b', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Initialize Fuel Inventory</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '0.55rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <AlertCircle size={16} /> {addError}
              </div>
            )}

            <form onSubmit={handleSaveAdd}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>Branch</label>
                  <select
                    className="input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    value={addFormData.branch}
                    onChange={(e) => setAddFormData({ ...addFormData, branch: e.target.value })}
                    required
                  >
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>Fuel Type</label>
                  <select
                    className="input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    value={addFormData.fuel_type}
                    onChange={(e) => setAddFormData({ ...addFormData, fuel_type: e.target.value })}
                    required
                  >
                    <option value="">Select Fuel</option>
                    {fuelTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>Current Stock (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    value={addFormData.current_stock}
                    onChange={(e) => setAddFormData({ ...addFormData, current_stock: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>Tank Capacity (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    value={addFormData.capacity}
                    onChange={(e) => setAddFormData({ ...addFormData, capacity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }} onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }} disabled={addLoading}>
                  {addLoading ? 'Saving...' : 'Create Stock Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manager Tank Refill Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', background: '#1e293b', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Record Tank Refill Delivery</h3>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>Fuel Type</label>
                  <select
                    className="input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    value={formData.fuel_type}
                    onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    required
                  >
                    <option value="">Select Fuel</option>
                    {fuelTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>Quantity (Liters)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.8rem' }}>Cost Price (per Liter)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  value={formData.cost_price}
                  onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }} onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
                  Save Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTracking;

