# GeFi Docs - Frontend Next.js 16

Frontend para o sistema **GeFi Docs** (Gestão e Fiscalização Inteligente), uma aplicação web moderna para gerenciamento e fiscalização de documentos normativos com integração de IA através de Chat RAG.

## 🎯 Características

- **Login com Google institucional**: acesso com conta do IFAL, liberado previamente por um administrador
- **Chat RAG**: Interface interativa para consultar documentos normativos com respostas baseadas em IA
- **Upload de Documentos**: Gerenciamento de documentos normativos para indexação
- **Navegação Intuitiva**: Sidebar com acesso rápido a todas as funcionalidades
- **Design Responsivo**: Totalmente otimizado para mobile, tablet e desktop
- **TypeScript**: Type safety completo em toda a aplicação

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 16 com App Router
- **React**: 19.0.0
- **TypeScript**: 5.7.3
- **Styling**: Tailwind CSS 4 com @tailwindcss/postcss
- **HTTP Client**: Axios com interceptadores
- **Notificações**: Sonner
- **Icons**: Lucide React
- **State Management**: React Context API
- **Autenticação**: Google Identity Services + sessão em cookie `httpOnly`

## 📁 Estrutura de Pastas

```
src/
├── app/
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Página inicial (redireciona para login)
│   ├── globals.css             # Estilos globais
│   ├── login/
│   │   └── page.tsx            # Página de login
│   ├── complete-profile/
│   │   └── page.tsx            # 1º acesso: nome e matrícula SIAP
│   ├── dashboard/
│   │   ├── page.tsx            # Chat RAG
│   │   ├── documents/
│   │   │   └── page.tsx        # Upload de documentos
│   │   ├── users/
│   │   │   └── page.tsx        # Administração de acessos (só ADMINISTRADOR)
│   │   ├── schedule/
│   │   │   └── page.tsx        # Cronograma
│   │   └── history/
│   │       └── page.tsx        # Histórico
│   └── not-found.tsx           # Página 404
├── components/
│   ├── auth/                   # Componentes de autenticação
│   │   ├── LoginForm.tsx
│   │   ├── GoogleSignInButton.tsx
│   │   ├── PrivateRoute.tsx
│   │   └── AdminRoute.tsx
│   ├── chat/                   # Componentes de chat
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ConversationList.tsx
│   │   └── SuggestedQuestions.tsx
│   ├── documents/              # Componentes de documentos
│   │   ├── DocumentUploadForm.tsx
│   │   └── DocumentList.tsx
│   ├── layout/                 # Componentes de layout
│   │   ├── Sidebar.tsx
│   │   └── DashboardLayout.tsx
│   └── ui/                     # Componentes UI reutilizáveis
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       └── Select.tsx
├── contexts/
│   └── AuthContext.tsx         # Contexto de autenticação
├── lib/
│   ├── api.ts                  # Configuração do Axios
│   └── utils.ts                # Funções utilitárias
└── types/
    └── index.ts                # Definições de tipos
```

## 🚀 Como Começar

### Pré-requisitos

- Node.js 22.12+
- pnpm 11+ (o projeto fixa a versão em `packageManager`; com o Corepack ativo
  — `corepack enable` — o pnpm certo é usado automaticamente)
- Docker + Docker Compose (apenas para rodar em container)

> **Por que pnpm e não npm:** o `pnpm-workspace.yaml` guarda a política de
> supply-chain do projeto — quais pacotes podem executar scripts de instalação
> (`allowBuilds`) e quais versões transitivas são obrigatórias (`overrides`).
> Instalar com npm ignora essa política. O `package-lock.json` foi removido; o
> lockfile válido é o `pnpm-lock.yaml`.

### Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd gefi-frontend
```

2. Instale as dependências:
```bash
pnpm install --frozen-lockfile
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Rodando **fora** do container, aponte o axios direto para o backend
(3200 e a porta que o compose do `gefi-backend` publica no host):
```env
NEXT_PUBLIC_API_URL=http://localhost:3200/api
```

### Desenvolvimento

```bash
pnpm dev          # http://localhost:3000
pnpm lint         # ESLint (flat config)
pnpm type-check   # tsc --noEmit
pnpm audit        # falha se houver vulnerabilidade em dependência de produção
```

