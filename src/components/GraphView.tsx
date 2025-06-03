
import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, RotateCcw, Search, Filter } from 'lucide-react';
import { GraphNode, GraphLink, useGraph } from '@/hooks/useGraph';
import { FileItem } from '@/types';
import { cn } from '@/lib/utils';

interface GraphViewProps {
  files: FileItem[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
}

export const GraphView: React.FC<GraphViewProps> = ({
  files,
  currentFileId,
  onFileSelect,
  className
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  const { nodes, links, getConnectedNodes } = useGraph(files);

  // Filtrar nós baseado na busca e tags
  const filteredNodes = nodes.filter(node => {
    const matchesSearch = searchQuery === '' || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => node.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const filteredLinks = links.filter(link => 
    filteredNodes.some(node => node.id === link.source) &&
    filteredNodes.some(node => node.id === link.target)
  );

  // Obter todas as tags únicas
  const allTags = [...new Set(nodes.flatMap(node => node.tags))].sort();

  useEffect(() => {
    if (!svgRef.current || filteredNodes.length === 0) return;

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
    const simulation = d3.forceSimulation<GraphNode>(filteredNodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(filteredLinks)
        .id((d: any) => d.id)
        .distance(80)
        .strength(0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));

    // Criar links
    const link = container.append('g')
      .selectAll('line')
      .data(filteredLinks)
      .enter().append('line')
      .attr('stroke', '#4a5568')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Criar nós
    const node = container.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter().append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Adicionar círculos aos nós
    node.append('circle')
      .attr('r', (d) => Math.max(8, Math.min(20, 8 + d.connections * 2)))
      .attr('fill', (d) => {
        if (d.id === currentFileId) return '#6b46c1';
        if (d.tags.length > 0) return '#3b82f6';
        return '#6b7280';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Adicionar labels
    node.append('text')
      .text((d) => d.name)
      .attr('x', 0)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '12px')
      .attr('font-weight', (d) => d.id === currentFileId ? 'bold' : 'normal');

    // Event handlers
    node
      .on('click', (event, d) => {
        onFileSelect(d.id);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNode(d.id);
        
        // Destacar conexões
        const connectedIds = getConnectedNodes(d.id);
        
        node.selectAll('circle')
          .attr('opacity', (nodeData: any) => 
            nodeData.id === d.id || connectedIds.includes(nodeData.id) ? 1 : 0.3
          );
        
        link.attr('opacity', (linkData: any) =>
          linkData.source.id === d.id || linkData.target.id === d.id ? 1 : 0.1
        );
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        node.selectAll('circle').attr('opacity', 1);
        link.attr('opacity', 0.6);
      });

    // Atualizar posições na simulação
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Função para resetar zoom
    const resetZoom = () => {
      svg.transition().duration(500).call(
        zoom.transform,
        d3.zoomIdentity
      );
    };

    // Expor função de reset no elemento
    (svgRef.current as any).resetZoom = resetZoom;

  }, [filteredNodes, filteredLinks, currentFileId, onFileSelect, getConnectedNodes]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTags([]);
    if (svgRef.current && (svgRef.current as any).resetZoom) {
      (svgRef.current as any).resetZoom();
    }
  };

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
            onClick={handleReset}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filtrar por tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  className={cn(
                    "cursor-pointer transition-colors",
                    selectedTags.includes(tag) 
                      ? "bg-notion-purple text-white" 
                      : "bg-notion-dark-hover hover:bg-notion-purple/20"
                  )}
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Graph Container */}
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
            <div>Arquivos: {filteredNodes.length}</div>
            <div>Conexões: {filteredLinks.length}</div>
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
      </div>
    </div>
  );
};
