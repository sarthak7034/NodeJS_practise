// INTERVIEW CONCEPT: Advanced Caching Strategies
// Implementation of sophisticated caching patterns for production systems

const { cacheManager } = require("./CacheManager");

class AdvancedCacheStrategies {
  constructor() {
    this.lockManager = new Map(); // For preventing cache stampede
    this.metrics = {
      cacheStampedePrevented: 0,
      staleWhileRevalidateHits: 0,
      circuitBreakerTrips: 0,
    };
  }

  // INTERVIEW CONCEPT: Cache-Aside with Lock (Prevents Cache Stampede)
  async cacheAsideWithLock(key, dataLoader, options = {}) {
    const { ttl = 300, lockTimeout = 5000 } = options;

    // Check cache first
    let data = await cacheManager.get(key);
    if (data !== null) {
      return data;
    }

    // Check if another request is already loading this data
    if (this.lockManager.has(key)) {
      // Wait for the other request to complete
      await this.waitForLock(key, lockTimeout);
      // Try cache again after waiting
      data = await cacheManager.get(key);
      if (data !== null) {
        this.metrics.cacheStampedePrevented++;
        return data;
      }
    }

    // Acquire lock
    const lockPromise = this.loadDataWithLock(key, dataLoader, ttl);
    this.lockManager.set(key, lockPromise);

    try {
      data = await lockPromise;
      return data;
    } finally {
      this.lockManager.delete(key);
    }
  }

