import React, { useState, useMemo, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { NotebooksPanel } from '@/components/NotebooksPanel';
import { NotesListPanel } from '@/components/NotesListPanel';
import { NoteEditorPanel } from '@/components/NoteEditorPanel';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';
import { usePermissions } from './permissions/PermissionsEngine';
import { LiveCursors } from './collaboration/LiveCursors';
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
    files = [],
    createFile,
    updateFile,
    deleteFile,
    shareFile,
    toggleFavorite,
    navigateTo,
    loading = false
  } = useFileSystemContext() || {};

  const { checkPermission, state } = usePermissions();
  
  // Fallback seguro para currentUser
  const currentUserId = state?.currentUser?.id ?? 'default-user';
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando notas...</p>
        </div>
      </div>
    );
  }


  
  // Helper functions for permission checks
  const canAccessNotebook = useCallback((notebookId: string) => {
    if (!checkPermission || !notebookId) return true; // Fallback permissivo
    return checkPermission(currentUserId, notebookId, 'read');
  }, [checkPermission, currentUserId]);
  
  const canEditNotebook = useCallback((notebookId: string) => {
    if (!checkPermission || !notebookId) return true; // Fallback permissivo
    return checkPermission(currentUserId, notebookId, 'update');
  }, [checkPermission, currentUserId]);
  
  const canCreateNote = useCallback((notebookId: string) => {
    if (!checkPermission || !notebookId) return true; // Fallback permissivo
    return checkPermission(currentUserId, notebookId, 'create');
  }, [checkPermission, currentUserId]);

  // Filtrar apenas notebooks (folders) com permissão de acesso
  const notebooks = useMemo(() => {
    if (!files || !Array.isArray(files)) return [];
    return files
      .filter(file => file?.type === 'folder')
      .filter(notebook => notebook?.id && canAccessNotebook(notebook.id));
  }, [files, canAccessNotebook]);
  
  // Obter notas do notebook selecionado com permissão de visualização
  const notesInSelectedNotebook = useMemo(() => {
    if (!selectedNotebook || !files || !Array.isArray(files)) return [];
    return files
      .filter(file => file?.parentId === selectedNotebook && file?.type === 'file')
      .filter(note => {
        if (!note?.id || !checkPermission) return true; // Fallback permissivo
        return checkPermission(currentUserId, note.id, 'read');
      });
  }, [files, selectedNotebook, checkPermission, currentUserId]);

  const currentFile = selectedNote && files ? files.find(f => f?.id === selectedNote) : null;

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
    
    console.log('[EvernoteLayout] Creating note in notebook:', targetNotebook);
    
    // MODO DESENVOLVIMENTO: Sempre permitir criação de notas
    // if (targetNotebook && !canCreateNote(targetNotebook)) {
    //   console.warn('Permissão negada para criar nota neste notebook');
    //   return;
    // }
    
    try {
      const newNoteId = await createFile(
        'Nova Nota',
        targetNotebook || undefined,
        'file'
      );
      if (newNoteId) {
        console.log('[EvernoteLayout] Note created successfully:', newNoteId);
        setSelectedNote(newNoteId);
        if (notebookId) {
          setSelectedNotebook(notebookId);
        }
      }
    } catch (error) {
      console.error('[EvernoteLayout] Erro ao criar nota:', error);
    }
  };

  const handleCreateNotebook = async () => {
    console.log('[EvernoteLayout] Creating notebook...');
    
    // MODO DESENVOLVIMENTO: Sempre permitir criação de notebooks
    // if (!checkPermission(currentUserId, 'workspace', 'create')) {
    //   console.warn('[EvernoteLayout] Permissão negada para criar notebooks');
    //   return;
    // }
    
    try {
      console.log('[EvernoteLayout] Calling createFile...');
      const newNotebookId = await createFile('Novo Notebook', undefined, 'folder');
      if (newNotebookId) {
        console.log('[EvernoteLayout] Notebook created successfully:', newNotebookId);
        // Selecionar o novo notebook criado
        setSelectedNotebook(newNotebookId);
      }
    } catch (error) {
      console.error('[EvernoteLayout] Erro ao criar notebook:', error);
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

  // Empty state check
  if (!files || files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Bem-vindo ao Notion Spark Studio!
          </h3>
          <p className="text-gray-500 mb-6">
            Comece criando seu primeiro notebook para organizar suas notas
          </p>
          <div className="space-y-3">
            <button
              onClick={handleCreateNotebook}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Primeiro Notebook
            </button>
            <button
              onClick={() => handleCreateNote()}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Criar Nota Rápida
            </button>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="h-full w-full bg-[#f7faff] dark:bg-[#181f2a] flex flex-row">
      {/* Sidebar esquerda - Notebooks */}
      <div className="hidden md:flex w-64 flex-shrink-0 h-full sticky top-0 z-20 border-r border-[#e3e8f0] dark:border-[#232b3b] bg-white dark:bg-[#1a2233]">
        <NotebooksPanel
          notebooks={notebooks}
          selectedNotebook={selectedNotebook}
          onNotebookSelect={handleNotebookSelect}
          onCreateNotebook={handleCreateNotebook}
          onCreateNote={handleCreateNote}
          isMobile={false}
        />
      </div>
      {/* Painel central - Lista de Notas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header do Editor */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#181f2a]/95 backdrop-blur-xl border-b border-[#e3e8f0] dark:border-[#232b3b]">
          {/* Aqui pode entrar o AppHeader se desejar header global */}
        </div>
        <div className="flex flex-row h-full">
          {/* Lista de Notas */}
          <div className="w-80 border-r border-[#e3e8f0] dark:border-[#232b3b] bg-[#f7faff] dark:bg-[#232b3b] h-full">
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
          </div>
          {/* Editor de Nota */}
          <div className="flex-1 flex flex-col h-full">
            <div className="flex-1 flex flex-col justify-start items-center p-0 md:p-8">
              <div className="w-full max-w-4xl">
                <NoteEditorPanel
                  note={currentFile}
                  onUpdateNote={updateFile}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={currentFile ? favorites.includes(currentFile.id) : false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 