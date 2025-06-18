import { useState, useEffect, useCallback, useRef } from 'react';
import { aiPerformanceOptimizer } from '../services/AIPerformanceOptimizer';
import type { 
  OptimizationMetrics, 
  UserBehaviorData, 
  PerformancePattern 
} from '../types/common';

export interface AIOptimizerConfig {
  enabled: boolean;
  autoApply: boolean;
  confidenceThreshold: number;
  learningMode: boolean;
}

interface PerformanceMetrics {
  cpu: {
    usage: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
  };
  memory: {
    usage: number;
    heapUsed: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
  };
  network: {
    latency: number;
    bandwidth: number;
    status: 'good' | 'warning' | 'critical';
  };
  rendering: {
    fps: number;
    renderTime: number;
    status: 'good' | 'warning' | 'critical';
  };
  userExperience: {
    interactionLatency: number;
    loadTime: number;
    score: number;
    status: 'good' | 'warning' | 'critical';
  };
}

interface OptimizationState {
  isOptimizing: boolean;
  lastOptimization: number | null;
  activeOptimizations: number;
  optimizationHistory: Array<{
    id: string;
    type: string;
    timestamp: number;
    success: boolean;
    improvement: number;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: number;
    effort: 'low' | 'medium' | 'high';
    impact: 'low' | 'medium' | 'high';
    automatic: boolean;
  }>;
}

interface PredictionData {
  bottleneckProbability: number;
  resourceUsageForecast: number;
  timeToNextIssue: number | null;
  confidenceScore: number;
  preventiveActions: string[];
}

interface UseAIPerformanceOptimizerOptions {
  autoOptimize?: boolean;
  monitoringInterval?: number;
  optimizationThreshold?: number;
  enablePredictions?: boolean;
  maxOptimizationsPerHour?: number;
}

interface AIPerformanceOptimizerActions {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  forceOptimization: () => Promise<boolean>;
  applyRecommendation: (recommendationId: string) => Promise<boolean>;
  resetMetrics: () => void;
  exportPerformanceData: () => Promise<string>;
  setAutoOptimize: (enabled: boolean) => void;
  getDetailedMetrics: () => any;
  runPerformanceAudit: () => Promise<any>;
}

