// INTERVIEW CONCEPT: Worker Threads in Node.js
// Worker threads allow CPU-intensive tasks to run in parallel
// Different from clustering - worker threads share memory, clusters don't

const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");
const path = require("path");

if (isMainThread) {
  // INTERVIEW CONCEPT: Main Thread - CPU Intensive Task Delegation
  // This is the main thread that delegates work to worker threads

  console.log("Main thread started");

  // INTERVIEW CONCEPT: CPU-Intensive Task Example
  // Simulate a heavy computation that would block the event loop
  function performHeavyComputation(data) {
    return new Promise((resolve, reject) => {
      // INTERVIEW CONCEPT: Worker Thread Creation
      // Create a new worker thread for CPU-intensive tasks
      const worker = new Worker(__filename, {
        workerData: data,
      });

      // INTERVIEW CONCEPT: Worker Communication
      // Listen for messages from worker thread
      worker.on("message", (result) => {
        resolve(result);
      });

      worker.on("error", (error) => {
        reject(error);
      });

      // INTERVIEW CONCEPT: Worker Thread Cleanup
      worker.on("exit", (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  // INTERVIEW CONCEPT: Express Route with Worker Threads
  // Example of how to integrate worker threads with Express routes
  async function heavyComputationRoute(req, res) {
    try {
      const { numbers } = req.body;

      if (!numbers || !Array.isArray(numbers)) {
        return res
          .status(400)
          .json({ error: "Please provide an array of numbers" });
      }

      console.log(
        `Main thread: Starting heavy computation for ${numbers.length} numbers`
      );
      const startTime = Date.now();

      // INTERVIEW CONCEPT: Parallel Processing
      // Process data in worker thread to avoid blocking main thread
      const result = await performHeavyComputation(numbers);

      const endTime = Date.now();
      console.log(
        `Main thread: Computation completed in ${endTime - startTime}ms`
      );

      res.json({
        result,
        processingTime: endTime - startTime,
        processedBy: "worker-thread",
      });
    } catch (error) {
      console.error("Error in heavy computation:", error);
      res.status(500).json({ error: "Computation failed" });
    }
  }

  // Export the function for use in routes
  module.exports = { heavyComputationRoute, performHeavyComputation };
} else {
  // INTERVIEW CONCEPT: Worker Thread - Actual Computation
  // This code runs in the worker thread

  console.log(`Worker thread ${workerData.length} numbers to process`);

  // INTERVIEW CONCEPT: CPU-Intensive Algorithm
  // Simulate heavy computation (prime number calculation)
  function isPrime(num) {
    if (num < 2) return false;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) return false;
    }
    return true;
  }

  function findPrimesInRange(numbers) {
    const primes = [];
    const startTime = Date.now();

    for (const num of numbers) {
      if (isPrime(num)) {
        primes.push(num);
      }
    }

    const endTime = Date.now();

    return {
      primes,
      count: primes.length,
      processingTime: endTime - startTime,
      workerId: process.pid,
    };
  }

  // INTERVIEW CONCEPT: Worker Thread Processing
  // Process the data and send result back to main thread
  try {
    const result = findPrimesInRange(workerData);
    parentPort.postMessage(result);
  } catch (error) {
    console.error("Worker thread error:", error);
    process.exit(1);
  }
}
