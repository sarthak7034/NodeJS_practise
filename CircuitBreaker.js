/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring service calls and opening the circuit
 * when failure rate exceeds threshold
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    this.expectedErrorTypes = options.expectedErrorTypes || [];

    // Circuit states
    this.state = "CLOSED"; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;

    // Monitoring
    this.requestCount = 0;
    this.successCount = 0;
    this.monitoringStartTime = Date.now();

    // Event callbacks
    this.onStateChange = options.onStateChange || (() => {});
    this.onFailure = options.onFailure || (() => {});
    this.onSuccess = options.onSuccess || (() => {});
  }

  async execute(operation, fallback = null) {
    if (this.state === "OPEN") {
      if (this.canAttemptReset()) {
        this.state = "HALF_OPEN";
        this.onStateChange("HALF_OPEN");
      } else {
        return this.handleOpenCircuit(fallback);
      }
    }

    try {
      this.requestCount++;
      const result = await operation();
      this.onCallSuccess();
      return result;
    } catch (error) {
      this.onCallFailure(error);

      if (fallback && this.state === "OPEN") {
        return await this.executeFallback(fallback);
      }

      throw error;
    }
  }

  onCallSuccess() {
    this.successCount++;
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.state = "CLOSED";
      this.onStateChange("CLOSED");
    }

    this.onSuccess();
  }

  onCallFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.shouldOpenCircuit()) {
      this.state = "OPEN";
      this.nextAttemptTime = Date.now() + this.recoveryTimeout;
      this.onStateChange("OPEN");
    }

    this.onFailure(error);
  }

  shouldOpenCircuit() {
    return this.failureCount >= this.failureThreshold;
  }

  canAttemptReset() {
    return Date.now() >= this.nextAttemptTime;
  }

  async handleOpenCircuit(fallback) {
    if (fallback) {
      return await this.executeFallback(fallback);
    }

    throw new Error(`Circuit breaker is OPEN. Service unavailable.`);
  }

  async executeFallback(fallback) {
    try {
      if (typeof fallback === "function") {
        return await fallback();
      }
      return fallback;
    } catch (error) {
      throw new Error(`Circuit breaker fallback failed: ${error.message}`);
    }
  }

  // Get current circuit breaker metrics
  getMetrics() {
    const now = Date.now();
    const uptime = now - this.monitoringStartTime;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      failureRate:
        this.requestCount > 0
          ? (this.requestCount - this.successCount) / this.requestCount
          : 0,
      uptime,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  // Reset circuit breaker to initial state
  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.monitoringStartTime = Date.now();
    this.onStateChange("CLOSED");
  }

  // Force open the circuit (useful for maintenance)
  forceOpen() {
    this.state = "OPEN";
    this.nextAttemptTime = Date.now() + this.recoveryTimeout;
    this.onStateChange("OPEN");
  }

  // Force close the circuit
  forceClose() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.nextAttemptTime = null;
    this.onStateChange("CLOSED");
  }
}

module.exports = CircuitBreaker;
