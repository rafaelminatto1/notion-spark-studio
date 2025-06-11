import React, { useState } from 'react';
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

  // Filter and sort notes
  const filteredNotes = notes
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

  const formatDate = (date: string) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffTime = Math.abs(now.getTime() - noteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return noteDate.toLocaleDateString('pt-BR');
  };

  const getPreviewText = (content: string) => {
    if (!content) return 'Sem conteúdo...';
    const plainText = content.replace(/[#*`]/g, '').replace(/\n/g, ' ');
    return plainText.length > 120 ? plainText.substring(0, 120) + '...' : plainText;
  };

  const renderNoteItem = (note: FileItem) => {
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
          onClick={() => onNoteSelect(note.id)}
        >
          <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-800 truncate">{note.name}</span>
              {isFavorite && <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />}
            </div>
          </div>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatDate(note.updatedAt)}
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
              <DropdownMenuItem onClick={() => onToggleFavorite(note.id)}>
                <Star className="h-4 w-4 mr-2" />
                {isFavorite ? 'Remover favorito' : 'Favoritar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDeleteNote(note.id)}
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
          onClick={() => onNoteSelect(note.id)}
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
                  <DropdownMenuItem onClick={() => onToggleFavorite(note.id)}>
                    <Star className="h-4 w-4 mr-2" />
                    {isFavorite ? 'Remover favorito' : 'Favoritar'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDeleteNote(note.id)}
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
            <span className="text-xs text-gray-500">{formatDate(note.updatedAt)}</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {formatDate(note.createdAt)}
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
        onClick={() => onNoteSelect(note.id)}
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
              <DropdownMenuItem onClick={() => onToggleFavorite(note.id)}>
                <Star className="h-4 w-4 mr-2" />
                {isFavorite ? 'Remover favorito' : 'Favoritar'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDeleteNote(note.id)}
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
          <span>{formatDate(note.updatedAt)}</span>
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
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            {selectedNotebook ? 'Notas' : 'Todas as Notas'}
          </h2>
          <div className="flex items-center gap-1">
            {/* View Mode Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {viewMode === 'list' ? <List className="h-4 w-4" /> :
                   viewMode === 'cards' ? <Grid className="h-4 w-4" /> :
                   <FileText className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setViewMode('snippets')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Snippets
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('list')}>
                  <List className="h-4 w-4 mr-2" />
                  Lista
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewMode('cards')}>
                  <Grid className="h-4 w-4 mr-2" />
                  Cards
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort & Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <SortAsc className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortMode('updated')}>
                  Última atualização
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('created')}>
                  Data de criação
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortMode('title')}>
                  Título
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}>
                  <Star className="h-4 w-4 mr-2" />
                  {showFavoritesOnly ? 'Mostrar todas' : 'Apenas favoritas'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200 text-sm"
          />
        </div>

        {/* New Note Button */}
        <Button
          onClick={onCreateNote}
          className="w-full bg-green-600 hover:bg-green-700 text-white text-sm"
          size="sm"
          disabled={!selectedNotebook}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Nota
        </Button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">
              {selectedNotebook ? 'Nenhuma nota neste notebook' : 'Selecione um notebook'}
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              {selectedNotebook 
                ? 'Crie sua primeira nota para começar'
                : 'Escolha um notebook na sidebar para ver suas notas'
              }
            </p>
            {selectedNotebook && (
              <Button onClick={onCreateNote} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira nota
              </Button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'cards' && "p-4 grid grid-cols-1 gap-4"
          )}>
            {filteredNotes.map(renderNoteItem)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {filteredNotes.length} nota{filteredNotes.length !== 1 ? 's' : ''} 
          {showFavoritesOnly && ' favorita'}
          {searchTerm && ` encontrada${filteredNotes.length !== 1 ? 's' : ''}`}
        </div>
      </div>
    </div>
  );
}; 