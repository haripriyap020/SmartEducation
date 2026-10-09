import React from 'react';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';
import { LogOut, User as UserIcon, BookOpen, ShieldCheck, GraduationCap } from 'lucide-react';

const Navbar = ({ activeTab, title }) => {
  const { user, logout, switchQuickDemo } = useAuth();

  const getRoleIcon = (role) => {
    switch (role) {
      case 'student': return GraduationCap;
      case 'cr': return ShieldCheck;
      case 'faculty': return BookOpen;
      default: return UserIcon;
    }
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <h2 className="page-title">{title || 'ClassConnectAI'}</h2>
      </div>

      <div className="navbar-right">
        {/* Quick 1-Click Role Switcher for Live Demo */}
        <div className="quick-demo-selector">
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', padding: '0 4px', textTransform: 'uppercase' }}>
            Demo Role:
          </span>
          <button
            className={`demo-btn ${user?.role === 'student' ? 'active' : ''}`}
            onClick={() => switchQuickDemo('student')}
            title="Switch to Student Account"
          >
            🎓 Student
          </button>
          <button
            className={`demo-btn ${user?.role === 'cr' ? 'active' : ''}`}
            onClick={() => switchQuickDemo('cr')}
            title="Switch to CR Account"
          >
            🛡️ CR
          </button>
          <button
            className={`demo-btn ${user?.role === 'faculty' ? 'active' : ''}`}
            onClick={() => switchQuickDemo('faculty')}
            title="Switch to Faculty Account"
          >
            👨‍🏫 Faculty
          </button>
        </div>

        {/* User Info Capsule */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px', borderLeft: '1px solid var(--slate-200)' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-900)' }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>
              {user?.classroom ? `${user.classroom.class_name} (${user.classroom.section})` : (user?.role === 'faculty' ? 'Faculty Member' : user?.email)}
            </div>
          </div>

          <Badge variant={user?.role || 'primary'} icon={getRoleIcon(user?.role)}>
            {user?.role?.toUpperCase()}
          </Badge>

          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Log Out"
            style={{ padding: '6px 10px', color: 'var(--slate-500)' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
