
import { useState, useCallback } from 'react';
import type { FileItem } from '@/types';

export interface DragState {
  isDragging: boolean;
  draggedItem: FileItem | null;
  dragOverItem: FileItem | null;
  dropPosition: 'above' | 'below' | 'inside' | null;
}

export const useDragAndDrop = (
  files: FileItem[],
  onMoveFile: (fileId: string, newParentId?: string, newPosition?: number) => void
) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverItem: null,
    dropPosition: null
  });

  const handleDragStart = useCallback((e: React.DragEvent, item: FileItem) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    
    setDragState({
      isDragging: true,
      draggedItem: item,
      dragOverItem: null,
      dropPosition: null
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, item: FileItem) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    let dropPosition: 'above' | 'below' | 'inside' | null = null;
    
    if (item.type === 'folder') {
      // Para pastas, dividimos em 3 zonas: acima (25%), dentro (50%), abaixo (25%)
      if (y < height * 0.25) {
        dropPosition = 'above';
      } else if (y > height * 0.75) {
        dropPosition = 'below';
      } else {
        dropPosition = 'inside';
      }
    } else {
      // Para arquivos, apenas acima ou abaixo
      dropPosition = y < height / 2 ? 'above' : 'below';
    }

    setDragState(prev => ({
      ...prev,
      dragOverItem: item,
      dropPosition
    }));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Só limpa se realmente saiu do elemento (não apenas mudou para um filho)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragState(prev => ({
        ...prev,
        dragOverItem: null,
        dropPosition: null
      }));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetItem: FileItem) => {
    e.preventDefault();
    
    const draggedId = e.dataTransfer.getData('text/plain');
    const draggedItem = files.find(f => f.id === draggedId);
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      setDragState({
        isDragging: false,
        draggedItem: null,
        dragOverItem: null,
        dropPosition: null
      });
      return;
    }

    // Previne mover uma pasta para dentro de si mesma ou de suas subpastas
    const isDescendant = (itemId: string, potentialAncestorId: string): boolean => {
      const item = files.find(f => f.id === itemId);
      if (!item?.parentId) return false;
      if (item.parentId === potentialAncestorId) return true;
      return isDescendant(item.parentId, potentialAncestorId);
    };

    if (dragState.dropPosition === 'inside' && targetItem.type === 'folder') {
      if (draggedItem.id === targetItem.id || isDescendant(targetItem.id, draggedItem.id)) {
        setDragState({
          isDragging: false,
          draggedItem: null,
          dragOverItem: null,
          dropPosition: null
        });
        return;
      }
      
      // Move para dentro da pasta
      onMoveFile(draggedItem.id, targetItem.id);
    } else {
      // Move para a mesma pasta que o target, acima ou abaixo
      const targetParentId = targetItem.parentId;
      
      if (isDescendant(targetItem.id, draggedItem.id)) {
        setDragState({
          isDragging: false,
          draggedItem: null,
          dragOverItem: null,
          dropPosition: null
        });
        return;
      }
      
      // Calcula nova posição baseada nos irmãos
      const siblings = files.filter(f => f.parentId === targetParentId);
      const targetIndex = siblings.findIndex(f => f.id === targetItem.id);
      const newPosition = dragState.dropPosition === 'above' ? targetIndex : targetIndex + 1;
      
      onMoveFile(draggedItem.id, targetParentId, newPosition);
    }

    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverItem: null,
      dropPosition: null
    });
  }, [files, dragState.dropPosition, onMoveFile]);

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverItem: null,
      dropPosition: null
    });
  }, []);

  const getDropIndicatorStyle = useCallback((item: FileItem) => {
    if (dragState.dragOverItem?.id !== item.id || !dragState.dropPosition) {
      return {};
    }

    const baseStyle = {
      position: 'relative' as const,
    };

    switch (dragState.dropPosition) {
      case 'above':
        return {
          ...baseStyle,
          '::before': {
            content: '""',
            position: 'absolute',
            top: '-2px',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#8b5cf6',
            borderRadius: '1px',
            zIndex: 10
          }
        };
      case 'below':
        return {
          ...baseStyle,
          '::after': {
            content: '""',
            position: 'absolute',
            bottom: '-2px',
            left: '0',
            right: '0',
            height: '2px',
            backgroundColor: '#8b5cf6',
            borderRadius: '1px',
            zIndex: 10
          }
        };
      case 'inside':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          borderRadius: '8px',
          border: '2px dashed #8b5cf6'
        };
      default:
        return baseStyle;
    }
  }, [dragState]);

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getDropIndicatorStyle
  };
};
