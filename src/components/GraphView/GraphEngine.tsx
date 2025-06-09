import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ForceGraph2D } from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { GraphNode, GraphLink, GraphFilters, CentralityMetrics } from './types';
import { GraphControls } from './GraphControls';
import { GraphMinimap } from './GraphMinimap';
import { GraphSidebar } from './GraphSidebar';
import { GraphAnalytics } from './GraphAnalytics';
import { performClustering, findShortestPath, calculateCentrality, detectCommunities } from '@/utils/graphAlgorithms';
import { useGraphData } from '@/hooks/useGraphData';
import { cn } from '@/lib/utils';

interface GraphEngineProps {
  files: any[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
}

export const GraphEngine: React.FC<GraphEngineProps> = ({
  files,
  currentFileId,
  onFileSelect,
  className
}) => {
  const fgRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Estados principais
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de visualização
  const [filters, setFilters] = useState<GraphFilters>({
    nodeTypes: ['file', 'folder', 'database'],
    minConnections: 0,
    dateRange: null,
    tags: [],
    searchQuery: '',
    showOrphans: true,
  });
  
  const [viewMode, setViewMode] = useState<'force' | 'hierarchical' | 'circular' | 'timeline'>('force');
  const [layoutSettings, setLayoutSettings] = useState({
    physics: true,
    clustering: true,
    linkDistance: 120,
    chargeStrength: -400,
    centerStrength: 0.1,
  });
  
  // Estados avançados
  const [showPathFinding, setShowPathFinding] = useState(false);
  const [pathNodes, setPathNodes] = useState<{ source: string; target: string } | null>(null);
  const [centralityMetrics, setCentralityMetrics] = useState<CentralityMetrics | null>(null);
  const [communityData, setCommunityData] = useState<any[]>([]);

  // Hook personalizado para dados do grafo
  const { nodes, links, isProcessing } = useGraphData(files, filters);

  // Processamento avançado dos dados
  const processedData = useMemo(() => {
    if (!nodes.length) return { nodes: [], links: [] };

    setIsLoading(true);
    
    try {
      // 1. Clustering inteligente
      const clusters = performClustering(nodes);
      
      // 2. Análise de centralidade
      const centrality = calculateCentrality(nodes, links);
      setCentralityMetrics(centrality);
      
      // 3. Detecção de comunidades
      const communities = detectCommunities(links);
      setCommunityData(communities);
      
      // 4. Aplicar dados computados aos nós
      const enrichedNodes = nodes.map(node => {
        const cluster = clusters.find(c => c.nodeIds.includes(node.id));
        const centralityScore = centrality.combined.get(node.id) || 0;
        
        return {
          ...node,
          cluster: cluster?.id || 'uncategorized',
          clusterColor: cluster?.color || '#6b7280',
          centrality: centralityScore,
          size: Math.max(8, Math.min(25, 8 + (centralityScore * 50))),
          community: communities.find(c => c.members.includes(node.id))?.id,
        };
      });
      
      // 5. Enriquecer links com força baseada em centralidade
      const enrichedLinks = links.map(link => ({
        ...link,
        strength: Math.max(0.1, Math.min(1, link.strength || 0.5)),
        width: Math.max(1, (link.strength || 0.5) * 5),
      }));
      
      return { nodes: enrichedNodes, links: enrichedLinks };
      
    } finally {
      setIsLoading(false);
    }
  }, [nodes, links]);

  // Configuração do grafo baseada no modo
  const graphConfig = useMemo(() => {
    const baseConfig = {
      nodeAutoColorBy: 'cluster',
      nodeRelSize: 1,
      nodeVal: (node: any) => node.size || 10,
      nodeColor: (node: any) => {
        if (node.id === currentFileId) return '#8b5cf6';
        if (node.id === selectedNode) return '#10b981';
        if (node.id === hoveredNode) return '#f59e0b';
        return node.clusterColor || '#6b7280';
      },
      nodeCanvasObject: (node: any, ctx: any, globalScale: number) => {
        // Custom node rendering com efeitos avançados
        const size = node.size || 10;
        const x = node.x;
        const y = node.y;
        
        // Aura effect para nó atual
        if (node.id === currentFileId) {
          ctx.beginPath();
          ctx.arc(x, y, size + 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
          ctx.fill();
        }
        
        // Círculo principal
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = node.color || '#6b7280';
        ctx.fill();
        
        // Borda
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Indicador de centralidade
        if (node.centrality && node.centrality > 0.1) {
          ctx.beginPath();
          ctx.arc(x + size - 4, y - size + 4, 3, 0, 2 * Math.PI);
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
        }
        
        // Label
        if (globalScale > 0.6) {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillStyle = '#e2e8f0';
          ctx.font = '12px Inter';
          ctx.fillText(node.name, x, y + size + 4);
        }
      },
      
      linkDirectionalArrowLength: 6,
      linkDirectionalArrowRelPos: 1,
      linkWidth: (link: any) => link.width || 2,
      linkColor: (link: any) => {
        if (pathNodes && 
            ((link.source.id === pathNodes.source && link.target.id === pathNodes.target) ||
             (link.source.id === pathNodes.target && link.target.id === pathNodes.source))) {
          return '#10b981';
        }
        return link.color || 'rgba(255,255,255,0.2)';
      },
      
      backgroundColor: 'transparent',
      cooldownTicks: layoutSettings.physics ? 100 : 0,
      
      // Forças customizadas baseadas no modo
      d3Force: (simulation: any) => {
        if (viewMode === 'hierarchical') {
          simulation
            .force('x', d3.forceX(0).strength(0.1))
            .force('y', d3.forceY().strength(0.3));
        } else if (viewMode === 'circular') {
          simulation
            .force('radial', d3.forceRadial(200, 0, 0).strength(0.8));
        }
      },
      
      // Event handlers
      onNodeClick: handleNodeClick,
      onNodeHover: handleNodeHover,
      onLinkClick: handleLinkClick,
      onBackgroundClick: () => {
        setSelectedNode(null);
        setPathNodes(null);
      },
    };
    
    return baseConfig;
  }, [viewMode, layoutSettings, currentFileId, selectedNode, hoveredNode, pathNodes]);

  // Handlers
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node.id);
    onFileSelect(node.id);
    
    // Auto path finding se houver um nó previamente selecionado
    if (showPathFinding && selectedNode && selectedNode !== node.id) {
      const path = findShortestPath(selectedNode, node.id, links);
      if (path.path.length > 0) {
        setPathNodes({ source: selectedNode, target: node.id });
      }
    }
  }, [selectedNode, showPathFinding, links, onFileSelect]);

  const handleNodeHover = useCallback((node: any) => {
    setHoveredNode(node?.id || null);
  }, []);

  const handleLinkClick = useCallback((link: any) => {
    // Implementar ações para clique em links
    console.log('Link clicked:', link);
  }, []);

  // Gestos para mobile
  const bind = useGesture({
    onPinch: ({ offset: [scale] }) => {
      if (fgRef.current) {
        const newZoom = Math.max(0.1, Math.min(4, scale));
        fgRef.current.zoom(newZoom);
      }
    },
    onDrag: ({ offset: [x, y] }) => {
      if (fgRef.current) {
        fgRef.current.centerAt(x, y, 1000);
      }
    },
  });

  return (
    <motion.div 
      ref={containerRef}
      className={cn("graph-engine-container relative h-full w-full overflow-hidden", className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      {...bind()}
    >
      {/* Loading overlay */}
      <AnimatePresence>
        {(isLoading || isProcessing) && (
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-white text-lg">Processando grafo...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles principais */}
      <GraphControls
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        layoutSettings={layoutSettings}
        onLayoutSettingsChange={setLayoutSettings}
        showPathFinding={showPathFinding}
        onShowPathFindingChange={setShowPathFinding}
        graphRef={fgRef}
      />

      {/* Minimap */}
      <GraphMinimap 
        graphRef={fgRef}
        nodes={processedData.nodes}
        className="absolute bottom-4 right-4"
      />

      {/* Graph principal */}
      <ForceGraph2D
        ref={fgRef}
        graphData={processedData}
        {...graphConfig}
        width={containerRef.current?.clientWidth || 800}
        height={containerRef.current?.clientHeight || 600}
      />

      {/* Analytics overlay */}
      <GraphAnalytics
        centralityMetrics={centralityMetrics}
        communityData={communityData}
        selectedNode={selectedNode}
        hoveredNode={hoveredNode}
        className="absolute top-4 right-4"
      />

      {/* Sidebar com detalhes */}
      <GraphSidebar
        selectedNode={selectedNode}
        nodeData={processedData.nodes.find(n => n.id === selectedNode)}
        onClose={() => setSelectedNode(null)}
        onPathFinding={(targetId) => {
          if (selectedNode) {
            const path = findShortestPath(selectedNode, targetId, links);
            setPathNodes({ source: selectedNode, target: targetId });
          }
        }}
      />
    </motion.div>
  );
}; 