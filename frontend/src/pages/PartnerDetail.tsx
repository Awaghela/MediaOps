import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Globe, Mail, User2, TrendingUp,
  Film, AlertTriangle, CheckCircle2, Clock, GitBranch,
  Edit2, Save, X,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { getPartner, updatePartner } from '../api/client';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Skeleton } from '../components/ui/Skeleton';
import { Content, Issue, WorkflowStep } from '../types';
import { formatDate, formatStatus, workflowPercent, SEVERITY_COLORS } from '../utils/status';

const ONBOARDING_STATUSES = ['pending', 'in_progress', 'review', 'blocked', 'completed'];
const COLORS = ['#6C5FDE', '#22EDD8', '#FFD166', '#FF7090', '#9B8FFF', '#4ECDC4'];

type Tab = 'content' | 'issues' | 'workflow';

function MetaItem({ icon: Icon, label, value }: { icon: typeof Globe; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={13} style={{ color: '#4A5580', flexShrink: 0 }} />
      <span className="text-xs" style={{ color: '#4A5580' }}>{label}:</span>
      <span className="text-xs font-medium" style={{ color: '#8892B0' }}>{value || '—'}</span>
    </div>
  );
}

export function PartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['partner', id],
    queryFn: () => getPartner(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => updatePartner(id!, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner', id] });
      qc.invalidateQueries({ queryKey: ['partners'] });
      setEditing(false);
    },
  });

  const partner = data?.partner;
  const content: Content[] = data?.content || [];
  const issues: Issue[] = data?.issues || [];
  const workflowSteps: { step_name: string; status: string; count: number }[] = data?.workflow || [];

  // Build radar data from workflow steps
  const workflowMap: Record<string, { completed: number; total: number }> = {};
  workflowSteps.forEach((s) => {
    if (!workflowMap[s.step_name]) workflowMap[s.step_name] = { completed: 0, total: 0 };
    workflowMap[s.step_name].total += s.count;
    if (s.status === 'completed') workflowMap[s.step_name].completed += s.count;
  });
  const radarData = Object.entries(workflowMap).map(([name, { completed, total }]) => ({
    step: name.replace(' ', '\n'),
    pct: total > 0 ? Math.round((completed / total) * 100) : 0,
  }));

  // Issue severity distribution
  const severityMap: Record<string, number> = {};
  issues.forEach(i => { severityMap[i.severity] = (severityMap[i.severity] || 0) + 1; });
  const severityData = Object.entries(severityMap).map(([sev, count]) => ({ sev, count }));

  const liveCount = content.filter(c => c.status === 'live').length;
  const blockedCount = content.filter(c => c.status === 'blocked').length;
  const openIssues = issues.filter(i => !['resolved', 'wont_fix'].includes(i.status)).length;
  const avgPct = content.length
    ? Math.round(content.reduce((s, c) => s + workflowPercent(c.steps_done, c.steps_total), 0) / content.length)
    : 0;

  if (isLoading) {
    return (
      <div>
        <Header title="Partner Detail" />
        <div className="p-6 space-y-4">
          <Skeleton style={{ height: 120, borderRadius: 12 }} />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} style={{ height: 80, borderRadius: 12 }} />)}
          </div>
          <Skeleton style={{ height: 300, borderRadius: 12 }} />
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div>
        <Header title="Not Found" />
        <div className="p-6 text-center py-24" style={{ color: '#4A5580' }}>
          Partner not found.
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title={partner.name} subtitle={`${partner.region} · ${partner.tier} tier`} />
      <div className="p-6 space-y-5">

        {/* Back + Hero Card */}
        <div>
          <button
            onClick={() => navigate('/partners')}
            className="flex items-center gap-1.5 mb-4 text-sm transition-colors"
            style={{ color: '#4A5580' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#9B8FFF')}
            onMouseLeave={e => (e.currentTarget.style.color = '#4A5580')}
          >
            <ArrowLeft size={14} /> Back to Partners
          </button>

          <div
            className="rounded-xl p-6"
            style={{
              background: 'linear-gradient(135deg, rgba(108,95,222,0.08) 0%, rgba(0,210,192,0.04) 100%)',
              border: '1px solid rgba(108,95,222,0.2)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex items-center justify-center rounded-xl text-xl font-bold"
                  style={{
                    width: 56, height: 56,
                    background: 'linear-gradient(135deg, rgba(108,95,222,0.3), rgba(34,237,216,0.2))',
                    color: '#9B8FFF',
                    border: '1px solid rgba(108,95,222,0.3)',
                  }}
                >
                  {partner.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-bold" style={{ color: '#CCD6F6' }}>{partner.name}</h1>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge value={partner.tier} variant="tier" />
                    <StatusBadge value={partner.onboarding_status} />
                  </div>
                </div>
              </div>

              {/* Edit Toggle */}
              {!editing ? (
                <button
                  onClick={() => { setEditing(true); setEditStatus(partner.onboarding_status); setEditNotes(partner.notes || ''); }}
                  className="flex items-center gap-1.5 btn-ghost text-xs"
                >
                  <Edit2 size={12} /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateMutation.mutate({ onboarding_status: editStatus, notes: editNotes })}
                    className="btn-primary flex items-center gap-1.5 text-xs"
                    disabled={updateMutation.isPending}
                  >
                    <Save size={12} /> Save
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-ghost flex items-center gap-1 text-xs">
                    <X size={12} /> Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-5">
              <MetaItem icon={Globe} label="Region" value={partner.region} />
              <MetaItem icon={Mail} label="Email" value={partner.contact_email || '—'} />
              <MetaItem icon={User2} label="Contact" value={partner.contact_name || '—'} />
              <MetaItem icon={Clock} label="Since" value={formatDate(partner.created_at)} />
            </div>

            {editing && (
              <div className="mt-5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-1.5" style={{ color: '#4A5580' }}>Onboarding Status</div>
                  <select
                    className="input-field w-full"
                    style={{ height: 34 }}
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value)}
                  >
                    {ONBOARDING_STATUSES.map(s => (
                      <option key={s} value={s}>{formatStatus(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-xs mb-1.5" style={{ color: '#4A5580' }}>Notes</div>
                  <input
                    className="input-field w-full"
                    style={{ height: 34 }}
                    value={editNotes}
                    onChange={e => setEditNotes(e.target.value)}
                    placeholder="Partner notes…"
                  />
                </div>
              </div>
            )}

            {!editing && partner.notes && (
              <div
                className="mt-4 p-3 rounded-lg text-xs"
                style={{ background: 'rgba(20,24,48,0.5)', color: '#8892B0', border: '1px solid rgba(45,53,100,0.4)' }}
              >
                {partner.notes}
              </div>
            )}
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Content', value: content.length, color: '#9B8FFF', icon: Film },
            { label: 'Live', value: liveCount, color: '#22EDD8', icon: CheckCircle2 },
            { label: 'Blocked', value: blockedCount, color: '#FFD166', icon: AlertTriangle },
            { label: 'Open Issues', value: openIssues, color: '#FF7090', icon: AlertTriangle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div
              key={label}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: 'rgba(14,18,36,0.7)', border: '1px solid rgba(30,37,72,0.6)' }}
            >
              <div
                className="p-2 rounded-lg flex-shrink-0"
                style={{ background: `${color}18` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div>
                <div className="text-xl font-bold" style={{ color }}>{value}</div>
                <div className="text-xs" style={{ color: '#4A5580' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Workflow Radar */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <GitBranch size={14} style={{ color: '#6C5FDE' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#CCD6F6' }}>Workflow Completion by Step</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: '#4A5580' }}>Avg completion {avgPct}% across all content</p>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(45,53,100,0.5)" />
                  <PolarAngleAxis dataKey="step" tick={{ fill: '#8892B0', fontSize: 10 }} />
                  <Radar dataKey="pct" stroke="#6C5FDE" fill="#6C5FDE" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center" style={{ color: '#4A5580' }}>No workflow data</div>
            )}
          </div>

          {/* Severity Chart */}
          <div
            className="rounded-xl p-5"
            style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={14} style={{ color: '#FF7090' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#CCD6F6' }}>Issues by Severity</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: '#4A5580' }}>{openIssues} open · {issues.filter(i => i.status === 'resolved').length} resolved</p>
            {severityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={severityData} barSize={32}>
                  <XAxis dataKey="sev" tick={{ fill: '#8892B0', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#4A5580', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#141830', border: '1px solid rgba(45,53,100,0.8)', borderRadius: 8 }}
                    labelStyle={{ color: '#CCD6F6' }}
                  />
                  <Bar dataKey="count" name="Issues" radius={[6, 6, 0, 0]}>
                    {severityData.map((d) => {
                      const sev = d.sev as 'critical' | 'high' | 'medium' | 'low';
                      return <Cell key={d.sev} fill={SEVERITY_COLORS[sev]?.text || '#8892B0'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center" style={{ color: '#4A5580' }}>No issues</div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: '1px solid rgba(30,37,72,0.6)' }}
        >
          {/* Tab bar */}
          <div
            className="flex"
            style={{ borderBottom: '1px solid rgba(30,37,72,0.6)', background: 'rgba(14,18,36,0.9)' }}
          >
            {(['content', 'issues', 'workflow'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-5 py-3 text-sm font-medium transition-all capitalize"
                style={{
                  color: activeTab === tab ? '#9B8FFF' : '#4A5580',
                  borderBottom: activeTab === tab ? '2px solid #6C5FDE' : '2px solid transparent',
                  background: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottomStyle: 'solid',
                  borderBottomWidth: 2,
                  borderBottomColor: activeTab === tab ? '#6C5FDE' : 'transparent',
                }}
              >
                {tab === 'content' && `Content (${content.length})`}
                {tab === 'issues' && `Issues (${issues.length})`}
                {tab === 'workflow' && 'Workflow Steps'}
              </button>
            ))}
          </div>

          {/* Tab: Content */}
          {activeTab === 'content' && (
            <div style={{ background: 'rgba(10,14,28,0.5)' }}>
              {content.length === 0 ? (
                <div className="py-12 text-center" style={{ color: '#4A5580' }}>No content for this partner</div>
              ) : (
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30,37,72,0.5)' }}>
                      {['Title', 'Type', 'Status', 'Priority', 'Launch', 'Workflow', 'Blockers'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A5580' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {content.map(c => (
                      <tr key={c.id} className="table-row">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium" style={{ color: '#CCD6F6' }}>{c.title}</span>
                          {c.genre && <div className="text-xs mt-0.5" style={{ color: '#4A5580' }}>{c.genre}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize" style={{ color: '#8892B0' }}>{c.content_type}</span>
                        </td>
                        <td className="px-4 py-3"><StatusBadge value={c.status} pulse /></td>
                        <td className="px-4 py-3">
                          <span className="text-xs capitalize" style={{ color: c.priority === 'critical' ? '#FF4D6D' : c.priority === 'high' ? '#FFD166' : '#8892B0' }}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: '#8892B0' }}>{formatDate(c.launch_date)}</span>
                        </td>
                        <td className="px-4 py-3" style={{ width: 120 }}>
                          <ProgressBar value={workflowPercent(c.steps_done, c.steps_total)} showLabel />
                        </td>
                        <td className="px-4 py-3">
                          {c.blocker_count > 0 ? (
                            <span className="badge" style={{ background: 'rgba(255,77,109,0.1)', color: '#FF7090', border: '1px solid rgba(255,77,109,0.3)' }}>
                              {c.blocker_count} blockers
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: '#4A5580' }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab: Issues */}
          {activeTab === 'issues' && (
            <div style={{ background: 'rgba(10,14,28,0.5)' }}>
              {issues.length === 0 ? (
                <div className="py-12 text-center" style={{ color: '#4A5580' }}>No issues for this partner</div>
              ) : (
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(30,37,72,0.5)' }}>
                      {['Issue', 'Type', 'Severity', 'Status', 'Owner', 'Due', 'Content'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A5580' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map(issue => {
                      const sev = SEVERITY_COLORS[issue.severity] ?? SEVERITY_COLORS.low;
                      return (
                        <tr key={issue.id} className="table-row">
                          <td className="px-4 py-3">
                            <span className="text-sm" style={{ color: '#CCD6F6' }}>{issue.title}</span>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge value={issue.issue_type} />
                          </td>
                          <td className="px-4 py-3">
                            <span className="badge" style={{ background: sev.bg, color: sev.text, border: `1px solid ${sev.border}` }}>
                              {issue.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3"><StatusBadge value={issue.status} /></td>
                          <td className="px-4 py-3">
                            <span className="text-xs" style={{ color: '#8892B0' }}>{issue.owner || '—'}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs" style={{ color: issue.due_date && new Date(issue.due_date) < new Date() ? '#FF7090' : '#8892B0' }}>
                              {formatDate(issue.due_date)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs truncate max-w-32 block" style={{ color: '#4A5580' }}>
                              {issue.content_title || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Tab: Workflow */}
          {activeTab === 'workflow' && (
            <div className="p-5" style={{ background: 'rgba(10,14,28,0.5)' }}>
              {radarData.length === 0 ? (
                <div className="py-8 text-center" style={{ color: '#4A5580' }}>No workflow data</div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {radarData.map((d) => (
                    <div key={d.step} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-32 text-xs" style={{ color: '#8892B0' }}>{d.step}</div>
                      <div className="flex-1">
                        <ProgressBar value={d.pct} showLabel />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
