class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute default
    this.maxRequests = options.maxRequests || 100;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.store = options.store || new MemoryStore();
    this.handler = options.handler || this.defaultHandler;
    this.onLimitReached = options.onLimitReached || null;
  }

  defaultHandler(req, res) {
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later.",
      retryAfter: Math.ceil(this.windowMs / 1000),
    });
  }

  middleware() {
    return async (req, res, next) => {
      const key = this.keyGenerator(req);

      try {
        const record = await this.store.get(key);
        const now = Date.now();

        if (!record || now - record.resetTime > this.windowMs) {
          // New window
          await this.store.set(key, {
            count: 1,
            resetTime: now,
          });
          return next();
        }

        if (record.count >= this.maxRequests) {
          // Rate limit exceeded
          if (this.onLimitReached) {
            this.onLimitReached(req, key);
          }

          const resetIn = Math.ceil(
            (record.resetTime + this.windowMs - now) / 1000
          );
          res.setHeader("X-RateLimit-Limit", this.maxRequests);
          res.setHeader("X-RateLimit-Remaining", 0);
          res.setHeader(
            "X-RateLimit-Reset",
            Math.ceil((record.resetTime + this.windowMs) / 1000)
          );
          res.setHeader("Retry-After", resetIn);

          return this.handler.call(this, req, res);
        }

        // Increment counter
        record.count++;
        await this.store.set(key, record);

        // Set rate limit headers
        res.setHeader("X-RateLimit-Limit", this.maxRequests);
        res.setHeader(
          "X-RateLimit-Remaining",
          Math.max(0, this.maxRequests - record.count)
        );
        res.setHeader(
          "X-RateLimit-Reset",
          Math.ceil((record.resetTime + this.windowMs) / 1000)
        );

        // Handle skip options
        const originalSend = res.send;
        const originalJson = res.json;
        const self = this;

        res.send = function (...args) {
          if (self.shouldSkip(res.statusCode)) {
            self.store.decrement(key);
          }
          return originalSend.apply(this, args);
        };

        res.json = function (...args) {
          if (self.shouldSkip(res.statusCode)) {
            self.store.decrement(key);
          }
          return originalJson.apply(this, args);
        };

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  shouldSkip(statusCode) {
    if (this.skipSuccessfulRequests && statusCode < 400) {
      return true;
    }
    if (this.skipFailedRequests && statusCode >= 400) {
      return true;
    }
    return false;
  }

  async reset(key) {
    await this.store.delete(key);
  }

  async resetAll() {
    await this.store.clear();
  }
}

class MemoryStore {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key);
  }

  async set(key, value) {
    this.store.set(key, value);
  }

  async delete(key) {
    this.store.delete(key);
  }

  async decrement(key) {
    const record = this.store.get(key);
    if (record && record.count > 0) {
      record.count--;
      this.store.set(key, record);
    }
  }

  async clear() {
    this.store.clear();
  }

  // Cleanup old entries
  cleanup(windowMs) {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now - record.resetTime > windowMs) {
        this.store.delete(key);
      }
    }
  }
}

module.exports = { RateLimiter, MemoryStore };
