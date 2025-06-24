import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Sparkles, Clock, TrendingUp, FileText, Tag, User, Calendar } from 'lucide-react';
import type { SearchQuery, SearchResult, SearchSuggestion } from '../../services/AdvancedSearchEngine';
import { advancedSearchEngine } from '../../services/AdvancedSearchEngine';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { DatePicker } from '../ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useDebounce } from '../../hooks/useDebounce';

interface AdvancedSearchInterfaceProps {
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

export const AdvancedSearchInterface: React.FC<AdvancedSearchInterfaceProps> = ({
  onResultSelect,
  className = '',
}) => {
  // Search state
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [totalFound, setTotalFound] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<SearchQuery['filters']>({
    type: [],
    tags: [],
    author: [],
    category: [],
    priority: [],
  });

  // Options state
  const [options, setOptions] = useState<SearchQuery['options']>({
    fuzzy: true,
    semantic: true,
    contextual: true,
    includeContent: true,
    limit: 20,
    offset: 0,
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('results');
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);

  // Debounce search text
  const debouncedSearchText = useDebounce(searchText, 300);

  // Create search query
  const searchQuery = useMemo<SearchQuery>(() => ({
    text: debouncedSearchText,
    filters,
    options,
  }), [debouncedSearchText, filters, options]);

  // Perform search
  const performSearch = useCallback(async (query: SearchQuery) => {
    if (!query.text.trim()) {
      setResults([]);
      setSuggestions([]);
      setTotalFound(0);
      setSearchTime(0);
      return;
    }

    setIsSearching(true);
    
    try {
      const searchResult = await advancedSearchEngine.search(query);
      
      setResults(searchResult.results);
      setSuggestions(searchResult.suggestions);
      setTotalFound(searchResult.analytics.totalFound);
      setSearchTime(searchResult.analytics.searchTime);
    } catch (error) {
      console.error('[AdvancedSearchInterface] Search failed:', error);
      setResults([]);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search effect
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  // Filter handlers
  const handleFilterChange = useCallback((filterType: keyof SearchQuery['filters'], value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
    setOptions(prev => ({ ...prev, offset: 0 })); // Reset pagination
  }, []);

  const handleOptionChange = useCallback((optionType: keyof SearchQuery['options'], value: any) => {
    setOptions(prev => ({
      ...prev,
      [optionType]: value,
    }));
    if (optionType !== 'offset') {
      setOptions(prev => ({ ...prev, offset: 0 })); // Reset pagination unless it's offset
    }
  }, []);

  // Result handlers
  const handleResultClick = useCallback((result: SearchResult) => {
    setSelectedResult(result);
    onResultSelect?.(result);
  }, [onResultSelect]);

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setSearchText(suggestion.text);
  }, []);

  // Load more results
  const loadMoreResults = useCallback(() => {
    setOptions(prev => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({
      type: [],
      tags: [],
      author: [],
      category: [],
      priority: [],
    });
  }, []);

  // Render search input
  const renderSearchInput = () => (
    <div className="relative mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search documents, notes, templates..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10 pr-20 h-12 text-lg"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-muted-foreground"
          >
            <Filter className="w-4 h-4" />
          </Button>
          {options.semantic && (
            <Badge variant="secondary" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              AI
            </Badge>
          )}
        </div>
      </div>
      
      {/* Search stats */}
      {(totalFound > 0 || searchTime > 0) && (
        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
          <span>
            {totalFound > 0 ? `${totalFound} results found` : 'No results'}
            {searchTime > 0 && ` in ${searchTime.toFixed(0)}ms`}
          </span>
          {isSearching && (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Searching...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Render filters panel
  const renderFilters = () => (
    showFilters && (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Search Filters</CardTitle>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Document Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Document Type</label>
            <div className="flex flex-wrap gap-2">
              {['document', 'note', 'template', 'database', 'page'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={filters.type?.includes(type) || false}
                    onCheckedChange={(checked) => {
                      const newTypes = checked
                        ? [...(filters.type || []), type]
                        : (filters.type || []).filter(t => t !== type);
                      handleFilterChange('type', newTypes);
                    }}
                  />
                  <label htmlFor={`type-${type}`} className="text-sm capitalize">
                    {type}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Priority</label>
            <div className="flex flex-wrap gap-2">
              {['low', 'medium', 'high', 'critical'].map((priority) => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={filters.priority?.includes(priority) || false}
                    onCheckedChange={(checked) => {
                      const newPriorities = checked
                        ? [...(filters.priority || []), priority]
                        : (filters.priority || []).filter(p => p !== priority);
                      handleFilterChange('priority', newPriorities);
                    }}
                  />
                  <label htmlFor={`priority-${priority}`} className="text-sm capitalize">
                    {priority}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Search Options */}
          <Separator />
          <div>
            <label className="text-sm font-medium mb-2 block">Search Options</label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fuzzy-search"
                  checked={options.fuzzy}
                  onCheckedChange={(checked) => handleOptionChange('fuzzy', checked)}
                />
                <label htmlFor="fuzzy-search" className="text-sm">
                  Fuzzy matching (find similar words)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="semantic-search"
                  checked={options.semantic}
                  onCheckedChange={(checked) => handleOptionChange('semantic', checked)}
                />
                <label htmlFor="semantic-search" className="text-sm">
                  Semantic search (AI-powered understanding)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-content"
                  checked={options.includeContent}
                  onCheckedChange={(checked) => handleOptionChange('includeContent', checked)}
                />
                <label htmlFor="include-content" className="text-sm">
                  Search within content
                </label>
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Sort by</label>
              <Select
                value={options.sortBy}
                onValueChange={(value) => handleOptionChange('sortBy', value as any)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Order</label>
              <Select
                value={options.sortOrder}
                onValueChange={(value) => handleOptionChange('sortOrder', value as any)}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Desc</SelectItem>
                  <SelectItem value="asc">Asc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  );

  // Render suggestions
  const renderSuggestions = () => (
    suggestions.length > 0 && (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Suggestions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion.text}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {suggestion.type}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  );

  // Render search result
  const renderSearchResult = (result: SearchResult, index: number) => (
    <Card
      key={result.document.id}
      className={`mb-4 cursor-pointer transition-all hover:shadow-md ${
        selectedResult?.document.id === result.document.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => handleResultClick(result)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {result.highlights.title.length > 0 ? (
                <span dangerouslySetInnerHTML={{
                  __html: result.document.title.replace(
                    new RegExp(`(${result.highlights.title.join('|')})`, 'gi'),
                    '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                  )
                }} />
              ) : (
                result.document.title
              )}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <FileText className="w-3 h-3" />
              <span className="capitalize">{result.document.type}</span>
              <Separator orientation="vertical" className="h-3" />
              <User className="w-3 h-3" />
              <span>{result.document.metadata.author}</span>
              <Separator orientation="vertical" className="h-3" />
              <Clock className="w-3 h-3" />
              <span>{new Date(result.document.metadata.modifiedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                result.document.metadata.priority === 'critical' ? 'destructive' :
                result.document.metadata.priority === 'high' ? 'default' :
                result.document.metadata.priority === 'medium' ? 'secondary' : 'outline'
              }
              className="text-xs"
            >
              {result.document.metadata.priority}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {result.score.toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* Content preview with highlights */}
        {result.highlights.content.length > 0 && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground line-clamp-2">
              <span dangerouslySetInnerHTML={{
                __html: result.document.content.substring(0, 200).replace(
                  new RegExp(`(${result.highlights.content.join('|')})`, 'gi'),
                  '<mark class="bg-yellow-200 px-1 rounded">$1</mark>'
                )
              }} />
              {result.document.content.length > 200 && '...'}
            </p>
          </div>
        )}

        {/* Tags */}
        {result.document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {result.document.tags.slice(0, 5).map((tag, tagIndex) => (
              <Badge
                key={tagIndex}
                variant={result.highlights.tags.includes(tag) ? 'default' : 'secondary'}
                className="text-xs"
              >
                <Tag className="w-2 h-2 mr-1" />
                {tag}
              </Badge>
            ))}
            {result.document.tags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{result.document.tags.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Match explanation */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {result.explanation}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="capitalize">{result.context.matchType}</span>
            {result.context.relevanceFactors.length > 0 && (
              <>
                <span>•</span>
                <span>{result.context.relevanceFactors.slice(0, 2).join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`advanced-search-interface ${className}`}>
      {renderSearchInput()}
      {renderFilters()}
      {renderSuggestions()}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Results ({totalFound})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results">
          <ScrollArea className="h-[600px]">
            {results.length > 0 ? (
              <>
                {results.map((result, index) => renderSearchResult(result, index))}
                
                {/* Load more button */}
                {results.length === options.limit && (
                  <div className="text-center mt-6">
                    <Button
                      variant="outline"
                      onClick={loadMoreResults}
                      disabled={isSearching}
                    >
                      {isSearching ? 'Loading...' : 'Load More Results'}
                    </Button>
                  </div>
                )}
              </>
            ) : searchText.trim() ? (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start searching</h3>
                <p className="text-muted-foreground">
                  Enter a search term to find documents, notes, and more
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Search Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {advancedSearchEngine.getAnalytics().totalQueries}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Queries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {advancedSearchEngine.getAnalytics().averageResponseTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(advancedSearchEngine.getAnalytics().userSatisfaction * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {(advancedSearchEngine.getAnalytics().clickThroughRate * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Click Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSearchInterface; 