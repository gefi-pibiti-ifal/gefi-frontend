'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { RawSource } from '@/types';
import { MessageSources } from './MessageSources';

interface ChatMessageProps {
  isUser: boolean;
  content: string;
  sources?: RawSource[];
  timestamp?: string;
}

export function ChatMessage({ isUser, content, sources }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 w-full max-w-4xl mx-auto px-4">
        <div className="max-w-xl lg:max-w-2xl bg-message-user text-white rounded-2xl rounded-tr-sm p-5 shadow-md">
          <p className="text-base">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-10 w-full max-w-4xl mx-auto px-4">
      <div className="space-y-3 max-w-full w-full">
        <div className="flex gap-4 max-w-full">
          {/* Avatar da IA */}
          <div className="w-10 h-10 rounded-full bg-sidebar-dark flex items-center justify-center flex-shrink-0 shadow-sm mt-1 border border-transparent">
            <span className="text-xl">🤓</span>
          </div>
          
          <div className="flex flex-col gap-2 max-w-full overflow-hidden">
            <div className="bg-white border border-gray-200 shadow-sm rounded-2xl rounded-tl-sm p-6 overflow-hidden">
              <div className="text-base text-text-dark leading-relaxed markdown-content">
                <ReactMarkdown
                  components={{
                    p: ({...props}) => <p className="mb-4 last:mb-0" {...props} />,
                    strong: ({...props}) => <strong className="font-semibold text-black" {...props} />,
                    ul: ({...props}) => <ul className="list-disc ml-5 mb-4 space-y-2" {...props} />,
                    ol: ({...props}) => <ol className="list-decimal ml-5 mb-4 space-y-2" {...props} />,
                    h1: ({...props}) => <h1 className="text-xl font-bold mb-3 mt-5 text-black" {...props} />,
                    h2: ({...props}) => <h2 className="text-lg font-bold mb-3 mt-5 text-black" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>

              {/* Fontes consultadas: abrir o documento, localizar o trecho, baixar */}
              <MessageSources sources={sources} />
            </div>

            {/* Ações da Mensagem (Copiar) */}
            <div className="flex gap-2 ml-2">
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors border border-transparent hover:border-gray-200"
                title="Copiar resposta"
              >
                {copied ? (
                  <Check size={16} className="text-primary" />
                ) : (
                  <Copy size={16} className="text-text-light" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}