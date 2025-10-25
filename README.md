# Node.js Interview Preparation API

A basic REST API built with Express.js covering fundamental Node.js concepts for interview preparation.

## Features Covered

### Basic Concepts

- Express.js server setup
- Middleware usage (CORS, JSON parsing, logging)
- RESTful API design
- Route handling and parameters
- Error handling
- Environment variables
- In-memory data storage
- **API Documentation with Swagger/OpenAPI**

### API Endpoints

#### Users

- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

#### Posts

- `GET /api/posts` - Get all posts (with filtering and sorting)
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

#### Compute (Multi-threading Demo)

- `POST /api/compute/primes` - Find prime numbers using worker threads
- `POST /api/compute/fibonacci` - Calculate Fibonacci (blocking vs non-blocking)
- `GET /api/compute/stats` - System and process statistics

#### Cache (Caching Strategies Demo)

**Basic Caching**:

- `GET /api/cache/strategies` - Available cache strategies
- `POST /api/cache/strategy` - Switch cache strategy
- `GET /api/cache/stats` - Cache performance statistics
- `GET /api/cache/health` - Cache health check
- `GET /api/cache/demo/slow-data` - Cached slow data (auto-caching demo)
- `GET /api/cache/demo/user-data` - User-specific cached data

**Advanced Caching Strategies**:

- `POST /api/cache/advanced/stampede-protection` - Cache stampede prevention
- `GET /api/cache/advanced/compression` - Cache compression demo
- `GET /api/cache/advanced/metrics` - Advanced caching metrics
- `POST /api/cache/advanced/warm` - Cache warming strategy

#### Utility

- `GET /` - API information
- `GET /health` - Health check

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   npm start
   ```

   Or for development with auto-reload:

   ```bash
   npm run dev
   ```

   **For clustered mode (multi-process):**

   ```bash
   npm run cluster
   ```

3. Visit `http://localhost:3000` to see the API information
4. **View Interactive API Documentation**: Visit `http://localhost:3000/api-docs` to explore the Swagger UI
5. **Test Multi-threading Features**: Try the compute endpoints to see worker threads in action
6. **Test Caching Features**: Use cache endpoints to see different caching strategies
7. **Optional Redis Setup**: Install Redis for distributed caching (falls back to in-memory if not available)

## Interview Topics Demonstrated

- **Express.js fundamentals**
- **Middleware concepts**
- **HTTP methods and status codes**
- **Request/Response handling**
- **Error handling patterns**
- **Data validation**
- **Query parameters and filtering**
- **RESTful API design principles**
- **Environment configuration**
- **API Documentation (Swagger/OpenAPI)**
- **Interactive API testing**
- **Multi-threading with Worker Threads**
- **Clustering for multi-core utilization**
- **CPU-intensive task handling**
- **Process and thread management**
- **Caching Strategies (In-memory & Redis)**
- **Advanced Caching Patterns**:
  - Cache stampede protection
  - Stale-while-revalidate pattern
  - Write-through and write-behind caching
  - Multi-level caching (L1/L2)
  - Cache compression and partitioning
  - Circuit breaker pattern for cache resilience
- **Cache middleware and automatic caching**
- **Cache invalidation patterns**
- **Performance optimization with caching**

## Next Steps

This basic API can be enhanced with:

- Database integration (MongoDB, PostgreSQL)
- Authentication and authorization
- Input validation libraries
- Logging frameworks
- Testing (Jest, Mocha)
- ~~API documentation (Swagger)~~ ✅ **IMPLEMENTED**
- ~~Caching strategies~~ ✅ **IMPLEMENTED** (Basic + Advanced)
- Rate limiting
- WebSocket implementation
- Microservices patterns
