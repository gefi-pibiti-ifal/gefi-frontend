'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/**
 * O widget do Google nao aceita largura fluida ("100%"): `renderButton` recebe
 * `width` em pixels. Por isso a largura e MEDIDA no container e repassada, e o
 * botao e redesenhado quando esse container muda de tamanho.
 *
 * LARGURA_MAX vem da documentacao do GIS ("The maximum width is 400 pixels");
 * valores acima disso sao ignorados. LARGURA_MIN, ao contrario, e escolha
 * NOSSA: a doc nao define piso, e sem um o botao poderia ficar ilegivel num
 * container muito estreito.
 */
const LARGURA_MIN = 200;
const LARGURA_MAX = 400;

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
      logo_alignment?: 'left' | 'center';
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
 * Note que é `||` e não `??`: uma variável definida como string vazia (o caso
 * de quem atende contas de mais de um domínio, como ifal.edu.br e
 * aluno.ifal.edu.br) precisa resultar em "sem filtro". Com `??`, a string vazia
 * passaria adiante e seria enviada ao GIS como um `hd` vazio.
 */
const DOMINIO = process.env.NEXT_PUBLIC_GOOGLE_HD || '';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void | Promise<void>;
  disabled?: boolean;
}

export function GoogleSignInButton({ onCredential, disabled }: GoogleSignInButtonProps) {
  /** Mede o espaço disponível: é este elemento que define a largura do botão. */
  const medidorRef = useRef<HTMLDivElement>(null);
  /** Onde o GIS injeta o iframe do botão. */
  const containerRef = useRef<HTMLDivElement>(null);

  const [largura, setLargura] = useState(0);
  // Inicializador preguicoso em vez de setState no efeito: quando o script ja
  // foi carregado por uma visita anterior (navegacao client-side de volta ao
  // login), o valor certo ja e conhecido no primeiro render.
  //
  // Nao corre risco de divergencia na hidratacao: esta e a UNICA hora em que
  // o servidor e o cliente precisam bater, e nesse momento o script ainda nao
  // foi inserido -- quem o insere e o efeito logo abaixo.
  const [gsiCarregado, setGsiCarregado] = useState(
    () => typeof window !== 'undefined' && !!window.google,
  );
  const [erro, setErro] = useState(false);

  // `onCredential` vive numa ref porque o GIS guarda o callback passado em
  // initialize(); sem isto, uma re-renderização do pai deixaria o botão preso
  // a uma closure antiga.
  const callbackRef = useRef(onCredential);
  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  /** initialize() é global: roda uma vez, ainda que a largura mude várias. */
  const inicializadoRef = useRef(false);

  // ---------------------------------------------------------------------------
  // 1. Mede a largura disponível e acompanha mudanças (responsivo)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const alvo = medidorRef.current;
    if (!alvo) return;

    const observador = new ResizeObserver((entries) => {
      const medida = entries[0]?.contentRect.width ?? 0;
      // Arredonda: o GIS espera pixels inteiros, e frações de pixel fariam o
      // botão ser redesenhado a cada micro-ajuste de layout.
      setLargura(Math.round(medida));
    });

    observador.observe(alvo);
    return () => observador.disconnect();
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Carrega o script do GIS (uma vez)
  // ---------------------------------------------------------------------------
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

    if (gsiCarregado) return;

    // Reaproveita a tag se outro componente já a inseriu (ex.: navegação
    // client-side de volta para o login).
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    const script = existente ?? document.createElement('script');

    const aoCarregar = () => setGsiCarregado(true);
    const aoFalhar = () => setErro(true);

    script.addEventListener('load', aoCarregar);
    script.addEventListener('error', aoFalhar);

    if (!existente) {
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', aoCarregar);
      script.removeEventListener('error', aoFalhar);
    };
    // `gsiCarregado` na lista e seguro: quando ele vira true o efeito reexecuta,
    // cai no early return acima e a limpeza solta os listeners que ja nao sao
    // necessarios. Nenhum script e inserido duas vezes.
  }, [gsiCarregado]);

  // ---------------------------------------------------------------------------
  // 3. Desenha o botão na largura medida, e redesenha quando ela muda
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!gsiCarregado || largura === 0) return;

    const container = containerRef.current;
    if (!window.google || !container) {
      setErro(true);
      return;
    }

    if (!inicializadoRef.current) {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          void callbackRef.current(response.credential);
        },
        // `hd` aqui é só conveniência: filtra as contas oferecidas no seletor.
        // A restrição que vale é a do backend, que confere a claim `hd` do ID
        // token -- este parâmetro é do cliente e pode ser contornado.
        //
        // Só é enviado quando configurado: um `hd` vazio filtraria o seletor
        // por um domínio vazio em vez de desligar o filtro.
        ...(DOMINIO ? { hd: DOMINIO } : {}),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      inicializadoRef.current = true;
    }

    // `renderButton` ANEXA um botão ao elemento em vez de substituir o que já
    // estava lá: sem limpar, cada mudança de largura empilharia mais um.
    container.replaceChildren();

    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      // Centraliza logo + rótulo dentro do botão largo. Com o padrão (`left`) o
      // texto ficaria colado à esquerda, deixando um vazio à direita.
      logo_alignment: 'center',
      width: Math.min(Math.max(largura, LARGURA_MIN), LARGURA_MAX),
      locale: 'pt-BR',
    });
  }, [gsiCarregado, largura]);

  const semConfiguracao = !CLIENT_ID;

  if (semConfiguracao || erro) {
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

  const pronto = gsiCarregado && largura > 0;

  return (
    // `w-full`: este elemento é a régua. O botão assume a largura dele, então
    // quem decide o tamanho é o container do formulário -- e o botão acaba
    // alinhado com o texto acima.
    <div ref={medidorRef} className="relative min-h-[44px] w-full">
      {!pronto && (
        <div className="flex items-center gap-2 text-sm text-text-light">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando login do Google...
        </div>
      )}
      {/* O GIS injeta um iframe aqui; `disabled` bloqueia cliques durante o envio. */}
      <div ref={containerRef} className={disabled ? 'pointer-events-none opacity-60' : undefined} />
    </div>
  );
}
