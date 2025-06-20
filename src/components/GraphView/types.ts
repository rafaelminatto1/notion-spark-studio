export interface GraphNode {
  id: string;
  title: string; // Uniformizando com src/types/graph.ts
  type: 'file' | 'folder' | 'database' | 'tag';
  size: number;
  color: string;
  position: { x: number; y: number }; // Adicionando propriedade obrigatória
  x?: number;
  y?: number;
  fx?: number | null; // Compatível com D3
  fy?: number | null; // Compatível com D3
  vx?: number;
  vy?: number;
  
  // Dados básicos alinhados com src/types/graph.ts
  connections: {
    to: string;
    type: 'link' | 'backlink' | 'tag' | 'parent';
    strength: number;
  }[];
  metadata: {
    lastModified: Date;
    wordCount: number;
    collaborators: string[];
    tags: string[];
    path?: string;
    fileSize?: number;
    language?: string;
    isTemplate?: boolean;
    isShared?: boolean;
    accessLevel?: 'private' | 'shared' | 'public';
  };
  
  // Dados computados específicos do GraphView
  cluster?: string;
  clusterColor?: string;
  centrality?: number;
  betweenness?: number;
  clustering?: number;
  community?: string;
  importance?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'link' | 'backlink' | 'tag' | 'parent';
  strength: number;
  color: string;
  width: number;
  bidirectional?: boolean;
  
  // Dados computados
  weight?: number;
  frequency?: number;
  lastAccessed?: Date;
}

export interface GraphFilters {
  nodeTypes: ('file' | 'folder' | 'database' | 'tag')[];
  minConnections: number;
  dateRange: { from: Date; to: Date } | null;
  tags: string[];
  searchQuery: string;
  showOrphans: boolean;
  
  // Filtros avançados
  collaborators?: string[];
  workspace?: string;
  hasAttachments?: boolean;
  language?: string;
  wordCountRange?: { min: number; max: number };
  accessLevel?: ('private' | 'shared' | 'public')[];
}

export interface LayoutSettings {
  type: 'force' | 'hierarchical' | 'circular' | 'timeline';
  physics: boolean;
  forceStrength: number;
  linkDistance: number;
  collisionRadius: number;
  centeringStrength: number;
}

export type ViewMode = 'force' | 'hierarchical' | 'circular' | 'timeline';

export interface GraphCluster {
  id: string;
  name: string;
  nodeIds: string[];
  color: string;
  center: { x: number; y: number };
  radius: number;
  
  // Metadados do cluster
  similarity: number;
  density: number;
  mainTags: string[];
  mainCollaborators: string[];
}

export interface CentralityMetrics {
  betweenness: Map<string, number>;
  closeness: Map<string, number>;
  pageRank: Map<string, number>;
  combined: Map<string, number>;
}

export interface Community {
  id: string;
  members: string[];
  strength: number;
  mainTopic?: string;
  color: string;
}

export interface PathResult {
  path: string[];
  distance: number;
  intermediateNodes: string[];
  totalWeight: number;
}
