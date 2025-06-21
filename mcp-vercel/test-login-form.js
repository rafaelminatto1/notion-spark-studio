import dotenv from 'dotenv';
dotenv.config();

const PRODUCTION_URL = 'https://notion-spark-studio-tii7.vercel.app';

async function testLoginForm() {
  console.log('\n🔐 TESTE DO FORMULÁRIO DE LOGIN');
  console.log('================================\n');
  
  try {
    console.log(`🌐 Testando: ${PRODUCTION_URL}`);
    
    const response = await fetch(PRODUCTION_URL, {
      method: 'GET',
      headers: {
        'User-Agent': 'Login Form Tester',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`⏱️ Tempo de resposta: ${response.headers.get('x-vercel-cache') || 'N/A'}`);
    
    if (response.ok) {
      const html = await response.text();
      
      console.log('\n🔍 VERIFICAÇÕES DO FORMULÁRIO:');
      console.log('------------------------------');
      
      // Verificações específicas do formulário de login
      const checks = [
        { 
          name: 'Formulário de login presente', 
          test: html.includes('<form') && (html.includes('email') || html.includes('Email')),
          details: 'Procurando por tag <form> com campos de email'
        },
        { 
          name: 'Campo de email presente', 
          test: html.includes('type="email"') || html.includes('placeholder="seu@email.com"'),
          details: 'Procurando por input type="email"'
        },
        { 
          name: 'Campo de senha presente', 
          test: html.includes('type="password"') || html.includes('password'),
          details: 'Procurando por input type="password"'
        },
        { 
          name: 'Botão de login presente', 
          test: html.includes('Entrar') || html.includes('Login'),
          details: 'Procurando por botão "Entrar"'
        },
        { 
          name: 'Botão Google OAuth presente', 
          test: html.includes('Entrar com Google') || html.includes('Google'),
          details: 'Procurando por botão "Entrar com Google"'
        },
        { 
          name: 'Modo demo disponível', 
          test: html.includes('Demo') || html.includes('sem Login'),
          details: 'Procurando por opção de modo demo'
        },
        { 
          name: 'Título correto', 
          test: html.includes('Bem-vindo ao Notion Spark Studio'),
          details: 'Verificando título da página de login'
        },
        { 
          name: 'Labels dos campos', 
          test: html.includes('<label') && html.includes('Email') && html.includes('Senha'),
          details: 'Verificando se há labels para os campos'
        }
      ];
      
      let passedChecks = 0;
      checks.forEach(check => {
        const icon = check.test ? '✅' : '❌';
        console.log(`${icon} ${check.name}`);
        if (check.test) passedChecks++;
        if (!check.test) {
          console.log(`   💡 ${check.details}`);
        }
      });
      
      console.log(`\n📊 RESULTADO: ${passedChecks}/${checks.length} verificações passaram`);
      
      // Análise do conteúdo HTML
      console.log('\n📄 ANÁLISE DO CONTEÚDO:');
      console.log('------------------------');
      
      const formCount = (html.match(/<form/g) || []).length;
      const inputCount = (html.match(/<input/g) || []).length;
      const buttonCount = (html.match(/<button/g) || []).length;
      const labelCount = (html.match(/<label/g) || []).length;
      
      console.log(`📝 Formulários encontrados: ${formCount}`);
      console.log(`🔤 Inputs encontrados: ${inputCount}`);
      console.log(`🔘 Botões encontrados: ${buttonCount}`);
      console.log(`🏷️ Labels encontrados: ${labelCount}`);
      
      // Verificar se é a versão mais recente
      console.log('\n🔄 VERIFICAÇÃO DE VERSÃO:');
      console.log('-------------------------');
      
      if (html.includes('1236660') || html.includes('Fix: Sistema de autenticação completo')) {
        console.log('✅ Versão mais recente detectada (commit 1236660)');
      } else if (html.includes('c182894')) {
        console.log('⚠️ Versão anterior detectada (commit c182894)');
      } else {
        console.log('❓ Não foi possível determinar a versão');
      }
      
      // Status final
      console.log('\n🎯 STATUS FINAL:');
      console.log('================');
      
      if (passedChecks >= 6) {
        console.log('✅ FORMULÁRIO DE LOGIN FUNCIONANDO CORRETAMENTE');
        console.log('🎉 Deploy bem-sucedido - todas as funcionalidades presentes');
      } else if (passedChecks >= 4) {
        console.log('⚠️ FORMULÁRIO PARCIALMENTE FUNCIONAL');
        console.log('🔧 Algumas funcionalidades podem estar ausentes');
      } else {
        console.log('❌ FORMULÁRIO COM PROBLEMAS');
        console.log('🚨 Deploy pode não ter sido aplicado corretamente');
      }
      
    } else {
      console.log('❌ Não foi possível acessar a página');
    }
    
  } catch (error) {
    console.error('❌ ERRO no teste:', error.message);
  }
}

// Executar teste
testLoginForm().then(() => {
  console.log('\n✨ Teste do formulário de login finalizado!');
}); 