'use client';

import React, { useState, useEffect } from 'react';
import { Dashboard } from '@/components/Dashboard';
import { LoadingSpinner } from '@/components/LoadingSpinner';

import type { FileItem } from '@/types';

export default function HomePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados automaticamente sem necessidade de login
    const loadUserData = async () => {
      setLoading(true);
      
      // Verificar se há dados salvos localmente
      const savedFiles = localStorage.getItem('spark_files');
      const savedFavorites = localStorage.getItem('spark_favorites');

      if (savedFiles) {
        try {
          const parsedFiles = JSON.parse(savedFiles);
          // Converter strings de data de volta para objetos Date
          const filesWithDates = parsedFiles.map((file: FileItem) => ({
            ...file,
            createdAt: file.createdAt ? new Date(file.createdAt) : new Date(),
            updatedAt: file.updatedAt ? new Date(file.updatedAt) : new Date()
          }));
          setFiles(filesWithDates);
        } catch (error) {
          console.error('Error parsing saved files:', error);
        }
      } else {
        // Criar dados de exemplo na primeira visita
        const exampleFiles: FileItem[] = [
          {
            id: 'file_1',
            name: 'Bem-vindo ao Notion Spark Studio',
            type: 'file',
            emoji: '👋',
            tags: ['introdução', 'guia'],
            createdAt: new Date(),
            updatedAt: new Date(),
            content: 'Bem-vindo ao seu workspace! Aqui você pode organizar suas ideias, projetos e tarefas.'
          },
          {
            id: 'file_2',
            name: 'Minhas Tarefas',
            type: 'file',
            emoji: '✅',
            tags: ['produtividade', 'tarefas'],
            createdAt: new Date(),
            updatedAt: new Date(),
            content: '- [ ] Explorar as funcionalidades\n- [ ] Criar meu primeiro template\n- [ ] Organizar projetos'
          },
          {
            id: 'file_3',
            name: 'Projetos',
            type: 'file',
            emoji: '🚀',
            tags: ['projetos', 'trabalho'],
            createdAt: new Date(),
            updatedAt: new Date(),
            content: 'Aqui você pode organizar todos os seus projetos importantes.'
          }
        ];
        
        setFiles(exampleFiles);
        localStorage.setItem('spark_files', JSON.stringify(exampleFiles));
      }
      
      if (savedFavorites) {
        try {
          setFavorites(JSON.parse(savedFavorites));
        } catch (error) {
          console.error('Error parsing saved favorites:', error);
        }
      }
      
      // Simular um pequeno delay para mostrar loading
      setTimeout(() => {
        setLoading(false);
      }, 800);
    };

    loadUserData();
  }, []);

  const handleNavigateToFile = (fileId: string) => {
    console.log('Navegando para arquivo:', fileId);
    // Implementar navegação para arquivo específico
  };

  const handleCreateFile = (name: string) => {
    const newFile: FileItem = {
      id: `file_${Date.now()}`,
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

  const _handleUpdateFile = (fileId: string, updates: Partial<FileItem>) => {
    const updatedFiles = files.map(file => 
      file.id === fileId ? { ...file, ...updates, updatedAt: new Date() } : file
    );
    setFiles(updatedFiles);
    localStorage.setItem('spark_files', JSON.stringify(updatedFiles));
  };

  const _handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter(file => file.id !== fileId);
    setFiles(updatedFiles);
    localStorage.setItem('spark_files', JSON.stringify(updatedFiles));
    
    // Remover dos favoritos também
    const updatedFavorites = favorites.filter(id => id !== fileId);
    setFavorites(updatedFavorites);
    localStorage.setItem('spark_favorites', JSON.stringify(updatedFavorites));
  };

  const _handleToggleFavorite = (fileId: string) => {
    const updatedFavorites = favorites.includes(fileId)
      ? favorites.filter(id => id !== fileId)
      : [...favorites, fileId];
    
    setFavorites(updatedFavorites);
    localStorage.setItem('spark_favorites', JSON.stringify(updatedFavorites));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner />
          <h2 className="mt-4 text-xl font-semibold text-gray-700">
            Carregando seu workspace...
          </h2>
          <p className="mt-2 text-gray-500">
            Preparando suas ferramentas de produtividade
          </p>
        </div>
      </div>
    );
  }

  return (
    <Dashboard
      files={files}
      favorites={favorites}
      onNavigateToFile={handleNavigateToFile}
      onCreateFile={handleCreateFile}
    />
  );
}