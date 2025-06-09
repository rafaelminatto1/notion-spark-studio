import { GraphNode, GraphLink, GraphCluster, CentralityMetrics, Community, PathResult } from '@/components/GraphView/types';

// 1. SMART CLUSTERING - Agrupamento inteligente por similaridade
export const performClustering = (nodes: GraphNode[]): GraphCluster[] => {
  const clusters: GraphCluster[] = [];
  
  // Função de similaridade entre dois nós
  const calculateSimilarity = (node1: GraphNode, node2: GraphNode): number => {
    // Similaridade de tags (Jaccard Index)
    const tagSimilarity = jaccard(node1.tags, node2.tags);
    
    // Similaridade de colaboradores
    const collaboratorSimilarity = jaccard(node1.collaborators, node2.collaborators);
    
    // Similaridade temporal (baseada na data de modificação)
    const timeDiff = Math.abs(node1.lastModified.getTime() - node2.lastModified.getTime());
    const maxTimeDiff = 30 * 24 * 60 * 60 * 1000; // 30 dias
    const timeSimilarity = Math.max(0, 1 - (timeDiff / maxTimeDiff));
    
    // Similaridade de tipo
    const typeSimilarity = node1.type === node2.type ? 1 : 0;
    
    // Similaridade de tamanho (word count)
    const sizeDiff = Math.abs(node1.wordCount - node2.wordCount);
    const maxSize = Math.max(node1.wordCount, node2.wordCount, 1000);
    const sizeSimilarity = Math.max(0, 1 - (sizeDiff / maxSize));
    
    // Peso combinado
    return (
      tagSimilarity * 0.35 +
      collaboratorSimilarity * 0.25 +
      timeSimilarity * 0.15 +
      typeSimilarity * 0.15 +
      sizeSimilarity * 0.1
    );
  };
  
  // K-means clustering adaptado para documentos
  const k = Math.min(Math.max(3, Math.floor(nodes.length / 10)), 12); // 3-12 clusters
  const maxIterations = 50;
  
  // Inicialização: selecionar centroides aleatórios
  let centroids: GraphNode[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push(nodes[Math.floor(Math.random() * nodes.length)]);
  }
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Atribuir nós aos clusters mais próximos
    const clusterAssignments = new Map<string, number>();
    
    for (const node of nodes) {
      let bestCluster = 0;
      let bestSimilarity = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const similarity = calculateSimilarity(node, centroids[i]);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCluster = i;
        }
      }
      
      clusterAssignments.set(node.id, bestCluster);
    }
    
    // Recalcular centroides
    const newCentroids: GraphNode[] = [];
    for (let i = 0; i < k; i++) {
      const clusterNodes = nodes.filter(node => clusterAssignments.get(node.id) === i);
      if (clusterNodes.length > 0) {
        // Encontrar nó mais representativo do cluster
        let bestNode = clusterNodes[0];
        let bestScore = 0;
        
        for (const candidate of clusterNodes) {
          let score = 0;
          for (const other of clusterNodes) {
            score += calculateSimilarity(candidate, other);
          }
          if (score > bestScore) {
            bestScore = score;
            bestNode = candidate;
          }
        }
        newCentroids.push(bestNode);
      } else {
        newCentroids.push(centroids[i]);
      }
    }
    
    centroids = newCentroids;
  }
  
  // Criar clusters finais
  const finalAssignments = new Map<string, number>();
  for (const node of nodes) {
    let bestCluster = 0;
    let bestSimilarity = 0;
    
    for (let i = 0; i < centroids.length; i++) {
      const similarity = calculateSimilarity(node, centroids[i]);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestCluster = i;
      }
    }
    
    finalAssignments.set(node.id, bestCluster);
  }
  
  // Construir objetos de cluster
  for (let i = 0; i < k; i++) {
    const clusterNodes = nodes.filter(node => finalAssignments.get(node.id) === i);
    
    if (clusterNodes.length > 0) {
      const mainTags = getMostFrequentTags(clusterNodes, 3);
      const mainCollaborators = getMostFrequentCollaborators(clusterNodes, 3);
      
      clusters.push({
        id: `cluster-${i}`,
        name: mainTags.length > 0 ? mainTags[0] : `Grupo ${i + 1}`,
        nodeIds: clusterNodes.map(n => n.id),
        color: generateClusterColor(i),
        center: { x: 0, y: 0 }, // Será calculado pelo layout
        radius: Math.sqrt(clusterNodes.length) * 20,
        similarity: calculateClusterCohesion(clusterNodes, calculateSimilarity),
        density: clusterNodes.length > 1 ? clusterNodes.length / ((clusterNodes.length - 1) * clusterNodes.length / 2) : 1,
        mainTags,
        mainCollaborators,
      });
    }
  }
  
  return clusters;
};

