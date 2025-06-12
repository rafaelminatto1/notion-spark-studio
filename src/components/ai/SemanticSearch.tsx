import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  Clock,
  Sparkles,
  Brain,
  Target,
  FileText,
  User,
  Calendar,
  Tag,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileSystemContext } from '@/contexts/FileSystemContext';

// Tipos para busca semântica
interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'notebook' | 'comment';
  author: string;
  createdAt: Date;
  updatedAt: Date;
  relevanceScore: number;
  matchedTerms: string[];
  context: string[];
  tags: string[];
  summary: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'query' | 'filter' | 'intent';
  confidence: number;
  icon?: React.ComponentType<any>;
  category: string;
}

interface SearchFilter {
  id: string;
  label: string;
  type: 'date' | 'author' | 'type' | 'tag' | 'size';
  value: any;
  active: boolean;
}

interface SemanticSearchProps {
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
  onSearchChange?: (query: string, results: SearchResult[]) => void;
  className?: string;
}

// Hook para busca semântica com IA
const useSemanticSearch = () => {
  const { files } = useFileSystemContext();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Carregar histórico do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('search_history');
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
      
      const recent = localStorage.getItem('recent_searches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // Salvar histórico
  const saveToHistory = useCallback((query: string) => {
    if (query.trim() && !searchHistory.includes(query)) {
      const newHistory = [query, ...searchHistory].slice(0, 50); // Manter apenas 50
      setSearchHistory(newHistory);
      localStorage.setItem('search_history', JSON.stringify(newHistory));
    }

    // Adicionar às buscas recentes
    const newRecent = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem('recent_searches', JSON.stringify(newRecent));
  }, [searchHistory, recentSearches]);

  // Análise semântica de texto
  const analyzeText = useCallback((text: string, query: string) => {
    const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    const textLower = text.toLowerCase();
    
    let score = 0;
    const matchedTerms: string[] = [];
    const contexts: string[] = [];

    queryTerms.forEach(term => {
      // Busca exata
      if (textLower.includes(term)) {
        score += 10;
        matchedTerms.push(term);
        
        // Extrair contexto ao redor da palavra encontrada
        const index = textLower.indexOf(term);
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + term.length + 50);
        const context = text.substring(start, end);
        contexts.push(`...${context}...`);
      }

      // Busca por similaridade (simulada)
      const similarity = calculateSimilarity(term, textLower);
      if (similarity > 0.7) {
        score += similarity * 5;
      }
    });

    // Boost para títulos
    const title = text.split('\n')[0] || '';
    if (title.toLowerCase().includes(query.toLowerCase())) {
      score += 20;
    }

    return { score, matchedTerms, contexts };
  }, []);

  // Função de similaridade simples (Levenshtein simplificado)
  const calculateSimilarity = useCallback((a: string, b: string) => {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;
    
    // Busca por substring
    if (b.includes(a) || a.includes(b)) {
      return Math.max(a.length, b.length) / Math.min(a.length, b.length) * 0.8;
    }
    
    return 0;
  }, []);

  // Buscar com análise semântica
  const search = useCallback((query: string, filters: SearchFilter[] = []) => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const activeFilters = filters.filter(f => f.active);

    files.forEach(file => {
      const content = file.content || '';
      const { score, matchedTerms, contexts } = analyzeText(content, query);
      
      if (score > 0) {
        // Aplicar filtros
        let passesFilter = true;
        
        activeFilters.forEach(filter => {
          switch (filter.type) {
            case 'type':
              if (filter.value !== file.type) passesFilter = false;
              break;
            case 'date':
              const fileDate = new Date(file.updatedAt || file.createdAt);
              const filterDate = new Date(filter.value);
              if (fileDate < filterDate) passesFilter = false;
              break;
            case 'author':
              // Simular autor baseado no criador do arquivo
              if (filter.value !== 'current_user') passesFilter = false;
              break;
          }
        });

        if (passesFilter) {
          results.push({
            id: file.id,
            title: file.name,
            content: content,
            type: file.type === 'folder' ? 'notebook' : 'note',
            author: 'Usuário Atual',
            createdAt: new Date(file.createdAt),
            updatedAt: new Date(file.updatedAt || file.createdAt),
            relevanceScore: score,
            matchedTerms,
            context: contexts,
            tags: [], // TODO: Implementar sistema de tags
            summary: content.slice(0, 200) + (content.length > 200 ? '...' : '')
          });
        }
      }
    });

    // Ordenar por relevância
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    saveToHistory(query);
    return results.slice(0, 20); // Limitar a 20 resultados
  }, [files, analyzeText, saveToHistory]);

  // Gerar sugestões inteligentes
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];
    
    if (query.length === 0) {
      // Sugestões baseadas no histórico
      recentSearches.slice(0, 5).forEach((search, index) => {
        suggestions.push({
          id: `recent_${index}`,
          text: search,
          type: 'query',
          confidence: 0.9,
          icon: Clock,
          category: 'Recentes'
        });
      });

      // Sugestões de filtros populares
      suggestions.push(
        {
          id: 'filter_today',
          text: 'Criadas hoje',
          type: 'filter',
          confidence: 0.8,
          icon: Calendar,
          category: 'Filtros'
        },
        {
          id: 'filter_notes',
          text: 'Apenas notas',
          type: 'filter',
          confidence: 0.8,
          icon: FileText,
          category: 'Filtros'
        }
      );
    } else {
      // Sugestões baseadas na consulta atual
      const queryLower = query.toLowerCase();
      
      // Autocompletação inteligente
      const matchingFiles = files.filter(file => 
        file.name.toLowerCase().includes(queryLower) ||
        (file.content && file.content.toLowerCase().includes(queryLower))
      );

      matchingFiles.slice(0, 3).forEach((file, index) => {
        suggestions.push({
          id: `file_${file.id}`,
          text: file.name,
          type: 'query',
          confidence: 0.95,
          icon: file.type === 'folder' ? User : FileText,
          category: 'Correspondências'
        });
      });

      // Sugestões de intenção
      if (queryLower.includes('criar') || queryLower.includes('novo')) {
        suggestions.push({
          id: 'intent_create',
          text: 'Criar nova nota',
          type: 'intent',
          confidence: 0.8,
          icon: Lightbulb,
          category: 'Ações'
        });
      }

      if (queryLower.includes('projeto') || queryLower.includes('trabalho')) {
        suggestions.push({
          id: 'intent_project',
          text: 'Buscar em projetos',
          type: 'filter',
          confidence: 0.7,
          icon: Target,
          category: 'Contexto'
        });
      }
    }

    return suggestions.slice(0, 8);
  }, [recentSearches, files]);

  return {
    search,
    generateSuggestions,
    searchHistory,
    recentSearches,
    clearHistory: () => {
      setSearchHistory([]);
      setRecentSearches([]);
      localStorage.removeItem('search_history');
      localStorage.removeItem('recent_searches');
    }
  };
};

