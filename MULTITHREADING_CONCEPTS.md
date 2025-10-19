# Node.js Multi-threading & Concurrency Interview Concepts

This document explains Node.js multi-threading, clustering, and concurrency concepts implemented in the interview preparation API.

## Key Concepts Overview

### 1. Node.js Event Loop (Single-Threaded)

**Concept**: Node.js runs JavaScript in a single thread with an event-driven, non-blocking I/O model.

```javascript
// BLOCKING (Bad)
const result = heavyComputation(); // Blocks event loop
console.log(result);

// NON-BLOCKING (Good)
heavyComputationAsync((result) => {
  console.log(result);
});
```

**Interview Questions**:

- How does the Node.js event loop work?
- What's the difference between blocking and non-blocking operations?
- Why is Node.js called single-threaded when it can handle thousands of connections?

### 2. Clustering (Process-Level Parallelism)

**Location**: `cluster.js`
**Concept**: Create multiple Node.js processes to utilize all CPU cores

```javascript
const cluster = require("cluster");
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
  // Master process spawns workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Worker process runs the application
  require("./server.js");
}
```

**Interview Questions**:

- What's the difference between clustering and threading?
- How does load balancing work with Node.js clusters?
- What happens when a worker process crashes?

### 3. Worker Threads (Thread-Level Parallelism)

**Location**: `worker-threads-example.js`, `routes/compute.js`
**Concept**: Create threads for CPU-intensive tasks without blocking the main thread

```javascript
const { Worker, isMainThread, parentPort } = require("worker_threads");

if (isMainThread) {
  // Main thread creates worker
  const worker = new Worker(__filename, { workerData: data });
  worker.on("message", (result) => console.log(result));
} else {
  // Worker thread processes data
  const result = heavyComputation(workerData);
  parentPort.postMessage(result);
}
```

**Interview Questions**:

- When should you use worker threads vs clustering?
- How do worker threads communicate with the main thread?
- What's the difference between worker threads and child processes?

## Implementation Details

### 1. Cluster Management

**File**: `cluster.js`

#### Master Process Responsibilities:

- **Worker Spawning**: Creates worker processes equal to CPU cores
- **Load Balancing**: Distributes incoming requests across workers
- **Health Monitoring**: Monitors worker health and restarts failed workers
- **Graceful Shutdown**: Handles shutdown signals properly

```javascript
// Worker restart on failure
cluster.on("exit", (worker, code, signal) => {
  console.log(`Worker ${worker.process.pid} died`);
  cluster.fork(); // Restart worker
});
```

#### Worker Process Responsibilities:

- **Request Handling**: Processes HTTP requests
- **Memory Monitoring**: Monitors own memory usage
- **Graceful Exit**: Handles shutdown signals

### 2. Worker Thread Pool

**File**: `routes/compute.js`

#### Pool Management:

- **Thread Reuse**: Reuses threads to avoid creation overhead
- **Queue Management**: Queues jobs when all threads are busy
- **Resource Cleanup**: Properly terminates threads after use

```javascript
class WorkerPool {
  constructor(size = 4) {
    this.size = size;
    this.activeJobs = 0;
    this.queue = [];
  }

  async execute(data) {
    // Manage thread execution and queuing
  }
}
```

### 3. CPU-Intensive Task Examples

#### Prime Number Calculation:

```javascript
// routes/compute.js - /api/compute/primes
// Demonstrates offloading CPU work to worker threads
```

#### Fibonacci Calculation:

```javascript
// routes/compute.js - /api/compute/fibonacci
// Shows blocking vs non-blocking comparison
```

## Performance Comparison

### Single Thread vs Cluster vs Worker Threads

| Scenario        | Single Thread   | Cluster              | Worker Threads      |
| --------------- | --------------- | -------------------- | ------------------- |
| I/O Operations  | ✅ Excellent    | ✅ Excellent         | ⚠️ Overkill         |
| CPU-Intensive   | ❌ Blocks       | ✅ Good              | ✅ Excellent        |
| Memory Usage    | ✅ Low          | ⚠️ High              | ✅ Moderate         |
| Startup Time    | ✅ Fast         | ⚠️ Slow              | ✅ Fast             |
| Fault Tolerance | ❌ Single Point | ✅ Process Isolation | ⚠️ Thread Isolation |

