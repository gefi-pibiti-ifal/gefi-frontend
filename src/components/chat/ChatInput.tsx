'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void | Promise<void>;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Digite sua pergunta...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || isLoading || disabled) {
      return;
    }

    try {
      setIsLoading(true);
      await onSend(message);
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        placeholder={placeholder}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={isLoading || disabled}
        className="flex-1 px-6 py-5 text-lg border-2 border-gray-300 bg-white rounded-2xl shadow-sm text-text-dark placeholder-text-light focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={isLoading || disabled || !message.trim()}
        className="px-8 py-5 bg-primary text-white rounded-2xl shadow-md hover:bg-primary/90 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <Loader2 size={24} className="animate-spin" />
        ) : (
          <Send size={24} />
        )}
      </button>
    </form>
  );
}