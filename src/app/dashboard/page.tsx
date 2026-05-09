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
        <div className="flex flex-col h-screen bg-white">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-light bg-white">
            <div>
              <h1 className="text-2xl font-bold text-text-dark">
                Olá, <span className="text-primary">{user?.full_name || 'Fiscal'}</span>! Vamos resolver pendências hoje?
              </h1>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={24} className="text-text-dark" />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <SuggestedQuestions
                onSelectQuestion={handleSendMessage}
                isLoading={isLoading}
              />
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id}>
                    {/* Renderiza sempre a pergunta do usuário */}
                    <ChatMessage isUser={true} content={msg.user_query} />
                    
                    {/* Renderiza o balão da IA APENAS se a resposta não estiver vazia */}
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
              </>
            )}

            {/* Indicador de carregamento enquanto a IA pensa */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 p-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm text-text-light">Processando...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-border-light bg-white">
            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
          </div>
        </div>
      </DashboardLayout>
    </PrivateRoute>
  );
}