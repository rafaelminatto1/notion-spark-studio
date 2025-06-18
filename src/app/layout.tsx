'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/Navbar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useState, createContext, useContext, useEffect } from 'react';

// Import our advanced systems
import { supabaseMonitoring } from '@/services/supabaseMonitoring';
import { webSocketService } from '@/services/WebSocketService';
import { globalSmartCache } from '@/services/SmartCacheEngine';
import { realTimeAIAnalytics } from '@/services/RealTimeAIAnalytics';

const inter = Inter({ subsets: ['latin'] });

// Context para navegação global
interface NavigationContextType {
  currentSection: string;
  setCurrentSection: (section: string) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

// System Status Provider
interface SystemContextType {
  systemsReady: boolean;
  systemsStatus: {
    monitoring: boolean;
    websocket: boolean;
    cache: boolean;
    analytics: boolean;
  };
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const useSystemStatus = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystemStatus must be used within SystemProvider');
  }
  return context;
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [systemsReady, setSystemsReady] = useState(false);
  const [systemsStatus, setSystemsStatus] = useState({
    monitoring: false,
    websocket: false,
    cache: false,
    analytics: false
  });

  useEffect(() => {
    // Initialize all advanced systems
    const initializeSystems = async () => {
      try {
        console.log('🚀 Initializing advanced systems...');
        
        // Initialize monitoring
        await supabaseMonitoring.trackEvent('system_startup', 'Application startup');
        setSystemsStatus(prev => ({ ...prev, monitoring: true }));
        
        // Initialize WebSocket service
        webSocketService.connect();
        setSystemsStatus(prev => ({ ...prev, websocket: true }));
        
        // Initialize smart cache
        globalSmartCache.optimize();
        setSystemsStatus(prev => ({ ...prev, cache: true }));
        
        // Initialize AI analytics
        realTimeAIAnalytics.trackAction({
          type: 'page_view',
          context: {
            page: '/',
            userAgent: navigator.userAgent,
            deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          },
          metadata: {
            systemStartup: true,
            timestamp: Date.now()
          }
        });
        setSystemsStatus(prev => ({ ...prev, analytics: true }));
        
        setSystemsReady(true);
        console.log('✅ All advanced systems initialized successfully');
        
        // Track successful initialization
        await supabaseMonitoring.trackPerformance('system', 'initialization', performance.now());
        
      } catch (error) {
        console.error('❌ Error initializing systems:', error);
        await supabaseMonitoring.trackError(error as Error, {
          context: 'system_initialization',
          critical: true
        });
      }
    };

    initializeSystems();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
      console.log('🔄 Systems cleanup completed');
    };
  }, []);

  return (
    <html lang="pt-BR">
      <head>
        <title>Notion Spark Studio</title>
        <meta name="description" content="Uma plataforma moderna para produtividade e colaboração com IA" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6366f1" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <SystemContext.Provider value={{ systemsReady, systemsStatus }}>
            <NavigationContext.Provider value={{ currentSection, setCurrentSection }}>
              <AuthProvider>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    {children}
                  </main>
                  
                  {/* System Status Indicator */}
                  {!systemsReady && (
                    <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span className="text-sm">Initializing systems...</span>
                      </div>
                    </div>
                  )}
                  
                  {systemsReady && (
                    <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg opacity-0 animate-pulse">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                        <span className="text-sm">All systems ready</span>
                      </div>
                    </div>
                  )}
                </div>
                <Toaster />
              </AuthProvider>
            </NavigationContext.Provider>
          </SystemContext.Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
} 