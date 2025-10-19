// INTERVIEW CONCEPT: Dedicated Worker Thread for Fibonacci Calculation
// Separate worker file for Fibonacci computation to avoid blocking main thread

const { parentPort, workerData } = require("worker_threads");

// INTERVIEW CONCEPT: Recursive Fibonacci (CPU-Intensive)
// This is intentionally inefficient to demonstrate CPU-intensive work
function fibonacci(n) {
  if (n < 2) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// INTERVIEW CONCEPT: Optimized Fibonacci (Memoization)
// More efficient version using memoization
function fibonacciMemo(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n < 2) return n;

  memo[n] = fibonacciMemo(n - 1, memo) + fibonacciMemo(n - 2, memo);
  return memo[n];
}

// INTERVIEW CONCEPT: Worker Thread Execution
try {
  const { n } = workerData;
  console.log(`Worker thread calculating fibonacci(${n})`);

  const startTime = Date.now();

  // Use memoized version for better performance
  const result = fibonacciMemo(n);

  const endTime = Date.now();
  console.log(
    `Worker thread completed fibonacci(${n}) = ${result} in ${
      endTime - startTime
    }ms`
  );

  // INTERVIEW CONCEPT: Worker Thread Communication
  // Send result back to main thread
  parentPort.postMessage(result);
} catch (error) {
  console.error("Worker thread error:", error);
  process.exit(1);
}
