import { QueryClient, QueryClientProvider } from 'react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  console.log('[Providers] Iniciando Providers');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {(auth) => {
          console.log('[Providers] AuthProvider renderizado:', { 
            isAuthenticated: !!auth?.user,
            hasSession: !!auth?.session,
            status: auth?.status 
          });
          return (
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          );
        }}
      </AuthProvider>
    </QueryClientProvider>
  );
} 