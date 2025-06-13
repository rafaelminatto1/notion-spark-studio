import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers,
  Plus,
  Search,
  Filter,
  Star,
  Copy,
  Edit,
  Trash2,
  Eye,
  Download,
  Share2,
  Brain,
  Zap,
  FileText,
  Code,
  Image,
  Database,
  Globe,
  Users,
  Calendar,
  BarChart3,
  Briefcase,
  BookOpen,
  Heart,
  TrendingUp,
  Target,
  Lightbulb,
  Sparkles,
  Wand2,
  Settings,
  Tag,
  Clock,
  Award,
  ChevronRight,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Tipos para o sistema de templates
interface Template {
  id: string;
  name: string;
  description: string;
  category: 'document' | 'presentation' | 'code' | 'data' | 'design' | 'workflow' | 'report';
  type: 'basic' | 'premium' | 'ai-generated' | 'community';
  content: string;
  preview: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  usage: number;
  rating: number;
  reviews: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  isFavorite: boolean;
  aiGenerated: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutos
  variables: TemplateVariable[];
  aiInsights?: {
    complexity: number;
    effectiveness: number;
    trendScore: number;
    suggestedImprovements: string[];
  };
}

interface TemplateVariable {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  placeholder?: string;
  defaultValue?: any;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface AITemplateSuggestion {
  id: string;
  type: 'improvement' | 'new_template' | 'personalization' | 'optimization';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  category: string;
  preview?: string;
  action: () => void;
}

interface TemplateGenerationPrompt {
  type: string;
  purpose: string;
  audience: string;
  length: 'short' | 'medium' | 'long';
  tone: 'formal' | 'casual' | 'professional' | 'creative';
  includeStructure: boolean;
  includeExamples: boolean;
  customRequirements: string;
}

interface IntelligentTemplateSystemProps {
  className?: string;
}

export const IntelligentTemplateSystem: React.FC<IntelligentTemplateSystemProps> = ({
  className = ''
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AITemplateSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState<TemplateGenerationPrompt>({
    type: 'document',
    purpose: '',
    audience: '',
    length: 'medium',
    tone: 'professional',
    includeStructure: true,
    includeExamples: false,
    customRequirements: ''
  });

  // Simulação de dados de templates
  useEffect(() => {
    const mockTemplates: Template[] = [
      {
        id: 'template_1',
        name: 'Relatório de Projeto Executivo',
        description: 'Template completo para relatórios executivos com métricas, análises e recomendações estratégicas.',
        category: 'report',
        type: 'premium',
        content: '# Relatório Executivo\n\n## Resumo Executivo\n{executive_summary}\n\n## Métricas Principais\n{key_metrics}...',
        preview: 'https://via.placeholder.com/300x200',
        tags: ['executivo', 'relatório', 'métricas', 'estratégia'],
        author: {
          id: 'user_1',
          name: 'Ana Silva',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'
        },
        usage: 2847,
        rating: 4.8,
        reviews: 156,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        isPublic: true,
        isFavorite: true,
        aiGenerated: false,
        difficulty: 'intermediate',
        estimatedTime: 45,
        variables: [
          {
            id: 'var_1',
            name: 'executive_summary',
            type: 'text',
            label: 'Resumo Executivo',
            placeholder: 'Descreva os principais pontos do projeto...',
            required: true
          },
          {
            id: 'var_2',
            name: 'key_metrics',
            type: 'text',
            label: 'Métricas Principais',
            placeholder: 'Liste as métricas mais importantes...',
            required: true
          }
        ],
        aiInsights: {
          complexity: 0.7,
          effectiveness: 0.9,
          trendScore: 0.85,
          suggestedImprovements: [
            'Adicionar seção de riscos',
            'Incluir gráficos interativos',
            'Expandir análise competitiva'
          ]
        }
      },
      {
        id: 'template_2',
        name: 'Planejamento Sprint Ágil',
        description: 'Template otimizado para planejamento de sprints com backlog, estimativas e critérios de aceitação.',
        category: 'workflow',
        type: 'ai-generated',
        content: '# Sprint Planning\n\n## Objetivo do Sprint\n{sprint_goal}\n\n## Backlog Items\n{backlog_items}...',
        preview: 'https://via.placeholder.com/300x200',
        tags: ['ágil', 'sprint', 'desenvolvimento', 'scrum'],
        author: {
          id: 'ai_assistant',
          name: 'IA Assistant',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AI'
        },
        usage: 1923,
        rating: 4.6,
        reviews: 89,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isPublic: true,
        isFavorite: false,
        aiGenerated: true,
        difficulty: 'beginner',
        estimatedTime: 30,
        variables: [
          {
            id: 'var_3',
            name: 'sprint_goal',
            type: 'text',
            label: 'Objetivo do Sprint',
            placeholder: 'Qual é o objetivo principal deste sprint?',
            required: true
          },
          {
            id: 'var_4',
            name: 'sprint_duration',
            type: 'select',
            label: 'Duração do Sprint',
            defaultValue: '2 semanas',
            required: true,
            options: ['1 semana', '2 semanas', '3 semanas', '4 semanas']
          }
        ],
        aiInsights: {
          complexity: 0.4,
          effectiveness: 0.85,
          trendScore: 0.92,
          suggestedImprovements: [
            'Adicionar retrospectiva automática',
            'Incluir métricas de velocity',
            'Integrar com ferramentas de tracking'
          ]
        }
      },
      {
        id: 'template_3',
        name: 'Proposta de Negócio Criativa',
        description: 'Template moderno para propostas comerciais com design atrativo e estrutura persuasiva.',
        category: 'document',
        type: 'community',
        content: '# Proposta de Negócio\n\n## Visão Geral\n{business_overview}\n\n## Solução Proposta\n{solution}...',
        preview: 'https://via.placeholder.com/300x200',
        tags: ['negócio', 'proposta', 'comercial', 'criativo'],
        author: {
          id: 'user_2',
          name: 'Carlos Santos',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos'
        },
        usage: 856,
        rating: 4.4,
        reviews: 42,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isPublic: true,
        isFavorite: false,
        aiGenerated: false,
        difficulty: 'intermediate',
        estimatedTime: 60,
        variables: [
          {
            id: 'var_5',
            name: 'business_overview',
            type: 'text',
            label: 'Visão Geral do Negócio',
            placeholder: 'Descreva o contexto e oportunidade...',
            required: true
          }
        ],
        aiInsights: {
          complexity: 0.6,
          effectiveness: 0.75,
          trendScore: 0.68,
          suggestedImprovements: [
            'Adicionar análise de ROI',
            'Incluir cronograma visual',
            'Melhorar call-to-action'
          ]
        }
      }
    ];

    const mockSuggestions: AITemplateSuggestion[] = [
      {
        id: 'suggestion_1',
        type: 'new_template',
        title: 'Template de OKRs Trimestrais',
        description: 'Com base no seu uso, a IA sugere criar um template para definição e acompanhamento de OKRs.',
        confidence: 0.89,
        impact: 'high',
        category: 'workflow',
        action: () => console.log('Criando template de OKRs')
      },
      {
        id: 'suggestion_2',
        type: 'improvement',
        title: 'Melhorias no Template de Relatório',
        description: 'Adicionar seção de análise de riscos e gráficos automáticos no template de relatório executivo.',
        confidence: 0.76,
        impact: 'medium',
        category: 'report',
        action: () => console.log('Aplicando melhorias')
      },
      {
        id: 'suggestion_3',
        type: 'personalization',
        title: 'Personalização Baseada em Uso',
        description: 'Criar variação do template de sprint planning focada em desenvolvimento frontend.',
        confidence: 0.82,
        impact: 'medium',
        category: 'workflow',
        action: () => console.log('Personalizando template')
      }
    ];

    setTemplates(mockTemplates);
    setAiSuggestions(mockSuggestions);
  }, []);

  // Filtros e busca
  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    if (searchQuery) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(template => template.type === selectedType);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(template => template.isFavorite);
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.usage - a.usage;
        case 'recent':
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [templates, searchQuery, selectedCategory, selectedType, showFavoritesOnly, sortBy]);

  // Ações de template
  const toggleFavorite = (templateId: string) => {
    setTemplates(prev => 
      prev.map(template => 
        template.id === templateId 
          ? { ...template, isFavorite: !template.isFavorite }
          : template
      )
    );
  };

  const useTemplate = (template: Template) => {
    console.log('Usando template:', template.name);
    // Incrementar uso
    setTemplates(prev => 
      prev.map(t => 
        t.id === template.id 
          ? { ...t, usage: t.usage + 1 }
          : t
      )
    );
  };

  const generateAITemplate = async () => {
    setIsGeneratingTemplate(true);
    
    // Simular geração de IA
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newTemplate: Template = {
      id: `ai_template_${Date.now()}`,
      name: `Template ${generationPrompt.type} Personalizado`,
      description: `Template gerado por IA para ${generationPrompt.purpose}`,
      category: generationPrompt.type as any,
      type: 'ai-generated',
      content: `# ${generationPrompt.purpose}\n\nConteúdo gerado automaticamente...`,
      preview: 'https://via.placeholder.com/300x200',
      tags: ['ai-gerado', generationPrompt.type, generationPrompt.tone],
      author: {
        id: 'ai_assistant',
        name: 'IA Assistant',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AI'
      },
      usage: 0,
      rating: 0,
      reviews: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: false,
      isFavorite: false,
      aiGenerated: true,
      difficulty: 'beginner',
      estimatedTime: 20,
      variables: [],
      aiInsights: {
        complexity: 0.5,
        effectiveness: 0.8,
        trendScore: 0.9,
        suggestedImprovements: []
      }
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setIsGeneratingTemplate(false);
  };

  // Estatísticas
  const stats = useMemo(() => {
    const totalTemplates = templates.length;
    const aiGenerated = templates.filter(t => t.aiGenerated).length;
    const avgRating = templates.reduce((sum, t) => sum + t.rating, 0) / totalTemplates;
    const totalUsage = templates.reduce((sum, t) => sum + t.usage, 0);

    return { totalTemplates, aiGenerated, avgRating, totalUsage };
  }, [templates]);

  // Ícones por categoria
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'presentation': return <BarChart3 className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'data': return <Database className="h-4 w-4" />;
      case 'design': return <Image className="h-4 w-4" />;
      case 'workflow': return <Calendar className="h-4 w-4" />;
      case 'report': return <Briefcase className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  // Cores por dificuldade
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50 border-green-200';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'advanced': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Layers className="h-6 w-6 text-purple-600" />
              <div>
                <CardTitle>Sistema de Templates Inteligente</CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Templates adaptativos com sugestões de IA e criação automática
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalTemplates}</div>
              <div className="text-sm text-gray-500">Templates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.aiGenerated}</div>
              <div className="text-sm text-gray-500">Gerados por IA</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.avgRating.toFixed(1)}</div>
              <div className="text-sm text-gray-500">Avaliação Média</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalUsage.toLocaleString()}</div>
              <div className="text-sm text-gray-500">Usos Totais</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Explorar</TabsTrigger>
          <TabsTrigger value="ai-suggestions">Sugestões IA</TabsTrigger>
          <TabsTrigger value="generate">Gerar IA</TabsTrigger>
          <TabsTrigger value="my-templates">Meus Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Filtros e busca */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="document">Documentos</SelectItem>
                      <SelectItem value="presentation">Apresentações</SelectItem>
                      <SelectItem value="code">Código</SelectItem>
                      <SelectItem value="data">Dados</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="report">Relatórios</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="ai-generated">IA</SelectItem>
                      <SelectItem value="community">Comunidade</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">Popular</SelectItem>
                      <SelectItem value="recent">Recente</SelectItem>
                      <SelectItem value="rating">Avaliação</SelectItem>
                      <SelectItem value="name">Nome</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={showFavoritesOnly}
                      onCheckedChange={setShowFavoritesOnly}
                      id="favorites-only"
                    />
                    <label htmlFor="favorites-only" className="text-sm">
                      <Heart className="h-4 w-4 inline mr-1" />
                      Favoritos
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid de templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card className="h-full overflow-hidden">
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                      <img 
                        src={template.preview} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Badge variant={template.type === 'premium' ? 'default' : 'secondary'}>
                          {template.aiGenerated && <Brain className="h-3 w-3 mr-1" />}
                          {template.type}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                          onClick={() => toggleFavorite(template.id)}
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              template.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                            }`} 
                          />
                        </Button>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm leading-tight truncate">
                              {template.name}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-2">
                            {getCategoryIcon(template.category)}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {template.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.tags.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <Avatar src={template.author.avatar} alt={template.author.name} size="sm" />
                            <span className="text-gray-600">{template.author.name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span>{template.rating}</span>
                            </div>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500">{template.usage}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getDifficultyColor(template.difficulty)}>
                              {template.difficulty}
                            </Badge>
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              <span>{template.estimatedTime}min</span>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => useTemplate(template)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Usar Template
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="h-4 w-4 mr-2" />
                                Compartilhar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {template.aiInsights && (
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">Score IA</span>
                              <span>{Math.round(template.aiInsights.effectiveness * 100)}%</span>
                            </div>
                            <Progress 
                              value={template.aiInsights.effectiveness * 100} 
                              className="h-1"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Nenhum template encontrado
                </h3>
                <p className="text-gray-500 mb-4">
                  Tente ajustar os filtros ou criar um novo template
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Template
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai-suggestions" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Sugestões Inteligentes</h3>
              <Badge variant="secondary">
                <Brain className="h-3 w-3 mr-1" />
                {aiSuggestions.length} sugestões
              </Badge>
            </div>
            
            {aiSuggestions.map((suggestion) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`border-l-4 ${
                  suggestion.impact === 'high' ? 'border-l-red-500' :
                  suggestion.impact === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          suggestion.type === 'new_template' ? 'bg-blue-100 text-blue-600' :
                          suggestion.type === 'improvement' ? 'bg-green-100 text-green-600' :
                          suggestion.type === 'personalization' ? 'bg-purple-100 text-purple-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {suggestion.type === 'new_template' && <Plus className="h-4 w-4" />}
                          {suggestion.type === 'improvement' && <TrendingUp className="h-4 w-4" />}
                          {suggestion.type === 'personalization' && <Target className="h-4 w-4" />}
                          {suggestion.type === 'optimization' && <Zap className="h-4 w-4" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={suggestion.impact === 'high' ? 'destructive' : 'secondary'}>
                          {suggestion.impact}
                        </Badge>
                        <Button onClick={suggestion.action}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Confiança da IA</span>
                        <span>{Math.round(suggestion.confidence * 100)}%</span>
                      </div>
                      <Progress value={suggestion.confidence * 100} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wand2 className="h-5 w-5" />
                <span>Gerador de Templates com IA</span>
              </CardTitle>
              <p className="text-sm text-gray-500">
                Descreva suas necessidades e a IA criará um template personalizado
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Template</label>
                    <Select 
                      value={generationPrompt.type} 
                      onValueChange={(value) => setGenerationPrompt(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Documento</SelectItem>
                        <SelectItem value="report">Relatório</SelectItem>
                        <SelectItem value="workflow">Workflow</SelectItem>
                        <SelectItem value="presentation">Apresentação</SelectItem>
                        <SelectItem value="code">Código</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Propósito</label>
                    <Input
                      placeholder="Ex: Relatório mensal de vendas"
                      value={generationPrompt.purpose}
                      onChange={(e) => setGenerationPrompt(prev => ({ ...prev, purpose: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Público-alvo</label>
                    <Input
                      placeholder="Ex: Executivos, desenvolvedores, clientes"
                      value={generationPrompt.audience}
                      onChange={(e) => setGenerationPrompt(prev => ({ ...prev, audience: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Extensão</label>
                    <Select 
                      value={generationPrompt.length} 
                      onValueChange={(value: any) => setGenerationPrompt(prev => ({ ...prev, length: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Curto (1-2 páginas)</SelectItem>
                        <SelectItem value="medium">Médio (3-5 páginas)</SelectItem>
                        <SelectItem value="long">Longo (6+ páginas)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Tom</label>
                    <Select 
                      value={generationPrompt.tone} 
                      onValueChange={(value: any) => setGenerationPrompt(prev => ({ ...prev, tone: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="creative">Criativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={generationPrompt.includeStructure}
                        onCheckedChange={(checked) => 
                          setGenerationPrompt(prev => ({ ...prev, includeStructure: checked }))
                        }
                        id="include-structure"
                      />
                      <label htmlFor="include-structure" className="text-sm">
                        Incluir estrutura detalhada
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={generationPrompt.includeExamples}
                        onCheckedChange={(checked) => 
                          setGenerationPrompt(prev => ({ ...prev, includeExamples: checked }))
                        }
                        id="include-examples"
                      />
                      <label htmlFor="include-examples" className="text-sm">
                        Incluir exemplos
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Requisitos Específicos</label>
                <Textarea
                  placeholder="Descreva qualquer requisito específico, seções obrigatórias, ou características especiais..."
                  value={generationPrompt.customRequirements}
                  onChange={(e) => setGenerationPrompt(prev => ({ ...prev, customRequirements: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={generateAITemplate}
                  disabled={isGeneratingTemplate || !generationPrompt.purpose}
                  size="lg"
                >
                  {isGeneratingTemplate ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Gerando Template...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Template com IA
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-templates" className="space-y-4">
          <Card>
            <CardContent className="p-8 text-center">
              <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Seus Templates Personalizados
              </h3>
              <p className="text-gray-500 mb-4">
                Aqui aparecerão os templates que você criou ou personalizou
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntelligentTemplateSystem; 