import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  Tag, 
  Sparkles, 
  PanelLeftClose,
  PanelLeftOpen,
  FolderPlus,
  FilePlus,
  Home,
  Star,
  GripVertical,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { TagsPanel } from '@/components/TagsPanel';
import { useTags } from '@/hooks/useTags';
import { SubItemCreator } from '@/components/SubItemCreator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useRecentFiles } from '@/hooks/useRecentFiles';
import { AdvancedSearchPanel } from '@/components/AdvancedSearchPanel';
import { QuickActions } from '@/components/QuickActions';
import { RecentFilesPanel } from '@/components/RecentFilesPanel';

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
  onMoveFile?: (fileId: string, newParentId?: string, newPosition?: number) => void;
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
  onMoveFile,
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
  const [activeView, setActiveView] = useState<'files' | 'search' | 'recent' | 'favorites'>('files');

  const { tagTree } = useTags(allFiles);

  // New hooks for enhanced functionality
  const {
    query,
    setQuery,
    filters,
    updateFilter,
    clearFilters,
    searchResults,
    isAdvancedMode,
    setIsAdvancedMode
  } = useAdvancedSearch(allFiles);

  const {
    recentFiles,
    addRecentFile,
    removeRecentFile,
    clearRecentFiles,
    getRecentFilesWithData
  } = useRecentFiles();

  // Keyboard navigation
  useKeyboardNavigation({
    files: allFiles,
    currentFileId,
    onFileSelect: (fileId) => {
      onFileSelect(fileId);
      addRecentFile(fileId);
    },
    onCreateFile: () => setIsCreating({ type: 'file' }),
    onCreateFolder: () => setIsCreating({ type: 'folder' }),
    onDeleteFile: onDeleteFile,
    enabled: !isCollapsed
  });

  // Drag and Drop functionality
  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getDropIndicatorStyle
  } = useDragAndDrop(allFiles, onMoveFile || (() => {}));

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

  const handleFileSelect = (fileId: string) => {
    onFileSelect(fileId);
    addRecentFile(fileId);
  };

  // Get available tags for search
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allFiles.forEach(file => {
      file.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [allFiles]);

  // Get recent files with data
  const recentFilesWithData = getRecentFilesWithData(allFiles);

  // Get favorites
  const favoriteFiles = allFiles.filter(file => file.tags?.includes('favorite'));

  // Filter files based on current view and search
  const displayFiles = useMemo(() => {
    let baseFiles = files;
    
    switch (activeView) {
      case 'search':
        const searchedFiles = searchResults;
        // Convert flat list back to tree structure for search results
        return searchedFiles.filter(f => !f.parentId).map(file => ({
          ...file,
          children: searchedFiles.filter(child => child.parentId === file.id)
        }));
      case 'recent':
        return recentFilesWithData.filter(f => !f.parentId).map(file => ({
          ...file,
          children: recentFilesWithData.filter(child => child.parentId === file.id)
        }));
      case 'favorites':
        return favoriteFiles.filter(f => !f.parentId).map(file => ({
          ...file,
          children: favoriteFiles.filter(child => child.parentId === file.id)
        }));
      default:
        baseFiles = files;
    }

    // Apply tag filter if selected
    if (selectedTags.length === 0) return baseFiles;
    
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

    return filterTree(baseFiles);
  }, [files, selectedTags, activeView, searchResults, recentFilesWithData, favoriteFiles]);

  const renderFileTree = (items: (FileItem & {
    children?: FileItem[];
  })[], level = 0) => {
    return items.map(item => {
      const isDragging = dragState.draggedItem?.id === item.id;
      const isDropTarget = dragState.dragOverItem?.id === item.id;
      const dropIndicatorClass = isDropTarget ? getDropTargetClass() : '';
      
      return (
        <div key={item.id} className="select-none">
          <div 
            draggable={!isCollapsed && onMoveFile !== undefined}
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => handleDragOver(e, item)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, item)}
            onDragEnd={handleDragEnd}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl cursor-pointer group transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 relative",
              currentFileId === item.id && "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white shadow-xl border border-purple-500/30 scale-[1.02]",
              level > 0 && "ml-4",
              isDragging && "opacity-50 scale-95",
              isDropTarget && dragState.dropPosition === 'inside' && "bg-purple-500/10 border-2 border-dashed border-purple-500",
              dropIndicatorClass
            )} 
            onClick={() => {
              if (item.type === 'file') {
                handleFileSelect(item.id);
              } else {
                onToggleFolder(item.id);
              }
            }}
          >
            {/* Drop indicator lines */}
            {isDropTarget && dragState.dropPosition === 'above' && (
              <div className="absolute -top-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full z-10" />
            )}
            {isDropTarget && dragState.dropPosition === 'below' && (
              <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full z-10" />
            )}

            {/* Drag handle */}
            {!isCollapsed && onMoveFile && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-gray-400 hover:text-gray-300" />
              </div>
            )}

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
              {item.emoji && !isCollapsed && (
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
              {!isCollapsed && (
                <span className="truncate flex-1 font-medium transition-all duration-300 group-hover:text-white">
                  {item.name}
                </span>
              )}
            </div>

            {!isCollapsed && (
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
            )}
          </div>

          {/* Sub-item creator */}
          {!isCollapsed && showSubItemCreator === item.id && (
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
            </div>
          )}
        </div>
      );
    });
  };

  const getDropTargetClass = () => {
    if (!dragState.dropPosition) return '';
    
    switch (dragState.dropPosition) {
      case 'above':
        return 'border-t-2 border-purple-500';
      case 'below':
        return 'border-b-2 border-purple-500';
      case 'inside':
        return 'bg-purple-500/10 border-2 border-dashed border-purple-500';
      default:
        return '';
    }
  };

  const sidebarContent = (
    <div className={cn(
      "h-full bg-background border-r border-border flex flex-col overflow-y-auto transition-all duration-300",
      isCollapsed ? "w-16" : "w-72 max-w-full"
    )}>
      {/* Enhanced Header */}
      <div className="p-4 border-b border-border/60 bg-gradient-to-r from-purple-500/5 to-blue-500/5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Sparkles className="h-7 w-7 text-purple-400 animate-pulse" />
                <div className="absolute inset-0 bg-purple-400/20 rounded-full blur-xl animate-pulse"></div>
              </div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x">
                Notion Spark
              </h1>
            </div>
          )}
          
          <div className={cn("flex items-center gap-2", isCollapsed && "flex-col")}>
            {!isCollapsed && (
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
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-9 w-9 p-0 rounded-full hover:bg-gray-500/20 transition-all duration-300 hover:scale-110"
              title={isCollapsed ? "Expandir sidebar" : "Minimizar sidebar"}
            >
              {isCollapsed ? 
                <PanelLeftOpen className="h-4 w-4" /> : 
                <PanelLeftClose className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        {!isCollapsed && (
          <div className="flex bg-gray-800/30 rounded-lg p-1 mb-4">
            {[
              { id: 'files', label: 'Arquivos', icon: FileText },
              { id: 'search', label: 'Buscar', icon: Search },
              { id: 'recent', label: 'Recentes', icon: Clock },
              { id: 'favorites', label: 'Favoritos', icon: Star }
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="ghost"
                size="sm"
                onClick={() => setActiveView(id as any)}
                className={cn(
                  "flex-1 h-8 text-xs",
                  activeView === id && "bg-purple-500/20 text-purple-400"
                )}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        )}
        
        {/* Search Panel */}
        {!isCollapsed && activeView === 'search' && (
          <AdvancedSearchPanel
            query={query}
            setQuery={setQuery}
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            isAdvancedMode={isAdvancedMode}
            setIsAdvancedMode={setIsAdvancedMode}
            availableTags={availableTags}
          />
        )}
      </div>

      {/* Enhanced Tags Panel */}
      {!isCollapsed && showTagsPanel && activeView === 'files' && (
        <div className="border-b border-border/60 p-4 bg-gradient-to-r from-purple-500/5 to-blue-500/5 animate-fade-in backdrop-blur-sm">
          <TagsPanel
            tags={tagTree}
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            onTagFilter={handleTagFilter}
          />
        </div>
      )}

      {/* Quick Actions */}
      {!isCollapsed && activeView === 'files' && (
        <div className="p-4">
          <QuickActions
            onCreateFile={() => setIsCreating({ type: 'file' })}
            onCreateFolder={() => setIsCreating({ type: 'folder' })}
            onToggleSearch={() => setActiveView('search')}
            onOpenSettings={() => {}}
            onToggleFavorites={() => setActiveView('favorites')}
            onShowRecent={() => setActiveView('recent')}
            hasSelection={!!currentFileId}
            onDeleteSelected={currentFileId ? () => onDeleteFile(currentFileId) : undefined}
          />
        </div>
      )}

      {/* Enhanced Action Buttons for collapsed mode */}
      {isCollapsed && (
        <div className="p-2 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-12 justify-center p-0 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 transition-all duration-300 hover:scale-110 rounded-xl group"
            onClick={() => setIsCreating({ type: 'file' })}
            title="Nova Nota"
          >
            <FilePlus className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-12 justify-center p-0 text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/20 hover:to-purple-500/20 transition-all duration-300 hover:scale-110 rounded-xl group"
            onClick={() => setIsCreating({ type: 'folder' })}
            title="Nova Pasta"
          >
            <FolderPlus className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
          </Button>
        </div>
      )}

      <Separator className="mx-4" />

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-border/60 scrollbar-track-transparent hover:scrollbar-thumb-border/80">
        {activeView === 'recent' ? (
          <RecentFilesPanel
            recentFiles={recentFilesWithData}
            onFileSelect={handleFileSelect}
            onRemoveFromRecent={removeRecentFile}
            onClearAll={clearRecentFiles}
          />
        ) : (
          <>
            {/* Create new item input */}
            {!isCollapsed && isCreating && !isCreating.parentId && (
              // ... keep existing code (create item input)
              <div className="flex items-center gap-3 px-3 py-2 mb-3 animate-fade-in">
                {isCreating.type === 'folder' ? (
                  <Folder className="h-5 w-5 text-blue-400" />
                ) : (
                  <FileText className="h-5 w-5 text-gray-400" />
                )}
                <input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateItem();
                    if (e.key === 'Escape') setIsCreating(null);
                  }}
                  onBlur={handleCreateItem}
                  className="h-8 text-sm bg-background/60 backdrop-blur-sm border border-purple-500/30 focus:border-purple-500/60 transition-all duration-300 rounded-lg px-2 flex-1"
                  placeholder={isCreating.type === 'folder' ? 'Nova pasta' : 'Nova nota'}
                  autoFocus
                />
              </div>
            )}
            
            {/* File Tree */}
            <div className="space-y-1">
              {renderFileTree(displayFiles)}
            </div>
          </>
        )}
      </div>

      {/* Enhanced Footer */}
      <div className={cn(
        "p-4 border-t border-border/60 bg-gradient-to-r from-purple-500/5 to-blue-500/5 backdrop-blur-sm",
        isCollapsed && "p-2"
      )}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Home className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Tag className="h-3 w-3" />
            <span>Tags: {tagTree.length} categorias</span>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-sm shadow-green-400/50"></div>
              <span>Online</span>
            </div>
          </div>
        )}
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
