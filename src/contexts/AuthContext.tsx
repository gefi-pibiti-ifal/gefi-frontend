'use client';

/**
 * GeFi Docs - Auth Context
 *
 * A sessão vive num cookie httpOnly emitido pelo backend. Isso muda o modelo
 * em relação à versão anterior: o cliente NÃO guarda nem enxerga o token, e
 * portanto não consegue mais reconstruir o estado de autenticação sozinho a
 * partir do `localStorage`. Quem responde "quem está logado?" é `GET /auth/me`,
 * consultado uma vez na montagem da aplicação.
 *
 * O ganho é que um script injetado na página não tem como ler a sessão --
 * relevante porque a CSP precisa de `'unsafe-inline'` para o Next.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { AuthContextType, AuthResponse, CompleteProfilePayload, User } from '@/types';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hidratação inicial. Um 401 aqui é o caso normal de quem não está logado --
  // não é erro e não deve virar toast.
  useEffect(() => {
    let ativo = true;

    (async () => {
      try {
        const { data } = await api.get<AuthResponse>('/auth/me');
        if (ativo) setUser(data.user);
      } catch {
        if (ativo) setUser(null);
      } finally {
        if (ativo) setIsLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, []);

  const loginWithGoogle = useCallback(async (credential: string): Promise<User> => {
    try {
      setIsLoading(true);
      // O backend responde com Set-Cookie; o corpo traz só o usuário.
      const { data } = await api.post<AuthResponse>('/auth/google', { credential });
      setUser(data.user);
      toast.success(`Bem-vindo, ${data.user.full_name ?? data.user.email}!`);
      return data.user;
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeProfile = useCallback(async (payload: CompleteProfilePayload) => {
    try {
      setIsLoading(true);
      // O backend reemite o cookie aqui: `profile_completed` faz parte do
      // token, e sem o novo cookie a pessoa voltaria para /complete-profile.
      const { data } = await api.patch<AuthResponse>('/users/me', payload);
      setUser(data.user);
      toast.success('Cadastro concluído!');
    } catch (error) {
      toast.error(getErrorMessage(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Só o servidor consegue apagar um cookie httpOnly.
      await api.post('/auth/logout');
    } catch {
      // Sessão já expirada no servidor: do ponto de vista da pessoa, saiu.
    } finally {
      setUser(null);
      toast.success('Sessão encerrada.');
    }
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    needsProfile: !!user && !user.profile_completed,
    isAdmin: user?.user_type === 'ADMINISTRADOR',
    isLoading,
    loginWithGoogle,
    completeProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
}
