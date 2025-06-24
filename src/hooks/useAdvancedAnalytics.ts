import { useState, useEffect, useCallback, useRef } from 'react';
import { advancedAnalyticsEngine } from '../services/AdvancedAnalyticsEngine';
import type { 
  UserEvent, 
  AnalyticsMetrics, 
  AnalyticsInsight, 
  ConversionFunnel,
  CohortAnalysis,
  MetricsTrend,
  UserJourney
} from '../types/common';

// 🛠️ Helper function para gerar session ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export interface AnalyticsConfig {
  enabled: boolean;
  trackingLevel: 'basic' | 'detailed' | 'comprehensive';
  autoTrack: boolean;
  realTimeInsights: boolean;
  retentionPeriod: number; // em dias
}

export function useAdvancedAnalytics(config: AnalyticsConfig = {
  enabled: true,
  trackingLevel: 'detailed',
  autoTrack: true,
  realTimeInsights: true,
  retentionPeriod: 30
}) {
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    activeUsers: 0,
    totalSessions: 0,
    averageSessionDuration: 0,
    bounceRate: 0,
    conversionRate: 0,
    retentionRate: 0,
    engagementScore: 0,
    performanceScore: 0
  });
  
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [isTracking, setIsTracking] = useState(config.autoTrack);
  const [realtimeEvents, setRealtimeEvents] = useState(0);
  
  const engineRef = useRef(advancedAnalyticsEngine);
  const sessionIdRef = useRef<string>('');
  const userIdRef = useRef<string>('');

  /**
   * 📊 Registra evento personalizado
   */
  const trackEvent = useCallback((event: Omit<UserEvent, 'id' | 'timestamp' | 'userId' | 'sessionId'>) => {
    if (!config.enabled || !isTracking) return;
    
    // 🐛 DEBUG: Log para capturar o erro
    console.log('🔍 [DEBUG] useAdvancedAnalytics trackEvent called with:', event);
    
    // Validação de entrada
    if (!event || typeof event !== 'object') {
      console.error('❌ [ERROR] Invalid event object in useAdvancedAnalytics:', event);
      return;
    }
    
    const userId = userIdRef.current || 'anonymous';
    const sessionId = sessionIdRef.current || generateSessionId();
    
    // Preparar dados seguros para o engine
    const eventData = {
      action: event.action || 'unknown',
      page: event.category || 'unknown',
      metadata: event.properties || {},
      timestamp: Date.now(),
      sessionId
    };
    
    console.log('🔍 [DEBUG] Calling engine trackEvent with:', { userId, eventData });
    
    try {
      engineRef.current.trackEvent(userId, eventData);
      setRealtimeEvents(prev => prev + 1);
    } catch (error) {
      console.error('❌ [ERROR] Error in trackEvent:', error);
    }
  }, [config.enabled, isTracking]);

  /**
   * 🎯 Tracking automático de cliques
   */
  const trackClick = useCallback((elementId: string, category = 'ui') => {
    trackEvent({
      type: 'click',
      action: 'click',
      category,
      properties: { elementId },
      performance: {
        pageLoadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart ?? 0,
        renderTime: performance.now(),
        interactionTime: performance.now(),
        memoryUsage: (performance as any).memory?.usedJSHeapSize ?? 0,
        networkLatency: 0,
        fps: 60
      }
    });
  }, [trackEvent]);

  /**
   * 👁️ Tracking de visualizações
   */
  const trackView = useCallback((pagePath: string, category = 'page') => {
    trackEvent({
      type: 'view',
      action: 'page_view',
      category,
      properties: { 
        path: pagePath,
        referrer: document.referrer,
        timestamp: Date.now()
      },
      performance: {
        pageLoadTime: performance.timing?.loadEventEnd - performance.timing?.navigationStart ?? 0,
        renderTime: 0,
        interactionTime: 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize ?? 0,
        networkLatency: 0,
        fps: 60
      }
    });
  }, [trackEvent]);

  /**
   * ✏️ Tracking de edições
   */
  const trackEdit = useCallback((action: string, properties: Record<string, any> = {}) => {
    trackEvent({
      type: 'edit',
      action,
      category: 'content',
      properties: {
        ...properties,
        timestamp: Date.now()
      }
    });
  }, [trackEvent]);

  /**
   * 🔍 Tracking de buscas
   */
  const trackSearch = useCallback((query: string, results = 0) => {
    trackEvent({
      type: 'search',
      action: 'search_query',
      category: 'search',
      properties: {
        query,
        results,
        queryLength: query.length
      }
    });
  }, [trackEvent]);

  /**
   * 🎯 Analisa funil de conversão
   */
  const analyzeConversionFunnel = useCallback((steps: string[]): ConversionFunnel => {
    if (!config.enabled) {
      return {
        name: 'Conversion Funnel',
        steps,
        conversionRates: [],
        dropoffRates: [],
        totalUsers: 0,
        totalConversions: 0
      };
    }
    
    return engineRef.current.analyzeConversionFunnel(steps);
  }, [config.enabled]);

  /**
   * 👥 Gera análise de coorte
   */
  const generateCohortAnalysis = useCallback((period: 'week' | 'month' = 'week'): CohortAnalysis[] => {
    if (!config.enabled) return [];
    
    return engineRef.current.generateCohortAnalysis(period);
  }, [config.enabled]);

  /**
   * 📈 Obtém tendência de métrica
   */
  const getMetricTrend = useCallback((metric: string, period: 'hour' | 'day' | 'week' | 'month' = 'day'): MetricsTrend => {
    if (!config.enabled) {
      return {
        metric,
        period,
        values: [],
        trend: 'stable',
        change: 0,
        prediction: []
      };
    }
    
    return engineRef.current.getTrends(metric, period);
  }, [config.enabled]);

  /**
   * 🔮 Gera previsões
   */
  const generatePredictions = useCallback((): AnalyticsInsight[] => {
    if (!config.enabled) return [];
    
    return engineRef.current.generatePredictions();
  }, [config.enabled]);

  /**
   * 📊 Atualiza métricas manualmente
   */
  const refreshMetrics = useCallback((period: number = 24 * 60 * 60 * 1000) => {
    if (!config.enabled) return;
    
    const newMetrics = engineRef.current.getMetrics(period);
    setMetrics(newMetrics);
  }, [config.enabled]);

  /**
   * 🧹 Reinicia analytics
   */
  const resetAnalytics = useCallback(() => {
    if (!config.enabled) return;
    
    engineRef.current.reset();
    setMetrics({
      activeUsers: 0,
      totalSessions: 0,
      averageSessionDuration: 0,
      bounceRate: 0,
      conversionRate: 0,
      retentionRate: 0,
      engagementScore: 0,
      performanceScore: 0
    });
    setInsights([]);
    setRealtimeEvents(0);
  }, [config.enabled]);

  /**
   * 👤 Define usuário atual
   */
  const setUser = useCallback((userId: string) => {
    userIdRef.current = userId;
  }, []);

  /**
   * 🎫 Inicia nova sessão
   */
  const startSession = useCallback(() => {
    sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setRealtimeEvents(0);
  }, []);

  // Inicialização da sessão
  useEffect(() => {
    if (config.enabled && !sessionIdRef.current) {
      startSession();
    }
  }, [config.enabled, startSession]);

  // Auto-tracking de navegação
  useEffect(() => {
    if (!config.enabled || !config.autoTrack) return;

    const handleLocationChange = () => {
      trackView(window.location.pathname);
    };

    // Track initial page load
    trackView(window.location.pathname);

    // Listener para mudanças de rota
    window.addEventListener('popstate', handleLocationChange);
    
    // Para SPAs usando history API
    const originalPushState = history.pushState;
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(handleLocationChange, 0);
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleLocationChange, 0);
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [config.enabled, config.autoTrack, trackView]);

  // Auto-tracking de cliques
  useEffect(() => {
    if (!config.enabled || !config.autoTrack) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target) {
        const elementId = target.id || target.className || target.tagName;
        trackClick(elementId);
      }
    };

    document.addEventListener('click', handleClick);
    return () => { document.removeEventListener('click', handleClick); };
  }, [config.enabled, config.autoTrack, trackClick]);

  // Carregamento de métricas
  useEffect(() => {
    if (!config.enabled) return;

    const loadInitialMetrics = () => {
      const newMetrics = engineRef.current.getMetrics();
      setMetrics(newMetrics);
    };

    loadInitialMetrics();

    // Atualização periódica de métricas
    const interval = setInterval(() => {
      refreshMetrics();
      
      if (config.realTimeInsights) {
        const newInsights = generatePredictions();
        setInsights(newInsights);
      }
    }, 30000); // Atualiza a cada 30 segundos

    return () => { clearInterval(interval); };
  }, [config.enabled, config.realTimeInsights, refreshMetrics, generatePredictions]);

  // Inicialização de sessão
  useEffect(() => {
    if (!config.enabled) return;

    sessionIdRef.current = engineRef.current.generateSessionId();
    userIdRef.current = engineRef.current.getCurrentUserId();
  }, [config.enabled]);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (config.enabled) {
        engineRef.current.flush();
      }
    };
  }, [config.enabled]);

  return {
    // Estado
    metrics,
    insights,
    isTracking,
    realtimeEvents,
    
    // Configurações
    config,
    
    // Ações de tracking
    trackEvent,
    trackClick,
    trackView,
    trackEdit,
    trackSearch,
    
    // Análises
    analyzeConversionFunnel,
    generateCohortAnalysis,
    getMetricTrend,
    generatePredictions,
    refreshMetrics,
    
    // Controles
    startTracking: () => { setIsTracking(true); },
    stopTracking: () => { setIsTracking(false); },
    resetAnalytics: () => {
      engineRef.current.reset();
      setMetrics({
        activeUsers: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        bounceRate: 0,
        conversionRate: 0,
        retentionRate: 0,
        engagementScore: 0,
        performanceScore: 0
      });
      setInsights([]);
      setRealtimeEvents(0);
    },
    
    // Status calculados
    hasInsights: insights.length > 0,
    criticalInsights: insights.filter(i => i.impact === 'critical'),
    engagementLevel: metrics.engagementScore > 70 ? 'high' : 
                    metrics.engagementScore > 40 ? 'medium' : 'low',
    isHealthy: metrics.performanceScore > 80
  };
} 