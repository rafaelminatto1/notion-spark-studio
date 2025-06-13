import React, { useState, useCallback } from 'react';
import { GraphEngine } from './GraphEngine';
import { GraphControls } from './GraphControls';
import { GraphSidebar } from './GraphSidebar';
import { GraphMinimap } from './GraphMinimap';
import { GraphAnalytics } from './GraphAnalytics';
import { GraphHelpOverlay } from './GraphHelpOverlay';
import { PerformanceDashboard } from './PerformanceDashboard';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { GraphViewRevolutionary } from '../GraphViewRevolutionary';
import { useGraphData } from '@/hooks/useGraphData';
import { useNetworkAnalysis } from '@/hooks/useNetworkAnalysis';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { GraphFilters, GraphNode, LayoutSettings, ViewMode } from './types';
import { FileItem } from '@/types';
import { findShortestPath } from '@/utils/graphAlgorithms';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Network } from 'lucide-react';
import '../../styles/graph-theme.css';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

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
  const [viewMode, setViewMode] = useState<ViewMode>('force');
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);
  const [useRevolutionary, setUseRevolutionary] = useState(true); // Novo estado para toggle
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [aiInsights, setAiInsights] = useState<{
    recommendations: string[];
    anomalies: string[];
    suggestions: string[];
  }>({
    recommendations: [],
    anomalies: [],
    suggestions: []
  });
  const graphRef = React.useRef<any>();

  const [filters, setFilters] = useState<GraphFilters>({
    searchQuery: '',
    nodeTypes: ['file', 'folder', 'database', 'tag'],
    tags: [],
    minConnections: 0,
    showOrphans: true,
    dateRange: null,
  });

  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>({
    type: 'force',
    forceStrength: 1,
    linkDistance: 120,
    collisionRadius: 15,
    centeringStrength: 0.3,
    physics: true,
  });

  const { nodes, links, isLoading, isProcessing, error, refreshData } = useGraphData(files, filters);
  const { networkMetrics, findOptimalPath, analyzeNeighborhood } = useNetworkAnalysis(nodes, links);

  // Análise automática de IA
  React.useEffect(() => {
    if (!aiAnalysisEnabled || nodes.length === 0) return;

    const runAIAnalysis = () => {
      const recommendations: string[] = [];
      const anomalies: string[] = [];
      const suggestions: string[] = [];

             // Análise de conectividade
       const avgConnections = nodes.reduce((sum, node) => {
         const connectionCount = Array.isArray(node.connections) ? node.connections.length : 0;
         return sum + connectionCount;
       }, 0) / nodes.length;
       const isolatedNodes = nodes.filter(node => {
         const connectionCount = Array.isArray(node.connections) ? node.connections.length : 0;
         return connectionCount === 0;
       });
       const highlyConnectedNodes = nodes.filter(node => {
         const connectionCount = Array.isArray(node.connections) ? node.connections.length : 0;
         return connectionCount > avgConnections * 2;
       });

      if (isolatedNodes.length > nodes.length * 0.3) {
        anomalies.push(`⚠️ ${isolatedNodes.length} nós isolados detectados (${Math.round(isolatedNodes.length / nodes.length * 100)}% do total)`);
        suggestions.push("🔗 Considere criar mais conexões entre seus arquivos usando links e tags");
      }

      if (highlyConnectedNodes.length > 0) {
                 recommendations.push(`⭐ Encontrados ${highlyConnectedNodes.length} nós centrais importantes: ${highlyConnectedNodes.slice(0, 3).map(n => n.title).join(', ')}`);
      }

             // Análise de clustering
       // Simplificar análise de clustering
       if (nodes.length > 10 && links.length < nodes.length * 0.5) {
         suggestions.push("📊 Poucos links detectados. Considere agrupar arquivos relacionados em pastas");
       }

      // Análise de densidade
      if (networkMetrics.density && networkMetrics.density < 0.1) {
        suggestions.push("🌐 Rede pouco densa. Adicione mais referências cruzadas entre seus arquivos");
      } else if (networkMetrics.density && networkMetrics.density > 0.7) {
        anomalies.push("🕸️ Rede muito densa detectada. Pode ser difícil navegar");
      }

      // Análise de tags
      const allTags = nodes.flatMap(node => node.metadata?.tags || []);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const popularTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      if (popularTags.length > 0) {
        recommendations.push(`🏷️ Tags mais usadas: ${popularTags.join(', ')}. Use-as para melhor organização`);
      }

      // Análise temporal (se disponível)
      const recentNodes = nodes.filter(node => {
        const lastModified = node.metadata?.lastModified;
        if (!lastModified) return false;
        const daysSince = (Date.now() - new Date(lastModified).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });

      if (recentNodes.length > 0) {
        recommendations.push(`📅 ${recentNodes.length} arquivos modificados recentemente. Mantenha-os bem conectados`);
      }

      // Sugestões de melhoria estrutural
      const fileNodes = nodes.filter(node => node.type === 'file');
      const folderNodes = nodes.filter(node => node.type === 'folder');
      
      if (fileNodes.length > folderNodes.length * 10) {
        suggestions.push("📁 Considere criar mais pastas para organizar melhor seus arquivos");
      }

      setAiInsights({
        recommendations,
        anomalies,
        suggestions
      });
    };

    const timeoutId = setTimeout(runAIAnalysis, 1000); // Delay para evitar análises muito frequentes
    return () => clearTimeout(timeoutId);
  }, [nodes, networkMetrics, aiAnalysisEnabled]);

  const [sidebarSearch, setSidebarSearch] = useState('');
  const filteredNodes = nodes.filter(n => n.title.toLowerCase().includes(sidebarSearch.toLowerCase()));

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
    onChangeLayout: (layout) => setLayoutSettings({...layoutSettings, type: layout as LayoutSettings['type']}),
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

  // Renderizar GraphViewRevolutionary se ativado
  if (useRevolutionary) {
    return (
      <div className={`graph-container relative w-full h-full overflow-hidden ${className}`}>
        {/* Toggle para alternar entre versões */}
        <div className="absolute top-4 right-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseRevolutionary(false)}
            className="bg-notion-dark-hover border-notion-dark-border text-white gap-2"
          >
            <Network className="h-4 w-4" />
            Clássico
          </Button>
        </div>
        
        <GraphViewRevolutionary
          files={files}
          currentFileId={currentFileId}
          onFileSelect={onFileSelect}
          className="w-full h-full"
        />
        
        {/* Badge identificando a versão revolucionária */}
        <div className="absolute top-4 left-4 z-50">
          <Badge variant="default" className="bg-gradient-to-r from-purple-600 to-blue-600 text-white gap-2">
            <Sparkles className="h-3 w-3" />
            Revolucionário v2.0
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen w-full bg-[#f7faff] dark:bg-[#181f2a]", className)}>
      {/* Sidebar fixa à esquerda, com busca e navegação por tipo */}
      <aside className="hidden md:flex w-72 flex-shrink-0 h-screen sticky top-0 z-40 border-r border-[#e3e8f0] dark:border-[#232b3b] bg-white dark:bg-[#1a2233] flex-col">
        <div className="p-4 border-b border-[#e3e8f0] dark:border-[#232b3b]">
          <Input
            value={sidebarSearch}
            onChange={e => setSidebarSearch(e.target.value)}
            placeholder="Buscar nós..."
            className="rounded-lg bg-[#f7faff] dark:bg-[#232b3b] border border-[#e3e8f0] dark:border-[#232b3b] focus:ring-2 focus:ring-[#2563eb]"
            aria-label="Buscar nós no grafo"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNodes.map(node => (
            <TooltipProvider key={node.id} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-left",
                      node.id === selectedNode ? "bg-[#2563eb]/10 text-[#2563eb] dark:bg-[#60a5fa]/10 dark:text-[#60a5fa] font-bold" : "hover:bg-[#2563eb]/5 dark:hover:bg-[#60a5fa]/5 text-[#1a2233] dark:text-white"
                    )}
                    onClick={() => { setSelectedNode(node.id); onFileSelect(node.id); }}
                    aria-label={`Selecionar nó ${node.title}`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: node.color || '#2563eb' }} />
                    <span className="truncate flex-1">{node.title}</span>
                    {node.type && (
                      <Badge className={cn(
                        "ml-2 text-xs px-2 py-0.5 rounded-full",
                        node.type === 'file' && 'bg-[#2563eb]/20 text-[#2563eb]',
                        node.type === 'folder' && 'bg-[#22c55e]/20 text-[#22c55e]',
                        node.type === 'tag' && 'bg-[#f59e42]/20 text-[#f59e42]',
                        node.type === 'database' && 'bg-[#0ea5e9]/20 text-[#0ea5e9]'
                      )}>{node.type}</Badge>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <div className="font-bold mb-1">{node.title}</div>
                  <div className="text-xs text-[#64748b] dark:text-[#cbd5e1]">{node.type}</div>
                  <div className="text-xs mt-1">ID: {node.id}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {filteredNodes.length === 0 && (
            <div className="text-[#64748b] dark:text-[#cbd5e1] text-center py-8">Nenhum nó encontrado.</div>
          )}
        </div>
      </aside>
      {/* Conteúdo principal */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header fixo no topo, com ícone animado, descrição e botões de ação */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#181f2a]/95 backdrop-blur-xl border-b border-[#e3e8f0] dark:border-[#232b3b]">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <motion.div animate={{ rotate: [0, 20, -20, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                <Network className="h-8 w-8 text-[#2563eb] dark:text-[#60a5fa]" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-[#1a2233] dark:text-white">Graph</h1>
                <p className="text-[#64748b] dark:text-[#cbd5e1] text-sm mt-1">Visualize conexões inteligentes entre suas notas, pastas e tags.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full shadow" aria-label="Configurações do grafo">
                      <Sparkles className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Configurações e inteligência</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" className="bg-[#22c55e] hover:bg-[#16a34a] text-white rounded-full shadow" aria-label="Exportar grafo">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar grafo</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" className="bg-[#f59e42] hover:bg-[#ea580c] text-white rounded-full shadow" aria-label="Ajuda do grafo">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ajuda e atalhos</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        {/* Área do grafo */}
        <div className="flex-1 flex flex-col items-center justify-start px-2 md:px-8 py-6 gap-6 w-full max-w-7xl mx-auto">
          <div className="w-full bg-white dark:bg-[#232b3b] rounded-xl shadow-md p-4 flex flex-col gap-4">
            {/* Controles e métricas do grafo */}
            <GraphControls
              filters={filters}
              onFiltersChange={setFilters}
              viewMode={layoutSettings.type}
              onViewModeChange={(mode) => setViewMode(mode as ViewMode)}
              layoutSettings={layoutSettings}
              onLayoutSettingsChange={setLayoutSettings}
              showPathFinding={showPathFinding}
              onShowPathFindingChange={setShowPathFinding}
            />
            {/* Grafo visual */}
            <div className="relative w-full h-[60vh] min-h-[400px] bg-[#f7faff] dark:bg-[#181f2a] rounded-lg border border-[#e3e8f0] dark:border-[#232b3b] overflow-hidden">
              <GraphEngine
                files={files}
                currentFileId={currentFileId}
                onFileSelect={onFileSelect}
                filters={filters}
                viewMode={viewMode}
                layoutSettings={layoutSettings}
              />
              {showMinimap && <GraphMinimap graphRef={graphRef} nodes={nodes} />}
            </div>
            {/* Métricas e analytics do grafo */}
            {showAnalytics && (
              <GraphAnalytics 
                nodes={nodes}
                links={links}
                selectedNode={selectedNode}
                onNodeSelect={(nodeId: string) => {
                  setSelectedNode(nodeId);
                  onFileSelect(nodeId);
                }}
                onPathFind={(sourceId: string, targetId: string) => {
                  // TODO: Implementar pathfinding
                }}
              />
            )}

            {/* Painel de Insights de IA */}
            {aiAnalysisEnabled && (aiInsights.recommendations.length > 0 || aiInsights.anomalies.length > 0 || aiInsights.suggestions.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-xl border border-purple-200 dark:border-purple-800 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                      <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                        Insights de IA
                      </h3>
                      <p className="text-sm text-purple-600 dark:text-purple-300">
                        Análise automática do seu grafo de conhecimento
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAiAnalysisEnabled(false)}
                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {/* Recomendações */}
                  {aiInsights.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                        💡 Recomendações
                      </h4>
                      <div className="space-y-1">
                        {aiInsights.recommendations.map((rec, i) => (
                          <div key={i} className="text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 rounded-lg p-2">
                            {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Anomalias */}
                  {aiInsights.anomalies.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
                        🔍 Anomalias
                      </h4>
                      <div className="space-y-1">
                        {aiInsights.anomalies.map((anomaly, i) => (
                          <div key={i} className="text-sm text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 rounded-lg p-2">
                            {anomaly}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sugestões */}
                  {aiInsights.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
                        🎯 Sugestões
                      </h4>
                      <div className="space-y-1">
                        {aiInsights.suggestions.map((suggestion, i) => (
                          <div key={i} className="text-sm text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2">
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Análise atualizada automaticamente • {nodes.length} nós analisados
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Forçar nova análise
                      setAiAnalysisEnabled(false);
                      setTimeout(() => setAiAnalysisEnabled(true), 100);
                    }}
                    className="text-xs"
                  >
                    🔄 Reanalisar
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Performance Monitor - sempre disponível */}
      <PerformanceMonitor />
    </div>
  );
}; 