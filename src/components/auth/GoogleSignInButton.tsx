'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * Tipagem mínima do Google Identity Services -- só o que este componente usa.
 * O GIS não publica tipos oficiais em npm.
 */
interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    hd?: string;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: 'popup' | 'redirect';
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'small' | 'medium' | 'large';
      text?: 'signin_with' | 'signup_with' | 'continue_with';
      shape?: 'rectangular' | 'pill';
      width?: number;
      locale?: string;
    },
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

/**
 * Domínio sugerido no seletor de contas. Vazio => o parâmetro não é enviado e
 * o Google oferece todas as contas da pessoa.
 *
 * Note que é `|| ''` e não `?? ''`: uma variável definida como string vazia
 * (o caso de quem atende contas de mais de um domínio, como `ifal.edu.br` e
 * `aluno.ifal.edu.br`) precisa resultar em "sem filtro". Com `??`, a string
 * vazia passaria adiante e seria enviada ao GIS como `hd: ''`.
 */
const DOMINIO = process.env.NEXT_PUBLIC_GOOGLE_HD || '';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void | Promise<void>;
  disabled?: boolean;
}

export function GoogleSignInButton({ onCredential, disabled }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando');

  // `onCredential` vive numa ref porque o GIS guarda o callback passado em
  // initialize(); sem isto, uma re-renderização do pai deixaria o botão preso
  // a uma closure antiga.
  const callbackRef = useRef(onCredential);
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    // Falta de configuração é condição conhecida no primeiro render, não um
    // evento: derivar em `semConfiguracao` evita um setState dentro do efeito
    // (e o render em cascata que ele provoca).
    if (!CLIENT_ID) {
      console.error(
        'NEXT_PUBLIC_GOOGLE_CLIENT_ID não definida: o botão do Google não pode ser renderizado.',
      );
      return;
    }

    const renderizar = () => {
      if (!window.google || !containerRef.current) {
        setEstado('erro');
        return;
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          void callbackRef.current(response.credential);
        },
        // `hd` aqui é só conveniência: filtra as contas oferecidas no seletor.
        // A restrição que vale é a do backend, que confere a claim `hd` do ID
        // token -- este parâmetro é do cliente e pode ser contornado.
        //
        // Só é enviado quando configurado: passar `hd: ''` filtraria o seletor
        // por um domínio vazio em vez de desligar o filtro.
        ...(DOMINIO ? { hd: DOMINIO } : {}),
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        locale: 'pt-BR',
      });

      setEstado('pronto');
    };

    if (window.google) {
      renderizar();
      return;
    }

    // Reaproveita a tag se outro componente já a inseriu (ex.: navegação
    // client-side de volta para o login).
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    const script = existente ?? document.createElement('script');

    script.addEventListener('load', renderizar);
    script.addEventListener('error', () => setEstado('erro'));

    if (!existente) {
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', renderizar);
    };
  }, []);

  const semConfiguracao = !CLIENT_ID;

  if (semConfiguracao || estado === 'erro') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        <p className="font-medium">Não foi possível carregar o login do Google.</p>
        <p className="mt-1 text-xs">
          {semConfiguracao
            ? 'NEXT_PUBLIC_GOOGLE_CLIENT_ID não está definida neste ambiente.'
            : 'Verifique sua conexão e se o domínio está autorizado no Google Cloud. Se o problema persistir, o console do navegador mostra o motivo (costuma ser bloqueio de CSP).'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-[44px]">
      {estado === 'carregando' && (
        <div className="flex items-center gap-2 text-sm text-text-light">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando login do Google...
        </div>
      )}
      {/* O GIS injeta um iframe aqui; `disabled` bloqueia cliques durante o envio. */}
      <div
        ref={containerRef}
        className={disabled ? 'pointer-events-none opacity-60' : undefined}
      />
    </div>
  );
}
