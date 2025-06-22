#!/usr/bin/env node

const https = require('https');

console.log('🔧 INVALIDAÇÃO FORÇADA DE CACHE VERCEL');
console.log('=====================================');

// URLs para testar
const urls = [
  'https://notion-spark-studio-tii7.vercel.app',
  'https://notion-spark-studio-tii7-h0yp99us3-rafael-minattos-projects.vercel.app'
];

async function testUrl(url) {
  return new Promise((resolve) => {
    const options = {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'Cache-Buster/1.0'
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasNewVersion = data.includes('VERSÃO 2.3 CARREGADA') || 
                             data.includes('LOGIN FUNCIONANDO') ||
                             data.includes('gradient');
        
        console.log(`\n🌐 URL: ${url}`);
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`🔄 Cache: ${res.headers['x-vercel-cache'] || 'Unknown'}`);
        console.log(`📏 Size: ${data.length} bytes`);
        console.log(`✅ Nova versão: ${hasNewVersion ? 'SIM' : 'NÃO'}`);
        
        if (hasNewVersion) {
          console.log('🎉 SUCESSO! Nova versão detectada!');
        }
        
        resolve({ url, status: res.statusCode, hasNewVersion, size: data.length });
      });
    });

    req.on('error', (err) => {
      console.log(`❌ Erro: ${url} - ${err.message}`);
      resolve({ url, error: err.message });
    });

    req.setTimeout(10000, () => {
      console.log(`⏰ Timeout: ${url}`);
      req.destroy();
      resolve({ url, error: 'timeout' });
    });

    req.end();
  });
}

async function main() {
  console.log('\n🚀 Testando URLs...');
  
  for (const url of urls) {
    await testUrl(url);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Aguarde 2-3 minutos para propagação completa');
  console.log('2. Teste no navegador incógnito');
  console.log('3. Use Ctrl+F5 para hard refresh');
  console.log('4. Verifique console logs para "VERSÃO 2.3"');
}

main().catch(console.error); 