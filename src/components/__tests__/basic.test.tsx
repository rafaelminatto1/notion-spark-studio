import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotesListPanel } from '../NotesListPanel';
import { NoteEditorPanel } from '../NoteEditorPanel';
import { EvernoteLayout } from '../EvernoteLayout';
import { FileItem } from '@/types';

// Mock básico dos componentes UI
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: (props: any) => <textarea {...props} />
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div />,
}));

vi.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children }: any) => <div data-testid="resizable-group">{children}</div>,
  ResizablePanel: ({ children }: any) => <div data-testid="resizable-panel">{children}</div>,
  ResizableHandle: () => <div data-testid="resizable-handle" />
}));

vi.mock('@/contexts/FileSystemContext', () => ({
  useFileSystemContext: () => ({
    files: [],
    getCurrentFile: vi.fn(),
    updateFile: vi.fn(),
    createFile: vi.fn(),
    deleteFile: vi.fn(),
    favorites: [],
    toggleFavorite: vi.fn(),
    navigateTo: vi.fn(),
  })
}));

const mockNote: FileItem = {
  id: 'test-note',
  name: 'Nota de Teste',
  type: 'file',
  content: 'Conteúdo de teste',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
  parentId: 'test-folder'
};

describe('Componentes Básicos', () => {
  it('NotesListPanel renderiza sem erro', () => {
    render(
      <NotesListPanel
        notes={[mockNote]}
        selectedNote={null}
        selectedNotebook={null}
        onNoteSelect={vi.fn()}
        onCreateNote={vi.fn()}
        onDeleteNote={vi.fn()}
        favorites={[]}
        onToggleFavorite={vi.fn()}
      />
    );
    
    expect(screen.getByText('Todas as Notas')).toBeInTheDocument();
  });

  it('NoteEditorPanel renderiza estado vazio', () => {
    render(
      <NoteEditorPanel
        note={null}
        onUpdateNote={vi.fn()}
        onToggleFavorite={vi.fn()}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('Selecione uma nota para editar')).toBeInTheDocument();
  });

  it('NoteEditorPanel renderiza com nota', () => {
    render(
      <NoteEditorPanel
        note={mockNote}
        onUpdateNote={vi.fn()}
        onToggleFavorite={vi.fn()}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('Nota de Teste')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Conteúdo de teste')).toBeInTheDocument();
  });

  it('EvernoteLayout renderiza com 3 painéis', () => {
    render(<EvernoteLayout />);
    
    expect(screen.getAllByTestId('resizable-panel')).toHaveLength(3);
    expect(screen.getByTestId('resizable-group')).toBeInTheDocument();
  });

  it('NotesListPanel mostra contador de notas', () => {
    render(
      <NotesListPanel
        notes={[mockNote]}
        selectedNote={null}
        selectedNotebook={null}
        onNoteSelect={vi.fn()}
        onCreateNote={vi.fn()}
        onDeleteNote={vi.fn()}
        favorites={[]}
        onToggleFavorite={vi.fn()}
      />
    );
    
    expect(screen.getByText('1 nota')).toBeInTheDocument();
  });
}); 