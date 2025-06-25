'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { supabase } from '@/lib/supabase-unified';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  BellDot, 
  Check, 
  Trash2, 
  Settings,
  User,
  FileText,
  MessageSquare,
  Share,
  Calendar,
  AlertCircle,
  Info,
  CheckCircle,
  X
} from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'comment' | 'share' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  created_at: string;
  expires_at?: string;
}

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar notificações
  useEffect(() => {
    if (user) {
      loadNotifications();
      setupRealtimeSubscription();
    }
  }, [user]);

  // Atualizar contador não lidas
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Simular notificações para demonstração
      const mockNotifications: Notification[] = [
        {
          id: '1',
          user_id: user!.id,
          type: 'mention',
          title: 'Você foi mencionado',
          message: 'João Silva mencionou você no documento "Reunião de Planejamento"',
          data: { document_id: '123', mentioned_by: 'João Silva' },
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min atrás
        },
        {
          id: '2',
          user_id: user!.id,
          type: 'comment',
          title: 'Novo comentário',
          message: 'Maria Santos comentou no documento "Projeto Q1"',
          data: { document_id: '456', comment_by: 'Maria Santos' },
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2h atrás
        },
        {
          id: '3',
          user_id: user!.id,
          type: 'share',
          title: 'Documento compartilhado',
          message: 'Pedro Costa compartilhou "Relatório Mensal" com você',
          data: { document_id: '789', shared_by: 'Pedro Costa' },
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 dia atrás
        },
        {
          id: '4',
          user_id: user!.id,
          type: 'system',
          title: 'Backup concluído',
          message: 'Backup automático dos seus documentos foi concluído com sucesso',
          data: { backup_size: '15.2 MB', files_count: 47 },
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() // 2 dias atrás
        },
        {
          id: '5',
          user_id: user!.id,
          type: 'success',
          title: 'Template criado',
          message: 'Seu template "Reunião Semanal" foi criado e está disponível',
          data: { template_id: 'abc123' },
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() // 3 dias atrás
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    // Em uma implementação real, configuraria subscription do Supabase
    // para receber notificações em tempo real
    
    // Simular notificação em tempo real para demonstração
    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance a cada 30s
        const newNotification: Notification = {
          id: Date.now().toString(),
          user_id: user!.id,
          type: 'info',
          title: 'Nova atividade',
          message: 'Alguém visualizou seu documento recentemente',
          read: false,
          created_at: new Date().toISOString()
        };
        
        setNotifications(prev => [newNotification, ...prev]);
      }
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention': return <User className="h-4 w-4 text-blue-600" />;
      case 'comment': return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'share': return <Share className="h-4 w-4 text-purple-600" />;
      case 'system': return <Settings className="h-4 w-4 text-gray-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      // Em implementação real, atualizaria no banco
      // await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Em implementação real, atualizaria no banco
      // await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      
      // Em implementação real, removeria do banco
      // await supabase.from('notifications').delete().eq('id', notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAll = async () => {
    try {
      setNotifications([]);
      
      // Em implementação real, removeria do banco
      // await supabase.from('notifications').delete().eq('user_id', user.id);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          {unreadCount > 0 ? (
            <BellDot className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Notificações</h3>
            {notifications.length > 0 && (
              <div className="flex space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Limpar todas
                </Button>
              </div>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {unreadCount} nova{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">Nenhuma notificação</p>
              <p className="text-sm">Você está em dia! 🎉</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button variant="ghost" className="w-full text-sm" size="sm">
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationCenter; 