import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Bell,
  BrainCircuit,
  Compass,
  Code2,
  TrendingUp,
  ShieldCheck,
  FileCheck2,
  Layers,
  Sparkles
} from 'lucide-react';

const Sidebar = ({ activeTab, onSelectTab, pendingCount = 0 }) => {
  const { user } = useAuth();
  const role = user?.role || 'student';

  const studentNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'announcements', label: 'Classroom Tasks', icon: Bell },
    { id: 'quiz', label: 'Diagnostic Quiz', icon: BrainCircuit },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass },
    { id: 'practice', label: 'Practice Arena', icon: Code2 },
    { id: 'progress', label: 'Skill Analytics', icon: TrendingUp }
  ];

  const crNav = [
    { id: 'cr-studio', label: 'Notice Studio (CR)', icon: ShieldCheck, badge: pendingCount > 0 ? pendingCount : null },
    { id: 'announcements', label: 'Classroom Feed', icon: Bell },
    { id: 'quiz', label: 'Diagnostic Quiz', icon: BrainCircuit },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass },
    { id: 'practice', label: 'Practice Arena', icon: Code2 },
    { id: 'progress', label: 'Skill Analytics', icon: TrendingUp }
  ];

  const facultyNav = [
    { id: 'faculty', label: 'Faculty Overview', icon: Layers },
    { id: 'faculty-questions', label: 'Question Bank', icon: FileCheck2 },
    { id: 'announcements', label: 'Classroom Tasks', icon: Bell },
    { id: 'quiz', label: 'Diagnostic Quiz', icon: BrainCircuit },
    { id: 'practice', label: 'Practice Arena', icon: Code2 }
  ];

  let navItems = studentNav;
  if (role === 'cr') navItems = crNav;
  if (role === 'faculty') navItems = facultyNav;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <Sparkles size={22} />
        </div>
        <div className="brand-text">
          <h1>ClassConnect<span>AI</span></h1>
          <p>Smart Edu & Skill Platform</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="role-tag-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-700)' }}>Role:</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
              {role}
            </span>
          </div>
          <span style={{ fontSize: '10px', color: 'var(--slate-400)', background: 'white', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--slate-200)' }}>
            v1.0
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
