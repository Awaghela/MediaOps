import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart2, Download, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { getPartners, getPartnerReport } from '../api/client';
import { Header } from '../components/layout/Header';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Partner } from '../types';

const COLORS = ['#6C5FDE', '#22EDD8', '#FFD166', '#FF7090', '#9B8FFF', '#4ECDC4', '#FF7090', '#FFD166'];

export function Reports() {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const { data: partnersData } = useQuery({
    queryKey: ['partners-report'],
    queryFn: () => getPartners({ limit: 20 }),
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['partner-report', selectedPartnerId],
    queryFn: () => getPartnerReport(selectedPartnerId!),
    enabled: !!selectedPartnerId,
  });

  const partners: Partner[] = partnersData?.data || [];
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  return (
    <div>
      <Header title="Partner Reports" subtitle="Detailed analytics and workflow health" />
      <div className="p-6 flex gap-5">

        {/* Partner List */}
        <div
          className="rounded-xl overflow-hidden flex-shrink-0"
          style={{ width: 260, background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(30,37,72,0.6)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#4A5580' }}>Select Partner</h2>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            {partners.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between px-4 py-3 cursor-pointer border-b transition-all"
                style={{
                  borderColor: 'rgba(30,37,72,0.4)',
                  background: selectedPartnerId === p.id ? 'rgba(108,95,222,0.1)' : 'transparent',
                }}
                onClick={() => setSelectedPartnerId(p.id)}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: selectedPartnerId === p.id ? '#9B8FFF' : '#CCD6F6' }}>{p.name}</div>
                  <StatusBadge value={p.onboarding_status} />
                </div>
                <ChevronRight size={14} style={{ color: selectedPartnerId === p.id ? '#9B8FFF' : '#2D3564' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Report Panel */}
        <div className="flex-1 min-w-0">
          {!selectedPartnerId ? (
            <div
              className="rounded-xl flex flex-col items-center justify-center"
              style={{ height: 400, background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
            >
              <BarChart2 size={48} style={{ color: '#2D3564', marginBottom: 12 }} />
              <p className="text-sm" style={{ color: '#4A5580' }}>Select a partner to view their report</p>
            </div>
          ) : reportLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-xl shimmer" style={{ height: 120, border: '1px solid rgba(30,37,72,0.4)' }} />
              ))}
            </div>
          ) : report && (
            <div className="space-y-4">
              {/* Summary Header */}
              <div
                className="rounded-xl p-5"
                style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold" style={{ color: '#CCD6F6' }}>{selectedPartner?.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge value={report.summary?.tier} variant="tier" />
                      <StatusBadge value={report.summary?.onboarding_status} />
                    </div>
                  </div>
                  <button className="btn-ghost flex items-center gap-1.5 text-xs">
                    <Download size={12} /> Export CSV
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-4">
                  {[
                    { label: 'Total Content', value: report.summary?.total_content, color: '#9B8FFF' },
                    { label: 'Live', value: report.summary?.live_content, color: '#22EDD8' },
                    { label: 'Blocked', value: report.summary?.blocked_content, color: '#FFD166' },
                    { label: 'Open Issues', value: report.summary?.open_issues, color: '#FF7090' },
                    { label: 'Critical', value: report.summary?.critical_issues, color: '#FF4D6D' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value ?? 0}</div>
                      <div className="text-xs mt-1" style={{ color: '#4A5580' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Issue Breakdown */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
                >
                  <h3 className="text-sm font-semibold mb-4" style={{ color: '#CCD6F6' }}>Issues by Type</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={report.issueBreakdown || []} layout="vertical">
                      <XAxis type="number" tick={{ fill: '#4A5580', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="issue_type" tick={{ fill: '#8892B0', fontSize: 10 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {(report.issueBreakdown || []).map((_: unknown, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Workflow Health */}
                <div
                  className="rounded-xl p-5"
                  style={{ background: 'rgba(14,18,36,0.8)', border: '1px solid rgba(30,37,72,0.6)' }}
                >
                  <h3 className="text-sm font-semibold mb-4" style={{ color: '#CCD6F6' }}>Workflow Step Health</h3>
                  <div className="space-y-3">
                    {(report.workflowHealth || []).map((step: { step_name: string; completion_pct: number }) => (
                      <div key={step.step_name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs" style={{ color: '#8892B0' }}>{step.step_name}</span>
                          <span className="text-xs font-medium" style={{ color: '#CCD6F6' }}>{step.completion_pct}%</span>
                        </div>
                        <ProgressBar value={step.completion_pct} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
