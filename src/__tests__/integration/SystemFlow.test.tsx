
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSystemIntegration } from '../../hooks/useSystemIntegration';

// Mock das dependências para teste de integração
vi.mock('../../services/WebSocketService', () => ({
  createWebSocketService: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    on: vi.fn(),
    joinDocument: vi.fn(),
    leaveDocument: vi.fn(),
    sendContentChange: vi.fn()
  }))
}));

vi.mock('../../hooks/useServiceWorker', () => ({
  useServiceWorker: () => ({
    isOfflineCapable: () => true,
    syncDocuments: vi.fn().mockResolvedValue(undefined),
    cacheDocument: vi.fn().mockResolvedValue(undefined)
  })
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    getCurrentUserId: () => 'test-user-123',
    getCurrentUser: () => ({ name: 'Test User', id: 'test-user-123' })
  })
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('System Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('deve inicializar sistema completo', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    expect(result.current.status).toBeDefined();
    expect(result.current.features).toBeDefined();
    
    await act(async () => {
      await result.current.initializeSystem();
    });
    
    expect(result.current.status.ai.isEnabled).toBe(true);
  });

  it('deve processar fluxo completo de AI tagging', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    await act(async () => {
      await result.current.initializeSystem();
    });
    
    const mockFile = {
      id: 'test-file-123',
      name: 'Componente React.tsx',
      content: 'import React from "react"; export const Component = () => <div>Hello</div>;',
      tags: [],
      type: 'file' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const suggestions = await act(async () => {
      return await result.current.suggestTagsForFile(mockFile);
    });
    
    expect(Array.isArray(suggestions)).toBe(true);
  });
});
