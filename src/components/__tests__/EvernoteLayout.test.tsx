import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EvernoteLayout } from '../EvernoteLayout';
import { FileItem } from '@/types';

// Mock do contexto do sistema de arquivos
const mockFileSystemContext = {
  files: [
    {
      id: 'notebook-1',
      name: 'Notebook de Trabalho',
      type: 'folder' as const,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z',
      parentId: undefined
    },
    {
      id: 'note-1',
      name: 'Primeira Nota',
      type: 'file' as const,
      content: 'Conteúdo da primeira nota',
      createdAt: '2024-01-01T11:00:00Z',
      updatedAt: '2024-01-02T15:30:00Z',
      parentId: 'notebook-1'
    },
    {
      id: 'note-2',
      name: 'Segunda Nota',
      type: 'file' as const,
      content: 'Conteúdo da segunda nota',
      createdAt: '2024-01-03T09:00:00Z',
      updatedAt: '2024-01-03T16:45:00Z',
      parentId: 'notebook-1'
    }
  ],
  getCurrentFile: vi.fn(),
  updateFile: vi.fn(),
  createFile: vi.fn(),
  deleteFile: vi.fn(),
  favorites: ['note-2'],
  toggleFavorite: vi.fn(),
  navigateTo: vi.fn(),
};

vi.mock('@/contexts/FileSystemContext', () => ({
  useFileSystemContext: () => mockFileSystemContext
}));

// Mock dos componentes de painel
vi.mock('../NotebooksPanel', () => ({
  NotebooksPanel: ({ onNotebookSelect, onCreateNotebook, notebooks }: any) => (
    <div data-testid="notebooks-panel">
      <div>Notebooks Panel</div>
      {notebooks.map((nb: any) => (
        <button key={nb.id} onClick={() => onNotebookSelect(nb.id)}>
          {nb.name}
        </button>
      ))}
      <button onClick={onCreateNotebook}>Criar Notebook</button>
    </div>
  )
}));

vi.mock('../NotesListPanel', () => ({
  NotesListPanel: ({ notes, onNoteSelect, onCreateNote }: any) => (
    <div data-testid="notes-list-panel">
      <div>Notes List Panel</div>
      {notes.map((note: any) => (
        <button key={note.id} onClick={() => onNoteSelect(note.id)}>
          {note.name}
        </button>
      ))}
      <button onClick={onCreateNote}>Criar Nota</button>
    </div>
  )
}));

vi.mock('../NoteEditorPanel', () => ({
  NoteEditorPanel: ({ note }: any) => (
    <div data-testid="note-editor-panel">
      <div>Note Editor Panel</div>
      {note ? <div>Editando: {note.name}</div> : <div>Nenhuma nota selecionada</div>}
    </div>
  )
}));

// Mock dos componentes de UI resizable
vi.mock('@/components/ui/resizable', () => ({
  ResizablePanelGroup: ({ children }: any) => <div data-testid="resizable-group">{children}</div>,
  ResizablePanel: ({ children }: any) => <div data-testid="resizable-panel">{children}</div>,
  ResizableHandle: () => <div data-testid="resizable-handle" />
}));

