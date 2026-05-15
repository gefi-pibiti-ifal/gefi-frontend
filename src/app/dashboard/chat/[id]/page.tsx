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

  const conversationId = (params.id as string) ?? '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let isMounted = true; 

    const fetchHistory = async () => {
      try {
        const response = await api.get(`/chat/conversations/${conversationId}`);
        if (isMounted && response.data?.interactionHistory) {
          setMessages(response.data.interactionHistory);
        }
      } catch (error) {
        if (isMounted) {
          console.error(error);
          toast.error('Não foi possível carregar a conversa.');
        }
      } finally {
        if (isMounted) {
          setIsFetchingHistory(false);
        }
      }
    };

    if (conversationId) {
      fetchHistory();
    }

    return () => {
      isMounted = false; 
    };
  }, [conversationId]);

  useEffect(() => {
    if (isFetchingHistory || hasSentInitial.current) return;

    const initialQuery = searchParams.get('q');
    if (!initialQuery) return;

    hasSentInitial.current = true;
    handleSendMessage(initialQuery, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFetchingHistory, conversationId, searchParams]);

  const handleSendMessage = async (query: string, isInitial = false) => {
    const tempId = Date.now().toString();

    try {
      setIsLoading(true);

      const userMessage: ChatMessageType = {
        id: tempId,
        user_query: query,
        ai_response: '',
        created_at: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, userMessage]);

      const response = await api.post('/chat/ask', {
        conversation_id: conversationId,
        query,
      });

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === tempId);
        
        if (exists) {
          return prev.map((msg) =>
            msg.id === tempId
              ? {
                  ...msg,
                  id: response.data.id ?? tempId,
                  ai_response: response.data.ai_response ?? response.data.response ?? '',
                  sources: response.data.sources,
                  created_at: response.data.created_at ?? msg.created_at,
                }
              : msg
          );
        }

        return [
          ...prev,
          {
            id: response.data.id ?? tempId,
            user_query: query,
            ai_response: response.data.ai_response ?? response.data.response ?? '',
            sources: response.data.sources,
            created_at: response.data.created_at,
          },
        ];
      });

      if (isInitial) {
        router.replace(`/dashboard/chat/${conversationId}`);
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar mensagem');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
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

      <div className="flex-1 overflow-y-auto p-6 transition-all duration-700 ease-in-out">
        {isFetchingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 space-y-4 pb-4">
            {messages.length === 0 && !isLoading ? (
              <div className="text-center text-text-light mt-10">
                Nenhuma mensagem nesta conversa ainda.
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={msg.id}>
                  <ChatMessage isUser={true} content={msg.user_query} />
                  
                  {msg.ai_response ? (
                    <ChatMessage
                      isUser={false}
                      content={msg.ai_response}
                      sources={msg.sources}
                      timestamp={msg.created_at}
                    />
                  ) : (
                    isLoading && index === messages.length - 1 && (
                      <div className="flex justify-start mb-10 w-full max-w-4xl mx-auto mt-2">
                        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl rounded-tl-sm border border-gray-100">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-sm font-medium text-text-dark">O GeFi está a pensar...</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50/50 z-10 shrink-0">
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