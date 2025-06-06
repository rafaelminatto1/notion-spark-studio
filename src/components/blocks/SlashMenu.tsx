
import React from 'react';
import { Button } from '@/components/ui/button';
import { Block } from '@/types';
import { 
  Type, Hash, List, Code, Quote, Image, Table, 
  Info, ToggleLeft, Calendar, Calculator, Database,
  Play, Twitter, FileText, Figma, ExternalLink
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
    keywords: ['text', 'texto', 'paragraph', 'paragrafo'],
    category: 'básico'
  },
  { 
    type: 'heading' as const, 
    label: 'Título 1', 
    description: 'Título grande',
    icon: Hash,
    keywords: ['h1', 'heading', 'titulo', 'title'],
    properties: { level: 1 },
    category: 'básico'
  },
  { 
    type: 'heading' as const, 
    label: 'Título 2', 
    description: 'Título médio',
    icon: Hash,
    keywords: ['h2', 'heading', 'titulo', 'title'],
    properties: { level: 2 },
    category: 'básico'
  },
  { 
    type: 'heading' as const, 
    label: 'Título 3', 
    description: 'Título pequeno',
    icon: Hash,
    keywords: ['h3', 'heading', 'titulo', 'title'],
    properties: { level: 3 },
    category: 'básico'
  },
  { 
    type: 'list' as const, 
    label: 'Lista', 
    description: 'Crie uma lista simples',
    icon: List,
    keywords: ['list', 'lista', 'bullet', 'item'],
    category: 'básico'
  },
  { 
    type: 'code' as const, 
    label: 'Código', 
    description: 'Capture um snippet de código',
    icon: Code,
    keywords: ['code', 'codigo', 'snippet', 'programming'],
    category: 'básico'
  },
  { 
    type: 'quote' as const, 
    label: 'Citação', 
    description: 'Capture uma citação',
    icon: Quote,
    keywords: ['quote', 'citacao', 'blockquote'],
    category: 'básico'
  },
  { 
    type: 'image' as const, 
    label: 'Imagem', 
    description: 'Faça upload ou incorpore com um link',
    icon: Image,
    keywords: ['image', 'imagem', 'photo', 'foto'],
    category: 'mídia'
  },
  { 
    type: 'table' as const, 
    label: 'Tabela', 
    description: 'Adicione uma tabela simples',
    icon: Table,
    keywords: ['table', 'tabela', 'grid'],
    category: 'avançado'
  },
  { 
    type: 'database' as const, 
    label: 'Database', 
    description: 'Crie uma base de dados estruturada',
    icon: Database,
    keywords: ['database', 'db', 'banco', 'dados', 'tabela', 'kanban'],
    category: 'avançado'
  },
  { 
    type: 'callout' as const, 
    label: 'Callout', 
    description: 'Destaque informações importantes',
    icon: Info,
    keywords: ['callout', 'info', 'warning', 'alert'],
    properties: { type: 'info' },
    category: 'avançado'
  },
  { 
    type: 'toggle' as const, 
    label: 'Toggle', 
    description: 'Crie um toggle com conteúdo',
    icon: ToggleLeft,
    keywords: ['toggle', 'expand', 'collapse', 'dropdown'],
    category: 'avançado'
  },
  
  // Embed blocks
  { 
    type: 'embed-youtube' as const, 
    label: 'YouTube', 
    description: 'Incorpore um vídeo do YouTube',
    icon: Play,
    keywords: ['youtube', 'video', 'embed', 'incorporar'],
    category: 'embed'
  },
  { 
    type: 'embed-twitter' as const, 
    label: 'Twitter/X', 
    description: 'Incorpore um tweet',
    icon: Twitter,
    keywords: ['twitter', 'tweet', 'x', 'embed', 'incorporar'],
    category: 'embed'
  },
  { 
    type: 'embed-image' as const, 
    label: 'Imagem URL', 
    description: 'Incorpore uma imagem via URL',
    icon: Image,
    keywords: ['image', 'imagem', 'url', 'link', 'embed'],
    category: 'embed'
  },
  { 
    type: 'embed-pdf' as const, 
    label: 'PDF', 
    description: 'Incorpore um documento PDF',
    icon: FileText,
    keywords: ['pdf', 'document', 'documento', 'embed'],
    category: 'embed'
  },
  { 
    type: 'embed-figma' as const, 
    label: 'Figma', 
    description: 'Incorpore um design do Figma',
    icon: Figma,
    keywords: ['figma', 'design', 'prototype', 'embed'],
    category: 'embed'
  },
  { 
    type: 'embed-codepen' as const, 
    label: 'CodePen', 
    description: 'Incorpore um pen do CodePen',
    icon: Code,
    keywords: ['codepen', 'code', 'demo', 'embed'],
    category: 'embed'
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
      item.keywords.some(keyword => keyword.includes(searchQuery)) ||
      item.category.includes(searchQuery)
    );
  });

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const category = item.category || 'básico';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof filteredItems>);

  const categoryOrder = ['básico', 'mídia', 'embed', 'avançado'];
  const categoryLabels = {
    'básico': 'Básico',
    'mídia': 'Mídia',
    'embed': 'Embeds',
    'avançado': 'Avançado'
  };

  return (
    <div
      className="fixed z-50 bg-notion-dark-hover border border-notion-dark-border rounded-lg shadow-xl max-w-xs w-80"
      style={{ 
        left: position.x, 
        top: position.y,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
    >
      <div className="p-2 space-y-1">
        {filteredItems.length === 0 ? (
          <div className="p-3 text-center text-gray-500 text-sm">
            Nenhum bloco encontrado
          </div>
        ) : (
          categoryOrder.map(category => {
            const categoryItems = groupedItems[category];
            if (!categoryItems || categoryItems.length === 0) return null;

            return (
              <div key={category}>
                {Object.keys(groupedItems).length > 1 && (
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {categoryLabels[category] || category}
                  </div>
                )}
                {categoryItems.map((item, index) => {
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
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
