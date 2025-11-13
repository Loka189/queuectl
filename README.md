# queuectl

A CLI-based background job queue system with retry logic and Dead Letter Queue (DLQ).

## Features

✅ Enqueue background jobs  
✅ Multiple worker processes  
✅ Automatic retry with exponential backoff  
✅ Dead Letter Queue for failed jobs  
✅ Persistent storage (SQLite)  
✅ Configurable retry settings  
✅ Graceful worker shutdown  

---

## Installation
```bash
# Clone repository
git clone https://github.com/Loka189/queuectl
cd queuectl

# Install dependencies
npm install

# Run directly
node bin/queuectl.js --help

# Or install globally
npm install -g .
queuectl --help
```

---

## Quick Start
```bash
# 1. Start a worker
node bin/queuectl.js worker start --count 1

# 2. Enqueue a job
node bin/queuectl.js enqueue echo "Hello World"

# 3. Check status
node bin/queuectl.js status

# 4. Stop worker
node bin/queuectl.js worker stop
```

---

## Commands

### Enqueue Jobs
```bash
# Simple command
queuectl enqueue echo hello

# Node.js script
queuectl enqueue node -e "console.log('Hello')"

# With custom retry limit
queuectl enqueue --max-retries 5 echo test
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
- **CLI Commands** (`src/commands/`) - User interface

---

## How It Works

### 1. Enqueue a Job
```bash
queuectl enqueue sleep 5
```
- Creates a job record in SQLite
- State: `pending`
- Assigns unique ID

### 2. Worker Picks Up Job
- Worker polls database every 1 second
- Acquires lock on job (atomic operation)
- Executes shell command
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
- Can be manually retried later

---

## Configuration

Default settings:

| Setting | Default | Description |
|---------|---------|-------------|
| `max_retries` | 3 | Maximum retry attempts |
| `backoff_base` | 2 | Exponential backoff base |
| `lock_timeout_seconds` | 300 | Stale lock timeout (5 min) |

---

## Testing
```bash
# Run complete test
node test-complete.js

# Then start worker and observe
node bin/queuectl.js worker start --count 1
```

Expected results:
- ✅ 3 successful jobs
- ❌ 1 job in DLQ (after retries)

---

## Assumptions & Trade-offs

### Assumptions
- Single-machine setup (workers access same SQLite file)
- Commands are shell-compatible
- Trusted job commands (no sandboxing)

### Trade-offs
- **SQLite vs Redis**: Simpler setup, but less performant at scale
- **Polling vs Events**: Easier to implement, but 1-second latency
- **File-based worker tracking**: Simple, but not robust for crash recovery

---

## Future Improvements

- [ ] Job priority queues
- [ ] Scheduled/delayed jobs (`run_at` timestamp)
- [ ] Job timeout handling
- [ ] Capture job output logs
- [ ] Distributed workers (message queue)

---

## License

ISC