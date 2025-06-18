import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  ArrowLeft, 
  Menu, 
  Search, 
  Plus, 
  MoreVertical,
  Home,
  FileText,
  MessageCircle,
  Settings,
  User,
  ChevronRight,
  X,
  Edit,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFileSystemContext } from '@/contexts/FileSystemContext';
import { usePermissions } from '../permissions/PermissionsEngine';

// Tipos para mobile
interface MobileScreen {
  id: string;
  title: string;
  component: React.ComponentType<any>;
  showBackButton?: boolean;
  showSearch?: boolean;
  actions?: Array<{
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
  }>;
}

interface NavigationState {
  currentScreen: string;
  history: string[];
  params: Record<string, any>;
}

interface ResponsiveLayoutProps {
  children?: React.ReactNode;
  className?: string;
}

// Hook para detectar mobile e orientação
const useDeviceInfo = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return { isMobile, isTablet, orientation, screenSize };
};

// Hook para navegação mobile
const useMobileNavigation = () => {
  const [navigation, setNavigation] = useState<NavigationState>({
    currentScreen: 'notebooks',
    history: [],
    params: {}
  });

  const navigateTo = useCallback((screenId: string, params: Record<string, any> = {}) => {
    setNavigation(prev => ({
      currentScreen: screenId,
      history: [...prev.history, prev.currentScreen],
      params
    }));
  }, []);

  const goBack = useCallback(() => {
    setNavigation(prev => {
      if (prev.history.length === 0) return prev;
      
      const newHistory = [...prev.history];
      const previousScreen = newHistory.pop() || 'notebooks';
      
      return {
        currentScreen: previousScreen,
        history: newHistory,
        params: {}
      };
    });
  }, []);

  const resetNavigation = useCallback(() => {
    setNavigation({
      currentScreen: 'notebooks',
      history: [],
      params: {}
    });
  }, []);

  return { navigation, navigateTo, goBack, resetNavigation };
};

// Componente de header mobile
interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  actions?: Array<{
    icon: React.ComponentType<any>;
    label: string;
    onClick: () => void;
  }>;
  onBack?: () => void;
  onSearch?: (query: string) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton,
  showSearch,
  actions = [],
  onBack,
  onSearch
}) => {
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);

  return (
    <motion.header
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top"
    >
      {/* Left side */}
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        
        {!searchMode && (
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Search mode */}
      <AnimatePresence>
        {searchMode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex-1 mx-3"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { handleSearch(e.target.value); }}
              placeholder="Buscar..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {showSearch && (
          <button
            onClick={() => { setSearchMode(!searchMode); }}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {searchMode ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
        )}
        
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
            aria-label={action.label}
          >
            <action.icon className="h-5 w-5" />
          </button>
        ))}
      </div>
    </motion.header>
  );
};

// Componente de bottom navigation
interface BottomNavigationProps {
  currentScreen: string;
  onNavigate: (screenId: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentScreen, onNavigate }) => {
  const tabs = [
    { id: 'notebooks', label: 'Notebooks', icon: Home },
    { id: 'notes', label: 'Notas', icon: FileText },
    { id: 'comments', label: 'Comentários', icon: MessageCircle },
    { id: 'profile', label: 'Perfil', icon: User }
  ];

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      className="bg-white border-t border-gray-200 px-4 py-2 safe-area-bottom"
    >
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = currentScreen === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => { onNavigate(tab.id); }}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "text-blue-600 bg-blue-50" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
};

// Screen: Lista de Notebooks
const NotebooksScreen: React.FC<{ onNavigate: (screen: string, params?: any) => void }> = ({ onNavigate }) => {
  const { files } = useFileSystemContext();
  const { checkPermission, state } = usePermissions();
  
  const currentUserId = state.currentUser?.id || 'default-user';
  
  const notebooks = useMemo(() => 
    files
      .filter(file => file.type === 'folder')
      .filter(notebook => checkPermission(currentUserId, notebook.id, 'read')),
    [files, checkPermission, currentUserId]
  );

  return (
    <div className="p-4 space-y-4">
      {/* Quick actions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-blue-900 mb-2">Ações Rápidas</h2>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">
            <Plus className="h-4 w-4" />
            Nova Nota
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm">
            <FileText className="h-4 w-4" />
            Notebook
          </button>
        </div>
      </div>

      {/* Notebooks list */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Seus Notebooks</h3>
        {notebooks.map((notebook, index) => (
          <motion.button
            key={notebook.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => { onNavigate('notes', { notebookId: notebook.id, notebookName: notebook.name }); }}
            className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-medium text-gray-900">{notebook.name}</h4>
                <p className="text-sm text-gray-500">
                  {files.filter(f => f.parentId === notebook.id).length} notas
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </motion.button>
        ))}
      </div>

      {/* Recent notes */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Notas Recentes</h3>
        {files
          .filter(f => f.type === 'file')
          .slice(0, 3)
          .map((note, index) => (
            <motion.button
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + notebooks.length) * 0.05 }}
              onClick={() => { onNavigate('editor', { noteId: note.id, noteName: note.name }); }}
              className="w-full flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-medium text-gray-900 text-sm">{note.name}</h4>
                <p className="text-xs text-gray-500">
                  {note.updatedAt?.toLocaleDateString('pt-BR')}
                </p>
              </div>
            </motion.button>
          ))
        }
      </div>
    </div>
  );
};

