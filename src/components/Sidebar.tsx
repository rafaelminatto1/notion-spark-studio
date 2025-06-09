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
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { VirtualizedList } from '@/components/VirtualizedList';

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
  const { triggerAction, triggerSuccess } = useHapticFeedback();

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

  // Configurar gestos de swipe
  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !open) {
        onOpenChange?.(true);
        triggerAction();
      }
    },
    onSwipeLeft: () => {
      if (isMobile && open) {
        onOpenChange?.(false);
        triggerAction();
      }
    }
  });

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
    triggerSuccess();
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
    return (
      <VirtualizedList
        items={items}
        height={window.innerHeight - 200}
        itemHeight={40}
        renderItem={(item) => {
          const isDragging = dragState.draggedItem?.id === item.id;
          const isDropTarget = dragState.dropTarget?.id === item.id;
          const dropIndicatorClass = getDropIndicatorStyle(item);

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
                  dropIndicatorClass,
                  "iphone-11:text-xs iphone-11:py-1.5 iphone-11:px-2",
                  "ipad-10:text-sm ipad-10:py-2 ipad-10:px-3"
                )} 
                onClick={() => handleFileSelect(item.id)}
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

              {item.children && expandedFolders.has(item.id) && (
                <div className="ml-4">
                  {renderFileTree(item.children, level + 1)}
                </div>
              )}
            </div>
          );
        }}
      />
    );
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
      "flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      isMobile ? "w-full" : "w-72",
      "iphone-11:px-2 iphone-11:py-2",
      "ipad-10:px-4 ipad-10:py-4"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Arquivos</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8"
          >
            {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border/60 iphone-11:px-2 iphone-11:py-2 ipad-10:px-4 ipad-10:py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar arquivos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-muted/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 iphone-11:text-xs ipad-10:text-sm"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-4 border-b border-border/60 overflow-x-auto iphone-11:px-2 iphone-11:py-2 ipad-10:px-4 ipad-10:py-4">
        <Button
          variant={activeView === 'files' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('files')}
          className="flex-1 min-w-[80px] iphone-11:min-w-[60px] ipad-10:min-w-[80px]"
        >
          <Folder className="h-4 w-4 mr-2 iphone-11:h-3 iphone-11:w-3 ipad-10:h-4 ipad-10:w-4" />
          <span className="iphone-11:text-xs ipad-10:text-sm">Arquivos</span>
        </Button>
        <Button
          variant={activeView === 'search' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('search')}
          className="flex-1 min-w-[80px] iphone-11:min-w-[60px] ipad-10:min-w-[80px]"
        >
          <Search className="h-4 w-4 mr-2 iphone-11:h-3 iphone-11:w-3 ipad-10:h-4 ipad-10:w-4" />
          <span className="iphone-11:text-xs ipad-10:text-sm">Buscar</span>
        </Button>
        <Button
          variant={activeView === 'recent' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('recent')}
          className="flex-1 min-w-[80px] iphone-11:min-w-[60px] ipad-10:min-w-[80px]"
        >
          <Clock className="h-4 w-4 mr-2 iphone-11:h-3 iphone-11:w-3 ipad-10:h-4 ipad-10:w-4" />
          <span className="iphone-11:text-xs ipad-10:text-sm">Recentes</span>
        </Button>
        <Button
          variant={activeView === 'favorites' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveView('favorites')}
          className="flex-1 min-w-[80px] iphone-11:min-w-[60px] ipad-10:min-w-[80px]"
        >
          <Star className="h-4 w-4 mr-2 iphone-11:h-3 iphone-11:w-3 ipad-10:h-4 ipad-10:w-4" />
          <span className="iphone-11:text-xs ipad-10:text-sm">Favoritos</span>
        </Button>
      </div>

      {/* File Tree with VirtualizedList */}
      <div className="flex-1 overflow-hidden">
        {renderFileTree(displayFiles)}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-border/60 iphone-11:px-2 iphone-11:py-2 ipad-10:px-4 ipad-10:py-4">
        <QuickActions
          onCreateFile={() => setIsCreating({ type: 'file' })}
          onCreateFolder={() => setIsCreating({ type: 'folder' })}
          onShowTags={() => setShowTagsPanel(true)}
        />
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
