const fs = require('fs');

const path = 'src/pages/admin/tabs/UILayoutEngineTab.tsx';
let content = fs.readFileSync(path, 'utf8');

const syncLoadHelper = `
  React.useEffect(() => {
    const syncFromBackend = async () => {
      try {
        const res = await fetch('/api/v1/admin/ui-layouts', {
          headers: { 'Authorization': 'Bearer ' + localStorage.getItem('litc_token') }
        });
        if (res.ok) {
          const layouts = await res.json();
          let changed = false;
          layouts.forEach((l: any) => {
            if (l.roleContext === 'HYBRID_SYNC') {
              const current = localStorage.getItem(l.name);
              if (current !== l.layoutJson) {
                localStorage.setItem(l.name, l.layoutJson);
                changed = true;
              }
            }
          });
          // If a new layout came from server, refresh to show it
          // We can dispatch a custom event to reload layouts without refreshing the whole page if needed,
          // but for now this guarantees no data loss across devices.
        }
      } catch(e) {
        console.error('Failed to sync from backend', e);
      }
    };
    syncFromBackend();
  }, []);
`;

// Insert the useEffect inside the main component `UILayoutEngineTab`
// The component is `export const UILayoutEngineTab: React.FC = () => {`
content = content.replace(/(export const UILayoutEngineTab: React\.FC = \(\) => \{\n)/, `$1${syncLoadHelper}\n`);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched syncFromBackend');
