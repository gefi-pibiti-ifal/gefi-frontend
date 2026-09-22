'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  MessageCircle, FileText, Calendar, History, LogOut, 
  MessageSquare, Loader2, MoreVertical, Pin, Edit2, Trash2 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { Conversation } from '@/types';
import { toast } from 'sonner';
import { PersonaPreference } from '@/components/chat/PersonaPreference';

// Importação dos componentes Radix (ou Shadcn)
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const menuItems = [
  { name: 'Documentos', href: '/dashboard/documents', icon: FileText },
  { name: 'Cronograma', href: '/dashboard/schedule', icon: Calendar },
  { name: 'Histórico', href: '/dashboard/history', icon: History },
  { name: 'Novo Chat (IA)', href: '/dashboard', icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  // A página corrente só é lida dentro do próprio updater (setPage(prev => ...)).
  const [, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [chatToDelete, setChatToDelete] = useState<{id: string, title: string} | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  const editInputRef = useRef<HTMLInputElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // ... (manter loadConversations com a lógica de deduplicação enviada anteriormente)
  const loadConversations = async (pageNumber: number) => {
    try {
      if (pageNumber === 1) setIsLoadingConversations(true);
      else setIsLoadingMore(true);

      const response = await api.get('/chat/conversations', {
        params: { page: pageNumber, limit: 20 }
      });
      
      const newConversations = response.data.data || response.data;
      const hasNext = response.data.meta?.hasNextPage ?? false;

      setConversations(prev => {
        if (pageNumber === 1) return newConversations;
        const existingIds = new Set(prev.map(c => c.id));
        const uniqueNewConversations = newConversations.filter(
          (c: Conversation) => !existingIds.has(c.id)
        );
        return [...prev, ...uniqueNewConversations];
      });
      
      setHasMore(hasNext);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingConversations(false);
      setIsLoadingMore(false);
    }
  };

  const lastConversationRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          loadConversations(nextPage);
          return nextPage;
        });
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  useEffect(() => { loadConversations(1); }, []);

  useEffect(() => {
    if (editingChatId && editInputRef.current) editInputRef.current.focus();
  }, [editingChatId]);

  // Ações de Pin, Rename e Delete (Lógica preservada)
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await api.patch(`/chat/conversations/${id}/pin`, { is_pinned: !currentPinned });
      setConversations(prev => {
        const updated = prev.map(c => c.id === id ? { ...c, is_pinned: !currentPinned } : c);
        return updated.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));
      });
      toast.success(currentPinned ? 'Chat desfixado' : 'Chat fixado');
    } catch (error) { toast.error('Erro ao atualizar'); }
  };

  const submitRename = async (id: string) => {
    const trimmedTitle = editingTitle.trim();
    if (!trimmedTitle) { setEditingChatId(null); return; }
    try {
      await api.patch(`/chat/conversations/${id}/rename`, { title: trimmedTitle });
      setConversations(prev => prev.map(c => c.id === id ? { ...c, title: trimmedTitle } : c));
      toast.success('Conversa renomeada');
    } catch (error) { toast.error('Erro ao renomear'); }
    finally { setEditingChatId(null); }
  };

  const confirmDelete = async () => {
    if (!chatToDelete) return;
    try {
      await api.delete(`/chat/conversations/${chatToDelete.id}`);
      setConversations(prev => prev.filter(c => c.id !== chatToDelete.id));
      toast.success('Conversa excluída');
      if (pathname === `/dashboard/chat/${chatToDelete.id}`) router.push('/dashboard');
    } catch (error) { toast.error('Erro ao excluir'); }
    finally { setChatToDelete(null); }
  };

  return (
    <>
      <aside className="w-full md:w-72 bg-sidebar-dark text-white flex flex-col h-full shrink-0 border-r border-gray-200 relative">
        {/* Header e Nav (Preservados) */}
        <div className="p-6 border-b border-white/10 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="text-2xl font-bold">
              <span className="text-white">GE</span><span className="text-primary">FI</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold leading-none">Gestão e Fiscalização</span>
              <span className="text-xs font-semibold leading-none">Inteligente</span>
            </div>
          </Link>
        </div>

        <nav className="px-4 pt-6 pb-2 space-y-2 shrink-0">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-primary text-sidebar-dark font-semibold' : 'text-white hover:bg-white/10'}`}>
                <Icon size={20} /><span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mx-4 my-2 border-t border-white/10 shrink-0"></div>
        <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 px-6 shrink-0">As Suas Conversas</div>

        <div className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto scrollbar-discreta">
          {isLoadingConversations ? (
            <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-white/50" /></div>
          ) : (
            <>
              {conversations.map((conv, index) => {
                const isConvActive = pathname === `/dashboard/chat/${conv.id}`;
                const isLastElement = conversations.length === index + 1;
                const isEditing = editingChatId === conv.id;

                return (
                  <div key={conv.id} ref={isLastElement ? lastConversationRef : null} className="relative group">
                    {isEditing ? (
                      <div className="flex items-center px-3 py-2 rounded-lg text-sm bg-white/10">
                        <input
                          ref={editInputRef}
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => submitRename(conv.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter') submitRename(conv.id); if (e.key === 'Escape') setEditingChatId(null); }}
                          className="w-full bg-black/20 border border-primary rounded px-2 py-0.5 outline-none text-white text-xs"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center group/item">
                        <Link
                          href={`/dashboard/chat/${conv.id}`}
                          className={`flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors truncate ${isConvActive ? 'bg-white/20 text-white font-medium' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
                        >
                          <div className="flex items-center gap-3 truncate pr-2">
                            <MessageSquare size={16} className="shrink-0" />
                            <span className="truncate text-xs">{conv.title}</span>
                            {conv.is_pinned && <Pin size={10} className="shrink-0 text-primary rotate-45" />}
                          </div>
                        </Link>

                        {/* REFATORAÇÃO: Menu Contextual Profissional */}
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button className="absolute right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-all data-[state=open]:opacity-100">
                              <MoreVertical size={14} className="text-white/70" />
                            </button>
                          </DropdownMenu.Trigger>

                          <DropdownMenu.Portal>
                            <DropdownMenu.Content 
                              side="right" 
                              align="start" 
                              sideOffset={5}
                              className="z-[100] min-w-[160px] bg-[#2d2d2d] border border-white/10 rounded-lg p-1 shadow-2xl animate-in fade-in zoom-in-95"
                            >
                              <DropdownMenu.Item 
                                onClick={() => handleTogglePin(conv.id, !!conv.is_pinned)}
                                className="flex items-center gap-3 px-3 py-2 text-xs text-white outline-none cursor-pointer hover:bg-white/10 rounded-md"
                              >
                                <Pin size={14} /> {conv.is_pinned ? 'Desfixar' : 'Fixar'}
                              </DropdownMenu.Item>
                              
                              <DropdownMenu.Item 
                                onClick={() => { setEditingChatId(conv.id); setEditingTitle(conv.title); }}
                                className="flex items-center gap-3 px-3 py-2 text-xs text-white outline-none cursor-pointer hover:bg-white/10 rounded-md"
                              >
                                <Edit2 size={14} /> Renomear
                              </DropdownMenu.Item>

                              <DropdownMenu.Separator className="h-px bg-white/10 my-1" />

                              <DropdownMenu.Item 
                                onClick={() => setChatToDelete({ id: conv.id, title: conv.title })}
                                className="flex items-center gap-3 px-3 py-2 text-xs text-red-400 outline-none cursor-pointer hover:bg-red-500/10 rounded-md"
                              >
                                <Trash2 size={14} /> Excluir
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoadingMore && <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-white/50" /></div>}
            </>
          )}
        </div>

        {/* Footer (Logout) Preservado */}
        <div className="p-4 border-t border-white/10 shrink-0 mt-auto">
          {/* Estilo das respostas: a preferência do usuário, acima do bloco dele */}
          <PersonaPreference />

          {user && (
            <div className="px-4 py-3 bg-white/5 rounded-lg mb-4">
              <p className="text-[10px] text-white/50 uppercase">Usuário</p>
              <p className="text-xs font-medium truncate">{user.full_name || user.email}</p>
            </div>
          )}
          <button onClick={() => logout()} className="w-full flex items-center gap-2 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors text-sm">
            <LogOut size={18} /> Sair
          </button>
        </div>
      </aside>

      {/* Modal de Exclusão (Preservado) */}
      {chatToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#202123] w-full max-w-sm rounded-xl p-6 text-white border border-white/10 shadow-2xl">
            <h2 className="text-lg font-semibold mb-2">Excluir chat?</h2>
            <p className="text-gray-400 text-sm mb-6">Isso removerá a conversa <strong>{chatToDelete.title}</strong> permanentemente.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setChatToDelete(null)} className="px-4 py-2 text-xs hover:bg-white/5 rounded-md transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="px-4 py-2 text-xs bg-red-600 hover:bg-red-700 rounded-md transition-colors font-medium">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}