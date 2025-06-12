import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenTool, Zap, CheckCircle, AlertCircle, Info, 
  BookOpen, Lightbulb, RefreshCw, X, ArrowRight,
  Mic, MicOff, Volume2, VolumeX, Settings,
  Languages, Palette, Target, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface WritingSuggestion {
  id: string;
  type: 'grammar' | 'style' | 'clarity' | 'tone' | 'vocabulary' | 'structure';
  severity: 'error' | 'warning' | 'suggestion';
  range: { start: number; end: number };
  original: string;
  suggestion: string;
  explanation: string;
  category: string;
  confidence: number;
  alternatives?: string[];
}

interface WritingStats {
  words: number;
  characters: number;
  paragraphs: number;
  sentences: number;
  avgWordsPerSentence: number;
  readabilityScore: number;
  readingTime: number;
  tone: 'formal' | 'informal' | 'neutral' | 'friendly' | 'professional';
  complexity: 'simple' | 'moderate' | 'complex';
}

interface SmartWritingAssistantProps {
  content: string;
  onContentChange: (content: string) => void;
  enabled?: boolean;
  language?: 'pt-BR' | 'en-US';
  mode?: 'basic' | 'advanced' | 'professional';
  className?: string;
}

// Writing Analysis Engine
class WritingAnalyzer {
  static analyzeText(text: string, language: string = 'pt-BR'): {
    suggestions: WritingSuggestion[];
    stats: WritingStats;
  } {
    const suggestions = this.findWritingIssues(text, language);
    const stats = this.calculateStats(text);
    
    return { suggestions, stats };
  }

  private static findWritingIssues(text: string, language: string): WritingSuggestion[] {
    const suggestions: WritingSuggestion[] = [];
    let suggestionId = 0;

    // Grammar checks
    const grammarRules = language === 'pt-BR' ? this.getPortugueseGrammarRules() : this.getEnglishGrammarRules();
    
    grammarRules.forEach(rule => {
      const matches = text.matchAll(rule.pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          suggestions.push({
            id: `grammar-${suggestionId++}`,
            type: 'grammar',
            severity: 'error',
            range: { start: match.index, end: match.index + match[0].length },
            original: match[0],
            suggestion: rule.suggestion(match),
            explanation: rule.explanation,
            category: rule.category,
            confidence: rule.confidence,
            alternatives: rule.alternatives?.(match)
          });
        }
      }
    });

    // Style checks
    const styleRules = this.getStyleRules(language);
    styleRules.forEach(rule => {
      const matches = text.matchAll(rule.pattern);
      for (const match of matches) {
        if (match.index !== undefined) {
          suggestions.push({
            id: `style-${suggestionId++}`,
            type: 'style',
            severity: 'suggestion',
            range: { start: match.index, end: match.index + match[0].length },
            original: match[0],
            suggestion: rule.suggestion(match),
            explanation: rule.explanation,
            category: rule.category,
            confidence: rule.confidence
          });
        }
      }
    });

    // Clarity checks
    const clarityIssues = this.findClarityIssues(text);
    suggestions.push(...clarityIssues);

    // Tone analysis
    const toneIssues = this.analyzeTone(text);
    suggestions.push(...toneIssues);

