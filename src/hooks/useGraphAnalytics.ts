import { useMemo } from 'react';
import type { GraphNode, GraphLink, GraphCluster, GraphAnalytics, PathFindingResult } from '@/types/graph';

export const useGraphAnalytics = (nodes: GraphNode[], links: GraphLink[]) => {
  // Análise de centralidade
  const centralityAnalysis = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    nodes.forEach(node => nodeMap.set(node.id, node));

    // Degree Centrality
    const degreeCentrality = new Map<string, number>();
    nodes.forEach(node => {
      const degree = links.filter(link => 
        link.source === node.id || link.target === node.id
      ).length;
      degreeCentrality.set(node.id, degree);
    });

    // Betweenness Centrality (simplificado)
    const betweennessCentrality = new Map<string, number>();
    nodes.forEach(sourceNode => {
      let betweenness = 0;
      nodes.forEach(targetNode => {
        if (sourceNode.id !== targetNode.id) {
          const paths = findAllPaths(sourceNode.id, targetNode.id, nodes, links);
          if (paths.length > 0) {
            const shortestPathLength = Math.min(...paths.map(p => p.length));
            const shortestPaths = paths.filter(p => p.length === shortestPathLength);
            
            nodes.forEach(intermediateNode => {
              if (intermediateNode.id !== sourceNode.id && intermediateNode.id !== targetNode.id) {
                const pathsThrough = shortestPaths.filter(path => 
                  path.includes(intermediateNode.id)
                ).length;
                betweenness += pathsThrough / shortestPaths.length;
              }
            });
          }
        }
      });
      betweennessCentrality.set(sourceNode.id, betweenness);
    });

    // Closeness Centrality
    const closenessCentrality = new Map<string, number>();
    nodes.forEach(node => {
      let totalDistance = 0;
      let reachableNodes = 0;
      
      nodes.forEach(otherNode => {
        if (node.id !== otherNode.id) {
          const shortestPath = dijkstra(node.id, otherNode.id, nodes, links);
          if (shortestPath.distance < Infinity) {
            totalDistance += shortestPath.distance;
            reachableNodes++;
          }
        }
      });
      
      const closeness = reachableNodes > 0 ? reachableNodes / totalDistance : 0;
      closenessCentrality.set(node.id, closeness);
    });

    return { degreeCentrality, betweennessCentrality, closenessCentrality };
  }, [nodes, links]);

  // Community Detection simplificado
  const communityDetection = useMemo(() => {
    const communities = new Map<string, string>();
    const nodeConnections = new Map<string, Set<string>>();

    // Inicializar conexões
    nodes.forEach(node => {
      nodeConnections.set(node.id, new Set());
      communities.set(node.id, node.id);
    });

    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      
      nodeConnections.get(sourceId)?.add(targetId);
      nodeConnections.get(targetId)?.add(sourceId);
    });

    // Agrupar nós por comunidade baseado em tags ou conexões
    const clusters = new Map<string, GraphCluster>();
    nodes.forEach(node => {
      const clusterId = node.cluster || node.metadata.tags[0] || 'default';
      
      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, {
          id: clusterId,
          name: `Cluster ${clusterId}`,
          color: generateClusterColor(clusterId),
          nodes: [],
          center: { x: 0, y: 0 },
          radius: 0
        });
      }
      clusters.get(clusterId)!.nodes.push(node.id);
    });

    return Array.from(clusters.values());
  }, [nodes, links]);

  // Path Finding com Dijkstra
  const findShortestPath = (sourceId: string, targetId: string): PathFindingResult => {
    return dijkstra(sourceId, targetId, nodes, links);
  };

  // Análise geral da rede
  const networkAnalytics: GraphAnalytics = useMemo(() => {
    const totalPossibleEdges = nodes.length * (nodes.length - 1) / 2;
    const networkDensity = links.length / totalPossibleEdges;

    // Calcular caminho médio
    let totalPathLength = 0;
    let pathCount = 0;
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const path = dijkstra(nodes[i].id, nodes[j].id, nodes, links);
        if (path.distance < Infinity) {
          totalPathLength += path.distance;
          pathCount++;
        }
      }
    }
    
    const averagePathLength = pathCount > 0 ? totalPathLength / pathCount : 0;

    // Coeficiente de clustering
    let clusteringCoefficient = 0;
    nodes.forEach(node => {
      const neighbors = getNeighbors(node.id, links);
      if (neighbors.length > 1) {
        const possibleEdges = neighbors.length * (neighbors.length - 1) / 2;
        let actualEdges = 0;
        
        for (let i = 0; i < neighbors.length; i++) {
          for (let j = i + 1; j < neighbors.length; j++) {
            if (areConnected(neighbors[i], neighbors[j], links)) {
              actualEdges++;
            }
          }
        }
        
        clusteringCoefficient += actualEdges / possibleEdges;
      }
    });
    clusteringCoefficient /= nodes.length;

    // Nós centrais (top 10% por centralidade)
    const centralNodes = nodes
      .map(node => ({
        ...node,
        centrality: centralityAnalysis.degreeCentrality.get(node.id) || 0
      }))
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, Math.max(1, Math.floor(nodes.length * 0.1)));

    // Nós ponte (alto betweenness)
    const bridgeNodes = nodes
      .map(node => ({
        ...node,
        betweenness: centralityAnalysis.betweennessCentrality.get(node.id) || 0
      }))
      .sort((a, b) => b.betweenness - a.betweenness)
      .slice(0, Math.max(1, Math.floor(nodes.length * 0.05)));

    // Nós isolados
    const isolatedNodes = nodes.filter(node => 
      !links.some(link => link.source === node.id || link.target === node.id)
    );

    return {
      networkDensity,
      averagePathLength,
      clusteringCoefficient,
      communities: communityDetection,
      centralNodes,
      bridgeNodes,
      isolatedNodes
    };
  }, [nodes, links, centralityAnalysis, communityDetection]);

  return {
    centralityAnalysis,
    communityDetection,
    networkAnalytics,
    findShortestPath
  };
};

