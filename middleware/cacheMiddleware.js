// INTERVIEW CONCEPT: Cache Middleware Implementation
// Demonstrates middleware pattern for automatic caching

const { cacheManager } = require("../cache/CacheManager");

// INTERVIEW CONCEPT: Response Caching Middleware
function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // Default 5 minutes
    keyGenerator = null,
    skipCache = null,
    onHit = null,
    onMiss = null,
    onError = null,
  } = options;

  return async (req, res, next) => {
    // INTERVIEW CONCEPT: Cache Key Generation
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : generateDefaultCacheKey(req);

    // INTERVIEW CONCEPT: Conditional Caching
    if (skipCache && skipCache(req)) {
      return next();
    }

    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    try {
      // INTERVIEW CONCEPT: Cache Hit Check
      const cachedResponse = await cacheManager.get(cacheKey);

      if (cachedResponse) {
        // INTERVIEW CONCEPT: Cache Hit Response
        if (onHit) onHit(req, cacheKey);

        res.set("X-Cache", "HIT");
        res.set("X-Cache-Key", cacheKey);
        return res.json(cachedResponse);
      }

      // INTERVIEW CONCEPT: Response Interception
      const originalJson = res.json;
      res.json = function (data) {
        // Cache the response before sending
        cacheManager
          .set(cacheKey, data, ttl)
          .then(() => {
            if (onMiss) onMiss(req, cacheKey);
          })
          .catch((error) => {
            console.error("Cache set error:", error);
            if (onError) onError(error, req, cacheKey);
          });

        res.set("X-Cache", "MISS");
        res.set("X-Cache-Key", cacheKey);

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      if (onError) onError(error, req, cacheKey);
      next(); // Continue without caching on error
    }
  };
}

// INTERVIEW CONCEPT: Cache Invalidation Middleware
function cacheInvalidationMiddleware(options = {}) {
  const {
    keyPatterns = [],
    invalidateOn = ["POST", "PUT", "DELETE", "PATCH"],
  } = options;

  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // INTERVIEW CONCEPT: Response Interception for Invalidation
    const interceptResponse = function (data) {
      // Only invalidate on successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        invalidateCache(req, keyPatterns);
      }
      return data;
    };

    if (invalidateOn.includes(req.method)) {
      res.json = function (data) {
        interceptResponse(data);
        return originalJson.call(this, data);
      };

      res.send = function (data) {
        interceptResponse(data);
        return originalSend.call(this, data);
      };
    }

    next();
  };
}

// INTERVIEW CONCEPT: Smart Cache Key Generation
function generateDefaultCacheKey(req) {
  const { method, path, query, headers } = req;

  // Include relevant headers that might affect response
  const relevantHeaders = {
    accept: headers.accept,
    "accept-language": headers["accept-language"],
    "user-agent": headers["user-agent"]?.substring(0, 50), // Truncate user-agent
  };

  const keyData = {
    method,
    path,
    query,
    headers: relevantHeaders,
  };

  // INTERVIEW CONCEPT: Deterministic Key Generation
  return `api:${Buffer.from(JSON.stringify(keyData)).toString("base64")}`;
}

// INTERVIEW CONCEPT: Pattern-based Cache Invalidation
async function invalidateCache(req, keyPatterns) {
  try {
    if (keyPatterns.length === 0) {
      // Default invalidation patterns based on route
      const pathSegments = req.path.split("/").filter(Boolean);
      keyPatterns.push(`api:*${pathSegments[0]}*`);
    }

    for (const pattern of keyPatterns) {
      // For simple implementation, we'll clear all cache
      // In production, you'd implement pattern matching
      console.log(`Invalidating cache pattern: ${pattern}`);

      // This is a simplified approach - in production you'd want
      // more sophisticated pattern matching
      if (pattern.includes("*")) {
        await cacheManager.clear();
      } else {
        await cacheManager.del(pattern);
      }
    }
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}

// INTERVIEW CONCEPT: Cache Warming Middleware
function cacheWarmingMiddleware(warmingConfig) {
  return async (req, res, next) => {
    // This would typically run on application startup
    // or on a schedule, not on every request
    next();
  };
}

// INTERVIEW CONCEPT: Cache Statistics Middleware
function cacheStatsMiddleware() {
  return async (req, res, next) => {
    const startTime = Date.now();

    // Add cache stats to response headers
    res.on("finish", async () => {
      const responseTime = Date.now() - startTime;
      const stats = await cacheManager.getStats();

      // Log cache performance
      console.log(
        `Request: ${req.method} ${req.path} - ${responseTime}ms - Cache: ${
          res.get("X-Cache") || "N/A"
        }`
      );
    });

    next();
  };
}

// INTERVIEW CONCEPT: Conditional Caching Based on User
function userAwareCacheMiddleware(options = {}) {
  const { ttl = 300, includeUser = false } = options;

  return cacheMiddleware({
    ttl,
    keyGenerator: (req) => {
      const baseKey = generateDefaultCacheKey(req);

      if (includeUser && req.user) {
        return `${baseKey}:user:${req.user.id}`;
      }

      return baseKey;
    },
    skipCache: (req) => {
      // Skip caching for authenticated requests if not user-aware
      return !includeUser && req.user;
    },
  });
}

module.exports = {
  cacheMiddleware,
  cacheInvalidationMiddleware,
  cacheWarmingMiddleware,
  cacheStatsMiddleware,
  userAwareCacheMiddleware,
  generateDefaultCacheKey,
};
