import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitMerge, 
  GitBranch, 
  AlertTriangle, 
  Check, 
  X, 
  ArrowRight, 
  User, 
  Clock,
  Zap,
  Eye,
  Edit3,
  RotateCcw,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TextOperation, ConflictInfo } from './OperationalTransform';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para resolução de conflitos
export interface ConflictResolution {
  id: string;
  conflictId: string;
  strategy: 'manual' | 'auto_merge' | 'last_writer_wins' | 'first_writer_wins' | 'collaborative_merge';
  mergedContent: string;
  confidence: number; // 0-1
  preservedOperations: TextOperation[];
  discardedOperations: TextOperation[];
  timestamp: Date;
  resolvedBy: string;
}

export interface MergeStrategy {
  name: string;
  description: string;
  confidence: number;
  preview: string;
  preserves: string[];
  discards: string[];
}

interface Conflict {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
}

interface ConflictResolverProps {
  conflicts: Conflict[];
  onResolve: (conflictId: string, resolution: 'keep' | 'discard' | 'merge') => void;
}

// Hook para estratégias de merge
const useMergeStrategies = (conflict: ConflictInfo, originalContent: string) => {
  return useMemo(() => {
    if (!conflict) return [];

    const strategies: MergeStrategy[] = [];

    // 1. Estratégia: Manter todas as mudanças (merge inteligente)
    const intelligentMerge = performIntelligentMerge(conflict.operations, originalContent);
    strategies.push({
      name: 'Merge Inteligente',
      description: 'Combina todas as mudanças de forma inteligente',
      confidence: intelligentMerge.confidence,
      preview: intelligentMerge.content,
      preserves: conflict.operations.map(op => `${op.userName}: ${op.type}`),
      discards: []
    });

    // 2. Estratégia: Último escritor vence
    const lastWriterOp = conflict.operations.reduce((latest, op) => 
      op.timestamp > latest.timestamp ? op : latest
    );
    const lastWriterContent = applyOperationToContent(originalContent, lastWriterOp);
    strategies.push({
      name: 'Último Escritor Vence',
      description: `Manter apenas a mudança de ${lastWriterOp.userName}`,
      confidence: 0.7,
      preview: lastWriterContent,
      preserves: [`${lastWriterOp.userName}: ${lastWriterOp.type}`],
      discards: conflict.operations.filter(op => op.id !== lastWriterOp.id).map(op => `${op.userName}: ${op.type}`)
    });

    // 3. Estratégia: Primeiro escritor vence
    const firstWriterOp = conflict.operations.reduce((earliest, op) => 
      op.timestamp < earliest.timestamp ? op : earliest
    );
    const firstWriterContent = applyOperationToContent(originalContent, firstWriterOp);
    strategies.push({
      name: 'Primeiro Escritor Vence',
      description: `Manter apenas a mudança de ${firstWriterOp.userName}`,
      confidence: 0.6,
      preview: firstWriterContent,
      preserves: [`${firstWriterOp.userName}: ${firstWriterOp.type}`],
      discards: conflict.operations.filter(op => op.id !== firstWriterOp.id).map(op => `${op.userName}: ${op.type}`)
    });

    // 4. Estratégia: Merge lado a lado
    const sideBySideMerge = performSideBySideMerge(conflict.operations, originalContent);
    strategies.push({
      name: 'Merge Lado a Lado',
      description: 'Preserva todas as mudanças em sequência',
      confidence: 0.8,
      preview: sideBySideMerge.content,
      preserves: conflict.operations.map(op => `${op.userName}: ${op.type}`),
      discards: []
    });

    return strategies.sort((a, b) => b.confidence - a.confidence);
  }, [conflict, originalContent]);
};

// Aplicar operação ao conteúdo
const applyOperationToContent = (content: string, operation: TextOperation): string => {
  switch (operation.type) {
    case 'insert':
      return content.slice(0, operation.position) + 
             (operation.content || '') + 
             content.slice(operation.position);
    
    case 'delete':
      return content.slice(0, operation.position) + 
             content.slice(operation.position + (operation.length || 0));
    
    default:
      return content;
  }
};

