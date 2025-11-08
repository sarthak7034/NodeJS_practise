const { RateLimiter } = require("./RateLimiter");

// Preset configurations for common use cases
const presets = {
  // Very strict - for sensitive operations
  strict: (options = {}) =>
    new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      ...options,
    }),

  // Authentication endpoints
  auth: (options = {}) =>
    new RateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      skipSuccessfulRequests: true, // Only count failed attempts
      ...options,
    }),

  // API endpoints - moderate
  api: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
      ...options,
    }),

  // Public endpoints - lenient
  public: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      ...options,
    }),

  // File upload endpoints
  upload: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      ...options,
    }),

  // Search/query endpoints
  search: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      ...options,
    }),

  // Email sending
  email: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      ...options,
    }),

  // SMS sending
  sms: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
      ...options,
    }),

  // Password reset
  passwordReset: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      skipSuccessfulRequests: true,
      ...options,
    }),

  // Registration
  registration: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5,
      ...options,
    }),

  // GraphQL endpoints
  graphql: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 50,
      ...options,
    }),

  // Webhook endpoints
  webhook: (options = {}) =>
    new RateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      ...options,
    }),
};

module.exports = presets;
