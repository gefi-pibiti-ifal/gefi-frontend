'use client';

/**
 * Mensagens de espera enquanto o GeFi gera a resposta.
 *
 * Uma frase fixa por muitos segundos passa a impressão de travamento. A
 * sequência abaixo acompanha, na ordem, as etapas que o pipeline realmente
 * executa — recuperar os trechos, ler o que foi recuperado, redigir — então
 * ela informa em vez de só entreter.
 *
 * A última frase NÃO rotaciona de volta: quando a geração passa do tempo
 * esperado, ficar anunciando etapas novas indefinidamente seria enganoso.
 */

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { GefiAvatar } from '@/components/GefiAvatar';

const ETAPAS = [
  'Pensando...',
  'Procurando nos documentos...',
  'Lendo os trechos encontrados...',
  'Formulando a resposta...',
  'Conferindo a fundamentação...',
  'Quase lá!! Respostas longas levam mais tempo...',
] as const;

const INTERVALO_MS = 10000;

interface ThinkingIndicatorProps {
  /** Personalidade que vai gerar a resposta — define o personagem exibido. */
  persona?: string | null;
}

export function ThinkingIndicator({ persona }: ThinkingIndicatorProps) {
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    if (passo >= ETAPAS.length - 1) return; // segura na última

    const id = setTimeout(() => setPasso((p) => p + 1), INTERVALO_MS);
    return () => clearTimeout(id);
  }, [passo]);

  return (
    <div className="mb-10 flex w-full max-w-4xl justify-start px-4 mx-auto mt-2">
      <div className="flex gap-4">
        <div className="mt-1 h-14 w-14 shrink-0 overflow-hidden rounded-full shadow-sm">
          <GefiAvatar size={56} persona={persona} title="GeFi" />
        </div>

        <div
          className="flex items-center gap-3 rounded-2xl rounded-tl-sm border border-gray-100 bg-gray-50 p-4"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span key={passo} className="animate-in fade-in text-sm font-medium text-text-dark duration-300">
            {ETAPAS[passo]}
          </span>
        </div>
      </div>
    </div>
  );
}
