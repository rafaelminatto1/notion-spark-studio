import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, FileText, Plus, Search, Settings, ChevronRight, ChevronDown, MoreHorizontal, Tag } from 'lucide-react';
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
  allFiles: FileItem[]; // Adicionando para acessar todos os arquivos para tags
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
    return items.filter(item => searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase())).map(item => <div key={item.id} className="select-none">
          <div className={cn("flex items-center gap-2 px-2 py-1.5 text-sm rounded-md cursor-pointer group hover:bg-notion-dark-hover transition-colors", currentFileId === item.id && "bg-notion-purple text-white", "ml-" + level * 4)} onClick={() => {
        if (item.type === 'file') {
          onFileSelect(item.id);
        } else {
          onToggleFolder(item.id);
        }
      }}>
            {item.type === 'folder' && <Button variant="ghost" size="sm" className="h-4 w-4 p-0 hover:bg-transparent" onClick={e => {
          e.stopPropagation();
          onToggleFolder(item.id);
        }}>
                {expandedFolders.has(item.id) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>}
            
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {item.emoji && <span className="text-sm">{item.emoji}</span>}
              {item.type === 'folder' ? expandedFolders.has(item.id) ? <FolderOpen className="h-4 w-4 text-notion-blue" /> : <Folder className="h-4 w-4 text-notion-blue" /> : <FileText className="h-4 w-4 text-gray-400" />}
              <span className="truncate flex-1">{item.name}</span>
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={e => {
            e.stopPropagation();
            setIsCreating({
              parentId: item.type === 'folder' ? item.id : item.parentId,
              type: 'file'
            });
          }} className="h-6 w-6 p-0 font-normal">
                <Plus className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {item.type === 'folder' && expandedFolders.has(item.id) && item.children && <div className="ml-4">
              {renderFileTree(item.children, level + 1)}
              {isCreating?.parentId === item.id && <div className="flex items-center gap-2 px-2 py-1.5 ml-4">
                  {isCreating.type === 'folder' ? <Folder className="h-4 w-4 text-notion-blue" /> : <FileText className="h-4 w-4 text-gray-400" />}
                  <Input value={newItemName} onChange={e => setNewItemName(e.target.value)} onKeyDown={e => {
            if (e.key === 'Enter') handleCreateItem();
            if (e.key === 'Escape') setIsCreating(null);
          }} onBlur={handleCreateItem} className="h-6 text-sm" placeholder={isCreating.type === 'folder' ? 'Nova pasta' : 'Nova página'} autoFocus />
                </div>}
            </div>}
        </div>);
  };

  return (
    <div className="w-80 bg-notion-dark border-r border-notion-dark-border flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-notion-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-semibold text-lg">Notion Spark</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTagsPanel(!showTagsPanel)}
              className={cn(
                "h-6 w-6 p-0",
                showTagsPanel && "bg-notion-purple text-white"
              )}
            >
              <Tag className="h-4 w-4" />
            </Button>
            <Settings className="h-5 w-5 text-gray-400 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="pl-10 bg-notion-dark-hover border-notion-dark-border"
          />
        </div>
      </div>

      {/* Tags Panel */}
      {showTagsPanel && (
        <div className="border-b border-notion-dark-border p-4">
          <TagsPanel
            tags={tagTree}
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            onTagFilter={handleTagFilter}
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-300 hover:text-white hover:bg-notion-dark-hover"
          onClick={() => setIsCreating({ type: 'file' })}
        >
          <Plus className="h-4 w-4" />
          Nova Página
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-gray-300 hover:text-white hover:bg-notion-dark-hover"
          onClick={() => setIsCreating({ type: 'folder' })}
        >
          <Folder className="h-4 w-4" />
          Nova Pasta
        </Button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto px-2">
        {isCreating && !isCreating.parentId && (
          <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
            {isCreating.type === 'folder' ? (
              <Folder className="h-4 w-4 text-notion-blue" />
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
              className="h-6 text-sm"
              placeholder={isCreating.type === 'folder' ? 'Nova pasta' : 'Nova página'}
              autoFocus
            />
          </div>
        )}
        {renderFileTree(filteredFiles)}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-notion-dark-border">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Tag className="h-3 w-3" />
          <span>Tags: {tagTree.length} categorias</span>
        </div>
      </div>
    </div>
  );
};
