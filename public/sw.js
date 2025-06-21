// Notion Spark Studio - Service Worker
// Advanced PWA Service Worker with Offline Sync and Push Notifications

const CACHE_NAME = 'notion-spark-v1.0.0';
const OFFLINE_URL = '/offline';
const SYNC_TAG = 'background-sync';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first', 
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// URLs to cache on install
const URLS_TO_CACHE = [
  '/',
  '/offline',
  '/dashboard',
  '/app.js',
  '/app.css',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// API endpoints for different strategies
const CACHE_CONFIG = {
  [CACHE_STRATEGIES.CACHE_FIRST]: [
    '/static/',
    '/assets/',
    '/icons/',
    '/images/',
    '.css',
    '.js',
    '.woff2',
    '.woff',
    '.ttf',
    '.png',
    '.jpg',
    '.jpeg',
    '.svg',
    '.webp'
  ],
  [CACHE_STRATEGIES.NETWORK_FIRST]: [
    '/api/user',
    '/api/settings',
    '/api/auth'
  ],
  [CACHE_STRATEGIES.STALE_WHILE_REVALIDATE]: [
    '/api/documents',
    '/api/notes',
    '/api/workspaces'
  ],
  [CACHE_STRATEGIES.NETWORK_ONLY]: [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/sync',
    '/api/analytics/events'
  ]
};

// Offline queue for failed requests
let offlineQueue = [];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential resources');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('[SW] Activation failed:', error);
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // DEBUG: Log para identificar problemas com recursos externos
  console.log('[DEBUG SW] Fetch interceptado:', {
    url: request.url,
    method: request.method,
    destination: request.destination,
    isExternal: !url.origin.includes(self.location.origin)
  });
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle offline POST/PUT/DELETE requests
    if (!navigator.onLine) {
      handleOfflineRequest(event);
      return;
    }
    return;
  }
  
  // CORREÇÃO: Tratar recursos externos (como Google Fonts) sem cache
  if (!url.origin.includes(self.location.origin)) {
    console.log('[DEBUG SW] Recurso externo detectado, fazendo fetch direto:', url.href);
    event.respondWith(
      fetch(request)
        .then(response => {
          console.log('[DEBUG SW] Fetch externo bem-sucedido:', response.status);
          return response;
        })
        .catch(error => {
          console.error('[DEBUG SW] Erro no fetch externo:', error);
          // Retornar uma resposta de fallback válida para CSS
          if (request.destination === 'style' || url.pathname.includes('.css')) {
            return new Response('/* External CSS failed to load */', {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'text/css' }
            });
          }
          throw error;
        })
    );
    return;
  }

  // Determine cache strategy para recursos internos
  const strategy = getCacheStrategy(url.pathname);
  
  event.respondWith(
    handleRequest(request, strategy)
      .catch((error) => {
        console.error('[SW] Fetch failed:', error);
        return getOfflineFallback(request);
      })
  );
});

// Determine appropriate cache strategy for URL
function getCacheStrategy(pathname) {
  for (const [strategy, patterns] of Object.entries(CACHE_CONFIG)) {
    if (patterns.some(pattern => pathname.includes(pattern))) {
      return strategy;
    }
  }
  
  // Default strategy for navigation requests
  if (pathname === '/' || pathname.startsWith('/app/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }
  
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

// Handle request based on strategy
async function handleRequest(request, strategy) {
  const cache = await caches.open(CACHE_NAME);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return handleCacheFirst(request, cache);
      
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return handleNetworkFirst(request, cache);
      
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return handleStaleWhileRevalidate(request, cache);
      
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
      
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cache.match(request);
      
    default:
      return handleNetworkFirst(request, cache);
  }
}

// Cache First Strategy
async function handleCacheFirst(request, cache) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw new Error(`Network failed and no cache available: ${error.message}`);
  }
}

// Network First Strategy
async function handleNetworkFirst(request, cache) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw new Error(`Network failed and no cache available: ${error.message}`);
  }
}

// Stale While Revalidate Strategy
async function handleStaleWhileRevalidate(request, cache) {
  const cachedResponse = cache.match(request);
  
  const networkResponsePromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.status === 200) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.warn('[SW] Network update failed:', error);
    });
  
  return cachedResponse || networkResponsePromise;
}

