const { createJob, clearAllJobs, getJobById, getJobStats } = require('./src/core/jobs');

console.log('🧪 Testing Worker Flow\n');

// Clear existing jobs
clearAllJobs();

// Test 1: Successful job (cross-platform)
console.log('Test 1: Creating a successful job');
const job1 = createJob({ command: 'node -e "console.log(\'Hello from worker!\')"' });
console.log(`Created job: ${job1.id}\n`);

// Test 2: Failing job (will retry)
console.log('Test 2: Creating a failing job (will retry 3 times)');
const job2 = createJob({ command: 'node -e "process.exit(1)"', max_retries: 3 });
console.log(`Created job: ${job2.id}\n`);

// Test 3: Long running job (cross-platform)
console.log('Test 3: Creating a long-running job');
const job3 = createJob({ 
  command: 'node -e "setTimeout(() => console.log(\'Done waiting\'), 3000)"' 
});
console.log(`Created job: ${job3.id}\n`);

// Test 4: Another successful command
console.log('Test 4: Creating another simple job');
const job4 = createJob({ command: 'node -e "console.log(2 + 2)"' });
console.log(`Created job: ${job4.id}\n`);

console.log('📊 Initial Stats:');
console.log(getJobStats());
console.log('\n✅ Jobs created! Now run the worker:\n');
console.log('  node src/worker/worker.js\n');
console.log('Watch the worker process the jobs, then press Ctrl+C to stop it.\n');
console.log('After workers finish, check final stats:');
console.log('  node -e "console.log(require(\'./src/core/jobs\').getJobStats())"');