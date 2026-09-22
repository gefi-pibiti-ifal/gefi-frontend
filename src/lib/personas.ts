/**
 * GeFi Docs - Personalidade das respostas
 *
 * A personalidade muda só o registro do texto; a estrutura da resposta é a
 * mesma nas duas. Por isso este módulo não interpreta nada do conteúdo: ele
 * só transporta a escolha e resolve o rótulo de um identificador.
 *
 * O catálogo vem do backend (`GET /chat/personas`) e nunca é reproduzido aqui
 * — uma personalidade nova deve aparecer na tela sem alteração no frontend.
 */

import api from './api';
import { Persona, UserProfile } from '@/types';

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/** Aceita apenas itens utilizáveis: sem id não há o que selecionar. */
function normalizePersona(value: unknown): Persona | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;

  const id = asString(raw.id);
  if (!id) return null;

  return {
    id,
    label: asString(raw.label) ?? id,
    description: asString(raw.description) ?? '',
    sample: asString(raw.sample) ?? '',
    is_default: Boolean(raw.is_default),
  };
}

export function normalizePersonas(value: unknown): Persona[] {
  const list = Array.isArray(value)
    ? value
    : Array.isArray((value as { data?: unknown })?.data)
      ? (value as { data: unknown[] }).data
      : [];

  return list.map(normalizePersona).filter((p): p is Persona => p !== null);
}

/** Catálogo que alimenta os seletores. */
export async function fetchPersonas(): Promise<Persona[]> {
  const response = await api.get('/chat/personas');
  return normalizePersonas(response.data);
}

/** Perfil do usuário: já traz a preferência atual e o catálogo, numa chamada. */
export async function fetchProfile(): Promise<UserProfile> {
  const response = await api.get<UserProfile>('/users/me');
  return response.data;
}

export async function updatePersonaPreference(personaId: string): Promise<void> {
  await api.patch('/users/me/preferences', { response_persona: personaId });
}

/** `null` solta a conversa e a devolve ao comando da preferência do usuário. */
export async function setConversationPersona(
  conversationId: string,
  persona: string | null,
): Promise<void> {
  await api.patch(`/chat/conversations/${conversationId}/persona`, { persona });
}

/**
 * Rótulo de um identificador. Uma resposta antiga pode citar uma personalidade
 * que saiu do catálogo — nesse caso o próprio id é mostrado, em vez de a
 * informação sumir da mensagem.
 */
export function personaLabel(personas: Persona[], id: string | null | undefined): string | null {
  const value = asString(id);
  if (!value) return null;
  return personas.find((p) => p.id === value)?.label ?? value;
}

export function findPersona(personas: Persona[], id: string | null | undefined): Persona | null {
  const value = asString(id);
  if (!value) return null;
  return personas.find((p) => p.id === value) ?? null;
}
