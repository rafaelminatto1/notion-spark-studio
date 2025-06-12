import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useRef, 
  useMemo, 
  Suspense,
  lazy,
  ComponentType
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  Image as ImageIcon,
  FileText,
  Play,
  Download,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Zap,
  Clock,
  Database,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Pause,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tipos para lazy loading
interface LazyComponentConfig {
  id: string;
  name: string;
  loader: () => Promise<{ default: ComponentType<any> }>;
  preload?: boolean;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
  fallback?: ComponentType;
}

interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onError?: () => void;
  quality?: 'low' | 'medium' | 'high';
  lazy?: boolean;
}

interface LazyContentProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  placeholder?: React.ReactNode;
  minHeight?: number;
  delay?: number;
  className?: string;
}

interface ProgressiveLoadingProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  batchSize?: number;
  loadDelay?: number;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
}

// Hook para Intersection Observer
const useIntersectionObserver = (
  threshold: number = 0.1,
  rootMargin: string = '0px',
  triggerOnce: boolean = true
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        if (isVisible && triggerOnce) {
          setHasTriggered(true);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { elementRef, isIntersecting: isIntersecting || hasTriggered };
};

// Hook para preload de componentes
const useComponentPreloader = () => {
  const [loadedComponents, setLoadedComponents] = useState<Set<string>>(new Set());
  const [loadingComponents, setLoadingComponents] = useState<Set<string>>(new Set());
  const componentCache = useRef<Map<string, ComponentType<any>>>(new Map());

  const preloadComponent = useCallback(async (config: LazyComponentConfig) => {
    if (loadedComponents.has(config.id) || loadingComponents.has(config.id)) {
      return componentCache.current.get(config.id);
    }

    setLoadingComponents(prev => new Set([...prev, config.id]));

    try {
      const module = await config.loader();
      const Component = module.default;
      
      componentCache.current.set(config.id, Component);
      setLoadedComponents(prev => new Set([...prev, config.id]));
      setLoadingComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(config.id);
        return newSet;
      });

      return Component;
    } catch (error) {
      console.error(`Failed to preload component ${config.id}:`, error);
      setLoadingComponents(prev => {
        const newSet = new Set(prev);
        newSet.delete(config.id);
        return newSet;
      });
      return null;
    }
  }, [loadedComponents, loadingComponents]);

  const getComponent = useCallback((componentId: string) => {
    return componentCache.current.get(componentId);
  }, []);

  const isLoaded = useCallback((componentId: string) => {
    return loadedComponents.has(componentId);
  }, [loadedComponents]);

  const isLoading = useCallback((componentId: string) => {
    return loadingComponents.has(componentId);
  }, [loadingComponents]);

  return {
    preloadComponent,
    getComponent,
    isLoaded,
    isLoading,
    loadedComponents: Array.from(loadedComponents),
    loadingComponents: Array.from(loadingComponents)
  };
};

// Hook para otimização de imagens
const useImageOptimization = () => {
  const [networkType, setNetworkType] = useState<string>('unknown');
  const [bandwidth, setBandwidth] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    // Detectar tipo de conexão
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        setNetworkType(connection.effectiveType || 'unknown');
        
        // Estimar bandwidth baseado no tipo de conexão
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setBandwidth('low');
        } else if (effectiveType === '3g') {
          setBandwidth('medium');
        } else {
          setBandwidth('high');
        }

        const handleConnectionChange = () => {
          setNetworkType(connection.effectiveType || 'unknown');
        };

        connection.addEventListener('change', handleConnectionChange);
        return () => connection.removeEventListener('change', handleConnectionChange);
      }
    }
  }, []);

  const getOptimalImageQuality = useCallback((requestedQuality?: 'low' | 'medium' | 'high') => {
    if (requestedQuality) return requestedQuality;
    
    // Auto-adjust baseado na conexão
    switch (bandwidth) {
      case 'low': return 'low';
      case 'medium': return 'medium';
      case 'high': return 'high';
      default: return 'medium';
    }
  }, [bandwidth]);

  const generateImageUrl = useCallback((
    originalUrl: string, 
    width?: number, 
    height?: number, 
    quality?: 'low' | 'medium' | 'high'
  ) => {
    // Simular serviço de otimização de imagem
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    
    const qualityValue = quality === 'low' ? '40' : quality === 'high' ? '90' : '70';
    params.set('q', qualityValue);
    
    // Em produção, usaria um serviço como Cloudinary, ImageKit, etc.
    return `${originalUrl}?${params.toString()}`;
  }, []);

  return {
    networkType,
    bandwidth,
    getOptimalImageQuality,
    generateImageUrl
  };
};

