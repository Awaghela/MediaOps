import React, { useState } from 'react';
import {
  User, Bell, LayoutDashboard, Key, Shield,
  Save, Check, ChevronRight, Moon, Sun, Monitor,
} from 'lucide-react';
import { Header } from '../components/layout/Header';

type Section = 'profile' | 'notifications' | 'dashboard' | 'api' | 'security';

const SECTIONS = [
  { id: 'profile' as Section,       icon: User,            label: 'Profile' },
  { id: 'notifications' as Section, icon: Bell,            label: 'Notifications' },
  { id: 'dashboard' as Section,     icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'api' as Section,           icon: Key,             label: 'API & Integrations' },
  { id: 'security' as Section,      icon: Shield,          label: 'Security' },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
        background: value ? 'linear-gradient(135deg, #7C3AED, #6D28D9)' : '#E5E7EB',
        position: 'relative', transition: 'background 0.2s',
        boxShadow: value ? '0 2px 8px rgba(109,40,217,0.3)' : 'none',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, borderRadius: '50%', width: 20, height: 20,
        background: '#fff', transition: 'left 0.2s',
        left: value ? 22 : 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  );
}

function SaveButton({ saved }: { saved: boolean }) {
  return (
    <button className="btn-primary flex items-center gap-2">
      {saved ? <Check size={14} /> : <Save size={14} />}
      {saved ? 'Saved' : 'Save Changes'}
    </button>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-6 mb-4" style={{ background: '#FFFFFF', border: '1px solid #EDE9FE', boxShadow: '0 2px 12px rgba(109,40,217,0.06)' }}>
      <h2 className="text-sm font-semibold mb-5" style={{ color: '#1E1B4B' }}>{title}</h2>
      {children}
    </div>
  );
}
//settings
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3" style={{ borderBottom: '1px solid #F5F3FF' }}>
      <div>
        <div className="text-sm font-medium" style={{ color: '#1E1B4B' }}>{label}</div>
        {hint && <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{hint}</div>}
      </div>
      <div className="ml-8 flex-shrink-0">{children}</div>
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection() {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name: 'Alex Chen', email: 'alex.chen@mediaops.io',
    role: 'Operations Lead', timezone: 'America/New_York',
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <SectionCard title="Personal Information">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center justify-center rounded-xl text-xl font-bold"
            style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', color: '#fff' }}>
            AC
          </div>
          <div>
            <div className="text-base font-semibold" style={{ color: '#1E1B4B' }}>{form.name}</div>
            <div className="text-sm" style={{ color: '#9CA3AF' }}>{form.role}</div>
            <button className="text-xs mt-1" style={{ color: '#7C3AED' }}>Change avatar</button>
          </div>
        </div>

        {[
          { key: 'name', label: 'Full Name', placeholder: 'Your name' },
          { key: 'email', label: 'Email Address', placeholder: 'your@email.com' },
          { key: 'role', label: 'Role', placeholder: 'Your role' },
        ].map(f => (
          <div key={f.key} className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>{f.label}</label>
            <input
              className="input-field w-full"
              style={{ height: 38 }}
              value={form[f.key as keyof typeof form]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        ))}

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Timezone</label>
          <select className="input-field w-full" style={{ height: 38 }}
            value={form.timezone} onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
            <option value="Asia/Singapore">Singapore (SGT)</option>
          </select>
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <div onClick={handleSave}><SaveButton saved={saved} /></div>
      </div>
    </>
  );
}

