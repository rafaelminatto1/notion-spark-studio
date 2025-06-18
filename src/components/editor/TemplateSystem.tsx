import React, { useState, useCallback, useMemo } from 'react';
import { FileText, Users, Calendar, Lightbulb, Target, BookOpen, Briefcase, Heart, Zap, Plus, Search, Star, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Block} from './BlockEditor';
import { BlockType } from './BlockEditor';

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: TemplateCategory;
  blocks: Block[];
  isPremium?: boolean;
  isPopular?: boolean;
  tags: string[];
  author?: string;
  usageCount?: number;
  preview?: string;
}

export type TemplateCategory = 
  | 'productivity'
  | 'personal'
  | 'business'
  | 'education'
  | 'creative'
  | 'planning'
  | 'documentation'
  | 'custom';

const PREDEFINED_TEMPLATES: Template[] = [
  {
    id: 'daily-notes',
    name: 'Daily Notes',
    description: 'Template perfeito para planejamento diário',
    icon: <Calendar className="h-5 w-5" />,
    category: 'productivity',
    isPopular: true,
    tags: ['produtividade', 'planejamento', 'diário'],
    author: 'Notion Spark',
    usageCount: 2847,
    preview: '📅 Data, 🎯 Objetivos do dia, ✅ Tarefas, 📝 Notas',
    blocks: [
      { id: '1', type: 'heading1', content: `📅 ${  new Date().toLocaleDateString('pt-BR')}` },
      { id: '2', type: 'heading2', content: '🎯 Objetivos do Dia' },
      { id: '3', type: 'todo', content: 'Objetivo principal' },
      { id: '4', type: 'heading2', content: '✅ Tarefas' },
      { id: '5', type: 'todo', content: 'Tarefa importante' },
      { id: '6', type: 'todo', content: 'Tarefa secundária' },
      { id: '7', type: 'heading2', content: '📝 Notas' },
      { id: '8', type: 'paragraph', content: 'Espaço para anotações e reflexões...' },
      { id: '9', type: 'heading2', content: '⭐ Gratidão' },
      { id: '10', type: 'paragraph', content: 'Pelo que sou grato hoje?' }
    ]
  },
  {
    id: 'meeting-notes',
    name: 'Ata de Reunião',
    description: 'Organize reuniões de forma profissional',
    icon: <Users className="h-5 w-5" />,
    category: 'business',
    isPopular: true,
    tags: ['reunião', 'business', 'colaboração'],
    author: 'Business Templates',
    usageCount: 1923,
    preview: '👥 Participantes, 📋 Agenda, ✅ Ações, 📊 Decisões',
    blocks: [
      { id: '1', type: 'heading1', content: '📋 Ata de Reunião' },
      { id: '2', type: 'paragraph', content: `Data: ${  new Date().toLocaleDateString('pt-BR')}` },
      { id: '3', type: 'heading2', content: '👥 Participantes' },
      { id: '4', type: 'bullet-list', content: 'Nome - Cargo' },
      { id: '5', type: 'heading2', content: '📋 Agenda' },
      { id: '6', type: 'numbered-list', content: 'Tópico principal' },
      { id: '7', type: 'heading2', content: '💬 Discussão' },
      { id: '8', type: 'paragraph', content: 'Principais pontos discutidos...' },
      { id: '9', type: 'heading2', content: '✅ Ações / Próximos Passos' },
      { id: '10', type: 'todo', content: 'Responsável - Prazo' },
      { id: '11', type: 'heading2', content: '📊 Decisões Tomadas' },
      { id: '12', type: 'callout', content: 'Decisão importante documentada' }
    ]
  },
  {
    id: 'project-brief',
    name: 'Brief de Projeto',
    description: 'Estrutura completa para iniciar projetos',
    icon: <Target className="h-5 w-5" />,
    category: 'business',
    isPremium: true,
    tags: ['projeto', 'planejamento', 'estratégia'],
    author: 'Project Pro',
    usageCount: 1456,
    preview: '🎯 Objetivos, 📊 Escopo, 👥 Stakeholders, ⏰ Timeline',
    blocks: [
      { id: '1', type: 'heading1', content: '🚀 Brief do Projeto' },
      { id: '2', type: 'heading2', content: '🎯 Objetivo Principal' },
      { id: '3', type: 'callout', content: 'Descreva o objetivo principal do projeto em uma frase clara' },
      { id: '4', type: 'heading2', content: '📊 Escopo' },
      { id: '5', type: 'heading3', content: '✅ O que está incluído' },
      { id: '6', type: 'bullet-list', content: 'Funcionalidade importante' },
      { id: '7', type: 'heading3', content: '❌ O que NÃO está incluído' },
      { id: '8', type: 'bullet-list', content: 'Fora do escopo' },
      { id: '9', type: 'heading2', content: '👥 Stakeholders' },
      { id: '10', type: 'bullet-list', content: 'Nome - Função no projeto' },
      { id: '11', type: 'heading2', content: '⏰ Timeline' },
      { id: '12', type: 'numbered-list', content: 'Marco importante - Data' },
      { id: '13', type: 'heading2', content: '📋 Recursos Necessários' },
      { id: '14', type: 'bullet-list', content: 'Recurso - Quantidade' }
    ]
  },
  {
    id: 'brainstorm',
    name: 'Sessão de Brainstorm',
    description: 'Capture e organize ideias criativas',
    icon: <Lightbulb className="h-5 w-5" />,
    category: 'creative',
    tags: ['criatividade', 'ideias', 'inovação'],
    author: 'Creative Lab',
    usageCount: 987,
    preview: '💡 Problema, 🧠 Ideias, ⭐ Melhores, 📋 Próximos passos',
    blocks: [
      { id: '1', type: 'heading1', content: '💡 Sessão de Brainstorm' },
      { id: '2', type: 'heading2', content: '🎯 Problema/Desafio' },
      { id: '3', type: 'callout', content: 'Qual problema estamos tentando resolver?' },
      { id: '4', type: 'heading2', content: '🧠 Ideias' },
      { id: '5', type: 'bullet-list', content: 'Ideia inicial' },
      { id: '6', type: 'bullet-list', content: 'Variação da ideia' },
      { id: '7', type: 'bullet-list', content: 'Ideia alternativa' },
      { id: '8', type: 'heading2', content: '⭐ Melhores Ideias' },
      { id: '9', type: 'numbered-list', content: 'Ideia mais promissora' },
      { id: '10', type: 'heading2', content: '📋 Próximos Passos' },
      { id: '11', type: 'todo', content: 'Validar ideia principal' },
      { id: '12', type: 'todo', content: 'Criar protótipo/teste' }
    ]
  },
  {
    id: 'study-notes',
    name: 'Notas de Estudo',
    description: 'Método Cornell para anotações eficazes',
    icon: <BookOpen className="h-5 w-5" />,
    category: 'education',
    tags: ['estudo', 'anotações', 'aprendizado'],
    author: 'Study Smart',
    usageCount: 2156,
    preview: '📚 Tópico, 📝 Notas, 🔍 Conceitos-chave, 📋 Resumo',
    blocks: [
      { id: '1', type: 'heading1', content: '📚 Notas de Estudo' },
      { id: '2', type: 'paragraph', content: `Matéria: | Data: ${  new Date().toLocaleDateString('pt-BR')}` },
      { id: '3', type: 'heading2', content: '📖 Tópico Principal' },
      { id: '4', type: 'callout', content: 'Assunto principal da aula/leitura' },
      { id: '5', type: 'heading2', content: '📝 Anotações' },
      { id: '6', type: 'bullet-list', content: 'Ponto importante' },
      { id: '7', type: 'bullet-list', content: 'Exemplo relevante' },
      { id: '8', type: 'bullet-list', content: 'Conceito-chave' },
      { id: '9', type: 'heading2', content: '🔍 Conceitos-Chave' },
      { id: '10', type: 'bullet-list', content: 'Termo importante: definição' },
      { id: '11', type: 'heading2', content: '❓ Dúvidas' },
      { id: '12', type: 'todo', content: 'Pergunta para esclarecer' },
      { id: '13', type: 'heading2', content: '📋 Resumo' },
      { id: '14', type: 'quote', content: 'Principais takeaways em 2-3 frases' }
    ]
  },
  {
    id: 'habit-tracker',
    name: 'Tracker de Hábitos',
    description: 'Monitore e desenvolva novos hábitos',
    icon: <Target className="h-5 w-5" />,
    category: 'personal',
    tags: ['hábitos', 'crescimento', 'tracking'],
    author: 'Wellness Hub',
    usageCount: 1789,
    preview: '🎯 Hábito, 📊 Progresso, 📝 Reflexões, 🏆 Recompensas',
    blocks: [
      { id: '1', type: 'heading1', content: '🎯 Tracker de Hábitos' },
      { id: '2', type: 'paragraph', content: `Semana de: ${  new Date().toLocaleDateString('pt-BR')}` },
      { id: '3', type: 'heading2', content: '📋 Hábitos Alvo' },
      { id: '4', type: 'todo', content: '💧 Beber 2L de água' },
      { id: '5', type: 'todo', content: '🏃‍♂️ Exercitar-se 30min' },
      { id: '6', type: 'todo', content: '📚 Ler 20 páginas' },
      { id: '7', type: 'todo', content: '🧘‍♀️ Meditar 10min' },
      { id: '8', type: 'heading2', content: '📊 Progresso Semanal' },
      { id: '9', type: 'paragraph', content: 'Seg: ✅ | Ter: ✅ | Qua: ❌ | Qui: ✅ | Sex: ✅ | Sáb: ❌ | Dom: ✅' },
      { id: '10', type: 'heading2', content: '📝 Reflexões' },
      { id: '11', type: 'paragraph', content: 'O que funcionou bem esta semana?' },
      { id: '12', type: 'paragraph', content: 'Quais foram os desafios?' },
      { id: '13', type: 'heading2', content: '🏆 Recompensa' },
      { id: '14', type: 'callout', content: 'Meta atingida: comemorar com...' }
    ]
  }
];