// Componente de imagem lazy
export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  placeholder,
  className,
  width,
  height,
  onLoad,
  onError,
  quality,
  lazy = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver(0.1, '50px');
  const { getOptimalImageQuality, generateImageUrl } = useImageOptimization();

  const shouldLoad = !lazy || isIntersecting;
  const optimalQuality = getOptimalImageQuality(quality);
  const optimizedSrc = generateImageUrl(src, width, height, optimalQuality);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  useEffect(() => {
    if (shouldLoad && !isLoaded && !isError && !isLoading) {
      setIsLoading(true);
    }
  }, [shouldLoad, isLoaded, isError, isLoading]);

  return (
    <div
      ref={elementRef}
      className={cn("relative overflow-hidden bg-gray-100", className)}
      style={{ width, height }}
    >
      {/* Placeholder */}
      <AnimatePresence>
        {!isLoaded && !isError && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            ) : placeholder ? (
              <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-300" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {isError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">Erro ao carregar</p>
          </div>
        </div>
      )}

      {/* Actual image */}
      {shouldLoad && !isError && (
        <motion.img
          src={optimizedSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute top-2 right-2">
          <div className="p-1 bg-black/50 rounded">
            <Loader2 className="h-3 w-3 animate-spin text-white" />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de conteúdo lazy
export const LazyContent: React.FC<LazyContentProps> = ({
  children,
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
  placeholder,
  minHeight,
  delay = 0,
  className
}) => {
  const [shouldRender, setShouldRender] = useState(false);
  const { elementRef, isIntersecting } = useIntersectionObserver(
    threshold, 
    rootMargin, 
    triggerOnce
  );

  useEffect(() => {
    if (isIntersecting) {
      if (delay > 0) {
        const timer = setTimeout(() => setShouldRender(true), delay);
        return () => clearTimeout(timer);
      } else {
        setShouldRender(true);
      }
    }
  }, [isIntersecting, delay]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ minHeight }}
    >
      {shouldRender ? children : placeholder}
    </div>
  );
};

// Componente de loading progressivo
export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  items,
  renderItem,
  batchSize = 10,
  loadDelay = 100,
  onLoadMore,
  hasMore = true,
  loading = false,
  className
}) => {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const visibleItems = items.slice(0, visibleCount);
  const hasMoreItems = visibleCount < items.length || hasMore;

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreItems) return;

    setIsLoadingMore(true);

    // Simular delay de carregamento
    await new Promise(resolve => setTimeout(resolve, loadDelay));

    if (visibleCount >= items.length && onLoadMore) {
      onLoadMore();
    } else {
      setVisibleCount(prev => prev + batchSize);
    }

    setIsLoadingMore(false);
  }, [isLoadingMore, hasMoreItems, visibleCount, items.length, onLoadMore, loadDelay, batchSize]);

  // Auto-load when scroll reaches bottom
  const { elementRef: loadMoreElementRef, isIntersecting } = useIntersectionObserver(0.1, '100px');

  useEffect(() => {
    if (isIntersecting && hasMoreItems && !isLoadingMore) {
      loadMore();
    }
  }, [isIntersecting, hasMoreItems, isLoadingMore, loadMore]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Rendered items */}
      <AnimatePresence>
        {visibleItems.map((item, index) => (
          <motion.div
            key={item.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % batchSize) * 0.05 }}
          >
            {renderItem(item, index)}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Load more trigger */}
      {hasMoreItems && (
        <div
          ref={loadMoreElementRef}
          className="flex items-center justify-center py-8"
        >
          {isLoadingMore || loading ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Carregando mais itens...</span>
            </div>
          ) : (
            <button
              onClick={loadMore}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Carregar mais
            </button>
          )}
        </div>
      )}

      {/* End of list */}
      {!hasMoreItems && items.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <CheckCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Todos os itens foram carregados</p>
        </div>
      )}
    </div>
  );
};

