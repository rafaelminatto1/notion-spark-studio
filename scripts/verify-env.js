// Script para verificar variáveis de ambiente necessárias
const fs = require('fs');
const path = require('path');

// Variáveis de ambiente obrigatórias
const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_BASE_URL',
  'VITE_WS_URL'
];

// Verificar se estamos em produção
const isProduction = process.env.NODE_ENV === 'production';

// Carregar variáveis de ambiente do arquivo .env
function loadEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          envVars[key.trim()] = value.trim();
        }
      });
      
      return envVars;
    }
  } catch (error) {
    console.error('Erro ao carregar arquivo .env:', error);
  }
  
  return {};
}

// Verificar variáveis de ambiente
function verifyEnvVars() {
  const envVars = loadEnvFile();
  const missingVars = [];
  
  requiredEnvVars.forEach(varName => {
    if (!process.env[varName] && !envVars[varName]) {
      missingVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    console.error('❌ Variáveis de ambiente obrigatórias não encontradas:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    
    if (isProduction) {
      console.error('\n⚠️ ERRO: Variáveis de ambiente obrigatórias não configuradas no Vercel.');
      console.error('Por favor, configure as variáveis no painel do Vercel antes de fazer deploy.');
      process.exit(1);
    } else {
      console.warn('\n⚠️ AVISO: Variáveis de ambiente não encontradas. A aplicação pode não funcionar corretamente.');
    }
  } else {
    console.log('✅ Todas as variáveis de ambiente necessárias estão configuradas.');
  }
}

// Executar verificação
verifyEnvVars(); 