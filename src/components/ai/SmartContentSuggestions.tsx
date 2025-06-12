import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, Brain, Zap, TrendingUp, FileText, Users, 
  Clock, Star, ArrowRight, RefreshCw, Sparkles, Target,
  BookOpen, MessageSquare, Calendar, Tag, Filter, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';
import AITaggingService, { TagSuggestion } from '@/services/AITaggingService';

// Tipos para sugestões inteligentes
interface ContentSuggestion {
  id: string;
  type: 'continuation' | 'improvement' | 'related' | 'template' | 'organization' | 'collaboration';
  title: string;
  description: string;
  content: string;
  confidence: number;
  category: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  tags: string[];
  reasoning: string;
  examples?: string[];
  relatedFiles?: string[];
}

interface SmartInsight {
  id: string;
  type: 'pattern' | 'trend' | 'optimization' | 'discovery';
  title: string;
  insight: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  metrics?: {
    improvement: number;
    confidence: number;
  };
}

interface SmartContentSuggestionsProps {
  currentFile?: FileItem;
  allFiles: FileItem[];
  userBehavior?: {
    recentActions: string[];
    preferredTopics: string[];
    writingStyle: 'technical' | 'casual' | 'formal' | 'creative';
    productivityHours: number[];
  };
  onApplySuggestion: (suggestion: ContentSuggestion) => void;
  onUpdateContent: (content: string) => void;
  isEnabled?: boolean;
}

