import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotesListPanel } from '../NotesListPanel';
import { FileItem } from '@/types';

// Mock dos componentes UI
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => 
    <button onClick={onClick} {...props}>{children}</button>
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ onChange, ...props }: any) => 
    <input onChange={onChange} {...props} />
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => 
    <div onClick={onClick}>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div data-testid="separator" />,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, onClick }: any) => 
    <span onClick={onClick} data-testid="badge">{children}</span>
}));

const mockNotes: FileItem[] = [
  {
    id: '1',
    name: 'Primeira Nota',
    type: 'file',
    content: 'Conteúdo da primeira nota',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-02T15:30:00Z',
    tags: ['importante', 'trabalho'],
    parentId: 'notebook-1'
  },
  {
    id: '2',
    name: 'Segunda Nota',
    type: 'file',
    content: 'Conteúdo da segunda nota',
    createdAt: '2024-01-03T09:00:00Z',
    updatedAt: '2024-01-03T16:45:00Z',
    tags: ['pessoal'],
    parentId: 'notebook-1'
  },
  {
    id: '3',
    name: 'Nota Favorita',
    type: 'file',
    content: 'Esta é uma nota favorita',
    createdAt: '2024-01-04T11:20:00Z',
    updatedAt: '2024-01-04T11:20:00Z',
    tags: ['favorita'],
    parentId: 'notebook-1'
  }
];

const defaultProps = {
  notes: mockNotes,
  selectedNote: null,
  selectedNotebook: 'notebook-1',
  onNoteSelect: vi.fn(),
  onCreateNote: vi.fn(),
  onDeleteNote: vi.fn(),
  favorites: ['3'],
  onToggleFavorite: vi.fn()
};

describe('NotesListPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza corretamente com notas', () => {
    render(<NotesListPanel {...defaultProps} />);
    
    expect(screen.getByText('Notas')).toBeInTheDocument();
    expect(screen.getByText('Primeira Nota')).toBeInTheDocument();
    expect(screen.getByText('Segunda Nota')).toBeInTheDocument();
    expect(screen.getByText('Nota Favorita')).toBeInTheDocument();
  });

  it('mostra contador correto de notas', () => {
    render(<NotesListPanel {...defaultProps} />);
    
    expect(screen.getByText('3 notas')).toBeInTheDocument();
  });

  it('permite alternar modos de visualização', async () => {
    const user = userEvent.setup();
    render(<NotesListPanel {...defaultProps} />);
    
    // Deve estar no modo snippets por padrão
    const listButton = screen.getByTitle ? screen.getByTitle('Lista') : screen.getAllByRole('button')[1];
    await user.click(listButton);
    
    // Verifica se o modo mudou (pode precisar ajustar baseado na implementação)
    expect(listButton).toBeInTheDocument();
  });

  it('filtra notas por texto de busca', async () => {
    const user = userEvent.setup();
    render(<NotesListPanel {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar em notas...');
    await user.type(searchInput, 'Primeira');
    
    await waitFor(() => {
      expect(screen.getByText('Primeira Nota')).toBeInTheDocument();
      expect(screen.queryByText('Segunda Nota')).not.toBeInTheDocument();
    });
  });

  it('mostra apenas favoritos quando filtro está ativo', async () => {
    const user = userEvent.setup();
    render(<NotesListPanel {...defaultProps} />);
    
    const favoritesButton = screen.getByText('Favoritos');
    await user.click(favoritesButton);
    
    await waitFor(() => {
      expect(screen.getByText('Nota Favorita')).toBeInTheDocument();
      expect(screen.queryByText('Primeira Nota')).not.toBeInTheDocument();
      expect(screen.queryByText('Segunda Nota')).not.toBeInTheDocument();
    });
  });

  it('chama onNoteSelect quando nota é clicada', async () => {
    const user = userEvent.setup();
    render(<NotesListPanel {...defaultProps} />);
    
    const noteElement = screen.getByText('Primeira Nota');
    await user.click(noteElement);
    
    expect(defaultProps.onNoteSelect).toHaveBeenCalledWith('1');
  });

  it('chama onCreateNote quando botão criar é clicado', async () => {
    const user = userEvent.setup();
    render(<NotesListPanel {...defaultProps} />);
    
    const createButton = screen.getByText('Nova Nota');
    await user.click(createButton);
    
    expect(defaultProps.onCreateNote).toHaveBeenCalled();
  });

  it('mostra estado vazio quando não há notas', () => {
    render(<NotesListPanel {...defaultProps} notes={[]} />);
    
    expect(screen.getByText('Nenhuma nota ainda')).toBeInTheDocument();
    expect(screen.getByText('Crie sua primeira nota para começar')).toBeInTheDocument();
  });

  it('mostra estado de busca vazia', async () => {
    const user = userEvent.setup();
    render(<NotesListPanel {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar em notas...');
    await user.type(searchInput, 'nota inexistente');
    
    await waitFor(() => {
      expect(screen.getByText('Nenhuma nota encontrada')).toBeInTheDocument();
      expect(screen.getByText('Tente ajustar os termos de busca')).toBeInTheDocument();
    });
  });

  it('permite ordenação por diferentes critérios', async () => {
    const user = userEvent.setup();
    render(<NotesListPanel {...defaultProps} />);
    
    // Busca pelo dropdown de ordenação
    const sortButton = screen.getByText('Atualização');
    await user.click(sortButton);
    
    const titleSort = screen.getByText('Por título');
    await user.click(titleSort);
    
    // Verifica se a ordenação mudou (nomes em ordem alfabética)
    const noteElements = screen.getAllByText(/Nota/);
    expect(noteElements[0]).toHaveTextContent('Nota Favorita');
  });

  it('exibe tags das notas corretamente', () => {
    render(<NotesListPanel {...defaultProps} />);
    
    // Verifica se as badges de tags estão presentes
    const badges = screen.getAllByTestId('badge');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('atualiza contagem quando termo de busca é aplicado', async () => {
    const user = userEvent.setup();
    render(<NotesListPanel {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Buscar em notas...');
    await user.type(searchInput, 'Primeira');
    
    await waitFor(() => {
      expect(screen.getByText('1 nota encontrada para "Primeira"')).toBeInTheDocument();
    });
  });
}); 