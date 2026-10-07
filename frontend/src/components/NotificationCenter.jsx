import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { 
  Bell, 
  CheckCheck, 
  Fuel, 
  AlertTriangle, 
  Truck, 
  Info 
} from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      const data = res.data;
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleItemClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await api.post(`/notifications/${notification.id}/mark-read/`);
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'INVENTORY_UPDATE':
        return <Fuel size={18} style={{ color: '#3b82f6' }} />;
      case 'LOW_STOCK':
        return <AlertTriangle size={18} style={{ color: '#ef4444' }} />;
      case 'DELIVERY':
        return <Truck size={18} style={{ color: '#10b981' }} />;
      default:
        return <Info size={18} style={{ color: '#8b5cf6' }} />;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border, rgba(255,255,255,0.1))',
          borderRadius: '10px',
          padding: '0.55rem',
          cursor: 'pointer',
          color: 'var(--text-main, #ffffff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '0.7rem',
            fontWeight: '700',
            borderRadius: '999px',
            minWidth: '18px',
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            boxShadow: '0 0 0 2px #0f172a'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 0.5rem)',
          width: '360px',
          maxHeight: '480px',
          background: 'var(--card-bg, #1e293b)',
          border: '1px solid var(--border, rgba(255, 255, 255, 0.1))',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(16px)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: '#ffffff' }}>Notifications</h3>
              {unreadCount > 0 && (
                <span style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  color: '#3b82f6',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px'
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3b82f6',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
                <Bell size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.875rem' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    marginBottom: '0.25rem',
                    cursor: 'pointer',
                    background: item.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                    borderLeft: item.is_read ? '3px solid transparent' : '3px solid #3b82f6',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <div style={{ marginTop: '2px', flexShrink: 0 }}>
                    {getIcon(item.notification_type)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <span style={{ 
                        fontWeight: item.is_read ? '500' : '600', 
                        fontSize: '0.85rem',
                        color: '#ffffff'
                      }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        {formatTime(item.created_at)}
                      </span>
                    </div>

                    <p style={{ 
                      fontSize: '0.8rem', 
                      color: '#cbd5e1', 
                      margin: 0,
                      lineHeight: '1.3' 
                    }}>
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
