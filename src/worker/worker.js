const { getNextPendingJob } = require('../core/jobs');
const { processJob, handleJobSuccess, handleJobFailure } = require('../core/queue');

// Worker ID (unique identifier for this worker)
const WORKER_ID = `worker-${process.pid}`;

// Flag to stop worker gracefully
let shouldStop = false;


// Main worker loop
async function workerLoop() {
  console.log(`[${WORKER_ID}] Started`);
  
  while (!shouldStop) {
    try {
      // Try to get next pending job
      const job = getNextPendingJob(WORKER_ID);
      
      if (!job) {
        // No jobs available, wait a bit
        await sleep(1000); // Poll every 1 second
        continue;
      }
      
      // Execute the job
      const result = processJob(job);
      
      // Handle result
      if (result.success) {
        handleJobSuccess(job);
      } else {
        handleJobFailure(job, result.error || result.output);
      }
      
    } catch (error) {
      console.error(`[${WORKER_ID}] Error:`, error.message);
      await sleep(1000); // Wait before retrying
    }
  }
  
  console.log(`[${WORKER_ID}] Stopped gracefully`);
  process.exit(0);
}

// Sleep utility
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle termination signals for graceful shutdown
process.on('SIGTERM', () => {
  console.log(`[${WORKER_ID}] Received SIGTERM, finishing current job...`);
  shouldStop = true;
});

process.on('SIGINT', () => {
  console.log(`[${WORKER_ID}] Received SIGINT, finishing current job...`);
  shouldStop = true;
});

// Start the worker
workerLoop();