    return suggestions.sort((a, b) => {
      const severityOrder = { error: 3, warning: 2, suggestion: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  private static calculateStats(text: string): WritingStats {
    const words = text.match(/\b\w+\b/g) || [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    const readingTime = Math.ceil(words.length / 200); // Average reading speed
    
    // Simple readability score (Flesch-like)
    const avgSentenceLength = avgWordsPerSentence;
    const avgSyllablesPerWord = this.estimateSyllables(words.join(' ')) / words.length;
    const readabilityScore = Math.max(0, Math.min(100, 
      206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
    ));

    const tone = this.determineTone(text);
    const complexity = this.determineComplexity(avgWordsPerSentence, avgSyllablesPerWord);

    return {
      words: words.length,
      characters: text.length,
      paragraphs: paragraphs.length,
      sentences: sentences.length,
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      readabilityScore: Math.round(readabilityScore),
      readingTime,
      tone,
      complexity
    };
  }

  private static getPortugueseGrammarRules() {
    return [
      {
        pattern: /\bmais\s+([aeiouáéíóúâêôàü][a-zá-ú]*)/gi,
        suggestion: (match: RegExpMatchArray) => `mais ${match[1]}`,
        explanation: 'Evite usar "mais" seguido de palavras que começam com vogal sem hífen.',
        category: 'Ortografia',
        confidence: 0.8
      },
      {
        pattern: /\b(ha|à)\s+(muito\s+tempo|anos|dias|horas)\b/gi,
        suggestion: (match: RegExpMatchArray) => match[0].replace(/^(ha|à)/, 'há'),
        explanation: 'Use "há" para indicar tempo passado.',
        category: 'Gramática',
        confidence: 0.9
      },
      {
        pattern: /\b(mau|mal)\b/gi,
        suggestion: (match: RegExpMatchArray) => 'mal/mau',
        explanation: 'Verifique se deve usar "mal" (advérbio) ou "mau" (adjetivo).',
        category: 'Gramática',
        confidence: 0.7,
        alternatives: (match: RegExpMatchArray) => ['mal', 'mau']
      }
    ];
  }

  private static getEnglishGrammarRules() {
    return [
      {
        pattern: /\b(its|it's)\b/gi,
        suggestion: (match: RegExpMatchArray) => "it's/its",
        explanation: "Use 'it's' for 'it is' and 'its' for possession.",
        category: 'Grammar',
        confidence: 0.8,
        alternatives: (match: RegExpMatchArray) => ["it's", "its"]
      },
      {
        pattern: /\b(your|you're)\b/gi,
        suggestion: (match: RegExpMatchArray) => "you're/your",
        explanation: "Use 'you're' for 'you are' and 'your' for possession.",
        category: 'Grammar',
        confidence: 0.8,
        alternatives: (match: RegExpMatchArray) => ["you're", "your"]
      }
    ];
  }

  private static getStyleRules(language: string) {
    const portugueseRules = [
      {
        pattern: /\bmuito\s+(bom|ruim|grande|pequeno|importante)\b/gi,
        suggestion: (match: RegExpMatchArray) => {
          const word = match[1].toLowerCase();
          const alternatives = {
            'bom': 'excelente',
            'ruim': 'péssimo',
            'grande': 'enorme',
            'pequeno': 'minúsculo',
            'importante': 'fundamental'
          };
          return alternatives[word as keyof typeof alternatives] || match[0];
        },
        explanation: 'Considere usar um adjetivo mais específico.',
        category: 'Estilo',
        confidence: 0.6
      }
    ];

    const englishRules = [
      {
        pattern: /\bvery\s+(good|bad|big|small|important)\b/gi,
        suggestion: (match: RegExpMatchArray) => {
          const word = match[1].toLowerCase();
          const alternatives = {
            'good': 'excellent',
            'bad': 'terrible',
            'big': 'enormous',
            'small': 'tiny',
            'important': 'crucial'
          };
          return alternatives[word as keyof typeof alternatives] || match[0];
        },
        explanation: 'Consider using a more specific adjective.',
        category: 'Style',
        confidence: 0.6
      }
    ];

    return language === 'pt-BR' ? portugueseRules : englishRules;
  }

  private static findClarityIssues(text: string): WritingSuggestion[] {
    const issues: WritingSuggestion[] = [];
    let issueId = 0;

    // Long sentences
    const sentences = text.split(/[.!?]+/);
    sentences.forEach((sentence, index) => {
      const words = sentence.trim().split(/\s+/).length;
      if (words > 25) {
        const start = text.indexOf(sentence);
        if (start !== -1) {
          issues.push({
            id: `clarity-${issueId++}`,
            type: 'clarity',
            severity: 'warning',
            range: { start, end: start + sentence.length },
            original: sentence.trim(),
            suggestion: 'Considere dividir em frases menores',
            explanation: 'Frases longas podem ser difíceis de entender.',
            category: 'Clareza',
            confidence: 0.7
          });
        }
      }
    });

    // Passive voice (simple detection)
    const passivePattern = /\b(foi|foram|está sendo|estão sendo|será|serão)\s+\w+/gi;
    const passiveMatches = text.matchAll(passivePattern);
    for (const match of passiveMatches) {
      if (match.index !== undefined) {
        issues.push({
          id: `clarity-${issueId++}`,
          type: 'clarity',
          severity: 'suggestion',
          range: { start: match.index, end: match.index + match[0].length },
          original: match[0],
          suggestion: 'Considere usar voz ativa',
          explanation: 'A voz ativa torna o texto mais direto.',
          category: 'Clareza',
          confidence: 0.5
        });
      }
    }

    return issues;
  }

  private static analyzeTone(text: string): WritingSuggestion[] {
    const issues: WritingSuggestion[] = [];
    
    // Detect overly casual language in formal contexts
    const casualWords = /\b(tipo|né|cara|mano|galera|massa)\b/gi;
    const casualMatches = text.matchAll(casualWords);
    
    for (const match of casualMatches) {
      if (match.index !== undefined) {
        issues.push({
          id: `tone-${match.index}`,
          type: 'tone',
          severity: 'suggestion',
          range: { start: match.index, end: match.index + match[0].length },
          original: match[0],
          suggestion: 'Considere uma linguagem mais formal',
          explanation: 'Esta palavra pode ser muito casual para alguns contextos.',
          category: 'Tom',
          confidence: 0.6
        });
      }
    }

    return issues;
  }

  private static estimateSyllables(text: string): number {
    return text.toLowerCase()
      .replace(/[^a-záéíóúâêôàü]/g, '')
      .replace(/[aeiouáéíóúâêôàü]+/g, 'X').length;
  }

  private static determineTone(text: string): 'formal' | 'informal' | 'neutral' | 'friendly' | 'professional' {
    const formalIndicators = /(portanto|contudo|outrossim|destarte)/gi;
    const informalIndicators = /(né|cara|tipo|galera)/gi;
    const friendlyIndicators = /(obrigado|por favor|espero que)/gi;
    const professionalIndicators = /(análise|estratégia|implementação|desenvolvimento)/gi;

    const formalCount = (text.match(formalIndicators) || []).length;
    const informalCount = (text.match(informalIndicators) || []).length;
    const friendlyCount = (text.match(friendlyIndicators) || []).length;
    const professionalCount = (text.match(professionalIndicators) || []).length;

    if (professionalCount > 2) return 'professional';
    if (formalCount > informalCount) return 'formal';
    if (informalCount > 0) return 'informal';
    if (friendlyCount > 0) return 'friendly';
    return 'neutral';
  }

  private static determineComplexity(avgWordsPerSentence: number, avgSyllablesPerWord: number): 'simple' | 'moderate' | 'complex' {
    const complexityScore = avgWordsPerSentence * 0.5 + avgSyllablesPerWord * 2;
    
    if (complexityScore < 8) return 'simple';
    if (complexityScore < 15) return 'moderate';
    return 'complex';
  }
}

export const SmartWritingAssistant: React.FC<SmartWritingAssistantProps> = ({
  content,
  onContentChange,
  enabled = true,
  language = 'pt-BR',
  mode = 'advanced',
  className
}) => {
  const [suggestions, setSuggestions] = useState<WritingSuggestion[]>([]);
  const [stats, setStats] = useState<WritingStats | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [settings, setSettings] = useState({
    autoCorrect: true,
    realTimeAnalysis: true,
    voiceFeedback: false,
    aggressiveness: 50
  });
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Analyze content with debouncing
  const analyzeContent = useCallback((text: string) => {
    if (!enabled || !text.trim()) {
      setSuggestions([]);
      setStats(null);
      return;
    }

    setAnalyzing(true);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const { suggestions: newSuggestions, stats: newStats } = WritingAnalyzer.analyzeText(text, language);
      setSuggestions(newSuggestions);
      setStats(newStats);
      setAnalyzing(false);
    }, settings.realTimeAnalysis ? 1000 : 2000);
  }, [enabled, language, settings.realTimeAnalysis]);

  useEffect(() => {
    analyzeContent(content);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [content, analyzeContent]);

  const applySuggestion = (suggestion: WritingSuggestion) => {
    const newContent = content.slice(0, suggestion.range.start) + 
                      suggestion.suggestion + 
                      content.slice(suggestion.range.end);
    
    onContentChange(newContent);
    
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'grammar': return <CheckCircle className="h-3 w-3" />;
      case 'style': return <Palette className="h-3 w-3" />;
      case 'clarity': return <Lightbulb className="h-3 w-3" />;
      case 'tone': return <Target className="h-3 w-3" />;
      case 'vocabulary': return <BookOpen className="h-3 w-3" />;
      case 'structure': return <TrendingUp className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };

  const getColorForSeverity = (severity: string) => {
    switch (severity) {
      case 'error': return 'border-red-200 bg-red-50 text-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'suggestion': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  const getReadabilityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getReadabilityLabel = (score: number) => {
    if (score >= 80) return 'Muito Fácil';
    if (score >= 60) return 'Fácil';
    if (score >= 40) return 'Moderado';
    if (score >= 20) return 'Difícil';
    return 'Muito Difícil';
  };

  const filteredSuggestions = suggestions.filter(s => {
    const threshold = settings.aggressiveness / 100;
    return s.confidence >= threshold;
  });

  if (!enabled) {
    return null;
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
              <PenTool className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Assistente de Escrita</CardTitle>
              <p className="text-sm text-slate-500">
                {analyzing ? 'Analisando...' : `${filteredSuggestions.length} sugestões`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Configurações</h4>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Correção automática</label>
                    <Switch
                      checked={settings.autoCorrect}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, autoCorrect: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Análise em tempo real</label>
                    <Switch
                      checked={settings.realTimeAnalysis}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, realTimeAnalysis: checked }))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm">Nível de sugestões: {settings.aggressiveness}%</label>
                    <Slider
                      value={[settings.aggressiveness]}
                      onValueChange={([value]) => 
                        setSettings(prev => ({ ...prev, aggressiveness: value }))
                      }
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm">Idioma</label>
                    <Select value={language} onValueChange={() => {}}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">Português (BR)</SelectItem>
                        <SelectItem value="en-US">English (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {analyzing && (
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3 animate-spin text-blue-500" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Writing Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900">{stats.words}</div>
              <div className="text-xs text-slate-500">Palavras</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900">{stats.sentences}</div>
              <div className="text-xs text-slate-500">Frases</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900">{stats.readingTime}min</div>
              <div className="text-xs text-slate-500">Leitura</div>
            </div>
            <div className="text-center">
              <div className={cn("text-lg font-bold", getReadabilityColor(stats.readabilityScore))}>
                {stats.readabilityScore}
              </div>
              <div className="text-xs text-slate-500">
                {getReadabilityLabel(stats.readabilityScore)}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {filteredSuggestions.length === 0 && !analyzing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Texto perfeito! Nenhuma sugestão no momento.</p>
              </motion.div>
            ) : (
              filteredSuggestions.slice(0, 10).map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm",
                    getColorForSeverity(suggestion.severity),
                    selectedSuggestionId === suggestion.id && "ring-2 ring-blue-400"
                  )}
                  onClick={() => setSelectedSuggestionId(
                    selectedSuggestionId === suggestion.id ? null : suggestion.id
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIconForType(suggestion.type)}
                      <span className="text-xs font-medium">{suggestion.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(suggestion.confidence * 100)}%
                      </Badge>
                    </div>
                    
                    <Badge variant="outline" className="text-xs">
                      {suggestion.severity}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="text-red-600 line-through">{suggestion.original}</span>
                      <ArrowRight className="inline h-3 w-3 mx-1" />
                      <span className="text-green-600 font-medium">{suggestion.suggestion}</span>
                    </div>
                    
                    <p className="text-xs text-slate-600">{suggestion.explanation}</p>
                  </div>

                  <AnimatePresence>
                    {selectedSuggestionId === suggestion.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissSuggestion(suggestion.id);
                          }}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Ignorar
                        </Button>
                        
                        <Button
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            applySuggestion(suggestion);
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aplicar
                        </Button>

                        {suggestion.alternatives && (
                          <div className="ml-auto flex gap-1">
                            {suggestion.alternatives.slice(0, 2).map((alt, i) => (
                              <Button
                                key={i}
                                size="sm"
                                variant="outline"
                                className="h-6 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  applySuggestion({ ...suggestion, suggestion: alt });
                                }}
                              >
                                {alt}
                              </Button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}; 