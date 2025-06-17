import React, { Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useTokenCleanup } from "@/hooks/useTokenCleanup";
import ErrorBoundary from "@/components/ErrorBoundary";
import { LoadingSpinner } from '@/components/LoadingSpinner';

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
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  // Hook para limpeza automática de tokens expirados
  useTokenCleanup();

  return (
    <div className="min-h-screen bg-background">
      {/* Conteúdo principal será renderizado pelo Next.js routing */}
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          🚀 Notion Spark Studio v2.0
        </h1>
        <div className="text-center text-muted-foreground">
          <p>Sistema de produtividade inteligente com IA integrada</p>
          <p className="mt-2">Navigate using Next.js routing</p>
        </div>
      </div>
      
      {/* Toasters */}
      <Toaster />
      <Sonner />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Suspense fallback={<LoadingSpinner />}>
              <AppContent />
            </Suspense>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
