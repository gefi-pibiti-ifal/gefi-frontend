import type { NextConfig } from 'next';

/**
 * O proxy para o backend NAO fica aqui.
 *
 * Os `rewrites()` do Next sao avaliados em tempo de BUILD e gravados
 * literalmente em `.next/routes-manifest.json` -- o destino ficaria congelado
 * na imagem, exigindo um artefato por ambiente. Por isso o repasse de /api vive
 * em `src/app/api/[...path]/route.ts`, que le `API_UPSTREAM` a cada request.
 */

/**
 * Content-Security-Policy.
 *
 * `'unsafe-inline'` em script-src e uma concessao consciente: o Next injeta
 * scripts inline (payload de hydration/RSC) em producao, e remove-los exige
 * CSP por nonce -- que so funciona com um middleware gerando o nonce a cada
 * request e renderizacao dinamica em todas as rotas. Se o projeto precisar de
 * CSP estrita depois, esse e o caminho.
 *
 * `connect-src 'self'` so e suficiente porque a app fala com o backend pelo
 * proxy same-origin acima. Se voltar a apontar o axios direto para outro host,
 * a origem do backend precisa entrar aqui, senao o navegador bloqueia as
 * chamadas.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Empacota o servidor + apenas as dependencias realmente usadas em
   * `.next/standalone`. E o que permite a imagem final NAO carregar
   * node_modules completo nem o codigo-fonte (ver stage 3 do Dockerfile).
   */
  output: 'standalone',

  /** Nao expor a versao do framework no header `X-Powered-By`. */
  poweredByHeader: false,

  typescript: {
    tsconfigPath: './tsconfig.json',
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: CSP },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          {
            // Só tem efeito sob HTTPS; inofensivo em HTTP local.
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },

};

export default nextConfig;
