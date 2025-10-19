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

## Next Steps

This basic API can be enhanced with:

- Database integration (MongoDB, PostgreSQL)
- Authentication and authorization
- Input validation libraries
- Logging frameworks
- Testing (Jest, Mocha)
- ~~API documentation (Swagger)~~ ✅ **IMPLEMENTED**
- Rate limiting
- Caching strategies
- WebSocket implementation
- Microservices patterns
