'use client';

import { Sidebar } from './Sidebar';
import { PersonaProvider } from '@/contexts/PersonaContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    // O catálogo de personalidades é carregado uma vez para toda a área
    // autenticada: a sidebar, o cabeçalho da conversa e o selo das mensagens
    // leem a mesma fonte e não podem discordar entre si.
    <PersonaProvider>
      <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-white">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-auto m-2">
          {children}
        </main>
      </div>
    </PersonaProvider>
  );
}