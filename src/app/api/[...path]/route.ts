/**
 * Proxy same-origin para o backend do GeFi.
 *
 * POR QUE UM ROUTE HANDLER, E NAO UM `rewrite` NO next.config.ts:
 * os rewrites do Next sao resolvidos em tempo de BUILD e gravados literalmente
 * em `.next/routes-manifest.json` -- a URL de destino fica congelada na imagem,
 * exatamente o que se quer evitar. Este handler roda a cada request e le
 * `API_UPSTREAM` na hora, entao A MESMA IMAGEM serve local, dev e stage: muda-se
 * a env do container, nao o artefato.
 *
 * Efeito colateral desejado: o navegador so fala com a propria origem. Isso
 * mantem `connect-src 'self'` na CSP, dispensa CORS no backend e nao expoe a
 * topologia interna da rede no bundle entregue ao cliente.
 */

/** Roda no Node (nao no edge): precisa de fetch para host arbitrario e streaming. */
export const runtime = 'nodejs';

/** Nunca cachear nem prerenderizar: e um tunel para o backend. */
export const dynamic = 'force-dynamic';

/**
 * Cabecalhos hop-by-hop (RFC 9110 §7.6.1): descrevem UMA conexao TCP e nao
 * podem ser repassados adiante. Encaminhar `transfer-encoding`/`content-length`
 * de uma ponta para a outra e a causa classica de request smuggling e de
 * respostas truncadas.
 */
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'content-length',
  'host',
]);

function filterHeaders(source: Headers): Headers {
  const out = new Headers();
  source.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) out.set(key, value);
  });
  return out;
}

/**
 * Repassa a resposta do backend preservando os `Set-Cookie`.
 *
 * `filterHeaders` sozinho NAO serve para a resposta: `Headers.forEach` entrega
 * cada `set-cookie` separadamente, mas `out.set()` sobrescreve o anterior --
 * entao, de dois cookies, so o ultimo chegaria ao navegador. Como a sessao do
 * GeFi agora e um cookie httpOnly emitido pelo backend, perder esse header
 * significa um login que responde 200 e mesmo assim nao autentica.
 *
 * `getSetCookie()` devolve a lista real, e `append` preserva as repeticoes.
 */
function filterResponseHeaders(source: Headers): Headers {
  const out = new Headers();

  source.forEach((value, key) => {
    const nome = key.toLowerCase();
    if (nome === 'set-cookie') return; // tratado abaixo, sem colapsar
    if (!HOP_BY_HOP.has(nome)) out.set(key, value);
  });

  for (const cookie of source.getSetCookie()) {
    out.append('set-cookie', cookie);
  }

  return out;
}

/**
 * Monta a URL de destino de forma que o CLIENTE NAO CONSIGA TROCAR O HOST.
 *
 * Os segmentos vem da URL e sao dados nao confiaveis: sem cuidado, um
 * `/api/..%2f..%2fadmin` ou um segmento contendo `//outro-host` transformaria
 * este proxy num SSRF -- qualquer visitante alcancaria servicos internos que so
 * o container enxerga. Por isso os segmentos sao re-encodados um a um e, no
 * fim, a origem resultante e comparada com a do upstream.
 */
function buildTargetUrl(upstream: string, segments: string[], search: string): URL | null {
  const base = new URL(upstream.replace(/\/+$/, '') + '/');

  const safePath = segments
    .map((s) => encodeURIComponent(decodeURIComponent(s)))
    .join('/');

  const target = new URL(`api/${safePath}`, base);
  target.search = search;

  // Defesa em profundidade: se por qualquer motivo a origem mudou, aborta.
  if (target.origin !== base.origin) return null;

  return target;
}

async function handler(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const upstream = process.env.API_UPSTREAM?.trim();

  if (!upstream) {
    // Falha explicita e diagnosticavel. O alternativo -- repassar para um
    // destino default -- mandaria dados de producao para o lugar errado.
    return Response.json(
      {
        error: 'API_UPSTREAM nao configurada',
        detail:
          'Defina API_UPSTREAM no container (ex.: http://gefi-api:8000) para habilitar o proxy /api.',
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const { path } = await context.params;
  const requestUrl = new URL(request.url);
  const target = buildTargetUrl(upstream, path ?? [], requestUrl.search);

  if (!target) {
    return Response.json({ error: 'Caminho invalido' }, { status: 400 });
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';

  // O corpo e BUFFERIZADO, e nao repassado como stream.
  //
  // Encaminhar `request.body` (um ReadableStream) parece mais eficiente, mas o
  // undici precisa poder REENVIAR a requisicao -- em reuso de conexao keep-alive
  // e em retry -- e um stream so pode ser lido uma vez. Quando isso acontece o
  // fetch morre com "expected non-null body source" e o proxy devolve 502 de
  // forma intermitente, dependendo de como o backend responde (foi exatamente o
  // que ocorreu no POST /api/auth/login).
  //
  // Custo: o upload fica inteiro em memoria durante o repasse. Para os
  // documentos deste sistema e aceitavel; se passarem a subir arquivos muito
  // grandes, aumente `mem_limit` no docker-compose.yml na mesma proporcao.
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstreamResponse = await fetch(target, {
      method: request.method,
      headers: filterHeaders(request.headers),
      body: body && body.byteLength > 0 ? body : undefined,
      // Um redirect do backend deve chegar ao cliente como redirect, e nao ser
      // seguido as cegas por este proxy (outro caminho para SSRF).
      redirect: 'manual',
    });

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: filterResponseHeaders(upstreamResponse.headers),
    });
  } catch (error) {
    // O detalhe fica no LOG do servidor (host/porta internos sao uteis para
    // diagnostico), nunca na resposta ao cliente.
    console.error(`[proxy] ${request.method} ${target.pathname} falhou:`, error);

    return Response.json(
      { error: 'Backend indisponivel' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
