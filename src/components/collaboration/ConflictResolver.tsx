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

interface ConflictResolverProps {
  conflicts: ConflictInfo[];
  originalContent: string;
  currentUserId: string;
  onResolveConflict: (resolution: ConflictResolution) => void;
  onDismissConflict: (conflictId: string) => void;
  className?: string;
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
          positionOffset += operation.content?.length || 0;
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
  const userGroups = insertOperations.reduce((groups, op) => {
    if (!groups[op.userId]) groups[op.userId] = [];
    groups[op.userId].push(op);
    return groups;
  }, {} as Record<string, TextOperation[]>);
  
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
  originalContent,
  currentUserId,
  onResolveConflict,
  onDismissConflict,
  className
}) => {
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);
  const [selectedStrategyIndex, setSelectedStrategyIndex] = useState(0);
  const [customContent, setCustomContent] = useState('');
  const [isCustomEditing, setIsCustomEditing] = useState(false);

  const activeConflicts = conflicts.filter(c => !c.resolved);
  const selectedConflict = activeConflicts.find(c => c.id === selectedConflictId) || activeConflicts[0];
  
  const strategies = useMergeStrategies(selectedConflict, originalContent);

  // Auto-selecionar primeiro conflito
  useEffect(() => {
    if (activeConflicts.length > 0 && !selectedConflictId) {
      setSelectedConflictId(activeConflicts[0].id);
    }
  }, [activeConflicts, selectedConflictId]);

  // Resetar estratégia selecionada quando mudar conflito
  useEffect(() => {
    setSelectedStrategyIndex(0);
    setIsCustomEditing(false);
    setCustomContent('');
  }, [selectedConflictId]);

  const handleResolveConflict = useCallback((strategy: 'auto' | 'custom') => {
    if (!selectedConflict) return;

    const resolution: ConflictResolution = {
      id: `res-${Date.now()}`,
      conflictId: selectedConflict.id,
      strategy: strategy === 'custom' ? 'manual' : 'auto_merge',
      mergedContent: strategy === 'custom' ? customContent : strategies[selectedStrategyIndex]?.preview || originalContent,
      confidence: strategy === 'custom' ? 1.0 : strategies[selectedStrategyIndex]?.confidence || 0.5,
      preservedOperations: selectedConflict.operations,
      discardedOperations: [],
      timestamp: new Date(),
      resolvedBy: currentUserId
    };

    onResolveConflict(resolution);
    
    // Ir para próximo conflito ou fechar
    const nextConflict = activeConflicts.find(c => c.id !== selectedConflictId);
    if (nextConflict) {
      setSelectedConflictId(nextConflict.id);
    } else {
      setSelectedConflictId(null);
    }
  }, [selectedConflict, strategies, selectedStrategyIndex, customContent, currentUserId, onResolveConflict, activeConflicts, selectedConflictId, originalContent]);

  if (activeConflicts.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn("fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4", className)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <GitMerge className="h-6 w-6 text-orange-600" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Resolver Conflitos</h2>
                <p className="text-sm text-gray-600">
                  {activeConflicts.length} conflito{activeConflicts.length > 1 ? 's' : ''} detectado{activeConflicts.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => selectedConflictId && onDismissConflict(selectedConflictId)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-8rem)]">
            {/* Sidebar - Lista de Conflitos */}
            {activeConflicts.length > 1 && (
              <div className="w-1/4 border-r border-gray-200 p-4 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Conflitos Ativos</h3>
                <div className="space-y-2">
                  {activeConflicts.map((conflict, index) => (
                    <button
                      key={conflict.id}
                      onClick={() => setSelectedConflictId(conflict.id)}
                      className={cn(
                        "w-full p-3 text-left border rounded-lg transition-colors",
                        selectedConflictId === conflict.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <GitBranch className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">Conflito #{index + 1}</span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {conflict.operations.length} operações envolvidas
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Estratégias */}
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Estratégias de Resolução</h3>
                
                <div className="grid gap-4 mb-6">
                  {strategies.map((strategy, index) => (
                    <StrategyPreview
                      key={index}
                      strategy={strategy}
                      isSelected={selectedStrategyIndex === index && !isCustomEditing}
                      onSelect={() => {
                        setSelectedStrategyIndex(index);
                        setIsCustomEditing(false);
                      }}
                    />
                  ))}
                  
                  {/* Opção de edição manual */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={cn(
                      "p-4 border-2 rounded-lg cursor-pointer transition-all",
                      isCustomEditing 
                        ? "border-purple-500 bg-purple-50" 
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}
                    onClick={() => {
                      setIsCustomEditing(true);
                      if (!customContent) {
                        setCustomContent(strategies[selectedStrategyIndex]?.preview || originalContent);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">Edição Manual</h4>
                      {isCustomEditing && <Check className="h-5 w-5 text-purple-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Edite o conteúdo manualmente para resolver o conflito
                    </p>
                    
                    {isCustomEditing && (
                      <textarea
                        value={customContent}
                        onChange={(e) => setCustomContent(e.target.value)}
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:border-purple-500"
                        placeholder="Edite o conteúdo aqui..."
                      />
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Footer - Ações */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {selectedConflict?.operations.length} operação(ões) em conflito
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => selectedConflictId && onDismissConflict(selectedConflictId)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Ignorar
                    </button>
                    
                    <button
                      onClick={() => handleResolveConflict(isCustomEditing ? 'custom' : 'auto')}
                      disabled={isCustomEditing && !customContent.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Resolver Conflito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConflictResolver; 