// ─── Notifications Section ────────────────────────────────────────────────────
function NotificationsSection() {
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    critical_issues: true, new_blockers: true, partner_status: true,
    workflow_complete: true, weekly_report: false, system_alerts: true,
    email_digest: false, slack_alerts: false,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs(p => ({ ...p, [key]: !p[key] }));
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const groups = [
    {
      title: 'Issue Alerts',
      items: [
        { key: 'critical_issues', label: 'Critical issue escalations', hint: 'Notify when an issue is escalated to critical severity' },
        { key: 'new_blockers', label: 'New content blockers', hint: 'Notify when a content item becomes blocked' },
      ],
    },
    {
      title: 'Partner & Workflow',
      items: [
        { key: 'partner_status', label: 'Partner onboarding updates', hint: 'Status changes on partner onboarding progress' },
        { key: 'workflow_complete', label: 'Workflow completions', hint: 'When all 7 steps are done for a content item' },
      ],
    },
    {
      title: 'Reports & System',
      items: [
        { key: 'weekly_report', label: 'Weekly ops summary', hint: 'Automated report every Monday morning' },
        { key: 'system_alerts', label: 'System status alerts', hint: 'API downtime or database issues' },
        { key: 'email_digest', label: 'Email digest', hint: 'Daily email summary of all activity' },
        { key: 'slack_alerts', label: 'Slack notifications', hint: 'Send alerts to connected Slack workspace' },
      ],
    },
  ];

  return (
    <>
      {groups.map(g => (
        <SectionCard key={g.title} title={g.title}>
          {g.items.map(item => (
            <Field key={item.key} label={item.label} hint={item.hint}>
              <Toggle value={prefs[item.key as keyof typeof prefs]} onChange={() => toggle(item.key as keyof typeof prefs)} />
            </Field>
          ))}
        </SectionCard>
      ))}
      <div className="flex justify-end">
        <div onClick={handleSave}><SaveButton saved={saved} /></div>
      </div>
    </>
  );
}

// ─── Dashboard Section ────────────────────────────────────────────────────────
function DashboardSection() {
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    defaultPage: '/', refreshInterval: '30', defaultLimit: '20',
    showAnimations: true, compactMode: false, showTimestamps: true,
  });
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <>
      <SectionCard title="Display Preferences">
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Default Landing Page</label>
          <select className="input-field w-full" style={{ height: 38 }}
            value={prefs.defaultPage} onChange={e => setPrefs(p => ({ ...p, defaultPage: e.target.value }))}>
            <option value="/">Overview Dashboard</option>
            <option value="/partners">Partners</option>
            <option value="/content">Content</option>
            <option value="/issues">Issues</option>
            <option value="/workflow">Workflow</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Auto-refresh Interval</label>
          <select className="input-field w-full" style={{ height: 38 }}
            value={prefs.refreshInterval} onChange={e => setPrefs(p => ({ ...p, refreshInterval: e.target.value }))}>
            <option value="0">Off</option>
            <option value="15">Every 15 seconds</option>
            <option value="30">Every 30 seconds</option>
            <option value="60">Every minute</option>
            <option value="300">Every 5 minutes</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Default Page Size</label>
          <select className="input-field w-full" style={{ height: 38 }}
            value={prefs.defaultLimit} onChange={e => setPrefs(p => ({ ...p, defaultLimit: e.target.value }))}>
            <option value="10">10 rows</option>
            <option value="20">20 rows</option>
            <option value="50">50 rows</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard title="Interface Options">
        <Field label="Card animations" hint="Animate stat cards and page transitions">
          <Toggle value={prefs.showAnimations} onChange={v => setPrefs(p => ({ ...p, showAnimations: v }))} />
        </Field>
        <Field label="Compact mode" hint="Reduce padding and spacing throughout the UI">
          <Toggle value={prefs.compactMode} onChange={v => setPrefs(p => ({ ...p, compactMode: v }))} />
        </Field>
        <Field label="Show relative timestamps" hint="Show '2h ago' instead of full date">
          <Toggle value={prefs.showTimestamps} onChange={v => setPrefs(p => ({ ...p, showTimestamps: v }))} />
        </Field>
      </SectionCard>

      <div className="flex justify-end">
        <div onClick={handleSave}><SaveButton saved={saved} /></div>
      </div>
    </>
  );
}

