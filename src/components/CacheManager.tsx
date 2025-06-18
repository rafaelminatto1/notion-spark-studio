import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Zap, TrendingUp, Clock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAdvancedCache, useFileCache } from '@/hooks/useAdvancedCache';
import { cn } from '@/lib/utils';

interface CacheManagerProps {
  className?: string;
  showDetails?: boolean;
}

export const CacheManager: React.FC<CacheManagerProps> = ({ 
  className,
  showDetails = false 
}) => {
  const [isVisible, setIsVisible] = useState(showDetails);
  const [selectedCache, setSelectedCache] = useState<'main' | 'files' | 'search'>('main');
  
  // Hooks de cache
  const mainCache = useAdvancedCache();
  const fileCache = useFileCache();
  
  // Estados para métricas
  const [cacheInfo, setCacheInfo] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Atualizar informações do cache
  const updateCacheInfo = () => {
    let currentCache;
    switch (selectedCache) {
      case 'files':
        currentCache = fileCache;
        break;
      case 'main':
      default:
        currentCache = mainCache;
        break;
    }
    
    setCacheInfo(currentCache.getCacheInfo());
  };

  useEffect(() => {
    updateCacheInfo();
    
    if (isVisible) {
      const interval = setInterval(updateCacheInfo, 1000);
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [selectedCache, isVisible, mainCache, fileCache]);

  useEffect(() => {
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [refreshInterval]);

  if (!isVisible) {
    return (
      <motion.div
        className={cn("fixed top-4 right-4 z-40", className)}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      >
        <Button
          onClick={() => { setIsVisible(true); }}
          variant="outline"
          size="sm"
          className="bg-notion-dark border-notion-dark-border text-gray-300 hover:text-white"
        >
          <Database className="h-4 w-4 mr-2" />
          Cache
          <Eye className="h-3 w-3 ml-2" />
        </Button>
      </motion.div>
    );
  }

  const hitRate = cacheInfo?.metrics 
    ? Math.round((cacheInfo.metrics.hits / (cacheInfo.metrics.hits + cacheInfo.metrics.misses)) * 100) || 0
    : 0;

  const utilizationRate = cacheInfo 
    ? Math.round((cacheInfo.totalEntries / cacheInfo.maxSize) * 100)
    : 0;

  return (
    <motion.div
      className={cn("fixed top-4 right-4 z-40 w-80", className)}
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: "spring", damping: 20 }}
    >
      <Card className="bg-notion-dark border-notion-dark-border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white flex items-center">
              <Database className="h-5 w-5 mr-2 text-notion-purple" />
              Cache Manager
            </CardTitle>
            <Button
              onClick={() => { setIsVisible(false); }}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white h-6 w-6 p-0"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>

          {/* Seletor de Cache */}
          <div className="flex gap-1 mt-3">
            {[
              { key: 'main', label: 'Principal', icon: Database },
              { key: 'files', label: 'Arquivos', icon: Zap }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                onClick={() => { setSelectedCache(key as any); }}
                variant={selectedCache === key ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "text-xs",
                  selectedCache === key 
                    ? "bg-notion-purple text-white" 
                    : "text-gray-400 hover:text-white"
                )}
              >
                <Icon className="h-3 w-3 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Métricas Principais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Hit Rate</span>
                <span className="text-white font-medium">{hitRate}%</span>
              </div>
              <Progress value={hitRate} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Utilização</span>
                <span className="text-white font-medium">{utilizationRate}%</span>
              </div>
              <Progress value={utilizationRate} className="h-2" />
            </div>
          </div>

          {/* Estatísticas Detalhadas */}
          {cacheInfo && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-green-400">
                    {cacheInfo.metrics.hits}
                  </div>
                  <div className="text-xs text-gray-400">Hits</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-red-400">
                    {cacheInfo.metrics.misses}
                  </div>
                  <div className="text-xs text-gray-400">Misses</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-yellow-400">
                    {cacheInfo.metrics.evictions}
                  </div>
                  <div className="text-xs text-gray-400">Evictions</div>
                </div>
              </div>

              {/* Tempo Médio de Acesso */}
              <div className="flex items-center justify-between p-2 bg-notion-dark-hover rounded-md">
                <div className="flex items-center text-sm text-gray-300">
                  <Clock className="h-4 w-4 mr-2" />
                  Tempo Médio
                </div>
                <Badge variant="outline" className="text-xs">
                  {cacheInfo.metrics.averageAccessTime.toFixed(2)}ms
                </Badge>
              </div>

              {/* Top Entradas do Cache */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-300 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Top Entradas ({cacheInfo.totalEntries}/{cacheInfo.maxSize})
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {cacheInfo.entries.slice(0, 5).map((entry: any, index: number) => (
                    <motion.div
                      key={entry.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-2 bg-notion-dark-hover rounded text-xs"
                    >
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="w-2 h-2 rounded-full bg-notion-purple flex-shrink-0" />
                        <span className="text-gray-300 truncate font-mono">
                          {entry.key.length > 20 ? `${entry.key.substring(0, 20)}...` : entry.key}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs px-1",
                            entry.priority === 'high' && "border-red-500 text-red-300",
                            entry.priority === 'medium' && "border-yellow-500 text-yellow-300",
                            entry.priority === 'low' && "border-green-500 text-green-300"
                          )}
                        >
                          {entry.accessCount}
                        </Badge>
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          entry.isValid ? "bg-green-500" : "bg-red-500"
                        )} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Ações de Limpeza */}
              <div className="flex gap-2 pt-2 border-t border-notion-dark-border">
                <Button
                  onClick={() => {
                    if (selectedCache === 'files') {
                      fileCache.cleanup();
                    } else {
                      mainCache.cleanup();
                    }
                    updateCacheInfo();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                >
                  Limpar Expirados
                </Button>
                <Button
                  onClick={() => {
                    if (selectedCache === 'files') {
                      fileCache.clear();
                    } else {
                      mainCache.clear();
                    }
                    updateCacheInfo();
                  }}
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
                >
                  Limpar Tudo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Hook para controlar o CacheManager globalmente
export const useCacheManager = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  return {
    isVisible,
    show: () => { setIsVisible(true); },
    hide: () => { setIsVisible(false); },
    toggle: () => { setIsVisible(prev => !prev); }
  };
};