interface TemplateSystemProps {
  onSelectTemplate: (template: Template) => void;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const TemplateSystem: React.FC<TemplateSystemProps> = ({
  onSelectTemplate,
  className,
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const categories = [
    { id: 'all', name: 'Todos', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'productivity', name: 'Produtividade', icon: <Target className="h-4 w-4" /> },
    { id: 'business', name: 'Business', icon: <Briefcase className="h-4 w-4" /> },
    { id: 'personal', name: 'Pessoal', icon: <Heart className="h-4 w-4" /> },
    { id: 'education', name: 'Educação', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'creative', name: 'Criativo', icon: <Lightbulb className="h-4 w-4" /> }
  ];

  const filteredTemplates = useMemo(() => {
    return PREDEFINED_TEMPLATES.filter(template => {
      const matchesSearch = searchQuery === '' || 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const handleTemplateSelect = useCallback((template: Template) => {
    onSelectTemplate(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  if (!isOpen) return null;

  return (
    <div className={cn("fixed inset-0 z-50 flex items-center justify-center", className)}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-600">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Templates
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Escolha um template para começar rapidamente
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-5 w-5 rotate-45 text-slate-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[calc(90vh-200px)]">
          {/* Sidebar */}
          <div className="lg:w-64 border-r border-slate-200 dark:border-slate-600 p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); }}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700"
              />
            </div>

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Categorias
              </h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => { setSelectedCategory(category.id as TemplateCategory | 'all'); }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                      selectedCategory === category.id
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {category.icon}
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Filtros
              </h3>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => { setShowFavoritesOnly(e.target.checked); }}
                  className="rounded"
                />
                <Star className="h-4 w-4 text-yellow-500" />
                Apenas favoritos
              </label>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => { handleTemplateSelect(template); }}
                />
              ))}
            </div>
            
            {filteredTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-2">
                  Nenhum template encontrado
                </h3>
                <p className="text-sm text-slate-400">
                  Tente ajustar os filtros ou criar um template personalizado
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Template Card Component
interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect }) => {
  return (
    <div className="group relative bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-500 transition-all duration-200 cursor-pointer"
         onClick={onSelect}>
      
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-600 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
            {template.icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
              {template.name}
            </h3>
            {template.isPremium && (
              <div className="flex items-center gap-1 mt-1">
                <Crown className="h-3 w-3 text-yellow-500" />
                <span className="text-xs text-yellow-600 dark:text-yellow-400">Premium</span>
              </div>
            )}
          </div>
        </div>
        
        {template.isPopular && (
          <div className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300 text-xs rounded-full">
            Popular
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-2">
        {template.description}
      </p>

      {/* Preview */}
      {template.preview && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-1">
          {template.preview}
        </p>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {template.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-600">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {template.author && (
            <span>por {template.author}</span>
          )}
          {template.usageCount && (
            <span>• {template.usageCount} usos</span>
          )}
        </div>
        
        <button className="opacity-0 group-hover:opacity-100 px-3 py-1 bg-emerald-600 text-white text-xs rounded-full transition-all hover:bg-emerald-700">
          Usar Template
        </button>
      </div>
    </div>
  );
}; 