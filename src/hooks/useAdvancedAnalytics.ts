import { useState, useEffect, useCallback, useRef } from 'react';
import AdvancedAnalyticsEngine from '@/services/AdvancedAnalyticsEngine';
import type {
  AdvancedAnalytics,
  UserJourneyStep,
  FeatureUsageMetrics,
  PerformanceInsight,
  ConversionFunnel,
  RetentionMetric
} from '@/types/common';

interface UseAdvancedAnalyticsReturn {
  // Analytics principais
  analytics: AdvancedAnalytics;
  
  // Insights e recomendações
  insights: PerformanceInsight[];
  recommendations: string[];
  
  // Métricas de jornada
  userJourney: UserJourneyStep[];
  journeyInsights: {
    patterns: any;
    insights: string[];
    optimizations: string[];
  };
  
  // Funnels
  funnels: ConversionFunnel[];
  activeFunnel: ConversionFunnel | null;
  
  // Retenção
  retentionMetrics: RetentionMetric[];
  
  // Predições
  predictions: {
    nextActions: { action: string; probability: number }[];
    churnRisk: number;
    ltv: number;
    recommendedFeatures: string[];
  };
  
  // Estado
  isTracking: boolean;
  isAnalyzing: boolean;
  lastEventTime: number;
  
  // Métricas em tempo real
  realTimeMetrics: {
    activeUsers: number;
    eventsPerMinute: number;
    conversionRate: number;
    engagementScore: number;
  };
  
  // Ações de tracking
  track: (action: string, metadata?: Record<string, any>) => void;
  trackPage: (page: string, metadata?: Record<string, any>) => void;
  trackFeature: (featureId: string, metadata?: Record<string, any>) => void;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  
  // Gestão de funnels
  createFunnel: (config: FunnelConfig) => void;
  setActiveFunnel: (funnelId: string) => void;
  
  // Análises
  generateInsights: () => Promise<PerformanceInsight[]>;
  analyzeJourney: () => Promise<void>;
  generateReport: (timeframe?: 'day' | 'week' | 'month') => Promise<AnalyticsReport>;
  
  // Configuração
  configure: (config: AnalyticsConfig) => void;
  startTracking: () => void;
  stopTracking: () => void;
  reset: () => void;
}

interface FunnelConfig {
  id: string;
  name: string;
  steps: string[];
  timeWindow?: number;
}

interface AnalyticsConfig {
  enableAutoTracking?: boolean;
  trackPageViews?: boolean;
  trackUserInteractions?: boolean;
  enablePredictions?: boolean;
  flushInterval?: number;
}

interface AnalyticsReport {
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    avgSessionDuration: number;
    conversionRate: number;
  };
  insights: PerformanceInsight[];
  recommendations: string[];
  trends: {
    userGrowth: number;
    engagementTrend: number;
    retentionTrend: number;
  };
}

