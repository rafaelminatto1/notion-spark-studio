
import React, { useState, useCallback, useRef } from 'react';
import { FileText, Tag, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/TagInput';
import { CommentsPanel } from '@/components/CommentsPanel';
import { FileItem, Comment } from '@/types';
import { useComments } from '@/hooks/useComments';
import { parseLinks } from '@/utils/linkParser';

interface EditorProps {
  file: FileItem | undefined;
  files: FileItem[];
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string) => void;
}

export const Editor: React.FC<EditorProps> = ({
  file,
  files,
  onUpdateFile,
  onNavigateToFile,
  onCreateFile
}) => {
  const [showComments, setShowComments] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const {
    isAddingComment,
    commentPosition,
    addComment,
    updateComment,
    deleteComment,
    startAddingComment,
    cancelAddingComment
  } = useComments(file?.id || null, file?.comments || []);

  const handleContentChange = useCallback((content: string) => {
    if (file) {
      onUpdateFile(file.id, { content });
    }
  }, [file, onUpdateFile]);

  const handleTagsChange = useCallback((tags: string[]) => {
    if (file) {
      onUpdateFile(file.id, { tags });
    }
  }, [file, onUpdateFile]);

  const handleAddComment = useCallback((content: string) => {
    if (!file) return;

    const newComment = addComment(
      content,
      'editor-content',
      commentPosition.x,
      commentPosition.y
    );

    if (newComment) {
      const updatedComments = [...(file.comments || []), newComment];
      onUpdateFile(file.id, { comments: updatedComments });
    }

    cancelAddingComment();
  }, [file, addComment, commentPosition, onUpdateFile, cancelAddingComment]);

  const handleUpdateComment = useCallback((commentId: string, content: string) => {
    if (!file) return;

    const updatedComments = updateComment(commentId, content);
    onUpdateFile(file.id, { comments: updatedComments });
  }, [file, updateComment, onUpdateFile]);

  const handleDeleteComment = useCallback((commentId: string) => {
    if (!file) return;

    const updatedComments = deleteComment(commentId);
    onUpdateFile(file.id, { comments: updatedComments });
  }, [file, deleteComment, onUpdateFile]);

  const handleEditorClick = useCallback((e: React.MouseEvent) => {
    if (!showComments || !editorRef.current) return;

    const rect = editorRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    startAddingComment(x, y);
  }, [showComments, startAddingComment]);

  // Calculate backlinks for the current file
  const findBacklinks = (files: FileItem[], fileName: string): FileItem[] => {
    return files.filter(file => 
      file.type === 'file' && 
      file.content && 
      file.name !== fileName &&
      file.content.includes(`[[${fileName}]]`)
    );
  };

  const backlinks = file ? findBacklinks(files, file.name) : [];

  // Parse links from content
  const renderLinks = () => {
    if (!file?.content) return null;
    
    const links = parseLinks(file.content);
    if (links.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Links encontrados:</h4>
        <div className="space-y-2">
          {links.map((link, index) => {
            const targetFile = files.find(f => f.name === link.target && f.type === 'file');
            const fileExists = !!targetFile;
            
            return (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (fileExists && targetFile) {
                    onNavigateToFile(targetFile.id);
                  } else {
                    onCreateFile(link.target);
                  }
                }}
                className={`inline-flex items-center gap-1 h-auto p-1 text-sm font-normal mr-2 ${
                  fileExists 
                    ? "text-blue-400 hover:text-blue-300 hover:bg-blue-400/10" 
                    : "text-red-400 hover:text-red-300 hover:bg-red-400/10"
                }`}
              >
                🔗{link.target} {!fileExists && '(criar)'}
              </Button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render backlinks
  const renderBacklinks = () => {
    if (backlinks.length === 0) {
      return (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ArrowLeft className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-300">Backlinks</h3>
          </div>
          <p className="text-xs text-gray-500">Nenhuma referência encontrada</p>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ArrowLeft className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-300">
            Backlinks ({backlinks.length})
          </h3>
        </div>
        
        <div className="space-y-2">
          {backlinks.map(backFile => (
            <Button
              key={backFile.id}
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToFile(backFile.id)}
              className="w-full justify-start gap-2 h-auto p-2 text-left hover:bg-notion-dark-hover"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {backFile.emoji && <span className="text-sm">{backFile.emoji}</span>}
                <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-300 truncate">{backFile.name}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    );
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-notion-dark text-gray-400">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selecione um arquivo para editar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-notion-dark">
      {/* Header */}
      <div className="p-6 border-b border-notion-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-white">{file.name}</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className={`text-gray-400 hover:text-white ${
                showComments ? 'bg-notion-purple text-white' : ''
              }`}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Comentários ({(file.comments || []).length})
            </Button>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-4 w-4 text-gray-400" />
          <TagInput
            tags={file.tags || []}
            onTagsChange={handleTagsChange}
            placeholder="Adicionar tags..."
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 relative" ref={editorRef}>
        <div 
          className={`relative ${showComments ? 'cursor-crosshair' : ''}`}
          onClick={handleEditorClick}
        >
          <Textarea
            value={file.content || ''}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Comece a escrever..."
            className="w-full h-96 bg-transparent border-none resize-none text-gray-200 leading-relaxed text-base focus:ring-0 focus:outline-none"
          />
          
          {/* Link Preview */}
          {renderLinks()}
        </div>

        {/* Comments Overlay */}
        {showComments && (
          <CommentsPanel
            comments={file.comments || []}
            isAddingComment={isAddingComment}
            commentPosition={commentPosition}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
            onCancelAddingComment={cancelAddingComment}
            className="absolute inset-0 pointer-events-none"
          />
        )}
      </div>

      {/* Backlinks */}
      <div className="border-t border-notion-dark-border p-6">
        {renderBacklinks()}
      </div>
    </div>
  );
};