// Handle offline requests (POST/PUT/DELETE)
function handleOfflineRequest(event) {
  const { request } = event;
  
  // Queue the request for later sync
  const requestData = {
    id: Date.now() + Math.random().toString(36),
    url: request.url,
    method: request.method,
    headers: [...request.headers.entries()],
    body: request.body,
    timestamp: Date.now()
  };
  
  offlineQueue.push(requestData);
  
  // Store in IndexedDB for persistence
  storeOfflineRequest(requestData);
  
  // Return a synthetic response
  event.respondWith(
    new Response(
      JSON.stringify({
        success: false,
        message: 'Request queued for sync when online',
        requestId: requestData.id
      }),
      {
        status: 202,
        statusText: 'Accepted',
        headers: { 'Content-Type': 'application/json' }
      }
    )
  );
  
  // Register background sync
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    self.registration.sync.register(SYNC_TAG);
  }
}

// Store offline request in IndexedDB
async function storeOfflineRequest(requestData) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    await store.add(requestData);
    console.log('[SW] Offline request stored:', requestData.id);
  } catch (error) {
    console.error('[SW] Failed to store offline request:', error);
  }
}

// Open IndexedDB for offline storage
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('notion-spark-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('requests')) {
        const store = db.createObjectStore('requests', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

// Get offline fallback response
async function getOfflineFallback(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try to get cached version first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Check if it's a navigation request
  if (request.mode === 'navigate') {
    const offlineResponse = await cache.match(OFFLINE_URL);
    if (offlineResponse) {
      return offlineResponse;
    }
  }
  
  // Return generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'You are currently offline. Please check your connection.',
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Background Sync event
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncOfflineRequests());
  }
});

// Sync offline requests when back online
async function syncOfflineRequests() {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['requests'], 'readwrite');
    const store = transaction.objectStore('requests');
    const requests = await store.getAll();
    
    console.log(`[SW] Syncing ${requests.length} offline requests`);
    
    for (const requestData of requests) {
      try {
        // Reconstruct and send the request
        const response = await fetch(requestData.url, {
          method: requestData.method,
          headers: new Headers(requestData.headers),
          body: requestData.body
        });
        
        if (response.ok) {
          // Remove from offline storage
          await store.delete(requestData.id);
          console.log('[SW] Synced offline request:', requestData.id);
          
          // Notify client about successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                requestId: requestData.id,
                response: response.status
              });
            });
          });
        } else {
          console.warn('[SW] Sync failed for request:', requestData.id, response.status);
        }
      } catch (error) {
        console.error('[SW] Failed to sync request:', requestData.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  let notificationData = {
    title: 'Notion Spark Studio',
    body: 'You have new updates!',
    ...options
  };
  
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        image: data.image,
        data: { ...notificationData.data, ...data.data }
      };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();
  
  const action = event.action;
  const notification = event.notification;
  
  if (action === 'close') {
    return;
  }
  
  // Default action or 'explore' action
  const urlToOpen = notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message event for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'CACHE_URLS':
      cacheSpecificUrls(payload.urls).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
      
    case 'GET_OFFLINE_QUEUE':
      getOfflineQueueStatus().then((status) => {
        event.ports[0].postMessage(status);
      });
      break;
      
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

// Cache specific URLs
async function cacheSpecificUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  
  return cache.addAll(urls);
}

// Get offline queue status
async function getOfflineQueueStatus() {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['requests'], 'readonly');
    const store = transaction.objectStore('requests');
    const requests = await store.getAll();
    
    return {
      totalRequests: requests.length,
      pendingRequests: requests.filter(r => !r.synced).length,
      oldestRequest: requests.length > 0 ? Math.min(...requests.map(r => r.timestamp)) : null
    };
  } catch (error) {
    console.error('[SW] Failed to get offline queue status:', error);
    return { totalRequests: 0, pendingRequests: 0, oldestRequest: null };
  }
}

// Periodic sync for better reliability
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(syncOfflineRequests());
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker loaded successfully');

// Service Worker Analytics
function trackEvent(eventName, data = {}) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_ANALYTICS',
        event: eventName,
        data: {
          ...data,
          timestamp: Date.now(),
          swVersion: CACHE_NAME
        }
      });
    });
  });
}

// Track cache hits and misses
const originalCacheMatch = Cache.prototype.match;
Cache.prototype.match = function(request, options) {
  return originalCacheMatch.call(this, request, options).then(response => {
    if (response) {
      trackEvent('cache_hit', { url: request.url });
    } else {
      trackEvent('cache_miss', { url: request.url });
    }
    return response;
  });
}; 