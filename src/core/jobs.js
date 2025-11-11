const db = require('./database');
const crypto = require('crypto');

// Generate unique job ID
function generateJobId() {
  return `job-${crypto.randomBytes(8).toString('hex')}`;
}

// Get current ISO timestamp
function now() {
  return new Date().toISOString();
}

// Create a new job
function createJob({ command, max_retries = 3 }) {
  const id = generateJobId();
  const timestamp = now();

  const stmt = db.prepare(`
    INSERT INTO jobs (id, command, state, attempts, max_retries, created_at, updated_at)
    VALUES (?, ?, 'pending', 0, ?, ?, ?)
  `);

  stmt.run(id, command, max_retries, timestamp, timestamp);

  return getJobById(id);
}

// Get job by ID
function getJobById(id) {
  const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
  return stmt.get(id);
}

// Get all jobs by state
function getJobsByState(state) {
  const stmt = db.prepare('SELECT * FROM jobs WHERE state = ? ORDER BY created_at ASC');
  return stmt.all(state);
}

// Update job state
function updateJobState(id, state, additionalFields = {}) {
  const fields = { state, updated_at: now(), ...additionalFields };
  
  const keys = Object.keys(fields);
  const values = Object.values(fields);
  
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  
  const stmt = db.prepare(`UPDATE jobs SET ${setClause} WHERE id = ?`);
  stmt.run(...values, id);
  
  return getJobById(id);
}

// Get next pending job ready to run
function getNextPendingJob(workerId) {
  const stmt = db.prepare(`
    UPDATE jobs 
    SET 
      state = 'processing',
      locked_by = ?,
      locked_at = ?,
      updated_at = ?
    WHERE id = (
      SELECT id FROM jobs
      WHERE state = 'pending'
        AND (retry_at IS NULL OR retry_at <= ?)
        AND (locked_by IS NULL OR locked_at < datetime('now', '-5 minutes'))
      ORDER BY created_at ASC
      LIMIT 1
    )
    RETURNING *
  `);

  const timestamp = now();
  return stmt.get(workerId, timestamp, timestamp, timestamp);
}

// Get job statistics
function getJobStats() {
  const stmt = db.prepare(`
    SELECT 
      state,
      COUNT(*) as count
    FROM jobs
    GROUP BY state
  `);

  const rows = stmt.all();
  
  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    dead: 0,
    total: 0
  };

  rows.forEach(row => {
    stats[row.state] = row.count;
    stats.total += row.count;
  });

  return stats;
}


// Delete all jobs (for testing)
 
function clearAllJobs() {
  db.prepare('DELETE FROM jobs').run();
}

module.exports = {
  createJob,
  getJobById,
  getJobsByState,
  updateJobState,
  getNextPendingJob,
  getJobStats,
  clearAllJobs
};