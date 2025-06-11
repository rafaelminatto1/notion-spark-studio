import React, { useState, useMemo, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { NotebooksPanel } from '@/components/NotebooksPanel';
import { NotesListPanel } from '@/components/NotesListPanel';
import { NoteEditorPanel } from '@/components/NoteEditorPanel';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';
import { usePermissions } from './permissions/PermissionsEngine';
import LiveCursors from './collaboration/LiveCursors';
import PresenceAwareness from './collaboration/PresenceAwareness';
import OperationalTransform, { type ConflictInfo } from './collaboration/OperationalTransform';
import ConflictResolver, { type ConflictResolution } from './collaboration/ConflictResolver';
import ThreadedComments, { type Comment, type CommentThread } from './collaboration/ThreadedComments';

interface EvernoteLayoutProps {
  isMobile?: boolean;
}

export const EvernoteLayout: React.FC<EvernoteLayoutProps> = ({
  isMobile = false
}) => {
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  
  // Estados para colaboração
  const [showCollaboration, setShowCollaboration] = useState(true);
  const [activeConflicts, setActiveConflicts] = useState<ConflictInfo[]>([]);
  const [commentThreads, setCommentThreads] = useState<CommentThread[]>([]);
  const [showComments, setShowComments] = useState(false);
  
  const {
    files,
    getCurrentFile,
    updateFile,
    createFile,
    deleteFile,
    favorites,
    toggleFavorite,
    navigateTo,
  } = useFileSystemContext();

  const { checkPermission, state } = usePermissions();
  
  // Fallback seguro para currentUser
  const currentUserId = state.currentUser?.id || 'default-user';
  
  // Helper functions for permission checks
  const canAccessNotebook = useCallback((notebookId: string) => {
    return checkPermission(currentUserId, notebookId, 'read');
  }, [checkPermission, currentUserId]);
  
  const canEditNotebook = useCallback((notebookId: string) => {
    return checkPermission(currentUserId, notebookId, 'update');
  }, [checkPermission, currentUserId]);
  
  const canCreateNote = useCallback((notebookId: string) => {
    return checkPermission(currentUserId, notebookId, 'create');
  }, [checkPermission, currentUserId]);

  // Filtrar apenas notebooks (folders) com permissão de acesso
  const notebooks = useMemo(() => 
    files
      .filter(file => file.type === 'folder')
      .filter(notebook => canAccessNotebook(notebook.id)),
    [files, canAccessNotebook]
  );
  
  // Obter notas do notebook selecionado com permissão de visualização
  const notesInSelectedNotebook = useMemo(() => 
    selectedNotebook 
      ? files
          .filter(file => file.parentId === selectedNotebook && file.type === 'file')
          .filter(note => checkPermission(currentUserId, note.id, 'read'))
      : [],
    [files, selectedNotebook, checkPermission, currentUserId]
  );

  const currentFile = selectedNote ? files.find(f => f.id === selectedNote) : null;

  const handleNotebookSelect = (notebookId: string) => {
    setSelectedNotebook(notebookId);
    setSelectedNote(null); // Clear selected note when changing notebook
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNote(noteId);
    navigateTo(noteId);
  };

  const handleCreateNote = async (notebookId?: string) => {
    const targetNotebook = notebookId || selectedNotebook;
    
    // Verificar se tem permissão para criar nota no notebook
    if (targetNotebook && !canCreateNote(targetNotebook)) {
      console.warn('Permissão negada para criar nota neste notebook');
      return;
    }
    
    const newNoteId = await createFile(
      'Nova Nota',
      targetNotebook || undefined,
      'file'
    );
    if (newNoteId) {
      setSelectedNote(newNoteId);
      if (notebookId) {
        setSelectedNotebook(notebookId);
      }
    }
  };

  const handleCreateNotebook = async () => {
    // Verificar se tem permissão para criar notebooks
    if (!checkPermission(currentUserId, 'workspace', 'create')) {
      console.warn('Permissão negada para criar notebooks');
      return;
    }
    
    const newNotebookId = await createFile('Novo Notebook', undefined, 'folder');
    if (newNotebookId) {
      setSelectedNotebook(newNotebookId);
    }
  };

  // Handlers para colaboração
  const handleContentChange = useCallback((content: string, operation: any) => {
    if (currentFile) {
      updateFile(currentFile.id, { content });
    }
  }, [currentFile, updateFile]);

  const handleConflictDetected = useCallback((conflict: ConflictInfo) => {
    setActiveConflicts(prev => [...prev, conflict]);
  }, []);

  const handleConflictResolved = useCallback((conflictId: string, resolution: string) => {
    setActiveConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, []);

  const handleResolveConflict = useCallback((resolution: ConflictResolution) => {
    // Aplicar resolução
    if (currentFile) {
      updateFile(currentFile.id, { content: resolution.mergedContent });
    }
    setActiveConflicts(prev => prev.filter(c => c.id !== resolution.conflictId));
  }, [currentFile, updateFile]);

  // Handlers para comentários
  const handleAddComment = useCallback((content: string, parentId?: string, mentions?: string[], position?: any) => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      content,
      authorId: currentUserId,
      authorName: 'Usuário Atual', // TODO: Integrar com sistema de usuários
      timestamp: new Date(),
      mentions: mentions || [],
      reactions: {},
      attachments: [],
      isPinned: false,
      isResolved: false,
      position,
      metadata: {
        deviceType: 'desktop',
        edited: false,
        readBy: [currentUserId]
      }
    };

    if (parentId) {
      // Adicionar como resposta a um thread existente
      setCommentThreads(prev => prev.map(thread => {
        const rootComment = thread.comments.find(c => c.id === thread.rootCommentId);
        if (rootComment?.id === parentId || thread.comments.some(c => c.id === parentId)) {
          return {
            ...thread,
            comments: [...thread.comments, { ...newComment, parentId: thread.rootCommentId }]
          };
        }
        return thread;
      }));
    } else {
      // Criar novo thread
      const newThread: CommentThread = {
        id: `thread-${Date.now()}`,
        rootCommentId: newComment.id,
        comments: [newComment],
        participantIds: [currentUserId],
        isResolved: false,
        position: position || { line: 1, column: 1 }
      };
      setCommentThreads(prev => [...prev, newThread]);
    }
  }, [currentUserId, state.currentUser]);

  const handleEditComment = useCallback((commentId: string, content: string) => {
    setCommentThreads(prev => prev.map(thread => ({
      ...thread,
      comments: thread.comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, content, edited: new Date(), metadata: { ...comment.metadata, edited: true }}
          : comment
      )
    })));
  }, []);

  const handleDeleteComment = useCallback((commentId: string) => {
    setCommentThreads(prev => prev.map(thread => ({
      ...thread,
      comments: thread.comments.filter(comment => comment.id !== commentId)
    })).filter(thread => thread.comments.length > 0));
  }, []);

  const handleReactToComment = useCallback((commentId: string, emoji: string) => {
    setCommentThreads(prev => prev.map(thread => ({
      ...thread,
      comments: thread.comments.map(comment => {
        if (comment.id === commentId) {
          const reactions = { ...comment.reactions };
          if (!reactions[emoji]) reactions[emoji] = [];
          
          if (reactions[emoji].includes(currentUserId)) {
            reactions[emoji] = reactions[emoji].filter(id => id !== currentUserId);
            if (reactions[emoji].length === 0) delete reactions[emoji];
          } else {
            reactions[emoji].push(currentUserId);
          }
          
          return { ...comment, reactions };
        }
        return comment;
      })
    })));
  }, [currentUserId]);

  const handleResolveThread = useCallback((threadId: string) => {
    setCommentThreads(prev => prev.map(thread => 
      thread.id === threadId 
        ? { ...thread, isResolved: true, resolvedBy: currentUserId, resolvedAt: new Date() }
        : thread
    ));
  }, [currentUserId]);

  const handlePinComment = useCallback((commentId: string) => {
    setCommentThreads(prev => prev.map(thread => ({
      ...thread,
      comments: thread.comments.map(comment => 
        comment.id === commentId 
          ? { ...comment, isPinned: !comment.isPinned }
          : comment
      )
    })));
  }, []);

  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Mobile: Stack vertically with navigation */}
        <div className="flex-1 p-2">
          <NotebooksPanel
            notebooks={notebooks}
            selectedNotebook={selectedNotebook}
            onNotebookSelect={handleNotebookSelect}
            onCreateNotebook={handleCreateNotebook}
            onCreateNote={handleCreateNote}
            isMobile={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Sidebar esquerda - Notebooks */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          className="bg-gray-50 border-r border-gray-200"
        >
          <NotebooksPanel
            notebooks={notebooks}
            selectedNotebook={selectedNotebook}
            onNotebookSelect={handleNotebookSelect}
            onCreateNotebook={handleCreateNotebook}
            onCreateNote={handleCreateNote}
            isMobile={false}
          />
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

        {/* Painel central - Lista de Notas */}
        <ResizablePanel
          defaultSize={30}
          minSize={20}
          maxSize={50}
          className="bg-white border-r border-gray-200"
        >
          <NotesListPanel
            notes={notesInSelectedNotebook}
            selectedNote={selectedNote}
            selectedNotebook={selectedNotebook}
            onNoteSelect={handleNoteSelect}
            onCreateNote={() => handleCreateNote(selectedNotebook || undefined)}
            onDeleteNote={deleteFile}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />

        {/* Painel direita - Editor com colaboração */}
        <ResizablePanel
          defaultSize={showComments ? 40 : 50}
          minSize={30}
          className="bg-white relative"
        >
          <div className="h-full flex flex-col">
            {/* Controles de colaboração */}
            <div className="border-b border-gray-200 p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showCollaboration && currentFile && (
                    <PresenceAwareness 
                      documentId={currentFile.id}
                      currentUser={{
                        id: currentUserId,
                        name: 'Usuário Atual',
                        email: 'usuario@exemplo.com',
                        avatar: '',
                        color: '#3B82F6'
                      }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowComments(!showComments)}
                    className={cn(
                      "px-3 py-1 text-sm border rounded transition-colors",
                      showComments 
                        ? "bg-blue-500 text-white border-blue-500" 
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    )}
                  >
                    Comentários ({commentThreads.length})
                  </button>
                  <button
                    onClick={() => setShowCollaboration(!showCollaboration)}
                    className={cn(
                      "px-3 py-1 text-sm border rounded transition-colors",
                      showCollaboration 
                        ? "bg-green-500 text-white border-green-500" 
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                    )}
                  >
                    Colaboração
                  </button>
                </div>
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 relative">
              <NoteEditorPanel
                note={currentFile}
                onUpdateNote={updateFile}
                onToggleFavorite={toggleFavorite}
                isFavorite={currentFile ? favorites.includes(currentFile.id) : false}
              />

              {/* Componentes de colaboração */}
              {showCollaboration && currentFile && (
                <>
                  <LiveCursors 
                    currentUser={{
                      id: currentUserId,
                      name: 'Usuário Atual',
                      email: 'usuario@exemplo.com',
                      avatar: '',
                      color: '#3B82F6'
                    }}
                    documentId={currentFile.id}
                  />
                  <OperationalTransform
                    documentId={currentFile.id}
                    initialContent={currentFile.content || ''}
                    currentUserId={currentUserId}
                    onContentChange={handleContentChange}
                    onConflictDetected={handleConflictDetected}
                    onConflictResolved={handleConflictResolved}
                  />
                </>
              )}

              {/* Resolver conflitos */}
              {activeConflicts.length > 0 && (
                <ConflictResolver
                  conflicts={activeConflicts}
                  originalContent={currentFile?.content || ''}
                  currentUserId={currentUserId}
                  onResolveConflict={handleResolveConflict}
                  onDismissConflict={(conflictId) => 
                    setActiveConflicts(prev => prev.filter(c => c.id !== conflictId))
                  }
                />
              )}
            </div>
          </div>
        </ResizablePanel>

        {/* Painel de comentários (condicional) */}
        {showComments && (
          <>
            <ResizableHandle className="w-1 bg-gray-200 hover:bg-gray-300 transition-colors" />
            <ResizablePanel
              defaultSize={30}
              minSize={20}
              maxSize={40}
              className="bg-gray-50 border-l border-gray-200"
            >
              <div className="h-full p-4">
                <ThreadedComments
                  threads={commentThreads}
                  currentUserId={currentUserId}
                  currentUserName="Usuário Atual"
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                  onReactToComment={handleReactToComment}
                  onResolveThread={handleResolveThread}
                  onPinComment={handlePinComment}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}; 