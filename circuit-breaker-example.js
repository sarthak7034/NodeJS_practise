const CircuitBreaker = require("./CircuitBreaker");

// Example: Database service with circuit breaker
class DatabaseService {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 30000, // 30 seconds
      onStateChange: (state) => {
        console.log(`🔄 Circuit breaker state changed to: ${state}`);
      },
      onFailure: (error) => {
        console.log(`❌ Circuit breaker recorded failure: ${error.message}`);
      },
      onSuccess: () => {
        console.log(`✅ Circuit breaker recorded success`);
      },
    });
  }

  async getUserById(id) {
    return this.circuitBreaker.execute(
      // Primary operation
      async () => {
        return await this.simulateDbCall(id);
      },
      // Fallback operation
      async () => {
        console.log("🔄 Using fallback: returning cached user data");
        return { id, name: "Cached User", email: "cached@example.com" };
      }
    );
  }

  // Simulate database call that might fail
  async simulateDbCall(id) {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate random failures (70% success rate)
    if (Math.random() < 0.3) {
      throw new Error("Database connection timeout");
    }

    return { id, name: `User ${id}`, email: `user${id}@example.com` };
  }
}

// Example: HTTP service with circuit breaker
class HttpService {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      onStateChange: (state) => {
        console.log(`🌐 HTTP Circuit breaker state: ${state}`);
      },
    });
  }

  async fetchData(url) {
    return this.circuitBreaker.execute(
      async () => {
        // Simulate HTTP request
        return await this.simulateHttpRequest(url);
      },
      // Fallback to cached data
      () => {
        return { data: "fallback data", cached: true };
      }
    );
  }

  async simulateHttpRequest(url) {
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Simulate failures
    if (Math.random() < 0.4) {
      throw new Error(`HTTP request failed for ${url}`);
    }

    return { data: `Response from ${url}`, timestamp: Date.now() };
  }
}

// Demo function
async function demonstrateCircuitBreaker() {
  console.log("🚀 Circuit Breaker Demo Starting...\n");

  const dbService = new DatabaseService();
  const httpService = new HttpService();

  // Test database service
  console.log("📊 Testing Database Service:");
  for (let i = 1; i <= 10; i++) {
    try {
      const user = await dbService.getUserById(i);
      console.log(`User ${i}:`, user);
    } catch (error) {
      console.log(`❌ Failed to get user ${i}: ${error.message}`);
    }

    // Show metrics every few calls
    if (i % 3 === 0) {
      console.log("📈 Metrics:", dbService.circuitBreaker.getMetrics());
      console.log("---");
    }
  }

  console.log("\n🌐 Testing HTTP Service:");
  for (let i = 1; i <= 8; i++) {
    try {
      const response = await httpService.fetchData(`/api/data/${i}`);
      console.log(`Response ${i}:`, response);
    } catch (error) {
      console.log(`❌ HTTP request ${i} failed: ${error.message}`);
    }
  }

  // Show final metrics
  console.log("\n📊 Final Metrics:");
  console.log("DB Service:", dbService.circuitBreaker.getMetrics());
  console.log("HTTP Service:", httpService.circuitBreaker.getMetrics());
}

// Advanced circuit breaker with custom error handling
class AdvancedCircuitBreaker extends CircuitBreaker {
  constructor(options = {}) {
    super(options);
    this.errorClassification =
      options.errorClassification || this.defaultErrorClassification;
  }

  defaultErrorClassification(error) {
    // Only count certain errors as failures
    const temporaryErrors = [
      "TIMEOUT",
      "CONNECTION_REFUSED",
      "SERVICE_UNAVAILABLE",
    ];
    return temporaryErrors.some((type) => error.message.includes(type));
  }

  onCallFailure(error) {
    // Only count classified errors as circuit breaker failures
    if (this.errorClassification(error)) {
      super.onCallFailure(error);
    } else {
      // Still call the failure callback but don't affect circuit state
      this.onFailure(error);
    }
  }
}

// Export for use in other modules
module.exports = {
  CircuitBreaker,
  DatabaseService,
  HttpService,
  AdvancedCircuitBreaker,
  demonstrateCircuitBreaker,
};

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateCircuitBreaker().catch(console.error);
}
