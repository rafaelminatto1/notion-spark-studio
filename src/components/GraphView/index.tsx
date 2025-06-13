import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Search, 
  Play,
  Pause,
  Settings,
  Target,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { FileItem } from '@/types';
import { useGraph } from '@/hooks/useGraph';
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
  const simulationRef = useRef<d3.Simulation<any, any> | null>(null);
  
  // Estados
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [linkDistance, setLinkDistance] = useState([120]);
  const [chargeStrength, setChargeStrength] = useState([400]);

  // Usar o hook existente
  const { 
    nodes, 
    links, 
    getConnectedNodes, 
    getClusters, 
    getNodeStats,
    getMostConnectedNodes,
    getMostCentralNodes 
  } = useGraph(files);

  // Filtrar dados
  const filteredData = useMemo(() => {
    let filteredNodes = nodes.filter(node => {
      const matchesSearch = searchQuery === '' || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => node.tags.includes(tag));
      
      return matchesSearch && matchesTags;
    });

    // Modo foco
    if (focusMode && selectedNode) {
      const focusedNodeIds = new Set([selectedNode]);
      const addNeighbors = (nodeId: string, depth: number) => {
        if (depth <= 0) return;
        const neighbors = getConnectedNodes(nodeId);
        neighbors.forEach(neighborId => {
          if (!focusedNodeIds.has(neighborId)) {
            focusedNodeIds.add(neighborId);
            addNeighbors(neighborId, depth - 1);
          }
        });
      };
      addNeighbors(selectedNode, 2);
      filteredNodes = filteredNodes.filter(node => focusedNodeIds.has(node.id));
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => 
      filteredNodeIds.has(link.source as string) &&
      filteredNodeIds.has(link.target as string)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, searchQuery, selectedTags, focusMode, selectedNode, getConnectedNodes]);

  // Renderização principal
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

    // Criar simulação melhorada
    const simulation = d3.forceSimulation(filteredData.nodes)
      .force('link', d3.forceLink(filteredData.links)
        .id((d: any) => d.id)
        .distance(linkDistance[0])
        .strength(d => d.strength || 0.5)
      )
      .force('charge', d3.forceManyBody().strength(-chargeStrength[0]))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d.size || 15) + 8))
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05));

    simulationRef.current = simulation;

    // Definições para gradientes
    const defs = svg.append('defs');
    
    // Gradiente para links especiais
    const gradient = defs.append('linearGradient')
      .attr('id', 'link-gradient')
      .attr('gradientUnits', 'objectBoundingBox');
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981');
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3b82f6');

    // Setas para direcionais
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

    // Renderizar links com animação
    const link = container.append('g')
      .selectAll('line')
      .data(filteredData.links)
      .enter().append('line')
      .attr('stroke', d => d.bidirectional ? 'url(#link-gradient)' : '#4a5568')
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', d => Math.max(1.5, (d.strength || 0.5) * 4))
      .attr('stroke-dasharray', d => d.bidirectional ? 'none' : '5,5')
      .attr('marker-end', d => d.bidirectional ? undefined : 'url(#arrowhead)')
      .style('opacity', 0)
      .transition()
      .duration(500)
      .style('opacity', 1);

    // Renderizar nós com grupos
    const nodeGroup = container.append('g')
      .selectAll('g')
      .data(filteredData.nodes)
      .enter().append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Círculos dos nós com efeitos visuais
    const circles = nodeGroup.append('circle')
      .attr('r', 0)
      .attr('fill', d => d.color)
      .attr('stroke', d => d.id === currentFileId ? '#ffd700' : '#2d3748')
      .attr('stroke-width', d => d.id === currentFileId ? 3 : 2)
      .style('filter', d => d.id === selectedNode ? 'brightness(1.5) drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))' : 'none')
      .transition()
      .duration(500)
      .attr('r', d => d.size || 15);

    // Pulsar para nó selecionado
    if (selectedNode) {
      const selectedCircle = circles.filter((d: any) => d.id === selectedNode);
      selectedCircle
        .transition()
        .duration(1000)
        .attr('r', (d: any) => ((d as any).size || 15) * 1.3)
        .transition()
        .duration(1000)
        .attr('r', (d: any) => (d as any).size || 15)
        .on('end', function repeat() {
          if (selectedNode) {
            d3.select(this)
              .transition()
              .duration(1000)
              .attr('r', (d: any) => ((d as any).size || 15) * 1.3)
              .transition()
              .duration(1000)
              .attr('r', (d: any) => (d as any).size || 15)
              .on('end', repeat);
          }
        });
    }

    // Labels dos nós
    if (showLabels) {
      const labels = nodeGroup.append('text')
        .text(d => d.name)
        .attr('dx', d => (d.size || 15) + 8)
        .attr('dy', 4)
        .attr('font-size', '12px')
        .attr('font-weight', d => d.id === selectedNode ? '600' : '400')
        .attr('fill', d => d.id === selectedNode ? '#ffffff' : '#e2e8f0')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .transition()
        .duration(700)
        .style('opacity', 1);
    }

    // Drag behavior melhorado
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
        if (!event.sourceEvent.ctrlKey) {
          d.fx = null;
          d.fy = null;
        }
      });

    nodeGroup.call(drag);

    // Eventos de interação melhorados
    nodeGroup
      .on('mouseenter', (event, d) => {
        setHoveredNode(d.id);
        
        // Highlight connections
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
        link.style('opacity', 0.7);
        circles.style('opacity', 1);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNode(d.id);
      })
      .on('dblclick', (event, d) => {
        onFileSelect(d.id);
      });

    // Click no fundo para deselecionar
    svg.on('click', () => {
      setSelectedNode(null);
    });

    // Atualização da simulação
    if (isPlaying) {
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

    // Função para focar em um nó
    (svgRef.current as any).focusOnNode = (nodeId: string) => {
      const node = filteredData.nodes.find(n => n.id === nodeId);
      if (!node || !node.x || !node.y) return;

      const scale = 2;
      const translate = [width / 2 - scale * node.x, height / 2 - scale * node.y];

      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    };

    // Reset zoom function
    (svgRef.current as any).resetZoom = () => {
      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity
      );
    };

  }, [filteredData, currentFileId, onFileSelect, isPlaying, showLabels, linkDistance, chargeStrength, selectedNode]);

  // Effects
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
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (simulationRef.current) {
      if (isPlaying) {
        simulationRef.current.stop();
      } else {
        simulationRef.current.restart();
      }
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedNode(null);
    setFocusMode(false);
    if (svgRef.current && (svgRef.current as any).resetZoom) {
      (svgRef.current as any).resetZoom();
    }
  };

  const allTags = [...new Set(nodes.flatMap(node => node.tags))].sort();
  const clusters = getClusters();
  const mostConnected = getMostConnectedNodes(3);
  const nodeStats = selectedNode ? getNodeStats(selectedNode) : null;

  return (
    <div className={cn("flex flex-col h-full bg-notion-dark", className)}>
      {/* Header melhorado */}
      <div className="p-4 border-b border-notion-dark-border space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no grafo de conhecimento..."
              className="pl-10 bg-notion-dark-hover border-notion-dark-border"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className={cn("gap-2", isPlaying && "bg-green-600/20")}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? 'Pausar' : 'Iniciar'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFocusMode(!focusMode)}
            className={cn("gap-2", focusMode && "bg-purple-600/20")}
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Configurações avançadas */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-notion-dark-hover rounded-lg p-4 border border-notion-dark-border"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Distância: {linkDistance[0]}</label>
                  <Slider
                    value={linkDistance}
                    onValueChange={setLinkDistance}
                    max={200}
                    min={50}
                    step={10}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Força: {chargeStrength[0]}</label>
                  <Slider
                    value={chargeStrength}
                    onValueChange={setChargeStrength}
                    max={600}
                    min={200}
                    step={50}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Labels</label>
                  <Switch
                    checked={showLabels}
                    onCheckedChange={setShowLabels}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Performance</label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (simulationRef.current) {
                        simulationRef.current.alphaTarget(0.3).restart();
                      }
                    }}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filtros de tags */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm text-gray-400">Filtrar por tags:</span>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 8).map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer transition-all text-xs",
                    selectedTags.includes(tag) 
                      ? "bg-blue-600 text-white scale-105" 
                      : "bg-notion-dark-hover hover:bg-blue-600/20 hover:scale-105"
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
              {allTags.length > 8 && (
                <span className="text-xs text-gray-500">
                  +{allTags.length - 8} mais
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Container do Grafo */}
      <div className="flex-1 flex">
        <div className="flex-1 overflow-hidden relative" ref={containerRef}>
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="bg-notion-dark"
          />
          
          {/* Stats overlay melhorado */}
          <motion.div 
            className="absolute top-4 right-4 bg-notion-dark-hover/90 backdrop-blur-sm rounded-lg p-3 border border-notion-dark-border"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-xs text-gray-400 space-y-1">
              <div className="font-medium text-white">📊 Métricas</div>
              <div>Nós visíveis: {filteredData.nodes.length}/{nodes.length}</div>
              <div>Conexões: {filteredData.links.length}</div>
              <div>Clusters: {clusters.length}</div>
              {hoveredNode && (
                <div className="pt-1 border-t border-notion-dark-border">
                  <div className="font-medium text-white">
                    🔍 {nodes.find(n => n.id === hoveredNode)?.name}
                  </div>
                  <div>Conexões: {getConnectedNodes(hoveredNode).length}</div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Top nodes overlay */}
          <motion.div 
            className="absolute top-4 left-4 bg-notion-dark-hover/90 backdrop-blur-sm rounded-lg p-3 border border-notion-dark-border max-w-xs"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-xs text-gray-400 space-y-2">
              <div className="font-medium text-white">🌟 Mais Conectados</div>
              {mostConnected.map(node => (
                <div key={node.id} className="flex justify-between items-center">
                  <span 
                    className="truncate cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      setSelectedNode(node.id);
                      if (svgRef.current && (svgRef.current as any).focusOnNode) {
                        (svgRef.current as any).focusOnNode(node.id);
                      }
                    }}
                  >
                    {node.name}
                  </span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {node.connections}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Painel lateral com detalhes melhorado */}
        <AnimatePresence>
          {nodeStats && (
            <motion.div
              className="w-80 border-l border-notion-dark-border bg-notion-dark-hover p-4 overflow-y-auto"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white flex items-center gap-2">
                    📄 Detalhes do Nó
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedNode(null)}
                  >
                    ×
                  </Button>
                </div>
                
                {nodeStats.node && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-gray-400">Nome</div>
                      <div className="text-white font-medium">{nodeStats.node.name}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400">Cluster</div>
                      <Badge variant="secondary" className="mt-1">
                        {nodeStats.node.cluster || 'sem-categoria'}
                      </Badge>
                    </div>
                    
                    {nodeStats.node.tags.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400">Tags</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {nodeStats.node.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-notion-dark-border">
                      <div>
                        <div className="text-sm text-gray-400">Enviados</div>
                        <div className="text-lg font-medium text-green-400">
                          {nodeStats.outgoingLinks}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Recebidos</div>
                        <div className="text-lg font-medium text-blue-400">
                          {nodeStats.incomingLinks}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-400">Centralidade</div>
                      <div className="text-lg font-medium text-purple-400">
                        {((nodeStats.node.centrality || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                    
                    {nodeStats.connectedNodes.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-400 mb-2">
                          🔗 Conectados ({nodeStats.connectedNodes.length})
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {nodeStats.connectedNodes.slice(0, 8).map(connectedNode => (
                            <Button
                              key={connectedNode.id}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedNode(connectedNode.id);
                                onFileSelect(connectedNode.id);
                              }}
                              className="w-full justify-start text-xs h-auto p-2 truncate hover:bg-notion-purple/20"
                            >
                              {connectedNode.name}
                            </Button>
                          ))}
                          {nodeStats.connectedNodes.length > 8 && (
                            <div className="text-xs text-gray-500 px-2">
                              +{nodeStats.connectedNodes.length - 8} mais
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        onClick={() => onFileSelect(nodeStats.node!.id)}
                        className="flex-1"
                      >
                        📖 Abrir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (svgRef.current && (svgRef.current as any).focusOnNode) {
                            (svgRef.current as any).focusOnNode(nodeStats.node!.id);
                          }
                        }}
                      >
                        🎯 Focar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GraphViewEnhanced; 