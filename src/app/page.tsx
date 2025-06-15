'use client';

import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { TaskList } from '@/components/tasks/TaskList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigation } from './layout';
import { Button } from '@/components/ui/button';
import { PageLoader } from '@/components/LoadingSpinner';

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
  const { signInWithGoogle } = useSupabaseAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <PageLoader text="Verificando autenticação..." />;
  }

  // Se não estiver logado, mostrar tela de login
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-[400px]">
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
            <Button 
              className="w-full"
              onClick={() => signInWithGoogle()}
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
                // Simular login para demo
                console.log('Continuando sem login para demonstração');
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
            <Dashboard
              files={mockFiles}
              favorites={mockFavorites}
              onNavigateToFile={handleNavigateToFile}
              onCreateFile={handleCreateFile}
            />
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
                        onClick={() => setCurrentSection('performance')}
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
                onClick={() => setCurrentSection('dashboard')} 
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
} 