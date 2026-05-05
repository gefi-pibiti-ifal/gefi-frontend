'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ChatMessageProps {
  isUser: boolean;
  content: string;
  sources?: Array<{ title: string; url: string }>;
  timestamp?: string;
}

export function ChatMessage({ isUser, content, sources, timestamp }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xs lg:max-w-md bg-message-user text-white rounded-lg p-4">
          <p className="text-sm">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs lg:max-w-md space-y-3">
        {/* Avatar e Mensagem */}
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-dark flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">🤖</span>
          </div>
          <div className="bg-message-ai rounded-lg p-4 flex-1">
            <p className="text-sm text-text-dark whitespace-pre-wrap">{content}</p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 ml-11">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Copiar"
          >
            {copied ? (
              <Check size={16} className="text-primary" />
            ) : (
              <Copy size={16} className="text-text-light" />
            )}
          </button>
        </div>

        {/* Fontes */}
        {sources && sources.length > 0 && (
          <div className="ml-11 space-y-2">
            <p className="text-xs font-semibold text-text-light">Fontes:</p>
            {sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <FileIcon size={14} />
                {source.title}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FileIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}
