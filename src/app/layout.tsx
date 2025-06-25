'use client';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthProvider';
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

export const metadata: Metadata = {
  title: 'Notion Spark Studio',
  description: 'Organize suas ideias e colabore com sua equipe - Uma plataforma moderna de produtividade',
  keywords: ['notion', 'produtividade', 'colaboração', 'documentos', 'workspace'],
  authors: [{ name: 'Notion Spark Studio Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'Notion Spark Studio',
    description: 'Organize suas ideias e colabore com sua equipe',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Notion Spark Studio',
    description: 'Organize suas ideias e colabore com sua equipe',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentSection, setCurrentSection] = useState('dashboard');

  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
      </head>
      <body className={`${inter.className} h-full antialiased`}>
        <ErrorBoundary>
          <NavigationContext.Provider value={{ currentSection, setCurrentSection }}>
            <AuthProvider>
              <div className="min-h-full">
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