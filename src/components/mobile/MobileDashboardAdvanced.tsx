import React, { useState, useEffect, useCallback } from 'react';
import { useMobileEcosystem } from '../../hooks/useMobileEcosystem';
import { mobileOptimizationService } from '../../services/MobileOptimizationService';

interface MobileDashboardProps {
  userId?: string;
  workspaceId?: string;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
  badge?: string | number;
  disabled?: boolean;
}

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon: React.ReactNode;
  color: string;
  trend?: number[];
}

interface RecentItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type: 'document' | 'note' | 'task' | 'collaboration';
  thumbnail?: string;
  status?: 'draft' | 'published' | 'shared' | 'private';
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export const MobileDashboardAdvanced: React.FC<MobileDashboardProps> = ({
  userId,
  workspaceId
}) => {
  // Mobile ecosystem state
  const mobileEcosystem = useMobileEcosystem({
    enableOfflineSync: true,
    enablePushNotifications: true,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    adaptiveQuality: true,
    batteryOptimization: true
  });

  // Component state
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // Check PWA install status
  useEffect(() => {
    if (mobileEcosystem.pwa.canInstall && !mobileEcosystem.pwa.isInstalled) {
      setShowInstallPrompt(true);
    }
  }, [mobileEcosystem.pwa]);

  // Initialize dashboard data
  useEffect(() => {
    initializeDashboard();
  }, [userId, workspaceId]);

  const initializeDashboard = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Load quick actions
      const actions: QuickAction[] = [
        {
          id: 'new-document',
          title: 'New Document',
          subtitle: 'Create a new document',
          icon: '📄',
          action: () => handleNewDocument(),
          color: '#3B82F6',
          disabled: false
        },
        {
          id: 'voice-note',
          title: 'Voice Note',
          subtitle: 'Record a voice memo',
          icon: '🎤',
          action: () => handleVoiceNote(),
          color: '#10B981',
          disabled: !mobileEcosystem.features.microphone
        },
        {
          id: 'camera-scan',
          title: 'Scan Document',
          subtitle: 'Capture with camera',
          icon: '📷',
          action: () => handleCameraScan(),
          color: '#F59E0B',
          disabled: !mobileEcosystem.features.camera
        },
        {
          id: 'offline-sync',
          title: 'Sync Now',
          subtitle: 'Sync offline changes',
          icon: '🔄',
          action: () => handleOfflineSync(),
          color: '#8B5CF6',
          badge: mobileEcosystem.offlineQueue.length > 0 ? mobileEcosystem.offlineQueue.length : undefined
        },
        {
          id: 'search',
          title: 'Smart Search',
          subtitle: 'Find anything quickly',
          icon: '🔍',
          action: () => handleSearch(),
          color: '#EC4899'
        },
        {
          id: 'collaboration',
          title: 'Collaborate',
          subtitle: 'Join live session',
          icon: '👥',
          action: () => handleCollaboration(),
          color: '#06B6D4'
        }
      ];
      
      setQuickActions(actions);

      // Load metrics
      const deviceMetrics = await mobileOptimizationService.generatePerformanceReport();
      const mobileReport = mobileEcosystem.generateMobileReport();
      
      const metricsData: MetricCard[] = [
        {
          id: 'documents',
          title: 'Documents',
          value: 47,
          change: { value: 12, type: 'increase' },
          icon: '📚',
          color: '#3B82F6',
          trend: [20, 35, 28, 42, 47]
        },
        {
          id: 'collaborations',
          title: 'Active Collaborations',
          value: 8,
          change: { value: 3, type: 'increase' },
          icon: '🤝',
          color: '#10B981',
          trend: [3, 5, 4, 6, 8]
        },
        {
          id: 'performance',
          title: 'Performance Score',
          value: `${deviceMetrics.mobile_optimization_score}%`,
          change: { 
            value: deviceMetrics.mobile_optimization_score - 75, 
            type: deviceMetrics.mobile_optimization_score > 75 ? 'increase' : 'decrease' 
          },
          icon: '⚡',
          color: '#F59E0B',
          trend: [70, 75, 78, 82, deviceMetrics.mobile_optimization_score]
        },
        {
          id: 'sync-status',
          title: 'Sync Status',
          value: mobileEcosystem.network.isOnline ? 'Online' : 'Offline',
          icon: mobileEcosystem.network.isOnline ? '🟢' : '🔴',
          color: mobileEcosystem.network.isOnline ? '#10B981' : '#EF4444'
        }
      ];
      
      setMetrics(metricsData);

      // Load recent items
      const recent: RecentItem[] = [
        {
          id: '1',
          title: 'Project Roadmap 2024',
          subtitle: 'Updated 5 minutes ago',
          timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          type: 'document',
          status: 'draft'
        },
        {
          id: '2',
          title: 'Team Meeting Notes',
          subtitle: 'Shared with 5 people',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: 'note',
          status: 'shared'
        },
        {
          id: '3',
          title: 'Mobile UI Review',
          subtitle: 'In collaboration',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          type: 'collaboration',
          status: 'published'
        }
      ];
      
      setRecentItems(recent);

      // Load notifications
      const notifs: NotificationItem[] = [
        {
          id: '1',
          title: 'Offline Changes Synced',
          message: '3 documents synchronized successfully',
          type: 'success',
          timestamp: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'Low Battery Mode',
          message: 'Performance optimizations enabled',
          type: 'warning',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          read: false
        }
      ];
      
      if (mobileEcosystem.performance.batteryLevel !== null && 
          mobileEcosystem.performance.batteryLevel < 20) {
        notifs.unshift({
          id: 'battery-warning',
          title: 'Low Battery Detected',
          message: `Battery at ${mobileEcosystem.performance.batteryLevel}%. Power saving mode activated.`,
          type: 'warning',
          timestamp: new Date().toISOString(),
          read: false
        });
      }
      
      setNotifications(notifs);

    } catch (error) {
      console.error('[Mobile Dashboard] Initialization failed:', error);
    } finally {
      setRefreshing(false);
    }
  }, [userId, workspaceId, mobileEcosystem]);

  // Action handlers
  const handleNewDocument = useCallback(async () => {
    const operation = {
      type: 'create' as const,
      endpoint: '/api/documents',
      data: {
        title: 'Untitled Document',
        content: '',
        created_at: new Date().toISOString()
      },
      priority: 'medium' as const
    };

    const result = await mobileEcosystem.queueOfflineOperation(operation);
    console.log('[Mobile Dashboard] New document operation queued:', result);
  }, [mobileEcosystem]);

  const handleVoiceNote = useCallback(async () => {
    if (!mobileEcosystem.features.microphone) {
      await showNotification('Microphone not available on this device');
      return;
    }

    try {
      // Request microphone permission and start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Mobile Dashboard] Voice recording started');
      
      // In a real implementation, you would handle the recording here
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        showNotification('Voice note recorded successfully');
      }, 3000);
      
    } catch (error) {
      console.error('[Mobile Dashboard] Voice recording failed:', error);
      await showNotification('Failed to access microphone');
    }
  }, [mobileEcosystem.features.microphone]);

  const handleCameraScan = useCallback(async () => {
    if (!mobileEcosystem.features.camera) {
      await showNotification('Camera not available on this device');
      return;
    }

    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('[Mobile Dashboard] Camera scan started');
      
      // In a real implementation, you would handle the camera capture here
      setTimeout(() => {
        stream.getTracks().forEach(track => track.stop());
        showNotification('Document scanned successfully');
      }, 2000);
      
    } catch (error) {
      console.error('[Mobile Dashboard] Camera scan failed:', error);
      await showNotification('Failed to access camera');
    }
  }, [mobileEcosystem.features.camera]);

  const handleOfflineSync = useCallback(async () => {
    if (!mobileEcosystem.network.isOnline) {
      await showNotification('Cannot sync while offline');
      return;
    }

    setRefreshing(true);
    try {
      await mobileEcosystem.syncOfflineOperations();
      await showNotification('All changes synchronized successfully');
    } catch (error) {
      console.error('[Mobile Dashboard] Sync failed:', error);
      await showNotification('Sync failed. Please try again.');
    } finally {
      setRefreshing(false);
    }
  }, [mobileEcosystem]);

  const handleSearch = useCallback(() => {
    // Navigate to search page
    console.log('[Mobile Dashboard] Opening search');
  }, []);

  const handleCollaboration = useCallback(() => {
    // Navigate to collaboration page
    console.log('[Mobile Dashboard] Opening collaboration');
  }, []);

  const showNotification = useCallback(async (message: string) => {
    if (mobileEcosystem.features.notifications) {
      await mobileEcosystem.sendPushNotification({
        title: 'Notion Spark',
        body: message,
        icon: '/icon-192x192.png'
      });
    } else {
      // Fallback to in-app notification
      const newNotification: NotificationItem = {
        id: Date.now().toString(),
        title: 'Notion Spark',
        message,
        type: 'info',
        timestamp: new Date().toISOString(),
        read: false
      };
      
      setNotifications(prev => [newNotification, ...prev]);
    }
  }, [mobileEcosystem]);

  const handleInstallPWA = useCallback(async () => {
    const success = await mobileEcosystem.installPWA();
    if (success) {
      setShowInstallPrompt(false);
      await showNotification('App installed successfully!');
    }
  }, [mobileEcosystem, showNotification]);

  const handleRefresh = useCallback(async () => {
    await initializeDashboard();
  }, [initializeDashboard]);

  const getAdaptiveStyles = () => {
    const quality = mobileEcosystem.getAdaptiveQuality();
    const { deviceInfo } = mobileEcosystem;
    
    return {
      container: {
        minHeight: '100vh',
        background: quality === 'low' ? '#f8f9fa' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        animation: quality === 'high' ? 'fadeIn 0.3s ease-in-out' : 'none',
        paddingTop: deviceInfo.safeAreaInsets.top,
        paddingBottom: deviceInfo.safeAreaInsets.bottom,
      },
      card: {
        background: '#ffffff',
        borderRadius: quality === 'high' ? '16px' : '8px',
        boxShadow: quality === 'high' ? '0 10px 30px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.1)',
        transition: quality === 'high' ? 'all 0.2s ease' : 'none',
      },
      animation: quality !== 'low'
    };
  };

  const styles = getAdaptiveStyles();

  return (
    <div style={styles.container} className="mobile-dashboard">
      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="install-prompt" style={styles.card}>
          <div className="install-content">
            <h3>Install Notion Spark</h3>
            <p>Get the full app experience with offline access and push notifications</p>
            <div className="install-actions">
              <button onClick={handleInstallPWA} className="install-btn">
                Install App
              </button>
              <button onClick={() => setShowInstallPrompt(false)} className="dismiss-btn">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="dashboard-header" style={styles.card}>
        <div className="header-content">
          <h1>Good {getTimeOfDay()}</h1>
          <p>Ready to be productive?</p>
          
          {/* Status indicators */}
          <div className="status-indicators">
            <div className={`status-indicator ${mobileEcosystem.network.isOnline ? 'online' : 'offline'}`}>
              {mobileEcosystem.network.isOnline ? '🟢' : '🔴'} 
              {mobileEcosystem.network.isOnline ? 'Online' : 'Offline'}
            </div>
            
            {mobileEcosystem.performance.batteryLevel !== null && (
              <div className="battery-indicator">
                🔋 {mobileEcosystem.performance.batteryLevel}%
              </div>
            )}
            
            {mobileEcosystem.offlineQueue.length > 0 && (
              <div className="sync-indicator">
                🔄 {mobileEcosystem.offlineQueue.length} pending
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="refresh-btn"
        >
          {refreshing ? '⟳' : '↻'}
        </button>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={styles.card}>
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              disabled={action.disabled}
              className={`action-card ${action.disabled ? 'disabled' : ''}`}
              style={{
                ...styles.card,
                borderLeft: `4px solid ${action.color}`,
                opacity: action.disabled ? 0.5 : 1
              }}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-content">
                <h3>{action.title}</h3>
                <p>{action.subtitle}</p>
              </div>
              {action.badge && (
                <div className="action-badge" style={{ backgroundColor: action.color }}>
                  {action.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="metrics-section" style={styles.card}>
        <h2>Dashboard Metrics</h2>
        <div className="metrics-grid">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              className="metric-card"
              style={{
                ...styles.card,
                borderTop: `3px solid ${metric.color}`
              }}
            >
              <div className="metric-header">
                <span className="metric-icon">{metric.icon}</span>
                <span className="metric-title">{metric.title}</span>
              </div>
              
              <div className="metric-value">{metric.value}</div>
              
              {metric.change && (
                <div className={`metric-change ${metric.change.type}`}>
                  {metric.change.type === 'increase' ? '↗' : '↘'} 
                  {Math.abs(metric.change.value)}
                </div>
              )}
              
              {metric.trend && styles.animation && (
                <div className="metric-trend">
                  {/* Simple trend visualization */}
                  <svg width="60" height="20" viewBox="0 0 60 20">
                    <polyline
                      points={metric.trend.map((value, index) => 
                        `${index * 15},${20 - (value / Math.max(...metric.trend)) * 15}`
                      ).join(' ')}
                      fill="none"
                      stroke={metric.color}
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Items */}
      <div className="recent-section" style={styles.card}>
        <h2>Recent Activity</h2>
        <div className="recent-items">
          {recentItems.map((item) => (
            <div key={item.id} className="recent-item" style={styles.card}>
              <div className="item-icon">
                {item.type === 'document' && '📄'}
                {item.type === 'note' && '📝'}
                {item.type === 'task' && '✅'}
                {item.type === 'collaboration' && '👥'}
              </div>
              
              <div className="item-content">
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
                <small>{formatRelativeTime(item.timestamp)}</small>
              </div>
              
              <div className={`item-status ${item.status}`}>
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-section" style={styles.card}>
          <h2>Notifications</h2>
          <div className="notifications-list">
            {notifications.slice(0, 3).map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${notification.type} ${notification.read ? 'read' : 'unread'}`}
                style={styles.card}
              >
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <small>{formatRelativeTime(notification.timestamp)}</small>
                </div>
                
                <button
                  onClick={() => setNotifications(prev => 
                    prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
                  )}
                  className="notification-dismiss"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Info (Debug) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info" style={styles.card}>
          <h3>Debug Info</h3>
          <div className="debug-metrics">
            <p>Device: {mobileEcosystem.deviceInfo.type} ({mobileEcosystem.deviceInfo.os})</p>
            <p>FPS: {mobileEcosystem.performance.frameRate}</p>
            <p>Memory: {Math.round(mobileEcosystem.performance.memoryUsage * 100)}%</p>
            <p>Network: {mobileEcosystem.network.effectiveType}</p>
            <p>Quality: {mobileEcosystem.getAdaptiveQuality()}</p>
            <p>Offline Queue: {mobileEcosystem.offlineQueue.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export default MobileDashboardAdvanced; 