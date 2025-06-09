import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { GraphNode } from './types';
import { cn } from '@/lib/utils';

interface GraphMinimapProps {
  graphRef: React.RefObject<any>;
  nodes: GraphNode[];
  className?: string;
}

export const GraphMinimap: React.FC<GraphMinimapProps> = ({
  graphRef,
  nodes,
  className
}) => {
  // Calcular bounds do grafo
  const bounds = React.useMemo(() => {
    if (nodes.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    
    const xs = nodes.map(n => n.x || 0);
    const ys = nodes.map(n => n.y || 0);
    
    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  }, [nodes]);

  const width = 150;
  const height = 100;
  
  const scaleX = width / (bounds.maxX - bounds.minX || 1);
  const scaleY = height / (bounds.maxY - bounds.minY || 1);

  return (
    <motion.div
      className={cn("pointer-events-auto", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-2 bg-black/90 backdrop-blur-sm border-white/10">
        <svg
          width={width}
          height={height}
          className="border border-white/20 rounded cursor-pointer"
          onClick={(e) => {
            if (!graphRef.current) return;
            
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / width) * (bounds.maxX - bounds.minX) + bounds.minX;
            const y = ((e.clientY - rect.top) / height) * (bounds.maxY - bounds.minY) + bounds.minY;
            
            graphRef.current.centerAt(x, y, 1000);
          }}
        >
          {/* Render nodes as dots */}
          {nodes.map(node => {
            const x = ((node.x || 0) - bounds.minX) * scaleX;
            const y = ((node.y || 0) - bounds.minY) * scaleY;
            
            return (
              <circle
                key={node.id}
                cx={x}
                cy={y}
                r={Math.max(1, (node.size || 10) / 8)}
                fill={node.color || '#3b82f6'}
                opacity={0.8}
              />
            );
          })}
          
          {/* Viewport indicator */}
          <rect
            x={width * 0.25}
            y={height * 0.25}
            width={width * 0.5}
            height={height * 0.5}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1}
            opacity={0.5}
            strokeDasharray="2,2"
          />
        </svg>
        
        <div className="text-xs text-gray-400 mt-1 text-center">
          {nodes.length} nós
        </div>
      </Card>
    </motion.div>
  );
}; 