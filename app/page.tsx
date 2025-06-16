'use client';

import React from 'react';
import { Dashboard } from '@/components/Dashboard';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { TaskList } from '@/components/tasks/TaskList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
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
            <CardTitle className="text-2xl">Notion Spark Studio</CardTitle>
            <CardDescription>
              Faça login para acessar sua aplicação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-gray-600 space-y-1">
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

  // Se estiver logado, ir direto para o dashboard
  return (
    <div className="pt-4">
      <Dashboard
        files={mockFiles}
        favorites={mockFavorites}
        onNavigateToFile={handleNavigateToFile}
        onCreateFile={handleCreateFile}
      />
    </div>
  );
}