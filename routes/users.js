// INTERVIEW CONCEPT: Express Router
// Router creates modular, mountable route handlers
// Allows separation of route logic into different files
const express = require("express");
const {
  cacheMiddleware,
  cacheInvalidationMiddleware,
} = require("../middleware/cacheMiddleware");
const {
  authenticate,
  authorize,
  optionalAuth,
} = require("../auth/authMiddleware");
const router = express.Router();

// INTERVIEW CONCEPT: In-Memory Data Storage
// Simple data store for demonstration purposes
// In production, this would be replaced with a database
// Shows data structure and basic CRUD operations
let users = [
  { id: 1, name: "John Doe", email: "john@example.com", age: 30 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", age: 25 },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", age: 35 },
];

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
 *     description: Retrieve a paginated list of users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 */
// INTERVIEW CONCEPT: GET Route with Query Parameters and Pagination
// Demonstrates handling query parameters and implementing pagination
router.get(
  "/",
  optionalAuth, // Optional authentication - shows different data based on auth status
  cacheMiddleware({ ttl: 60 }), // Cache for 1 minute
  (req, res) => {
    // INTERVIEW CONCEPT: Destructuring with Default Values
    // Extract query parameters with fallback defaults
    const { page = 1, limit = 10 } = req.query;

    // INTERVIEW CONCEPT: Pagination Logic
    // Calculate start and end indices for data slicing
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // INTERVIEW CONCEPT: Array Methods
    // slice() creates a shallow copy of array portion
    const paginatedUsers = users.slice(startIndex, endIndex);

    // INTERVIEW CONCEPT: Response Structure
    // Return data with metadata (pagination info)
    // Good API design practice
    res.json({
      users: paginatedUsers,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(users.length / limit),
        totalUsers: users.length,
      },
    });
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their unique identifier
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique user identifier
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// INTERVIEW CONCEPT: Route Parameters and Error Handling
// :id is a route parameter accessible via req.params
router.get(
  "/:id",
  cacheMiddleware({ ttl: 300 }), // Cache individual users for 5 minutes
  (req, res) => {
    // INTERVIEW CONCEPT: Type Conversion
    // req.params values are always strings, convert to number
    const userId = parseInt(req.params.id);

    // INTERVIEW CONCEPT: Array.find() Method
    // Finds first element that matches the condition
    const user = users.find((u) => u.id === userId);

    // INTERVIEW CONCEPT: HTTP Status Codes and Early Return
    // 404 for resource not found
    // Early return prevents further execution
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // INTERVIEW CONCEPT: Successful Response
    // 200 OK is default status for res.json()
    res.json(user);
  }
);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user with name, email, and optional age
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 150
 *                 example: 30
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// INTERVIEW CONCEPT: POST Route for Resource Creation
// Demonstrates data validation, conflict checking, and resource creation
router.post("/", authenticate, authorize("admin"), (req, res) => {
  // INTERVIEW CONCEPT: Request Body Destructuring
  // Extract data from request body (parsed by express.json() middleware)
  const { name, email, age } = req.body;

  // INTERVIEW CONCEPT: Input Validation
  // Always validate required fields
  // 400 Bad Request for invalid input
  if (!name || !email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  // INTERVIEW CONCEPT: Business Logic Validation
  // Check for duplicate email addresses
  // 409 Conflict for resource conflicts
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return res.status(409).json({ error: "Email already exists" });
  }

  // INTERVIEW CONCEPT: Object Creation with Spread Operator
  // Create new user object with auto-generated ID
  const newUser = {
    id: users.length + 1, // Simple ID generation (use UUID in production)
    name,
    email,
    age: age || null, // Handle optional fields
  };

  // INTERVIEW CONCEPT: Data Persistence
  // Add to in-memory store (would be database in production)
  users.push(newUser);

  // INTERVIEW CONCEPT: HTTP Status Codes
  // 201 Created for successful resource creation
  res.status(201).json(newUser);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user by ID
 *     description: Update an existing user's information (partial updates supported)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique user identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johnsmith@example.com"
 *               age:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 150
 *                 example: 31
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// INTERVIEW CONCEPT: PUT Route for Resource Updates
// Demonstrates partial updates and object merging
router.put("/:id", authenticate, authorize("admin"), (req, res) => {
  const userId = parseInt(req.params.id);

  // INTERVIEW CONCEPT: Array.findIndex() Method
  // Returns index of first matching element, -1 if not found
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const { name, email, age } = req.body;

  // INTERVIEW CONCEPT: Object Spread and Conditional Properties
  // Merge existing user with new data
  // Only update fields that are provided
  users[userIndex] = {
    ...users[userIndex], // Keep existing properties
    ...(name && { name }), // Conditional property assignment
    ...(email && { email }),
    ...(age !== undefined && { age }), // Handle falsy values correctly
  };

  // INTERVIEW CONCEPT: Return Updated Resource
  // Good practice to return the updated object
  res.json(users[userIndex]);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     description: Remove a user from the system
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique user identifier
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted successfully"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// INTERVIEW CONCEPT: DELETE Route for Resource Removal
// Demonstrates safe deletion with confirmation response
router.delete("/:id", authenticate, authorize("admin"), (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  // INTERVIEW CONCEPT: Array.splice() Method
  // Removes element at index and returns array of removed elements
  // [0] gets the first (and only) removed element
  const deletedUser = users.splice(userIndex, 1)[0];

  // INTERVIEW CONCEPT: Deletion Confirmation Response
  // Return confirmation message with deleted resource data
  // Helps with debugging and audit trails
  res.json({ message: "User deleted successfully", user: deletedUser });
});

// INTERVIEW CONCEPT: Cache Invalidation on Data Changes
// Invalidate user-related cache when users are modified
router.use(
  cacheInvalidationMiddleware({
    keyPatterns: ["api:*users*"],
  })
);

// INTERVIEW CONCEPT: Module Exports
// Export the router to be used in main server file
module.exports = router;
