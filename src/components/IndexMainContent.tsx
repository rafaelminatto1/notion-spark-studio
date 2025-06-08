
import React, { useState } from 'react';
import { ViewMode } from '@/components/ViewTabs';
import { QuickSwitcher } from '@/components/QuickSwitcher';
import { CommandPalette } from '@/components/CommandPalette';
import { ThemeProvider } from '@/components/ThemeProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import { WorkspaceLayout } from '@/components/WorkspaceLayout';
import { AppHeader } from '@/components/AppHeader';
import { FileItem } from '@/types';
import { Plus, Search, FileText, Settings, Sparkles } from 'lucide-react';

interface IndexMainContentProps {
  activeView: ViewMode;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  convertedFiles: FileItem[];
  favorites: string[];
  currentFileId: string | null;
  setCurrentFileId: (id: string | null) => void;
  navigateTo: (fileId: string) => void;
  setActiveView: (view: ViewMode) => void;
  onShowSettings: () => void;
  onCreateFile: (name: string, parentId?: string, type?: 'file' | 'folder') => Promise<string>;
  isQuickSwitcherOpen: boolean;
  closeQuickSwitcher: () => void;
  filteredCommands: any[];
  quickSwitcherQuery: string;
  setQuickSwitcherQuery: (query: string) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
}

export const IndexMainContent: React.FC<IndexMainContentProps> = ({
  activeView,
  isMobile,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  convertedFiles,
  favorites,
  currentFileId,
  setCurrentFileId,
  navigateTo,
  setActiveView,
  onShowSettings,
  onCreateFile,
  isQuickSwitcherOpen,
  closeQuickSwitcher,
  filteredCommands,
  quickSwitcherQuery,
  setQuickSwitcherQuery,
  isCommandPaletteOpen,
  setIsCommandPaletteOpen
}) => {
  // Create wrapper function for AppHeader that accepts string and converts to ViewMode
  const handleViewChangeFromHeader = (view: string) => {
    setActiveView(view as ViewMode);
  };

  // Create wrapper function for WorkspaceLayout that accepts string and converts to ViewMode
  const handleViewChangeFromWorkspace = (view: string) => {
    setActiveView(view as ViewMode);
  };

  return (
    <ThemeProvider>
      <WorkspaceProvider>
        <div className="min-h-screen bg-background text-foreground flex w-full relative overflow-hidden">
          {/* Mobile Sidebar Backdrop */}
          {isMobile && isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
              onClick={onToggleMobileSidebar}
            />
          )}
          
          {/* Main Content Container - Enhanced Mobile First */}
          <div className="flex-1 flex flex-col min-w-0 relative"> 
            {/* Header - Enhanced for mobile */}
            {!isMobile && (
              <AppHeader
                activeView={activeView}
                onViewChange={handleViewChangeFromHeader}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                onToggleMobileSidebar={onToggleMobileSidebar}
                files={convertedFiles}
                onFileSelect={(fileId: string) => {
                  setCurrentFileId(fileId);
                  navigateTo(fileId);
                  setActiveView('editor');
                }}
                onShowSettings={onShowSettings}
              />
            )}
            
            {/* Content Area */}
            <div className={`flex-1 ${isMobile ? 'pb-20' : ''}`}>
              <WorkspaceLayout
                activeView={activeView}
                onViewChange={handleViewChangeFromWorkspace}
                onNavigateToFile={(fileId: string) => {
                  setCurrentFileId(fileId);
                  navigateTo(fileId);
                  setActiveView('editor');
                }}
                onCreateFile={onCreateFile}
                sidebarOpen={isMobileSidebarOpen}
                onSidebarOpenChange={onToggleMobileSidebar}
                isMobile={isMobile}
              />
            </div>
          </div>
          
          {/* Quick Switcher */}
          <QuickSwitcher
            isOpen={isQuickSwitcherOpen}
            onClose={closeQuickSwitcher}
            commands={filteredCommands}
            query={quickSwitcherQuery}
            onQueryChange={setQuickSwitcherQuery}
          />
          
          {/* Command Palette */}
          <CommandPalette
            files={convertedFiles}
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onFileSelect={(fileId: string) => {
              setCurrentFileId(fileId);
              navigateTo(fileId);
              setActiveView('editor');
            }}
            onCreateFile={onCreateFile}
            favorites={favorites}
          />
          
          {/* Enhanced Mobile Bottom Navigation */}
          {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 z-50 mobile-nav safe-area-pb animate-slide-up">
              <div className="flex items-center justify-around h-16 px-4">
                {/* Create Button - Enhanced */}
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 hover:bg-white/10 active:scale-95 group"
                  onClick={() => onCreateFile('Nova Nota')}
                  aria-label="Nova Nota"
                >
                  <div className="relative">
                    <Plus className="h-6 w-6 text-white group-active:scale-110 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-0 group-active:opacity-20 transition-opacity"></div>
                  </div>
                  <span className="text-xs font-medium text-white/80 mt-1 group-active:text-white transition-colors">Nova</span>
                </button>
                
                {/* Search Button - Enhanced */}
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 hover:bg-white/10 active:scale-95 group"
                  onClick={() => setIsCommandPaletteOpen(true)}
                  aria-label="Buscar"
                >
                  <div className="relative">
                    <Search className="h-6 w-6 text-white group-active:scale-110 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 rounded-full opacity-0 group-active:opacity-20 transition-opacity"></div>
                  </div>
                  <span className="text-xs font-medium text-white/80 mt-1 group-active:text-white transition-colors">Buscar</span>
                </button>
                
                {/* Files Button - Enhanced */}
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 hover:bg-white/10 active:scale-95 group"
                  onClick={onToggleMobileSidebar}
                  aria-label="Arquivos"
                >
                  <div className="relative">
                    <FileText className="h-6 w-6 text-white group-active:scale-110 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-0 group-active:opacity-20 transition-opacity"></div>
                  </div>
                  <span className="text-xs font-medium text-white/80 mt-1 group-active:text-white transition-colors">Arquivos</span>
                </button>
                
                {/* Settings Button - Enhanced */}
                <button
                  className="flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 hover:bg-white/10 active:scale-95 group"
                  onClick={onShowSettings}
                  aria-label="Configurações"
                >
                  <div className="relative">
                    <Settings className="h-6 w-6 text-white group-active:scale-110 transition-transform duration-200" />
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-full opacity-0 group-active:opacity-20 transition-opacity"></div>
                  </div>
                  <span className="text-xs font-medium text-white/80 mt-1 group-active:text-white transition-colors">Config</span>
                </button>
              </div>
              
              {/* Magic indicator bar */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-60"></div>
            </div>
          )}

          {/* Floating Create Button for Mobile */}
          {isMobile && (
            <button
              className="fixed bottom-24 right-6 z-40 fab h-14 w-14 rounded-full flex items-center justify-center animate-float"
              onClick={() => onCreateFile('Nova Nota')}
              aria-label="Criar Nova Nota"
            >
              <Sparkles className="h-6 w-6 text-white" />
            </button>
          )}
        </div>
      </WorkspaceProvider>
    </ThemeProvider>
  );
};
