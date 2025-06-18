import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Search, Hash, Zap, TrendingUp, 
  Plus, FileText, Folder, Star, Clock, Activity,
  Filter, SortAsc, Grid, List, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';
import { SmartCollections } from '@/components/SmartCollections';
import { TagSystem } from '@/components/TagSystem';
import { QuickActions } from '@/components/QuickActions';
import { GlobalSearch } from '@/components/GlobalSearch';
import { AdvancedAnalytics } from '@/components/ai/AdvancedAnalytics';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { Sidebar } from '@/components/Sidebar';
import { AppHeader } from '@/components/AppHeader';

interface DashboardEnhancedProps {
  files: FileItem[];
  onNavigateToFile: (fileId: string) => void;
  onCreateNote: () => void;
  onCreateNotebook: () => void;
  timeRange: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d' | '90d') => void;
  className?: string;
}

export const DashboardEnhanced: React.FC<DashboardEnhancedProps> = ({
  files,
  onNavigateToFile,
  onCreateNote,
  onCreateNotebook,
  timeRange,
  onTimeRangeChange,
  className
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created'>('recent');
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);

  const { 
    favorites, 
    toggleFavorite,
    deleteFile,
    updateFile
  } = useFileSystemContext();

  // Calculate dashboard statistics
  const stats = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const totalFiles = files.length;
    const totalNotes = files.filter(f => f.type === 'file').length;
    const totalNotebooks = files.filter(f => f.type === 'folder').length;
    const totalFavorites = files.filter(f => f.isFavorite).length;

    const recentFiles = files.filter(f => new Date(f.updatedAt) >= yesterday);
    const weeklyFiles = files.filter(f => new Date(f.updatedAt) >= weekAgo);
    const monthlyFiles = files.filter(f => new Date(f.updatedAt) >= monthAgo);

    // Tag analysis
    const tagFrequency: Record<string, number> = {};
    files.forEach(file => {
      file.tags?.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      total: totalFiles,
      notes: totalNotes,
      notebooks: totalNotebooks,
      favorites: totalFavorites,
      recent: recentFiles.length,
      weekly: weeklyFiles.length,
      monthly: monthlyFiles.length,
      tags: Object.keys(tagFrequency).length,
      popularTags,
      productivity: Math.round((recentFiles.length / Math.max(totalFiles, 1)) * 100)
    };
  }, [files]);

  // Filter files based on selected tags
  const filteredFiles = useMemo(() => {
    if (selectedTags.length === 0) return files;
    return files.filter(file => 
      selectedTags.some(tag => file.tags?.includes(tag))
    );
  }, [files, selectedTags]);

  // Sort files
  const sortedFiles = useMemo(() => {
    const sorted = [...filteredFiles];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'created':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case 'recent':
      default:
        return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
  }, [filteredFiles, sortBy]);

  const handleCollectionSelect = (collection: any) => {
    // Navigate to collection view or filter files
    console.log('Collection selected:', collection);
  };

  const handleTagSelect = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleQuickAction = {
    onEditFile: onNavigateToFile,
    onDeleteFiles: (fileIds: string[]) => {
      fileIds.forEach(id => deleteFile(id));
      setSelectedFiles([]);
    },
    onToggleFavorite: toggleFavorite,
    onShareFile: (fileId: string) => {
      console.log('Share file:', fileId);
    },
    onDuplicateFile: (fileId: string) => {
      const file = files.find(f => f.id === fileId);
      if (file) {
        const duplicated = {
          ...file,
          id: `${file.id}-copy`,
          name: `${file.name} (Cópia)`,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        // TODO: Add to file system
      }
    },
    onMoveFiles: (fileIds: string[], targetId: string) => {
      console.log('Move files:', fileIds, 'to:', targetId);
    },
    onExportFiles: (fileIds: string[]) => {
      console.log('Export files:', fileIds);
    },
    onSearch: () => {
      // Focus global search
      const searchInput = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
      searchInput?.focus();
    },
    onShowTemplates: () => {
      console.log('Show templates');
    }
  };

  return (
    <div className={cn("flex min-h-screen w-full bg-[#f7faff] dark:bg-[#181f2a]", className)}>
      {/* Sidebar fixa à esquerda */}
      <aside className="hidden md:flex w-64 flex-shrink-0 h-screen sticky top-0 z-40 border-r border-[#e3e8f0] dark:border-[#232b3b] bg-white dark:bg-[#1a2233]">
        <Sidebar onNavigateToFile={onNavigateToFile} />
      </aside>
      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header fixo no topo */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#181f2a]/95 backdrop-blur-xl border-b border-[#e3e8f0] dark:border-[#232b3b]">
          <AppHeader
            activeView={"dashboard"}
            onViewChange={() => {}}
            isMobile={false}
            isMobileSidebarOpen={false}
            onToggleMobileSidebar={() => {}}
            onShowSettings={() => {}}
            files={files}
            onNavigateToFile={onNavigateToFile}
          />
        </div>
        {/* Conteúdo do dashboard */}
        <div className="flex-1 flex flex-col items-center justify-start px-4 md:px-12 py-8 gap-10 w-full max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="flex items-center justify-between w-full mb-2">
            <div>
              <h1 className="text-3xl font-bold text-[#1a2233] dark:text-white flex items-center gap-2">
                <LayoutDashboard className="h-7 w-7 text-[#2563eb] dark:text-[#60a5fa]" />
                Dashboard
              </h1>
              <p className="text-[#4b5563] dark:text-[#cbd5e1] text-base">
                Bem-vindo de volta! Aqui está um resumo do seu workspace.
              </p>
            </div>
            {/* Quick Actions Toolbar */}
            <QuickActions
              context={{
                selectedFiles,
                currentView: 'dashboard',
                hasSelection: selectedFiles.length > 0
              }}
              onCreateNote={onCreateNote}
              onCreateNotebook={onCreateNotebook}
              {...handleQuickAction}
            />
          </div>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {/* Card: Total de Arquivos */}
            <Card className="shadow-md border-0 bg-white dark:bg-[#232b3b]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2563eb] dark:text-[#60a5fa] text-lg">
                  <LayoutDashboard className="h-5 w-5" /> Arquivos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold text-[#1a2233] dark:text-white">{stats.total}</span>
              </CardContent>
            </Card>
            {/* Card: Tags */}
            <Card className="shadow-md border-0 bg-white dark:bg-[#232b3b]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#0ea5e9] dark:text-[#38bdf8] text-lg">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 7h.01M7 7a2 2 0 1 1 2-2 2 2 0 0 1-2 2zm0 0v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2z" /></svg>
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold text-[#1a2233] dark:text-white">{stats.tags}</span>
              </CardContent>
            </Card>
            {/* Card: Favoritos */}
            <Card className="shadow-md border-0 bg-white dark:bg-[#232b3b]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#22c55e] dark:text-[#4ade80] text-lg">
                  <Star className="h-5 w-5" /> Favoritos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold text-[#1a2233] dark:text-white">{stats.favorites}</span>
              </CardContent>
            </Card>
            {/* Card: Recentes */}
            <Card className="shadow-md border-0 bg-white dark:bg-[#232b3b]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#f59e42] dark:text-[#fbbf24] text-lg">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
                  Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-bold text-[#1a2233] dark:text-white">{stats.recent}</span>
              </CardContent>
            </Card>
          </div>
          {/* Arquivos Recentes */}
          <div className="w-full mt-8">
            <h2 className="text-2xl font-bold text-[#1a2233] dark:text-white mb-4 flex items-center gap-2">
              <svg className="h-6 w-6 text-[#2563eb] dark:text-[#60a5fa]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              Arquivos Recentes
            </h2>
            <div className="bg-white dark:bg-[#232b3b] rounded-xl shadow p-4 flex flex-col gap-2">
              {sortedFiles.slice(0, 8).map(file => (
                <div key={file.id} className="flex items-center gap-3 py-2 border-b border-[#e3e8f0] dark:border-[#232b3b] last:border-0">
                  <FileText className="h-5 w-5 text-[#2563eb] dark:text-[#60a5fa]" />
                  <div className="flex-1">
                    <div className="font-medium text-[#1a2233] dark:text-white">{file.name}</div>
                    <div className="text-xs text-[#64748b] dark:text-[#cbd5e1]">{new Date(file.updatedAt).toLocaleDateString()}</div>
                  </div>
                  <Button size="sm" variant="ghost" className="text-[#2563eb] dark:text-[#60a5fa]" onClick={() => { onNavigateToFile(file.id); }}>
                    Abrir
                  </Button>
                </div>
              ))}
              {sortedFiles.length === 0 && (
                <div className="text-[#64748b] dark:text-[#cbd5e1] text-center py-8">Nenhum arquivo recente.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}; 