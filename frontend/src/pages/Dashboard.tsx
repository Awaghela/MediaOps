import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Film, AlertTriangle, Zap, PlayCircle, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { getDashboardStats, getTimeline } from '../api/client';
import { Header } from '../components/layout/Header';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { timeAgo, formatStatus } from '../utils/status';

const COLORS = ['#6C5FDE', '#22EDD8', '#FFD166', '#FF7090', '#9B8FFF', '#4ECDC4'];

const PIE_COLORS: Record<string, string> = {
  series: '#6C5FDE', movie: '#22EDD8', documentary: '#FFD166',
  short: '#FF7090', live_event: '#9B8FFF', podcast: '#4ECDC4',
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#141830', border: '1px solid rgba(45,53,100,0.8)', borderRadius: 8, padding: '8px 12px' }}>
      <div className="text-xs mb-1" style={{ color: '#8892B0' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="text-sm font-medium" style={{ color: COLORS[i] }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats, refetchInterval: 30000 });
  const { data: timeline } = useQuery({ queryKey: ['timeline'], queryFn: getTimeline });

  const onboardingData = stats?.statusBreakdown?.map((s: { status: string; count: number }) => ({
    name: formatStatus(s.status), value: s.count, status: s.status,
  })) || [];

  return (
    <div>
      <Header title="Operations Overview" subtitle={`Last updated ${new Date().toLocaleTimeString()}`} />
      <div className="p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          ) : stats && (
            <>
              <StatCard label="Total Partners" value={stats.totalPartners} icon={Users} accent="violet" delay={0} />
              <StatCard label="Content Records" value={stats.totalContent} icon={Film} accent="cyan" delay={100} />
              <StatCard label="Open Issues" value={stats.openIssues} icon={AlertTriangle} accent="rose" delay={200} />
              <StatCard label="Critical Issues" value={stats.criticalIssues} icon={Zap} accent="rose" delay={300} />
              <StatCard label="Live Content" value={stats.liveContent} icon={PlayCircle} accent="cyan" delay={400} />
              <StatCard label="Blocked Content" value={stats.blockedContent} icon={AlertTriangle} accent="amber" delay={500} />
              <StatCard label="Onboarding Done" value={stats.completedOnboarding} icon={CheckCircle2} accent="cyan" delay={600} />
              <StatCard label="Workflow Health" value={stats.avgWorkflowCompletion} icon={TrendingUp} accent="violet" suffix="%" delay={700} />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Area Chart - Timeline */}
          <div
            className="col-span-2 rounded-xl p-5 float-up float-up-delay-2"
            style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: '#CCD6F6' }}>Content Launch Activity</h2>
                <p className="text-xs mt-0.5" style={{ color: '#4A5580' }}>Weekly trends over 12 weeks</p>
              </div>
              <TrendingUp size={16} style={{ color: '#6C5FDE' }} />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeline || []}>
                <defs>
                  <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22EDD8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22EDD8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF7090" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#FF7090" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: '#4A5580', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4A5580', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="live_count" stroke="#22EDD8" strokeWidth={2} fill="url(#colorLive)" name="Live" />
                <Area type="monotone" dataKey="blocked_count" stroke="#FF7090" strokeWidth={2} fill="url(#colorBlocked)" name="Blocked" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie - Onboarding Status */}
          <div
            className="rounded-xl p-5 float-up float-up-delay-3"
            style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
          >
            <div className="mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#CCD6F6' }}>Partner Onboarding</h2>
              <p className="text-xs mt-0.5" style={{ color: '#4A5580' }}>Status breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={onboardingData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {onboardingData.map((entry: { status: string; value: number }, idx: number) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div style={{ background: '#141830', border: '1px solid rgba(45,53,100,0.8)', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#CCD6F6' }}>
                    {payload[0].name}: {payload[0].value}
                  </div>
                ) : null} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {onboardingData.slice(0, 4).map((d: { name: string; value: number }, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                    <span className="text-xs" style={{ color: '#8892B0' }}>{d.name}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#CCD6F6' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Second row: Issues By Type + Content By Type + Activity */}
        <div className="grid grid-cols-3 gap-4">
          {/* Bar - Issues by Type */}
          <div
            className="rounded-xl p-5 float-up float-up-delay-2"
            style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#CCD6F6' }}>Open Issues by Type</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats?.issuesByType || []} layout="vertical">
                <XAxis type="number" tick={{ fill: '#4A5580', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="issue_type" tick={{ fill: '#8892B0', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#6C5FDE" radius={[0, 4, 4, 0]} name="Issues" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar - Content by Type */}
          <div
            className="rounded-xl p-5 float-up float-up-delay-3"
            style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#CCD6F6' }}>Content by Type</h2>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={stats?.contentByType || []}>
                <XAxis dataKey="content_type" tick={{ fill: '#4A5580', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#4A5580', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Count">
                  {(stats?.contentByType || []).map((_: unknown, i: number) => (
                    <Cell key={i} fill={Object.values(PIE_COLORS)[i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Feed */}
          <div
            className="rounded-xl p-5 float-up float-up-delay-4"
            style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} style={{ color: '#6C5FDE' }} />
              <h2 className="text-sm font-semibold" style={{ color: '#CCD6F6' }}>Recent Activity</h2>
            </div>
            <div className="space-y-3">
              {(stats?.recentActivity || []).slice(0, 6).map((a: { id: string; entity_type: string; entity_name: string; new_status: string; timestamp: string }) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6C5FDE', marginTop: 5, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate" style={{ color: '#CCD6F6' }}>{a.entity_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge value={a.new_status} />
                      <span className="text-xs" style={{ color: '#4A5580' }}>{timeAgo(a.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!stats?.recentActivity?.length && (
                <p className="text-sm text-center py-4" style={{ color: '#4A5580' }}>No recent activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
