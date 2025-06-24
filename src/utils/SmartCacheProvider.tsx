import React, { createContext, useContext, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, RefreshCw, HardDrive, TrendingUp } from 'lucide-react';
import type { CacheConfig, CacheStats } from './SmartCacheCore';
import { SmartCacheSystem } from './SmartCacheCore';

// Context
interface CacheContextType {
  cacheSystem: SmartCacheSystem;
}

export const CacheContext = createContext<CacheContextType | undefined>(undefined);

// Provider
interface CacheProviderProps {
  children: React.ReactNode;
  config?: Partial<CacheConfig>;
}

const defaultConfig: CacheConfig = {
  maxSize: 50, // 50MB
  maxEntries: 1000,
  defaultTTL: 300000, // 5 minutos
  cleanupInterval: 300000, // 5 minutos
  compressionEnabled: true,
  persistToDisk: true,
  adaptiveEviction: true
};

export const CacheProvider: React.FC<CacheProviderProps> = ({ children, config }) => {
  const [cacheSystem] = useState(() => 
    new SmartCacheSystem({ ...defaultConfig, ...config })
  );

  useEffect(() => {
    return () => {
      cacheSystem.destroy();
    };
  }, [cacheSystem]);

  return (
    <CacheContext.Provider value={{ cacheSystem }}>
      {children}
    </CacheContext.Provider>
  );
};

// Monitor Component
export const CacheMonitor: React.FC = () => {
  const context = useContext(CacheContext);
  const [stats, setStats] = useState<CacheStats | null>(null);

  if (!context) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Cache não inicializado</p>
        </CardContent>
      </Card>
    );
  }

  const { cacheSystem } = context;

  const updateStats = () => {
    setStats(cacheSystem.getStats());
  };

  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [cacheSystem]);

  const handleClear = async () => {
    await cacheSystem.clear();
    updateStats();
  };

  const memoryUsage = cacheSystem.getMemoryUsage();
  const hotKeys = cacheSystem.getHotKeys(5);
  const coldKeys = cacheSystem.getColdKeys(5);

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando estatísticas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com stats principais */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Smart Cache Monitor
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={updateStats}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Métricas principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.totalEntries}</div>
              <div className="text-sm text-muted-foreground">Entradas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(stats.totalSize / 1024)}KB
              </div>
              <div className="text-sm text-muted-foreground">Tamanho</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(stats.hitRate * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.evictionCount}</div>
              <div className="text-sm text-muted-foreground">Evictions</div>
            </div>
          </div>

          {/* Uso de memória */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uso de Memória</span>
              <span>{Math.round(memoryUsage.percentage)}%</span>
            </div>
            <Progress value={memoryUsage.percentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Hot e Cold Keys */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hot Keys */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-red-500" />
              Chaves Mais Acessadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {hotKeys.length > 0 ? hotKeys.map((item, index) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">
                    {index + 1}. {item.key}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {item.accessCount}x
                  </Badge>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm">Nenhuma chave encontrada</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cold Keys */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-blue-500" />
              Chaves Menos Acessadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coldKeys.length > 0 ? coldKeys.map((item, index) => (
                <div key={item.key} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">
                    {index + 1}. {item.key}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.accessCount}x
                  </Badge>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm">Nenhuma chave encontrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 