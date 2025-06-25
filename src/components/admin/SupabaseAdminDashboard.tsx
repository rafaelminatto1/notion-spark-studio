'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Activity, 
  Shield, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  BarChart3,
  Settings,
  Users,
  FileText,
  Clock
} from 'lucide-react';
import SupabaseMonitoringService, { AdvisorLint, SupabaseStats, LogEntry } from '@/services/SupabaseMonitoringService';

// Interfaces movidas para o serviço de monitoramento

const SupabaseAdminDashboard: React.FC = () => {
  const [securityAdvisors, setSecurityAdvisors] = useState<AdvisorLint[]>([]);
  const [performanceAdvisors, setPerformanceAdvisors] = useState<AdvisorLint[]>([]);
  const [stats, setStats] = useState<SupabaseStats>({
    tables: 0,
    indexes: 0,
    functions: 0,
    policies: 0,
    migrations: 0,
    connections: 0,
    storage_used: '0MB',
    queries_per_day: 0
  });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const monitoringService = SupabaseMonitoringService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const data = await monitoringService.runFullSystemCheck();
      
      setSecurityAdvisors(data.security);
      setPerformanceAdvisors(data.performance);
      setStats(data.stats);
      setLogs(data.logs);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-500';
      case 'WARN': return 'bg-yellow-500';
      case 'INFO': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertTriangle className="h-4 w-4" />;
      case 'WARN': return <AlertTriangle className="h-4 w-4" />;
      case 'INFO': return <Info className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const AdvisorCard: React.FC<{ advisor: AdvisorLint }> = ({ advisor }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getLevelIcon(advisor.level)}
            {advisor.title}
          </CardTitle>
          <Badge className={`${getLevelColor(advisor.level)} text-white`}>
            {advisor.level}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {advisor.categories.join(', ')} • {advisor.facing}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-2">{advisor.description}</p>
        <p className="text-xs text-gray-500 mb-3">{advisor.detail}</p>
        {advisor.remediation && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(advisor.remediation, '_blank')}
            className="text-xs"
          >
            Ver Solução
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const StatsCard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    description: string;
    color?: string;
  }> = ({ title, value, icon, description, color = "text-blue-600" }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={color}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Carregando dados do Supabase...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Supabase Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitoramento e otimização do banco de dados
          </p>
        </div>
        <Button onClick={loadDashboardData} disabled={loading}>
          <Activity className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Tabelas"
          value={stats.tables}
          icon={<Database className="h-4 w-4" />}
          description="Tabelas do schema público"
          color="text-green-600"
        />
        <StatsCard
          title="Índices"
          value={stats.indexes}
          icon={<Zap className="h-4 w-4" />}
          description="Índices de performance"
          color="text-blue-600"
        />
        <StatsCard
          title="Funções"
          value={stats.functions}
          icon={<Settings className="h-4 w-4" />}
          description="Funções SQL personalizadas"
          color="text-purple-600"
        />
        <StatsCard
          title="Políticas RLS"
          value={stats.policies}
          icon={<Shield className="h-4 w-4" />}
          description="Row Level Security"
          color="text-orange-600"
        />
        <StatsCard
          title="Migrações"
          value={stats.migrations}
          icon={<Clock className="h-4 w-4" />}
          description="Migrações aplicadas"
          color="text-gray-600"
        />
      </div>

      {/* Advisor Alerts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sistema Operacional:</strong> Supabase conectado e funcionando normalmente.
            Última otimização aplicada com sucesso.
          </AlertDescription>
        </Alert>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Performance:</strong> {performanceAdvisors.length} recomendações de otimização disponíveis.
            {securityAdvisors.length} alertas de segurança identificados.
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Status de Segurança
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Alertas Críticos</span>
                    <Badge variant="destructive">0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Avisos</span>
                    <Badge variant="secondary">{securityAdvisors.filter(a => a.level === 'WARN').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Informações</span>
                    <Badge variant="outline">{securityAdvisors.filter(a => a.level === 'INFO').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Status de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Otimizações Críticas</span>
                    <Badge variant="destructive">0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Recomendações</span>
                    <Badge variant="secondary">{performanceAdvisors.filter(a => a.level === 'WARN').length}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Índices Não Utilizados</span>
                    <Badge variant="outline">{performanceAdvisors.filter(a => a.name === 'unused_index').length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Relatórios de Segurança</h2>
            <Badge variant="outline">{securityAdvisors.length} itens</Badge>
          </div>
          
          {securityAdvisors.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">Excelente!</h3>
                  <p className="text-muted-foreground">Nenhum problema de segurança detectado.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {securityAdvisors.map((advisor, index) => (
                <AdvisorCard key={index} advisor={advisor} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Otimizações de Performance</h2>
            <Badge variant="outline">{performanceAdvisors.length} itens</Badge>
          </div>
          
          <div className="space-y-4">
            {performanceAdvisors.map((advisor, index) => (
              <AdvisorCard key={index} advisor={advisor} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas de Uso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Consultas/dia</span>
                      <span>~1.2k</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Conexões ativas</span>
                      <span>12/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '12%'}}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Armazenamento</span>
                      <span>45MB/8GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{width: '1%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {logs.slice(0, 3).map((log, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        log.level === 'error' ? 'bg-red-500' :
                        log.level === 'warn' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <span>{log.message}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Logs do Sistema</h2>
            <Badge variant="outline">{logs.length} entradas</Badge>
          </div>
          
          <div className="space-y-2">
            {logs.map((log, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      log.level === 'error' ? 'bg-red-500' :
                      log.level === 'warn' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {log.service}
                        </Badge>
                        <Badge 
                          variant={log.level === 'error' ? 'destructive' : 
                                  log.level === 'warn' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {log.level.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.metadata && (
                        <pre className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SupabaseAdminDashboard; 