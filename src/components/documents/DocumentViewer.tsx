'use client';

/**
 * Visualizador da fonte citada numa resposta.
 *
 * Dois modos, porque a localização que o backend entrega tem dois níveis de
 * fidelidade e cada um se resolve melhor num lugar diferente:
 *
 *   PDF original   — o documento como ele é. O visualizador nativo do browser
 *                    abre na página informada (`#page=N`), mas não permite
 *                    marcar o trecho: por isso o texto do trecho fica à vista,
 *                    pronto para copiar e procurar.
 *   Texto indexado — o mesmo texto em que `char_start`/`char_end` foram
 *                    medidos, então aqui o trecho exato é destacado.
 *
 * O arquivo e o texto vêm por rotas autenticadas, logo são buscados via axios
 * e exibidos a partir de um object URL — o browser não enviaria o token numa
 * navegação direta.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { DocumentContent } from '@/types';
import { getErrorMessage } from '@/lib/api';
import {
  downloadDocumentFile,
  fetchDocumentContent,
  fetchDocumentFile,
} from '@/lib/documents';
import {
  NormalizedSource,
  formatFileSize,
  formatPageLabel,
  resolveContentRange,
} from '@/lib/sources';
import { cn } from '@/lib/utils';

type ViewMode = 'file' | 'text';
type Status = 'idle' | 'loading' | 'ready' | 'error';

interface DocumentViewerProps {
  source: NormalizedSource;
  initialExcerptIndex?: number;
  onClose: () => void;
}

export function DocumentViewer({
  source,
  initialExcerptIndex = 0,
  onClose,
}: DocumentViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<ViewMode>(source.viewUrl ? 'file' : 'text');
  const [activeIndex, setActiveIndex] = useState(initialExcerptIndex);

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<Status>('idle');
  const [fileError, setFileError] = useState<string | null>(null);

  const [content, setContent] = useState<DocumentContent | null>(null);
  const [contentStatus, setContentStatus] = useState<Status>('idle');
  const [contentError, setContentError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileUrlRef = useRef<string | null>(null);
  const markRef = useRef<HTMLElement>(null);

  const activeExcerpt = source.excerpts[activeIndex] ?? null;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(
    () => () => {
      if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);
    },
    [],
  );

  const loadFile = useCallback(async () => {
    if (!source.viewUrl) return;

    setFileStatus('loading');
    setFileError(null);
    try {
      const { blob } = await fetchDocumentFile(source.viewUrl);
      if (fileUrlRef.current) URL.revokeObjectURL(fileUrlRef.current);

      const objectUrl = URL.createObjectURL(blob);
      fileUrlRef.current = objectUrl;
      setFileUrl(objectUrl);
      setFileStatus('ready');
    } catch (error) {
      setFileError(getErrorMessage(error));
      setFileStatus('error');
    }
  }, [source.viewUrl]);

  const loadContent = useCallback(async () => {
    if (!source.contentUrl) return;

    setContentStatus('loading');
    setContentError(null);
    try {
      setContent(await fetchDocumentContent(source.contentUrl));
      setContentStatus('ready');
    } catch (error) {
      setContentError(getErrorMessage(error));
      setContentStatus('error');
    }
  }, [source.contentUrl]);

  useEffect(() => {
    if (mode === 'file' && fileStatus === 'idle') loadFile();
    if (mode === 'text' && contentStatus === 'idle') loadContent();
  }, [mode, fileStatus, contentStatus, loadFile, loadContent]);

  // Página de destino do trecho ativo. Limitada ao total de páginas conhecido —
  // limitar é diferente de estimar: nenhuma página é criada aqui.
  const targetPage = useMemo(() => {
    const page = activeExcerpt?.location?.page_start;
    if (page === null || page === undefined) return null;
    const clamped = Math.max(1, page);
    return source.totalPages ? Math.min(clamped, source.totalPages) : clamped;
  }, [activeExcerpt, source.totalPages]);

  const contentRange = useMemo(
    () => (content ? resolveContentRange(activeExcerpt?.location, content) : null),
    [content, activeExcerpt],
  );

  const textParts = useMemo(() => {
    if (!content) return null;
    if (!contentRange) return { before: content.content, marked: '', after: '' };

    return {
      before: content.content.slice(0, contentRange.start),
      marked: content.content.slice(contentRange.start, contentRange.end),
      after: content.content.slice(contentRange.end),
    };
  }, [content, contentRange]);

  useEffect(() => {
    if (mode === 'text' && markRef.current) {
      markRef.current.scrollIntoView({ block: 'center' });
    }
  }, [mode, textParts]);

  const handleDownload = async () => {
    if (!source.downloadUrl) return;

    setIsDownloading(true);
    try {
      await downloadDocumentFile(
        source.downloadUrl,
        source.file?.name ?? `${source.title}.pdf`,
      );
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyExcerpt = async () => {
    if (!activeExcerpt) return;

    try {
      await navigator.clipboard.writeText(activeExcerpt.excerpt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar o trecho.');
    }
  };

  const metaLine = [
    source.documentType,
    source.totalPages ? `${source.totalPages} páginas` : null,
    source.file?.name,
    formatFileSize(source.file?.size),
  ]
    .filter(Boolean)
    .join(' · ');

  const locationHint = (() => {
    if (!activeExcerpt) return 'Documento aberto no início';
    if (!activeExcerpt.location) return 'Trecho sem localização registrada';

    if (mode === 'file') {
      if (!targetPage) return 'Sem página registrada para este trecho';
      const label = formatPageLabel(targetPage, activeExcerpt.location.page_end);
      return activeExcerpt.location.precision === 'TRECHO'
        ? `Aberto em ${label}`
        : `Aberto em ${label} (dispositivo inteiro)`;
    }

    if (!contentRange) return 'Trecho não localizável neste texto';
    return contentRange.exact
      ? 'Trecho exato destacado'
      : 'Região da página destacada (localização aproximada)';
  })();

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Documento fonte: ${source.title}`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />

      <div className="relative flex w-full max-w-6xl h-[88vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Cabeçalho: identificação do documento + download */}
        <div className="flex items-start gap-3 border-b border-gray-200 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileText size={18} className="text-primary" />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              className="truncate text-base font-semibold text-text-dark"
              title={source.title}
            >
              {source.title}
            </h2>
            {metaLine && (
              <p className="mt-0.5 truncate text-xs text-text-light">{metaLine}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={!source.downloadUrl || isDownloading}
              title={
                source.downloadUrl
                  ? 'Baixar o documento original'
                  : 'Arquivo original indisponível para este documento'
              }
              className="flex items-center gap-2 rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-dark transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDownloading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              Baixar
            </button>

            <button
              onClick={onClose}
              title="Fechar"
              aria-label="Fechar"
              className="rounded-lg p-2 text-text-light transition-colors hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Trechos que fundamentaram a resposta neste documento */}
          {source.excerpts.length > 0 && (
            <aside className="scrollbar-discreta hidden w-72 shrink-0 overflow-y-auto border-r border-gray-200 bg-gray-50/50 md:block">
              <p className="px-4 pt-4 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Trechos utilizados ({source.excerpts.length})
              </p>

              <div className="space-y-1 px-2 pb-4">
                {source.excerpts.map((excerpt, index) => {
                  const pageLabel = formatPageLabel(
                    excerpt.location?.page_start,
                    excerpt.location?.page_end,
                  );

                  return (
                    <button
                      key={`${excerpt.parent_chunk_id ?? 'trecho'}-${index}`}
                      onClick={() => setActiveIndex(index)}
                      className={cn(
                        'w-full rounded-lg border p-3 text-left transition-colors',
                        index === activeIndex
                          ? 'border-primary/40 bg-white shadow-sm'
                          : 'border-transparent hover:border-gray-200 hover:bg-white',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-text-dark">
                          {excerpt.citation || `Trecho ${index + 1}`}
                        </span>
                        {excerpt.role === 'COMPLEMENTAR' && (
                          <span className="shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-600">
                            apoio
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-text-light">
                        {excerpt.excerpt}
                      </p>

                      <span className="mt-1.5 block text-[10px] text-gray-400">
                        {pageLabel ?? 'sem localização'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>
          )}

          <div className="flex min-w-0 flex-1 flex-col">
            {/* Modos de visualização + situação da localização */}
            <div className="flex flex-wrap items-center gap-1 border-b border-gray-100 bg-gray-50/60 px-4 py-2">
              <ModeTab
                isActive={mode === 'file'}
                isDisabled={!source.viewUrl}
                onClick={() => setMode('file')}
                title={
                  source.viewUrl
                    ? undefined
                    : 'Este documento não tem arquivo original preservado'
                }
              >
                PDF original
              </ModeTab>
              <ModeTab
                isActive={mode === 'text'}
                isDisabled={!source.contentUrl}
                onClick={() => setMode('text')}
              >
                Texto indexado
              </ModeTab>

              <span className="ml-auto pl-3 text-[11px] text-text-light">
                {locationHint}
              </span>
            </div>

            {/* No PDF não há como marcar o trecho: ele fica pronto para copiar */}
            {mode === 'file' && activeExcerpt && (
              <div className="border-b border-gray-100 px-4 py-3">
                <div className="flex items-start gap-3">
                  <p className="line-clamp-2 flex-1 text-[11px] italic leading-relaxed text-gray-600">
                    “{activeExcerpt.excerpt}”
                  </p>
                  <button
                    onClick={handleCopyExcerpt}
                    title="Copiar o trecho para procurar no documento (Ctrl+F)"
                    className="flex shrink-0 items-center gap-1.5 rounded-md border border-border-light px-2 py-1 text-[11px] font-medium text-text-dark transition-colors hover:bg-gray-50"
                  >
                    {copied ? (
                      <Check size={12} className="text-primary" />
                    ) : (
                      <Copy size={12} />
                    )}
                    {copied ? 'Copiado' : 'Copiar trecho'}
                  </button>
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 bg-gray-100">
              {mode === 'file' ? (
                <FilePane
                  url={source.viewUrl}
                  fileUrl={fileUrl}
                  status={fileStatus}
                  error={fileError}
                  page={targetPage}
                  onRetry={loadFile}
                  onFallback={source.contentUrl ? () => setMode('text') : undefined}
                />
              ) : (
                <TextPane
                  url={source.contentUrl}
                  status={contentStatus}
                  error={contentError}
                  content={content}
                  parts={textParts}
                  isExact={contentRange?.exact ?? false}
                  markRef={markRef}
                  onRetry={loadContent}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ModeTab({
  isActive,
  isDisabled,
  onClick,
  title,
  children,
}: {
  isActive: boolean;
  isDisabled?: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={cn(
        'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
        isActive
          ? 'bg-white text-text-dark shadow-sm ring-1 ring-gray-200'
          : 'text-text-light hover:bg-white/70',
        isDisabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
      )}
    >
      {children}
    </button>
  );
}

function PaneMessage({
  icon,
  title,
  description,
  actions,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      {icon}
      <p className="text-sm font-medium text-text-dark">{title}</p>
      {description && (
        <p className="max-w-md text-xs leading-relaxed text-text-light">{description}</p>
      )}
      {actions && <div className="mt-1 flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function RetryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border-light bg-white px-3 py-1.5 text-xs font-medium text-text-dark transition-colors hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

function FilePane({
  url,
  fileUrl,
  status,
  error,
  page,
  onRetry,
  onFallback,
}: {
  url: string | null;
  fileUrl: string | null;
  status: Status;
  error: string | null;
  page: number | null;
  onRetry: () => void;
  onFallback?: () => void;
}) {
  if (!url) {
    return (
      <PaneMessage
        icon={<FileText size={28} className="text-gray-400" />}
        title="Arquivo original indisponível"
        description="Este documento foi indexado antes da preservação do arquivo. O texto continua disponível na aba “Texto indexado”."
        actions={onFallback && <RetryButton onClick={onFallback}>Ver texto indexado</RetryButton>}
      />
    );
  }

  if (status === 'error') {
    return (
      <PaneMessage
        icon={<AlertCircle size={28} className="text-red-500" />}
        title="Não foi possível abrir o documento"
        description={error}
        actions={
          <>
            <RetryButton onClick={onRetry}>Tentar novamente</RetryButton>
            {onFallback && (
              <RetryButton onClick={onFallback}>Ver texto indexado</RetryButton>
            )}
          </>
        }
      />
    );
  }

  if (status !== 'ready' || !fileUrl) {
    return (
      <PaneMessage
        icon={<Loader2 size={28} className="animate-spin text-primary" />}
        title="Carregando documento…"
      />
    );
  }

  // A âncora `#page=` é lida pelo visualizador nativo do browser; a chave força
  // a remontagem para que trocar de trecho realmente reposicione o documento.
  const src = page ? `${fileUrl}#page=${page}` : fileUrl;

  return <iframe key={src} src={src} title="Documento original" className="h-full w-full" />;
}

function TextPane({
  url,
  status,
  error,
  content,
  parts,
  isExact,
  markRef,
  onRetry,
}: {
  url: string | null;
  status: Status;
  error: string | null;
  content: DocumentContent | null;
  parts: { before: string; marked: string; after: string } | null;
  isExact: boolean;
  markRef: React.RefObject<HTMLElement | null>;
  onRetry: () => void;
}) {
  if (!url) {
    return (
      <PaneMessage
        icon={<FileText size={28} className="text-gray-400" />}
        title="Texto indexado indisponível"
        description="Esta fonte não identifica o documento no acervo, então não há texto a consultar."
      />
    );
  }

  if (status === 'error') {
    return (
      <PaneMessage
        icon={<AlertCircle size={28} className="text-red-500" />}
        title="Não foi possível carregar o texto"
        description={error}
        actions={<RetryButton onClick={onRetry}>Tentar novamente</RetryButton>}
      />
    );
  }

  if (status !== 'ready' || !content || !parts) {
    return (
      <PaneMessage
        icon={<Loader2 size={28} className="animate-spin text-primary" />}
        title="Carregando texto…"
      />
    );
  }

  if (!content.content) {
    return (
      <PaneMessage
        icon={<FileText size={28} className="text-gray-400" />}
        title="Documento sem texto extraído"
      />
    );
  }

  return (
    <div className="scrollbar-discreta h-full overflow-y-auto bg-white">
      {!content.aligned_with_offsets && (
        <p className="border-b border-amber-100 bg-amber-50 px-6 py-2 text-[11px] text-amber-800">
          Este documento foi indexado antes do registro de posições: o texto abaixo é o
          extraído na época e as posições dos trechos não se aplicam a ele.
        </p>
      )}

      <pre className="whitespace-pre-wrap break-words p-6 font-sans text-sm leading-relaxed text-text-dark">
        {parts.before}
        {parts.marked && (
          <mark
            ref={markRef}
            className={cn(
              'rounded px-0.5',
              isExact ? 'bg-primary/25 text-text-dark' : 'bg-yellow-100 text-text-dark',
            )}
          >
            {parts.marked}
          </mark>
        )}
        {parts.after}
      </pre>
    </div>
  );
}
