import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, GripVertical, Minus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Block } from '@/types';
import { TextBlock } from './blocks/TextBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { ToggleBlock } from './blocks/ToggleBlock';
import { TableBlock } from './blocks/TableBlock';
import { DatabaseBlock } from './blocks/DatabaseBlock';
import { SlashMenu } from './blocks/SlashMenu';
import { EmbedBlock } from './blocks/EmbedBlock';

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  className?: string;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onBlocksChange,
  className
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const [slashMenu, setSlashMenu] = useState<{
    isOpen: boolean;
    blockId: string;
    position: { x: number; y: number };
    query: string;
  }>({
    isOpen: false,
    blockId: '',
    position: { x: 0, y: 0 },
    query: ''
  });

  const editorRef = useRef<HTMLDivElement>(null);

  const addBlock = useCallback((type: Block['type'], afterId?: string, properties?: any) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
      properties: properties || {}
    };

    if (afterId) {
      const index = blocks.findIndex(b => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onBlocksChange(newBlocks);
    } else {
      onBlocksChange([...blocks, newBlock]);
    }

    setSelectedBlockId(newBlock.id);
    setSlashMenu({ isOpen: false, blockId: '', position: { x: 0, y: 0 }, query: '' });
  }, [blocks, onBlocksChange]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    onBlocksChange(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  }, [blocks, onBlocksChange]);

  const deleteBlock = useCallback((id: string) => {
    if (blocks.length === 1) return;
    onBlocksChange(blocks.filter(block => block.id !== id));
  }, [blocks, onBlocksChange]);

  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = blocks.find(b => b.id === id);
    if (!blockToDuplicate) return;

    const newBlock: Block = {
      ...blockToDuplicate,
      id: Date.now().toString()
    };

    const index = blocks.findIndex(b => b.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    onBlocksChange(newBlocks);
  }, [blocks, onBlocksChange]);

  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    if (!draggedBlock || draggedBlock === targetBlockId) return;

    const fromIndex = blocks.findIndex(b => b.id === draggedBlock);
    const toIndex = blocks.findIndex(b => b.id === targetBlockId);
    
    moveBlock(fromIndex, toIndex);
    setDraggedBlock(null);
  };

  const handleContentChange = useCallback((blockId: string, content: string) => {
    // Check for slash command
    if (content.endsWith('/')) {
      const element = document.querySelector(`[data-block-id="${blockId}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setSlashMenu({
          isOpen: true,
          blockId,
          position: { x: rect.left, y: rect.bottom + 5 },
          query: ''
        });
      }
      return;
    }

    // Check if typing after slash
    if (slashMenu.isOpen && slashMenu.blockId === blockId) {
      const slashIndex = content.lastIndexOf('/');
      if (slashIndex !== -1) {
        const query = content.slice(slashIndex + 1);
        setSlashMenu(prev => ({ ...prev, query }));
        return;
      } else {
        setSlashMenu({ isOpen: false, blockId: '', position: { x: 0, y: 0 }, query: '' });
      }
    }

    updateBlock(blockId, { content });
  }, [updateBlock, slashMenu]);

  const handleSlashMenuSelect = useCallback((type: Block['type'], properties?: any) => {
    if (!slashMenu.blockId) return;

    const block = blocks.find(b => b.id === slashMenu.blockId);
    if (!block) return;

    // Remove the slash command from content
    const slashIndex = block.content.lastIndexOf('/');
    const contentBeforeSlash = slashIndex > 0 ? block.content.slice(0, slashIndex) : '';
    
    // Update current block or create new one
    if (contentBeforeSlash) {
      updateBlock(slashMenu.blockId, { content: contentBeforeSlash });
      addBlock(type, slashMenu.blockId, properties);
    } else {
      updateBlock(slashMenu.blockId, { type, content: '', properties: properties || {} });
    }

    setSlashMenu({ isOpen: false, blockId: '', position: { x: 0, y: 0 }, query: '' });
  }, [slashMenu.blockId, blocks, updateBlock, addBlock]);

  // Close slash menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (slashMenu.isOpen) {
        setSlashMenu({ isOpen: false, blockId: '', position: { x: 0, y: 0 }, query: '' });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [slashMenu.isOpen]);

  const renderBlock = (block: Block) => {
    const isSelected = selectedBlockId === block.id;

    const commonProps = {
      block,
      isSelected,
      onUpdate: (updates: Partial<Block>) => updateBlock(block.id, updates),
      onFocus: () => setSelectedBlockId(block.id)
    };

    const handleContentUpdate = (content: string) => {
      handleContentChange(block.id, content);
    };

    switch (block.type) {
      case 'heading':
        return <HeadingBlock {...commonProps} />;
      case 'callout':
        return <CalloutBlock {...commonProps} />;
      case 'toggle':
        return <ToggleBlock {...commonProps} />;
      case 'table':
        return <TableBlock {...commonProps} />;
      case 'database':
        return <DatabaseBlock {...commonProps} />;
      
      // Embed blocks
      case 'embed-youtube':
      case 'embed-twitter':
      case 'embed-image':
      case 'embed-pdf':
      case 'embed-figma':
      case 'embed-codepen':
        return <EmbedBlock {...commonProps} />;
      
      case 'list':
        return (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-2">•</span>
            <TextBlock 
              {...commonProps} 
              onUpdate={(updates) => {
                if (updates.content !== undefined) {
                  handleContentUpdate(updates.content);
                } else {
                  updateBlock(block.id, updates);
                }
              }}
            />
          </div>
        );
      case 'code':
        return (
          <div className="bg-notion-dark-hover rounded-md p-3">
            <TextBlock 
              {...commonProps}
              onUpdate={(updates) => {
                if (updates.content !== undefined) {
                  handleContentUpdate(updates.content);
                } else {
                  updateBlock(block.id, updates);
                }
              }}
            />
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-notion-purple pl-4">
            <TextBlock 
              {...commonProps}
              onUpdate={(updates) => {
                if (updates.content !== undefined) {
                  handleContentUpdate(updates.content);
                } else {
                  updateBlock(block.id, updates);
                }
              }}
            />
          </div>
        );
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <TextBlock 
              {...commonProps}
              onUpdate={(updates) => {
                if (updates.content !== undefined) {
                  handleContentUpdate(updates.content);
                } else {
                  updateBlock(block.id, updates);
                }
              }}
            />
          </div>
        );
      default:
        return (
          <TextBlock 
            {...commonProps}
            onUpdate={(updates) => {
              if (updates.content !== undefined) {
                handleContentUpdate(updates.content);
              } else {
                updateBlock(block.id, updates);
              }
            }}
          />
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)} ref={editorRef}>
      {blocks.map((block, index) => (
        <div 
          key={block.id}
          data-block-id={block.id}
          className="group relative"
          draggable
          onDragStart={(e) => handleDragStart(e, block.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, block.id)}
        >
          <div className="flex items-start gap-2">
            {/* Drag Handle */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center pt-2">
              <GripVertical className="h-4 w-4 text-gray-400 cursor-grab hover:text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              {renderBlock(block)}
            </div>
            
            {/* Block Controls */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addBlock('text', block.id)}
                className="h-6 w-6 p-0"
                title="Adicionar bloco"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => duplicateBlock(block.id)}
                className="h-6 w-6 p-0"
                title="Duplicar"
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteBlock(block.id)}
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                title="Deletar"
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {blocks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">Digite / para ver comandos</p>
          <Button
            variant="ghost"
            onClick={() => addBlock('text')}
            className="gap-2 text-gray-400 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Adicionar bloco
          </Button>
        </div>
      )}

      <SlashMenu
        isOpen={slashMenu.isOpen}
        position={slashMenu.position}
        onSelect={handleSlashMenuSelect}
        onClose={() => setSlashMenu({ isOpen: false, blockId: '', position: { x: 0, y: 0 }, query: '' })}
        query={slashMenu.query}
      />
    </div>
  );
};
