/**
 * Rosto do GeFi, em duas versões — uma por personalidade de resposta.
 *
 *   formal  — terno, gravata e ar sério: o registro INSTITUCIONAL;
 *   casual  — camisa azul e sorriso aberto: o registro CORDIAL.
 *
 * O personagem é o mesmo (mesmo rosto, mesmo formato de armação); o que muda é
 * a roupa, a cor dos óculos e a expressão, então a troca de personalidade fica
 * visível de relance sem que o assistente vire outra pessoa.
 *
 * Por que SVG e não emoji: um emoji é desenhado pela fonte do sistema e muda
 * de rosto entre Windows, Android e iOS — além de não permitir duas versões do
 * mesmo personagem. Aqui o desenho é sempre o mesmo e escala sem perder
 * nitidez.
 */

export type GefiLook = 'formal' | 'casual';

/**
 * Personalidade → versão do personagem.
 *
 * O catálogo do backend é dinâmico: uma personalidade nova, ainda sem
 * personagem desenhado, cai na versão formal em vez de ficar sem avatar.
 */
export function lookForPersona(persona?: string | null): GefiLook {
  return typeof persona === 'string' && persona.trim().toUpperCase() === 'CORDIAL'
    ? 'casual'
    : 'formal';
}

interface GefiAvatarProps {
  /** Lado do avatar em pixels. */
  size?: number;
  className?: string;
  title?: string;
  /** Personalidade que define a versão; ignorada quando `look` é passado. */
  persona?: string | null;
  /** Força uma versão específica (usado no seletor, que mostra as duas). */
  look?: GefiLook;
}

export function GefiAvatar({
  size = 40,
  className,
  title = 'GeFi',
  persona,
  look,
}: GefiAvatarProps) {
  const versao = look ?? lookForPersona(persona);
  const formal = versao === 'formal';

  // Cada versao tem a sua armacao: verde no formal (a cor da marca, que a
  // gravata repete) e azul no casual, combinando com a camisa. E mais um
  // sinal para diferenciar os dois de relance, alem da roupa.
  const corOculos = formal ? '#2ECC71' : '#4a9eff';

  // Ids únicos por versão: duas instâncias na mesma tela não podem disputar o
  // mesmo clipPath.
  const recorte = `gefi-recorte-${versao}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      <circle cx="24" cy="24" r="24" fill="#001a33" />

      <clipPath id={recorte}>
        <circle cx="24" cy="24" r="24" />
      </clipPath>

      <g clipPath={`url(#${recorte})`}>
        {/* Pescoço, atrás da roupa */}
        <path d="M20.6 29h6.8v9h-6.8z" fill="#e0b189" />

        {formal ? (
          <>
            {/* Paletó escuro, com lapelas */}
            <path d="M3 50c0-7.6 9.4-12.2 21-12.2S45 42.4 45 50v6H3z" fill="#1c2a38" />
            <path d="M18.6 37.6 24 44.8 14.4 42l-1-2.6z" fill="#27394d" />
            <path d="M29.4 37.6 24 44.8 33.6 42l1-2.6z" fill="#27394d" />
            {/* Camisa branca */}
            <path d="M19.9 37.3 24 44.6l4.1-7.3-4.1-1.6z" fill="#f4f7fa" />
            {/* Gravata */}
            <path d="M24 44.6l-1.8-3.4h3.6z" fill="#2ECC71" />
            <path d="M22.2 41.2 24 56l1.8-14.8z" fill="#2ECC71" />
          </>
        ) : (
          <>
            {/* Camisa azul, gola aberta e sem gravata */}
            <path d="M3 50c0-7.6 9.4-12.2 21-12.2S45 42.4 45 50v6H3z" fill="#2f7fd4" />
            <path d="M18.8 37.5 24 45.5l-5.9-3.6-1-3z" fill="#5aa3e8" />
            <path d="M29.2 37.5 24 45.5l5.9-3.6 1-3z" fill="#5aa3e8" />
            {/* Camiseta por baixo, no V da gola */}
            <path d="M21.4 37.4 24 45.5l2.6-8.1z" fill="#e8f1fb" />
          </>
        )}

        {/* Cabelo: penteado no formal, com topete no casual */}
        {formal ? (
          <path
            d="M13.3 22.4c0-6.6 4.8-11.3 10.7-11.3s10.7 4.7 10.7 11.3c-.6-1.4-1.4-2.9-2.5-3.9-3.3 1.5-12.1 1.7-16.3-.2-1 1.2-1.6 2.6-2.1 4z"
            fill="#4a3728"
          />
        ) : (
          <>
            {/* Topete despenteado: o "nerd normal" */}
            <path
              d="M26.4 11.6c1.6-2.2 4.6-2.4 5.7-1-1.2.1-1.9.6-2.2 1.2 1.3.2 2.1 1 2.3 1.8-1.3-.5-2.6-.5-3.6-.2z"
              fill="#5b4334"
            />
            <path
              d="M13.3 22.4c0-6.6 4.8-11.3 10.7-11.3 2.7 0 5 .9 6.6 2.4-1.5.7-2.3 1.9-2.3 1.9s.4-1.4.1-2.3c-3.2 2.2-9.4 2.2-13 .5-1.3 1.7-2.2 4.4-2.1 8.8z"
              fill="#5b4334"
            />
          </>
        )}
      </g>

      {/* Rosto */}
      <circle cx="24" cy="23.2" r="10" fill="#f0c9a4" />
      {/* Orelhas */}
      <circle cx="14.4" cy="23.8" r="1.9" fill="#e0b189" />
      <circle cx="33.6" cy="23.8" r="1.9" fill="#e0b189" />

      {/* Sobrancelhas: retas no formal, arqueadas no casual */}
      <g stroke={formal ? '#4a3728' : '#5b4334'} strokeWidth="1.3" strokeLinecap="round">
        {formal ? (
          <>
            <path d="M17.3 18.6h3.3" />
            <path d="M30.7 18.6h-3.3" />
          </>
        ) : (
          <>
            <path d="M17.2 18.6c1-.8 2.3-.9 3.4-.5" />
            <path d="M30.8 18.6c-1-.8-2.3-.9-3.4-.5" />
          </>
        )}
      </g>

      {/* Óculos: a assinatura do personagem, na cor da sua versão */}
      <g fill="none" stroke={corOculos} strokeWidth="1.5">
        <circle cx="19.8" cy="23" r="3.6" fill="#ffffff" fillOpacity="0.92" />
        <circle cx="28.2" cy="23" r="3.6" fill="#ffffff" fillOpacity="0.92" />
        <path d="M23.4 22.8c.4-.4 .8-.4 1.2 0" strokeLinecap="round" />
        <path d="M16.2 22.6l-1.9-.5M31.8 22.6l1.9-.5" strokeLinecap="round" />
      </g>
      {/* Olhos */}
      <circle cx="19.8" cy="23.1" r="1.3" fill="#1a2733" />
      <circle cx="28.2" cy="23.1" r="1.3" fill="#1a2733" />

      {/* Boca: contida no formal, sorriso aberto no casual */}
      {formal ? (
        <path
          d="M21.5 28.4c1.3 1 3.7 1 5 0"
          fill="none"
          stroke="#8a5233"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M20.5 27.9c1.9 2.3 5.1 2.3 7 0"
          fill="none"
          stroke="#8a5233"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
