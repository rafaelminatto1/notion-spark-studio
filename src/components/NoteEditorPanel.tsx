import React, { useState, useCallback, useEffect } from 'react';
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
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Update local state when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.name);
      setContent(note.content || '');
    }
  }, [note?.id]);

  // Auto-save functionality
  useEffect(() => {
    if (!note || content === note.content) return;

    const timeoutId = setTimeout(() => {
      setIsAutoSaving(true);
      onUpdateNote(note.id, { 
        content, 
        updatedAt: new Date().toISOString() 
      });
      setLastSaved(new Date());
      setTimeout(() => setIsAutoSaving(false), 1000);
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timeoutId);
  }, [content, note, onUpdateNote]);

  const handleTitleSave = useCallback(() => {
    if (note && title.trim() !== note.name) {
      onUpdateNote(note.id, { name: title.trim() });
    }
    setIsEditingTitle(false);
  }, [note, title, onUpdateNote]);

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

  const insertFormatting = (format: string) => {
    const textarea = document.querySelector('#note-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'texto em negrito'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'texto em itálico'}*`;
        break;
      case 'code':
        formattedText = selectedText.includes('\n') 
          ? `\`\`\`\n${selectedText || 'código'}\n\`\`\``
          : `\`${selectedText || 'código'}\``;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'citação'}`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'item da lista'}`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'texto do link'}](url)`;
        break;
      default:
        return;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + formattedText.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
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
      {/* Clean Header */}
      <div className="p-4 border-b border-gray-100">
        {/* Title */}
        <div className="mb-3">
          {isEditingTitle ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyDown}
              className="text-2xl font-bold border-none p-0 focus:ring-0 bg-transparent"
              placeholder="Título da nota..."
              autoFocus
            />
          ) : (
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
              onClick={() => setIsEditingTitle(true)}
            >
              {title || 'Sem título'}
            </h1>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>
              {isAutoSaving ? 'Salvando...' : lastSaved ? `Salvo ${lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
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
              className="h-8 w-8 p-0"
            >
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
      </div>

      {/* Formatting Toolbar */}
      {!isPreviewMode && (
        <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => insertFormatting('bold')}
              title="Negrito (Ctrl+B)"
            >
              <Bold className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => insertFormatting('italic')}
              title="Itálico (Ctrl+I)"
            >
              <Italic className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => insertFormatting('code')}
              title="Código"
            >
              <Code className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-1" />
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => insertFormatting('list')}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => insertFormatting('quote')}
              title="Citação"
            >
              <Quote className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => insertFormatting('link')}
              title="Link"
            >
              <Link className="h-4 w-4" />
            </Button>
            
            <div className="flex-1" />
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 px-3 text-xs",
                isPreviewMode && "bg-blue-100 text-blue-700"
              )}
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 p-4">
        {isPreviewMode ? (
          <div className="prose prose-sm max-w-none">
            {content ? (
              <div dangerouslySetInnerHTML={{ 
                __html: content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/`(.*?)`/g, '<code>$1</code>')
                  .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
                  .replace(/^- (.*$)/gm, '<li>$1</li>')
                  .replace(/\n/g, '<br>')
              }} />
            ) : (
              <p className="text-gray-400 text-center py-8">
                Comece a escrever para ver o preview...
              </p>
            )}
          </div>
        ) : (
          <Textarea
            id="note-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Comece a escrever..."
            className="w-full h-full resize-none border-none focus:ring-0 text-base leading-relaxed bg-transparent"
            style={{ minHeight: '400px' }}
          />
        )}
      </div>

      {/* Footer with Tags and Metadata */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        {/* Tags */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Tag className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">Tags</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            {note.tags?.map((tag) => (
              <Badge 
                key={tag} 
                variant="secondary"
                className="text-xs cursor-pointer hover:bg-red-100 hover:text-red-800"
                onClick={() => removeTag(tag)}
              >
                {tag} ×
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Adicionar tag..."
              className="text-sm"
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <Button onClick={addTag} size="sm" variant="outline">
              Adicionar
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Criado em {formatDate(note.createdAt.toString())}</span>
          <span>•</span>
          <span>Modificado em {formatDate(note.updatedAt.toString())}</span>
        </div>
      </div>
    </div>
  );
}; 