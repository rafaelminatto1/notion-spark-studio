import { useState, useEffect, useCallback, useRef } from 'react';
import { pwaAdvancedService, PWACapabilities, PWAMetrics } from '../services/PWAAdvancedService';

export interface PWAState {
  capabilities: PWACapabilities | null;
  metrics: PWAMetrics | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PWAActions {
  installApp: () => Promise<boolean>;
  shareContent: (data: { title?: string; text?: string; url?: string }) => Promise<boolean>;
  requestFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<boolean>;
  vibrate: (pattern: number | number[]) => Promise<boolean>;
  setBadge: (count?: number) => Promise<boolean>;
  updateServiceWorker: () => Promise<boolean>;
  refreshCapabilities: () => void;
  refreshMetrics: () => void;
}

export interface PWAHookReturn extends PWAState, PWAActions {
  canInstall: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  platform: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserSupport: {
    serviceWorker: boolean;
    webShare: boolean;
    webPush: boolean;
    badgeAPI: boolean;
    fullscreen: boolean;
    vibration: boolean;
  };
}

export const usePWAAdvanced = (): PWAHookReturn => {
  const [state, setState] = useState<PWAState>({
    capabilities: null,
    metrics: null,
    isInitialized: false,
    isLoading: true,
    error: null,
  });

  const initializationRef = useRef(false);
  const eventListenersRef = useRef<Map<string, Function>>(new Map());

  // Initialize PWA service
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initializePWA = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        await pwaAdvancedService.initialize();
        
        const capabilities = pwaAdvancedService.getCapabilities();
        const metrics = pwaAdvancedService.getMetrics();
        
        setState({
          capabilities,
          metrics,
          isInitialized: true,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error('[usePWAAdvanced] Initialization failed:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize PWA',
        }));
      }
    };

    initializePWA();
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!state.isInitialized) return;

    const listeners = new Map<string, Function>();

    // Install prompt available
    const onInstallPromptAvailable = () => {
      setState(prev => ({
        ...prev,
        capabilities: pwaAdvancedService.getCapabilities(),
      }));
    };

    // App installed
    const onAppInstalled = () => {
      setState(prev => ({
        ...prev,
        capabilities: pwaAdvancedService.getCapabilities(),
      }));
    };

    // Service worker updated
    const onServiceWorkerUpdated = () => {
      setState(prev => ({
        ...prev,
        capabilities: pwaAdvancedService.getCapabilities(),
      }));
    };

    // Network status changed
    const onNetworkStatusChanged = (data: { online: boolean }) => {
      setState(prev => {
        if (!prev.capabilities) return prev;
        
        return {
          ...prev,
          capabilities: {
            ...prev.capabilities,
            network: {
              ...prev.capabilities.network,
              isOnline: data.online,
            },
          },
        };
      });
    };

    // Update available
    const onUpdateAvailable = () => {
      setState(prev => {
        if (!prev.capabilities) return prev;
        
        return {
          ...prev,
          capabilities: {
            ...prev.capabilities,
            serviceWorker: {
              ...prev.capabilities.serviceWorker,
              hasUpdate: true,
            },
          },
        };
      });
    };

    // Register event listeners
    listeners.set('install-prompt-available', onInstallPromptAvailable);
    listeners.set('app-installed', onAppInstalled);
    listeners.set('service-worker-updated', onServiceWorkerUpdated);
    listeners.set('network-status-changed', onNetworkStatusChanged);
    listeners.set('update-available', onUpdateAvailable);

    listeners.forEach((listener, event) => {
      pwaAdvancedService.on(event, listener);
    });

    eventListenersRef.current = listeners;

    // Cleanup function
    return () => {
      listeners.forEach((listener, event) => {
        pwaAdvancedService.off(event, listener);
      });
      eventListenersRef.current.clear();
    };
  }, [state.isInitialized]);

  // Refresh capabilities and metrics periodically
  useEffect(() => {
    if (!state.isInitialized) return;

    const interval = setInterval(() => {
      const capabilities = pwaAdvancedService.getCapabilities();
      const metrics = pwaAdvancedService.getMetrics();
      
      setState(prev => ({
        ...prev,
        capabilities,
        metrics,
      }));
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [state.isInitialized]);

  // Actions
  const installApp = useCallback(async (): Promise<boolean> => {
    try {
      const success = await pwaAdvancedService.installApp();
      if (success) {
        setState(prev => ({
          ...prev,
          capabilities: pwaAdvancedService.getCapabilities(),
        }));
      }
      return success;
    } catch (error) {
      console.error('[usePWAAdvanced] Install failed:', error);
      return false;
    }
  }, []);

  const shareContent = useCallback(async (data: { title?: string; text?: string; url?: string }): Promise<boolean> => {
    try {
      return await pwaAdvancedService.shareContent(data);
    } catch (error) {
      console.error('[usePWAAdvanced] Share failed:', error);
      return false;
    }
  }, []);

  const requestFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      return await pwaAdvancedService.requestFullscreen();
    } catch (error) {
      console.error('[usePWAAdvanced] Fullscreen request failed:', error);
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async (): Promise<boolean> => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return true;
      }
      return false;
    } catch (error) {
      console.error('[usePWAAdvanced] Exit fullscreen failed:', error);
      return false;
    }
  }, []);

  const vibrate = useCallback(async (pattern: number | number[]): Promise<boolean> => {
    try {
      return await pwaAdvancedService.vibrate(pattern);
    } catch (error) {
      console.error('[usePWAAdvanced] Vibration failed:', error);
      return false;
    }
  }, []);

  const setBadge = useCallback(async (count?: number): Promise<boolean> => {
    try {
      return await pwaAdvancedService.setBadge(count);
    } catch (error) {
      console.error('[usePWAAdvanced] Badge API failed:', error);
      return false;
    }
  }, []);

  const updateServiceWorker = useCallback(async (): Promise<boolean> => {
    try {
      const success = await pwaAdvancedService.updateServiceWorker();
      if (success) {
        setState(prev => ({
          ...prev,
          capabilities: pwaAdvancedService.getCapabilities(),
        }));
      }
      return success;
    } catch (error) {
      console.error('[usePWAAdvanced] Service worker update failed:', error);
      return false;
    }
  }, []);

  const refreshCapabilities = useCallback(() => {
    setState(prev => ({
      ...prev,
      capabilities: pwaAdvancedService.getCapabilities(),
    }));
  }, []);

  const refreshMetrics = useCallback(() => {
    setState(prev => ({
      ...prev,
      metrics: pwaAdvancedService.getMetrics(),
    }));
  }, []);

  // Computed values
  const canInstall = state.capabilities?.installation.canInstall ?? false;
  const isInstalled = state.capabilities?.installation.isInstalled ?? false;
  const isStandalone = state.capabilities?.installation.isStandalone ?? false;
  const isOnline = state.capabilities?.network.isOnline ?? navigator.onLine;
  const hasUpdate = state.capabilities?.serviceWorker.hasUpdate ?? false;

  const platform = state.capabilities ? 
    `${state.capabilities.platform.os}-${state.capabilities.platform.browser}` : 
    'unknown';

  const deviceType: 'mobile' | 'tablet' | 'desktop' = state.capabilities ? 
    (state.capabilities.platform.isMobile ? 'mobile' : 
     state.capabilities.platform.isTablet ? 'tablet' : 'desktop') : 
    'desktop';

  const browserSupport = {
    serviceWorker: state.capabilities?.serviceWorker.isSupported ?? false,
    webShare: state.capabilities?.features.webShare ?? false,
    webPush: state.capabilities?.features.webPush ?? false,
    badgeAPI: state.capabilities?.features.badgeAPI ?? false,
    fullscreen: state.capabilities?.features.fullscreen ?? false,
    vibration: state.capabilities?.features.vibration ?? false,
  };

  return {
    // State
    ...state,
    
    // Computed values
    canInstall,
    isInstalled,
    isStandalone,
    isOnline,
    hasUpdate,
    platform,
    deviceType,
    browserSupport,
    
    // Actions
    installApp,
    shareContent,
    requestFullscreen,
    exitFullscreen,
    vibrate,
    setBadge,
    updateServiceWorker,
    refreshCapabilities,
    refreshMetrics,
  };
};

export default usePWAAdvanced; 