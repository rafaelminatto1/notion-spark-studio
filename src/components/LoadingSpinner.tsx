import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Carregando...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-4';

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        {text && (
          <p className="text-sm text-gray-600 font-medium">{text}</p>
        )}
      </div>
    </div>
  );
};

export const PageLoader: React.FC<{ text?: string }> = ({ text = 'Carregando aplicação...' }) => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Notion Spark Studio</h2>
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  </div>
); 