import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartContentSuggestions } from '../SmartContentSuggestions';
import { useAuth } from '@/hooks/useAuth';

// Mock do hook useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: '1',
      name: 'Test User',
      email: 'test@example.com'
    },
    loading: false
  }))
}));

describe('SmartContentSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('renderização', () => {
    it('deve renderizar o componente corretamente', () => {
      render(<SmartContentSuggestions documentId="123" />);
      
      expect(screen.getByRole('button', { name: /sugestões/i })).toBeInTheDocument();
    });

    it('deve mostrar loading state quando carregando', () => {
      render(<SmartContentSuggestions documentId="123" isLoading={true} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('interatividade', () => {
    it('deve abrir o painel de sugestões ao clicar no botão', async () => {
      render(<SmartContentSuggestions documentId="123" />);
      
      const button = screen.getByRole('button', { name: /sugestões/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('suggestions-panel')).toBeInTheDocument();
      });
    });

    it('deve fechar o painel ao clicar no botão novamente', async () => {
      render(<SmartContentSuggestions documentId="123" />);
      
      const button = screen.getByRole('button', { name: /sugestões/i });
      
      // Abre o painel
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByTestId('suggestions-panel')).toBeInTheDocument();
      });

      // Fecha o painel
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.queryByTestId('suggestions-panel')).not.toBeInTheDocument();
      });
    });
  });

  describe('sugestões de conteúdo', () => {
    it('deve exibir sugestões quando disponíveis', async () => {
      const mockSuggestions = [
        { id: '1', text: 'Sugestão 1', type: 'tag' },
        { id: '2', text: 'Sugestão 2', type: 'content' }
      ];

      render(
        <SmartContentSuggestions 
          documentId="123" 
          suggestions={mockSuggestions}
        />
      );

      const button = screen.getByRole('button', { name: /sugestões/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Sugestão 1')).toBeInTheDocument();
        expect(screen.getByText('Sugestão 2')).toBeInTheDocument();
      });
    });

    it('deve chamar onSuggestionClick quando uma sugestão é clicada', async () => {
      const mockOnSuggestionClick = vi.fn();
      const mockSuggestions = [
        { id: '1', text: 'Sugestão 1', type: 'tag' }
      ];

      render(
        <SmartContentSuggestions 
          documentId="123" 
          suggestions={mockSuggestions}
          onSuggestionClick={mockOnSuggestionClick}
        />
      );

      const button = screen.getByRole('button', { name: /sugestões/i });
      fireEvent.click(button);

      await waitFor(() => {
        const suggestion = screen.getByText('Sugestão 1');
        fireEvent.click(suggestion);
        expect(mockOnSuggestionClick).toHaveBeenCalledWith(mockSuggestions[0]);
      });
    });
  });

  describe('estados de erro', () => {
    it('deve exibir mensagem de erro quando houver falha', async () => {
      render(
        <SmartContentSuggestions 
          documentId="123" 
          error="Erro ao carregar sugestões"
        />
      );

      const button = screen.getByRole('button', { name: /sugestões/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar sugestões')).toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando não houver sugestões', async () => {
      render(
        <SmartContentSuggestions 
          documentId="123" 
          suggestions={[]}
        />
      );

      const button = screen.getByRole('button', { name: /sugestões/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma sugestão disponível')).toBeInTheDocument();
      });
    });
  });

  describe('performance', () => {
    it('deve debounce as chamadas de atualização', async () => {
      const mockOnUpdate = vi.fn();
      render(
        <SmartContentSuggestions 
          documentId="123" 
          onUpdate={mockOnUpdate}
        />
      );

      const button = screen.getByRole('button', { name: /sugestões/i });
      
      // Simula múltiplos cliques rápidos
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('acessibilidade', () => {
    it('deve ter atributos ARIA apropriados', () => {
      render(<SmartContentSuggestions documentId="123" />);
      
      const button = screen.getByRole('button', { name: /sugestões/i });
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-controls', 'suggestions-panel');
    });

    it('deve ser navegável por teclado', async () => {
      render(<SmartContentSuggestions documentId="123" />);
      
      const button = screen.getByRole('button', { name: /sugestões/i });
      button.focus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('suggestions-panel')).toBeInTheDocument();
      });
    });
  });
}); 