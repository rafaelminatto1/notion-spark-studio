import React, { useMemo, useState } from 'react';
import { Star, Clock, Hash, Folder, FileText, TrendingUp, Calendar, Users, Sparkles, Filter, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';

interface SmartCollection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  items: FileItem[];
  criteria: CollectionCriteria;
  isBuiltIn: boolean;
}

interface CollectionCriteria {
  type?: 'all' | 'notes' | 'notebooks';
  timeframe?: 'today' | 'week' | 'month' | 'year';
  tags?: string[];
  favorites?: boolean;
  minSize?: number;
  maxSize?: number;
  pattern?: string;
}

interface SmartCollectionsProps {
  files: FileItem[];
  onSelectCollection: (collection: SmartCollection) => void;
  onNavigateToFile: (fileId: string) => void;
  className?: string;
}

export const SmartCollections: React.FC<SmartCollectionsProps> = ({
  files,
  onSelectCollection,
  onNavigateToFile,
  className
}) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Calculate smart collections
  const smartCollections = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all tags and their frequency
    const tagFrequency: Record<string, number> = {};
    files.forEach(file => {
      file.tags?.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    const collections: SmartCollection[] = [
      // Favorites
      {
        id: 'favorites',
        name: 'Favoritos',
        description: 'Suas notas e notebooks marcados como favoritos',
        icon: <Star className="h-4 w-4" />,
        color: 'bg-yellow-500',
        count: files.filter(f => f.isFavorite).length,
        items: files.filter(f => f.isFavorite),
        criteria: { favorites: true },
        isBuiltIn: true
      },

      // Recent
      {
        id: 'recent',
        name: 'Recentes',
        description: 'Modificados nos últimos 7 dias',
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-blue-500',
        count: files.filter(f => new Date(f.updatedAt) >= weekAgo).length,
        items: files.filter(f => new Date(f.updatedAt) >= weekAgo)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
        criteria: { timeframe: 'week' },
        isBuiltIn: true
      },

      // Today's work
      {
        id: 'today',
        name: 'Hoje',
        description: 'Criados ou modificados hoje',
        icon: <Calendar className="h-4 w-4" />,
        color: 'bg-green-500',
        count: files.filter(f => 
          new Date(f.updatedAt) >= today || new Date(f.createdAt) >= today
        ).length,
        items: files.filter(f => 
          new Date(f.updatedAt) >= today || new Date(f.createdAt) >= today
        ),
        criteria: { timeframe: 'today' },
        isBuiltIn: true
      },

      // Large documents
      {
        id: 'large-docs',
        name: 'Documentos Extensos',
        description: 'Notas com muito conteúdo',
        icon: <FileText className="h-4 w-4" />,
        color: 'bg-purple-500',
        count: files.filter(f => f.type === 'file' && (f.content?.length || 0) > 1000).length,
        items: files.filter(f => f.type === 'file' && (f.content?.length || 0) > 1000)
          .sort((a, b) => (b.content?.length || 0) - (a.content?.length || 0)),
        criteria: { type: 'notes', minSize: 1000 },
        isBuiltIn: true
      },

      // Notebooks
      {
        id: 'notebooks-only',
        name: 'Todos os Notebooks',
        description: 'Organizadores de conteúdo',
        icon: <Folder className="h-4 w-4" />,
        color: 'bg-indigo-500',
        count: files.filter(f => f.type === 'folder').length,
        items: files.filter(f => f.type === 'folder'),
        criteria: { type: 'notebooks' },
        isBuiltIn: true
      },

      // Trending (most updated this month)
      {
        id: 'trending',
        name: 'Em Alta',
        description: 'Mais ativos este mês',
        icon: <TrendingUp className="h-4 w-4" />,
        color: 'bg-pink-500',
        count: files.filter(f => new Date(f.updatedAt) >= monthAgo).length,
        items: files.filter(f => new Date(f.updatedAt) >= monthAgo)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 10),
        criteria: { timeframe: 'month' },
        isBuiltIn: true
      }
    ];

    // Add collections for popular tags
    popularTags.forEach((tag, index) => {
      const tagFiles = files.filter(f => f.tags?.includes(tag));
      if (tagFiles.length >= 2) { // Only show tags with at least 2 files
        collections.push({
          id: `tag-${tag}`,
          name: `#${tag}`,
          description: `Notas marcadas com "${tag}"`,
          icon: <Hash className="h-4 w-4" />,
          color: `bg-slate-500`,
          count: tagFiles.length,
          items: tagFiles,
          criteria: { tags: [tag] },
          isBuiltIn: false
        });
      }
    });

    return collections.filter(c => c.count > 0);
  }, [files]);

  const handleCollectionClick = (collection: SmartCollection) => {
    setSelectedCollectionId(collection.id);
    onSelectCollection(collection);
  };

  const formatCount = (count: number) => {
    if (count === 1) return '1 item';
    return `${count} itens`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Coleções Inteligentes
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organizadas automaticamente por critérios
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Coleção
        </Button>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {smartCollections.map((collection) => (
          <Card
            key={collection.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105",
              selectedCollectionId === collection.id && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
            )}
            onClick={() => handleCollectionClick(collection)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                    collection.color
                  )}>
                    {collection.icon}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {collection.name}
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {formatCount(collection.count)}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">
                {collection.description}
              </p>
              
              {/* Preview of items */}
              <div className="space-y-2">
                {collection.items.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToFile(item.id);
                    }}
                  >
                    {item.type === 'folder' ? (
                      <Folder className="h-3 w-3 text-slate-500" />
                    ) : (
                      <FileText className="h-3 w-3 text-slate-500" />
                    )}
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                      {item.name}
                    </span>
                    {item.isFavorite && (
                      <Star className="h-2 w-2 text-yellow-500 fill-current" />
                    )}
                  </div>
                ))}
                
                {collection.items.length > 3 && (
                  <div className="text-xs text-slate-500 text-center py-1">
                    +{collection.items.length - 3} mais
                  </div>
                )}
              </div>

              {/* Collection Stats */}
              {collection.id === 'recent' && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Atividade recente</span>
                    <span>{Math.round((collection.count / files.length) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(collection.count / files.length) * 100} 
                    className="h-1"
                  />
                </div>
              )}

              {collection.id.startsWith('tag-') && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-1">
                    <Hash className="h-3 w-3 text-slate-400" />
                    <Badge variant="outline" className="text-xs">
                      Tag Popular
                    </Badge>
                  </div>
                </div>
              )}

              {collection.id === 'favorites' && collection.count > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-slate-500">
                      Suas notas preferidas
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {smartCollections.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-500 mb-2">
            Nenhuma coleção disponível
          </h3>
          <p className="text-slate-400 text-sm">
            Comece criando algumas notas para ver coleções inteligentes
          </p>
        </div>
      )}

      {/* Quick Stats */}
      {smartCollections.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
            Estatísticas Rápidas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {files.length}
              </div>
              <div className="text-xs text-slate-500">Total de itens</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {files.filter(f => f.isFavorite).length}
              </div>
              <div className="text-xs text-slate-500">Favoritos</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {files.filter(f => f.type === 'folder').length}
              </div>
              <div className="text-xs text-slate-500">Notebooks</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {Object.keys(files.reduce((acc, f) => {
                  f.tags?.forEach(tag => acc[tag] = true);
                  return acc;
                }, {} as Record<string, boolean>)).length}
              </div>
              <div className="text-xs text-slate-500">Tags únicas</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 