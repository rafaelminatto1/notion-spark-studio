import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Plus,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Sparkles,
  GripVertical,
  Trash2,
  Edit,
  Copy,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { SubItemCreator } from '@/components/SubItemCreator';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { VirtualizedList } from '@/components/VirtualizedList';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  isMobile?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigateToFile: (fileId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobile = false,
  open = false,
  onOpenChange,
  onNavigateToFile,
}) => {
  const [showSubItemCreator, setShowSubItemCreator] = useState<string | null>(null);

  const {
    files,
    currentFileId,
    expandedFolders,
    navigateTo: onFileSelect,
    toggleFolder: onToggleFolder,
    createFile: onCreateFile,
    updateFile: onUpdateFile,
    deleteFile: onDeleteFile,
    moveFile: onMoveFile,
    getFileTree,
    getFlatFileTree,
    favorites,
    toggleFavorite,
  } = useFileSystemContext();

  const fileTree = getFileTree();

  useKeyboardNavigation({
    files: files,
    currentFileId: currentFileId,
    onFileSelect: onFileSelect,
    onCreateFile: () => onCreateFile('Nova Nota', undefined, 'file'),
    onCreateFolder: () => onCreateFile('Nova Pasta', undefined, 'folder'),
    onDeleteFile: onDeleteFile,
    enabled: true
  });

  const {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getDropIndicatorStyle
  } = useDragAndDrop(files, onMoveFile || (() => {}));

  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !open) {
        onOpenChange?.(true);
      }
    },
    onSwipeLeft: () => {
      if (isMobile && open) {
        onOpenChange?.(false);
      }
    }
  });

  const handleCreateSubItem = async (name: string, parentId: string, type: 'file' | 'folder') => {
    await onCreateFile(name, parentId, type);
    setShowSubItemCreator(null);
    return '';
  };

  const handleFileSelect = (fileId: string) => {
    onNavigateToFile(fileId);
  };

  const handleMenuAction = async (e: React.MouseEvent, action: string, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const item = files.find(f => f.id === itemId);
    if (!item) return;

    try {
      switch (action) {
        case 'editar':
          // Implementar edição de nome
          const newName = prompt('Digite o novo nome:', item.name);
          if (newName && newName.trim() !== item.name) {
            await onUpdateFile(itemId, { name: newName.trim() });
          }
          break;
          
        case 'copiar':
          // Implementar duplicação
          const copyName = `${item.name} (cópia)`;
          const itemType = item.type === 'database' ? 'file' : item.type;
          await onCreateFile(copyName, item.parentId, itemType);
          break;
          
        case 'favoritar':
          toggleFavorite(itemId);
          break;
          
        case 'deletar':
          if (confirm(`Tem certeza que deseja deletar "${item.name}"?`)) {
            await onDeleteFile(itemId);
          }
          break;
          
        default:
          console.warn('Ação não implementada:', action);
      }
    } catch (error) {
      console.error('Erro ao executar ação:', error);
      alert('Erro ao executar a ação. Tente novamente.');
    }
  };

  const displayFiles = useMemo(() => {
    return getFlatFileTree();
  }, [getFlatFileTree]);

  const renderFileTree = (items: (FileItem & {
    children?: FileItem[];
    level?: number;
  })[]) => {
    return (
      <VirtualizedList
        items={items}
        height={window.innerHeight - (isMobile ? 120 : 100)}
        itemHeight={40}
        renderItem={(item) => {
          const isDragging = dragState.draggedItem?.id === item.id;
          const isDropTarget = dragState.dragOverItem?.id === item.id;
          const dropIndicatorClass = getDropIndicatorStyle(item);

          return (
            <div key={item.id} className="select-none">
              <div
                data-file-item={item.id}
                data-file-name={item.name}
                draggable={onMoveFile !== undefined}
                onDragStart={(e) => handleDragStart(e, item)}
                onDragOver={(e) => handleDragOver(e, item)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, item)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 text-sm rounded-xl cursor-pointer group transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-blue-500/10 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 relative",
                  currentFileId === item.id && "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white shadow-xl border border-purple-500/30 scale-[1.02]",
                  item.level && item.level > 0 && `ml-${item.level * 4}`,
                  isDragging && "opacity-50 scale-95",
                  isDropTarget && dragState.dropPosition === 'inside' && "bg-purple-500/10 border-2 border-dashed border-purple-500",
                  dropIndicatorClass,
                  "iphone-11:text-xs iphone-11:py-1.5 iphone-11:px-2",
                  "ipad-10:text-sm ipad-10:py-2 ipad-10:px-3"
                )}
                onClick={(e) => {
                  // Verificar se o clique foi em um botão filho
                  const targetElement = e.target as Element;
                  if (targetElement.closest('button[data-sidebar="menu-button"]') || 
                      targetElement.closest('[role="menuitem"]') ||
                      targetElement.closest('button:not([data-file-item])')) {
                    return;
                  }
                  
                  handleFileSelect(item.id);
                }}
              >
                {isDropTarget && dragState.dropPosition === 'above' && (
                  <div className="absolute -top-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full z-10" />
                )}
                {isDropTarget && dragState.dropPosition === 'below' && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-500 rounded-full z-10" />
                )}

                {onMoveFile && (
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

                <div className={cn(
                  "flex items-center gap-1 transition-all duration-300",
                  // No mobile, sempre visível; no desktop, só no hover
                  isMobile 
                    ? "opacity-100 transform translate-x-0" 
                    : "opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                )}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      setShowSubItemCreator(showSubItemCreator === item.id ? null : item.id);
                    }}
                    className={cn(
                      "h-7 w-7 p-0 hover:bg-purple-500/20 hover:scale-125 transition-all duration-300 rounded-full",
                      // Aumentar área de toque no mobile
                      isMobile && "min-h-[44px] min-w-[44px] h-11 w-11 active:scale-95 active:bg-purple-500/30"
                    )}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className={cn(
                          "h-7 w-7 p-0 hover:bg-gray-500/20 hover:scale-125 transition-all duration-300 rounded-full",
                          // Aumentar área de toque no mobile
                          isMobile && "min-h-[44px] min-w-[44px] h-11 w-11 active:scale-95 active:bg-gray-500/30"
                        )}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className={cn(
                        "w-48 bg-background/95 backdrop-blur-lg border border-border/60 shadow-xl",
                        isMobile && "w-56 text-base" // Maior no mobile
                      )}
                    >
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuAction(e as any, 'editar', item.id);
                        }}
                        className={cn(
                          "cursor-pointer hover:bg-purple-500/10",
                          isMobile && "py-3 px-4 text-base" // Maior área de toque
                        )}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuAction(e as any, 'copiar', item.id);
                        }}
                        className={cn(
                          "cursor-pointer hover:bg-blue-500/10",
                          isMobile && "py-3 px-4 text-base"
                        )}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuAction(e as any, 'favoritar', item.id);
                        }}
                        className={cn(
                          "cursor-pointer hover:bg-yellow-500/10",
                          isMobile && "py-3 px-4 text-base",
                          favorites.includes(item.id) && "text-yellow-400"
                        )}
                      >
                        <Star className={cn(
                          "h-4 w-4 mr-2",
                          favorites.includes(item.id) && "fill-current"
                        )} />
                        {favorites.includes(item.id) ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuAction(e as any, 'deletar', item.id);
                        }}
                        className={cn(
                          "cursor-pointer hover:bg-red-500/10 text-red-500",
                          isMobile && "py-3 px-4 text-base"
                        )}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {showSubItemCreator === item.id && (
                <div className="ml-6 mt-2 animate-fade-in relative z-50 bg-background/95 backdrop-blur-sm rounded-lg p-2 border border-purple-500/20">
                  <SubItemCreator
                    parentId={item.id}
                    onCreateSubItem={handleCreateSubItem}
                  />
                </div>
              )}
            </div>
          );
        }}
      />
    );
  };

  const sidebarContent = (
    <div className={cn(
      "flex flex-col h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      isMobile ? "w-full" : "w-72",
      "iphone-11:px-2 iphone-11:py-2",
      "ipad-10:px-4 ipad-10:py-4"
    )}>
      <div className="p-4 border-b border-border/60 iphone-11:px-2 iphone-11:py-2 ipad-10:px-4 ipad-10:py-4 flex flex-col gap-3">
        <Button
          className="w-full text-lg py-3 h-auto justify-center rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-blue-500/30"
          onClick={() => onCreateFile('Nova Nota', undefined, 'file')}
        >
          <Sparkles className="h-6 w-6 mr-2" />
          Criar Nova Nota
        </Button>
        <Button
          className="w-full text-lg py-3 h-auto justify-center rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-green-500/30"
          onClick={() => onCreateFile('Nova Pasta', undefined, 'folder')}
        >
          <Folder className="h-6 w-6 mr-2" />
          Criar Nova Pasta
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        {renderFileTree(displayFiles)}
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
