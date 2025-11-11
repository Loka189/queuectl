

const { getJobsByState } = require('../core/jobs');

function listCommand(options) {
  try {
    const state = options.state || 'pending';
    
    // Validate state
    const validStates = ['pending', 'processing', 'completed', 'failed', 'dead'];
    if (!validStates.includes(state)) {
      console.error(`❌ Error: Invalid state. Must be one of: ${validStates.join(', ')}`);
      process.exit(1);
    }

    // Get jobs
    const jobs = getJobsByState(state);

    if (jobs.length === 0) {
      console.log(`No jobs in state: ${state}`);
      return;
    }

    // Display jobs
    console.log(`\n📋 Jobs (state: ${state})\n`);
    
    jobs.forEach(job => {
      console.log(`ID:       ${job.id}`);
      console.log(`Command:  ${job.command}`);
      console.log(`Attempts: ${job.attempts}/${job.max_retries}`);
      console.log(`Created:  ${new Date(job.created_at).toLocaleString()}`);
      
      if (job.retry_at) {
        console.log(`Retry At: ${new Date(job.retry_at).toLocaleString()}`);
      }
      
      if (job.error_message) {
        console.log(`Error:    ${job.error_message}`);
      }
      
      console.log('─'.repeat(60));
    });
    
    console.log(`\nTotal: ${jobs.length} jobs\n`);
    
  } catch (error) {
    console.error('❌ Error listing jobs:', error.message);
    process.exit(1);
  }
}

module.exports = { listCommand };