import dotenv from 'dotenv';
dotenv.config();

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_QI9G0ExBaH5XjbXnRlphjSQo8xTz';
const BASE_URL = 'https://api.vercel.com';

async function monitorDeployment() {
  console.log('\n🔍 MONITORAMENTO DE DEPLOYMENT VERCEL');
  console.log('=====================================\n');
  
  try {
    // Verificar deployments ativos
    const response = await fetch(`${BASE_URL}/v6/deployments?projectId=${PROJECT_ID}&limit=10`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.deployments && data.deployments.length > 0) {
      console.log('📋 DEPLOYMENTS RECENTES:\n');
      
      data.deployments.forEach((deployment, index) => {
        const status = deployment.state;
        const url = deployment.url;
        const created = new Date(deployment.createdAt).toLocaleString('pt-BR');
        const statusIcon = getStatusIcon(status);
        
        console.log(`${statusIcon} #${index + 1} - ${status.toUpperCase()}`);
        console.log(`   🌐 URL: https://${url}`);
        console.log(`   📅 Criado: ${created}`);
        console.log(`   🔗 ID: ${deployment.uid}\n`);
      });
      
      // Testar URL de produção
      const latestDeployment = data.deployments[0];
      if (latestDeployment.state === 'READY') {
        await testProductionUrl(latestDeployment.url);
      }
      
    } else {
      console.log('❌ Nenhum deployment encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro ao monitorar deployment:', error.message);
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'READY': return '✅';
    case 'BUILDING': return '🔨';
    case 'QUEUED': return '⏳';
    case 'ERROR': return '❌';
    case 'CANCELED': return '🚫';
    default: return '❓';
  }
}

async function testProductionUrl(url) {
  console.log('\n🧪 TESTANDO URL DE PRODUÇÃO');
  console.log('==============================\n');
  
  try {
    const testUrl = `https://${url}`;
    console.log(`🌐 Testando: ${testUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel Monitor Bot'
      }
    });
    
    console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Tempo de resposta: ${response.headers.get('x-vercel-cache') || 'N/A'}`);
    console.log(`🌍 Região: ${response.headers.get('x-vercel-id') || 'N/A'}`);
    
    if (response.ok) {
      console.log('✅ Site está funcionando corretamente!');
      
      // Verificar se é HTML válido
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const html = await response.text();
        if (html.includes('Notion Spark Studio')) {
          console.log('🎯 Conteúdo válido detectado - Notion Spark Studio carregado!');
        }
      }
    } else {
      console.log('⚠️ Site retornou erro HTTP');
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar URL:', error.message);
  }
}

// Executar monitoramento
monitorDeployment(); 