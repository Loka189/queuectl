# queuectl

A CLI-based background job queue system with retry logic and Dead Letter Queue (DLQ).

## 📺 Demo

> **[Watch Demo Video](https://drive.google.com/file/d/1CFS51OR1dWT3aTz5cnv1uekdjBRPR0zI/view?usp=sharing)** _(Watch here)_

See queuectl in action: enqueueing jobs, retry logic, DLQ management, and multiple workers processing concurrently.

---

## Features

✅ Enqueue background jobs  
✅ Multiple worker processes  
✅ Automatic retry with exponential backoff  
✅ Dead Letter Queue for failed jobs  
✅ Persistent storage (SQLite)  
✅ Worker activity logging  
✅ Configurable retry settings  
✅ Graceful worker shutdown  

---

## Installation

### Option 1: Global Installation (Recommended)
```bash
# Clone the repository
git clone https://github.com/Loka189/queuectl
cd queuectl

# Install dependencies
npm install

# Install globally
npm install -g .

# Use from anywhere
queuectl --help
```

### Option 2: Local Usage
```bash
# Clone and install
git clone https://github.com/Loka189/queuectl
cd queuectl
npm install

# Run locally
node bin/queuectl.js --help
```

### Verify Installation
```bash
queuectl --help
queuectl status
```

---

## Quick Start
```bash
# 1. Start a worker
queuectl worker start --count 1

# 2. Enqueue a job
queuectl enqueue node -e "console.log('HelloWorld')"

# 3. Check status
queuectl status

# 4. View worker logs
queuectl logs

# 5. Stop worker
queuectl worker stop
```

---

## Commands

### Enqueue Jobs
```bash
# Simple command
queuectl enqueue echo hello

# Node.js script
queuectl enqueue node -e "console.log(123)"

# With custom retry limit
queuectl enqueue --max-retries 5 node -e "console.log('test')"
```

### Manage Workers
```bash
# Start 3 workers
queuectl worker start --count 3

# List active workers
queuectl worker list

# Stop all workers
queuectl worker stop
```

### Monitor Queue
```bash
# View status
queuectl status

# List jobs by state
queuectl list --state pending
queuectl list --state completed
queuectl list --state dead

# View worker logs
queuectl logs

# View last 100 log lines
queuectl logs --lines 100

# Follow logs in real-time (tail -f style)
queuectl logs --follow
```

### Dead Letter Queue
```bash
# List failed jobs
queuectl dlq list

# Retry a specific job
queuectl dlq retry <job-id>
```

### Configuration
```bash
# View all config
queuectl config get

# View specific setting
queuectl config get max_retries

# Update setting
queuectl config set max_retries 5
queuectl config set backoff_base 3
```

---

## Architecture

### Job Lifecycle
```
pending → processing → completed ✅
   ↑           ↓
   └──── (retry) ← failed
              ↓
           dead (DLQ) ❌
```

### Components

- **Database Layer** (`src/core/database.js`) - SQLite storage
- **Job Manager** (`src/core/jobs.js`) - CRUD operations
- **Queue Engine** (`src/core/queue.js`) - Retry logic, command execution
- **Worker Process** (`src/worker/worker.js`) - Background job executor
- **Worker Manager** (`src/core/worker-manager.js`) - Worker lifecycle management
- **Logger** (`src/utils/logger.js`) - File-based logging
- **CLI Commands** (`src/commands/`) - User interface

---

## How It Works

### 1. Enqueue a Job
```bash
queuectl enqueue node -e "console.log(123)"
```
- Creates a job record in SQLite
- State: `pending`
- Assigns unique ID

### 2. Worker Picks Up Job
- Worker polls database every 1 second
- Acquires lock on job (atomic operation)
- Executes shell command
- Logs activity to `data/worker.log`
- Updates job state

### 3. Retry on Failure
- If command fails (exit code ≠ 0)
- Increments attempt counter
- Schedules retry with exponential backoff:
  - Attempt 1: Wait 2 seconds (2^1)
  - Attempt 2: Wait 4 seconds (2^2)
  - Attempt 3: Wait 8 seconds (2^3)

### 4. Dead Letter Queue
- After `max_retries` attempts, move to DLQ
- State: `dead`
- Can be manually retried later with `queuectl dlq retry <job-id>`

### 5. Logging
- Workers log all activity to `data/worker.log`
- View logs with `queuectl logs`
- Logs include:
  - Worker start/stop events
  - Job processing status
  - Retry attempts and delays
  - Error messages

---

## Configuration

Default settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_retries` | 3 | Maximum retry attempts |
| `backoff_base` | 2 | Exponential backoff base |
| `lock_timeout_seconds` | 300 | Stale lock timeout (5 min) |

Modify with:
```bash
queuectl config set <key> <value>
```

---

## File Structure
```
queuectl/
├── bin/
│   └── queuectl.js              # CLI entry point
├── src/
│   ├── commands/                # CLI command handlers
│   ├── core/                    # Core business logic
│   ├── worker/                  # Worker process
│   └── utils/                   # Utilities (logger)
├── data/
│   ├── queue.db                 # SQLite database
│   ├── workers.json             # Active worker PIDs
│   └── worker.log               # Worker activity logs
├── test-db.js                   # Database tests
├── test-worker.js               # Worker tests
├── test-complete.js             # End-to-end tests
├── validate.js                  # System validation
└── README.md
```

---

## Testing

### Automated Validation
```bash
node validate.js
```

### Complete Workflow Test
```bash
# Run test scenario
node test-complete.js

# Start worker and observe
queuectl worker start --count 1

# Check logs
queuectl logs
```

Expected results:
- ✅ 3 successful jobs
- ❌ 1 job in DLQ (after retries)

### Manual Testing
```bash
# Clear database
npm run clean

# Enqueue test jobs
queuectl enqueue node -e "console.log(1)"
queuectl enqueue node -e "process.exit(1)"  # Will fail
queuectl enqueue node -e "console.log(3)"

# Start worker
queuectl worker start --count 1

# Wait 15 seconds for retries, then check
queuectl status
queuectl logs
queuectl dlq list
```

---

## Troubleshooting

### View Worker Activity
```bash
queuectl logs --lines 50
```

### Workers Not Processing Jobs
```bash
# Check if workers are running
queuectl worker list

# Restart workers
queuectl worker stop
queuectl worker start --count 1
```

### Jobs Stuck in Processing
Jobs locked by crashed workers will auto-recover after 5 minutes (configurable with `lock_timeout_seconds`).

### Clear Everything
```bash
# Stop workers
queuectl worker stop

# Clear database
npm run clean

# Start fresh
queuectl worker start --count 1
```

---

## Assumptions & Trade-offs

### Assumptions
- Single-machine setup (workers access same SQLite file)
- Commands are shell-compatible
- Trusted job commands (no sandboxing)
- Workers have write access to `data/` directory

### Trade-offs
- **SQLite vs Redis**: Simpler setup, but less performant at scale
- **Polling vs Events**: Easier to implement, but 1-second latency
- **File-based logging**: Simple, but can grow large over time
- **Windows popup**: Brief terminal flash on Windows when spawning workers (OS limitation)

---

## Future Improvements

- [ ] Job priority queues
- [ ] Scheduled/delayed jobs (`run_at` timestamp)
- [ ] Job timeout handling
- [ ] Log rotation and cleanup
- [ ] Web dashboard for monitoring
- [ ] Distributed workers (message queue)
- [ ] Job dependencies (job B waits for job A)

---


**Workaround**: Run workers manually in a dedicated terminal for development:
```bash
node src/worker/worker.js
```

---

## License

ISC