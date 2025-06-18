import { useMemo } from 'react';
import type { GraphNode, GraphLink } from '@/components/GraphView/types';

export interface NetworkMetrics {
  // Centralidade
  degreeCentrality: Map<string, number>;
  betweennessCentrality: Map<string, number>;
  closenessCentrality: Map<string, number>;
  
  // Comunidades
  communities: Array<{
    id: string;
    nodes: string[];
    strength: number;
    color: string;
  }>;
  
  // Métricas globais
  density: number;
  averagePathLength: number;
  clusteringCoefficient: number;
  diameter: number;
  
  // Nós importantes
  hubs: string[];
  bridges: string[];
  isolatedNodes: string[];
}

export interface PathResult {
  path: string[];
  distance: number;
  found: boolean;
  intermediateNodes: string[];
}

export function useNetworkAnalysis(nodes: GraphNode[], links: GraphLink[]) {
  // Construir grafo de adjacência
  const adjacencyMatrix = useMemo(() => {
    const matrix = new Map<string, Set<string>>();
    
    nodes.forEach(node => {
      matrix.set(node.id, new Set());
    });
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      matrix.get(sourceId)?.add(targetId);
      if (link.bidirectional !== false) {
        matrix.get(targetId)?.add(sourceId);
      }
    });
    
    return matrix;
  }, [nodes, links]);

  // Calcular métricas de rede
  const networkMetrics = useMemo((): NetworkMetrics => {
    if (nodes.length === 0) {
      return {
        degreeCentrality: new Map(),
        betweennessCentrality: new Map(),
        closenessCentrality: new Map(),
        communities: [],
        density: 0,
        averagePathLength: 0,
        clusteringCoefficient: 0,
        diameter: 0,
        hubs: [],
        bridges: [],
        isolatedNodes: [],
      };
    }

    // Degree Centrality
    const degreeCentrality = new Map<string, number>();
    nodes.forEach(node => {
      const degree = adjacencyMatrix.get(node.id)?.size || 0;
      degreeCentrality.set(node.id, degree);
    });

    // Betweenness Centrality (simplificado)
    const betweennessCentrality = calculateBetweennessCentrality(nodes, adjacencyMatrix);
    
    // Closeness Centrality
    const closenessCentrality = calculateClosenessCentrality(nodes, adjacencyMatrix);

    // Detectar comunidades
    const communities = detectCommunities(nodes, adjacencyMatrix);

    // Métricas globais
    const density = calculateDensity(nodes.length, links.length);
    const { averagePathLength, diameter } = calculatePathMetrics(nodes, adjacencyMatrix);
    const clusteringCoefficient = calculateClusteringCoefficient(nodes, adjacencyMatrix);

    // Identificar nós especiais
    const hubs = identifyHubs(degreeCentrality, betweennessCentrality);
    const bridges = identifyBridges(nodes, links, adjacencyMatrix);
    const isolatedNodes = Array.from(degreeCentrality.entries())
      .filter(([_, degree]) => degree === 0)
      .map(([nodeId, _]) => nodeId);

    return {
      degreeCentrality,
      betweennessCentrality,
      closenessCentrality,
      communities,
      density,
      averagePathLength,
      clusteringCoefficient,
      diameter,
      hubs,
      bridges,
      isolatedNodes,
    };
  }, [nodes, adjacencyMatrix, links]);

  // Função para encontrar caminho otimizado
  const findOptimalPath = useMemo(() => {
    return (startId: string, endId: string): PathResult => {
      return findPathDijkstra(startId, endId, adjacencyMatrix);
    };
  }, [adjacencyMatrix]);

  // Função para análise de vizinhança
  const analyzeNeighborhood = useMemo(() => {
    return (nodeId: string, depth = 2) => {
      const visited = new Set<string>();
      const levels = new Map<number, string[]>();
      const queue: Array<{id: string, level: number}> = [{id: nodeId, level: 0}];
      
      while (queue.length > 0) {
        const { id, level } = queue.shift()!;
        
        if (visited.has(id) || level > depth) continue;
        visited.add(id);
        
        if (!levels.has(level)) levels.set(level, []);
        levels.get(level)!.push(id);
        
        const neighbors = adjacencyMatrix.get(id) || new Set();
        neighbors.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            queue.push({id: neighborId, level: level + 1});
          }
        });
      }
      
      return {
        center: nodeId,
        levels: Object.fromEntries(levels.entries()),
        totalNodes: visited.size,
        depth: Math.max(...levels.keys())
      };
    };
  }, [adjacencyMatrix]);

  return {
    networkMetrics,
    adjacencyMatrix,
    findOptimalPath,
    analyzeNeighborhood,
  };
}

