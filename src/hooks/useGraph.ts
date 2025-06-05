
import { useMemo } from 'react';
import { FileItem } from '@/types';
import { parseLinks } from '@/utils/linkParser';

export interface GraphNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  tags: string[];
  connections: number;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  cluster?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'link' | 'folder';
  strength?: number;
}

export const useGraph = (files: FileItem[]) => {
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkSet = new Set<string>();
    const graphLinks: GraphLink[] = [];

    // Criar nós para todos os arquivos
    files.forEach(file => {
      if (file.type === 'file') {
        const fileLinks = file.content ? parseLinks(file.content) : [];
        const connections = fileLinks.length;
        
        // Determinar cluster baseado nas tags
        const primaryTag = file.tags?.[0] || 'sem-categoria';
        
        // Calcular tamanho do nó baseado nas conexões
        const nodeSize = Math.max(8, Math.min(25, 10 + connections * 3));
        
        // Cor baseada no cluster/tag principal
        const colors = {
          'matemática': '#3b82f6',
          'física': '#ef4444',
          'programação': '#10b981',
          'universidade': '#8b5cf6',
          'projeto': '#f59e0b',
          'sem-categoria': '#6b7280'
        };
        
        const nodeColor = colors[primaryTag as keyof typeof colors] || colors['sem-categoria'];

        nodeMap.set(file.id, {
          id: file.id,
          name: file.name,
          type: file.type,
          tags: file.tags || [],
          connections,
          size: nodeSize,
          color: nodeColor,
          cluster: primaryTag
        });
      }
    });

    // Criar links baseados nos links internos
    files.forEach(file => {
      if (file.type === 'file' && file.content) {
        const fileLinks = parseLinks(file.content);
        fileLinks.forEach(link => {
          const targetFile = files.find(f => 
            f.type === 'file' && f.name.toLowerCase() === link.target.toLowerCase()
          );
          
          if (targetFile) {
            const linkKey = `${file.id}-${targetFile.id}`;
            const reverseLinkKey = `${targetFile.id}-${file.id}`;
            
            if (!linkSet.has(linkKey) && !linkSet.has(reverseLinkKey)) {
              linkSet.add(linkKey);
              
              // Calcular força do link baseado em tags compartilhadas
              const sourceNode = nodeMap.get(file.id);
              const targetNode = nodeMap.get(targetFile.id);
              const sharedTags = sourceNode?.tags.filter(tag => 
                targetNode?.tags.includes(tag)
              ).length || 0;
              
              const linkStrength = Math.max(0.3, Math.min(1, 0.5 + sharedTags * 0.2));
              
              graphLinks.push({
                source: file.id,
                target: targetFile.id,
                type: 'link',
                strength: linkStrength
              });
            }
          }
        });
      }
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: graphLinks
    };
  }, [files]);

  const getConnectedNodes = (nodeId: string): string[] => {
    const connected = new Set<string>();
    links.forEach(link => {
      if (link.source === nodeId) {
        connected.add(link.target);
      } else if (link.target === nodeId) {
        connected.add(link.source);
      }
    });
    return Array.from(connected);
  };

  const getNodesByTag = (tag: string): GraphNode[] => {
    return nodes.filter(node => node.tags.includes(tag));
  };

  const getNodesByCluster = (cluster: string): GraphNode[] => {
    return nodes.filter(node => node.cluster === cluster);
  };

  const getClusters = (): string[] => {
    return [...new Set(nodes.map(node => node.cluster || 'sem-categoria'))];
  };

  const getNodeStats = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    const connectedIds = getConnectedNodes(nodeId);
    const connectedNodes = nodes.filter(n => connectedIds.includes(n.id));
    
    return {
      node,
      connectedNodes,
      totalConnections: connectedIds.length,
      incomingLinks: links.filter(l => l.target === nodeId).length,
      outgoingLinks: links.filter(l => l.source === nodeId).length
    };
  };

  return {
    nodes,
    links,
    getConnectedNodes,
    getNodesByTag,
    getNodesByCluster,
    getClusters,
    getNodeStats
  };
};
