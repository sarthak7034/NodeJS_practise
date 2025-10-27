const CircuitBreaker = require("./CircuitBreaker");

/**
 * Test suite for Circuit Breaker functionality
 */

async function testBasicCircuitBreaker() {
  console.log("🧪 Testing Basic Circuit Breaker...\n");

  let callCount = 0;
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 2000,
    onStateChange: (state) => console.log(`State changed to: ${state}`),
    onFailure: (error) => console.log(`Failure recorded: ${error.message}`),
    onSuccess: () => console.log(`Success recorded`),
  });

  // Simulate a flaky service
  const flakyService = async () => {
    callCount++;
    console.log(`Call ${callCount}`);

    if (callCount <= 5) {
      throw new Error(`Service failure ${callCount}`);
    }

    return `Success on call ${callCount}`;
  };

  // Test failure accumulation
  for (let i = 1; i <= 8; i++) {
    try {
      const result = await circuitBreaker.execute(flakyService);
      console.log(`✅ Result: ${result}`);
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log(`Metrics:`, circuitBreaker.getMetrics());
    console.log("---");

    // Wait a bit between calls
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Wait for recovery timeout
  console.log("\n⏳ Waiting for recovery timeout...");
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Test recovery
  console.log("\n🔄 Testing recovery...");
  try {
    const result = await circuitBreaker.execute(flakyService);
    console.log(`✅ Recovery successful: ${result}`);
  } catch (error) {
    console.log(`❌ Recovery failed: ${error.message}`);
  }

  console.log("\nFinal metrics:", circuitBreaker.getMetrics());
}

async function testCircuitBreakerWithFallback() {
  console.log("\n\n🧪 Testing Circuit Breaker with Fallback...\n");

  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 2,
    recoveryTimeout: 1000,
    onStateChange: (state) => console.log(`Fallback test - State: ${state}`),
  });

  const unreliableService = async (data) => {
    if (Math.random() < 0.8) {
      throw new Error("Service unavailable");
    }
    return `Processed: ${data}`;
  };

  const fallbackService = (data) => {
    return `Fallback result for: ${data}`;
  };

  // Test with fallback
  for (let i = 1; i <= 6; i++) {
    try {
      const result = await circuitBreaker.execute(
        () => unreliableService(`data-${i}`),
        () => fallbackService(`data-${i}`)
      );
      console.log(`Result ${i}: ${result}`);
    } catch (error) {
      console.log(`Error ${i}: ${error.message}`);
    }
  }
}

async function testCircuitBreakerStates() {
  console.log("\n\n🧪 Testing Circuit Breaker State Transitions...\n");

  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 2,
    recoveryTimeout: 1000,
    onStateChange: (state) => console.log(`🔄 State transition: ${state}`),
  });

  console.log("Initial state:", circuitBreaker.state);

  // Force failures to open circuit
  console.log("\n1. Forcing failures to open circuit...");
  for (let i = 0; i < 3; i++) {
    try {
      await circuitBreaker.execute(() => {
        throw new Error("Forced failure");
      });
    } catch (error) {
      console.log(`Failure ${i + 1}: ${error.message}`);
    }
  }

  console.log("State after failures:", circuitBreaker.state);

  // Try to call while circuit is open
  console.log("\n2. Attempting call while circuit is open...");
  try {
    await circuitBreaker.execute(() => "This should not execute");
  } catch (error) {
    console.log(`Expected error: ${error.message}`);
  }

  // Wait for half-open state
  console.log("\n3. Waiting for recovery timeout...");
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Test half-open state
  console.log("\n4. Testing half-open state...");
  try {
    const result = await circuitBreaker.execute(() => "Recovery successful");
    console.log(`Recovery result: ${result}`);
  } catch (error) {
    console.log(`Recovery failed: ${error.message}`);
  }

  console.log("Final state:", circuitBreaker.state);
}

async function testCircuitBreakerMetrics() {
  console.log("\n\n🧪 Testing Circuit Breaker Metrics...\n");

  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    recoveryTimeout: 1000,
  });

  // Generate some traffic
  const results = [];
  for (let i = 0; i < 10; i++) {
    try {
      const result = await circuitBreaker.execute(() => {
        if (Math.random() < 0.4) {
          throw new Error("Random failure");
        }
        return `Success ${i}`;
      });
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }

  // Display results
  console.log("Results:");
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`${index + 1}. ✅ ${result.result}`);
    } else {
      console.log(`${index + 1}. ❌ ${result.error}`);
    }
  });

  // Display metrics
  console.log("\nFinal Metrics:");
  const metrics = circuitBreaker.getMetrics();
  console.log(`State: ${metrics.state}`);
  console.log(`Total Requests: ${metrics.requestCount}`);
  console.log(`Successful Requests: ${metrics.successCount}`);
  console.log(
    `Failed Requests: ${metrics.requestCount - metrics.successCount}`
  );
  console.log(`Failure Rate: ${(metrics.failureRate * 100).toFixed(2)}%`);
  console.log(`Uptime: ${metrics.uptime}ms`);
}

// Run all tests
async function runAllTests() {
  try {
    await testBasicCircuitBreaker();
    await testCircuitBreakerWithFallback();
    await testCircuitBreakerStates();
    await testCircuitBreakerMetrics();

    console.log("\n🎉 All tests completed!");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testBasicCircuitBreaker,
  testCircuitBreakerWithFallback,
  testCircuitBreakerStates,
  testCircuitBreakerMetrics,
  runAllTests,
};