// Merge inteligente com análise semântica
const performIntelligentMerge = (operations: TextOperation[], originalContent: string) => {
  let mergedContent = originalContent;
  let confidence = 0.9;
  
  // Ordenar operações por timestamp
  const sortedOps = [...operations].sort((a, b) => a.timestamp - b.timestamp);
  
  // Aplicar operações sequencialmente com ajustes de posição
  let positionOffset = 0;
  
  for (const operation of sortedOps) {
    const adjustedPosition = operation.position + positionOffset;
    
    try {
      switch (operation.type) {
        case 'insert':
          mergedContent = mergedContent.slice(0, adjustedPosition) + 
                         (operation.content || '') + 
                         mergedContent.slice(adjustedPosition);
          positionOffset += operation.content?.length ?? 0;
          break;
          
        case 'delete':
          const deleteEnd = adjustedPosition + (operation.length || 0);
          mergedContent = mergedContent.slice(0, adjustedPosition) + 
                         mergedContent.slice(deleteEnd);
          positionOffset -= operation.length || 0;
          break;
      }
    } catch (error) {
      confidence -= 0.2; // Reduzir confiança se houver erro
    }
  }
  
  // Verificar se há conteúdo duplicado ou conflitante
  const hasDuplication = checkForDuplication(mergedContent);
  if (hasDuplication) {
    confidence -= 0.3;
    mergedContent = removeDuplication(mergedContent);
  }
  
  return { content: mergedContent, confidence: Math.max(0.1, confidence) };
};

// Merge lado a lado
const performSideBySideMerge = (operations: TextOperation[], originalContent: string) => {
  const insertOperations = operations.filter(op => op.type === 'insert');
  
  if (insertOperations.length === 0) return { content: originalContent, confidence: 0.5 };
  
  // Agrupar inserções por usuário
  const userGroups = insertOperations.reduce<Record<string, TextOperation[]>>((groups, op) => {
    if (!groups[op.userId]) groups[op.userId] = [];
    groups[op.userId].push(op);
    return groups;
  }, {});
  
  // Inserir comentários separando as contribuições
  let mergedContent = originalContent;
  const users = Object.keys(userGroups);
  
  // Encontrar posição de inserção (no final ou posição média)
  const insertPosition = Math.min(...insertOperations.map(op => op.position));
  
  let insertionText = '\n\n--- MERGE COLABORATIVO ---\n';
  
  users.forEach((userId, index) => {
    const userOps = userGroups[userId];
    const userName = userOps[0].userName;
    
    insertionText += `\n[${userName}]:\n`;
    userOps.forEach(op => {
      if (op.content) {
        insertionText += op.content;
      }
    });
    
    if (index < users.length - 1) {
      insertionText += '\n';
    }
  });
  
  insertionText += '\n--- FIM MERGE ---\n\n';
  
  mergedContent = mergedContent.slice(0, insertPosition) + 
                  insertionText + 
                  mergedContent.slice(insertPosition);
  
  return { content: mergedContent, confidence: 0.8 };
};

// Verificar duplicação
const checkForDuplication = (content: string): boolean => {
  const lines = content.split('\n');
  const uniqueLines = new Set(lines.filter(line => line.trim().length > 0));
  return uniqueLines.size < lines.filter(line => line.trim().length > 0).length;
};

// Remover duplicação
const removeDuplication = (content: string): string => {
  const lines = content.split('\n');
  const seenLines = new Set<string>();
  const dedupedLines: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0 || !seenLines.has(trimmedLine)) {
      dedupedLines.push(line);
      if (trimmedLine.length > 0) {
        seenLines.add(trimmedLine);
      }
    }
  }
  
  return dedupedLines.join('\n');
};

