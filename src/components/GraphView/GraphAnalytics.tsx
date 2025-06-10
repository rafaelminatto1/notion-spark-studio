import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Network, Users, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraphNode, GraphLink } from './types';
import { cn } from '@/lib/utils';

interface GraphAnalyticsProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNode: string | null;
  className?: string;
}

export const GraphAnalytics: React.FC<GraphAnalyticsProps> = ({
  nodes,
  links,
  selectedNode,
  className
}) => {
  // Calcular métricas
  const metrics = React.useMemo(() => {
    const totalNodes = nodes.length;
    const totalLinks = links.length;
    const avgConnections = totalNodes > 0 ? totalLinks * 2 / totalNodes : 0;
    
    // Encontrar nós mais conectados
    const nodeConnections = nodes.map(node => ({
      id: node.id,
      name: node.name,
      connections: node.connections,
      type: node.type
    })).sort((a, b) => b.connections - a.connections);

    // Clusters mais comuns
    const clusterCounts = nodes.reduce((acc, node) => {
      if (node.cluster) {
        acc[node.cluster] = (acc[node.cluster] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topClusters = Object.entries(clusterCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Tipos de arquivo mais comuns
    const typeCounts = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalNodes,
      totalLinks,
      avgConnections: Math.round(avgConnections * 10) / 10,
      topNodes: nodeConnections.slice(0, 5),
      topClusters,
      typeCounts,
      orphanNodes: nodes.filter(n => n.connections === 0).length
    };
  }, [nodes, links]);

  const getTypeColor = (type: string) => {
    const colors = {
      file: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      folder: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      database: 'bg-green-500/20 text-green-300 border-green-500/30',
      tag: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    };
    return colors[type as keyof typeof colors] || colors.file;
  };

  return (
    <motion.div
      className={cn("analytics-panel pointer-events-auto", className)}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="graph-card p-6 w-80 space-y-5">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-400" />
          <h3 className="text-white font-medium">Analytics do Grafo</h3>
        </div>

        {/* Métricas gerais */}
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
              }
            }
          }}
        >
          <motion.div 
            className="analytics-metric"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="metric-value">{metrics.totalNodes}</div>
            <div className="metric-label">📊 Nós</div>
          </motion.div>
          <motion.div 
            className="analytics-metric"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="metric-value">{metrics.totalLinks}</div>
            <div className="metric-label">🔗 Links</div>
          </motion.div>
          <motion.div 
            className="analytics-metric"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="metric-value">{metrics.avgConnections}</div>
            <div className="metric-label">⚡ Média</div>
          </motion.div>
          <motion.div 
            className="analytics-metric"
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 }
            }}
            whileHover={{ scale: 1.05 }}
          >
            <div className="metric-value">{metrics.orphanNodes}</div>
            <div className="metric-label">🏝️ Órfãos</div>
          </motion.div>
        </motion.div>

        {/* Nós mais conectados */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-gray-400" />
            <span className="text-white text-sm font-medium">Top Conexões</span>
          </div>
          <div className="space-y-1">
            {metrics.topNodes.map((node, index) => (
              <div 
                key={node.id}
                className={cn(
                  "flex items-center justify-between p-2 rounded text-sm",
                  selectedNode === node.id ? "bg-blue-600/30" : "bg-white/5",
                  "border border-white/10"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">#{index + 1}</span>
                  <span className="text-white truncate max-w-[120px]">{node.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {node.connections}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por tipo */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-400" />
            <span className="text-white text-sm font-medium">Tipos</span>
          </div>
          <div className="space-y-1">
            {Object.entries(metrics.typeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getTypeColor(type))}
                >
                  {type}
                </Badge>
                <span className="text-gray-300 text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clusters */}
        {metrics.topClusters.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-white text-sm font-medium">Clusters</span>
            </div>
            <div className="space-y-1">
              {metrics.topClusters.map(([cluster, count]) => (
                <div key={cluster} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10">
                  <span className="text-white text-sm truncate">{cluster}</span>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}; 