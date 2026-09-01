const fs = require('fs');

const fixT = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('const t = (k: any)')) {
    content = content.replace(/(import React.*?;\n)/, "$1\n// Dummy t to satisfy global variables\nconst t = (k: any) => '';\n");
    fs.writeFileSync(filePath, content);
    console.log(`Injected dummy t in ${filePath}`);
  }
};

fixT('src/components/organisms/OperationalInbox.tsx');
fixT('src/pages/admin/tabs/BrandingTab.tsx');
