import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Activity, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  MessageSquare,
  Edit3,
  Share2,
  Sync,
  TrendingUp,
  Eye,
  MousePointer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { realTimeCollaboration } from '../../services/RealTimeCollaborationEngine';
import useAdvancedSystems from '../../hooks/useAdvancedSystems';

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  cursor: {
    x: number;
    y: number;
    selection?: any;
  };
  lastSeen: number;
  status: 'active' | 'idle' | 'away' | 'offline';
  permissions: string[];
}

interface CollaborationMetrics {
  activeUsers: number;
  totalSessions: number;
  syncLatency: number;
  conflictsResolved: number;
  operationsPerSecond: number;
  uptime: number;
  lastSync: number;
}

export function RealTimeCollaborationDashboard() {
  const [systemState] = useAdvancedSystems();
  const [collaborators, setCollaborators] = useState<CollaborationUser[]>([]);
  const [metrics, setMetrics] = useState<CollaborationMetrics>({
    activeUsers: 0,
    totalSessions: 0,
    syncLatency: 0,
    conflictsResolved: 0,
    operationsPerSecond: 0,
    uptime: 0,
    lastSync: Date.now()
  });
  const [selectedDocument, setSelectedDocument] = useState('main-document');
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  // Simulação de dados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      // Atualizar métricas
      setMetrics(prev => ({
        ...prev,
        activeUsers: 3 + Math.floor(Math.random() * 5),
        totalSessions: prev.totalSessions + Math.floor(Math.random() * 3),
        syncLatency: Math.round(40 + Math.random() * 20), // 40-60ms
        conflictsResolved: prev.conflictsResolved + (Math.random() > 0.8 ? 1 : 0),
        operationsPerSecond: Math.round(15 + Math.random() * 25),
        uptime: prev.uptime + 5000,
        lastSync: Date.now()
      }));

      // Atualizar colaboradores
      setCollaborators([
        {
          id: 'user1',
          name: 'Ana Silva',
          email: 'ana@empresa.com',
          avatar: '',
          cursor: { x: Math.random() * 800, y: Math.random() * 600 },
          lastSeen: Date.now() - Math.random() * 10000,
          status: Math.random() > 0.7 ? 'active' : 'idle',
          permissions: ['read', 'write']
        },
        {
          id: 'user2', 
          name: 'Carlos Santos',
          email: 'carlos@empresa.com',
          avatar: '',
          cursor: { x: Math.random() * 800, y: Math.random() * 600 },
          lastSeen: Date.now() - Math.random() * 5000,
          status: 'active',
          permissions: ['read', 'write', 'admin']
        },
        {
          id: 'user3',
          name: 'Maria Oliveira', 
          email: 'maria@empresa.com',
          avatar: '',
          cursor: { x: Math.random() * 800, y: Math.random() * 600 },
          lastSeen: Date.now() - Math.random() * 15000,
          status: Math.random() > 0.5 ? 'active' : 'away',
          permissions: ['read']
        }
      ]);

      // Atualizar atividade recente
      const activities = [
        'Ana inseriu texto na linha 45',
        'Carlos aplicou formatação em negrito',
        'Maria adicionou um comentário',
        'Ana deletou parágrafo',
        'Carlos moveu bloco de texto',
        'Maria alterou título'
      ];
      
      if (Math.random() > 0.6) {
        setRecentActivity(prev => [
          {
            id: Date.now(),
            user: ['Ana Silva', 'Carlos Santos', 'Maria Oliveira'][Math.floor(Math.random() * 3)],
            action: activities[Math.floor(Math.random() * activities.length)],
            timestamp: Date.now(),
            type: ['edit', 'format', 'comment', 'delete'][Math.floor(Math.random() * 4)]
          },
          ...prev.slice(0, 9)
        ]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-yellow-500';
      case 'away': return 'bg-orange-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'edit': return <Edit3 className="h-3 w-3" />;
      case 'format': return <Zap className="h-3 w-3" />;
      case 'comment': return <MessageSquare className="h-3 w-3" />;
      case 'delete': return <AlertTriangle className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const formatUptime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const handleForceSync = async () => {
    setIsConnected(false);
    setTimeout(() => {
      setIsConnected(true);
      setMetrics(prev => ({ ...prev, lastSync: Date.now(), syncLatency: 35 }));
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Colaboração em Tempo Real</h2>
          <p className="text-muted-foreground">
            Monitore a atividade colaborativa e sincronização em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? 'Conectado' : 'Reconectando...'}
          </Badge>
          <Button variant="outline" onClick={handleForceSync} disabled={!isConnected}>
            <Sync className="h-4 w-4 mr-2" />
            Sincronizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              +2 nas últimas 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência de Sync</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.syncLatency}ms</div>
            <p className="text-xs text-muted-foreground">
              Excelente performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operações/seg</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.operationsPerSecond}</div>
            <p className="text-xs text-muted-foreground">
              Alta atividade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflitos Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.conflictsResolved}</div>
            <p className="text-xs text-muted-foreground">
              98% auto-resolvidos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Colaboradores Ativos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Colaboradores Ativos
            </CardTitle>
            <CardDescription>
              Usuários atualmente editando o documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence>
              {collaborators.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {user.status}
                    </Badge>
                    {user.permissions.includes('admin') && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MousePointer className="h-3 w-3" />
                      {Math.round((Date.now() - user.lastSeen) / 1000)}s
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
            <CardDescription>
              Últimas ações dos colaboradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {recentActivity.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">{activity.user}</p>
                        <Separator orientation="vertical" className="h-3" />
                        <p className="text-xs text-muted-foreground">
                          {Math.round((Date.now() - activity.timestamp) / 1000)}s atrás
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status de Sincronização */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sync className="h-5 w-5" />
            Status de Sincronização
          </CardTitle>
          <CardDescription>
            Monitoramento detalhado da sincronização em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Latência de Rede</span>
                <span className="text-sm text-muted-foreground">{metrics.syncLatency}ms</span>
              </div>
              <Progress 
                value={(100 - metrics.syncLatency)} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground">
                {metrics.syncLatency < 50 ? 'Excelente' : metrics.syncLatency < 100 ? 'Boa' : 'Lenta'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Taxa de Sincronização</span>
                <span className="text-sm text-muted-foreground">98%</span>
              </div>
              <Progress value={98} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Muito estável
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Uptime</span>
                <span className="text-sm text-muted-foreground">{formatUptime(metrics.uptime)}</span>
              </div>
              <Progress value={99.9} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Sistema estável
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Última Sincronização</p>
              <p className="text-xs text-muted-foreground">
                {new Date(metrics.lastSync).toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Sincronizado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualização de Cursores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visualização de Cursores
          </CardTitle>
          <CardDescription>
            Posições dos cursores dos colaboradores em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative h-40 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/25 overflow-hidden">
            <div className="absolute inset-0 p-4">
              <p className="text-sm text-muted-foreground mb-2">Documento de exemplo:</p>
              <div className="space-y-1 text-xs">
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                <p>Sed do eiusmod tempor incididunt ut labore et dolore magna.</p>
                <p>Ut enim ad minim veniam, quis nostrud exercitation.</p>
              </div>
            </div>
            {collaborators.filter(u => u.status === 'active').map((user) => (
              <motion.div
                key={user.id}
                animate={{
                  x: user.cursor.x % 300,
                  y: user.cursor.y % 120
                }}
                transition={{ duration: 0.5 }}
                className="absolute w-4 h-4 pointer-events-none"
              >
                <MousePointer 
                  className="h-4 w-4 text-blue-500" 
                  style={{ 
                    filter: `hue-rotate(${user.id === 'user1' ? '0' : user.id === 'user2' ? '120' : '240'}deg)` 
                  }} 
                />
                <div className="absolute top-5 left-0 bg-black text-white text-xs px-1 py-0.5 rounded whitespace-nowrap">
                  {user.name.split(' ')[0]}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 