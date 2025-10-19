// INTERVIEW CONCEPT: CPU-Intensive Operations with Worker Threads
// Demonstrates how to handle heavy computations without blocking the event loop

const express = require("express");
const { Worker } = require("worker_threads");
const path = require("path");
const router = express.Router();

// INTERVIEW CONCEPT: Worker Thread Pool Management
// Simple worker pool to reuse threads and avoid constant creation/destruction
class WorkerPool {
  constructor(size = 4) {
    this.size = size;
    this.workers = [];
    this.queue = [];
    this.activeJobs = 0;
  }

  // INTERVIEW CONCEPT: Worker Thread Execution
  async execute(data) {
    return new Promise((resolve, reject) => {
      const job = { data, resolve, reject };

      if (this.activeJobs < this.size) {
        this.runJob(job);
      } else {
        this.queue.push(job);
      }
    });
  }

  runJob(job) {
    this.activeJobs++;

    const worker = new Worker(
      path.join(__dirname, "../worker-threads-example.js"),
      {
        workerData: job.data,
      }
    );

    worker.on("message", (result) => {
      job.resolve(result);
      this.activeJobs--;
      this.processQueue();
      worker.terminate();
    });

    worker.on("error", (error) => {
      job.reject(error);
      this.activeJobs--;
      this.processQueue();
      worker.terminate();
    });
  }

  processQueue() {
    if (this.queue.length > 0 && this.activeJobs < this.size) {
      const job = this.queue.shift();
      this.runJob(job);
    }
  }
}

// INTERVIEW CONCEPT: Singleton Worker Pool
// Create a single worker pool instance for the application
const workerPool = new WorkerPool(4);

/**
 * @swagger
 * /api/compute/primes:
 *   post:
 *     summary: Find prime numbers using worker threads
 *     description: Demonstrates CPU-intensive computation using worker threads to avoid blocking the main thread
 *     tags: [Compute]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - numbers
 *             properties:
 *               numbers:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [2, 3, 4, 5, 17, 25, 29, 97, 100, 101]
 *                 description: Array of numbers to check for primality
 *     responses:
 *       200:
 *         description: Prime numbers found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 primes:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 count:
 *                   type: integer
 *                 processingTime:
 *                   type: integer
 *                   description: Processing time in milliseconds
 *                 workerId:
 *                   type: integer
 *                   description: Worker process ID
 *                 processedBy:
 *                   type: string
 *                   example: "worker-thread"
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// INTERVIEW CONCEPT: Non-blocking CPU-Intensive Route
router.post("/primes", async (req, res) => {
  try {
    const { numbers } = req.body;

    // INTERVIEW CONCEPT: Input Validation
    if (!numbers || !Array.isArray(numbers)) {
      return res.status(400).json({
        error: "Please provide an array of numbers",
        example: { numbers: [2, 3, 4, 5, 17, 25, 29, 97, 100, 101] },
      });
    }

    if (numbers.length === 0) {
      return res.status(400).json({ error: "Array cannot be empty" });
    }

    if (numbers.length > 10000) {
      return res
        .status(400)
        .json({ error: "Array too large (max 10000 numbers)" });
    }

    console.log(`Processing ${numbers.length} numbers for prime calculation`);
    const startTime = Date.now();

    // INTERVIEW CONCEPT: Worker Thread Delegation
    // Delegate CPU-intensive work to worker thread
    const result = await workerPool.execute(numbers);

    const totalTime = Date.now() - startTime;

    res.json({
      ...result,
      totalTime,
      processedBy: "worker-thread-pool",
      mainThreadBlocked: false,
    });
  } catch (error) {
    console.error("Error in prime computation:", error);
    res.status(500).json({ error: "Computation failed" });
  }
});

/**
 * @swagger
 * /api/compute/fibonacci:
 *   post:
 *     summary: Calculate Fibonacci sequence (blocking vs non-blocking)
 *     description: Demonstrates the difference between blocking and non-blocking operations
 *     tags: [Compute]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - n
 *             properties:
 *               n:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 45
 *                 example: 40
 *                 description: Fibonacci sequence position
 *               useWorkerThread:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to use worker thread (recommended)
 *     responses:
 *       200:
 *         description: Fibonacci number calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 result:
 *                   type: integer
 *                 n:
 *                   type: integer
 *                 processingTime:
 *                   type: integer
 *                 processedBy:
 *                   type: string
 *                 mainThreadBlocked:
 *                   type: boolean
 */
// INTERVIEW CONCEPT: Blocking vs Non-blocking Comparison
router.post("/fibonacci", async (req, res) => {
  try {
    const { n, useWorkerThread = true } = req.body;

    if (!n || n < 1 || n > 45) {
      return res.status(400).json({
        error: "Please provide n between 1 and 45",
        reason: "Higher values would take too long to compute",
      });
    }

    const startTime = Date.now();

    if (useWorkerThread) {
      // INTERVIEW CONCEPT: Non-blocking with Worker Thread
      const fibWorker = new Worker(
        path.join(__dirname, "../fibonacci-worker.js"),
        {
          workerData: { n },
        }
      );

      const result = await new Promise((resolve, reject) => {
        fibWorker.on("message", resolve);
        fibWorker.on("error", reject);
      });

      const processingTime = Date.now() - startTime;

      res.json({
        result,
        n,
        processingTime,
        processedBy: "worker-thread",
        mainThreadBlocked: false,
      });
    } else {
      // INTERVIEW CONCEPT: Blocking Main Thread (NOT RECOMMENDED)
      // This will block the event loop - for demonstration only
      function fibonacci(num) {
        if (num < 2) return num;
        return fibonacci(num - 1) + fibonacci(num - 2);
      }

      const result = fibonacci(n);
      const processingTime = Date.now() - startTime;

      res.json({
        result,
        n,
        processingTime,
        processedBy: "main-thread",
        mainThreadBlocked: true,
        warning:
          "This blocked the event loop - use worker threads for CPU-intensive tasks",
      });
    }
  } catch (error) {
    console.error("Error in fibonacci computation:", error);
    res.status(500).json({ error: "Computation failed" });
  }
});

/**
 * @swagger
 * /api/compute/stats:
 *   get:
 *     summary: Get system and process statistics
 *     description: Returns information about CPU, memory, and process statistics
 *     tags: [Compute]
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 system:
 *                   type: object
 *                 process:
 *                   type: object
 *                 cluster:
 *                   type: object
 */
// INTERVIEW CONCEPT: System Monitoring
router.get("/stats", (req, res) => {
  const os = require("os");

  // INTERVIEW CONCEPT: System Information Gathering
  const stats = {
    system: {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024) + " MB",
      freeMemory: Math.round(os.freemem() / 1024 / 1024) + " MB",
      uptime: Math.round(os.uptime()) + " seconds",
    },
    process: {
      pid: process.pid,
      version: process.version,
      uptime: Math.round(process.uptime()) + " seconds",
      memoryUsage: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + " MB",
        heapTotal:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
        heapUsed:
          Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
      },
    },
    cluster: {
      isMaster: require("cluster").isMaster,
      isWorker: require("cluster").isWorker,
      workerId: require("cluster").worker ? require("cluster").worker.id : null,
    },
  };

  res.json(stats);
});

module.exports = router;
