'use client';

import { Copy, Check, FileText, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  isUser: boolean;
  content: string;
  sources?: Array<{ id: string; title: string }>;
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

              {/* Anexo Inteligente de Fontes (apenas se houver fontes) */}
              {sources && sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="relative group inline-block">
                    {/* Badge/Botão de Fontes */}
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition-all shadow-sm">
                      <FileText size={14} className="text-primary" />
                      <span>{sources.length} {sources.length === 1 ? 'fonte consultada' : 'fontes consultadas'}</span>
                      <ChevronDown size={12} className="group-hover:rotate-180 transition-transform" />
                    </button>

                    {/* Popover Flutuante (Menu de Fontes) */}
                    <div className="absolute bottom-full left-0 mb-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-30 p-3 transform origin-bottom-left group-hover:scale-100 scale-95">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Documentos Únicos Consultados:</p>
                      <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-discreta">
                        {sources.map((source) => (
                          <div 
                            key={source.id} 
                            className="flex items-center gap-2.5 p-2.5 hover:bg-gray-50 rounded-lg text-xs text-text-dark transition-colors border border-transparent hover:border-gray-100 cursor-default"
                          >
                            <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText size={14} className="text-primary" />
                            </div>
                            <span className="truncate font-medium" title={source.title}>
                              {source.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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