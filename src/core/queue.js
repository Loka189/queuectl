const { execSync } = require('child_process');
const { getJobById, updateJobState } = require('./jobs');
const db = require('./database');

// Get config value
function getConfig(key) {
    const stmt = db.prepare('SELECT value FROM config WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null;
}

// Calculate retry delay using exponential backoff
function calculateRetryDelay(attempts) {
    const base = parseInt(getConfig('backoff_base')) || 2;
    return Math.pow(base, attempts); // 2^1=2s, 2^2=4s, 2^3=8s
}

// Execute shell command
function executeCommand(command) {
    try {
        const output = execSync(command, {
            encoding: 'utf8',
            timeout: 30000, // 30 second timeout
            stdio: ['pipe', 'pipe', 'pipe']
        });

        return {
            success: true,
            output: output.trim()
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            exitCode: error.status,
            output: error.stdout ? error.stdout.trim() : ''
        };
    }
}

// Process a job
function processJob(job) {
    console.log(`[Worker] Processing job ${job.id}: ${job.command}`);

    const result = executeCommand(job.command);

    if (result.success) {
        console.log(`[Worker] ✅ Job ${job.id} completed successfully`);
        if (result.output) {
            console.log(`[Worker] Output: ${result.output}`);
        }
        return result;
    } else {
        console.log(`[Worker] ❌ Job ${job.id} failed: ${result.error}`);
        return result;
    }
}

// Handle job success
function handleJobSuccess(job) {
    const now = new Date().toISOString();

    updateJobState(job.id, 'completed', {
        completed_at: now,
        locked_by: null,
        locked_at: null
    });

    console.log(`[Queue] Job ${job.id} marked as completed`);
}

// Handle job failure and retries
function handleJobFailure(job, error) {
    const maxRetries = parseInt(getConfig('max_retries')) || job.max_retries || 3;
    const newAttempts = job.attempts + 1;

    console.log(`[Queue] Job ${job.id} failed (attempt ${newAttempts}/${maxRetries})`);

    if (newAttempts >= maxRetries) {
        // Give up - move to Dead Letter Queue
        console.log(`[Queue] Job ${job.id} exhausted retries, moving to DLQ`);

        updateJobState(job.id, 'dead', {
            attempts: newAttempts,
            error_message: error,
            completed_at: new Date().toISOString(),
            locked_by: null,
            locked_at: null
        });
    } else {
        // Schedule retry with exponential backoff
        const delaySeconds = calculateRetryDelay(newAttempts);
        const retryAt = new Date(Date.now() + delaySeconds * 1000).toISOString();

        console.log(`[Queue] Job ${job.id} will retry in ${delaySeconds} seconds (at ${retryAt})`);

        updateJobState(job.id, 'pending', {
            attempts: newAttempts,
            error_message: error,
            retry_at: retryAt,
            locked_by: null,
            locked_at: null
        });
    }
}

// Retry a job from the Dead Letter Queue
function retryDLQJob(jobId) {
    const job = getJobById(jobId);

    if (!job) {
        throw new Error(`Job ${jobId} not found`);
    }

    if (job.state !== 'dead') {
        throw new Error(`Job ${jobId} is not in DLQ (current state: ${job.state})`);
    }

    console.log(`[Queue] Retrying DLQ job ${jobId}`);

    updateJobState(jobId, 'pending', {
        attempts: 0,
        error_message: null,
        retry_at: null,
        locked_by: null,
        locked_at: null
    });
}

module.exports = {
    getConfig,
    calculateRetryDelay,
    executeCommand,
    processJob,
    handleJobSuccess,
    handleJobFailure,
    retryDLQJob
};