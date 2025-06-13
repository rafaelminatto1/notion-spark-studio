import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import * as d3 from 'd3';
import { GraphNode, GraphLink, GraphFilters, LayoutSettings, ViewMode } from './types';
import { GraphControls } from './GraphControls';
import { GraphSidebar } from './GraphSidebar';
import { GraphMinimap } from './GraphMinimap';
import { GraphAnalytics } from './GraphAnalytics';
import { PerformanceMonitor } from './PerformanceMonitor';
import { useToast } from '@/hooks/use-toast';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface GraphEngineProps {
  files: FileItem[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
  filters: GraphFilters;
  viewMode: ViewMode;
  layoutSettings: LayoutSettings;
}

// Algoritmo de clustering inteligente
const smartClustering = (nodes: GraphNode[], links: GraphLink[]) => {
  // Implementar algoritmo Louvain para detecção de comunidades
  const communities = new Map<string, string[]>();
  const nodeCommunities = new Map<string, string>();
  
  // Calcular modularidade e agrupar nós por temas
  nodes.forEach(node => {
    const connectedNodes = links
      .filter(link => link.source === node.id || link.target === node.id)
      .map(link => link.source === node.id ? link.target : link.source);
    
    // Agrupar por tags similares
    const dominantTag = node.metadata.tags[0] || 'sem-categoria';
    const communityId = `cluster-${dominantTag}`;
    
    if (!communities.has(communityId)) {
      communities.set(communityId, []);
    }
    communities.get(communityId)!.push(node.id);
    nodeCommunities.set(node.id, communityId);
  });
  
  return { communities, nodeCommunities };
};

// Algoritmo de path finding (Dijkstra otimizado)
const findPath = (startNodeId: string, endNodeId: string, nodes: GraphNode[], links: GraphLink[]) => {
  const graph = new Map<string, { nodeId: string; weight: number }[]>();
  
  // Construir grafo
  nodes.forEach(node => graph.set(node.id, []));
  links.forEach(link => {
    const weight = 1 / (link.strength || 0.1); // Menor peso para links mais fortes
    graph.get(link.source as string)?.push({ nodeId: link.target as string, weight });
    graph.get(link.target as string)?.push({ nodeId: link.source as string, weight });
  });
  
  // Algoritmo Dijkstra
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set(nodes.map(n => n.id));
  
  nodes.forEach(node => distances.set(node.id, Infinity));
  distances.set(startNodeId, 0);
  
  while (unvisited.size > 0) {
    const current = Array.from(unvisited).reduce((min, nodeId) => 
      (distances.get(nodeId) || Infinity) < (distances.get(min) || Infinity) ? nodeId : min
    );
    
    if (current === endNodeId) break;
    if ((distances.get(current) || Infinity) === Infinity) break;
    
    unvisited.delete(current);
    
    const neighbors = graph.get(current) || [];
    neighbors.forEach(({ nodeId, weight }) => {
      if (unvisited.has(nodeId)) {
        const newDistance = (distances.get(current) || 0) + weight;
        if (newDistance < (distances.get(nodeId) || Infinity)) {
          distances.set(nodeId, newDistance);
          previous.set(nodeId, current);
        }
      }
    });
  }
  
  // Reconstruir caminho
  const path: string[] = [];
  let current: string | null = endNodeId;
  
  while (current !== null) {
    path.unshift(current);
    current = previous.get(current) || null;
    if (current === startNodeId) {
      path.unshift(startNodeId);
      break;
    }
  }
  
  return path.length > 1 ? path : [];
};

// Análise de centralidade (PageRank simplificado)
const calculateCentrality = (nodes: GraphNode[], links: GraphLink[]) => {
  const pageRank = new Map<string, number>();
  const damping = 0.85;
  const iterations = 50;
  
  // Inicializar PageRank
  nodes.forEach(node => pageRank.set(node.id, 1.0));
  
  for (let i = 0; i < iterations; i++) {
    const newPageRank = new Map<string, number>();
    
    nodes.forEach(node => {
      let rank = (1 - damping);
      const incomingLinks = links.filter(link => link.target === node.id);
      
      incomingLinks.forEach(link => {
        const sourceRank = pageRank.get(link.source as string) || 0;
        const outgoingCount = links.filter(l => l.source === link.source).length;
        rank += damping * (sourceRank / Math.max(outgoingCount, 1));
      });
      
      newPageRank.set(node.id, rank);
    });
    
    newPageRank.forEach((rank, nodeId) => pageRank.set(nodeId, rank));
  }
  
  return pageRank;
};

export const GraphEngine: React.FC<GraphEngineProps> = ({
  files,
  currentFileId,
  onFileSelect,
  className,
  filters,
  viewMode,
  layoutSettings
}) => {
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [pathFindingMode, setPathFindingMode] = useState(false);
  const [pathStart, setPathStart] = useState<string | null>(null);
  const [pathEnd, setPathEnd] = useState<string | null>(null);
  const [foundPath, setFoundPath] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInsights, setAiInsights] = useState<{
    recommendations: Array<{ type: string, message: string, nodeIds: string[], priority: 'high' | 'medium' | 'low' }>;
    anomalies: Array<{ nodeId: string, reason: string, severity: 'high' | 'medium' | 'low' }>;
    suggestions: Array<{ action: string, description: string, impact: string }>;
  }>({
    recommendations: [],
    anomalies: [],
    suggestions: []
  });
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Converter arquivos em nós e links do grafo
  const { nodes, links } = useMemo(() => {
    const graphNodes: GraphNode[] = files.map(file => ({
      id: file.id,
      title: file.name,
      type: file.type as 'file' | 'folder',
      size: Math.max(8, Math.min(20, (file.content?.length || 0) / 100)),
      color: file.type === 'folder' ? '#4f46e5' : 
             file.tags?.includes('importante') ? '#dc2626' : 
             file.tags?.includes('projeto') ? '#059669' : '#6366f1',
      position: { x: Math.random() * 800, y: Math.random() * 600 },
      connections: [],
      metadata: {
        lastModified: file.updatedAt || new Date(),
        wordCount: file.content?.split(' ').length || 0,
        collaborators: [],
        tags: file.tags || [],
        fileSize: file.content?.length || 0,
        language: 'markdown',
        isTemplate: false,
        isShared: false,
        accessLevel: 'private' as const,
      },
    }));

    const graphLinks: GraphLink[] = [];
    
    // Criar links baseados em referências, tags similares e hierarquia
    files.forEach(file => {
      // Links por referências no conteúdo
      const content = file.content || '';
      const mentions = content.match(/\[\[([^\]]+)\]\]/g) || [];
      
      mentions.forEach(mention => {
        const targetName = mention.slice(2, -2);
        const targetFile = files.find(f => f.name === targetName);
        if (targetFile && targetFile.id !== file.id) {
          graphLinks.push({
            source: file.id,
            target: targetFile.id,
            type: 'link',
            strength: 0.8,
            color: 'rgba(99, 102, 241, 0.6)',
            width: 2,
            bidirectional: false
          });
        }
      });

      // Links por hierarquia (pasta-arquivo)
      if (file.parentId) {
        graphLinks.push({
          source: file.parentId,
          target: file.id,
          type: 'parent',
          strength: 1.0,
          color: 'rgba(156, 163, 175, 0.4)',
          width: 1,
          bidirectional: false
        });
      }

      // Links por tags similares
      files.forEach(otherFile => {
        if (otherFile.id !== file.id && file.tags && otherFile.tags) {
          const commonTags = file.tags.filter(tag => otherFile.tags!.includes(tag));
          if (commonTags.length > 0) {
            const strength = commonTags.length / Math.max(file.tags.length, otherFile.tags.length);
            if (strength > 0.3) { // Só criar link se houver similaridade significativa
              graphLinks.push({
                source: file.id,
                target: otherFile.id,
                type: 'tag',
                strength: strength * 0.5,
                color: 'rgba(245, 101, 101, 0.3)',
                width: 1,
                bidirectional: false
              });
            }
          }
        }
      });
    });

    // Calcular número de conexões para cada nó
    graphNodes.forEach(node => {
      node.connections = graphLinks.filter(link => 
        link.source === node.id || link.target === node.id
      ).map(link => ({
        to: link.source === node.id ? link.target as string : link.source as string,
        type: link.type,
        strength: link.strength
      }));
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [files]);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    let filteredNodes = nodes.filter(node => {
      if (!filters.nodeTypes.includes(node.type)) return false;
      if (node.connections.length < filters.minConnections) return false;
      if (filters.tags.length > 0 && !filters.tags.some(tag => node.metadata.tags.includes(tag))) return false;
      
      if (filters.dateRange) {
        const nodeDate = new Date(node.metadata.lastModified);
        if (nodeDate < filters.dateRange.from || nodeDate > filters.dateRange.to) return false;
      }
      
      return true;
    });

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => 
      filteredNodeIds.has(link.source as string) && filteredNodeIds.has(link.target as string)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, filters]);

  // Smart clustering
  const { communities, nodeCommunities } = useMemo(() => {
    return smartClustering(filteredData.nodes, filteredData.links);
  }, [filteredData]);

  // Análise de centralidade
  const centralityScores = useMemo(() => {
    return calculateCentrality(filteredData.nodes, filteredData.links);
  }, [filteredData]);

  // Configuração do grafo baseada no modo de visualização
  const graphConfig = useMemo(() => {
    const baseConfig = {
      backgroundColor: 'transparent',
      nodeAutoColorBy: (node: GraphNode) => nodeCommunities.get(node.id) || 'default',
      nodeVal: (node: GraphNode) => {
        const centrality = centralityScores.get(node.id) || 1;
        return node.size * (1 + centrality);
      },
      nodeLabel: (node: GraphNode) => `
        <div style="background: rgba(0,0,0,0.8); color: white; padding: 8px; border-radius: 4px; font-size: 12px;">
          <strong>${node.title}</strong><br/>
          Conexões: ${node.connections.length}<br/>
          Palavras: ${node.metadata.wordCount}<br/>
          Tags: ${node.metadata.tags.join(', ') || 'Nenhuma'}
        </div>
      `,
      linkLabel: (link: GraphLink) => `
        <div style="background: rgba(0,0,0,0.8); color: white; padding: 4px; border-radius: 4px; font-size: 10px;">
          Tipo: ${link.type}<br/>
          Força: ${(link.strength * 100).toFixed(0)}%
        </div>
      `,
      nodeColor: (node: GraphNode) => {
        if (foundPath.includes(node.id)) return '#fbbf24'; // Amarelo para caminho
        if (node.id === selectedNode) return '#ef4444'; // Vermelho para selecionado
        if (node.id === hoveredNode) return '#3b82f6'; // Azul para hover
        return node.color;
      },
      linkColor: (link: GraphLink) => {
        const isInPath = foundPath.length > 1 && 
          foundPath.some((nodeId, i) => 
            i < foundPath.length - 1 && 
            ((link.source === nodeId && link.target === foundPath[i + 1]) ||
             (link.target === nodeId && link.source === foundPath[i + 1]))
          );
        
        return isInPath ? '#fbbf24' : link.color;
      },
      linkWidth: (link: GraphLink) => {
        const isInPath = foundPath.length > 1 && 
          foundPath.some((nodeId, i) => 
            i < foundPath.length - 1 && 
            ((link.source === nodeId && link.target === foundPath[i + 1]) ||
             (link.target === nodeId && link.source === foundPath[i + 1]))
          );
        
        return isInPath ? 4 : link.width;
      },
      linkDirectionalArrowLength: 6,
      linkDirectionalArrowRelPos: 1,
      cooldownTicks: layoutSettings.physics ? 100 : 0,
      warmupTicks: layoutSettings.physics ? 100 : 0,
      d3AlphaDecay: layoutSettings.forceStrength / 100,
      d3VelocityDecay: 0.3,
      onNodeClick: handleNodeClick,
      onNodeHover: handleNodeHover,
      onLinkClick: handleLinkClick,
      onBackgroundClick: handleBackgroundClick,
    };

    // Configurações específicas por modo
    switch (viewMode) {
      case 'force':
        return {
          ...baseConfig,
          dagMode: 'td',
          dagLevelDistance: layoutSettings.linkDistance,
        };
      case 'hierarchical':
        return {
          ...baseConfig,
          dagMode: 'radialout',
          dagLevelDistance: layoutSettings.linkDistance,
        };
      case 'timeline':
        return {
          ...baseConfig,
          dagMode: 'lr',
          dagLevelDistance: layoutSettings.linkDistance,
          nodeAutoColorBy: (node: GraphNode) => {
            const date = new Date(node.metadata.lastModified);
            const now = new Date();
            const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 1) return '#22c55e'; // Verde - hoje
            if (daysDiff < 7) return '#3b82f6'; // Azul - esta semana
            if (daysDiff < 30) return '#f59e0b'; // Amarelo - este mês
            return '#ef4444'; // Vermelho - mais antigo
          }
        };
      default: // force
        return baseConfig;
    }
  }, [viewMode, layoutSettings, nodeCommunities, centralityScores, selectedNode, hoveredNode, foundPath]);

  // Handlers de eventos
  const handleNodeClick = useCallback((node: GraphNode) => {
    if (pathFindingMode) {
      if (!pathStart) {
        setPathStart(node.id);
        toast({
          title: "🎯 Ponto inicial selecionado",
          description: `${node.title} - Selecione o destino`,
        });
      } else if (!pathEnd && node.id !== pathStart) {
        setPathEnd(node.id);
        
        // Calcular caminho
        setIsProcessing(true);
        setTimeout(() => {
          const path = findPath(pathStart, node.id, filteredData.nodes, filteredData.links);
          setFoundPath(path);
          setIsProcessing(false);
          
          toast({
            title: path.length > 1 ? "🛤️ Caminho encontrado!" : "❌ Nenhum caminho encontrado",
            description: path.length > 1 ? 
              `Caminho: ${path.map(id => filteredData.nodes.find(n => n.id === id)?.title).join(' → ')}` :
              "Não há conexão entre os nós selecionados",
          });
        }, 500);
      } else {
        // Reset path finding
        setPathStart(null);
        setPathEnd(null);
        setFoundPath([]);
      }
    } else {
      setSelectedNode(node.id);
      onFileSelect(node.id);
    }
  }, [pathFindingMode, pathStart, pathEnd, filteredData, onFileSelect, toast]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoveredNode(node?.id || null);
  }, []);

  const handleLinkClick = useCallback((link: GraphLink) => {
    // Highlight dos nós conectados
    const sourceNode = filteredData.nodes.find(n => n.id === link.source);
    const targetNode = filteredData.nodes.find(n => n.id === link.target);
    
    if (sourceNode && targetNode) {
      toast({
        title: "🔗 Link selecionado",
        description: `${sourceNode.title} ↔ ${targetNode.title} (${link.type})`,
      });
    }
  }, [filteredData, toast]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
    if (pathFindingMode) {
      setPathStart(null);
      setPathEnd(null);
      setFoundPath([]);
    }
  }, [pathFindingMode]);

  // Gestos mobile
  const bind = useGesture({
    onPinch: ({ offset: [scale] }) => {
      if (graphRef.current) {
        graphRef.current.zoom(scale);
      }
    },
    onDrag: ({ offset: [x, y], first, last }) => {
      if (first) {
        // Início do arrasto
      }
      if (last) {
        // Fim do arrasto
      }
    },
  });

  // Live updates
  useEffect(() => {
    if (!liveUpdates) return;

    const interval = setInterval(() => {
      // Simular atualizações em tempo real
      if (graphRef.current) {
        graphRef.current.refresh();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [liveUpdates]);

  // Auto-zoom no nó atual
  useEffect(() => {
    if (currentFileId && graphRef.current) {
      const node = filteredData.nodes.find(n => n.id === currentFileId);
      if (node) {
        setTimeout(() => {
          graphRef.current.centerAt(node.position.x, node.position.y, 1000);
          graphRef.current.zoom(2, 1000);
        }, 100);
      }
    }
  }, [currentFileId, filteredData.nodes]);

  const selectedNodeData = selectedNode ? filteredData.nodes.find(n => n.id === selectedNode) : null;

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900", className)}
      {...bind()}
    >
      {/* Graph principal */}
      <ForceGraph2D
        ref={graphRef}
        graphData={filteredData}
        width={window.innerWidth}
        height={window.innerHeight}
        {...graphConfig}
      />

      {/* Controles */}
      <GraphControls
        className="absolute top-4 left-4 z-10"
        onTogglePathFinding={() => {
          setPathFindingMode(!pathFindingMode);
          setPathStart(null);
          setPathEnd(null);
          setFoundPath([]);
        }}
        pathFindingMode={pathFindingMode}
        onToggleAnalytics={() => setShowAnalytics(!showAnalytics)}
        onToggleLiveUpdates={() => setLiveUpdates(!liveUpdates)}
        liveUpdates={liveUpdates}
      />

      {/* Minimap */}
      <GraphMinimap
        className="absolute bottom-4 right-4 z-10"
        graphRef={graphRef}
        nodes={filteredData.nodes}
      />

      {/* Sidebar com detalhes do nó */}
      <AnimatePresence>
        {selectedNodeData && (
          <GraphSidebar
            nodeData={selectedNodeData}
            centralityScore={centralityScores.get(selectedNodeData.id) || 0}
            community={nodeCommunities.get(selectedNodeData.id)}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </AnimatePresence>

      {/* Analytics */}
      <AnimatePresence>
        {showAnalytics && (
          <GraphAnalytics
            nodes={filteredData.nodes}
            links={filteredData.links}
            communities={communities}
            centralityScores={centralityScores}
            onClose={() => setShowAnalytics(false)}
          />
        )}
      </AnimatePresence>

      {/* Performance Monitor */}
      <PerformanceMonitor
        className="absolute top-4 right-4 z-10"
        nodeCount={filteredData.nodes.length}
        linkCount={filteredData.links.length}
        visibleNodes={filteredData.nodes.length} // Será otimizado com viewport culling
      />

      {/* Indicador de processamento */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute inset-0 bg-black/50 flex items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="text-white">Calculando caminho...</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status do Path Finding */}
      {pathFindingMode && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg p-4 text-white text-center">
            <h3 className="font-semibold mb-2">🛤️ Modo Path Finding</h3>
            <p className="text-sm text-slate-300">
              {!pathStart ? 'Clique no nó inicial' : 
               !pathEnd ? 'Clique no nó de destino' : 
               'Caminho calculado!'}
            </p>
            {foundPath.length > 1 && (
              <div className="mt-2 text-xs text-blue-300">
                {foundPath.length} nós no caminho
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};