'use client';

/**
 * Seletor de personalidade da sidebar — o nível mais geral da escolha:
 * a preferência do usuário, que vale para toda conversa que não fixe outra.
 *
 * As opções vêm do catálogo do backend, nunca de uma lista escrita aqui.
 * Cada uma aparece com o personagem que a representa: é o que deixa a
 * diferença visível de relance, sem ocupar a sidebar com texto.
 */

import { useState } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { usePersonas } from '@/contexts/PersonaContext';
import { GefiAvatar } from '@/components/GefiAvatar';
import { cn } from '@/lib/utils';

export function PersonaPreference() {
  const { personas, preference, isLoading, setPreference } = usePersonas();
  const [savingId, setSavingId] = useState<string | null>(null);

  // Sem catálogo (backend antigo ou falha ao carregar) o bloco some — o chat
  // continua funcionando com a personalidade padrão do servidor.
  if (isLoading || personas.length === 0) return null;

  const escolher = async (personaId: string) => {
    if (personaId === preference || savingId) return;

    setSavingId(personaId);
    try {
      await setPreference(personaId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="mb-4 rounded-lg bg-white/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 px-1">
        <Sparkles size={11} className="text-primary" />
        <p className="text-[10px] uppercase tracking-wide text-white/50">
          Estilo das respostas
        </p>
      </div>

      <div className="space-y-1">
        {personas.map((persona) => {
          const ativa = persona.id === preference;

          return (
            <button
              key={persona.id}
              onClick={() => escolher(persona.id)}
              disabled={savingId !== null}
              title={persona.description}
              aria-pressed={ativa}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors disabled:opacity-60',
                ativa ? 'bg-primary/15 text-white' : 'text-white/70 hover:bg-white/10',
              )}
            >
              <span
                className={cn(
                  'h-10 w-10 shrink-0 overflow-hidden rounded-full transition-opacity',
                  !ativa && 'opacity-60',
                )}
              >
                <GefiAvatar size={40} persona={persona.id} title={persona.label} />
              </span>

              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                {persona.label}
              </span>

              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                {savingId === persona.id ? (
                  <Loader2 size={11} className="animate-spin text-primary" />
                ) : ativa ? (
                  <Check size={12} className="text-primary" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