describe('EvernoteLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza layout de 3 painéis no desktop', () => {
    render(<EvernoteLayout />);
    
    expect(screen.getByTestId('notebooks-panel')).toBeInTheDocument();
    expect(screen.getByTestId('notes-list-panel')).toBeInTheDocument();
    expect(screen.getByTestId('note-editor-panel')).toBeInTheDocument();
    expect(screen.getAllByTestId('resizable-panel')).toHaveLength(3);
  });

  it('renderiza layout mobile quando isMobile é true', () => {
    render(<EvernoteLayout isMobile={true} />);
    
    expect(screen.getByTestId('notebooks-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('notes-list-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('note-editor-panel')).not.toBeInTheDocument();
  });

  it('filtra e exibe apenas notebooks (folders)', () => {
    render(<EvernoteLayout />);
    
    const notebooksPanel = screen.getByTestId('notebooks-panel');
    expect(notebooksPanel).toBeInTheDocument();
    
    // Deve mostrar apenas notebooks, não notas
    expect(screen.getByText('Notebook de Trabalho')).toBeInTheDocument();
    expect(screen.queryByText('Primeira Nota')).not.toBeInTheDocument();
  });

  it('seleciona notebook e exibe suas notas', async () => {
    const user = userEvent.setup();
    render(<EvernoteLayout />);
    
    const notebookButton = screen.getByText('Notebook de Trabalho');
    await user.click(notebookButton);
    
    // Verifica se as notas do notebook são exibidas
    expect(screen.getByText('Primeira Nota')).toBeInTheDocument();
    expect(screen.getByText('Segunda Nota')).toBeInTheDocument();
  });

  it('seleciona nota e navega para ela', async () => {
    const user = userEvent.setup();
    render(<EvernoteLayout />);
    
    // Primeiro seleciona o notebook
    const notebookButton = screen.getByText('Notebook de Trabalho');
    await user.click(notebookButton);
    
    // Depois seleciona uma nota
    const noteButton = screen.getByText('Primeira Nota');
    await user.click(noteButton);
    
    expect(mockFileSystemContext.navigateTo).toHaveBeenCalledWith('note-1');
  });

  it('cria nova nota no notebook selecionado', async () => {
    const user = userEvent.setup();
    mockFileSystemContext.createFile.mockResolvedValue('new-note-id');
    
    render(<EvernoteLayout />);
    
    // Seleciona notebook primeiro
    const notebookButton = screen.getByText('Notebook de Trabalho');
    await user.click(notebookButton);
    
    // Cria nova nota
    const createNoteButton = screen.getByText('Criar Nota');
    await user.click(createNoteButton);
    
    expect(mockFileSystemContext.createFile).toHaveBeenCalledWith(
      'Nova Nota',
      'notebook-1',
      'file'
    );
  });

  it('cria novo notebook', async () => {
    const user = userEvent.setup();
    mockFileSystemContext.createFile.mockResolvedValue('new-notebook-id');
    
    render(<EvernoteLayout />);
    
    const createNotebookButton = screen.getByText('Criar Notebook');
    await user.click(createNotebookButton);
    
    expect(mockFileSystemContext.createFile).toHaveBeenCalledWith(
      'Novo Notebook',
      undefined,
      'folder'
    );
  });

  it('limpa seleção de nota ao mudar de notebook', async () => {
    const user = userEvent.setup();
    render(<EvernoteLayout />);
    
    // Seleciona notebook e nota
    const notebookButton = screen.getByText('Notebook de Trabalho');
    await user.click(notebookButton);
    
    const noteButton = screen.getByText('Primeira Nota');
    await user.click(noteButton);
    
    // Simula mudança de notebook (clicando novamente)
    await user.click(notebookButton);
    
    // Verifica se a nota foi deselected
    expect(screen.getByText('Nenhuma nota selecionada')).toBeInTheDocument();
  });

  it('exibe handles de redimensionamento', () => {
    render(<EvernoteLayout />);
    
    const resizableHandles = screen.getAllByTestId('resizable-handle');
    expect(resizableHandles).toHaveLength(2); // Entre os 3 painéis
  });

  it('usa grupo de painéis redimensionáveis horizontalmente', () => {
    render(<EvernoteLayout />);
    
    const resizableGroup = screen.getByTestId('resizable-group');
    expect(resizableGroup).toBeInTheDocument();
  });

  it('gerencia estado de seleção corretamente', async () => {
    const user = userEvent.setup();
    render(<EvernoteLayout />);
    
    // Inicialmente nenhum notebook selecionado
    expect(screen.getByText('Nenhuma nota selecionada')).toBeInTheDocument();
    
    // Seleciona notebook
    const notebookButton = screen.getByText('Notebook de Trabalho');
    await user.click(notebookButton);
    
    // Seleciona nota
    const noteButton = screen.getByText('Segunda Nota');
    await user.click(noteButton);
    
    expect(screen.getByText('Editando: Segunda Nota')).toBeInTheDocument();
  });

  it('cria nota com notebook específico', async () => {
    const user = userEvent.setup();
    mockFileSystemContext.createFile.mockResolvedValue('new-note-id');
    
    render(<EvernoteLayout />);
    
    // Cria nota com notebook específico através do notebooks panel
    const notebooksPanel = screen.getByTestId('notebooks-panel');
    const createButton = notebooksPanel.querySelector('button:last-child');
    
    if (createButton) {
      await user.click(createButton);
    }
    
    expect(mockFileSystemContext.createFile).toHaveBeenCalledWith(
      'Novo Notebook',
      undefined,
      'folder'
    );
  });
}); 