/**
 * GeFi Docs - Normalização das fontes de uma resposta
 *
 * O backend passou a devolver, por documento citado, os trechos que
 * fundamentaram a resposta e — quando os dados sustentam — a localização de
 * cada um. Respostas e históricos anteriores trazem apenas o título ou
 * `{ id, title }`.
 *
 * Tudo converge aqui para uma forma única, de modo que a interface nunca
 * precise checar qual geração de fonte está renderizando. A regra que o
 * backend estabelece vale igualmente na UI: ausência de localização não
 * invalida a fonte, e nenhuma página ou posição é estimada.
 */

import {
  DocumentPageMapEntry,
  RawSource,
  ResponseSource,
  SourceDocumentFile,
  SourceExcerpt,
  SourceLocation,
} from '@/types';
import { documentContentPath, documentFilePath, repairFileName } from './documents';

export interface NormalizedSource {
  /** null para fontes antigas que guardaram só o título: não são navegáveis. */
  id: string | null;
  title: string;
  documentType: string | null;
  totalPages: number | null;
  file: SourceDocumentFile | null;
  viewUrl: string | null;
  downloadUrl: string | null;
  contentUrl: string | null;
  excerpts: SourceExcerpt[];
  /** Faixa de páginas que os trechos cobrem, quando alguma é conhecida. */
  pageSpan: { start: number; end: number } | null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function normalizeLocation(value: unknown): SourceLocation | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const pageStart = asNumber(raw.page_start);
  const charStart = asNumber(raw.char_start);
  const charEnd = asNumber(raw.char_end);
  const hasChars = charStart !== null && charEnd !== null && charEnd > charStart;

  // Sem página e sem intervalo válido não há o que localizar.
  if (pageStart === null && !hasChars) return null;

  return {
    page_start: pageStart,
    page_end: asNumber(raw.page_end) ?? pageStart,
    char_start: hasChars ? charStart : null,
    char_end: hasChars ? charEnd : null,
    precision: raw.precision === 'TRECHO' ? 'TRECHO' : 'DISPOSITIVO',
  };
}

function normalizeExcerpt(value: unknown): SourceExcerpt | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const text = asString(raw.excerpt);
  if (!text) return null;

  return {
    parent_chunk_id: asString(raw.parent_chunk_id),
    citation: asString(raw.citation) ?? '',
    section_header: asString(raw.section_header),
    n1_header: asString(raw.n1_header),
    n2_header: asString(raw.n2_header),
    role: raw.role === 'COMPLEMENTAR' ? 'COMPLEMENTAR' : 'PRINCIPAL',
    excerpt: text,
    location: normalizeLocation(raw.location),
  };
}

function normalizeFile(value: unknown): SourceDocumentFile | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const name = asString(raw.name);

  return {
    available: Boolean(raw.available),
    // Os nomes gravados no upload têm os acentos corrompidos; recuperá-los aqui
    // faz a interface exibir e o download salvar o mesmo nome correto.
    name: name ? repairFileName(name) : null,
    mime_type: asString(raw.mime_type),
    size: asNumber(raw.size),
  };
}

function mergePageSpan(excerpts: SourceExcerpt[]): { start: number; end: number } | null {
  let start = Infinity;
  let end = -Infinity;

  for (const excerpt of excerpts) {
    const page = excerpt.location?.page_start;
    if (page === null || page === undefined) continue;
    start = Math.min(start, page);
    end = Math.max(end, excerpt.location?.page_end ?? page);
  }

  return Number.isFinite(start) ? { start, end } : null;
}

