// INTERVIEW CONCEPT: Cache Partitioning Strategies
// Distributing cache load across multiple cache instances for scalability

const crypto = require("crypto");

class CachePartitioning {
  constructor(cacheManagers = [], options = {}) {
    this.cacheManagers = cacheManagers;
    this.options = {
      strategy: "hash", // hash, consistent-hash, range, round-robin
      virtualNodes: 150, // For consistent hashing
      ...options,
    };

    this.stats = {
      requests: 0,
      partitionDistribution: {},
    };

    // Initialize consistent hashing ring if needed
    if (this.options.strategy === "consistent-hash") {
      this.initializeConsistentHashRing();
    }

    this.roundRobinIndex = 0;
  }

  // INTERVIEW CONCEPT: Hash-based Partitioning
  getPartitionByHash(key) {
    const hash = crypto.createHash("md5").update(key).digest("hex");
    const hashValue = parseInt(hash.substring(0, 8), 16);
    return hashValue % this.cacheManagers.length;
  }

  // INTERVIEW CONCEPT: Consistent Hashing for Better Distribution
  initializeConsistentHashRing() {
    this.hashRing = [];

    for (let i = 0; i < this.cacheManagers.length; i++) {
      for (let j = 0; j < this.options.virtualNodes; j++) {
        const virtualNodeKey = `${i}:${j}`;
        const hash = crypto
          .createHash("md5")
          .update(virtualNodeKey)
          .digest("hex");
        const hashValue = parseInt(hash.substring(0, 8), 16);

        this.hashRing.push({
          hash: hashValue,
          partition: i,
        });
      }
    }

    // Sort ring by hash value
    this.hashRing.sort((a, b) => a.hash - b.hash);
  }

  getPartitionByConsistentHash(key) {
    const hash = crypto.createHash("md5").update(key).digest("hex");
    const hashValue = parseInt(hash.substring(0, 8), 16);

    // Find the first node with hash >= key hash
    for (const node of this.hashRing) {
      if (node.hash >= hashValue) {
        return node.partition;
      }
    }

    // If no node found, use the first node (wrap around)
    return this.hashRing[0].partition;
  }

  // INTERVIEW CONCEPT: Range-based Partitioning
  getPartitionByRange(key) {
    // Simple alphabetical range partitioning
    const firstChar = key.charAt(0).toLowerCase();
    const charCode = firstChar.charCodeAt(0);
    const rangeSize = Math.ceil(26 / this.cacheManagers.length);
    const partition = Math.floor((charCode - 97) / rangeSize);
    return Math.min(partition, this.cacheManagers.length - 1);
  }

  // INTERVIEW CONCEPT: Round-robin Partitioning
  getPartitionByRoundRobin() {
    const partition = this.roundRobinIndex;
    this.roundRobinIndex =
      (this.roundRobinIndex + 1) % this.cacheManagers.length;
    return partition;
  }

  // Get the appropriate cache manager for a key
  getCacheManager(key) {
    let partition;

    switch (this.options.strategy) {
      case "hash":
        partition = this.getPartitionByHash(key);
        break;
      case "consistent-hash":
        partition = this.getPartitionByConsistentHash(key);
        break;
      case "range":
        partition = this.getPartitionByRange(key);
        break;
      case "round-robin":
        partition = this.getPartitionByRoundRobin();
        break;
      default:
        partition = 0;
    }

    // Update statistics
    this.stats.requests++;
    this.stats.partitionDistribution[partition] =
      (this.stats.partitionDistribution[partition] || 0) + 1;

    return {
      manager: this.cacheManagers[partition],
      partition,
    };
  }

  // INTERVIEW CONCEPT: Partitioned Cache Operations
  async get(key) {
    const { manager, partition } = this.getCacheManager(key);
    try {
      const result = await manager.get(key);
      return {
        data: result,
        partition,
        success: true,
      };
    } catch (error) {
      console.error(`Cache get error on partition ${partition}:`, error);
      return {
        data: null,
        partition,
        success: false,
        error: error.message,
      };
    }
  }

  async set(key, value, ttl = 300) {
    const { manager, partition } = this.getCacheManager(key);
    try {
      const result = await manager.set(key, value, ttl);
      return {
        success: result,
        partition,
      };
    } catch (error) {
      console.error(`Cache set error on partition ${partition}:`, error);
      return {
        success: false,
        partition,
        error: error.message,
      };
    }
  }

  async del(key) {
    const { manager, partition } = this.getCacheManager(key);
    try {
      const result = await manager.del(key);
      return {
        success: result,
        partition,
      };
    } catch (error) {
      console.error(`Cache delete error on partition ${partition}:`, error);
      return {
        success: false,
        partition,
        error: error.message,
      };
    }
  }