### Build para Produção

```bash
pnpm build
pnpm start
```

## 🐳 Execução em Container

A imagem é multi-stage e termina em **distroless** (`nodejs24-debian12:nonroot`):
sem shell, sem gerenciador de pacotes, sem código-fonte e sem `node_modules` de
build — apenas o runtime Node e a saída `standalone` do Next. Roda como uid
65532, com rootfs somente-leitura e todas as capabilities descartadas.

O backend precisa estar de pe primeiro: o compose do front se conecta a rede
`gefi-backend_default` (declarada como `external`) para alcancar o container
`gefi-api` pelo nome.

```bash
cd ../gefi-backend && docker compose up -d     # sobe gefi-api + gefi-postgres
cd ../gefi-frontend

docker compose up --build            # http://localhost:3100
docker compose up --build web-dev    # http://localhost:3101 (profile deploy-dev)
```

> As portas do host sao **3100/3101**, e nao 3000: a 3000 fica reservada para
> `pnpm dev` deste mesmo projeto. O `gefi-backend` publica em **3200**.
>
> Resumo das portas do host: `3000` front em dev · `3100`/`3101` front em
> container · `3200` API · `2999` API em deploy · `5432` Postgres.

### Como a API é alcançada

O navegador **nunca** fala direto com o backend: `NEXT_PUBLIC_API_URL=/api` faz
todas as chamadas irem para a própria origem, e `src/app/api/[...path]/route.ts`
repassa para o endereço em `API_UPSTREAM`, lido **a cada request** (por padrão
`http://gefi-api:3000`, pela rede interna do Docker).

Consequências práticas:

- a **mesma imagem** serve local, dev e stage — muda-se a env, não o artefato;
- o backend não precisa de CORS, porque não há requisição cross-origin;
- a CSP mantém `connect-src 'self'`, sem liberar hosts externos;
- a topologia interna da rede não aparece no bundle entregue ao cliente.

Sem `API_UPSTREAM`, `/api/*` responde **503** com a instrução de configuração
(em vez de mandar tráfego para um destino default errado); com o backend fora do
ar, responde **502** sem vazar host e porta internos.

## 📖 Funcionalidades

### 1. Autenticação

- **Login**: exclusivamente com conta Google institucional — não há senha
- **Cadastro**: não existe auto-cadastro. Um administrador pré-cadastra o e-mail
  e o cargo em `/dashboard/users`; a pessoa completa nome e matrícula SIAP em
  `/complete-profile`, no primeiro acesso
- **Persistência**: cookie `httpOnly` emitido pelo backend, inacessível ao JavaScript
- **Proteção**: `PrivateRoute` e `AdminRoute` escondem telas; quem de fato barra o
  acesso são os guards da API

### 2. Chat RAG

- **Conversas**: Criar e gerenciar múltiplas conversas
- **Histórico**: Visualizar histórico de mensagens
- **Fontes**: Links para documentação normativa
- **Sugestões**: Perguntas pré-definidas para facilitar uso
- **Auto-scroll**: Navegação automática para última mensagem

### 3. Upload de Documentos

- **Validação**: Apenas arquivos PDF até 10MB
- **Tipos**: Classificação de documentos (Normativo, Regulamento, etc.)
- **Lista**: Visualização de documentos enviados
- **Deleção**: Remover documentos quando necessário

### 4. Navegação

- **Sidebar**: Menu lateral com links principais
- **Responsivo**: Drawer automático em mobile
- **Indicadores**: Página ativa destacada
- **Logout**: Botão de saída segura

## 🔐 Autenticação e Segurança

### Fluxo de Autenticação

1. A pessoa clica no botão do Google, que devolve um **ID token** ao navegador
2. O frontend envia esse token para `POST /api/auth/google`
3. O backend verifica assinatura, emissor, expiração e `aud` contra as chaves
   públicas do Google, confere `email_verified` e a claim `hd` (domínio do
   Workspace), e então procura o e-mail na tabela de usuários
4. **Sem linha pré-cadastrada, o acesso é recusado com 403** — provar identidade
   no Google não dá acesso; o pré-cadastro é que autoriza
5. Autorizado, o backend assina o JWT do GeFi e o devolve em
   `Set-Cookie: gefi_session=...; HttpOnly; SameSite=Lax`
