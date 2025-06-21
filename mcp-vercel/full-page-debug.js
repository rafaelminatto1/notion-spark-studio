import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const PRODUCTION_URL = 'https://notion-spark-studio-tii7.vercel.app';

async function captureFullPage() {
  console.log('\n🕵️ CAPTURA COMPLETA DA PÁGINA');
  console.log('===============================\n');
  
  try {
    const response = await fetch(PRODUCTION_URL);
    const html = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📏 Tamanho: ${html.length} caracteres`);
    
    // Salvar HTML completo em arquivo
    fs.writeFileSync('current-page.html', html);
    console.log('💾 HTML completo salvo em: current-page.html');
    
    // Extrair texto visível (removendo tags HTML)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    console.log('\n📄 CONTEÚDO TEXTUAL DA PÁGINA:');
    console.log('==============================');
    console.log(textContent.substring(0, 500) + '...');
    
    // Buscar por elementos específicos no HTML
    console.log('\n🔍 ANÁLISE DETALHADA:');
    console.log('=====================');
    
    const searches = [
      { term: 'Bem-vindo ao Notion Spark Studio', desc: 'Título principal' },
      { term: 'Entrar com Google', desc: 'Botão Google OAuth' },
      { term: 'Continuar sem Login', desc: 'Modo demo' },
      { term: 'type="email"', desc: 'Campo de email' },
      { term: 'type="password"', desc: 'Campo de senha' },
      { term: 'rafael.minatto@yahoo.com.br', desc: 'Email no header' },
      { term: 'v2.0', desc: 'Versão do app' },
      { term: 'Sair', desc: 'Botão sair' }
    ];
    
    searches.forEach(search => {
      const found = html.toLowerCase().includes(search.term.toLowerCase());
      const icon = found ? '✅' : '❌';
      console.log(`${icon} ${search.desc}: "${search.term}"`);
    });
    
    // Verificar se há indicação de usuário logado
    console.log('\n👤 VERIFICAÇÃO DE ESTADO DE LOGIN:');
    console.log('==================================');
    
    if (html.includes('rafael.minatto@yahoo.com.br') && html.includes('Sair')) {
      console.log('✅ USUÁRIO LOGADO DETECTADO');
      console.log('🎯 A página está mostrando o estado pós-login');
      console.log('📧 Email: rafael.minatto@yahoo.com.br');
    } else if (html.includes('Entrar com Google')) {
      console.log('❌ PÁGINA DE LOGIN DETECTADA');
      console.log('🔐 Usuário não está logado');
    } else {
      console.log('❓ ESTADO INDETERMINADO');
      console.log('🤔 Não foi possível determinar o estado');
    }
    
    // Verificar se é uma página diferente
    console.log('\n🧭 VERIFICAÇÃO DE PÁGINA:');
    console.log('=========================');
    
    if (html.includes('dashboard') || html.includes('Dashboard')) {
      console.log('📊 DASHBOARD DETECTADO');
    } else if (html.includes('login') || html.includes('Login')) {
      console.log('🔐 PÁGINA DE LOGIN DETECTADA');
    } else if (html.includes('home') || html.includes('Home')) {
      console.log('🏠 PÁGINA HOME DETECTADA');
    } else {
      console.log('❓ PÁGINA DESCONHECIDA');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

captureFullPage(); 