import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Search, 
  Filter, 
  Info,
  Play,
  Pause,
  Settings,
  Target,
  Network,
  Eye,
  EyeOff,
  Layers,
  BarChart3,
  Navigation,
  Shuffle,
  GitBranch,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { FileItem } from '@/types';
import { GraphNode, GraphLink, GraphState, GraphViewSettings } from '@/types/graph';
import { useGraphAnalytics } from '@/hooks/useGraphAnalytics';
import { cn } from '@/lib/utils';

interface GraphViewEnhancedProps {
  files: FileItem[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
}

export const GraphViewEnhanced: React.FC<GraphViewEnhancedProps> = ({
  files,
  currentFileId,
  onFileSelect,
  className
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  
  // Estado principal do grafo
  const [graphState, setGraphState] = useState<GraphState>({
    nodes: [],
    links: [],
    selectedNode: null,
    hoveredNode: null,
    focusMode: false,
    focusDepth: 2,
    layout: 'force',
    physics: true,
    showLabels: true,
    showClusters: true,
    zoom: 1,
    pan: { x: 0, y: 0 }
  });

  // Configurações avançadas
  const [settings, setSettings] = useState<GraphViewSettings>({
    performance: {
      virtualizeNodes: true,
      maxVisibleNodes: 500,
      lodLevels: 3
    },
    visual: {
      nodeMinSize: 8,
      nodeMaxSize: 40,
      linkOpacity: 0.6,
      animationDuration: 300,
      colorScheme: 'dark'
    },
    interaction: {
      enableDrag: true,
      enableZoom: true,
      enableHover: true,
      clickToFocus: true,
      doubleClickAction: 'navigate'
    },
    layout: {
      forceStrength: -400,
      linkDistance: 120,
      collisionRadius: 20,
      centeringStrength: 0.1
    }
  });

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('graph');

  // Converter arquivos para nós do grafo
  const { nodes, links } = useMemo(() => {
    const graphNodes: GraphNode[] = files
      .filter(file => file.type === 'file')
      .map(file => ({
        id: file.id,
        title: file.name,
        type: file.type as 'file',
        size: Math.max(settings.visual.nodeMinSize, Math.min(settings.visual.nodeMaxSize, 15 + (file.content?.length || 0) / 100)),
        color: getNodeColor(file),
        position: { x: 0, y: 0 },
        connections: [],
        metadata: {
          lastModified: file.updatedAt || new Date(),
          wordCount: file.content?.split(' ').length || 0,
          collaborators: [],
          tags: file.tags || []
        },
        cluster: file.tags?.[0] || 'sem-categoria'
      }));

    const graphLinks: GraphLink[] = [];
    
    // Criar links baseados em referências entre arquivos
    files.forEach(file => {
      if (file.type === 'file' && file.content) {
        const fileRefs = extractFileReferences(file.content, files);
        fileRefs.forEach(refId => {
          if (graphNodes.find(n => n.id === refId)) {
            graphLinks.push({
              source: file.id,
              target: refId,
              type: 'link',
              strength: Math.random() * 0.5 + 0.5,
              bidirectional: false
            });
          }
        });
      }
    });

    return { nodes: graphNodes, links: graphLinks };
  }, [files, settings.visual]);

  // Analytics do grafo
  const { centralityAnalysis, communityDetection, findShortestPath } = useGraphAnalytics(nodes, links);

  // Filtrar dados baseado nos filtros ativos
  const filteredData = useMemo(() => {
    let filteredNodes = nodes.filter(node => {
      const matchesSearch = searchQuery === '' || 
        node.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => node.metadata.tags.includes(tag));
      
      const matchesClusters = selectedClusters.length === 0 ||
        selectedClusters.includes(node.cluster || 'sem-categoria');
      
      return matchesSearch && matchesTags && matchesClusters;
    });

    // Modo foco
    if (graphState.focusMode && graphState.selectedNode) {
      const focusedNodeIds = new Set([graphState.selectedNode]);
      const addNeighbors = (nodeId: string, depth: number) => {
        if (depth <= 0) return;
        links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          
          if (sourceId === nodeId && !focusedNodeIds.has(targetId)) {
            focusedNodeIds.add(targetId);
            addNeighbors(targetId, depth - 1);
          } else if (targetId === nodeId && link.bidirectional && !focusedNodeIds.has(sourceId)) {
            focusedNodeIds.add(sourceId);
            addNeighbors(sourceId, depth - 1);
          }
        });
      };
      addNeighbors(graphState.selectedNode, graphState.focusDepth);
      filteredNodes = filteredNodes.filter(node => focusedNodeIds.has(node.id));
    }

    // Virtualização para performance
    if (settings.performance.virtualizeNodes && filteredNodes.length > settings.performance.maxVisibleNodes) {
      filteredNodes = filteredNodes
        .sort((a, b) => (centralityAnalysis.degreeCentrality.get(b.id) || 0) - (centralityAnalysis.degreeCentrality.get(a.id) || 0))
        .slice(0, settings.performance.maxVisibleNodes);
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
      const targetId = typeof link.target === 'string' ? link.target : link.target.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, searchQuery, selectedTags, selectedClusters, graphState.focusMode, graphState.selectedNode, graphState.focusDepth, settings.performance, centralityAnalysis]);

