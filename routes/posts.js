const express = require("express");
const router = express.Router();

// INTERVIEW CONCEPT: Related Data Structure
// Posts are related to users through userId (foreign key concept)
// Demonstrates one-to-many relationship modeling
let posts = [
  {
    id: 1,
    title: "First Post",
    content: "This is the first post",
    userId: 1,
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "Second Post",
    content: "This is the second post",
    userId: 2,
    createdAt: new Date(),
  },
  {
    id: 3,
    title: "Third Post",
    content: "This is the third post",
    userId: 1,
    createdAt: new Date(),
  },
];

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts with filtering and sorting
 *     description: Retrieve posts with optional filtering by user and sorting capabilities
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter posts by user ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, title, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Post'
 */
// INTERVIEW CONCEPT: Advanced Query Parameters (Filtering and Sorting)
// Demonstrates filtering, sorting, and query parameter handling
router.get("/", (req, res) => {
  // INTERVIEW CONCEPT: Query Parameters with Defaults
  // Extract filtering and sorting parameters
  const { userId, sortBy = "createdAt", order = "desc" } = req.query;

  let filteredPosts = posts;

  // INTERVIEW CONCEPT: Conditional Filtering
  // Filter posts by userId if parameter is provided
  if (userId) {
    filteredPosts = posts.filter((p) => p.userId === parseInt(userId));
  }

  // INTERVIEW CONCEPT: Dynamic Sorting
  // Sort by any field with ascending/descending order
  filteredPosts.sort((a, b) => {
    if (order === "asc") {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    }
    return a[sortBy] < b[sortBy] ? 1 : -1;
  });

  res.json(filteredPosts);
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     description: Retrieve a specific post by its unique identifier
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique post identifier
 *     responses:
 *       200:
 *         description: Post found successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /api/posts/:id - Get post by ID
router.get("/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  res.json(post);
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post linked to a user
 *     tags: [Posts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - userId
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My First Blog Post"
 *               content:
 *                 type: string
 *                 example: "This is the content of my first blog post."
 *               userId:
 *                 type: integer
 *                 example: 1
 *                 description: ID of the user creating the post
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// INTERVIEW CONCEPT: Resource Creation with Relationships
// Creates posts linked to users via userId
router.post("/", (req, res) => {
  const { title, content, userId } = req.body;

  // INTERVIEW CONCEPT: Multi-field Validation
  // Validate all required fields for post creation
  if (!title || !content || !userId) {
    return res
      .status(400)
      .json({ error: "Title, content, and userId are required" });
  }

  // INTERVIEW CONCEPT: Timestamp Generation
  // Add creation timestamp for audit trail
  const newPost = {
    id: posts.length + 1,
    title,
    content,
    userId: parseInt(userId), // Ensure userId is a number
    createdAt: new Date(), // Automatic timestamp
  };

  posts.push(newPost);
  res.status(201).json(newPost);
});

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update post by ID
 *     description: Update an existing post's title and/or content
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique post identifier
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Post Title"
 *               content:
 *                 type: string
 *                 example: "This is the updated content of the post."
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// INTERVIEW CONCEPT: Resource Updates with Audit Trail
// Updates posts and tracks modification time
router.put("/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = posts.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { title, content } = req.body;

  // INTERVIEW CONCEPT: Update Tracking
  // Add updatedAt timestamp to track modifications
  posts[postIndex] = {
    ...posts[postIndex],
    ...(title && { title }),
    ...(content && { content }),
    updatedAt: new Date(), // Track when resource was last modified
  };

  res.json(posts[postIndex]);
});

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete post by ID
 *     description: Remove a post from the system
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique post identifier
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post deleted successfully"
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// DELETE /api/posts/:id - Delete post
router.delete("/:id", (req, res) => {
  const postId = parseInt(req.params.id);
  const postIndex = posts.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    return res.status(404).json({ error: "Post not found" });
  }

  const deletedPost = posts.splice(postIndex, 1)[0];
  res.json({ message: "Post deleted successfully", post: deletedPost });
});

module.exports = router;
