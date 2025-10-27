const CircuitBreaker = require("../CircuitBreaker");

/**
 * Circuit Breaker Middleware for Express.js
 * Protects routes from cascading failures
 */

class CircuitBreakerMiddleware {
  constructor() {
    this.breakers = new Map();
  }

  // Create or get circuit breaker for a specific service
  getBreaker(serviceName, options = {}) {
    if (!this.breakers.has(serviceName)) {
      const defaultOptions = {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        onStateChange: (state) => {
          console.log(`🔄 [${serviceName}] Circuit breaker state: ${state}`);
        },
        onFailure: (error) => {
          console.log(`❌ [${serviceName}] Failure recorded: ${error.message}`);
        },
      };

      this.breakers.set(
        serviceName,
        new CircuitBreaker({
          ...defaultOptions,
          ...options,
        })
      );
    }

    return this.breakers.get(serviceName);
  }

  // Middleware factory for protecting external service calls
  protect(serviceName, options = {}) {
    return (req, res, next) => {
      const breaker = this.getBreaker(serviceName, options);

      // Add circuit breaker to request object
      req.circuitBreaker = breaker;

      // Add helper method to execute protected operations
      req.executeProtected = async (operation, fallback) => {
        return breaker.execute(operation, fallback);
      };

      next();
    };
  }

  // Middleware for automatic fallback responses
  withFallback(serviceName, fallbackResponse, options = {}) {
    return async (req, res, next) => {
      const breaker = this.getBreaker(serviceName, options);

      try {
        // Store original res.json to intercept responses
        const originalJson = res.json.bind(res);
        let responseSent = false;

        res.json = function (data) {
          if (!responseSent) {
            responseSent = true;
            breaker.onCallSuccess();
            originalJson(data);
          }
        };

        // Override error handling
        const originalNext = next;
        next = function (error) {
          if (error && !responseSent) {
            responseSent = true;
            breaker.onCallFailure(error);

            if (breaker.state === "OPEN") {
              return res.status(503).json({
                error: "Service temporarily unavailable",
                fallback: fallbackResponse,
                circuitBreakerState: breaker.state,
              });
            }
          }
          originalNext(error);
        };

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  // Health check endpoint for circuit breaker status
  healthCheck() {
    return (req, res) => {
      const status = {};

      for (const [serviceName, breaker] of this.breakers) {
        status[serviceName] = breaker.getMetrics();
      }

      const overallHealth = Array.from(this.breakers.values()).every(
        (breaker) => breaker.state !== "OPEN"
      );

      res.status(overallHealth ? 200 : 503).json({
        status: overallHealth ? "healthy" : "degraded",
        services: status,
        timestamp: new Date().toISOString(),
      });
    };
  }

  // Reset all circuit breakers
  resetAll() {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  // Get metrics for all circuit breakers
  getAllMetrics() {
    const metrics = {};
    for (const [serviceName, breaker] of this.breakers) {
      metrics[serviceName] = breaker.getMetrics();
    }
    return metrics;
  }
}

// Example usage with Express routes
function createExampleRoutes(app, circuitBreakerMiddleware) {
  // Protected database route
  app.get(
    "/users/:id",
    circuitBreakerMiddleware.protect("database", {
      failureThreshold: 3,
      recoveryTimeout: 30000,
    }),
    async (req, res, next) => {
      try {
        const user = await req.executeProtected(
          // Primary operation
          async () => {
            // Simulate database call
            if (Math.random() < 0.3) {
              throw new Error("Database timeout");
            }
            return { id: req.params.id, name: `User ${req.params.id}` };
          },
          // Fallback
          () => ({ id: req.params.id, name: "Cached User", cached: true })
        );

        res.json(user);
      } catch (error) {
        next(error);
      }
    }
  );

  // Protected external API route
  app.get(
    "/external-data",
    circuitBreakerMiddleware.withFallback(
      "external-api",
      { message: "Using cached data", cached: true },
      { failureThreshold: 5, recoveryTimeout: 60000 }
    ),
    async (req, res, next) => {
      try {
        // Simulate external API call
        if (Math.random() < 0.4) {
          throw new Error("External API unavailable");
        }

        res.json({
          data: "Fresh data from external API",
          timestamp: Date.now(),
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Circuit breaker health check
  app.get("/health/circuit-breakers", circuitBreakerMiddleware.healthCheck());

  // Reset circuit breakers (admin endpoint)
  app.post("/admin/circuit-breakers/reset", (req, res) => {
    circuitBreakerMiddleware.resetAll();
    res.json({ message: "All circuit breakers reset" });
  });
}

module.exports = {
  CircuitBreakerMiddleware,
  createExampleRoutes,
};
