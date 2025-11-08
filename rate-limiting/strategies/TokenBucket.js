class TokenBucketRateLimiter {
  constructor(options = {}) {
    this.capacity = options.capacity || 100; // Max tokens
    this.refillRate = options.refillRate || 10; // Tokens per second
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.store = options.store || new Map();
  }

  middleware() {
    return async (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();

      // Get or create bucket
      let bucket = this.store.get(key);

      if (!bucket) {
        bucket = {
          tokens: this.capacity,
          lastRefill: now,
        };
      } else {
        // Refill tokens based on time elapsed
        const timePassed = (now - bucket.lastRefill) / 1000; // seconds
        const tokensToAdd = timePassed * this.refillRate;
        bucket.tokens = Math.min(this.capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
      }

      if (bucket.tokens < 1) {
        const waitTime = Math.ceil((1 - bucket.tokens) / this.refillRate);

        res.setHeader("X-RateLimit-Limit", this.capacity);
        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("Retry-After", waitTime);

        return res.status(429).json({
          success: false,
          message: "Rate limit exceeded. Please slow down.",
          retryAfter: waitTime,
        });
      }

      // Consume one token
      bucket.tokens -= 1;
      this.store.set(key, bucket);

      // Set headers
      res.setHeader("X-RateLimit-Limit", this.capacity);
      res.setHeader("X-RateLimit-Remaining", Math.floor(bucket.tokens));

      next();
    };
  }

  async reset(key) {
    this.store.delete(key);
  }

  async resetAll() {
    this.store.clear();
  }
}

module.exports = TokenBucketRateLimiter;
