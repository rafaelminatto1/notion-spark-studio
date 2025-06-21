'use client';

import React, { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AuthProvider } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { FileItem } from '@/types';

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    // Simular carregamento de dados
    const loadUserData = async () => {
      setLoading(true);
      
      // Verificar se há dados salvos localmente (simulação)
      const savedAuth = localStorage.getItem('spark_auth');
      const savedFiles = localStorage.getItem('spark_files');
      const savedFavorites = localStorage.getItem('spark_favorites');

      if (savedAuth) {
        setIsAuthenticated(true);
        
        if (savedFiles) {
          try {
            setFiles(JSON.parse(savedFiles));
          } catch (error) {
            console.error('Error parsing saved files:', error);
          }
        }
        
        if (savedFavorites) {
          try {
            setFavorites(JSON.parse(savedFavorites));
          } catch (error) {
            console.error('Error parsing saved favorites:', error);
          }
        }
      } else {
        setIsAuthenticated(false);
      }
      
      setLoading(false);
    };

    loadUserData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoginLoading(true);
      
      // Simulação de login - em produção seria uma chamada real à API
      if (email && password) {
        localStorage.setItem('spark_auth', JSON.stringify({
          user: {
            email: email,
            name: email.split('@')[0],
            id: 'user_' + Date.now()
          },
          token: 'fake_token_' + Date.now()
        }));
        
        setIsAuthenticated(true);
        
        // Dados de exemplo
        const exampleFiles: FileItem[] = [
          {
            id: 'file_1',
            name: 'Bem-vindo ao Notion Spark Studio',
            type: 'file',
            emoji: '👋',
            tags: ['introdução', 'guia'],
            createdAt: new Date(),
            updatedAt: new Date(),
            content: 'Conteúdo de exemplo...'
          },
          {
            id: 'file_2',
            name: 'Minhas Tarefas',
            type: 'file',
            emoji: '✅',
            tags: ['produtividade', 'tarefas'],
            createdAt: new Date(),
            updatedAt: new Date(),
            content: 'Lista de tarefas...'
          }
        ];
        
        setFiles(exampleFiles);
        localStorage.setItem('spark_files', JSON.stringify(exampleFiles));
      } else {
        alert('Por favor, preencha email e senha');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro no login. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('spark_auth');
    localStorage.removeItem('spark_files');
    localStorage.removeItem('spark_favorites');
    setIsAuthenticated(false);
    setFiles([]);
    setFavorites([]);
  };

  const handleNavigateToFile = (fileId: string) => {
    console.log('Navegando para arquivo:', fileId);
    // Implementar navegação para arquivo específico
  };

  const handleCreateFile = (name: string) => {
    const newFile: FileItem = {
      id: 'file_' + Date.now(),
      name,
      type: 'file',
      emoji: '📄',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      content: ''
    };
    
    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    localStorage.setItem('spark_files', JSON.stringify(updatedFiles));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Notion Spark Studio
            </h1>
            <p className="text-gray-600">
              Plataforma de Templates e Produtividade
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loginLoading}
            >
              {loginLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Demo: Use qualquer email e senha para entrar
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Notion Spark Studio
                </h1>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  v2.0
                </span>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {JSON.parse(localStorage.getItem('spark_auth') || '{}').user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard */}
        <main>
          <Dashboard
            files={files}
            favorites={favorites}
            onNavigateToFile={handleNavigateToFile}
            onCreateFile={handleCreateFile}
          />
        </main>
      </div>
    </AuthProvider>
  );
}