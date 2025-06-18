import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Play, 
  Pause, 
  Settings, 
  Target, 
  RotateCcw,
  Network,
  BarChart3,
  Navigation,
  X,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff
} from 'lucide-react';
import type { FileItem } from '@/types';
import { useGraph } from '@/hooks/useGraph';
import { useGraphWorker } from '@/hooks/useGraphWorker';
import { useMicroInteractions } from '@/components/ui/MicroInteractions';
import { cn } from '@/lib/utils';
import { GraphAnalytics } from '@/components/GraphView/GraphAnalytics';
import { PathFindingTool } from '@/components/GraphView/PathFindingTool';

// Adapter para converter tipos do useGraph para os tipos novos
const adaptGraphNode = (node: any) => ({
  ...node,
  title: node.name || node.title,
  position: { x: node.x || 0, y: node.y || 0 },
  metadata: {
    lastModified: new Date(),
    wordCount: 0,
    collaborators: [],
    tags: node.tags || []
  }
});

const adaptGraphLink = (link: any) => ({
  ...link,
  type: link.type === 'folder' ? 'parent' : (link.type || 'link'),
  strength: link.strength || 0.5,
  bidirectional: link.bidirectional || false
});

interface GraphViewRevolutionaryProps {
  files: FileItem[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
}

export const GraphViewRevolutionary: React.FC<GraphViewRevolutionaryProps> = ({
  files,
  currentFileId,
  onFileSelect,
  className
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  
  // Estados principais
  const [activeTab, setActiveTab] = useState<'graph' | 'analytics' | 'pathfinding' | 'settings'>('graph');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showOrphans, setShowOrphans] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [linkDistance, setLinkDistance] = useState([120]);
  const [chargeStrength, setChargeStrength] = useState([400]);
  
  // Estados para Path Finding
  const [highlightedPath, setHighlightedPath] = useState<string[]>([]);
  const [sourceNode, setSourceNode] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<string | null>(null);

  // Hook do grafo existente
  const { nodes, links, getConnectedNodes, getNodeStats } = useGraph(files);
  
  // Hook do worker para performance
  const { isReady: workerReady, isCalculating, calculateLayout } = useGraphWorker();
  
  // Hook de micro-interactions
  const { triggerInteractionFeedback } = useMicroInteractions();

  // Adaptar dados para componentes novos
  const adaptedNodes = useMemo(() => nodes.map(adaptGraphNode), [nodes]);
  const adaptedLinks = useMemo(() => links.map(adaptGraphLink), [links]);

  // Filtrar dados baseado nos controles
  const filteredData = useMemo(() => {
    let filteredNodes = nodes.filter(node => {
      const matchesSearch = searchQuery === '' || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => node.tags.includes(tag));
      
      const isOrphan = !links.some(link => 
        link.source === node.id || link.target === node.id
      );
      const showThis = showOrphans || !isOrphan;
      
      return matchesSearch && matchesTags && showThis;
    });

    // Modo foco - mostrar apenas nós conectados ao selecionado
    if (focusMode && selectedNode) {
      const focusedNodeIds = new Set([selectedNode]);
      const connectedNodes = getConnectedNodes(selectedNode);
      connectedNodes.forEach(id => focusedNodeIds.add(id));
      filteredNodes = filteredNodes.filter(node => focusedNodeIds.has(node.id));
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => 
      filteredNodeIds.has(link.source) &&
      filteredNodeIds.has(link.target)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, searchQuery, selectedTags, showOrphans, focusMode, selectedNode, getConnectedNodes]);

  // Renderização principal do grafo com D3
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
      });

    svg.call(zoom);
    const container = svg.append('g');

    // Criar simulação de força melhorada
    const simulation = d3.forceSimulation(filteredData.nodes)
      .force('link', d3.forceLink(filteredData.links)
        .id((d: any) => d.id)
        .distance(linkDistance[0])
        .strength(0.7)
      )
      .force('charge', d3.forceManyBody().strength(-chargeStrength[0]))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d.size || 15) + 8));

    simulationRef.current = simulation;

    // Definições para gradientes e efeitos
    const defs = svg.append('defs');
    
    // Gradiente para links
    const linkGradient = defs.append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('gradientUnits', 'objectBoundingBox');
    linkGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981');
    linkGradient.append('stop').attr('offset', '100%').attr('stop-color', '#3b82f6');

    // Gradiente para path highlighting
    const pathGradient = defs.append('linearGradient')
      .attr('id', 'path-gradient')
      .attr('gradientUnits', 'objectBoundingBox');
    pathGradient.append('stop').attr('offset', '0%').attr('stop-color', '#facc15');
    pathGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f59e0b');

    // Renderizar links
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredData.links)
      .enter().append('line')
      .attr('stroke', (d: any) => {
        // Destacar links no path ativo
        const sourceInPath = highlightedPath.includes(d.source.id || d.source);
        const targetInPath = highlightedPath.includes(d.target.id || d.target);
        
        if (sourceInPath && targetInPath) {
          const sourceIndex = highlightedPath.indexOf(d.source.id || d.source);
          const targetIndex = highlightedPath.indexOf(d.target.id || d.target);
          if (Math.abs(sourceIndex - targetIndex) === 1) {
            return 'url(#path-gradient)';
          }
        }
        
        return 'url(#link-gradient)';
      })
      .attr('stroke-opacity', (d: any) => {
        const sourceInPath = highlightedPath.includes(d.source.id || d.source);
        const targetInPath = highlightedPath.includes(d.target.id || d.target);
        
        if (sourceInPath && targetInPath) {
          const sourceIndex = highlightedPath.indexOf(d.source.id || d.source);
          const targetIndex = highlightedPath.indexOf(d.target.id || d.target);
          if (Math.abs(sourceIndex - targetIndex) === 1) {
            return 1;
          }
        }
        
        return 0.6;
      })
      .attr('stroke-width', (d: any) => {
        const sourceInPath = highlightedPath.includes(d.source.id || d.source);
        const targetInPath = highlightedPath.includes(d.target.id || d.target);
        
        if (sourceInPath && targetInPath) {
          const sourceIndex = highlightedPath.indexOf(d.source.id || d.source);
          const targetIndex = highlightedPath.indexOf(d.target.id || d.target);
          if (Math.abs(sourceIndex - targetIndex) === 1) {
            return 6;
          }
        }
        
        return Math.max(1.5, (d.strength || 0.5) * 3);
      })
      .style('opacity', 0)
      .transition()
      .duration(500)
      .style('opacity', 1);

    // Renderizar nós
    const nodeGroup = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(filteredData.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Círculos dos nós
    const circles = nodeGroup.append('circle')
      .attr('r', 0)
      .attr('fill', d => d.color)
      .attr('stroke', (d: any) => {
        if (highlightedPath.includes(d.id)) {
          return '#facc15';
        }
        if (d.id === selectedNode) return '#3b82f6';
        if (d.id === hoveredNode) return '#10b981';
        if (d.id === currentFileId) return '#ffd700';
        return '#2d3748';
      })
      .attr('stroke-width', (d: any) => {
        if (highlightedPath.includes(d.id)) return 4;
        if (d.id === selectedNode || d.id === hoveredNode) return 3;
        if (d.id === currentFileId) return 3;
        return 2;
      })
      .style('filter', (d: any) => {
        if (highlightedPath.includes(d.id)) {
          return 'brightness(1.5) drop-shadow(0 0 12px rgba(250, 204, 21, 0.8))';
        }
        if (d.id === selectedNode) {
          return 'brightness(1.5) drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))';
        }
        return 'none';
      })
      .transition()
      .duration(500)
      .attr('r', d => d.size || 15);

    // Labels dos nós
    if (showLabels) {
      nodeGroup.append('text')
        .text(d => d.name)
        .attr('dx', d => (d.size || 15) + 8)
        .attr('dy', 4)
        .attr('font-size', '12px')
        .attr('fill', '#e2e8f0')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .transition()
        .duration(700)
        .style('opacity', 1);
    }

    // Drag behavior
    const drag = d3.drag<SVGGElement, any>()
      .on('start', (event, d) => {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active && simulationRef.current) simulationRef.current.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    nodeGroup.call(drag);

    // Eventos de interação
    nodeGroup
      .on('mouseenter', (event, d) => {
        setHoveredNode(d.id);
        // Destacar conexões
        link.style('opacity', (linkData: any) => {
          return linkData.source.id === d.id || linkData.target.id === d.id ? 1 : 0.2;
        });
        circles.style('opacity', (nodeData: any) => {
          const isConnected = filteredData.links.some((linkData: any) => 
            (linkData.source.id === d.id && linkData.target.id === nodeData.id) ||
            (linkData.target.id === d.id && linkData.source.id === nodeData.id)
          );
          return nodeData.id === d.id || isConnected ? 1 : 0.3;
        });
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        link.style('opacity', 1);
        circles.style('opacity', 1);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d.id);
      });

    // Atualizar posições na simulação
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Controlar simulação
    if (!isPlaying) {
      simulation.stop();
    }

  }, [filteredData, linkDistance, chargeStrength, showLabels, selectedNode, hoveredNode, currentFileId, highlightedPath, isPlaying]);

  // Handlers
  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode(nodeId);
    onFileSelect(nodeId);
    
    // Para path finding: definir source/target
    if (activeTab === 'pathfinding') {
      if (!sourceNode) {
        setSourceNode(nodeId);
      } else if (!targetNode && nodeId !== sourceNode) {
        setTargetNode(nodeId);
      } else {
        // Reset e começar novo path
        setSourceNode(nodeId);
        setTargetNode(null);
        setHighlightedPath([]);
      }
    }
  }, [onFileSelect, activeTab, sourceNode, targetNode]);

  const handlePathHighlight = useCallback((path: string[]) => {
    setHighlightedPath(path);
  }, []);

  // Dados derivados
  const allTags = [...new Set(nodes.flatMap(node => node.tags))].sort();
  const nodeStats = selectedNode ? getNodeStats(selectedNode) : null;

  // Efeito para renderizar grafo
  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  return (
    <div className={cn("flex flex-col h-full bg-notion-dark", className)}>
      {/* Header com controles principais */}
      <div className="p-4 border-b border-notion-dark-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Network className="h-5 w-5 text-blue-400" />
              Graph View Revolucionário
            </h2>
            
            {/* Controles de física */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setIsPlaying(!isPlaying); }}
              className={cn("gap-2", isPlaying && "bg-green-600/20")}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              Física
            </Button>
          </div>

          {/* Stats rápidas */}
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>Nós: {filteredData.nodes.length}/{nodes.length}</span>
            <span>Links: {filteredData.links.length}</span>
            {highlightedPath.length > 0 && (
              <Badge variant="default" className="text-xs">
                🛤️ Path: {highlightedPath.length} nós
              </Badge>
            )}
          </div>
        </div>

        {/* Busca e filtros */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              placeholder="Buscar no grafo..."
              className="pl-10 bg-notion-dark-hover border-notion-dark-border"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFocusMode(!focusMode); }}
            className={cn("gap-2", focusMode && "bg-purple-600/20")}
          >
            <Target className="h-4 w-4" />
            Foco
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setShowOrphans(!showOrphans); }}
            className={cn("gap-2", !showOrphans && "bg-red-600/20")}
          >
            {showOrphans ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Órfãos
          </Button>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-gray-400">Tags:</span>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 10).map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer transition-all text-xs",
                    selectedTags.includes(tag) 
                      ? "bg-blue-600 text-white" 
                      : "bg-notion-dark-hover hover:bg-blue-600/20"
                  )}
                  onClick={() => {
                    setSelectedTags(prev => 
                      prev.includes(tag) 
                        ? prev.filter(t => t !== tag)
                        : [...prev, tag]
                    );
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Conteúdo principal com tabs */}
      <div className="flex-1 flex">
        {/* Área do grafo */}
        <div className="flex-1 relative" ref={containerRef}>
          <svg ref={svgRef} width="100%" height="100%" className="bg-notion-dark" />
          
          {/* Status bar no grafo */}
          {highlightedPath.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-notion-dark-hover/90 backdrop-blur-sm rounded-lg p-3 border border-notion-dark-border"
            >
              <div className="flex items-center gap-4">
                <Badge variant="default" className="text-xs">
                  🛤️ Path Ativo: {highlightedPath.length} nós
                </Badge>
                <span className="text-xs text-gray-400">
                  {sourceNode && nodes.find(n => n.id === sourceNode)?.name} 
                  {" → "} 
                  {targetNode && nodes.find(n => n.id === targetNode)?.name}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setHighlightedPath([]);
                    setSourceNode(null);
                    setTargetNode(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Painel lateral com tabs */}
        <div className="w-96 border-l border-notion-dark-border bg-notion-dark-hover">
          <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value as any); }} className="h-full">
            <TabsList className="grid w-full grid-cols-4 bg-notion-dark">
              <TabsTrigger value="graph" className="text-xs">
                <Network className="h-3 w-3 mr-1" />
                Grafo
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs">
                <BarChart3 className="h-3 w-3 mr-1" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="pathfinding" className="text-xs">
                <Navigation className="h-3 w-3 mr-1" />
                Paths
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="h-3 w-3 mr-1" />
                Config
              </TabsTrigger>
            </TabsList>

            <TabsContent value="graph" className="h-full overflow-auto">
              <div className="p-4 space-y-4">
                <Card className="bg-notion-dark border-notion-dark-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Controles Visuais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Distância: {linkDistance[0]}</label>
                      <Slider 
                        value={linkDistance} 
                        onValueChange={setLinkDistance} 
                        max={300} 
                        min={50} 
                        step={10} 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-gray-300">Força: {chargeStrength[0]}</label>
                      <Slider 
                        value={chargeStrength} 
                        onValueChange={setChargeStrength} 
                        max={800} 
                        min={100} 
                        step={50} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Labels</label>
                      <Switch checked={showLabels} onCheckedChange={setShowLabels} />
                    </div>
                  </CardContent>
                </Card>

                {/* Info do nó selecionado */}
                {nodeStats && (
                  <Card className="bg-notion-dark border-notion-dark-border">
                    <CardHeader>
                      <CardTitle className="text-sm">Nó Selecionado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h3 className="font-medium text-white">{nodeStats.node?.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Saída:</span>
                          <div className="text-green-400">{nodeStats.outgoingLinks}</div>
                        </div>
                        <div>
                          <span className="text-gray-400">Entrada:</span>
                          <div className="text-blue-400">{nodeStats.incomingLinks}</div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => { onFileSelect(nodeStats.node!.id); }} 
                        className="w-full"
                      >
                        Abrir Arquivo
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="h-full overflow-auto">
              <GraphAnalytics
                nodes={adaptedNodes}
                links={adaptedLinks}
                selectedNode={selectedNode}
                onNodeSelect={handleNodeClick}
                onPathFind={(source, target) => {
                  setSourceNode(source);
                  setTargetNode(target);
                  setActiveTab('pathfinding');
                }}
              />
            </TabsContent>

            <TabsContent value="pathfinding" className="h-full overflow-auto">
              <PathFindingTool
                nodes={adaptedNodes}
                links={adaptedLinks}
                sourceNode={sourceNode}
                targetNode={targetNode}
                onPathHighlight={handlePathHighlight}
                onNodeSelect={(nodeId) => {
                  if (!sourceNode) {
                    setSourceNode(nodeId);
                  } else if (nodeId !== sourceNode) {
                    setTargetNode(nodeId);
                  }
                }}
              />
            </TabsContent>

            <TabsContent value="settings" className="h-full overflow-auto">
              <div className="p-4 space-y-4">
                <Card className="bg-notion-dark border-notion-dark-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Configurações de Layout</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">Distância entre Links: {linkDistance[0]}</label>
                        <Slider 
                          value={linkDistance} 
                          onValueChange={setLinkDistance} 
                          max={300} 
                          min={50} 
                          step={10} 
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm text-gray-300">Força de Repulsão: {chargeStrength[0]}</label>
                        <Slider 
                          value={chargeStrength} 
                          onValueChange={setChargeStrength} 
                          max={800} 
                          min={100} 
                          step={50} 
                          className="w-full"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-notion-dark border-notion-dark-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Configurações Visuais</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Mostrar Labels</label>
                      <Switch checked={showLabels} onCheckedChange={setShowLabels} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Mostrar Órfãos</label>
                      <Switch checked={showOrphans} onCheckedChange={setShowOrphans} />
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-300">Modo Foco</label>
                      <Switch checked={focusMode} onCheckedChange={setFocusMode} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-notion-dark border-notion-dark-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-400">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-500">Nós visíveis:</span>
                          <div className="text-white font-medium">{filteredData.nodes.length}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Links visíveis:</span>
                          <div className="text-white font-medium">{filteredData.links.length}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Worker ativo:</span>
                          <div className={`font-medium ${workerReady ? 'text-green-400' : 'text-red-400'}`}>
                            {workerReady ? 'Sim' : 'Não'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500">Calculando:</span>
                          <div className={`font-medium ${isCalculating ? 'text-yellow-400' : 'text-green-400'}`}>
                            {isCalculating ? 'Sim' : 'Não'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-notion-dark border-notion-dark-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Exportar Dados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        const data = {
                          nodes: filteredData.nodes,
                          links: filteredData.links,
                          metadata: {
                            exportDate: new Date().toISOString(),
                            nodeCount: filteredData.nodes.length,
                            linkCount: filteredData.links.length
                          }
                        };
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `graph-data-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      📁 Exportar JSON
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        // CSV Export
                        const csvContent = [
                          ['ID', 'Nome', 'Tipo', 'Conexões'].join(','),
                          ...filteredData.nodes.map(node => [
                            node.id,
                            `"${node.name}"`,
                            node.type,
                            filteredData.links.filter(l => l.source === node.id || l.target === node.id).length
                          ].join(','))
                        ].join('\n');
                        
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `graph-nodes-${Date.now()}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      📊 Exportar CSV
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}; 