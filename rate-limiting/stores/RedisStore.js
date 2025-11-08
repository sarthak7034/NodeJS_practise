class RedisStore {
  constructor(redisClient, options = {}) {
    this.client = redisClient;
    this.prefix = options.prefix || "rl:";
  }

  async get(key) {
    const data = await this.client.get(this.prefix + key);
    return data ? JSON.parse(data) : null;
  }

  async set(key, value) {
    const fullKey = this.prefix + key;
    await this.client.set(fullKey, JSON.stringify(value));

    // Set expiration if resetTime exists
    if (value.resetTime) {
      const ttl = Math.ceil((value.resetTime + 60000) / 1000); // Add buffer
      await this.client.expire(fullKey, ttl);
    }
  }

  async delete(key) {
    await this.client.del(this.prefix + key);
  }

  async decrement(key) {
    const record = await this.get(key);
    if (record && record.count > 0) {
      record.count--;
      await this.set(key, record);
    }
  }

  async clear() {
    const keys = await this.client.keys(this.prefix + "*");
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async increment(key, windowMs) {
    const fullKey = this.prefix + key;
    const now = Date.now();

    // Use Redis transaction for atomic increment
    const multi = this.client.multi();
    multi.get(fullKey);
    const results = await multi.exec();

    const data = results[0] ? JSON.parse(results[0]) : null;

    if (!data || now - data.resetTime > windowMs) {
      const newData = { count: 1, resetTime: now };
      await this.set(key, newData);
      return newData;
    }

    data.count++;
    await this.set(key, data);
    return data;
  }
}

module.exports = RedisStore;
