import React, { useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'retain';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
  version: number;
}

export interface OperationState {
  content: string;
  version: number;
  pendingOperations: Operation[];
  confirmedOperations: Operation[];
}

interface OperationalTransformProps {
  content: string;
  onChange: (content: string) => void;
  onOperationSend: (operation: Operation) => void;
  onOperationReceive: (operation: Operation) => void;
  userId: string;
  version: number;
  className?: string;
  children: React.ReactNode;
}

export class OTEngine {
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    // Transform two concurrent operations
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.content?.length || 0) }
        ];
      } else {
        return [
          { ...op1, position: op1.position + (op2.content?.length || 0) },
          op2
        ];
      }
    }

    if (op1.type === 'delete' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: Math.max(op1.position, op2.position - (op1.length || 0)) }
        ];
      } else {
        return [
          { ...op1, position: Math.max(op2.position, op1.position - (op2.length || 0)) },
          op2
        ];
      }
    }

    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position <= op2.position) {
        return [
          op1,
          { ...op2, position: op2.position + (op1.content?.length || 0) }
        ];
      } else {
        return [
          { ...op1, position: op1.position - (op2.length || 0) },
          op2
        ];
      }
    }

    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op2.position <= op1.position) {
        return [
          { ...op1, position: op1.position + (op2.content?.length || 0) },
          op2
        ];
      } else {
        return [
          op1,
          { ...op2, position: op2.position - (op1.length || 0) }
        ];
      }
    }

    return [op1, op2];
  }

  static apply(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return (
          content.slice(0, operation.position) +
          (operation.content || '') +
          content.slice(operation.position)
        );
      
      case 'delete':
        return (
          content.slice(0, operation.position) +
          content.slice(operation.position + (operation.length || 0))
        );
      
      case 'retain':
        return content;
      
      default:
        return content;
    }
  }

  static compose(ops: Operation[]): Operation[] {
    // Compose sequential operations for optimization
    const composed: Operation[] = [];
    
    for (const op of ops) {
      const lastOp = composed[composed.length - 1];
      
      if (!lastOp) {
        composed.push(op);
        continue;
      }

      // Merge consecutive inserts at same position
      if (
        lastOp.type === 'insert' && 
        op.type === 'insert' && 
        lastOp.position + (lastOp.content?.length || 0) === op.position &&
        lastOp.userId === op.userId
      ) {
        lastOp.content = (lastOp.content || '') + (op.content || '');
        continue;
      }

      // Merge consecutive deletes at same position
      if (
        lastOp.type === 'delete' && 
        op.type === 'delete' && 
        lastOp.position === op.position &&
        lastOp.userId === op.userId
      ) {
        lastOp.length = (lastOp.length || 0) + (op.length || 0);
        continue;
      }

      composed.push(op);
    }

    return composed;
  }
}

export const OperationalTransform: React.FC<OperationalTransformProps> = ({
  content,
  onChange,
  onOperationSend,
  onOperationReceive,
  userId,
  version,
  className,
  children
}) => {
  const stateRef = useRef<OperationState>({
    content,
    version,
    pendingOperations: [],
    confirmedOperations: []
  });

  const lastContentRef = useRef(content);
  const isApplyingRef = useRef(false);

  // Create operation from content change
  const createOperation = useCallback((oldContent: string, newContent: string): Operation | null => {
    if (oldContent === newContent) return null;

    // Find the first difference
    let start = 0;
    while (start < oldContent.length && start < newContent.length && oldContent[start] === newContent[start]) {
      start++;
    }

    // Find the last difference
    let oldEnd = oldContent.length;
    let newEnd = newContent.length;
    while (oldEnd > start && newEnd > start && oldContent[oldEnd - 1] === newContent[newEnd - 1]) {
      oldEnd--;
      newEnd--;
    }

    const deletedText = oldContent.slice(start, oldEnd);
    const insertedText = newContent.slice(start, newEnd);

    // Create appropriate operation
    if (deletedText && insertedText) {
      // Replace operation (delete + insert)
      return {
        id: uuidv4(),
        type: 'insert',
        position: start,
        content: insertedText,
        userId,
        timestamp: Date.now(),
        version: stateRef.current.version
      };
    } else if (deletedText) {
      // Delete operation
      return {
        id: uuidv4(),
        type: 'delete',
        position: start,
        length: deletedText.length,
        userId,
        timestamp: Date.now(),
        version: stateRef.current.version
      };
    } else if (insertedText) {
      // Insert operation
      return {
        id: uuidv4(),
        type: 'insert',
        position: start,
        content: insertedText,
        userId,
        timestamp: Date.now(),
        version: stateRef.current.version
      };
    }

    return null;
  }, [userId]);

  // Handle content changes
  useEffect(() => {
    if (isApplyingRef.current || content === lastContentRef.current) {
      return;
    }

    const operation = createOperation(lastContentRef.current, content);
    if (operation) {
      // Add to pending operations
      stateRef.current.pendingOperations.push(operation);
      
      // Send operation to other collaborators
      onOperationSend(operation);
      
      // Update version
      stateRef.current.version++;
    }

    lastContentRef.current = content;
    stateRef.current.content = content;
  }, [content, createOperation, onOperationSend]);

  // Apply remote operation
  const applyRemoteOperation = useCallback((remoteOp: Operation) => {
    isApplyingRef.current = true;

    try {
      let transformedOp = remoteOp;

      // Transform against pending operations
      for (const pendingOp of stateRef.current.pendingOperations) {
        const [, transformed] = OTEngine.transform(pendingOp, transformedOp);
        transformedOp = transformed;
      }

      // Apply the transformed operation
      const newContent = OTEngine.apply(stateRef.current.content, transformedOp);
      
      // Update state
      stateRef.current.content = newContent;
      stateRef.current.confirmedOperations.push(transformedOp);
      stateRef.current.version = Math.max(stateRef.current.version, remoteOp.version + 1);
      
      // Update content
      lastContentRef.current = newContent;
      onChange(newContent);

    } catch (error) {
      console.error('Failed to apply remote operation:', error);
    } finally {
      isApplyingRef.current = false;
    }
  }, [onChange]);

  // Confirm operation (when server acknowledges)
  const confirmOperation = useCallback((operationId: string) => {
    const index = stateRef.current.pendingOperations.findIndex(op => op.id === operationId);
    if (index !== -1) {
      const [confirmedOp] = stateRef.current.pendingOperations.splice(index, 1);
      stateRef.current.confirmedOperations.push(confirmedOp);
    }
  }, []);

  // Handle operation conflicts and resolution
  const resolveConflicts = useCallback(() => {
    // Implement conflict resolution strategy
    // For now, we use operational transform which should prevent most conflicts
    
    // Clean up old operations (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    stateRef.current.confirmedOperations = stateRef.current.confirmedOperations.filter(
      op => op.timestamp > fiveMinutesAgo
    );
  }, []);

  // Periodic conflict resolution
  useEffect(() => {
    const interval = setInterval(resolveConflicts, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [resolveConflicts]);

  // Set up operation receiving
  useEffect(() => {
    const unsubscribe = onOperationReceive(applyRemoteOperation);
    return unsubscribe;
  }, [onOperationReceive, applyRemoteOperation]);

  return (
    <div className={className}>
      {children}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 text-white text-xs p-2 rounded font-mono z-50">
          <div>Version: {stateRef.current.version}</div>
          <div>Pending: {stateRef.current.pendingOperations.length}</div>
          <div>Confirmed: {stateRef.current.confirmedOperations.length}</div>
        </div>
      )}
    </div>
  );
};

export default OperationalTransform; 