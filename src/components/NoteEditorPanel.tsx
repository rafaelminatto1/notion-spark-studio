import React, { useState, useCallback } from 'react';
import { 
  Star, 
  Calendar, 
  Tag, 
  Share2, 
  MoreHorizontal,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Image,
  Eye,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface NoteEditorPanelProps {
  note: FileItem | null;
  onUpdateNote: (noteId: string, updates: Partial<FileItem>) => void;
  onToggleFavorite: (noteId: string) => void;
  isFavorite: boolean;
}

export const NoteEditorPanel: React.FC<NoteEditorPanelProps> = ({
  note,
  onUpdateNote,
  onToggleFavorite,
  isFavorite
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(note?.name || '');
  const [content, setContent] = useState(note?.content || '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Update local state when note changes
  React.useEffect(() => {
    if (note) {
      setTitle(note.name);
      setContent(note.content || '');
    }
  }, [note?.id]);

  const handleTitleSave = useCallback(() => {
    if (note && title.trim() !== note.name) {
      onUpdateNote(note.id, { name: title.trim() });
    }
    setIsEditingTitle(false);
  }, [note, title, onUpdateNote]);

  const handleContentSave = useCallback(() => {
    if (note && content !== note.content) {
      onUpdateNote(note.id, { content, updatedAt: new Date().toISOString() });
    }
  }, [note, content, onUpdateNote]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTitleSave();
    }
    if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setTitle(note?.name || '');
    }
  };

  const addTag = () => {
    if (note && newTag.trim()) {
      const currentTags = note.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        onUpdateNote(note.id, { 
          tags: [...currentTags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (note) {
      const currentTags = note.tags || [];
      onUpdateNote(note.id, { 
        tags: currentTags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Edit3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-500 mb-2">
            Selecione uma nota para editar
          </h3>
          <p className="text-gray-400">
            Escolha uma nota da lista ou crie uma nova
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                isFavorite && "text-yellow-500"
              )}
              onClick={() => onToggleFavorite(note.id)}
            >
              <Star className={cn(
                "h-4 w-4",
                isFavorite && "fill-current"
              )} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 w-8 p-0",
                isPreviewMode && "bg-gray-100"
              )}
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Share2 className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  Duplicar nota
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Exportar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Deletar nota
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              className="text-xl font-semibold border-none p-0 focus:ring-0 bg-transparent"
              placeholder="Título da nota..."
              autoFocus
            />
          ) : (
            <h1
              className="text-xl font-semibold text-gray-800 cursor-pointer hover:bg-gray-50 p-2 rounded"
              onClick={() => setIsEditingTitle(true)}
            >
              {note.name}
            </h1>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Criado em {formatDate(note.createdAt)}</span>
          </div>
          {note.updatedAt !== note.createdAt && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Modificado em {formatDate(note.updatedAt)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {note.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
              onClick={() => removeTag(tag)}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
              <span className="ml-1 text-blue-400 hover:text-blue-600">×</span>
            </Badge>
          ))}
          
          <div className="flex items-center gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Adicionar tag..."
              className="h-7 w-32 text-xs"
            />
            <Button
              onClick={addTag}
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
            >
              +
            </Button>
          </div>
        </div>
      </div>

      {/* Formatting Toolbar */}
      {!isPreviewMode && (
        <div className="p-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Underline className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Quote className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Code className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Link className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Image className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content Editor */}
      <div className="flex-1 overflow-hidden">
        {isPreviewMode ? (
          <div className="h-full overflow-y-auto p-6 prose prose-gray max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content || 'Conteúdo vazio...' }} />
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleContentSave}
            className="h-full w-full border-none resize-none focus:ring-0 text-sm leading-relaxed p-6"
            placeholder="Comece a escrever..."
            style={{ minHeight: '100%' }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {content.length} caracteres • {Math.ceil(content.split(' ').length)} palavras
          </span>
          <span>
            Última atualização: {formatDate(note.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}; 