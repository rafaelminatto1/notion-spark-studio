
import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, FileText, Plus, Search, Settings, ChevronRight, ChevronDown, MoreHorizontal, Tag, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { TagsPanel } from '@/components/TagsPanel';
import { useTags } from '@/hooks/useTags';

interface SidebarProps {
  files: (FileItem & {
    children?: FileItem[];
  })[];
  currentFileId: string | null;
  expandedFolders: Set<string>;
  onFileSelect: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => void;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onDeleteFile: (id: string) => void;
  allFiles: FileItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  files,
  currentFileId,
  expandedFolders,
  onFileSelect,
  onToggleFolder,
  onCreateFile,
  onUpdateFile,
  onDeleteFile,
  allFiles
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState<{
    parentId?: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagsPanel, setShowTagsPanel] = useState(false);

  const { tagTree } = useTags(allFiles);

  const handleCreateItem = () => {
    if (newItemName.trim() && isCreating) {
      onCreateFile(newItemName.trim(), isCreating.parentId, isCreating.type);
      setNewItemName('');
      setIsCreating(null);
    }
  };

  const handleTagSelect = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName);
      } else {
        return [...prev, tagName];
      }
    });
  };

  const handleTagFilter = (tagNames: string[]) => {
    setSelectedTags(tagNames);
  };

  // Filtrar arquivos por tags selecionadas
  const filteredFiles = useMemo(() => {
    if (selectedTags.length === 0) return files;
    
    const filterTree = (items: (FileItem & { children?: FileItem[] })[]) => {
      return items.filter(item => {
        if (item.type === 'file') {
          return item.tags && selectedTags.some(tag => item.tags!.includes(tag));
        } else {
          const filteredChildren = item.children ? filterTree(item.children) : [];
          return filteredChildren.length > 0;
        }
      }).map(item => ({
        ...item,
        children: item.children ? filterTree(item.children) : undefined
      }));
    };

    return filterTree(files);
  }, [files, selectedTags]);

  const renderFileTree = (items: (FileItem & {
    children?: FileItem[];
  })[], level = 0) => {
    return items
      .filter(item => searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .map(item => (
        <div key={item.id} className="select-none">
          <div 
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm rounded-lg cursor-pointer group transition-all duration-200 hover:bg-workspace-surface/60 hover:scale-[1.02] hover:shadow-sm",
              currentFileId === item.id && "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white shadow-lg border border-purple-500/30",
              "ml-" + (level * 3)
            )} 
            onClick={() => {
              if (item.type === 'file') {
                onFileSelect(item.id);
              } else {
                onToggleFolder(item.id);
              }
            }}
          >
            {item.type === 'folder' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 hover:bg-transparent transition-transform duration-200 hover:scale-110" 
                onClick={e => {
                  e.stopPropagation();
                  onToggleFolder(item.id);
                }}
              >
                {expandedFolders.has(item.id) ? 
                  <ChevronDown className="h-3 w-3 text-blue-400" /> : 
                  <ChevronRight className="h-3 w-3 text-blue-400" />
                }
              </Button>
            )}
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.emoji && <span className="text-base animate-fade-in">{item.emoji}</span>}
              {item.type === 'folder' ? 
                expandedFolders.has(item.id) ? 
                  <FolderOpen className="h-4 w-4 text-blue-400 transition-colors duration-200" /> : 
                  <Folder className="h-4 w-4 text-blue-400 transition-colors duration-200" /> : 
                <FileText className="h-4 w-4 text-gray-400 group-hover:text-gray-300 transition-colors duration-200" />
              }
              <span className="truncate flex-1 font-medium">{item.name}</span>
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-200">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={e => {
                  e.stopPropagation();
                  setIsCreating({
                    parentId: item.type === 'folder' ? item.id : item.parentId,
                    type: 'file'
                  });
                }} 
                className="h-6 w-6 p-0 hover:bg-purple-500/20 hover:scale-110 transition-all duration-200"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 hover:bg-gray-500/20 hover:scale-110 transition-all duration-200"
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {item.type === 'folder' && expandedFolders.has(item.id) && item.children && (
            <div className="ml-4 animate-fade-in">
              {renderFileTree(item.children, level + 1)}
              {isCreating?.parentId === item.id && (
                <div className="flex items-center gap-2 px-3 py-2 ml-3 animate-fade-in">
                  {isCreating.type === 'folder' ? 
                    <Folder className="h-4 w-4 text-blue-400" /> : 
                    <FileText className="h-4 w-4 text-gray-400" />
                  }
                  <Input
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateItem();
                      if (e.key === 'Escape') setIsCreating(null);
                    }}
                    onBlur={handleCreateItem}
                    className="h-7 text-sm bg-workspace-surface border-purple-500/30 focus:border-purple-500/60 transition-colors duration-200"
                    placeholder={isCreating.type === 'folder' ? 'Nova pasta' : 'Nova página'}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ));
  };

  return (
    <div className="w-80 bg-gradient-to-b from-workspace-bg to-workspace-surface border-r border-workspace-border flex flex-col h-screen shadow-xl">
      {/* Header with gradient */}
      <div className="p-6 border-b border-workspace-border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
            <h1 className="font-bold text-xl bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Notion Spark
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTagsPanel(!showTagsPanel)}
              className={cn(
                "h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-110",
                showTagsPanel && "bg-purple-500/20 text-purple-400 shadow-lg"
              )}
            >
              <Tag className="h-4 w-4" />
            </Button>
            <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-purple-400 transition-colors duration-200 hover:scale-110" />
          </div>
        </div>
        
        {/* Enhanced Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar páginas..."
            className="pl-10 bg-workspace-surface/50 border-workspace-border/60 focus:border-purple-500/60 focus:bg-workspace-surface transition-all duration-200 rounded-lg"
          />
        </div>
      </div>

      {/* Enhanced Tags Panel */}
      {showTagsPanel && (
        <div className="border-b border-workspace-border p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 animate-fade-in">
          <TagsPanel
            tags={tagTree}
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            onTagFilter={handleTagFilter}
          />
        </div>
      )}

      {/* Enhanced Action Buttons */}
      <div className="p-4 space-y-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-200 hover:scale-[1.02] rounded-lg"
          onClick={() => setIsCreating({ type: 'file' })}
        >
          <Plus className="h-4 w-4" />
          <span className="font-medium">Nova Página</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-200 hover:scale-[1.02] rounded-lg"
          onClick={() => setIsCreating({ type: 'folder' })}
        >
          <Folder className="h-4 w-4" />
          <span className="font-medium">Nova Pasta</span>
        </Button>
      </div>

      {/* Enhanced File Tree */}
      <div className="flex-1 overflow-y-auto px-2 scrollbar-thin scrollbar-thumb-workspace-border scrollbar-track-transparent">
        {isCreating && !isCreating.parentId && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 animate-fade-in">
            {isCreating.type === 'folder' ? (
              <Folder className="h-4 w-4 text-blue-400" />
            ) : (
              <FileText className="h-4 w-4 text-gray-400" />
            )}
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateItem();
                if (e.key === 'Escape') setIsCreating(null);
              }}
              onBlur={handleCreateItem}
              className="h-7 text-sm bg-workspace-surface border-purple-500/30 focus:border-purple-500/60 transition-colors duration-200"
              placeholder={isCreating.type === 'folder' ? 'Nova pasta' : 'Nova página'}
              autoFocus
            />
          </div>
        )}
        {renderFileTree(filteredFiles)}
      </div>

      {/* Enhanced Footer */}
      <div className="p-4 border-t border-workspace-border bg-gradient-to-r from-purple-500/5 to-blue-500/5">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Tag className="h-3 w-3" />
          <span>Tags: {tagTree.length} categorias</span>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};
