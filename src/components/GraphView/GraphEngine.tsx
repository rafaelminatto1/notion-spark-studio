import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { GraphNode, GraphLink } from './types';

interface GraphEngineProps {
  files: any[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
  filters: any;
}

export const GraphEngine: React.FC<GraphEngineProps> = ({
  files,
  currentFileId,
  onFileSelect,
  className,
  filters
}) => {
  const fgRef = useRef<any>();
  
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Função para determinar cor baseada no tipo e tags
  const getNodeColor = (file: any) => {
    if (file.id === currentFileId) return '#8b5cf6'; // Roxo para arquivo atual
    
    // Cores baseadas em tipo
    const typeColors = {
      folder: '#f59e0b',    // Amarelo para pastas
      database: '#10b981',  // Verde para databases
      file: '#3b82f6',      // Azul para arquivos
    };
    
    // Cores baseadas em extensão
    const extensionColors = {
      '.md': '#06b6d4',     // Cyan para markdown
      '.js': '#fbbf24',     // Amarelo para JavaScript
      '.ts': '#3b82f6',     // Azul para TypeScript
      '.py': '#10b981',     // Verde para Python
      '.json': '#f59e0b',   // Laranja para JSON
    };
    
    // Verificar extensão
    const extension = file.name.substring(file.name.lastIndexOf('.'));
    if (extensionColors[extension]) {
      return extensionColors[extension];
    }
    
    return typeColors[file.type] || typeColors.file;
  };

  // Calcular tamanho baseado no conteúdo
  const getNodeSize = (file: any) => {
    const baseSize = 8;
    const contentLength = file.content?.length || 0;
    const sizeBonus = Math.min(contentLength / 500, 15); // Max 15px de bônus
    return baseSize + sizeBonus;
  };

  // Usar dados do hook useGraphData
  const { nodes: hookNodes, links: hookLinks } = React.useMemo(() => {
    // Simular dados do hook por enquanto
    const simulatedNodes = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type as 'file' | 'folder' | 'database' | 'tag',
      size: getNodeSize(file),
      color: getNodeColor(file),
      connections: Math.floor(Math.random() * 5), // Temporário
      lastModified: new Date(file.updatedAt || file.createdAt),
      wordCount: file.content?.length || 0,
      collaborators: [],
      tags: [],
      x: Math.random() * 400,
      y: Math.random() * 400,
    }));

    const simulatedLinks = [];
    // Criar conexões mais inteligentes baseadas em nomes similares
    for (let i = 0; i < simulatedNodes.length; i++) {
      for (let j = i + 1; j < simulatedNodes.length; j++) {
        const node1 = simulatedNodes[i];
        const node2 = simulatedNodes[j];
        
        // Conectar se nomes têm palavras em comum
        const words1 = node1.name.toLowerCase().split(/\s+/);
        const words2 = node2.name.toLowerCase().split(/\s+/);
        const commonWords = words1.filter(word => 
          words2.includes(word) && word.length > 3
        );
        
        if (commonWords.length > 0 || Math.random() < 0.1) {
          simulatedLinks.push({
            source: node1.id,
            target: node2.id,
            type: 'link' as const,
            strength: commonWords.length > 0 ? 0.8 : 0.3,
            color: commonWords.length > 0 ? '#10b981' : '#64748b',
            width: commonWords.length > 0 ? 3 : 1,
          });
        }
      }
    }

