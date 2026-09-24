'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getErrorMessage } from '@/lib/api';
import { GoogleSignInButton } from './GoogleSignInButton';

/**
 * Não há mais campos de e-mail e senha.
 *
 * Quem prova a identidade é o Google; quem autoriza o acesso é o pré-cadastro
 * feito por um administrador. Por isso também não existe link de "cadastre-se"
 * nem de "esqueci minha senha" (este último era um `href="#"` que nunca fez
 * nada) -- não há conta para criar aqui, nem senha para recuperar.
 */
export function LoginForm() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleCredential = useCallback(
    async (credential: string) => {
      setErro(null);
      setIsLoading(true);

      try {
        const user = await loginWithGoogle(credential);
        // Perfil incompleto = convite ainda não concluído: nome e matrícula
        // faltam, e o resto do sistema depende deles.
        router.push(user.profile_completed ? '/dashboard' : '/complete-profile');
      } catch (error) {
        setErro(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, router],
  );

  return (
    // max-w-[400px] casa com o teto do widget do Google (ver LARGURA_MAX em
    // GoogleSignInButton): o botao nao cresce alem disso, entao limitar a coluna
    // aqui faz titulo, texto e botao terminarem exatamente na mesma borda.
    // Sem isso, a coluna de 448px (max-w-md) deixaria o botao 48px mais curto.
    <div className="mx-auto w-full max-w-[400px] space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-bold text-sidebar-dark">Bem-vindo ao GEFI</h1>
        {/*
          `text-sm` e o que faz a frase caber em UMA linha dentro dos 400px da
          coluna: a 16px ela ocupa ~445px e quebraria. Nao ha `whitespace-nowrap`
          de proposito -- em telas estreitas a coluna encolhe e o texto precisa
          refluir, e um nowrap ali causaria transbordo horizontal em vez de
          quebra. Assim o comportamento e: uma linha enquanto couber, quebra
          quando a tela diminui.
        */}
        <p className="text-sm text-text-light">
          Entre com sua conta institucional do <strong>IFAL</strong> para continuar.
        </p>
      </div>

      {/* Sem `justify-center`: o botao agora ocupa a largura toda do bloco. */}
      <div className="py-2">
        <GoogleSignInButton onCredential={handleCredential} disabled={isLoading} />
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {erro}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4 text-xs text-text-light">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
        <p>
          O acesso é liberado previamente por um administrador. Se sua conta institucional for
          recusada, solicite o cadastro do seu e-mail antes de tentar novamente.
        </p>
      </div>
    </div>
  );
}
