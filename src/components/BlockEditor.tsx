
import React, { useState, useCallback } from 'react';
import { Plus, Type, List, Code, Image, Quote, Hash } from 'lucide-react';
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

const blockTypes = [
  { type: 'text', label: 'Texto', icon: Type },
  { type: 'heading', label: 'Título', icon: Hash },
  { type: 'list', label: 'Lista', icon: List },
  { type: 'code', label: 'Código', icon: Code },
  { type: 'quote', label: 'Citação', icon: Quote },
];

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onBlocksChange,
  className
}) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);

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
    onBlocksChange(blocks.filter(block => block.id !== id));
  }, [blocks, onBlocksChange]);

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
        <div key={block.id} className="group relative">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              {renderBlock(block)}
            </div>
            
            {/* Block Controls */}
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlockMenu(showBlockMenu === block.id ? null : block.id)}
                className="h-6 w-6 p-0"
              >
                <Plus className="h-3 w-3" />
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
