'use client';


import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import { Conversation } from '@/types';
import { cn } from '@/lib/utils';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: string) => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full gap-4">
      <Button
        onClick={onNewConversation}
        disabled={isLoading}
        className="w-full justify-start gap-2"
      >
        <Plus className="w-4 h-4" />
        Nova Conversa
      </Button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {conversations.length === 0 ? (
          <Card className="p-4 text-center text-gray-600">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conversa ainda</p>
          </Card>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors',
                activeConversationId === conversation.id
                  ? 'bg-primary text-white'
                  : 'hover:bg-gray-100 text-gray-900'
              )}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div
                className="flex-1 min-w-0"
                onClick={() => onSelectConversation(conversation.id)}
              >
                <p className="text-sm font-medium truncate">{conversation.title}</p>
                <p className="text-xs opacity-70">
                  {new Date(conversation.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              {onDeleteConversation && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation(conversation.id);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