// 2. PATH FINDING - Dijkstra otimizado para encontrar caminhos
export const findShortestPath = (
  sourceId: string,
  targetId: string,
  links: GraphLink[]
): PathResult => {
  // Construir grafo de adjacência
  const graph = new Map<string, { nodeId: string; weight: number }[]>();
  
  for (const link of links) {
    const sourceKey = typeof link.source === 'string' ? link.source : link.source.id;
    const targetKey = typeof link.target === 'string' ? link.target : link.target.id;
    const weight = 1 / (link.strength || 0.5); // Inverter força para distância
    
    if (!graph.has(sourceKey)) graph.set(sourceKey, []);
    if (!graph.has(targetKey)) graph.set(targetKey, []);
    
    graph.get(sourceKey)!.push({ nodeId: targetKey, weight });
    if (link.bidirectional) {
      graph.get(targetKey)!.push({ nodeId: sourceKey, weight });
    }
  }
  
  // Algoritmo de Dijkstra
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const queue: { nodeId: string; distance: number }[] = [];
  
  // Inicialização
  distances.set(sourceId, 0);
  queue.push({ nodeId: sourceId, distance: 0 });
  
  while (queue.length > 0) {
    // Encontrar nó com menor distância
    queue.sort((a, b) => a.distance - b.distance);
    const current = queue.shift()!;
    
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);
    
    if (current.nodeId === targetId) break;
    
    const neighbors = graph.get(current.nodeId) || [];
    for (const neighbor of neighbors) {
      if (visited.has(neighbor.nodeId)) continue;
      
      const newDistance = current.distance + neighbor.weight;
      
      if (!distances.has(neighbor.nodeId) || newDistance < distances.get(neighbor.nodeId)!) {
        distances.set(neighbor.nodeId, newDistance);
        previous.set(neighbor.nodeId, current.nodeId);
        queue.push({ nodeId: neighbor.nodeId, distance: newDistance });
      }
    }
  }
  
  // Reconstruir caminho
  const path: string[] = [];
  let currentNode = targetId;
  
  while (currentNode && previous.has(currentNode)) {
    path.unshift(currentNode);
    currentNode = previous.get(currentNode)!;
  }
  
  if (currentNode === sourceId) {
    path.unshift(sourceId);
  }
  
  return {
    path,
    distance: distances.get(targetId) || Infinity,
    intermediateNodes: path.slice(1, -1),
    totalWeight: distances.get(targetId) || Infinity,
  };
};

