export interface GraphNode {
  id: string;
  title: string;
  type: 'file' | 'folder' | 'database' | 'tag';
  size: number; // baseado em importância/conexões
  color: string; // baseado em categoria/tags
  position: { x: number; y: number };
  connections: {
    to: string;
    type: 'link' | 'backlink' | 'tag' | 'parent';
    strength: number; // 1-10 baseado em frequência
  }[];
  metadata: {
    lastModified: Date;
    wordCount: number;
    collaborators: string[];
    tags: string[];
  };
  // Propriedades específicas do D3
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  // Propriedades de análise
  centrality?: number;
  betweenness?: number;
  clustering?: number;
  cluster?: string;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'link' | 'backlink' | 'tag' | 'parent' | 'reference';
  strength: number;
  bidirectional?: boolean;
  weight?: number;
  distance?: number;
}

export interface GraphViewFeatures {
  // Layouts inteligentes
  forceDirected: boolean;
  hierarchical: boolean;
  circular: boolean;
  timeline: boolean;
  
  // Filtros avançados
  filters: {
    nodeTypes: ('file' | 'folder' | 'database' | 'tag')[];
    dateRange: { from: Date; to: Date };
    tags: string[];
    collaborators: string[];
    minConnections: number;
  };
  
  // Interações
  physics: boolean;
  clustering: boolean;
  minimap: boolean;
  searchHighlight: boolean;
  
  // Análises
  pathFinding: boolean;
  centralityAnalysis: boolean;
  communityDetection: boolean;
}

export interface GraphCluster {
  id: string;
  name: string;
  color: string;
  nodes: string[];
  center: { x: number; y: number };
  radius: number;
}

export interface GraphAnalytics {
  networkDensity: number;
  averagePathLength: number;
  clusteringCoefficient: number;
  communities: GraphCluster[];
  centralNodes: GraphNode[];
  bridgeNodes: GraphNode[];
  isolatedNodes: GraphNode[];
}

export interface PathFindingResult {
  path: string[];
  distance: number;
  weight: number;
  nodes: GraphNode[];
}

export interface GraphState {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNode: string | null;
  hoveredNode: string | null;
  focusMode: boolean;
  focusDepth: number;
  layout: 'force' | 'hierarchical' | 'circular' | 'timeline';
  physics: boolean;
  showLabels: boolean;
  showClusters: boolean;
  zoom: number;
  pan: { x: number; y: number };
}

export interface GraphViewSettings {
  performance: {
    virtualizeNodes: boolean;
    maxVisibleNodes: number;
    lodLevels: number;
  };
  visual: {
    nodeMinSize: number;
    nodeMaxSize: number;
    linkOpacity: number;
    animationDuration: number;
    colorScheme: 'default' | 'dark' | 'light' | 'custom';
  };
  interaction: {
    enableDrag: boolean;
    enableZoom: boolean;
    enableHover: boolean;
    clickToFocus: boolean;
    doubleClickAction: 'zoom' | 'navigate' | 'expand';
  };
  layout: {
    forceStrength: number;
    linkDistance: number;
    collisionRadius: number;
    centeringStrength: number;
  };
} 