    return { nodes: simulatedNodes, links: simulatedLinks };
  }, [files, currentFileId]);

  // Aplicar filtros aos dados do grafo
  const filteredGraphData = React.useMemo(() => {
    let filteredNodes = [...hookNodes];
    let filteredLinks = [...hookLinks];

    // Filtro de busca
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter(node =>
        node.name.toLowerCase().includes(query) ||
        (node.tags && node.tags.some(tag => tag.toLowerCase().includes(query)))
      );
      
      // Manter apenas links entre nós filtrados
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = filteredLinks.filter(link =>
        nodeIds.has(link.source as string) && nodeIds.has(link.target as string)
      );
    }

    // Filtro de conexões mínimas
    if (filters.minConnections > 0) {
      // Contar conexões reais
      const connectionCounts = new Map<string, number>();
      filteredLinks.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        
        connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1);
        connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1);
      });

      filteredNodes = filteredNodes.filter(node => 
        (connectionCounts.get(node.id) || 0) >= filters.minConnections
      );

      // Atualizar contadores nos nós
      filteredNodes.forEach(node => {
        node.connections = connectionCounts.get(node.id) || 0;
      });

      // Filtrar links novamente
      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = filteredLinks.filter(link =>
        nodeIds.has(typeof link.source === 'string' ? link.source : link.source.id) && 
        nodeIds.has(typeof link.target === 'string' ? link.target : link.target.id)
      );
    }

    // Filtro de órfãos
    if (!filters.showOrphans) {
      const connectedNodeIds = new Set<string>();
      filteredLinks.forEach(link => {
        connectedNodeIds.add(typeof link.source === 'string' ? link.source : link.source.id);
        connectedNodeIds.add(typeof link.target === 'string' ? link.target : link.target.id);
      });
      
      filteredNodes = filteredNodes.filter(node => connectedNodeIds.has(node.id));
    }

    // Filtros de tipo de arquivo
    if (filters.fileTypes && filters.fileTypes.length > 0) {
      filteredNodes = filteredNodes.filter(node => {
        const extension = node.name.substring(node.name.lastIndexOf('.'));
        return filters.fileTypes.includes(extension) || filters.fileTypes.includes(node.type);
      });

      const nodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = filteredLinks.filter(link =>
        nodeIds.has(typeof link.source === 'string' ? link.source : link.source.id) && 
        nodeIds.has(typeof link.target === 'string' ? link.target : link.target.id)
      );
    }

    return { nodes: filteredNodes, links: filteredLinks };
  }, [hookNodes, hookLinks, filters]);

  const graphData = filteredGraphData;

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
        nodeLabel={(node: any) => `${node.name} (${node.connections} conexões)`}
        nodeColor={(node: any) => {
          if (node.id === currentFileId) return '#8b5cf6'; // Roxo para atual
          if (node.id === selectedNode) return '#10b981';  // Verde para selecionado
          if (node.id === hoveredNode) return '#f59e0b';   // Laranja para hover
          return node.color || '#3b82f6'; // Cor baseada no tipo
        }}
        nodeVal={(node: any) => node.size || 10}
        nodeCanvasObject={(node: any, ctx: any, globalScale: number) => {
          const size = node.size || 10;
          const x = node.x;
          const y = node.y;
          
          // Círculo principal
          ctx.beginPath();
          ctx.arc(x, y, size, 0, 2 * Math.PI);
          ctx.fillStyle = node.color || '#3b82f6';
          ctx.fill();
          
          // Borda especial para arquivo atual
          if (node.id === currentFileId) {
            ctx.strokeStyle = '#8b5cf6';
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Aura effect
            ctx.beginPath();
            ctx.arc(x, y, size + 5, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
          } else {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          
          // Indicador de conexões para nós importantes
          if (node.connections > 3) {
            ctx.beginPath();
            ctx.arc(x + size - 3, y - size + 3, 3, 0, 2 * Math.PI);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();
          }
          
          // Label se zoom suficiente
          if (globalScale > 0.8) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.max(8, 12 / globalScale)}px Arial`;
            ctx.fillText(node.name, x, y + size + 4);
          }
        }}
        linkColor={(link: any) => {
          // Cores baseadas no tipo de link
          const linkColors = {
            'link': '#3b82f6',      // Azul para wiki links
            'tag': '#8b5cf6',       // Roxo para tags compartilhadas
            'parent': '#10b981',    // Verde para hierarquia
            'reference': '#f59e0b', // Laranja para menções
          };
          return linkColors[link.type] || 'rgba(100, 116, 139, 0.6)';
        }}
        linkWidth={(link: any) => link.width || 2}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkDirectionalArrowColor={(link: any) => {
          const linkColors = {
            'link': '#3b82f6',
            'tag': '#8b5cf6',
            'parent': '#10b981',
            'reference': '#f59e0b',
          };
          return linkColors[link.type] || '#64748b';
        }}
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