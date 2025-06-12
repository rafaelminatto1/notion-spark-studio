import { useState, useEffect, useMemo, useCallback } from 'react';
import { GraphNode, GraphLink, GraphFilters } from '@/components/GraphView/types';
import { FileItem } from '@/types';

interface UseGraphDataReturn {
  nodes: GraphNode[];
  links: GraphLink[];
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const useGraphData = (files: FileItem[], filters: GraphFilters): UseGraphDataReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);

  const processFilesToNodes = useCallback((fileItems: FileItem[]): GraphNode[] => {
    return fileItems.map(file => {
      const connections = calculateConnections(file, fileItems);
      const color = getNodeColorByType(file.type || 'file');
      const size = calculateNodeSize(file, connections);
      
      return {
        id: file.id,
        title: file.name, // Alterado para title conforme interface padrão
        type: (file.type as any) || 'file',
        size,
        color,
        position: { x: Math.random() * 800, y: Math.random() * 600 }, // Posição inicial
        connections: [], // Será calculado em uma estrutura diferente
        metadata: {
          lastModified: new Date(file.updatedAt || file.createdAt),
          wordCount: calculateWordCount(file.content || ''),
          collaborators: extractCollaborators(file),
          tags: extractTags(file),
          fileSize: file.content?.length || 0,
          language: detectLanguage(file.content || ''),
          isTemplate: file.name.toLowerCase().includes('template'),
          isShared: false,
          accessLevel: 'private',
        },
      };
    });
  }, []);

  const processFilesToLinks = useCallback((fileItems: FileItem[]): GraphLink[] => {
    const links: GraphLink[] = [];
    
    for (const file of fileItems) {
      const content = file.content || '';
      
      // 1. Wiki Links [[arquivo]]
      const wikiLinks = extractWikiLinks(content);
      for (const linkName of wikiLinks) {
        const targetFile = fileItems.find(f => 
          f.name.toLowerCase() === linkName.toLowerCase() || 
          f.name.toLowerCase().includes(linkName.toLowerCase()) ||
          f.id === linkName
        );
        
        if (targetFile && targetFile.id !== file.id) {
          links.push({
            source: file.id,
            target: targetFile.id,
            type: 'link',
            strength: 0.9,
            color: '#3b82f6',
            width: 3,
            bidirectional: false,
          });
        }
      }
      
      // 2. Tags compartilhadas
      const fileTags = extractTags(file);
      for (const otherFile of fileItems) {
        if (otherFile.id === file.id) continue;
        
        const otherTags = extractTags(otherFile);
        const sharedTags = fileTags.filter(tag => otherTags.includes(tag));
        
        if (sharedTags.length > 0) {
          // Evitar links duplicados
          const existingLink = links.find(l => 
            (l.source === file.id && l.target === otherFile.id) ||
            (l.source === otherFile.id && l.target === file.id)
          );
          
          if (!existingLink) {
            links.push({
              source: file.id,
              target: otherFile.id,
              type: 'tag',
              strength: Math.min(0.7, sharedTags.length * 0.2),
              color: '#8b5cf6',
              width: Math.min(3, sharedTags.length),
              bidirectional: false,
            });
          }
        }
      }
      
      // 3. Hierarquia de pastas
      if (file.parentId) {
        const parentExists = fileItems.some(f => f.id === file.parentId);
        if (parentExists) {
          links.push({
            source: file.parentId,
            target: file.id,
            type: 'parent',
            strength: 1.0,
            color: '#10b981',
            width: 2,
            bidirectional: false,
          });
        }
      }
      
      // 4. Menções @arquivo
      const mentions = extractMentions(content);
      for (const mention of mentions) {
        const targetFile = fileItems.find(f => 
          f.name.toLowerCase().includes(mention.toLowerCase())
        );
        
        if (targetFile && targetFile.id !== file.id) {
          // Evitar links duplicados
          const existingLink = links.find(l => 
            l.source === file.id && l.target === targetFile.id
          );
          
          if (!existingLink) {
            links.push({
              source: file.id,
              target: targetFile.id,
              type: 'reference',
              strength: 0.6,
              color: '#f59e0b',
              width: 2,
              bidirectional: false,
            });
          }
        }
      }
    }

    return links;
  }, []);

  const filteredData = useMemo(() => {
    setIsProcessing(true);
    
    try {
      let filteredNodes = [...nodes];
      let filteredLinks = [...links];

      if (filters.nodeTypes.length > 0) {
        filteredNodes = filteredNodes.filter(node => 
          filters.nodeTypes.includes(node.type)
        );
      }

      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredNodes = filteredNodes.filter(node =>
          node.title.toLowerCase().includes(query) ||
          node.metadata.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
      filteredLinks = filteredLinks.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id;
        const targetId = typeof link.target === 'string' ? link.target : link.target.id;
        return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
      });

      return { nodes: filteredNodes, links: filteredLinks };
      
    } finally {
      setIsProcessing(false);
    }
  }, [nodes, links, filters]);

  useEffect(() => {
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const newNodes = processFilesToNodes(files);
      const newLinks = processFilesToLinks(files);
      setNodes(newNodes);
      setLinks(newLinks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar dados do grafo');
    } finally {
      setIsLoading(false);
    }
  }, [files, processFilesToNodes, processFilesToLinks]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const newNodes = processFilesToNodes(files);
      const newLinks = processFilesToLinks(files);
      setNodes(newNodes);
      setLinks(newLinks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados');
    } finally {
      setIsLoading(false);
    }
  }, [files, processFilesToNodes, processFilesToLinks]);

  return {
    nodes: filteredData.nodes,
    links: filteredData.links,
    isLoading,
    isProcessing,
    error,
    refreshData,
  };
};

