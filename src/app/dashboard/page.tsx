'use client';

import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { SuggestedQuestions } from '@/components/chat/SuggestedQuestions';
import { Loader2, Bell } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (query: string) => {
    try {
      setIsLoading(true);

      const tempId = Date.now().toString();

      // Adiciona a mensagem do usuário imediatamente com a resposta da IA vazia
      const userMessage: ChatMessageType = {
        id: tempId,
        user_query: query,
        ai_response: '',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      let currentId = conversationId;

      // Cria a conversa no banco se for a primeira pergunta
      if (!currentId) {
        const convResponse = await api.post('/chat/conversations', {
          title: query.substring(0, 30) + '...',
        });
        currentId = convResponse.data.id;
        setConversationId(currentId);
      }

      // Envia a requisição para o LLM
      const response = await api.post('/chat/ask', {
        conversation_id: currentId,
        query,
      });

      // Atualiza a mensagem temporária com a resposta real da IA
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === tempId
            ? {
                ...msg,
                ai_response: response.data.response || 'Resposta da IA',
                sources: response.data.sources,
              }
            : msg
        )
      );
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PrivateRoute>
      <DashboardLayout>
        <div className="flex flex-col h-full bg-white relative overflow-hidden">
          {/* Header (Fixo no topo) */}
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

          {/* Área Principal (Dinâmica) */}
          <div 
            className={`flex-1 overflow-y-auto p-6 transition-all duration-700 ease-in-out ${
              // 'justify-center' garante a centralização vertical perfeita
              messages.length === 0 ? 'flex flex-col items-center justify-center' : 'space-y-4'
            }`}
          >
            {messages.length === 0 ? (
              /* --- MODO INICIAL: CENTRALIZADO --- */
              /** * Adicionamos um '-mt-20' (margem negativa no topo) para compensar o peso 
               * visual do cabeçalho e deixar o chat no "centro ótico" da tela.
               */
              <div className="w-full max-w-3xl flex flex-col space-y-8 animate-in fade-in zoom-in-95 duration-500 mx-auto -mt-20">
                
                {/* Ícone e Saudação na mesma linha */}
                <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-sidebar-dark flex items-center justify-center shrink-0 shadow-md">
                    <span className="text-2xl md:text-3xl">🤓</span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-text-dark leading-tight">
                    Olá! Sou o GeFi. Como posso ajudar hoje, <span className="text-primary">{user?.full_name?.split(' ')[0] || 'Fiscal'}</span>?
                  </h2>
                </div>

                {/* Input Centralizado */}
                <div className="w-full shadow-lg rounded-xl">
                  <ChatInput 
                    onSend={handleSendMessage} 
                    disabled={isLoading} 
                    placeholder="Faça uma pergunta sobre normativos, prazos, fiscalização..." 
                  />
                </div>

                {/* Sugestões */}
                <div className="w-full">
                  <SuggestedQuestions
                    onSelectQuestion={handleSendMessage}
                    isLoading={isLoading}
                  />
                </div>

              </div>
            ) : (
              <div className="animate-in fade-in duration-500 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id}>
                    <ChatMessage isUser={true} content={msg.user_query} />
                    {msg.ai_response && (
                      <ChatMessage
                        isUser={false}
                        content={msg.ai_response}
                        sources={msg.sources}
                        timestamp={msg.created_at}
                      />
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm text-text-light">Pesquisando documentos...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* --- MODO CHAT: INPUT FIXO NO RODAPÉ --- */}
          {/* Este bloco só aparece quando há mensagens. Ele "desliza" de baixo para cima */}
          {messages.length > 0 && (
            <div className="p-6 border-t border-gray-200 bg-gray-50/50 animate-in slide-in-from-bottom-24 fade-in duration-500 z-10">
              <ChatInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
          )}
          
        </div>
      </DashboardLayout>
    </PrivateRoute>
  );
}
