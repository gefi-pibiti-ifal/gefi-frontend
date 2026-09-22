/**
 * GeFi Docs - Acesso aos arquivos e ao texto dos documentos fonte
 *
 * As rotas de documento do backend (`/api/documents/:id/file` e
 * `/api/documents/:id/content`) exigem o JWT no cabeçalho Authorization.
 * Uma navegação direta do browser (window.open, <a href>, <iframe src>) não
 * envia esse cabeçalho e receberia 401 — por isso tudo aqui passa pelo axios,
 * que já injeta o token, e o binário é entregue à UI como object URL.
 */

import axios from 'axios';
import api from './api';
import { DocumentContent } from '@/types';

/**
 * Prefixo de caminho embutido na baseURL do axios (normalmente "/api").
 *
 * Lido da própria instância, e não de uma env: a baseURL é a única autoridade
 * sobre onde a API está montada, e derivá-la de outro lugar já criou uma
 * divergência quando o app passou a falar com o backend por proxy same-origin.
 */
function apiBasePath(): string {
  try {
    const base = api.defaults.baseURL || '';
    return new URL(base, 'http://localhost').pathname.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

/**
 * Converte uma URL vinda do backend (ex.: "/api/documents/x/file") num caminho
 * relativo à baseURL do axios, que já termina no prefixo da API. URLs absolutas
 * são preservadas.
 */
export function toApiPath(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;

  const base = apiBasePath();
  if (base && (url === base || url.startsWith(`${base}/`))) {
    return url.slice(base.length) || '/';
  }
  return url.startsWith('/') ? url : `/${url}`;
}

/** Caminhos das rotas de documento, para fontes antigas que não trazem as URLs. */
export function documentFilePath(id: string, download = false): string {
  return `/documents/${encodeURIComponent(id)}/file${download ? '?download=1' : ''}`;
}

export function documentContentPath(id: string): string {
  return `/documents/${encodeURIComponent(id)}/content`;
}

/**
 * Desfaz a corrupção de acentos herdada do upload.
 *
 * Os nomes gravados em `file_name` vieram do multipart lidos como latin1, então
 * cada byte do UTF-8 original virou um caractere próprio: "INSTRUÇÃO" está
 * guardado como "INSTRU" + U+00C3 U+0087 + U+00C3 U+0083 + "O". Reinterpretar
 * esses code points como bytes e decodificá-los como UTF-8 recupera o nome
 * exato — é a inversa da transformação, não um palpite.
 *
 * O `TextDecoder` em modo `fatal` é a trava: um nome que já esteja correto
 * ("Resolução.pdf") produz bytes que não formam UTF-8 válido, a decodificação
 * lança, e o nome original é preservado intacto.
 */
export function repairFileName(name: string): string {
  const bytes = new Uint8Array(name.length);
  for (let i = 0; i < name.length; i++) {
    const code = name.charCodeAt(i);
    if (code > 0xff) return name; // já tem caractere fora de latin1: não é mojibake
    bytes[i] = code;
  }

  try {
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return decoded === name ? name : decoded;
  } catch {
    return name;
  }
}

/**
 * Nomes anunciados no `Content-Disposition`, separados por forma.
 *
 * O backend emite as duas: `filename*` (RFC 5987, com os acentos preservados)
 * e `filename=`, que é a mesma coisa com todo caractere fora de ASCII trocado
 * por "_". A forma simples só serve como último recurso — é justamente ela que
 * transforma "Fiscalização.pdf" em "Fiscaliza__o.pdf".
 */
function fileNamesFromDisposition(header?: string): {
  encoded: string | null;
  plain: string | null;
} {
  if (!header) return { encoded: null, plain: null };

  let encoded: string | null = null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) {
    try {
      encoded = decodeURIComponent(star[1]);
    } catch {
      // cabeçalho malformado: sobra a forma simples
    }
  }

  const match = /filename="([^"]+)"/i.exec(header) ?? /filename=([^;]+)/i.exec(header);
  return { encoded, plain: match ? match[1].trim() : null };
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob;
}

