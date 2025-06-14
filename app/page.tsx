'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Carregamento dinâmico do App para evitar problemas de SSR
const App = dynamic(() => import('../src/App'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-white mb-2">Carregando Notion Spark Studio</h2>
        <p className="text-gray-300">Preparando sua experiência...</p>
      </div>
    </div>
  )
});

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-white mb-2">Carregando Notion Spark Studio</h2>
          <p className="text-gray-300">Preparando sua experiência...</p>
        </div>
      </div>
    }>
      <App />
    </Suspense>
  );
} 