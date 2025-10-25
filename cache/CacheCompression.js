// INTERVIEW CONCEPT: Cache Compression Strategies
// Optimizing cache storage and network transfer with compression

const zlib = require("zlib");
const { promisify } = require("util");

// Promisify compression functions for async/await usage
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const deflate = promisify(zlib.deflate);
const inflate = promisify(zlib.inflate);

class CacheCompression {
  constructor(options = {}) {
    this.options = {
      algorithm: "gzip", // gzip, deflate
      threshold: 1024, // Only compress data larger than 1KB
      level: 6, // Compression level (1-9)
      ...options,
    };

    this.stats = {
      compressions: 0,
      decompressions: 0,
      bytesBeforeCompression: 0,
      bytesAfterCompression: 0,
      compressionErrors: 0,
      decompressionErrors: 0,
    };
  }

  // INTERVIEW CONCEPT: Automatic Compression Based on Size
  async compress(data) {
    try {
      const serialized = JSON.stringify(data);
      const originalSize = Buffer.byteLength(serialized, "utf8");

      // Only compress if data is larger than threshold
      if (originalSize < this.options.threshold) {
        return {
          data: serialized,
          compressed: false,
          originalSize,
          compressedSize: originalSize,
        };
      }

      const buffer = Buffer.from(serialized, "utf8");
      let compressedBuffer;

      // Choose compression algorithm
      switch (this.options.algorithm) {
        case "gzip":
          compressedBuffer = await gzip(buffer, { level: this.options.level });
          break;
        case "deflate":
          compressedBuffer = await deflate(buffer, {
            level: this.options.level,
          });
          break;
        default:
          throw new Error(
            `Unsupported compression algorithm: ${this.options.algorithm}`
          );
      }

      const compressedSize = compressedBuffer.length;

      // Update statistics
      this.stats.compressions++;
      this.stats.bytesBeforeCompression += originalSize;
      this.stats.bytesAfterCompression += compressedSize;

      return {
        data: compressedBuffer.toString("base64"),
        compressed: true,
        algorithm: this.options.algorithm,
        originalSize,
        compressedSize,
        compressionRatio: (originalSize / compressedSize).toFixed(2),
      };
    } catch (error) {
      this.stats.compressionErrors++;
      console.error("Compression error:", error);
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Automatic Decompression
  async decompress(compressedData) {
    try {
      // If data wasn't compressed, return as-is
      if (!compressedData.compressed) {
        return JSON.parse(compressedData.data);
      }

      const compressedBuffer = Buffer.from(compressedData.data, "base64");
      let decompressedBuffer;

      // Choose decompression algorithm
      switch (compressedData.algorithm) {
        case "gzip":
          decompressedBuffer = await gunzip(compressedBuffer);
          break;
        case "deflate":
          decompressedBuffer = await inflate(compressedBuffer);
          break;
        default:
          throw new Error(
            `Unsupported decompression algorithm: ${compressedData.algorithm}`
          );
      }

      this.stats.decompressions++;

      const decompressedString = decompressedBuffer.toString("utf8");
      return JSON.parse(decompressedString);
    } catch (error) {
      this.stats.decompressionErrors++;
      console.error("Decompression error:", error);
      throw error;
    }
  }

  // INTERVIEW CONCEPT: Compression-Aware Cache Wrapper
  createCompressedCacheWrapper(cacheManager) {
    return {
      async get(key) {
        const compressedData = await cacheManager.get(key);
        if (compressedData === null) {
          return null;
        }

        // Handle both compressed and uncompressed data
        if (
          typeof compressedData === "object" &&
          compressedData.compressed !== undefined
        ) {
          return await this.decompress(compressedData);
        }

        // Legacy uncompressed data
        return compressedData;
      },

      async set(key, value, ttl) {
        const compressedData = await this.compress(value);
        return await cacheManager.set(key, compressedData, ttl);
      },

      async del(key) {
        return await cacheManager.del(key);
      },

      async clear() {
        return await cacheManager.clear();
      },

      async getStats() {
        const cacheStats = await cacheManager.getStats();
        return {
          ...cacheStats,
          compression: this.getCompressionStats(),
        };
      },
    };
  }

  // Get compression statistics
  getCompressionStats() {
    const totalSavings =
      this.stats.bytesBeforeCompression - this.stats.bytesAfterCompression;
    const averageCompressionRatio =
      this.stats.bytesBeforeCompression > 0
        ? (
            this.stats.bytesBeforeCompression / this.stats.bytesAfterCompression
          ).toFixed(2)
        : 0;

    return {
      ...this.stats,
      totalSavings,
      averageCompressionRatio,
      compressionEfficiency:
        this.stats.compressions > 0
          ? ((totalSavings / this.stats.bytesBeforeCompression) * 100).toFixed(
              2
            ) + "%"
          : "0%",
    };
  }
}

module.exports = CacheCompression;
