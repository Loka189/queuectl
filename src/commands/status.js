const { getJobStats } = require('../core/jobs');
const { getActiveWorkers } = require('../core/worker-manager');

function statusCommand() {
  try {
    // Get job statistics
    const stats = getJobStats();

    // Get active workers
    const workers = getActiveWorkers();

    // Display summary
    console.log('📊 Queue Status\n');
    console.log('Jobs:');
    console.log(`  Pending:     ${stats.pending}`);
    console.log(`  Processing:  ${stats.processing}`);
    console.log(`  Completed:   ${stats.completed}`);
    console.log(`  Failed:      ${stats.failed}`);
    console.log(`  Dead (DLQ):  ${stats.dead}`);
    console.log(`  ─────────────────────`);
    console.log(`  Total:       ${stats.total}\n`);

    console.log('Workers:');
    console.log(`  Active:      ${workers.length}`);

    if (workers.length > 0) {
      workers.forEach(w => {
        console.log(`    • PID ${w.pid} (started: ${new Date(w.startedAt).toLocaleTimeString()})`);
      });
    }

  } catch (error) {
    console.error('❌ Error getting status:', error.message);
    process.exit(1);
  }
}

module.exports = { statusCommand };