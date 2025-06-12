import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSystemIntegration } from '../useSystemIntegration';
import { useAuth } from '../useAuth';
import { useRealtime } from '../useRealtime';

// Mocks
vi.mock('../useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../useRealtime', () => ({
  useRealtime: vi.fn()
}));

describe('useSystemIntegration', () => {
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

  describe('inicialização', () => {
    it('deve inicializar com estado correto', () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve lidar com usuário não autenticado', () => {
      (useAuth as any).mockReturnValue({ user: null, loading: false });
      
      const { result } = renderHook(() => useSystemIntegration('123'));

      expect(result.current.isConnected).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });

  describe('integração com realtime', () => {
    it('deve se inscrever em eventos realtime', () => {
      renderHook(() => useSystemIntegration('123'));

      expect(mockRealtime.subscribe).toHaveBeenCalled();
    });

    it('deve se desinscrever ao desmontar', () => {
      const { unmount } = renderHook(() => useSystemIntegration('123'));
      
      unmount();

      expect(mockRealtime.unsubscribe).toHaveBeenCalled();
    });

    it('deve lidar com desconexão realtime', async () => {
      (useRealtime as any).mockReturnValue({
        ...mockRealtime,
        isConnected: false
      });

      const { result } = renderHook(() => useSystemIntegration('123'));

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('sincronização de dados', () => {
    it('deve sincronizar dados corretamente', async () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      const testData = { id: '1', content: 'test' };

      await act(async () => {
        await result.current.syncData(testData);
      });

      expect(result.current.lastSync).toBeDefined();
      expect(result.current.error).toBeNull();
    });

    it('deve lidar com erros de sincronização', async () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      mockRealtime.subscribe.mockRejectedValueOnce(new Error('Sync failed'));

      await act(async () => {
        await result.current.syncData({ id: '1', content: 'test' });
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe('gerenciamento de estado', () => {
    it('deve atualizar estado local corretamente', async () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      const newState = { data: 'test' };

      await act(async () => {
        await result.current.updateState(newState);
      });

      expect(result.current.state).toEqual(newState);
    });

    it('deve manter histórico de estados', async () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      const states = [
        { data: 'test1' },
        { data: 'test2' },
        { data: 'test3' }
      ];

      for (const state of states) {
        await act(async () => {
          await result.current.updateState(state);
        });
      }

      expect(result.current.history).toHaveLength(states.length);
    });
  });

  describe('performance', () => {
    it('deve debounce atualizações frequentes', async () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      const updatePromises = Array(5).fill(null).map(() =>
        act(async () => {
          await result.current.updateState({ data: 'test' });
        })
      );

      await Promise.all(updatePromises);

      expect(result.current.history).toHaveLength(1);
    });

    it('deve limpar histórico antigo', async () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      // Simula muitas atualizações
      for (let i = 0; i < 100; i++) {
        await act(async () => {
          await result.current.updateState({ data: `test${i}` });
        });
      }

      expect(result.current.history.length).toBeLessThanOrEqual(50);
    });
  });

  describe('tratamento de erros', () => {
    it('deve lidar com erros de rede', async () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      mockRealtime.subscribe.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        await result.current.syncData({ id: '1', content: 'test' });
      });

      expect(result.current.error).toBeDefined();
      expect(result.current.isConnected).toBe(false);
    });

    it('deve tentar reconectar automaticamente', async () => {
      const { result } = renderHook(() => useSystemIntegration('123'));

      mockRealtime.subscribe
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({});

      await act(async () => {
        await result.current.syncData({ id: '1', content: 'test' });
      });

      expect(mockRealtime.subscribe).toHaveBeenCalledTimes(2);
    });
  });
}); 