'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MessageCircle, FileText, Calendar, History, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const menuItems = [
  {
    name: 'Chat (Assistente IA)',
    href: '/dashboard',
    icon: MessageCircle,
  },
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
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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
    <aside className="w-full md:w-72 bg-sidebar-dark text-white flex flex-col h-screen md:h-auto md:sticky md:top-0">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
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

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

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

      {/* User Info e Logout */}
      <div className="p-4 border-t border-white/10 space-y-4">
        {user && (
          <div className="px-4 py-3 bg-white/5 rounded-lg">
            <p className="text-xs text-white/70">Logado como</p>
            <p className="text-sm font-semibold text-white truncate">{user.full_name || user.email}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors disabled:opacity-50"
        >
          <LogOut size={20} />
          <span className="text-sm">{isLoading ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  );
}
