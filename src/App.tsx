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

const AppContent = () => {
  // Hook para limpeza automática de tokens expirados
  useTokenCleanup();

  return (
    <Router>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={
          <AuthGuard>
            <Index />
          </AuthGuard>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ConnectionStatus />
          <UserPreferencesProvider>
            <FileSystemProvider>
              <PermissionsProvider>
                <CollaborationProvider>
                  <AppContent />
                </CollaborationProvider>
              </PermissionsProvider>
            </FileSystemProvider>
          </UserPreferencesProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
