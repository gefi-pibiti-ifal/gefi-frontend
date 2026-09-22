/**
 * GeFi Docs - Type Definitions
 * Definições de tipos para toda a aplicação
 */

// ============ Auth Types ============
export interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: 'FISCAL' | 'ADMINISTRADOR';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  siap_registration: string;
  user_type: 'FISCAL' | 'ADMINISTRADOR'
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
}

// ============ Chat Types ============
export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  is_pinned?: boolean;
  /** Personalidade fixada na conversa; null = segue a preferencia do usuario. */
  persona?: string | null;
}

export interface ChatMessage {
  id: string;
  user_query: string;
  ai_response: string;
  created_at: string;
  sources?: RawSource[];
  /** Personalidade que de fato gerou esta resposta (pode diferir da atual). */
  persona?: string | null;
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

// ============ Persona Types (registro das respostas) ============

/**
 * Item do catálogo de `GET /chat/personas`.
 *
 * O `id` é `string` de propósito, e não uma união fechada: o backend é a fonte
 * da verdade e uma personalidade nova deve aparecer na interface sem exigir
 * deploy do frontend.
 */
export interface Persona {
  id: string;
  label: string;
  description: string;
  /** Frase de exemplo no mesmo caso — deixa a diferença visível antes da escolha. */
  sample: string;
  is_default: boolean;
}

/** Resposta de `GET /users/me`. */
export interface UserProfile extends User {
  siap_registration?: string;
  response_persona: string;
  available_personas?: Persona[];
}

export interface CreateConversationPayload {
  title: string;
  persona?: string | null;
}

export interface AskPayload {
  conversation_id: string;
  query: string;
  persona?: string | null;
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
  /** Ausente nos documentos indexados antes da preservação do arquivo. */
  file_name?: string | null;
  file_size?: number | null;
  total_pages?: number | null;
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
