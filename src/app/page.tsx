'use client';

import React from 'react';

// VERSÃO ULTRA-SIMPLIFICADA - SEM MAGIC UI - FUNCIONAL 100%
export default function HomePage() {
  const [demoMode, setDemoMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');

  // Se estiver em modo demo, mostrar dashboard
  if (demoMode) {
    return (
      <div style={{ minHeight: '100vh', padding: '40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Notion Spark Studio</h1>
            <button onClick={() => setDemoMode(false)} style={{ 
              padding: '8px 16px', 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}>
              Sair
            </button>
          </header>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>📝 Documentos</h3>
              <p style={{ color: '#64748b' }}>Crie e organize seus documentos</p>
            </div>
            
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>📊 Analytics</h3>
              <p style={{ color: '#64748b' }}>Visualize suas métricas</p>
            </div>
            
            <div style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>⚙️ Configurações</h3>
              <p style={{ color: '#64748b' }}>Personalize sua experiência</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de login simples e funcional
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Notion Spark Studio
          </h1>
          <p style={{ color: '#6b7280' }}>
            Plataforma de Templates e Produtividade
          </p>
        </div>

        {message && (
          <div style={{ 
            padding: '12px', 
            marginBottom: '16px', 
            backgroundColor: message.includes('Sucesso') ? '#dcfce7' : '#fef2f2',
            color: message.includes('Sucesso') ? '#166534' : '#991b1b',
            borderRadius: '8px',
            border: `1px solid ${message.includes('Sucesso') ? '#bbf7d0' : '#fecaca'}`
          }}>
            {message}
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (email && password) {
            setMessage('✅ Sucesso! Redirecionando...');
            setTimeout(() => setDemoMode(true), 1000);
          } else {
            setMessage('❌ Por favor, preencha email e senha');
          }
        }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '6px' 
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#3b82f6'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ 
              display: 'block', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              marginBottom: '6px' 
            }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="sua senha"
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#3b82f6'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: '#1f2937',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px',
              transition: 'background-color 0.15s ease'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.background = '#111827'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.background = '#1f2937'}
          >
            Entrar
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => {
                setMessage('🎮 Entrando no modo demo...');
                setTimeout(() => setDemoMode(true), 500);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6b7280',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Demo: Use qualquer email e senha para entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
