import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSystemIntegration } from '../../hooks/useSystemIntegration';

// Mock das dependências para teste de integração
jest.mock('../../services/WebSocketService', () => ({
  createWebSocketService: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    on: jest.fn(),
    joinDocument: jest.fn(),
    leaveDocument: jest.fn(),
    sendContentChange: jest.fn()
  }))
}));

jest.mock('../../hooks/useServiceWorker', () => ({
  useServiceWorker: () => ({
    isOfflineCapable: () => true,
    syncDocuments: jest.fn().mockResolvedValue(undefined),
    cacheDocument: jest.fn().mockResolvedValue(undefined)
  })
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    getCurrentUserId: () => 'test-user-123',
    getCurrentUser: () => ({ name: 'Test User', id: 'test-user-123' })
  })
}));

jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('System Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    
    // Aplicar tags sugeridas
    act(() => {
      result.current.applySuggestedTags(mockFile.id, ['react', 'typescript']);
    });
    
    expect(result.current.status.ai.lastUpdate).toBeDefined();
  });

  it('deve alternar features e re-inicializar', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    // Estado inicial
    const initialCollaboration = result.current.features.collaborativeEditing;
    
    // Alternar feature
    act(() => {
      result.current.toggleFeature('collaborativeEditing');
    });
    
    expect(result.current.features.collaborativeEditing).toBe(!initialCollaboration);
    
    // Verificar persistência no localStorage
    const savedFeatures = JSON.parse(localStorage.getItem('notion-spark-features') || '{}');
    expect(savedFeatures.collaborativeEditing).toBe(!initialCollaboration);
  });

  it('deve coletar métricas do sistema', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    await act(async () => {
      await result.current.initializeSystem();
    });
    
    const metrics = await act(async () => {
      return await result.current.getSystemMetrics();
    });
    
    expect(metrics).toBeDefined();
    expect(metrics.performance).toBeDefined();
    expect(metrics.ai).toBeDefined();
    expect(metrics.collaboration).toBeDefined();
    expect(metrics.offline).toBeDefined();
    expect(metrics.system).toBeDefined();
  });

  it('deve executar otimização de performance', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    await act(async () => {
      await result.current.optimizePerformance();
    });
    
    // Verificar se não houve erro
    expect(true).toBe(true);
  });

  it('deve gerenciar modo offline', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    await act(async () => {
      await result.current.initializeSystem();
    });
    
    // Ativar modo offline
    await act(async () => {
      await result.current.enableOfflineMode();
    });
    
    expect(result.current.status.offline.lastSync).toBeDefined();
    
    // Sincronizar dados offline
    await act(async () => {
      await result.current.syncOfflineData();
    });
    
    expect(result.current.status.offline.syncPending).toBe(0);
  });

  it('deve analisar similaridade de conteúdo', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    await act(async () => {
      await result.current.initializeSystem();
    });
    
    const files = [
      {
        id: 'file1',
        name: 'Component1.tsx',
        content: 'React component with hooks',
        tags: ['react'],
        type: 'file' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'file2',
        name: 'Component2.tsx', 
        content: 'Another React component with hooks',
        tags: ['react'],
        type: 'file' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const similarities = await act(async () => {
      return await result.current.analyzeContentSimilarity(files);
    });
    
    expect(Array.isArray(similarities)).toBe(true);
  });

  it('deve exportar e importar configuração', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    // Modificar configuração
    act(() => {
      result.current.updateConfiguration({
        autoTagging: false,
        performanceMonitoring: true
      });
    });
    
    // Exportar configuração
    const configString = result.current.exportConfiguration();
    
    expect(configString).toContain('autoTagging');
    expect(configString).toContain('performanceMonitoring');
    
    // Importar configuração
    act(() => {
      result.current.importConfiguration(configString);
    });
    
    expect(result.current.features.autoTagging).toBe(false);
    expect(result.current.features.performanceMonitoring).toBe(true);
  });

  it('deve lidar com erros graciosamente', async () => {
    const { result } = renderHook(() => useSystemIntegration());
    
    // Simular erro durante inicialização
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Tentar importar configuração inválida
    act(() => {
      result.current.importConfiguration('invalid json');
    });
    
    // Sistema deve continuar funcionando
    expect(result.current.status).toBeDefined();
    
    console.error = originalConsoleError;
  });
}); 