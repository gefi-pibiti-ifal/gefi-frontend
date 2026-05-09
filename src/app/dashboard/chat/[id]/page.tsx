'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PrivateRoute } from '@/components/auth/PrivateRoute';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { Loader2, Bell } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '@/types';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function ChatDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setIsFetching(true);
        const response = await api.get(`/chat/conversations/${id}`);
        // Assumindo que o backend retorna a conversa com um array 'interactionHistory'
        setMessages(response.data.interactionHistory || []);
      } catch (error) {
        console.error(error);
        toast.error('Erro ao carregar histórico da conversa');
      } finally {
        setIsFetching(false);
      }
    };

    if (id) loadChatHistory();
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (query: string) => {
    try {
      setIsLoading(true);
      const userMessage: ChatMessageType = {
        id: Date.now().toString(),
        user_query: query,
        ai_response: '',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      const response = await api.post('/chat/ask', {
        conversation_id: id,
        query,
      });

      const newMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        user_query: query,
        ai_response: response.data.response,
        created_at: new Date().toISOString(),
        sources: response.data.sources,
      };
      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PrivateRoute>
      <DashboardLayout>
        <div className="flex flex-col h-screen bg-white">
          <div className="flex items-center justify-between p-6 border-b border-border-light bg-white">
            <h1 className="text-2xl font-bold text-text-dark">GeFi</h1>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={24} className="text-text-dark" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isFetching ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id}>
                  <ChatMessage isUser={true} content={msg.user_query} />
                  <ChatMessage
                    isUser={false}
                    content={msg.ai_response}
                    sources={msg.sources}
                    timestamp={msg.created_at}
                  />
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-6 border-t border-border-light bg-white">
            <ChatInput onSend={handleSendMessage} disabled={isLoading || isFetching} />
          </div>
        </div>
      </DashboardLayout>
    </PrivateRoute>
  );
}