const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('dist')) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src');
let fixCount = 0;

files.forEach(fp => {
  let c = fs.readFileSync(fp, 'utf8');
  const orig = c;

  // Remove `const { t } = useLanguage();` that was erroneously injected 
  // inside a const object literal like: `const A = { const { t } = useLanguage(); ... }`
  // Pattern: inside object literal (not inside a function body)
  // Strategy: remove it if the line before it is: `const X = {` (object, not function)
  
  // More targeted: find lines like "const { t } = useLanguage();" that come 
  // RIGHT after an OBJECT literal opening: `const SOMETHING = {`
  // (as opposed to a function body opening which ends with `=> {` or `) {`)
  c = c.replace(
    /(const\s+[A-Z_]+\s*=\s*\{)\s*\n\s*const \{ t \} = useLanguage\(\);\s*\n/g,
    '$1\n'
  );

  // Also fix: injected inside `const A = {` lowercase too
  c = c.replace(
    /(const\s+[a-z_A-Z]+\s*=\s*\{)\s*\n\s*const \{ t \} = useLanguage\(\);\s*\n/g,
    '$1\n'
  );
  
  // Also fix export const ROUTES_KEY type of patterns
  c = c.replace(
    /(export\s+const\s+\w+\s*=\s*\{)\s*\n\s*const \{ t \} = useLanguage\(\);\s*\n/g,
    '$1\n'
  );

  if (c !== orig) {
    fs.writeFileSync(fp, c);
    fixCount++;
    console.log('Fixed:', path.basename(fp));
  }
});

console.log('Fixed', fixCount, 'files');
