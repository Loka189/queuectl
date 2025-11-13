const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '../../data/worker.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    // Write to file
    try {
        fs.appendFileSync(LOG_FILE, logMessage);
    } catch (error) {
        // Silently fail if can't write
    }

    // Also log to console (for manual runs)
    console.log(message);
}
function clearLog() {
    try {
        fs.writeFileSync(LOG_FILE, '');
    } catch (error) {
        // Silently fail
    }
}

module.exports = { log, clearLog };