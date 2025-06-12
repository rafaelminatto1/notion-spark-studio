import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, GripVertical, MoreHorizontal, Type, Image, List, Hash, Quote, Code, Calendar, Users, FileText, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: Record<string, any>;
  children?: Block[];
  isActive?: boolean;
}

export type BlockType = 
  | 'paragraph' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3'
  | 'bullet-list'
  | 'numbered-list'
  | 'todo'
  | 'quote'
  | 'code'
  | 'divider'
  | 'image'
  | 'table'
  | 'callout'
  | 'toggle'
  | 'columns';

interface BlockCommand {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: BlockType;
  shortcut?: string;
  category: 'basic' | 'media' | 'database' | 'advanced';
}

const BLOCK_COMMANDS: BlockCommand[] = [
  // Basic blocks
  {
    id: 'paragraph',
    label: 'Texto',
    description: 'Apenas comece a escrever texto simples.',
    icon: <Type className="h-4 w-4" />,
    type: 'paragraph',
    category: 'basic'
  },
  {
    id: 'heading1',
    label: 'Título 1',
    description: 'Título grande.',
    icon: <Hash className="h-4 w-4" />,
    type: 'heading1',
    shortcut: '#',
    category: 'basic'
  },
  {
    id: 'heading2',
    label: 'Título 2',
    description: 'Título médio.',
    icon: <Hash className="h-4 w-4" />,
    type: 'heading2',
    shortcut: '##',
    category: 'basic'
  },
  {
    id: 'heading3',
    label: 'Título 3',
    description: 'Título pequeno.',
    icon: <Hash className="h-4 w-4" />,
    type: 'heading3',
    shortcut: '###',
    category: 'basic'
  },
  {
    id: 'bullet-list',
    label: 'Lista com marcadores',
    description: 'Criar uma lista simples.',
    icon: <List className="h-4 w-4" />,
    type: 'bullet-list',
    shortcut: '-',
    category: 'basic'
  },
  {
    id: 'numbered-list',
    label: 'Lista numerada',
    description: 'Criar uma lista com números.',
    icon: <List className="h-4 w-4" />,
    type: 'numbered-list',
    shortcut: '1.',
    category: 'basic'
  },
  {
    id: 'todo',
    label: 'Lista de tarefas',
    description: 'Rastrear tarefas com checkbox.',
    icon: <List className="h-4 w-4" />,
    type: 'todo',
    shortcut: '[]',
    category: 'basic'
  },
  {
    id: 'quote',
    label: 'Citação',
    description: 'Capturar uma citação.',
    icon: <Quote className="h-4 w-4" />,
    type: 'quote',
    shortcut: '>',
    category: 'basic'
  },
  {
    id: 'code',
    label: 'Código',
    description: 'Capturar um trecho de código.',
    icon: <Code className="h-4 w-4" />,
    type: 'code',
    shortcut: '```',
    category: 'basic'
  },
  {
    id: 'divider',
    label: 'Divisor',
    description: 'Dividir visualmente blocos.',
    icon: <GripVertical className="h-4 w-4" />,
    type: 'divider',
    shortcut: '---',
    category: 'basic'
  },
  // Media blocks
  {
    id: 'image',
    label: 'Imagem',
    description: 'Fazer upload ou incorporar com link.',
    icon: <Image className="h-4 w-4" />,
    type: 'image',
    category: 'media'
  },
  // Advanced blocks
  {
    id: 'callout',
    label: 'Callout',
    description: 'Fazer seu texto se destacar.',
    icon: <Zap className="h-4 w-4" />,
    type: 'callout',
    category: 'advanced'
  },
  {
    id: 'toggle',
    label: 'Toggle',
    description: 'Criar um toggle list.',
    icon: <GripVertical className="h-4 w-4" />,
    type: 'toggle',
    category: 'advanced'
  }
];

