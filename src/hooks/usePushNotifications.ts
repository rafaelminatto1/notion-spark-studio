import { useState, useEffect, useCallback } from 'react';
import { useSSRSafeValue } from './useSSRSafe';
import { useProductionAnalytics } from './useProductionAnalytics';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
  vapidKey?: string;
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

interface ScheduledNotification {
  id: string;
  options: PushNotificationOptions;
  scheduledAt: number;
  recurring?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval?: number;
  };
  conditions?: {
    userInactive?: number; // milliseconds
    pageNotVisited?: string[];
    featureNotUsed?: string[];
  };
}

interface NotificationPreferences {
  enabled: boolean;
  types: {
    reminders: boolean;
    updates: boolean;
    social: boolean;
    marketing: boolean;
    system: boolean;
  };
  schedule: {
    quietHoursStart: number; // 0-23
    quietHoursEnd: number; // 0-23
    timezone: string;
    daysEnabled: boolean[]; // [sun, mon, tue, wed, thu, fri, sat]
  };
  frequency: {
    maxPerDay: number;
    maxPerWeek: number;
    minInterval: number; // minutes between notifications
  };
}

class PushNotificationManager {
  private static instance: PushNotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private preferences: NotificationPreferences;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private lastNotificationTime = 0;
  private notificationCount = { daily: 0, weekly: 0 };
  private userActivity: { lastActive: number; pageViews: string[]; featuresUsed: string[] };

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.userActivity = {
      lastActive: Date.now(),
      pageViews: [],
      featuresUsed: []
    };
    
