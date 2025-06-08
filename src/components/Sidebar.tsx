import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, FileText, Plus, Search, Settings, ChevronRight, ChevronDown, MoreHorizontal, Tag, Sparkles, LayoutPanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { TagsPanel } from '@/components/TagsPanel';
import { useTags } from '@/hooks/useTags';
import { SubItemCreator } from '@/components/SubItemCreator';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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
  isMobile?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
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
  allFiles,
  isMobile = false,
  open = false,
  onOpenChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState<{
    parentId?: string;
    type: 'file' | 'folder';
  } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTagsPanel, setShowTagsPanel] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSubItemCreator, setShowSubItemCreator] = useState<string | null>(null);

  const { tagTree } = useTags(allFiles);

  const handleCreateItem = () => {
    if (newItemName.trim() && isCreating) {
      onCreateFile(newItemName.trim(), isCreating.parentId, isCreating.type);
      setNewItemName('');
      setIsCreating(null);
    }
  };

  const handleCreateSubItem = async (name: string, parentId: string, type: 'file' | 'folder') => {
    onCreateFile(name, parentId, type);
    setShowSubItemCreator(null);
    return '';
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
              "flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl cursor-pointer group transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10",
              currentFileId === item.id && "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white shadow-xl border border-purple-500/30 scale-[1.02]",
              level > 0 && "ml-4"
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
                className="h-6 w-6 p-0 hover:bg-transparent transition-all duration-300 hover:scale-125" 
                onClick={e => {
                  e.stopPropagation();
                  onToggleFolder(item.id);
                }}
              >
                {expandedFolders.has(item.id) ? 
                  <ChevronDown className="h-4 w-4 text-blue-400 transition-transform duration-300" /> : 
                  <ChevronRight className="h-4 w-4 text-blue-400 transition-transform duration-300" />
                }
              </Button>
            )}
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {item.emoji && (
                <span className="text-lg animate-fade-in transition-transform duration-300 group-hover:scale-110">
                  {item.emoji}
                </span>
              )}
              {item.type === 'folder' ? 
                expandedFolders.has(item.id) ? 
                  <FolderOpen className="h-5 w-5 text-blue-400 transition-all duration-300 group-hover:text-blue-300" /> : 
                  <Folder className="h-5 w-5 text-blue-400 transition-all duration-300 group-hover:text-blue-300" /> : 
                <FileText className="h-5 w-5 text-gray-400 group-hover:text-gray-300 transition-all duration-300" />
              }
              <span className="truncate flex-1 font-medium transition-all duration-300 group-hover:text-white">
                {item.name}
              </span>
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={e => {
                  e.stopPropagation();
                  setShowSubItemCreator(showSubItemCreator === item.id ? null : item.id);
                }} 
                className="h-7 w-7 p-0 hover:bg-purple-500/20 hover:scale-125 transition-all duration-300 rounded-full"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-gray-500/20 hover:scale-125 transition-all duration-300 rounded-full"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Sub-item creator */}
          {showSubItemCreator === item.id && (
            <div className="ml-6 mt-2 animate-fade-in">
              <SubItemCreator
                parentId={item.id}
                onCreateSubItem={handleCreateSubItem}
              />
            </div>
          )}

          {item.type === 'folder' && expandedFolders.has(item.id) && item.children && (
            <div className="ml-2 animate-fade-in transition-all duration-300">
              {renderFileTree(item.children, level + 1)}
              {isCreating?.parentId === item.id && (
                <div className="flex items-center gap-3 px-3 py-2 ml-6 animate-fade-in">
                  {isCreating.type === 'folder' ? 
                    <Folder className="h-5 w-5 text-blue-400" /> : 
                    <FileText className="h-5 w-5 text-gray-400" />
                  }
                  <Input
                    value={newItemName}
                    onChange={e => setNewItemName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateItem();
                      if (e.key === 'Escape') setIsCreating(null);
                    }}
                    onBlur={handleCreateItem}
                    className="h-8 text-sm bg-background/60 backdrop-blur-sm border-purple-500/30 focus:border-purple-500/60 transition-all duration-300 rounded-lg"
                    placeholder={isCreating.type === 'folder' ? 'Nova pasta' : 'Nova nota'}
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}
        </div>
      ));
  };

  const sidebarContent = (
    <div className="w-72 max-w-full h-full bg-background border-r border-border flex flex-col overflow-y-auto">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-border/60 bg-gradient-to-r from-purple-500/5 to-blue-500/5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="h-7 w-7 text-purple-400 animate-pulse" />
              <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
              Notion Spark
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTagsPanel(!showTagsPanel)}
              className={cn(
                "h-9 w-9 p-0 rounded-full transition-all duration-300 hover:scale-110",
                showTagsPanel && "bg-purple-500/20 text-purple-400 shadow-lg shadow-purple-500/25"
              )}
            >
              <Tag className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(true)}
              className="h-9 w-9 p-0 rounded-full hover:bg-gray-500/20 transition-all duration-300 hover:scale-110"
            >
              <LayoutPanelLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Enhanced Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors duration-300 group-focus-within:text-purple-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar notas..."
            className="pl-10 bg-background/60 backdrop-blur-sm border-border/60 focus:border-purple-500/60 focus:bg-background/80 transition-all duration-300 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg"
          />
        </div>
      </div>

      {/* Enhanced Tags Panel */}
      {showTagsPanel && (
        <div className="border-b border-border/60 p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 animate-fade-in backdrop-blur-sm">
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
          className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300 hover:scale-[1.02] rounded-xl shadow-sm hover:shadow-lg group"
          onClick={() => setIsCreating({ type: 'file' })}
        >
          <Plus className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-medium">Nova Nota</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 hover:scale-[1.02] rounded-xl shadow-sm hover:shadow-lg group"
          onClick={() => setIsCreating({ type: 'folder' })}
        >
          <Folder className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
          <span className="font-medium">Nova Pasta</span>
        </Button>
      </div>

      {/* Enhanced File Tree */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-border/60 scrollbar-track-transparent hover:scrollbar-thumb-border/80">
        {isCreating && !isCreating.parentId && (
          <div className="flex items-center gap-3 px-3 py-2 mb-3 animate-fade-in">
            {isCreating.type === 'folder' ? (
              <Folder className="h-5 w-5 text-blue-400" />
            ) : (
              <FileText className="h-5 w-5 text-gray-400" />
            )}
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateItem();
                if (e.key === 'Escape') setIsCreating(null);
              }}
              onBlur={handleCreateItem}
              className="h-8 text-sm bg-background/60 backdrop-blur-sm border-purple-500/30 focus:border-purple-500/60 transition-all duration-300 rounded-lg"
              placeholder={isCreating.type === 'folder' ? 'Nova pasta' : 'Nova nota'}
              autoFocus
            />
          </div>
        )}
        <div className="space-y-1">
          {renderFileTree(filteredFiles)}
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="p-4 border-t border-border/60 bg-gradient-to-r from-purple-500/5 to-blue-500/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Tag className="h-3 w-3" />
          <span>Tags: {tagTree.length} categorias</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
            <span>Online</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="p-0 w-72 max-w-full">
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return sidebarContent;
};
