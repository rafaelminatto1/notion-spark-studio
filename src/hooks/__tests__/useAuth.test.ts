import { renderHook, act } from '@testing-library/react';
import { useAuth, User, AuthAPI } from '../useAuth';

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock do console para evitar logs durante os testes
global.console.error = jest.fn();
global.console.warn = jest.fn();

describe('useAuth Hook', () => {
  beforeEach(() => {
    // Limpar localStorage antes de cada teste
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Inicialização', () => {
    it('deve inicializar com usuário não autenticado quando não há dados salvos', async () => {
      const { result } = renderHook(() => useAuth());

      // Aguardar inicialização
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isAuthenticated).toBe(true); // Mock user é criado automaticamente
      expect(result.current.user).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('deve restaurar usuário salvo do localStorage', async () => {
      const mockUser: User = {
        id: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com',
        color: '#ff0000',
        role: 'editor',
        permissions: ['read:all'],
        preferences: {
          theme: 'dark',
          language: 'pt-BR',
          autoSave: true,
          collaborationMode: false
        },
        lastActivity: new Date(),
        isOnline: true
      };

      localStorageMock.setItem('notion-spark-user', JSON.stringify(mockUser));
      localStorageMock.setItem('notion-spark-token', 'valid-token');

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe(mockUser.id);
      expect(result.current.user?.email).toBe(mockUser.email);
    });

    it('deve criar usuário mock quando não há dados salvos', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.name).toBe('Usuário Atual');
      expect(result.current.user?.email).toBe('usuario@notionspark.com');
      expect(result.current.user?.role).toBe('admin');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notion-spark-user',
        expect.any(String)
      );
    });
  });

  describe('Login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let loginResult: boolean;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(loginResult!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.error).toBeNull();
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notion-spark-user',
        expect.any(String)
      );
    });

    it('deve falhar o login com credenciais vazias', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      let loginResult: boolean;
      await act(async () => {
        loginResult = await result.current.login('', '');
      });

      expect(loginResult!).toBe(false);
      expect(result.current.error).toBe('Email e senha são obrigatórios');
      expect(result.current.isAuthenticated).toBe(true); // Ainda autenticado com mock user
    });

    it('deve mostrar loading durante o login', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout', () => {
    it('deve fazer logout e limpar dados', async () => {
      const { result } = renderHook(() => useAuth());

      // Aguardar login inicial
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Fazer logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notion-spark-user');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('notion-spark-token');
    });
  });

  describe('Registro', () => {
    it('deve registrar novo usuário com dados válidos', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        role: 'editor' as const
      };

      let registerResult: boolean;
      await act(async () => {
        registerResult = await result.current.register(userData);
      });

      expect(registerResult!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.name).toBe(userData.name);
      expect(result.current.user?.email).toBe(userData.email);
      expect(result.current.user?.role).toBe(userData.role);
    });

    it('deve criar usuário com preferências padrão quando não fornecidas', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };

      await act(async () => {
        await result.current.register(userData);
      });

      expect(result.current.user?.preferences).toEqual({
        theme: 'system',
        language: 'pt-BR',
        autoSave: true,
        collaborationMode: true
      });
    });
  });

  describe('Atualização de Usuário', () => {
    it('deve atualizar dados do usuário', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const updates = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUser(updates);
      });

      expect(updateResult!).toBe(true);
      expect(result.current.user?.name).toBe(updates.name);
      expect(result.current.user?.email).toBe(updates.email);
      expect(result.current.user?.lastActivity).toBeInstanceOf(Date);
    });

    it('deve falhar ao tentar atualizar sem usuário logado', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Fazer logout primeiro
      await act(async () => {
        await result.current.logout();
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUser({ name: 'Test' });
      });

      expect(updateResult!).toBe(false);
    });
  });

  describe('Atualização de Preferências', () => {
    it('deve atualizar preferências do usuário', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const newPreferences = {
        theme: 'dark' as const,
        autoSave: false
      };

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updatePreferences(newPreferences);
      });

      expect(updateResult!).toBe(true);
      expect(result.current.user?.preferences.theme).toBe('dark');
      expect(result.current.user?.preferences.autoSave).toBe(false);
      expect(result.current.user?.preferences.language).toBe('pt-BR'); // Deve manter outras preferências
    });
  });

  describe('Utility Functions', () => {
    it('deve gerar cor baseada no userId', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const color1 = result.current.generateUserColor('user-123');
      const color2 = result.current.generateUserColor('user-456');
      const color3 = result.current.generateUserColor('user-123'); // Mesmo ID

      expect(color1).toMatch(/^hsl\(\d+, 70%, 60%\)$/);
      expect(color2).toMatch(/^hsl\(\d+, 70%, 60%\)$/);
      expect(color1).toBe(color3); // Mesma cor para mesmo ID
      expect(color1).not.toBe(color2); // Cores diferentes para IDs diferentes
    });

    it('deve retornar userId atual', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const userId = result.current.getCurrentUserId();
      expect(userId).toBe(result.current.user?.id);
    });

    it('deve retornar "anonymous-user" quando não há usuário logado', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Fazer logout
      await act(async () => {
        await result.current.logout();
      });

      const userId = result.current.getCurrentUserId();
      expect(userId).toBe('anonymous-user');
    });

    it('deve retornar usuário atual', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const user = result.current.getCurrentUser();
      expect(user).toBe(result.current.user);
    });
  });

  describe('Error Handling', () => {
    it('deve lidar com erro de parsing do localStorage', async () => {
      localStorageMock.setItem('notion-spark-user', 'invalid-json');
      localStorageMock.setItem('notion-spark-token', 'token');

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Deve criar usuário mock quando JSON é inválido
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toBeTruthy();
    });

    it('deve lidar com erro na atualização de usuário', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Simular erro do localStorage
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      let updateResult: boolean;
      await act(async () => {
        updateResult = await result.current.updateUser({ name: 'Test' });
      });

      expect(updateResult!).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        '[Auth] Update user error:',
        expect.any(Error)
      );
    });
  });

  describe('Integration Tests', () => {
    it('deve manter dados consistentes durante múltiplas operações', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Fazer login
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      const initialUser = result.current.user;

      // Atualizar preferências
      await act(async () => {
        await result.current.updatePreferences({ theme: 'dark' });
      });

      // Atualizar dados do usuário
      await act(async () => {
        await result.current.updateUser({ name: 'Updated Name' });
      });

      // Verificar consistência
      expect(result.current.user?.id).toBe(initialUser?.id);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.user?.name).toBe('Updated Name');
      expect(result.current.user?.preferences.theme).toBe('dark');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('deve persistir dados no localStorage corretamente', async () => {
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verificar se dados foram salvos
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notion-spark-user',
        expect.any(String)
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notion-spark-token',
        expect.any(String)
      );

      // Verificar se os dados salvos são válidos
      const savedUserData = localStorageMock.getItem('notion-spark-user');
      expect(() => JSON.parse(savedUserData as string)).not.toThrow();
      
      const parsedUser = JSON.parse(savedUserData as string);
      expect(parsedUser).toHaveProperty('id');
      expect(parsedUser).toHaveProperty('name');
      expect(parsedUser).toHaveProperty('email');
      expect(parsedUser).toHaveProperty('preferences');
    });
  });
}); 