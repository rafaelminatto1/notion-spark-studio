import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Battery, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Monitor,
  Server,
  Database,
  Clock,
  Eye,
  Settings,
  RefreshCw,
  Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Tipos para métricas de sistema
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    download: number;
    upload: number;
    latency: number;
    status: 'online' | 'offline' | 'slow';
  };
  performance: {
    fps: number;
    loadTime: number;
    responseTime: number;
  };
  application: {
    activeUsers: number;
    documentsOpen: number;
    memoryLeaks: number;
    errorRate: number;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
}

interface SystemHealthDashboardProps {
  className?: string;
  refreshRate?: number; // em segundos
  autoRefresh?: boolean;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  className = '',
  refreshRate = 5,
  autoRefresh = true
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: { usage: 0, cores: 4 },
    memory: { used: 0, total: 8192, percentage: 0 },
    disk: { used: 0, total: 512000, percentage: 0 },
    network: { download: 0, upload: 0, latency: 0, status: 'online' },
    performance: { fps: 60, loadTime: 0, responseTime: 0 },
    application: { activeUsers: 1, documentsOpen: 0, memoryLeaks: 0, errorRate: 0 }
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(autoRefresh);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout>();

  // Simular coleta de métricas (em produção, seria APIs reais)
  const collectMetrics = async (): Promise<SystemMetrics> => {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));

    // Métricas simuladas com variação realística
    const newMetrics: SystemMetrics = {
      cpu: {
        usage: Math.max(0, Math.min(100, metrics.cpu.usage + (Math.random() - 0.5) * 20)),
        cores: navigator.hardwareConcurrency || 4,
        temperature: 45 + Math.random() * 10
      },
      memory: {
        used: 0,
        total: 8192,
        percentage: 0
      },
      disk: {
        used: 256000 + Math.random() * 10000,
        total: 512000,
        percentage: 0
      },
      network: {
        download: Math.random() * 100,
        upload: Math.random() * 50,
        latency: 20 + Math.random() * 30,
        status: navigator.onLine ? 'online' : 'offline'
      },
      performance: {
        fps: Math.max(30, 60 - Math.random() * 10),
        loadTime: performance.now(),
        responseTime: Math.random() * 200
      },
      application: {
        activeUsers: 1 + Math.floor(Math.random() * 5),
        documentsOpen: Math.floor(Math.random() * 10),
        memoryLeaks: Math.floor(Math.random() * 3),
        errorRate: Math.random() * 5
      }
    };

    // Calcular porcentagens
    if ('memory' in performance && (performance as any).memory) {
      const memInfo = (performance as any).memory;
      newMetrics.memory.used = memInfo.usedJSHeapSize / 1024 / 1024; // MB
      newMetrics.memory.total = memInfo.jsHeapSizeLimit / 1024 / 1024; // MB
      newMetrics.memory.percentage = (newMetrics.memory.used / newMetrics.memory.total) * 100;
    }

    newMetrics.disk.percentage = (newMetrics.disk.used / newMetrics.disk.total) * 100;

    return newMetrics;
  };

  // Detectar alertas baseado nas métricas
  const checkAlerts = (newMetrics: SystemMetrics) => {
    const newAlerts: PerformanceAlert[] = [];

    // CPU alto
    if (newMetrics.cpu.usage > 80) {
      newAlerts.push({
        id: `cpu-${Date.now()}`,
        type: 'warning',
        title: 'CPU Alto',
        message: `Uso de CPU em ${newMetrics.cpu.usage.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'cpu',
        value: newMetrics.cpu.usage,
        threshold: 80
      });
    }

    // Memória alta
    if (newMetrics.memory.percentage > 85) {
      newAlerts.push({
        id: `memory-${Date.now()}`,
        type: 'error',
        title: 'Memória Crítica',
        message: `Uso de memória em ${newMetrics.memory.percentage.toFixed(1)}%`,
        timestamp: new Date(),
        metric: 'memory',
        value: newMetrics.memory.percentage,
        threshold: 85
      });
    }

    // Performance baixa
    if (newMetrics.performance.fps < 45) {
      newAlerts.push({
        id: `fps-${Date.now()}`,
        type: 'warning', 
        title: 'Performance Baixa',
        message: `FPS em ${newMetrics.performance.fps.toFixed(0)}`,
        timestamp: new Date(),
        metric: 'fps',
        value: newMetrics.performance.fps,
        threshold: 45
      });
    }

    // Atualizar alertas (manter apenas os últimos 10)
    setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
  };

  // Atualizar métricas
  const updateMetrics = async () => {
    try {
      const newMetrics = await collectMetrics();
      setMetrics(newMetrics);
      setLastUpdate(new Date());
      checkAlerts(newMetrics);
    } catch (error) {
      console.error('Erro ao coletar métricas:', error);
    }
  };

  // Effect para auto-refresh
  useEffect(() => {
    if (isMonitoring) {
      updateMetrics(); // Primeira coleta
      intervalRef.current = setInterval(updateMetrics, refreshRate * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isMonitoring, refreshRate]);

  // Função para obter cor baseada no status
  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-500';
    if (percentage < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusBadge = (percentage: number) => {
    if (percentage < 50) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (percentage < 80) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-500" />
            System Health Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
            onClick={() => { setIsMonitoring(!isMonitoring); }}
          >
            {isMonitoring ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {isMonitoring ? 'Pausar' : 'Iniciar'}
          </Button>
          <Button variant="outline" size="sm" onClick={updateMetrics}>
            <Download className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Alertas Ativos ({alerts.length})
              </h3>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between text-sm">
                  <span className="text-yellow-700 dark:text-yellow-300">
                    {alert.title}: {alert.message}
                  </span>
                  <Badge variant="outline" className={getStatusBadge(alert.value)}>
                    {alert.timestamp.toLocaleTimeString()}
                  </Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Métricas principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Rede</TabsTrigger>
          <TabsTrigger value="application">Aplicação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* CPU */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU</CardTitle>
                <Cpu className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.cpu.usage.toFixed(1)}%
                </div>
                <Progress value={metrics.cpu.usage} className="mt-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {metrics.cpu.cores} cores disponíveis
                </p>
              </CardContent>
            </Card>

            {/* Memória */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memória</CardTitle>
                <HardDrive className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.memory.percentage.toFixed(1)}%
                </div>
                <Progress value={metrics.memory.percentage} className="mt-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {metrics.memory.used.toFixed(0)} MB / {metrics.memory.total.toFixed(0)} MB
                </p>
              </CardContent>
            </Card>

            {/* Disco */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Armazenamento</CardTitle>
                <Database className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.disk.percentage.toFixed(1)}%
                </div>
                <Progress value={metrics.disk.percentage} className="mt-2" />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {(metrics.disk.used / 1000).toFixed(1)} GB / {(metrics.disk.total / 1000).toFixed(1)} GB
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FPS</CardTitle>
                <Monitor className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.performance.fps.toFixed(0)}
                </div>
                <Badge className={getStatusBadge(60 - metrics.performance.fps)}>
                  {metrics.performance.fps >= 50 ? 'Excelente' : metrics.performance.fps >= 30 ? 'Bom' : 'Ruim'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
                <Clock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.performance.responseTime.toFixed(0)}ms
                </div>
                <Badge className={getStatusBadge(metrics.performance.responseTime / 5)}>
                  {metrics.performance.responseTime < 100 ? 'Rápido' : metrics.performance.responseTime < 300 ? 'Médio' : 'Lento'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Load Time</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(metrics.performance.loadTime / 1000).toFixed(2)}s
                </div>
                <Badge className={getStatusBadge((metrics.performance.loadTime / 1000) * 20)}>
                  {metrics.performance.loadTime < 2000 ? 'Otimizado' : 'Pode Melhorar'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status da Rede</CardTitle>
                <Wifi className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold flex items-center gap-2">
                  {metrics.network.status === 'online' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  )}
                  {metrics.network.status}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Latência: {metrics.network.latency.toFixed(0)}ms
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Download</CardTitle>
                <TrendingDown className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.network.download.toFixed(1)} Mbps
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upload</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.network.upload.toFixed(1)} Mbps
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="application" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.application.activeUsers}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documentos Abertos</CardTitle>
                <Server className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.application.documentsOpen}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Leaks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.application.memoryLeaks}
                </div>
                <Badge className={metrics.application.memoryLeaks === 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {metrics.application.memoryLeaks === 0 ? 'Limpo' : 'Atenção'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.application.errorRate.toFixed(2)}%
                </div>
                <Badge className={getStatusBadge(metrics.application.errorRate * 20)}>
                  {metrics.application.errorRate < 1 ? 'Excelente' : metrics.application.errorRate < 3 ? 'Aceitável' : 'Crítico'}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}; 