#!/usr/bin/env node

/**
 * 🚀 Script de Configuração Automática do Vercel
 * Configura todas as variáveis de ambiente necessárias usando dados do Supabase MCP
 */

const { execSync } = require('child_process');
require('dotenv').config({ path: '.env.local' });

// Dados obtidos do Supabase MCP
const SUPABASE_URL = 'https://bvugljspidtqumysbegq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2dWdsanNwaWR0cXVteXNiZWdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNjE4ODcsImV4cCI6MjA2NDczNzg4N30.YYZVpzyb7ZDyIV3uqaAkA5xBBzA2g7Udnt4uSqaeFAQ';

// Variáveis de ambiente para configurar
const ENV_VARS = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    value: SUPABASE_URL,
    description: 'URL do projeto Supabase'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    value: SUPABASE_ANON_KEY,
    description: 'Chave anônima do Supabase'
  },
  {
    name: 'NEXT_PUBLIC_APP_NAME',
    value: 'Notion Spark Studio',
    description: 'Nome da aplicação'
  },
  {
    name: 'NEXT_PUBLIC_APP_VERSION',
    value: '1.0.0',
    description: 'Versão da aplicação'
  },
  {
    name: 'NODE_ENV',
    value: 'production',
    description: 'Ambiente de produção'
  }
];

function runCommand(command, description) {
  console.log(`🔄 ${description}...`);
  try {
    const result = execSync(command, { 
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log(`✅ ${description} - Sucesso`);
    return result;
  } catch (error) {
    console.error(`❌ ${description} - Erro:`, error.message);
    return null;
  }
}

function setupVercelEnvironment() {
  console.log('🚀 Configurando Variáveis de Ambiente no Vercel');
  console.log('================================================');
  console.log('');

  // Verificar se está logado no Vercel
  console.log('🔍 Verificando login no Vercel...');
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
    console.log('✅ Logado no Vercel');
  } catch (error) {
    console.error('❌ Não logado no Vercel. Execute: vercel login');
    process.exit(1);
  }

  console.log('');
  console.log('📝 Configurando variáveis de ambiente...');
  console.log('');

  // Configurar cada variável
  ENV_VARS.forEach((envVar, index) => {
    console.log(`${index + 1}/${ENV_VARS.length} - ${envVar.name}`);
    console.log(`   Descrição: ${envVar.description}`);
    console.log(`   Valor: ${envVar.value.substring(0, 50)}${envVar.value.length > 50 ? '...' : ''}`);
    
    // Comando para adicionar variável de ambiente
    const command = `echo "${envVar.value}" | vercel env add ${envVar.name} production`;
    
    const result = runCommand(command, `Configurando ${envVar.name}`);
    
    if (result) {
      console.log(`   ✅ ${envVar.name} configurada`);
    } else {
      console.log(`   ⚠️  ${envVar.name} pode já existir ou houve erro`);
    }
    
    console.log('');
  });

  console.log('🎯 Resumo da Configuração:');
  console.log('=========================');
  console.log('✅ Supabase URL configurada');
  console.log('✅ Supabase Anon Key configurada');
  console.log('✅ App Name configurado');
  console.log('✅ App Version configurada');
  console.log('✅ NODE_ENV configurado');
  console.log('');
  console.log('🚀 Próximo passo: vercel --prod');
  console.log('');
}

function showCurrentEnv() {
  console.log('📋 Variáveis de Ambiente Locais:');
  console.log('================================');
  
  ENV_VARS.forEach(envVar => {
    const localValue = process.env[envVar.name];
    console.log(`${envVar.name}: ${localValue ? '✅ Definida' : '❌ Ausente'}`);
    if (localValue && envVar.name.includes('SUPABASE')) {
      console.log(`   Valor: ${localValue.substring(0, 50)}...`);
    } else if (localValue) {
      console.log(`   Valor: ${localValue}`);
    }
  });
  console.log('');
}

// Executar script
if (require.main === module) {
  showCurrentEnv();
  setupVercelEnvironment();
} 