function calculateConnections(file: FileItem, allFiles: FileItem[]): number {
  let connections = 0;
  const content = file.content || '';
  const wikiLinks = extractWikiLinks(content);
  connections += wikiLinks.length;
  
  for (const otherFile of allFiles) {
    if (otherFile.id === file.id) continue;
    const otherContent = otherFile.content || '';
    if (extractWikiLinks(otherContent).some(link => 
      link.toLowerCase() === file.name.toLowerCase() || link === file.id
    )) {
      connections++;
    }
  }
  
  return connections;
}

function getNodeColorByType(type: string): string {
  const colors = { 
    file: '#3b82f6', 
    folder: '#f59e0b', 
    database: '#10b981', 
    tag: '#8b5cf6' 
  };
  return colors[type as keyof typeof colors] || '#6b7280';
}

function calculateNodeSize(file: FileItem, connections: number): number {
  const baseSize = 8;
  const connectionBonus = Math.min(connections * 2, 20);
  const contentBonus = Math.min((file.content?.length || 0) / 1000, 10);
  return baseSize + connectionBonus + contentBonus;
}

function calculateWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function extractCollaborators(file: FileItem): string[] {
  return [];
}

function extractTags(file: FileItem): string[] {
  const content = file.content || '';
  const tagMatches = content.match(/#\w+/g) || [];
  const contentTags = tagMatches.map(tag => tag.substring(1));
  
  // Adicionar tags de metadata se existirem
  const metadataTags = file.tags || [];
  
  // Combinar e remover duplicatas
  return [...new Set([...contentTags, ...metadataTags])];
}

function extractWikiLinks(content: string): string[] {
  const matches = content.match(/\[\[([^\]]+)\]\]/g) || [];
  return matches.map(match => match.slice(2, -2));
}

function extractMentions(content: string): string[] {
  const matches = content.match(/@([a-zA-Z0-9_-]+)/g) || [];
  return matches.map(match => match.slice(1));
}

function detectLanguage(content: string): string {
  if (content.includes('function') || content.includes('const') || content.includes('import')) {
    return 'javascript';
  }
  if (content.includes('def ') || content.includes('import ')) {
    return 'python';
  }
  return 'markdown';
} 