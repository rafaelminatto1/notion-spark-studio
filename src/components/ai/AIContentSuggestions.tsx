import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Brain, Lightbulb, Target, TrendingUp, 
  FileText, Hash, ArrowRight, CheckCircle, X,
  Wand2, BookOpen, PenTool, Zap, RefreshCw,
  MessageSquare, GitBranch, Layers, Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';

interface AISuggestion {
  id: string;
  type: 'content' | 'structure' | 'tags' | 'links' | 'improvement';
  title: string;
  description: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  content: string;
  metadata?: {
    reasoning?: string;
    examples?: string[];
    tags?: string[];
    relatedFiles?: string[];
  };
  actionable: boolean;
  applied?: boolean;
}

interface AIInsight {
  type: 'pattern' | 'gap' | 'opportunity' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  data: any;
}

interface AIContentSuggestionsProps {
  currentFile?: FileItem;
  allFiles: FileItem[];
  onApplySuggestion: (suggestion: AISuggestion) => void;
  onUpdateContent: (content: string) => void;
  className?: string;
}

// AI Engine Mock - Em produção seria conectado a OpenAI/Claude
class AIEngine {
  static analyzeContent(content: string, context: FileItem[], currentFile?: FileItem): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Content Analysis
    if (content.length < 100) {
      suggestions.push({
        id: 'expand-content',
        type: 'content',
        title: 'Expandir Conteúdo',
        description: 'O conteúdo parece muito breve. Considere adicionar mais detalhes.',
        confidence: 0.8,
        priority: 'medium',
        content: this.generateContentExpansion(content),
        metadata: {
          reasoning: 'Textos mais elaborados tendem a ser mais úteis e informativos.',
          examples: ['Adicione exemplos práticos', 'Inclua contexto histórico', 'Detalhe os passos']
        },
        actionable: true
      });
    }

    // Structure Analysis
    if (!content.includes('#') && content.length > 200) {
      suggestions.push({
        id: 'add-structure',
        type: 'structure',
        title: 'Melhorar Estrutura',
        description: 'Adicionar cabeçalhos pode melhorar a legibilidade.',
        confidence: 0.9,
        priority: 'high',
        content: this.generateStructuredContent(content),
        metadata: {
          reasoning: 'Documentos estruturados são mais fáceis de navegar e compreender.',
          examples: ['## Introdução', '## Desenvolvimento', '## Conclusão']
        },
        actionable: true
      });
    }

    // Tag Analysis
    const suggestedTags = this.suggestTags(content, context);
    if (suggestedTags.length > 0) {
      suggestions.push({
        id: 'suggest-tags',
        type: 'tags',
        title: 'Tags Sugeridas',
        description: `Identificamos ${suggestedTags.length} tags relevantes para este conteúdo.`,
        confidence: 0.7,
        priority: 'medium',
        content: suggestedTags.join(', '),
        metadata: {
          tags: suggestedTags,
          reasoning: 'Tags bem escolhidas facilitam a organização e busca.'
        },
        actionable: true
      });
    }

    // Link Opportunities
    const linkOpportunities = this.findLinkOpportunities(content, context);
    if (linkOpportunities.length > 0) {
      suggestions.push({
        id: 'add-links',
        type: 'links',
        title: 'Oportunidades de Conexão',
        description: `Encontramos ${linkOpportunities.length} documentos relacionados.`,
        confidence: 0.6,
        priority: 'low',
        content: linkOpportunities.map(f => f.name).join(', '),
        metadata: {
          relatedFiles: linkOpportunities.map(f => f.id),
          reasoning: 'Conectar documentos relacionados cria uma base de conhecimento mais rica.'
        },
        actionable: true
      });
    }

