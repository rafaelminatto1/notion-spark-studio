import React, { useState, useCallback } from 'react';
import { GraphEngine } from './GraphEngine';
import { GraphControls } from './GraphControls';
import { GraphSidebar } from './GraphSidebar';
import { GraphMinimap } from './GraphMinimap';
import { GraphAnalytics } from './GraphAnalytics';
import { GraphHelpOverlay } from './GraphHelpOverlay';
import { PerformanceDashboard } from './PerformanceDashboard';
import { useGraphData } from '@/hooks/useGraphData';
import { useNetworkAnalysis } from '@/hooks/useNetworkAnalysis';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { GraphFilters, GraphNode } from './types';
import { FileItem } from '@/types';
import { findShortestPath } from '@/utils/graphAlgorithms';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import '../../styles/graph-theme.css';

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
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const graphRef = React.useRef<any>();

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
  const { networkMetrics, findOptimalPath, analyzeNeighborhood } = useNetworkAnalysis(nodes, links);

  // Atalhos de teclado
  useKeyboardShortcuts({
    onReset: () => {
      setFilters({
        searchQuery: '',
        nodeTypes: ['file', 'folder', 'database', 'tag'],
        tags: [],
        minConnections: 0,
        showOrphans: true,
        dateRange: null,
      });
      setSelectedNode(null);
      setPathFindingStart(null);
      setShowPathFinding(false);
      if (graphRef.current) {
        graphRef.current.zoomToFit(400);
      }
      toast({
        title: "🔄 Reset realizado!",
        description: "Filtros e visualização resetados",
      });
    },
    onTogglePathFinding: () => setShowPathFinding(!showPathFinding),
    onToggleSettings: () => setShowSettings(!showSettings),
    onToggleMinimap: () => setShowMinimap(!showMinimap),
    onToggleAnalytics: () => setShowAnalytics(!showAnalytics),
    onToggleHelp: () => setShowHelp(!showHelp),
    onTogglePerformance: () => setShowPerformance(!showPerformance),
    onChangeLayout: (layout) => setViewMode(layout),
    onZoomIn: () => graphRef.current?.zoom(graphRef.current.zoom() * 1.2),
    onZoomOut: () => graphRef.current?.zoom(graphRef.current.zoom() * 0.8),
    onZoomFit: () => graphRef.current?.zoomToFit(400),
  });

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : undefined;

  const handleNodeClick = useCallback((nodeId: string) => {
    if (showPathFinding) {
      if (!pathFindingStart) {
        setPathFindingStart(nodeId);
        toast({
          title: "🎯 Primeiro nó selecionado!",
          description: "✨ Agora clique no nó de destino para encontrar o caminho otimizado",
        });
      } else {
        if (pathFindingStart !== nodeId) {
          const pathResult = findOptimalPath(pathFindingStart, nodeId);
          if (pathResult.found) {
            toast({
              title: "🎯 Caminho otimizado encontrado!",
              description: `Distância: ${pathResult.distance} | Nós intermediários: ${pathResult.intermediateNodes.length}`,
            });
            
            // Destacar caminho no grafo (implementar highlight)
            console.log('Caminho:', pathResult.path);
          } else {
            toast({
              title: "❌ Nenhum caminho encontrado",
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
      const pathResult = findOptimalPath(selectedNode, targetId);
      if (pathResult.found) {
        toast({
          title: "🚀 Rota inteligente encontrada!",
          description: `📏 Distância: ${pathResult.distance} | 🔗 Conexões: ${pathResult.intermediateNodes.length}`,
        });
      } else {
        toast({
          title: "🔍 Nenhuma conexão direta",
          description: "💡 Experimente conectar através de tags ou referências",
          variant: "destructive",
        });
      }
    }
  }, [selectedNode, findOptimalPath]);

  if (isLoading) {
    return (
      <div className={`graph-container ${className}`}>
        <motion.div 
          className="graph-loading"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="graph-loading-spinner" />
          <motion.div 
            className="graph-loading-text"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            🧠 Analisando conexões inteligentes...
          </motion.div>
          <motion.div 
            className="text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            Detectando padrões e comunidades
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`graph-container ${className}`}>
        <motion.div 
          className="graph-loading"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="text-6xl mb-4"
            initial={{ opacity: 0, rotate: -10 }}
            animate={{ opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            🔧
          </motion.div>
          <motion.div 
            className="text-xl font-semibold text-red-400 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Ops! Algo deu errado
          </motion.div>
          <motion.p 
            className="text-sm text-gray-400 mb-6 max-w-md text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {error}
          </motion.p>
          <motion.button 
            onClick={refreshData}
            className="graph-button px-6 py-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 Tentar novamente
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`graph-container relative w-full h-full overflow-hidden ${className}`}>
      <GraphEngine
        files={files}
        currentFileId={currentFileId}
        onFileSelect={onFileSelect}
        className="w-full h-full"
        filters={filters}
        viewMode={viewMode}
        layoutSettings={layoutSettings}
      />

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="graph-card p-6 text-white text-center min-w-[200px]">
              <motion.div 
                className="text-3xl mb-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                🔄
              </motion.div>
              <motion.p 
                className="text-sm font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                🧮 Calculando métricas...
              </motion.p>
              <motion.div 
                className="text-xs text-gray-400 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Centralidade • Comunidades • Caminhos
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          graphRef={graphRef}
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

      {/* Performance Dashboard */}
      {showPerformance && (
        <PerformanceDashboard
          nodeCount={nodes.length}
          linkCount={links.length}
          visibleNodes={nodes.length} // Para agora, todos são visíveis
          className="absolute top-4 left-4 z-20"
        />
      )}

      {/* Help Overlay */}
      <GraphHelpOverlay
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

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
            <button
              onClick={() => setShowPerformance(!showPerformance)}
              className="px-2 py-1 rounded hover:bg-white/10"
            >
              Performance
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="px-2 py-1 rounded hover:bg-white/10"
            >
              Ajuda (?)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 