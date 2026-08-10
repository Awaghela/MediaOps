import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, GitBranch, CheckCircle2, Clock, AlertCircle, Circle, SkipForward } from 'lucide-react';
import { getContent, getWorkflow } from '../api/client';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { WorkflowStep, Content } from '../types';
import { workflowPercent, formatDate } from '../utils/status';

const STEP_STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  completed:   { icon: CheckCircle2, color: '#22EDD8' },
  in_progress: { icon: Clock,         color: '#9B8FFF' },
  blocked:     { icon: AlertCircle,  color: '#FF7090' },
  pending:     { icon: Circle,        color: '#4A5580' },
  skipped:     { icon: SkipForward,   color: '#4A5580' },
};

function WorkflowCard({ content }: { content: Content }) {
  const { data: steps } = useQuery({
    queryKey: ['workflow', content.id],
    queryFn: () => getWorkflow(content.id),
    enabled: true,
  });
  const pct = workflowPercent(content.steps_done, content.steps_total);

  return (
    <div
      className="rounded-xl p-5 float-up"
      style={{ background: 'rgba(14,18,36,0.7)', border: '1px solid rgba(30,37,72,0.6)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold truncate" style={{ color: '#CCD6F6' }}>{content.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs" style={{ color: '#4A5580' }}>{content.partner_name}</span>
            <StatusBadge value={content.status} />
          </div>
        </div>
        <div className="text-right ml-3 flex-shrink-0">
          <div className="text-lg font-bold" style={{ color: pct >= 75 ? '#22EDD8' : pct >= 40 ? '#9B8FFF' : '#FF7090' }}>
            {pct}%
          </div>
          <div className="text-xs" style={{ color: '#4A5580' }}>
            {content.steps_done ?? 0}/{content.steps_total ?? 0}
          </div>
        </div>
      </div>

      <ProgressBar value={pct} size="md" />

      {/* Steps Timeline */}
      {steps && (
        <div className="mt-4 space-y-2">
          {(steps as WorkflowStep[]).map((step, idx) => {
            const conf = STEP_STATUS_CONFIG[step.status] ?? STEP_STATUS_CONFIG.pending;
            const Icon = conf.icon;
            return (
              <div key={step.id} className="flex items-center gap-3">
                <div className="flex items-center" style={{ flexShrink: 0 }}>
                  <Icon size={14} style={{ color: conf.color }} />
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: step.status === 'completed' ? '#22EDD8' : step.status === 'blocked' ? '#FF7090' : '#8892B0' }}>
                      {step.step_name}
                    </span>
                    {step.assigned_to && (
                      <span className="text-xs" style={{ color: '#4A5580' }}>· {step.assigned_to}</span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: '#2D3564' }}>
                    {step.completed_at ? `Done ${formatDate(step.completed_at)}` : step.due_date ? `Due ${formatDate(step.due_date)}` : ''}
                  </span>
                </div>
                {idx < (steps as WorkflowStep[]).length - 1 && (
                  <div style={{ position: 'absolute', left: 26, marginTop: 20, width: 1, height: 12, background: 'rgba(45,53,100,0.4)' }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Workflow() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['workflow-content', search, statusFilter, page],
    queryFn: () => getContent({ search, status: statusFilter || undefined, page, limit: 9 }),
    placeholderData: (prev) => prev,
  });

  const content: Content[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 9);

  return (
    <div>
      <Header title="Workflow Progress" subtitle="Step-by-step content pipeline status" />
      <div className="p-6">

        <div className="flex items-center gap-3 mb-5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5580' }} />
            <input
              className="input-field pl-8"
              style={{ width: 260, height: 36 }}
              placeholder="Search content…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="input-field" style={{ height: 36 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {['draft', 'in_review', 'approved', 'scheduled', 'live', 'blocked'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="ml-auto text-xs" style={{ color: '#4A5580' }}>{total} records</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="rounded-xl shimmer" style={{ height: 200, border: '1px solid rgba(30,37,72,0.4)' }} />
            ))
          ) : content.length === 0 ? (
            <div className="col-span-3 text-center py-16" style={{ color: '#4A5580' }}>
              <GitBranch size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No content found</p>
            </div>
          ) : content.map(c => <WorkflowCard key={c.id} content={c} />)}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-5">
            <span className="text-xs" style={{ color: '#4A5580' }}>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs px-3 py-1.5" style={{ opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost text-xs px-3 py-1.5" style={{ opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
