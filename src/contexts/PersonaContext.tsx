'use client';

/**
 * GeFi Docs - Persona Context
 *
 * Carrega uma única vez o catálogo de personalidades e a preferência do
 * usuário, e os compartilha com quem precisa: o seletor da sidebar, o seletor
 * da conversa e o selo de cada mensagem. Sem isto, cada um desses pontos faria
 * a sua própria chamada e eles poderiam discordar entre si na mesma tela.
 *
 * `GET /users/me` já devolve a preferência e o catálogo juntos, então o caminho
 * normal é uma requisição só.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Persona } from '@/types';
import { useAuth } from './AuthContext';
import { getErrorMessage } from '@/lib/api';
import {
  fetchPersonas,
  fetchProfile,
  normalizePersonas,
  updatePersonaPreference,
} from '@/lib/personas';

interface PersonaContextValue {
  personas: Persona[];
  /** Personalidade escolhida pelo usuário; vale quando a conversa não fixa outra. */
  preference: string | null;
  isLoading: boolean;
  /** Persiste a preferência. Devolve false quando o backend recusa. */
  setPreference: (personaId: string) => Promise<boolean>;
}

const PersonaContext = createContext<PersonaContextValue | undefined>(undefined);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [preference, setPreferenceState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const profile = await fetchProfile();
        if (!isMounted) return;

        setPreferenceState(profile.response_persona ?? null);

        const catalogo = normalizePersonas(profile.available_personas);
        // Um backend que ainda não embuta o catálogo no perfil não pode deixar
        // o seletor vazio: nesse caso ele é buscado na rota dedicada.
        setPersonas(catalogo.length > 0 ? catalogo : await fetchPersonas());
      } catch {
        // A personalidade é um refinamento: falhar em carregá-la não pode
        // atrapalhar o chat. O seletor simplesmente não aparece.
        if (isMounted) setPersonas([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const setPreference = useCallback(
    async (personaId: string) => {
      const anterior = preference;
      setPreferenceState(personaId); // resposta imediata ao clique

      try {
        await updatePersonaPreference(personaId);
        return true;
      } catch (error) {
        setPreferenceState(anterior); // desfaz: o servidor não aceitou
        throw new Error(getErrorMessage(error));
      }
    },
    [preference],
  );

  return (
    <PersonaContext.Provider value={{ personas, preference, isLoading, setPreference }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersonas() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersonas deve ser usado dentro de PersonaProvider');
  }
  return context;
}