interface BlockEditorProps {
  initialBlocks?: Block[];
  onChange?: (blocks: Block[]) => void;
  placeholder?: string;
  className?: string;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  initialBlocks = [{ id: '1', type: 'paragraph', content: '' }],
  onChange,
  placeholder = 'Digite "/" para comandos...',
  className
}) => {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [commandPosition, setCommandPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  // Filter commands based on query
  const filteredCommands = BLOCK_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().includes(commandQuery.toLowerCase()) ||
    cmd.description.toLowerCase().includes(commandQuery.toLowerCase())
  );

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  const addBlock = useCallback((type: BlockType, afterId?: string, content: string = '') => {
    const newBlock: Block = {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content
    };

    setBlocks(prev => {
      if (!afterId) {
        return [...prev, newBlock];
      }
      
      const index = prev.findIndex(b => b.id === afterId);
      const newBlocks = [...prev];
      newBlocks.splice(index + 1, 0, newBlock);
      return newBlocks;
    });

    return newBlock.id;
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      const filtered = prev.filter(b => b.id !== blockId);
      return filtered.length > 0 ? filtered : [{ id: '1', type: 'paragraph', content: '' }];
    });
  }, []);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;

    const newBlocks = Array.from(blocks);
    const [reorderedItem] = newBlocks.splice(result.source.index, 1);
    newBlocks.splice(result.destination.index, 0, reorderedItem);

    setBlocks(newBlocks);
  }, [blocks]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Handle slash command
    if (e.key === '/' && block.content === '') {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setCommandPosition({ x: rect.left, y: rect.bottom + 4 });
      setShowCommands(true);
      setCommandQuery('');
      setActiveBlockId(blockId);
      return;
    }

    // Handle enter key
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newBlockId = addBlock('paragraph', blockId);
      setTimeout(() => {
        const newBlockEl = document.querySelector(`[data-block-id="${newBlockId}"]`);
        (newBlockEl?.querySelector('[contenteditable]') as HTMLElement)?.focus();
      }, 0);
      return;
    }

    // Handle backspace at beginning
    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(blockId);
      return;
    }

    // Handle markdown shortcuts
    const content = block.content;
    if (e.key === ' ') {
      const shortcuts = {
        '#': 'heading1',
        '##': 'heading2',
        '###': 'heading3',
        '-': 'bullet-list',
        '1.': 'numbered-list',
        '>': 'quote',
        '```': 'code',
        '---': 'divider'
      };

      Object.entries(shortcuts).forEach(([shortcut, type]) => {
        if (content === shortcut) {
          e.preventDefault();
          updateBlock(blockId, { type: type as BlockType, content: '' });
        }
      });
    }
  }, [blocks, addBlock, deleteBlock, updateBlock]);

  const handleCommandSelect = useCallback((command: BlockCommand) => {
    if (!activeBlockId) return;

    updateBlock(activeBlockId, { 
      type: command.type, 
      content: command.type === 'divider' ? '---' : ''
    });
    
    setShowCommands(false);
    setCommandQuery('');
    setActiveBlockId(null);

    // Focus back to the block
    setTimeout(() => {
      const blockEl = document.querySelector(`[data-block-id="${activeBlockId}"]`);
      (blockEl?.querySelector('[contenteditable]') as HTMLElement)?.focus();
    }, 0);
  }, [activeBlockId, updateBlock]);

  // Handle clicks outside to close command menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!editorRef.current?.contains(e.target as Node)) {
        setShowCommands(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notify parent of changes
  useEffect(() => {
    onChange?.(blocks);
  }, [blocks, onChange]);

  return (
    <div ref={editorRef} className={cn("relative", className)}>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      data-block-id={block.id}
                      className={cn(
                        "group relative transition-all duration-200",
                        snapshot.isDragging && "shadow-lg rotate-1 scale-105"
                      )}
                    >
                      <BlockComponent
                        block={block}
                        dragHandleProps={provided.dragHandleProps}
                        onUpdate={(updates) => updateBlock(block.id, updates)}
                        onKeyDown={(e) => handleKeyDown(e, block.id)}
                        onDelete={() => deleteBlock(block.id)}
                        placeholder={index === 0 ? placeholder : "Digite algo..."}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Command Menu */}
      {showCommands && (
        <div
          className="fixed z-50 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          style={{ left: commandPosition.x, top: commandPosition.y }}
        >
          <div className="p-2 border-b border-slate-200 dark:border-slate-600">
            <input
              type="text"
              placeholder="Buscar comandos..."
              value={commandQuery}
              onChange={(e) => setCommandQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-transparent border-none outline-none placeholder:text-slate-400"
              autoFocus
            />
          </div>
          
          <div className="p-2">
            {filteredCommands.length > 0 ? (
              filteredCommands.map((command) => (
                <button
                  key={command.id}
                  onClick={() => handleCommandSelect(command)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    {command.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{command.label}</span>
                      {command.shortcut && (
                        <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 rounded">
                          {command.shortcut}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{command.description}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-slate-500">
                Nenhum comando encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Block Component
interface BlockComponentProps {
  block: Block;
  dragHandleProps?: any;
  onUpdate: (updates: Partial<Block>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onDelete: () => void;
  placeholder?: string;
}

const BlockComponent: React.FC<BlockComponentProps> = ({
  block,
  dragHandleProps,
  onUpdate,
  onKeyDown,
  onDelete,
  placeholder
}) => {
  const handleContentChange = (content: string) => {
    onUpdate({ content });
  };

  const renderBlock = () => {
    const commonProps = {
      className: "w-full outline-none resize-none overflow-hidden text-slate-900 dark:text-slate-100",
      contentEditable: true,
      suppressContentEditableWarning: true,
      onInput: (e: React.FormEvent<HTMLElement>) => {
        handleContentChange((e.target as HTMLElement).textContent || '');
      },
      onKeyDown,
      placeholder,
      dangerouslySetInnerHTML: { __html: block.content }
    };

    switch (block.type) {
      case 'heading1':
        return <h1 {...commonProps} className={cn(commonProps.className, "text-3xl font-bold text-slate-900 dark:text-slate-100")} />;
      case 'heading2':
        return <h2 {...commonProps} className={cn(commonProps.className, "text-2xl font-semibold text-slate-900 dark:text-slate-100")} />;
      case 'heading3':
        return <h3 {...commonProps} className={cn(commonProps.className, "text-xl font-medium text-slate-900 dark:text-slate-100")} />;
      case 'quote':
        return (
          <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic">
            <div {...commonProps} className={cn(commonProps.className, "text-slate-600 dark:text-slate-400")} />
          </blockquote>
        );
      case 'code':
        return (
          <pre className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
            <code {...commonProps} className={cn(commonProps.className, "font-mono text-sm text-slate-800 dark:text-slate-200")} />
          </pre>
        );
      case 'divider':
        return <hr className="border-slate-300 dark:border-slate-600 my-4" />;
      case 'bullet-list':
        return (
          <ul className="list-disc list-inside">
            <li>
              <div {...commonProps} className={cn(commonProps.className, "inline text-slate-900 dark:text-slate-100")} />
            </li>
          </ul>
        );
      case 'numbered-list':
        return (
          <ol className="list-decimal list-inside">
            <li>
              <div {...commonProps} className={cn(commonProps.className, "inline text-slate-900 dark:text-slate-100")} />
            </li>
          </ol>
        );
      case 'todo':
        return (
          <div className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" />
            <div {...commonProps} className={cn(commonProps.className, "flex-1 text-slate-900 dark:text-slate-100")} />
          </div>
        );
      case 'callout':
        return (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <div {...commonProps} className={cn(commonProps.className, "text-blue-900 dark:text-blue-100")} />
          </div>
        );
      default:
        return <div {...commonProps} className={cn(commonProps.className, "text-slate-900 dark:text-slate-100")} />;
    }
  };

  return (
    <div className="flex items-start gap-2 py-1 px-2 rounded-lg group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-slate-400" />
      </div>

      {/* Block Content */}
      <div className="flex-1 min-w-0">
        {renderBlock()}
      </div>

      {/* Block Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onDelete}
          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}; 