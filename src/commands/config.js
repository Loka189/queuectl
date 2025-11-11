const db = require('../core/database');

function configGetCommand(key) {
  try {
    if (key) {
      // Get specific key
      const stmt = db.prepare('SELECT value FROM config WHERE key = ?');
      const row = stmt.get(key);
      
      if (row) {
        console.log(`${key} = ${row.value}`);
      } else {
        console.error(`❌ Config key not found: ${key}`);
        process.exit(1);
      }
    } else {
      // Get all config
      const stmt = db.prepare('SELECT * FROM config ORDER BY key');
      const rows = stmt.all();
      
      console.log('\n⚙️  Configuration\n');
      rows.forEach(row => {
        console.log(`  ${row.key.padEnd(25)} = ${row.value}`);
      });
      console.log();
    }
    
  } catch (error) {
    console.error('❌ Error getting config:', error.message);
    process.exit(1);
  }
}

function configSetCommand(key, value) {
  try {
    if (!key || !value) {
      console.error('❌ Error: Both key and value are required');
      console.log('Usage: queuectl config set <key> <value>');
      process.exit(1);
    }

    const stmt = db.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)');
    stmt.run(key, value);
    
    console.log(`✅ Config updated: ${key} = ${value}`);
    
  } catch (error) {
    console.error('❌ Error setting config:', error.message);
    process.exit(1);
  }
}

module.exports = { configGetCommand, configSetCommand };