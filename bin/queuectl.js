#!/usr/bin/env node
const { Command } = require('commander');
const { enqueueCommand } = require('../src/commands/enqueue');
const { statusCommand } = require('../src/commands/status');
const { listCommand } = require('../src/commands/list');
const { dlqListCommand, dlqRetryCommand } = require('../src/commands/dlq');
const { configGetCommand, configSetCommand } = require('../src/commands/config');
const { workerStartCommand, workerStopCommand } = require('../src/commands/worker');

const program = new Command();

program
  .name('queuectl')
  .description('CLI tool for managing background job queues')
  .version('1.0.0');

// queuectl enqueue <command...>
program
  .command('enqueue <command...>')
  .description('Add a new job to the queue')
  .option('-r, --max-retries <number>', 'Maximum retry attempts', '3')
  .allowUnknownOption()  
  .action((command, options) => {
    options.maxRetries = parseInt(options.maxRetries);
    enqueueCommand(command, options);
  });

// queuectl status
program
  .command('status')
  .description('Show queue status and statistics')
  .action(statusCommand);

// queuectl list
program
  .command('list')
  .description('List jobs by state')
  .option('-s, --state <state>', 'Filter by state (pending, processing, completed, failed, dead)', 'pending')
  .action(listCommand);

// queuectl dlq (with subcommands)
const dlq = program
  .command('dlq')
  .description('Manage Dead Letter Queue');

dlq
  .command('list')
  .description('List jobs in DLQ')
  .action(dlqListCommand);

dlq
  .command('retry <jobId>')
  .description('Retry a job from DLQ')
  .action(dlqRetryCommand);

// queuectl config (with subcommands)
const config = program
  .command('config')
  .description('Manage configuration');

config
  .command('get [key]')
  .description('Get configuration value(s)')
  .action(configGetCommand);

config
  .command('set <key> <value>')
  .description('Set configuration value')
  .action(configSetCommand);

// queuectl worker (with subcommands)
const worker = program
  .command('worker')
  .description('Manage worker processes');

worker
  .command('start')
  .description('Start worker processes')
  .option('-c, --count <number>', 'Number of workers to start', '1')
  .action((options) => {
    options.count = parseInt(options.count);
    workerStartCommand(options);
  });

worker
  .command('stop')
  .description('Stop all worker processes')
  .action(workerStopCommand);
worker
  .command('list')
  .description('List active worker processes')
  .action(() => {
    const { workerListCommand } = require('../src/commands/worker');
    workerListCommand();
  });

// logs
program
  .command('logs')
  .description('View worker logs')
  .option('-f, --follow', 'Follow log output (tail -f style)')
  .option('-n, --lines <number>', 'Number of lines to show', '50')
  .action((options) => {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../data/worker.log');
    
    if (!fs.existsSync(logFile)) {
      console.log('No logs found. Workers haven\'t run yet.');
      return;
    }

    if (options.follow) {
      console.log('Following logs (Ctrl+C to stop)...\n');
      const tail = require('child_process').spawn('tail', ['-f', logFile]);
      tail.stdout.on('data', data => process.stdout.write(data));
      tail.stderr.on('data', data => process.stderr.write(data));
    } else {
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(l => l.trim());
      const numLines = parseInt(options.lines);
      const recentLines = lines.slice(-numLines);
      console.log(recentLines.join('\n'));
    }
  });

program.parse(process.argv);