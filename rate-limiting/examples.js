const { RateLimiter, presets, keyGenerators } = require("./index");

// Example 1: Basic rate limiting by IP
function basicExample() {
  const limiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  });

  return limiter.middleware();
}

// Example 2: Authentication endpoint with preset
function authExample() {
  // Only counts failed login attempts
  const limiter = presets.auth({
    keyGenerator: keyGenerators.byUsername,
  });

  return limiter.middleware();
}

// Example 3: API with different limits per user
function apiExample() {
  const limiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60,
    keyGenerator: keyGenerators.byUserID,
  });

  return limiter.middleware();
}

// Example 4: Custom handler for rate limit exceeded
function customHandlerExample() {
  const limiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    handler: (req, res) => {
      res.status(429).json({
        error: "Slow down!",
        message: "You have exceeded the rate limit.",
        timestamp: new Date().toISOString(),
      });
    },
    onLimitReached: (req, key) => {
      console.log(`Rate limit exceeded for key: ${key}`);
      // Log to monitoring service, send alert, etc.
    },
  });

  return limiter.middleware();
}

// Example 5: Different limits for different routes
function multiRouteExample(app) {
  // Strict limit for login
  app.post("/api/login", presets.auth().middleware());

  // Moderate limit for API
  app.use("/api/", presets.api().middleware());

  // Lenient limit for public endpoints
  app.use("/public/", presets.public().middleware());

  // Very strict for password reset
  app.post("/api/password-reset", presets.passwordReset().middleware());
}

// Example 6: Rate limiting with Redis store
function redisExample(redisClient) {
  const RedisStore = require("./stores/RedisStore");

  const limiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    store: new RedisStore(redisClient, { prefix: "rl:" }),
  });

  return limiter.middleware();
}

// Example 7: Sliding window rate limiter
function slidingWindowExample() {
  const { SlidingWindowRateLimiter } = require("./index");

  const limiter = new SlidingWindowRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
  });

  return limiter.middleware();
}

// Example 8: Token bucket rate limiter
function tokenBucketExample() {
  const { TokenBucketRateLimiter } = require("./index");

  const limiter = new TokenBucketRateLimiter({
    capacity: 100,
    refillRate: 10, // 10 tokens per second
  });

  return limiter.middleware();
}

// Example 9: Per-route and per-user limits
function perRouteUserExample() {
  const limiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    keyGenerator: keyGenerators.byRouteAndUser,
  });

  return limiter.middleware();
}

// Example 10: Skip successful requests (for login)
function skipSuccessfulExample() {
  const limiter = new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    skipSuccessfulRequests: true, // Only count failed attempts
    keyGenerator: (req) => req.body.email || req.ip,
  });

  return limiter.middleware();
}

// Example 11: Global rate limit
function globalExample() {
  const limiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 1000,
    keyGenerator: keyGenerators.global,
  });

  return limiter.middleware();
}

// Example 12: Multi-tenant rate limiting
function multiTenantExample() {
  const limiter = new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
    keyGenerator: keyGenerators.byTenant,
  });

  return limiter.middleware();
}

// Example usage in Express app
function fullExpressExample() {
  const express = require("express");
  const app = express();

  // Global rate limit
  app.use(presets.public().middleware());

  // Strict limit for authentication
  app.post(
    "/api/login",
    presets
      .auth({
        keyGenerator: keyGenerators.byEmail,
      })
      .middleware(),
    (req, res) => {
      // Login logic
      res.json({ success: true });
    }
  );

  // API endpoints with user-based limiting
  app.use(
    "/api/",
    presets
      .api({
        keyGenerator: keyGenerators.byUserID,
      })
      .middleware()
  );

  // File uploads with strict limit
  app.post("/api/upload", presets.upload().middleware(), (req, res) => {
    // Upload logic
    res.json({ success: true });
  });

  return app;
}

module.exports = {
  basicExample,
  authExample,
  apiExample,
  customHandlerExample,
  multiRouteExample,
  redisExample,
  slidingWindowExample,
  tokenBucketExample,
  perRouteUserExample,
  skipSuccessfulExample,
  globalExample,
  multiTenantExample,
  fullExpressExample,
};
