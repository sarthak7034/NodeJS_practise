const { RateLimiter, MemoryStore } = require("./RateLimiter");
const RedisStore = require("./stores/RedisStore");
const SlidingWindowRateLimiter = require("./strategies/SlidingWindow");
const TokenBucketRateLimiter = require("./strategies/TokenBucket");
const presets = require("./presets");
const keyGenerators = require("./keyGenerators");

module.exports = {
  RateLimiter,
  MemoryStore,
  RedisStore,
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  presets,
  keyGenerators,
};
