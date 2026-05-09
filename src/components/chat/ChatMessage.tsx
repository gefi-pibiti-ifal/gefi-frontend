'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

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

  // MENSAGEM DO UTILIZADOR
  if (isUser) {
    return (
      // Alterado para mb-6 para dar um respiro vertical antes da resposta da IA
      <div className="flex justify-end mb-6 w-full max-w-4xl mx-auto">
        <div className="max-w-xl lg:max-w-2xl bg-message-user text-white rounded-2xl rounded-tr-sm p-5 shadow-md">
          <p className="text-base">{content}</p>
        </div>
      </div>
    );
  }

  // MENSAGEM DA IA
  return (
    // 1. Aplicamos a mesma "coluna invisível" centralizada aqui (w-full max-w-4xl mx-auto)
    <div className="flex justify-start mt-1 mb-10 w-full max-w-4xl mx-auto">
      {/* Removemos o w-full daqui para não forçar o alargamento */}
      <div className="space-y-3 max-w-full">
        {/* Avatar e Mensagem */}
        <div className="flex gap-4 max-w-full">
          <div className="w-12 h-12 rounded-full bg-sidebar-dark flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
            <span className="text-2xl">🤓</span>
          </div>
          
          {/* 2. Removemos o flex-1! Agora o fundo branco abraça o tamanho exato do texto */}
          <div className="bg-white border border-gray-300 shadow-sm rounded-2xl rounded-tl-sm p-6 overflow-hidden">
            <div className="text-base text-text-dark leading-relaxed markdown-content">
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-semibold text-black" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-5 mb-4 space-y-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal ml-5 mb-4 space-y-2" {...props} />,
                  li: ({node, ...props}) => <li {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-3 mt-5" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-3 mt-5" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-bold mb-2 mt-4" {...props} />,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Botões de Ação (Abaixo da mensagem) */}
        <div className="flex gap-2 ml-16">
          <button
            onClick={handleCopy}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
            title="Copiar texto"
          >
            {copied ? (
              <Check size={18} className="text-primary" />
            ) : (
              <Copy size={18} className="text-text-light" />
            )}
          </button>
        </div>

        {/* Fontes / Citações */}
        {sources && sources.length > 0 && (
          <div className="ml-16 space-y-2 mt-2 bg-gray-50 p-4 rounded-xl border border-gray-200 inline-block">
            <p className="text-sm font-semibold text-text-dark">Documentos Consultados:</p>
            {sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <FileIcon size={16} />
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}