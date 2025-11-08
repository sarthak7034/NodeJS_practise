class SlidingWindowRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.maxRequests || 100;
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.store = options.store || new Map();
  }

  middleware() {
    return async (req, res, next) => {
      const key = this.keyGenerator(req);
      const now = Date.now();

      // Get or create request log
      let requests = this.store.get(key) || [];

      // Remove requests outside the sliding window
      requests = requests.filter(
        (timestamp) => now - timestamp < this.windowMs
      );

      if (requests.length >= this.maxRequests) {
        const oldestRequest = requests[0];
        const resetIn = Math.ceil((oldestRequest + this.windowMs - now) / 1000);

        res.setHeader("X-RateLimit-Limit", this.maxRequests);
        res.setHeader("X-RateLimit-Remaining", 0);
        res.setHeader("Retry-After", resetIn);

        return res.status(429).json({
          success: false,
          message: "Too many requests, please try again later.",
          retryAfter: resetIn,
        });
      }

      // Add current request
      requests.push(now);
      this.store.set(key, requests);

      // Set headers
      res.setHeader("X-RateLimit-Limit", this.maxRequests);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, this.maxRequests - requests.length)
      );

      next();
    };
  }

  async reset(key) {
    this.store.delete(key);
  }

  async resetAll() {
    this.store.clear();
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, requests] of this.store.entries()) {
      const filtered = requests.filter(
        (timestamp) => now - timestamp < this.windowMs
      );
      if (filtered.length === 0) {
        this.store.delete(key);
      } else {
        this.store.set(key, filtered);
      }
    }
  }
}

module.exports = SlidingWindowRateLimiter;
