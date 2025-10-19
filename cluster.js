// INTERVIEW CONCEPT: Node.js Clustering
// Node.js is single-threaded but can utilize multiple CPU cores through clustering
// Master process spawns worker processes to handle requests

const cluster = require("cluster");
const os = require("os");

// INTERVIEW CONCEPT: CPU Core Detection
// os.cpus().length returns the number of CPU cores available
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  console.log(`Starting ${numCPUs} worker processes...`);

  // INTERVIEW CONCEPT: Worker Process Management
  // Fork workers equal to the number of CPU cores
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();

    // INTERVIEW CONCEPT: Worker Process Monitoring
    worker.on("online", () => {
      console.log(`Worker ${worker.process.pid} is online`);
    });
  }

  // INTERVIEW CONCEPT: Worker Process Restart on Failure
  // Automatically restart workers if they die
  cluster.on("exit", (worker, code, signal) => {
    console.log(
      `Worker ${worker.process.pid} died with code ${code} and signal ${signal}`
    );
    console.log("Starting a new worker...");
    cluster.fork();
  });

  // INTERVIEW CONCEPT: Graceful Shutdown
  // Handle shutdown signals gracefully
  process.on("SIGTERM", () => {
    console.log("Master received SIGTERM, shutting down gracefully...");

    for (const id in cluster.workers) {
      cluster.workers[id].kill();
    }

    setTimeout(() => {
      console.log("Forcing shutdown...");
      process.exit(0);
    }, 10000);
  });

  // INTERVIEW CONCEPT: Cluster Statistics
  // Monitor cluster performance
  setInterval(() => {
    const workers = Object.keys(cluster.workers).length;
    console.log(`Active workers: ${workers}`);
  }, 30000);
} else {
  // INTERVIEW CONCEPT: Worker Process
  // Each worker runs the actual Express application
  require("./server.js");

  console.log(`Worker ${process.pid} started`);

  // INTERVIEW CONCEPT: Worker Memory Monitoring
  // Monitor memory usage to prevent memory leaks
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.rss / 1024 / 1024);

    // INTERVIEW CONCEPT: Memory Leak Prevention
    // Restart worker if memory usage is too high (example: 500MB)
    if (memMB > 500) {
      console.log(
        `Worker ${process.pid} memory usage: ${memMB}MB - Restarting...`
      );
      process.exit(1);
    }
  }, 60000);
}