// Componente de lazy wrapper para componentes React
interface LazyComponentWrapperProps {
  config: LazyComponentConfig;
  props?: any;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({
  config,
  props = {},
  fallback,
  onLoad,
  onError
}) => {
  const [Component, setComponent] = useState<ComponentType<any> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, isIntersecting } = useIntersectionObserver();

  useEffect(() => {
    if (isIntersecting && !Component && !isLoading && !error) {
      setIsLoading(true);
      
      config.loader()
        .then(module => {
          setComponent(() => module.default);
          setIsLoading(false);
          onLoad?.();
        })
        .catch(err => {
          setError(err);
          setIsLoading(false);
          onError?.(err);
        });
    }
  }, [isIntersecting, Component, isLoading, error, config, onLoad, onError]);

  const defaultFallback = (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div ref={elementRef}>
      {error ? (
        <div className="flex items-center justify-center py-8 text-red-500">
          <AlertCircle className="h-6 w-6 mr-2" />
          <span>Erro ao carregar componente</span>
        </div>
      ) : Component ? (
        <Component {...props} />
      ) : (
        fallback || defaultFallback
      )}
    </div>
  );
};

// Hook para gestão de preload inteligente
export const useIntelligentPreload = () => {
  const [preloadQueue, setPreloadQueue] = useState<LazyComponentConfig[]>([]);
  const [preloadStatus, setPreloadStatus] = useState<Map<string, 'pending' | 'loading' | 'loaded' | 'error'>>(new Map());
  const { preloadComponent } = useComponentPreloader();

  const addToPreloadQueue = useCallback((configs: LazyComponentConfig[]) => {
    // Ordenar por prioridade
    const sortedConfigs = [...configs].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setPreloadQueue(prev => [...prev, ...sortedConfigs]);
  }, []);

  const processPreloadQueue = useCallback(async () => {
    for (const config of preloadQueue) {
      if (preloadStatus.get(config.id) !== 'pending') continue;

      setPreloadStatus(prev => new Map(prev.set(config.id, 'loading')));

      try {
        await preloadComponent(config);
        setPreloadStatus(prev => new Map(prev.set(config.id, 'loaded')));
      } catch (error) {
        setPreloadStatus(prev => new Map(prev.set(config.id, 'error')));
      }

      // Pequeno delay entre preloads para não bloquear a thread
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setPreloadQueue([]);
  }, [preloadQueue, preloadStatus, preloadComponent]);

  useEffect(() => {
    if (preloadQueue.length > 0) {
      processPreloadQueue();
    }
  }, [preloadQueue, processPreloadQueue]);

  return {
    addToPreloadQueue,
    preloadStatus: Object.fromEntries(preloadStatus)
  };
};

// Dashboard de performance para debugging
interface PerformanceDashboardProps {
  visible?: boolean;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ visible = false }) => {
  const [stats, setStats] = useState({
    loadedComponents: 0,
    loadingComponents: 0,
    loadedImages: 0,
    loadingImages: 0,
    networkType: 'unknown',
    bandwidth: 'medium'
  });

  const { loadedComponents, loadingComponents } = useComponentPreloader();
  const { networkType, bandwidth } = useImageOptimization();

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      loadedComponents: loadedComponents.length,
      loadingComponents: loadingComponents.length,
      networkType,
      bandwidth
    }));
  }, [loadedComponents, loadingComponents, networkType, bandwidth]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-4 left-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[300px]"
    >
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-blue-500" />
        <h3 className="font-semibold">Performance Dashboard</h3>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Componentes carregados:</span>
          <span className="font-medium">{stats.loadedComponents}</span>
        </div>
        
        <div className="flex justify-between">
          <span>Componentes carregando:</span>
          <span className="font-medium">{stats.loadingComponents}</span>
        </div>

        <div className="flex justify-between">
          <span>Tipo de rede:</span>
          <span className="font-medium flex items-center gap-1">
            {navigator.onLine ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {stats.networkType}
          </span>
        </div>

        <div className="flex justify-between">
          <span>Qualidade de imagem:</span>
          <span className={cn(
            "font-medium",
            stats.bandwidth === 'high' ? "text-green-600" :
            stats.bandwidth === 'medium' ? "text-yellow-600" :
            "text-red-600"
          )}>
            {stats.bandwidth}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default LazyImage; 