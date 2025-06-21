'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function HomePage() {
  const [demoMode, setDemoMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  // Função para fazer login com email e senha
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoggingIn(true);
    try {
      // Simular login
      console.log('Login realizado com sucesso!');
      alert('Login simulado com sucesso! (Demo)');
      setDemoMode(true);
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro no login. Verifique suas credenciais.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Função para login com Google (simulado)
  const handleGoogleLogin = () => {
    console.log('Login com Google simulado');
    alert('Login com Google simulado! (Demo)');
    setDemoMode(true);
  };

  // Se estiver em modo demo, mostrar dashboard simples
  if (demoMode) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notion Spark Studio</h1>
              <p className="text-gray-600">v2.0 - Modo Demonstração</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">demo@exemplo.com</span>
              <Button 
                variant="outline" 
                onClick={() => setDemoMode(false)}
              >
                Sair
              </Button>
            </div>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>📋 Projetos</CardTitle>
                <CardDescription>Gerencie seus projetos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">3 projetos ativos</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>📊 Analytics</CardTitle>
                <CardDescription>Métricas e relatórios</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Performance: 98%</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>🚀 Sistema</CardTitle>
                <CardDescription>Status do sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-600">✅ Todos os sistemas funcionando</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🎮 Modo Demonstração Ativo</h3>
            <p className="text-sm text-blue-700">
              Você está visualizando uma versão demo do Notion Spark Studio. 
              Todas as funcionalidades estão simuladas para demonstração.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de login
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-[450px] max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bem-vindo ao Notion Spark Studio</CardTitle>
          <CardDescription>
            Uma plataforma moderna para produtividade e colaboração
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p>✨ Monitor de Performance em Tempo Real</p>
            <p>📋 Gerenciamento de Tarefas Inteligente</p>
            <p>🚀 Interface Moderna e Responsiva</p>
          </div>
          
          {/* Formulário de Login */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
              size="lg"
            >
              {isLoggingIn ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>
          
          <Button 
            className="w-full"
            onClick={handleGoogleLogin}
            variant="outline"
            size="lg"
          >
            Entrar com Google
          </Button>
          
          <div className="text-center text-xs text-gray-500">
            Ou continue sem fazer login para testar as funcionalidades
          </div>
          <Button 
            variant="outline"
            className="w-full"
            onClick={() => {
              console.log('Ativando modo demonstração');
              setDemoMode(true);
            }}
          >
            Continuar sem Login (Demo)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
