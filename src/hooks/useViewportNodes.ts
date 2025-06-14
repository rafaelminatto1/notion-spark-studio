import { useState, useEffect, useMemo, useCallback } from 'react';
import { GraphNode, GraphLink } from '@/components/GraphView/types';

interface ViewportBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  zoom: number;
}

interface UseViewportNodesReturn {
  visibleNodes: GraphNode[];
  visibleLinks: GraphLink[];
  totalNodes: number;
  renderingStats: {
    visibleCount: number;
    culledCount: number;
    performanceGain: number;
  };
  updateViewport: (bounds: ViewportBounds) => void;
}

const DEFAULT_VIEWPORT: ViewportBounds = {
  minX: -1000,
  maxX: 1000,
  minY: -1000,
  maxY: 1000,
  zoom: 1
};

export function useViewportNodes(
  nodes: GraphNode[],
  links: GraphLink[],
  maxVisibleNodes: number = 1000
): UseViewportNodesReturn {
  const [viewport, setViewport] = useState<ViewportBounds>(DEFAULT_VIEWPORT);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  // Throttle viewport updates para performance
  const updateViewport = useCallback((bounds: ViewportBounds) => {
    const now = Date.now();
    if (now - lastUpdateTime > 16) { // ~60fps
      setViewport(bounds);
      setLastUpdateTime(now);
    }
  }, [lastUpdateTime]);

  // Calcular nós visíveis com algoritmo otimizado
  const { visibleNodes, culledNodes } = useMemo(() => {
    if (nodes.length <= maxVisibleNodes) {
      return { visibleNodes: nodes, culledNodes: [] };
    }

    // Buffer adicional para nodes próximos ao viewport
    const buffer = Math.max(200, viewport.zoom * 100);
    const expandedBounds = {
      minX: viewport.minX - buffer,
      maxX: viewport.maxX + buffer,
      minY: viewport.minY - buffer,
      maxY: viewport.maxY + buffer,
    };

    // Separar nós em visíveis e culled
    const visible: GraphNode[] = [];
    const culled: GraphNode[] = [];

    for (const node of nodes) {
      const x = node.x || 0;
      const y = node.y || 0;

      const isVisible = (
        x >= expandedBounds.minX &&
        x <= expandedBounds.maxX &&
        y >= expandedBounds.minY &&
        y <= expandedBounds.maxY
      );

      if (isVisible) {
        visible.push(node);
      } else {
        culled.push(node);
      }
    }

    // Se ainda há muitos nós visíveis, priorizar por importância
    if (visible.length > maxVisibleNodes) {
      visible.sort((a, b) => {
        // Priorizar nós com mais conexões
        const aConnections = links.filter(l => l.source === a.id || l.target === a.id).length;
        const bConnections = links.filter(l => l.source === b.id || l.target === b.id).length;
        
        if (aConnections !== bConnections) {
          return bConnections - aConnections;
        }

        // Priorizar nós mais centrais
        const centerX = (viewport.minX + viewport.maxX) / 2;
        const centerY = (viewport.minY + viewport.maxY) / 2;
        const aDistance = Math.sqrt(Math.pow((a.x || 0) - centerX, 2) + Math.pow((a.y || 0) - centerY, 2));
        const bDistance = Math.sqrt(Math.pow((b.x || 0) - centerX, 2) + Math.pow((b.y || 0) - centerY, 2));
        
        return aDistance - bDistance;
      });

      const priorityNodes = visible.slice(0, maxVisibleNodes);
      const additionalCulled = visible.slice(maxVisibleNodes);
      
      return { 
        visibleNodes: priorityNodes, 
        culledNodes: [...culled, ...additionalCulled] 
      };
    }

    return { visibleNodes: visible, culledNodes: culled };
  }, [nodes, links, viewport, maxVisibleNodes]);

  // Calcular links visíveis (apenas entre nós visíveis)
  const visibleLinks = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    
    return links.filter(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
    });
  }, [visibleNodes, links]);

  // Estatísticas de renderização
  const renderingStats = useMemo(() => {
    const visibleCount = visibleNodes.length;
    const culledCount = culledNodes.length;
    const totalCount = visibleCount + culledCount;
    const performanceGain = totalCount > 0 ? (culledCount / totalCount) * 100 : 0;

    return {
      visibleCount,
      culledCount,
      performanceGain: Math.round(performanceGain)
    };
  }, [visibleNodes.length, culledNodes.length]);

  // Debug logging em desenvolvimento
  useEffect(() => {
    if (import.meta.env.MODE === 'development') {
      console.log(`🎯 Viewport Optimization: ${renderingStats.visibleCount}/${nodes.length} nodes visible (${renderingStats.performanceGain}% performance gain)`);
    }
  }, [renderingStats, nodes.length]);

  return {
    visibleNodes,
    visibleLinks,
    totalNodes: nodes.length,
    renderingStats,
    updateViewport,
  };
} 