// Re-export everything from the modularized components
export { SmartCacheSystem } from './SmartCacheCore';
export { useSmartCache, useCachedData } from './SmartCacheHooks';
export { CacheProvider, CacheMonitor } from './SmartCacheProvider';
export type { CacheEntry, CacheStats, CacheConfig, EvictionStrategy } from './SmartCacheCore';

// Default export for compatibility
export { SmartCacheSystem as default } from './SmartCacheCore'; 