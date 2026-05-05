// tests/index.js - Test entry point that loads all test files
const fs = require('node:fs');
const path = require('node:path');

function loadTestsFromDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'helpers') {
      loadTestsFromDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      require(fullPath);
    }
  }
}

loadTestsFromDir(__dirname);
