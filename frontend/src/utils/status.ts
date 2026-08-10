export const STATUS_COLORS = {
  pending:     { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047', dot: '#EAB308' },
  in_progress: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD', dot: '#7C3AED' },
  review:      { bg: '#CFFAFE', text: '#164E63', border: '#67E8F9', dot: '#06B6D4' },
  blocked:     { bg: '#FFE4E6', text: '#9F1239', border: '#FCA5A5', dot: '#EF4444' },
  completed:   { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  draft:       { bg: '#F3F4F6', text: '#4B5563', border: '#D1D5DB', dot: '#9CA3AF' },
  in_review:   { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD', dot: '#7C3AED' },
  approved:    { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  scheduled:   { bg: '#FEF9C3', text: '#854D0E', border: '#FDE047', dot: '#EAB308' },
  live:        { bg: '#DCFCE7', text: '#14532D', border: '#86EFAC', dot: '#22C55E' },
  cancelled:   { bg: '#F3F4F6', text: '#9CA3AF', border: '#E5E7EB', dot: '#D1D5DB' },
  open:        { bg: '#FFE4E6', text: '#9F1239', border: '#FCA5A5', dot: '#EF4444' },
  resolved:    { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7', dot: '#10B981' },
  wont_fix:    { bg: '#F3F4F6', text: '#9CA3AF', border: '#E5E7EB', dot: '#D1D5DB' },
  escalated:   { bg: '#FEE2E2', text: '#7F1D1D', border: '#FCA5A5', dot: '#DC2626' },
};

export const SEVERITY_COLORS = {
  critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  high:     { bg: '#FEF9C3', text: '#D97706', border: '#FDE047' },
  medium:   { bg: '#EDE9FE', text: '#7C3AED', border: '#C4B5FD' },
  low:      { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
};

export const TIER_COLORS = {
  premium:  { bg: '#FEF9C3', text: '#92400E', border: '#FDE047' },
  standard: { bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
  basic:    { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' },
};

export function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function formatDate(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function workflowPercent(done?: number, total?: number) {
  if (!total) return 0;
  return Math.round((done ?? 0) / total * 100);
}
