# Node.js Interview Concepts Explained

This document explains the key Node.js and Express.js concepts demonstrated in the codebase, commonly asked about in interviews.

## 1. Module System (CommonJS)

**Location**: Throughout all files
**Concept**: Node.js uses CommonJS module system by default

```javascript
// Importing modules
const express = require("express");

// Exporting modules
module.exports = router;
```

**Interview Questions**:

- What's the difference between CommonJS and ES6 modules?
- How does `require()` work internally?
- What is the module cache?

## 2. Express.js Fundamentals

**Location**: `server.js`
**Concept**: Express is a minimal web framework for Node.js

```javascript
const app = express();
app.listen(PORT, callback);
```

**Interview Questions**:

- What is Express.js and why use it?
- How does Express handle HTTP requests?
- What's the difference between Express and raw Node.js HTTP module?

## 3. Middleware Pattern

**Location**: `server.js`
**Concept**: Functions that execute during request-response cycle

```javascript
// Built-in middleware
app.use(express.json());

// Custom middleware
app.use((req, res, next) => {
  console.log("Request logged");
  next(); // Pass control to next middleware
});
```

**Interview Questions**:

- What is middleware in Express?
- What happens if you don't call `next()`?
- What's the difference between application-level and router-level middleware?

## 4. Routing and HTTP Methods

**Location**: `routes/users.js`, `routes/posts.js`
**Concept**: Handling different HTTP methods and URL patterns

```javascript
router.get("/", handler); // GET /api/users
router.post("/", handler); // POST /api/users
router.get("/:id", handler); // GET /api/users/123
```

**Interview Questions**:

- What are the main HTTP methods and their purposes?
- How do route parameters work?
- What's the difference between query parameters and route parameters?

## 5. Request and Response Objects

**Location**: All route handlers
**Concept**: Express enhances Node.js req/res objects

```javascript
// Request object properties
req.params.id; // Route parameters
req.query.page; // Query parameters
req.body.name; // Request body (after parsing)

// Response methods
res.json(data); // Send JSON response
res.status(404); // Set status code
res.status(201).json(); // Chain methods
```

**Interview Questions**:

- What's the difference between `req.params`, `req.query`, and `req.body`?
- How do you handle different response formats?
- What are HTTP status codes and when to use them?

## 6. Error Handling

**Location**: `server.js`
**Concept**: Centralized error handling in Express

```javascript
// Error middleware (4 parameters)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});
```

**Interview Questions**:

- How does error handling work in Express?
- What's the difference between synchronous and asynchronous error handling?
- How do you handle validation errors?

## 7. Environment Variables

**Location**: `server.js`, `.env`
**Concept**: Configuration management and security

```javascript
require("dotenv").config();
const PORT = process.env.PORT || 3000;
```

**Interview Questions**:

- Why use environment variables?
- How do you manage different environments (dev, staging, prod)?
- What should never be hardcoded in your application?

## 8. Data Validation

**Location**: Route handlers in `routes/users.js`
**Concept**: Input validation and sanitization

```javascript
if (!name || !email) {
  return res.status(400).json({ error: "Name and email are required" });
}
```

**Interview Questions**:

- Why is input validation important?
- What's the difference between client-side and server-side validation?
- How do you prevent SQL injection and XSS attacks?

## 9. HTTP Status Codes

**Location**: All route handlers
**Concept**: Proper status code usage

```javascript
res.status(200); // OK (default for successful GET)
res.status(201); // Created (successful POST)
res.status(400); // Bad Request (validation errors)
res.status(404); // Not Found
res.status(409); // Conflict (duplicate resource)
res.status(500); // Internal Server Error
```

**Interview Questions**:

- What are the main HTTP status code categories?
- When do you use 201 vs 200?
- What's the difference between 401 and 403?

## 10. RESTful API Design

**Location**: Route structure
**Concept**: REST principles and conventions

```
GET    /api/users     - Get all users
GET    /api/users/:id - Get specific user
POST   /api/users     - Create new user
PUT    /api/users/:id - Update user
DELETE /api/users/:id - Delete user
```

**Interview Questions**:

- What is REST and what are its principles?
- How do you design RESTful URLs?
- What's the difference between PUT and PATCH?

## 11. Query Parameters and Filtering

**Location**: `routes/users.js` (pagination), `routes/posts.js` (filtering/sorting)
**Concept**: Advanced query handling

```javascript
const { page = 1, limit = 10, sortBy = "createdAt" } = req.query;
```

**Interview Questions**:

- How do you implement pagination?
- What's the difference between offset-based and cursor-based pagination?
- How do you handle sorting and filtering?

## 12. JavaScript Array Methods

**Location**: Throughout route handlers
**Concept**: Essential array manipulation methods

```javascript
users.find((u) => u.id === userId); // Find single item
users.filter((p) => p.userId === userId); // Filter items
users.findIndex((u) => u.id === userId); // Find index
users.slice(startIndex, endIndex); // Get portion
users.splice(index, 1); // Remove items
```

**Interview Questions**:

- What's the difference between `find()` and `filter()`?
- How does `splice()` differ from `slice()`?
- Which array methods mutate the original array?

## 13. Object Manipulation

**Location**: Update operations in route handlers
**Concept**: Modern JavaScript object handling

```javascript
// Destructuring with defaults
const { name, email, age = null } = req.body;

// Spread operator for merging
const updatedUser = {
  ...existingUser,
  ...newData,
};

// Conditional properties
const user = {
  id: 1,
  ...(name && { name }),
  ...(email && { email }),
};
```

**Interview Questions**:

- How does object destructuring work?
- What's the spread operator and when do you use it?
- How do you conditionally add properties to objects?

## 14. Asynchronous JavaScript Concepts

**Location**: Implicit in callback functions
**Concept**: Understanding async patterns (preparation for promises/async-await)

```javascript
// Callback pattern (current implementation)
app.get("/", (req, res) => {
  // This is a callback function
});

// This prepares for:
// - Promises
// - Async/Await
// - Database operations
```

**Interview Questions**:

- What's the event loop in Node.js?
- How do callbacks work?
- What are Promises and how do they solve callback hell?

## 15. CORS (Cross-Origin Resource Sharing)

**Location**: `server.js`
**Concept**: Handling cross-origin requests

```javascript
app.use(cors());
```

**Interview Questions**:

- What is CORS and why is it needed?
- How do you configure CORS for specific origins?
- What are preflight requests?

## 16. Process and Environment

**Location**: `server.js`
**Concept**: Node.js process object

```javascript
process.env.PORT; // Environment variables
process.uptime(); // Process uptime
```

**Interview Questions**:

- What is the Node.js process object?
- How do you handle process signals?
- What's the difference between `process.exit()` and graceful shutdown?

## Next Level Concepts (For Enhancement)

These concepts can be added to make the API more interview-ready:

1. **Database Integration** (MongoDB, PostgreSQL)
2. **Authentication & Authorization** (JWT, sessions)
3. **Input Validation Libraries** (Joi, express-validator)
4. **Testing** (Jest, Mocha, Supertest)
5. **Logging** (Winston, Morgan)
6. **Rate Limiting** (express-rate-limit)
7. **Caching** (Redis, in-memory)
8. **WebSockets** (Socket.io)
9. **File Uploads** (Multer)
10. **API Documentation** (Swagger/OpenAPI)
11. **Security** (Helmet, bcrypt)
12. **Performance** (Clustering, PM2)
13. **Monitoring** (Health checks, metrics)
14. **Microservices** (Service communication)
15. **Docker** (Containerization)