  async loadDataWithLock(key, dataLoader, ttl) {
    try {
      const data = await dataLoader();
      await cacheManager.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Error loading data for key ${key}:`, error);
      throw error;
    }
  }

  async waitForLock(key, timeout) {
    const startTime = Date.now();
    while (this.lockManager.has(key) && Date.now() - startTime < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // INTERVIEW CONCEPT: Stale-While-Revalidate Pattern
  async staleWhileRevalidate(key, dataLoader, options = {}) {
    const { ttl = 300, staleTime = 600, backgroundRefresh = true } = options;

    const cacheEntry = await this.getCacheEntryWithMetadata(key);

    if (cacheEntry) {
      const age = Date.now() - cacheEntry.timestamp;

      // If data is fresh, return it
      if (age < ttl * 1000) {
        return cacheEntry.data;
      }

      // If data is stale but within stale time, return stale data
      // and refresh in background
      if (age < staleTime * 1000) {
        if (backgroundRefresh) {
          // Refresh in background without waiting
          setImmediate(async () => {
            try {
              const freshData = await dataLoader();
              await this.setCacheEntryWithMetadata(key, freshData, ttl);
            } catch (error) {
              console.error(`Background refresh failed for ${key}:`, error);
            }
          });
        }

        this.metrics.staleWhileRevalidateHits++;
        return cacheEntry.data;
      }
    }

    // Data is too stale or doesn't exist, load fresh data
    const freshData = await dataLoader();
    await this.setCacheEntryWithMetadata(key, freshData, ttl);
    return freshData;
  }

  // INTERVIEW CONCEPT: Write-Through Cache
  async writeThrough(key, data, persistFunction, options = {}) {
    const { ttl = 300 } = options;

    try {
      // Write to persistent storage first
      await persistFunction(data);

      // Then write to cache
      await cacheManager.set(key, data, ttl);

      return { success: true, cached: true };
    } catch (error) {
      console.error(`Write-through failed for ${key}:`, error);
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Write-Behind (Write-Back) Cache
  async writeBehind(key, data, persistFunction, options = {}) {
    const { ttl = 300, writeDelay = 1000 } = options;

    try {
      // Write to cache immediately
      await cacheManager.set(key, data, ttl);

      // Schedule background write to persistent storage
      setTimeout(async () => {
        try {
          await persistFunction(data);
          console.log(`Background write completed for ${key}`);
        } catch (error) {
          console.error(`Background write failed for ${key}:`, error);
          // In production, you might want to retry or queue for later
        }
      }, writeDelay);

      return { success: true, cached: true, backgroundWrite: true };
    } catch (error) {
      console.error(`Write-behind cache failed for ${key}:`, error);
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Multi-Level Cache (L1: Memory, L2: Redis)
  async multiLevelGet(key, options = {}) {
    const { l1Ttl = 60, l2Ttl = 300 } = options;

    // Try L1 cache (fast, local memory)
    let data = await this.getFromL1Cache(key);
    if (data !== null) {
      return { data, level: "L1", hit: true };
    }

    // Try L2 cache (Redis - distributed)
    data = await cacheManager.get(key);
    if (data !== null) {
      // Populate L1 cache for next time
      await this.setToL1Cache(key, data, l1Ttl);
      return { data, level: "L2", hit: true };
    }

    return { data: null, level: null, hit: false };
  }

  async multiLevelSet(key, data, options = {}) {
    const { l1Ttl = 60, l2Ttl = 300 } = options;

    // Set in both levels
    await Promise.all([
      this.setToL1Cache(key, data, l1Ttl),
      cacheManager.set(key, data, l2Ttl),
    ]);
  }

  // INTERVIEW CONCEPT: Circuit Breaker Pattern for Cache
  async cacheWithCircuitBreaker(key, dataLoader, options = {}) {
    const {
      ttl = 300,
      failureThreshold = 5,
      recoveryTimeout = 30000,
      fallbackTtl = 60,
    } = options;

    const circuitKey = `circuit:${key}`;
    const circuit = await this.getCircuitState(circuitKey);

    // If circuit is open, try fallback
    if (circuit.state === "OPEN") {
      if (Date.now() - circuit.lastFailure < recoveryTimeout) {
        return await this.getFallbackData(key, dataLoader, fallbackTtl);
      } else {
        // Try to close circuit (half-open state)
        await this.setCircuitState(circuitKey, "HALF_OPEN");
      }
    }

    try {
      // Try normal cache operation
      let data = await cacheManager.get(key);
      if (data === null) {
        data = await dataLoader();
        await cacheManager.set(key, data, ttl);
      }

      // Reset circuit on success
      if (circuit.state !== "CLOSED") {
        await this.setCircuitState(circuitKey, "CLOSED");
      }

      return data;
    } catch (error) {
      // Handle failure
      circuit.failures = (circuit.failures || 0) + 1;
      circuit.lastFailure = Date.now();

      if (circuit.failures >= failureThreshold) {
        await this.setCircuitState(circuitKey, "OPEN");
        this.metrics.circuitBreakerTrips++;
      }

      // Return fallback data
      return await this.getFallbackData(key, dataLoader, fallbackTtl);
    }
  }

  // INTERVIEW CONCEPT: Probabilistic Early Expiration
  async probabilisticEarlyExpiration(key, dataLoader, options = {}) {
    const { ttl = 300, beta = 1.0 } = options;

    const cacheEntry = await this.getCacheEntryWithMetadata(key);

    if (cacheEntry) {
      const age = Date.now() - cacheEntry.timestamp;
      const timeToLive = ttl * 1000;

      // Calculate probability of early expiration
      const probability = Math.random();
      const threshold = Math.exp((-beta * age) / timeToLive);

      // If not expired and probability check passes, return cached data
      if (age < timeToLive && probability > threshold) {
        return cacheEntry.data;
      }
    }

    // Load fresh data
    const freshData = await dataLoader();
    await this.setCacheEntryWithMetadata(key, freshData, ttl);
    return freshData;
  }

  // INTERVIEW CONCEPT: Cache Warming Strategy
  async warmCache(warmingConfig) {
    console.log("Starting cache warming...");
    const results = [];

    for (const config of warmingConfig) {
      try {
        const { key, dataLoader, ttl = 3600, priority = 1 } = config;

        // Load data and cache it
        const data = await dataLoader();
        await cacheManager.set(key, data, ttl);

        results.push({
          key,
          success: true,
          priority,
          timestamp: new Date().toISOString(),
        });

        console.log(`Cache warmed for key: ${key}`);
      } catch (error) {
        console.error(`Cache warming failed for ${config.key}:`, error);
        results.push({
          key: config.key,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  // Helper methods for advanced strategies
  async getCacheEntryWithMetadata(key) {
    const metaKey = `meta:${key}`;
    const [data, metadata] = await Promise.all([
      cacheManager.get(key),
      cacheManager.get(metaKey),
    ]);

    if (data !== null && metadata) {
      return { data, ...metadata };
    }

    return null;
  }

  async setCacheEntryWithMetadata(key, data, ttl) {
    const metaKey = `meta:${key}`;
    const metadata = {
      timestamp: Date.now(),
      ttl: ttl * 1000,
    };

    await Promise.all([
      cacheManager.set(key, data, ttl),
      cacheManager.set(metaKey, metadata, ttl + 60), // Keep metadata slightly longer
    ]);
  }

  // L1 Cache (in-memory) helpers
  async getFromL1Cache(key) {
    // This would use a local in-memory cache
    // For simplicity, using the same cache manager
    return await cacheManager.get(`l1:${key}`);
  }

  async setToL1Cache(key, data, ttl) {
    return await cacheManager.set(`l1:${key}`, data, ttl);
  }

  // Circuit breaker helpers
  async getCircuitState(circuitKey) {
    const state = await cacheManager.get(circuitKey);
    return state || { state: "CLOSED", failures: 0, lastFailure: 0 };
  }

  async setCircuitState(circuitKey, state) {
    const currentState = await this.getCircuitState(circuitKey);
    currentState.state = state;
    if (state === "CLOSED") {
      currentState.failures = 0;
    }
    await cacheManager.set(circuitKey, currentState, 3600);
  }

  async getFallbackData(key, dataLoader, ttl) {
    try {
      // Try to get stale data from cache
      const staleData = await cacheManager.get(`stale:${key}`);
      if (staleData) {
        return staleData;
      }

      // If no stale data, try to load fresh data with shorter TTL
      const data = await dataLoader();
      await cacheManager.set(`stale:${key}`, data, ttl);
      return data;
    } catch (error) {
      console.error("Fallback data loading failed:", error);
      return { error: "Service temporarily unavailable" };
    }
  }

  // Get metrics for monitoring
  getMetrics() {
    return {
      ...this.metrics,
      activeLocks: this.lockManager.size,
      timestamp: new Date().toISOString(),
    };
  }

  // Reset metrics
  resetMetrics() {
    this.metrics = {
      cacheStampedePrevented: 0,
      staleWhileRevalidateHits: 0,
      circuitBreakerTrips: 0,
    };
  }
}

// Export singleton instance
const advancedCacheStrategies = new AdvancedCacheStrategies();

module.exports = {
  AdvancedCacheStrategies,
  advancedCacheStrategies,
};
