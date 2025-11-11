const { getJobsByState } = require('../core/jobs');
const { retryDLQJob } = require('../core/queue');

function dlqListCommand() {
  try {
    const deadJobs = getJobsByState('dead');

    if (deadJobs.length === 0) {
      console.log('✅ DLQ is empty (no failed jobs)');
      return;
    }

    console.log(`\n☠️  Dead Letter Queue (${deadJobs.length} jobs)\n`);

    deadJobs.forEach(job => {
      console.log(`ID:       ${job.id}`);
      console.log(`Command:  ${job.command}`);
      console.log(`Attempts: ${job.attempts} (max: ${job.max_retries})`);
      console.log(`Failed:   ${new Date(job.completed_at).toLocaleString()}`);
      
      if (job.error_message) {
        console.log(`Error:    ${job.error_message}`);
      }
      
      console.log('─'.repeat(60));
    });

    console.log(`\n💡 To retry a job: queuectl dlq retry <job-id>\n`);
    
  } catch (error) {
    console.error('❌ Error listing DLQ:', error.message);
    process.exit(1);
  }
}

function dlqRetryCommand(jobId) {
  try {
    if (!jobId) {
      console.error('❌ Error: Job ID is required');
      console.log('Usage: queuectl dlq retry <job-id>');
      process.exit(1);
    }

    retryDLQJob(jobId);
    
    console.log(`✅ Job ${jobId} moved back to queue`);
    console.log(`   The job will be picked up by a worker shortly.`);
    
  } catch (error) {
    console.error('❌ Error retrying job:', error.message);
    process.exit(1);
  }
}

module.exports = { dlqListCommand, dlqRetryCommand };