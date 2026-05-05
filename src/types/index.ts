/**
 * GeFi Docs - Type Definitions
 * Definições de tipos para toda a aplicação
 */

// ============ Auth Types ============
export interface User {
  id: string;
  full_name: string;
  email: string;
  user_type: 'fiscal' | 'admin' | 'viewer';
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
  user_type: 'FISCAL' | 'ADMIN' | 'VIEWER' | 'fiscal' | 'admin' | 'viewer';
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
}

export interface ChatMessage {
  id: string;
  user_query: string;
  ai_response: string;
  created_at: string;
  sources?: Array<{ title: string; url: string }>;
}

export interface ChatResponse {
  response: string;
  sources?: string[];
}

export interface CreateConversationPayload {
  title: string;
}

export interface AskPayload {
  conversation_id: string;
  query: string;
}

// ============ Document Types ============
export interface Document {
  id: string;
  title: string;
  document_type: string;
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
