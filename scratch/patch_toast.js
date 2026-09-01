const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

// 1. Add state declaration if it doesn't exist
if (!c.includes('const [toastMessage, setToastMessage]')) {
  c = c.replace(
    /const \[departments, setDepartments\] = useState<OrgDepartment\[\]>\(\[\]\);/,
    "const [departments, setDepartments] = useState<OrgDepartment[]>([]);\n  const [toastMessage, setToastMessage] = useState<{title: string, msg: string, type: 'success' | 'error'} | null>(null);"
  );
}

// 2. Add JSX for toastMessage if it doesn't exist
const toastJSX = `
      {/* Toast Message */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', padding: '15px 20px', background: toastMessage.type === 'success' ? '#22c55e' : '#ef4444', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', zIndex: 99999, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <strong style={{ fontSize: '14px' }}>{toastMessage.title}</strong>
          <span style={{ fontSize: '12px' }}>{toastMessage.msg}</span>
        </div>
      )}
`;

if (!c.includes('Toast Message')) {
  const lastDivIndex = c.lastIndexOf('</div>');
  c = c.substring(0, lastDivIndex) + toastJSX + c.substring(lastDivIndex);
}

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Toast injected successfully!');
