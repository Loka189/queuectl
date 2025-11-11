const { createJob } = require('../core/jobs');

function enqueueCommand(commandParts, options) {
  try {
    
    
    const command = commandParts.join(' ');
    
    // Validate command
    if (!command || command.trim().length === 0) {
      console.error('❌ Error: Command cannot be empty');
      process.exit(1);
    }

    // Create the job
    const job = createJob({
      command: command,
      max_retries: options.maxRetries || 3
    });

    // Success message
    console.log(`✅ Job enqueued successfully`);
    console.log(`   ID: ${job.id}`);
    console.log(`   Command: ${job.command}`);
    console.log(`   Max Retries: ${job.max_retries}`);
    
  } catch (error) {
    console.error('❌ Error enqueuing job:', error.message);
    process.exit(1);
  }
}

module.exports = { enqueueCommand };