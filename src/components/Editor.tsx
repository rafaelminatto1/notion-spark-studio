import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FileText, Tag, MessageCircle, Star, ArrowLeft, ArrowRight, ArrowUpLeft, Type, Database as DatabaseIcon, Users } from 'lucide-react';
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
import { Dashboard } from '@/components/Dashboard';
import { CollaborationProvider, useCollaborationContext } from '@/components/collaboration/CollaborationProvider';
import { LiveCursors } from '@/components/collaboration/LiveCursors';
import { OperationalTransform } from '@/components/collaboration/OperationalTransform';
import { CommentsSystem } from '@/components/collaboration/CommentsSystem';
import type { FileItem, Block } from '@/types';
import { Comment } from '@/types';
import { useComments } from '@/hooks/useComments';
import { useVersionHistory } from '@/hooks/useVersionHistory';
import { useAutoSave } from '@/hooks/useAutoSave';
import { parseLinks } from '@/utils/linkParser';
import { useIsMobile } from '@/hooks/use-mobile';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';

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
  currentUserId?: string;
  currentUserName?: string;
  currentUserAvatar?: string;
  collaborationEnabled?: boolean;
}

const EditorInner: React.FC<EditorProps> = ({
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
  canGoForward,
  currentUserId = 'anonymous',
  currentUserName = 'Usuário Anônimo',
  currentUserAvatar,
  collaborationEnabled = true
}) => {
  const [localContent, setLocalContent] = useState(file?.content || '');
  const [useMarkdownEditor, setUseMarkdownEditor] = useState(false);
  const [useBlockEditor, setUseBlockEditor] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showCollaborationComments, setShowCollaborationComments] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Collaboration context
  const collaboration = useCollaborationContext();

  // Auto-save functionality
  const { forceSave } = useAutoSave({
    file,
    onUpdateFile,
    enabled: true
  });

  // Update local content when file changes
  useEffect(() => {
    if (file?.content !== localContent) {
      setLocalContent(file?.content || '');
    }
  }, [file?.content]);

  // Handle content changes with collaboration
  const handleContentChange = useCallback((newContent: string) => {
    setLocalContent(newContent);
    setIsTyping(true);
    
    // Update typing presence
    collaboration.updatePresence(true, true);
    
    // Clear typing indicator after 2 seconds of inactivity
    const typingTimeout = setTimeout(() => {
      setIsTyping(false);
      collaboration.updatePresence(false, true);
    }, 2000);

    return () => { clearTimeout(typingTimeout); };
  }, [collaboration]);

  // Handle operational transform content changes
  const handleOTContentChange = useCallback((content: string) => {
    setLocalContent(content);
    if (file) {
      onUpdateFile(file.id, { content });
    }
  }, [file, onUpdateFile]);

  // Create file from name helper
  const handleCreateFileFromName = useCallback(async (name: string) => {
    onCreateFile(name);
    return uuidv4(); // Return mock ID
  }, [onCreateFile]);

  // Blocks conversion utilities
  const parseText = (text: string): Block[] => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    return lines.map((line, index) => ({
      id: nanoid(),
      type: line.startsWith('# ') ? 'heading' as const : 
            line.startsWith('- ') ? 'list' as const : 
            'text' as const, // Usando valores válidos do BlockType
      content: line.replace(/^(# |-)/, '').trim(),
    }));
  };

  const contentToBlocks = (content: string, existingBlocks?: Block[]): Block[] => {
    if (existingBlocks && existingBlocks.length > 0) {
      return existingBlocks;
    }

    const lines = content.split('\n');
    return lines.map((line, index) => ({
      id: uuidv4(),
      type: line.startsWith('#') ? 'heading1' : 
            line.startsWith('-') || line.startsWith('*') ? 'bullet-list' :
            line.trim() === '' ? 'paragraph' : 'paragraph',
      content: line,
    }));
  };

  const handleBlocksChange = useCallback((blocks: Block[]) => {
    const content = blocks
      .map(block => block.content)
      .join('\n');
    handleContentChange(content);
  }, [handleContentChange]);

  // Backlinks finder
  const findBacklinks = (files: FileItem[], fileName: string): FileItem[] => {
    return files.filter(file => 
      file.type === 'file' && 
      file.content && 
      file.name !== fileName &&
      file.content.includes(`[[${fileName}]]`)
    );
  };

  // Available users for collaboration
  const availableUsers = [
    { id: currentUserId, name: currentUserName, avatar: currentUserAvatar },
    ...collaboration.getActiveCollaborators().map(cursor => ({
      id: cursor.userId,
      name: cursor.userName,
      avatar: cursor.userAvatar
    }))
  ];

  if (!file) {
    return (
      <div className="flex-1 bg-notion-dark">
        <Dashboard
          files={files}
          favorites={favorites}
          onNavigateToFile={onNavigateToFile}
          onCreateFile={onCreateFile}
          className="h-full"
        />
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
              { onUpdateFile(file.id, { 
                database: { ...file.database!, ...updates }
              }); }
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-notion-dark relative">
      {/* Live Cursors Overlay */}
      {collaborationEnabled && (
        <LiveCursors
          collaborators={collaboration.cursors}
          currentUserId={currentUserId}
          containerRef={editorRef}
          onCursorUpdate={collaboration.updateCursor}
          onSelectionUpdate={collaboration.updateSelection}
          className="absolute inset-0 z-30 pointer-events-none"
        />
      )}

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

          {/* Collaboration Status */}
          {collaborationEnabled && collaboration.getActiveCollaborators().length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
              <Users className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">
                {collaboration.getActiveCollaborators().length + 1} colaboradores
              </span>
            </div>
          )}
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
              onClick={() => { forceSave(); }}
              className="gap-2 text-gray-400 hover:text-white"
            >
              Salvar agora
            </Button>
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
              onClick={() => { setShowComments(!showComments); }}
              className={`text-gray-400 hover:text-white ${
                showComments ? 'bg-notion-purple text-white' : ''
              }`}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Comentários ({file.comments?.length || 0})
            </Button>
            {collaborationEnabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowCollaborationComments(!showCollaborationComments); }}
                className={`text-gray-400 hover:text-white ${
                  showCollaborationComments ? 'bg-blue-500 text-white' : ''
                }`}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Colaboração ({collaboration.comments.length})
              </Button>
            )}
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-4 w-4 text-gray-400" />
          <TagInput
            tags={file.tags || []}
            onTagsChange={(tags) => { onUpdateFile(file.id, { tags }); }}
            placeholder="Adicionar tags..."
          />
        </div>

        {/* Backlinks - Moved to top */}
        <div className="backlinks-container mt-6 pt-4 border-t border-notion-dark-border/50">
          <Backlinks
            backlinks={findBacklinks(files, file.name)}
            onNavigate={onNavigateToFile}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        <div className="flex h-full">
          {/* Main Editor */}
          <div className="flex-1 p-6 relative" ref={editorRef}>
            {collaborationEnabled ? (
              <OperationalTransform
                content={localContent}
                onChange={handleOTContentChange}
                onOperationSend={collaboration.sendOperation}
                onOperationReceive={collaboration.receiveOperation}
                userId={currentUserId}
                version={0}
                className="h-full"
              >
                {useBlockEditor ? (
                  <BlockEditor
                    blocks={contentToBlocks(localContent, (file as any).blocks)}
                    onBlocksChange={handleBlocksChange}
                    className="flex-1"
                    isMobile={isMobile}
                  />
                ) : (
                  <MarkdownEditor
                    content={localContent}
                    onChange={handleContentChange}
                    files={files}
                    onNavigateToFile={onNavigateToFile}
                    onCreateFile={handleCreateFileFromName}
                    className="flex-1"
                    isMobile={isMobile}
                  />
                )}
              </OperationalTransform>
            ) : (
              <>
                {useBlockEditor ? (
                  <BlockEditor
                    blocks={contentToBlocks(localContent, (file as any).blocks)}
                    onBlocksChange={handleBlocksChange}
                    className="flex-1"
                    isMobile={isMobile}
                  />
                ) : (
                  <MarkdownEditor
                    content={localContent}
                    onChange={handleContentChange}
                    files={files}
                    onNavigateToFile={onNavigateToFile}
                    onCreateFile={handleCreateFileFromName}
                    className="flex-1"
                    isMobile={isMobile}
                  />
                )}
              </>
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

          {/* Collaboration Comments Sidebar */}
          {collaborationEnabled && showCollaborationComments && (
            <div className="w-96 border-l border-notion-dark-border bg-notion-dark-hover/50 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Comentários Colaborativos</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowCollaborationComments(false); }}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </Button>
              </div>

              <CommentsSystem
                comments={collaboration.comments}
                currentUserId={currentUserId}
                currentUserName={currentUserName}
                currentUserAvatar={currentUserAvatar}
                documentContent={localContent}
                onAddComment={collaboration.addComment}
                onUpdateComment={collaboration.updateComment}
                onDeleteComment={collaboration.deleteComment}
                onReplyToComment={collaboration.replyToComment}
                onReactionAdd={collaboration.addReaction}
                onReactionRemove={collaboration.removeReaction}
                onMentionUser={collaboration.mentionUser}
                availableUsers={availableUsers}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Editor: React.FC<EditorProps> = (props) => {
  const { collaborationEnabled = true, file, currentUserId = 'anonymous', currentUserName = 'Usuário Anônimo', currentUserAvatar } = props;

  if (!collaborationEnabled || !file) {
    return <EditorInner {...props} />;
  }

  return (
    <CollaborationProvider
      documentId={file.id}
      userId={currentUserId}
      userName={currentUserName}
      userAvatar={currentUserAvatar}
      enabled={collaborationEnabled}
      onContentChange={(content) => {
        props.onUpdateFile(file.id, { content });
      }}
    >
      <EditorInner {...props} />
    </CollaborationProvider>
  );
};
