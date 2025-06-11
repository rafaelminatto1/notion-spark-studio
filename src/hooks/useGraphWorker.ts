import { useRef, useCallback, useEffect, useState } from 'react';
import { GraphWorkerMessage, GraphWorkerResponse } from '@/workers/graphCalculations.worker';

export interface GraphNode {
  id: string;
  title: string;
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  size?: number;
  type: 'file' | 'folder' | 'database' | 'tag';
  color?: string;
  connections?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'link' | 'backlink' | 'tag' | 'parent';
  strength: number;
  color?: string;
}

export interface LayoutSettings {
  width: number;
  height: number;
  linkDistance: number;
  chargeStrength: number;
  iterations?: number;
}

export const useGraphWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacks = useRef<Map<string, (result: any) => void>>(new Map());
  const [isReady, setIsReady] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Inicializar worker
  useEffect(() => {
    try {
      // Criar worker
      workerRef.current = new Worker('/src/workers/graphCalculations.worker.ts', { type: 'module' });
      
      workerRef.current.onmessage = (event: MessageEvent) => {
        const { type, payload, id } = event.data;
        
        const callback = pendingCallbacks.current.get(id);
        if (callback) {
          callback(payload);
          pendingCallbacks.current.delete(id);
          
          if (pendingCallbacks.current.size === 0) {
            setIsCalculating(false);
          }
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Graph Worker Error:', error);
        setIsReady(false);
      };

      setIsReady(true);
    } catch (error) {
      console.warn('Web Workers não suportados, usando fallback:', error);
      setIsReady(false);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Função genérica para enviar mensagens ao worker
  const sendMessage = useCallback((
    type: string,
    payload: any
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error('Worker não está pronto'));
        return;
      }

      const id = Math.random().toString(36).substr(2, 9);
      pendingCallbacks.current.set(id, resolve);
      setIsCalculating(true);

      const message = { type, payload, id };
      workerRef.current.postMessage(message);

      // Timeout para evitar travamentos
      setTimeout(() => {
        if (pendingCallbacks.current.has(id)) {
          pendingCallbacks.current.delete(id);
          reject(new Error('Worker timeout'));
        }
      }, 30000);
    });
  }, [isReady]);

  // Calcular layout usando force-directed algorithm
  const calculateLayout = useCallback(async (
    nodes: GraphNode[],
    links: GraphLink[],
    settings: LayoutSettings
  ): Promise<GraphNode[]> => {
    if (!isReady) {
      return calculateLayoutFallback(nodes, links, settings);
    }

    try {
      const result = await sendMessage('CALCULATE_LAYOUT', {
        nodes,
        links,
        settings
      });
      return result.nodes || nodes;
    } catch (error) {
      console.warn('Worker falhou, usando fallback:', error);
      return calculateLayoutFallback(nodes, links, settings);
    }
  }, [isReady, sendMessage]);

  // Analisar métricas da rede
  const analyzeNetwork = useCallback(async (
    nodes: GraphNode[],
    links: GraphLink[]
  ): Promise<any> => {
    if (!isReady) {
      return analyzeNetworkFallback(nodes, links);
    }

    try {
      return await sendMessage('ANALYZE_NETWORK', { nodes, links });
    } catch (error) {
      console.warn('Network analysis falhou, usando fallback:', error);
      return analyzeNetworkFallback(nodes, links);
    }
  }, [isReady, sendMessage]);

  // Encontrar comunidades
  const findCommunities = useCallback(async (
    nodes: GraphNode[],
    links: GraphLink[]
  ): Promise<any> => {
    if (!isReady) {
      return findCommunitiesFallback(nodes, links);
    }

    try {
      return await sendMessage('FIND_COMMUNITIES', { nodes, links });
    } catch (error) {
      console.warn('Community detection falhou, usando fallback:', error);
      return findCommunitiesFallback(nodes, links);
    }
  }, [isReady, sendMessage]);

  // Calcular centralidade
  const calculateCentrality = useCallback(async (
    nodes: GraphNode[],
    links: GraphLink[]
  ): Promise<any> => {
    if (!isReady) {
      return calculateCentralityFallback(nodes, links);
    }

    try {
      return await sendMessage('CALCULATE_CENTRALITY', { nodes, links });
    } catch (error) {
      console.warn('Centrality calculation falhou, usando fallback:', error);
      return calculateCentralityFallback(nodes, links);
    }
  }, [isReady, sendMessage]);

  return {
    isReady,
    isCalculating,
    calculateLayout,
    analyzeNetwork,
    findCommunities,
    calculateCentrality
  };
};

