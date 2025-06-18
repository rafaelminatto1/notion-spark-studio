import type { GraphNode, GraphLink, GraphCluster, CentralityMetrics, Community, PathResult } from '@/components/GraphView/types';

export const performClustering = (nodes: GraphNode[]): GraphCluster[] => {
  const clusters: GraphCluster[] = [];
  
  const calculateSimilarity = (node1: GraphNode, node2: GraphNode): number => {
    const tagSimilarity = jaccard(node1.metadata.tags, node2.metadata.tags);
    const collaboratorSimilarity = jaccard(node1.metadata.collaborators, node2.metadata.collaborators);
    
    const timeDiff = Math.abs(node1.metadata.lastModified.getTime() - node2.metadata.lastModified.getTime());
    const maxTimeDiff = 30 * 24 * 60 * 60 * 1000;
    const timeSimilarity = Math.max(0, 1 - (timeDiff / maxTimeDiff));
    
    const typeSimilarity = node1.type === node2.type ? 1 : 0;
    
    const sizeDiff = Math.abs(node1.metadata.wordCount - node2.metadata.wordCount);
    const maxSize = Math.max(node1.metadata.wordCount, node2.metadata.wordCount, 1000);
    const sizeSimilarity = Math.max(0, 1 - (sizeDiff / maxSize));
    
    return (
      tagSimilarity * 0.35 +
      collaboratorSimilarity * 0.25 +
      timeSimilarity * 0.15 +
      typeSimilarity * 0.15 +
      sizeSimilarity * 0.1
    );
  };
  
  const k = Math.min(Math.max(3, Math.floor(nodes.length / 10)), 12);
  const maxIterations = 50;
  
  let centroids: GraphNode[] = [];
  for (let i = 0; i < k; i++) {
    centroids.push(nodes[Math.floor(Math.random() * nodes.length)]);
  }
  
  for (let iteration = 0; iteration < maxIterations; iteration++) {
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
    
    const newCentroids: GraphNode[] = [];
    for (let i = 0; i < k; i++) {
      const clusterNodes = nodes.filter(node => clusterAssignments.get(node.id) === i);
      if (clusterNodes.length > 0) {
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
        center: { x: 0, y: 0 },
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

export const findShortestPath = (
  sourceId: string,
  targetId: string,
  links: GraphLink[]
): PathResult => {
  const graph = new Map<string, { nodeId: string; weight: number }[]>();
  
  for (const link of links) {
    const sourceKey = typeof link.source === 'string' ? link.source : link.source.id;
    const targetKey = typeof link.target === 'string' ? link.target : link.target.id;
    const weight = 1 / (link.strength || 0.5);
    
    if (!graph.has(sourceKey)) graph.set(sourceKey, []);
    if (!graph.has(targetKey)) graph.set(targetKey, []);
    
    graph.get(sourceKey)!.push({ nodeId: targetKey, weight });
    if (link.bidirectional) {
      graph.get(targetKey)!.push({ nodeId: sourceKey, weight });
    }
  }
  
  const distances = new Map<string, number>();
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const queue: { nodeId: string; distance: number }[] = [];
  
  distances.set(sourceId, 0);
  queue.push({ nodeId: sourceId, distance: 0 });
  
  while (queue.length > 0) {
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
  
  const path: string[] = [];
  let currentNode = targetId;
  
  while (currentNode && previous.has(currentNode)) {
    path.unshift(currentNode);
    currentNode = previous.get(currentNode)!;
  }
  
  if (path.length > 0) {
    path.unshift(sourceId);
  }
  
  return {
    path,
    distance: distances.get(targetId) || Infinity,
    intermediateNodes: path.slice(1, -1),
    totalWeight: distances.get(targetId) || Infinity,
  };
};

export const calculateCentrality = (
  nodes: GraphNode[],
  links: GraphLink[]
): CentralityMetrics => {
  const nodeIds = nodes.map(n => n.id);
  const degreeMap = new Map<string, number>();
  const betweennessMap = new Map<string, number>();
  const closenessMap = new Map<string, number>();
  
  nodeIds.forEach(id => {
    degreeMap.set(id, 0);
    betweennessMap.set(id, 0);
    closenessMap.set(id, 0);
  });
  
  for (const link of links) {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
    const targetId = typeof link.target === 'string' ? link.target : link.target.id;
    
    degreeMap.set(sourceId, (degreeMap.get(sourceId) || 0) + 1);
    if (link.bidirectional) {
      degreeMap.set(targetId, (degreeMap.get(targetId) || 0) + 1);
    }
  }
  
  return {
    betweenness: betweennessMap,
    closeness: closenessMap,
    pageRank: new Map<string, number>(),
    combined: degreeMap,
  };
};

export const detectCommunities = (links: GraphLink[]): Community[] => {
  const communities: Community[] = [];
  
  communities.push({
    id: 'community-1',
    members: [],
    strength: 0.8,
    color: '#3b82f6',
  });
  
  return communities;
};

function jaccard(set1: string[], set2: string[]): number {
  const intersection = set1.filter(x => set2.includes(x));
  const union = [...new Set([...set1, ...set2])];
  return union.length > 0 ? intersection.length / union.length : 0;
}

function getMostFrequentTags(nodes: GraphNode[], count: number): string[] {
  const tagCounts = new Map<string, number>();
  
  for (const node of nodes) {
    for (const tag of node.metadata.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    }
  }
  
  return Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([tag]) => tag);
}

function getMostFrequentCollaborators(nodes: GraphNode[], count: number): string[] {
  const collabCounts = new Map<string, number>();
  
  for (const node of nodes) {
    for (const collab of node.metadata.collaborators) {
      collabCounts.set(collab, (collabCounts.get(collab) || 0) + 1);
    }
  }
  
  return Array.from(collabCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([collab]) => collab);
}

function calculateClusterCohesion(
  nodes: GraphNode[],
  similarityFn: (a: GraphNode, b: GraphNode) => number
): number {
  if (nodes.length < 2) return 1;
  
  let totalSimilarity = 0;
  let pairs = 0;
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      totalSimilarity += similarityFn(nodes[i], nodes[j]);
      pairs++;
    }
  }
  
  return pairs > 0 ? totalSimilarity / pairs : 0;
}

function generateClusterColor(index: number): string {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  return colors[index % colors.length];
} 