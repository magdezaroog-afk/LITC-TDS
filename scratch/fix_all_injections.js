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
    } else if (file.endsWith('.tsx')) {
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

  // Pattern: const { t } = useLanguage(); injected inside function params
  // e.g. `= ({ \n  const { t } = useLanguage();\n someParam` -> `= ({ someParam` then inject inside body
  
  // Fix pattern 1: injected right after `= ({` before param names
  c = c.replace(
    /= \(\{\s*\n\s*const \{ t \} = useLanguage\(\);\s*\n(\s*)/g, 
    '= ({\n$1'
  );
  
  // Now make sure the hook is inside the function body instead
  // Check if we have useLanguage imported but no hook usage inside a function
  if (c !== orig) {
    // Find where the component function body starts: `}) => {`
    // and inject the hook right after
    if (!c.includes('const { t } = useLanguage();')) {
      c = c.replace(
        /\}\)\s*=>\s*\{/,
        '}) => {\n  const { t } = useLanguage();'
      );
    }
    fs.writeFileSync(fp, c);
    fixCount++;
    console.log('Fixed param injection:', path.basename(fp));
  }
});

// Now also find files where hook is inside const object literals still
files.forEach(fp => {
  let c = fs.readFileSync(fp, 'utf8');
  const orig = c;
  
  // Remove duplicate `const { t } = useLanguage();` lines (keep only the first)
  const hookLine = 'const { t } = useLanguage();';
  const firstIdx = c.indexOf(hookLine);
  if (firstIdx >= 0) {
    const secondIdx = c.indexOf(hookLine, firstIdx + hookLine.length);
    if (secondIdx >= 0) {
      // Remove the second occurrence
      c = c.substring(0, secondIdx) + c.substring(secondIdx + hookLine.length);
      // Clean up any resulting blank lines
      c = c.replace(/\n\s*\n\s*\n/g, '\n\n');
      fs.writeFileSync(fp, c);
      fixCount++;
      console.log('Removed duplicate hook:', path.basename(fp));
    }
  }
});

console.log('Total fixes:', fixCount);
