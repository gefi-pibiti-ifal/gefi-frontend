# syntax=docker/dockerfile:1.7
# ==============================================================================
# gefi-docs-frontend — Dockerfile multi-stage (local / dev / stage)
#
# DIFERENCA IMPORTANTE em relacao a uma SPA (Vite): esta e uma app Next.js com
# App Router. O build NAO produz apenas estaticos — ha rotas renderizadas sob
# demanda (`/dashboard/chat/[id]`, `/healthz`), entao a imagem final PRECISA de
# um runtime Node. Nao da para servir isto so com nginx.
#
# O que substitui o "nginx magro" da SPA e o `output: 'standalone'` do
# next.config.ts: o Next empacota o servidor + SOMENTE as dependencias
# realmente alcancadas (aqui: next, react, react-dom) em `.next/standalone`.
# A imagem final nao carrega pnpm, node_modules completo, codigo-fonte,
# devDependencies nem toolchain de build.
#
# As variaveis NEXT_PUBLIC_* sao congeladas no bundle em tempo de build (mesmo
# comportamento das VITE_*), por isso entram como --build-arg. Ja o destino do
# backend e resolvido em RUNTIME, pela env API_UPSTREAM, atraves do rewrite
# declarado em next.config.ts — e o que permite UMA imagem servir varios
# ambientes.
#
# Build:
#   docker build -t gefi-docs-frontend:1.0.0 .
#
# Run:
#   docker run -p 3000:3000 -e API_UPSTREAM=http://gefi-api:8000 gefi-docs-frontend:1.0.0
# ==============================================================================


# ==============================================================================
# Stage 1 — deps : resolve as dependencias isoladamente
#
# Separado do build para que alteracoes em src/ nao invalidem o cache do
# `pnpm install`, que e a etapa cara. Base Debian slim (e nao Alpine) porque o
# toolchain do Next 16 usa binarios nativos (Turbopack, @tailwindcss/oxide) e o
# lockfile resolve os pacotes *-linux-*-gnu; Alpine (musl) exigiria outro
# conjunto de binarios opcionais. Esta stage e descartada, entao nao pesa na
# imagem final.
# ==============================================================================
FROM node:24-bookworm-slim AS deps

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Versao do pnpm fixada para que a resolucao seja identica na maquina do dev,
# no CI e aqui. Bate com o campo "packageManager" do package.json.
RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

WORKDIR /app

# pnpm-workspace.yaml e OBRIGATORIO aqui: e ele que carrega a politica de
# supply-chain (`allowBuilds`) e os `overrides` de seguranca. Sem esse arquivo o
# install aborta pedindo aprovacao manual dos scripts de instalacao.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --frozen-lockfile: falha se o lockfile divergir do package.json, em vez de
# resolver versoes novas silenciosamente. E o que torna o build reprodutivel e
# impede que um advisory novo entre na imagem sem alguem ter revisado.
# O cache mount mantem o store do pnpm FORA da imagem: acelera rebuilds sem
# virar camada.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile


# ==============================================================================
# Stage 2 — build : type-check + build de producao
# ==============================================================================
FROM node:24-bookworm-slim AS build

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0 \
    NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- Configuracao por ambiente -----------------------------------------------
# Estes valores sao EMBUTIDOS no JavaScript entregue ao navegador. Sao todos
# identificadores publicos de client-side — NAO passe segredos por aqui:
# qualquer pessoa com acesso ao bundle os leria.
#
# O default `/api` faz o navegador chamar a propria origem, e quem repassa para
# o backend e o rewrite do next.config.ts, usando API_UPSTREAM em runtime.
# Mantenha assim: apontar direto para o host do backend crava a URL no bundle
# (exigindo uma imagem por ambiente) e ainda obriga a afrouxar o `connect-src`
# da CSP.
ARG NEXT_PUBLIC_API_URL=/api

# Client ID do Google. Precisa entrar AQUI, e nao como env de runtime: o botao
# de login e montado no navegador, e o valor so chega ao cliente se estiver
# congelado no bundle. Definido apenas no `environment` do compose, ele existe
# no container mas nunca no JavaScript entregue a pagina -- o sintoma e o botao
# nao renderizar, com "NEXT_PUBLIC_GOOGLE_CLIENT_ID nao esta definida".
#
# Nao e segredo (ver o comentario acima sobre NEXT_PUBLIC_*): um Client ID e
# publico por natureza, e o Client Secret nao participa deste fluxo.
#
# Efeito colateral aceito: a imagem passa a ser especifica do projeto Google.
# Na pratica um unico OAuth Client atende local, dev e stage, bastando cadastrar
# todas as origens nele -- entao segue valendo uma imagem para todos.
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""

# Dominio sugerido no seletor de contas. Vazio => sem filtro (o caso do IFAL,
# que tem ifal.edu.br e aluno.ifal.edu.br).
ARG NEXT_PUBLIC_GOOGLE_HD=""

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_HD=$NEXT_PUBLIC_GOOGLE_HD

# `pnpm build` = next build -> .next/standalone + .next/static
RUN pnpm build


# ==============================================================================
# Stage 3 — runtime : distroless, sem shell e sem gerenciador de pacotes
#
# gcr.io/distroless/nodejs24-debian12:nonroot contem o runtime Node e nada mais:
# sem shell (/bin/sh), sem apt, sem busybox, sem coreutils. Isso remove a maior
# parte do ferramental de que um atacante precisaria depois de conseguir
# execucao — nao ha como abrir um shell reverso ou instalar pacotes de dentro.
# A tag `nonroot` ja roda como uid 65532; o ENTRYPOINT da imagem e o proprio
# `node`, por isso o CMD abaixo e so o caminho do script.
# ==============================================================================
FROM gcr.io/distroless/nodejs24-debian12:nonroot AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Destino do proxy de /api, resolvido no start do container pelo rewrite do
# next.config.ts. SEM barra no final. Sobrescrito por ambiente:
#   local  http://host.docker.internal:8000
#   dev    http://gefi-api.dev.svc.cluster.local:8000
#   stage  https://api-stage.exemplo.com
# Vazio => sem proxy: a app usa o valor de NEXT_PUBLIC_API_URL como esta.
ENV API_UPSTREAM=""

# --- Somente o resultado do build atravessa para a imagem final ---------------
# `--chown=nonroot:nonroot` mantem os arquivos legiveis pelo uid 65532 sem dar
# permissao de escrita ao processo sobre o proprio codigo.

# server.js + package.json + as poucas dependencias que o Next resolveu como
# necessarias em runtime.
COPY --from=build --chown=nonroot:nonroot /app/.next/standalone ./

# Assets versionados (JS/CSS com hash). O standalone NAO os inclui: o Next
# espera encontra-los neste caminho ao lado do server.js.
COPY --from=build --chown=nonroot:nonroot /app/.next/static ./.next/static

# Arquivos servidos como estao (logo_ifal.svg, empty-docs.svg).
COPY --from=build --chown=nonroot:nonroot /app/public ./public

EXPOSE 3000

# Sem shell na imagem, o healthcheck roda pelo proprio node (fetch e global no
# Node 24). O caminho absoluto e necessario porque o HEALTHCHECK em exec form
# nao passa pelo ENTRYPOINT.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD ["/nodejs/bin/node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

USER nonroot

CMD ["server.js"]
