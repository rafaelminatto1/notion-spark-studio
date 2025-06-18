import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Hash, Zap, Brain, Target, TrendingUp, 
  Folder, FileText, ArrowRight, CheckCircle, 
  X, RefreshCw, Sparkles, Filter, 
  BarChart3, PieChart, Network, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types';

interface TagSuggestion {
  tag: string;
  confidence: number;
  reasoning: string;
  category: 'topic' | 'type' | 'priority' | 'status' | 'context';
  source: 'content' | 'title' | 'pattern' | 'similarity';
  relatedTags: string[];
}

interface OrganizationSuggestion {
  id: string;
  type: 'create_folder' | 'move_file' | 'merge_folders' | 'rename_item';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  items: string[]; // File/folder IDs
  targetStructure?: any;
}

interface ContentAnalysis {
  topics: Array<{ name: string; weight: number }>;
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: 'simple' | 'moderate' | 'complex';
  domain: string;
  keywords: Array<{ word: string; frequency: number; relevance: number }>;
  entities: Array<{ name: string; type: 'person' | 'place' | 'organization' | 'concept' }>;
}

interface AutoTaggingProps {
  files: FileItem[];
  currentFile?: FileItem;
  onApplyTags: (fileId: string, tags: string[]) => void;
  onApplyOrganization: (suggestion: OrganizationSuggestion) => void;
  autoMode?: boolean;
  className?: string;
}