    this.loadPreferences();
    this.initializeServiceWorker();
    this.setupActivityTracking();
    this.scheduleEngagementNotifications();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: false,
      types: {
        reminders: true,
        updates: true,
        social: true,
        marketing: false,
        system: true
      },
      schedule: {
        quietHoursStart: 22,
        quietHoursEnd: 8,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        daysEnabled: [true, true, true, true, true, true, true]
      },
      frequency: {
        maxPerDay: 5,
        maxPerWeek: 15,
        minInterval: 30
      }
    };
  }

  private loadPreferences() {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem('notification-preferences');
        if (stored) {
          this.preferences = { ...this.getDefaultPreferences(), ...JSON.parse(stored) };
        }
      } catch (error) {
        console.warn('Failed to load notification preferences:', error);
      }
    }
  }

  private savePreferences() {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
      } catch (error) {
        console.warn('Failed to save notification preferences:', error);
      }
    }
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
        console.log('Push notifications service worker ready');
      } catch (error) {
        console.warn('Service worker not available for push notifications:', error);
      }
    }
  }

  private setupActivityTracking() {
    if (typeof window === 'undefined') return;

    // Track user activity
    const updateActivity = () => {
      this.userActivity.lastActive = Date.now();
    };

    ['click', 'keydown', 'scroll', 'mousemove'].forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    // Track page views
    window.addEventListener('popstate', () => {
      const page = window.location.pathname;
      if (!this.userActivity.pageViews.includes(page)) {
        this.userActivity.pageViews.push(page);
      }
    });

    // Reset daily counters
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.notificationCount.daily = 0;
      }
    }, 60000); // Check every minute
  }

  private scheduleEngagementNotifications() {
    // Daily reminder for inactive users
    this.scheduleNotification({
      id: 'daily-engagement',
      options: {
        title: '🎯 Continue sua jornada!',
        body: 'Você tem ideias esperando para serem organizadas. Que tal dar uma olhada?',
        icon: '/icons/reminder.png',
        tag: 'engagement',
        data: { type: 'engagement', action: 'open_app' }
      },
      scheduledAt: Date.now() + 24 * 60 * 60 * 1000,
      recurring: { type: 'daily' },
      conditions: {
        userInactive: 24 * 60 * 60 * 1000, // 24 hours
        pageNotVisited: ['/dashboard']
      }
    });

    // Weekly feature discovery
    this.scheduleNotification({
      id: 'weekly-feature',
      options: {
        title: '✨ Descubra novos recursos!',
        body: 'Explore funcionalidades que podem revolucionar sua produtividade.',
        icon: '/icons/feature.png',
        tag: 'feature-discovery',
        actions: [
          { action: 'explore', title: 'Explorar', icon: '/icons/explore.png' },
          { action: 'later', title: 'Mais tarde' }
        ],
        data: { type: 'feature-discovery', features: ['ai-tagging', 'graph-view', 'collaboration'] }
      },
      scheduledAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
      recurring: { type: 'weekly' },
      conditions: {
        featureNotUsed: ['ai-tagging', 'graph-view']
      }
    });

    // Motivational boost for active users
    this.scheduleNotification({
      id: 'motivation-boost',
      options: {
        title: '🚀 Você está indo muito bem!',
        body: 'Já organizou várias ideias hoje. Continue assim!',
        icon: '/icons/celebration.png',
        tag: 'motivation',
        data: { type: 'motivation', achievement: 'active-user' }
      },
      scheduledAt: Date.now() + 4 * 60 * 60 * 1000, // 4 hours
      conditions: {
        featureNotUsed: [] // For active users only
      }
    });
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      this.preferences.enabled = true;
      this.savePreferences();
    }

    return permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initializeServiceWorker();
    }

    if (!this.registration) {
      throw new Error('Service worker not available');
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private isWithinQuietHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const { quietHoursStart, quietHoursEnd } = this.preferences.schedule;

    if (quietHoursStart < quietHoursEnd) {
      return hour >= quietHoursStart && hour < quietHoursEnd;
    } else {
      return hour >= quietHoursStart || hour < quietHoursEnd;
    }
  }

  private canSendNotification(type: keyof NotificationPreferences['types']): boolean {
    if (!this.preferences.enabled || !this.preferences.types[type]) {
      return false;
    }

    if (this.isWithinQuietHours()) {
      return false;
    }

    const now = Date.now();
    const timeSinceLastNotification = now - this.lastNotificationTime;
    const minInterval = this.preferences.frequency.minInterval * 60 * 1000;

    if (timeSinceLastNotification < minInterval) {
      return false;
    }

    if (this.notificationCount.daily >= this.preferences.frequency.maxPerDay) {
      return false;
    }

    if (this.notificationCount.weekly >= this.preferences.frequency.maxPerWeek) {
      return false;
    }

    const today = new Date().getDay();
    if (!this.preferences.schedule.daysEnabled[today]) {
      return false;
    }

    return true;
  }

  private checkConditions(conditions?: ScheduledNotification['conditions']): boolean {
    if (!conditions) return true;

    const now = Date.now();

    // Check user inactivity
    if (conditions.userInactive) {
      const timeSinceActive = now - this.userActivity.lastActive;
      if (timeSinceActive < conditions.userInactive) {
        return false;
      }
    }

    // Check page visits
    if (conditions.pageNotVisited?.length) {
      const hasVisited = conditions.pageNotVisited.some(page => 
        this.userActivity.pageViews.includes(page)
      );
      if (hasVisited) {
        return false;
      }
    }

    // Check feature usage
    if (conditions.featureNotUsed?.length) {
      const hasUsed = conditions.featureNotUsed.some(feature =>
        this.userActivity.featuresUsed.includes(feature)
      );
      if (hasUsed) {
        return false;
      }
    }

    return true;
  }

  scheduleNotification(notification: ScheduledNotification) {
    this.scheduledNotifications.set(notification.id, notification);

    const delay = notification.scheduledAt - Date.now();
    
    if (delay > 0) {
      setTimeout(() => {
        this.processScheduledNotification(notification.id);
      }, delay);
    }
  }

  private processScheduledNotification(id: string) {
    const notification = this.scheduledNotifications.get(id);
    if (!notification) return;

    if (this.checkConditions(notification.conditions)) {
      this.sendNotification(notification.options, 'reminders');
    }

    // Handle recurring notifications
    if (notification.recurring) {
      let nextSchedule = 0;
      const now = Date.now();

      switch (notification.recurring.type) {
        case 'daily':
          nextSchedule = now + 24 * 60 * 60 * 1000;
          break;
        case 'weekly':
          nextSchedule = now + 7 * 24 * 60 * 60 * 1000;
          break;
        case 'monthly':
          nextSchedule = now + 30 * 24 * 60 * 60 * 1000;
          break;
      }

      if (nextSchedule > 0) {
        const recurringNotification = {
          ...notification,
          scheduledAt: nextSchedule
        };
        this.scheduleNotification(recurringNotification);
      }
    }
  }

  sendNotification(
    options: PushNotificationOptions,
    type: keyof NotificationPreferences['types'] = 'system'
  ): Promise<Notification | null> {
    return new Promise((resolve, reject) => {
      if (!this.canSendNotification(type)) {
        resolve(null);
        return;
      }

      if (Notification.permission !== 'granted') {
        reject(new Error('Notification permission not granted'));
        return;
      }

      try {
        const notification = new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icons/default-notification.png',
          badge: options.badge || '/icons/badge.png',
          image: options.image,
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction,
          silent: options.silent,
          timestamp: options.timestamp || Date.now(),
          actions: options.actions
        });

        notification.onclick = (event) => {
          event.preventDefault();
          window.focus();
          
          if (options.data?.action === 'open_app') {
            window.location.href = '/dashboard';
          }
          
          notification.close();
        };

        this.lastNotificationTime = Date.now();
        this.notificationCount.daily++;
        this.notificationCount.weekly++;

        resolve(notification);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Track feature usage for conditional notifications
  trackFeatureUsage(featureName: string) {
    if (!this.userActivity.featuresUsed.includes(featureName)) {
      this.userActivity.featuresUsed.push(featureName);
    }
  }

  // Update preferences
  updatePreferences(updates: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<void> {
    if (!this.registration) return;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
      }

      this.preferences.enabled = false;
      this.savePreferences();
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
    }
  }
}

