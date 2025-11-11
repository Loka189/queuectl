const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database file path
const DB_PATH = path.join(__dirname, '../../data/queue.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Connect to database
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
function initializeDatabase() {
  const schema = `
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      command TEXT NOT NULL,
      state TEXT NOT NULL CHECK(state IN ('pending', 'processing', 'completed', 'failed', 'dead')),
      attempts INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      retry_at TEXT,
      locked_by TEXT,
      locked_at TEXT,
      error_message TEXT,
      completed_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_state ON jobs(state);
    CREATE INDEX IF NOT EXISTS idx_retry_at ON jobs(retry_at);
    CREATE INDEX IF NOT EXISTS idx_locked_by ON jobs(locked_by);

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `;

  db.exec(schema);

  // Insert default config if not exists
  const configDefaults = [
    { key: 'max_retries', value: '3' },
    { key: 'backoff_base', value: '2' },
    { key: 'lock_timeout_seconds', value: '300' }
  ];

  const insertConfig = db.prepare('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)');
  for (const config of configDefaults) {
    insertConfig.run(config.key, config.value);
  }
}

// Initialize on first import
initializeDatabase();

module.exports = db;