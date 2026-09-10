# GeFi Docs - Frontend Next.js 16

Frontend para o sistema **GeFi Docs** (Gestão e Fiscalização Inteligente), uma aplicação web moderna para gerenciamento e fiscalização de documentos normativos com integração de IA através de Chat RAG.

## 🎯 Características

- **Autenticação JWT**: Login e cadastro seguro de usuários
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
- **Autenticação**: JWT com localStorage

## 📁 Estrutura de Pastas

```
src/
├── app/
│   ├── layout.tsx              # Layout raiz
│   ├── page.tsx                # Página inicial (redireciona para login)
│   ├── globals.css             # Estilos globais
│   ├── login/
│   │   └── page.tsx            # Página de login
│   ├── register/
│   │   └── page.tsx            # Página de cadastro
│   ├── dashboard/
│   │   ├── page.tsx            # Chat RAG
│   │   ├── documents/
│   │   │   └── page.tsx        # Upload de documentos
│   │   ├── schedule/
│   │   │   └── page.tsx        # Cronograma
│   │   └── history/
│   │       └── page.tsx        # Histórico
│   └── not-found.tsx           # Página 404
├── components/
│   ├── auth/                   # Componentes de autenticação
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── PrivateRoute.tsx
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

Rodando **fora** do container, aponte o axios direto para o backend:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
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

> As portas do host sao **3100/3101**, e nao 3000: o `gefi-backend` ja publica
> `127.0.0.1:3000:3000` e as duas colidiriam.

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

- **Login**: Acesso com email e senha
- **Cadastro**: Registro de novos usuários (fiscais)
- **Persistência**: Token JWT armazenado no localStorage
- **Proteção**: Rotas privadas com redirecionamento automático

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

1. Usuário faz login com email/senha
2. Backend retorna JWT token
3. Token é armazenado no localStorage
4. Todas as requisições incluem o token no header `Authorization: Bearer {token}`
5. Se token expirar (401), usuário é redirecionado para login

### Interceptadores Axios

```typescript
// Adiciona token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Trata erros 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

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
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Cadastro

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

### Erro: "Token expirado"

O token foi expirado. Faça login novamente. O redirecionamento automático deve ocorrer.

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

MIT

## 👥 Autores

Desenvolvido para o projeto GeFi Docs - Gestão e Fiscalização Inteligente
