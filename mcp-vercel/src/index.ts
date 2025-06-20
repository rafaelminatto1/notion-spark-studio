#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { config } from 'dotenv';
import { VercelClient } from './vercel-client.js';
import { deploymentTools, handleDeploymentTool } from './tools/deployments.js';
import { projectTools, handleProjectTool } from './tools/projects.js';

// Carregar variáveis de ambiente
config();

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

if (!VERCEL_API_TOKEN) {
  console.error('❌ VERCEL_API_TOKEN é obrigatório');
  process.exit(1);
}

// Inicializar cliente Vercel
const vercelClient = new VercelClient(VERCEL_API_TOKEN, VERCEL_TEAM_ID);

// Criar servidor MCP
const server = new Server(
  {
    name: 'notion-spark-vercel-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Combinar todas as ferramentas
const allTools = [
  ...deploymentTools,
  ...projectTools
];

// Registrar handler para listar ferramentas
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools,
  };
});

// Registrar handler para executar ferramentas
server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    console.error(`🔧 Executando ferramenta: ${name}`);
    
    // Verificar se é ferramenta de deployment
    if (deploymentTools.some(tool => tool.name === name)) {
      return await handleDeploymentTool(name, args, vercelClient);
    }
    
    // Verificar se é ferramenta de projeto
    if (projectTools.some(tool => tool.name === name)) {
      return await handleProjectTool(name, args, vercelClient);
    }

    throw new Error(`Ferramenta desconhecida: ${name}`);
    
  } catch (error) {
    console.error(`❌ Erro ao executar ${name}:`, error);
    return {
      content: [{
        type: 'text',
        text: `❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      }],
      isError: true,
    };
  }
});

// Iniciar servidor
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('🚀 Notion Spark MCP Vercel Server iniciado!');
  console.error(`📊 ${allTools.length} ferramentas disponíveis`);
  console.error('🔗 Conectado à API da Vercel');
}

main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 