import React from 'react';
import { Search, Bell, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 py-3"
      style={{
        background: 'rgba(8,12,24,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(30,37,72,0.6)',
      }}
    >
      <div>
        <h1 className="text-lg font-semibold" style={{ color: '#CCD6F6' }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: '#4A5580' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#4A5580' }} />
          <input
            placeholder="Quick search…"
            className="input-field pl-8 text-sm"
            style={{ width: 200, height: 34 }}
          />
        </div>

        <button
          className="relative flex items-center justify-center rounded-lg"
          style={{ width: 34, height: 34, background: 'rgba(20,24,48,0.8)', border: '1px solid rgba(45,53,100,0.6)' }}
        >
          <Bell size={15} style={{ color: '#8892B0' }} />
          <span
            className="absolute top-1 right-1 rounded-full"
            style={{ width: 6, height: 6, background: '#FF4D6D' }}
          />
        </button>

        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: 34, height: 34,
            background: 'linear-gradient(135deg, #6C5FDE, #9B8FFF)',
          }}
        >
          <User size={16} color="white" />
        </div>
      </div>
    </header>
  );
}
