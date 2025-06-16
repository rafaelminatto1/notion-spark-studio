import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Database, 
  Zap, 
  Monitor,
  Save,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { useSmartCache } from '@/utils/SmartCache';
import { useBackupSystem } from '@/utils/BackupSystem';
import { ApplicationHealthMonitor } from '@/utils/HealthMonitor';
import { useToast } from '@/hooks/use-toast';

const Settings: React.FC = () => {
  const { toast } = useToast();
  const cache = useSmartCache();
  const backupSystem = useBackupSystem();
  
  // Estados para configurações
  const [cacheConfig, setCacheConfig] = useState({
    maxSize: 100,
    maxEntries: 1000,
    defaultTTL: 30,
    compressionEnabled: true,
    persistToDisk: true,
    adaptiveEviction: true
  });

  const [backupConfig, setBackupConfig] = useState({
    autoBackupEnabled: true,
    autoBackupInterval: 60,
    maxBackups: 5,
    compressionEnabled: true,
    encryptionEnabled: false,
    backupOnCriticalActions: true
  });

  const [healthConfig, setHealthConfig] = useState({
    monitoringEnabled: true,
    monitoringInterval: 30,
    autoFixEnabled: true,
    alertsEnabled: true
  });

  const [performanceConfig, setPerformanceConfig] = useState({
    lazyLoadingEnabled: true,
    codeSplittingEnabled: true,
    compressionEnabled: true,
    preloadCritical: true
  });

  // Estatísticas dos sistemas
  const [cacheStats, setCacheStats] = useState(cache.getStats());
  const [backupStats, setBackupStats] = useState(backupSystem.getStats());

  useEffect(() => {
    // Carregar configurações salvas
    const loadConfigs = () => {
      const savedCacheConfig = localStorage.getItem('cache-config');
      if (savedCacheConfig) {
        setCacheConfig(JSON.parse(savedCacheConfig));
      }

      const savedBackupConfig = localStorage.getItem('backup-config');
      if (savedBackupConfig) {
        setBackupConfig(JSON.parse(savedBackupConfig));
      }

      const savedHealthConfig = localStorage.getItem('health-config');
      if (savedHealthConfig) {
        setHealthConfig(JSON.parse(savedHealthConfig));
      }

      const savedPerformanceConfig = localStorage.getItem('performance-config');
      if (savedPerformanceConfig) {
        setPerformanceConfig(JSON.parse(savedPerformanceConfig));
      }
    };

    loadConfigs();

    // Atualizar estatísticas periodicamente
    const interval = setInterval(() => {
      setCacheStats(cache.getStats());
      setBackupStats(backupSystem.getStats());
    }, 5000);

    return () => clearInterval(interval);
  }, [cache, backupSystem]);

  const handleSaveConfig = (configType: string, config: any) => {
    try {
      localStorage.setItem(`${configType}-config`, JSON.stringify(config));
      
      // Aplicar configurações aos sistemas
      if (configType === 'cache') {
        // Atualizar configuração do cache
        cache.updateConfig?.(config);
      } else if (configType === 'backup') {
        backupSystem.updateConfig(config);
      } else if (configType === 'health') {
        const healthMonitor = ApplicationHealthMonitor.getInstance();
        if (config.monitoringEnabled) {
          healthMonitor.startMonitoring(config.monitoringInterval * 1000);
        } else {
          healthMonitor.stopMonitoring();
        }
      }

      toast({
        title: "Configurações salvas",
        description: `Configurações de ${configType} atualizadas com sucesso`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive"
      });
    }
  };

  const handleClearCache = async () => {
    try {
      await cache.clear();
      setCacheStats(cache.getStats());
      toast({
        title: "Cache limpo",
        description: "Todos os dados do cache foram removidos",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível limpar o cache",
        variant: "destructive"
      });
    }
  };

  const handleCreateBackup = async () => {
    try {
      await backupSystem.createBackup('manual');
      setBackupStats(backupSystem.getStats());
      toast({
        title: "Backup criado",
        description: "Backup manual criado com sucesso",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o backup",
        variant: "destructive"
      });
    }
  };

  const handleResetSettings = () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações?')) {
      localStorage.removeItem('cache-config');
      localStorage.removeItem('backup-config');
      localStorage.removeItem('health-config');
      localStorage.removeItem('performance-config');
      
      // Resetar estados
      setCacheConfig({
        maxSize: 100,
        maxEntries: 1000,
        defaultTTL: 30,
        compressionEnabled: true,
        persistToDisk: true,
        adaptiveEviction: true
      });

      setBackupConfig({
        autoBackupEnabled: true,
        autoBackupInterval: 60,
        maxBackups: 5,
        compressionEnabled: true,
        encryptionEnabled: false,
        backupOnCriticalActions: true
      });

      setHealthConfig({
        monitoringEnabled: true,
        monitoringInterval: 30,
        autoFixEnabled: true,
        alertsEnabled: true
      });

      setPerformanceConfig({
        lazyLoadingEnabled: true,
        codeSplittingEnabled: true,
        compressionEnabled: true,
        preloadCritical: true
      });

      toast({
        title: "Configurações resetadas",
        description: "Todas as configurações foram restauradas para os valores padrão",
        variant: "default"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-8 w-8" />
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Configure os sistemas de robustez e performance
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleResetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Resetar Tudo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="cache" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cache" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Cache
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Monitoramento
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Cache Settings */}
          <TabsContent value="cache" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Cache</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tamanho Máximo (MB)</label>
                    <Input
                      type="number"
                      value={cacheConfig.maxSize}
                      onChange={(e) => setCacheConfig({...cacheConfig, maxSize: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Máximo de Entradas</label>
                    <Input
                      type="number"
                      value={cacheConfig.maxEntries}
                      onChange={(e) => setCacheConfig({...cacheConfig, maxEntries: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">TTL Padrão (minutos)</label>
                    <Input
                      type="number"
                      value={cacheConfig.defaultTTL}
                      onChange={(e) => setCacheConfig({...cacheConfig, defaultTTL: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Compressão Habilitada</label>
                      <Switch
                        checked={cacheConfig.compressionEnabled}
                        onCheckedChange={(checked) => setCacheConfig({...cacheConfig, compressionEnabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Persistir em Disco</label>
                      <Switch
                        checked={cacheConfig.persistToDisk}
                        onCheckedChange={(checked) => setCacheConfig({...cacheConfig, persistToDisk: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Eviction Adaptativa</label>
                      <Switch
                        checked={cacheConfig.adaptiveEviction}
                        onCheckedChange={(checked) => setCacheConfig({...cacheConfig, adaptiveEviction: checked})}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSaveConfig('cache', cacheConfig)} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Cache</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{cacheStats.totalEntries}</div>
                      <div className="text-sm text-muted-foreground">Entradas</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{(cacheStats.totalSize / 1024 / 1024).toFixed(1)}MB</div>
                      <div className="text-sm text-muted-foreground">Tamanho</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{cacheStats.hitRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Hit Rate</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{cacheStats.evictionCount}</div>
                      <div className="text-sm text-muted-foreground">Evictions</div>
                    </div>
                  </div>

                  <Button onClick={handleClearCache} variant="destructive" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Cache
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Backup Settings */}
          <TabsContent value="backup" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Backup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Intervalo de Backup Automático (minutos)</label>
                    <Input
                      type="number"
                      value={backupConfig.autoBackupInterval}
                      onChange={(e) => setBackupConfig({...backupConfig, autoBackupInterval: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Máximo de Backups</label>
                    <Input
                      type="number"
                      value={backupConfig.maxBackups}
                      onChange={(e) => setBackupConfig({...backupConfig, maxBackups: parseInt(e.target.value)})}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Backup Automático</label>
                      <Switch
                        checked={backupConfig.autoBackupEnabled}
                        onCheckedChange={(checked) => setBackupConfig({...backupConfig, autoBackupEnabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Compressão</label>
                      <Switch
                        checked={backupConfig.compressionEnabled}
                        onCheckedChange={(checked) => setBackupConfig({...backupConfig, compressionEnabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Criptografia</label>
                      <Switch
                        checked={backupConfig.encryptionEnabled}
                        onCheckedChange={(checked) => setBackupConfig({...backupConfig, encryptionEnabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Backup em Ações Críticas</label>
                      <Switch
                        checked={backupConfig.backupOnCriticalActions}
                        onCheckedChange={(checked) => setBackupConfig({...backupConfig, backupOnCriticalActions: checked})}
                      />
                    </div>
                  </div>

                  <Button onClick={() => handleSaveConfig('backup', backupConfig)} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configurações
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas de Backup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{backupStats.totalBackups}</div>
                      <div className="text-sm text-muted-foreground">Total</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{(backupStats.totalSize / 1024 / 1024).toFixed(1)}MB</div>
                      <div className="text-sm text-muted-foreground">Tamanho</div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>Último backup: {backupStats.lastBackup ? new Date(backupStats.lastBackup).toLocaleString() : 'Nunca'}</p>
                    <p>Taxa de sucesso: {backupStats.successRate}%</p>
                  </div>

                  <Button onClick={handleCreateBackup} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Criar Backup Manual
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Health Monitoring Settings */}
          <TabsContent value="health" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Monitoramento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Intervalo de Monitoramento (segundos)</label>
                      <Input
                        type="number"
                        value={healthConfig.monitoringInterval}
                        onChange={(e) => setHealthConfig({...healthConfig, monitoringInterval: parseInt(e.target.value)})}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Monitoramento Ativo</label>
                        <Switch
                          checked={healthConfig.monitoringEnabled}
                          onCheckedChange={(checked) => setHealthConfig({...healthConfig, monitoringEnabled: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Auto-correção</label>
                        <Switch
                          checked={healthConfig.autoFixEnabled}
                          onCheckedChange={(checked) => setHealthConfig({...healthConfig, autoFixEnabled: checked})}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Alertas</label>
                        <Switch
                          checked={healthConfig.alertsEnabled}
                          onCheckedChange={(checked) => setHealthConfig({...healthConfig, alertsEnabled: checked})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Métricas Monitoradas</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">FPS</Badge>
                        <span>Taxa de quadros da interface</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Latência</Badge>
                        <span>Tempo de resposta da rede</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Memória</Badge>
                        <span>Uso de memória JavaScript</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Storage</Badge>
                        <span>Uso do armazenamento local</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveConfig('health', healthConfig)} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Settings */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Lazy Loading</label>
                      <Switch
                        checked={performanceConfig.lazyLoadingEnabled}
                        onCheckedChange={(checked) => setPerformanceConfig({...performanceConfig, lazyLoadingEnabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Code Splitting</label>
                      <Switch
                        checked={performanceConfig.codeSplittingEnabled}
                        onCheckedChange={(checked) => setPerformanceConfig({...performanceConfig, codeSplittingEnabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Compressão</label>
                      <Switch
                        checked={performanceConfig.compressionEnabled}
                        onCheckedChange={(checked) => setPerformanceConfig({...performanceConfig, compressionEnabled: checked})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Preload Crítico</label>
                      <Switch
                        checked={performanceConfig.preloadCritical}
                        onCheckedChange={(checked) => setPerformanceConfig({...performanceConfig, preloadCritical: checked})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Otimizações Ativas</h4>
                    <div className="space-y-2 text-sm">
                      {performanceConfig.lazyLoadingEnabled && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Badge variant="default">Ativo</Badge>
                          <span>Carregamento sob demanda</span>
                        </div>
                      )}
                      {performanceConfig.codeSplittingEnabled && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Badge variant="default">Ativo</Badge>
                          <span>Divisão de código</span>
                        </div>
                      )}
                      {performanceConfig.compressionEnabled && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Badge variant="default">Ativo</Badge>
                          <span>Compressão de recursos</span>
                        </div>
                      )}
                      {performanceConfig.preloadCritical && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Badge variant="default">Ativo</Badge>
                          <span>Preload de recursos críticos</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button onClick={() => handleSaveConfig('performance', performanceConfig)} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Aviso */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Importante</p>
                <p className="text-yellow-700">
                  Algumas configurações podem exigir recarregamento da página para ter efeito completo. 
                  Configurações de performance são aplicadas automaticamente em novos carregamentos.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings; 