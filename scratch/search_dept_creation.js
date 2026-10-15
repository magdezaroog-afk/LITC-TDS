const fs = require('fs');
const path = require('path');

function searchDir(dir, pattern) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') continue;
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full, pattern);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(full, 'utf8');
      if (pattern.test(content)) {
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (pattern.test(line)) {
            console.log(`${full}:${idx + 1}: ${line.trim().slice(0, 120)}`);
          }
        });
      }
    }
  }
}

console.log('--- Searching for createOperationalDepartment or createDepartment ---');
searchDir('./src', /createOperationalDepartment|createDepartment/);

console.log('--- Searching for "إضافة إدارة" or "إضافة قسم" or "إضافة فريق" ---');
searchDir('./src', /إضافة إدارة|إضافة قسم|إضافة فريق/);
