const fs = require('fs');
const path = require('path');

const WORKERS_FILE = path.join(__dirname, '../../data/workers.json');

// Save worker PIDs to file
function saveWorkers(workers) {
  const dataDir = path.dirname(WORKERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(WORKERS_FILE, JSON.stringify(workers, null, 2));
}

// Load worker PIDs from file
function loadWorkers() {
  try {
    if (fs.existsSync(WORKERS_FILE)) {
      const data = fs.readFileSync(WORKERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading workers file:', error.message);
  }
  return [];
}

// Add a worker PID
function addWorker(pid) {
  const workers = loadWorkers();
  workers.push({ pid, startedAt: new Date().toISOString() });
  saveWorkers(workers);
}

// Remove a worker PID
function removeWorker(pid) {
  const workers = loadWorkers();
  const filtered = workers.filter(w => w.pid !== pid);
  saveWorkers(filtered);
}

// Check if a process is running
function isProcessRunning(pid) {
  try {
    // Sending signal 0 checks if process exists without killing it
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

// Get list of active workers (filter out dead processes)
function getActiveWorkers() {
  const workers = loadWorkers();
  const active = workers.filter(w => isProcessRunning(w.pid));
  
  // Update file to remove dead workers
  if (active.length !== workers.length) {
    saveWorkers(active);
  }
  
  return active;
}

// Stop a worker process
function stopWorker(pid) {
  try {
    process.kill(pid, 'SIGTERM'); // Graceful shutdown
    return true;
  } catch (error) {
    return false;
  }
}

// Stop all workers
function stopAllWorkers() {
  const workers = getActiveWorkers();
  const results = [];
  
  workers.forEach(worker => {
    const stopped = stopWorker(worker.pid);
    results.push({ pid: worker.pid, stopped });
    if (stopped) {
      removeWorker(worker.pid);
    }
  });
  
  return results;
}

module.exports = {
  addWorker,
  removeWorker,
  getActiveWorkers,
  stopWorker,
  stopAllWorkers,
  isProcessRunning
};