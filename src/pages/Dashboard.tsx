import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Zap, 
  Shield, 
  Database, 
  TrendingUp,
  Users,
  FileText,
  Brain,
  Settings,
  BarChart3
} from 'lucide-react';

const Dashboard: React.FC = () => {
  // Dados estáticos para evitar problemas de SSR
  const dashboardData = {
    stats: {
      totalProjects: 24,
      activeUsers: 156,
      documentsProcessed: 1247,
      aiInteractions: 892
    },
    recentActivity: [
      { id: 1, action: 'Documento criado', user: 'João Silva', time: '2 min atrás' },
      { id: 2, action: 'IA processou conteúdo', user: 'Sistema', time: '5 min atrás' },
      { id: 3, action: 'Colaboração iniciada', user: 'Maria Santos', time: '8 min atrás' },
      { id: 4, action: 'Backup automático', user: 'Sistema', time: '15 min atrás' }
    ],
    performance: {
      responseTime: 245,
      uptime: 99.8,
      errorRate: 0.02,
      cacheHitRate: 87.5
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do Notion Spark Studio
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="default" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Sistema Saudável
            </Badge>
          </div>
        </div>

        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">
                +12% desde o mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                +8% desde a semana passada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documentos Processados</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.documentsProcessed}</div>
              <p className="text-xs text-muted-foreground">
                +23% desde ontem
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interações IA</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats.aiInteractions}</div>
              <p className="text-xs text-muted-foreground">
                +15% desde ontem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance e Sistemas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tempo de Resposta</span>
                  <span>{dashboardData.performance.responseTime}ms</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${Math.max(0, 100 - dashboardData.performance.responseTime / 10)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uptime</span>
                  <span>{dashboardData.performance.uptime}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${dashboardData.performance.uptime}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Taxa de Cache Hit</span>
                  <span>{dashboardData.performance.cacheHitRate}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${dashboardData.performance.cacheHitRate}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sistemas de Robustez */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sistemas de Robustez
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cache */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Cache Inteligente</p>
                  <p className="text-sm text-muted-foreground">
                    Sistema ativo e funcionando
                  </p>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>

              {/* Backup */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Sistema de Backup</p>
                  <p className="text-sm text-muted-foreground">
                    Backup automático configurado
                  </p>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>

              {/* Health Monitor */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Monitor de Saúde</p>
                  <p className="text-sm text-muted-foreground">
                    Sistema monitorado 24/7
                  </p>
                </div>
                <Badge variant="default">Ativo</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-sm text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Links Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">IA Workspace</h3>
              <p className="text-sm text-muted-foreground">Processar conteúdo com IA</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Integração Notion</h3>
              <p className="text-sm text-muted-foreground">Conectar com Notion</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold">Configurações</h3>
              <p className="text-sm text-muted-foreground">Personalizar sistema</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 