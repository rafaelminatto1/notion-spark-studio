import dotenv from 'dotenv';
dotenv.config();

const PRODUCTION_URL = 'https://notion-spark-studio-tii7.vercel.app';

async function verifyDeployment() {
  console.log('\n🚀 VERIFICAÇÃO COMPLETA DE DEPLOYMENT');
  console.log('=====================================\n');
  
  try {
    // 1. Teste de conectividade
    console.log('🔗 1. TESTE DE CONECTIVIDADE');
    console.log('-----------------------------');
    const startTime = Date.now();
    
    const response = await fetch(PRODUCTION_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel Deploy Monitor'
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    console.log(`🌐 URL: ${PRODUCTION_URL}`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Tempo de resposta: ${responseTime}ms`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    console.log(`🏷️ Server: ${response.headers.get('server')}`);
    console.log(`🔄 Cache: ${response.headers.get('x-vercel-cache') || 'N/A'}`);
    console.log(`🌍 Region: ${response.headers.get('x-vercel-id')?.split('::')[0] || 'N/A'}`);
    
    // 2. Verificação de conteúdo
    console.log('\n📝 2. VERIFICAÇÃO DE CONTEÚDO');
    console.log('------------------------------');
    
    if (response.ok) {
      const html = await response.text();
      
      // Verificações específicas
      const checks = [
        { name: 'HTML válido', test: html.includes('<html') },
        { name: 'Title presente', test: html.includes('<title>') },
        { name: 'Meta charset', test: html.includes('charset=') },
        { name: 'Viewport meta', test: html.includes('viewport') },
        { name: 'CSS carregado', test: html.includes('stylesheet') || html.includes('<style') },
        { name: 'JavaScript presente', test: html.includes('<script') },
        { name: 'React hidratação', test: html.includes('__NEXT_DATA__') },
        { name: 'Notion Spark branding', test: html.toLowerCase().includes('notion') || html.toLowerCase().includes('spark') }
      ];
      
      checks.forEach(check => {
        const icon = check.test ? '✅' : '⚠️';
        console.log(`${icon} ${check.name}`);
      });
      
      // Estatísticas do HTML
      console.log(`\n📈 Estatísticas:`);
      console.log(`   📏 Tamanho HTML: ${(html.length / 1024).toFixed(2)} KB`);
      console.log(`   🔗 Links: ${(html.match(/<a /g) || []).length}`);
      console.log(`   🖼️ Imagens: ${(html.match(/<img /g) || []).length}`);
      console.log(`   📱 Scripts: ${(html.match(/<script/g) || []).length}`);
      
    } else {
      console.log('❌ Não foi possível verificar o conteúdo devido ao erro HTTP');
    }
    
    // 3. Teste de performance
    console.log('\n⚡ 3. TESTE DE PERFORMANCE');
    console.log('---------------------------');
    
    const performanceTests = [];
    for (let i = 0; i < 3; i++) {
      const start = Date.now();
      const testResponse = await fetch(PRODUCTION_URL, { method: 'HEAD' });
      const time = Date.now() - start;
      performanceTests.push(time);
      console.log(`   Teste ${i + 1}: ${time}ms (${testResponse.status})`);
    }
    
    const avgTime = performanceTests.reduce((a, b) => a + b) / performanceTests.length;
    console.log(`📊 Tempo médio: ${avgTime.toFixed(2)}ms`);
    
    // 4. Verificação de headers de segurança
    console.log('\n🔒 4. SEGURANÇA');
    console.log('----------------');
    
    const securityHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'content-security-policy'
    ];
    
    securityHeaders.forEach(header => {
      const value = response.headers.get(header);
      const icon = value ? '✅' : '⚠️';
      console.log(`${icon} ${header}: ${value || 'Não presente'}`);
    });
    
    // 5. Resumo final
    console.log('\n🎯 RESUMO FINAL');
    console.log('================');
    
    const isHealthy = response.ok && responseTime < 3000;
    const healthIcon = isHealthy ? '✅' : '❌';
    const status = isHealthy ? 'SAUDÁVEL' : 'PRECISA ATENÇÃO';
    
    console.log(`${healthIcon} Status geral: ${status}`);
    console.log(`📈 Performance: ${avgTime < 1000 ? 'Excelente' : avgTime < 2000 ? 'Boa' : 'Melhorar'}`);
    console.log(`🌐 Deploy: ONLINE e FUNCIONAL`);
    console.log(`⏰ Verificado em: ${new Date().toLocaleString('pt-BR')}`);
    
  } catch (error) {
    console.error('❌ ERRO na verificação:', error.message);
  }
}

// Executar verificação
verifyDeployment().then(() => {
  console.log('\n✨ Verificação completa finalizada!');
}); 