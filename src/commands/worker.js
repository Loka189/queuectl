const { spawn } = require('child_process');
const path = require('path');
const { addWorker, getActiveWorkers, stopAllWorkers } = require('../core/worker-manager');

function workerStartCommand(options) {
  const count = options.count || 1;
  
  console.log(`🚀 Starting ${count} worker(s)...\n`);

  for (let i = 0; i < count; i++) {
    const workerPath = path.join(__dirname, '../worker/worker.js');
    
    const worker = spawn('node', [workerPath], {
      detached: true,
      stdio: 'ignore' 
    });

    console.log(`  ✅ Worker started (PID: ${worker.pid})`);
    
    // Save worker PID
    addWorker(worker.pid);
    
    worker.unref(); // Allow parent to exit
  }

  console.log(`\n💡 Workers are running in the background`);
  console.log(`   View status: queuectl status`);
  console.log(`   Stop workers: queuectl worker stop`);
}

function workerStopCommand() {
  const activeWorkers = getActiveWorkers();
  
  if (activeWorkers.length === 0) {
    console.log('ℹ️  No active workers found');
    return;
  }
  
  console.log(`🛑 Stopping ${activeWorkers.length} worker(s)...\n`);
  
  const results = stopAllWorkers();
  
  results.forEach(result => {
    if (result.stopped) {
      console.log(`  ✅ Worker stopped (PID: ${result.pid})`);
    } else {
      console.log(`  ❌ Failed to stop worker (PID: ${result.pid})`);
    }
  });
  
  console.log(`\n💡 Workers will finish their current jobs before exiting`);
}

function workerListCommand() {
  const workers = getActiveWorkers();
  
  if (workers.length === 0) {
    console.log('ℹ️  No active workers');
    return;
  }
  
  console.log(`\n👷 Active Workers (${workers.length})\n`);
  
  workers.forEach(worker => {
    const startTime = new Date(worker.startedAt).toLocaleString();
    console.log(`  PID: ${worker.pid}`);
    console.log(`  Started: ${startTime}`);
    console.log('  ─'.repeat(30));
  });
}

module.exports = { workerStartCommand, workerStopCommand, workerListCommand };