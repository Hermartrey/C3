import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import C3FuelsLogo from './C3FuelsLogo';
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
  Settings as SettingsIcon,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Branches', icon: MapPin, path: '/branches', roles: ['ADMIN'] },
    { name: 'Sales', icon: TrendingUp, path: '/sales', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Inventory', icon: Fuel, path: '/inventory', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Expenses', icon: Wallet, path: '/expenses', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Financials', icon: BarChart3, path: '/financials', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Messages', icon: MessageSquare, path: '/messages', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Settings', icon: SettingsIcon, path: '/settings', roles: ['ADMIN', 'MANAGER'] },
  ];

  return (
    <aside className="sidebar glass-card" style={{ 
      height: 'calc(100vh - 1.5rem)', 
      width: '240px', 
      position: 'sticky', 
      top: '0.75rem',
      margin: '0.75rem 0 0.75rem 0.75rem',
      padding: '1rem 0.75rem',
      flexShrink: 0,
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      <div>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <C3FuelsLogo height={38} variant="full" />
        </div>
        <nav>
          {navItems.filter(item => item.roles.includes(user?.role)).map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                color: location.pathname === item.path ? 'var(--primary)' : 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: location.pathname === item.path ? '600' : '400',
                background: location.pathname === item.path ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderRadius: '8px',
                marginBottom: '0.25rem'
              }}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <div>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.username}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user?.role}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

import NotificationCenter from './NotificationCenter';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0, padding: '1rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.85rem',
          paddingBottom: '0.65rem',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0
        }}>
          <div>
            <span style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              {user?.role === 'ADMIN' ? 'Owner Management Portal' : 'Branch Operations Portal'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
                transition: 'all 0.2s ease'
              }}
            >
              {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#60a5fa" />}
            </button>

            <span style={{ 
              background: user?.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(59, 130, 246, 0.15)',
              color: user?.role === 'ADMIN' ? '#a78bfa' : '#60a5fa',
              fontSize: '0.75rem',
              fontWeight: '600',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              border: `1px solid ${user?.role === 'ADMIN' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
            }}>
              {user?.role === 'ADMIN' ? '👑 Owner' : `🏢 ${user?.branch_name || 'Manager'}`}
            </span>

            <NotificationCenter />
          </div>
        </header>

        <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