// 3. ANÁLISE DE CENTRALIDADE
export const calculateCentrality = (
  nodes: GraphNode[],
  links: GraphLink[]
): CentralityMetrics => {
  const nodeIds = nodes.map(n => n.id);
  const n = nodeIds.length;
  
  // Construir matriz de adjacência
  const adjMatrix = new Map<string, Map<string, number>>();
  for (const nodeId of nodeIds) {
    adjMatrix.set(nodeId, new Map());
  }
  
  for (const link of links) {
    const sourceKey = typeof link.source === 'string' ? link.source : link.source.id;
    const targetKey = typeof link.target === 'string' ? link.target : link.target.id;
    const weight = link.strength || 0.5;
    
    adjMatrix.get(sourceKey)?.set(targetKey, weight);
    if (link.bidirectional) {
      adjMatrix.get(targetKey)?.set(sourceKey, weight);
    }
  }
  
  // Betweenness Centrality
  const betweenness = new Map<string, number>();
  for (const nodeId of nodeIds) {
    betweenness.set(nodeId, 0);
  }
  
  for (const source of nodeIds) {
    for (const target of nodeIds) {
      if (source === target) continue;
      
      const path = findShortestPath(source, target, links);
      if (path.path.length > 2) {
        for (const intermediate of path.intermediateNodes) {
          betweenness.set(intermediate, (betweenness.get(intermediate) || 0) + 1);
        }
      }
    }
  }
  
  // Normalizar betweenness
  const maxBetweenness = Math.max(...Array.from(betweenness.values()));
  if (maxBetweenness > 0) {
    for (const [nodeId, value] of betweenness) {
      betweenness.set(nodeId, value / maxBetweenness);
    }
  }
  
  // Closeness Centrality
  const closeness = new Map<string, number>();
  for (const nodeId of nodeIds) {
    let totalDistance = 0;
    let reachableNodes = 0;
    
    for (const otherId of nodeIds) {
      if (nodeId === otherId) continue;
      
      const path = findShortestPath(nodeId, otherId, links);
      if (path.path.length > 0 && path.distance < Infinity) {
        totalDistance += path.distance;
        reachableNodes++;
      }
    }
    
    closeness.set(nodeId, reachableNodes > 0 ? reachableNodes / totalDistance : 0);
  }
  
  // PageRank (algoritmo simplificado)
  const pageRank = new Map<string, number>();
  const dampingFactor = 0.85;
  const iterations = 100;
  
  // Inicialização
  for (const nodeId of nodeIds) {
    pageRank.set(nodeId, 1 / n);
  }
  
  for (let i = 0; i < iterations; i++) {
    const newPageRank = new Map<string, number>();
    
    for (const nodeId of nodeIds) {
      let sum = 0;
      
      for (const otherId of nodeIds) {
        if (adjMatrix.get(otherId)?.has(nodeId)) {
          const outDegree = adjMatrix.get(otherId)?.size || 1;
          sum += (pageRank.get(otherId) || 0) / outDegree;
        }
      }
      
      newPageRank.set(nodeId, (1 - dampingFactor) / n + dampingFactor * sum);
    }
    
    // Copiar valores
    for (const [nodeId, value] of newPageRank) {
      pageRank.set(nodeId, value);
    }
  }
  
  // Centralidade combinada
  const combined = new Map<string, number>();
  for (const nodeId of nodeIds) {
    const b = betweenness.get(nodeId) || 0;
    const c = closeness.get(nodeId) || 0;
    const p = pageRank.get(nodeId) || 0;
    
    // Normalizar closeness e pagerank
    const maxCloseness = Math.max(...Array.from(closeness.values()));
    const maxPageRank = Math.max(...Array.from(pageRank.values()));
    
    const normalizedC = maxCloseness > 0 ? c / maxCloseness : 0;
    const normalizedP = maxPageRank > 0 ? p / maxPageRank : 0;
    
    combined.set(nodeId, (b * 0.4) + (normalizedC * 0.3) + (normalizedP * 0.3));
  }
  
  return { betweenness, closeness, pageRank, combined };
};

// 4. DETECÇÃO DE COMUNIDADES (Algoritmo de Louvain simplificado)
export const detectCommunities = (links: GraphLink[]): Community[] => {
  const communities: Community[] = [];
  const nodeIds = new Set<string>();
  
  // Extrair todos os nós únicos
  for (const link of links) {
    const sourceKey = typeof link.source === 'string' ? link.source : link.source.id;
    const targetKey = typeof link.target === 'string' ? link.target : link.target.id;
    nodeIds.add(sourceKey);
    nodeIds.add(targetKey);
  }
  
  const nodes = Array.from(nodeIds);
  
  // Inicialização: cada nó em sua própria comunidade
  const nodeToCommunity = new Map<string, number>();
  for (let i = 0; i < nodes.length; i++) {
    nodeToCommunity.set(nodes[i], i);
  }
  
  let improved = true;
  let iteration = 0;
  const maxIterations = 10;
  
  while (improved && iteration < maxIterations) {
    improved = false;
    iteration++;
    
    for (const node of nodes) {
      const currentCommunity = nodeToCommunity.get(node)!;
      let bestCommunity = currentCommunity;
      let bestGain = 0;
      
      // Testar mudança para comunidades vizinhas
      const neighborCommunities = new Set<number>();
      for (const link of links) {
        const sourceKey = typeof link.source === 'string' ? link.source : link.source.id;
        const targetKey = typeof link.target === 'string' ? link.target : link.target.id;
        
        if (sourceKey === node) {
          neighborCommunities.add(nodeToCommunity.get(targetKey)!);
        } else if (targetKey === node) {
          neighborCommunities.add(nodeToCommunity.get(sourceKey)!);
        }
      }
      
      for (const community of neighborCommunities) {
        if (community === currentCommunity) continue;
        
        const gain = calculateModularityGain(node, community, nodeToCommunity, links);
        if (gain > bestGain) {
          bestGain = gain;
          bestCommunity = community;
        }
      }
      
      if (bestCommunity !== currentCommunity) {
        nodeToCommunity.set(node, bestCommunity);
        improved = true;
      }
    }
  }
  
  // Construir comunidades finais
  const communityMap = new Map<number, string[]>();
  for (const [nodeId, communityId] of nodeToCommunity) {
    if (!communityMap.has(communityId)) {
      communityMap.set(communityId, []);
    }
    communityMap.get(communityId)!.push(nodeId);
  }
  
  let communityIndex = 0;
  for (const [_, members] of communityMap) {
    if (members.length > 1) { // Ignorar comunidades de 1 nó
      communities.push({
        id: `community-${communityIndex}`,
        members,
        strength: calculateCommunityStrength(members, links),
        color: generateCommunityColor(communityIndex),
      });
      communityIndex++;
    }
  }
  
  return communities;
};

