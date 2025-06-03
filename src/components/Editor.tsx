
import React, { useState, useCallback, useRef } from 'react';
import { FileText, Tag, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TagInput } from '@/components/TagInput';
import { LinkRenderer } from '@/components/LinkRenderer';
import { Backlinks } from '@/components/Backlinks';
import { CommentsPanel } from '@/components/CommentsPanel';
import { FileItem, Comment } from '@/types';
import { useComments } from '@/hooks/useComments';

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
              Comentários ({file.comments?.length || 0})
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
          <div className="mt-4 space-y-2">
            <LinkRenderer
              content={file.content || ''}
              files={files}
              onNavigateToFile={onNavigateToFile}
              onCreateFile={onCreateFile}
            />
          </div>
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
        <Backlinks
          currentFile={file}
          files={files}
          onNavigateToFile={onNavigateToFile}
        />
      </div>
    </div>
  );
};
