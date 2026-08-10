import React from 'react';
import { STATUS_COLORS, SEVERITY_COLORS, TIER_COLORS, formatStatus } from '../../utils/status';

type Variant = 'status' | 'severity' | 'tier';

interface StatusBadgeProps {
  value: string;
  variant?: Variant;
  pulse?: boolean;
}

export function StatusBadge({ value, variant = 'status', pulse = false }: StatusBadgeProps) {
  const map = variant === 'severity' ? SEVERITY_COLORS : variant === 'tier' ? TIER_COLORS : STATUS_COLORS;
  const colors = (map as Record<string, { bg: string; text: string; border: string; dot?: string }>)[value] ?? {
    bg: 'rgba(136,146,176,0.08)', text: '#8892B0', border: 'rgba(136,146,176,0.2)', dot: '#8892B0'
  };

  return (
    <span
      className="badge"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {colors.dot && (
        <span
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: colors.dot, flexShrink: 0,
            ...(pulse && value === 'live' ? { animation: 'glow-pulse 2s infinite' } : {}),
          }}
        />
      )}
      {formatStatus(value)}
    </span>
  );
}
