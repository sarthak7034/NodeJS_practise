// INTERVIEW CONCEPT: Cache Management API Routes
// Demonstrates cache operations and management endpoints

const express = require("express");
const { cacheManager } = require("../cache/CacheManager");
const RedisCacheStrategy = require("../cache/RedisCache");
const { advancedCacheStrategies } = require("../cache/AdvancedCacheStrategies");
const CacheCompression = require("../cache/CacheCompression");
const CachePartitioning = require("../cache/CachePartitioning");
const {
  cacheMiddleware,
  cacheInvalidationMiddleware,
} = require("../middleware/cacheMiddleware");

const router = express.Router();

// INTERVIEW CONCEPT: Cache Strategy Initialization
let redisStrategy = null;
let compressionCache = null;
let partitionedCache = null;

// Initialize Redis if available
async function initializeRedis() {
  try {
    redisStrategy = new RedisCacheStrategy();
    const connected = await redisStrategy.connect();

    if (connected) {
      cacheManager.setRedisStrategy(redisStrategy);
      console.log("Redis cache strategy initialized");
    }
  } catch (error) {
    console.log("Redis not available, using in-memory cache");
  }
}

// Initialize advanced caching features
function initializeAdvancedCaching() {
  // Initialize compression cache
  const compression = new CacheCompression({
    algorithm: "gzip",
    threshold: 1024,
    level: 6,
  });
  compressionCache = compression.createCompressedCacheWrapper(cacheManager);

  // Initialize partitioned cache (using multiple instances of the same cache for demo)
  partitionedCache = new CachePartitioning([cacheManager, cacheManager], {
    strategy: "consistent-hash",
  });

  console.log("Advanced caching features initialized");
}

// Initialize on module load
initializeRedis();
initializeAdvancedCaching();

/**
 * @swagger
 * components:
 *   schemas:
 *     CacheEntry:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         value:
 *           type: object
 *         ttl:
 *           type: integer
 *           description: Time to live in seconds
 *     CacheStats:
 *       type: object
 *       properties:
 *         hits:
 *           type: integer
 *         misses:
 *           type: integer
 *         size:
 *           type: integer
 *         type:
 *           type: string
 */

/**
 * @swagger
 * /api/cache/strategies:
 *   get:
 *     summary: Get available cache strategies
 *     description: Returns list of available caching strategies and current active strategy
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache strategies retrieved successfully
 */
// INTERVIEW CONCEPT: Cache Strategy Management
router.get("/strategies", async (req, res) => {
  const strategies = Object.keys(cacheManager.strategies).filter(
    (key) => cacheManager.strategies[key] !== null
  );

  res.json({
    current: cacheManager.currentStrategy,
    available: strategies,
    redis_available: redisStrategy ? await redisStrategy.isHealthy() : false,
  });
});

/**
 * @swagger
 * /api/cache/strategy:
 *   post:
 *     summary: Switch cache strategy
 *     description: Change the active caching strategy
 *     tags: [Cache]
 */
