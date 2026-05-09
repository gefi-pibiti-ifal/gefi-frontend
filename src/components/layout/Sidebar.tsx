'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, FileText, Calendar, History, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Conversation } from '@/types';

const menuItems = [
  {
    name: 'Documentos',
    href: '/dashboard/documents',
    icon: FileText,
  },
  {
    name: 'Cronograma',
    href: '/dashboard/schedule',
    icon: Calendar,
  },
  {
    name: 'Histórico',
    href: '/dashboard/history',
    icon: History,
  },
  {
    name: 'Novo Chat (IA)',
    href: '/dashboard',
    icon: MessageCircle,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await api.get('/chat/conversations');
        setConversations(response.data);
      } catch (error) {
        console.error('Erro ao buscar conversas:', error);
      }
    };

    fetchConversations();
  }, []);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <aside className="w-full md:w-72 bg-sidebar-dark text-white flex flex-col h-full shrink-0">
      {/* 1. Logo (FIXO) */}
      <div className="p-6 border-b border-white/10 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
          <div className="text-2xl font-bold">
            <span className="text-white">GE</span>
            <span className="text-primary">FI</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold leading-none">Gestão e Fiscalização</span>
            <span className="text-xs font-semibold leading-none">Inteligente</span>
          </div>
        </Link>
      </div>

      {/* 2. Menus Principais (FIXOS) */}
      <nav className="px-4 pt-6 pb-2 space-y-2 shrink-0">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard' 
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-sidebar-dark font-semibold'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Separador e Título (FIXOS) */}
      <div className="mx-4 my-2 border-t border-white/10 shrink-0"></div>
      <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 px-6 shrink-0">
        As Suas Conversas
      </div>

      {/* 3. Lista de Conversas (SCROLLÁVEL e com novo scrollbar) */}
      <div className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto scrollbar-discreta">
        {conversations.length === 0 ? (
          <p className="text-sm text-white/40 px-2 italic">Nenhuma conversa guardada.</p>
        ) : (
          conversations.map((conv) => {
            const isConvActive = pathname === `/dashboard/chat/${conv.id}`;
            return (
              <Link
                key={conv.id}
                href={`/dashboard/chat/${conv.id}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors truncate ${
                  isConvActive
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <MessageSquare size={16} className="shrink-0" />
                <span className="truncate">{conv.title}</span>
              </Link>
            );
          })
        )}
      </div>

      {/* 4. User Info e Logout (FIXOS no rodapé) */}
      <div className="p-4 border-t border-white/10 space-y-4 shrink-0 mt-auto">
        {user && (
          <div className="px-4 py-3 bg-white/5 rounded-lg">
            <p className="text-xs text-white/70">Sessão iniciada como</p>
            <p className="text-sm font-semibold text-white truncate">{user.full_name || user.email}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <LogOut size={20} />
          <span className="text-sm">{isLoading ? 'A sair...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  );
}