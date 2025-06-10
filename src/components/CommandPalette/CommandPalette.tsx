import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import { 
  Search, 
  FileText, 
  FolderPlus, 
  Database, 
  Settings, 
  Users, 
  Share, 
  Download, 
  Upload, 
  Copy, 
  Trash,
  Edit3,
  BookOpen,
  Calendar,
  Clock,
  Star,
  Tag,
  Filter,
  Zap,
  Command,
  ArrowRight,
  History,
  Lightbulb
} from 'lucide-react';

interface Command {
  id: string;
  title: string;
  description?: string;
  keywords: string[];
  icon: React.ReactNode;
  category: 'navigation' | 'creation' | 'editing' | 'collaboration' | 'settings' | 'recent' | 'suggestion';
  action: () => void;
  shortcut?: string;
  priority?: number; // Para ranking
  context?: string[]; // Contextos onde o comando é relevante
  lastUsed?: Date;
  useCount?: number;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  currentContext?: string; // contexto atual para sugestões inteligentes
  recentFiles?: string[];
  className?: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  currentContext = 'global',
  recentFiles = [],
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [category, setCategory] = useState<string>('all');
  const [commandHistory, setCommandHistory] = useState<Command[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Base commands - podem ser expandidos dinamicamente
  const baseCommands: Command[] = useMemo(() => [
    // Navegação
    {
      id: 'nav-home',
      title: 'Ir para Início',
      description: 'Navegar para a página inicial',
      keywords: ['home', 'início', 'principal'],
      icon: <BookOpen className="w-4 h-4" />,
      category: 'navigation',
      action: () => console.log('Navigate to home'),
      shortcut: 'Ctrl+H',
      priority: 8
    },
    {
      id: 'nav-search',
      title: 'Busca Global',
      description: 'Abrir busca avançada',
      keywords: ['search', 'busca', 'encontrar', 'procurar'],
      icon: <Search className="w-4 h-4" />,
      category: 'navigation',
      action: () => console.log('Open global search'),
      shortcut: 'Ctrl+/',
      priority: 9
    },
    {
      id: 'nav-recent',
      title: 'Arquivos Recentes',
      description: 'Ver documentos acessados recentemente',
      keywords: ['recent', 'recente', 'último', 'histórico'],
      icon: <Clock className="w-4 h-4" />,
      category: 'navigation',
      action: () => console.log('Show recent files'),
      shortcut: 'Ctrl+R',
      priority: 7
    },
    
    // Criação
    {
      id: 'create-document',
      title: 'Novo Documento',
      description: 'Criar um novo documento',
      keywords: ['novo', 'criar', 'documento', 'arquivo'],
      icon: <FileText className="w-4 h-4" />,
      category: 'creation',
      action: () => console.log('Create new document'),
      shortcut: 'Ctrl+N',
      priority: 10,
      context: ['editor', 'global']
    },
    {
      id: 'create-folder',
      title: 'Nova Pasta',
      description: 'Criar uma nova pasta',
      keywords: ['pasta', 'folder', 'criar', 'organizar'],
      icon: <FolderPlus className="w-4 h-4" />,
      category: 'creation',
      action: () => console.log('Create new folder'),
      shortcut: 'Ctrl+Shift+N',
      priority: 8
    },
    {
      id: 'create-database',
      title: 'Novo Banco de Dados',
      description: 'Criar uma nova base de dados',
      keywords: ['database', 'banco', 'dados', 'tabela'],
      icon: <Database className="w-4 h-4" />,
      category: 'creation',
      action: () => console.log('Create new database'),
      priority: 6
    },

    // Edição
    {
      id: 'edit-copy',
      title: 'Copiar',
      description: 'Copiar conteúdo selecionado',
      keywords: ['copy', 'copiar', 'duplicar'],
      icon: <Copy className="w-4 h-4" />,
      category: 'editing',
      action: () => console.log('Copy content'),
      shortcut: 'Ctrl+C',
      priority: 9,
      context: ['editor']
    },
    {
      id: 'edit-rename',
      title: 'Renomear',
      description: 'Renomear arquivo ou pasta',
      keywords: ['rename', 'renomear', 'editar', 'nome'],
      icon: <Edit3 className="w-4 h-4" />,
      category: 'editing',
      action: () => console.log('Rename item'),
      shortcut: 'F2',
      priority: 7
    },
    {
      id: 'edit-delete',
      title: 'Excluir',
      description: 'Mover para a lixeira',
      keywords: ['delete', 'excluir', 'remover', 'lixeira'],
      icon: <Trash className="w-4 h-4" />,
      category: 'editing',
      action: () => console.log('Delete item'),
      shortcut: 'Delete',
      priority: 5
    },

    // Colaboração
    {
      id: 'collab-share',
      title: 'Compartilhar',
      description: 'Compartilhar com outros usuários',
      keywords: ['share', 'compartilhar', 'colaborar'],
      icon: <Share className="w-4 h-4" />,
      category: 'collaboration',
      action: () => console.log('Share content'),
      priority: 8
    },
    {
      id: 'collab-invite',
      title: 'Convidar Colaboradores',
      description: 'Convidar pessoas para colaborar',
      keywords: ['invite', 'convidar', 'colaborador', 'equipe'],
      icon: <Users className="w-4 h-4" />,
      category: 'collaboration',
      action: () => console.log('Invite collaborators'),
      priority: 6
    },

    // Configurações
    {
      id: 'settings-general',
      title: 'Configurações',
      description: 'Abrir configurações gerais',
      keywords: ['settings', 'configurações', 'preferências'],
      icon: <Settings className="w-4 h-4" />,
      category: 'settings',
      action: () => console.log('Open settings'),
      shortcut: 'Ctrl+,',
      priority: 4
    }
  ], []);

  // Gerar sugestões inteligentes baseadas no contexto
  const generateAISuggestions = useCallback((): Command[] => {
    const suggestions: Command[] = [];
    
    // Baseado no horário
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 9 && hour <= 12) {
      suggestions.push({
        id: 'ai-morning-review',
        title: 'Revisar Tarefas da Manhã',
        description: 'Veja suas tarefas pendentes para hoje',
        keywords: ['manhã', 'tarefas', 'revisar'],
        icon: <Lightbulb className="w-4 h-4" />,
        category: 'suggestion',
        action: () => console.log('Show morning tasks'),
        priority: 8
      });
    }

    if (hour >= 13 && hour <= 17) {
      suggestions.push({
        id: 'ai-afternoon-focus',
        title: 'Modo Foco da Tarde',
        description: 'Esconder distrações e focar no trabalho',
        keywords: ['foco', 'tarde', 'concentração'],
        icon: <Zap className="w-4 h-4" />,
        category: 'suggestion',
        action: () => console.log('Enable focus mode'),
        priority: 7
      });
    }

    // Baseado no contexto atual
    if (currentContext === 'editor') {
      suggestions.push({
        id: 'ai-suggest-formatting',
        title: 'Melhorar Formatação',
        description: 'Sugestões para melhorar a formatação do documento',
        keywords: ['formatação', 'melhorar', 'estilo'],
        icon: <Edit3 className="w-4 h-4" />,
        category: 'suggestion',
        action: () => console.log('Suggest formatting'),
        priority: 9
      });
    }

    // Baseado em arquivos recentes
    if (recentFiles.length > 0) {
      suggestions.push({
        id: 'ai-continue-work',
        title: 'Continuar Trabalho Anterior',
        description: `Voltar ao documento: ${recentFiles[0]}`,
        keywords: ['continuar', 'anterior', 'trabalho'],
        icon: <History className="w-4 h-4" />,
        category: 'suggestion',
        action: () => console.log('Continue previous work'),
        priority: 8
      });
    }

    return suggestions;
  }, [currentContext, recentFiles]);

