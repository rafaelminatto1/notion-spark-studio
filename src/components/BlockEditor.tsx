
import React, { useState, useCallback } from 'react';
import { Plus, Type, List, Code, Image, Quote, Hash, Minus, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Block } from '@/types';

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
  className?: string;
}

const blockTypes: Array<{ type: Block['type']; label: string; icon: React.ComponentType<any> }> = [
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'heading', label: 'Título', icon: Hash },
  { type: 'list', label: 'Lista', icon: List },
  { type: 'code', label: 'Código', icon: Code },
  { type: 'quote', label: 'Citação', icon: Quote },
  { type: 'image', label: 'Imagem', icon: Image },
];

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onBlocksChange,
  className
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  const addBlock = useCallback((type: Block['type'], afterId?: string) => {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: '',
      properties: {}
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
    setShowBlockMenu(null);
  }, [blocks, onBlocksChange]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    onBlocksChange(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  }, [blocks, onBlocksChange]);

  const deleteBlock = useCallback((id: string) => {
    if (blocks.length === 1) return; // Keep at least one block
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

  const renderBlock = (block: Block) => {
    const isSelected = selectedBlockId === block.id;

    const baseProps = {
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
        updateBlock(block.id, { content: e.target.value }),
      onFocus: () => setSelectedBlockId(block.id),
      className: cn(
        "w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-gray-200",
        isSelected && "ring-1 ring-notion-purple"
      )
    };

    switch (block.type) {
      case 'heading':
        return (
          <Input
            {...baseProps}
            placeholder="Título"
            className={cn(baseProps.className, "text-2xl font-bold")}
          />
        );
      case 'list':
        return (
          <div className="flex items-start gap-2">
            <span className="text-gray-400 mt-1">•</span>
            <Input
              {...baseProps}
              placeholder="Item da lista"
            />
          </div>
        );
      case 'code':
        return (
          <div className="bg-notion-dark-hover rounded-md p-3">
            <Textarea
              {...baseProps}
              placeholder="Código..."
              className={cn(baseProps.className, "font-mono text-sm")}
              rows={3}
            />
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-notion-purple pl-4">
            <Textarea
              {...baseProps}
              placeholder="Citação..."
              className={cn(baseProps.className, "italic")}
              rows={2}
            />
          </div>
        );
      case 'image':
        return (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
            <Image className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <Input
              {...baseProps}
              placeholder="URL da imagem ou descrição..."
              className="text-center"
            />
            <p className="text-xs text-gray-500 mt-2">
              Cole uma URL de imagem ou descreva o que deveria aparecer aqui
            </p>
          </div>
        );
      default:
        return (
          <Textarea
            {...baseProps}
            placeholder="Escreva algo..."
            rows={1}
          />
        );
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {blocks.map((block, index) => (
        <div 
          key={block.id} 
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
            
            <div className="flex-1">
              {renderBlock(block)}
            </div>
            
            {/* Block Controls */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                className="h-6 w-6 p-0"
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
                <Code className="h-3 w-3" />
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

          {/* Block Menu */}
          {showBlockMenu === block.id && (
            <div className="absolute right-0 top-8 bg-notion-dark-hover border border-notion-dark-border rounded-lg p-2 shadow-lg z-10">
              <div className="grid grid-cols-2 gap-1">
                {blockTypes.map(({ type, label, icon: Icon }) => (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => addBlock(type, block.id)}
                    className="gap-2 justify-start"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {blocks.length === 0 && (
        <Button
          variant="ghost"
          onClick={() => addBlock('text')}
          className="w-full justify-start gap-2 text-gray-400 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          Adicionar bloco
        </Button>
      )}
    </div>
  );
};
