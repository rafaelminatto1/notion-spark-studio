import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isInstalled: boolean;
  isUpdating: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  error: string | null;
  installPrompt: BeforeInstallPromptEvent | null;
}

export interface ServiceWorkerAPI {
  state: ServiceWorkerState;
  updateServiceWorker: () => Promise<void>;
  skipWaiting: () => void;
  syncDocuments: () => Promise<void>;
  cacheDocument: (document: any) => Promise<void>;
  showInstallPrompt: () => Promise<boolean>;
  isOfflineCapable: () => boolean;
}

export const useServiceWorker = (): ServiceWorkerAPI => {
  const [state, setState] = useState<ServiceWorkerState>({
    isInstalled: false,
    isUpdating: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    error: null,
    installPrompt: null
  });

  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Instalar Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Listeners para eventos de conectividade
    const handleOnline = () => setState(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setState(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener para PWA install prompt
    const handleInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setState(prev => ({ ...prev, installPrompt: e }));
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt as any);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt as any);
    };
  }, []);

  const registerServiceWorker = async () => {
    try {
      console.log('[SW Hook] Registering Service Worker...');
      
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      setRegistration(reg);

      // Service Worker instalado
      if (reg.installing) {
        console.log('[SW Hook] Service Worker installing...');
        setState(prev => ({ ...prev, isUpdating: true }));
        
        reg.installing.addEventListener('statechange', () => {
          if (reg.installing?.state === 'installed') {
            setState(prev => ({ 
              ...prev, 
              isInstalled: true, 
              isUpdating: false 
            }));
            console.log('[SW Hook] Service Worker installed');
          }
        });
      } else if (reg.waiting) {
        // Service Worker esperando para atualizar
        console.log('[SW Hook] Service Worker waiting');
        setState(prev => ({ 
          ...prev, 
          isInstalled: true, 
          hasUpdate: true 
        }));
      } else if (reg.active) {
        // Service Worker ativo
        console.log('[SW Hook] Service Worker active');
        setState(prev => ({ 
          ...prev, 
          isInstalled: true 
        }));
      }

      // Listener para atualizações
      reg.addEventListener('updatefound', () => {
        console.log('[SW Hook] Service Worker update found');
        setState(prev => ({ ...prev, isUpdating: true }));

        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW Hook] New Service Worker installed, update available');
              setState(prev => ({ 
                ...prev, 
                isUpdating: false, 
                hasUpdate: true 
              }));
            }
          });
        }
      });

      // Listener para controle do Service Worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[SW Hook] Service Worker controller changed');
        window.location.reload();
      });

    } catch (error) {
      console.error('[SW Hook] Service Worker registration failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      }));
    }
  };

  // Atualizar Service Worker
  const updateServiceWorker = useCallback(async () => {
    if (!registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      const newRegistration = await registration.update();
      console.log('[SW Hook] Service Worker update triggered');
      
      if (newRegistration.waiting) {
        setState(prev => ({ ...prev, hasUpdate: true }));
      }
    } catch (error) {
      console.error('[SW Hook] Service Worker update failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Update failed' 
      }));
    }
  }, [registration]);

  // Pular espera e ativar novo Service Worker
  const skipWaiting = useCallback(() => {
    if (registration?.waiting) {
      console.log('[SW Hook] Skipping waiting...');
      
      // Enviar mensagem para o Service Worker
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setState(prev => ({ ...prev, hasUpdate: false }));
    }
  }, [registration]);

  // Sincronizar documentos offline
  const syncDocuments = useCallback(async (): Promise<void> => {
    if (!registration?.active) {
      throw new Error('Service Worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log('[SW Hook] Document sync initiated');
          resolve();
        } else {
          reject(new Error(event.data.error || 'Sync failed'));
        }
      };

      registration.active.postMessage(
        { type: 'SYNC_DOCUMENTS' },
        [messageChannel.port2]
      );
    });
  }, [registration]);

  // Cachear documento importante
  const cacheDocument = useCallback(async (document: any): Promise<void> => {
    if (!registration?.active) {
      throw new Error('Service Worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log('[SW Hook] Document cached:', document.id);
          resolve();
        } else {
          reject(new Error(event.data.error || 'Cache failed'));
        }
      };

      registration.active.postMessage(
        { 
          type: 'CACHE_DOCUMENT', 
          data: document 
        },
        [messageChannel.port2]
      );
    });
  }, [registration]);

  // Mostrar prompt de instalação PWA
  const showInstallPrompt = useCallback(async (): Promise<boolean> => {
    if (!state.installPrompt) {
      return false;
    }

    try {
      // Mostrar prompt
      state.installPrompt.prompt();
      
      // Aguardar resposta do usuário
      const result = await state.installPrompt.userChoice;
      
      console.log('[SW Hook] Install prompt result:', result.outcome);
      
      // Limpar prompt usado
      setState(prev => ({ ...prev, installPrompt: null }));
      
      return result.outcome === 'accepted';
    } catch (error) {
      console.error('[SW Hook] Install prompt failed:', error);
      return false;
    }
  }, [state.installPrompt]);

  // Verificar se o app é capaz de funcionar offline
  const isOfflineCapable = useCallback((): boolean => {
    return state.isInstalled && 'serviceWorker' in navigator;
  }, [state.isInstalled]);

  return {
    state,
    updateServiceWorker,
    skipWaiting,
    syncDocuments,
    cacheDocument,
    showInstallPrompt,
    isOfflineCapable
  };
};

// Hook para notificações de status offline/online
export const useOfflineNotification = () => {
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setShowOfflineToast(true);
      setTimeout(() => setShowOfflineToast(false), 5000);
    };

    const handleOnline = () => {
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return { showOfflineToast, showOnlineToast };
};

// Hook para cache manual de recursos importantes
export const useOfflineCache = () => {
  const { cacheDocument, state } = useServiceWorker();

  const cacheImportantDocument = useCallback(async (document: any) => {
    if (state.isInstalled) {
      try {
        await cacheDocument(document);
        console.log('[Offline Cache] Document cached for offline access');
      } catch (error) {
        console.error('[Offline Cache] Failed to cache document:', error);
      }
    }
  }, [cacheDocument, state.isInstalled]);

  const preloadCriticalResources = useCallback(async () => {
    if (!state.isInstalled) return;

    // Lista de recursos críticos para cache
    const criticalResources = [
      '/dashboard',
      '/editor',
      '/api/files/recent',
      '/api/templates'
    ];

    try {
      await Promise.all(
        criticalResources.map(resource => 
          fetch(resource).catch(err => console.warn('Failed to preload:', resource, err))
        )
      );
      console.log('[Offline Cache] Critical resources preloaded');
    } catch (error) {
      console.error('[Offline Cache] Failed to preload resources:', error);
    }
  }, [state.isInstalled]);

  return {
    cacheImportantDocument,
    preloadCriticalResources,
    isOfflineReady: state.isInstalled
  };
};

export default useServiceWorker; 