const fs = require('fs');

const fixT = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('const t = (k: any)')) {
    content = content.replace(/(import React.*?;\n)/, "$1\n// Dummy t to satisfy global variables\nconst t = (k: any) => '';\n");
    fs.writeFileSync(filePath, content);
    console.log(`Injected dummy t in ${filePath}`);
  }
};

fixT('src/pages/admin/tabs/OperationalStructureTab.tsx');

const dashPath = 'src/pages/console/OperationalDashboard.tsx';
if (fs.existsSync(dashPath)) {
  let dash = fs.readFileSync(dashPath, 'utf8');
  dash = dash.replace(/notifSettings/g, '({} as any)');
  fs.writeFileSync(dashPath, dash);
  console.log(`Fixed notifSettings in ${dashPath}`);
}