router.post("/strategy", async (req, res) => {
  try {
    const { strategy } = req.body;

    if (!strategy) {
      return res.status(400).json({ error: "Strategy is required" });
    }

    // Check if Redis strategy is requested but not available
    if (
      strategy === "redis" &&
      (!redisStrategy || !(await redisStrategy.isHealthy()))
    ) {
      return res.status(400).json({
        error: "Redis strategy not available",
        suggestion: "Make sure Redis server is running and accessible",
      });
    }

    cacheManager.setStrategy(strategy);

    res.json({
      message: `Cache strategy switched to ${strategy}`,
      current: cacheManager.currentStrategy,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Returns detailed statistics about cache performance and usage
 *     tags: [Cache]
 */
// INTERVIEW CONCEPT: Cache Performance Monitoring
router.get("/stats", async (req, res) => {
  try {
    const stats = await cacheManager.getStats();
    const health = await cacheManager.healthCheck();

    res.json({
      ...stats,
      health,
      strategy: cacheManager.currentStrategy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/cache/health:
 *   get:
 *     summary: Check cache health
 *     description: Performs a health check on the current cache strategy
 *     tags: [Cache]
 */
router.get("/health", async (req, res) => {
  try {
    const health = await cacheManager.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({
      healthy: false,
      error: error.message,
      strategy: cacheManager.currentStrategy,
      timestamp: new Date().toISOString(),
    });
  }
});
// INTERVIEW CONCEPT: Advanced Caching Strategies Endpoints

/**
 * @swagger
 * /api/cache/advanced/stampede-protection:
 *   post:
 *     summary: Test cache stampede protection
 *     description: Demonstrates cache-aside with lock to prevent cache stampede
 *     tags: [Cache - Advanced]
 */
router.post("/advanced/stampede-protection", async (req, res) => {
  try {
    const { key = "stampede-test", simulateLoad = true } = req.body;

    const dataLoader = async () => {
      if (simulateLoad) {
        // Simulate expensive operation
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
      return {
        message: "Data loaded with stampede protection",
        timestamp: new Date().toISOString(),
        loadTime: simulateLoad ? "2000ms" : "0ms",
      };
    };

    const startTime = Date.now();
    const data = await advancedCacheStrategies.cacheAsideWithLock(
      key,
      dataLoader,
      {
        ttl: 300,
        lockTimeout: 5000,
      }
    );
    const responseTime = Date.now() - startTime;

    res.json({
      data,
      responseTime: `${responseTime}ms`,
      metrics: advancedCacheStrategies.getMetrics(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/cache/advanced/compression:
 *   get:
 *     summary: Test cache compression
 *     description: Demonstrates automatic compression for large cache entries
 *     tags: [Cache - Advanced]
 */
router.get("/advanced/compression", async (req, res) => {
  try {
    const { size = "medium" } = req.query;

    // Generate test data of different sizes
    const testData = {
      small: { message: "Small data", items: Array(10).fill("item") },
      medium: {
        message: "Medium data",
        items: Array(100).fill("detailed item with more content"),
      },
      large: {
        message: "Large data",
        items: Array(1000).fill(
          "very detailed item with lots of content and data"
        ),
      },
    };

    const key = `compression-test-${size}`;
    const data = testData[size];

    // Test with compression
    await compressionCache.set(key, data, 300);
    const retrieved = await compressionCache.get(key);

    // Get compression stats
    const stats = await compressionCache.getStats();

    res.json({
      original: data,
      retrieved,
      dataMatches: JSON.stringify(data) === JSON.stringify(retrieved),
      compressionStats: stats.compression,
      pattern: "compression",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/cache/advanced/metrics:
 *   get:
 *     summary: Get advanced caching metrics
 *     description: Returns comprehensive metrics for all advanced caching strategies
 *     tags: [Cache - Advanced]
 */
router.get("/advanced/metrics", async (req, res) => {
  try {
    const metrics = {
      advancedStrategies: advancedCacheStrategies.getMetrics(),
      compression: compressionCache ? await compressionCache.getStats() : null,
      partitioning: partitionedCache ? await partitionedCache.getStats() : null,
      timestamp: new Date().toISOString(),
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// INTERVIEW CONCEPT: Cached Data Endpoints (Demo)

/**
 * @swagger
 * /api/cache/demo/slow-data:
 *   get:
 *     summary: Get slow data (cached)
 *     description: Demonstrates automatic caching of slow API responses
 *     tags: [Cache]
 */
// INTERVIEW CONCEPT: Automatic Response Caching
router.get(
  "/demo/slow-data",
  cacheMiddleware({ ttl: 60 }), // Cache for 1 minute
  async (req, res) => {
    // Simulate slow data processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const data = {
      message: "This is slow data that should be cached",
      timestamp: new Date().toISOString(),
      randomValue: Math.random(),
      processingTime: "2000ms",
    };

    res.json(data);
  }
);

/**
 * @swagger
 * /api/cache/demo/user-data:
 *   get:
 *     summary: Get user-specific cached data
 *     description: Demonstrates user-aware caching
 *     tags: [Cache]
 */
// INTERVIEW CONCEPT: User-Aware Caching
router.get(
  "/demo/user-data",
  cacheMiddleware({
    ttl: 300,
    keyGenerator: (req) =>
      `user-data:${req.query.userId || "anonymous"}:${req.path}`,
  }),
  async (req, res) => {
    const userId = req.query.userId || "anonymous";

    // Simulate database query
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userData = {
      userId,
      preferences: {
        theme: "dark",
        language: "en",
        notifications: true,
      },
      lastLogin: new Date().toISOString(),
      cacheDemo: true,
    };

    res.json(userData);
  }
);

// INTERVIEW CONCEPT: Cache Invalidation on Data Changes
router.use(
  cacheInvalidationMiddleware({
    keyPatterns: ["api:*cache*", "user-data:*"],
  })
);

module.exports = router;
