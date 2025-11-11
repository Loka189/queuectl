// test-complete.js

const { clearAllJobs, createJob, getJobStats } = require('./src/core/jobs');
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Complete End-to-End Test\n');
console.log('This will test the entire system workflow\n');

// Step 1: Clear database
console.log('Step 1: Clearing database...');
clearAllJobs();
console.log('✅ Database cleared\n');

// Step 2: Create test jobs
console.log('Step 2: Creating test jobs...');
const job1 = createJob({ command: 'node -e "console.log(\'Job 1 - Success\')"' });
const job2 = createJob({ command: 'node -e "console.log(\'Job 2 - Success\')"' });
const job3 = createJob({ command: 'node -e "process.exit(1)"', max_retries: 2 }); // Will fail
const job4 = createJob({ command: 'node -e "console.log(\'Job 4 - Success\')"' });

console.log(`✅ Created 4 jobs:`);
console.log(`   ${job1.id} - Will succeed`);
console.log(`   ${job2.id} - Will succeed`);
console.log(`   ${job3.id} - Will fail → DLQ`);
console.log(`   ${job4.id} - Will succeed\n`);

// Step 3: Check initial stats
console.log('Step 3: Initial statistics');
console.log(getJobStats());
console.log('');

// Step 4: Instructions
console.log('Step 4: Now run these commands in order:\n');
console.log('  # Start a worker (in a separate terminal)');
console.log('  node bin/queuectl.js worker start --count 1\n');
console.log('  # Watch the status (wait ~10 seconds for retries)');
console.log('  node bin/queuectl.js status\n');
console.log('  # List completed jobs');
console.log('  node bin/queuectl.js list --state completed\n');
console.log('  # Check DLQ (job3 should be here)');
console.log('  node bin/queuectl.js dlq list\n');
console.log('  # Stop the worker');
console.log('  node bin/queuectl.js worker stop\n');

console.log('Expected results:');
console.log('  ✅ 3 jobs completed (job1, job2, job4)');
console.log('  ❌ 1 job in DLQ (job3 - after 2 retries)');