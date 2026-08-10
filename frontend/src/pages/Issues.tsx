import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, AlertTriangle, Clock, User, Tag } from 'lucide-react';
import { getIssues, updateIssue } from '../api/client';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Issue } from '../types';
import { formatDate, timeAgo, SEVERITY_COLORS } from '../utils/status';

const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'escalated'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const ISSUE_TYPES = ['metadata', 'rights', 'technical', 'legal', 'content_quality', 'scheduling', 'billing', 'escalation'];

const TYPE_ICONS: Record<string, string> = {
  metadata: '📋', rights: '⚖️', technical: '⚙️', legal: '🏛️',
  content_quality: '🎬', scheduling: '📅', billing: '💳', escalation: '🚨',
};

export function Issues() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['issues', search, statusFilter, severityFilter, typeFilter, page],
    queryFn: () => getIssues({
      search, status: statusFilter || undefined,
      severity: severityFilter || undefined,
      issue_type: typeFilter || undefined,
      page, limit: 18,
    }),
    placeholderData: (prev) => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updateIssue(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['issues'] }); setSelectedIssue(null); },
  });

  const issues: Issue[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 18);

  return (
    <div>
      <Header title="Issue Tracker" subtitle={`${total} issues total`} />
      <div className="p-6">

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5580' }} />
            <input
              className="input-field pl-8"
              style={{ width: 240, height: 36 }}
              placeholder="Search issues…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <select className="input-field" style={{ height: 36 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {ISSUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-field" style={{ height: 36 }} value={severityFilter} onChange={e => { setSeverityFilter(e.target.value); setPage(1); }}>
            <option value="">All Severities</option>
            {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input-field" style={{ height: 36 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {ISSUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="btn-primary flex items-center gap-1.5 ml-auto">
            <Plus size={14} /> New Issue
          </button>
        </div>

        {/* Issues Grid */}
        <div className="grid grid-cols-2 gap-3">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl p-4 shimmer" style={{ height: 140, border: '1px solid rgba(30,37,72,0.6)' }} />
            ))
          ) : issues.length === 0 ? (
            <div className="col-span-2 text-center py-16" style={{ color: '#4A5580' }}>
              <AlertTriangle size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p>No issues found</p>
            </div>
          ) : issues.map((issue) => {
            const sevColors = SEVERITY_COLORS[issue.severity] ?? SEVERITY_COLORS.low;
            return (
              <div
                key={issue.id}
                className="rounded-xl p-4 cursor-pointer transition-all duration-150 gradient-border"
                style={{ background: 'rgba(14,18,36,0.7)', border: '1px solid rgba(30,37,72,0.6)' }}
                onClick={() => setSelectedIssue(issue)}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{TYPE_ICONS[issue.issue_type] || '📌'}</span>
                    <span className="text-sm font-semibold truncate" style={{ color: '#CCD6F6' }}>{issue.title}</span>
                  </div>
                  <div
                    className="badge flex-shrink-0"
                    style={{ background: sevColors.bg, color: sevColors.text, border: `1px solid ${sevColors.border}` }}
                  >
                    {issue.severity}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <StatusBadge value={issue.status} />
                  <StatusBadge value={issue.issue_type} />
                </div>

                <div className="flex items-center justify-between text-xs" style={{ color: '#4A5580' }}>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <User size={10} /> {issue.owner || 'Unassigned'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Tag size={10} /> {issue.partner_name}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {timeAgo(issue.created_at)}
                  </span>
                </div>

                {issue.due_date && (
                  <div className="mt-2 text-xs" style={{ color: new Date(issue.due_date) < new Date() ? '#FF7090' : '#4A5580' }}>
                    Due: {formatDate(issue.due_date)}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-5">
            <span className="text-xs" style={{ color: '#4A5580' }}>Page {page} of {totalPages} · {total} total</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-xs px-3 py-1.5" style={{ opacity: page === 1 ? 0.4 : 1 }}>Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-ghost text-xs px-3 py-1.5" style={{ opacity: page === totalPages ? 0.4 : 1 }}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,12,24,0.85)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedIssue(null)}
        >
          <div
            className="rounded-xl p-6 w-full max-w-lg"
            style={{ background: '#141830', border: '1px solid rgba(45,53,100,0.8)', boxShadow: '0 24px 48px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold" style={{ color: '#CCD6F6' }}>{selectedIssue.title}</h3>
                <p className="text-xs mt-1" style={{ color: '#4A5580' }}>{selectedIssue.partner_name}</p>
              </div>
              <StatusBadge value={selectedIssue.severity} variant="severity" />
            </div>

            {selectedIssue.description && (
              <p className="text-sm mb-4" style={{ color: '#8892B0' }}>{selectedIssue.description}</p>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <div className="text-xs mb-1" style={{ color: '#4A5580' }}>Update Status</div>
                <select
                  className="input-field text-xs w-full"
                  style={{ height: 32 }}
                  defaultValue={selectedIssue.status}
                  id="issue-status-select"
                >
                  {ISSUE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: '#4A5580' }}>Owner</div>
                <input
                  className="input-field text-xs w-full"
                  style={{ height: 32 }}
                  defaultValue={selectedIssue.owner || ''}
                  id="issue-owner-input"
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs mb-1" style={{ color: '#4A5580' }}>Notes</div>
              <textarea
                className="input-field w-full text-sm"
                style={{ height: 80, resize: 'none' }}
                defaultValue={selectedIssue.notes || ''}
                id="issue-notes-textarea"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setSelectedIssue(null)} className="btn-ghost">Cancel</button>
              <button
                className="btn-primary"
                onClick={() => {
                  const status = (document.getElementById('issue-status-select') as HTMLSelectElement).value;
                  const owner = (document.getElementById('issue-owner-input') as HTMLInputElement).value;
                  const notes = (document.getElementById('issue-notes-textarea') as HTMLTextAreaElement).value;
                  updateMutation.mutate({ id: selectedIssue.id, data: { status, owner, notes } });
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
