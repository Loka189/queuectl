const { createJob, getJobStats, clearAllJobs } = require('./src/core/jobs');
const { executeCommand } = require('./src/core/queue');

console.log('🔍 Validating queuectl system...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// Test 1: Database connection
test('Database connection', () => {
  const stats = getJobStats();
  if (typeof stats.total !== 'number') throw new Error('Invalid stats');
});

// Test 2: Job creation
test('Job creation', () => {
  const job = createJob({ command: 'echo test' });
  if (!job.id) throw new Error('No job ID');
});

// Test 3: Command execution (success)
test('Command execution - success', () => {
  const result = executeCommand('node -e "console.log(123)"');
  if (!result.success) throw new Error('Command should succeed');
  if (result.output !== '123') throw new Error('Wrong output');
});

// Test 4: Command execution (failure)
test('Command execution - failure', () => {
  const result = executeCommand('node -e "process.exit(1)"');
  if (result.success) throw new Error('Command should fail');
});

// Test 5: Stats calculation
test('Stats calculation', () => {
  clearAllJobs();
  createJob({ command: 'echo 1' });
  createJob({ command: 'echo 2' });
  const stats = getJobStats();
  if (stats.total !== 2) throw new Error(`Expected 2 jobs, got ${stats.total}`);
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('✅ All validation tests passed!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed\n');
  process.exit(1);
}