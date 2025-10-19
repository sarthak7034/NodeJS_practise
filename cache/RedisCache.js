// INTERVIEW CONCEPT: Redis Cache Implementation
// Production-ready Redis caching with connection management and error handling

const redis = require("redis");

class RedisCacheStrategy {
  constructor(options = {}) {
    this.options = {
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      ...options,
    };

    this.client = null;
    this.isConnected = false;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
  }

  // INTERVIEW CONCEPT: Redis Connection Management
  async connect() {
    try {
      this.client = redis.createClient({
        socket: {
          host: this.options.host,
          port: this.options.port,
        },
        password: this.options.password,
        database: this.options.db,
      });

      // INTERVIEW CONCEPT: Redis Event Handling
      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.stats.errors++;
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Redis Client Connected");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        console.log("Redis Client Ready");
      });

      this.client.on("end", () => {
        console.log("Redis Client Disconnected");
        this.isConnected = false;
      });

      await this.client.connect();
      return true;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.isConnected = false;
      return false;
    }
  }

  // INTERVIEW CONCEPT: Connection Health Check
  async isHealthy() {
    if (!this.client || !this.isConnected) {
      return false;
    }

    try {
      await this.client.ping();
      return true;
    } catch (error) {
      console.error("Redis health check failed:", error);
      return false;
    }
  }

  // INTERVIEW CONCEPT: Redis Get with Error Handling
  async get(key) {
    if (!this.isConnected) {
      throw new Error("Redis not connected");
    }

    try {
      const value = await this.client.get(key);
      if (value !== null) {
        this.stats.hits++;
        // INTERVIEW CONCEPT: JSON Deserialization
        try {
          return JSON.parse(value);
        } catch {
          return value; // Return as string if not JSON
        }
      }
      this.stats.misses++;
      return null;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Redis Set with TTL
  async set(key, value, ttl = 300) {
    if (!this.isConnected) {
      throw new Error("Redis not connected");
    }

    try {
      // INTERVIEW CONCEPT: JSON Serialization
      const serializedValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      if (ttl > 0) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Redis Delete
  async del(key) {
    if (!this.isConnected) {
      throw new Error("Redis not connected");
    }

    try {
      const result = await this.client.del(key);
      if (result > 0) this.stats.deletes++;
      return result > 0;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Redis Flush All
  async clear() {
    if (!this.isConnected) {
      throw new Error("Redis not connected");
    }

    try {
      await this.client.flushDb();
      return true;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Redis Statistics
  async getStats() {
    const baseStats = {
      ...this.stats,
      type: "redis",
      connected: this.isConnected,
    };

    if (!this.isConnected) {
      return baseStats;
    }

    try {
      // INTERVIEW CONCEPT: Redis INFO Command
      const info = await this.client.info("memory");
      const dbSize = await this.client.dbSize();

      return {
        ...baseStats,
        dbSize,
        memoryInfo: this.parseRedisInfo(info),
      };
    } catch (error) {
      return baseStats;
    }
  }

  // INTERVIEW CONCEPT: Redis Info Parsing
  parseRedisInfo(info) {
    const lines = info.split("\r\n");
    const result = {};

    for (const line of lines) {
      if (line.includes(":")) {
        const [key, value] = line.split(":");
        result[key] = value;
      }
    }

    return {
      used_memory: result.used_memory,
      used_memory_human: result.used_memory_human,
      used_memory_peak: result.used_memory_peak,
      used_memory_peak_human: result.used_memory_peak_human,
    };
  }

  // INTERVIEW CONCEPT: Advanced Redis Operations

  // Hash operations for complex data structures
  async hset(key, field, value, ttl = 300) {
    if (!this.isConnected) throw new Error("Redis not connected");

    try {
      const serializedValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      await this.client.hSet(key, field, serializedValue);

      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }

      return true;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  async hget(key, field) {
    if (!this.isConnected) throw new Error("Redis not connected");

    try {
      const value = await this.client.hGet(key, field);
      if (value !== null) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // List operations for queues/stacks
  async lpush(key, value, ttl = 300) {
    if (!this.isConnected) throw new Error("Redis not connected");

    try {
      const serializedValue =
        typeof value === "object" ? JSON.stringify(value) : String(value);

      await this.client.lPush(key, serializedValue);

      if (ttl > 0) {
        await this.client.expire(key, ttl);
      }

      return true;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  async rpop(key) {
    if (!this.isConnected) throw new Error("Redis not connected");

    try {
      const value = await this.client.rPop(key);
      if (value !== null) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    } catch (error) {
      this.stats.errors++;
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Graceful Shutdown
  async disconnect() {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        console.log("Redis client disconnected gracefully");
      } catch (error) {
        console.error("Error disconnecting Redis client:", error);
        this.client.disconnect();
      }
    }
  }
}

module.exports = RedisCacheStrategy;
