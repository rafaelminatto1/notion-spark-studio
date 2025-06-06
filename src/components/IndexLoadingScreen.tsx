
import React from 'react';

export const IndexLoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Carregando workspace...</p>
      </div>
    </div>
  );
};