  // INTERVIEW CONCEPT: Broadcast Operations (Clear All Partitions)
  async clear() {
    const results = [];

    for (let i = 0; i < this.cacheManagers.length; i++) {
      try {
        await this.cacheManagers[i].clear();
        results.push({
          partition: i,
          success: true,
        });
      } catch (error) {
        console.error(`Cache clear error on partition ${i}:`, error);
        results.push({
          partition: i,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  // INTERVIEW CONCEPT: Aggregate Statistics from All Partitions
  async getStats() {
    const partitionStats = [];
    let totalHits = 0;
    let totalMisses = 0;
    let totalSize = 0;

    for (let i = 0; i < this.cacheManagers.length; i++) {
      try {
        const stats = await this.cacheManagers[i].getStats();
        partitionStats.push({
          partition: i,
          ...stats,
        });

        totalHits += stats.hits || 0;
        totalMisses += stats.misses || 0;
        totalSize += stats.size || 0;
      } catch (error) {
        console.error(`Stats error on partition ${i}:`, error);
        partitionStats.push({
          partition: i,
          error: error.message,
        });
      }
    }

    return {
      strategy: this.options.strategy,
      partitions: this.cacheManagers.length,
      totalHits,
      totalMisses,
      totalSize,
      hitRate:
        totalHits + totalMisses > 0
          ? ((totalHits / (totalHits + totalMisses)) * 100).toFixed(2) + "%"
          : "0%",
      partitionStats,
      distribution: this.stats.partitionDistribution,
      distributionBalance: this.calculateDistributionBalance(),
    };
  }

  // INTERVIEW CONCEPT: Load Balance Analysis
  calculateDistributionBalance() {
    const values = Object.values(this.stats.partitionDistribution);
    if (values.length === 0) return 100;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate coefficient of variation (lower is better balanced)
    const coefficientOfVariation =
      mean > 0 ? (standardDeviation / mean) * 100 : 0;

    // Convert to balance score (higher is better)
    const balanceScore = Math.max(0, 100 - coefficientOfVariation);

    return {
      score: balanceScore.toFixed(2) + "%",
      coefficientOfVariation: coefficientOfVariation.toFixed(2) + "%",
      mean: mean.toFixed(2),
      standardDeviation: standardDeviation.toFixed(2),
    };
  }

  // INTERVIEW CONCEPT: Partition Health Check
  async healthCheck() {
    const healthResults = [];

    for (let i = 0; i < this.cacheManagers.length; i++) {
      try {
        const health = await this.cacheManagers[i].healthCheck();
        healthResults.push({
          partition: i,
          ...health,
        });
      } catch (error) {
        healthResults.push({
          partition: i,
          healthy: false,
          error: error.message,
        });
      }
    }

    const healthyPartitions = healthResults.filter((h) => h.healthy).length;
    const totalPartitions = this.cacheManagers.length;

    return {
      overallHealth: healthyPartitions === totalPartitions,
      healthyPartitions,
      totalPartitions,
      healthPercentage:
        ((healthyPartitions / totalPartitions) * 100).toFixed(2) + "%",
      partitionHealth: healthResults,
    };
  }

  // INTERVIEW CONCEPT: Dynamic Partition Management
  addPartition(cacheManager) {
    this.cacheManagers.push(cacheManager);

    // Reinitialize consistent hash ring if using consistent hashing
    if (this.options.strategy === "consistent-hash") {
      this.initializeConsistentHashRing();
    }

    console.log(`Added partition ${this.cacheManagers.length - 1}`);
    return this.cacheManagers.length - 1;
  }

  removePartition(partitionIndex) {
    if (partitionIndex >= 0 && partitionIndex < this.cacheManagers.length) {
      this.cacheManagers.splice(partitionIndex, 1);

      // Reinitialize consistent hash ring if using consistent hashing
      if (this.options.strategy === "consistent-hash") {
        this.initializeConsistentHashRing();
      }

      console.log(`Removed partition ${partitionIndex}`);
      return true;
    }
    return false;
  }

  // INTERVIEW CONCEPT: Partition Migration (for rebalancing)
  async migrateData(fromPartition, toPartition, keyPattern = "*") {
    if (
      fromPartition >= this.cacheManagers.length ||
      toPartition >= this.cacheManagers.length
    ) {
      throw new Error("Invalid partition index");
    }

    const sourceManager = this.cacheManagers[fromPartition];
    const targetManager = this.cacheManagers[toPartition];

    // This is a simplified migration - in production you'd need more sophisticated key enumeration
    console.log(
      `Migrating data from partition ${fromPartition} to ${toPartition}`
    );

    // For demonstration, we'll just log the migration
    return {
      fromPartition,
      toPartition,
      keyPattern,
      status: "Migration would be performed here",
      timestamp: new Date().toISOString(),
    };
  }

  // Reset statistics
  resetStats() {
    this.stats = {
      requests: 0,
      partitionDistribution: {},
    };
  }
}

module.exports = CachePartitioning;
