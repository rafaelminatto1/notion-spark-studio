import dotenv from 'dotenv';
dotenv.config();

const PRODUCTION_URL = 'https://notion-spark-studio-tii7.vercel.app';

async function debugContent() {
  console.log('\n🔍 DEBUG DO CONTEÚDO DA PÁGINA');
  console.log('===============================\n');
  
  try {
    const response = await fetch(PRODUCTION_URL);
    const html = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📏 Tamanho: ${html.length} caracteres`);
    console.log(`🏷️ Content-Type: ${response.headers.get('content-type')}`);
    
    // Mostrar primeiros 1000 caracteres
    console.log('\n📄 PRIMEIROS 1000 CARACTERES:');
    console.log('==============================');
    console.log(html.substring(0, 1000));
    console.log('...\n');
    
    // Procurar por elementos específicos
    console.log('🔍 BUSCA POR ELEMENTOS ESPECÍFICOS:');
    console.log('===================================');
    
    const searches = [
      'Bem-vindo ao Notion Spark Studio',
      'LoginForm',
      'signIn',
      'email',
      'password',
      'Google',
      'Demo',
      'Entrar',
      'form',
      'input',
      'button'
    ];
    
    searches.forEach(search => {
      const found = html.toLowerCase().includes(search.toLowerCase());
      const icon = found ? '✅' : '❌';
      console.log(`${icon} "${search}": ${found}`);
    });
    
    // Verificar se há JavaScript
    console.log('\n📱 ANÁLISE DE SCRIPTS:');
    console.log('======================');
    const scriptMatches = html.match(/<script[^>]*>(.*?)<\/script>/gs) || [];
    console.log(`Scripts encontrados: ${scriptMatches.length}`);
    
    // Verificar Next.js data
    if (html.includes('__NEXT_DATA__')) {
      console.log('✅ Next.js data encontrado');
    } else {
      console.log('❌ Next.js data não encontrado');
    }
    
    // Verificar se é página estática ou dinâmica
    if (html.includes('static') || response.headers.get('x-vercel-cache') === 'HIT') {
      console.log('📄 Página estática (cache HIT)');
    } else {
      console.log('🔄 Página dinâmica');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

debugContent(); 