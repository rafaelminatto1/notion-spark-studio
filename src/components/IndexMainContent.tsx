import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ViewMode } from '@/components/ViewTabs';
import { FileItem } from '@/types';
import { DashboardEnhanced } from '@/components/DashboardEnhanced';
import { EvernoteLayout } from '@/components/EvernoteLayout';
import { AppHeader } from '@/components/AppHeader';
import { MobileHeader } from '@/components/MobileHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { BreadcrumbsNav } from '@/components/BreadcrumbsNav';
import { KeyboardShortcuts } from '@/components/KeyboardShortcuts';
import { PerformanceMonitor } from '@/components/PerformanceMonitor';
import { useAutoCloseToast } from '@/hooks/useAutoCloseToast';
import { useIndexMainContent } from '@/hooks/useIndexMainContent';
import { Sparkles } from 'lucide-react';
import SmartContentSuggestions from '@/components/ai/SmartContentSuggestions';
import { useSystemIntegration } from '@/hooks/useSystemIntegration';
import { GraphContainer } from '@/components/GraphView/GraphContainer';
import { TemplatesManager } from '@/components/TemplatesManager';

interface IndexMainContentProps {
  activeView: ViewMode;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  setActiveView: (view: ViewMode) => void;
  onShowSettings: () => void;
  isQuickSwitcherOpen: boolean;
  openQuickSwitcher: () => void;
  closeQuickSwitcher: () => void;
  filteredCommands: any[];
  quickSwitcherQuery: string;
  setQuickSwitcherQuery: (query: string) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  onNavigateToFile: (fileId: string) => void;
}

