#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build otimizado para Vercel...\n');

// Configurar ambiente de produção
process.env.NODE_ENV = 'production';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Funções utilitárias
function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} - Concluído\n`);
  } catch (error) {
    console.error(`❌ ${description} - Falhou:`);
    console.error(error.message);
    process.exit(1);
  }
}

function checkEnvironment() {
  console.log('🔍 Verificando ambiente de produção...');
  
  const requiredVars = [
    'VERCEL',
    'VERCEL_ENV',
    'VERCEL_URL'
  ];

  const isVercel = requiredVars.some(varName => process.env[varName]);
  
  if (!isVercel) {
    console.warn('⚠️ Não detectado ambiente Vercel. Continuando com configuração local...');
  } else {
    console.log('✅ Ambiente Vercel detectado');
    console.log(`   • VERCEL_ENV: ${process.env.VERCEL_ENV}`);
    console.log(`   • VERCEL_URL: ${process.env.VERCEL_URL}`);
  }
  console.log('');
}

function optimizeForProduction() {
  console.log('⚡ Aplicando otimizações de produção...');
  
  // Configurar Next.js para produção
  const nextConfigPath = path.resolve(process.cwd(), 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    console.log('   • Next.js config encontrado');
  }

  // Limpar cache anterior
  const cacheDirs = ['.next', 'out', 'coverage', '.vercel'];
  cacheDirs.forEach(dir => {
    const dirPath = path.resolve(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`   • Limpando cache: ${dir}`);
      try {
        execSync(`rm -rf ${dir}`, { stdio: 'pipe' });
      } catch (error) {
        // Ignorar erros de limpeza
      }
    }
  });

  console.log('✅ Otimizações aplicadas\n');
}

function validateBuild() {
  console.log('🔎 Validando build...');
  
  const buildPath = path.resolve(process.cwd(), '.next');
  if (!fs.existsSync(buildPath)) {
    throw new Error('Build não encontrado');
  }

  const staticPath = path.resolve(buildPath, 'static');
  if (!fs.existsSync(staticPath)) {
    throw new Error('Arquivos estáticos não encontrados');
  }

  console.log('✅ Build validado com sucesso\n');
}

function generateBuildInfo() {
  console.log('📊 Gerando informações do build...');
  
  const buildInfo = {
    timestamp: new Date().toISOString(),
    environment: 'production',
    vercel: {
      env: process.env.VERCEL_ENV,
      url: process.env.VERCEL_URL,
      gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
      gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE,
      gitCommitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME,
    },
    nodejs: process.version,
    npm: execSync('npm --version', { encoding: 'utf-8' }).trim(),
  };

  const buildInfoPath = path.resolve(process.cwd(), 'public', 'build-info.json');
  fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));
  
  console.log('✅ Build info gerado em /public/build-info.json\n');
}

// Executar pipeline de build
async function main() {
  try {
    checkEnvironment();
    optimizeForProduction();
    
    // Pipeline de validação e build
    runCommand('npm run type-check:strict', 'Verificação de tipos TypeScript');
    runCommand('npm run lint:vercel', 'Validação ESLint para produção');
    runCommand('npm run test:production', 'Testes para produção');
    
    // Build Next.js
    runCommand('next build', 'Build Next.js para produção');
    
    validateBuild();
    generateBuildInfo();
    
    console.log('🎉 Build para Vercel concluído com sucesso!');
    console.log('📈 Pronto para deploy em produção\n');
    
  } catch (error) {
    console.error('💥 Erro durante o build:');
    console.error(error.message);
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main }; 