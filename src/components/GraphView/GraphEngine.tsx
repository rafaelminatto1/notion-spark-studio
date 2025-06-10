import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphNode, GraphLink } from './types';

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
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Converter files para nodes e links
  const graphData = React.useMemo(() => {
    const nodes: GraphNode[] = files.map((file, index) => ({
      id: file.id,
      name: file.name,
      type: 'file' as const,
      size: 10,
      color: file.id === currentFileId ? '#8b5cf6' : '#3b82f6',
      connections: 0,
      lastModified: new Date(file.updatedAt || file.createdAt),
      wordCount: file.content?.length || 0,
      collaborators: [],
      tags: [],
      x: Math.random() * 400,
      y: Math.random() * 400,
    }));

    const links: GraphLink[] = [];
    
    // Criar alguns links básicos entre arquivos
    for (let i = 0; i < Math.min(nodes.length - 1, 5); i++) {
      if (nodes[i] && nodes[i + 1]) {
        links.push({
          source: nodes[i].id,
          target: nodes[i + 1].id,
          type: 'link',
          strength: 0.5,
          color: '#3b82f6',
          width: 2,
        });
      }
    }

    return { nodes, links };
  }, [files, currentFileId]);

  const handleNodeClick = (node: any) => {
    setSelectedNode(node.id);
    onFileSelect(node.id);
  };

  const handleNodeHover = (node: any) => {
    setHoveredNode(node?.id || null);
  };

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-300);
      fgRef.current.d3Force('link').distance(80);
    }
  }, []);

  if (!files.length) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Nenhum arquivo para visualizar</p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full bg-background ${className || ''}`}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeId="id"
        nodeLabel="name"
        nodeColor={(node: any) => {
          if (node.id === currentFileId) return '#8b5cf6';
          if (node.id === selectedNode) return '#10b981';
          if (node.id === hoveredNode) return '#f59e0b';
          return '#3b82f6';
        }}
        nodeVal={(node: any) => node.size || 10}
        linkColor={() => 'rgba(100, 116, 139, 0.6)'}
        linkWidth={2}
        backgroundColor="transparent"
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onBackgroundClick={() => {
          setSelectedNode(null);
        }}
        cooldownTicks={100}
        enableNodeDrag={true}
        enableZoomInteraction={true}
        enablePanInteraction={true}
      />
      
      {selectedNode && (
        <div className="absolute top-4 left-4 bg-card p-4 rounded-lg shadow-lg border">
          <h3 className="font-medium text-sm">Arquivo Selecionado</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {graphData.nodes.find(n => n.id === selectedNode)?.name}
          </p>
        </div>
      )}
    </div>
  );
}; 