import React from 'react';

export function Skeleton({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`shimmer rounded ${className}`}
      style={{ ...style }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(20,24,48,0.5)', border: '1px solid rgba(45,53,100,0.4)' }}>
      <div className="flex justify-between mb-4">
        <Skeleton style={{ width: 40, height: 40, borderRadius: 8 }} />
        <Skeleton style={{ width: 80, height: 20 }} />
      </div>
      <Skeleton style={{ width: '60%', height: 36, marginBottom: 8 }} />
      <Skeleton style={{ width: '40%', height: 16 }} />
    </div>
  );
}