// Funções auxiliares
function calculateBetweennessCentrality(
  nodes: GraphNode[], 
  adjacency: Map<string, Set<string>>
): Map<string, number> {
  const centrality = new Map<string, number>();
  nodes.forEach(node => centrality.set(node.id, 0));

  // Algoritmo simplificado de betweenness centrality
  nodes.forEach(source => {
    nodes.forEach(target => {
      if (source.id === target.id) return;
      
      const path = findShortestPathBFS(source.id, target.id, adjacency);
      if (path.length === 0) return;
      
      for (let i = 1; i < path.length - 1; i++) {
        const nodeId = path[i];
        centrality.set(nodeId, (centrality.get(nodeId) || 0) + 1);
      }
    });
  });

  return centrality;
}

function calculateClosenessCentrality(
  nodes: GraphNode[], 
  adjacency: Map<string, Set<string>>
): Map<string, number> {
  const centrality = new Map<string, number>();

  nodes.forEach(node => {
    let totalDistance = 0;
    let reachableNodes = 0;

    nodes.forEach(other => {
      if (node.id === other.id) return;
      
      const path = findShortestPathBFS(node.id, other.id, adjacency);
      if (path.length > 0) {
        totalDistance += path.length - 1;
        reachableNodes++;
      }
    });

    const closeness = reachableNodes > 0 ? reachableNodes / totalDistance : 0;
    centrality.set(node.id, closeness);
  });

  return centrality;
}

function detectCommunities(
  nodes: GraphNode[], 
  adjacency: Map<string, Set<string>>
): Array<{id: string; nodes: string[]; strength: number; color: string}> {
  const visited = new Set<string>();
  const communities: Array<{id: string; nodes: string[]; strength: number; color: string}> = [];
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

  nodes.forEach(node => {
    if (visited.has(node.id)) return;

    const community: string[] = [];
    const stack = [node.id];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;

      visited.add(currentId);
      community.push(currentId);

      const neighbors = adjacency.get(currentId) || new Set();
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          stack.push(neighborId);
        }
      });
    }

    if (community.length > 1) {
      communities.push({
        id: `community-${communities.length}`,
        nodes: community,
        strength: 0.8,
        color: colors[communities.length % colors.length]
      });
    }
  });

  return communities;
}

function calculateDensity(numNodes: number, numLinks: number): number {
  if (numNodes <= 1) return 0;
  const maxPossibleLinks = numNodes * (numNodes - 1) / 2;
  return numLinks / maxPossibleLinks;
}

function calculatePathMetrics(
  nodes: GraphNode[], 
  adjacency: Map<string, Set<string>>
): {averagePathLength: number; diameter: number} {
  let totalPathLength = 0;
  let pathCount = 0;
  let maxDistance = 0;

  nodes.forEach(source => {
    nodes.forEach(target => {
      if (source.id === target.id) return;
      
      const path = findShortestPathBFS(source.id, target.id, adjacency);
      if (path.length > 0) {
        const distance = path.length - 1;
        totalPathLength += distance;
        pathCount++;
        maxDistance = Math.max(maxDistance, distance);
      }
    });
  });

  return {
    averagePathLength: pathCount > 0 ? totalPathLength / pathCount : 0,
    diameter: maxDistance
  };
}