// Fallback function para quando Web Workers não estão disponíveis
function calculateLayoutFallback(
  nodes: GraphNode[],
  links: GraphLink[],
  settings: LayoutSettings
): GraphNode[] {
  const iterations = settings.iterations || 50;
  const k = Math.sqrt((settings.width * settings.height) / nodes.length);
  
  // Clonar nodes para não mutar o original
  const workingNodes = nodes.map(n => ({ ...n }));
  
  for (let iter = 0; iter < iterations; iter++) {
    // Aplicar forças repulsivas
    for (let i = 0; i < workingNodes.length; i++) {
      for (let j = i + 1; j < workingNodes.length; j++) {
        const node1 = workingNodes[i];
        const node2 = workingNodes[j];
        
        const dx = (node1.x || 0) - (node2.x || 0);
        const dy = (node1.y || 0) - (node2.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const repulsion = (k * k) / distance;
        const fx = (dx / distance) * repulsion * 0.1;
        const fy = (dy / distance) * repulsion * 0.1;
        
        node1.fx = (node1.fx || 0) + fx;
        node1.fy = (node1.fy || 0) + fy;
        node2.fx = (node2.fx || 0) - fx;
        node2.fy = (node2.fy || 0) - fy;
      }
    }
    
    // Aplicar movimento com damping
    const damping = 0.9;
    for (const node of workingNodes) {
      node.x = (node.x || settings.width / 2) + (node.fx || 0) * damping;
      node.y = (node.y || settings.height / 2) + (node.fy || 0) * damping;
      node.fx = (node.fx || 0) * 0.8;
      node.fy = (node.fy || 0) * 0.8;
    }
  }
  
  return workingNodes;
}

function analyzeNetworkFallback(nodes: GraphNode[], links: GraphLink[]) {
  const nodeCount = nodes.length;
  const linkCount = links.length;
  const density = linkCount / ((nodeCount * (nodeCount - 1)) / 2);
  
  // Calcular graus
  const degrees = new Map<string, number>();
  nodes.forEach(n => degrees.set(n.id, 0));
  
  links.forEach(link => {
    degrees.set(link.source, (degrees.get(link.source) || 0) + 1);
    degrees.set(link.target, (degrees.get(link.target) || 0) + 1);
  });
  
  const avgDegree = Array.from(degrees.values()).reduce((a, b) => a + b, 0) / nodeCount;
  
  return {
    nodeCount,
    linkCount,
    density: Math.round(density * 1000) / 1000,
    avgDegree: Math.round(avgDegree * 100) / 100,
    degrees: Object.fromEntries(degrees)
  };
}

function findCommunitiesFallback(nodes: GraphNode[], links: GraphLink[]) {
  // Implementação simples de detecção de comunidades
  const communities = new Map<string, number>();
  
  nodes.forEach((node, index) => {
    communities.set(node.id, index);
  });
  
  return {
    communities: Object.fromEntries(communities),
    groups: nodes.map((node, index) => ({
      id: index,
      nodes: [node.id],
      size: 1
    }))
  };
}

function calculateCentralityFallback(nodes: GraphNode[], links: GraphLink[]) {
  const centrality = new Map<string, number>();
  
  // Centralidade de grau simples
  nodes.forEach(node => {
    const degree = links.filter(link => 
      link.source === node.id || link.target === node.id
    ).length;
    centrality.set(node.id, degree);
  });
  
  return Object.fromEntries(centrality);
} 