/** Lê o corpo de uma resposta binária como texto, qualquer que seja sua forma. */
async function readBodyAsText(data: unknown): Promise<string | null> {
  if (typeof data === 'string') return data;
  if (isBlob(data)) return data.text();
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) return new TextDecoder().decode(data as Uint8Array);
  return null;
}

/**
 * Numa requisição binária o corpo de erro também vem binário, e a explicação
 * do backend — por exemplo, que o documento foi indexado antes da preservação
 * do arquivo — se perderia atrás de um "Request failed with status code 404".
 * Aqui ela é recuperada e devolvida ao erro, para `getErrorMessage` encontrar.
 */
async function withReadableErrorBody(error: unknown): Promise<unknown> {
  if (!axios.isAxiosError(error) || !error.response) return error;

  const data = error.response.data;
  const alreadyReadable =
    !!data && typeof data === 'object' && !isBlob(data) && 'message' in data;
  if (alreadyReadable) return error;

  const text = await readBodyAsText(data);
  if (!text) return error;

  try {
    const parsed = JSON.parse(text);
    const message = Array.isArray(parsed?.message)
      ? parsed.message.join('; ')
      : parsed?.message;
    if (typeof message === 'string' && message) {
      error.response.data = { ...parsed, message };
    }
  } catch {
    // corpo vazio ou não-JSON: o erro original já é o melhor que temos
  }

  return error;
}

export interface FetchedFile {
  blob: Blob;
  /** Nome vindo de `filename*`, com os acentos já recuperados. */
  fileName: string | null;
  /** Forma ASCII do cabeçalho ("Fiscaliza__o.pdf") — só como último recurso. */
  asciiFileName: string | null;
}

/** Baixa o arquivo original para memória (visualização ou download). */
export async function fetchDocumentFile(url: string): Promise<FetchedFile> {
  try {
    const response = await api.get(toApiPath(url), { responseType: 'blob' });
    const data = response.data as unknown;
    const names = fileNamesFromDisposition(
      response.headers?.['content-disposition'] as string | undefined,
    );

    return {
      // O adaptador do browser já entrega um Blob; a normalização mantém a
      // promessa desta função verdadeira em qualquer outro ambiente.
      blob: isBlob(data)
        ? data
        : new Blob([data as BlobPart], {
            type: (response.headers?.['content-type'] as string) || 'application/pdf',
          }),
      fileName: names.encoded ? repairFileName(names.encoded) : null,
      asciiFileName: names.plain,
    };
  } catch (error) {
    throw await withReadableErrorBody(error);
  }
}

/** Texto indexado do documento — sistema de coordenadas de char_start/char_end. */
export async function fetchDocumentContent(url: string): Promise<DocumentContent> {
  const response = await api.get<DocumentContent>(toApiPath(url));
  const data = response.data;

  return {
    ...data,
    content: typeof data?.content === 'string' ? data.content : '',
    page_map: Array.isArray(data?.page_map) ? data.page_map : [],
  };
}

/**
 * Entrega o arquivo ao usuário respeitando o nome e o tipo informados pelo
 * backend.
 *
 * A ordem de preferência importa: `filename*` preserva os acentos, o nome que
 * quem chama já conhece (`file_name` do contrato) vem logo depois, e a forma
 * ASCII do cabeçalho fica por último porque é a única que perde informação —
 * é ela que troca "ç" e "ã" por "_".
 */
export async function downloadDocumentFile(
  url: string,
  fallbackName: string,
): Promise<void> {
  const { blob, fileName, asciiFileName } = await fetchDocumentFile(url);
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download =
    fileName || repairFileName(fallbackName) || asciiFileName || 'documento.pdf';
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // A revogação imediata cancelaria o download em alguns browsers.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
