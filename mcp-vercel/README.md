# 🚀 Notion Spark MCP Vercel

Integração Model Context Protocol (MCP) com a API da Vercel para o projeto Notion Spark Studio.

## 📋 Funcionalidades

### 🔧 Ferramentas Disponíveis

#### Deployments
- `vercel-list-deployments` - Lista deployments com filtros
- `vercel-get-deployment` - Detalhes de deployment específico  
- `vercel-get-latest-deployment` - Último deployment de um projeto

#### Projetos
- `vercel-list-projects` - Lista todos os projetos
- `vercel-get-project` - Detalhes de projeto específico
- `vercel-find-project-by-name` - Busca projeto por nome
- `vercel-get-environment-variables` - Lista variáveis de ambiente

## 🛠️ Configuração

### 1. Instalar Dependências
```bash
cd mcp-vercel
npm install
```

### 2. Configurar Token da Vercel
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar .env e adicionar seu token
# Obtenha em: https://vercel.com/account/tokens
VERCEL_API_TOKEN=your_vercel_token_here
```

### 3. Compilar TypeScript
```bash
npm run build
```

### 4. Testar Servidor
```bash
npm run dev
```

## 🔗 Integração com Cursor

### Configuração MCP no Cursor

1. Abra as configurações do Cursor
2. Vá para **Tools → Model Context Protocol (MCP)**
3. Clique em **+ Add MCP tool**
4. Configure:
   - **Name**: `Vercel MCP`
   - **Command**: `node`
   - **Args**: `["C:/Users/rafal/cursor ai/Notion Spark 2/notion-spark-studio/mcp-vercel/dist/index.js"]`
   - **Env**: `{"VERCEL_API_TOKEN": "your_token_here"}`

### Uso no Cursor

Depois de configurado, você pode usar comandos como:

```
Liste os últimos 5 deployments do Notion Spark Studio
```

```
Mostre detalhes do projeto notion-spark-studio
```

```
Qual é o status do último deployment de produção?
```

## 📊 Exemplos de Uso

### Listar Deployments
```typescript
// Lista últimos 10 deployments
vercel-list-deployments({ limit: 10 })

// Filtrar por status
vercel-list-deployments({ state: 'READY', target: 'production' })
```

### Verificar Projeto
```typescript
// Buscar por nome
vercel-find-project-by-name({ name: 'notion-spark-studio' })

// Ver variáveis de ambiente
vercel-get-environment-variables({ projectId: 'prj_...' })
```

## 🎯 Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Executar em modo desenvolvimento
npm run watch        # Executar com hot reload
npm run build        # Compilar TypeScript
npm start            # Executar versão compilada
```

### Teste de Conectividade
```bash
# Testar se o token está funcionando
echo '{"method": "tools/list"}' | npm run dev
```

## 📁 Estrutura do Projeto

```
mcp-vercel/
├── src/
│   ├── index.ts              # Servidor MCP principal
│   ├── types.ts              # Tipos TypeScript
│   ├── vercel-client.ts      # Cliente API Vercel
│   └── tools/
│       ├── deployments.ts    # Ferramentas de deployment
│       └── projects.ts       # Ferramentas de projeto
├── dist/                     # Código compilado
├── package.json
├── tsconfig.json
└── README.md
```

## 🚨 Troubleshooting

### Erro: "VERCEL_API_TOKEN é obrigatório"
- Verifique se o arquivo `.env` existe
- Confirme se o token está correto
- Teste o token em: https://vercel.com/account/tokens

### Erro: "Cannot find module"
```bash
npm install
npm run build
```

### Cursor não reconhece o MCP
- Verifique se o caminho para `dist/index.js` está correto
- Confirme se o arquivo foi compilado (`npm run build`)
- Reinicie o Cursor após configurar

## 🎉 Pronto!

Agora você tem superpoderes para gerenciar deployments da Vercel diretamente no Cursor! 🚀

### Comandos Exemplo:
- "Liste meus projetos da Vercel"
- "Qual o status do último deploy?"
- "Mostre as variáveis de ambiente do projeto X"
- "Quantos deployments falharam hoje?" 