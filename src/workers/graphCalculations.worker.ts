// Web Worker para cálculos pesados do Graph View
export type GraphWorkerMessage = {
  type: 'CALCULATE_LAYOUT' | 'ANALYZE_NETWORK' | 'FIND_COMMUNITIES' | 'CALCULATE_CENTRALITY';
  payload: any;
  id: string;
};

export type GraphWorkerResponse = {
  type: 'LAYOUT_CALCULATED' | 'NETWORK_ANALYZED' | 'COMMUNITIES_FOUND' | 'CENTRALITY_CALCULATED' | 'ERROR';
  payload: any;
  id: string;
};

// Force-directed layout calculation
function calculateForceLayout(nodes: any[], links: any[], settings: any) {
  const nodeMap = new Map(nodes.map(n => [n.id, { ...n }]));
  const iterations = 100;
  const k = Math.sqrt((settings.width * settings.height) / nodes.length);
  
  for (let iter = 0; iter < iterations; iter++) {
    // Repulsive forces between all nodes
    for (const node1 of nodeMap.values()) {
      node1.fx = node1.fx || 0;
      node1.fy = node1.fy || 0;
      
      for (const node2 of nodeMap.values()) {
        if (node1.id === node2.id) continue;
        
        const dx = (node1.x || 0) - (node2.x || 0);
        const dy = (node1.y || 0) - (node2.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const repulsion = (k * k) / distance;
        const fx = (dx / distance) * repulsion;
        const fy = (dy / distance) * repulsion;
        
        node1.fx += fx;
        node1.fy += fy;
      }
    }
    
    // Attractive forces for connected nodes
    for (const link of links) {
      const source = nodeMap.get(link.source);
      const target = nodeMap.get(link.target);
      
      if (!source || !target) continue;
      
      const dx = (target.x || 0) - (source.x || 0);
      const dy = (target.y || 0) - (source.y || 0);
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      const attraction = (distance * distance) / k;
      const fx = (dx / distance) * attraction * 0.5;
      const fy = (dy / distance) * attraction * 0.5;
      
      source.fx += fx;
      source.fy += fy;
      target.fx -= fx;
      target.fy -= fy;
    }
    
    // Apply forces and damping
    const damping = 0.9;
    for (const node of nodeMap.values()) {
      node.x = (node.x || 0) + (node.fx || 0) * damping;
      node.y = (node.y || 0) + (node.fy || 0) * damping;
      node.fx *= 0.8;
      node.fy *= 0.8;
    }
  }
  
  return Array.from(nodeMap.values());
}

// Network analysis calculations
function analyzeNetwork(nodes: any[], links: any[]) {
  const nodeCount = nodes.length;
  const linkCount = links.length;
  
  // Calculate degree centrality
  const degrees = new Map<string, number>();
  for (const node of nodes) {
    degrees.set(node.id, 0);
  }
  
  for (const link of links) {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1);
    degrees.set(targetId, (degrees.get(targetId) || 0) + 1);
  }
  
  // Calculate clustering coefficient
  let totalClustering = 0;
  for (const node of nodes) {
    const neighbors = links
      .filter(l => l.source === node.id || l.target === node.id)
      .map(l => l.source === node.id ? l.target : l.source);
    
    if (neighbors.length < 2) continue;
    
    let connectionsBetweenNeighbors = 0;
    for (let i = 0; i < neighbors.length; i++) {
      for (let j = i + 1; j < neighbors.length; j++) {
        const hasConnection = links.some(l => 
          (l.source === neighbors[i] && l.target === neighbors[j]) ||
          (l.source === neighbors[j] && l.target === neighbors[i])
        );
        if (hasConnection) connectionsBetweenNeighbors++;
      }
    }
    
    const possibleConnections = (neighbors.length * (neighbors.length - 1)) / 2;
    totalClustering += connectionsBetweenNeighbors / possibleConnections;
  }
  
  const avgClustering = totalClustering / nodeCount;
  const density = linkCount / ((nodeCount * (nodeCount - 1)) / 2);
  const avgDegree = Array.from(degrees.values()).reduce((a, b) => a + b, 0) / nodeCount;
  
  return {
    nodeCount,
    linkCount,
    density: Math.round(density * 1000) / 1000,
    avgDegree: Math.round(avgDegree * 100) / 100,
    avgClustering: Math.round(avgClustering * 1000) / 1000,
    degrees: Object.fromEntries(degrees)
  };
}

// Community detection using simple modularity
function findCommunities(nodes: any[], links: any[]) {
  // Simplified Louvain algorithm
  const communities = new Map<string, number>();
  
  // Initialize each node in its own community
  nodes.forEach((node, index) => {
    communities.set(node.id, index);
  });
  
  // Simple community merging based on edge density
  let changed = true;
  let iterations = 0;
  const maxIterations = 50;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    for (const link of links) {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      const sourceCommunity = communities.get(sourceId);
      const targetCommunity = communities.get(targetId);
      
      if (sourceCommunity !== targetCommunity) {
        // Merge smaller community into larger one
        const sourceSize = Array.from(communities.values()).filter(c => c === sourceCommunity).length;
        const targetSize = Array.from(communities.values()).filter(c => c === targetCommunity).length;
        
        if (sourceSize < targetSize) {
          communities.set(sourceId, targetCommunity!);
          changed = true;
        } else {
          communities.set(targetId, sourceCommunity!);
          changed = true;
        }
      }
    }
  }
  
  // Group nodes by community
  const communityGroups = new Map<number, string[]>();
  for (const [nodeId, communityId] of communities) {
    if (!communityGroups.has(communityId)) {
      communityGroups.set(communityId, []);
    }
    communityGroups.get(communityId)!.push(nodeId);
  }
  
  return {
    communities: Object.fromEntries(communities),
    groups: Array.from(communityGroups.entries()).map(([id, nodes]) => ({
      id,
      nodes,
      size: nodes.length
    }))
  };
}

// Message handler
self.onmessage = function(e: MessageEvent<GraphWorkerMessage>) {
  const { type, payload, id } = e.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'CALCULATE_LAYOUT':
        result = calculateForceLayout(payload.nodes, payload.links, payload.settings);
        self.postMessage({
          type: 'LAYOUT_CALCULATED',
          payload: result,
          id
        } as GraphWorkerResponse);
        break;
        
      case 'ANALYZE_NETWORK':
        result = analyzeNetwork(payload.nodes, payload.links);
        self.postMessage({
          type: 'NETWORK_ANALYZED',
          payload: result,
          id
        } as GraphWorkerResponse);
        break;
        
      case 'FIND_COMMUNITIES':
        result = findCommunities(payload.nodes, payload.links);
        self.postMessage({
          type: 'COMMUNITIES_FOUND',
          payload: result,
          id
        } as GraphWorkerResponse);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      payload: { error: error instanceof Error ? error.message : 'Unknown error' },
      id
    } as GraphWorkerResponse);
  }
}; 