'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Zap,
  Brain,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';
import { supabaseMonitoring } from '@/services/supabaseMonitoring';
import { realTimeAIAnalytics } from '@/services/RealTimeAIAnalytics';

interface SmartNotification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'ai_insight' | 'optimization';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  }[];
  metadata?: {
    source: string;
    category: string;
    relatedMetrics?: string[];
  };
}

export const SmartNotificationWidget: React.FC = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'high_priority'>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const generateSmartNotifications = (): SmartNotification[] => {
    const baseNotifications: SmartNotification[] = [
      {
        id: 'sys-1',
        type: 'success',
        title: 'Sistema Otimizado',
        message: 'ESLint híbrido implementado com 0 problemas críticos. Performance melhorada em 15%.',
        priority: 'medium',
        timestamp: Date.now() - 5 * 60 * 1000,
        read: false,
        metadata: {
          source: 'Performance Monitor',
          category: 'system_optimization',
          relatedMetrics: ['lint_errors', 'build_time']
        },
        actions: [
          {
            label: 'Ver Detalhes',
            action: () => console.log('Navigate to performance details'),
            variant: 'outline'
          }
        ]
      },
      {
        id: 'ai-1',
        type: 'ai_insight',
        title: 'Insight de IA',
        message: 'Detectado padrão de uso que pode beneficiar de cache preditivo. Economia estimada: 23% em tempo de carregamento.',
        priority: 'high',
        timestamp: Date.now() - 10 * 60 * 1000,
        read: false,
        metadata: {
          source: 'AI Analytics Engine',
          category: 'performance_prediction',
          relatedMetrics: ['cache_hit_rate', 'user_patterns']
        },
        actions: [
          {
            label: 'Aplicar Otimização',
            action: () => console.log('Apply AI recommendation'),
            variant: 'default'
          },
          {
            label: 'Ignorar',
            action: () => console.log('Dismiss recommendation'),
            variant: 'outline'
          }
        ]
      },
      {
        id: 'cache-1',
        type: 'optimization',
        title: 'Cache Inteligente Ativo',
        message: 'Sistema de cache com IA atingiu 87% de hit rate. Recomendado aumentar tamanho do cache em 20%.',
        priority: 'medium',
        timestamp: Date.now() - 15 * 60 * 1000,
        read: true,
        metadata: {
          source: 'Smart Cache Engine',
          category: 'cache_optimization',
          relatedMetrics: ['cache_hit_rate', 'memory_usage']
        },
        actions: [
          {
            label: 'Aumentar Cache',
            action: () => console.log('Increase cache size'),
            variant: 'default'
          }
        ]
      },
      {
        id: 'collab-1',
        type: 'info',
        title: 'Colaboração em Tempo Real',
        message: '12 salas de colaboração ativas. Latência média: 45ms. Sistema funcionando optimamente.',
        priority: 'low',
        timestamp: Date.now() - 20 * 60 * 1000,
        read: true,
        metadata: {
          source: 'WebSocket Service',
          category: 'collaboration',
          relatedMetrics: ['active_connections', 'latency']
        }
      },
      {
        id: 'ai-2',
        type: 'ai_insight',
        title: 'Predição de Churn',
        message: 'IA detectou 3 usuários com alto risco de churn (85% confiança). Sugestão: engajamento proativo.',
        priority: 'high',
        timestamp: Date.now() - 25 * 60 * 1000,
        read: false,
        metadata: {
          source: 'AI Analytics Engine',
          category: 'user_behavior',
          relatedMetrics: ['user_engagement', 'churn_risk']
        },
        actions: [
          {
            label: 'Ver Usuários',
            action: () => console.log('Show at-risk users'),
            variant: 'default'
          },
          {
            label: 'Criar Campanha',
            action: () => console.log('Create engagement campaign'),
            variant: 'outline'
          }
        ]
      },
      {
        id: 'perf-1',
        type: 'warning',
        title: 'Uso de Memória',
        message: 'Uso de memória em 45%. Dentro do normal, mas monitoramento ativo recomendado.',
        priority: 'low',
        timestamp: Date.now() - 30 * 60 * 1000,
        read: true,
        metadata: {
          source: 'Performance Monitor',
          category: 'resource_monitoring',
          relatedMetrics: ['memory_usage', 'performance_score']
        }
      }
    ];

    return baseNotifications;
  };

  useEffect(() => {
    setNotifications(generateSmartNotifications());

    // Simulate real-time notifications
    const interval = setInterval(() => {
      const shouldAddNotification = Math.random() > 0.8; // 20% chance every interval
      if (shouldAddNotification) {
        const newNotification: SmartNotification = {
          id: `notification-${Date.now()}`,
          type: Math.random() > 0.5 ? 'ai_insight' : 'info',
          title: 'Novo Insight de IA',
          message: 'Sistema detectou oportunidade de otimização em tempo real.',
          priority: 'medium',
          timestamp: Date.now(),
          read: false,
          metadata: {
            source: 'Real-time AI',
            category: 'live_optimization'
          }
        };

        setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep only 10 notifications
      }
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'high_priority':
        return notifications.filter(n => n.priority === 'high' || n.priority === 'critical');
      default:
        return notifications;
    }
  };

  const getNotificationIcon = (type: SmartNotification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'ai_insight': return <Brain className="w-4 h-4 text-purple-600" />;
      case 'optimization': return <Zap className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: SmartNotification['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = getFilteredNotifications();

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Notificações Inteligentes</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Minimizar' : 'Expandir'}
          </Button>
        </div>
        <CardDescription>
          Insights de IA e alertas do sistema em tempo real
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <div className="flex space-x-1">
            {(['all', 'unread', 'high_priority'] as const).map((filterOption) => (
              <Button
                key={filterOption}
                variant={filter === filterOption ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption)}
                className="text-xs"
              >
                {filterOption === 'all' && 'Todas'}
                {filterOption === 'unread' && 'Não Lidas'}
                {filterOption === 'high_priority' && 'Alta Prioridade'}
              </Button>
            ))}
          </div>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar Todas como Lidas
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className={`space-y-3 ${isExpanded ? 'max-h-96' : 'max-h-64'} overflow-y-auto`}>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <Alert
                key={notification.id}
                className={`relative transition-all duration-200 ${
                  !notification.read ? 'ring-2 ring-blue-200 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <AlertTitle className="text-sm font-medium">
                        {notification.title}
                      </AlertTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                          {notification.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => dismissNotification(notification.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <AlertDescription className="text-xs text-gray-600 mb-2">
                      {notification.message}
                    </AlertDescription>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(notification.timestamp).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {notification.metadata && (
                          <Badge variant="outline" className="text-xs">
                            {notification.metadata.source}
                          </Badge>
                        )}
                      </div>
                      
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-auto p-1"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>

                    {/* Actions */}
                    {notification.actions && notification.actions.length > 0 && (
                      <div className="flex space-x-2 mt-3">
                        {notification.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant={action.variant || 'outline'}
                            size="sm"
                            className="text-xs"
                            onClick={action.action}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Alert>
            ))
          )}
        </div>

        {/* Summary Stats */}
        <div className="border-t pt-3 mt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-purple-600">{notifications.filter(n => n.type === 'ai_insight').length}</div>
              <div className="text-xs text-gray-500">Insights de IA</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-blue-600">{notifications.filter(n => n.type === 'optimization').length}</div>
              <div className="text-xs text-gray-500">Otimizações</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">{notifications.filter(n => n.priority === 'high').length}</div>
              <div className="text-xs text-gray-500">Alta Prioridade</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 