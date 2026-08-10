import React from 'react';

interface ProgressBarProps {
  value: number; // 0–100
  size?: 'sm' | 'md';
  showLabel?: boolean;
  color?: string;
}

export function ProgressBar({ value, size = 'sm', showLabel = false, color }: ProgressBarProps) {
  const h = size === 'sm' ? 4 : 6;
  const pct = Math.min(Math.max(value, 0), 100);

  const getColor = () => {
    if (color) return color;
    if (pct >= 75) return '#22EDD8';
    if (pct >= 40) return '#9B8FFF';
    if (pct >= 20) return '#FFD166';
    return '#FF7090';
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height: h, background: 'rgba(45,53,100,0.4)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${getColor()}99, ${getColor()})`,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium tabular-nums" style={{ color: '#8892B0', minWidth: 32 }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
