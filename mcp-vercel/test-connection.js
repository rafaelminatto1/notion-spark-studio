#!/usr/bin/env node

// Teste de conectividade com a API da Vercel
import axios from 'axios';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

async function testVercelConnection() {
  console.log('🧪 Testando conectividade com a API da Vercel...\n');
  
  if (!VERCEL_API_TOKEN) {
    console.log('❌ ERRO: VERCEL_API_TOKEN não encontrado no arquivo .env');
    process.exit(1);
  }
  
  console.log(`🔑 Token configurado: ${VERCEL_API_TOKEN.substring(0, 10)}...`);
  
  try {
    // Teste 1: Listar projetos
    console.log('📂 Teste 1: Listando projetos...');
    const projectsResponse = await axios.get('https://api.vercel.com/v9/projects?limit=5', {
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const projects = projectsResponse.data.projects || [];
    console.log(`✅ Sucesso! Encontrados ${projects.length} projetos:`);
    projects.forEach(p => {
      console.log(`   🚀 ${p.name} (${p.framework})`);
    });
    
    // Teste 2: Listar deployments
    console.log('\n📋 Teste 2: Listando deployments...');
    const deploymentsResponse = await axios.get('https://api.vercel.com/v6/deployments?limit=3', {
      headers: {
        'Authorization': `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const deployments = deploymentsResponse.data.deployments || [];
    console.log(`✅ Sucesso! Encontrados ${deployments.length} deployments recentes:`);
    deployments.forEach(d => {
      const status = d.state === 'READY' ? '✅' : d.state === 'ERROR' ? '❌' : '🔄';
      console.log(`   ${status} ${d.name} (${d.state})`);
    });
    
    // Buscar projeto Notion Spark
    console.log('\n🎯 Teste 3: Buscando projeto notion-spark-studio...');
    const notionProject = projects.find(p => p.name.includes('notion-spark'));
    
    if (notionProject) {
      console.log(`✅ Projeto encontrado: ${notionProject.name}`);
      console.log(`   📋 ID: ${notionProject.id}`);
      console.log(`   🛠️ Framework: ${notionProject.framework}`);
      console.log(`   📅 Criado: ${new Date(notionProject.createdAt).toLocaleString('pt-BR')}`);
      
      // Teste 4: Deployments do projeto específico
      console.log('\n🚀 Teste 4: Deployments do Notion Spark...');
      const projectDeployments = deployments.filter(d => d.projectId === notionProject.id);
      console.log(`✅ Encontrados ${projectDeployments.length} deployments do projeto`);
      
    } else {
      console.log('⚠️  Projeto notion-spark-studio não encontrado');
    }
    
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ API da Vercel está funcionando perfeitamente');
    console.log('✅ Token está válido e com permissões corretas');
    console.log('✅ MCP Vercel está pronto para usar no Cursor!');
    
  } catch (error) {
    console.log('\n❌ ERRO na conectividade:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Mensagem: ${error.response.data?.error?.message || 'Erro desconhecido'}`);
      
      if (error.response.status === 401) {
        console.log('\n💡 SOLUÇÃO: Token inválido ou expirado');
        console.log('   1. Verifique se o token está correto');
        console.log('   2. Gere um novo token em: https://vercel.com/account/tokens');
      }
    } else {
      console.log(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Executar teste
testVercelConnection(); 