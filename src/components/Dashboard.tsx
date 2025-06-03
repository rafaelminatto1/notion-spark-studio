
import React from 'react';
import { FileText, Tag, Clock, Star, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileItem } from '@/types';

interface DashboardProps {
  files: FileItem[];
  favorites: string[];
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string) => void;
  className?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  files,
  favorites,
  onNavigateToFile,
  onCreateFile,
  className
}) => {
  const recentFiles = files
    .filter(f => f.type === 'file')
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const favoriteFiles = files.filter(f => favorites.includes(f.id));

  const allTags = files
    .flatMap(f => f.tags || [])
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topTags = Object.entries(allTags)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);

  const stats = {
    totalFiles: files.filter(f => f.type === 'file').length,
    totalFolders: files.filter(f => f.type === 'folder').length,
    totalTags: Object.keys(allTags).length,
    favorites: favoriteFiles.length
  };

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Bem-vindo de volta! Aqui está um resumo do seu workspace.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalFiles}</p>
                <p className="text-sm text-gray-400">Arquivos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalTags}</p>
                <p className="text-sm text-gray-400">Tags</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">{stats.favorites}</p>
                <p className="text-sm text-gray-400">Favoritos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-white">{recentFiles.length}</p>
                <p className="text-sm text-gray-400">Recentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Files */}
        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Clock className="h-5 w-5" />
              Arquivos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentFiles.length > 0 ? (
              recentFiles.map(file => (
                <Button
                  key={file.id}
                  variant="ghost"
                  onClick={() => onNavigateToFile(file.id)}
                  className="w-full justify-start gap-3 p-3 h-auto"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {file.emoji && <span>{file.emoji}</span>}
                    <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-sm font-medium text-white truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">
                        {file.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Button>
              ))
            ) : (
              <p className="text-gray-400 text-sm">Nenhum arquivo encontrado</p>
            )}
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Tag className="h-5 w-5" />
              Tags Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topTags.map(([tag, count]) => (
                <div
                  key={tag}
                  className="bg-notion-purple/20 border border-notion-purple/30 rounded-full px-3 py-1"
                >
                  <span className="text-sm text-notion-purple">{tag}</span>
                  <span className="text-xs text-gray-400 ml-1">({count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-notion-dark-hover border-notion-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => onCreateFile('Nova Página')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Nova Página
            </Button>
            <Button
              variant="outline"
              onClick={() => onCreateFile('Diário - ' + new Date().toLocaleDateString())}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Entrada de Diário
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
