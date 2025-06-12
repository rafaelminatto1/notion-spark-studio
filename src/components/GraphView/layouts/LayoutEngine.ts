import { GraphNode, GraphLink } from '../types';

export interface LayoutConfig {
  type: 'force' | 'hierarchical' | 'circular' | 'timeline' | 'cluster';
  width: number;
  height: number;
  animate?: boolean;
  duration?: number;
}

export interface Position {
  x: number;
  y: number;
}

export class LayoutEngine {
  static applyLayout(
    nodes: GraphNode[], 
    links: GraphLink[], 
    config: LayoutConfig
  ): GraphNode[] {
    switch (config.type) {
      case 'hierarchical':
        return this.applyHierarchicalLayout(nodes, links, config);
      case 'circular':
        return this.applyCircularLayout(nodes, config);
      case 'timeline':
        return this.applyTimelineLayout(nodes, config);
      case 'cluster':
        return this.applyClusterLayout(nodes, links, config);
      default:
        return this.applyForceLayout(nodes, config);
    }
  }

  private static applyForceLayout(nodes: GraphNode[], config: LayoutConfig): GraphNode[] {
    // Force layout será gerenciado pelo ForceGraph2D
    return nodes.map(node => ({
      ...node,
      x: node.x || Math.random() * config.width,
      y: node.y || Math.random() * config.height,
    }));
  }

  private static applyHierarchicalLayout(
    nodes: GraphNode[], 
    links: GraphLink[], 
    config: LayoutConfig
  ): GraphNode[] {
    // Criar estrutura hierárquica baseada nos links parent-child
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const children = new Map<string, string[]>();
    const parents = new Map<string, string>();
    
    // Identificar relações parent-child
    links.forEach(link => {
      if (link.type === 'parent') {
        const parentId = typeof link.source === 'string' ? link.source : link.source.id;
        const childId = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (!children.has(parentId)) children.set(parentId, []);
        children.get(parentId)!.push(childId);
        parents.set(childId, parentId);
      }
    });

    // Encontrar nós raiz
    const rootNodes = nodes.filter(n => !parents.has(n.id));
    const levelHeight = config.height / (this.getMaxDepth(rootNodes, children) + 1);
    
    return this.positionHierarchically(nodes, rootNodes, children, config.width, levelHeight);
  }

  private static getMaxDepth(roots: GraphNode[], children: Map<string, string[]>): number {
    let maxDepth = 0;
    
    const traverse = (nodeId: string, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      const childIds = children.get(nodeId) || [];
      childIds.forEach(childId => traverse(childId, depth + 1));
    };
    
    roots.forEach(root => traverse(root.id, 0));
    return maxDepth;
  }

  private static positionHierarchically(
    allNodes: GraphNode[],
    rootNodes: GraphNode[],
    children: Map<string, string[]>,
    width: number,
    levelHeight: number
  ): GraphNode[] {
    const positioned = new Map<string, Position>();
    const nodesByLevel = new Map<number, string[]>();
    
    // Organizar nós por nível
    const organizeByLevel = (nodeId: string, level: number) => {
      if (!nodesByLevel.has(level)) nodesByLevel.set(level, []);
      nodesByLevel.get(level)!.push(nodeId);
      
      const childIds = children.get(nodeId) || [];
      childIds.forEach(childId => organizeByLevel(childId, level + 1));
    };
    
    rootNodes.forEach(root => organizeByLevel(root.id, 0));
    
    // Posicionar nós
    nodesByLevel.forEach((nodeIds, level) => {
      const levelWidth = width / (nodeIds.length + 1);
      nodeIds.forEach((nodeId, index) => {
        positioned.set(nodeId, {
          x: levelWidth * (index + 1),
          y: levelHeight * level + 50
        });
      });
    });
    
    return allNodes.map(node => ({
      ...node,
      ...positioned.get(node.id),
      fx: positioned.get(node.id)?.x,
      fy: positioned.get(node.id)?.y,
    }));
  }

