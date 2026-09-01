const fs = require('fs');

const path = 'src/pages/admin/tabs/UILayoutEngineTab.tsx';
let content = fs.readFileSync(path, 'utf8');

// Inject the sync logic helper at the top, just below imports
const syncHelper = `
const syncToBackend = async (key: string, data: any) => {
  try {
    await fetch('/api/v1/admin/ui-layouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('litc_token') },
      body: JSON.stringify({ id: key, name: key, roleContext: 'HYBRID_SYNC', layoutConfig: data })
    });
  } catch (e) {
    console.error('Background sync failed for', key);
  }
};
`;

if (!content.includes('const syncToBackend')) {
  content = content.replace(/(import .*;\n)+/, (match) => match + '\n' + syncHelper + '\n');
}

// Replace setItem with setItem + syncToBackend
content = content.replace(/localStorage\.setItem\(([^,]+),\s*JSON\.stringify\(([^)]+)\)\);/g, (match, key, variable) => {
  return `${match}\n    syncToBackend(${key}, ${variable});`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Patched setItem calls');
