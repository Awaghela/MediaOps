import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Film, AlertTriangle,
  GitBranch, BarChart2, Settings, Zap,
} from 'lucide-react';

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Overview' },
  { to: '/partners',  icon: Users,           label: 'Partners' },
  { to: '/content',   icon: Film,            label: 'Content' },
  { to: '/issues',    icon: AlertTriangle,   label: 'Issues' },
  { to: '/workflow',  icon: GitBranch,       label: 'Workflow' },
  { to: '/reports',   icon: BarChart2,       label: 'Reports' },
];

export function Sidebar() {
  return (
    <aside
      className="fixed left-0 top-0 h-full flex flex-col z-40"
      style={{
        width: 220,
        background: 'linear-gradient(180deg, #0D1225 0%, #080C18 100%)',
        borderRight: '1px solid rgba(30,37,72,0.8)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: '1px solid rgba(30,37,72,0.6)' }}>
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #6C5FDE, #22EDD8)',
          }}
        >
          <Zap size={16} color="white" fill="white" />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#CCD6F6' }}>MediaOps</div>
          <div className="text-xs" style={{ color: '#4A5580' }}>Operations Hub</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4" style={{ borderTop: '1px solid rgba(30,37,72,0.6)' }}>
        <div className="nav-item mt-3">
          <Settings size={16} />
          Settings
        </div>
        <div className="px-2 mt-3">
          <div className="text-xs mb-1" style={{ color: '#4A5580' }}>System Status</div>
          <div className="flex items-center gap-1.5">
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22EDD8', display: 'inline-block' }} />
            <span className="text-xs" style={{ color: '#8892B0' }}>All systems operational</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
