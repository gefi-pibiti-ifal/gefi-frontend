'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { Loader2, Bell } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';

function ChatContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  const conversationId = params.id as string;

  // 1. Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 2. Carregar o histórico da conversa ao abrir a página
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/conversations/${conversationId}`);
        // Se o backend retornar o interactionHistory, colocamos na tela
        if (response.data && response.data.interactionHistory) {
          setMessages(response.data.interactionHistory);
        }
      } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        toast.error('Não foi possível carregar a conversa.');
      } finally {
        setIsFetchingHistory(false);
      }
    };

    if (conversationId) {
      fetchHistory();
    }
  }, [conversationId]);

  // 3. Capturar a pergunta que vem do "Novo Chat" (Redirecionamento)
  useEffect(() => {
    const initialQuery = searchParams.get('q');
    
    // Só envia se houver pergunta na URL, se ainda não estiver carregando o histórico, e se não tiver enviado antes
    if (initialQuery && !isFetchingHistory && !hasSentInitial.current) {
      hasSentInitial.current = true;
      
      // Limpa a URL para ficar elegante (remove o ?q=...)
      router.replace(`/dashboard/chat/${conversationId}`);
      
      // Dispara a mensagem!
      handleSendMessage(initialQuery);
    }
  }, [searchParams, isFetchingHistory, conversationId, router]);

  // 4. Função principal de enviar mensagem
  const handleSendMessage = async (query: string) => {
    const tempId = Date.now().toString(); 
    
    try {
      setIsLoading(true);

      // Adiciona imediatamente na tela
      const userMessage: ChatMessageType = {
        id: tempId,
        user_query: query,
        ai_response: '',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Pede a resposta à IA
      const response = await api.post('/chat/ask', {
        conversation_id: conversationId,
        query,
      });

      // Atualiza o balão vazio com a resposta
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
      
      // Remove a mensagem vazia se der erro
      setMessages((prev) => prev.filter(msg => msg.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header Fixo */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 shadow-sm bg-white z-10 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-text-dark">
            GE<span className="text-primary">FI</span> Assistente
          </h1>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={24} className="text-text-dark" />
        </button>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-6 transition-all duration-700 ease-in-out">
        {isFetchingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-4 pb-4">
            {messages.length === 0 && !isLoading && !searchParams.get('q') ? (
              <div className="text-center text-text-light mt-10">
                Nenhuma mensagem nesta conversa ainda.
              </div>
            ) : (
              messages.map((msg) => (
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
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start mb-10 w-full max-w-4xl mx-auto mt-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl rounded-tl-sm border border-gray-100">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-sm font-medium text-text-dark">O GeFi está a pensar...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input de Chat Fixo no Rodapé */}
      <div className="p-6 border-t border-gray-200 bg-gray-50/50 z-10 shrink-0">
        {/* Adicionámos esta div para criar o corredor central alinhado com as mensagens */}
        <div className="w-full max-w-4xl mx-auto">
          <ChatInput onSend={handleSendMessage} disabled={isLoading || isFetchingHistory} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <PrivateRoute>
      <DashboardLayout>
        <Suspense fallback={<div className="flex-1 bg-white" />}>
          <ChatContent />
        </Suspense>
      </DashboardLayout>
    </PrivateRoute>
  );
}