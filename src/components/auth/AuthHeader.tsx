
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface AuthHeaderProps {
  activeTab: string;
}

const AuthHeader = ({ activeTab }: AuthHeaderProps) => {
  return (
    <CardHeader className="text-center pb-6">
      <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
        <div className="relative">
          <span className="text-3xl animate-pulse">📚</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
        </div>
      </div>
      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent animate-fade-in">
        Notion Spark Studio
      </CardTitle>
      <CardDescription className="text-base mt-3 text-muted-foreground animate-fade-in animation-delay-200">
        {activeTab === 'login' ? 'Entre na sua conta e continue criando' : 'Crie sua conta e comece a inovar'}
      </CardDescription>
    </CardHeader>
  );
};

export default AuthHeader;
