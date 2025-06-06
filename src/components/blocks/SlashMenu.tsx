
import React from 'react';
import { Button } from '@/components/ui/button';
import { Block } from '@/types';
import { 
  Type, Hash, List, Code, Quote, Image, Table, 
  Info, ToggleLeft, Calendar, Calculator
} from 'lucide-react';

interface SlashMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onSelect: (type: Block['type'], properties?: any) => void;
  onClose: () => void;
  query: string;
}

const menuItems = [
  { 
    type: 'text' as const, 
    label: 'Texto', 
    description: 'Comece escrevendo com texto simples',
    icon: Type,
    keywords: ['text', 'texto', 'paragraph', 'paragrafo']
  },
  { 
    type: 'heading' as const, 
    label: 'Título 1', 
    description: 'Título grande',
    icon: Hash,
    keywords: ['h1', 'heading', 'titulo', 'title'],
    properties: { level: 1 }
  },
  { 
    type: 'heading' as const, 
    label: 'Título 2', 
    description: 'Título médio',
    icon: Hash,
    keywords: ['h2', 'heading', 'titulo', 'title'],
    properties: { level: 2 }
  },
  { 
    type: 'heading' as const, 
    label: 'Título 3', 
    description: 'Título pequeno',
    icon: Hash,
    keywords: ['h3', 'heading', 'titulo', 'title'],
    properties: { level: 3 }
  },
  { 
    type: 'list' as const, 
    label: 'Lista', 
    description: 'Crie uma lista simples',
    icon: List,
    keywords: ['list', 'lista', 'bullet', 'item']
  },
  { 
    type: 'code' as const, 
    label: 'Código', 
    description: 'Capture um snippet de código',
    icon: Code,
    keywords: ['code', 'codigo', 'snippet', 'programming']
  },
  { 
    type: 'quote' as const, 
    label: 'Citação', 
    description: 'Capture uma citação',
    icon: Quote,
    keywords: ['quote', 'citacao', 'blockquote']
  },
  { 
    type: 'image' as const, 
    label: 'Imagem', 
    description: 'Faça upload ou incorpore com um link',
    icon: Image,
    keywords: ['image', 'imagem', 'photo', 'foto']
  },
  { 
    type: 'table' as const, 
    label: 'Tabela', 
    description: 'Adicione uma tabela simples',
    icon: Table,
    keywords: ['table', 'tabela', 'grid']
  },
  { 
    type: 'callout' as const, 
    label: 'Callout', 
    description: 'Destaque informações importantes',
    icon: Info,
    keywords: ['callout', 'info', 'warning', 'alert'],
    properties: { type: 'info' }
  },
  { 
    type: 'toggle' as const, 
    label: 'Toggle', 
    description: 'Crie um toggle com conteúdo',
    icon: ToggleLeft,
    keywords: ['toggle', 'expand', 'collapse', 'dropdown']
  }
];

export const SlashMenu: React.FC<SlashMenuProps> = ({
  isOpen,
  position,
  onSelect,
  onClose,
  query
}) => {
  if (!isOpen) return null;

  const filteredItems = menuItems.filter(item => {
    if (!query) return true;
    const searchQuery = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery) ||
      item.keywords.some(keyword => keyword.includes(searchQuery))
    );
  });

  return (
    <div
      className="fixed z-50 bg-notion-dark-hover border border-notion-dark-border rounded-lg shadow-xl max-w-xs w-80"
      style={{ 
        left: position.x, 
        top: position.y,
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      <div className="p-2 space-y-1">
        {filteredItems.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-sm">
            Nenhum bloco encontrado
          </div>
        ) : (
          filteredItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={`${item.type}-${index}`}
                variant="ghost"
                onClick={() => onSelect(item.type, item.properties)}
                className="w-full justify-start gap-3 h-auto p-3 text-left hover:bg-notion-purple/20"
              >
                <Icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-gray-400 truncate">{item.description}</div>
                </div>
              </Button>
            );
          })
        )}
      </div>
    </div>
  );
};
