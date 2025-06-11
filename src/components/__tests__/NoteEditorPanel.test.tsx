import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NoteEditorPanel } from '../NoteEditorPanel';
import { FileItem } from '@/types';

// Mock dos componentes UI
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => 
    <button onClick={onClick} {...props}>{children}</button>
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ onChange, onKeyDown, onBlur, value, ...props }: any) => 
    <input 
      onChange={onChange} 
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      value={value}
      {...props} 
    />
}));

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ onChange, value, ...props }: any) => 
    <textarea onChange={onChange} value={value} {...props} />
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, onClick }: any) => 
    <span onClick={onClick} data-testid="tag-badge">{children}</span>
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => 
    <div onClick={onClick}>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <div data-testid="separator" />,
}));

const mockNote: FileItem = {
  id: 'note-1',
  name: 'Nota de Teste',
  type: 'file',
  content: 'Conteúdo inicial da nota',
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-02T15:30:00Z',
  tags: ['teste', 'unitário'],
  parentId: 'notebook-1'
};

const defaultProps = {
  note: mockNote,
  onUpdateNote: vi.fn(),
  onToggleFavorite: vi.fn(),
  isFavorite: false
};

describe('NoteEditorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza corretamente com uma nota', () => {
    render(<NoteEditorPanel {...defaultProps} />);
    
    expect(screen.getByText('Nota de Teste')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Conteúdo inicial da nota')).toBeInTheDocument();
  });

  it('mostra estado vazio quando não há nota selecionada', () => {
    render(<NoteEditorPanel {...defaultProps} note={null} />);
    
    expect(screen.getByText('Selecione uma nota para editar')).toBeInTheDocument();
    expect(screen.getByText('Escolha uma nota da lista ou crie uma nova')).toBeInTheDocument();
  });

  it('permite edição do título', async () => {
    const user = userEvent.setup();
    render(<NoteEditorPanel {...defaultProps} />);
    
    const titleElement = screen.getByText('Nota de Teste');
    await user.click(titleElement);
    
    const titleInput = screen.getByDisplayValue('Nota de Teste');
    await user.clear(titleInput);
    await user.type(titleInput, 'Novo Título');
    
    fireEvent.blur(titleInput);
    
    expect(defaultProps.onUpdateNote).toHaveBeenCalledWith('note-1', {
      name: 'Novo Título'
    });
  });

  it('auto-salva conteúdo após delay', async () => {
    const user = userEvent.setup();
    render(<NoteEditorPanel {...defaultProps} />);
    
    const contentTextarea = screen.getByDisplayValue('Conteúdo inicial da nota');
    await user.clear(contentTextarea);
    await user.type(contentTextarea, 'Novo conteúdo');
    
    // Avança o timer para triggerar auto-save
    vi.advanceTimersByTime(1100);
    
    await waitFor(() => {
      expect(defaultProps.onUpdateNote).toHaveBeenCalledWith('note-1', 
        expect.objectContaining({
          content: 'Novo conteúdo',
          updatedAt: expect.any(String)
        })
      );
    });
  });

  it('insere formatação markdown corretamente', async () => {
    const user = userEvent.setup();
    
    // Mock para document.querySelector
    const mockTextarea = {
      selectionStart: 0,
      selectionEnd: 6,
      focus: vi.fn(),
      setSelectionRange: vi.fn()
    };
    
    vi.spyOn(document, 'querySelector').mockReturnValue(mockTextarea as any);
    
    render(<NoteEditorPanel {...defaultProps} />);
    
    // Simula seleção de texto e clique no botão de negrito
    const boldButton = screen.getByTitle('Negrito (Ctrl+B)');
    await user.click(boldButton);
    
    // Verifica se a formatação foi aplicada
    expect(screen.getByDisplayValue(/\*\*.*\*\*/)).toBeInTheDocument();
  });

  it('alterna estado de favorito', async () => {
    const user = userEvent.setup();
    render(<NoteEditorPanel {...defaultProps} />);
    
    const favoriteButton = screen.getByRole('button', { name: /star/i });
    await user.click(favoriteButton);
    
    expect(defaultProps.onToggleFavorite).toHaveBeenCalledWith('note-1');
  });

  it('adiciona nova tag', async () => {
    const user = userEvent.setup();
    render(<NoteEditorPanel {...defaultProps} />);
    
    const tagInput = screen.getByPlaceholderText('Adicionar tag...');
    await user.type(tagInput, 'nova-tag');
    
    const addButton = screen.getByText('Adicionar');
    await user.click(addButton);
    
    expect(defaultProps.onUpdateNote).toHaveBeenCalledWith('note-1', {
      tags: ['teste', 'unitário', 'nova-tag']
    });
  });

  it('remove tag existente', async () => {
    const user = userEvent.setup();
    render(<NoteEditorPanel {...defaultProps} />);
    
    const tagBadge = screen.getByText('teste ×');
    await user.click(tagBadge);
    
    expect(defaultProps.onUpdateNote).toHaveBeenCalledWith('note-1', {
      tags: ['unitário']
    });
  });

  it('mostra preview do conteúdo markdown', async () => {
    const user = userEvent.setup();
    const noteWithMarkdown = {
      ...mockNote,
      content: '**texto em negrito** e *texto em itálico*'
    };
    
    render(<NoteEditorPanel {...defaultProps} note={noteWithMarkdown} />);
    
    const previewButton = screen.getByText('Preview');
    await user.click(previewButton);
    
    // Verifica se o markdown foi renderizado como HTML
    expect(screen.getByText(/texto em negrito/)).toBeInTheDocument();
  });

  it('exibe informações de metadata', () => {
    render(<NoteEditorPanel {...defaultProps} />);
    
    expect(screen.getByText(/Criado em/)).toBeInTheDocument();
    expect(screen.getByText(/Modificado em/)).toBeInTheDocument();
  });

  it('mostra indicador de auto-save', async () => {
    const user = userEvent.setup();
    render(<NoteEditorPanel {...defaultProps} />);
    
    const contentTextarea = screen.getByDisplayValue('Conteúdo inicial da nota');
    await user.type(contentTextarea, ' novo texto');
    
    // Avança timer um pouco
    vi.advanceTimersByTime(500);
    
    // Depois avança para completar o auto-save
    vi.advanceTimersByTime(600);
    
    await waitFor(() => {
      expect(screen.getByText('Salvando...')).toBeInTheDocument();
    });
  });

  it('permite cancelar edição do título com Escape', async () => {
    const user = userEvent.setup();
    render(<NoteEditorPanel {...defaultProps} />);
    
    const titleElement = screen.getByText('Nota de Teste');
    await user.click(titleElement);
    
    const titleInput = screen.getByDisplayValue('Nota de Teste');
    await user.clear(titleInput);
    await user.type(titleInput, 'Título Temporário');
    
    fireEvent.keyDown(titleInput, { key: 'Escape' });
    
    expect(screen.getByText('Nota de Teste')).toBeInTheDocument();
    expect(defaultProps.onUpdateNote).not.toHaveBeenCalled();
  });

  it('salva título ao pressionar Enter', async () => {
    const user = userEvent.setup();
    render(<NoteEditorPanel {...defaultProps} />);
    
    const titleElement = screen.getByText('Nota de Teste');
    await user.click(titleElement);
    
    const titleInput = screen.getByDisplayValue('Nota de Teste');
    await user.clear(titleInput);
    await user.type(titleInput, 'Novo Título');
    
    fireEvent.keyDown(titleInput, { key: 'Enter' });
    
    expect(defaultProps.onUpdateNote).toHaveBeenCalledWith('note-1', {
      name: 'Novo Título'
    });
  });
}); 