    // Writing Improvement
    const improvements = this.suggestImprovements(content);
    if (improvements.length > 0) {
      suggestions.push({
        id: 'improve-writing',
        type: 'improvement',
        title: 'Melhorias de Escrita',
        description: 'Sugestões para tornar o texto mais claro e envolvente.',
        confidence: 0.75,
        priority: 'medium',
        content: improvements.join('\n'),
        metadata: {
          examples: improvements,
          reasoning: 'Textos bem escritos comunicam melhor as ideias.'
        },
        actionable: true
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] - priorityOrder[a.priority]) || (b.confidence - a.confidence);
    });
  }

  static generateInsights(files: FileItem[]): AIInsight[] {
    const insights: AIInsight[] = [];

    // Pattern Analysis
    const tagFrequency: Record<string, number> = {};
    files.forEach(file => {
      file.tags?.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    const mostUsedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (mostUsedTags.length > 0) {
      insights.push({
        type: 'pattern',
        title: 'Padrões de Organização',
        description: `Você usa principalmente as tags: ${mostUsedTags.map(([tag]) => tag).join(', ')}`,
        impact: 'medium',
        data: { tags: mostUsedTags }
      });
    }

    // Content Gaps
    const recentFiles = files.filter(f => 
      new Date(f.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentFiles.length < files.length * 0.2) {
      insights.push({
        type: 'gap',
        title: 'Baixa Atividade Recente',
        description: 'Menos de 20% dos seus documentos foram atualizados na última semana.',
        impact: 'high',
        data: { recentRatio: recentFiles.length / files.length }
      });
    }

    // Growth Opportunities
    const notesWithoutTags = files.filter(f => !f.tags || f.tags.length === 0);
    if (notesWithoutTags.length > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Oportunidade de Organização',
        description: `${notesWithoutTags.length} documentos não possuem tags. Organizá-los melhoraria a busca.`,
        impact: 'medium',
        data: { untaggedCount: notesWithoutTags.length }
      });
    }

    return insights;
  }

  private static generateContentExpansion(content: string): string {
    const topics = [
      '## Contexto\nExplique o background e motivação para este tópico.',
      '## Detalhes Técnicos\nAdicione especificações e informações técnicas relevantes.',
      '## Exemplos Práticos\nInclua casos de uso e exemplos do mundo real.',
      '## Próximos Passos\nDefina ações futuras e pontos de follow-up.',
      '## Recursos Relacionados\nListe links, referências e materiais complementares.'
    ];

    return `${content  }\n\n${  topics.slice(0, 2).join('\n\n')}`;
  }

  private static generateStructuredContent(content: string): string {
    const paragraphs = content.split('\n\n');
    let structured = '';

    if (paragraphs.length >= 3) {
      structured = `# ${paragraphs[0].slice(0, 50)}...\n\n`;
      structured += `## Introdução\n${paragraphs[0]}\n\n`;
      structured += `## Desenvolvimento\n${paragraphs.slice(1, -1).join('\n\n')}\n\n`;
      structured += `## Conclusão\n${paragraphs[paragraphs.length - 1]}`;
    } else {
      structured = `# Título\n\n## Seção Principal\n${content}`;
    }

    return structured;
  }

  private static suggestTags(content: string, context: FileItem[]): string[] {
    const keywords = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
    const commonWords = new Set(['este', 'esta', 'para', 'com', 'por', 'em', 'de', 'da', 'do', 'que', 'como', 'mais', 'muito', 'sobre', 'quando', 'onde', 'porque']);
    
    const relevantKeywords = keywords
      .filter(word => !commonWords.has(word))
      .reduce<Record<string, number>>((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

    const topKeywords = Object.entries(relevantKeywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    // Add contextual tags from similar files
    const existingTags = new Set(
      context.flatMap(f => f.tags || [])
    );

    const suggestions = [...topKeywords];
    existingTags.forEach(tag => {
      if (content.toLowerCase().includes(tag.toLowerCase()) && !suggestions.includes(tag)) {
        suggestions.push(tag);
      }
    });

    return suggestions.slice(0, 8);
  }

  private static findLinkOpportunities(content: string, context: FileItem[]): FileItem[] {
    const contentWords = new Set(
      content.toLowerCase().match(/\b\w{4,}\b/g) || []
    );

    return context
      .filter(file => {
        const fileWords = new Set(
          (`${file.name  } ${  file.content || ''}`).toLowerCase().match(/\b\w{4,}\b/g) || []
        );
        
        const intersection = new Set([...contentWords].filter(x => fileWords.has(x)));
        return intersection.size >= 3; // At least 3 words in common
      })
      .slice(0, 5);
  }

  private static suggestImprovements(content: string): string[] {
    const improvements: string[] = [];

    if (content.includes('muito')) {
      improvements.push('Considere substituir "muito" por advérbios mais específicos');
    }

    if (!/[.!?]$/.test(content.trim())) {
      improvements.push('Adicione pontuação adequada ao final dos parágrafos');
    }

    if (content.split('.').length < 3) {
      improvements.push('Considere dividir em frases menores para melhor legibilidade');
    }

    if (!content.includes('por exemplo') && !content.includes('como')) {
      improvements.push('Adicione exemplos para ilustrar conceitos importantes');
    }

    return improvements;
  }
}

export const AIContentSuggestions: React.FC<AIContentSuggestionsProps> = ({
  currentFile,
  allFiles,
  onApplySuggestion,
  onUpdateContent,
  className
}) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  // Generate suggestions when content changes
  useEffect(() => {
    if (currentFile?.content) {
      setLoading(true);
      
      // Simulate AI processing delay
      const timer = setTimeout(() => {
        const newSuggestions = AIEngine.analyzeContent(
          currentFile.content || '',
          allFiles,
          currentFile
        );
        setSuggestions(newSuggestions);
        setLoading(false);
      }, 1500);

      return () => { clearTimeout(timer); };
    }
  }, [currentFile?.content, currentFile?.id, allFiles]);

  // Generate insights
  useEffect(() => {
    const newInsights = AIEngine.generateInsights(allFiles);
    setInsights(newInsights);
  }, [allFiles]);

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    onApplySuggestion(suggestion);

    // Update suggestions to mark as applied
    setSuggestions(prev => 
      prev.map(s => s.id === suggestion.id ? { ...s, applied: true } : s)
    );
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'content': return <FileText className="h-4 w-4" />;
      case 'structure': return <Layers className="h-4 w-4" />;
      case 'tags': return <Hash className="h-4 w-4" />;
      case 'links': return <GitBranch className="h-4 w-4" />;
      case 'improvement': return <PenTool className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getColorForPriority = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50 text-red-800';
      case 'medium': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'low': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getColorForImpact = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const activeSuggestions = suggestions.filter(s => !s.applied);
  const appliedSuggestionsCount = suggestions.filter(s => s.applied).length;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Assistente IA</CardTitle>
              <p className="text-sm text-slate-500">
                Sugestões inteligentes para seu conteúdo
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Analisando...
              </div>
            )}
            
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {appliedSuggestionsCount} aplicadas
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Wand2 className="h-3 w-3" />
              Sugestões ({activeSuggestions.length})
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3" />
              Insights ({insights.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <CheckCircle className="h-3 w-3" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggestions" className="mt-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : activeSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-500 mb-2">
                    Tudo perfeito!
                  </h3>
                  <p className="text-slate-400">
                    Não há sugestões no momento. Continue escrevendo para receber dicas.
                  </p>
                </div>
              ) : (
                activeSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                      getColorForPriority(suggestion.priority)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getIconForType(suggestion.type)}
                        <h4 className="font-medium">{suggestion.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}% confiança
                        </Badge>
                      </div>
                      
                      <Badge variant="outline" className="text-xs">
                        {suggestion.priority}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">
                      {suggestion.description}
                    </p>

                    {suggestion.metadata?.reasoning && (
                      <div className="bg-white/50 p-3 rounded text-xs text-slate-600 mb-3">
                        <strong>Por quê:</strong> {suggestion.metadata.reasoning}
                      </div>
                    )}

                    {suggestion.metadata?.examples && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">Exemplos:</p>
                        <ul className="text-xs text-slate-500 space-y-1">
                          {suggestion.metadata.examples.map((example, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <ArrowRight className="h-2 w-2" />
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Progress value={suggestion.confidence * 100} className="w-20 h-2" />
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Dispensar
                        </Button>
                        
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { handleApplySuggestion(suggestion); }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="insights" className="mt-4 space-y-3">
            {insights.map((insight, index) => (
              <motion.div
                key={`${insight.type}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-slate-50 rounded-lg border"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      getColorForImpact(insight.impact)
                    )} />
                    <h4 className="font-medium text-slate-900">{insight.title}</h4>
                  </div>
                  
                  <Badge variant="outline" className="text-xs">
                    {insight.type}
                  </Badge>
                </div>

                <p className="text-sm text-slate-600">{insight.description}</p>

                {insight.data && (
                  <div className="mt-3 p-2 bg-white rounded text-xs">
                    <pre className="text-slate-500">
                      {JSON.stringify(insight.data, null, 2)}
                    </pre>
                  </div>
                )}
              </motion.div>
            ))}

            {insights.length === 0 && (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-500 mb-2">
                  Coletando dados...
                </h3>
                <p className="text-slate-400">
                  Use mais o app para receber insights personalizados.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="space-y-3">
              {suggestions.filter(s => s.applied).map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">{suggestion.title}</span>
                  </div>
                  <p className="text-sm text-green-600">{suggestion.description}</p>
                </div>
              ))}

              {appliedSuggestionsCount === 0 && (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-500 mb-2">
                    Nenhuma sugestão aplicada
                  </h3>
                  <p className="text-slate-400">
                    As sugestões aplicadas aparecerão aqui.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 