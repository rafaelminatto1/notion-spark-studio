import React from 'react';
import { FileText, Tag, Clock, Star, TrendingUp, Calendar, Sparkles, Activity, Zap, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { FileItem } from '@/types';
import { TaskList } from './tasks/TaskList';
import { PerformanceMonitor } from './PerformanceMonitor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  // Removida verificação de autenticação - acesso direto ao dashboard

  const recentFiles = files
    .filter(f => f.type === 'file')
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  const favoriteFiles = files.filter(f => favorites.includes(f.id));

  const allTags = files
    .flatMap(f => f.tags || [])
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

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
        Bem-vindo ao Notion Spark Studio!
      </h1>

      <Tabs defaultValue="tasks" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="notes">Notas</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <TaskList />
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
              <CardDescription>Em breve: editor de notas e documentos</CardDescription>
            </CardHeader>
            <CardContent>
              <p>O editor de notas está em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Produtividade</CardTitle>
              <CardDescription>Em breve: gráficos e métricas de produtividade</CardDescription>
            </CardHeader>
            <CardContent>
              <p>As métricas de produtividade estão em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <PerformanceMonitor />
        </TabsContent>
      </Tabs>

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
                    onClick={() => { onNavigateToFile(file.id); }}
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
                <Sparkles className="h-5 w-5" />
              </div>
              Ações Rápidas
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="content-card-body">
          <div className="quick-actions-grid">
            <Button
              onClick={() => { onCreateFile('Nova Nota'); }}
              className="quick-action-button"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Nova Nota
            </Button>
            <Button
              className="quick-action-button"
              variant="outline"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Agendar
            </Button>
            <Button
              className="quick-action-button"
              variant="outline"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Relatórios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="stats-grid">
        <Card className="stat-card">
          <CardContent className="stat-card-content">
            <div className="stat-icon-wrapper">
              <FileText className="stat-icon" />
            </div>
            <div className="stat-details">
              <p className="stat-value">{stats.totalFiles}</p>
              <p className="stat-label">Arquivos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="stat-card-content">
            <div className="stat-icon-wrapper">
              <Star className="stat-icon" />
            </div>
            <div className="stat-details">
              <p className="stat-value">{stats.favorites}</p>
              <p className="stat-label">Favoritos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="stat-card-content">
            <div className="stat-icon-wrapper">
              <Tag className="stat-icon" />
            </div>
            <div className="stat-details">
              <p className="stat-value">{stats.totalTags}</p>
              <p className="stat-label">Tags</p>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="stat-card-content">
            <div className="stat-icon-wrapper">
              <Zap className="stat-icon" />
            </div>
            <div className="stat-details">
              <p className="stat-value">100%</p>
              <p className="stat-label">Produtividade</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
