const fs = require('fs');
const path = require('path');

// Fix 1: title=t('key') -> title={t('key')} in all TSX files
// Fix 2: aria-label=t('key') -> aria-label={t('key')} in all TSX files
// Fix 3: Remove const { t } = useLanguage(); injected inside interfaces/type blocks

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

  // Fix: title=t('key') -> title={t('key')}
  c = c.replace(/(\s(?:title|aria-label|placeholder|alt))=t\('([^']+)'\)/g, "$1={t('$2')}");
  
  // Fix: value=t('key') -> value={t('key')} 
  c = c.replace(/(\s(?:value|label|text))=t\('([^']+)'\)/g, "$1={t('$2')}");

  // Fix const { t } injected inside interface or type blocks
  // Pattern: interface Foo { ... const { t } = useLanguage(); ... }
  // We need to detect if `const { t } = useLanguage();` is inside a type/interface block
  // Strategy: remove if it appears as the ONLY line added inside a non-function context
  // Check if the const { t } is between `interface` and closing `}`
  
  // Remove hook injections that landed inside TypeScript interface/type/enum blocks
  // Find interface blocks and remove erroneous hook injections from them
  c = c.replace(/((?:interface|type|enum)\s+\w+[^{]*\{)\s*\n\s*const \{ t \} = useLanguage\(\);\s*\n/g, '$1\n');

  if (c !== orig) {
    fs.writeFileSync(fp, c);
    fixCount++;
    console.log('Fixed:', path.basename(fp));
  }
});

console.log('Fixed', fixCount, 'files');