// FUNÇÕES AUXILIARES

function jaccard(set1: string[], set2: string[]): number {
  const s1 = new Set(set1);
  const s2 = new Set(set2);
  const intersection = new Set([...s1].filter(x => s2.has(x)));
  const union = new Set([...s1, ...s2]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
}

function getMostFrequentTags(nodes: GraphNode[], count: number): string[] {
  const tagCounts = new Map<string, number>();
  
  for (const node of nodes) {
    for (const tag of node.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([tag]) => tag);
}

function getMostFrequentCollaborators(nodes: GraphNode[], count: number): string[] {
  const collaboratorCounts = new Map<string, number>();
  
  for (const node of nodes) {
    for (const collaborator of node.collaborators) {
      collaboratorCounts.set(collaborator, (collaboratorCounts.get(collaborator) || 0) + 1);
    }
  }
  
  return Array.from(collaboratorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([collaborator]) => collaborator);
}

function calculateClusterCohesion(
  nodes: GraphNode[],
  similarityFn: (a: GraphNode, b: GraphNode) => number
): number {
  if (nodes.length <= 1) return 1;
  
  let totalSimilarity = 0;
  let pairCount = 0;
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      totalSimilarity += similarityFn(nodes[i], nodes[j]);
      pairCount++;
    }
  }
  
  return pairCount > 0 ? totalSimilarity / pairCount : 0;
}

function generateClusterColor(index: number): string {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];
  return colors[index % colors.length];
}

function generateCommunityColor(index: number): string {
  const colors = [
    '#1e40af', '#059669', '#d97706', '#dc2626', '#7c3aed',
    '#0891b2', '#65a30d', '#ea580c', '#db2777', '#4f46e5'
  ];
  return colors[index % colors.length];
}

function calculateModularityGain(
  node: string,
  targetCommunity: number,
  nodeToCommunity: Map<string, number>,
  links: GraphLink[]
): number {
  // Implementação simplificada do ganho de modularidade
  let internalLinks = 0;
  let externalLinks = 0;
  
  for (const link of links) {
    const sourceKey = typeof link.source === 'string' ? link.source : link.source.id;
    const targetKey = typeof link.target === 'string' ? link.target : link.target.id;
    
    if (sourceKey === node || targetKey === node) {
      const otherNode = sourceKey === node ? targetKey : sourceKey;
      const otherCommunity = nodeToCommunity.get(otherNode);
      
      if (otherCommunity === targetCommunity) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    }
  }
  
  return internalLinks - externalLinks * 0.5;
}

function calculateCommunityStrength(members: string[], links: GraphLink[]): number {
  let internalLinks = 0;
  let totalLinks = 0;
  
  const memberSet = new Set(members);
  
  for (const link of links) {
    const sourceKey = typeof link.source === 'string' ? link.source : link.source.id;
    const targetKey = typeof link.target === 'string' ? link.target : link.target.id;
    
    if (memberSet.has(sourceKey) || memberSet.has(targetKey)) {
      totalLinks++;
      if (memberSet.has(sourceKey) && memberSet.has(targetKey)) {
        internalLinks++;
      }
    }
  }
  
  return totalLinks > 0 ? internalLinks / totalLinks : 0;
} 