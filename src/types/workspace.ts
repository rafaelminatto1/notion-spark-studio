
export interface WorkspaceLayout {
  id: string;
  name: string;
  panels: PanelConfig[];
  theme: string;
  settings: WorkspaceSettings;
}

export interface PanelConfig {
  id: string;
  type: 'sidebar' | 'editor' | 'graph' | 'dashboard' | 'templates' | 'custom';
  position: 'left' | 'right' | 'top' | 'bottom' | 'center';
  size: number; // percentage
  minSize?: number;
  maxSize?: number;
  isVisible: boolean;
  isCollapsible: boolean;
  title?: string;
  customComponent?: string;
}

export interface WorkspaceSettings {
  fontSize: number;
  lineHeight: number;
  autoSave: boolean;
  showLineNumbers: boolean;
  wordWrap: boolean;
  minimap: boolean;
  animations: boolean;
  compactMode: boolean;
  showBreadcrumbs: boolean;
  sidebarPosition: 'left' | 'right';
  toolbarPosition: 'top' | 'bottom' | 'hidden';
}

export interface CustomTheme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    accent: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
  };
}

// Adicionar interfaces para workspaces compartilhados
export interface SharedWorkspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  invited_by?: string;
}