export const usePushNotifications = (options: PushNotificationOptions = {}) => {
  const [notificationManager] = useState(() => 
    typeof window !== 'undefined' ? PushNotificationManager.getInstance() : null
  );
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const isClient = useSSRSafeValue(true, false);
  const { trackFeatureUsage } = useProductionAnalytics();

  useEffect(() => {
    if (!isClient || !notificationManager) return;

    setPermission(Notification.permission);
    setPreferences(notificationManager.getPreferences());

    // Check if already subscribed
    navigator.serviceWorker.ready.then(registration => {
      return registration.pushManager.getSubscription();
    }).then(subscription => {
      setIsSubscribed(!!subscription);
    }).catch(console.warn);
  }, [isClient, notificationManager]);

  const checkNotificationSupport = useCallback(() => {
    if (!('Notification' in window)) {
      console.warn('Browser não suporta notificações');
      return false;
    }
    
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker não suportado');
      return false;
    }
    
    return true;
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!checkNotificationSupport()) return false;

    try {
      let permission = Notification.permission;
      
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      
      const granted = permission === 'granted';
      setPermission(permission);
      
      if (granted) {
        await notificationManager?.unsubscribe();
        await notificationManager?.initializeServiceWorker();
        trackFeatureUsage('push-notifications-permission', undefined, granted);
      } else {
        trackFeatureUsage('push-notifications-permission', undefined, granted);
      }
      
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }, [checkNotificationSupport, notificationManager, trackFeatureUsage]);

  const subscribe = useCallback(async () => {
    if (!notificationManager) return null;

    try {
      const subscription = await notificationManager.subscribeToPush();
      setIsSubscribed(!!subscription);
      trackFeatureUsage('push-notifications-subscribe', undefined, !!subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }, [notificationManager, trackFeatureUsage]);

  const sendNotification = useCallback(async (
    options: PushNotificationOptions,
    type?: keyof NotificationPreferences['types']
  ) => {
    if (!notificationManager) return null;

    try {
      const notification = await notificationManager.sendNotification(options, type);
      trackFeatureUsage('push-notifications-send', undefined, !!notification);
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  }, [notificationManager, trackFeatureUsage]);

  const updatePreferences = useCallback((updates: Partial<NotificationPreferences>) => {
    if (!notificationManager) return;

    notificationManager.updatePreferences(updates);
    setPreferences(notificationManager.getPreferences());
    trackFeatureUsage('push-notifications-preferences');
  }, [notificationManager, trackFeatureUsage]);

  const unsubscribe = useCallback(async () => {
    if (!notificationManager) return;

    await notificationManager.unsubscribe();
    setIsSubscribed(false);
    trackFeatureUsage('push-notifications-unsubscribe');
  }, [notificationManager, trackFeatureUsage]);

  const trackFeature = useCallback((featureName: string) => {
    notificationManager?.trackFeatureUsage(featureName);
  }, [notificationManager]);

  const scheduleNotification = useCallback((notification: ScheduledNotification) => {
    notificationManager?.scheduleNotification(notification);
    trackFeatureUsage('push-notifications-schedule');
  }, [notificationManager, trackFeatureUsage]);

  const setupServiceWorker = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        registration.addEventListener('updatefound', () => {
          console.log('Atualização do Service Worker encontrada');
        });

        // Configurar push manager se disponível
        if ('PushManager' in window && registration.pushManager) {
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(options.vapidKey || '')
          });
          
          console.log('Push subscription criada:', subscription);
          setIsSubscribed(true);
        }
        
        notificationManager?.initializeServiceWorker();
      }
    } catch (error) {
      console.error('Erro ao configurar Service Worker:', error);
    }
  }, [options.vapidKey, notificationManager]);

  const manageCampaigns = useCallback(() => {
    if (!isSubscribed || notificationManager?.scheduledNotifications.size === 0) return;

    const now = Date.now();
    
    notificationManager?.scheduledNotifications.forEach((notification, id) => {
      if (!notification.recurring?.type) return;

      // Verificar triggers
      if (notification.recurring.type === 'daily' && now - notification.scheduledAt > 24 * 60 * 60 * 1000) {
        scheduleNotification(notification);
      } else if (notification.recurring.type === 'weekly' && now - notification.scheduledAt > 7 * 24 * 60 * 60 * 1000) {
        scheduleNotification(notification);
      } else if (notification.recurring.type === 'monthly' && now - notification.scheduledAt > 30 * 24 * 60 * 60 * 1000) {
        scheduleNotification(notification);
      }
    });
  }, [isSubscribed, notificationManager, scheduleNotification]);

  const shouldTriggerCampaign = useCallback((
    trigger: ScheduledNotification, 
    now: number
  ): boolean => {
    if (!trigger.recurring) return false;

    const scheduledAt = trigger.scheduledAt;
    const type = trigger.recurring.type;

    if (type === 'daily' && now - scheduledAt > 24 * 60 * 60 * 1000) return true;
    if (type === 'weekly' && now - scheduledAt > 7 * 24 * 60 * 60 * 1000) return true;
    if (type === 'monthly' && now - scheduledAt > 30 * 24 * 60 * 60 * 1000) return true;

    return false;
  }, []);

  const trackBehavior = useCallback((action: string, metadata?: any) => {
    if (!options.enableBehaviorTracking) return;

    const event: BehaviorEvent = {
      action,
      timestamp: Date.now(),
      metadata: {
        page: window.location.pathname,
        userAgent: navigator.userAgent.substring(0, 100),
        ...metadata
      }
    };

    notificationManager?.trackFeatureUsage(action);

    // Processar campanhas baseadas em comportamento
    manageCampaigns();
  }, [options.enableBehaviorTracking, manageCampaigns]);

  const calculateAverageSessionDuration = useCallback((events: BehaviorEvent[]): number => {
    if (events.length < 2) return 0;
    
    const sessionGaps = [];
    for (let i = 1; i < events.length; i++) {
      const gap = events[i].timestamp - events[i-1].timestamp;
      if (gap < 30 * 60 * 1000) { // Considerar mesmo sessão se < 30min
        sessionGaps.push(gap);
      }
    }
    
    return sessionGaps.length > 0 
      ? sessionGaps.reduce((sum, gap) => sum + gap, 0) / sessionGaps.length 
      : 0;
  }, []);

  useEffect(() => {
    if (checkNotificationSupport() && permission === 'granted') {
      setupServiceWorker();
    }
  }, [checkNotificationSupport, setupServiceWorker, permission]);

  return {
    permission,
    isSubscribed,
    preferences,
    isSupported: isClient && 'Notification' in window && 'serviceWorker' in navigator,
    requestPermission,
    subscribe,
    unsubscribe,
    sendNotification,
    updatePreferences,
    trackFeature,
    scheduleNotification,
    checkNotificationSupport,
    trackBehavior
  };
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
} 