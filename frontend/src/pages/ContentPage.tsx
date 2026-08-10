import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Film, Calendar, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { getContent, updateContent } from '../api/client';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Content } from '../types';
import { formatDate, workflowPercent } from '../utils/status';

const CONTENT_STATUSES = ['draft', 'in_review', 'approved', 'scheduled', 'live', 'blocked', 'cancelled'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const CONTENT_TYPES = ['series', 'movie', 'documentary', 'short', 'live_event', 'podcast'];

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#FF4D6D', high: '#FFD166', medium: '#9B8FFF', low: '#8892B0',
};

export function ContentPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['content', search, statusFilter, priorityFilter, page],
    queryFn: () => getContent({ search, status: statusFilter || undefined, priority: priorityFilter || undefined, page, limit: 15 }),
    placeholderData: (prev) => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateContent(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['content'] }),
  });

  const content: Content[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <Header title="Content Management" subtitle={`${total} content records`} />
      <div className="p-6">

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5580' }} />
            <input
              className="input-field pl-8"
              style={{ width: 260, height: 36 }}
              placeholder="Search content titles…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="input-field" style={{ height: 36 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {CONTENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-field" style={{ height: 36 }} value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="ml-auto text-xs" style={{ color: '#4A5580' }}>{total} records</span>
        </div>

        {/* Content Cards Grid */}
        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl p-4 shimmer" style={{ height: 80, border: '1px solid rgba(30,37,72,0.6)' }} />
            ))
          ) : content.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#4A5580' }}>
              <Film size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No content found</p>
            </div>
          ) : content.map((c) => {
            const pct = workflowPercent(c.steps_done, c.steps_total);
            const isExpanded = expandedId === c.id;
            return (
              <div
                key={c.id}
                className="rounded-xl overflow-hidden transition-all duration-200"
                style={{ background: 'rgba(14,18,36,0.7)', border: '1px solid rgba(30,37,72,0.6)' }}
              >
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  {/* Priority indicator */}
                  <div style={{ width: 3, height: 40, borderRadius: 2, background: PRIORITY_COLORS[c.priority], flexShrink: 0 }} />

                  {/* Title + Partner */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: '#CCD6F6' }}>{c.title}</span>
                      {c.blocker_count > 0 && (
                        <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,77,109,0.1)', color: '#FF7090' }}>
                          <AlertCircle size={10} /> {c.blocker_count}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: '#4A5580' }}>{c.partner_name}</span>
                      <span style={{ color: '#1E2548' }}>·</span>
                      <span className="text-xs capitalize" style={{ color: '#4A5580' }}>{c.content_type}</span>
                      {c.genre && <>
                        <span style={{ color: '#1E2548' }}>·</span>
                        <span className="text-xs" style={{ color: '#4A5580' }}>{c.genre}</span>
                      </>}
                    </div>
                  </div>

                  {/* Workflow progress */}
                  <div style={{ width: 120 }}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs" style={{ color: '#4A5580' }}>Workflow</span>
                      <span className="text-xs font-medium" style={{ color: '#8892B0' }}>{pct}%</span>
                    </div>
                    <ProgressBar value={pct} />
                  </div>

                  {/* Status */}
                  <div style={{ width: 90 }}>
                    <StatusBadge value={c.status} pulse />
                  </div>

                  {/* Launch date */}
                  <div className="text-right" style={{ minWidth: 100 }}>
                    {c.launch_date ? (
                      <>
                        <div className="flex items-center justify-end gap-1">
                          <Calendar size={11} style={{ color: '#4A5580' }} />
                          <span className="text-xs" style={{ color: '#8892B0' }}>{formatDate(c.launch_date)}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: '#2D3564' }}>No launch date</span>
                    )}
                  </div>

                  {isExpanded ? <ChevronUp size={14} style={{ color: '#4A5580' }} /> : <ChevronDown size={14} style={{ color: '#4A5580' }} />}
                </div>

                {/* Expanded row */}
                {isExpanded && (
                  <div className="px-6 pb-4 border-t" style={{ borderColor: 'rgba(30,37,72,0.6)' }}>
                    <div className="flex items-center gap-6 pt-3">
                      <div>
                        <div className="text-xs mb-1" style={{ color: '#4A5580' }}>Change Status</div>
                        <select
                          className="input-field text-xs"
                          style={{ height: 30 }}
                          value={c.status}
                          onChange={e => updateMutation.mutate({ id: c.id, data: { status: e.target.value } })}
                        >
                          {CONTENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <div className="text-xs mb-1" style={{ color: '#4A5580' }}>Priority</div>
                        <select
                          className="input-field text-xs"
                          style={{ height: 30 }}
                          value={c.priority}
                          onChange={e => updateMutation.mutate({ id: c.id, data: { priority: e.target.value } })}
                        >
                          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                      <div className="text-xs" style={{ color: '#4A5580' }}>
                        Steps: {c.steps_done ?? 0}/{c.steps_total ?? 0} completed
                      </div>
                      <div className="text-xs" style={{ color: '#4A5580' }}>
                        Issues: {c.issue_count ?? 0} open
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
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
