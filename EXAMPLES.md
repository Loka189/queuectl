# queuectl - Usage Examples

## Basic Usage

### 1. Start the System
```bash
# Start a worker
queuectl worker start --count 1
```

### 2. Enqueue Jobs
```bash
# Simple echo
queuectl enqueue echo "Hello World"

# Node.js calculation
queuectl enqueue node -e "console.log(2 + 2)"

# Long-running task
queuectl enqueue node -e "setTimeout(() => console.log('Done'), 5000)"
```

### 3. Monitor Progress
```bash
# Check status
queuectl status

# List pending jobs
queuectl list --state pending

# List completed jobs
queuectl list --state completed
```

---

## Advanced Scenarios

### Scenario 1: Processing 100 Jobs with Multiple Workers
```bash
# Create 100 jobs
for i in {1..100}; do
  queuectl enqueue node -e "console.log('Job $i')"
done

# Start 5 workers for faster processing
queuectl worker start --count 5

# Monitor
queuectl status
```

### Scenario 2: Handling Failures
```bash
# Create a job that will fail
queuectl enqueue node -e "process.exit(1)"

# Watch it retry (check logs)
queuectl list --state pending

# After 3 retries, check DLQ
queuectl dlq list

# Retry from DLQ
queuectl dlq retry <job-id>
```

### Scenario 3: Custom Retry Configuration
```bash
# Increase max retries to 5
queuectl config set max_retries 5

# Change backoff to 3 (3^1=3s, 3^2=9s, 3^3=27s)
queuectl config set backoff_base 3

# Verify
queuectl config get

# Enqueue with custom retries
queuectl enqueue --max-retries 10 node -e "process.exit(1)"
```

---

## Real-World Use Cases

### Email Sending Service
```bash
# Enqueue email jobs
queuectl enqueue node send-email.js user@example.com "Welcome"
queuectl enqueue node send-email.js admin@example.com "Alert"

# Process with 3 workers
queuectl worker start --count 3
```

### Image Processing Pipeline
```bash
# Resize images
queuectl enqueue node resize.js photo1.jpg 800x600
queuectl enqueue node resize.js photo2.jpg 800x600

# Generate thumbnails
queuectl enqueue node thumbnail.js photo1.jpg
```

### Data Import Jobs
```bash
# Import CSV files
queuectl enqueue node import.js users.csv
queuectl enqueue node import.js products.csv

# Check progress
watch -n 1 queuectl status
```

---

## Troubleshooting

### Workers Not Processing Jobs
```bash
# Check if workers are running
queuectl worker list

# Restart workers
queuectl worker stop
queuectl worker start --count 1
```

### Jobs Stuck in Processing
```bash
# If a worker crashed, jobs may be locked
# They will auto-recover after 5 minutes (lock timeout)

# Or manually check processing jobs
queuectl list --state processing
```

### Clear Everything and Start Fresh
```bash
# Stop workers
queuectl worker stop

# Clear database
npm run clean

# Start fresh
queuectl worker start --count 1
```