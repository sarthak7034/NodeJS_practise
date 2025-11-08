# Input Validation & Rate Limiting Library

A comprehensive Node.js library for input validation, data sanitization, and rate limiting.

## Features

### Validation

- Chainable validation rules
- 30+ pre-built validators
- Custom validation functions
- Express middleware support
- Detailed error messages

### Sanitization

- String sanitizers (trim, escape, normalize)
- Type conversion (number, boolean, date)
- Array and object sanitizers
- Email normalization

### Rate Limiting

- Multiple strategies (Fixed Window, Sliding Window, Token Bucket)
- Memory and Redis storage
- Flexible key generation (IP, User, API Key, etc.)
- Pre-configured presets for common use cases
- Custom handlers and callbacks

## Installation

```bash
npm install
```

## Quick Start

### Validation

```javascript
const { Validator } = require("./validation");

const validator = new Validator();

validator.field("email").required().email();

validator.field("age").number().min(18);

try {
  validator.validate({ email: "user@example.com", age: 25 });
  console.log("Valid!");
} catch (error) {
  console.log(error.errors);
}
```

### Rate Limiting

```javascript
const { presets } = require("./rate-limiting");
const express = require("express");
const app = express();

// Apply rate limiting
app.use("/api/", presets.api().middleware());

app.post("/api/login", presets.auth().middleware(), (req, res) => {
  res.json({ success: true });
});
```

## Validation API

### Basic Rules

```javascript
validator
  .field("username")
  .required()
  .string()
  .min(3)
  .max(20)
  .pattern(/^[a-zA-Z0-9_]+$/);
```

### Common Validators

```javascript
const { commonValidators } = require("./validation");

validator.field("email").custom(commonValidators.isEmail);
validator.field("url").custom(commonValidators.isURL);
validator.field("phone").custom(commonValidators.isPhoneNumber);
validator.field("password").custom(commonValidators.isStrongPassword);
```

### Sanitizers

```javascript
const { sanitizers } = require("./validation");

const clean = sanitizers.trim(input);
const email = sanitizers.normalizeEmail(input);
const safe = sanitizers.escape(input);
```

### Express Middleware

```javascript
const { validate } = require("./validation");

app.post("/users", validate(userValidator), (req, res) => {
  // req.body is validated
});
```

## Rate Limiting API

### Basic Usage

```javascript
const { RateLimiter } = require("./rate-limiting");

const limiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

app.use(limiter.middleware());
```

### Presets

```javascript
const { presets } = require("./rate-limiting");

// Authentication (5 requests per 15 minutes)
app.post("/login", presets.auth().middleware());

// API endpoints (60 requests per minute)
app.use("/api/", presets.api().middleware());

// Public endpoints (100 requests per minute)
app.use("/public/", presets.public().middleware());

// File uploads (10 requests per hour)
app.post("/upload", presets.upload().middleware());
```

### Key Generators

```javascript
const { keyGenerators } = require("./rate-limiting");

// By IP address
const limiter = new RateLimiter({
  keyGenerator: keyGenerators.byIP,
});

// By user ID
const limiter = new RateLimiter({
  keyGenerator: keyGenerators.byUserID,
});

// By API key
const limiter = new RateLimiter({
  keyGenerator: keyGenerators.byAPIKey,
});

// Custom
const limiter = new RateLimiter({
  keyGenerator: (req) => req.headers["x-custom-id"],
});
```

### Strategies

#### Fixed Window (default)

```javascript
const { RateLimiter } = require("./rate-limiting");
const limiter = new RateLimiter({ windowMs: 60000, maxRequests: 100 });
```

#### Sliding Window

```javascript
const { SlidingWindowRateLimiter } = require("./rate-limiting");
const limiter = new SlidingWindowRateLimiter({
  windowMs: 60000,
  maxRequests: 100,
});
```

#### Token Bucket

```javascript
const { TokenBucketRateLimiter } = require("./rate-limiting");
const limiter = new TokenBucketRateLimiter({ capacity: 100, refillRate: 10 });
```

### Redis Store

```javascript
const { RateLimiter, RedisStore } = require("./rate-limiting");
const redis = require("redis");

const client = redis.createClient();
const limiter = new RateLimiter({
  store: new RedisStore(client),
});
```

### Custom Handlers

```javascript
const limiter = new RateLimiter({
  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests" });
  },
  onLimitReached: (req, key) => {
    console.log(`Rate limit exceeded: ${key}`);
  },
});
```

## Examples

See `validation/examples.js` and `rate-limiting/examples.js` for complete examples.

## License

MIT
