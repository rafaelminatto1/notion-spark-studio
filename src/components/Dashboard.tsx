import React from 'react';
import { FileText, Tag, Clock, Star, TrendingUp, Calendar, Sparkles, Activity, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
// import './dashboard-modern.css';

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
  const { user } = useAuth();
  const { signInWithGoogle } = useSupabaseAuth();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Bem-vindo ao Notion Spark Studio</CardTitle>
            <CardDescription>
              Faça login para começar a usar a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full"
              onClick={() => signInWithGoogle()}
            >
              Entrar com Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className={`container mx-auto p-6 ${className}`}>
      <h1 className="text-3xl font-bold mb-6">
        Olá, {user.user_metadata?.name || user.email}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Produtividade</CardTitle>
            <CardDescription>Suas métricas de produtividade</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Em breve: gráficos e métricas de produtividade</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tarefas</CardTitle>
            <CardDescription>Suas tarefas pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Em breve: lista de tarefas e gerenciamento</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
            <CardDescription>Suas notas recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Em breve: editor de notas e documentos</p>
          </CardContent>
        </Card>
      </div>

      <div className="content-grid">
        {/* Recent Files */}
        <Card className="content-card">
          <CardHeader className="content-card-header">
            <CardTitle className="content-card-title">
              <div className="flex items-center gap-3">
                <div className="content-icon-wrapper">
                  <Clock className="h-5 w-5" />
                </div>
                Arquivos Recentes
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="content-card-body">
            <div className="recent-files-list">
              {recentFiles.length > 0 ? (
                recentFiles.map(file => (
                  <div
                    key={file.id}
                    onClick={() => onNavigateToFile(file.id)}
                    className="recent-file-item group"
                  >
                    <div className="recent-file-content">
                      {file.emoji && <span className="recent-file-emoji">{file.emoji}</span>}
                      <FileText className="recent-file-icon" />
                      <div className="recent-file-details">
                        <p className="recent-file-name">{file.name}</p>
                        <p className="recent-file-date">
                          {file.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="recent-file-arrow">
                      <Activity className="h-4 w-4" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Target className="empty-state-icon" />
                  <p className="empty-state-text">Nenhum arquivo encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card className="content-card">
          <CardHeader className="content-card-header">
            <CardTitle className="content-card-title">
              <div className="flex items-center gap-3">
                <div className="content-icon-wrapper">
                  <Tag className="h-5 w-5" />
                </div>
                Tags Populares
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="content-card-body">
            <div className="tags-grid">
              {topTags.map(([tag, count]) => (
                <div
                  key={tag}
                  className="tag-pill group"
                >
                  <span className="tag-name">{tag}</span>
                  <span className="tag-count">({count})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="content-card">
        <CardHeader className="content-card-header">
          <CardTitle className="content-card-title">
            <div className="flex items-center gap-3">
              <div className="content-icon-wrapper">
                <Zap className="h-5 w-5" />
              </div>
              Ações Rápidas
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="content-card-body">
          <div className="quick-actions">
            <Button
              onClick={() => onCreateFile('Nova Página')}
              className="quick-action-btn quick-action-primary"
            >
              <FileText className="h-4 w-4" />
              Nova Página
            </Button>
            <Button
              onClick={() => onCreateFile('Diário - ' + new Date().toLocaleDateString())}
              className="quick-action-btn quick-action-secondary"
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
