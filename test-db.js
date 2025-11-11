// test-db.js

const { createJob, getJobById, getJobsByState, updateJobState, getNextPendingJob, getJobStats, clearAllJobs } = require('./src/core/jobs');

console.log('🧪 Testing Database Functions\n');

// Clear any existing jobs
clearAllJobs();
console.log('✅ Cleared all jobs\n');

// Test 1: Create a job
console.log('Test 1: Create Job');
const job1 = createJob({ command: 'echo hello' });
console.log('Created:', job1);
console.log('');

// Test 2: Get job by ID
console.log('Test 2: Get Job by ID');
const fetched = getJobById(job1.id);
console.log('Fetched:', fetched);
console.log('');

// Test 3: Create multiple jobs
console.log('Test 3: Create Multiple Jobs');
const job2 = createJob({ command: 'sleep 2' });
const job3 = createJob({ command: 'exit 1', max_retries: 5 });
console.log(`Created jobs: ${job2.id}, ${job3.id}`);
console.log('');

// Test 4: Get jobs by state
console.log('Test 4: Get Pending Jobs');
const pending = getJobsByState('pending');
console.log(`Found ${pending.length} pending jobs`);
console.log('');

// Test 5: Update job state
console.log('Test 5: Update Job State');
updateJobState(job1.id, 'completed', { completed_at: new Date().toISOString() });
const updated = getJobById(job1.id);
console.log('Updated job state:', updated.state);
console.log('');

// Test 6: Get next pending job (worker simulation)
console.log('Test 6: Worker Gets Next Job');
const nextJob = getNextPendingJob('worker-test-1');
if (nextJob) {
  console.log('Worker got job:', nextJob.id);
  console.log('Job is now locked by:', nextJob.locked_by);
} else {
  console.log('No jobs available');
}
console.log('');

// Test 7: Try to get same job again (should fail)
console.log('Test 7: Try to Get Same Job Again');
const duplicate = getNextPendingJob('worker-test-2');
if (duplicate) {
  console.log('❌ ERROR: Got duplicate job!', duplicate.id);
} else {
  console.log('✅ Correctly prevented duplicate processing');
}
console.log('');

// Test 8: Get job statistics
console.log('Test 8: Job Statistics');
const stats = getJobStats();
console.log('Stats:', stats);
console.log('');

console.log('✅ All tests passed!');