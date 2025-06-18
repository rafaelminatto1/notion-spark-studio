import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  Cpu,
  MemoryStick,
  Wifi,
  Monitor,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Gauge,
  Shield,
  RefreshCw,
  Download,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import useAIPerformanceOptimizer from '../../hooks/useAIPerformanceOptimizer';

interface PerformanceMetrics {
  cpu: number;
  memory: number;
  network: number;
  rendering: number;
  fps: number;
  loadTime: number;
  bundleSize: number;
  score: number;
}

interface OptimizationSuggestion {
  id: string;
  type: 'critical' | 'warning' | 'optimization' | 'enhancement';
  title: string;
  description: string;
  impact: number;
  effort: 'low' | 'medium' | 'high';
  category: 'performance' | 'memory' | 'network' | 'rendering';
  confidence: number;
  autoApply: boolean;
  applied: boolean;
}

interface PerformanceAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  resolved: boolean;
}

interface PredictionModel {
  metric: string;
  current: number;
  predicted1h: number;
  predicted24h: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export function AIPerformanceDashboard() {
  const {
    performanceData,
    optimizationSuggestions,
    isOptimizing,
    applyOptimization,
    startOptimization,
    stopOptimization,
    resetOptimizations
  } = useAIPerformanceOptimizer();

  const [isMonitoring, setIsMonitoring] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState([75]);
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cpu: 45,
    memory: 62,
    network: 38,
    rendering: 88,
    fps: 58,
    loadTime: 1.2,
    bundleSize: 244,
    score: 85
  });

  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([
    {
      id: '1',
      type: 'critical',
      title: 'Memory Leak Detectado',
      description: 'Componente useEffect não está fazendo cleanup correto',
      impact: 35,
      effort: 'medium',
      category: 'memory',
      confidence: 92,
      autoApply: false,
      applied: false
    },
    {
      id: '2',
      type: 'optimization',
      title: 'Lazy Loading Recomendado',
      description: 'Componentes pesados podem ser carregados sob demanda',
      impact: 25,
      effort: 'low',
      category: 'performance',
      confidence: 87,
      autoApply: true,
      applied: false
    },
    {
      id: '3',
      type: 'enhancement',
      title: 'Code Splitting Otimizado',
      description: 'Bundles podem ser divididos para melhor performance',
      impact: 18,
      effort: 'high',
      category: 'network',
      confidence: 78,
      autoApply: false,
      applied: false
    }
  ]);

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([
    {
      id: '1',
      severity: 'high',
      metric: 'Memory Usage',
      value: 85,
      threshold: 80,
      message: 'Uso de memória acima do limite recomendado',
      timestamp: Date.now() - 300000,
      resolved: false
    },
    {
      id: '2',
      severity: 'medium',
      metric: 'Network Latency',
      value: 450,
      threshold: 400,
      message: 'Latência de rede elevada detectada',
      timestamp: Date.now() - 600000,
      resolved: false
    }
  ]);

  const [predictions] = useState<PredictionModel[]>([
    {
      metric: 'CPU Usage',
      current: 45,
      predicted1h: 52,
      predicted24h: 48,
      confidence: 87,
      trend: 'stable'
    },
    {
      metric: 'Memory Usage',
      current: 62,
      predicted1h: 68,
      predicted24h: 75,
      confidence: 82,
      trend: 'degrading'
    },
    {
      metric: 'Performance Score',
      current: 85,
      predicted1h: 83,
      predicted24h: 86,
      confidence: 79,
      trend: 'improving'
    }
  ]);

  // Dados históricos para gráficos
  const [historicalData, setHistoricalData] = useState([
    { time: '00:00', cpu: 35, memory: 45, network: 28, score: 88 },
    { time: '04:00', cpu: 42, memory: 52, network: 35, score: 85 },
    { time: '08:00', cpu: 58, memory: 65, network: 42, score: 82 },
    { time: '12:00', cpu: 45, memory: 62, network: 38, score: 85 },
    { time: '16:00', cpu: 52, memory: 68, network: 45, score: 83 },
    { time: '20:00', cpu: 38, memory: 55, network: 32, score: 87 },
    { time: '24:00', cpu: 33, memory: 48, network: 25, score: 89 }
  ]);

  // Simulação de dados em tempo real
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        cpu: Math.max(0, Math.min(100, prev.cpu + (Math.random() - 0.5) * 10)),
        memory: Math.max(0, Math.min(100, prev.memory + (Math.random() - 0.5) * 8)),
        network: Math.max(0, Math.min(100, prev.network + (Math.random() - 0.5) * 12)),
        rendering: Math.max(0, Math.min(100, prev.rendering + (Math.random() - 0.5) * 5)),
        fps: Math.max(30, Math.min(60, prev.fps + (Math.random() - 0.5) * 4)),
        loadTime: Math.max(0.5, prev.loadTime + (Math.random() - 0.5) * 0.2),
        score: Math.max(0, Math.min(100, prev.score + (Math.random() - 0.5) * 3))
      }));

      // Verificar alertas
      setAlerts(prevAlerts => {
        const newAlerts = [...prevAlerts];
        
        if (metrics.memory > alertThreshold[0] && !newAlerts.find(a => a.metric === 'Memory' && !a.resolved)) {
          newAlerts.push({
            id: Date.now().toString(),
            severity: 'high',
            metric: 'Memory',
            value: metrics.memory,
            threshold: alertThreshold[0],
            message: `Uso de memória (${metrics.memory}%) excedeu o limite (${alertThreshold[0]}%)`,
            timestamp: Date.now(),
            resolved: false
          });
        }

        return newAlerts;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isMonitoring, alertThreshold, metrics.memory]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-300';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'degrading': return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const handleApplyOptimization = async (suggestionId: string) => {
    setSuggestions(prev => 
      prev.map(s => 
        s.id === suggestionId 
          ? { ...s, applied: true }
          : s
      )
    );
    await applyOptimization(suggestionId);
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true }
          : alert
      )
    );
  };

  const exportPerformanceData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      suggestions,
      alerts: alerts.filter(a => !a.resolved),
      predictions,
      historicalData
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Performance AI Dashboard</h2>
          <p className="text-muted-foreground">
            Monitoramento inteligente e otimização automática de performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Switch 
              checked={isMonitoring} 
              onCheckedChange={setIsMonitoring}
            />
            <span className="text-sm">Monitoramento</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoOptimize} 
              onCheckedChange={setAutoOptimize}
            />
            <span className="text-sm">Auto Otimização</span>
          </div>
          <Button variant="outline" onClick={exportPerformanceData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={isOptimizing ? stopOptimization : startOptimization}>
            {isOptimizing ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Otimizar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Score Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Score
            <Badge className={getScoreColor(metrics.score)}>{metrics.score}/100</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8">
            <div className="text-6xl font-bold">
              <span className={getScoreColor(metrics.score)}>{metrics.score}</span>
            </div>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>CPU</span>
                    <span>{metrics.cpu}%</span>
                  </div>
                  <Progress value={metrics.cpu} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Memória</span>
                    <span>{metrics.memory}%</span>
                  </div>
                  <Progress value={metrics.memory} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Rede</span>
                    <span>{metrics.network}%</span>
                  </div>
                  <Progress value={metrics.network} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Rendering</span>
                    <span>{metrics.rendering}%</span>
                  </div>
                  <Progress value={metrics.rendering} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas Ativos */}
      {alerts.filter(a => !a.resolved).length > 0 && (
        <div className="space-y-2">
          {alerts.filter(a => !a.resolved).map((alert) => (
            <Alert key={alert.id} className={getSeverityColor(alert.severity)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                {alert.metric} - {alert.severity.toUpperCase()}
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => resolveAlert(alert.id)}
                >
                  Resolver
                </Button>
              </AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="realtime">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
          <TabsTrigger value="predictions">Predições IA</TabsTrigger>
          <TabsTrigger value="optimizations">Otimizações</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          {/* Métricas em Tempo Real */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cpu}%</div>
                <Progress value={metrics.cpu} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memory}%</div>
                <Progress value={metrics.memory} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FPS</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.fps}</div>
                <p className="text-xs text-muted-foreground">frames/segundo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Load Time</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.loadTime.toFixed(1)}s</div>
                <p className="text-xs text-muted-foreground">tempo de carregamento</p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico Histórico */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Performance (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="cpu" stroke="#8B5CF6" name="CPU" />
                  <Line type="monotone" dataKey="memory" stroke="#EF4444" name="Memória" />
                  <Line type="monotone" dataKey="network" stroke="#3B82F6" name="Rede" />
                  <Line type="monotone" dataKey="score" stroke="#10B981" name="Score" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {predictions.map((prediction) => (
              <Card key={prediction.metric}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    {prediction.metric}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{prediction.current}</div>
                    <p className="text-sm text-muted-foreground">Atual</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-xl font-semibold text-blue-600">{prediction.predicted1h}</div>
                      <p className="text-xs text-muted-foreground">1 hora</p>
                    </div>
                    <div>
                      <div className="text-xl font-semibold text-purple-600">{prediction.predicted24h}</div>
                      <p className="text-xs text-muted-foreground">24 horas</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Confiança:</span>
                    <span className="font-medium">{prediction.confidence}%</span>
                  </div>
                  <Progress value={prediction.confidence} className="h-2" />

                  <div className="flex items-center justify-center gap-2">
                    {getTrendIcon(prediction.trend)}
                    <span className="text-sm capitalize">{prediction.trend}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimizations" className="space-y-6">
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id} className={suggestion.applied ? 'bg-green-50 border-green-200' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {suggestion.type === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
                        {suggestion.type === 'optimization' && <Zap className="h-5 w-5 text-blue-500" />}
                        {suggestion.type === 'enhancement' && <Target className="h-5 w-5 text-green-500" />}
                        {suggestion.title}
                      </CardTitle>
                      <CardDescription>{suggestion.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{suggestion.confidence}% confiança</Badge>
                      <Badge variant={
                        suggestion.effort === 'low' ? 'default' :
                        suggestion.effort === 'medium' ? 'secondary' : 'destructive'
                      }>
                        {suggestion.effort}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Impacto esperado:</span>
                        <span className="font-bold text-green-600">+{suggestion.impact}%</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">Categoria:</span>
                        <Badge variant="outline">{suggestion.category}</Badge>
                      </div>
                    </div>
                    
                    {suggestion.applied ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Aplicado</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {suggestion.autoApply && (
                          <Badge variant="secondary">Auto</Badge>
                        )}
                        <Button 
                          onClick={() => handleApplyOptimization(suggestion.id)}
                          disabled={isOptimizing}
                        >
                          {isOptimizing ? 'Aplicando...' : 'Aplicar'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Controles de Otimização</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Button onClick={resetOptimizations} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Otimizações
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar App
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Limite de Alerta de Memória: {alertThreshold[0]}%
                </label>
                <Slider
                  value={alertThreshold}
                  onValueChange={setAlertThreshold}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Monitoramento Ativo</label>
                  <Switch checked={isMonitoring} onCheckedChange={setIsMonitoring} />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Otimização Automática</label>
                  <Switch checked={autoOptimize} onCheckedChange={setAutoOptimize} />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Informações do Sistema</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>Bundle Size:</span>
                    <span>{metrics.bundleSize}kB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Load Time:</span>
                    <span>{metrics.loadTime.toFixed(2)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>FPS Average:</span>
                    <span>{metrics.fps}/60</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 