# 🚀 Notion Spark Studio

Uma aplicação revolucionária de anotações e colaboração em tempo real que combina inteligência artificial, performance otimizada e arquitetura moderna.

## ✨ Funcionalidades Principais

- **🤖 Inteligência Artificial**: Sistema de auto-tagging e sugestões inteligentes
- **👥 Colaboração em Tempo Real**: Live cursors e edição simultânea
- **🎨 Templates Inteligentes**: Templates com lógica condicional avançada
- **📊 Analytics Avançado**: Dashboard com múltiplas visualizações
- **⚡ PWA Completo**: Suporte offline e instalação no dispositivo
- **🔐 Sistema RBAC**: Controle granular de permissões
- **📈 Performance Monitor**: Monitoramento em tempo real de FPS e memory
- **🌐 WebSocket Server**: Servidor dedicado para colaboração

## 🛠️ Tecnologias

### Frontend
- **React 18** + **TypeScript**
- **Tailwind CSS** + **Framer Motion**
- **Vite** + **PWA**
- **shadcn-ui** para componentes
- **Service Worker** para offline
- **Web Workers** para performance

### Backend (WebSocket Server)
- **Node.js** + **Express**
- **Socket.IO** para real-time
- **JWT** para autenticação
- **Docker** para containerização

### Ferramentas
- **Jest** + **Testing Library** (20 testes passando)
- **ESLint** + **TypeScript** para qualidade
- **GitHub Actions** para CI/CD
- **Docker Compose** para produção

## 🚀 Quick Start

### Desenvolvimento

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/notion-spark-studio.git
cd notion-spark-studio

# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Executar testes
npm test
```

### WebSocket Server

```bash
# Ir para o diretório do servidor
cd ws-server

# Instalar dependências
npm install

# Iniciar servidor
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/108aa64f-692f-4e36-9812-0e2173b8db97) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Deploy

### Pré-requisitos
- Node.js 18+
- Vercel CLI (opcional)
- Conta no Vercel
- Conta no Supabase

### Variáveis de Ambiente
Copie o arquivo `.env.example` para `.env` e preencha as variáveis necessárias:

```bash
cp .env.example .env
```

### Deploy no Vercel

1. **Configuração Inicial**
   ```bash
   # Instalar Vercel CLI (opcional)
   npm i -g vercel
   
   # Login no Vercel
   vercel login
   ```

2. **Deploy Automático**
   - Conecte seu repositório GitHub ao Vercel
   - Configure as variáveis de ambiente no dashboard do Vercel
   - O deploy será automático a cada push para a branch main

3. **Deploy Manual**
   ```bash
   # Deploy para produção
   vercel --prod
   
   # Deploy para preview
   vercel
   ```

### Configuração do Supabase

1. Crie um novo projeto no Supabase
2. Configure as políticas de segurança
3. Adicione as variáveis de ambiente no Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Monitoramento

O projeto inclui monitoramento automático de performance através do `PerformanceMonitor`. Para habilitar:

1. Configure `VITE_ENABLE_PERFORMANCE_MONITOR=true` no ambiente
2. Acesse o dashboard de métricas em `/metrics`

### Troubleshooting

1. **Erro de Build**
   - Verifique se todas as variáveis de ambiente estão configuradas
   - Limpe o cache do Vercel: `vercel deploy --force`

2. **Erro de Conexão WebSocket**
   - Verifique se o servidor WebSocket está rodando
   - Confirme se `VITE_WS_URL` está configurado corretamente

3. **Erro de Autenticação**
   - Verifique as credenciais do Supabase
   - Confirme se as políticas de segurança estão configuradas

### Suporte

Para suporte adicional:
- Abra uma issue no GitHub
- Entre em contato com a equipe de suporte
- Consulte a documentação completa em `/docs`
