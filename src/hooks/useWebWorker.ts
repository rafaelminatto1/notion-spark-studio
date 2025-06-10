import { useEffect, useRef, useCallback, useState } from 'react';
import { GraphWorkerMessage, GraphWorkerResponse } from '@/workers/graphCalculations.worker';

interface UseWebWorkerOptions {
  maxWorkers?: number;
  enableLogging?: boolean;
}

interface WorkerTask {
  id: string;
  message: GraphWorkerMessage;
  resolve: (result: any) => void;
  reject: (error: any) => void;
  startTime: number;
}

export function useWebWorker(options: UseWebWorkerOptions = {}) {
  const { maxWorkers = 2, enableLogging = false } = options;
  
  const workersRef = useRef<Worker[]>([]);
  const taskQueueRef = useRef<WorkerTask[]>([]);
  const activeTasks = useRef<Map<string, WorkerTask>>(new Map());
  const workerBusy = useRef<boolean[]>([]);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [queueSize, setQueueSize] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [avgExecutionTime, setAvgExecutionTime] = useState(0);

  // Initialize workers
  useEffect(() => {
    const initWorkers = async () => {
      try {
        // Create worker blob
        const workerCode = await fetch('/src/workers/graphCalculations.worker.ts').then(r => r.text());
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);

        for (let i = 0; i < maxWorkers; i++) {
          try {
            const worker = new Worker(workerUrl, { type: 'module' });
            
            worker.onmessage = (e: MessageEvent<GraphWorkerResponse>) => {
              handleWorkerMessage(e.data, i);
            };
            
            worker.onerror = (error) => {
              console.error(`Worker ${i} error:`, error);
              handleWorkerError(error, i);
            };
            
            workersRef.current.push(worker);
            workerBusy.current.push(false);
          } catch (error) {
            console.warn(`Failed to create worker ${i}, falling back to main thread`);
          }
        }
        
        setIsInitialized(true);
        
        if (enableLogging) {
          console.log(`🔧 Initialized ${workersRef.current.length} Web Workers`);
        }
        
        // Cleanup blob URL
        URL.revokeObjectURL(workerUrl);
      } catch (error) {
        console.warn('Web Workers not available, using main thread fallback');
        setIsInitialized(true);
      }
    };

    initWorkers();

    return () => {
      // Cleanup workers
      workersRef.current.forEach(worker => {
        worker.terminate();
      });
      workersRef.current = [];
      workerBusy.current = [];
    };
  }, [maxWorkers, enableLogging]);

  // Handle worker messages
  const handleWorkerMessage = useCallback((response: GraphWorkerResponse, workerIndex: number) => {
    const task = activeTasks.current.get(response.id);
    
    if (!task) {
      console.warn(`Received response for unknown task: ${response.id}`);
      return;
    }
    
    // Mark worker as available
    workerBusy.current[workerIndex] = false;
    activeTasks.current.delete(response.id);
    
    // Calculate execution time
    const executionTime = Date.now() - task.startTime;
    setCompletedTasks(prev => prev + 1);
    setAvgExecutionTime(prev => prev > 0 ? (prev + executionTime) / 2 : executionTime);
    
    if (response.type === 'ERROR') {
      task.reject(new Error(response.payload.error));
    } else {
      task.resolve(response.payload);
    }
    
    if (enableLogging) {
      console.log(`✅ Worker ${workerIndex} completed task ${response.id} in ${executionTime}ms`);
    }
    
    // Process next task in queue
    processQueue();
  }, [enableLogging]);

  // Handle worker errors
  const handleWorkerError = useCallback((error: ErrorEvent, workerIndex: number) => {
    workerBusy.current[workerIndex] = false;
    
    // Reject all active tasks for this worker
    for (const [taskId, task] of activeTasks.current) {
      if (task.startTime > 0) { // Rough check if this task was on the errored worker
        activeTasks.current.delete(taskId);
        task.reject(new Error(`Worker error: ${error.message}`));
      }
    }
    
    processQueue();
  }, []);

  // Process task queue
  const processQueue = useCallback(() => {
    if (taskQueueRef.current.length === 0) return;
    
    // Find available worker
    const availableWorkerIndex = workerBusy.current.findIndex(busy => !busy);
    
    if (availableWorkerIndex === -1) return; // No workers available
    
    const task = taskQueueRef.current.shift();
    if (!task) return;
    
    // Mark worker as busy
    workerBusy.current[availableWorkerIndex] = true;
    activeTasks.current.set(task.id, task);
    task.startTime = Date.now();
    
    // Send task to worker
    const worker = workersRef.current[availableWorkerIndex];
    if (worker) {
      worker.postMessage(task.message);
      
      if (enableLogging) {
        console.log(`🚀 Worker ${availableWorkerIndex} started task ${task.id}`);
      }
    } else {
      // Fallback to main thread if no worker available
      executeOnMainThread(task);
    }
    
    setQueueSize(taskQueueRef.current.length);
  }, [enableLogging]);

  // Fallback execution on main thread
  const executeOnMainThread = useCallback(async (task: WorkerTask) => {
    try {
      // Simple fallback - would need to implement main thread versions
      console.warn('Executing on main thread - implement fallback logic');
      task.resolve({ fallback: true });
    } catch (error) {
      task.reject(error);
    }
  }, []);

  // Execute task
  const execute = useCallback(async <T = any>(
    type: GraphWorkerMessage['type'],
    payload: any
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const task: WorkerTask = {
        id,
        message: { type, payload, id },
        resolve,
        reject,
        startTime: 0
      };
      
      taskQueueRef.current.push(task);
      setQueueSize(taskQueueRef.current.length);
      
      if (enableLogging) {
        console.log(`📝 Queued task ${id} (${type})`);
      }
      
      // Try to process immediately
      processQueue();
    });
  }, [processQueue, enableLogging]);

  // High-level methods for graph operations
  const calculateLayout = useCallback(async (nodes: any[], links: any[], settings: any) => {
    return execute('CALCULATE_LAYOUT', { nodes, links, settings });
  }, [execute]);

  const analyzeNetwork = useCallback(async (nodes: any[], links: any[]) => {
    return execute('ANALYZE_NETWORK', { nodes, links });
  }, [execute]);

  const findCommunities = useCallback(async (nodes: any[], links: any[]) => {
    return execute('FIND_COMMUNITIES', { nodes, links });
  }, [execute]);

  // Clear queue
  const clearQueue = useCallback(() => {
    taskQueueRef.current.forEach(task => {
      task.reject(new Error('Task cancelled'));
    });
    taskQueueRef.current = [];
    setQueueSize(0);
  }, []);

  // Get performance stats
  const getStats = useCallback(() => {
    const activeWorkers = workerBusy.current.filter(busy => busy).length;
    const totalWorkers = workersRef.current.length;
    
    return {
      isInitialized,
      totalWorkers,
      activeWorkers,
      queueSize,
      completedTasks,
      avgExecutionTime: Math.round(avgExecutionTime),
      utilization: totalWorkers > 0 ? Math.round((activeWorkers / totalWorkers) * 100) : 0
    };
  }, [isInitialized, queueSize, completedTasks, avgExecutionTime]);

  return {
    isInitialized,
    execute,
    calculateLayout,
    analyzeNetwork,
    findCommunities,
    clearQueue,
    getStats
  };
} 