function normalizeSource(raw: RawSource): NormalizedSource | null {
  if (typeof raw === 'string') {
    // Formato mais antigo: apenas o título do documento.
    return raw.trim()
      ? {
          id: null,
          title: raw,
          documentType: null,
          totalPages: null,
          file: null,
          viewUrl: null,
          downloadUrl: null,
          contentUrl: null,
          excerpts: [],
          pageSpan: null,
        }
      : null;
  }

  if (!raw || typeof raw !== 'object') return null;

  const source = raw as ResponseSource & Record<string, unknown>;
  const id = asString(source.id);
  const title = asString(source.title);
  if (!id && !title) return null;

  const file = normalizeFile(source.file);
  const excerpts = Array.isArray(source.excerpts)
    ? source.excerpts.map(normalizeExcerpt).filter((e): e is SourceExcerpt => e !== null)
    : [];

  // Fontes antigas não trazem as URLs novas. As rotas existem para qualquer
  // documento, então derivamos o caminho a partir do id — exceto quando o
  // backend declarou que não há arquivo preservado.
  const hasFile = file ? file.available : true;
  const viewUrl = asString(source.view_url) ?? (id && hasFile ? documentFilePath(id) : null);
  const downloadUrl =
    asString(source.download_url) ?? (id && hasFile ? documentFilePath(id, true) : null);
  const contentUrl = asString(source.content_url) ?? (id ? documentContentPath(id) : null);

  return {
    id,
    title: title ?? 'Documento sem título',
    documentType: asString(source.document_type),
    totalPages: asNumber(source.total_pages),
    file,
    viewUrl,
    downloadUrl,
    contentUrl,
    excerpts,
    pageSpan: mergePageSpan(excerpts),
  };
}

export function normalizeSources(raw: unknown): NormalizedSource[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => normalizeSource(item as RawSource))
    .filter((source): source is NormalizedSource => source !== null);
}

/** Uma fonte só abre se houver arquivo original ou texto indexado a mostrar. */
export function isNavigable(source: NormalizedSource): boolean {
  return Boolean(source.viewUrl || source.contentUrl);
}

// ---------------------------------------------------------------------------
// Rótulos
// ---------------------------------------------------------------------------

export function formatPageLabel(
  start: number | null | undefined,
  end?: number | null,
): string | null {
  if (start === null || start === undefined) return null;
  return end && end > start ? `p. ${start}–${end}` : `p. ${start}`;
}

export function formatExcerptCount(count: number): string {
  return count === 1 ? '1 trecho' : `${count} trechos`;
}

export function formatFileSize(bytes: number | null | undefined): string | null {
  if (bytes === null || bytes === undefined || bytes <= 0) return null;

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const decimals = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(decimals).replace('.', ',')} ${units[unit]}`;
}

/** Linha de apoio da fonte na lista: tipo, páginas e quantidade de trechos. */
export function describeSource(source: NormalizedSource): string {
  const parts: string[] = [];

  if (source.documentType) parts.push(source.documentType);

  const pages = source.pageSpan && formatPageLabel(source.pageSpan.start, source.pageSpan.end);
  if (pages) parts.push(pages);

  if (source.excerpts.length > 0) parts.push(formatExcerptCount(source.excerpts.length));

  return parts.join(' · ');
}

/**
 * Intervalo do texto indexado a destacar para um trecho.
 *
 * Os offsets só valem no texto em que foram medidos — daí o respeito a
 * `aligned_with_offsets`. Sem eles, a faixa da página conhecida ainda leva o
 * usuário à região certa, e é sinalizada como aproximada.
 */
export function resolveContentRange(
  location: SourceLocation | null | undefined,
  content: { aligned_with_offsets: boolean; page_map: DocumentPageMapEntry[]; content: string },
): { start: number; end: number; exact: boolean } | null {
  if (!location) return null;

  const limit = content.content.length;
  const clamp = (value: number) => Math.max(0, Math.min(value, limit));

  if (
    content.aligned_with_offsets &&
    location.char_start !== null &&
    location.char_end !== null
  ) {
    const start = clamp(location.char_start);
    const end = clamp(location.char_end);
    if (end > start) return { start, end, exact: true };
  }

  const page = location.page_start;
  if (page !== null) {
    const entry = content.page_map.find((e) => page >= e.page_start && page <= e.page_end);
    if (entry) {
      const start = clamp(entry.start);
      const end = clamp(entry.end);
      if (end > start) return { start, end, exact: false };
    }
  }

  return null;
}