6. O cookie viaja sozinho nas requisições seguintes (`withCredentials: true`)
7. Se a sessão expirar ou for revogada (401), a pessoa volta para `/login`

Se `profile_completed` for falso, o `PrivateRoute` desvia para
`/complete-profile` antes de liberar qualquer tela do dashboard.

### Por que cookie e não localStorage

A versão anterior guardava o JWT em `localStorage`, onde qualquer script na
página consegue lê-lo. Como a CSP deste projeto precisa de `'unsafe-inline'` em
`script-src` (o Next injeta o payload de hydration inline), um XSS significaria
sessão roubada. Com `httpOnly`, o token é invisível ao JavaScript; `SameSite=Lax`
cobre CSRF, já que o cookie não acompanha POST cross-site.

Consequência prática: **não existe mais interceptor montando `Authorization`**.
O axios apenas declara `withCredentials: true`.

```typescript
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sem isto, o cookie não é enviado e tudo responde 401
});

// 401 = sessão expirada ou revogada. Não há nada a limpar no cliente:
// quem invalida o cookie é o servidor.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Configuração do Google

1. No [Google Cloud Console](https://console.cloud.google.com), crie um
   **OAuth 2.0 Client ID** do tipo *Web application*
2. Em *Authorized JavaScript origins*, cadastre **todas as origens de onde o
   navegador carrega o frontend** — não a do backend:
   - `http://localhost:3000` (`pnpm dev`)
   - `http://localhost:3100` (`docker compose up`, conforme o `docker-compose.yml`)
   - a URL de stage/produção
3. Copie o **Client ID** para `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (o *Client Secret*
   não é usado neste fluxo)
4. No backend, defina `GOOGLE_CLIENT_ID` (o mesmo valor) e
   `BOOTSTRAP_ADMIN_EMAILS` com o e-mail do primeiro administrador.
   Deixe `GOOGLE_ALLOWED_HD` **vazio** enquanto o IFAL usar dois domínios
   (`ifal.edu.br` para servidores, `aluno.ifal.edu.br` para estudantes): a
   variável aceita um único domínio, e preencher qualquer um dos dois
   trancaria o outro do lado de fora. A autorização fica com a allowlist.

Os escopos usados (`openid email profile`) são não-sensíveis: o app pode ser
publicado em produção sem passar por verificação da Google.

> **Se o botão do Google não aparecer**, o motivo quase sempre é a CSP: as
> origens do `accounts.google.com` precisam estar liberadas em `next.config.ts`,
> e o bloqueio só aparece no console do navegador, não na aba Network.

## 🎨 Design e Estilos

### Paleta de Cores

- **Azul Escuro**: `#001a33` - Sidebar e backgrounds
- **Azul Médio**: `#002d4d` - Gradiente
- **Verde**: `#10b981` - Botões e elementos interativos
- **Branco**: `#ffffff` - Backgrounds principais

### Tailwind CSS 4

Todas as classes utilizam Tailwind CSS 4 com @tailwindcss/postcss. Não há CSS customizado, garantindo consistência e evitando quebras de layout.

## 📱 Responsividade

A aplicação é totalmente responsiva:

- **Mobile** (375px): Layout empilhado, drawer para sidebar
- **Tablet** (768px): Layout adaptado com sidebar colapsável
- **Desktop** (1920px): Layout completo com sidebar fixa

## 🔌 Integração com API

### Configuração

O cliente HTTP é configurado em `src/lib/api.ts`:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3200/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### Exemplo de Uso

```typescript
// GET
const response = await api.get('/documents');

// POST
const response = await api.post('/chat/ask', {
  conversation_id: id,
  query: 'Minha pergunta',
});

// DELETE
await api.delete(`/documents/${id}`);
```

## 📚 Rotas da API

### Autenticação

- `POST /api/auth/google` - Login com ID token do Google (responde `Set-Cookie`)
- `POST /api/auth/logout` - Encerra a sessão
- `GET /api/auth/me` - Usuário da sessão atual (hidratação do `AuthContext`)

### Usuários

