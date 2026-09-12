/**
 * GeFi Docs - Type Definitions
 * Definições de tipos para toda a aplicação
 */

// ============ Auth Types ============

export type UserType = 'FISCAL' | 'ADMINISTRADOR';

export interface User {
  id: string;
  email: string;
  /** Nulos ate o primeiro acesso: o convite so define e-mail e cargo. */
  full_name: string | null;
  siap_registration: string | null;
  user_type: UserType;
  /** Falso => a pessoa ainda precisa passar por /complete-profile. */
  profile_completed: boolean;
  picture_url: string | null;
  revoked_at?: string | null;
  last_login_at?: string | null;
  created_at?: string;
}

/**
 * Resposta de /auth/google, /auth/me e /users/me.
 *
 * NAO tem campo `token`: a sessao vive num cookie httpOnly que o JavaScript
 * nao consegue ler. Se algum dia o backend voltar a devolver o token no corpo,
 * e sinal de regressao -- era assim que ele acabava no localStorage.
 */
export interface AuthResponse {
  user: User;
}

export interface GoogleLoginPayload {
  /** ID token devolvido pelo Google Identity Services. */
  credential: string;
}

export interface CompleteProfilePayload {
  full_name: string;
  siap_registration: string;
}

export interface InviteUserPayload {
  email: string;
  user_type: UserType;
}

export interface PaginatedUsers {
  data: User[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** Autenticado, porem ainda sem nome/matricula preenchidos. */
  needsProfile: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithGoogle: (credential: string) => Promise<User>;
  completeProfile: (data: CompleteProfilePayload) => Promise<void>;
  logout: () => Promise<void>;
}

// ============ Chat Types ============
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  is_pinned?: boolean;
}

export interface ChatMessage {
  id: string;
  user_query: string;
  ai_response: string;
  created_at: string;
  sources?: RawSource[];
}

export interface ChatResponse {
  response: string;
  sources?: RawSource[];
}

// ============ Source Types (fontes navegáveis) ============

export type SourceRole = 'PRINCIPAL' | 'COMPLEMENTAR';

/**
 * TRECHO: intervalo dos chunks que a busca de fato recuperou.
 * DISPOSITIVO: intervalo do dispositivo inteiro (item/artigo) que os contém.
 */
export type LocationPrecision = 'TRECHO' | 'DISPOSITIVO';

export interface SourceLocation {
  /** Página do PDF (1-based); null quando a extração não preservou páginas. */
  page_start: number | null;
  page_end: number | null;
  /** Offsets no texto indexado devolvido por `GET /documents/:id/content`. */
  char_start: number | null;
  char_end: number | null;
  precision: LocationPrecision;
}

export interface SourceExcerpt {
  parent_chunk_id: string | null;
  citation: string;
  section_header: string | null;
  n1_header: string | null;
  n2_header: string | null;
  role: SourceRole;
  /** Texto exato enviado ao modelo. */
  excerpt: string;
  location: SourceLocation | null;
}

export interface SourceDocumentFile {
  available: boolean;
  name: string | null;
  mime_type: string | null;
  size: number | null;
}

export interface ResponseSource {
  id: string;
  title: string;
  document_type?: string | null;
  total_pages?: number | null;
  file?: SourceDocumentFile | null;
  view_url?: string | null;
  download_url?: string | null;
  content_url?: string | null;
  excerpts?: SourceExcerpt[] | null;
}

/**
 * Fonte como ela chega da API. Respostas e históricos anteriores às fontes
 * navegáveis trazem apenas o título ou `{ id, title }`; a normalização em
 * `lib/sources.ts` aceita as três formas.
 */
export type RawSource = string | { id?: string; title?: string } | ResponseSource;

export interface DocumentPageMapEntry {
  page_start: number;
  page_end: number;
  start: number;
  end: number;
}

/** Resposta de `GET /documents/:id/content`. */
export interface DocumentContent {
  id: string;
  title: string;
  document_type: string | null;
  content: string;
  /** Falso quando o texto devolvido não é o mesmo em que os offsets foram medidos. */
  aligned_with_offsets: boolean;
  total_pages: number | null;
  page_map: DocumentPageMapEntry[];
  view_url: string | null;
  download_url: string | null;
  content_url: string;
}

export interface CreateConversationPayload {
  title: string;
}

export interface AskPayload {
  conversation_id: string;
  query: string;
}

// ============ Document Types ============

export enum DocumentType {
  NORMATIVO = 'Normativo',
  REGULAMENTO = 'Regulamento',
  RESOLUCAO = 'Resolução',
  INSTRUCAO = 'Instrução',
  OUTRO = 'Outro',
}

export interface Document {
  id: string;
  title: string;
  document_type: DocumentType;
  created_at: string;
}

export interface DocumentUploadPayload {
  title: string;
  document_type: string;
  file: File;
}

export interface DocumentUploadResponse {
  id: string;
  title: string;
  document_type: string;
  created_at: string;
}

export interface PaginatedDocuments {
  data: Document[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============ API Error Types ============
export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

// ============ UI State Types ============
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}
