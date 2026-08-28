'use client';

/**
 * Caixa de fontes de uma resposta.
 *
 * Continua sendo o mesmo resumo discreto de antes — "N fontes consultadas" —,
 * mas agora cada documento é um caminho: abrir a fonte no ponto que fundamentou
 * a resposta e baixar o arquivo original. Fontes antigas, que guardaram apenas
 * o título, continuam listadas; simplesmente não abrem.
 */

import { useCallback, useMemo, useState } from 'react';
import { ChevronDown, Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { RawSource } from '@/types';
import { getErrorMessage } from '@/lib/api';
import { downloadDocumentFile } from '@/lib/documents';
import { NormalizedSource, describeSource, isNavigable, normalizeSources } from '@/lib/sources';
import { cn } from '@/lib/utils';
import { DocumentViewer } from '@/components/documents/DocumentViewer';

interface MessageSourcesProps {
  sources?: RawSource[] | null;
}

export function MessageSources({ sources }: MessageSourcesProps) {
  const items = useMemo(() => normalizeSources(sources), [sources]);

  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<NormalizedSource | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const closeViewer = useCallback(() => setSelected(null), []);

  if (items.length === 0) return null;

  const handleDownload = async (source: NormalizedSource) => {
    if (!source.downloadUrl || !source.id) return;

    setDownloadingId(source.id);
    try {
      await downloadDocumentFile(
        source.downloadUrl,
        source.file?.name ?? `${source.title}.pdf`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[11px] font-medium text-gray-600 shadow-sm transition-all hover:bg-gray-100"
      >
        <FileText size={14} className="text-primary" />
        <span>
          {items.length} {items.length === 1 ? 'fonte consultada' : 'fontes consultadas'}
        </span>
        <ChevronDown
          size={12}
          className={cn('transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="scrollbar-discreta mt-3 max-h-72 space-y-1.5 overflow-y-auto">
          {items.map((source, index) => {
            const navigable = isNavigable(source);
            const description = describeSource(source);

            return (
              <div
                key={source.id ?? `${source.title}-${index}`}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white p-2.5 transition-colors',
                  navigable && 'hover:border-gray-200 hover:bg-gray-50',
                )}
              >
                <button
                  onClick={() => navigable && setSelected(source)}
                  disabled={!navigable}
                  title={
                    navigable
                      ? 'Abrir o documento no trecho utilizado'
                      : 'Fonte registrada antes da navegação por documento'
                  }
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-left disabled:cursor-default"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10">
                    <FileText size={14} className="text-primary" />
                  </div>

                  <span className="min-w-0 flex-1">
                    <span
                      className="block truncate text-xs font-medium text-text-dark"
                      title={source.title}
                    >
                      {source.title}
                    </span>
                    {description && (
                      <span className="mt-0.5 block truncate text-[10px] text-text-light">
                        {description}
                      </span>
                    )}
                  </span>
                </button>

                {source.downloadUrl && (
                  <button
                    onClick={() => handleDownload(source)}
                    disabled={downloadingId === source.id}
                    title="Baixar o documento original"
                    aria-label={`Baixar ${source.title}`}
                    className="shrink-0 rounded-md p-1.5 text-text-light transition-colors hover:bg-gray-100 hover:text-text-dark disabled:opacity-50"
                  >
                    {downloadingId === source.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* A chave garante que trocar de documento recomece o visualizador do zero,
          em vez de reaproveitar o arquivo ou o texto do documento anterior. */}
      {selected && (
        <DocumentViewer
          key={selected.id ?? selected.title}
          source={selected}
          onClose={closeViewer}
        />
      )}
    </div>
  );
}
