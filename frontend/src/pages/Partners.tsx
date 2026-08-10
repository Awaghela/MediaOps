import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Plus, ExternalLink, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPartners, updatePartner } from '../api/client';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Partner } from '../types';
import { formatDate, workflowPercent } from '../utils/status';

const ONBOARDING_STATUSES = ['pending', 'in_progress', 'review', 'blocked', 'completed'];
const TIERS = ['premium', 'standard', 'basic'];

export function Partners() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['partners', search, statusFilter, tierFilter, page],
    queryFn: () => getPartners({ search, status: statusFilter || undefined, tier: tierFilter || undefined, page, limit: 15 }),
    placeholderData: (prev) => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => updatePartner(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  });

  const partners: Partner[] = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <Header title="Partner Management" subtitle={`${total} partners total`} />
      <div className="p-6">

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5580' }} />
            <input
              className="input-field pl-8"
              style={{ width: 240, height: 36 }}
              placeholder="Search partners…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <select
            className="input-field"
            style={{ height: 36 }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            {ONBOARDING_STATUSES.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>

          <select
            className="input-field"
            style={{ height: 36 }}
            value={tierFilter}
            onChange={e => { setTierFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Tiers</option>
            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs" style={{ color: '#4A5580' }}>{total} results</span>
            <button className="btn-primary flex items-center gap-1.5">
              <Plus size={14} /> Add Partner
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(30,37,72,0.6)' }}>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(14,18,36,0.8)', borderBottom: '1px solid rgba(30,37,72,0.6)' }}>
                {['Partner', 'Tier', 'Region', 'Onboarding', 'Content', 'Issues', 'Blocked', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A5580' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="table-row">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="shimmer rounded" style={{ height: 14, width: '70%' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : partners.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: '#4A5580' }}>
                    No partners found
                  </td>
                </tr>
              ) : partners.map((p) => (
                <tr key={p.id} className="table-row" style={{ background: 'rgba(10,14,28,0.5)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center rounded-lg text-xs font-bold flex-shrink-0"
                        style={{
                          width: 32, height: 32,
                          background: 'linear-gradient(135deg, rgba(108,95,222,0.3), rgba(34,237,216,0.2))',
                          color: '#9B8FFF',
                        }}
                      >
                        {p.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#CCD6F6' }}>{p.name}</div>
                        <div className="text-xs" style={{ color: '#4A5580' }}>{p.contact_email || '—'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={p.tier} variant="tier" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Globe size={12} style={{ color: '#4A5580' }} />
                      <span className="text-sm" style={{ color: '#8892B0' }}>{p.region}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={p.onboarding_status} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium" style={{ color: '#CCD6F6' }}>
                      {p.content_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-sm font-medium"
                      style={{ color: (p.open_issues ?? 0) > 0 ? '#FF7090' : '#22EDD8' }}
                    >
                      {p.open_issues ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-sm"
                      style={{ color: (p.blocked_count ?? 0) > 0 ? '#FFD166' : '#4A5580' }}
                    >
                      {p.blocked_count ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        className="text-xs rounded px-2 py-1"
                        style={{ background: 'rgba(20,24,48,0.8)', border: '1px solid rgba(45,53,100,0.6)', color: '#8892B0' }}
                        value={p.onboarding_status}
                        onChange={e => updateMutation.mutate({ id: p.id, data: { onboarding_status: e.target.value } })}
                      >
                        {ONBOARDING_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button
                        onClick={() => navigate(`/partners/${p.id}`)}
                        className="p-1.5 rounded"
                        style={{ background: 'rgba(108,95,222,0.1)', border: '1px solid rgba(108,95,222,0.2)' }}
                      >
                        <ExternalLink size={12} style={{ color: '#9B8FFF' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs" style={{ color: '#4A5580' }}>
              Page {page} of {totalPages} · {total} total
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost text-xs px-3 py-1.5"
                style={{ opacity: page === 1 ? 0.4 : 1 }}
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-ghost text-xs px-3 py-1.5"
                style={{ opacity: page === totalPages ? 0.4 : 1 }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
