'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { Navbar } from '@/components/Navbar';
import ErrorBoundary from '@/components/ErrorBoundary';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentSection, setCurrentSection] = useState('dashboard');

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
          <NavigationContext.Provider value={{ currentSection, setCurrentSection }}>
            <AuthProvider>
              <div className="min-h-screen bg-background">
                <Navbar />
                <main className="pt-16">
                  {children}
                </main>
              </div>
              <Toaster />
            </AuthProvider>
          </NavigationContext.Provider>
        </ErrorBoundary>
      </body>
    </html>
  );
} 