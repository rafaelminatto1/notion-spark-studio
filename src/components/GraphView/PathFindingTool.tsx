import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Navigation, 
  Route, 
  Zap,
  MapPin,
  Target,
  Timer,
  TrendingUp,
  GitBranch,
  Search,
  X,
  ArrowRight,
  Share2
} from 'lucide-react';
import { GraphNode, GraphLink, PathFindingResult } from '@/types/graph';
import { useGraphAnalytics } from '@/hooks/useGraphAnalytics';

interface PathFindingToolProps {
  nodes: GraphNode[];
  links: GraphLink[];
  sourceNode?: string | null;
  targetNode?: string | null;
  onPathHighlight: (path: string[]) => void;
  onNodeSelect: (nodeId: string) => void;
  className?: string;
}

export const PathFindingTool: React.FC<PathFindingToolProps> = ({
  nodes,
  links,
  sourceNode,
  targetNode,
  onPathHighlight,
  onNodeSelect,
  className
}) => {
  const [searchSource, setSearchSource] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [currentPath, setCurrentPath] = useState<PathFindingResult | null>(null);
  const [pathHistory, setPathHistory] = useState<PathFindingResult[]>([]);
  const [isSearchingSource, setIsSearchingSource] = useState(false);
  const [isSearchingTarget, setIsSearchingTarget] = useState(false);
  
  const { findShortestPath } = useGraphAnalytics(nodes, links);

  // Filtrar nós para busca
  const filteredSourceNodes = nodes.filter(node =>
    searchSource && node.title.toLowerCase().includes(searchSource.toLowerCase())
  ).slice(0, 5);

  const filteredTargetNodes = nodes.filter(node =>
    searchTarget && node.title.toLowerCase().includes(searchTarget.toLowerCase())
  ).slice(0, 5);

  // Calcular caminho quando source e target mudam
  useEffect(() => {
    if (sourceNode && targetNode && sourceNode !== targetNode) {
      const pathResult = findShortestPath(sourceNode, targetNode);
      setCurrentPath(pathResult);
      
      if (pathResult && pathResult.path.length > 0) {
        onPathHighlight(pathResult.path);
        
        // Adicionar ao histórico
        setPathHistory(prev => {
          const newHistory = [pathResult, ...prev];
          return newHistory.slice(0, 10); // Manter apenas 10 últimos
        });
      }
    } else {
      setCurrentPath(null);
      onPathHighlight([]);
    }
  }, [sourceNode, targetNode, findShortestPath, onPathHighlight]);

  const handleSourceSelect = (nodeId: string) => {
    onNodeSelect(nodeId);
    setSearchSource('');
    setIsSearchingSource(false);
  };

  const handleTargetSelect = (nodeId: string) => {
    // Se source não está definido, define como source primeiro
    if (!sourceNode) {
      onNodeSelect(nodeId);
    } else {
      // Simular seleção de target (seria implementado no componente pai)
      const pathResult = findShortestPath(sourceNode, nodeId);
      setCurrentPath(pathResult);
      if (pathResult && pathResult.path.length > 0) {
        onPathHighlight(pathResult.path);
      }
    }
    setSearchTarget('');
    setIsSearchingTarget(false);
  };

  const getSourceNode = () => sourceNode ? nodes.find(n => n.id === sourceNode) : null;
  const getTargetNode = () => targetNode ? nodes.find(n => n.id === targetNode) : null;

  const clearPath = () => {
    setCurrentPath(null);
    onPathHighlight([]);
  };

  const getPathMetrics = () => {
    if (!currentPath) return null;
    
    const pathNodes = currentPath.path.map(id => nodes.find(n => n.id === id)).filter(Boolean);
    const types = pathNodes.reduce((acc, node) => {
      if (node) {
        acc[node.type] = (acc[node.type] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      length: currentPath.path.length,
      distance: currentPath.distance,
      types,
      pathNodes
    };
  };

  const metrics = getPathMetrics();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Seleção de Nós */}
      <Card className="bg-notion-dark-hover border-notion-dark-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Navigation className="h-4 w-4 text-blue-400" />
            🗺️ Path Finder
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Source Node */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Nó de Origem
            </label>
            <div className="relative">
              <Input
                placeholder="Buscar nó de origem..."
                value={searchSource}
                onChange={(e) => {
                  setSearchSource(e.target.value);
                  setIsSearchingSource(true);
                }}
                onFocus={() => setIsSearchingSource(true)}
                className="bg-notion-dark border-notion-dark-border text-white"
              />
              
              {getSourceNode() && !isSearchingSource && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center px-3 bg-notion-dark border border-blue-500/50 rounded-md"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      <span className="text-white text-sm">{getSourceNode()?.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchingSource(true)}
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {isSearchingSource && filteredSourceNodes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 z-50 mt-1 bg-notion-dark border border-notion-dark-border rounded-md shadow-lg max-h-40 overflow-y-auto"
                  >
                    {filteredSourceNodes.map(node => (
                      <button
                        key={node.id}
                        onClick={() => handleSourceSelect(node.id)}
                        className="w-full px-3 py-2 text-left hover:bg-notion-purple/20 text-white text-sm border-b border-notion-dark-border last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                          <span className="truncate">{node.title}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Target Node */}
          <div className="space-y-2">
            <label className="text-xs text-gray-400 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Nó de Destino
            </label>
            <div className="relative">
              <Input
                placeholder="Buscar nó de destino..."
                value={searchTarget}
                onChange={(e) => {
                  setSearchTarget(e.target.value);
                  setIsSearchingTarget(true);
                }}
                onFocus={() => setIsSearchingTarget(true)}
                className="bg-notion-dark border-notion-dark-border text-white"
                disabled={!sourceNode}
              />

              {getTargetNode() && !isSearchingTarget && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-0 flex items-center px-3 bg-notion-dark border border-green-500/50 rounded-md"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span className="text-white text-sm">{getTargetNode()?.title}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchingTarget(true)}
                    >
                      <Search className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              )}

              <AnimatePresence>
                {isSearchingTarget && filteredTargetNodes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 z-50 mt-1 bg-notion-dark border border-notion-dark-border rounded-md shadow-lg max-h-40 overflow-y-auto"
                  >
                    {filteredTargetNodes.map(node => (
                      <button
                        key={node.id}
                        onClick={() => handleTargetSelect(node.id)}
                        className="w-full px-3 py-2 text-left hover:bg-notion-purple/20 text-white text-sm border-b border-notion-dark-border last:border-b-0"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full" />
                          <span className="truncate">{node.title}</span>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearPath}
              disabled={!currentPath}
              className="flex-1"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Path Results */}
      <AnimatePresence>
        {currentPath && metrics && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-notion-dark-hover border-notion-dark-border">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Route className="h-4 w-4 text-green-400" />
                  🛤️ Caminho Encontrado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Path Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{metrics.length}</div>
                    <div className="text-xs text-gray-400">Nós</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{metrics.distance.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">Distância</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{metrics.length - 1}</div>
                    <div className="text-xs text-gray-400">Saltos</div>
                  </div>
                </div>

                {/* Path Visualization */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <GitBranch className="h-3 w-3" />
                    Sequência do Caminho
                  </div>
                  <div className="flex items-center space-x-1 overflow-x-auto pb-2">
                    {metrics.pathNodes.map((node, index) => (
                      <React.Fragment key={node?.id || index}>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => node && onNodeSelect(node.id)}
                            className="whitespace-nowrap text-xs px-2 py-1 h-auto"
                          >
                            {node?.title || 'Unknown'}
                          </Button>
                        </motion.div>
                        {index < metrics.pathNodes.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Type Distribution */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-400">Tipos no Caminho</div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(metrics.types).map(([type, count]) => (
                      <Badge 
                        key={type} 
                        variant="secondary" 
                        className="text-xs"
                      >
                        {type}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <Card className="bg-notion-dark-hover border-notion-dark-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            ⚡ Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Encontrar nós mais conectados para path finding
                const mostConnected = nodes
                  .sort((a, b) => ((b as any).connections || 0) - ((a as any).connections || 0))
                  .slice(0, 2);
                
                if (mostConnected.length >= 2) {
                  const path = findShortestPath(mostConnected[0].id, mostConnected[1].id);
                  if (path) {
                    setCurrentPath(path);
                    onPathHighlight(path.path);
                  }
                }
              }}
              className="text-xs"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Hubs Principais
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Lógica para conectar nós isolados
                setSearchSource('');
                setSearchTarget('');
              }}
              className="text-xs"
            >
              <GitBranch className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 