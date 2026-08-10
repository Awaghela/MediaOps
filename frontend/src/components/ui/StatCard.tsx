import React, { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: 'violet' | 'cyan' | 'rose' | 'amber';
  suffix?: string;
  delta?: { value: number; label: string };
  delay?: number;
}

const ACCENT_STYLES = {
  violet: {
    icon: '#9B8FFF',
    iconBg: 'rgba(108,95,222,0.12)',
    glow: 'rgba(108,95,222,0.2)',
    gradient: 'linear-gradient(135deg,rgba(108,95,222,0.08),rgba(155,143,255,0.04))',
    border: 'rgba(108,95,222,0.25)',
  },
  cyan: {
    icon: '#22EDD8',
    iconBg: 'rgba(0,210,192,0.12)',
    glow: 'rgba(0,210,192,0.2)',
    gradient: 'linear-gradient(135deg,rgba(0,210,192,0.08),rgba(34,237,216,0.04))',
    border: 'rgba(0,210,192,0.25)',
  },
  rose: {
    icon: '#FF7090',
    iconBg: 'rgba(255,77,109,0.12)',
    glow: 'rgba(255,77,109,0.2)',
    gradient: 'linear-gradient(135deg,rgba(255,77,109,0.08),rgba(255,112,144,0.04))',
    border: 'rgba(255,77,109,0.25)',
  },
  amber: {
    icon: '#FFD166',
    iconBg: 'rgba(255,189,0,0.12)',
    glow: 'rgba(255,189,0,0.2)',
    gradient: 'linear-gradient(135deg,rgba(255,189,0,0.08),rgba(255,209,102,0.04))',
    border: 'rgba(255,189,0,0.25)',
  },
};

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const frame = useRef<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(ease * target));
        if (progress < 1) frame.current = requestAnimationFrame(animate);
      };
      frame.current = requestAnimationFrame(animate);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame.current); };
  }, [target, duration, delay]);

  return count;
}

export function StatCard({ label, value, icon: Icon, accent, suffix = '', delta, delay = 0 }: StatCardProps) {
  const styles = ACCENT_STYLES[accent];
  const count = useCountUp(value, 1200, delay);

  return (
    <div
      className="stat-card rounded-xl p-5 float-up"
      style={{
        background: styles.gradient,
        border: `1px solid ${styles.border}`,
        boxShadow: `0 4px 20px ${styles.glow}`,
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2.5 rounded-lg flex items-center justify-center"
            style={{ background: styles.iconBg }}
          >
            <Icon size={18} style={{ color: styles.icon }} />
          </div>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8892B0' }}>
            {label}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span
              className="text-3xl font-bold tracking-tight"
              style={{ color: '#CCD6F6', fontVariantNumeric: 'tabular-nums' }}
            >
              {count.toLocaleString()}
            </span>
            {suffix && <span className="text-sm" style={{ color: styles.icon }}>{suffix}</span>}
          </div>
          {delta && (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-xs" style={{ color: delta.value >= 0 ? '#22EDD8' : '#FF7090' }}>
                {delta.value >= 0 ? '↑' : '↓'} {Math.abs(delta.value)}
              </span>
              <span className="text-xs" style={{ color: '#4A5580' }}>{delta.label}</span>
            </div>
          )}
        </div>

        {/* Mini progress arc */}
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(45,53,100,0.4)" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="20" fill="none"
            stroke={styles.icon} strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(count / Math.max(value, 1) * 125.66, 125.66)} 125.66`}
            style={{ transition: 'stroke-dasharray 1.2s ease-out' }}
          />
        </svg>
      </div>
    </div>
  );
}
