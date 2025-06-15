'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/Navbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useState, createContext, useContext } from 'react';

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

function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentSection, setCurrentSection] = useState('dashboard');

  return (
    <NavigationContext.Provider value={{ currentSection, setCurrentSection }}>
      {children}
    </NavigationContext.Provider>
  );
}

function AppContent({ children }: { children: React.ReactNode }) {
  const { currentSection, setCurrentSection } = useNavigation();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        currentSection={currentSection}
        onNavigate={setCurrentSection}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

export const metadata: Metadata = {
  title: 'Notion Spark Studio',
  description: 'Uma plataforma moderna para produtividade e colaboração',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <NavigationProvider>
              <AppContent>
                {children}
              </AppContent>
            </NavigationProvider>
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
} 