// ─── API Section ──────────────────────────────────────────────────────────────
function ApiSection() {
  const [revealed, setRevealed] = useState(false);
  const fakeKey = 'mo_live_sk_a8f3c2e91b74d506f8a1';

  return (
    <>
      <SectionCard title="API Endpoints">
        {[
          { label: 'Base URL', value: 'https://mediaops-production.up.railway.app/api' },
          { label: 'Health Check', value: '/health' },
          { label: 'Dashboard Stats', value: '/dashboard/stats' },
          { label: 'Partners', value: '/partners' },
          { label: 'Content', value: '/content' },
          { label: 'Issues', value: '/issues' },
        ].map(e => (
          <div key={e.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: '1px solid #F5F3FF' }}>
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>{e.label}</span>
            <code className="text-xs px-2 py-1 rounded" style={{ background: '#F5F3FF', color: '#7C3AED' }}>{e.value}</code>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="API Key">
        <p className="text-xs mb-4" style={{ color: '#9CA3AF' }}>Use this key to authenticate requests to the MediaOps API.</p>
        <div className="flex items-center gap-2 mb-4">
          <code
            className="flex-1 px-3 py-2 rounded-lg text-xs font-mono"
            style={{ background: '#F5F3FF', color: '#7C3AED', border: '1px solid #EDE9FE' }}
          >
            {revealed ? fakeKey : '••••••••••••••••••••••••••••••••'}
          </code>
          <button className="btn-ghost text-xs" onClick={() => setRevealed(r => !r)}>
            {revealed ? 'Hide' : 'Reveal'}
          </button>
          <button className="btn-ghost text-xs" onClick={() => navigator.clipboard?.writeText(fakeKey)}>
            Copy
          </button>
        </div>
        <button className="btn-ghost text-xs" style={{ color: '#EF4444', borderColor: '#FCA5A5' }}>
          Regenerate Key
        </button>
      </SectionCard>
    </>
  );
}

// ─── Security Section ─────────────────────────────────────────────────────────
function SecuritySection() {
  const [saved, setSaved] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('480');
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <>
      <SectionCard title="Authentication">
        <Field label="Two-factor authentication" hint="Add an extra layer of security to your account">
          <Toggle value={twoFA} onChange={setTwoFA} />
        </Field>
        <div className="mt-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>Session Timeout</label>
          <select className="input-field" style={{ height: 38, width: 200 }}
            value={sessionTimeout} onChange={e => setSessionTimeout(e.target.value)}>
            <option value="60">1 hour</option>
            <option value="240">4 hours</option>
            <option value="480">8 hours</option>
            <option value="1440">24 hours</option>
          </select>
        </div>
      </SectionCard>

      <SectionCard title="Change Password">
        {['Current Password', 'New Password', 'Confirm New Password'].map(label => (
          <div key={label} className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#6B7280' }}>{label}</label>
            <input type="password" className="input-field w-full" style={{ height: 38 }} placeholder="••••••••" />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Active Sessions">
        {[
          { device: 'MacBook Air', location: 'Erie, Colorado', time: 'Active now', current: true },
          { device: 'iPhone 15', location: 'Erie, Colorado', time: '2 hours ago', current: false },
        ].map(s => (
          <div key={s.device} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #F5F3FF' }}>
            <div>
              <div className="text-sm font-medium flex items-center gap-2" style={{ color: '#1E1B4B' }}>
                {s.device}
                {s.current && <span className="badge" style={{ background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}>Current</span>}
              </div>
              <div className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{s.location} · {s.time}</div>
            </div>
            {!s.current && <button className="btn-ghost text-xs" style={{ color: '#EF4444', borderColor: '#FCA5A5' }}>Revoke</button>}
          </div>
        ))}
      </SectionCard>

      <div className="flex justify-end">
        <div onClick={handleSave}><SaveButton saved={saved} /></div>
      </div>
    </>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export function Settings() {
  const [active, setActive] = useState<Section>('profile');

  const CONTENT: Record<Section, React.ReactNode> = {
    profile:       <ProfileSection />,
    notifications: <NotificationsSection />,
    dashboard:     <DashboardSection />,
    api:           <ApiSection />,
    security:      <SecuritySection />,
  };

  return (
    <div>
      <Header title="Settings" subtitle="Manage your account and workspace preferences" />
      <div className="p-6 flex gap-6">

        {/* Sidebar nav */}
        <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 200, background: '#FFFFFF', border: '1px solid #EDE9FE', alignSelf: 'flex-start' }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm transition-all"
              style={{
                background: active === s.id ? '#F5F3FF' : 'transparent',
                color: active === s.id ? '#7C3AED' : '#6B7280',
                fontWeight: active === s.id ? 600 : 400,
                borderBottom: '1px solid #F5F3FF',
                cursor: 'pointer', border: 'none', borderBottomStyle: 'solid',
                borderBottomWidth: 1, borderBottomColor: '#F5F3FF',
                textAlign: 'left',
              }}
            >
              <div className="flex items-center gap-2.5">
                <s.icon size={15} />
                {s.label}
              </div>
              {active === s.id && <ChevronRight size={14} />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {CONTENT[active]}
        </div>
      </div>
    </div>
  );
}
