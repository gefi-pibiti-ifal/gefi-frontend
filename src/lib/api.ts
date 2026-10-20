/**
 * GeFi Docs - API Configuration
 * Configuração do Axios com interceptadores para autenticação
 */

import axios, { AxiosError, AxiosInstance } from 'axios';

// Fallback usado só quando NEXT_PUBLIC_API_URL não é definida no build.
// 3200, e não 3000: a 3000 do host é deste próprio frontend em `pnpm dev` --
// apontar para ela faria a app chamar a si mesma e receber 404 em vez da API.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  /**
   * A sessão é um cookie httpOnly, não um token em memória: sem isto o axios
   * não o envia e toda requisição autenticada responde 401.
   *
   * Não existe mais interceptor de request montando `Authorization`. O token
   * é inacessível ao JavaScript de propósito — é justamente o que impede que
   * um script injetado na página roube a sessão.
   */
  withCredentials: true,
});

// Interceptor: tratar sessão expirada ou revogada (401)
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Nada a limpar no cliente: quem invalida o cookie é o servidor. Só não
      // redirecione quem já está no login, para não criar laço de navegação.
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/**
 * Tipos de erro customizados para melhor tratamento
 */
export interface ApiErrorResponse {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse;
    return data?.message || error.message || 'Erro ao conectar com o servidor';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido';
};
