import type { ComponentType, LazyExoticComponent } from 'react';
import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Tipos para otimização
interface LazyComponentOptions {
  fallback?: React.ComponentType;
  retryDelay?: number;
  maxRetries?: number;
  preload?: boolean;
  chunkName?: string;
}

interface PerformanceMetrics {
  bundleSize: number;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
}

interface OptimizationSuggestion {
  type: 'code-splitting' | 'lazy-loading' | 'caching' | 'bundling';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  implementation: () => Promise<void>;
}

// Cache para componentes lazy
const componentCache = new Map<string, LazyExoticComponent<ComponentType>>();
const preloadCache = new Set<string>();

/**
 * Cria um componente lazy com retry automático e cache
 */
export function createLazyComponent<T extends ComponentType>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): LazyExoticComponent<T> {
  const {
    retryDelay = 1000,
    maxRetries = 3,
    preload = false,
    chunkName
  } = options;

  const cacheKey = chunkName ?? importFn.toString();

  // Verificar cache
  if (componentCache.has(cacheKey)) {
    const cached = componentCache.get(cacheKey);
    if (cached) return cached;
  }

  // Função de import com retry
  const importWithRetry = async (retryCount = 0): Promise<{ default: T }> => {
    try {
      return await importFn();
    } catch (error) {
      if (retryCount < maxRetries) {
        console.warn(`Failed to load component, retrying... (${(retryCount + 1).toString()}/${maxRetries.toString()})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount)));
        return importWithRetry(retryCount + 1);
      }
      throw error;
    }
  };

  const LazyComponent = lazy(importWithRetry);

  // Cache do componente
  componentCache.set(cacheKey, LazyComponent);

  // Preload se solicitado
  if (preload && !preloadCache.has(cacheKey)) {
    preloadCache.add(cacheKey);
    importWithRetry().catch(console.error);
  }

  return LazyComponent;
}

/**
 * HOC para lazy loading com fallback customizado
 */
export function withLazyLoading<P extends object>(
  Component: LazyExoticComponent<ComponentType<P>>,
  fallback?: React.ComponentType
) {
  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback ? React.createElement(fallback) : <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

/**
 * Hook para preload de componentes
 */
export function usePreloadComponent(
  importFn: () => Promise<unknown>,
  condition = true
) {
  React.useEffect(() => {
    if (condition) {
      const preloadTimer = setTimeout(() => {
        importFn().catch(console.error);
      }, 100); // Pequeno delay para não bloquear renderização inicial

      return () => { clearTimeout(preloadTimer); };
    }
  }, [importFn, condition]);
}

/**
 * Componente para lazy loading baseado em viewport
 */
interface IntersectionLazyProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export function IntersectionLazy({
  children,
  fallback = LoadingSpinner,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true
}: IntersectionLazyProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [hasTriggered, setHasTriggered] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && (!triggerOnce || !hasTriggered)) {
          setIsVisible(true);
          if (triggerOnce) {
            setHasTriggered(true);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => { observer.disconnect(); };
  }, [rootMargin, threshold, triggerOnce, hasTriggered]);

  return (
    <div ref={ref}>
      {isVisible ? children : React.createElement(fallback)}
    </div>
  );
}

/**
 * Sistema de análise de performance
 */
export class PerformanceAnalyzer {
  private static metrics: PerformanceMetrics = {
    bundleSize: 0,
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  };

  static async analyzeBundle(): Promise<PerformanceMetrics> {
    const startTime = performance.now();

    // Analisar tamanho do bundle
    const bundleSize = await this.getBundleSize();
    
    // Medir tempo de carregamento
    const loadTime = performance.now() - startTime;
    
    // Medir uso de memória
    const memoryUsage = this.getMemoryUsage();
    
    // Calcular cache hit rate
    const cacheHitRate = this.getCacheHitRate();

    this.metrics = {
      bundleSize,
      loadTime,
      renderTime: this.getRenderTime(),
      memoryUsage,
      cacheHitRate
    };

    return this.metrics;
  }

  private static async getBundleSize(): Promise<number> {
    try {
      // Estimar tamanho baseado em chunks carregados
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      let totalSize = 0;

      for (const script of scripts) {
        try {
          const response = await fetch(script.src, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          if (contentLength) {
            totalSize += parseInt(contentLength, 10);
          }
        } catch (error) {
          // Ignorar erros de CORS
        }
      }

      return totalSize;
    } catch (error) {
      console.warn('Could not analyze bundle size:', error);
      return 0;
    }
  }

  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      return (memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit) * 100;
    }
    return 0;
  }

  private static getRenderTime(): number {
    try {
      if (typeof performance !== 'undefined' && typeof performance.getEntriesByType === 'function') {
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : 0;
      }
    } catch (error) {
      // Fallback para ambientes de teste ou navegadores sem suporte
    }
    return 0;
  }

  private static getCacheHitRate(): number {
    const cacheHits = componentCache.size;
    const totalRequests = cacheHits + preloadCache.size;
    return totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
  }

  static generateOptimizationSuggestions(): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Sugestões baseadas em métricas
    if (this.metrics.bundleSize > 1024 * 1024) { // > 1MB
      suggestions.push({
        type: 'code-splitting',
        priority: 'high',
        description: 'Bundle muito grande detectado',
        impact: 'Reduzir tempo de carregamento inicial em até 50%',
        implementation: () => {
          console.log('Implementando code splitting...');
          // Lógica de implementação
          return Promise.resolve();
        }
      });
    }

    if (this.metrics.loadTime > 3000) { // > 3s
      suggestions.push({
        type: 'lazy-loading',
        priority: 'critical',
        description: 'Tempo de carregamento muito alto',
        impact: 'Melhorar tempo de carregamento em até 60%',
        implementation: () => {
          console.log('Implementando lazy loading...');
          // Lógica de implementação
          return Promise.resolve();
        }
      });
    }

    if (this.metrics.memoryUsage > 80) { // > 80%
      suggestions.push({
        type: 'caching',
        priority: 'medium',
        description: 'Alto uso de memória detectado',
        impact: 'Reduzir uso de memória em até 30%',
        implementation: () => {
          console.log('Otimizando cache...');
          // Lógica de implementação
          return Promise.resolve();
        }
      });
    }

    if (this.metrics.cacheHitRate < 50) { // < 50%
      suggestions.push({
        type: 'caching',
        priority: 'medium',
        description: 'Taxa de cache baixa',
        impact: 'Melhorar performance de navegação em até 40%',
        implementation: () => {
          console.log('Melhorando estratégia de cache...');
          // Lógica de implementação
          return Promise.resolve();
        }
      });
    }

    return suggestions;
  }
}

/**
 * Hook para monitoramento de performance em tempo real
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [suggestions, setSuggestions] = React.useState<OptimizationSuggestion[]>([]);

  React.useEffect(() => {
    const analyzePerformance = async () => {
      const currentMetrics = await PerformanceAnalyzer.analyzeBundle();
      setMetrics(currentMetrics);
      
      const optimizationSuggestions = PerformanceAnalyzer.generateOptimizationSuggestions();
      setSuggestions(optimizationSuggestions);
    };

    // Análise inicial
    analyzePerformance();

    // Análise periódica
    const interval = setInterval(analyzePerformance, 30000); // A cada 30s

    return () => { clearInterval(interval); };
  }, []);

  const applyOptimization = async (suggestion: OptimizationSuggestion) => {
    try {
      await suggestion.implementation();
      
      // Re-analisar após aplicar otimização
      const newMetrics = await PerformanceAnalyzer.analyzeBundle();
      setMetrics(newMetrics);
      
      const newSuggestions = PerformanceAnalyzer.generateOptimizationSuggestions();
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Failed to apply optimization:', error);
    }
  };

  return {
    metrics,
    suggestions,
    applyOptimization
  };
}

/**
 * Componentes lazy pré-configurados para uso comum
 */
export const LazyComponents = {
  // Componentes pesados
  GraphView: createLazyComponent(
    () => import('@/components/GraphViewRevolutionary'),
    { chunkName: 'graph-view', preload: false }
  ),
  
  AdvancedEditor: createLazyComponent(
    () => import('@/components/AdvancedEditor'),
    { chunkName: 'advanced-editor', preload: false }
  ),
  
  Analytics: createLazyComponent(
    () => import('@/components/analytics/AdvancedAnalytics'),
    { chunkName: 'analytics', preload: false }
  ),
  
  AIComponents: createLazyComponent(
    () => import('@/components/ai/SmartContentSuggestions'),
    { chunkName: 'ai-components', preload: false }
  ),
  
  Collaboration: createLazyComponent(
    () => import('@/components/collaboration/CollaborationIntegration'),
    { chunkName: 'collaboration', preload: false }
  )
};

/**
 * Utilitário para preload inteligente baseado em rota
 */
export function preloadRouteComponents(route: string) {
  const preloadMap: Record<string, () => Promise<any>> = {
    '/dashboard': () => import('@/components/DashboardEnhanced'),
    '/editor': () => import('@/components/AdvancedEditor'),
    '/graph': () => import('@/components/GraphViewRevolutionary'),
    '/analytics': () => import('@/components/analytics/AdvancedAnalytics'),
    '/collaboration': () => import('@/components/collaboration/CollaborationIntegration')
  };

  const preloadFn = preloadMap[route];
  if (preloadFn) {
    preloadFn().catch(console.error);
  }
}

/**
 * Componente de monitoramento de performance visual
 */
interface PerformanceIndicatorProps {
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerformanceIndicator({ 
  showDetails = false, 
  position = 'bottom-right' 
}: PerformanceIndicatorProps) {
  const { metrics, suggestions } = usePerformanceMonitoring();

  if (!metrics) return null;

  const getPerformanceColor = () => {
    const score = 100 - (metrics.loadTime / 50 + metrics.memoryUsage / 2);
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 bg-background/80 backdrop-blur-sm rounded-lg p-2 text-xs`}>
      <div className={`font-mono ${getPerformanceColor()}`}>
        ⚡ {Math.round(metrics.loadTime)}ms
      </div>
      
      {showDetails && (
        <div className="mt-1 space-y-1 text-muted-foreground">
          <div>Bundle: {Math.round(metrics.bundleSize / 1024)}KB</div>
          <div>Memory: {Math.round(metrics.memoryUsage)}%</div>
          <div>Cache: {Math.round(metrics.cacheHitRate)}%</div>
          {suggestions.length > 0 && (
            <div className="text-orange-500">
              {suggestions.length} otimizações disponíveis
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Sistema avançado de preload baseado em comportamento do usuário
 */
export class IntelligentPreloader {
  private static userBehavior: Map<string, number> = new Map();
  private static routePatterns: Map<string, string[]> = new Map();
  private static hoverPreloads: Set<string> = new Set();
  private static preloadQueue: Array<{ component: string; priority: number; timestamp: number }> = [];
  
  static trackUserNavigation(route: string) {
    const count = this.userBehavior.get(route) || 0;
    this.userBehavior.set(route, count + 1);
    
    // Atualizar padrões de navegação
    this.updateRoutePatterns(route);
  }
  
  private static updateRoutePatterns(currentRoute: string) {
    const lastRoutes = Array.from(this.userBehavior.keys()).slice(-5);
    this.routePatterns.set(currentRoute, lastRoutes);
  }
  
  static predictNextRoutes(currentRoute: string): string[] {
    const patterns = this.routePatterns.get(currentRoute) || [];
    const predictions: Array<{ route: string; score: number }> = [];
    
    // Analisar padrões históricos
    for (const [route, count] of this.userBehavior.entries()) {
      if (route !== currentRoute) {
        const score = count * (patterns.includes(route) ? 2 : 1);
        predictions.push({ route, score });
      }
    }
    
    // Retornar top 3 predições
    return predictions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(p => p.route);
  }
  
  static preloadOnHover(componentName: string, importFn: () => Promise<any>) {
    if (this.hoverPreloads.has(componentName)) return;
    
    this.hoverPreloads.add(componentName);
    
    // Preload com baixa prioridade após 150ms de hover
    setTimeout(() => {
      if (this.hoverPreloads.has(componentName)) {
        importFn().catch(console.error);
      }
    }, 150);
  }
  
  static cancelHoverPreload(componentName: string) {
    this.hoverPreloads.delete(componentName);
  }
  
  /**
   * Preload baseado em idle time do browser
   */
  static preloadOnIdle(components: Array<{ name: string; import: () => Promise<any>; priority: number }>) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback((deadline) => {
        for (const component of components.sort((a, b) => b.priority - a.priority)) {
          if (deadline.timeRemaining() > 0) {
            component.import().catch(console.error);
          } else {
            break;
          }
        }
      });
    }
  }
}

/**
 * Service Worker para cache avançado e preload
 */
export class AdvancedCacheManager {
  private static swRegistration: ServiceWorkerRegistration | null = null;
  
  static async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', this.swRegistration);
        
        // Comunicar estratégias de cache
        this.sendCacheStrategy();
      } catch (error) {
        console.warn('SW registration failed:', error);
      }
    }
  }
  
  private static sendCacheStrategy() {
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({
        type: 'CACHE_STRATEGY',
        strategy: {
          images: 'cache-first',
          apis: 'network-first',
          chunks: 'stale-while-revalidate',
          fonts: 'cache-first'
        }
      });
    }
  }
  
  static preloadCriticalResources() {
    const criticalResources = [
      '/api/user/profile',
      '/api/templates/recent',
      '/fonts/inter-var.woff2'
    ];
    
    if (this.swRegistration?.active) {
      this.swRegistration.active.postMessage({
        type: 'PRELOAD_RESOURCES',
        resources: criticalResources
      });
    }
  }
}

/**
 * Sistema de Bundle Analysis em tempo real
 */
export class BundleAnalyzer {
  private static chunks: Map<string, { size: number; loadTime: number; dependencies: string[] }> = new Map();
  
  static trackChunkLoad(chunkName: string, size: number, loadTime: number, dependencies: string[] = []) {
    this.chunks.set(chunkName, { size, loadTime, dependencies });
    this.analyzePerformance();
  }
  
  private static analyzePerformance() {
    const totalSize = Array.from(this.chunks.values()).reduce((sum, chunk) => sum + chunk.size, 0);
    const avgLoadTime = Array.from(this.chunks.values()).reduce((sum, chunk) => sum + chunk.loadTime, 0) / this.chunks.size;
    
    // Detectar chunks problemáticos
    const slowChunks = Array.from(this.chunks.entries())
      .filter(([, chunk]) => chunk.loadTime > 2000)
      .map(([name]) => name);
    
    const largeChunks = Array.from(this.chunks.entries())
      .filter(([, chunk]) => chunk.size > 500 * 1024) // > 500KB
      .map(([name]) => name);
    
    if (slowChunks.length > 0 || largeChunks.length > 0) {
      console.warn('Performance issues detected:', {
        slowChunks,
        largeChunks,
        totalSize: `${(totalSize / 1024 / 1024).toFixed(2)}MB`,
        avgLoadTime: `${avgLoadTime.toFixed(0)}ms`
      });
      
      this.suggestOptimizations(slowChunks, largeChunks);
    }
  }
  
  private static suggestOptimizations(slowChunks: string[], largeChunks: string[]) {
    const suggestions: string[] = [];
    
    if (largeChunks.length > 0) {
      suggestions.push(`Consider splitting large chunks: ${largeChunks.join(', ')}`);
    }
    
    if (slowChunks.length > 0) {
      suggestions.push(`Optimize slow-loading chunks: ${slowChunks.join(', ')}`);
    }
    
    // Enviar para analytics (em produção)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bundle-optimization-suggestions', {
        detail: { suggestions, slowChunks, largeChunks }
      }));
    }
  }
  
  static getPerformanceReport() {
    const chunks = Array.from(this.chunks.entries()).map(([name, data]) => ({
      name,
      ...data,
      efficiency: data.size / Math.max(data.loadTime, 1) // bytes per ms
    }));
    
    return {
      totalChunks: chunks.length,
      totalSize: chunks.reduce((sum, chunk) => sum + chunk.size, 0),
      avgLoadTime: chunks.reduce((sum, chunk) => sum + chunk.loadTime, 0) / chunks.length,
      mostEfficient: chunks.sort((a, b) => b.efficiency - a.efficiency).slice(0, 3),
      leastEfficient: chunks.sort((a, b) => a.efficiency - b.efficiency).slice(0, 3)
    };
  }
}

export default {
  createLazyComponent,
  withLazyLoading,
  usePreloadComponent,
  IntersectionLazy,
  PerformanceAnalyzer,
  usePerformanceMonitoring,
  LazyComponents,
  preloadRouteComponents,
  PerformanceIndicator,
  IntelligentPreloader,
  AdvancedCacheManager,
  BundleAnalyzer
};

// Exportar como objeto nomeado
export const PerformanceOptimizer = {
  createLazyComponent,
  withLazyLoading,
  usePreloadComponent,
  IntersectionLazy,
  PerformanceAnalyzer,
  usePerformanceMonitoring,
  LazyComponents,
  preloadRouteComponents,
  PerformanceIndicator,
  IntelligentPreloader,
  AdvancedCacheManager,
  BundleAnalyzer
}; 