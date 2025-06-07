import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileText, Tag, MessageCircle, Star, ArrowLeft, ArrowRight, Type, Database as DatabaseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/TagInput';
import { Backlinks } from '@/components/Backlinks';
import { CommentsPanel } from '@/components/CommentsPanel';
import { BlockEditor } from '@/components/BlockEditor';
import { AdvancedEditor } from '@/components/AdvancedEditor';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { DatabaseView } from '@/components/database/DatabaseView';
import { FavoritesManager } from '@/components/FavoritesManager';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { FileItem, Comment, Block } from '@/types';
import { useComments } from '@/hooks/useComments';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { parseLinks } from '@/utils/linkParser';

interface EditorProps {
  file: FileItem | undefined;
  files: FileItem[];
  favorites: string[];
  onUpdateFile: (id: string, updates: Partial<FileItem>) => void;
  onNavigateToFile: (fileId: string) => void;
  onCreateFile: (name: string) => void;
  onToggleFavorite: (fileId: string) => void;
  onGoBack?: () => void;
  onGoForward?: () => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  file,
  files,
  favorites,
  onUpdateFile,
  onNavigateToFile,
  onCreateFile,
  onToggleFavorite,
  onGoBack,
  onGoForward,
  canGoBack,
  canGoForward
}) => {
  const [showComments, setShowComments] = useState(false);
  const [useBlockEditor, setUseBlockEditor] = useState(false);
  const [useMarkdownEditor, setUseMarkdownEditor] = useState(false);
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

  const handleBlocksChange = useCallback((blocks: Block[]) => {
    if (file) {
      // Convert blocks to content string for compatibility and store blocks
      const content = blocks.map(block => {
        switch (block.type) {
          case 'heading':
            const level = block.properties?.level || 1;
            return `${'#'.repeat(level)} ${block.content}`;
          case 'list':
            return `- ${block.content}`;
          case 'code':
            return `\`\`\`\n${block.content}\n\`\`\``;
          case 'quote':
            return `> ${block.content}`;
          case 'callout':
            return `> **${block.properties?.type || 'info'}**: ${block.content}`;
          default:
            return block.content;
        }
      }).join('\n\n');
      
      onUpdateFile(file.id, { 
        content,
        blocks: blocks // Store blocks data for future editing
      });
    }
  }, [file, onUpdateFile]);

  const contentToBlocks = (content: string, existingBlocks?: Block[]): Block[] => {
    // If we have existing blocks, use them
    if (existingBlocks && existingBlocks.length > 0) {
      return existingBlocks;
    }

    // Otherwise, parse from content
    if (!content) return [{
      id: 'default',
      type: 'text',
      content: '',
      properties: {}
    }];
    
    const lines = content.split('\n').filter(line => line.trim());
    const blocks: Block[] = [];
    
    lines.forEach((line, index) => {
      if (line.startsWith('### ')) {
        blocks.push({
          id: `block-${index}`,
          type: 'heading',
          content: line.slice(4),
          properties: { level: 3 }
        });
      } else if (line.startsWith('## ')) {
        blocks.push({
          id: `block-${index}`,
          type: 'heading',
          content: line.slice(3),
          properties: { level: 2 }
        });
      } else if (line.startsWith('# ')) {
        blocks.push({
          id: `block-${index}`,
          type: 'heading',
          content: line.slice(2),
          properties: { level: 1 }
        });
      } else if (line.startsWith('- ')) {
        blocks.push({
          id: `block-${index}`,
          type: 'list',
          content: line.slice(2),
          properties: {}
        });
      } else if (line.startsWith('> **')) {
        // Parse callout
        const match = line.match(/^> \*\*(\w+)\*\*: (.+)$/);
        if (match) {
          blocks.push({
            id: `block-${index}`,
            type: 'callout',
            content: match[2],
            properties: { type: match[1].toLowerCase() }
          });
        }
      } else if (line.startsWith('> ')) {
        blocks.push({
          id: `block-${index}`,
          type: 'quote',
          content: line.slice(2),
          properties: {}
        });
      } else if (line.trim()) {
        blocks.push({
          id: `block-${index}`,
          type: 'text',
          content: line,
          properties: {}
        });
      }
    });
    
    return blocks.length > 0 ? blocks : [{
      id: 'default',
      type: 'text',
      content: '',
      properties: {}
    }];
  };

  const handleCreateFileFromName = useCallback(async (name: string): Promise<string> => {
    const fileId = await onCreateFile(name);
    // Navigate to the new file
    const newFile = files.find(f => f.name === name);
    if (newFile) {
      onNavigateToFile(newFile.id);
    }
    return fileId;
  }, [onCreateFile, onNavigateToFile, files]);

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

  // Render Database View for database files
  if (file.type === 'database' && file.database) {
    return (
      <div className="flex-1 flex flex-col bg-notion-dark">
        {/* Navigation Bar */}
        <div className="p-4 border-b border-notion-dark-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onGoBack}
                disabled={!canGoBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onGoForward}
                disabled={!canGoForward}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Breadcrumbs
                currentFile={file}
                files={files}
                onNavigate={onNavigateToFile}
              />
            </div>
          </div>
        </div>

        {/* Database Content */}
        <div className="flex-1 p-6">
          <DatabaseView
            database={file.database}
            onUpdateDatabase={(updates) => 
              onUpdateFile(file.id, { 
                database: { ...file.database!, ...updates }
              })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-notion-dark">
      {/* Navigation Bar */}
      <div className="p-4 border-b border-notion-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoBack}
              disabled={!canGoBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoForward}
              disabled={!canGoForward}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Breadcrumbs
              currentFile={file}
              files={files}
              onNavigate={onNavigateToFile}
            />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="p-6 border-b border-notion-dark-border">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-white">{file.name}</h1>
          <div className="flex items-center gap-2">
            <FavoritesManager
              fileId={file.id}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUseMarkdownEditor(!useMarkdownEditor);
                setUseBlockEditor(false);
              }}
              className={`gap-2 ${useMarkdownEditor ? 'bg-notion-purple text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Type className="h-4 w-4" />
              Markdown
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setUseBlockEditor(!useBlockEditor);
                setUseMarkdownEditor(false);
              }}
              className={`gap-2 ${useBlockEditor ? 'bg-notion-purple text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Blocos
            </Button>
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
            onTagsChange={(tags) => onUpdateFile(file.id, { tags })}
            placeholder="Adicionar tags..."
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 relative" ref={editorRef}>
        {useMarkdownEditor ? (
          <MarkdownEditor
            content={file.content || ''}
            onChange={handleContentChange}
            files={files}
            onNavigateToFile={onNavigateToFile}
            onCreateFile={handleCreateFileFromName}
            className="h-full"
          />
        ) : useBlockEditor ? (
          <BlockEditor
            blocks={contentToBlocks(file.content || '', (file as any).blocks)}
            onBlocksChange={handleBlocksChange}
          />
        ) : (
          <AdvancedEditor
            content={file.content || ''}
            onChange={handleContentChange}
            files={files}
            onNavigateToFile={onNavigateToFile}
            onCreateFile={handleCreateFileFromName}
          />
        )}

        {/* Comments Overlay */}
        {showComments && (
          <CommentsPanel
            comments={file.comments || []}
            isAddingComment={false}
            commentPosition={{ x: 0, y: 0 }}
            onAddComment={() => {}}
            onUpdateComment={() => {}}
            onDeleteComment={() => {}}
            onCancelAddingComment={() => {}}
            className="absolute inset-0 pointer-events-none"
          />
        )}
      </div>

      {/* Backlinks */}
      <div className="border-t border-notion-dark-border p-6">
        <Backlinks
          backlinks={backlinks}
          onNavigate={onNavigateToFile}
        />
      </div>
    </div>
  );
};