export const SmartContentSuggestions: React.FC<SmartContentSuggestionsProps> = ({
  currentFile,
  allFiles,
  userBehavior,
  onApplySuggestion,
  onUpdateContent,
  isEnabled = true
}) => {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [filterType, setFilterType] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const aiTaggingService = useMemo(() => new AITaggingService(), []);

  // Gerar sugestões inteligentes
  const generateSuggestions = useCallback(async () => {
    if (!isEnabled || isGenerating) return;

    setIsGenerating(true);
    try {
      const newSuggestions: ContentSuggestion[] = [];
      
      // 1. Sugestões de continuação de conteúdo
      if (currentFile?.content) {
        newSuggestions.push(...await generateContinuationSuggestions(currentFile));
      }

      // 2. Sugestões de melhoria
      if (currentFile) {
        newSuggestions.push(...await generateImprovementSuggestions(currentFile));
      }

      // 3. Sugestões baseadas em arquivos relacionados
      newSuggestions.push(...await generateRelatedContentSuggestions());

      // 4. Sugestões de organização
      newSuggestions.push(...await generateOrganizationSuggestions());

      // 5. Sugestões de colaboração
      newSuggestions.push(...generateCollaborationSuggestions());

      // 6. Sugestões de templates
      newSuggestions.push(...generateTemplateSuggestions());

      setSuggestions(newSuggestions);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('[Smart Suggestions] Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [currentFile, allFiles, userBehavior, isEnabled, isGenerating]);

  // Gerar insights inteligentes
  const generateInsights = useCallback(async () => {
    const newInsights: SmartInsight[] = [];

    // Padrões de escrita
    newInsights.push(...analyzeWritingPatterns());
    
    // Tendências de produtividade
    newInsights.push(...analyzeProductivityTrends());
    
    // Oportunidades de otimização
    newInsights.push(...findOptimizationOpportunities());
    
    // Descobertas de conteúdo
    newInsights.push(...discoverContentConnections());

    setInsights(newInsights);
  }, [allFiles, userBehavior]);

  // Auto-refresh das sugestões
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        generateSuggestions();
        generateInsights();
      }, 30000); // A cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh, generateSuggestions, generateInsights]);

  // Gerar sugestões inicial
  useEffect(() => {
    generateSuggestions();
    generateInsights();
  }, [currentFile?.id]);

  // Funções de geração de sugestões
  const generateContinuationSuggestions = async (file: FileItem): Promise<ContentSuggestion[]> => {
    const content = file.content || '';
    const lastParagraph = content.split('\n\n').pop() || '';
    
    if (lastParagraph.length < 50) return [];

    const suggestions: ContentSuggestion[] = [];

    // Analisar contexto e sugerir continuações
    if (content.includes('TODO') || content.includes('- [ ]')) {
      suggestions.push({
        id: 'continue-todo',
        type: 'continuation',
        title: 'Adicionar mais itens à lista',
        description: 'Baseado no contexto, você pode querer adicionar mais tarefas',
        content: '- [ ] Revisar documentação\n- [ ] Implementar testes\n- [ ] Fazer deploy',
        confidence: 0.8,
        category: 'Produtividade',
        impact: 'medium',
        effort: 'low',
        tags: ['tasks', 'productivity'],
        reasoning: 'Detectei uma lista de tarefas em andamento'
      });
    }

    if (content.includes('meeting') || content.includes('reunião')) {
      suggestions.push({
        id: 'continue-meeting',
        type: 'continuation',
        title: 'Adicionar próximos passos',
        description: 'Incluir action items e responsáveis da reunião',
        content: '\n## Próximos Passos\n- [ ] [Responsável] Ação específica\n- [ ] [Data] Marco importante\n\n## Follow-up\nPróxima reunião: [Data]',
        confidence: 0.9,
        category: 'Reuniões',
        impact: 'high',
        effort: 'low',
        tags: ['meeting', 'action-items'],
        reasoning: 'Notas de reunião geralmente precisam de próximos passos'
      });
    }

    return suggestions;
  };

  const generateImprovementSuggestions = async (file: FileItem): Promise<ContentSuggestion[]> => {
    const suggestions: ContentSuggestion[] = [];
    const content = file.content || '';

    // Sugestões de formatação
    if (content.length > 500 && !content.includes('#')) {
      suggestions.push({
        id: 'add-headings',
        type: 'improvement',
        title: 'Adicionar cabeçalhos',
        description: 'Melhorar a estrutura do documento com cabeçalhos',
        content: '# Título Principal\n\n## Seção 1\n\n### Subseção',
        confidence: 0.7,
        category: 'Formatação',
        impact: 'medium',
        effort: 'low',
        tags: ['structure', 'readability'],
        reasoning: 'Documento longo sem estrutura de cabeçalhos'
      });
    }

    // Sugestões de tags automáticas
    const tagSuggestions = await aiTaggingService.suggestTags(content, file.name, file.tags);
    if (tagSuggestions.length > 0) {
      suggestions.push({
        id: 'auto-tags',
        type: 'improvement',
        title: 'Adicionar tags sugeridas',
        description: `${tagSuggestions.length} tags inteligentes identificadas`,
        content: tagSuggestions.map(t => `#${t.tag}`).join(' '),
        confidence: 0.8,
        category: 'Organização',
        impact: 'medium',
        effort: 'low',
        tags: ['tags', 'ai', 'organization'],
        reasoning: 'IA identificou tags relevantes baseadas no conteúdo'
      });
    }

    return suggestions;
  };

  const generateRelatedContentSuggestions = async (): Promise<ContentSuggestion[]> => {
    const suggestions: ContentSuggestion[] = [];
    
    if (!currentFile) return suggestions;

    // Encontrar arquivos similares
    const similarFiles = allFiles
      .filter(f => f.id !== currentFile.id)
      .map(f => ({
        file: f,
        similarity: aiTaggingService.calculateContentSimilarity(currentFile, f)
      }))
      .filter(({ similarity }) => similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    if (similarFiles.length > 0) {
      suggestions.push({
        id: 'link-related',
        type: 'related',
        title: 'Conectar com arquivos relacionados',
        description: `${similarFiles.length} arquivos similares encontrados`,
        content: `## Arquivos Relacionados\n\n${similarFiles.map(({ file }) => 
          `- [[${file.name}]] - ${file.tags?.slice(0, 3).map(t => `#${t}`).join(' ') || ''}`
        ).join('\n')}`,
        confidence: 0.8,
        category: 'Conexões',
        impact: 'high',
        effort: 'low',
        tags: ['links', 'related-content'],
        reasoning: 'Encontrei arquivos com conteúdo similar que podem ser conectados',
        relatedFiles: similarFiles.map(({ file }) => file.id)
      });
    }

    return suggestions;
  };

  const generateOrganizationSuggestions = async (): Promise<ContentSuggestion[]> => {
    const suggestions: ContentSuggestion[] = [];

    // Sugerir organização baseada em similaridade
    const organizationSuggestions = aiTaggingService.suggestFileOrganization(allFiles);
    
    if (organizationSuggestions.length > 1) {
      suggestions.push({
        id: 'auto-organize',
        type: 'organization',
        title: 'Reorganizar arquivos automaticamente',
        description: `${organizationSuggestions.length} grupos identificados por IA`,
        content: organizationSuggestions.map(group => 
          `## ${group.group}\n- ${group.files.map(f => f.name).join('\n- ')}\n\nTags: ${group.tags.join(', ')}`
        ).join('\n\n'),
        confidence: 0.7,
        category: 'Organização',
        impact: 'high',
        effort: 'medium',
        tags: ['organization', 'ai', 'structure'],
        reasoning: 'IA identificou padrões para melhor organização dos arquivos'
      });
    }

    return suggestions;
  };

  const generateCollaborationSuggestions = (): ContentSuggestion[] => {
    const suggestions: ContentSuggestion[] = [];

    if (currentFile && !currentFile.tags?.includes('shared')) {
      suggestions.push({
        id: 'suggest-collaboration',
        type: 'collaboration',
        title: 'Considerar colaboração',
        description: 'Este conteúdo pode se beneficiar de input de outros',
        content: '## Para Revisão\n\n@[nome] - Por favor, revise esta seção\n\n## Comentários\n- [ ] Adicionar exemplos\n- [ ] Verificar dados',
        confidence: 0.6,
        category: 'Colaboração',
        impact: 'medium',
        effort: 'low',
        tags: ['collaboration', 'review'],
        reasoning: 'Conteúdo técnico pode se beneficiar de revisão colaborativa'
      });
    }

    return suggestions;
  };

  const generateTemplateSuggestions = (): ContentSuggestion[] => {
    const suggestions: ContentSuggestion[] = [];

    if (currentFile && currentFile.content && currentFile.content.length < 100) {
      suggestions.push({
        id: 'apply-template',
        type: 'template',
        title: 'Usar template inteligente',
        description: 'Acelerar criação com template contextual',
        content: '# {{título}}\n\n## Objetivo\n{{objetivo}}\n\n## Contexto\n{{contexto}}\n\n## Próximos Passos\n- [ ] {{ação1}}\n- [ ] {{ação2}}',
        confidence: 0.7,
        category: 'Templates',
        impact: 'medium',
        effort: 'low',
        tags: ['template', 'productivity'],
        reasoning: 'Documento novo pode se beneficiar de template estruturado'
      });
    }

    return suggestions;
  };

  // Funções de análise de insights
  const analyzeWritingPatterns = (): SmartInsight[] => {
    const insights: SmartInsight[] = [];
    
    if (allFiles.length > 5) {
      const avgLength = allFiles.reduce((sum, f) => sum + (f.content?.length || 0), 0) / allFiles.length;
      
      insights.push({
        id: 'writing-consistency',
        type: 'pattern',
        title: 'Padrão de Escrita Identificado',
        insight: `Seus documentos têm em média ${Math.round(avgLength)} caracteres. ${avgLength > 1000 ? 'Você prefere documentos detalhados' : 'Você escreve de forma concisa'}.`,
        actionable: true,
        priority: 'low',
        metrics: { improvement: 15, confidence: 0.8 }
      });
    }

    return insights;
  };

  const analyzeProductivityTrends = (): SmartInsight[] => {
    const insights: SmartInsight[] = [];
    
    const recentFiles = allFiles.filter(f => {
      const daysSinceUpdate = (Date.now() - new Date(f.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate <= 7;
    });

    if (recentFiles.length > 0) {
      insights.push({
        id: 'productivity-trend',
        type: 'trend',
        title: 'Tendência de Produtividade',
        insight: `Você editou ${recentFiles.length} arquivos esta semana. ${recentFiles.length > 5 ? 'Excelente produtividade!' : 'Considere estabelecer metas diárias.'}`,
        actionable: true,
        priority: recentFiles.length < 3 ? 'high' : 'low'
      });
    }

    return insights;
  };

  const findOptimizationOpportunities = (): SmartInsight[] => {
    const insights: SmartInsight[] = [];
    
    const untaggedFiles = allFiles.filter(f => !f.tags || f.tags.length === 0);
    
    if (untaggedFiles.length > 0) {
      insights.push({
        id: 'tagging-opportunity',
        type: 'optimization',
        title: 'Oportunidade de Organização',
        insight: `${untaggedFiles.length} arquivos sem tags. Adicionar tags melhoraria a busca em 40%.`,
        actionable: true,
        priority: 'medium',
        metrics: { improvement: 40, confidence: 0.9 }
      });
    }

    return insights;
  };

  const discoverContentConnections = (): SmartInsight[] => {
    const insights: SmartInsight[] = [];
    
    // Encontrar arquivos que poderiam estar conectados
    let potentialConnections = 0;
    for (let i = 0; i < allFiles.length; i++) {
      for (let j = i + 1; j < allFiles.length; j++) {
        const similarity = aiTaggingService.calculateContentSimilarity(allFiles[i], allFiles[j]);
        if (similarity > 0.5) potentialConnections++;
      }
    }

    if (potentialConnections > 0) {
      insights.push({
        id: 'content-connections',
        type: 'discovery',
        title: 'Conexões de Conteúdo Descobertas',
        insight: `Encontrei ${potentialConnections} possíveis conexões entre seus arquivos que poderiam criar uma rede de conhecimento mais rica.`,
        actionable: true,
        priority: 'medium'
      });
    }

    return insights;
  };

  // Filtrar sugestões
  const filteredSuggestions = useMemo(() => {
    if (filterType === 'all') return suggestions;
    return suggestions.filter(s => s.type === filterType);
  }, [suggestions, filterType]);

  // Aplicar sugestão
  const handleApplySuggestion = useCallback((suggestion: ContentSuggestion) => {
    onApplySuggestion(suggestion);
    
    // Remover sugestão aplicada
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  }, [onApplySuggestion]);

  if (!isEnabled) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Sugestões inteligentes desabilitadas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Sugestões Inteligentes</h3>
          {isGenerating && (
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && "bg-blue-50 border-blue-200")}
          >
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={generateSuggestions}
            disabled={isGenerating}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="text-xs text-slate-500 flex items-center justify-between">
        <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
        <span>{suggestions.length} sugestões ativas</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="suggestions">
            Sugestões ({filteredSuggestions.length})
          </TabsTrigger>
          <TabsTrigger value="insights">
            Insights ({insights.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as sugestões</SelectItem>
                <SelectItem value="continuation">Continuação</SelectItem>
                <SelectItem value="improvement">Melhorias</SelectItem>
                <SelectItem value="related">Relacionado</SelectItem>
                <SelectItem value="organization">Organização</SelectItem>
                <SelectItem value="collaboration">Colaboração</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de Sugestões */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {suggestion.category}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Progress 
                                value={suggestion.confidence * 100} 
                                className="w-16 h-2" 
                              />
                              <span className="text-xs text-slate-500">
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          
                          <h4 className="font-medium mb-1">{suggestion.title}</h4>
                          <p className="text-sm text-slate-600 mb-2">
                            {suggestion.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className={cn(
                              "px-2 py-1 rounded",
                              suggestion.impact === 'high' && "bg-red-100 text-red-700",
                              suggestion.impact === 'medium' && "bg-yellow-100 text-yellow-700",
                              suggestion.impact === 'low' && "bg-green-100 text-green-700"
                            )}>
                              Impacto: {suggestion.impact}
                            </span>
                            <span>Esforço: {suggestion.effort}</span>
                          </div>
                          
                          <p className="text-xs text-slate-400 mt-2">
                            {suggestion.reasoning}
                          </p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="w-24"
                          >
                            Aplicar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSuggestions(prev => 
                              prev.filter(s => s.id !== suggestion.id)
                            )}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredSuggestions.length === 0 && !isGenerating && (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Nenhuma sugestão disponível no momento</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateSuggestions}
                className="mt-2"
              >
                Gerar Sugestões
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-3">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      insight.type === 'pattern' && "bg-blue-100",
                      insight.type === 'trend' && "bg-green-100",
                      insight.type === 'optimization' && "bg-yellow-100",
                      insight.type === 'discovery' && "bg-purple-100"
                    )}>
                      {insight.type === 'pattern' && <Target className="h-4 w-4 text-blue-600" />}
                      {insight.type === 'trend' && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {insight.type === 'optimization' && <Zap className="h-4 w-4 text-yellow-600" />}
                      {insight.type === 'discovery' && <Lightbulb className="h-4 w-4 text-purple-600" />}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{insight.title}</h4>
                        <Badge 
                          variant={insight.priority === 'high' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-slate-600">{insight.insight}</p>
                      
                      {insight.metrics && (
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span>Melhoria: +{insight.metrics.improvement}%</span>
                          <span>Confiança: {Math.round(insight.metrics.confidence * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {insights.length === 0 && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Coletando dados para insights...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SmartContentSuggestions; 