export const IndexMainContent: React.FC<IndexMainContentProps> = ({
  activeView,
  isMobile,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  setActiveView,
  onShowSettings,
  isQuickSwitcherOpen,
  openQuickSwitcher,
  closeQuickSwitcher,
  filteredCommands,
  quickSwitcherQuery,
  setQuickSwitcherQuery,
  isCommandPaletteOpen,
  setIsCommandPaletteOpen,
  onNavigateToFile,
}) => {
  // Sistema integrado de IA e funcionalidades avançadas
  const systemIntegration = useSystemIntegration();
  const {
    loginSuccessToast,
    setLoginSuccessToast,
    dashboardTimeRange,
    setDashboardTimeRange,
    isLoading,
    error,
    convertedFiles,
    currentFileId,
    favorites,
    handleViewChangeFromHeader,
    handleViewChangeFromWorkspace,
    handleFileSelect,
    handleCreateFile,
    handleBreadcrumbNavigate,
    getCurrentNotebookId,
    memoizedHandlers,
  } = useIndexMainContent({
    setActiveView,
    isMobile,
    onToggleMobileSidebar,
  });

  useAutoCloseToast({
    message: "Login realizado com sucesso! Bem-vindo de volta.",
    type: "success",
    duration: 3000,
    trigger: loginSuccessToast
  });

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-background via-background/98 to-background flex w-full relative overflow-hidden"
    )}>
      {/* Keyboard Shortcuts Handler */}
      <KeyboardShortcuts
        onQuickSwitcher={openQuickSwitcher}
        onCommandPalette={() => setIsCommandPaletteOpen(true)}
        onCreateNote={() => handleCreateFile('Nova Nota')}
        onCreateNotebook={() => handleCreateFile('Novo Notebook', undefined, 'folder')}
        onToggleSidebar={onToggleMobileSidebar}
        onFocusMode={() => {/* handled by FocusMode component */}}
        onSearch={() => setIsCommandPaletteOpen(true)}
        activeView={activeView}
        setActiveView={(view) => setActiveView(view as ViewMode)}
      />

      {isMobile && isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 animate-fade-in"
          onClick={onToggleMobileSidebar}
        />
      )}
      
      <div className="flex-1 flex flex-col min-w-0 relative"> 
        {/* Header */}
        <div className="sticky top-0 z-40">
          {isMobile ? (
            <MobileHeader
              files={convertedFiles}
              onNavigateToFile={handleFileSelect}
              onCreateFile={handleCreateFile}
              onToggleSidebar={onToggleMobileSidebar}
              onShowSettings={onShowSettings}
              onOpenSearch={() => setIsCommandPaletteOpen(true)}
            />
          ) : (
            <>
              <AppHeader
                activeView={activeView}
                onViewChange={handleViewChangeFromHeader}
                isMobile={isMobile}
                isMobileSidebarOpen={isMobileSidebarOpen}
                onToggleMobileSidebar={onToggleMobileSidebar}
                files={convertedFiles}
                onNavigateToFile={handleFileSelect}
                onShowSettings={onShowSettings}
              />
              
              {/* Breadcrumbs */}
              <BreadcrumbsNav
                activeView={activeView}
                currentNoteId={currentFileId}
                currentNotebookId={getCurrentNotebookId}
                onNavigate={handleBreadcrumbNavigate}
              />
            </>
          )}
        </div>
        
        <div className={cn(
          "flex-1 min-h-0 relative",
          isMobile ? "pt-16 pb-24" : ""
        )}>
          {/* Renderizar view baseada no activeView */}
          {activeView === 'dashboard' && (
            <DashboardEnhanced 
              files={convertedFiles}
              onNavigateToFile={handleFileSelect}
              onCreateNote={useCallback(() => handleCreateFile('Nova Nota'), [handleCreateFile])}
              onCreateNotebook={useCallback(() => handleCreateFile('Novo Notebook', undefined, 'folder'), [handleCreateFile])}
              timeRange={dashboardTimeRange}
              onTimeRangeChange={setDashboardTimeRange}
            />
          )}
          
          {activeView === 'evernote' && (
            <EvernoteLayout />
          )}
          
          {activeView === 'graph' && (
            <div className="h-full">
              <GraphContainer
                files={convertedFiles}
                currentFileId={currentFileId}
                onFileSelect={handleFileSelect}
              />
            </div>
          )}
          
          {activeView === 'templates' && (
            <div className="h-full">
              <TemplatesManager
                onCreateFromTemplate={(template) => {
                  console.log('[IndexMainContent] Creating from template:', template.name);
                  handleCreateFile(template.name, undefined, 'file').then((fileId) => {
                    if (fileId) {
                      console.log('[IndexMainContent] File created, updating content');
                      // TODO: Implementar atualização do conteúdo do arquivo
                    }
                  }).catch(error => {
                    console.error('[IndexMainContent] Error creating file from template:', error);
                  });
                }}
              />
            </div>
          )}
          
          {activeView === 'editor' && (
            <EvernoteLayout />
          )}
        </div>

        {/* System Controls - posicionado no canto */}
        {!isMobile && (
          <div className="fixed top-4 right-4 z-30 flex flex-col gap-2">
            {/* AI Status Indicator */}
            {systemIntegration.status.ai.isEnabled && (
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                systemIntegration.status.ai.isProcessing 
                  ? "bg-blue-100 text-blue-600 animate-pulse" 
                  : "bg-green-100 text-green-600"
              )}>
                <Sparkles className="h-5 w-5" />
              </div>
            )}
            
            {/* Collaboration Status */}
            {systemIntegration.status.collaboration.isConnected && (
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold">
                  {systemIntegration.status.collaboration.collaborators}
                </span>
              </div>
            )}
            
            {/* Offline Status */}
            {!systemIntegration.status.performance.networkStatus.includes('online') && (
              <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                <span className="text-xs">⚡</span>
              </div>
            )}
          </div>
        )}

        {/* Performance Monitor - Sistema Global */}
        <PerformanceMonitor
          onOptimizationSuggestion={(suggestion) => {
            // Auto-aplicar otimizações de alta prioridade
            if (suggestion.impact === 'high') {
              suggestion.action();
            }
          }}
        />
      </div>
      
      {/* Smart Content Suggestions Panel - Aparece quando há sugestões */}
      {systemIntegration.status.ai.suggestionsCount > 0 && !isMobile && (
        <div className="fixed bottom-4 right-4 z-40 w-80">
          <SmartContentSuggestions
            allFiles={convertedFiles}
            userBehavior={{
              recentActions: [],
              preferredTopics: [],
              writingStyle: 'technical',
              productivityHours: []
            }}
            onApplySuggestion={(suggestion) => {
              console.log('Applying suggestion:', suggestion);
              systemIntegration.showNotification(`Sugestão aplicada: ${suggestion.title}`, 'success');
            }}
            onUpdateContent={(content) => {
              console.log('Content updated:', content);
            }}
            isEnabled={systemIntegration.features.contentSuggestions}
          />
        </div>
      )}
      
      {isMobile && (
        <MobileBottomNav
          activeView={activeView}
          onViewChange={handleViewChangeFromHeader}
          onToggleSidebar={onToggleMobileSidebar}
          onOpenSearch={useCallback(() => setIsCommandPaletteOpen(true), [setIsCommandPaletteOpen])}
          onShowSettings={onShowSettings}
        />
      )}

      {isMobile && activeView === 'editor' && (
        <button
          className="fixed bottom-32 right-6 z-40 fab h-16 w-16 rounded-2xl flex items-center justify-center animate-float shadow-2xl"
          onClick={useCallback(() => handleCreateFile('Nova Nota'), [handleCreateFile])}
          aria-label="Criar Nova Nota"
        >
          <Sparkles className="h-7 w-7 text-white" />
        </button>
      )}
    </div>
  );
};
