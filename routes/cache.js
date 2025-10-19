// INTERVIEW CONCEPT: Cache Management API Routes
// Demonstrates cache operations and management endpoints

const express = require("express");
const { cacheManager } = require("../cache/CacheManager");
const RedisCacheStrategy = require("../cache/RedisCache");
const {
  cacheMiddleware,
  cacheInvalidationMiddleware,
} = require("../middleware/cacheMiddleware");

const router = express.Router();

// INTERVIEW CONCEPT: Cache Strategy Initialization
let redisStrategy = null;

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

// Initialize Redis on module load
initializeRedis();

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 current:
 *                   type: string
 *                 available:
 *                   type: array
 *                   items:
 *                     type: string
 *                 redis_available:
 *                   type: boolean
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - strategy
 *             properties:
 *               strategy:
 *                 type: string
 *                 enum: [memory, nodeCache, redis]
 *     responses:
 *       200:
 *         description: Strategy switched successfully
 *       400:
 *         description: Invalid strategy or strategy not available
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
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CacheStats'
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
 *     responses:
 *       200:
 *         description: Cache health check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 healthy:
 *                   type: boolean
 *                 strategy:
 *                   type: string
 *                 timestamp:
 *                   type: string
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

/**
 * @swagger
 * /api/cache/set:
 *   post:
 *     summary: Set cache entry
 *     description: Manually set a cache entry with optional TTL
 *     tags: [Cache]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CacheEntry'
 *     responses:
 *       200:
 *         description: Cache entry set successfully
 *       400:
 *         description: Invalid input data
 */
// INTERVIEW CONCEPT: Manual Cache Management
router.post("/set", async (req, res) => {
  try {
    const { key, value, ttl = 300 } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: "Key and value are required" });
    }

    const success = await cacheManager.set(key, value, ttl);

    if (success) {
      res.json({
        message: "Cache entry set successfully",
        key,
        ttl,
        strategy: cacheManager.currentStrategy,
      });
    } else {
      res.status(500).json({ error: "Failed to set cache entry" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/cache/get/{key}:
 *   get:
 *     summary: Get cache entry
 *     description: Retrieve a cache entry by key
 *     tags: [Cache]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key to retrieve
 *     responses:
 *       200:
 *         description: Cache entry retrieved successfully
 *       404:
 *         description: Cache entry not found
 */
router.get("/get/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const value = await cacheManager.get(key);

    if (value !== null) {
      res.json({
        key,
        value,
        found: true,
        strategy: cacheManager.currentStrategy,
      });
    } else {
      res.status(404).json({
        key,
        found: false,
        message: "Cache entry not found",
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/cache/delete/{key}:
 *   delete:
 *     summary: Delete cache entry
 *     description: Remove a cache entry by key
 *     tags: [Cache]
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Cache key to delete
 *     responses:
 *       200:
 *         description: Cache entry deleted successfully
 *       404:
 *         description: Cache entry not found
 */
router.delete("/delete/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const deleted = await cacheManager.del(key);

    if (deleted) {
      res.json({
        message: "Cache entry deleted successfully",
        key,
        deleted: true,
      });
    } else {
      res.status(404).json({
        message: "Cache entry not found",
        key,
        deleted: false,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/cache/clear:
 *   delete:
 *     summary: Clear all cache entries
 *     description: Remove all entries from the current cache strategy
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.delete("/clear", async (req, res) => {
  try {
    await cacheManager.clear();
    res.json({
      message: "Cache cleared successfully",
      strategy: cacheManager.currentStrategy,
      timestamp: new Date().toISOString(),
    });
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
 *     responses:
 *       200:
 *         description: Data retrieved successfully
 *         headers:
 *           X-Cache:
 *             description: Cache status (HIT or MISS)
 *             schema:
 *               type: string
 *           X-Cache-Key:
 *             description: Cache key used
 *             schema:
 *               type: string
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
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: User ID for personalized caching
 *     responses:
 *       200:
 *         description: User data retrieved successfully
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

/**
 * @swagger
 * /api/cache/demo/invalidate:
 *   post:
 *     summary: Trigger cache invalidation
 *     description: Demonstrates cache invalidation when data changes
 *     tags: [Cache]
 *     responses:
 *       200:
 *         description: Cache invalidated successfully
 */
router.post("/demo/invalidate", async (req, res) => {
  // This POST request will trigger cache invalidation
  res.json({
    message: "Data updated - cache invalidated",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
