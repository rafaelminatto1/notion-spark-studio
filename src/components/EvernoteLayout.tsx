import React, { useState, useMemo, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { NotebooksPanel } from '@/components/NotebooksPanel';
import { NotesListPanel } from '@/components/NotesListPanel';
import { NoteEditorPanel } from '@/components/NoteEditorPanel';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';
import { usePermissions } from './permissions/PermissionsEngine';

interface EvernoteLayoutProps {
  isMobile?: boolean;
}

export const EvernoteLayout: React.FC<EvernoteLayoutProps> = ({
  isMobile = false
}) => {
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  
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

        {/* Painel direita - Editor */}
        <ResizablePanel
          defaultSize={50}
          minSize={30}
          className="bg-white"
        >
          <NoteEditorPanel
            note={currentFile}
            onUpdateNote={updateFile}
            onToggleFavorite={toggleFavorite}
            isFavorite={currentFile ? favorites.includes(currentFile.id) : false}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}; 