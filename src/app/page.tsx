'use client';

import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { TaskList } from '@/components/tasks/TaskList';
import { SmartNotificationWidget } from '@/components/SmartNotificationWidget';
import { GlobalSystemStatus } from '@/components/GlobalSystemStatus';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FileItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigation } from './layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageLoader } from '@/components/LoadingSpinner';
import { 
  Activity, 
  Brain, 
  Zap, 
  Users, 
  TrendingUp,
  Monitor,
  Bell
} from 'lucide-react';

// Mock data para demonstração
const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'Projeto Principal',
    type: 'file',
    emoji: '📋',
    tags: ['trabalho', 'importante'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    content: 'Conteúdo do projeto principal...'
  },
  {
    id: '2',
    name: 'Ideias Criativas',
    type: 'file',
    emoji: '💡',
    tags: ['criatividade', 'brainstorm'],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
    content: 'Lista de ideias criativas...'
  },
  {
    id: '3',
    name: 'Reuniões',
    type: 'folder',
    emoji: '📁',
    tags: ['reuniões', 'trabalho'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-19'),
    content: ''
  }
];

const mockFavorites = ['1', '2'];

export default function HomePage() {
  const { currentSection, setCurrentSection } = useNavigation();
  const { user, loading } = useAuth();
  const { signInWithGoogle, signInWithEmail } = useSupabaseAuth();
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
      await signInWithEmail(email, password);
      console.log('Login realizado com sucesso!');
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro no login. Verifique suas credenciais.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <PageLoader text="Verificando autenticação..." />;
  }

  // Se não estiver logado e não estiver em modo demo, mostrar tela de login
  if (!user && !demoMode) {
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
              onClick={() => signInWithGoogle()}
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

  const handleNavigateToFile = (fileId: string) => {
    console.log('Navegando para arquivo:', fileId);
    // Implementar navegação para arquivo específico
  };

  const handleCreateFile = (name: string) => {
    console.log('Criando arquivo:', name);
    // Implementar criação de arquivo
  };

  const renderCurrentSection = () => {
    try {
      switch (currentSection) {
        case 'dashboard':
          return (
            <div className="container mx-auto p-6 space-y-6">
              {/* Header Section */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard Inteligente</h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Visão geral completa com IA e monitoramento em tempo real
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Brain className="w-3 h-3 mr-1" />
                    AI Ativo
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Activity className="w-3 h-3 mr-1" />
                    Tempo Real
                  </Badge>
                </div>
              </div>

              {/* Quick Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Performance</p>
                        <p className="text-2xl font-bold text-green-600">98%</p>
                      </div>
                      <Zap className="w-8 h-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Usuários Ativos</p>
                        <p className="text-2xl font-bold text-blue-600">145</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Insights de IA</p>
                        <p className="text-2xl font-bold text-purple-600">23</p>
                      </div>
                      <Brain className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Otimizações</p>
                        <p className="text-2xl font-bold text-orange-600">+15%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Dashboard */}
                <div className="lg:col-span-2">
                  <Dashboard
                    files={mockFiles}
                    favorites={mockFavorites}
                    onNavigateToFile={handleNavigateToFile}
                    onCreateFile={handleCreateFile}
                  />
                </div>
                
                {/* Right Column - Widgets */}
                <div className="space-y-6">
                  {/* Smart Notifications */}
                  <SmartNotificationWidget />
                  
                  {/* Quick Actions Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-blue-600" />
                        Ações Rápidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setCurrentSection('system-dashboard')}
                      >
                        <Monitor className="w-4 h-4 mr-2" />
                        System Dashboard
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setCurrentSection('performance')}
                      >
                        <Activity className="w-4 h-4 mr-2" />
                        Performance Monitor
                      </Button>
                      <Button 
                        className="w-full justify-start" 
                        variant="outline"
                        onClick={() => setCurrentSection('tasks')}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Gerenciar Tarefas
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          );
        
        case 'system-dashboard':
          return (
            <div className="container mx-auto p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">System Dashboard</h1>
                <p className="text-lg text-gray-600">
                  Monitoramento avançado de todos os sistemas com status em tempo real
                </p>
              </div>
              <GlobalSystemStatus />
            </div>
          );

        case 'tasks':
          return (
            <div className="container mx-auto p-6">
              <h1 className="text-3xl font-bold mb-6">Gerenciamento de Tarefas</h1>
              <TaskList />
            </div>
          );
        
        case 'performance':
          return (
            <div className="container mx-auto p-6">
              <h1 className="text-3xl font-bold mb-6">Monitor de Performance</h1>
              <PerformanceMonitor />
            </div>
          );
        
        case 'settings':
          return (
            <div className="container mx-auto p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações</CardTitle>
                  <CardDescription>
                    Personalize sua experiência no Notion Spark Studio
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Conta</h3>
                      <p className="text-sm text-gray-600">
                        Logado como: {user.user_metadata?.name || user.email}
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Preferências</h3>
                      <p className="text-sm text-gray-600">
                        Configurações de preferências em desenvolvimento...
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Performance</h3>
                      <p className="text-sm text-gray-600">
                        Acesse o monitor de performance para otimizar sua experiência.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => { setCurrentSection('performance'); }}
                      >
                        Abrir Monitor de Performance
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        
        default:
          return (
            <Dashboard
              files={mockFiles}
              favorites={mockFavorites}
              onNavigateToFile={handleNavigateToFile}
              onCreateFile={handleCreateFile}
            />
          );
      }
    } catch (error) {
      console.error('[HomePage] Erro ao renderizar seção:', error);
      return (
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-600">
                Erro ao carregar esta seção. Tente novamente.
              </p>
              <Button 
                onClick={() => { setCurrentSection('dashboard'); }} 
                className="mt-4"
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  };

  return (
    <div className="pt-4">
      {renderCurrentSection()}
    </div>
  );
} // Deploy trigger: 06/21/2025 00:25:46
