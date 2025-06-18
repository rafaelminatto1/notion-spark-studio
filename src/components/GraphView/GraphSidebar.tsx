import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, Users, Tag, Clock, FileText, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GraphNode } from './types';
import { cn } from '@/lib/utils';

interface GraphSidebarProps {
  selectedNode: string | null;
  nodeData?: GraphNode;
  centralityScore: number;
  community: string;
  onClose: () => void;
  onPathFinding: (targetId: string) => void;
}

export const GraphSidebar: React.FC<GraphSidebarProps> = ({
  selectedNode,
  nodeData,
  centralityScore,
  community,
  onClose,
  onPathFinding
}) => {
  if (!selectedNode || !nodeData) {
    return null;
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file':
        return <FileText className="h-4 w-4" />;
      case 'folder':
        return <Info className="h-4 w-4" />;
      case 'database':
        return <Info className="h-4 w-4" />;
      case 'tag':
        return <Tag className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file':
        return 'bg-blue-600';
      case 'folder':
        return 'bg-green-600';
      case 'database':
        return 'bg-purple-600';
      case 'tag':
        return 'bg-orange-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="absolute top-0 right-0 h-full w-80 bg-black/95 backdrop-blur-sm border-l border-white/10 z-20"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="p-4 h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Detalhes do Nó</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-start gap-3 mb-3">
                <div className={cn(
                  "p-2 rounded-lg text-white",
                  getTypeColor(nodeData.type)
                )}>
                  {getTypeIcon(nodeData.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">
                    {nodeData.title}
                  </h3>
                  <p className="text-sm text-gray-400 capitalize">
                    {nodeData.type}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Conexões:</span>
                  <span className="text-white">{nodeData.connections.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Tamanho:</span>
                  <span className="text-white">{nodeData.size}</span>
                </div>

                {nodeData.centrality && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Centralidade:</span>
                    <span className="text-white">
                      {(nodeData.centrality * 100).toFixed(1)}%
                    </span>
                  </div>
                )}

                {nodeData.metadata.wordCount && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Palavras:</span>
                    <span className="text-white">{nodeData.metadata.wordCount}</span>
                  </div>
                )}
              </div>
            </Card>

            {nodeData.metadata.tags && nodeData.metadata.tags.length > 0 && (
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="h-4 w-4 text-orange-400" />
                  <h4 className="font-medium text-white">Tags</h4>
                </div>
                <div className="flex flex-wrap gap-1">
                  {nodeData.metadata.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-orange-600/20 text-orange-200 border-orange-600/30"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {nodeData.metadata.collaborators && nodeData.metadata.collaborators.length > 0 && (
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4 text-blue-400" />
                  <h4 className="font-medium text-white">Colaboradores</h4>
                </div>
                <div className="space-y-1">
                  {nodeData.metadata.collaborators.map((collaborator, index) => (
                    <div
                      key={index}
                      className="text-sm text-gray-300 bg-white/5 rounded px-2 py-1"
                    >
                      {collaborator}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-green-400" />
                <h4 className="font-medium text-white">Informações</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Última modificação:</span>
                  <span className="text-gray-300">
                    {formatDate(nodeData.metadata.lastModified)}
                  </span>
                </div>
                
                {nodeData.cluster && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cluster:</span>
                    <span className="text-gray-300">{nodeData.cluster}</span>
                  </div>
                )}

                {nodeData.community && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Comunidade:</span>
                    <span className="text-gray-300">{nodeData.community}</span>
                  </div>
                )}
              </div>
            </Card>

            {nodeData.metadata && (
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="h-4 w-4 text-purple-400" />
                  <h4 className="font-medium text-white">Metadados</h4>
                </div>
                <div className="space-y-2 text-sm">
                  {nodeData.metadata.language && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Linguagem:</span>
                      <span className="text-gray-300">{nodeData.metadata.language}</span>
                    </div>
                  )}
                  
                  {nodeData.metadata.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Tamanho do arquivo:</span>
                      <span className="text-gray-300">
                        {(nodeData.metadata.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}

                  {nodeData.metadata.accessLevel && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Acesso:</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "capitalize",
                          nodeData.metadata.accessLevel === 'private' && "border-red-600 text-red-400",
                          nodeData.metadata.accessLevel === 'shared' && "border-yellow-600 text-yellow-400",
                          nodeData.metadata.accessLevel === 'public' && "border-green-600 text-green-400"
                        )}
                      >
                        {nodeData.metadata.accessLevel}
                      </Badge>
                    </div>
                  )}

                  {nodeData.metadata.wordCount && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Palavras:</span>
                      <span className="text-white">{nodeData.metadata.wordCount}</span>
                    </div>
                  )}

                  {nodeData.metadata.tags && nodeData.metadata.tags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400">Tags:</span>
                      {nodeData.metadata.tags.map((tag, index) => (
                        <span key={index} className="bg-purple-700 text-white px-2 py-0.5 rounded text-xs mr-1 mb-1">{tag}</span>
                      ))}
                    </div>
                  )}

                  {nodeData.metadata.collaborators && nodeData.metadata.collaborators.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400">Colaboradores:</span>
                      {nodeData.metadata.collaborators.map((collaborator, index) => (
                        <span key={index} className="bg-blue-700 text-white px-2 py-0.5 rounded text-xs mr-1 mb-1">{collaborator}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Modificado:</span>
                    <span className="text-white">{formatDate(nodeData.metadata.lastModified)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <Button
              onClick={() => { onPathFinding(nodeData.id); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Target className="h-4 w-4 mr-2" />
              Encontrar Caminho
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 