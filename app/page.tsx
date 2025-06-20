'use client';

import React from 'react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Notion Spark Studio
        </h1>
        <p className="text-xl text-gray-600">
          Plataforma de Templates e Produtividade
        </p>
        <div className="mt-8 text-sm text-gray-500">
          Deploy: {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
}