// Componente de preview de estratégia
interface StrategyPreviewProps {
  strategy: MergeStrategy;
  isSelected: boolean;
  onSelect: () => void;
}

const StrategyPreview: React.FC<StrategyPreviewProps> = ({ strategy, isSelected, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        "p-4 border-2 rounded-lg cursor-pointer transition-all",
        isSelected 
          ? "border-blue-500 bg-blue-50" 
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{strategy.name}</h4>
        <div className="flex items-center gap-1">
          <div className={cn(
            "px-2 py-1 text-xs rounded-full",
            strategy.confidence > 0.8 ? "bg-green-100 text-green-800" :
            strategy.confidence > 0.6 ? "bg-yellow-100 text-yellow-800" :
            "bg-red-100 text-red-800"
          )}>
            {Math.round(strategy.confidence * 100)}% confiança
          </div>
          {isSelected && <Check className="h-5 w-5 text-blue-500" />}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
      
      <div className="bg-gray-50 rounded-lg p-3 mb-3">
        <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Preview
        </h5>
        <div className="text-xs text-gray-600 font-mono max-h-20 overflow-y-auto">
          {strategy.preview.slice(0, 200)}
          {strategy.preview.length > 200 && '...'}
        </div>
      </div>
      
      <div className="flex gap-4">
        {strategy.preserves.length > 0 && (
          <div>
            <h6 className="text-xs font-semibold text-green-700 mb-1">Preserva:</h6>
            <ul className="text-xs text-green-600">
              {strategy.preserves.slice(0, 2).map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
              {strategy.preserves.length > 2 && (
                <li>• +{strategy.preserves.length - 2} mais</li>
              )}
            </ul>
          </div>
        )}
        
        {strategy.discards.length > 0 && (
          <div>
            <h6 className="text-xs font-semibold text-red-700 mb-1">Descarta:</h6>
            <ul className="text-xs text-red-600">
              {strategy.discards.slice(0, 2).map((item, idx) => (
                <li key={idx}>• {item}</li>
              ))}
              {strategy.discards.length > 2 && (
                <li>• +{strategy.discards.length - 2} mais</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Componente principal
export const ConflictResolver: React.FC<ConflictResolverProps> = ({
  conflicts,
  onResolve,
}) => {
  const { user } = useAuth();
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleConflictClick = useCallback((conflict: Conflict) => {
    setSelectedConflict(conflict);
    setShowDialog(true);
  }, []);

  const handleResolve = useCallback((resolution: 'keep' | 'discard' | 'merge') => {
    if (!selectedConflict) return;
    onResolve(selectedConflict.id, resolution);
    setShowDialog(false);
    setSelectedConflict(null);
  }, [selectedConflict, onResolve]);

  const unresolvedConflicts = conflicts.filter(conflict => !conflict.resolved);

  if (unresolvedConflicts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {unresolvedConflicts.map(conflict => (
          <div
            key={conflict.id}
            className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
            onClick={() => { handleConflictClick(conflict); }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Avatar src={conflict.userAvatar} alt={conflict.userName} size="sm" />
              <div>
                <span className="font-medium">{conflict.userName}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {formatDistanceToNow(conflict.timestamp, {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
            <p className="text-sm line-clamp-2">{conflict.content}</p>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resolver Conflito</DialogTitle>
          </DialogHeader>

          {selectedConflict && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Avatar
                  src={selectedConflict.userAvatar}
                  alt={selectedConflict.userName}
                  size="sm"
                />
                <div>
                  <span className="font-medium">{selectedConflict.userName}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatDistanceToNow(selectedConflict.timestamp, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
              </div>

              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <pre className="text-sm whitespace-pre-wrap">
                  {selectedConflict.content}
                </pre>
              </ScrollArea>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => { handleResolve('discard'); }}
                >
                  Descartar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { handleResolve('merge'); }}
                >
                  Mesclar
                </Button>
                <Button
                  onClick={() => { handleResolve('keep'); }}
                >
                  Manter
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ConflictResolver; 