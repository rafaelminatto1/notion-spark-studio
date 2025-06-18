import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Clock, BookmarkPlus, X, ChevronDown, Calendar, FileText, Folder, Database, Tag, User, FileCheck } from 'lucide-react';
import type { SemanticSearchConfig} from '../../hooks/useSemanticSearch';
import { useSemanticSearch, SemanticSearchFilters } from '../../hooks/useSemanticSearch';
import type { FileItem } from '../../types/FileItem';
import type { DatabaseItem } from '../../types/DatabaseItem';

interface SemanticSearchBarProps {
  items: (FileItem | DatabaseItem)[];
  onSelectResult?: (item: FileItem | DatabaseItem) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({
  items,
  onSelectResult,
  placeholder = "Buscar documentos, pastas e bancos de dados...",
  className = "",
  autoFocus = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState<'basic' | 'advanced'>('basic');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    config,
    setConfig,
    results,
    facets,
    suggestions,
    isSearching,
    totalResults,
    searchTime,
    search,
    clearSearch,
    addFilter,
    removeFilter,
    recentSearches,
    saveSearch,
    savedSearches
  } = useSemanticSearch(items);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Buscar ao digitar
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.trim()) {
        search();
      }
    }, 300);

    return () => { clearTimeout(delayedSearch); };
  }, [query, search]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowFilters(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
  };

  const handleResultClick = (item: FileItem | DatabaseItem) => {
    onSelectResult?.(item);
    setIsOpen(false);
    setQuery('');
  };

  const handleSearchTypeChange = (type: SemanticSearchConfig['type']) => {
    setConfig({ type });
  };

  const handleSortingChange = (sorting: SemanticSearchConfig['sorting']) => {
    setConfig({ sorting });
  };

  const getItemIcon = (item: FileItem | DatabaseItem) => {
    switch (item.type) {
      case 'file':
        return <FileText className="w-4 h-4" />;
      case 'folder':
        return <Folder className="w-4 h-4" />;
      case 'database':
        return <Database className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatSearchTime = (time: number) => {
    return time < 1000 ? `${Math.round(time)}ms` : `${(time / 1000).toFixed(2)}s`;
  };

  const FilterSection = () => (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
    >
      <div className="p-4">
        {/* Tabs de Filtros */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => { setActiveFilterTab('basic'); }}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilterTab === 'basic'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Básico
          </button>
          <button
            onClick={() => { setActiveFilterTab('advanced'); }}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeFilterTab === 'advanced'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Avançado
          </button>
        </div>

        {activeFilterTab === 'basic' && (
          <div className="space-y-3">
            {/* Tipo de Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Busca
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {(['fuzzy', 'exact', 'semantic', 'regex'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => { handleSearchTypeChange(type); }}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      config.type === type
                        ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {type === 'fuzzy' && 'Inteligente'}
                    {type === 'exact' && 'Exata'}
                    {type === 'semantic' && 'Semântica'}
                    {type === 'regex' && 'Regex'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ordenação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ordenar por
              </label>
              <select
                value={config.sorting}
                onChange={(e) => { handleSortingChange(e.target.value as any); }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="relevance">Relevância</option>
                <option value="recent">Mais recente</option>
                <option value="alphabetical">Alfabética</option>
                <option value="size">Tamanho</option>
                <option value="connections">Conexões</option>
              </select>
            </div>
          </div>
        )}

        {activeFilterTab === 'advanced' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtros por Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipos de Arquivo
              </label>
              <div className="space-y-2">
                {(['file', 'folder', 'database'] as const).map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={config.filters.fileType?.includes(type) || false}
                      onChange={(e) => {
                        const currentTypes = config.filters.fileType || [];
                        if (e.target.checked) {
                          addFilter('fileType', [...currentTypes, type]);
                        } else {
                          addFilter('fileType', currentTypes.filter(t => t !== type));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {type === 'file' && 'Arquivos'}
                      {type === 'folder' && 'Pastas'}
                      {type === 'database' && 'Bancos de Dados'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Intervalo de Datas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={config.filters.dateRange?.from?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const from = e.target.value ? new Date(e.target.value) : undefined;
                    addFilter('dateRange', {
                      from,
                      to: config.filters.dateRange?.to || new Date()
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  placeholder="Data inicial"
                />
                <input
                  type="date"
                  value={config.filters.dateRange?.to?.toISOString().split('T')[0] || ''}
                  onChange={(e) => {
                    const to = e.target.value ? new Date(e.target.value) : undefined;
                    addFilter('dateRange', {
                      from: config.filters.dateRange?.from || new Date('2020-01-01'),
                      to
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                  placeholder="Data final"
                />
              </div>
            </div>
          </div>
        )}

        {/* Opções Adicionais */}
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.highlighting}
                onChange={(e) => { setConfig({ highlighting: e.target.checked }); }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Destacar termos</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.suggestions}
                onChange={(e) => { setConfig({ suggestions: e.target.checked }); }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Sugestões</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={config.facets}
                onChange={(e) => { setConfig({ facets: e.target.checked }); }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Facetas</span>
            </label>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Barra de Busca */}
      <div className="relative">
        <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
          <Search className="w-5 h-5 text-gray-400 ml-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => { setIsOpen(true); }}
            placeholder={placeholder}
            className="flex-1 px-3 py-3 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          />
          
          {/* Controles da direita */}
          <div className="flex items-center space-x-2 pr-3">
            {query && (
              <button
                onClick={clearSearch}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => { setShowFilters(!showFilters); }}
              className={`p-1 transition-colors ${
                showFilters 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>

            {query && (
              <button
                onClick={() => { saveSearch(query); }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Salvar busca"
              >
                <BookmarkPlus className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Indicador de busca */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Painel de Filtros */}
      <AnimatePresence>
        {showFilters && <FilterSection />}
      </AnimatePresence>

      {/* Dropdown de Resultados */}
      <AnimatePresence>
        {isOpen && (query || recentSearches.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden"
          >
            {/* Estatísticas de Busca */}
            {query && totalResults > 0 && (
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 text-sm text-gray-600 dark:text-gray-400">
                {totalResults} resultado{totalResults !== 1 ? 's' : ''} em {formatSearchTime(searchTime)}
              </div>
            )}

            <div className="max-h-80 overflow-y-auto">
              {/* Sugestões */}
              {query && suggestions.length > 0 && (
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Sugestões</div>
                  <div className="flex flex-wrap gap-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => { setQuery(suggestion); }}
                        className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resultados */}
              {results.length > 0 ? (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={`${result.item.id}-${index}`}
                      onClick={() => { handleResultClick(result.item); }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400 dark:text-gray-500">
                          {getItemIcon(result.item)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {result.item.title}
                          </div>
                          {result.item.content && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                              {result.item.content.substring(0, 100)}...
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(result.item.lastModified).toLocaleDateString()}
                            </span>
                            {result.score > 0 && (
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                {Math.round(result.score * 100)}% relevância
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Nenhum resultado encontrado
                </div>
              ) : (
                /* Buscas Recentes */
                recentSearches.length > 0 && (
                  <div className="py-2">
                    <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      Buscas Recentes
                    </div>
                    {recentSearches.slice(0, 5).map((recentQuery, index) => (
                      <button
                        key={index}
                        onClick={() => { setQuery(recentQuery); }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                          <span className="text-gray-700 dark:text-gray-300">{recentQuery}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}

              {/* Facetas */}
              {config.facets && facets.length > 0 && query && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Filtrar por</div>
                  {facets.map((facet) => (
                    <div key={facet.key} className="mb-3 last:mb-0">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {facet.label}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {facet.values.slice(0, 5).map((value) => (
                          <button
                            key={value.value}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              value.selected
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                          >
                            {value.value} ({value.count})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};