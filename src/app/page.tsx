'use client';

import React from 'react';

// Versão: 2.2 - LOGIN CORRIGIDO - CACHE QUEBRADO
export default function HomePage() {
  const [demoMode, setDemoMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  // IMPORTANTE: Esta página foi corrigida para ter email/senha + demo
  console.log('PÁGINA CORRIGIDA CARREGADA - Versão 2.2');

  // Se estiver em modo demo, mostrar dashboard
  if (demoMode) {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: '0' }}>Notion Spark Studio</h1>
              <p style={{ color: '#6b7280', margin: '4px 0 0 0' }}>v2.2 - LOGIN CORRIGIDO - Modo Demonstração</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>demo@exemplo.com</span>
              <button 
                onClick={() => setDemoMode(false)}
                style={{ 
                  padding: '8px 16px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                Sair
              </button>
            </div>
          </header>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 8px 0' }}>📋 Projetos</h3>
              <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>Gerencie seus projetos</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>3 projetos ativos</p>
            </div>
            
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 8px 0' }}>📊 Analytics</h3>
              <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>Métricas e relatórios</p>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>Performance: 98%</p>
            </div>
            
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', margin: '0 0 8px 0' }}>🚀 Sistema</h3>
              <p style={{ color: '#6b7280', margin: '0 0 16px 0' }}>Status do sistema</p>
              <p style={{ fontSize: '14px', color: '#16a34a', margin: '0' }}>✅ Todos os sistemas funcionando</p>
            </div>
          </div>
          
          <div style={{ marginTop: '32px', padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
            <h3 style={{ fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>🎮 Modo Demonstração Ativo</h3>
            <p style={{ fontSize: '14px', color: '#1e40af', margin: '0' }}>
              Você está visualizando uma versão demo do Notion Spark Studio. 
              Todas as funcionalidades estão simuladas para demonstração.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de login CORRIGIDA com email/senha + demo
  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#f9fafb' 
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '450px', 
        background: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: '0 0 8px 0' }}>
            Bem-vindo ao Notion Spark Studio
          </h1>
          <p style={{ color: '#6b7280', margin: '0' }}>
            v2.2 - LOGIN CORRIGIDO - Email/Senha + Demo
          </p>
        </div>
        
        <div style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
          <p style={{ margin: '4px 0' }}>✨ Monitor de Performance em Tempo Real</p>
          <p style={{ margin: '4px 0' }}>📋 Gerenciamento de Tarefas Inteligente</p>
          <p style={{ margin: '4px 0' }}>🚀 Interface Moderna e Responsiva</p>
        </div>
        
        {/* Formulário de Login CORRIGIDO */}
        <form onSubmit={(e) => {
          e.preventDefault();
          if (email && password) {
            alert('✅ LOGIN FUNCIONANDO! Email/Senha OK - Entrando no demo...');
            setDemoMode(true);
          } else {
            alert('❌ Por favor, digite email e senha!');
          }
        }} style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Email (digite qualquer email)
            </label>
            <input
              type="email"
              placeholder="teste@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #2563eb', 
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
              Senha (digite qualquer senha)
            </label>
            <input
              type="password"
              placeholder="123456"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '2px solid #2563eb', 
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>
          <button 
            type="submit"
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ✅ ENTRAR COM EMAIL E SENHA
          </button>
        </form>
        
        <div style={{ textAlign: 'center', margin: '24px 0', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '1px', background: '#e5e7eb' }}></div>
          <span style={{ background: 'white', padding: '0 16px', fontSize: '12px', color: '#6b7280' }}>OU</span>
        </div>
        
        <button 
          onClick={() => {
            alert('🎯 Login com Google simulado! Entrando no demo...');
            setDemoMode(true);
          }}
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: 'white', 
            color: '#374151', 
            border: '1px solid #d1d5db', 
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          Entrar com Google
        </button>
        
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7280', marginBottom: '16px' }}>
          Ou continue sem fazer login para testar as funcionalidades
        </div>
        
        <button 
          onClick={() => {
            console.log('🚀 Ativando modo demonstração direto');
            setDemoMode(true);
          }}
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: '#16a34a', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          🎮 DEMO DIRETO (Sem Login)
        </button>
      </div>
    </div>
  );
}