  // Comandos históricos baseados em uso
  const getRecentCommands = useCallback((): Command[] => {
    return commandHistory
      .sort((a, b) => {
        // Ordenar por uso recente e frequência
        const aScore = (a.useCount || 0) * 0.3 + (a.lastUsed ? (Date.now() - a.lastUsed.getTime()) / 1000 / 60 / 60 : 0) * -0.7;
        const bScore = (b.useCount || 0) * 0.3 + (b.lastUsed ? (Date.now() - b.lastUsed.getTime()) / 1000 / 60 / 60 : 0) * -0.7;
        return bScore - aScore;
      })
      .slice(0, 3)
      .map(cmd => ({ ...cmd, category: 'recent' as const }));
  }, [commandHistory]);

  // Todos os comandos combinados
  const allCommands = useMemo(() => {
    const suggestions = generateAISuggestions();
    const recentCommands = getRecentCommands();
    
    return [
      ...suggestions,
      ...recentCommands,
      ...baseCommands
    ].map(cmd => ({
      ...cmd,
      priority: cmd.priority || 5
    }));
  }, [baseCommands, generateAISuggestions, getRecentCommands]);

  // Configuração do Fuse.js para busca fuzzy
  const fuse = useMemo(() => new Fuse(allCommands, {
    keys: [
      { name: 'title', weight: 0.7 },
      { name: 'description', weight: 0.2 },
      { name: 'keywords', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true,
    shouldSort: true
  }), [allCommands]);

  // Filtrar e ordenar comandos
  const filteredCommands = useMemo(() => {
    let commands = allCommands;

    // Filtrar por busca
    if (query.trim()) {
      const results = fuse.search(query);
      commands = results.map(result => result.item);
    }

    // Filtrar por categoria
    if (category !== 'all') {
      commands = commands.filter(cmd => cmd.category === category);
    }

    // Filtrar por contexto (priorizar comandos relevantes ao contexto atual)
    commands = commands.filter(cmd => 
      !cmd.context || cmd.context.includes(currentContext) || cmd.context.includes('global')
    );

    // Ordenar por prioridade e relevância
    return commands.sort((a, b) => {
      // Se não há query, ordenar por prioridade
      if (!query.trim()) {
        return (b.priority || 0) - (a.priority || 0);
      }
      
      // Com query, manter ordem de relevância do Fuse
      return 0;
    }).slice(0, 8); // Limitar a 8 resultados
  }, [allCommands, query, category, currentContext, fuse]);

  // Categorias disponíveis
  const categories = [
    { id: 'all', label: 'Todos', icon: <Command className="w-4 h-4" /> },
    { id: 'suggestion', label: 'Sugestões', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'recent', label: 'Recentes', icon: <Clock className="w-4 h-4" /> },
    { id: 'navigation', label: 'Navegação', icon: <Search className="w-4 h-4" /> },
    { id: 'creation', label: 'Criar', icon: <FileText className="w-4 h-4" /> },
    { id: 'editing', label: 'Editar', icon: <Edit3 className="w-4 h-4" /> },
    { id: 'collaboration', label: 'Colaborar', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Config', icon: <Settings className="w-4 h-4" /> }
  ];

  // Executar comando
  const executeCommand = useCallback((command: Command) => {
    // Atualizar histórico
    setCommandHistory(prev => {
      const existing = prev.find(cmd => cmd.id === command.id);
      if (existing) {
        return prev.map(cmd => 
          cmd.id === command.id 
            ? { ...cmd, lastUsed: new Date(), useCount: (cmd.useCount || 0) + 1 }
            : cmd
        );
      } else {
        return [...prev, { ...command, lastUsed: new Date(), useCount: 1 }];
      }
    });

    // Executar ação
    command.action();
    
    // Fechar palette
    onClose();
    setQuery('');
    setSelectedIndex(0);
  }, [onClose]);

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        
        case 'Tab':
          e.preventDefault();
          const currentCategoryIndex = categories.findIndex(cat => cat.id === category);
          const nextCategoryIndex = (currentCategoryIndex + 1) % categories.length;
          setCategory(categories[nextCategoryIndex].id);
          setSelectedIndex(0);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, category, categories, executeCommand, onClose]);

  // Auto scroll para comando selecionado
  useEffect(() => {
    if (scrollRef.current) {
      const selectedElement = scrollRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Focus no input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Reset seleção quando query mudar
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, category]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          onClick={e => e.stopPropagation()}
          className={`w-full max-w-2xl mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}
        >
          {/* Header com busca */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Digite um comando ou busque algo..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500"
              />
            </div>
            
            {/* Filtros de categoria */}
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategory(cat.id);
                    setSelectedIndex(0);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors ${
                    category === cat.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lista de comandos */}
          <div ref={scrollRef} className="max-h-96 overflow-y-auto">
            {filteredCommands.length > 0 ? (
              <div className="p-2">
                {filteredCommands.map((command, index) => (
                  <motion.button
                    key={command.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => executeCommand(command)}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-150 mb-1 ${
                      index === selectedIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-md ${
                        command.category === 'suggestion' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400' :
                        command.category === 'recent' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' :
                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {command.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {command.title}
                          </span>
                          {command.category === 'suggestion' && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 rounded-full">
                              IA
                            </span>
                          )}
                          {command.category === 'recent' && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full">
                              Recente
                            </span>
                          )}
                        </div>
                        {command.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {command.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {command.shortcut && (
                          <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded border">
                            {command.shortcut}
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum comando encontrado</p>
                <p className="text-sm mt-1">Tente usar palavras-chave diferentes</p>
              </div>
            )}
          </div>

          {/* Footer com dicas */}
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>↑↓ navegar</span>
                <span>↵ executar</span>
                <span>Tab trocar categoria</span>
              </div>
              <span>ESC fechar</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};