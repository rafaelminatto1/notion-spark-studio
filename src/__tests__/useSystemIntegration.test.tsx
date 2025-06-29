
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSystemIntegration } from '../hooks/useSystemIntegration';

// Mock das dependências complexas
vi.mock('../services/WebSocketService', () => ({
  createWebSocketService: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    send: vi.fn(),
    on: vi.fn(),
    joinDocument: vi.fn(),
    leaveDocument: vi.fn(),
    sendContentChange: vi.fn()
  }))
}));

vi.mock('../hooks/useServiceWorker', () => ({
  useServiceWorker: () => ({
    isOfflineCapable: () => true,
    syncDocuments: vi.fn(),
    cacheDocument: vi.fn(),
    updateServiceWorker: vi.fn()
  })
}));

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    getCurrentUserId: () => 'test-user',
    getCurrentUser: () => ({ name: 'Test User' })
  })
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('useSystemIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve inicializar corretamente', () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    expect(result.current).toBeDefined();
    expect(typeof result.current.initializeSystem).toBe('function');
    expect(typeof result.current.toggleFeature).toBe('function');
    expect(result.current.status).toBeDefined();
    expect(result.current.features).toBeDefined();
  });

  it('deve inicializar o sistema', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    await act(async () => {
      await result.current.initializeSystem();
    });
    
    expect(result.current.status.ai.isEnabled).toBe(true);
  });
});