function calculateClusteringCoefficient(
  nodes: GraphNode[], 
  adjacency: Map<string, Set<string>>
): number {
  let totalCoefficient = 0;

  nodes.forEach(node => {
    const neighbors = Array.from(adjacency.get(node.id) || []);
    if (neighbors.length < 2) return;

    let triangles = 0;
    const possibleTriangles = neighbors.length * (neighbors.length - 1) / 2;

    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const neighbor1 = neighbors[i];
        const neighbor2 = neighbors[j];
        
        if (adjacency.get(neighbor1)?.has(neighbor2)) {
          triangles++;
        }
      }
    }

    totalCoefficient += triangles / possibleTriangles;
  });

  return totalCoefficient / nodes.length;
}

function identifyHubs(
  degreeCentrality: Map<string, number>, 
  betweennessCentrality: Map<string, number>
): string[] {
  const degreeThreshold = Math.max(...degreeCentrality.values()) * 0.7;
  const betweennessThreshold = Math.max(...betweennessCentrality.values()) * 0.7;

  const hubs: string[] = [];
  
  degreeCentrality.forEach((degree, nodeId) => {
    const betweenness = betweennessCentrality.get(nodeId) || 0;
    if (degree >= degreeThreshold || betweenness >= betweennessThreshold) {
      hubs.push(nodeId);
    }
  });

  return hubs;
}

function identifyBridges(
  nodes: GraphNode[], 
  links: GraphLink[], 
  adjacency: Map<string, Set<string>>
): string[] {
  // Simplificado: nós com alto betweenness centrality e grau moderado
  const betweenness = calculateBetweennessCentrality(nodes, adjacency);
  const degree = new Map<string, number>();
  
  nodes.forEach(node => {
    degree.set(node.id, adjacency.get(node.id)?.size || 0);
  });

  const bridges: string[] = [];
  const betweennessThreshold = Math.max(...betweenness.values()) * 0.5;

  betweenness.forEach((value, nodeId) => {
    const nodeDegree = degree.get(nodeId) || 0;
    if (value >= betweennessThreshold && nodeDegree >= 2 && nodeDegree <= 5) {
      bridges.push(nodeId);
    }
  });

  return bridges;
}

function findShortestPathBFS(
  start: string, 
  end: string, 
  adjacency: Map<string, Set<string>>
): string[] {
  if (start === end) return [start];

  const visited = new Set<string>();
  const queue: Array<{node: string, path: string[]}> = [{node: start, path: [start]}];
  visited.add(start);

  while (queue.length > 0) {
    const {node, path} = queue.shift()!;

    const neighbors = adjacency.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (neighbor === end) {
        return [...path, neighbor];
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({node: neighbor, path: [...path, neighbor]});
      }
    }
  }

  return [];
}

function findPathDijkstra(
  start: string, 
  end: string, 
  adjacency: Map<string, Set<string>>
): PathResult {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  // Inicializar
  adjacency.forEach((_, nodeId) => {
    distances.set(nodeId, Infinity);
    previous.set(nodeId, null);
    unvisited.add(nodeId);
  });
  
  distances.set(start, 0);

  while (unvisited.size > 0) {
    // Encontrar nó não visitado com menor distância
    let current: string | null = null;
    let minDistance = Infinity;
    
    unvisited.forEach(nodeId => {
      const distance = distances.get(nodeId) || Infinity;
      if (distance < minDistance) {
        minDistance = distance;
        current = nodeId;
      }
    });

    if (!current || minDistance === Infinity) break;
    unvisited.delete(current);

    if (current === end) break;

    const neighbors = adjacency.get(current) || new Set();
    neighbors.forEach(neighbor => {
      if (!unvisited.has(neighbor)) return;

      const alt = (distances.get(current) || 0) + 1; // Peso uniforme
      if (alt < (distances.get(neighbor) || Infinity)) {
        distances.set(neighbor, alt);
        previous.set(neighbor, current);
      }
    });
  }

  // Reconstruir caminho
  const path: string[] = [];
  let current: string | null = end;
  
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
  }

  const found = path[0] === start && path[path.length - 1] === end;
  
  return {
    path: found ? path : [],
    distance: found ? (distances.get(end) || 0) : Infinity,
    found,
    intermediateNodes: found ? path.slice(1, -1) : []
  };
} 