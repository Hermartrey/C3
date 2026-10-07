import React, { useEffect, useState } from 'react';
import api from '../api';
import {
  MapPin, Plus, Store, Users, TrendingUp,
  X, Mail, UserCheck, KeyRound, UserPlus, CheckCircle2, Trash2, Pencil, MessageSquare, Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── Mini Stat Card ───────────────────────────────────── */
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

/* ─── Managers Modal ──────────────────────────────────────────── */
const ManagersModal = ({ branch, onClose, onManagerCreated }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/managers/', { ...formData, branch: branch.id });
      setSuccess(`Manager "${formData.username}" created successfully!`);
      setFormData({ username: '', password: '', email: '' });
      setShowCreateForm(false);
      onManagerCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create manager.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="managers-modal-overlay"
      onClick={(e) => e.target.id === 'managers-modal-overlay' && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, backdropFilter: 'blur(4px)', padding: '1rem'
      }}
    >
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '480px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
              <Users size={18} color="var(--primary)" /> Branch Managers
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
              {branch.name} — {branch.location}
            </p>
          </div>
          <button
            id="close-managers-modal"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.35rem', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {success && (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            color: '#10b981', borderRadius: '8px', padding: '0.6rem 0.85rem',
            marginBottom: '0.85rem', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        {branch.managers_list && branch.managers_list.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {branch.managers_list.map((m) => (
              <div
                key={m.id}
                style={{
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}
              >
                <div style={{
                  background: 'rgba(59,130,246,0.12)', padding: '0.45rem',
                  borderRadius: '50%', color: 'var(--primary)', flexShrink: 0
                }}>
                  <UserCheck size={16} />
                </div>
                <div>
                  <p style={{ fontWeight: '600', fontSize: '0.85rem', margin: 0 }}>{m.username}</p>
                  <p style={{
                    color: 'var(--text-muted)', fontSize: '0.75rem',
                    display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem', margin: 0
                  }}>
                    <Mail size={11} /> {m.email || 'No email provided'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !showCreateForm && (
            <div style={{
              textAlign: 'center', padding: '1.25rem 1rem',
              color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)',
              borderRadius: '8px', marginBottom: '1rem'
            }}>
              <Users size={28} style={{ marginBottom: '0.4rem', opacity: 0.35 }} />
              <p style={{ fontSize: '0.8rem', margin: 0 }}>No managers assigned to this branch yet.</p>
            </div>
          )
        )}

        {showCreateForm ? (
          <form onSubmit={handleCreate}>
            <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.9rem' }}>
              <UserPlus size={16} /> New Manager Account
            </h4>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', borderRadius: '8px', padding: '0.6rem 0.85rem',
                marginBottom: '0.85rem', fontSize: '0.8rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Username <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  id="new-manager-username"
                  type="text"
                  className="input"
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                  placeholder="e.g. john_doe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Password <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="new-manager-password"
                    type="password"
                    className="input"
                    style={{ paddingLeft: '2.2rem', padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.85rem' }}
                    placeholder="Set a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Email <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="new-manager-email"
                    type="email"
                    className="input"
                    style={{ paddingLeft: '2.2rem', padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.85rem' }}
                    placeholder="manager@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                id="create-manager-submit"
                type="submit"
                className="btn btn-primary"
                disabled={submitting}
                style={{ flex: 1, justifyContent: 'center', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                {submitting ? 'Creating...' : <><UserPlus size={15} /> Create Manager</>}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => { setShowCreateForm(false); setError(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            id="show-create-manager-form"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            onClick={() => { setShowCreateForm(true); setSuccess(''); }}
          >
            <UserPlus size={16} /> Add New Manager
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Edit Branch Modal ─────────────────────────────────────────── */
const EditBranchModal = ({ branch, onClose, onBranchUpdated }) => {
  const [formData, setFormData] = useState({
    name: branch.name || '',
    location: branch.location || '',
    address: branch.address || ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.put(`/branches/${branch.id}/`, formData);
      onBranchUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to update branch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="edit-branch-modal-overlay"
      onClick={(e) => e.target.id === 'edit-branch-modal-overlay' && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, backdropFilter: 'blur(4px)', padding: '1rem'
      }}
    >
      <div
        className="glass-card"
        style={{ width: '100%', maxWidth: '460px', position: 'relative' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
              <Pencil size={18} color="var(--primary)" /> Edit Branch Details
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              Update details for {branch.name}
            </p>
          </div>
          <button
            id="close-edit-branch-modal"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.35rem', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', borderRadius: '8px', padding: '0.6rem 0.85rem',
            marginBottom: '0.85rem', fontSize: '0.8rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem' }}>Branch Name</label>
              <input
                id="edit-branch-name-input"
                type="text"
                className="input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem' }}>City/Region</label>
              <input
                id="edit-branch-location-input"
                type="text"
                className="input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem' }}>Full Address</label>
              <textarea
                id="edit-branch-address-input"
                className="input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button id="save-branch-edit-submit" type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Create Branch Modal ─────────────────────────────────────── */
const CreateBranchModal = ({ onClose, onBranchCreated }) => {
  const [formData, setFormData] = useState({ name: '', location: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/branches/', formData);
      onBranchCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create branch.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="create-branch-modal-overlay"
      onClick={(e) => e.target.id === 'create-branch-modal-overlay' && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1100, backdropFilter: 'blur(4px)', padding: '1rem'
      }}
    >
      <div className="glass-card" style={{ width: '100%', maxWidth: '460px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '1.1rem' }}>
              <Plus size={18} color="var(--primary)" /> Create New Branch
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.2rem' }}>
              Set up a new station location
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
              borderRadius: '8px', padding: '0.35rem', cursor: 'pointer',
              color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0
            }}
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#ef4444', borderRadius: '8px', padding: '0.6rem 0.85rem',
            marginBottom: '0.85rem', fontSize: '0.8rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem' }}>Branch Name</label>
              <input
                id="branch-name-input"
                type="text"
                className="input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. North Station"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem' }}>City/Region</label>
              <input
                id="branch-location-input"
                type="text"
                className="input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                placeholder="e.g. Manila"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem' }}>Full Address</label>
              <textarea
                id="branch-address-input"
                className="input"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                rows="2"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Detailed street address..."
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <button id="create-branch-submit" type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1, justifyContent: 'center', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
              {submitting ? 'Creating...' : 'Create Branch'}
            </button>
            <button type="button" className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Main Page ───────────────────────────────────────────────── */
const BranchManagement = () => {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [editingBranch, setEditingBranch] = useState(null);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const res = await api.get('/branches/');
      setBranches(res.data);
      if (selectedBranch) {
        const updated = res.data.find((b) => b.id === selectedBranch.id);
        if (updated) setSelectedBranch(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (id, name) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the branch "${name}"?\n\nWARNING: This will permanently delete all associated sales, deliveries, inventories, and expenses for this branch. This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/branches/${id}/`);
      fetchBranches();
    } catch (err) {
      console.error(err);
      alert('Error deleting branch. Please try again.');
    }
  };

  const totalManagers = branches.reduce((acc, b) => acc + (b.managers_list?.length || 0), 0);
  const uniqueCities = [...new Set(branches.map(b => b.location).filter(Boolean))].length;

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      Loading Branch Infrastructure...
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
            <Building2 size={20} style={{ color: 'var(--primary)' }} /> Branch Management
          </h2>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
            Owner Infrastructure Portal
          </span>
        </div>

        <button id="add-branch-btn" className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }} onClick={() => setShowForm(true)}>
          <Plus size={14} /> Add New Branch
        </button>
      </div>

      {/* KPI Metrics Summary Band */}
      <div className="no-print" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '0.5rem'
      }}>
        <MiniStat title="Active Stations" value={`${branches.length} Branches`} icon={Store} color="#3b82f6" />
        <MiniStat title="Assigned Managers" value={`${totalManagers} Managers`} icon={Users} color="#10b981" />
        <MiniStat title="Cities/Regions" value={`${uniqueCities} Locations`} icon={MapPin} color="#8b5cf6" />
      </div>

      {/* Main Screen-Fit Branch Dashboard Workspace */}
      <div className="financial-workspace no-print" style={{
        height: 'calc(100vh - 215px)',
        minHeight: '440px',
        overflowY: 'auto'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '0.65rem'
        }}>
          {branches.map((branch) => (
            <div key={branch.id} className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              justify: 'space-between',
              padding: '0.75rem 0.85rem',
              gap: '0.5rem'
            }}>
              <div>
                <div 
                  style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', marginBottom: '0.4rem', cursor: 'pointer' }}
                  onClick={() => navigate(`/branches/${branch.id}`)}
                  title="Click to view branch report"
                >
                  <div style={{ background: 'rgba(139,92,246,0.1)', padding: '0.5rem', borderRadius: '8px', color: '#8b5cf6', flexShrink: 0 }}>
                    <Store size={20} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', margin: 0, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {branch.name}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.2rem', margin: 0, marginTop: '0.1rem' }}>
                      <MapPin size={12} /> {branch.location}
                    </p>
                  </div>
                </div>

                <div style={{ padding: '0.45rem 0.6rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-muted)', minHeight: '36px' }}>
                  {branch.address || 'No address provided'}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Users size={13} color="var(--primary)" />
                    <strong style={{ color: 'var(--text-main)' }}>{branch.managers_list?.length ?? 0}</strong> manager{branch.managers_list?.length !== 1 ? 's' : ''}
                  </span>
                  {branch.managers_list && branch.managers_list.length > 0 && (
                    <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>Active ✓</span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.35rem' }}>
                  <button
                    id={`details-btn-${branch.id}`}
                    className="btn btn-primary"
                    style={{ padding: '0.3rem 0', fontSize: '0.72rem', justifyContent: 'center' }}
                    onClick={() => navigate(`/branches/${branch.id}`)}
                    title="View Analytics & Reports"
                  >
                    <TrendingUp size={13} />
                  </button>
                  <button
                    id={`message-btn-${branch.id}`}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0', fontSize: '0.72rem', justifyContent: 'center', color: 'var(--primary)', borderColor: 'rgba(59,130,246,0.3)' }}
                    onClick={() => navigate(`/messages?branch=${branch.id}`)}
                    title="Message Managers"
                  >
                    <MessageSquare size={13} />
                  </button>
                  <button
                    id={`edit-btn-${branch.id}`}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0', fontSize: '0.72rem', justifyContent: 'center' }}
                    onClick={() => setEditingBranch(branch)}
                    title="Edit Branch Info"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    id={`managers-btn-${branch.id}`}
                    className="btn btn-outline"
                    style={{ padding: '0.3rem 0', fontSize: '0.72rem', justifyContent: 'center' }}
                    onClick={() => setSelectedBranch(branch)}
                    title="Manage Branch Users"
                  >
                    <Users size={13} />
                  </button>
                  <button
                    id={`delete-btn-${branch.id}`}
                    className="btn btn-outline"
                    style={{ 
                      color: 'var(--error)', 
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                      background: 'rgba(239, 68, 68, 0.05)',
                      padding: '0.3rem 0',
                      justify: 'center'
                    }}
                    onClick={() => handleDeleteBranch(branch.id, branch.name)}
                    title="Delete Branch"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <CreateBranchModal
          onClose={() => setShowForm(false)}
          onBranchCreated={fetchBranches}
        />
      )}

      {selectedBranch && (
        <ManagersModal
          branch={selectedBranch}
          onClose={() => setSelectedBranch(null)}
          onManagerCreated={fetchBranches}
        />
      )}

      {editingBranch && (
        <EditBranchModal
          branch={editingBranch}
          onClose={() => setEditingBranch(null)}
          onBranchUpdated={fetchBranches}
        />
      )}
    </div>
  );
};

export default BranchManagement;
