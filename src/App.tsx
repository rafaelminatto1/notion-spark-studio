import React, { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthGuard } from "@/components/AuthGuard";
import { useTokenCleanup } from "@/hooks/useTokenCleanup";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConnectionStatus from "@/components/ConnectionStatus";
import { FileSystemProvider } from "@/contexts/FileSystemContext";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";
import { PermissionsProvider } from "@/components/permissions/PermissionsEngine";
import { CollaborationProvider } from './components/collaboration/CollaborationProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { CacheProvider } from '@/utils/SmartCache';
import { BackupProvider } from '@/utils/BackupSystem';
import { HealthDashboard } from '@/utils/HealthMonitor';
import { PerformanceOptimizer } from '@/utils/PerformanceOptimizer';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Lazy loading das páginas
const Index = lazy(() => import('./legacy-pages/Index'));
const Auth = lazy(() => import('./legacy-pages/Auth'));
const ResetPassword = lazy(() => import('./legacy-pages/ResetPassword'));
const NotFound = lazy(() => import('./legacy-pages/NotFound'));

// Lazy loading de componentes principais
const Dashboard = PerformanceOptimizer.createLazyComponent(
  () => import('@/pages/Dashboard'),
  { retryAttempts: 3, loadingComponent: <div>Carregando Dashboard...</div> }
);

const NotionIntegration = PerformanceOptimizer.createLazyComponent(
  () => import('@/pages/NotionIntegration'),
  { retryAttempts: 3, loadingComponent: <div>Carregando Integração...</div> }
);

const AIWorkspace = PerformanceOptimizer.createLazyComponent(
  () => import('@/pages/AIWorkspace'),
  { retryAttempts: 3, loadingComponent: <div>Carregando IA...</div> }
);

const Settings = PerformanceOptimizer.createLazyComponent(
  () => import('@/pages/Settings'),
  { retryAttempts: 3, loadingComponent: <div>Carregando Configurações...</div> }
);

const AppContent = () => {
  // Hook para limpeza automática de tokens expirados
  useTokenCleanup();

  return (
    <Router>
      <div className="min-h-screen bg-background">
        {/* Health Monitor compacto no topo */}
        <div className="fixed top-4 right-4 z-50">
          <HealthDashboard compact={true} autoStart={true} />
        </div>

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notion" element={<NotionIntegration />} />
          <Route path="/ai" element={<AIWorkspace />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Rota para monitoramento completo */}
          <Route 
            path="/health" 
            element={
              <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Sistema de Monitoramento</h1>
                <HealthDashboard compact={false} autoStart={true} />
              </div>
            } 
          />
          
          {/* Rota 404 */}
          <Route 
            path="*" 
            element={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center space-y-4">
                  <h1 className="text-4xl font-bold text-muted-foreground">404</h1>
                  <p className="text-muted-foreground">Página não encontrada</p>
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Voltar ao Início
                  </button>
                </div>
              </div>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default function App() {
  return (
    <ErrorBoundary
      enableRetry={true}
      maxRetries={3}
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
        
        // Em produção, enviar para serviço de monitoramento
        if (process.env.NODE_ENV === 'production') {
          // Exemplo: Sentry.captureException(error);
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <FileSystemProvider>
                <UserPreferencesProvider>
                  <PermissionsProvider>
                    <CollaborationProvider>
                      <CacheProvider
                        config={{
                          maxSize: 100, // 100MB
                          maxEntries: 1000,
                          defaultTTL: 30 * 60 * 1000, // 30 minutos
                          compressionEnabled: true,
                          persistToDisk: true,
                          adaptiveEviction: true
                        }}
                      >
                        <BackupProvider
                          config={{
                            autoBackupEnabled: true,
                            autoBackupInterval: 60, // 1 hora
                            maxBackups: 5,
                            compressionEnabled: true,
                            backupOnCriticalActions: true
                          }}
                        >
                          <Suspense fallback={
                            <div className="min-h-screen flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
                            </div>
                          }>
                            <AppContent />
                          </Suspense>
                          <ConnectionStatus />
                          <Toaster />
                          <Sonner />
                        </BackupProvider>
                      </CacheProvider>
                    </CollaborationProvider>
                  </PermissionsProvider>
                </UserPreferencesProvider>
              </FileSystemProvider>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