export function useAdvancedAnalytics(
  userId: string,
  initialConfig: AnalyticsConfig = {}
): UseAdvancedAnalyticsReturn {
  // Estado principal
  const [analytics, setAnalytics] = useState<AdvancedAnalytics>({
    userJourney: [],
    featureUsage: {},
    performanceInsights: [],
    conversionFunnels: [],
    retentionMetrics: []
  });
  
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [userJourney, setUserJourney] = useState<UserJourneyStep[]>([]);
  const [journeyInsights, setJourneyInsights] = useState({
    patterns: {},
    insights: [],
    optimizations: []
  });
  const [funnels, setFunnels] = useState<ConversionFunnel[]>([]);
  const [activeFunnel, setActiveFunnelState] = useState<ConversionFunnel | null>(null);
  const [retentionMetrics, setRetentionMetrics] = useState<RetentionMetric[]>([]);
  const [predictions, setPredictions] = useState({
    nextActions: [],
    churnRisk: 0,
    ltv: 0,
    recommendedFeatures: []
  });
  
  // Estado de controle
  const [isTracking, setIsTracking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(0);
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeUsers: 1,
    eventsPerMinute: 0,
    conversionRate: 0,
    engagementScore: 75
  });
  
  // Refs
  const engineRef = useRef<AdvancedAnalyticsEngine | null>(null);
  const configRef = useRef<AnalyticsConfig>({
    enableAutoTracking: true,
    trackPageViews: true,
    trackUserInteractions: true,
    enablePredictions: true,
    flushInterval: 30000,
    ...initialConfig
  });
  const eventCountRef = useRef(0);
  const sessionStartRef = useRef(Date.now());
  const currentPageRef = useRef(window.location.pathname);
  
  // Inicializar engine
  useEffect(() => {
    engineRef.current = AdvancedAnalyticsEngine.getInstance();
    
    // Iniciar tracking automático se habilitado
    if (configRef.current.enableAutoTracking) {
      startTracking();
    }
    
    return () => {
      stopTracking();
    };
  }, []);
  
  // Tracking automático de interações
  useEffect(() => {
    if (!isTracking || !configRef.current.trackUserInteractions) return;
    
    const handleInteraction = (event: Event) => {
      track(event.type, {
        target: (event.target as Element)?.tagName,
        timestamp: Date.now()
      });
    };
    
    const handlePageView = () => {
      const newPage = window.location.pathname;
      if (newPage !== currentPageRef.current) {
        trackPage(newPage);
        currentPageRef.current = newPage;
      }
    };
    
    // Event listeners
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    window.addEventListener('popstate', handlePageView);
    
    // Observer para mudanças de rota (SPA)
    const observer = new MutationObserver(() => {
      handlePageView();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('popstate', handlePageView);
      observer.disconnect();
    };
  }, [isTracking]);
  
  // Tracking de ação
  const track = useCallback((action: string, metadata: Record<string, any> = {}) => {
    if (!engineRef.current || !isTracking) return;
    
    const eventData = {
      action,
      page: window.location.pathname,
      metadata: {
        ...metadata,
        sessionId: `session_${sessionStartRef.current}`,
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      timestamp: Date.now()
    };
    
    engineRef.current.trackEvent(userId, eventData);
    
    // Atualizar contadores
    eventCountRef.current++;
    setLastEventTime(Date.now());
    
    // Atualizar métricas em tempo real
    updateRealTimeMetrics();
  }, [userId, isTracking]);
  
  // Tracking de página
  const trackPage = useCallback((page: string, metadata: Record<string, any> = {}) => {
    track('page_view', { page, ...metadata });
  }, [track]);
  
  // Tracking de feature
  const trackFeature = useCallback((featureId: string, metadata: Record<string, any> = {}) => {
    if (!engineRef.current) return;
    
    engineRef.current.trackFeatureUsage(userId, featureId, metadata);
    track('feature_usage', { featureId, ...metadata });
  }, [userId, track]);
  
  // Tracking de evento genérico
  const trackEvent = useCallback((eventName: string, properties: Record<string, any> = {}) => {
    track(eventName, properties);
  }, [track]);
  
  // Criar funil
  const createFunnel = useCallback((config: FunnelConfig) => {
    if (!engineRef.current) return;
    
    engineRef.current.defineFunnel(config);
    
    // Atualizar estado local
    setFunnels(prev => [
      ...prev.filter(f => f.id !== config.id),
      {
        id: config.id,
        name: config.name,
        steps: config.steps.map(step => ({
          name: step,
          users: 0,
          conversionRate: 0,
          avgTimeSpent: 0
        })),
        conversionRate: 0,
        dropOffPoints: [],
        optimizations: []
      }
    ]);
  }, []);
  
  // Definir funil ativo
  const setActiveFunnel = useCallback((funnelId: string) => {
    const funnel = funnels.find(f => f.id === funnelId) || null;
    setActiveFunnelState(funnel);
  }, [funnels]);
  
  // Gerar insights
  const generateInsights = useCallback(async (): Promise<PerformanceInsight[]> => {
    if (!engineRef.current) return [];
    
    setIsAnalyzing(true);
    
    try {
      const newInsights = engineRef.current.generateInsights();
      setInsights(newInsights);
      
      // Gerar recomendações baseadas nos insights
      const newRecommendations = newInsights
        .filter(insight => insight.automatable)
        .map(insight => insight.recommendation);
      
      setRecommendations(newRecommendations);
      
      return newInsights;
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  }, []);
  
  // Analisar jornada
  const analyzeJourney = useCallback(async () => {
    if (!engineRef.current) return;
    
    setIsAnalyzing(true);
    
    try {
      const analysis = engineRef.current.analyzeUserJourney(userId);
      
      setUserJourney(analysis.journey);
      setJourneyInsights({
        patterns: analysis.patterns,
        insights: analysis.insights,
        optimizations: analysis.optimizations
      });
      
      // Gerar predições se habilitado
      if (configRef.current.enablePredictions) {
        const behaviorPredictions = engineRef.current.predictUserBehavior(userId);
        setPredictions(behaviorPredictions);
      }
    } catch (error) {
      console.error('Erro ao analisar jornada:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [userId]);
  
  // Gerar relatório
  const generateReport = useCallback(async (timeframe: 'day' | 'week' | 'month' = 'week'): Promise<AnalyticsReport> => {
    if (!engineRef.current) {
      return {
        summary: {
          totalEvents: 0,
          uniqueUsers: 0,
          avgSessionDuration: 0,
          conversionRate: 0
        },
        insights: [],
        recommendations: [],
        trends: {
          userGrowth: 0,
          engagementTrend: 0,
          retentionTrend: 0
        }
      };
    }
    
    setIsAnalyzing(true);
    
    try {
      const report = engineRef.current.generateReport(timeframe);
      
      // Simular dados para demo
      const simulatedReport: AnalyticsReport = {
        summary: {
          totalEvents: eventCountRef.current,
          uniqueUsers: 1,
          avgSessionDuration: Date.now() - sessionStartRef.current,
          conversionRate: activeFunnel?.conversionRate || 0
        },
        insights: await generateInsights(),
        recommendations: recommendations,
        trends: {
          userGrowth: Math.random() * 20 - 10, // -10% a +10%
          engagementTrend: Math.random() * 30 - 15, // -15% a +15%
          retentionTrend: Math.random() * 25 - 12.5 // -12.5% a +12.5%
        }
      };
      
      return simulatedReport;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  }, [generateInsights, recommendations, activeFunnel]);
  
  // Configurar analytics
  const configure = useCallback((config: AnalyticsConfig) => {
    configRef.current = { ...configRef.current, ...config };
  }, []);
  
  // Iniciar tracking
  const startTracking = useCallback(() => {
    setIsTracking(true);
    sessionStartRef.current = Date.now();
    
    // Track página inicial
    if (configRef.current.trackPageViews) {
      trackPage(window.location.pathname, { session_start: true });
    }
  }, [trackPage]);
  
  // Parar tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, []);
  
  // Reset
  const reset = useCallback(() => {
    setAnalytics({
      userJourney: [],
      featureUsage: {},
      performanceInsights: [],
      conversionFunnels: [],
      retentionMetrics: []
    });
    setInsights([]);
    setRecommendations([]);
    setUserJourney([]);
    setJourneyInsights({ patterns: {}, insights: [], optimizations: [] });
    setFunnels([]);
    setActiveFunnelState(null);
    setRetentionMetrics([]);
    setPredictions({ nextActions: [], churnRisk: 0, ltv: 0, recommendedFeatures: [] });
    eventCountRef.current = 0;
    sessionStartRef.current = Date.now();
  }, []);
  
  // Atualizar métricas em tempo real
  const updateRealTimeMetrics = useCallback(() => {
    const now = Date.now();
    const sessionDuration = now - sessionStartRef.current;
    const eventsPerMinute = sessionDuration > 0 ? 
      (eventCountRef.current / (sessionDuration / 60000)) : 0;
    
    setRealTimeMetrics(prev => ({
      ...prev,
      eventsPerMinute: Math.round(eventsPerMinute * 10) / 10,
      engagementScore: Math.min(100, Math.max(0, prev.engagementScore + (Math.random() - 0.5) * 2))
    }));
  }, []);
  
  // Análise periódica
  useEffect(() => {
    if (!isTracking) return;
    
    const interval = setInterval(() => {
      // Gerar insights automaticamente
      generateInsights();
      
      // Analisar jornada
      analyzeJourney();
      
      // Atualizar métricas de retenção
      if (engineRef.current) {
        const cohorts = engineRef.current.analyzeCohorts();
        setRetentionMetrics(cohorts);
      }
    }, configRef.current.flushInterval);
    
    return () => clearInterval(interval);
  }, [isTracking, generateInsights, analyzeJourney]);
  
  // Tracking inicial na montagem
  useEffect(() => {
    if (configRef.current.enableAutoTracking) {
      track('app_start', { timestamp: Date.now() });
    }
  }, [track]);
  
  return {
    // Analytics principais
    analytics,
    
    // Insights
    insights,
    recommendations,
    
    // Jornada
    userJourney,
    journeyInsights,
    
    // Funnels
    funnels,
    activeFunnel,
    
    // Retenção
    retentionMetrics,
    
    // Predições
    predictions,
    
    // Estado
    isTracking,
    isAnalyzing,
    lastEventTime,
    
    // Métricas em tempo real
    realTimeMetrics,
    
    // Tracking
    track,
    trackPage,
    trackFeature,
    trackEvent,
    
    // Funnels
    createFunnel,
    setActiveFunnel,
    
    // Análises
    generateInsights,
    analyzeJourney,
    generateReport,
    
    // Controle
    configure,
    startTracking,
    stopTracking,
    reset
  };
} 