- `PATCH /api/users/me` - Completa o próprio perfil (nome + SIAP)
- `GET /api/users` - Lista usuários *(ADMINISTRADOR)*
- `POST /api/users` - Pré-cadastra e-mail + cargo *(ADMINISTRADOR)*
- `PATCH /api/users/:id` - Altera cargo *(ADMINISTRADOR)*
- `DELETE /api/users/:id` - Remove ou revoga acesso *(ADMINISTRADOR)*

### Chat RAG

- `POST /api/chat/conversations` - Criar conversa
- `POST /api/chat/ask` - Enviar pergunta
- `GET /api/chat/history/:conversation_id` - Histórico

### Documentos

- `POST /api/documents/upload` - Upload de documento
- `GET /api/documents` - Listar documentos
- `DELETE /api/documents/:id` - Deletar documento

## 🧪 Tratamento de Erros

Todos os erros são tratados com notificações via Sonner:

```typescript
try {
  await api.post('/endpoint', data);
  toast.success('Sucesso!');
} catch (error) {
  const message = getErrorMessage(error);
  toast.error(message);
}
```

## 📦 Componentes Reutilizáveis

### Button

```typescript
<Button variant="primary" size="md" disabled={isLoading}>
  Enviar
</Button>
```

Variantes: `primary`, `secondary`, `danger`, `outline`
Tamanhos: `sm`, `md`, `lg`

### Input

```typescript
<Input
  type="email"
  placeholder="seu@email.com"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error={error}
  label="Email"
/>
```

### Card

```typescript
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>Conteúdo</CardContent>
  <CardFooter>Rodapé</CardFooter>
</Card>
```

## 🚨 Troubleshooting

### Erro: "Cannot find module '@/components/...'"

Verifique se o arquivo existe e se o caminho está correto. Todos os imports devem usar o alias `@/`.

### O botão do Google não aparece

Quase sempre é a CSP bloqueando `accounts.google.com` — e o bloqueio só aparece
no **console** do navegador, não na aba Network. Confira as diretivas
`script-src`, `frame-src`, `style-src` e `connect-src` em `next.config.ts`.
Se o console estiver limpo, verifique se `NEXT_PUBLIC_GOOGLE_CLIENT_ID` está
definida no build (o componente mostra o motivo na tela quando ela falta).

### "Seu e-mail não está autorizado a acessar o GeFi" (403)

O login no Google funcionou, mas o e-mail não está pré-cadastrado. Peça a um
administrador para cadastrá-lo em `/dashboard/users`. Se ainda não existe nenhum
administrador, use `BOOTSTRAP_ADMIN_EMAILS` no backend e reinicie o serviço.

### Login responde 200 mas continua deslogado

O cookie de sessão não chegou ao navegador. Verifique se o axios está com
`withCredentials: true` e, em HTTP local, se `COOKIE_SECURE=false` no backend —
um cookie `Secure` é descartado silenciosamente fora de HTTPS.

### Erro: "CORS"

Verifique se a URL da API está configurada corretamente em `.env.local` e se o backend permite requisições CORS.

### Layout quebrado em mobile

Verifique se as classes Tailwind estão corretas. Use `md:` para breakpoints de tablet/desktop.

## 📝 Adicionando Novas Páginas

1. Crie um novo diretório em `src/app/`:
```bash
mkdir src/app/new-page
```

2. Crie o arquivo `page.tsx`:
```typescript
// src/app/new-page/page.tsx
export default function NewPage() {
  return <div>Nova Página</div>;
}
```

3. A rota será automaticamente criada como `/new-page`

## 🔧 Adicionando Novos Componentes

1. Crie o arquivo em `src/components/`:
```typescript
// src/components/MyComponent.tsx
'use client';

export function MyComponent() {
  return <div>Meu Componente</div>;
}
```

2. Importe e use em outras páginas:
```typescript
import { MyComponent } from '@/components/MyComponent';
```

## 📞 Suporte

Para dúvidas ou problemas, consulte:

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Tailwind CSS](https://tailwindcss.com)
- [Documentação React](https://react.dev)
- [Documentação Axios](https://axios-http.com)

## 📄 Licença

Este projeto é licenciado sob a **GNU General Public License v3.0 ou posterior** (GPL-3.0-or-later). Veja o arquivo [LICENSE](LICENSE) para o texto completo.

## 👥 Autores

Desenvolvido para o projeto GeFi Docs - Gestão e Fiscalização Inteligente
