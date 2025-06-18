import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GraphNode } from './types';
import { FileText, Folder, Database, Tag, Clock, Link, Users } from 'lucide-react';

interface GraphTooltipProps {
  node: GraphNode | null;
  position: { x: number; y: number } | null;
  connections: number;
  isVisible: boolean;
}

export const GraphTooltip: React.FC<GraphTooltipProps> = ({
  node,
  position,
  connections,
  isVisible
}) => {
  if (!node || !position || !isVisible) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'file': return <FileText className="h-4 w-4" />;
      case 'folder': return <Folder className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'tag': return <Tag className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'file': return 'text-blue-400';
      case 'folder': return 'text-yellow-400';
      case 'database': return 'text-green-400';
      case 'tag': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getConnectionStrength = (count: number) => {
    if (count === 0) return { text: 'Órfão', color: 'text-red-400', emoji: '🏝️' };
    if (count < 3) return { text: 'Baixa', color: 'text-yellow-400', emoji: '🔗' };
    if (count < 6) return { text: 'Média', color: 'text-blue-400', emoji: '⚡' };
    if (count < 10) return { text: 'Alta', color: 'text-green-400', emoji: '🔥' };
    return { text: 'Hub', color: 'text-purple-400', emoji: '🌟' };
  };

  const connectionStrength = getConnectionStrength(connections);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed z-50 pointer-events-none"
        style={{
          left: position.x + 15,
          top: position.y - 10,
        }}
        initial={{ opacity: 0, scale: 0.8, x: -10, y: 10 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, x: -10, y: 10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <Card className="graph-tooltip max-w-xs">
          {/* Header */}
          <motion.div 
            className="flex items-center gap-2 mb-3"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className={getTypeColor(node.type)}>
              {getIcon(node.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm truncate">
                {node.title}
              </h4>
              <p className="text-xs text-gray-400 capitalize">
                {node.type}
              </p>
            </div>
          </motion.div>

          {/* Connections Info */}
          <motion.div 
            className="flex items-center gap-2 mb-3"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <div className="flex items-center gap-1">
              <span className="text-lg">{connectionStrength.emoji}</span>
              <span className={`text-sm font-medium ${connectionStrength.color}`}>
                {connectionStrength.text}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <Link className="h-3 w-3" />
              <span className="text-xs">{connections} conexões</span>
            </div>
          </motion.div>

          {/* Tags */}
          {node.metadata.tags && node.metadata.tags.length > 0 && (
            <motion.div 
              className="mb-3"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex flex-wrap gap-1">
                {node.metadata.tags.slice(0, 3).map((tag, index) => (
                  <Badge 
                    key={tag} 
                    variant="secondary" 
                    className="text-xs bg-white/10 text-purple-300 border-purple-400/30"
                  >
                    #{tag}
                  </Badge>
                ))}
                {node.metadata.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-white/5 text-gray-400">
                    +{node.metadata.tags.length - 3}
                  </Badge>
                )}
              </div>
            </motion.div>
          )}

          {/* Metadata */}
          <motion.div 
            className="space-y-1"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            {node.size && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>📄</span>
                <span>{(node.size / 1024).toFixed(1)} KB</span>
              </div>
            )}
            
            {node.metadata.lastModified && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>Atualizado {formatDate(node.metadata.lastModified)}</span>
              </div>
            )}

            {node.metadata.collaborators && node.metadata.collaborators.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Users className="h-3 w-3" />
                <span>{node.metadata.collaborators.length} colaboradores</span>
              </div>
            )}
          </motion.div>

          {/* Path/Location */}
          {node.metadata.path && (
            <motion.div 
              className="mt-3 pt-2 border-t border-white/10"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-xs text-gray-500 font-mono truncate">
                {node.metadata.path}
              </p>
            </motion.div>
          )}

          {/* Quick Actions Hint */}
          <motion.div 
            className="mt-3 pt-2 border-t border-white/10 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <p className="text-xs text-gray-500">
              💡 Clique para selecionar • Duplo clique para focar
            </p>
          </motion.div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}; 