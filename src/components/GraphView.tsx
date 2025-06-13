import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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
  EyeOff
} from 'lucide-react';
import { GraphNode, GraphLink, useGraph } from '@/hooks/useGraph';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface GraphViewProps {
  files: FileItem[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
}

interface GraphLinkWithForce {
  source: GraphNodeWithForce;
  target: GraphNodeWithForce;
}

interface GraphNodeWithForce extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
}

export const GraphView: React.FC<GraphViewProps> = ({
  files,
  currentFileId,
  onFileSelect,
  className
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  
  // State para filtros e controles
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedClusters, setSelectedClusters] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showOrphans, setShowOrphans] = useState(true);
  const [linkDistance, setLinkDistance] = useState([120]);
  const [chargeStrength, setChargeStrength] = useState([400]);
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusDepth, setFocusDepth] = useState([2]);
  
  const { 
    nodes, 
    links, 
    getConnectedNodes, 
    getClusters, 
    getNodeStats,
    getMostConnectedNodes,
    getMostCentralNodes 
  } = useGraph(files);

  // Filtrar nós e links baseado nos filtros ativos
  const filteredData = useCallback(() => {
    let filteredNodes = nodes.filter(node => {
      const matchesSearch = searchQuery === '' || 
        node.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => node.tags.includes(tag));
      
      const matchesClusters = selectedClusters.length === 0 ||
        selectedClusters.includes(node.cluster || 'sem-categoria');
      
      const isOrphan = node.connections === 0;
      const showThis = showOrphans || !isOrphan;
      
      return matchesSearch && matchesTags && matchesClusters && showThis;
    });

    // Modo foco: mostrar apenas nós conectados ao selecionado
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
      addNeighbors(selectedNode, focusDepth[0]);
      filteredNodes = filteredNodes.filter(node => focusedNodeIds.has(node.id));
    }

    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = links.filter(link => 
      filteredNodeIds.has(link.source as string) &&
      filteredNodeIds.has(link.target as string)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, searchQuery, selectedTags, selectedClusters, showOrphans, focusMode, selectedNode, focusDepth, getConnectedNodes]);

  const { nodes: visibleNodes, links: visibleLinks } = filteredData();
  const allTags = [...new Set(nodes.flatMap(node => node.tags))].sort();
  const clusters = getClusters();

  // Função para resetar simulação
  const resetSimulation = useCallback(() => {
    if (!svgRef.current || visibleNodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    
    // Criar zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
      });

    svg.call(zoom);
    const container = svg.append('g');

    // Criar simulação de força
    const simulation = d3.forceSimulation<GraphNode>(visibleNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(visibleLinks)
        .id((d: any) => d.id)
        .distance(linkDistance[0])
        .strength((d: any) => d.strength || 0.5)
      )
      .force('charge', d3.forceManyBody().strength(-chargeStrength[0]))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => (d.size || 15) + 5));

    simulationRef.current = simulation;

    // Criar definições para gradientes e padrões
    const defs = svg.append('defs');
    
    // Gradientes para links bidirecionais
    visibleLinks.forEach((link, i) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `gradient-${i}`)
        .attr('gradientUnits', 'objectBoundingBox');
      
      if (link.bidirectional) {
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', '#10b981');
        gradient.append('stop')
          .attr('offset', '50%')
          .attr('stop-color', '#3b82f6');
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', '#10b981');
      } else {
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', '#4a5568');
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', '#718096');
      }
    });

    // Criar links
    const link = container.append('g')
      .selectAll('line')
      .data(visibleLinks)
      .enter().append('line')
      .attr('stroke', (d, i) => `url(#gradient-${i})`)
      .attr('stroke-opacity', 0.7)
      .attr('stroke-width', (d: any) => Math.max(1.5, (d.strength || 0.5) * 4))
      .attr('stroke-dasharray', (d: any) => d.bidirectional ? 'none' : '5,5')
      .attr('marker-end', 'url(#arrowhead)');

    // Adicionar setas
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#4a5568');

    // Criar grupos para os nós
    const nodeGroup = container.append('g')
      .selectAll('g')
      .data(visibleNodes)
      .enter().append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          (d as GraphNodeWithForce).fx = (d as GraphNodeWithForce).x;
          (d as GraphNodeWithForce).fy = (d as GraphNodeWithForce).y;
        })
        .on('drag', (event, d) => {
          (d as GraphNodeWithForce).fx = event.x;
          (d as GraphNodeWithForce).fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          (d as GraphNodeWithForce).fx = null;
          (d as GraphNodeWithForce).fy = null;
        })
      );

    // Adicionar círculos externos (aura effect)
    nodeGroup.append('circle')
      .attr('r', (d) => (d.size || 15) + 6)
      .attr('fill', 'none')
      .attr('stroke', (d) => d.color || '#6b7280')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', (d) => d.id === currentFileId ? 0.8 : 0.2)
      .style('filter', (d) => d.id === currentFileId ? 'drop-shadow(0 0 15px currentColor)' : 'none');

    // Adicionar círculos principais
    nodeGroup.append('circle')
      .attr('r', (d) => d.size || 15)
      .attr('fill', (d) => {
        if (d.id === currentFileId) return '#8b5cf6';
        return d.color || '#6b7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('filter', (d) => d.id === currentFileId ? 'drop-shadow(0 0 10px #8b5cf6)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))');

    // Adicionar indicadores de centralidade
    nodeGroup.append('circle')
      .attr('r', (d) => Math.max(2, (d.centrality || 0) * 8))
      .attr('cx', (d) => (d.size || 15) - 8)
      .attr('cy', (d) => -(d.size || 15) + 8)
      .attr('fill', '#fbbf24')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('opacity', (d) => (d.centrality || 0) > 0.1 ? 1 : 0);

    // Adicionar labels dos nós
    if (showLabels) {
      nodeGroup.append('text')
        .text((d) => d.name)
        .attr('x', 0)
        .attr('y', (d) => -(d.size || 15) - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e2e8f0')
        .attr('font-size', '12px')
        .attr('font-weight', (d) => d.id === currentFileId ? 'bold' : 'normal')
        .style('pointer-events', 'none')
        .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');
    }

    // Event handlers
    nodeGroup
      .on('click', (event, d) => {
        setSelectedNode(d.id);
        onFileSelect(d.id);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d.id);
        
        const connectedIds = getConnectedNodes(d.id);
        
        nodeGroup.selectAll('circle')
          .transition().duration(200)
          .attr('opacity', (nodeData: any) => 
            nodeData.id === d.id || connectedIds.includes(nodeData.id) ? 1 : 0.3
          );
        
        link.transition().duration(200)
          .attr('opacity', (linkData: any) =>
            linkData.source.id === d.id || linkData.target.id === d.id ? 1 : 0.2
          );
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        nodeGroup.selectAll('circle').transition().duration(200).attr('opacity', 1);
        link.transition().duration(200).attr('opacity', 0.7);
      });

    if (!isPlaying) {
      simulation.stop();
    }

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeGroup.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    const resetZoom = () => {
      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity
      );
    };

    (svgRef.current as any).resetZoom = resetZoom;

  }, [visibleNodes, visibleLinks, currentFileId, onFileSelect, getConnectedNodes, isPlaying, showLabels, linkDistance, chargeStrength]);

  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

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

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClusterToggle = (cluster: string) => {
    setSelectedClusters(prev =>
      prev.includes(cluster)
        ? prev.filter(c => c !== cluster)
        : [...prev, cluster]
    );
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedClusters([]);
    setSelectedNode(null);
    setFocusMode(false);
    if (svgRef.current && (svgRef.current as any).resetZoom) {
      (svgRef.current as any).resetZoom();
    }
  };

  const nodeStats = selectedNode ? getNodeStats(selectedNode) : null;
  const mostConnected = getMostConnectedNodes(3);
  const mostCentral = getMostCentralNodes(3);

  return (
    <div className={cn("flex flex-col h-full bg-notion-dark", className)}>
      {/* Header Controls */}
      <div className="p-4 border-b border-notion-dark-border space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar arquivos..."
              className="pl-10 bg-notion-dark-hover border-notion-dark-border"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="gap-2"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFocusMode(!focusMode)}
            className={cn("gap-2", focusMode && "bg-notion-purple/20")}
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
          </Button>
        </div>

        {/* Configurações avançadas */}
        {showSettings && (
          <Card className="p-4 bg-notion-dark-hover border-notion-dark-border">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Labels</label>
                  <Switch
                    checked={showLabels}
                    onCheckedChange={setShowLabels}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Órfãos</label>
                  <Switch
                    checked={showOrphans}
                    onCheckedChange={setShowOrphans}
                  />
                </div>
              </div>
              
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
                <label className="text-sm text-gray-300">Repulsão: {chargeStrength[0]}</label>
                <Slider
                  value={chargeStrength}
                  onValueChange={setChargeStrength}
                  max={600}
                  min={200}
                  step={50}
                />
              </div>

              {focusMode && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Profundidade do Foco: {focusDepth[0]}</label>
                  <Slider
                    value={focusDepth}
                    onValueChange={setFocusDepth}
                    max={4}
                    min={1}
                    step={1}
                  />
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Clusters */}
          {clusters.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Clusters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {clusters.map(cluster => (
                  <Badge
                    key={cluster}
                    variant={selectedClusters.includes(cluster) ? "default" : "secondary"}
                    className={cn(
                      "cursor-pointer transition-colors text-xs",
                      selectedClusters.includes(cluster) 
                        ? "bg-notion-purple text-white" 
                        : "bg-notion-dark-hover hover:bg-notion-purple/20"
                    )}
                    onClick={() => handleClusterToggle(cluster)}
                  >
                    {cluster} ({nodes.filter(n => n.cluster === cluster).length})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm text-gray-400">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 8).map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "secondary"}
                    className={cn(
                      "cursor-pointer transition-colors text-xs",
                      selectedTags.includes(tag) 
                        ? "bg-blue-600 text-white" 
                        : "bg-notion-dark-hover hover:bg-blue-600/20"
                    )}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
                {allTags.length > 8 && (
                  <span className="text-xs text-gray-500">
                    +{allTags.length - 8}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Graph Container */}
      <div className="flex-1 flex">
        <div className="flex-1 overflow-hidden relative">
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className="bg-notion-dark"
          />
          
          {/* Stats overlay */}
          <div className="absolute top-4 right-4 bg-notion-dark-hover/90 backdrop-blur-sm rounded-lg p-3 border border-notion-dark-border">
            <div className="text-xs text-gray-400 space-y-1">
              <div>Nós: {visibleNodes.length}</div>
              <div>Links: {visibleLinks.length}</div>
              <div>Clusters: {clusters.length}</div>
              {hoveredNode && (
                <div className="pt-1 border-t border-notion-dark-border">
                  <div className="font-medium text-white">
                    {nodes.find(n => n.id === hoveredNode)?.name}
                  </div>
                  <div>Conexões: {getConnectedNodes(hoveredNode).length}</div>
                </div>
              )}
            </div>
          </div>

          {/* Top nodes overlay */}
          <div className="absolute top-4 left-4 bg-notion-dark-hover/90 backdrop-blur-sm rounded-lg p-3 border border-notion-dark-border max-w-xs">
            <div className="text-xs text-gray-400 space-y-2">
              <div>
                <div className="font-medium text-white mb-1">Mais Conectados</div>
                {mostConnected.map(node => (
                  <div key={node.id} className="flex justify-between">
                    <span className="truncate">{node.name}</span>
                    <span>{node.connections}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-2 border-t border-notion-dark-border">
                <div className="font-medium text-white mb-1">Mais Centrais</div>
                {mostCentral.map(node => (
                  <div key={node.id} className="flex justify-between">
                    <span className="truncate">{node.name}</span>
                    <span>{((node.centrality || 0) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Painel lateral com detalhes */}
        {nodeStats && (
          <div className="w-80 border-l border-notion-dark-border bg-notion-dark-hover p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-400" />
                <h3 className="font-medium text-white">Detalhes</h3>
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
                      <div className="text-sm text-gray-400">Links enviados</div>
                      <div className="text-lg font-medium text-green-400">
                        {nodeStats.outgoingLinks}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Links recebidos</div>
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
                        Conectados ({nodeStats.connectedNodes.length})
                      </div>
                      <div className="space-y-1">
                        {nodeStats.connectedNodes.slice(0, 8).map(connectedNode => (
                          <Button
                            key={connectedNode.id}
                            variant="ghost"
                            size="sm"
                            onClick={() => onFileSelect(connectedNode.id)}
                            className="w-full justify-start text-xs h-auto p-2 truncate"
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
