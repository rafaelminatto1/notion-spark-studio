import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  Clock, 
  AlertTriangle, 
  Info, 
  MessageCircle, 
  Users, 
  FileText, 
  Star,
  Settings,
  Filter,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Zap,
  Brain,
  TrendingUp,
  Calendar,
  Tag,
  Search,
  MoreHorizontal
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Tipos de notificação
interface SmartNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'collaboration' | 'ai' | 'system';
  category: 'document' | 'collaboration' | 'system' | 'ai' | 'workflow' | 'security';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  source: string;
  actions?: NotificationAction[];
  metadata?: {
    documentId?: string;
    userId?: string;
    aiConfidence?: number;
    relatedItems?: string[];
    suggestedActions?: string[];
  };
  autoResolve?: boolean;
  expiresAt?: Date;
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'destructive';
  icon?: React.ReactNode;
  handler: () => void;
}

interface NotificationSettings {
  enabled: boolean;
  categories: {
    [key: string]: boolean;
  };
  priorities: {
    [key: string]: boolean;
  };
  sound: boolean;
  desktop: boolean;
  email: boolean;
  digest: 'none' | 'daily' | 'weekly';
  aiInsights: boolean;
  smartFiltering: boolean;
}

interface SmartNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const SmartNotificationCenter: React.FC<SmartNotificationCenterProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<SmartNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [showRead, setShowRead] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    categories: {
      document: true,
      collaboration: true,
      system: true,
      ai: true,
      workflow: true,
      security: true
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      urgent: true
    },
    sound: true,
    desktop: true,
    email: false,
    digest: 'daily',
    aiInsights: true,
    smartFiltering: true
  });

  const notificationSound = useRef<HTMLAudioElement>();

  // Geração de notificações de exemplo
  useEffect(() => {
    const generateMockNotifications = (): SmartNotification[] => [
      {
        id: '1',
        type: 'ai',
        category: 'ai',
        title: 'IA Detectou Inconsistência',
        message: 'O sistema de IA encontrou uma possível inconsistência no documento "Planejamento Q4". Recomenda-se revisão.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        priority: 'high',
        source: 'Smart AI Assistant',
        metadata: {
          documentId: 'doc_123',
          aiConfidence: 0.87,
          suggestedActions: ['Revisar documento', 'Aplicar correções automáticas']
        },
        actions: [
          {
            id: 'review',
            label: 'Revisar',
            type: 'primary',
            icon: <Eye className="h-4 w-4" />,
            handler: () => console.log('Revisar documento')
          },
          {
            id: 'auto-fix',
            label: 'Corrigir Auto',
            type: 'secondary',
            icon: <Zap className="h-4 w-4" />,
            handler: () => console.log('Aplicar correções automáticas')
          }
        ]
      },
      {
        id: '2',
        type: 'collaboration',
        category: 'collaboration',
        title: 'Novo Colaborador',
        message: 'Ana Silva foi adicionada ao projeto "Website Redesign" com permissões de editor.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false,
        priority: 'medium',
        source: 'Collaboration System',
        metadata: {
          userId: 'user_456'
        },
        actions: [
          {
            id: 'view-profile',
            label: 'Ver Perfil',
            type: 'secondary',
            icon: <Users className="h-4 w-4" />,
            handler: () => console.log('Ver perfil do usuário')
          }
        ]
      },
      {
        id: '3',
        type: 'warning',
        category: 'system',
        title: 'Limite de Armazenamento',
        message: 'Você está usando 85% do seu espaço de armazenamento. Considere fazer limpeza ou upgrade.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: false,
        priority: 'medium',
        source: 'Storage Monitor',
        actions: [
          {
            id: 'clean-storage',
            label: 'Limpar',
            type: 'primary',
            icon: <Trash2 className="h-4 w-4" />,
            handler: () => console.log('Iniciar limpeza')
          },
          {
            id: 'upgrade',
            label: 'Upgrade',
            type: 'secondary',
            icon: <TrendingUp className="h-4 w-4" />,
            handler: () => console.log('Fazer upgrade')
          }
        ]
      },
      {
        id: '4',
        type: 'success',
        category: 'workflow',
        title: 'Workflow Concluído',
        message: 'O workflow "Auto-organize Documents" foi executado com sucesso. 15 documentos foram organizados.',
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        read: true,
        priority: 'low',
        source: 'Workflow Engine',
        autoResolve: true
      },
      {
        id: '5',
        type: 'error',
        category: 'security',
        title: 'Tentativa de Login Suspeita',
        message: 'Detectamos uma tentativa de login de localização não reconhecida (São Paulo, BR).',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        read: false,
        priority: 'urgent',
        source: 'Security Monitor',
        actions: [
          {
            id: 'secure-account',
            label: 'Proteger Conta',
            type: 'destructive',
            icon: <AlertTriangle className="h-4 w-4" />,
            handler: () => console.log('Proteger conta')
          },
          {
            id: 'ignore',
            label: 'Era Eu',
            type: 'secondary',
            handler: () => console.log('Ignorar alerta')
          }
        ]
      }
    ];

    setNotifications(generateMockNotifications());
  }, []);

  // Filtros inteligentes
  useEffect(() => {
    let filtered = notifications;

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(n => n.category === selectedCategory);
    }

    // Filtro por prioridade
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === selectedPriority);
    }

    // Filtro por lidas/não lidas
    if (!showRead) {
      filtered = filtered.filter(n => !n.read);
    }

    // Busca por texto
    if (searchQuery) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.source.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro inteligente por configurações
    if (settings.smartFiltering) {
      filtered = filtered.filter(n => 
        settings.categories[n.category] && 
        settings.priorities[n.priority]
      );
    }

    // Ordenação por prioridade e timestamp
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

    setFilteredNotifications(filtered);
  }, [notifications, selectedCategory, selectedPriority, showRead, searchQuery, settings]);

  // Som de notificação
  useEffect(() => {
    if (settings.sound && notificationSound.current) {
      const unreadCount = notifications.filter(n => !n.read).length;
      if (unreadCount > 0) {
        // notificationSound.current.play().catch(console.error);
      }
    }
  }, [notifications, settings.sound]);

  // Ações de notificação
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Estatísticas
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const urgent = notifications.filter(n => n.priority === 'urgent' && !n.read).length;
    const categories = notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, urgent, categories };
  }, [notifications]);

  // Ícones por tipo
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success': return <Check className="h-4 w-4 text-green-500" />;
      case 'collaboration': return <Users className="h-4 w-4 text-purple-500" />;
      case 'ai': return <Brain className="h-4 w-4 text-indigo-500" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  // Cores por prioridade
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      case 'high': return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
      case 'low': return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      default: return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 ${className}`}
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Notificações</h2>
            {stats.unread > 0 && (
              <Badge variant="destructive" className="text-xs">
                {stats.unread}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">{stats.unread}</div>
              <div className="text-xs text-gray-500">Não Lidas</div>
            </div>
            <div>
              <div className="text-xl font-bold text-red-600">{stats.urgent}</div>
              <div className="text-xs text-gray-500">Urgentes</div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 space-y-3 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar notificações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="document">Documentos</SelectItem>
                <SelectItem value="collaboration">Colaboração</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
                <SelectItem value="ai">IA</SelectItem>
                <SelectItem value="workflow">Workflows</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={showRead}
                onCheckedChange={setShowRead}
                id="show-read"
              />
              <label htmlFor="show-read" className="text-sm">
                Mostrar lidas
              </label>
            </div>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lista de notificações */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence>
            {filteredNotifications.length === 0 ? (
              <motion.div
                className="flex flex-col items-center justify-center h-full text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Bell className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-center">
                  {searchQuery ? 'Nenhuma notificação encontrada' : 'Nenhuma notificação'}
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  className={`border-l-4 p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                    getPriorityColor(notification.priority)
                  } ${notification.read ? 'opacity-60' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  layout
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-1">
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Marcar como lida
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => removeNotification(notification.id)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.source}
                          </Badge>
                          <Badge variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-xs">
                            {notification.priority}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Intl.RelativeTimeFormat('pt-BR').format(
                            Math.floor((notification.timestamp.getTime() - Date.now()) / 60000),
                            'minute'
                          )}
                        </span>
                      </div>

                      {/* Metadados de IA */}
                      {notification.metadata?.aiConfidence && (
                        <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded text-xs">
                          <div className="flex items-center justify-between">
                            <span>Confiança da IA</span>
                            <span>{Math.round(notification.metadata.aiConfidence * 100)}%</span>
                          </div>
                          <Progress 
                            value={notification.metadata.aiConfidence * 100} 
                            className="mt-1 h-1"
                          />
                        </div>
                      )}

                      {/* Ações */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div className="flex space-x-2 mt-3">
                          {notification.actions.map((action) => (
                            <Button
                              key={action.id}
                              variant={action.type}
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                action.handler();
                              }}
                              className="text-xs"
                            >
                              {action.icon}
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Footer com configurações rápidas */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
                id="notifications-enabled"
              />
              <label htmlFor="notifications-enabled" className="text-sm">
                Notificações
              </label>
            </div>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Som de notificação */}
      <audio ref={notificationSound} preload="auto">
        <source src="/notification.mp3" type="audio/mpeg" />
      </audio>
    </motion.div>
  );
};

export default SmartNotificationCenter; 