  // Função principal de renderização do grafo
  const renderGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current || filteredData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Configurar zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        setGraphState(prev => ({
          ...prev,
          zoom: event.transform.k,
          pan: { x: event.transform.x, y: event.transform.y }
        }));
      });

    svg.call(zoom);
    const container = svg.append('g');

    // Criar simulação baseada no layout selecionado
    let simulation: d3.Simulation<GraphNode, GraphLink>;
    
    switch (graphState.layout) {
      case 'hierarchical':
        simulation = createHierarchicalLayout(filteredData.nodes, filteredData.links, width, height);
        break;
      case 'circular':
        simulation = createCircularLayout(filteredData.nodes, filteredData.links, width, height);
        break;
      case 'timeline':
        simulation = createTimelineLayout(filteredData.nodes, filteredData.links, width, height);
        break;
      default:
        simulation = createForceLayout(filteredData.nodes, filteredData.links, width, height, settings.layout);
    }

    simulationRef.current = simulation;

    // Definições para gradientes e padrões
    const defs = svg.append('defs');
    
    // Gradientes para clusters
    communityDetection.forEach(cluster => {
      const gradient = defs.append('radialGradient')
        .attr('id', `cluster-gradient-${cluster.id}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
      
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', cluster.color)
        .attr('stop-opacity', 0.3);
      
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', cluster.color)
        .attr('stop-opacity', 0.1);
    });

    // Setas para links direcionais
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10,0 L 0,5')
      .attr('fill', '#4a5568');

    // Renderizar clusters se habilitado
    if (graphState.showClusters) {
      renderClusters(container, communityDetection, filteredData.nodes);
    }

    // Renderizar links
    const link = container.append('g')
      .selectAll('line')
      .data(filteredData.links)
      .enter().append('line')
      .attr('stroke', d => getLinkColor(d))
      .attr('stroke-opacity', settings.visual.linkOpacity)
      .attr('stroke-width', d => Math.max(1, d.strength * 3))
      .attr('marker-end', d => d.bidirectional ? undefined : 'url(#arrowhead)');

    // Renderizar nós
    const nodeGroup = container.append('g')
      .selectAll('g')
      .data(filteredData.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Círculos dos nós
    const circles = nodeGroup.append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.color)
      .attr('stroke', d => d.id === currentFileId ? '#ffd700' : '#2d3748')
      .attr('stroke-width', d => d.id === currentFileId ? 3 : 2)
      .style('filter', d => d.id === graphState.selectedNode ? 'brightness(1.5)' : 'none');

    // Labels dos nós
    if (graphState.showLabels) {
      const labels = nodeGroup.append('text')
        .text(d => d.title)
        .attr('dx', d => d.size + 5)
        .attr('dy', 4)
        .attr('font-size', '12px')
        .attr('fill', '#e2e8f0')
        .style('pointer-events', 'none');
    }

    // Eventos de interação
    if (settings.interaction.enableDrag) {
      const drag = d3.drag<SVGGElement, GraphNode>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded);

      nodeGroup.call(drag);
    }

    // Eventos de hover e click
    nodeGroup
      .on('mouseenter', (event, d) => {
        if (settings.interaction.enableHover) {
          setGraphState(prev => ({ ...prev, hoveredNode: d.id }));
          highlightConnections(d.id, true);
        }
      })
      .on('mouseleave', () => {
        setGraphState(prev => ({ ...prev, hoveredNode: null }));
        highlightConnections(null, false);
      })
      .on('click', (event, d) => {
        if (settings.interaction.clickToFocus) {
          setGraphState(prev => ({ ...prev, selectedNode: d.id }));
        }
      })
      .on('dblclick', (event, d) => {
        switch (settings.interaction.doubleClickAction) {
          case 'navigate':
            onFileSelect(d.id);
            break;
          case 'zoom':
            focusOnNode(d.id);
            break;
          case 'expand':
            setGraphState(prev => ({ ...prev, focusMode: true, selectedNode: d.id }));
            break;
        }
      });

    // Função de drag
    function dragStarted(event: any, d: GraphNode) {
      if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: GraphNode) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragEnded(event: any, d: GraphNode) {
      if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
      if (!event.sourceEvent.ctrlKey) {
        d.fx = null;
        d.fy = null;
      }
    }

    // Função para destacar conexões
    function highlightConnections(nodeId: string | null, highlight: boolean) {
      if (!nodeId) {
        link.style('opacity', settings.visual.linkOpacity);
        circles.style('opacity', 1);
        return;
      }

      link.style('opacity', (d: GraphLink) => {
        const sourceId = typeof d.source === 'string' ? d.source : d.source.id;
        const targetId = typeof d.target === 'string' ? d.target : d.target.id;
        return sourceId === nodeId || targetId === nodeId ? 1 : 0.2;
      });

      circles.style('opacity', (d: GraphNode) => {
        const isConnected = filteredData.links.some(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
          const targetId = typeof link.target === 'string' ? link.target : link.target.id;
          return (sourceId === nodeId && targetId === d.id) || 
                 (targetId === nodeId && sourceId === d.id);
        });
        return d.id === nodeId || isConnected ? 1 : 0.3;
      });
    }

    // Função para focar em um nó
    function focusOnNode(nodeId: string) {
      const node = filteredData.nodes.find(n => n.id === nodeId);
      if (!node || !node.x || !node.y) return;

      const scale = 2;
      const translate = [width / 2 - scale * node.x, height / 2 - scale * node.y];

      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }

    // Atualização da simulação
    if (graphState.physics) {
      simulation.on('tick', () => {
        link
          .attr('x1', (d: any) => d.source.x)
          .attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x)
          .attr('y2', (d: any) => d.target.y);

        nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
      });
    } else {
      simulation.stop();
    }

  }, [filteredData, graphState, settings, communityDetection, currentFileId, onFileSelect]);

  // Renderizar clusters no fundo
  const renderClusters = (container: d3.Selection<SVGGElement, unknown, null, undefined>, clusters: any[], nodes: GraphNode[]) => {
    clusters.forEach(cluster => {
      const clusterNodes = nodes.filter(n => cluster.nodes.includes(n.id));
      if (clusterNodes.length < 2) return;

      const hull = d3.polygonHull(clusterNodes.map(n => [n.x || 0, n.y || 0]));
      if (!hull) return;

      container.append('path')
        .datum(hull)
        .attr('d', d3.line().curve(d3.curveCardinalClosed))
        .attr('fill', `url(#cluster-gradient-${cluster.id})`)
        .attr('stroke', cluster.color)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .style('pointer-events', 'none');
    });
  };

  // Layouts diferentes
  const createForceLayout = (nodes: GraphNode[], links: GraphLink[], width: number, height: number, layoutSettings: any) => {
    return d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(layoutSettings.linkDistance))
      .force('charge', d3.forceManyBody().strength(layoutSettings.forceStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d as GraphNode).size + layoutSettings.collisionRadius));
  };

  const createHierarchicalLayout = (nodes: GraphNode[], links: GraphLink[], width: number, height: number) => {
    // Implementação simplificada de layout hierárquico
    const hierarchy = d3.stratify<GraphNode>()
      .id(d => d.id)
      .parentId(d => {
        const parentLink = links.find(l => 
          (typeof l.target === 'string' ? l.target : l.target.id) === d.id
        );
        return parentLink ? (typeof parentLink.source === 'string' ? parentLink.source : parentLink.source.id) : null;
      })(nodes);

    const tree = d3.tree<GraphNode>().size([width, height]);
    tree(hierarchy);

    hierarchy.each(d => {
      if (d.data.x !== undefined) d.data.x = d.x || 0;
      if (d.data.y !== undefined) d.data.y = d.y || 0;
    });

    return d3.forceSimulation(nodes).stop();
  };

  const createCircularLayout = (nodes: GraphNode[], links: GraphLink[], width: number, height: number) => {
    const radius = Math.min(width, height) / 2 - 50;
    const angleStep = (2 * Math.PI) / nodes.length;

    nodes.forEach((node, i) => {
      const angle = i * angleStep;
      node.x = width / 2 + radius * Math.cos(angle);
      node.y = height / 2 + radius * Math.sin(angle);
    });

    return d3.forceSimulation(nodes).stop();
  };

  const createTimelineLayout = (nodes: GraphNode[], links: GraphLink[], width: number, height: number) => {
    const sortedNodes = nodes.sort((a, b) => 
      a.metadata.lastModified.getTime() - b.metadata.lastModified.getTime()
    );

    sortedNodes.forEach((node, i) => {
      node.x = (i / (nodes.length - 1)) * (width - 100) + 50;
      node.y = height / 2 + (Math.random() - 0.5) * 100;
    });

    return d3.forceSimulation(nodes).stop();
  };

  // Funções auxiliares
  const getNodeColor = (file: FileItem): string => {
    const colors = {
      'matemática': '#3b82f6',
      'física': '#ef4444',
      'programação': '#10b981',
      'universidade': '#8b5cf6',
      'projeto': '#f59e0b',
      'estudo': '#06b6d4',
      'livro': '#84cc16',
      'reunião': '#f97316',
      'sem-categoria': '#6b7280'
    };
    
    const primaryTag = file.tags?.[0] || 'sem-categoria';
    return colors[primaryTag as keyof typeof colors] || colors['sem-categoria'];
  };

  const getLinkColor = (link: GraphLink): string => {
    return link.bidirectional ? '#10b981' : '#4a5568';
  };

  const extractFileReferences = (content: string, files: FileItem[]): string[] => {
    const refs: string[] = [];
    const linkRegex = /\[\[([^\]]+)\]\]/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      const refName = match[1];
      const referencedFile = files.find(f => f.name.toLowerCase() === refName.toLowerCase());
      if (referencedFile) {
        refs.push(referencedFile.id);
      }
    }
    
    return refs;
  };

  // Efeitos
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  useEffect(() => {
    const handleResize = () => {
      renderGraph();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderGraph]);

  // Handlers
  const handleLayoutChange = (layout: string) => {
    setGraphState(prev => ({ ...prev, layout: layout as any }));
  };

  const handlePhysicsToggle = () => {
    setGraphState(prev => ({ ...prev, physics: !prev.physics }));
    if (simulationRef.current) {
      if (graphState.physics) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.restart();
      }
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedClusters([]);
    setGraphState(prev => ({
      ...prev,
      selectedNode: null,
      hoveredNode: null,
      focusMode: false,
      zoom: 1,
      pan: { x: 0, y: 0 }
    }));
    
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(500).call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
    }
  };

  // Stats
  const allTags = [...new Set(nodes.flatMap(node => node.metadata.tags))].sort();
  const clusters = communityDetection.map(c => c.name);

  return (
    <div className={cn("flex flex-col h-full bg-notion-dark", className)}>
      <div className="p-4 border-b border-notion-dark-border">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nós no grafo..."
              className="pl-10 bg-notion-dark-hover border-notion-dark-border"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGraphState(prev => ({ ...prev, physics: !prev.physics }))}
            className={cn("gap-2", graphState.physics && "bg-green-600/20")}
          >
            {graphState.physics ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            Física
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setGraphState(prev => ({ ...prev, focusMode: !prev.focusMode }))}
            className={cn("gap-2", graphState.focusMode && "bg-purple-600/20")}
          >
            <Target className="h-4 w-4" />
            Foco
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-4 p-4 bg-notion-dark-hover rounded-lg border border-notion-dark-border"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Força: {Math.abs(settings.layout.forceStrength)}</label>
                <Slider
                  value={[Math.abs(settings.layout.forceStrength)]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({
                      ...prev,
                      layout: { ...prev.layout, forceStrength: -value }
                    }))
                  }
                  max={800}
                  min={100}
                  step={50}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Distância: {settings.layout.linkDistance}</label>
                <Slider
                  value={[settings.layout.linkDistance]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({
                      ...prev,
                      layout: { ...prev.layout, linkDistance: value }
                    }))
                  }
                  max={300}
                  min={50}
                  step={10}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Container do Grafo */}
      <div className="flex-1 relative overflow-hidden" ref={containerRef}>
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          className="bg-notion-dark"
        />
        
        {/* Stats overlay */}
        <motion.div 
          className="absolute top-4 right-4 bg-notion-dark-hover/90 backdrop-blur-sm rounded-lg p-3 border border-notion-dark-border"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-xs text-gray-400 space-y-1">
            <div>Nós: {nodes.length}</div>
            <div>Links: {links.length}</div>
            <div>Clusters: {communityDetection.length}</div>
            {graphState.hoveredNode && (
              <div className="pt-1 border-t border-notion-dark-border">
                <div className="font-medium text-white">
                  {nodes.find(n => n.id === graphState.hoveredNode)?.title}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Painel de detalhes do nó selecionado */}
        <AnimatePresence>
          {graphState.selectedNode && (
            <motion.div
              className="absolute bottom-4 left-4 bg-notion-dark-hover/90 backdrop-blur-sm rounded-lg p-4 border border-notion-dark-border max-w-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
            >
              {(() => {
                const selectedNodeData = nodes.find(n => n.id === graphState.selectedNode);
                return selectedNodeData ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-white">{selectedNodeData.title}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setGraphState(prev => ({ ...prev, selectedNode: null }))}
                      >
                        ×
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Cluster:</span>
                        <Badge variant="secondary" className="ml-2">
                          {selectedNodeData.cluster}
                        </Badge>
                      </div>
                      
                      {selectedNodeData.metadata.tags.length > 0 && (
                        <div>
                          <span className="text-gray-400">Tags:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {selectedNodeData.metadata.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-notion-dark-border text-xs">
                        <div>
                          <span className="text-gray-400">Centralidade:</span>
                          <div className="font-medium text-blue-400">
                            {((centralityAnalysis.degreeCentrality.get(selectedNodeData.id) || 0) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Palavras:</span>
                          <div className="font-medium text-green-400">
                            {selectedNodeData.metadata.wordCount}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => onFileSelect(selectedNodeData.id)}
                          className="flex-1"
                        >
                          Abrir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setGraphState(prev => ({ 
                            ...prev, 
                            focusMode: true, 
                            selectedNode: selectedNodeData.id 
                          }))}
                        >
                          Focar
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}; 