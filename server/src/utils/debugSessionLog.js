const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '../../../debug-e586b0.log');

function debugSessionLog(payload) {
  try {
    fs.appendFileSync(
      LOG_PATH,
      `${JSON.stringify({ sessionId: 'e586b0', timestamp: Date.now(), ...payload })}\n`
    );
  } catch {
    // ignore
  }
}

module.exports = { debugSessionLog };
