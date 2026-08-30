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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/** Prefixo de caminho embutido na baseURL do axios (normalmente "/api"). */
function apiBasePath(): string {
  try {
    return new URL(API_URL, 'http://localhost').pathname.replace(/\/+$/, '');
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
 * Nome do arquivo anunciado pelo backend. Só é legível quando o servidor expõe
 * `Content-Disposition` via CORS; caso contrário quem chama usa `file.name`.
 */
function fileNameFromDisposition(header?: string): string | null {
  if (!header) return null;

  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (encoded) {
    try {
      return decodeURIComponent(encoded[1]);
    } catch {
      // cabeçalho malformado: cai para a forma simples
    }
  }

  const plain = /filename="([^"]+)"/i.exec(header) ?? /filename=([^;]+)/i.exec(header);
  return plain ? plain[1].trim() : null;
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
  fileName: string | null;
}

/** Baixa o arquivo original para memória (visualização ou download). */
export async function fetchDocumentFile(url: string): Promise<FetchedFile> {
  try {
    const response = await api.get(toApiPath(url), { responseType: 'blob' });
    const data = response.data as unknown;

    return {
      // O adaptador do browser já entrega um Blob; a normalização mantém a
      // promessa desta função verdadeira em qualquer outro ambiente.
      blob: isBlob(data)
        ? data
        : new Blob([data as BlobPart], {
            type: (response.headers?.['content-type'] as string) || 'application/pdf',
          }),
      fileName: fileNameFromDisposition(
        response.headers?.['content-disposition'] as string | undefined,
      ),
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
 * backend. `fallbackName` é usado quando `Content-Disposition` não está
 * acessível ao JavaScript (o caso comum em CORS).
 */
export async function downloadDocumentFile(
  url: string,
  fallbackName: string,
): Promise<void> {
  const { blob, fileName } = await fetchDocumentFile(url);
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName || fallbackName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // A revogação imediata cancelaria o download em alguns browsers.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}
