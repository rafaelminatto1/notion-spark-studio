
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

console.log('=== APP.TSX START ===');

let queryClient: QueryClient;

try {
  console.log('App.tsx: Creating QueryClient...');
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        staleTime: 5 * 60 * 1000,
      },
    },
  });
  console.log('App.tsx: QueryClient created successfully');
} catch (error) {
  console.error('App.tsx: Error creating QueryClient:', error);
  throw error;
}

const App = () => {
  console.log('=== APP COMPONENT RENDER START ===');
  
  try {
    console.log('App.tsx: App component rendering...');
    
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('=== APP COMPONENT ERROR ===', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>App Component Error</h1>
        <p>Error: {error.message}</p>
        <p>Check console for details</p>
      </div>
    );
  }
};

console.log('=== APP.TSX END ===');
export default App;
