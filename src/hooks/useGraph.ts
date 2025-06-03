
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
}

export interface GraphLink {
  source: string;
  target: string;
  type: 'link' | 'folder';
}

export const useGraph = (files: FileItem[]) => {
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>();
    const linkSet = new Set<string>();
    const graphLinks: GraphLink[] = [];

    // Criar nós para todos os arquivos
    files.forEach(file => {
      if (file.type === 'file') {
        const connections = file.content ? parseLinks(file.content).length : 0;
        nodeMap.set(file.id, {
          id: file.id,
          name: file.name,
          type: file.type,
          tags: file.tags || [],
          connections
        });
      }
    });

    // Criar links baseados nos links internos
    files.forEach(file => {
      if (file.type === 'file' && file.content) {
        const links = parseLinks(file.content);
        links.forEach(link => {
          const targetFile = files.find(f => 
            f.type === 'file' && f.name.toLowerCase() === link.target.toLowerCase()
          );
          
          if (targetFile) {
            const linkKey = `${file.id}-${targetFile.id}`;
            if (!linkSet.has(linkKey)) {
              linkSet.add(linkKey);
              graphLinks.push({
                source: file.id,
                target: targetFile.id,
                type: 'link'
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

  return {
    nodes,
    links,
    getConnectedNodes,
    getNodesByTag
  };
};
