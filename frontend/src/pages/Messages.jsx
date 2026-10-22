import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Send, MessageSquare, Store, UserCheck, Shield,
  Search, Check, CheckCheck, RefreshCw, Circle, ArrowLeft,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialBranchId = searchParams.get('branch');

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId ? parseInt(initialBranchId, 10) : null);
  const [messages, setMessages] = useState([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [mobileTab, setMobileTab] = useState('chat'); // 'list' | 'chat'
  const [showBranchList, setShowBranchList] = useState(true);

  const messagesEndRef = useRef(null);
  const isAdmin = user?.role === 'ADMIN';

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    let interval;
    if (selectedBranchId || !isAdmin) {
      fetchMessages();
      interval = setInterval(() => {
        fetchMessages(true);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [selectedBranchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      if (isAdmin) {
        const branchRes = await api.get('/branches/');
        setBranches(branchRes.data);
        if (!selectedBranchId && branchRes.data.length > 0) {
          setSelectedBranchId(branchRes.data[0].id);
        }
      } else {
        // Manager role: set selectedBranchId to manager's branch
        if (user?.branch) {
          setSelectedBranchId(user.branch);
        }
      }
    } catch (err) {
      console.error('Failed to load initial messaging data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (silent = false) => {
    if (!silent && messages.length === 0) setLoading(true);
    try {
      let endpoint = '/messages/';
      if (isAdmin && selectedBranchId) {
        endpoint += `?branch=${selectedBranchId}`;
      } else if (!isAdmin && user?.branch) {
        endpoint += `?branch=${user.branch}`;
      }

      const res = await api.get(endpoint);
      setMessages(res.data);

      // Mark as read
      await api.post('/messages/mark-read/', {
        branch: isAdmin ? selectedBranchId : user?.branch
      });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessageContent.trim()) return;

    const payload = {
      content: newMessageContent.trim(),
    };

    if (isAdmin && selectedBranchId) {
      payload.branch = selectedBranchId;
    } else if (!isAdmin && user?.branch) {
      payload.branch = user.branch;
    }

    setSending(true);
    try {
      await api.post('/messages/', payload);
      setNewMessageContent('');
      await fetchMessages(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const activeBranch = branches.find((b) => b.id === selectedBranchId);

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    b.location.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="messages-page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      {/* Header */}
      <div className="messages-header-section" style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <MessageSquare size={20} color="var(--primary)" /> Branch Communications
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.1rem 0 0 0' }}>
            {isAdmin ? 'Direct messaging channel with branch managers' : 'Direct communication channel with HQ Administration'}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isAdmin && (
            <>
              {/* Mobile Station Toggle */}
              <button
                className="btn btn-outline mobile-only-btn"
                onClick={() => setMobileTab(mobileTab === 'list' ? 'chat' : 'list')}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              >
                <Store size={14} /> {mobileTab === 'list' ? 'View Chat' : 'Select Branch'}
              </button>

              {/* Desktop / Laptop Station Collapse Toggle */}
              <button
                className="btn btn-outline hide-on-mobile"
                onClick={() => setShowBranchList(prev => !prev)}
                title={showBranchList ? "Collapse stations list to expand chat" : "Show stations list"}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
              >
                {showBranchList ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
                <span>{showBranchList ? 'Hide Stations' : 'Show Stations'}</span>
              </button>
            </>
          )}
          <button
            className="btn btn-outline"
            onClick={() => fetchMessages()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className={`messages-layout ${!isAdmin ? 'single-pane' : ''} ${!showBranchList ? 'hide-branches' : ''} ${mobileTab === 'list' ? 'show-list' : 'show-chat'}`}>
        {/* Left Panel - Branch Selector (Admin only) */}
        {isAdmin && showBranchList && (
          <div className="glass-card messages-branch-list" style={{ display: 'flex', flexDirection: 'column', padding: '0.85rem', overflow: 'hidden', height: '100%', minHeight: 0 }}>
            <div style={{ position: 'relative', marginBottom: '0.75rem', flexShrink: 0 }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Filter branches..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem', fontSize: '0.85rem', width: '100%' }}
              />
            </div>

            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', minHeight: 0 }}>
              {filteredBranches.map((b) => {
                const isSelected = b.id === selectedBranchId;
                const managersCount = b.managers_list?.length || 0;
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      setSelectedBranchId(b.id);
                      setMobileTab('chat');
                    }}
                    style={{
                      padding: '0.75rem 0.85rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{
                      background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                      padding: '0.55rem',
                      borderRadius: '8px',
                      color: isSelected ? '#fff' : 'var(--text-muted)',
                      flexShrink: 0
                    }}>
                      <Store size={18} />
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                        {b.name}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem', margin: 0 }}>
                        <UserCheck size={11} /> {managersCount} manager{managersCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
              {filteredBranches.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 1rem', fontSize: '0.85rem' }}>
                  No branches match your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Panel - Chat Area */}
        <div className="glass-card messages-chat-pane" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, height: '100%', minHeight: 0 }}>
          {/* Chat Header */}
          <div style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
              {isAdmin && (
                <button
                  className="btn btn-outline mobile-only-btn"
                  onClick={() => setMobileTab('list')}
                  style={{ padding: '0.3rem 0.5rem', fontSize: '0.75rem', flexShrink: 0 }}
                  title="Back to Stations List"
                >
                  <ArrowLeft size={14} /> Stations
                </button>
              )}
              {isAdmin && !showBranchList && (
                <button
                  className="btn btn-outline hide-on-mobile"
                  onClick={() => setShowBranchList(true)}
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}
                  title="Expand Stations List"
                >
                  <PanelLeftOpen size={14} /> Switch Station
                </button>
              )}
              <div style={{ background: 'rgba(59,130,246,0.12)', padding: '0.5rem', borderRadius: '8px', color: 'var(--primary)', flexShrink: 0 }}>
                {isAdmin ? <Store size={18} /> : <Shield size={18} />}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontSize: '0.95rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isAdmin
                    ? (activeBranch ? activeBranch.name : 'Select a Branch')
                    : 'C3 Fuels Headquarters Administration'}
                </h3>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {isAdmin
                    ? (activeBranch ? `${activeBranch.location} — ${activeBranch.managers_list?.map(m => m.username).join(', ') || 'No manager assigned'}` : '')
                    : `Assigned Branch: ${user?.branch_name || 'Branch Manager Channel'}`}
                </p>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="messages-feed-area" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
            background: 'rgba(0,0,0,0.1)',
            minHeight: 0
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
                Loading conversation...
              </div>
            ) : messages.length > 0 ? (
              messages.map((m) => {
                const isOwn = m.sender === user?.id;
                const isSenderAdmin = m.sender_role === 'ADMIN';

                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      alignSelf: isOwn ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      marginBottom: '0.25rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)'
                    }}>
                      <span style={{ fontWeight: 600, color: isSenderAdmin ? '#8b5cf6' : '#3b82f6' }}>
                        {m.sender_name} {isSenderAdmin ? '(Admin)' : '(Manager)'}
                      </span>
                      <span>•</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div style={{
                      padding: '0.8rem 1.15rem',
                      borderRadius: isOwn ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      background: isOwn
                        ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                        : 'rgba(255,255,255,0.07)',
                      color: '#fff',
                      border: isOwn ? 'none' : '1px solid var(--border)',
                      boxShadow: isOwn ? '0 4px 12px rgba(59,130,246,0.25)' : 'none',
                      wordBreak: 'break-word',
                      fontSize: '0.925rem',
                      lineHeight: 1.45
                    }}>
                      {m.content}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                margin: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <MessageSquare size={40} style={{ opacity: 0.3 }} />
                <p style={{ fontSize: '0.9rem' }}>No messages in this conversation yet.</p>
                <p style={{ fontSize: '0.8rem', opacity: '0.7' }}>Type a message below to start communicating.</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <form
            className="messages-composer-form"
            onSubmit={handleSendMessage}
            style={{
              padding: '0.85rem 1.15rem',
              borderTop: '1px solid var(--border)',
              background: 'rgba(0,0,0,0.2)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
              flexShrink: 0
            }}
          >
            <input
              type="text"
              className="input"
              placeholder={
                isAdmin
                  ? `Message ${activeBranch ? activeBranch.name : 'managers'}...`
                  : 'Message HQ Administration...'
              }
              value={newMessageContent}
              onChange={(e) => setNewMessageContent(e.target.value)}
              disabled={sending || (isAdmin && !selectedBranchId)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending || !newMessageContent.trim() || (isAdmin && !selectedBranchId)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.7rem 1.25rem', flexShrink: 0 }}
            >
              <Send size={16} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Messages;
