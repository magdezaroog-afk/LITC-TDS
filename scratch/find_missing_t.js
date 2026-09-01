const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk('./src');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  // Check for exact matches of `t('` or `t("`
  if (content.match(/\Wt\(['"]/)) {
    // Check if `t` is destructured or defined
    if (!content.match(/\{\s*t\s*\}/) && !content.match(/\{\s*t\s*,/) && !content.match(/,\s*t\s*\}/) && !content.match(/const t =/)) {
      console.log('Missing t in:', f);
    }
  }
});