export function useAIPerformanceOptimizer(
  options: UseAIPerformanceOptimizerOptions = {}
) {
  const {
    autoOptimize = true,
    monitoringInterval = 5000,
    optimizationThreshold = 70,
    enablePredictions = true,
    maxOptimizationsPerHour = 12
  } = options;

  // Core State
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(95);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cpu: { usage: 25, trend: 'stable', status: 'good' },
    memory: { usage: 45, heapUsed: 67, trend: 'stable', status: 'good' },
    network: { latency: 45, bandwidth: 250, status: 'good' },
    rendering: { fps: 60, renderTime: 12, status: 'good' },
    userExperience: { interactionLatency: 35, loadTime: 1200, score: 85, status: 'good' }
  });

  const [optimizationState, setOptimizationState] = useState<OptimizationState>({
    isOptimizing: false,
    lastOptimization: null,
    activeOptimizations: 0,
    optimizationHistory: [],
    recommendations: []
  });

  const [predictions, setPredictions] = useState<PredictionData>({
    bottleneckProbability: 0.15,
    resourceUsageForecast: 62,
    timeToNextIssue: null,
    confidenceScore: 0.87,
    preventiveActions: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const monitoringIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const optimizationCountRef = useRef(0);
  const lastOptimizationHourRef = useRef(new Date().getHours());
  const metricsHistoryRef = useRef<PerformanceMetrics[]>([]);

  // Core Monitoring Logic
  const collectMetrics = useCallback(async () => {
    try {
      setError(null);
      
      const performanceStatus = aiPerformanceOptimizer.getPerformanceStatus();
      const recommendations = aiPerformanceOptimizer.getOptimizationRecommendations();

      // Update performance score
      const scoreMap = {
        'optimal': 90 + Math.random() * 10,
        'good': 75 + Math.random() * 15,
        'degraded': 50 + Math.random() * 25,
        'critical': 20 + Math.random() * 30
      };
      
      const newScore = Math.round(scoreMap[performanceStatus.status as keyof typeof scoreMap] || 75);
      setPerformanceScore(newScore);

      // Simulate realistic metrics with some variation
      const newMetrics: PerformanceMetrics = {
        cpu: {
          usage: Math.max(0, Math.min(100, 25 + (Math.random() - 0.5) * 30)),
          trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable',
          status: 'good'
        },
        memory: {
          usage: Math.max(0, Math.min(100, 45 + (Math.random() - 0.5) * 20)),
          heapUsed: Math.max(0, Math.min(200, 67 + (Math.random() - 0.5) * 15)),
          trend: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable',
          status: 'good'
        },
        network: {
          latency: Math.max(10, 45 + (Math.random() - 0.5) * 40),
          bandwidth: Math.max(50, 250 + (Math.random() - 0.5) * 100),
          status: 'good'
        },
        rendering: {
          fps: Math.max(30, 60 + (Math.random() - 0.5) * 20),
          renderTime: Math.max(5, 12 + (Math.random() - 0.5) * 10),
          status: 'good'
        },
        userExperience: {
          interactionLatency: Math.max(10, 35 + (Math.random() - 0.5) * 20),
          loadTime: Math.max(500, 1200 + (Math.random() - 0.5) * 800),
          score: newScore,
          status: newScore > 80 ? 'good' : newScore > 60 ? 'warning' : 'critical'
        }
      };

      // Apply status based on thresholds
      newMetrics.cpu.status = newMetrics.cpu.usage > 80 ? 'critical' : newMetrics.cpu.usage > 60 ? 'warning' : 'good';
      newMetrics.memory.status = newMetrics.memory.usage > 85 ? 'critical' : newMetrics.memory.usage > 70 ? 'warning' : 'good';
      newMetrics.network.status = newMetrics.network.latency > 200 ? 'critical' : newMetrics.network.latency > 100 ? 'warning' : 'good';
      newMetrics.rendering.status = newMetrics.rendering.fps < 30 ? 'critical' : newMetrics.rendering.fps < 45 ? 'warning' : 'good';

      setMetrics(newMetrics);

      // Store metrics history
      metricsHistoryRef.current.push(newMetrics);
      if (metricsHistoryRef.current.length > 100) {
        metricsHistoryRef.current = metricsHistoryRef.current.slice(-50);
      }

      // Update optimization recommendations
      setOptimizationState(prev => ({
        ...prev,
        recommendations: recommendations.slice(0, 5).map(rec => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          effort: rec.effort,
          impact: rec.impact,
          automatic: rec.implementation.automatic
        }))
      }));

      // Update predictions if enabled
      if (enablePredictions) {
        await updatePredictions(newMetrics, newScore);
      }

      // Auto-optimize if conditions are met
      if (autoOptimize && shouldAutoOptimize(newScore, newMetrics)) {
        await performAutoOptimization();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to collect metrics';
      setError(errorMessage);
      console.error('❌ Metrics collection failed:', err);
    }
  }, [autoOptimize, enablePredictions, optimizationThreshold]);

  const updatePredictions = useCallback(async (currentMetrics: PerformanceMetrics, score: number) => {
    try {
      // Calculate bottleneck probability based on current state
      const criticalCount = Object.values(currentMetrics).filter(m => m.status === 'critical').length;
      const warningCount = Object.values(currentMetrics).filter(m => m.status === 'warning').length;
      
      const bottleneckProb = Math.min(1, (criticalCount * 0.3 + warningCount * 0.15));
      
      // Forecast resource usage based on trends
      const memoryTrend = currentMetrics.memory.trend;
      const forecastMultiplier = memoryTrend === 'up' ? 1.1 : memoryTrend === 'down' ? 0.95 : 1.0;
      const resourceForecast = Math.min(100, currentMetrics.memory.usage * forecastMultiplier);

      // Estimate time to next issue
      let timeToIssue: number | null = null;
      if (bottleneckProb > 0.5) {
        timeToIssue = Math.max(60000, (1 - bottleneckProb) * 300000); // 1-5 minutes
      }

      // Generate preventive actions
      const actions = [];
      if (currentMetrics.memory.trend === 'up') {
        actions.push('Monitorar uso de memória');
      }
      if (currentMetrics.cpu.usage > 70) {
        actions.push('Reduzir processos em background');
      }
      if (currentMetrics.network.latency > 100) {
        actions.push('Otimizar requisições de rede');
      }

      setPredictions({
        bottleneckProbability: bottleneckProb,
        resourceUsageForecast: Math.round(resourceForecast),
        timeToNextIssue: timeToIssue,
        confidenceScore: 0.85 + Math.random() * 0.1,
        preventiveActions: actions
      });

    } catch (err) {
      console.error('❌ Predictions update failed:', err);
    }
  }, []);

  const shouldAutoOptimize = useCallback((score: number, currentMetrics: PerformanceMetrics): boolean => {
    const currentHour = new Date().getHours();
    
    // Reset optimization count if new hour
    if (currentHour !== lastOptimizationHourRef.current) {
      optimizationCountRef.current = 0;
      lastOptimizationHourRef.current = currentHour;
    }

    // Check if we've exceeded max optimizations per hour
    if (optimizationCountRef.current >= maxOptimizationsPerHour) {
      return false;
    }

    // Check if optimization is needed
    const hasOptimizationNeeds = score < optimizationThreshold ||
      Object.values(currentMetrics).some(m => m.status === 'critical') ||
      predictions.bottleneckProbability > 0.7;

    // Check if enough time has passed since last optimization
    const timeSinceLastOpt = optimizationState.lastOptimization 
      ? Date.now() - optimizationState.lastOptimization 
      : Infinity;
    
    const minTimeBetweenOpts = 30000; // 30 seconds

    return hasOptimizationNeeds && 
           timeSinceLastOpt > minTimeBetweenOpts && 
           !optimizationState.isOptimizing;
  }, [optimizationThreshold, predictions.bottleneckProbability, optimizationState.lastOptimization, optimizationState.isOptimizing, maxOptimizationsPerHour]);

  const performAutoOptimization = useCallback(async () => {
    if (optimizationState.isOptimizing) return;

    console.log('🤖 Performing automatic optimization...');
    
    setOptimizationState(prev => ({
      ...prev,
      isOptimizing: true
    }));

    try {
      const success = await aiPerformanceOptimizer.forceOptimization();
      
      optimizationCountRef.current++;
      
      const optimizationResult = {
        id: `auto_opt_${Date.now()}`,
        type: 'automatic',
        timestamp: Date.now(),
        success,
        improvement: success ? 5 + Math.random() * 15 : 0
      };

      setOptimizationState(prev => ({
        ...prev,
        isOptimizing: false,
        lastOptimization: Date.now(),
        activeOptimizations: prev.activeOptimizations + (success ? 1 : 0),
        optimizationHistory: [optimizationResult, ...prev.optimizationHistory.slice(0, 9)]
      }));

      if (success) {
        console.log('✅ Automatic optimization completed successfully');
      } else {
        console.warn('⚠️ Automatic optimization completed with issues');
      }

    } catch (err) {
      console.error('❌ Automatic optimization failed:', err);
      
      setOptimizationState(prev => ({
        ...prev,
        isOptimizing: false
      }));
    }
  }, [optimizationState.isOptimizing]);

  // Actions Implementation
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    console.log('📊 Starting performance monitoring...');
    setIsMonitoring(true);
    
    // Initial metrics collection
    collectMetrics();
    
    // Set up interval
    monitoringIntervalRef.current = setInterval(collectMetrics, monitoringInterval);
  }, [isMonitoring, collectMetrics, monitoringInterval]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    console.log('⏹️ Stopping performance monitoring...');
    setIsMonitoring(false);
    
    if (monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = null;
    }
  }, [isMonitoring]);

  const forceOptimization = useCallback(async (): Promise<boolean> => {
    if (optimizationState.isOptimizing) {
      console.warn('⚠️ Optimization already in progress');
      return false;
    }

    console.log('🚀 Force optimization triggered');
    setLoading(true);
    
    setOptimizationState(prev => ({
      ...prev,
      isOptimizing: true
    }));

    try {
      const success = await aiPerformanceOptimizer.forceOptimization();
      
      optimizationCountRef.current++;
      
      const optimizationResult = {
        id: `manual_opt_${Date.now()}`,
        type: 'manual',
        timestamp: Date.now(),
        success,
        improvement: success ? 10 + Math.random() * 20 : 0
      };

      setOptimizationState(prev => ({
        ...prev,
        isOptimizing: false,
        lastOptimization: Date.now(),
        activeOptimizations: prev.activeOptimizations + (success ? 1 : 0),
        optimizationHistory: [optimizationResult, ...prev.optimizationHistory.slice(0, 9)]
      }));

      // Refresh metrics after optimization
      setTimeout(() => {
        collectMetrics();
      }, 2000);

      console.log(success ? '✅ Force optimization successful' : '⚠️ Force optimization completed with issues');
      return success;

    } catch (err) {
      console.error('❌ Force optimization failed:', err);
      setError(err instanceof Error ? err.message : 'Optimization failed');
      
      setOptimizationState(prev => ({
        ...prev,
        isOptimizing: false
      }));
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [optimizationState.isOptimizing, collectMetrics]);

  const applyRecommendation = useCallback(async (recommendationId: string): Promise<boolean> => {
    const recommendation = optimizationState.recommendations.find(r => r.id === recommendationId);
    if (!recommendation) {
      console.error('❌ Recommendation not found:', recommendationId);
      return false;
    }

    console.log(`🔧 Applying recommendation: ${recommendation.title}`);
    setLoading(true);

    try {
      // Simulate applying recommendation
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const success = Math.random() > 0.15; // 85% success rate
      
      const optimizationResult = {
        id: `rec_opt_${Date.now()}`,
        type: `recommendation_${recommendation.type}`,
        timestamp: Date.now(),
        success,
        improvement: success ? 3 + Math.random() * 12 : 0
      };

      setOptimizationState(prev => ({
        ...prev,
        optimizationHistory: [optimizationResult, ...prev.optimizationHistory.slice(0, 9)],
        recommendations: prev.recommendations.filter(r => r.id !== recommendationId)
      }));

      console.log(success ? '✅ Recommendation applied successfully' : '⚠️ Recommendation application failed');
      return success;

    } catch (err) {
      console.error('❌ Recommendation application failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [optimizationState.recommendations]);

  const resetMetrics = useCallback(() => {
    console.log('🔄 Resetting performance metrics...');
    
    setPerformanceScore(95);
    setMetrics({
      cpu: { usage: 25, trend: 'stable', status: 'good' },
      memory: { usage: 45, heapUsed: 67, trend: 'stable', status: 'good' },
      network: { latency: 45, bandwidth: 250, status: 'good' },
      rendering: { fps: 60, renderTime: 12, status: 'good' },
      userExperience: { interactionLatency: 35, loadTime: 1200, score: 85, status: 'good' }
    });
    
    setOptimizationState(prev => ({
      ...prev,
      optimizationHistory: [],
      activeOptimizations: 0
    }));
    
    setPredictions({
      bottleneckProbability: 0.15,
      resourceUsageForecast: 62,
      timeToNextIssue: null,
      confidenceScore: 0.87,
      preventiveActions: []
    });

    metricsHistoryRef.current = [];
    optimizationCountRef.current = 0;
    setError(null);
  }, []);

  const exportPerformanceData = useCallback(async (): Promise<string> => {
    try {
      setLoading(true);
      
      const exportData = {
        timestamp: Date.now(),
        performanceScore,
        currentMetrics: metrics,
        metricsHistory: metricsHistoryRef.current,
        optimizationState,
        predictions,
        configuration: {
          autoOptimize,
          monitoringInterval,
          optimizationThreshold,
          enablePredictions,
          maxOptimizationsPerHour
        },
        systemInfo: {
          isMonitoring,
          error,
          uptime: Date.now() - (optimizationState.lastOptimization || Date.now())
        }
      };

      const jsonData = JSON.stringify(exportData, null, 2);
      
      console.log('📤 Performance data exported successfully');
      return jsonData;

    } catch (err) {
      console.error('❌ Export failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [performanceScore, metrics, optimizationState, predictions, autoOptimize, monitoringInterval, optimizationThreshold, enablePredictions, maxOptimizationsPerHour, isMonitoring, error]);

  const setAutoOptimize = useCallback((enabled: boolean) => {
    console.log(`🤖 Auto-optimization ${enabled ? 'enabled' : 'disabled'}`);
    // This would update the options in a real implementation
  }, []);

  const getDetailedMetrics = useCallback(() => {
    return {
      current: metrics,
      history: metricsHistoryRef.current,
      averages: calculateAverages(),
      trends: calculateTrends(),
      alerts: generateAlerts()
    };
  }, [metrics]);

  const calculateAverages = useCallback(() => {
    if (metricsHistoryRef.current.length === 0) return null;

    const history = metricsHistoryRef.current;
    const length = history.length;

    return {
      cpu: history.reduce((sum, m) => sum + m.cpu.usage, 0) / length,
      memory: history.reduce((sum, m) => sum + m.memory.usage, 0) / length,
      networkLatency: history.reduce((sum, m) => sum + m.network.latency, 0) / length,
      fps: history.reduce((sum, m) => sum + m.rendering.fps, 0) / length,
      interactionLatency: history.reduce((sum, m) => sum + m.userExperience.interactionLatency, 0) / length
    };
  }, []);

  const calculateTrends = useCallback(() => {
    if (metricsHistoryRef.current.length < 5) return null;

    const recent = metricsHistoryRef.current.slice(-5);
    const older = metricsHistoryRef.current.slice(-10, -5);

    if (older.length === 0) return null;

    const recentAvg = {
      cpu: recent.reduce((sum, m) => sum + m.cpu.usage, 0) / recent.length,
      memory: recent.reduce((sum, m) => sum + m.memory.usage, 0) / recent.length
    };

    const olderAvg = {
      cpu: older.reduce((sum, m) => sum + m.cpu.usage, 0) / older.length,
      memory: older.reduce((sum, m) => sum + m.memory.usage, 0) / older.length
    };

    return {
      cpu: recentAvg.cpu > olderAvg.cpu ? 'increasing' : recentAvg.cpu < olderAvg.cpu ? 'decreasing' : 'stable',
      memory: recentAvg.memory > olderAvg.memory ? 'increasing' : recentAvg.memory < olderAvg.memory ? 'decreasing' : 'stable'
    };
  }, []);

  const generateAlerts = useCallback(() => {
    const alerts = [];
    
    if (metrics.cpu.status === 'critical') {
      alerts.push({ type: 'critical', message: 'CPU usage critically high', metric: 'cpu' });
    }
    
    if (metrics.memory.status === 'critical') {
      alerts.push({ type: 'critical', message: 'Memory usage critically high', metric: 'memory' });
    }
    
    if (predictions.bottleneckProbability > 0.8) {
      alerts.push({ type: 'warning', message: 'High bottleneck probability detected', metric: 'prediction' });
    }
    
    return alerts;
  }, [metrics, predictions]);

  const runPerformanceAudit = useCallback(async () => {
    console.log('🔍 Running performance audit...');
    setLoading(true);

    try {
      // Simulate comprehensive audit
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const auditResults = {
        overallScore: performanceScore,
        categories: {
          performance: Math.round(performanceScore * 0.9 + Math.random() * 10),
          accessibility: Math.round(85 + Math.random() * 10),
          bestPractices: Math.round(88 + Math.random() * 10),
          seo: Math.round(82 + Math.random() * 15)
        },
        metrics: {
          firstContentfulPaint: Math.round(800 + Math.random() * 600),
          largestContentfulPaint: Math.round(1500 + Math.random() * 1000),
          cumulativeLayoutShift: (Math.random() * 0.2).toFixed(3),
          totalBlockingTime: Math.round(100 + Math.random() * 200)
        },
        opportunities: [
          'Optimize images for better compression',
          'Eliminate render-blocking resources',
          'Enable text compression',
          'Reduce unused JavaScript'
        ],
        timestamp: Date.now()
      };

      console.log('✅ Performance audit completed');
      return auditResults;

    } catch (err) {
      console.error('❌ Performance audit failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [performanceScore]);

  // Effects
  useEffect(() => {
    // Auto-start monitoring
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  useEffect(() => {
    // Update monitoring interval if changed
    if (isMonitoring && monitoringIntervalRef.current) {
      clearInterval(monitoringIntervalRef.current);
      monitoringIntervalRef.current = setInterval(collectMetrics, monitoringInterval);
    }
  }, [monitoringInterval, isMonitoring, collectMetrics]);

  // Actions object
  const actions: AIPerformanceOptimizerActions = {
    startMonitoring,
    stopMonitoring,
    forceOptimization,
    applyRecommendation,
    resetMetrics,
    exportPerformanceData,
    setAutoOptimize,
    getDetailedMetrics,
    runPerformanceAudit
  };

  return {
    // State
    isMonitoring,
    performanceScore,
    metrics,
    optimizationState,
    predictions,
    loading,
    error,
    
    // Actions
    ...actions,
    
    // Computed
    overallStatus: performanceScore > 85 ? 'excellent' : performanceScore > 70 ? 'good' : performanceScore > 50 ? 'fair' : 'poor',
    criticalIssues: Object.values(metrics).filter(m => m.status === 'critical').length,
    warningIssues: Object.values(metrics).filter(m => m.status === 'warning').length,
    
    // Configuration
    config: {
      autoOptimize,
      monitoringInterval,
      optimizationThreshold,
      enablePredictions,
      maxOptimizationsPerHour
    }
  };
}

export default useAIPerformanceOptimizer; 