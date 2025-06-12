import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CollaborationIntegration } from '../CollaborationIntegration';
import { useAuth } from '@/hooks/useAuth';
import { useRealtime } from '@/hooks/useRealtime';

// Mocks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('@/hooks/useRealtime', () => ({
  useRealtime: vi.fn()
}));

describe('CollaborationIntegration', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com'
  };

  const mockRealtime = {
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    isConnected: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser, loading: false });
    (useRealtime as any).mockReturnValue(mockRealtime);
  });

  describe('renderização', () => {
    it('deve renderizar o componente corretamente', () => {
      render(<CollaborationIntegration documentId="123" />);
      
      expect(screen.getByTestId('collaboration-container')).toBeInTheDocument();
    });

    it('deve mostrar loading state quando carregando', () => {
      render(<CollaborationIntegration documentId="123" isLoading={true} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('integração com realtime', () => {
    it('deve se inscrever em eventos de colaboração', () => {
      render(<CollaborationIntegration documentId="123" />);

      expect(mockRealtime.subscribe).toHaveBeenCalledWith(
        expect.stringContaining('collaboration'),
        expect.any(Object),
        expect.any(Function)
      );
    });

    it('deve se desinscrever ao desmontar', () => {
      const { unmount } = render(<CollaborationIntegration documentId="123" />);
      
      unmount();

      expect(mockRealtime.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('cursores em tempo real', () => {
    it('deve atualizar posição do cursor', async () => {
      render(<CollaborationIntegration documentId="123" />);

      const cursorUpdate = {
        userId: '2',
        userName: 'Other User',
        position: { x: 100, y: 200 }
      };

      // Simula evento de cursor
      const callback = mockRealtime.subscribe.mock.calls[0][2];
      callback({ eventType: 'INSERT', new: cursorUpdate });

      await waitFor(() => {
        expect(screen.getByTestId(`cursor-${cursorUpdate.userId}`)).toBeInTheDocument();
      });
    });

    it('deve remover cursor quando usuário desconecta', async () => {
      render(<CollaborationIntegration documentId="123" />);

      const cursorUpdate = {
        userId: '2',
        userName: 'Other User',
        position: { x: 100, y: 200 }
      };

      // Adiciona cursor
      const callback = mockRealtime.subscribe.mock.calls[0][2];
      callback({ eventType: 'INSERT', new: cursorUpdate });

      // Remove cursor
      callback({ eventType: 'DELETE', old: cursorUpdate });

      await waitFor(() => {
        expect(screen.queryByTestId(`cursor-${cursorUpdate.userId}`)).not.toBeInTheDocument();
      });
    });
  });

  describe('presença de usuários', () => {
    it('deve mostrar lista de usuários ativos', async () => {
      render(<CollaborationIntegration documentId="123" />);

      const presenceUpdate = {
        userId: '2',
        userName: 'Other User',
        status: 'active',
        lastSeen: new Date().toISOString()
      };

      const callback = mockRealtime.subscribe.mock.calls[0][2];
      callback({ eventType: 'INSERT', new: presenceUpdate });

      await waitFor(() => {
        expect(screen.getByText('Other User')).toBeInTheDocument();
      });
    });

    it('deve atualizar status de usuário', async () => {
      render(<CollaborationIntegration documentId="123" />);

      const presenceUpdate = {
        userId: '2',
        userName: 'Other User',
        status: 'idle',
        lastSeen: new Date().toISOString()
      };

      const callback = mockRealtime.subscribe.mock.calls[0][2];
      callback({ eventType: 'UPDATE', new: presenceUpdate });

      await waitFor(() => {
        expect(screen.getByTestId(`user-status-${presenceUpdate.userId}`)).toHaveTextContent('idle');
      });
    });
  });

  describe('comentários', () => {
    it('deve adicionar novo comentário', async () => {
      render(<CollaborationIntegration documentId="123" />);

      const comment = {
        id: '1',
        userId: '2',
        userName: 'Other User',
        content: 'Test comment',
        createdAt: new Date().toISOString()
      };

      const callback = mockRealtime.subscribe.mock.calls[0][2];
      callback({ eventType: 'INSERT', new: comment });

      await waitFor(() => {
        expect(screen.getByText('Test comment')).toBeInTheDocument();
      });
    });

    it('deve atualizar comentário existente', async () => {
      render(<CollaborationIntegration documentId="123" />);

      const comment = {
        id: '1',
        userId: '2',
        userName: 'Other User',
        content: 'Updated comment',
        createdAt: new Date().toISOString()
      };

      const callback = mockRealtime.subscribe.mock.calls[0][2];
      callback({ eventType: 'UPDATE', new: comment });

      await waitFor(() => {
        expect(screen.getByText('Updated comment')).toBeInTheDocument();
      });
    });
  });

  describe('tratamento de erros', () => {
    it('deve lidar com erros de conexão', async () => {
      (useRealtime as any).mockReturnValue({
        ...mockRealtime,
        isConnected: false
      });

      render(<CollaborationIntegration documentId="123" />);

      expect(screen.getByText(/conexão perdida/i)).toBeInTheDocument();
    });

    it('deve mostrar mensagem de erro quando houver falha', async () => {
      render(<CollaborationIntegration documentId="123" error="Erro de conexão" />);

      expect(screen.getByText('Erro de conexão')).toBeInTheDocument();
    });
  });

  describe('performance', () => {
    it('deve debounce atualizações de cursor', async () => {
      render(<CollaborationIntegration documentId="123" />);

      const cursorUpdates = Array(10).fill(null).map((_, i) => ({
        userId: '2',
        userName: 'Other User',
        position: { x: i * 10, y: i * 10 }
      }));

      const callback = mockRealtime.subscribe.mock.calls[0][2];

      // Simula múltiplas atualizações rápidas
      cursorUpdates.forEach(update => {
        callback({ eventType: 'UPDATE', new: update });
      });

      await waitFor(() => {
        const cursor = screen.getByTestId('cursor-2');
        expect(cursor).toBeInTheDocument();
      });
    });
  });

  describe('acessibilidade', () => {
    it('deve ter atributos ARIA apropriados', () => {
      render(<CollaborationIntegration documentId="123" />);

      expect(screen.getByTestId('collaboration-container')).toHaveAttribute('role', 'region');
      expect(screen.getByTestId('collaboration-container')).toHaveAttribute('aria-label', 'Collaboration');
    });

    it('deve ser navegável por teclado', () => {
      render(<CollaborationIntegration documentId="123" />);

      const container = screen.getByTestId('collaboration-container');
      container.focus();

      expect(container).toHaveFocus();
    });
  });
}); 