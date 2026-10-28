import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import C3FuelsLogo from './C3FuelsLogo';
import NotificationCenter from './NotificationCenter';
import { 
  LayoutDashboard, 
  MapPin, 
  Fuel, 
  TrendingUp, 
  LogOut, 
  Menu,
  X,
  Wallet,
  BarChart3,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    const isAdmin = user?.role === 'ADMIN';
    logout();
    navigate(isAdmin ? '/admin' : '/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Branches', icon: MapPin, path: '/branches', roles: ['ADMIN'] },
    { name: 'Sales', icon: TrendingUp, path: '/sales', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Inventory', icon: Fuel, path: '/inventory', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Expenses', icon: Wallet, path: '/expenses', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Financials', icon: BarChart3, path: '/financials', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Messages', icon: MessageSquare, path: '/messages', roles: ['ADMIN', 'MANAGER'] },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="sidebar-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1040,
            transition: 'opacity 0.25s ease'
          }}
        />
      )}

      <aside 
        className={`sidebar glass-card ${isOpen ? 'sidebar-open' : ''}`}
        style={{ 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <div style={{ 
            padding: '0.75rem 0.5rem', 
            borderBottom: '1px solid var(--border)', 
            marginBottom: '1rem', 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <C3FuelsLogo height={36} variant="full" />
            </div>
            {/* Close Button only visible on mobile drawer */}
            <button
              onClick={onClose}
              className="mobile-close-btn"
              title="Close Menu"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '0.35rem',
                cursor: 'pointer',
                color: 'var(--text-main)',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <X size={18} />
            </button>
          </div>

          <nav>
            {navItems.filter(item => item.roles.includes(user?.role)).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                    textDecoration: 'none',
                    fontWeight: isActive ? '600' : '400',
                    background: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                    borderRadius: '0 8px 8px 0',
                    marginBottom: '0.25rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.username}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

const Layout = ({ children }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="layout-container" style={{ display: 'flex', height: '100dvh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <main className="main-content" style={{ flex: 1, minWidth: 0, padding: '1rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header className="main-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.85rem',
          paddingBottom: '0.65rem',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Hamburger Button for Mobile/Tablet */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="mobile-menu-trigger"
              title="Open Navigation Menu"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                borderRadius: '8px',
                padding: '0.45rem',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Menu size={20} />
            </button>

            <div>
              <span className="portal-title" style={{ 
                fontSize: '0.8rem', 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                fontWeight: 600
              }}>
                {user?.role === 'ADMIN' ? 'Owner Portal' : 'Branch Portal'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--text-main)',
                borderRadius: '8px',
                padding: '0.45rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
            >
              {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#60a5fa" />}
            </button>

            <span className="role-pill-badge" style={{ 
              background: user?.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: user?.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '0.3rem 0.65rem',
              borderRadius: '999px',
              border: `1px solid ${user?.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px'
            }}>
              {user?.role === 'ADMIN' 
                ? '👑 Owner' 
                : `🏢 ${(user?.branch_name ? user.branch_name.trim().charAt(0).toUpperCase() + user.branch_name.trim().slice(1) : '') || 'Manager'}`}
            </span>

            <NotificationCenter />
          </div>
        </header>

        <div className="page-content-wrapper" style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

