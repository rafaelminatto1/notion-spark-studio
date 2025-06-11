import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { NotebooksPanel } from '@/components/NotebooksPanel';
import { NotesListPanel } from '@/components/NotesListPanel';
import { NoteEditorPanel } from '@/components/NoteEditorPanel';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { cn } from '@/lib/utils';
import { FileItem } from '@/types';

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

  // Filtrar apenas notebooks (folders) e notes
  const notebooks = files.filter(file => file.type === 'folder');
  const notesInSelectedNotebook = selectedNotebook 
    ? files.filter(file => file.parentId === selectedNotebook && file.type === 'file')
    : [];

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
    const newNoteId = await createFile(
      'Nova Nota',
      notebookId || selectedNotebook || undefined,
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