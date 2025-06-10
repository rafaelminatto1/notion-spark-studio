import React from 'react';
import { FileText, Tag, Clock, Star, TrendingUp, Calendar, Sparkles, Activity, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileItem } from '@/types';
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
    <div className={`dashboard-container ${className}`}>
      {/* Header Moderno */}
      <div className="dashboard-header">
        <div className="flex items-center gap-4">
          <div className="dashboard-title-icon">
            <Sparkles className="h-8 w-8 text-violet-400" />
          </div>
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Bem-vindo de volta! Aqui está um resumo do seu workspace.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards Redesenhados */}
      <div className="stats-grid">
        {/* Arquivos Card */}
        <div className="stat-card stat-card-blue group">
          <div className="stat-card-content">
            <div className="stat-icon-wrapper">
              <FileText className="stat-icon" />
              <div className="stat-icon-glow"></div>
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.totalFiles}</div>
              <div className="stat-label">Arquivos</div>
            </div>
          </div>
          <div className="stat-card-decoration"></div>
        </div>

        {/* Tags Card */}
        <div className="stat-card stat-card-green group">
          <div className="stat-card-content">
            <div className="stat-icon-wrapper">
              <Tag className="stat-icon" />
              <div className="stat-icon-glow"></div>
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.totalTags}</div>
              <div className="stat-label">Tags</div>
            </div>
          </div>
          <div className="stat-card-decoration"></div>
        </div>

        {/* Favoritos Card */}
        <div className="stat-card stat-card-yellow group">
          <div className="stat-card-content">
            <div className="stat-icon-wrapper">
              <Star className="stat-icon" />
              <div className="stat-icon-glow"></div>
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.favorites}</div>
              <div className="stat-label">Favoritos</div>
            </div>
          </div>
          <div className="stat-card-decoration"></div>
        </div>

        {/* Recentes Card */}
        <div className="stat-card stat-card-purple group">
          <div className="stat-card-content">
            <div className="stat-icon-wrapper">
              <TrendingUp className="stat-icon" />
              <div className="stat-icon-glow"></div>
            </div>
            <div className="stat-details">
              <div className="stat-number">{recentFiles.length}</div>
              <div className="stat-label">Recentes</div>
            </div>
          </div>
          <div className="stat-card-decoration"></div>
        </div>
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
