import { useState, useEffect, useCallback } from 'react';
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

export function useAIPerformanceOptimizer(config: AIOptimizerConfig = {
  enabled: true,
  autoApply: false,
  confidenceThreshold: 0.85,
  learningMode: true
}) {
  const [metrics, setMetrics] = useState<OptimizationMetrics>({
    totalOptimizations: 0,
    averageImprovement: 0,
    predictedBottlenecks: 0,
    userSatisfactionScore: 0.85,
    adaptiveScore: 0.3
  });
  
  const [isLearning, setIsLearning] = useState(config.learningMode);
  const [appliedOptimizations, setAppliedOptimizations] = useState(0);

  /**
   * 📊 Registra comportamento do usuário
   */
  const recordBehavior = useCallback((data: Omit<UserBehaviorData, 'sessionId' | 'timestamp'>) => {
    if (!config.enabled) return;
    
    aiPerformanceOptimizer.recordBehavior(data);
  }, [config.enabled]);

  /**
   * 🚀 Aplica otimizações disponíveis
   */
  const applyOptimizations = useCallback(async (autoApply: boolean = config.autoApply) => {
    if (!config.enabled) return 0;
    
    try {
      const count = await aiPerformanceOptimizer.applyOptimizations(autoApply);
      setAppliedOptimizations(prev => prev + count);
      return count;
    } catch (error) {
      console.error('❌ Erro ao aplicar otimizações:', error);
      return 0;
    }
  }, [config.enabled, config.autoApply]);

  /**
   * 📈 Detecta gargalos potenciais
   */
  const predictBottlenecks = useCallback((): PerformancePattern[] => {
    if (!config.enabled) return [];
    
    return aiPerformanceOptimizer.predictBottlenecks();
  }, [config.enabled]);

  /**
   * 🧹 Reinicia sistema de aprendizado
   */
  const resetLearning = useCallback(() => {
    if (!config.enabled) return;
    
    aiPerformanceOptimizer.reset();
    setMetrics({
      totalOptimizations: 0,
      averageImprovement: 0,
      predictedBottlenecks: 0,
      userSatisfactionScore: 0.85,
      adaptiveScore: 0.3
    });
    setAppliedOptimizations(0);
  }, [config.enabled]);

  /**
   * 🎯 Registra evento de performance automaticamente
   */
  const trackPerformance = useCallback((componentName: string, renderTime: number) => {
    if (!config.enabled) return;
    
    recordBehavior({
      route: window.location.pathname,
      component: componentName,
      action: 'render',
      duration: renderTime,
      performance: {
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        fps: 60 // Em produção, seria calculado via PerformanceObserver
      }
    });
  }, [recordBehavior, config.enabled]);

  // Configuração do listener de métricas
  useEffect(() => {
    if (!config.enabled) return;

    const unsubscribe = aiPerformanceOptimizer.onMetricsUpdate((newMetrics) => {
      setMetrics(newMetrics);
    });

    // Carrega métricas iniciais
    setMetrics(aiPerformanceOptimizer.getMetrics());

    return unsubscribe;
  }, [config.enabled]);

  // Auto-aplicação de otimizações
  useEffect(() => {
    if (!config.enabled || !config.autoApply) return;

    const interval = setInterval(async () => {
      const bottlenecks = predictBottlenecks();
      
      if (bottlenecks.length > 0) {
        console.log(`🤖 AI detectou ${bottlenecks.length} gargalo(s), aplicando otimizações...`);
        await applyOptimizations(true);
      }
    }, 30000); // Verifica a cada 30 segundos

    return () => clearInterval(interval);
  }, [config.enabled, config.autoApply, applyOptimizations, predictBottlenecks]);

  // Hook para registrar interações automaticamente
  useEffect(() => {
    if (!config.enabled || !config.learningMode) return;

    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      recordBehavior({
        route: window.location.pathname,
        component: target.tagName || 'unknown',
        action: 'click',
        duration: 0,
        performance: {
          renderTime: performance.now() % 100,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          fps: 60
        }
      });
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [config.enabled, config.learningMode, recordBehavior]);

  return {
    // Estado
    metrics,
    isLearning,
    appliedOptimizations,
    isEnabled: config.enabled,
    
    // Ações
    recordBehavior,
    applyOptimizations,
    predictBottlenecks,
    resetLearning,
    trackPerformance,
    
    // Configurações
    setLearningMode: setIsLearning,
    
    // Métricas calculadas
    optimizationScore: metrics.adaptiveScore * 100,
    satisfactionScore: metrics.userSatisfactionScore * 100,
    hasBottlenecks: metrics.predictedBottlenecks > 0,
    improvementPotential: metrics.averageImprovement
  };
} 