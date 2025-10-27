const express = require("express");
const {
  CircuitBreakerMiddleware,
  createExampleRoutes,
} = require("./middleware/circuitBreakerMiddleware");
const CircuitBreaker = require("./CircuitBreaker");

const app = express();
const port = process.env.PORT || 3000;

// Initialize circuit breaker middleware
const circuitBreakerMiddleware = new CircuitBreakerMiddleware();

app.use(express.json());

// Example: Service classes with circuit breakers
class PaymentService {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      recoveryTimeout: 45000,
      onStateChange: (state) => {
        console.log(`💳 Payment service circuit breaker: ${state}`);
      },
    });
  }

  async processPayment(amount, cardToken) {
    return this.circuitBreaker.execute(
      async () => {
        // Simulate payment processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (Math.random() < 0.2) {
          throw new Error("Payment gateway timeout");
        }

        return {
          transactionId: `txn_${Date.now()}`,
          amount,
          status: "completed",
          timestamp: new Date().toISOString(),
        };
      },
      // Fallback: Queue payment for later processing
      () => ({
        transactionId: `queued_${Date.now()}`,
        amount,
        status: "queued",
        message: "Payment queued due to service unavailability",
      })
    );
  }
}

class NotificationService {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      recoveryTimeout: 30000,
      onStateChange: (state) => {
        console.log(`📧 Notification service circuit breaker: ${state}`);
      },
    });
  }

  async sendEmail(to, subject, body) {
    return this.circuitBreaker.execute(
      async () => {
        // Simulate email sending
        await new Promise((resolve) => setTimeout(resolve, 200));

        if (Math.random() < 0.3) {
          throw new Error("SMTP server unavailable");
        }

        return {
          messageId: `msg_${Date.now()}`,
          to,
          subject,
          status: "sent",
        };
      },
      // Fallback: Queue email for later
      () => ({
        messageId: `queued_${Date.now()}`,
        to,
        subject,
        status: "queued",
        message: "Email queued for later delivery",
      })
    );
  }
}

// Initialize services
const paymentService = new PaymentService();
const notificationService = new NotificationService();

// Routes with circuit breaker protection
app.post("/payments", async (req, res, next) => {
  try {
    const { amount, cardToken } = req.body;

    if (!amount || !cardToken) {
      return res.status(400).json({ error: "Amount and cardToken required" });
    }

    const payment = await paymentService.processPayment(amount, cardToken);

    // Try to send confirmation email (non-blocking)
    notificationService
      .sendEmail(
        "customer@example.com",
        "Payment Confirmation",
        `Payment of $${amount} processed`
      )
      .catch((error) => {
        console.log("Email notification failed:", error.message);
      });

    res.json(payment);
  } catch (error) {
    next(error);
  }
});

app.post("/notifications/email", async (req, res, next) => {
  try {
    const { to, subject, body } = req.body;

    if (!to || !subject || !body) {
      return res.status(400).json({ error: "to, subject, and body required" });
    }

    const result = await notificationService.sendEmail(to, subject, body);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Add example routes from middleware
createExampleRoutes(app, circuitBreakerMiddleware);

// Comprehensive health check
app.get("/health", (req, res) => {
  const services = {
    payment: paymentService.circuitBreaker.getMetrics(),
    notification: notificationService.circuitBreaker.getMetrics(),
    ...circuitBreakerMiddleware.getAllMetrics(),
  };

  const allHealthy = Object.values(services).every(
    (service) => service.state !== "OPEN"
  );

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    services,
    timestamp: new Date().toISOString(),
  });
});

// Admin endpoints for circuit breaker management
app.post("/admin/circuit-breakers/:service/reset", (req, res) => {
  const { service } = req.params;

  switch (service) {
    case "payment":
      paymentService.circuitBreaker.reset();
      break;
    case "notification":
      notificationService.circuitBreaker.reset();
      break;
    case "all":
      paymentService.circuitBreaker.reset();
      notificationService.circuitBreaker.reset();
      circuitBreakerMiddleware.resetAll();
      break;
    default:
      return res.status(400).json({ error: "Unknown service" });
  }

  res.json({ message: `Circuit breaker for ${service} reset` });
});

app.post("/admin/circuit-breakers/:service/force-open", (req, res) => {
  const { service } = req.params;

  switch (service) {
    case "payment":
      paymentService.circuitBreaker.forceOpen();
      break;
    case "notification":
      notificationService.circuitBreaker.forceOpen();
      break;
    default:
      return res.status(400).json({ error: "Unknown service" });
  }

  res.json({ message: `Circuit breaker for ${service} forced open` });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error.message);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Circuit Breaker Demo Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(
    `🔧 Circuit breaker health: http://localhost:${port}/health/circuit-breakers`
  );
  console.log("\n🧪 Test endpoints:");
  console.log(`  POST http://localhost:${port}/payments`);
  console.log(`  POST http://localhost:${port}/notifications/email`);
  console.log(`  GET  http://localhost:${port}/users/123`);
  console.log(`  GET  http://localhost:${port}/external-data`);
});

module.exports = app;
