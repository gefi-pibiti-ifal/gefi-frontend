'use client';

/**
 * Seletor de personalidade do cabeçalho da conversa — o nível intermediário:
 * fixa o registro desta conversa inteira, acima da preferência do usuário.
 *
 * `persona: null` na conversa NÃO é uma terceira personalidade: significa
 * "seguindo a sua preferência". A interface mostra isso com essas palavras, e
 * a opção que a restaura chama-se "Seguir minha preferência" — apresentá-la
 * como mais uma opção ao lado das outras faria o usuário achar que existe um
 * terceiro tom.
 */

import { useState } from 'react';
import { Check, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { toast } from 'sonner';
import { usePersonas } from '@/contexts/PersonaContext';
import { findPersona, setConversationPersona } from '@/lib/personas';
import { getErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ConversationPersonaProps {
  conversationId: string;
  /** Personalidade fixada na conversa; null = segue a preferência do usuário. */
  value: string | null;
  onChange: (persona: string | null) => void;
}

export function ConversationPersona({
  conversationId,
  value,
  onChange,
}: ConversationPersonaProps) {
  const { personas, preference, isLoading } = usePersonas();
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading || personas.length === 0) return null;

  const fixada = findPersona(personas, value);
  const herdada = findPersona(personas, preference);

  // O que o usuário vê é sempre a personalidade que vai gerar a resposta; o
  // rótulo só distingue se ela foi fixada aqui ou herdada da preferência.
  const efetiva = fixada ?? herdada ?? personas.find((p) => p.is_default) ?? personas[0];

  const aplicar = async (persona: string | null) => {
    if (persona === value || isSaving) return;

    const anterior = value;
    onChange(persona); // otimista: o cabeçalho responde na hora
    setIsSaving(true);
    try {
      await setConversationPersona(conversationId, persona);
    } catch (error) {
      onChange(anterior);
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-text-dark transition-colors hover:bg-gray-50"
          title={efetiva?.description}
        >
          {isSaving ? (
            <Loader2 size={12} className="animate-spin text-primary" />
          ) : (
            <Sparkles size={12} className="text-primary" />
          )}
          <span className="max-w-[10rem] truncate">{efetiva?.label}</span>
          {!fixada && <span className="text-text-light">(preferência)</span>}
          <ChevronDown size={11} className="text-text-light" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-72 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Estilo desta conversa
          </p>

          {personas.map((persona) => (
            <DropdownMenu.Item
              key={persona.id}
              onSelect={() => aplicar(persona.id)}
              className={cn(
                'cursor-pointer rounded-lg px-2.5 py-2 outline-none transition-colors hover:bg-gray-50',
                persona.id === value && 'bg-primary/5',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                  {persona.id === value && <Check size={12} className="text-primary" />}
                </span>
                <span className="text-xs font-medium text-text-dark">{persona.label}</span>
              </div>
              {persona.description && (
                <p className="mt-0.5 pl-5.5 text-[10px] leading-relaxed text-text-light">
                  {persona.description}
                </p>
              )}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />

          <DropdownMenu.Item
            onSelect={() => aplicar(null)}
            className={cn(
              'cursor-pointer rounded-lg px-2.5 py-2 outline-none transition-colors hover:bg-gray-50',
              value === null && 'bg-primary/5',
            )}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                {value === null && <Check size={12} className="text-primary" />}
              </span>
              <span className="text-xs font-medium text-text-dark">
                Seguir minha preferência
              </span>
            </div>
            <p className="mt-0.5 pl-5.5 text-[10px] leading-relaxed text-text-light">
              Usa {herdada?.label ?? 'o padrão'}, e acompanha se você mudar nas configurações.
            </p>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
