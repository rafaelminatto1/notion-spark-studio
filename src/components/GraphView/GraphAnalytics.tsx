import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  Network, 
  TrendingUp, 
  Users, 
  Activity,
  Target,
  GitBranch,
  Zap,
  Eye,
  Link
} from 'lucide-react';
import { GraphNode, GraphLink } from '@/types/graph';
import { useGraphAnalytics } from '@/hooks/useGraphAnalytics';

interface GraphAnalyticsProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNode?: string | null;
  onNodeSelect: (nodeId: string) => void;
  onPathFind: (sourceId: string, targetId: string) => void;
}

export const GraphAnalytics: React.FC<GraphAnalyticsProps> = ({
  nodes,
  links,
  selectedNode,
  onNodeSelect,
  onPathFind
}) => {
  const { centralityAnalysis, communityDetection, networkAnalytics } = useGraphAnalytics(nodes, links);
  
  // Calcular estatísticas de rede
  const networkStats = useMemo(() => {
    const totalNodes = nodes.length;
    const totalLinks = links.length;
    const density = totalLinks / (totalNodes * (totalNodes - 1) / 2);
    
    // Encontrar nós mais conectados
    const mostConnected = nodes
      .map(node => ({
        ...node,
        degree: centralityAnalysis.degreeCentrality.get(node.id) || 0
      }))
      .sort((a, b) => b.degree - a.degree)
      .slice(0, 5);

    // Encontrar nós centrais (betweenness)
    const mostCentral = nodes
      .map(node => ({
        ...node,
        betweenness: centralityAnalysis.betweennessCentrality.get(node.id) || 0
      }))
      .sort((a, b) => b.betweenness - a.betweenness)
      .slice(0, 5);

    // Clusters principais
    const mainClusters = communityDetection
      .sort((a, b) => b.nodes.length - a.nodes.length)
      .slice(0, 5);

    return {
      totalNodes,
      totalLinks,
      density: density * 100,
      avgConnections: totalLinks / totalNodes,
      mostConnected,
      mostCentral,
      mainClusters,
      isolatedNodes: nodes.filter(node => 
        !links.some(link => 
          link.source === node.id || link.target === node.id
        )
      ).length
    };
  }, [nodes, links, centralityAnalysis, communityDetection]);

  return (
    <div className="space-y-6 p-4">
      {/* Métricas Gerais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Network className="h-4 w-4 text-blue-400" />
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Nós</p>
                <p className="text-xl font-bold text-white">{networkStats.totalNodes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Link className="h-4 w-4 text-green-400" />
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Conexões</p>
                <p className="text-xl font-bold text-white">{networkStats.totalLinks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-4 w-4 text-purple-400" />
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Densidade</p>
                <p className="text-xl font-bold text-white">{networkStats.density.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-4 w-4 text-orange-400" />
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Clusters</p>
                <p className="text-xl font-bold text-white">{communityDetection.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nós Mais Conectados */}
      <Card className="bg-notion-dark-hover border-notion-dark-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            🌟 Nós Mais Conectados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {networkStats.mostConnected.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-notion-dark/50 hover:bg-notion-purple/10 transition-colors cursor-pointer"
              onClick={() => onNodeSelect(node.id)}
            >
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
                <div>
                  <p className="font-medium text-white">{node.title}</p>
                  <p className="text-xs text-gray-400">
                    {node.degree} conexões
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={(node.degree / networkStats.mostConnected[0].degree) * 100} 
                  className="w-16 h-2" 
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeSelect(node.id);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Nós Mais Centrais (Betweenness) */}
      <Card className="bg-notion-dark-hover border-notion-dark-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-400" />
            🎯 Nós Mais Centrais (Pontes)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {networkStats.mostCentral.map((node, index) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-notion-dark/50 hover:bg-notion-purple/10 transition-colors cursor-pointer"
              onClick={() => onNodeSelect(node.id)}
            >
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-xs">
                  #{index + 1}
                </Badge>
                <div>
                  <p className="font-medium text-white">{node.title}</p>
                  <p className="text-xs text-gray-400">
                    Centralidade: {(node.betweenness * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={networkStats.mostCentral[0].betweenness > 0 
                    ? (node.betweenness / networkStats.mostCentral[0].betweenness) * 100 
                    : 0
                  } 
                  className="w-16 h-2" 
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNodeSelect(node.id);
                  }}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Clusters Principais */}
      <Card className="bg-notion-dark-hover border-notion-dark-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            🏷️ Principais Clusters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {networkStats.mainClusters.map((cluster, index) => (
            <motion.div
              key={cluster.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-notion-dark/50"
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: cluster.color }}
                />
                <div>
                  <p className="font-medium text-white">{cluster.name}</p>
                  <p className="text-xs text-gray-400">
                    {cluster.nodes.length} nós
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={(cluster.nodes.length / networkStats.mainClusters[0].nodes.length) * 100} 
                  className="w-16 h-2" 
                />
                <Badge variant="secondary" className="text-xs">
                  {((cluster.nodes.length / networkStats.totalNodes) * 100).toFixed(1)}%
                </Badge>
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Path Finding Tool */}
      {selectedNode && (
        <Card className="bg-notion-dark-hover border-notion-dark-border">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              🛤️ Path Finding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-300">
                Nó selecionado: <span className="text-white font-medium">
                  {nodes.find(n => n.id === selectedNode)?.title}
                </span>
              </div>
              <div className="text-xs text-gray-400">
                Clique em outro nó no grafo para encontrar o caminho entre eles
              </div>
              <div className="flex gap-2">
                {networkStats.mostConnected.slice(0, 3).map(node => (
                  <Button
                    key={node.id}
                    variant="outline"
                    size="sm"
                    onClick={() => onPathFind(selectedNode, node.id)}
                    disabled={node.id === selectedNode}
                    className="text-xs"
                  >
                    → {node.title}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights da Rede */}
      <Card className="bg-notion-dark-hover border-notion-dark-border">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            💡 Insights da Rede
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Conexões médias:</span>
                <span className="text-white">{networkStats.avgConnections.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nós isolados:</span>
                <span className="text-white">{networkStats.isolatedNodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Maior cluster:</span>
                <span className="text-white">
                  {networkStats.mainClusters[0]?.nodes.length || 0} nós
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-notion-dark/50">
                <div className="text-xs text-gray-400 mb-1">Qualidade da Rede</div>
                <div className="text-lg font-bold">
                  {networkStats.density > 20 ? (
                    <span className="text-green-400">🟢 Muito Conectada</span>
                  ) : networkStats.density > 10 ? (
                    <span className="text-yellow-400">🟡 Moderadamente Conectada</span>
                  ) : (
                    <span className="text-red-400">🔴 Pouco Conectada</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 