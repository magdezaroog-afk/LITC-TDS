import re

file_path = "src/pages/admin/tabs/OperationalStructureTab.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

if "import ReactDOM" not in content:
    content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport ReactDOM from 'react-dom';")

# Fix edit modal portal
content = re.sub(
    r"\{editModalOpen && \(\s*(<div style=\{\{ position: 'fixed'.*?</div>\s*</div>)\s*\)\}",
    r"{editModalOpen && ReactDOM.createPortal(\n          \1\n        , document.body)}",
    content,
    flags=re.DOTALL
)

# Fix pending reassignment portal
content = re.sub(
    r"\{pendingReassignment && \(\s*(<div style=\{\{ position: 'fixed'.*?</div>\s*</div>)\s*\)\}",
    r"{pendingReassignment && ReactDOM.createPortal(\n          \1\n        , document.body)}",
    content,
    flags=re.DOTALL
)

# Fix add entity portal
content = re.sub(
    r"\{addEntityModalOpen && \(\s*(<div style=\{\{ position: 'fixed'.*?</div>\s*</div>)\s*\)\}",
    r"{addEntityModalOpen && ReactDOM.createPortal(\n          \1\n        , document.body)}",
    content,
    flags=re.DOTALL
)

# Fix dropdown filtering to hide until typed
content = content.replace(
    ".filter(u => u.name.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) ||",
    ".filter(u => editEntityLeaderSearchTerm.trim().length > 0 && (u.name.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) ||"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modals fixed in OperationalStructureTab.tsx")
