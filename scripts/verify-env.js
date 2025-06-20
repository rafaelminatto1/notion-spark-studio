#!/usr/bin/env node

// Script otimizado para verificação de ambiente Vercel
const fs = require('fs');
const path = require('path');

// Variáveis obrigatórias para produção Vercel
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_BASE_URL',
  'VITE_WS_URL'
];

// Variáveis opcionais mas recomendadas
const optionalEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'VERCEL_URL',
  'VERCEL_GIT_COMMIT_SHA'
];

function getEnvironmentInfo() {
  const isVercel = !!process.env.VERCEL;
  const vercelEnv = process.env.VERCEL_ENV || 'unknown';
  const nodeEnv = process.env.NODE_ENV || 'unknown';
  
  return {
    isVercel,
    vercelEnv,
    nodeEnv,
    isProduction: nodeEnv === 'production' || vercelEnv === 'production',
    isPreview: vercelEnv === 'preview',
    isDevelopment: nodeEnv === 'development' || vercelEnv === 'development'
  };
}

function checkRequiredVars(envInfo) {
  console.log('🔍 Verificando variáveis de ambiente obrigatórias...\n');
  
  const missingVars = [];
  const presentVars = [];
  
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      presentVars.push(varName);
      console.log(`✅ ${varName}: Configurada`);
    } else {
      missingVars.push(varName);
      console.log(`❌ ${varName}: Não encontrada`);
    }
  });
  
  console.log('');
  
  if (missingVars.length > 0) {
    console.error('💥 ERRO: Variáveis de ambiente obrigatórias não encontradas:');
    missingVars.forEach(varName => {
      console.error(`   • ${varName}`);
    });
    
    if (envInfo.isProduction) {
      console.error('\n🚨 FALHA CRÍTICA: Deploy em produção bloqueado!');
      console.error('Configure as variáveis no painel do Vercel:');
      console.error('https://vercel.com/dashboard/project/settings/environment-variables');
      process.exit(1);
    } else {
      console.warn('\n⚠️ AVISO: Variáveis não configuradas. App pode não funcionar corretamente.');
    }
  } else {
    console.log('✅ Todas as variáveis obrigatórias estão configuradas!');
  }
  
  return { missingVars, presentVars };
}

function checkOptionalVars() {
  console.log('\n🔧 Verificando variáveis opcionais...\n');
  
  optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configurada`);
    } else {
      console.log(`⚪ ${varName}: Não configurada (opcional)`);
    }
  });
}

function displayEnvironmentSummary(envInfo) {
  console.log('\n📊 RESUMO DO AMBIENTE:\n');
  console.log(`🌍 Ambiente: ${envInfo.vercelEnv}`);
  console.log(`🏗️ Node.js: ${envInfo.nodeEnv}`);
  console.log(`☁️ Vercel: ${envInfo.isVercel ? 'Sim' : 'Não'}`);
  console.log(`🚀 Produção: ${envInfo.isProduction ? 'Sim' : 'Não'}`);
  console.log(`🔍 Preview: ${envInfo.isPreview ? 'Sim' : 'Não'}`);
  
  if (envInfo.isVercel) {
    console.log(`📝 URL: ${process.env.VERCEL_URL || 'N/A'}`);
    console.log(`🔗 Commit: ${process.env.VERCEL_GIT_COMMIT_SHA?.substring(0, 8) || 'N/A'}`);
  }
}

function validateVercelConfiguration(envInfo) {
  console.log('\n🔎 Validando configuração Vercel...\n');
  
  if (!envInfo.isVercel && envInfo.isProduction) {
    console.error('❌ ERRO: Produção deve ser executada na Vercel!');
    process.exit(1);
  }
  
  if (envInfo.isVercel) {
    console.log('✅ Configuração Vercel válida');
    
    // Verificar se estamos em build ou runtime
    if (process.env.VERCEL_ENV) {
      console.log(`✅ Ambiente Vercel: ${process.env.VERCEL_ENV}`);
    }
    
    // Verificar informações Git se disponíveis
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      console.log(`✅ Commit: ${process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 8)}`);
    }
  } else {
    console.log('⚪ Não executando na Vercel (desenvolvimento local)');
  }
}

function generateEnvReport(envInfo, varCheck) {
  const report = {
    timestamp: new Date().toISOString(),
    environment: envInfo,
    variables: {
      required: {
        total: requiredEnvVars.length,
        configured: varCheck.presentVars.length,
        missing: varCheck.missingVars.length,
        missingList: varCheck.missingVars
      }
    },
    validation: {
      isValid: varCheck.missingVars.length === 0,
      canDeploy: varCheck.missingVars.length === 0 || !envInfo.isProduction
    }
  };
  
  // Salvar relatório em desenvolvimento
  if (!envInfo.isProduction) {
    try {
      const reportPath = path.resolve(process.cwd(), '.vercel', 'env-report.json');
      const vercelDir = path.dirname(reportPath);
      
      if (!fs.existsSync(vercelDir)) {
        fs.mkdirSync(vercelDir, { recursive: true });
      }
      
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📊 Relatório salvo: .vercel/env-report.json`);
    } catch (error) {
      // Ignorar erros de salvamento
    }
  }
  
  return report;
}

// Função principal
function main() {
  console.log('🚀 VERIFICAÇÃO DE AMBIENTE PARA VERCEL\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    const envInfo = getEnvironmentInfo();
    displayEnvironmentSummary(envInfo);
    
    const varCheck = checkRequiredVars(envInfo);
    checkOptionalVars();
    validateVercelConfiguration(envInfo);
    
    const report = generateEnvReport(envInfo, varCheck);
    
    console.log('\n' + '=' .repeat(50));
    
    if (report.validation.isValid) {
      console.log('🎉 AMBIENTE VALIDADO COM SUCESSO!');
      console.log('✅ Pronto para deploy na Vercel');
    } else {
      if (envInfo.isProduction) {
        console.log('💥 VALIDAÇÃO FALHOU - DEPLOY BLOQUEADO');
        process.exit(1);
      } else {
        console.log('⚠️ VALIDAÇÃO COM AVISOS - VERIFICAR CONFIGURAÇÃO');
      }
    }
    
  } catch (error) {
    console.error('\n💥 ERRO DURANTE VERIFICAÇÃO:');
    console.error(error.message);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, getEnvironmentInfo, checkRequiredVars }; 