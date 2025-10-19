// INTERVIEW CONCEPT: Cache Management Strategy
// Centralized cache management with multiple cache providers
// Demonstrates factory pattern and strategy pattern

const NodeCache = require("node-cache");
const memoryCache = require("memory-cache");

class CacheManager {
  constructor() {
    // INTERVIEW CONCEPT: Multiple Cache Strategies
    this.strategies = {
      memory: new MemoryCacheStrategy(),
      nodeCache: new NodeCacheStrategy(),
      redis: null, // Will be initialized if Redis is available
    };

    this.defaultStrategy = "memory";
    this.currentStrategy = this.defaultStrategy;
  }

  // INTERVIEW CONCEPT: Strategy Pattern Implementation
  setStrategy(strategyName) {
    if (this.strategies[strategyName]) {
      this.currentStrategy = strategyName;
      console.log(`Cache strategy switched to: ${strategyName}`);
    } else {
      throw new Error(`Cache strategy '${strategyName}' not available`);
    }
  }

  // INTERVIEW CONCEPT: Unified Cache Interface
  async get(key) {
    try {
      return await this.strategies[this.currentStrategy].get(key);
    } catch (error) {
      console.error(`Cache get error (${this.currentStrategy}):`, error);
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    try {
      return await this.strategies[this.currentStrategy].set(key, value, ttl);
    } catch (error) {
      console.error(`Cache set error (${this.currentStrategy}):`, error);
      return false;
    }
  }

  async del(key) {
    try {
      return await this.strategies[this.currentStrategy].del(key);
    } catch (error) {
      console.error(`Cache delete error (${this.currentStrategy}):`, error);
      return false;
    }
  }

  async clear() {
    try {
      return await this.strategies[this.currentStrategy].clear();
    } catch (error) {
      console.error(`Cache clear error (${this.currentStrategy}):`, error);
      return false;
    }
  }

  async getStats() {
    try {
      return await this.strategies[this.currentStrategy].getStats();
    } catch (error) {
      console.error(`Cache stats error (${this.currentStrategy}):`, error);
      return {};
    }
  }

  // INTERVIEW CONCEPT: Cache Warming
  async warmCache(data) {
    console.log("Warming cache with initial data...");
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value, 3600); // 1 hour TTL for warm data
    }
  }

  // INTERVIEW CONCEPT: Cache Health Check
  async healthCheck() {
    const testKey = "health_check_" + Date.now();
    const testValue = "ok";

    try {
      await this.set(testKey, testValue, 10);
      const retrieved = await this.get(testKey);
      await this.del(testKey);

      return {
        strategy: this.currentStrategy,
        healthy: retrieved === testValue,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        strategy: this.currentStrategy,
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // INTERVIEW CONCEPT: Redis Strategy Registration
  setRedisStrategy(redisStrategy) {
    this.strategies.redis = redisStrategy;
    console.log("Redis cache strategy registered");
  }
}

// INTERVIEW CONCEPT: Memory Cache Strategy (Built-in)
class MemoryCacheStrategy {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };
  }

  async get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      return this.cache.get(key);
    }
    this.stats.misses++;
    return null;
  }

  async set(key, value, ttl = 300) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    this.cache.set(key, value);
    this.stats.sets++;

    // Set TTL timer
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.cache.delete(key);
        this.timers.delete(key);
      }, ttl * 1000);

      this.timers.set(key, timer);
    }

    return true;
  }

  async del(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    const deleted = this.cache.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  async clear() {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.cache.clear();
    this.timers.clear();
    return true;
  }

  async getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      activeTimers: this.timers.size,
      type: "memory",
    };
  }
}

// INTERVIEW CONCEPT: Node-Cache Strategy (Third-party)
class NodeCacheStrategy {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: 300, // Default TTL: 5 minutes
      checkperiod: 60, // Check for expired keys every 60 seconds
      useClones: false, // Better performance, but be careful with object mutations
    });

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };

    // INTERVIEW CONCEPT: Cache Event Monitoring
    this.cache.on("set", (key, value) => {
      this.stats.sets++;
    });

    this.cache.on("del", (key, value) => {
      this.stats.deletes++;
    });

    this.cache.on("expired", (key, value) => {
      console.log(`Cache key expired: ${key}`);
    });
  }

  async get(key) {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      return value;
    }
    this.stats.misses++;
    return null;
  }

  async set(key, value, ttl = 300) {
    return this.cache.set(key, value, ttl);
  }

  async del(key) {
    return this.cache.del(key) > 0;
  }

  async clear() {
    this.cache.flushAll();
    return true;
  }

  async getStats() {
    const keys = this.cache.keys();
    return {
      ...this.stats,
      size: keys.length,
      keys: keys.length < 10 ? keys : keys.slice(0, 10), // Show first 10 keys
      type: "node-cache",
    };
  }
}

// INTERVIEW CONCEPT: Singleton Pattern
// Export a single instance to be used across the application
const cacheManager = new CacheManager();

module.exports = {
  CacheManager,
  cacheManager,
  MemoryCacheStrategy,
  NodeCacheStrategy,
};
