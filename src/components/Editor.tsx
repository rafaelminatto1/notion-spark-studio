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
  MessageCircle,
  FileText,
  Save,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileItem, Comment } from '@/types';
import { cn } from '@/lib/utils';
import { useLinks } from '@/hooks/useLinks';
import { Backlinks } from '@/components/Backlinks';
import { LinkRenderer } from '@/components/LinkRenderer';
import { parseLinks, replaceLinksWithComponents } from '@/utils/linkParser';

interface EditorProps {
  file: FileItem | undefined;
  files: FileItem[];
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string, parentId?: string) => void;
}

export const Editor: React.FC<EditorProps> = ({ 
  file, 
  files, 
  onUpdateFile, 
  onNavigateToFile,
  onCreateFile 
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showCommentBox, setShowCommentBox] = useState<{ x: number; y: number } | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [showBacklinks, setShowBacklinks] = useState(true);

  const { currentFileLinks, backlinks, getFileByName, navigateToFile } = useLinks(files, file);

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
      case 'link':
        blockContent = '\n[[Nome do Arquivo]]\n';
        break;
    }
    
    handleContentChange(currentContent + blockContent);
  }, [file, handleContentChange]);

  const handleLinkClick = useCallback((fileName: string) => {
    const fileId = navigateToFile(fileName);
    if (fileId) {
      onNavigateToFile(fileId);
    } else {
      // Arquivo não existe, perguntar se quer criar
      if (confirm(`O arquivo "${fileName}" não existe. Deseja criá-lo?`)) {
        onCreateFile(fileName);
      }
    }
  }, [navigateToFile, onNavigateToFile, onCreateFile]);

  const renderContentWithLinks = useCallback((content: string) => {
    if (!content) return content;
    
    const links = parseLinks(content);
    if (links.length === 0) return content;

    let result = [];
    let lastIndex = 0;

    links.forEach((link, index) => {
      // Adiciona o texto antes do link
      if (link.start > lastIndex) {
        result.push(content.slice(lastIndex, link.start));
      }

      // Adiciona o componente do link
      const fileExists = !!getFileByName(link.target);
      result.push(
        <LinkRenderer
          key={`link-${index}`}
          target={link.target}
          onNavigate={handleLinkClick}
          fileExists={fileExists}
          className="mx-1"
        />
      );

      lastIndex = link.end;
    });

    // Adiciona o texto restante
    if (lastIndex < content.length) {
      result.push(content.slice(lastIndex));
    }

    return result;
  }, [getFileByName, handleLinkClick]);

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-notion-dark">
        <div className="text-center space-y-6 p-8">
          <div className="w-24 h-24 mx-auto bg-notion-dark-hover rounded-2xl flex items-center justify-center">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              Selecione um arquivo para editar
            </h3>
            <p className="text-gray-400 max-w-sm">
              Escolha um arquivo na barra lateral ou crie um novo para começar a escrever
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-notion-dark overflow-hidden flex">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b border-notion-dark-border bg-notion-dark px-6 py-4">
          {/* File Info Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{file.emoji || '📄'}</span>
                <div>
                  <h1 className="font-semibold text-lg text-white">{file.name}</h1>
                  <p className="text-sm text-gray-400">
                    Editado em {file.updatedAt.toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBacklinks(!showBacklinks)}
                className={cn(
                  "hover:bg-notion-dark-hover transition-colors",
                  showBacklinks && "bg-notion-purple text-white"
                )}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Links
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPreview(!isPreview)}
                className={cn(
                  "hover:bg-notion-dark-hover transition-colors",
                  isPreview && "bg-notion-purple text-white"
                )}
              >
                <Eye className="h-4 w-4 mr-1" />
                {isPreview ? 'Editor' : 'Preview'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-notion-dark-hover text-green-400 hover:text-green-300"
              >
                <Save className="h-4 w-4 mr-1" />
                Salvo
              </Button>
            </div>
          </div>

          {/* Formatting Toolbar */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Headers */}
            <div className="flex items-center gap-1 mr-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('heading1')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Título H1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('heading2')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Subtítulo H2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('heading3')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Seção H3"
              >
                <Heading3 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="w-px h-6 bg-notion-dark-border" />
            
            {/* Text Formatting */}
            <div className="flex items-center gap-1 mx-3">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Negrito"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Itálico"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Sublinhado"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('code')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Código"
              >
                <Code className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="w-px h-6 bg-notion-dark-border" />
            
            {/* Lists and Quote */}
            <div className="flex items-center gap-1 mx-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('list')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Lista"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('orderedList')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Lista Numerada"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('quote')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Citação"
              >
                <Quote className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="w-px h-6 bg-notion-dark-border" />
            
            {/* Media */}
            <div className="flex items-center gap-1 ml-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('link')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Link Interno"
              >
                <Link className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('image')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Imagem"
              >
                <Image className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => insertBlock('video')}
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Vídeo"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-notion-dark-hover hover:text-white transition-all duration-200 text-gray-300"
                title="Comentário"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 relative bg-notion-dark">
          <div className="h-full max-w-4xl mx-auto">
            {isPreview ? (
              <div className="w-full h-full px-12 py-8 prose prose-invert max-w-none">
                <div className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                  {renderContentWithLinks(file.content || '')}
                </div>
              </div>
            ) : (
              <Textarea
                value={file.content || ''}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Comece a escrever algo incrível... Use [[Nome do Arquivo]] para criar links entre páginas."
                className="w-full h-full resize-none border-0 bg-notion-dark text-foreground px-12 py-8 text-base leading-relaxed focus:ring-0 focus:outline-none placeholder:text-gray-500"
                style={{ 
                  minHeight: 'calc(100vh - 200px)',
                  fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
                onDoubleClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setShowCommentBox({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                  });
                }}
              />
            )}
          </div>

          {/* Comments */}
          {comments.map(comment => (
            <div
              key={comment.id}
              className="absolute bg-notion-dark-hover border border-notion-dark-border text-foreground p-4 rounded-lg shadow-xl max-w-sm z-10 animate-fade-in"
              style={{ left: comment.x, top: comment.y }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-notion-purple rounded-full flex items-center justify-center text-xs font-medium text-white">
                  {comment.author[0]}
                </div>
                <div className="text-xs font-medium text-gray-300">{comment.author}</div>
              </div>
              <div className="text-sm text-white mb-2">{comment.content}</div>
              <div className="text-xs text-gray-400">
                {comment.createdAt.toLocaleString('pt-BR')}
              </div>
            </div>
          ))}

          {/* Comment Input */}
          {showCommentBox && (
            <div
              className="absolute bg-notion-dark-hover border border-notion-dark-border rounded-lg shadow-xl z-20 p-4 animate-scale-in"
              style={{ left: showCommentBox.x, top: showCommentBox.y }}
            >
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Adicione um comentário..."
                className="w-72 h-24 text-sm mb-3 bg-notion-dark border-notion-dark-border text-foreground placeholder:text-gray-500 resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => addComment(showCommentBox.x, showCommentBox.y)}
                  className="bg-notion-purple hover:bg-notion-purple-dark text-white transition-colors"
                >
                  Adicionar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCommentBox(null)}
                  className="border-notion-dark-border hover:bg-notion-dark-hover text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backlinks Sidebar */}
      {showBacklinks && (
        <div className="w-80 border-l border-notion-dark-border bg-notion-dark p-4 overflow-y-auto">
          <Backlinks
            backlinks={backlinks}
            onNavigate={onNavigateToFile}
          />
          
          {currentFileLinks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">
                Links nesta página ({currentFileLinks.length})
              </h3>
              <div className="space-y-2">
                {currentFileLinks.map((link, index) => {
                  const fileExists = !!getFileByName(link.target);
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <LinkRenderer
                        target={link.target}
                        onNavigate={handleLinkClick}
                        fileExists={fileExists}
                        className="text-xs"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