// Componente de sugestão individual
interface SearchSuggestionItemProps {
  suggestion: SearchSuggestion;
  onClick: () => void;
  isHighlighted?: boolean;
}

const SearchSuggestionItem: React.FC<SearchSuggestionItemProps> = ({ 
  suggestion, 
  onClick, 
  isHighlighted 
}) => {
  const Icon = suggestion.icon || Search;
  
  return (
    <motion.button
      whileHover={{ x: 4 }}
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors",
        isHighlighted && "bg-blue-50 border-l-2 border-blue-500"
      )}
    >
      <div className={cn(
        "p-2 rounded-lg",
        suggestion.type === 'query' ? "bg-blue-100 text-blue-600" :
        suggestion.type === 'filter' ? "bg-green-100 text-green-600" :
        "bg-purple-100 text-purple-600"
      )}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">
            {suggestion.text}
          </span>
          {suggestion.confidence > 0.9 && (
            <Sparkles className="h-3 w-3 text-yellow-500" />
          )}
        </div>
        <div className="text-xs text-gray-500">
          {suggestion.category}
        </div>
      </div>

      <ArrowRight className="h-4 w-4 text-gray-400" />
    </motion.button>
  );
};

// Componente de resultado individual
interface SearchResultItemProps {
  result: SearchResult;
  onClick: () => void;
  query: string;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ result, onClick, query }) => {
  const highlightText = (text: string, terms: string[]) => {
    if (terms.length === 0) return text;
    
    let highlighted = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
  };

  const getTypeIcon = () => {
    switch (result.type) {
      case 'note': return FileText;
      case 'notebook': return User;
      case 'comment': return MessageCircle;
      default: return FileText;
    }
  };

  const Icon = getTypeIcon();

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="w-full p-4 text-left bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 
              className="font-medium text-gray-900 truncate"
              dangerouslySetInnerHTML={{ 
                __html: highlightText(result.title, result.matchedTerms) 
              }}
            />
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3" />
              {Math.round(result.relevanceScore)}%
            </div>
          </div>
          
          <p 
            className="text-sm text-gray-600 line-clamp-2 mb-2"
            dangerouslySetInnerHTML={{ 
              __html: highlightText(result.summary, result.matchedTerms) 
            }}
          />
          
          {result.context.length > 0 && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mb-2">
              <span className="font-medium">Contexto: </span>
              {result.context[0]}
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{result.author}</span>
            <span>{result.updatedAt.toLocaleDateString('pt-BR')}</span>
          </div>
          
          {result.matchedTerms.length > 0 && (
            <div className="flex gap-1 mt-2">
              {result.matchedTerms.slice(0, 3).map((term, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                >
                  {term}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
};

// Componente principal
export const SemanticSearch: React.FC<SemanticSearchProps> = ({
  placeholder = "Busque por qualquer coisa...",
  onResultSelect,
  onSearchChange,
  className
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const { search, generateSuggestions, clearHistory } = useSemanticSearch();
  
  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return search(query, filters);
  }, [query, filters, search]);

  const suggestions = useMemo(() => {
    return generateSuggestions(query);
  }, [query, generateSuggestions]);

  const showSuggestions = query.length < 2;
  const items = showSuggestions ? suggestions : results;

  useEffect(() => {
    onSearchChange?.(query, results);
  }, [query, results, onSearchChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (showSuggestions) {
          const suggestion = suggestions[selectedIndex];
          if (suggestion.type === 'query') {
            setQuery(suggestion.text);
          }
        } else {
          const result = results[selectedIndex];
          onResultSelect?.(result);
          setIsOpen(false);
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [selectedIndex, items.length, showSuggestions, suggestions, results, onResultSelect]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === 'query') {
      setQuery(suggestion.text);
      inputRef.current?.focus();
    } else if (suggestion.type === 'filter') {
      // Implementar aplicação de filtro
      console.log('Apply filter:', suggestion);
    } else if (suggestion.type === 'intent') {
      // Implementar ações baseadas em intenção
      console.log('Execute intent:', suggestion);
    }
  }, []);

  const handleResultClick = useCallback((result: SearchResult) => {
    onResultSelect?.(result);
    setIsOpen(false);
    setQuery('');
  }, [onResultSelect]);

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />

        <div className="absolute inset-y-0 right-0 flex items-center">
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "p-2 text-gray-400 hover:text-gray-600 mr-1",
              showFilters && "text-blue-600"
            )}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search Results/Suggestions */}
      <AnimatePresence>
        {isOpen && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {showSuggestions ? (
              <div>
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Brain className="h-4 w-4" />
                    Sugestões Inteligentes
                  </div>
                </div>
                
                {suggestions.map((suggestion, index) => (
                  <SearchSuggestionItem
                    key={suggestion.id}
                    suggestion={suggestion}
                    onClick={() => handleSuggestionClick(suggestion)}
                    isHighlighted={index === selectedIndex}
                  />
                ))}
                
                {query.length === 0 && (
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={clearHistory}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Limpar histórico
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="p-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Zap className="h-4 w-4" />
                      {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-500">
                      Busca semântica ativa
                    </div>
                  </div>
                </div>
                
                <div className="p-2 space-y-2">
                  {results.map((result, index) => (
                    <SearchResultItem
                      key={result.id}
                      result={result}
                      onClick={() => handleResultClick(result)}
                      query={query}
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Filtros Avançados
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option>Todos</option>
                  <option>Notas</option>
                  <option>Notebooks</option>
                  <option>Comentários</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Data
                </label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option>Qualquer data</option>
                  <option>Hoje</option>
                  <option>Esta semana</option>
                  <option>Este mês</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Autor
                </label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option>Qualquer autor</option>
                  <option>Eu</option>
                  <option>Outros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tamanho
                </label>
                <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg">
                  <option>Qualquer tamanho</option>
                  <option>Pequeno</option>
                  <option>Médio</option>
                  <option>Grande</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SemanticSearch; 