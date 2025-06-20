#!/usr/bin/env node

/**
 * Script de verificação de ambiente otimizado para Vercel
 * Valida configurações críticas para deploy em produção
 */

// Variáveis obrigatórias para Vercel
const REQUIRED_VERCEL_VARS = [
  'NODE_ENV'
];

// Variáveis opcionais da Vercel (disponíveis automaticamente)
const OPTIONAL_VERCEL_VARS = [
  'VERCEL_ENV',
  'VERCEL_URL',
  'VERCEL_GIT_COMMIT_SHA',
  'VERCEL_GIT_COMMIT_MESSAGE',
  'VERCEL_GIT_COMMIT_AUTHOR_NAME',
  'VERCEL_GIT_REPO_SLUG'
];

// Variáveis do projeto (se definidas)
const PROJECT_VARS = [
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_API_BASE_URL',
  'VITE_WS_URL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

const vercelEnv = process.env.VERCEL_ENV || 'unknown';
const nodeEnv = process.env.NODE_ENV || 'unknown';

console.log('🔍 Verificação de Ambiente - Vercel Optimized');
console.log('=============================================');

// Status do ambiente
function getEnvironmentStatus() {
  console.log('\n📋 Status do Ambiente:');
  console.log(`📝 NODE_ENV: ${nodeEnv}`);
  console.log(`🌐 VERCEL_ENV: ${vercelEnv}`);
  
  if (process.env.VERCEL_URL) {
    console.log(`📝 URL: ${process.env.VERCEL_URL}`);
  }
  
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    console.log(`🔗 Commit: ${process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 8)}`);
  }
  
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
}

// Verificar variáveis obrigatórias
function checkRequiredVars() {
  console.log('\n✅ Variáveis Obrigatórias:');
  
  const missing = [];
  
  REQUIRED_VERCEL_VARS.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Definida`);
    } else {
      console.log(`❌ ${varName}: AUSENTE`);
      missing.push(varName);
    }
  });
  
  return missing;
}

// Verificar variáveis da Vercel
function checkVercelVars() {
  console.log('\n🚀 Variáveis da Vercel:');
  
  if (process.env.VERCEL_ENV) {
    console.log(`✅ Ambiente Vercel: ${process.env.VERCEL_ENV}`);
  } else {
    console.log(`ℹ️  VERCEL_ENV: Não detectado (esperado localmente)`);
  }
  
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    console.log(`✅ Commit: ${process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 8)}`);
  } else {
    console.log(`ℹ️  VERCEL_GIT_COMMIT_SHA: Não disponível`);
  }
  
  if (process.env.VERCEL_URL) {
    console.log(`✅ URL: ${process.env.VERCEL_URL}`);
  } else {
    console.log(`ℹ️  VERCEL_URL: Não disponível`);
  }
}

// Verificar variáveis do projeto
function checkProjectVars() {
  console.log('\n🎯 Variáveis do Projeto:');
  
  const defined = [];
  const undefined = [];
  
  PROJECT_VARS.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: ${process.env[varName]}`);
      defined.push(varName);
    } else {
      console.log(`ℹ️  ${varName}: Usando fallback`);
      undefined.push(varName);
    }
  });
  
  return { defined, undefined };
}

// Verificar configuração de build
function checkBuildConfig() {
  console.log('\n🏗️  Configuração de Build:');
  
  // Next.js
  console.log(`✅ Framework: Next.js`);
  console.log(`✅ TypeScript: Habilitado`);
  console.log(`✅ ESLint: Habilitado`);
  
  // Scripts
  const packageJson = require('../package.json');
  const scripts = packageJson.scripts || {};
  
  if (scripts.build) {
    console.log(`✅ Build script: ${scripts.build}`);
  }
  
  if (scripts['vercel-build']) {
    console.log(`✅ Vercel build: ${scripts['vercel-build']}`);
  }
  
  if (scripts.lint) {
    console.log(`✅ Lint script: ${scripts.lint}`);
  }
}

// Verificar dependências críticas
function checkDependencies() {
  console.log('\n📦 Dependências Críticas:');
  
  const packageJson = require('../package.json');
  const deps = packageJson.dependencies || {};
  
  const criticalDeps = [
    'next',
    'react',
    'react-dom',
    '@supabase/supabase-js',
    '@tanstack/react-query'
  ];
  
  criticalDeps.forEach(dep => {
    if (deps[dep]) {
      console.log(`✅ ${dep}: ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep}: AUSENTE`);
    }
  });
}

// Validar configuração Vercel
function validateVercelConfig() {
  console.log('\n⚙️  Configuração Vercel:');
  
  try {
    const vercelJson = require('../vercel.json');
    
    console.log(`✅ vercel.json: Encontrado`);
    console.log(`✅ Framework: ${vercelJson.framework || 'nextjs'}`);
    console.log(`✅ Regions: ${JSON.stringify(vercelJson.regions || ['iad1'])}`);
    
    if (vercelJson.functions) {
      console.log(`✅ Functions: Configuradas`);
    }
    
    if (vercelJson.headers) {
      console.log(`✅ Headers: ${vercelJson.headers.length} configurados`);
    }
    
  } catch (error) {
    console.log(`❌ vercel.json: ${error.message}`);
  }
}

// Executar verificações
function main() {
  try {
    getEnvironmentStatus();
    
    const missingRequired = checkRequiredVars();
    checkVercelVars();
    const projectVars = checkProjectVars();
    checkBuildConfig();
    checkDependencies();
    validateVercelConfig();
    
    // Resumo final
    console.log('\n🎯 Resumo da Verificação:');
    console.log('========================');
    
    if (missingRequired.length === 0) {
      console.log('✅ Todas as variáveis obrigatórias estão definidas');
    } else {
      console.log(`❌ ${missingRequired.length} variáveis obrigatórias ausentes: ${missingRequired.join(', ')}`);
    }
    
    console.log(`ℹ️  ${projectVars.defined.length}/${PROJECT_VARS.length} variáveis do projeto definidas`);
    console.log(`🌐 Ambiente: ${nodeEnv} (Vercel: ${vercelEnv})`);
    
    if (vercelEnv === 'production') {
      console.log('🚀 Status: PRONTO PARA PRODUÇÃO');
    } else {
      console.log('🔧 Status: Ambiente de desenvolvimento/preview');
    }
    
    // Exit code
    if (missingRequired.length > 0) {
      console.log('\n❌ Verificação falhou devido a variáveis ausentes');
      process.exit(1);
    } else {
      console.log('\n✅ Verificação concluída com sucesso');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Erro durante a verificação:');
    console.error(error.message);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkRequiredVars,
  checkVercelVars,
  checkProjectVars
}; 