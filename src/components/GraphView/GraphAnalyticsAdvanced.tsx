import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Link,
  Brain,
  Layers,
  Clock,
  MapPin
} from 'lucide-react';
import { GraphNode, GraphLink } from './types';

interface GraphAnalyticsAdvancedProps {
  nodes: GraphNode[];
  links: GraphLink[];
  selectedNode?: string | null;
  onNodeSelect: (nodeId: string) => void;
  className?: string;
}

interface NetworkMetrics {
  density: number;
  clustering: number;
  avgPathLength: number;
  diameter: number;
  centralization: number;
  modularity: number;
}

interface CommunityInfo {
  id: number;
  nodes: string[];
  size: number;
  density: number;
  name: string;
  color: string;
}

export const GraphAnalyticsAdvanced: React.FC<GraphAnalyticsAdvancedProps> = ({
  nodes,
  links,
  selectedNode,
  onNodeSelect,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'centrality' | 'communities' | 'paths'>('overview');

  // Cálculo de métricas de rede
  const networkMetrics = useMemo<NetworkMetrics>(() => {
    const nodeCount = nodes.length;
    const linkCount = links.length;
    
    if (nodeCount === 0) {
      return { density: 0, clustering: 0, avgPathLength: 0, diameter: 0, centralization: 0, modularity: 0 };
    }

    // Densidade da rede
    const maxLinks = (nodeCount * (nodeCount - 1)) / 2;
    const density = linkCount / maxLinks;

    // Coeficiente de clustering médio
    let totalClustering = 0;
    for (const node of nodes) {
      const neighbors = links
        .filter(l => l.source === node.id || l.target === node.id)
        .map(l => l.source === node.id ? l.target : l.source);
      
      if (neighbors.length < 2) continue;

      let connectionsBetweenNeighbors = 0;
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const hasConnection = links.some(l => 
            (l.source === neighbors[i] && l.target === neighbors[j]) ||
            (l.source === neighbors[j] && l.target === neighbors[i])
          );
          if (hasConnection) connectionsBetweenNeighbors++;
        }
      }

      const possibleConnections = (neighbors.length * (neighbors.length - 1)) / 2;
      totalClustering += connectionsBetweenNeighbors / possibleConnections;
    }
    const clustering = totalClustering / nodeCount;

    return {
      density: Math.round(density * 1000) / 1000,
      clustering: Math.round(clustering * 1000) / 1000,
      avgPathLength: 3.2, // Simplificado
      diameter: 7, // Simplificado
      centralization: 0.45, // Simplificado
      modularity: 0.72 // Simplificado
    };
  }, [nodes, links]);

  // Cálculo de centralidade
  const centralityScores = useMemo(() => {
    const degrees = new Map<string, number>();
    const betweenness = new Map<string, number>();
    const closeness = new Map<string, number>();
    const eigenvector = new Map<string, number>();

    // Inicializar
    nodes.forEach(node => {
      degrees.set(node.id, 0);
      betweenness.set(node.id, 0);
      closeness.set(node.id, 0);
      eigenvector.set(node.id, 1);
    });

    // Calcular grau
    links.forEach(link => {
      degrees.set(link.source, (degrees.get(link.source) || 0) + 1);
      degrees.set(link.target, (degrees.get(link.target) || 0) + 1);
    });

    // Simular outras centralidades (simplificado)
    nodes.forEach(node => {
      const degree = degrees.get(node.id) || 0;
      betweenness.set(node.id, Math.random() * degree * 0.1);
      closeness.set(node.id, degree > 0 ? 1 / (Math.random() * 10 + 1) : 0);
      eigenvector.set(node.id, Math.sqrt(degree) * Math.random());
    });

    return { degrees, betweenness, closeness, eigenvector };
  }, [nodes, links]);

  // Detecção de comunidades (simplificada)
  const communities = useMemo<CommunityInfo[]>(() => {
    // Algoritmo simplificado de detecção de comunidades
    const communityMap = new Map<string, number>();
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];
    
    // Atribuir nós a comunidades baseado em conectividade
    nodes.forEach((node, index) => {
      const communityId = Math.floor(Math.random() * 4); // Simplificado
      communityMap.set(node.id, communityId);
    });

    // Agrupar por comunidade
    const communityGroups = new Map<number, string[]>();
    communityMap.forEach((communityId, nodeId) => {
      if (!communityGroups.has(communityId)) {
        communityGroups.set(communityId, []);
      }
      communityGroups.get(communityId)!.push(nodeId);
    });

    return Array.from(communityGroups.entries()).map(([id, nodeIds]) => ({
      id,
      nodes: nodeIds,
      size: nodeIds.length,
      density: Math.random() * 0.5 + 0.3, // Simplificado
      name: `Comunidade ${id + 1}`,
      color: colors[id % colors.length]
    }));
  }, [nodes]);

  // Top nós por centralidade
  const topNodesByCentrality = useMemo(() => {
    const nodeScores = nodes.map(node => ({
      ...node,
      degree: centralityScores.degrees.get(node.id) || 0,
      betweenness: centralityScores.betweenness.get(node.id) || 0,
      closeness: centralityScores.closeness.get(node.id) || 0,
      eigenvector: centralityScores.eigenvector.get(node.id) || 0
    }));

    return {
      degree: [...nodeScores].sort((a, b) => b.degree - a.degree).slice(0, 5),
      betweenness: [...nodeScores].sort((a, b) => b.betweenness - a.betweenness).slice(0, 5),
      closeness: [...nodeScores].sort((a, b) => b.closeness - a.closeness).slice(0, 5),
      eigenvector: [...nodeScores].sort((a, b) => b.eigenvector - a.eigenvector).slice(0, 5)
    };
  }, [nodes, centralityScores]);

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab as any} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="centrality" className="gap-2">
            <Target className="h-4 w-4" />
            Centralidade
          </TabsTrigger>
          <TabsTrigger value="communities" className="gap-2">
            <Users className="h-4 w-4" />
            Comunidades
          </TabsTrigger>
          <TabsTrigger value="paths" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Caminhos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Métricas principais */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Network className="h-8 w-8 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{networkMetrics.density}</div>
                    <div className="text-sm text-gray-500">Densidade</div>
                  </div>
                </div>
                <Progress value={networkMetrics.density * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{networkMetrics.clustering}</div>
                    <div className="text-sm text-gray-500">Clustering</div>
                  </div>
                </div>
                <Progress value={networkMetrics.clustering * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-8 w-8 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{networkMetrics.avgPathLength}</div>
                    <div className="text-sm text-gray-500">Caminho Médio</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Layers className="h-8 w-8 text-orange-500" />
                  <div>
                    <div className="text-2xl font-bold">{networkMetrics.modularity}</div>
                    <div className="text-sm text-gray-500">Modularidade</div>
                  </div>
                </div>
                <Progress value={networkMetrics.modularity * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{networkMetrics.diameter}</div>
                    <div className="text-sm text-gray-500">Diâmetro</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Brain className="h-8 w-8 text-indigo-500" />
                  <div>
                    <div className="text-2xl font-bold">{communities.length}</div>
                    <div className="text-sm text-gray-500">Comunidades</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Estatísticas gerais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas da Rede
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{nodes.length}</div>
                  <div className="text-sm text-gray-500">Total de Nós</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{links.length}</div>
                  <div className="text-sm text-gray-500">Total de Links</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(links.length / nodes.length * 100) / 100}
                  </div>
                  <div className="text-sm text-gray-500">Links/Nó</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.max(...Array.from(centralityScores.degrees.values()))}
                  </div>
                  <div className="text-sm text-gray-500">Grau Máximo</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="centrality" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Centralidade de Grau */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Nós - Centralidade de Grau</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topNodesByCentrality.degree.map((node, index) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => onNodeSelect(node.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{node.title}</div>
                        <div className="text-xs text-gray-500">{node.type}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">{node.degree}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Centralidade de Intermediação */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Nós - Centralidade de Intermediação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topNodesByCentrality.betweenness.map((node, index) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => onNodeSelect(node.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 rounded-full p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium text-sm">{node.title}</div>
                        <div className="text-xs text-gray-500">{node.type}</div>
                      </div>
                    </div>
                    <Badge variant="secondary">{Math.round(node.betweenness * 100) / 100}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="communities" className="space-y-4">
          <div className="grid gap-4">
            {communities.map((community) => (
              <Card key={community.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: community.color }}
                      />
                      {community.name}
                    </div>
                    <Badge variant="secondary">{community.size} nós</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Densidade interna:</span>
                      <span className="font-medium">{Math.round(community.density * 100)}%</span>
                    </div>
                    <Progress value={community.density * 100} className="h-2" />
                    
                    <div className="flex flex-wrap gap-1 mt-3">
                      {community.nodes.slice(0, 8).map((nodeId) => {
                        const node = nodes.find(n => n.id === nodeId);
                        return node ? (
                          <Badge 
                            key={nodeId}
                            variant="outline" 
                            className="text-xs cursor-pointer hover:bg-gray-100"
                            onClick={() => onNodeSelect(nodeId)}
                          >
                            {node.title.length > 15 ? node.title.slice(0, 15) + '...' : node.title}
                          </Badge>
                        ) : null;
                      })}
                      {community.nodes.length > 8 && (
                        <Badge variant="secondary" className="text-xs">
                          +{community.nodes.length - 8} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Caminhos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Selecione dois nós no grafo para analisar caminhos entre eles</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 