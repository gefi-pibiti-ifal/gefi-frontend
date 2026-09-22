'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { ChatInput } from '@/components/chat/ChatInput';
import { SuggestedQuestions } from '@/components/chat/SuggestedQuestions';
import { Loader2, Bell } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { GefiAvatar } from '@/components/GefiAvatar';
import { usePersonas } from '@/contexts/PersonaContext';

function DashboardContent() {
  const { user } = useAuth();
  const { preference } = usePersonas();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (query: string) => {
    try {
      setIsLoading(true);

      const convResponse = await api.post('/chat/conversations', {
        title: query.substring(0, 30) + '...',
      });
      
      const newId = convResponse.data.id;

      router.push(`/dashboard/chat/${newId}?q=${encodeURIComponent(query)}`);
      
    } catch (error) {
      console.error(error);
      toast.error('Erro ao iniciar a conversa');
      setIsLoading(false);
    }
  };

  return (
      <div className="flex flex-col h-full bg-white relative overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shadow-sm bg-white z-10">
          <div>
            <h1 className="text-xl font-bold text-text-dark">
              GE<span className="text-primary">FI</span> Assistente
            </h1>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={24} className="text-text-dark" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 transition-all duration-700 ease-in-out flex flex-col items-center justify-center">
          <div className="w-full max-w-3xl flex flex-col space-y-8 animate-in fade-in zoom-in-95 duration-500 mx-auto -mt-20">
            
            <div className="flex items-center gap-4 w-full">
              <div className="w-16 h-16 md:w-16 md:h-16 rounded-full overflow-hidden shrink-0 shadow-md">
                <GefiAvatar size={64} persona={preference} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-dark leading-tight">
                Olá! Sou o GeFi. Como posso ajudar hoje, <span className="text-primary">{user?.full_name?.split(' ')[0] || 'Fiscal'}</span>?
              </h2>
            </div>

            <div className="w-full shadow-lg rounded-xl">
              <ChatInput 
                onSend={handleSendMessage} 
                disabled={isLoading} 
                placeholder="Faça uma pergunta sobre normativos, prazos, fiscalização..." 
              />
            </div>

            <div className="w-full">
              <SuggestedQuestions
                onSelectQuestion={handleSendMessage}
                isLoading={isLoading}
              />
            </div>

            {isLoading && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-medium">Iniciando conversa...</span>
                </div>
              </div>
            )}

          </div>
        </div>
        
      </div>
  );
}

export default function DashboardPage() {
  return (
    <PrivateRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </PrivateRoute>
  );
}