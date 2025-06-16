// Notion Spark Studio - Advanced Service Worker
// Version: 4.0.0

const CACHE_NAME = 'notion-spark-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';
const IMAGE_CACHE = 'images-v4.0.0';

// Recursos críticos para cache imediato
const CRITICAL_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json'
];

// Estratégias de cache por tipo de recurso
const CACHE_STRATEGIES = {
  images: 'cache-first',
  apis: 'network-first', 
  chunks: 'stale-while-revalidate',
  fonts: 'cache-first',
  static: 'cache-first'
};

// Resource patterns
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other static assets
];

const API_PATTERNS = [
  /\/api\//,
  /\/trpc\//,
  /\/auth\//
];

const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i
];

const FONT_PATTERNS = [
  /\.(?:woff|woff2|ttf|eot)$/i,
  /fonts\.googleapis\.com/,
  /fonts\.gstatic\.com/
];

// Performance monitoring
let performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  errors: 0,
  avgResponseTime: 0
};

// Advanced cache management
class CacheManager {
  static async getCacheStrategy(request) {
    const url = new URL(request.url);
    
    // API requests - Network first with cache fallback
    if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return CACHE_STRATEGIES.apis;
    }
    
    // Images - Cache first with network fallback
    if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return CACHE_STRATEGIES.images;
    }
    
    // Static resources - Cache first
    if (STATIC_RESOURCES.includes(url.pathname) || 
        url.pathname.includes('/_next/static/') ||
        FONT_PATTERNS.some(pattern => pattern.test(url.href))) {
      return CACHE_STRATEGIES.static;
    }
    
    // Dynamic content - Stale while revalidate
    return CACHE_STRATEGIES.chunks;
  }

  static getCacheName(request) {
    const url = new URL(request.url);
    
    if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return API_CACHE;
    }
    
    if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return IMAGE_CACHE;
    }
    
    if (STATIC_RESOURCES.includes(url.pathname) || 
        url.pathname.includes('/_next/static/')) {
      return STATIC_CACHE;
    }
    
    return DYNAMIC_CACHE;
  }

  static async cleanupOldCaches() {
    const cacheNames = await caches.keys();
    const validCaches = [CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, IMAGE_CACHE];
    
    return Promise.all(
      cacheNames
        .filter(cacheName => !validCaches.includes(cacheName))
        .map(cacheName => caches.delete(cacheName))
    );
  }

  static async limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
      // Remove oldest entries
      const keysToDelete = keys.slice(0, keys.length - maxItems);
      await Promise.all(keysToDelete.map(key => cache.delete(key)));
    }
  }
}

// Network strategies implementation
class NetworkStrategies {
  static async cacheFirst(request, cacheName) {
    const startTime = performance.now();
    
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        performanceMetrics.cacheHits++;
        return cachedResponse;
      }
      
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      
      performanceMetrics.networkRequests++;
      return networkResponse;
      
    } catch (error) {
      performanceMetrics.errors++;
      // Try to serve from cache as fallback
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      return cachedResponse || new Response('Offline', { status: 503 });
    } finally {
      const endTime = performance.now();
      this.updateResponseTime(endTime - startTime);
    }
  }

  static async networkFirst(request, cacheName) {
    const startTime = performance.now();
    
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      
      performanceMetrics.networkRequests++;
      return networkResponse;
      
    } catch (error) {
      performanceMetrics.errors++;
      // Fallback to cache
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        performanceMetrics.cacheHits++;
        return cachedResponse;
      }
      
      return new Response('Offline', { status: 503 });
    } finally {
      const endTime = performance.now();
      this.updateResponseTime(endTime - startTime);
    }
  }

  static async staleWhileRevalidate(request, cacheName) {
    const startTime = performance.now();
    const cache = await caches.open(cacheName);
    
    // Get from cache immediately
    const cachedResponse = await cache.match(request);
    
    // Update cache in background
    const networkUpdate = fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    }).catch(() => {
      performanceMetrics.errors++;
    });
    
    performanceMetrics.networkRequests++;
    
    if (cachedResponse) {
      performanceMetrics.cacheHits++;
      // Return cached version immediately, update in background
      return cachedResponse;
    }
    
    // Wait for network if no cache
    try {
      const endTime = performance.now();
      this.updateResponseTime(endTime - startTime);
      return await networkUpdate;
    } catch {
      return new Response('Offline', { status: 503 });
    }
  }

  static updateResponseTime(responseTime) {
    performanceMetrics.avgResponseTime = 
      (performanceMetrics.avgResponseTime + responseTime) / 2;
  }
}