// Screen: Lista de Notas
const NotesScreen: React.FC<{ 
  params: any; 
  onNavigate: (screen: string, params?: any) => void 
}> = ({ params, onNavigate }) => {
  const { files } = useFileSystemContext();
  const { checkPermission, state } = usePermissions();
  
  const currentUserId = state.currentUser?.id || 'default-user';
  const { notebookId, notebookName } = params;

  const notes = useMemo(() => 
    files
      .filter(file => file.parentId === notebookId && file.type === 'file')
      .filter(note => checkPermission(currentUserId, note.id, 'read')),
    [files, notebookId, checkPermission, currentUserId]
  );

  return (
    <div className="p-4 space-y-4">
      {/* Notebook info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900">{notebookName}</h2>
        <p className="text-sm text-gray-600">{notes.length} nota{notes.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Notes list */}
      <div className="space-y-2">
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma nota ainda</h3>
            <p className="text-gray-600 mb-4">Crie sua primeira nota neste notebook</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
              <Plus className="h-4 w-4 inline mr-2" />
              Nova Nota
            </button>
          </div>
        ) : (
          notes.map((note, index) => (
            <motion.button
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => { onNavigate('editor', { noteId: note.id, noteName: note.name }); }}
              className="w-full flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{note.name}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {note.content?.slice(0, 100) || 'Nota vazia'}...
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>{note.updatedAt?.toLocaleDateString('pt-BR')}</span>
                  <span>•</span>
                  <span>{note.content?.length || 0} caracteres</span>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-1" />
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

// Screen: Editor Mobile
const EditorScreen: React.FC<{ 
  params: any; 
  onNavigate: (screen: string, params?: any) => void 
}> = ({ params, onNavigate }) => {
  const { files, updateFile } = useFileSystemContext();
  const { noteId, noteName } = params;
  
  const note = files.find(f => f.id === noteId);
  const [content, setContent] = useState(note?.content || '');

  // Auto-save
  useEffect(() => {
    if (note && content !== note.content) {
      const timer = setTimeout(() => {
        updateFile(noteId, { content });
      }, 1000);

      return () => { clearTimeout(timer); };
    }
  }, [content, note, noteId, updateFile]);

  return (
    <div className="flex flex-col h-full">
      {/* Editor toolbar */}
      <div className="border-b border-gray-200 px-4 py-2">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap">
            <strong>B</strong>
          </button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap">
            <em>I</em>
          </button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap">
            H1
          </button>
          <button className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 whitespace-nowrap">
            Lista
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); }}
          placeholder="Comece a escrever..."
          className="w-full h-full resize-none border-0 outline-none text-base"
          style={{ font: 'inherit' }}
        />
      </div>
    </div>
  );
};

// Componente principal
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children, className }) => {
  const { isMobile, isTablet, orientation } = useDeviceInfo();
  const { navigation, navigateTo, goBack } = useMobileNavigation();

  // Definir screens disponíveis
  const screens: Record<string, MobileScreen> = {
    notebooks: {
      id: 'notebooks',
      title: 'Notion Spark',
      component: NotebooksScreen,
      showSearch: true,
      actions: [
        { icon: Plus, label: 'Novo', onClick: () => { console.log('Novo'); } },
        { icon: MoreVertical, label: 'Menu', onClick: () => { console.log('Menu'); } }
      ]
    },
    notes: {
      id: 'notes',
      title: navigation.params.notebookName || 'Notas',
      component: NotesScreen,
      showBackButton: true,
      showSearch: true,
      actions: [
        { icon: Plus, label: 'Nova Nota', onClick: () => { console.log('Nova nota'); } }
      ]
    },
    editor: {
      id: 'editor',
      title: navigation.params.noteName || 'Editor',
      component: EditorScreen,
      showBackButton: true,
      actions: [
        { icon: Share2, label: 'Compartilhar', onClick: () => { console.log('Compartilhar'); } },
        { icon: MoreVertical, label: 'Menu', onClick: () => { console.log('Menu'); } }
      ]
    }
  };

  const currentScreen = screens[navigation.currentScreen];
  const CurrentScreenComponent = currentScreen?.component;

  // Se não é mobile/tablet, renderizar layout desktop normal
  if (!isMobile && !isTablet) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn(
      "h-screen flex flex-col bg-gray-50 overflow-hidden",
      orientation === 'landscape' && 'landscape-mode',
      className
    )}>
      {/* Mobile Header */}
      <MobileHeader
        title={currentScreen?.title || 'Notion Spark'}
        showBackButton={currentScreen?.showBackButton}
        showSearch={currentScreen?.showSearch}
        actions={currentScreen?.actions}
        onBack={goBack}
        onSearch={(query) => { console.log('Search:', query); }}
      />

      {/* Screen Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {CurrentScreenComponent && (
            <motion.div
              key={navigation.currentScreen}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <CurrentScreenComponent
                params={navigation.params}
                onNavigate={navigateTo}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        currentScreen={navigation.currentScreen}
        onNavigate={navigateTo}
      />
    </div>
  );
};

export default ResponsiveLayout; 