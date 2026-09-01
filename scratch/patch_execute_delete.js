const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

c = c.replace(
  "      });\n    });\n  };",
  "      });\n    });\n    setConfirmDeleteModal(null);\n  };"
);

c = c.replace(
  "      });\r\n    });\r\n  };",
  "      });\r\n    });\r\n    setConfirmDeleteModal(null);\r\n  };"
);

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('executeDeleteEntity patched!');
