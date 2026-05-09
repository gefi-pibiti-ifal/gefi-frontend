'use client';

import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content: Ocupa o resto do espaço, mas respeita o limite do h-screen */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        {children}
      </main>
    </div>
  );
}