## Interview Scenarios

### Scenario 1: High CPU Usage

**Problem**: API becomes unresponsive during heavy computations
**Solution**: Use worker threads for CPU-intensive tasks
**Implementation**: `/api/compute/primes` endpoint

### Scenario 2: Scaling for Multiple Cores

**Problem**: Single process can't utilize all CPU cores
**Solution**: Use clustering to spawn multiple processes
**Implementation**: `cluster.js` with automatic worker management

### Scenario 3: Memory Leaks

**Problem**: Worker processes consuming too much memory
**Solution**: Monitor memory usage and restart workers
**Implementation**: Memory monitoring in cluster workers

## Best Practices

### 1. When to Use Clustering

- ✅ Scale I/O-intensive applications
- ✅ Utilize multiple CPU cores
- ✅ Improve fault tolerance
- ❌ Don't use for CPU-intensive tasks in workers

### 2. When to Use Worker Threads

- ✅ CPU-intensive computations
- ✅ Image/video processing
- ✅ Cryptographic operations
- ❌ Don't use for I/O operations

### 3. Resource Management

```javascript
// Proper worker cleanup
worker.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Worker stopped with exit code ${code}`);
  }
});

// Memory monitoring
setInterval(() => {
  const memUsage = process.memoryUsage();
  if (memUsage.rss > MEMORY_LIMIT) {
    process.exit(1); // Restart worker
  }
}, 60000);
```

## Common Interview Questions

### Basic Level

1. **Q**: Is Node.js single-threaded or multi-threaded?
   **A**: Node.js JavaScript execution is single-threaded, but I/O operations use a thread pool (libuv).

2. **Q**: How can you utilize multiple CPU cores in Node.js?
   **A**: Use clustering to create multiple processes or worker threads for CPU-intensive tasks.

3. **Q**: What's the difference between `cluster` and `worker_threads`?
   **A**: Cluster creates separate processes (no shared memory), worker threads create threads within the same process (shared memory).

### Intermediate Level

1. **Q**: How do you handle worker process failures in a cluster?
   **A**: Listen for 'exit' events and automatically restart failed workers.

2. **Q**: When would you choose worker threads over clustering?
   **A**: For CPU-intensive tasks that need to share memory or when you want fine-grained control over thread lifecycle.

3. **Q**: How do you prevent memory leaks in clustered applications?
   **A**: Monitor memory usage, set limits, and restart workers that exceed thresholds.

### Advanced Level

1. **Q**: How do you implement graceful shutdown in a clustered application?
   **A**: Handle SIGTERM signals, stop accepting new connections, finish existing requests, then exit.

2. **Q**: How do you share state between cluster workers?
   **A**: Use external stores (Redis, database) or IPC mechanisms, as workers don't share memory.

3. **Q**: How do you debug worker threads?
   **A**: Use `--inspect-brk` flag, separate debugging ports, or logging strategies.

## Testing the Implementation

### 1. Start Clustered Application

```bash
npm run cluster
```

### 2. Test CPU-Intensive Operations

```bash
# Test prime calculation with worker threads
curl -X POST http://localhost:3000/api/compute/primes \
  -H "Content-Type: application/json" \
  -d '{"numbers": [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]}'

# Test Fibonacci with/without worker threads
curl -X POST http://localhost:3000/api/compute/fibonacci \
  -H "Content-Type: application/json" \
  -d '{"n": 40, "useWorkerThread": true}'
```

### 3. Monitor System Stats

```bash
curl http://localhost:3000/api/compute/stats
```

## Next Level Enhancements

1. **Load Balancing**: Implement custom load balancing strategies
2. **Health Checks**: Advanced health monitoring for workers
3. **Metrics Collection**: Collect performance metrics from workers
4. **Auto-scaling**: Dynamically adjust worker count based on load
5. **IPC Communication**: Inter-process communication between workers
6. **Shared Memory**: Use SharedArrayBuffer for data sharing
7. **Thread Pools**: Advanced thread pool management
8. **Async Hooks**: Monitor async operations across threads

This implementation demonstrates production-ready multi-threading concepts essential for Node.js interviews and real-world applications.