  private static applyCircularLayout(nodes: GraphNode[], config: LayoutConfig): GraphNode[] {
    const centerX = config.width / 2;
    const centerY = config.height / 2;
    const radius = Math.min(config.width, config.height) * 0.35;
    
    return nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        fx: centerX + radius * Math.cos(angle),
        fy: centerY + radius * Math.sin(angle),
      };
    });
  }

  private static applyTimelineLayout(nodes: GraphNode[], config: LayoutConfig): GraphNode[] {
    // Ordenar por data de modificação
    const sortedNodes = [...nodes].sort((a, b) => 
      new Date(a.metadata.lastModified).getTime() - new Date(b.metadata.lastModified).getTime()
    );
    
    const timelineWidth = config.width * 0.8;
    const startX = config.width * 0.1;
    const centerY = config.height / 2;
    
    return sortedNodes.map((node, index) => {
      const x = startX + (timelineWidth * index) / (sortedNodes.length - 1 || 1);
      
      // Adicionar variação Y baseada no tipo
      const typeOffsets = {
        'file': 0,
        'folder': -50,
        'database': 50,
        'tag': -100
      };
      
      return {
        ...node,
        x,
        y: centerY + (typeOffsets[node.type] || 0) + (Math.random() - 0.5) * 100,
        fx: x,
        fy: centerY + (typeOffsets[node.type] || 0) + (Math.random() - 0.5) * 100,
      };
    });
  }

  private static applyClusterLayout(
    nodes: GraphNode[], 
    links: GraphLink[], 
    config: LayoutConfig
  ): GraphNode[] {
    // Detectar clusters baseado em conexões
    const clusters = this.detectClusters(nodes, links);
    const clusterCenters = this.calculateClusterCenters(clusters, config);
    
    return nodes.map(node => {
      const cluster = clusters.find(c => c.nodes.includes(node.id));
      if (!cluster) return node;
      
      const center = clusterCenters.get(cluster.id);
      if (!center) return node;
      
      // Posição dentro do cluster
      const nodeIndex = cluster.nodes.indexOf(node.id);
      const clusterRadius = Math.min(80, Math.sqrt(cluster.nodes.length) * 20);
      const angle = (2 * Math.PI * nodeIndex) / cluster.nodes.length;
      
      return {
        ...node,
        x: center.x + clusterRadius * Math.cos(angle),
        y: center.y + clusterRadius * Math.sin(angle),
        fx: center.x + clusterRadius * Math.cos(angle),
        fy: center.y + clusterRadius * Math.sin(angle),
        cluster: cluster.id,
      };
    });
  }

  private static detectClusters(nodes: GraphNode[], links: GraphLink[]) {
    // Algoritmo simples de detecção de clusters
    const adjacency = new Map<string, Set<string>>();
    
    // Construir grafo de adjacência
    nodes.forEach(node => adjacency.set(node.id, new Set()));
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      adjacency.get(sourceId)?.add(targetId);
      adjacency.get(targetId)?.add(sourceId);
    });
    
    const visited = new Set<string>();
    const clusters: { id: string; nodes: string[] }[] = [];
    
    // DFS para encontrar componentes conectados
    const dfs = (nodeId: string, cluster: string[]) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      cluster.push(nodeId);
      
      adjacency.get(nodeId)?.forEach(neighborId => {
        dfs(neighborId, cluster);
      });
    };
    
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster: string[] = [];
        dfs(node.id, cluster);
        
        if (cluster.length > 1) {
          clusters.push({
            id: `cluster-${clusters.length}`,
            nodes: cluster
          });
        }
      }
    });
    
    return clusters;
  }

  private static calculateClusterCenters(
    clusters: { id: string; nodes: string[] }[], 
    config: LayoutConfig
  ): Map<string, Position> {
    const centers = new Map<string, Position>();
    const gridSize = Math.ceil(Math.sqrt(clusters.length));
    const cellWidth = config.width / gridSize;
    const cellHeight = config.height / gridSize;
    
    clusters.forEach((cluster, index) => {
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      
      centers.set(cluster.id, {
        x: cellWidth * (col + 0.5),
        y: cellHeight * (row + 0.5)
      });
    });
    
    return centers;
  }
} 