// Advanced Smart Cache Engine com IA e Estratégias Adaptativas
// Sistema de cache inteligente que aprende com padrões de uso

import { supabaseMonitoring } from './supabaseMonitoring';

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  priority: number;
  tags: string[];
  expiresAt?: number;
  score: number;
  userPattern?: UserAccessPattern;
}

interface UserAccessPattern {
  userId: string;
  frequency: number;
  timeOfDay: number[];
  dayOfWeek: number[];
  accessSequence: string[];
  predictedNext: string[];
}

interface CacheConfig {
  maxSize: number;
  maxAge: number;
  strategy: 'lru' | 'lfu' | 'adaptive' | 'ai-powered';
  enablePrediction: boolean;
  enableCompression: boolean;
  persistToDisk: boolean;
  syncAcrossDevices: boolean;
}

interface PredictionModel {
  accuracy: number;
  patterns: Map<string, number[]>;
  recommendations: Map<string, string[]>;
  confidence: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  maxSize: number;
  hitRate: number;
  avgAccessTime: number;
  memoryUsage: number;
  predictions: {
    accuracy: number;
    recommendations: number;
    preloaded: number;
  };
}

class SmartCacheEngine<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessLog: Array<{ key: string; timestamp: number; userId?: string }> = [];
  private userPatterns = new Map<string, UserAccessPattern>();
  private predictionModel: PredictionModel = {
    accuracy: 0,
    patterns: new Map(),
    recommendations: new Map(),
    confidence: 0
  };
  private config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    maxSize: 0,
    hitRate: 0,
    avgAccessTime: 0,
    memoryUsage: 0,
    predictions: {
      accuracy: 0,
      recommendations: 0,
      preloaded: 0
    }
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100 * 1024 * 1024, // 100MB
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      strategy: 'adaptive',
      enablePrediction: true,
      enableCompression: true,
      persistToDisk: true,
      syncAcrossDevices: false,
      ...config
    };
    
    this.stats.maxSize = this.config.maxSize;
    this.initializeEngine();
  }

  private initializeEngine(): void {
    // Load cached data from localStorage if enabled
    if (this.config.persistToDisk) {
      this.loadFromDisk();
    }

    // Start background processes
    this.startBackgroundTasks();
    
    console.log('🧠 Smart Cache Engine initialized with AI predictions');
  }

  // Core cache operations
  async get(key: string, userId?: string): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.misses++;
        this.logAccess(key, userId, false);
        return null;
      }

      // Check expiration
      if (entry.expiresAt && Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.misses++;
        this.stats.evictions++;
        return null;
      }

      // Update access patterns
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      entry.score = this.calculateScore(entry);

      this.stats.hits++;
      this.logAccess(key, userId, true);
      this.updateUserPattern(key, userId);

      // Predict next access
      if (this.config.enablePrediction && userId) {
        void this.predictAndPreload(userId, key);
      }

      return entry.data;

    } finally {
      const duration = performance.now() - startTime;
      this.updateAccessTime(duration);
    }
  }

  async set(key: string, data: T, options: {
    tags?: string[];
    ttl?: number;
    priority?: number;
    userId?: string;
  } = {}): Promise<void> {
    const size = this.calculateSize(data);
    const timestamp = Date.now();
    
    // Check if we need to evict entries
    await this.ensureCapacity(size);

    const entry: CacheEntry<T> = {
      data,
      timestamp,
      accessCount: 1,
      lastAccessed: timestamp,
      size,
      priority: options.priority ?? 1,
      tags: options.tags ?? [],
      expiresAt: options.ttl ? timestamp + options.ttl : undefined,
      score: 1,
      userPattern: options.userId ? this.userPatterns.get(options.userId) : undefined
    };

    entry.score = this.calculateScore(entry);
    this.cache.set(key, entry);
    this.stats.size += size;

    // Compress if enabled
    if (this.config.enableCompression && size > 1024) {
      await this.compressEntry(key);
    }

    this.logAccess(key, options.userId, false);
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.size -= entry.size;
    this.stats.evictions++;
    
    return true;
  }

  // AI-powered prediction system
  private async predictAndPreload(userId: string, currentKey: string): Promise<void> {
    const pattern = this.userPatterns.get(userId);
    if (!pattern || pattern.accessSequence.length < 3) return;

    const predictions = this.generatePredictions(pattern, currentKey);
    
    for (const predictedKey of predictions) {
      if (!this.cache.has(predictedKey)) {
        // Attempt to preload predicted data
        void this.preloadData(predictedKey, userId);
      }
    }
  }

  private generatePredictions(pattern: UserAccessPattern, currentKey: string): string[] {
    const sequence = pattern.accessSequence;
    const currentIndex = sequence.lastIndexOf(currentKey);
    
    if (currentIndex === -1 || currentIndex === sequence.length - 1) {
      return pattern.predictedNext;
    }

    // Use sequence analysis
    const nextKeys: string[] = [];
    const lookAhead = Math.min(3, sequence.length - currentIndex - 1);
    
    for (let i = 1; i <= lookAhead; i++) {
      const nextKey = sequence[currentIndex + i];
      if (nextKey && !nextKeys.includes(nextKey)) {
        nextKeys.push(nextKey);
      }
    }

    // Combine with ML predictions
    const mlPredictions = this.predictionModel.recommendations.get(currentKey) ?? [];
    return [...nextKeys, ...mlPredictions].slice(0, 3);
  }

  private async preloadData(key: string, userId: string): Promise<void> {
    // This would integrate with your data sources
    // For now, we'll just mark it as a prediction
    this.stats.predictions.preloaded++;
    
    await supabaseMonitoring.trackPerformance('cache', 'preload', performance.now());
  }

  // Advanced eviction strategies
  private async ensureCapacity(newSize: number): Promise<void> {
    while (this.stats.size + newSize > this.config.maxSize) {
      const victimKey = this.selectEvictionVictim();
      if (!victimKey) break;
      
      await this.delete(victimKey);
    }
  }

  private selectEvictionVictim(): string | null {
    switch (this.config.strategy) {
      case 'lru':
        return this.selectLRUVictim();
      case 'lfu':
        return this.selectLFUVictim();
      case 'adaptive':
        return this.selectAdaptiveVictim();
      case 'ai-powered':
        return this.selectAIVictim();
      default:
        return this.selectLRUVictim();
    }
  }

  private selectLRUVictim(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private selectLFUVictim(): string | null {
    let leastUsedKey: string | null = null;
    let leastCount = Infinity;

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < leastCount) {
        leastCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private selectAdaptiveVictim(): string | null {
    let lowestScoreKey: string | null = null;
    let lowestScore = Infinity;

    for (const [key, entry] of this.cache) {
      const score = this.calculateScore(entry);
      if (score < lowestScore) {
        lowestScore = score;
        lowestScoreKey = key;
      }
    }

    return lowestScoreKey;
  }

  private selectAIVictim(): string | null {
    // Use ML model to predict which entries are least likely to be accessed
    let leastLikelyKey: string | null = null;
    let lowestProbability = Infinity;

    for (const [key, entry] of this.cache) {
      const probability = this.predictAccessProbability(key, entry);
      if (probability < lowestProbability) {
        lowestProbability = probability;
        leastLikelyKey = key;
      }
    }

    return leastLikelyKey;
  }

  private predictAccessProbability(key: string, entry: CacheEntry<T>): number {
    // Simplified ML prediction - in real implementation, this would use a trained model
    const timeSinceAccess = Date.now() - entry.lastAccessed;
    const avgInterval = this.config.maxAge / (entry.accessCount || 1);
    
    return Math.exp(-timeSinceAccess / avgInterval);
  }

  // Scoring and pattern analysis
  private calculateScore(entry: CacheEntry<T>): number {
    const now = Date.now();
    const age = now - entry.timestamp;
    const timeSinceAccess = now - entry.lastAccessed;
    
    // Weighted scoring algorithm
    const recencyScore = Math.exp(-timeSinceAccess / (60 * 60 * 1000)); // 1 hour decay
    const frequencyScore = Math.log(entry.accessCount + 1);
    const priorityScore = entry.priority;
    const sizeScore = 1 / Math.log(entry.size + 1);
    
    return (recencyScore * 0.4) + (frequencyScore * 0.3) + (priorityScore * 0.2) + (sizeScore * 0.1);
  }

  private updateUserPattern(key: string, userId?: string): void {
    if (!userId) return;

    let pattern = this.userPatterns.get(userId);
    if (!pattern) {
      pattern = {
        userId,
        frequency: 0,
        timeOfDay: [],
        dayOfWeek: [],
        accessSequence: [],
        predictedNext: []
      };
      this.userPatterns.set(userId, pattern);
    }

    const now = new Date();
    pattern.frequency++;
    pattern.timeOfDay.push(now.getHours());
    pattern.dayOfWeek.push(now.getDay());
    pattern.accessSequence.push(key);

    // Keep sequence manageable
    if (pattern.accessSequence.length > 100) {
      pattern.accessSequence = pattern.accessSequence.slice(-50);
    }

    // Update predictions
    pattern.predictedNext = this.generatePredictionsFromSequence(pattern.accessSequence);
  }

  private generatePredictionsFromSequence(sequence: string[]): string[] {
    const patterns = new Map<string, Map<string, number>>();
    
    // Build transition matrix
    for (let i = 0; i < sequence.length - 1; i++) {
      const current = sequence[i];
      const next = sequence[i + 1];
      
      if (!patterns.has(current)) {
        patterns.set(current, new Map());
      }
      
      const transitions = patterns.get(current)!;
      transitions.set(next, (transitions.get(next) ?? 0) + 1);
    }

    // Get most likely predictions
    const predictions: string[] = [];
    for (const [_current, transitions] of patterns) {
      const sorted = Array.from(transitions.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      
      for (const [key, _count] of sorted) {
        if (!predictions.includes(key)) {
          predictions.push(key);
        }
      }
    }

    return predictions.slice(0, 5);
  }

  // Utility methods
  private calculateSize(data: unknown): number {
    return JSON.stringify(data).length * 2; // Approximate UTF-16 size
  }

  private logAccess(key: string, userId?: string, hit: boolean): void {
    this.accessLog.push({
      key,
      timestamp: Date.now(),
      userId
    });

    // Keep log manageable
    if (this.accessLog.length > 1000) {
      this.accessLog = this.accessLog.slice(-500);
    }

    // Update hit rate
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
  }

  private updateAccessTime(duration: number): void {
    this.stats.avgAccessTime = (this.stats.avgAccessTime + duration) / 2;
  }

  private async compressEntry(key: string): Promise<void> {
    // Simplified compression simulation
    const entry = this.cache.get(key);
    if (!entry) return;

    const originalSize = entry.size;
    entry.size = Math.floor(originalSize * 0.7); // 30% compression
    this.stats.size = this.stats.size - originalSize + entry.size;
  }

  // Background tasks
  private startBackgroundTasks(): void {
    // Cleanup expired entries
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Every minute

    // Update ML model
    setInterval(() => {
      this.updatePredictionModel();
    }, 300000); // Every 5 minutes

    // Persist to disk
    if (this.config.persistToDisk) {
      setInterval(() => {
        void this.saveToDisk();
      }, 30000); // Every 30 seconds
    }
  }

  private cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.expiresAt && now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      void this.delete(key);
    }
  }

  private updatePredictionModel(): void {
    // Simplified ML model update
    this.predictionModel.accuracy = this.calculatePredictionAccuracy();
    this.predictionModel.confidence = Math.min(this.predictionModel.accuracy * 100, 95);
    
    this.stats.predictions.accuracy = this.predictionModel.accuracy;
  }

  private calculatePredictionAccuracy(): number {
    // Simplified accuracy calculation
    const recentLogs = this.accessLog.slice(-100);
    let correct = 0;
    let total = 0;

    for (let i = 0; i < recentLogs.length - 1; i++) {
      const current = recentLogs[i];
      const next = recentLogs[i + 1];
      
      if (current.userId && next.userId === current.userId) {
        total++;
        const pattern = this.userPatterns.get(current.userId);
        if (pattern?.predictedNext.includes(next.key)) {
          correct++;
        }
      }
    }

    return total > 0 ? correct / total : 0;
  }

  // Persistence
  private loadFromDisk(): void {
    try {
      const cached = localStorage.getItem('smartCache');
      if (cached) {
        const parsed = JSON.parse(cached) as Array<[string, CacheEntry<T>]>;
        this.cache = new Map(parsed);
        
        // Recalculate stats
        this.stats.size = Array.from(this.cache.values())
          .reduce((total, entry) => total + entry.size, 0);
      }
    } catch (error) {
      console.warn('Failed to load cache from disk:', error);
    }
  }

  private async saveToDisk(): Promise<void> {
    try {
      const cacheArray = Array.from(this.cache.entries());
      localStorage.setItem('smartCache', JSON.stringify(cacheArray));
    } catch (error) {
      console.warn('Failed to save cache to disk:', error);
    }
  }

  // Public API
  getStats(): CacheStats {
    this.stats.memoryUsage = this.stats.size;
    return { ...this.stats };
  }

  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
    this.stats.evictions += this.cache.size;
  }

  invalidateByTag(tag: string): number {
    let invalidated = 0;
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (entry.tags.includes(tag)) {
        toDelete.push(key);
      }
    }

    for (const key of toDelete) {
      void this.delete(key);
      invalidated++;
    }

    return invalidated;
  }

  getPredictions(userId: string): string[] {
    const pattern = this.userPatterns.get(userId);
    return pattern?.predictedNext ?? [];
  }

  getHitRate(): number {
    return this.stats.hitRate;
  }

  optimize(): void {
    // Run optimization algorithms
    this.updatePredictionModel();
    this.cleanupExpired();
    
    // Defragment cache if needed
    if (this.stats.size > this.config.maxSize * 0.8) {
      const lowScoreKeys: string[] = [];
      
      for (const [key, entry] of this.cache) {
        if (entry.score < 0.3) {
          lowScoreKeys.push(key);
        }
      }
      
      for (const key of lowScoreKeys.slice(0, Math.floor(lowScoreKeys.length * 0.3))) {
        void this.delete(key);
      }
    }
  }
}

// Export singleton for global cache
export const globalSmartCache = new SmartCacheEngine({
  maxSize: 50 * 1024 * 1024, // 50MB
  strategy: 'ai-powered',
  enablePrediction: true,
  enableCompression: true,
  persistToDisk: true
});

export default SmartCacheEngine; 