// Funções auxiliares
function findAllPaths(sourceId: string, targetId: string, nodes: GraphNode[], links: GraphLink[], maxDepth = 4): string[][] {
  const paths: string[][] = [];
  
  function dfs(currentPath: string[], visited: Set<string>, depth: number) {
    if (depth > maxDepth) return;
    
    const currentNode = currentPath[currentPath.length - 1];
    if (currentNode === targetId) {
      paths.push([...currentPath]);
      return;
    }
    
    const neighbors = getNeighbors(currentNode, links);
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        dfs([...currentPath, neighborId], visited, depth + 1);
        visited.delete(neighborId);
      }
    });
  }
  
  dfs([sourceId], new Set([sourceId]), 0);
  return paths;
}

function dijkstra(sourceId: string, targetId: string, nodes: GraphNode[], links: GraphLink[]): PathFindingResult {
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  // Inicializar
  nodes.forEach(node => {
    distances.set(node.id, node.id === sourceId ? 0 : Infinity);
    previous.set(node.id, null);
    unvisited.add(node.id);
  });

  while (unvisited.size > 0) {
    let currentNode: string | null = null;
    let minDistance = Infinity;
    
    unvisited.forEach(nodeId => {
      const distance = distances.get(nodeId)!;
      if (distance < minDistance) {
        minDistance = distance;
        currentNode = nodeId;
      }
    });

    if (!currentNode || minDistance === Infinity) break;
    
    unvisited.delete(currentNode);
    
    if (currentNode === targetId) break;

    const neighbors = getNeighbors(currentNode, links);
    neighbors.forEach(neighborId => {
      if (unvisited.has(neighborId)) {
        const edgeWeight = 1;
        const newDistance = distances.get(currentNode)! + edgeWeight;
        
        if (newDistance < distances.get(neighborId)!) {
          distances.set(neighborId, newDistance);
          previous.set(neighborId, currentNode);
        }
      }
    });
  }

  const path: string[] = [];
  let current: string | null = targetId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
  }

  const distance = distances.get(targetId) || Infinity;
  const pathNodes = path.map(nodeId => nodes.find(n => n.id === nodeId)!).filter(Boolean);

  return {
    path,
    distance,
    weight: distance,
    nodes: pathNodes
  };
}

function getNeighbors(nodeId: string, links: GraphLink[]): string[] {
  const neighbors: string[] = [];
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    if (sourceId === nodeId) {
      neighbors.push(targetId);
    } else if (targetId === nodeId && link.bidirectional) {
      neighbors.push(sourceId);
    }
  });
  
  return neighbors;
}

function areConnected(nodeId1: string, nodeId2: string, links: GraphLink[]): boolean {
  return links.some(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    return (sourceId === nodeId1 && targetId === nodeId2) ||
           (sourceId === nodeId2 && targetId === nodeId1 && link.bidirectional);
  });
}

function getEdgeWeight(nodeId1: string, nodeId2: string, links: GraphLink[]): number {
  const link = links.find(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    return (sourceId === nodeId1 && targetId === nodeId2) ||
           (sourceId === nodeId2 && targetId === nodeId1 && link.bidirectional);
  });
  
  return link?.weight ?? 1;
}

function generateClusterColor(clusterId: string): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];
  
  let hash = 0;
  for (let i = 0; i < clusterId.length; i++) {
    const char = clusterId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
} 