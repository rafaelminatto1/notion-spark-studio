import React, { useState, useCallback } from 'react';
import { GraphEngine } from './GraphEngine';
import { GraphControls } from './GraphControls';
import { GraphSidebar } from './GraphSidebar';
import { GraphMinimap } from './GraphMinimap';
import { GraphAnalytics } from './GraphAnalytics';
import { useGraphData } from '@/hooks/useGraphData';
import { GraphFilters, GraphNode } from './types';
import { FileItem } from '@/types';
import { findShortestPath } from '@/utils/graphAlgorithms';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

interface GraphContainerProps {
  files: FileItem[];
  currentFileId: string | null;
  onFileSelect: (fileId: string) => void;
  className?: string;
}

export const GraphContainer: React.FC<GraphContainerProps> = ({
  files,
  currentFileId,
  onFileSelect,
  className
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showPathFinding, setShowPathFinding] = useState(false);
  const [pathFindingStart, setPathFindingStart] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState('force');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);

  const [filters, setFilters] = useState<GraphFilters>({
    searchQuery: '',
    nodeTypes: ['file', 'folder', 'database', 'tag'],
    tags: [],
    minConnections: 0,
    showOrphans: true,
    dateRange: null,
  });

  const [layoutSettings, setLayoutSettings] = useState({
    physics: true,
    linkDistance: 120,
    chargeStrength: -400,
    clustering: true,
    centerStrength: 0.3,
    collisionRadius: 15,
  });

  const { nodes, links, isLoading, isProcessing, error, refreshData } = useGraphData(files, filters);

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : undefined;

  const handleNodeClick = useCallback((nodeId: string) => {
    if (showPathFinding) {
      if (!pathFindingStart) {
        setPathFindingStart(nodeId);
        toast({
          title: "Primeiro nó selecionado",
          description: "Agora clique no nó de destino para encontrar o caminho",
        });
      } else {
        if (pathFindingStart !== nodeId) {
          const path = findShortestPath(pathFindingStart, nodeId, links);
          if (path.path.length > 0) {
            toast({
              title: "Caminho encontrado!",
              description: `Caminho com ${path.path.length} nós encontrado`,
            });
          } else {
            toast({
              title: "Nenhum caminho encontrado",
              description: "Não há conexão entre os nós selecionados",
              variant: "destructive",
            });
          }
        }
        setPathFindingStart(null);
        setShowPathFinding(false);
      }
    } else {
      setSelectedNode(nodeId);
      onFileSelect(nodeId);
    }
  }, [showPathFinding, pathFindingStart, nodes, links, onFileSelect]);

  const handleNodeHover = useCallback((nodeId: string | null) => {
    // Implementar highlight de vizinhos
  }, []);

  const handlePathFindingToggle = useCallback((show: boolean) => {
    setShowPathFinding(show);
    setPathFindingStart(null);
  }, []);

  const handlePathFindingFromSidebar = useCallback((targetId: string) => {
    if (selectedNode && selectedNode !== targetId) {
      const path = findShortestPath(selectedNode, targetId, links);
      if (path.path.length > 0) {
        toast({
          title: "Caminho encontrado!",
          description: `Caminho com ${path.path.length} nós encontrado`,
        });
      } else {
        toast({
          title: "Nenhum caminho encontrado",
          description: "Não há conexão entre os nós selecionados",
          variant: "destructive",
        });
      }
    }
  }, [selectedNode, nodes, links]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="text-gray-400">Carregando dados do grafo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <p className="text-red-400">Erro ao carregar dados do grafo</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-black ${className}`}>
      <GraphEngine
        files={files}
        currentFileId={currentFileId}
        onFileSelect={onFileSelect}
        className="w-full h-full"
        filters={filters}
      />

      {isProcessing && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm">Processando dados...</p>
          </div>
        </motion.div>
      )}

      <GraphControls
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        layoutSettings={layoutSettings}
        onLayoutSettingsChange={setLayoutSettings}
        showPathFinding={showPathFinding}
        onShowPathFindingChange={handlePathFindingToggle}
      />

      <GraphSidebar
        selectedNode={selectedNode}
        nodeData={selectedNodeData}
        onClose={() => setSelectedNode(null)}
        onPathFinding={handlePathFindingFromSidebar}
      />

      {showMinimap && (
        <GraphMinimap
          nodes={nodes}
          className="absolute bottom-4 left-4"
        />
      )}

      {showAnalytics && (
        <GraphAnalytics
          nodes={nodes}
          links={links}
          selectedNode={selectedNode}
          className="absolute bottom-4 right-4"
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/10 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-4">
            <span>{nodes.length} nós</span>
            <span>{links.length} links</span>
            {selectedNode && <span>Selecionado: {selectedNodeData?.name}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMinimap(!showMinimap)}
              className="px-2 py-1 rounded hover:bg-white/10"
            >
              Minimap
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="px-2 py-1 rounded hover:bg-white/10"
            >
              Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 