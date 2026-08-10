import React from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080C18' }}>
      <Sidebar />
      <div className="flex-1 overflow-auto" style={{ marginLeft: 220 }}>
        {children}
      </div>
    </div>
  );
}
