import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  Tag, 
  Link2, 
  FileText, 
  Zap, 
  Brain, 
  Target,
  TrendingUp,
  Eye,
  BookOpen,
  Hash,
  Users,
  Clock,
  Sparkles,
  X,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { contentAI, AIAnalysis, SimilarityResult } from '@/services/ContentAI';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface SmartSuggestionsProps {
  currentDocument: FileItem;
  allDocuments: FileItem[];
  onApplySuggestion: (suggestion: string, type: SuggestionType) => void;
  onNavigateToDocument: (documentId: string) => void;
  onAddTag: (tag: string) => void;
  className?: string;
}

type SuggestionType = 'content' | 'structure' | 'tags' | 'related' | 'improvement';

interface Suggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  action: string;
  confidence: number;
  icon: React.ElementType;
  priority: 'low' | 'medium' | 'high';
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  currentDocument,
  allDocuments,
  onApplySuggestion,
  onNavigateToDocument,
  onAddTag,
  className
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [similarDocuments, setSimilarDocuments] = useState<SimilarityResult[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const debouncedContent = useDebounce(currentDocument.content || '', 1000);

  // Perform AI analysis
  const performAnalysis = useCallback(async () => {
    if (!debouncedContent.trim()) return;

    setIsAnalyzing(true);
    try {
      // Analyze current content
      const contentAnalysis = await contentAI.analyzeContent(
        debouncedContent, 
        currentDocument.name
      );

      // Find similar documents
      const similar = await contentAI.findSimilarDocuments(
        currentDocument,
        allDocuments.filter(doc => doc.id !== currentDocument.id)
      );

      // Generate suggestions
      const contentSuggestions = await contentAI.generateContentSuggestions(
        debouncedContent,
        similar.map(s => allDocuments.find(d => d.id === s.documentId)!).filter(Boolean),
        { tags: currentDocument.tags, category: 'document' }
      );

      setAnalysis(contentAnalysis);
      setSimilarDocuments(similar);
      
      // Convert to structured suggestions
      const structuredSuggestions = generateStructuredSuggestions(
        contentAnalysis,
        similar,
        contentSuggestions,
        currentDocument
      );
      
      setSuggestions(structuredSuggestions);
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [debouncedContent, currentDocument, allDocuments]);

  // Generate structured suggestions
  const generateStructuredSuggestions = (
    analysis: AIAnalysis,
    similar: SimilarityResult[],
    contentSuggestions: string[],
    document: FileItem
  ): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    // Content improvement suggestions
    contentSuggestions.forEach((suggestion, index) => {
      suggestions.push({
        id: `content-${index}`,
        type: 'content',
        title: suggestion,
        description: 'Sugestão baseada na análise do conteúdo atual',
        action: suggestion,
        confidence: 0.8,
        icon: Lightbulb,
        priority: 'medium'
      });
    });

    // Tag suggestions
    if (analysis.tags.length > (document.tags?.length || 0)) {
      const newTags = analysis.tags.filter(tag => 
        !(document.tags || []).some(existingTag => 
          existingTag.toLowerCase() === tag.toLowerCase()
        )
      );

      if (newTags.length > 0) {
        suggestions.push({
          id: 'tags-suggestion',
          type: 'tags',
          title: `Adicionar ${newTags.length} tag(s) sugerida(s)`,
          description: `Tags identificadas: ${newTags.slice(0, 3).join(', ')}`,
          action: `Adicionar tags: ${newTags.join(', ')}`,
          confidence: 0.9,
          icon: Tag,
          priority: 'high'
        });
      }
    }

    // Related documents suggestions
    if (similar.length > 0) {
      similar.slice(0, 3).forEach((sim, index) => {
        const relatedDoc = allDocuments.find(d => d.id === sim.documentId);
        if (relatedDoc) {
          suggestions.push({
            id: `related-${sim.documentId}`,
            type: 'related',
            title: `Documento relacionado: ${relatedDoc.name}`,
            description: `${Math.round(sim.score * 100)}% similar - ${sim.reason}`,
            action: `Navegar para ${relatedDoc.name}`,
            confidence: sim.score,
            icon: Link2,
            priority: sim.score > 0.7 ? 'high' : 'medium'
          });
        }
      });
    }

    // Structure suggestions
    if (analysis.complexity === 'high' && !debouncedContent.includes('##')) {
      suggestions.push({
        id: 'structure-headings',
        type: 'structure',
        title: 'Melhorar estrutura do documento',
        description: 'Conteúdo complexo se beneficiaria de mais subtítulos',
        action: 'Adicionar subtítulos para organizar o conteúdo',
        confidence: 0.85,
        icon: FileText,
        priority: 'high'
      });
    }

    if (analysis.readingTime > 10 && !debouncedContent.includes('- ') && !debouncedContent.includes('* ')) {
      suggestions.push({
        id: 'structure-lists',
        type: 'structure',
        title: 'Usar listas para melhor legibilidade',
        description: 'Texto longo se beneficiaria de formatação em listas',
        action: 'Converter parágrafos em listas quando apropriado',
        confidence: 0.75,
        icon: FileText,
        priority: 'medium'
      });
    }

    // Performance suggestions
    if (debouncedContent.length > 5000) {
      suggestions.push({
        id: 'performance-split',
        type: 'improvement',
        title: 'Considerar dividir documento',
        description: 'Documento muito longo pode afetar performance',
        action: 'Dividir em múltiplos documentos menores',
        confidence: 0.7,
        icon: Zap,
        priority: 'low'
      });
    }

    // SEO suggestions
    if (!debouncedContent.toLowerCase().includes(document.name.toLowerCase())) {
      suggestions.push({
        id: 'seo-title',
        type: 'improvement',
        title: 'Mencionar título no conteúdo',
        description: 'Incluir o título do documento no texto melhora a descoberta',
        action: `Mencionar "${document.name}" no conteúdo`,
        confidence: 0.6,
        icon: Target,
        priority: 'low'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.confidence - a.confidence;
    });
  };

  // Auto-analyze when content changes
  useEffect(() => {
    performAnalysis();
  }, [performAnalysis, refreshKey]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    if (suggestion.type === 'related') {
      const documentId = suggestion.id.replace('related-', '');
      onNavigateToDocument(documentId);
    } else if (suggestion.type === 'tags') {
      const newTags = analysis?.tags.filter(tag => 
        !(currentDocument.tags || []).some(existingTag => 
          existingTag.toLowerCase() === tag.toLowerCase()
        )
      ) || [];
      
      newTags.forEach(tag => onAddTag(tag));
    } else {
      onApplySuggestion(suggestion.action, suggestion.type);
    }
  }, [analysis, currentDocument.tags, onNavigateToDocument, onAddTag, onApplySuggestion]);

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const groupedSuggestions = useMemo(() => {
    const groups: Record<SuggestionType, Suggestion[]> = {
      content: [],
      structure: [],
      tags: [],
      related: [],
      improvement: []
    };

    suggestions.forEach(suggestion => {
      groups[suggestion.type].push(suggestion);
    });

    return groups;
  }, [suggestions]);

  return (
    <Card className={cn("bg-workspace-surface border-workspace-border", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <span>Sugestões Inteligentes</span>
            {isAnalyzing && (
              <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-purple-400 border-purple-400">
              {suggestions.length} sugestões
            </Badge>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRefreshKey(prev => prev + 1)}
              disabled={isAnalyzing}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className={cn("h-3 w-3", isAnalyzing && "animate-spin")} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Analysis Summary */}
        {analysis && (
          <div className="grid grid-cols-2 gap-3 p-3 bg-workspace-surface/50 rounded-lg border border-workspace-border">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">{analysis.readingTime} min leitura</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <TrendingUp className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">Complexidade {analysis.complexity}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <Hash className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">{analysis.tags.length} tags sugeridas</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Eye className="h-3 w-3 text-gray-400" />
                <span className="text-gray-300">Sentimento {analysis.sentiment}</span>
              </div>
            </div>
          </div>
        )}

        {/* Suggestions by Category */}
        <div className="space-y-4">
          {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => {
            if (typeSuggestions.length === 0) return null;

            const typeIcons: Record<SuggestionType, React.ElementType> = {
              content: Lightbulb,
              structure: FileText,
              tags: Tag,
              related: Link2,
              improvement: Sparkles
            };

            const typeLabels: Record<SuggestionType, string> = {
              content: 'Conteúdo',
              structure: 'Estrutura',
              tags: 'Tags',
              related: 'Relacionados',
              improvement: 'Melhorias'
            };

            const TypeIcon = typeIcons[type as SuggestionType];

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <TypeIcon className="h-4 w-4" />
                  <span>{typeLabels[type as SuggestionType]}</span>
                  <Badge variant="secondary" className="text-xs">
                    {typeSuggestions.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {typeSuggestions.map((suggestion) => (
                      <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all hover:bg-workspace-surface/70",
                          getPriorityColor(suggestion.priority)
                        )}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <suggestion.icon className="h-4 w-4" />
                              <span className="text-sm font-medium text-white">
                                {suggestion.title}
                              </span>
                              <Badge 
                                variant="outline" 
                                className="text-xs"
                              >
                                {Math.round(suggestion.confidence * 100)}%
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-400">
                              {suggestion.description}
                            </p>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedSuggestion(
                                expandedSuggestion === suggestion.id ? null : suggestion.id
                              );
                            }}
                          >
                            <ChevronRight className={cn(
                              "h-3 w-3 transition-transform",
                              expandedSuggestion === suggestion.id && "rotate-90"
                            )} />
                          </Button>
                        </div>

                        <AnimatePresence>
                          {expandedSuggestion === suggestion.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 pt-2 border-t border-white/10"
                            >
                              <p className="text-xs text-gray-300">
                                <strong>Ação:</strong> {suggestion.action}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {suggestions.length === 0 && !isAnalyzing && (
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma sugestão disponível</p>
            <p className="text-xs mt-1">Continue escrevendo para receber sugestões</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="h-8 w-8 mx-auto mb-3 animate-spin text-blue-400" />
            <p className="text-sm">Analisando conteúdo...</p>
            <p className="text-xs mt-1">Gerando sugestões inteligentes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 