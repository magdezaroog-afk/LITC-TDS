const fs = require('fs');
const path = 'src/pages/admin/tabs/InstitutionalStructureTab.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace handleAssignUser
content = content.replace(
  /const handleAssignUser = async \(userId: string\) => \{\s+if \(window\.confirm\('سيتم نقل هذا المستخدم إلى الهيكل التشغيلي ومنحه رتبة\. المتابعة؟'\)\) \{\s+try \{/g,
  `const handleAssignUser = async (userId: string) => {
      try {`
);

// Close handleAssignUser bracket
content = content.replace(
  /\s*alert\('تم تنسيب المستخدم بنجاح وانتقل إلى الهيكل التشغيلي\.'\);\s*\} catch\(e\) \{ console\.error\(e\); alert\('حدث خطأ'\); \}\s*\}/g,
  `
        alert('تم تنسيب المستخدم بنجاح وانتقل إلى الهيكل التشغيلي.');
      } catch(e) { console.error(e); alert('حدث خطأ'); }`
);

// Replace handleUnassignUser
content = content.replace(
  /const handleUnassignUser = async \(userId: string\) => \{\s+if \(window\.confirm\('سيتم إرجاع المستخدم إلى الموظفين العاديين وتجريده من الصلاحيات التشغيلية\. المتابعة؟'\)\) \{\s+try \{/g,
  `const handleUnassignUser = async (userId: string) => {
      try {`
);

// Close handleUnassignUser bracket
content = content.replace(
  /\s*alert\('تم الإرجاع بنجاح\.'\);\s*\} catch\(e\) \{ console\.error\(e\); alert\('حدث خطأ'\); \}\s*\}/g,
  `
        alert('تم الإرجاع بنجاح.');
      } catch(e) { console.error(e); alert('حدث خطأ'); }`
);

fs.writeFileSync(path, content);
console.log('Removed window.confirm from single actions');
