'use client';

/**
 * GeFi Docs - Auth Context
 * Gerenciamento centralizado de autenticação
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { getErrorMessage } from '@/lib/api';
import { AuthContextType, AuthResponse, LoginPayload, RegisterPayload, User } from '@/types';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados de autenticação do localStorage ao montar
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Erro ao carregar dados de autenticação:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const payload: LoginPayload = { email, password };
      const response = await api.post<AuthResponse>('/auth/login', payload);

      const { token: newToken, user: newUser } = response.data;

      // Armazenar no localStorage
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Atualizar estado
      setToken(newToken);
      setUser(newUser);

      toast.success('Login realizado com sucesso!');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterPayload) => {
    try {
      setIsLoading(true);
      const response = await api.post<AuthResponse>('/auth/register', data);

      const { token: newToken, user: newUser } = response.data;

      // Armazenar no localStorage
      localStorage.setItem('auth_token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Atualizar estado
      setToken(newToken);
      setUser(newUser);

      toast.success('Cadastro realizado com sucesso!');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logout realizado com sucesso!');
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
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
