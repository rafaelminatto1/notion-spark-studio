
import React, { useState, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Code, 
  Link,
  Image,
  Video,
  Quote,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Type,
  MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileItem, Comment } from '@/types';
import { cn } from '@/lib/utils';

interface EditorProps {
  file: FileItem | undefined;
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
}

export const Editor: React.FC<EditorProps> = ({ file, onUpdateFile }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentBox, setShowCommentBox] = useState<{ x: number; y: number } | null>(null);
  const [newComment, setNewComment] = useState('');

  const handleContentChange = useCallback((content: string) => {
    if (file) {
      onUpdateFile(file.id, { content });
    }
  }, [file, onUpdateFile]);

  const addComment = useCallback((x: number, y: number) => {
    if (newComment.trim() && file) {
      const comment: Comment = {
        id: Date.now().toString(),
        content: newComment.trim(),
        author: 'Você',
        createdAt: new Date(),
        x,
        y,
        elementId: file.id
      };
      
      setComments(prev => [...prev, comment]);
      setNewComment('');
      setShowCommentBox(null);
    }
  }, [newComment, file]);

  const insertBlock = useCallback((type: string) => {
    if (!file) return;
    
    let blockContent = '';
    const currentContent = file.content || '';
    
    switch (type) {
      case 'heading1':
        blockContent = '\n# Título\n';
        break;
      case 'heading2':
        blockContent = '\n## Subtítulo\n';
        break;
      case 'heading3':
        blockContent = '\n### Seção\n';
        break;
      case 'quote':
        blockContent = '\n> Citação\n';
        break;
      case 'code':
        blockContent = '\n```\nCódigo aqui\n```\n';
        break;
      case 'list':
        blockContent = '\n- Item da lista\n';
        break;
      case 'orderedList':
        blockContent = '\n1. Item numerado\n';
        break;
      case 'image':
        blockContent = '\n![Descrição da imagem](url-da-imagem)\n';
        break;
      case 'video':
        blockContent = '\n[Video](url-do-video)\n';
        break;
    }
    
    handleContentChange(currentContent + blockContent);
  }, [file, handleContentChange]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            Selecione um arquivo para editar
          </h3>
          <p className="text-gray-400">
            Escolha um arquivo na barra lateral ou crie um novo
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-notion-dark-border p-4 bg-notion-dark">
        <div className="flex items-center gap-1 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('heading1')}
            className="hover:bg-notion-dark-hover"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('heading2')}
            className="hover:bg-notion-dark-hover"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('heading3')}
            className="hover:bg-notion-dark-hover"
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-notion-dark-border mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-notion-dark-hover"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-notion-dark-hover"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-notion-dark-hover"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('code')}
            className="hover:bg-notion-dark-hover"
          >
            <Code className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-notion-dark-border mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('list')}
            className="hover:bg-notion-dark-hover"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('orderedList')}
            className="hover:bg-notion-dark-hover"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('quote')}
            className="hover:bg-notion-dark-hover"
          >
            <Quote className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-notion-dark-border mx-2" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('image')}
            className="hover:bg-notion-dark-hover"
          >
            <Image className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertBlock('video')}
            className="hover:bg-notion-dark-hover"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-notion-dark-hover"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
        </div>
        
        {/* File Info */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="text-lg">{file.emoji || '📄'}</span>
          <span className="font-medium text-white">{file.name}</span>
          <span>•</span>
          <span>Editado {file.updatedAt.toLocaleDateString('pt-BR')}</span>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        <Textarea
          value={file.content || ''}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Comece a escrever..."
          className="w-full h-full resize-none border-0 bg-transparent text-foreground p-8 text-base leading-relaxed focus:ring-0 focus:outline-none"
          style={{ minHeight: 'calc(100vh - 200px)' }}
          onDoubleClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setShowCommentBox({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            });
          }}
        />

        {/* Comments */}
        {comments.map(comment => (
          <div
            key={comment.id}
            className="absolute bg-yellow-200 text-black p-2 rounded-md shadow-lg max-w-xs z-10"
            style={{ left: comment.x, top: comment.y }}
          >
            <div className="text-xs font-medium mb-1">{comment.author}</div>
            <div className="text-sm">{comment.content}</div>
            <div className="text-xs text-gray-600 mt-1">
              {comment.createdAt.toLocaleString('pt-BR')}
            </div>
          </div>
        ))}

        {/* Comment Input */}
        {showCommentBox && (
          <div
            className="absolute bg-white text-black p-3 rounded-md shadow-lg z-20 border"
            style={{ left: showCommentBox.x, top: showCommentBox.y }}
          >
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Adicione um comentário..."
              className="w-64 h-20 text-sm mb-2 border border-gray-300"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addComment(showCommentBox.x, showCommentBox.y)}
                className="bg-notion-purple hover:bg-notion-purple-dark"
              >
                Adicionar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCommentBox(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
