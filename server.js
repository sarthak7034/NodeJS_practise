// INTERVIEW CONCEPT: Module imports and CommonJS
// Node.js uses CommonJS module system by default (require/module.exports)
// ES6 modules (import/export) can be used with "type": "module" in package.json
const express = require("express");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

// INTERVIEW CONCEPT: Environment Variables
// dotenv loads variables from .env file into process.env
// This is crucial for configuration management and security
require("dotenv").config();

// INTERVIEW CONCEPT: Express Application Instance
// Express is a minimal web framework for Node.js
// app is the main application object that handles HTTP requests
const app = express();

// INTERVIEW CONCEPT: Environment Configuration
// process.env accesses environment variables
// Fallback values ensure app works even without .env file
const PORT = process.env.PORT || 3000;

// INTERVIEW CONCEPT: Middleware in Express
// Middleware functions execute during request-response cycle
// They have access to req, res, and next() function
// Order matters - middleware executes in the order it's defined

// CORS middleware - handles Cross-Origin Resource Sharing
// Essential for APIs that serve frontend applications from different domains
app.use(cors());

// Built-in middleware for parsing JSON payloads
// Parses incoming requests with JSON payloads (Content-Type: application/json)
app.use(express.json());

// Built-in middleware for parsing URL-encoded data
// Handles form submissions (Content-Type: application/x-www-form-urlencoded)
app.use(express.urlencoded({ extended: true }));

// INTERVIEW CONCEPT: Custom Middleware
// Custom logging middleware demonstrates middleware pattern
// next() passes control to the next middleware in the stack
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next(); // CRITICAL: Always call next() or send a response
});

// INTERVIEW CONCEPT: API Documentation with Swagger
// Swagger provides interactive API documentation
// Essential for API development and team collaboration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Node.js Interview Preparation API",
      version: "1.0.0",
      description:
        "A comprehensive REST API demonstrating Node.js and Express.js concepts for interview preparation",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          required: ["name", "email"],
          properties: {
            id: {
              type: "integer",
              description: "Auto-generated unique identifier",
            },
            name: {
              type: "string",
              description: "User's full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
            age: {
              type: "integer",
              minimum: 0,
              maximum: 150,
              description: "User's age (optional)",
            },
          },
        },
        Post: {
          type: "object",
          required: ["title", "content", "userId"],
          properties: {
            id: {
              type: "integer",
              description: "Auto-generated unique identifier",
            },
            title: {
              type: "string",
              description: "Post title",
            },
            content: {
              type: "string",
              description: "Post content",
            },
            userId: {
              type: "integer",
              description: "ID of the user who created the post",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Post creation timestamp",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Post last update timestamp",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error message",
            },
          },
        },
      },
    },
  },
  apis: ["./server.js", "./routes/*.js"], // Paths to files containing OpenAPI definitions
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Node.js Interview API Docs",
  })
);

// INTERVIEW CONCEPT: Route Mounting and Modular Routing
// app.use() mounts router modules at specific paths
// This promotes code organization and separation of concerns
app.use("/api/users", require("./routes/users"));
app.use("/api/posts", require("./routes/posts"));
app.use("/api/compute", require("./routes/compute"));
app.use("/api/cache", require("./routes/cache"));

// INTERVIEW CONCEPT: Health Check Endpoint
// Essential for monitoring, load balancers, and container orchestration
// Shows server status, uptime, and timestamp
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Shows how long the process has been running
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get API information
 *     description: Returns basic information about the API and available endpoints
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 documentation:
 *                   type: string
 *                 endpoints:
 *                   type: object
 */
// INTERVIEW CONCEPT: API Documentation Endpoint
// Self-documenting API that lists available endpoints
// Good practice for API discoverability
app.get("/", (req, res) => {
  res.json({
    message: "Node.js Interview Preparation API",
    version: "1.0.0",
    documentation: "/api-docs",
    endpoints: {
      health: "/health",
      users: "/api/users",
      posts: "/api/posts",
      compute: "/api/compute",
      cache: "/api/cache",
      docs: "/api-docs",
    },
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns server health status, uptime, and current timestamp
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Server uptime in seconds
 */

// INTERVIEW CONCEPT: Global Error Handling Middleware
// Error middleware has 4 parameters: (err, req, res, next)
// Must be defined AFTER all other middleware and routes
// Catches any unhandled errors in the application
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// INTERVIEW CONCEPT: 404 Handler
// Catch-all route for undefined endpoints
// Must be the LAST route defined
// '*' matches any route that hasn't been handled above
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// INTERVIEW CONCEPT: Server Startup
// app.listen() starts the HTTP server on specified port
// Callback function executes when server is ready to accept connections
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to get started`);
});

// INTERVIEW CONCEPT: Module Exports
// Export the app instance for testing purposes
// Allows other modules to import and test the application
module.exports = app;