// Background sync for offline actions
class BackgroundSync {
  static async queueRequest(request, data) {
    const queue = await this.getQueue();
    queue.push({ request: request.url, data, timestamp: Date.now() });
    await this.saveQueue(queue);
  }

  static async getQueue() {
    try {
      const cache = await caches.open(DYNAMIC_CACHE);
      const response = await cache.match('/offline-queue');
      if (response) {
        return await response.json();
      }
    } catch (error) {
      console.warn('Error reading offline queue:', error);
    }
    return [];
  }

  static async saveQueue(queue) {
    try {
      const cache = await caches.open(DYNAMIC_CACHE);
      const response = new Response(JSON.stringify(queue));
      await cache.put('/offline-queue', response);
    } catch (error) {
      console.warn('Error saving offline queue:', error);
    }
  }

  static async processQueue() {
    const queue = await this.getQueue();
    const processedItems = [];
    
    for (const item of queue) {
      try {
        await fetch(item.request, {
          method: 'POST',
          body: JSON.stringify(item.data),
          headers: {
            'Content-Type': 'application/json'
          }
        });
        processedItems.push(item);
      } catch (error) {
        // Keep item in queue if it fails
        console.warn('Failed to sync item:', error);
      }
    }
    
    // Remove processed items
    const remainingQueue = queue.filter(item => !processedItems.includes(item));
    await this.saveQueue(remainingQueue);
    
    return processedItems.length;
  }
}

// Push notification handler
class NotificationManager {
  static async showNotification(data) {
    const options = {
      body: data.body || 'Nova notificação',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: data.image,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Dispensar' }
      ],
      data: data,
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200]
    };

    return self.registration.showNotification(data.title || 'Notion Spark', options);
  }
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching critical resources');
        return cache.addAll(CRITICAL_RESOURCES);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Limpar caches antigos
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== API_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event with intelligent caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Determinar estratégia de cache
  let strategy = 'network-first';
  let cacheName = DYNAMIC_CACHE;
  
  if (request.destination === 'image') {
    strategy = CACHE_STRATEGIES.images;
    cacheName = STATIC_CACHE;
  } else if (url.pathname.startsWith('/api/')) {
    strategy = CACHE_STRATEGIES.apis;
    cacheName = API_CACHE;
  } else if (url.pathname.includes('chunk') || url.pathname.includes('.js')) {
    strategy = CACHE_STRATEGIES.chunks;
    cacheName = STATIC_CACHE;
  } else if (url.pathname.includes('.woff') || url.pathname.includes('.woff2')) {
    strategy = CACHE_STRATEGIES.fonts;
    cacheName = STATIC_CACHE;
  }
  
  event.respondWith(handleRequest(request, strategy, cacheName));
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(BackgroundSync.processQueue());
  }
});

// Push notification event
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  let data = {};
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data = { title: 'Notion Spark', body: event.data.text() };
    }
  }
  
  event.waitUntil(NotificationManager.showNotification(data));
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_STRATEGY':
      updateCacheStrategies(data.strategy);
      break;
      
    case 'PRELOAD_RESOURCES':
      preloadResources(data.resources);
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches();
      break;
  }
});

// Periodic cache cleanup
setInterval(() => {
  // Limit cache sizes
  CacheManager.limitCacheSize(DYNAMIC_CACHE, 50);
  CacheManager.limitCacheSize(API_CACHE, 100);
  CacheManager.limitCacheSize(IMAGE_CACHE, 200);
}, 60000); // Every minute

// Performance metrics reset
setInterval(() => {
  performanceMetrics = {
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    errors: 0,
    avgResponseTime: 0
  };
}, 3600000); // Every hour

console.log('Notion Spark Service Worker v4.0.0 loaded');

async function handleRequest(request, strategy, cacheName) {
  switch (strategy) {
    case 'cache-first':
      return NetworkStrategies.cacheFirst(request, cacheName);
      
    case 'network-first':
      return NetworkStrategies.networkFirst(request, cacheName);
      
    case 'stale-while-revalidate':
      return NetworkStrategies.staleWhileRevalidate(request, cacheName);
      
    default:
      return fetch(request);
  }
}

function updateCacheStrategies(newStrategies) {
  Object.assign(CACHE_STRATEGIES, newStrategies);
  console.log('[SW] Cache strategies updated:', CACHE_STRATEGIES);
}

async function preloadResources(resources) {
  console.log('[SW] Preloading resources:', resources);
  
  const cache = await caches.open(STATIC_CACHE);
  
  for (const resource of resources) {
    try {
      const response = await fetch(resource);
      if (response.ok) {
        await cache.put(resource, response);
        console.log('[SW] Preloaded:', resource);
      }
    } catch (error) {
      console.warn('[SW] Failed to preload:', resource, error);
    }
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
} 