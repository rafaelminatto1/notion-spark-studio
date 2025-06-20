
import React from 'react';
import { Search, Filter, X, Calendar, Tag, FileText, Folder } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// SearchFilters interface local
interface SearchFilters {
  type: string[];
  tags: string[];
  author: string[];
  category: string[];
  priority: string[];
  dateRange?: string;
  hasContent?: boolean;
}

interface AdvancedSearchPanelProps {
  query: string;
  setQuery: (query: string) => void;
  filters: SearchFilters;
  updateFilter: (key: keyof SearchFilters, value: unknown) => void;
  clearFilters: () => void;
  isAdvancedMode: boolean;
  setIsAdvancedMode: (advanced: boolean) => void;
  availableTags: string[];
  className?: string;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  query,
  setQuery,
  filters,
  updateFilter,
  clearFilters,
  isAdvancedMode,
  setIsAdvancedMode,
  availableTags,
  className
}) => {
  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateFilter('tags', newTags);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); }}
          placeholder="Buscar em notas e pastas..."
          className="pl-10 pr-12"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setIsAdvancedMode(!isAdvancedMode); }}
          className={cn(
            "absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0",
            isAdvancedMode && "bg-purple-500/20 text-purple-400"
          )}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {/* Advanced Filters */}
      {isAdvancedMode && (
        <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Filtros Avançados</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Tipo
            </label>
            <Select value={filters.type[0] || ''} onValueChange={(value) => { updateFilter('type', value); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="file">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Arquivos
                  </div>
                </SelectItem>
                <SelectItem value="folder">
                  <div className="flex items-center gap-2">
                    <Folder className="h-4 w-4" />
                    Pastas
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data de Modificação
            </label>
            <Select value={filters.dateRange} onValueChange={(value) => { updateFilter('dateRange', value); }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qualquer data</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Filter */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Apenas com conteúdo
            </label>
            <Switch
              checked={filters.hasContent}
              onCheckedChange={(checked) => { updateFilter('hasContent', checked); }}
            />
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={filters.tags?.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-purple-500/20 transition-colors"
                      onClick={() => { handleTagToggle(tag); }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
