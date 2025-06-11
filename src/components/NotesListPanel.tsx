import React, { useState, useMemo, useCallback } from 'react';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Star, 
  Calendar,
  FileText,
  Grid,
  List,
  SortAsc,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface NotesListPanelProps {
  notes: FileItem[];
  selectedNote: string | null;
  selectedNotebook: string | null;
  onNoteSelect: (noteId: string) => void;
  onCreateNote: () => void;
  onDeleteNote: (noteId: string) => void;
  favorites: string[];
  onToggleFavorite: (noteId: string) => void;
}

type ViewMode = 'list' | 'cards' | 'snippets';
type SortMode = 'updated' | 'created' | 'title' | 'size';

export const NotesListPanel: React.FC<NotesListPanelProps> = ({
  notes,
  selectedNote,
  selectedNotebook,
  onNoteSelect,
  onCreateNote,
  onDeleteNote,
  favorites,
  onToggleFavorite
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('snippets');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Memoized filtering and sorting for better performance
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        const matchesSearch = note.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             (note.content || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFavorites = !showFavoritesOnly || favorites.includes(note.id);
        return matchesSearch && matchesFavorites;
      })
      .sort((a, b) => {
        switch (sortMode) {
          case 'title':
            return a.name.localeCompare(b.name);
          case 'created':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'updated':
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          default:
            return 0;
        }
      });
  }, [notes, searchTerm, showFavoritesOnly, favorites, sortMode]);

  // Memoized callbacks for better performance
  const handleNoteSelect = useCallback((noteId: string) => {
    onNoteSelect(noteId);
  }, [onNoteSelect]);

  const handleToggleFavorite = useCallback((noteId: string) => {
    onToggleFavorite(noteId);
  }, [onToggleFavorite]);

  const handleDeleteNote = useCallback((noteId: string) => {
    onDeleteNote(noteId);
  }, [onDeleteNote]);

  // Memoized utility functions
  const formatDate = useCallback((date: string) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - noteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return noteDate.toLocaleDateString('pt-BR');
  }, []);

  const getPreviewText = useCallback((content: string) => {
    if (!content) return 'Sem conteúdo...';
    const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, ' ');
    return plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText;
  }, []);

  // Memoized render function for better performance
  const renderNoteItem = useCallback((note: FileItem) => {
    const isSelected = selectedNote === note.id;
    const isFavorite = favorites.includes(note.id);
    
    if (viewMode === 'list') {
      return (
        <div
          key={note.id}
          className={cn(
            "flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group",
            isSelected && "bg-blue-50 border-l-4 border-l-blue-500"
          )}
          onClick={() => handleNoteSelect(note.id)}
        >
          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 truncate">{note.name}</span>
              {isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />}
            </div>
          </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                {formatDate(note.updatedAt.toString())}
              </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleToggleFavorite(note.id)}>
                <Star className="h-4 w-4 mr-2" />
                {isFavorite ? 'Remover favorito' : 'Favoritar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteNote(note.id)}
                className="text-red-600"
              >
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }

    if (viewMode === 'cards') {
      return (
        <div
          key={note.id}
          className={cn(
            "p-4 border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-all group bg-white",
            isSelected && "ring-2 ring-blue-500 shadow-md"
          )}
          onClick={() => handleNoteSelect(note.id)}
        >
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">
              {note.name}
            </h3>
            <div className="flex items-center gap-1">
              {isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleToggleFavorite(note.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    {isFavorite ? 'Remover favorito' : 'Favoritar'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600"
                  >
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {getPreviewText(note.content || '')}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{formatDate(note.updatedAt.toString())}</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDate(note.createdAt.toString())}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Snippets view (default)
    return (
      <div
        key={note.id}
        className={cn(
          "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors group",
          isSelected && "bg-blue-50 border-l-4 border-l-blue-500"
        )}
        onClick={() => handleNoteSelect(note.id)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-800 truncate">
              {note.name}
            </h3>
            {isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => handleToggleFavorite(note.id)}>
                <Star className="h-4 w-4 mr-2" />
                {isFavorite ? 'Remover favorito' : 'Favoritar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDeleteNote(note.id)}
                className="text-red-600"
              >
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <p className="text-xs text-gray-600 mb-3 line-clamp-3">
          {getPreviewText(note.content || '')}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(note.updatedAt.toString())}</span>
          <div className="flex items-center gap-3">
            {note.tags && note.tags.length > 0 && (
              <span className="text-blue-600">
                {note.tags.slice(0, 2).join(', ')}
                {note.tags.length > 2 && '...'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }, [selectedNote, favorites, viewMode, handleNoteSelect, handleToggleFavorite, handleDeleteNote, getPreviewText, formatDate]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedNotebook ? 'Notas' : 'Todas as Notas'}
          </h2>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                )}
                onClick={() => setViewMode('list')}
              >
                <List className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  viewMode === 'cards' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                )}
                onClick={() => setViewMode('cards')}
              >
                <Grid className="h-3 w-3" />
              </Button>
              <Button
                variant={viewMode === 'snippets' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  viewMode === 'snippets' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                )}
                onClick={() => setViewMode('snippets')}
              >
                <FileText className="h-3 w-3" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-600" />
            </Button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar em notas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-gray-200 text-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <SortAsc className="h-3 w-3 mr-1" />
                  {sortMode === 'updated' && 'Atualização'}
                  {sortMode === 'created' && 'Criação'}
                  {sortMode === 'title' && 'Título'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuItem onClick={() => setSortMode('updated')}>
                  Por atualização
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('created')}>
                  Por criação
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('title')}>
                  Por título
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant={showFavoritesOnly ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-8 text-xs",
                showFavoritesOnly && 'bg-yellow-100 text-yellow-800 border-yellow-200'
              )}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Star className="h-3 w-3 mr-1" />
              Favoritos
            </Button>
          </div>
        </div>
      </div>

      {/* Notes Count */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs text-gray-600">
          {filteredNotes.length} nota{filteredNotes.length !== 1 ? 's' : ''}
          {searchTerm && ` encontrada${filteredNotes.length !== 1 ? 's' : ''} para "${searchTerm}"`}
        </span>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex-1 p-8 text-center text-gray-400">
            <div className="max-w-xs mx-auto space-y-3">
              <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600">
                {searchTerm ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
              </h3>
              <p className="text-xs text-gray-500">
                {searchTerm 
                  ? 'Tente ajustar os termos de busca' 
                  : 'Crie sua primeira nota para começar'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={onCreateNote}
                  className="mt-4 bg-green-600 hover:bg-green-700 text-white text-xs"
                  size="sm"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Criar Nota
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={cn(
            "p-2",
            viewMode === 'cards' && "grid grid-cols-1 gap-3",
            viewMode === 'list' && "space-y-0",
            viewMode === 'snippets' && "space-y-3"
          )}>
            {filteredNotes.map(renderNoteItem)}
          </div>
        )}
      </div>

      {/* Create Note Button */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <Button
          onClick={onCreateNote}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Nota
        </Button>
      </div>
    </div>
  );
}; 