// AI Content Analyzer
class ContentAnalyzer {
  private static readonly STOP_WORDS = new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 
    'nas', 'nos', 'por', 'para', 'com', 'sem', 'sobre',
    'que', 'quando', 'onde', 'como', 'porque', 'se',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on',
    'at', 'to', 'for', 'of', 'with', 'by', 'from'
  ]);

  static analyzeContent(content: string, title = ''): ContentAnalysis {
    const text = (`${title  } ${  content}`).toLowerCase();
    const words = this.extractWords(text);
    
    return {
      topics: this.extractTopics(text, words),
      sentiment: this.analyzeSentiment(text),
      complexity: this.analyzeComplexity(text),
      domain: this.identifyDomain(text, words),
      keywords: this.extractKeywords(words),
      entities: this.extractEntities(text)
    };
  }

  static suggestTags(file: FileItem, allFiles: FileItem[]): TagSuggestion[] {
    const analysis = this.analyzeContent(file.content || '', file.name);
    const suggestions: TagSuggestion[] = [];

    // Topic-based tags
    analysis.topics.forEach(topic => {
      if (topic.weight > 0.3) {
        suggestions.push({
          tag: topic.name,
          confidence: topic.weight,
          reasoning: `Tópico principal identificado no conteúdo`,
          category: 'topic',
          source: 'content',
          relatedTags: this.findRelatedTags(topic.name, allFiles)
        });
      }
    });

    // Domain-based tags
    suggestions.push({
      tag: analysis.domain,
      confidence: 0.7,
      reasoning: `Domínio identificado: ${analysis.domain}`,
      category: 'context',
      source: 'content',
      relatedTags: []
    });

    // Complexity-based tags
    if (analysis.complexity !== 'moderate') {
      suggestions.push({
        tag: analysis.complexity,
        confidence: 0.6,
        reasoning: `Nível de complexidade: ${analysis.complexity}`,
        category: 'type',
        source: 'content',
        relatedTags: []
      });
    }

    // Keyword-based tags
    analysis.keywords.slice(0, 5).forEach(keyword => {
      if (keyword.relevance > 0.5) {
        suggestions.push({
          tag: keyword.word,
          confidence: keyword.relevance,
          reasoning: `Palavra-chave frequente (${keyword.frequency}x)`,
          category: 'topic',
          source: 'content',
          relatedTags: []
        });
      }
    });

    // Pattern-based tags (from similar files)
    const similarFiles = this.findSimilarFiles(file, allFiles);
    const patternTags = this.extractPatternTags(similarFiles);
    
    patternTags.forEach(tag => {
      suggestions.push({
        tag: tag.name,
        confidence: tag.confidence,
        reasoning: `Padrão identificado em arquivos similares`,
        category: 'pattern' as any,
        source: 'pattern',
        relatedTags: tag.related
      });
    });

    // Entity-based tags
    analysis.entities.forEach(entity => {
      suggestions.push({
        tag: entity.name,
        confidence: 0.6,
        reasoning: `Entidade identificada: ${entity.type}`,
        category: 'context',
        source: 'content',
        relatedTags: []
      });
    });

    return suggestions
      .filter(s => s.confidence > 0.3)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  static suggestOrganization(files: FileItem[]): OrganizationSuggestion[] {
    const suggestions: OrganizationSuggestion[] = [];
    
    // Analyze file clustering opportunities
    const clusters = this.clusterFiles(files);
    
    clusters.forEach((cluster, index) => {
      if (cluster.files.length >= 3) {
        suggestions.push({
          id: `cluster-${index}`,
          type: 'create_folder',
          title: `Criar pasta "${cluster.topic}"`,
          description: `Agrupar ${cluster.files.length} arquivos relacionados a ${cluster.topic}`,
          confidence: cluster.coherence,
          impact: cluster.files.length > 5 ? 'high' : 'medium',
          items: cluster.files.map(f => f.id),
          targetStructure: {
            folderName: cluster.topic,
            files: cluster.files
          }
        });
      }
    });

    // Detect orphaned files
    const untaggedFiles = files.filter(f => !f.tags || f.tags.length === 0);
    if (untaggedFiles.length > 5) {
      suggestions.push({
        id: 'organize-untagged',
        type: 'create_folder',
        title: 'Organizar arquivos sem tags',
        description: `${untaggedFiles.length} arquivos precisam de organização`,
        confidence: 0.8,
        impact: 'high',
        items: untaggedFiles.map(f => f.id),
        targetStructure: {
          folderName: 'Sem categoria',
          files: untaggedFiles
        }
      });
    }

    // Detect redundant structure
    const folderAnalysis = this.analyzeFolderStructure(files);
    folderAnalysis.redundancies.forEach((redundancy, index) => {
      suggestions.push({
        id: `merge-${index}`,
        type: 'merge_folders',
        title: `Mesclar pastas similares`,
        description: `${redundancy.folders.join(' e ')} parecem ter conteúdo similar`,
        confidence: redundancy.similarity,
        impact: 'medium',
        items: redundancy.folders,
        targetStructure: {
          mergedName: redundancy.suggestedName
        }
      });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private static extractWords(text: string): string[] {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.STOP_WORDS.has(word));
  }

  private static extractTopics(text: string, words: string[]): Array<{ name: string; weight: number }> {
    const topicKeywords = {
      'tecnologia': ['sistema', 'código', 'desenvolvimento', 'software', 'aplicação', 'api', 'dados'],
      'negócios': ['estratégia', 'marketing', 'vendas', 'cliente', 'mercado', 'produto', 'receita'],
      'projeto': ['planejamento', 'cronograma', 'tarefa', 'equipe', 'deadline', 'entrega', 'milestone'],
      'pesquisa': ['análise', 'estudo', 'metodologia', 'resultados', 'conclusão', 'referência'],
      'educação': ['aprendizado', 'curso', 'aula', 'exercício', 'prova', 'conhecimento'],
      'saúde': ['medicina', 'tratamento', 'diagnóstico', 'sintoma', 'paciente', 'exame'],
      'finanças': ['investimento', 'dinheiro', 'orçamento', 'custo', 'lucro', 'economia']
    };

    const topics: Array<{ name: string; weight: number }> = [];

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      const matches = keywords.filter(keyword => 
        text.includes(keyword) || words.includes(keyword)
      );
      
      if (matches.length > 0) {
        const weight = matches.length / keywords.length;
        topics.push({ name: topic, weight });
      }
    });

    return topics.sort((a, b) => b.weight - a.weight);
  }

  private static analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['bom', 'ótimo', 'excelente', 'sucesso', 'melhor', 'positivo'];
    const negativeWords = ['ruim', 'problema', 'erro', 'falha', 'negativo', 'pior'];

    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static analyzeComplexity(text: string): 'simple' | 'moderate' | 'complex' {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);

    if (avgWordsPerSentence < 10) return 'simple';
    if (avgWordsPerSentence < 20) return 'moderate';
    return 'complex';
  }

  private static identifyDomain(text: string, words: string[]): string {
    const domains = {
      'tecnologia': ['código', 'sistema', 'software', 'api', 'banco', 'dados'],
      'negócios': ['empresa', 'cliente', 'vendas', 'marketing', 'estratégia'],
      'educação': ['ensino', 'aprendizado', 'curso', 'estudo', 'escola'],
      'pesquisa': ['pesquisa', 'análise', 'estudo', 'metodologia', 'dados'],
      'pessoal': ['vida', 'família', 'amigos', 'hobby', 'viagem'],
      'trabalho': ['projeto', 'equipe', 'reunião', 'deadline', 'tarefa']
    };

    let bestDomain = 'geral';
    let bestScore = 0;

    Object.entries(domains).forEach(([domain, keywords]) => {
      const score = keywords.filter(keyword => 
        words.includes(keyword) || text.includes(keyword)
      ).length;
      
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    });

    return bestDomain;
  }

  private static extractKeywords(words: string[]): Array<{ word: string; frequency: number; relevance: number }> {
    const frequency: Record<string, number> = {};
    
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .map(([word, freq]) => ({
        word,
        frequency: freq,
        relevance: freq / words.length
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  private static extractEntities(text: string): Array<{ name: string; type: 'person' | 'place' | 'organization' | 'concept' }> {
    const entities: Array<{ name: string; type: 'person' | 'place' | 'organization' | 'concept' }> = [];
    
    // Simple entity extraction (in production, use NLP libraries)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    
    capitalizedWords.forEach(word => {
      if (word.length > 3) {
        entities.push({
          name: word.toLowerCase(),
          type: 'concept' // Simplified - would need proper NER
        });
      }
    });

    return entities.slice(0, 5);
  }

  private static findRelatedTags(tag: string, files: FileItem[]): string[] {
    const relatedTags: Record<string, number> = {};
    
    files.forEach(file => {
      if (file.tags?.includes(tag)) {
        file.tags.forEach(otherTag => {
          if (otherTag !== tag) {
            relatedTags[otherTag] = (relatedTags[otherTag] || 0) + 1;
          }
        });
      }
    });

    return Object.entries(relatedTags)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([tagName]) => tagName);
  }

  private static findSimilarFiles(file: FileItem, allFiles: FileItem[]): FileItem[] {
    const fileWords = new Set(this.extractWords((`${file.name  } ${  file.content || ''}`).toLowerCase()));
    
    return allFiles
      .filter(f => f.id !== file.id)
      .map(f => {
        const otherWords = new Set(this.extractWords((`${f.name  } ${  f.content || ''}`).toLowerCase()));
        const intersection = new Set([...fileWords].filter(x => otherWords.has(x)));
        const similarity = intersection.size / Math.max(fileWords.size, otherWords.size);
        
        return { file: f, similarity };
      })
      .filter(({ similarity }) => similarity > 0.2)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(({ file }) => file);
  }

  private static extractPatternTags(files: FileItem[]): Array<{ name: string; confidence: number; related: string[] }> {
    const tagFrequency: Record<string, number> = {};
    
    files.forEach(file => {
      file.tags?.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });
    });

    return Object.entries(tagFrequency)
      .map(([tag, frequency]) => ({
        name: tag,
        confidence: Math.min(frequency / files.length, 1),
        related: []
      }))
      .filter(({ confidence }) => confidence > 0.3);
  }

  private static clusterFiles(files: FileItem[]): Array<{ topic: string; files: FileItem[]; coherence: number }> {
    // Simple clustering by common tags and content similarity
    const clusters: Array<{ topic: string; files: FileItem[]; coherence: number }> = [];
    
    // Group by most common tags
    const tagGroups: Record<string, FileItem[]> = {};
    
    files.forEach(file => {
      file.tags?.forEach(tag => {
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push(file);
      });
    });

    Object.entries(tagGroups).forEach(([tag, groupFiles]) => {
      if (groupFiles.length >= 3) {
        clusters.push({
          topic: tag,
          files: groupFiles,
          coherence: Math.min(groupFiles.length / 10, 1) // Simple coherence metric
        });
      }
    });

    return clusters.sort((a, b) => b.coherence - a.coherence);
  }

  private static analyzeFolderStructure(files: FileItem[]) {
    const folders = files.filter(f => f.type === 'folder');
    const redundancies: Array<{ folders: string[]; similarity: number; suggestedName: string }> = [];

    // Simple redundancy detection
    for (let i = 0; i < folders.length; i++) {
      for (let j = i + 1; j < folders.length; j++) {
        const folder1 = folders[i];
        const folder2 = folders[j];
        
        const similarity = this.calculateNameSimilarity(folder1.name, folder2.name);
        
        if (similarity > 0.7) {
          redundancies.push({
            folders: [folder1.name, folder2.name],
            similarity,
            suggestedName: this.mergeNames(folder1.name, folder2.name)
          });
        }
      }
    }

    return { redundancies };
  }

  private static calculateNameSimilarity(name1: string, name2: string): number {
    const words1 = new Set(name1.toLowerCase().split(/\s+/));
    const words2 = new Set(name2.toLowerCase().split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    
    return intersection.size / Math.max(words1.size, words2.size);
  }

  private static mergeNames(name1: string, name2: string): string {
    const words1 = name1.toLowerCase().split(/\s+/);
    const words2 = name2.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length > 0 ? commonWords.join(' ') : `${name1} & ${name2}`;
  }
}

export const AutoTagging: React.FC<AutoTaggingProps> = ({
  files,
  currentFile,
  onApplyTags,
  onApplyOrganization,
  autoMode = false,
  className
}) => {
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [orgSuggestions, setOrgSuggestions] = useState<OrganizationSuggestion[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [settings, setSettings] = useState({
    autoApply: false,
    confidenceThreshold: 70,
    enableOrganization: true
  });
  const [activeTab, setActiveTab] = useState('tags');

  // Analyze current file for tag suggestions
  useEffect(() => {
    if (currentFile) {
      setAnalyzing(true);
      
      setTimeout(() => {
        const suggestions = ContentAnalyzer.suggestTags(currentFile, files);
        setTagSuggestions(suggestions);
        setAnalyzing(false);
      }, 1000);
    }
  }, [currentFile, files]);

  // Analyze all files for organization suggestions
  useEffect(() => {
    if (settings.enableOrganization && files.length > 5) {
      const orgSuggestions = ContentAnalyzer.suggestOrganization(files);
      setOrgSuggestions(orgSuggestions);
    }
  }, [files, settings.enableOrganization]);

  const applyTagSuggestion = (suggestion: TagSuggestion) => {
    if (currentFile) {
      const currentTags = currentFile.tags || [];
      if (!currentTags.includes(suggestion.tag)) {
        onApplyTags(currentFile.id, [...currentTags, suggestion.tag]);
      }
    }
    
    setTagSuggestions(prev => prev.filter(s => s.tag !== suggestion.tag));
  };

  const applyOrganizationSuggestion = (suggestion: OrganizationSuggestion) => {
    onApplyOrganization(suggestion);
    setOrgSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const filteredTagSuggestions = tagSuggestions.filter(
    s => s.confidence * 100 >= settings.confidenceThreshold
  );

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'topic': return <Hash className="h-3 w-3" />;
      case 'type': return <FileText className="h-3 w-3" />;
      case 'priority': return <Target className="h-3 w-3" />;
      case 'status': return <CheckCircle className="h-3 w-3" />;
      case 'context': return <Globe className="h-3 w-3" />;
      default: return <Hash className="h-3 w-3" />;
    }
  };

  const getColorForConfidence = (confidence: number) => {
    if (confidence >= 0.8) return 'border-green-200 bg-green-50 text-green-800';
    if (confidence >= 0.6) return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    return 'border-blue-200 bg-blue-50 text-blue-800';
  };

  const getIconForOrgType = (type: string) => {
    switch (type) {
      case 'create_folder': return <Folder className="h-4 w-4" />;
      case 'move_file': return <ArrowRight className="h-4 w-4" />;
      case 'merge_folders': return <Network className="h-4 w-4" />;
      case 'rename_item': return <FileText className="h-4 w-4" />;
      default: return <Folder className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Auto-Organização</CardTitle>
              <p className="text-sm text-slate-500">
                IA para tags e organização automática
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.autoApply}
                onCheckedChange={(checked) => 
                  { setSettings(prev => ({ ...prev, autoApply: checked })); }
                }
              />
              <span className="text-xs text-slate-600">Auto-aplicar</span>
            </div>
            
            {analyzing && (
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tags" className="flex items-center gap-2">
              <Hash className="h-3 w-3" />
              Tags ({filteredTagSuggestions.length})
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Folder className="h-3 w-3" />
              Organização ({orgSuggestions.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Target className="h-3 w-3" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tags" className="mt-4 space-y-3">
            <AnimatePresence mode="popLayout">
              {analyzing ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredTagSuggestions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-500 mb-2">
                    Nenhuma sugestão de tag
                  </h3>
                  <p className="text-slate-400">
                    {currentFile ? 'O arquivo atual já está bem organizado' : 'Selecione um arquivo para ver sugestões'}
                  </p>
                </div>
              ) : (
                filteredTagSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={suggestion.tag}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "p-4 rounded-lg border transition-all hover:shadow-md",
                      getColorForConfidence(suggestion.confidence)
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getIconForCategory(suggestion.category)}
                        <div>
                          <div className="font-medium text-sm">#{suggestion.tag}</div>
                          <div className="text-xs text-slate-500">{suggestion.category}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {suggestion.source}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-3">{suggestion.reasoning}</p>

                    {suggestion.relatedTags.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-slate-600 mb-1">Tags relacionadas:</p>
                        <div className="flex flex-wrap gap-1">
                          {suggestion.relatedTags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Progress value={suggestion.confidence * 100} className="w-24 h-2" />
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { setTagSuggestions(prev => 
                            prev.filter(s => s.tag !== suggestion.tag)
                          ); }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Ignorar
                        </Button>
                        
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => { applyTagSuggestion(suggestion); }}
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

          <TabsContent value="organization" className="mt-4 space-y-3">
            {orgSuggestions.length === 0 ? (
              <div className="text-center py-8">
                <Folder className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-slate-500 mb-2">
                  Estrutura bem organizada
                </h3>
                <p className="text-slate-400">
                  Não há sugestões de organização no momento
                </p>
              </div>
            ) : (
              orgSuggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIconForOrgType(suggestion.type)}
                      <div>
                        <h4 className="font-medium text-sm text-slate-900">{suggestion.title}</h4>
                        <p className="text-xs text-slate-500">
                          Impacto {suggestion.impact} • {suggestion.items.length} itens
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {Math.round(suggestion.confidence * 100)}%
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{suggestion.description}</p>

                  <div className="flex items-center justify-between">
                    <Progress value={suggestion.confidence * 100} className="w-32 h-2" />
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { setOrgSuggestions(prev => 
                          prev.filter(s => s.id !== suggestion.id)
                        ); }}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Dispensar
                      </Button>
                      
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { applyOrganizationSuggestion(suggestion); }}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Aplicação automática</label>
                  <p className="text-xs text-slate-500">
                    Aplicar sugestões de alta confiança automaticamente
                  </p>
                </div>
                <Switch
                  checked={settings.autoApply}
                  onCheckedChange={(checked) => 
                    { setSettings(prev => ({ ...prev, autoApply: checked })); }
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Limite de confiança: {settings.confidenceThreshold}%
                </label>
                <Slider
                  value={[settings.confidenceThreshold]}
                  onValueChange={([value]) => 
                    { setSettings(prev => ({ ...prev, confidenceThreshold: value })); }
                  }
                  max={100}
                  min={30}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Apenas sugestões acima deste limite serão exibidas
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Sugestões de organização</label>
                  <p className="text-xs text-slate-500">
                    Analisar estrutura de pastas e sugerir melhorias
                  </p>
                </div>
                <Switch
                  checked={settings.enableOrganization}
                  onCheckedChange={(checked) => 
                    { setSettings(prev => ({ ...prev, enableOrganization: checked })); }
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium mb-2">Estatísticas</h4>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {files.filter(f => f.tags && f.tags.length > 0).length}
                  </div>
                  <div className="text-xs text-slate-500">Arquivos com tags</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900">
                    {new Set(files.flatMap(f => f.tags || [])).size}
                  </div>
                  <div className="text-xs text-slate-500">Tags únicas</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}; 