const fs = require('fs');
const path = 'src/pages/admin/tabs/OperationalStructure/OperationalStructureTabCore.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCode = `  const handleBulkUnassignClick = async () => {
     if (window.confirm('هل أنت متأكد من إرجاع المحددين كمستخدمين عاديين وتجريدهم من انتمائهم الحالي؟')) {
        try {
           await Promise.all(selectedPoolUsers.map(id => AdminAPI.unassignUser(parseInt(id))));
           executeUniversalMove(selectedPoolUsers, 'UNASSIGN');
           setSelectedPoolUsers([]);
           alert('تم إرجاع المستخدمين بنجاح!');
        } catch (e) {
           console.error('Failed to unassign', e);
           alert('حدث خطأ أثناء الإرجاع');
        }
     }
  };`;

const newCode = `  const handleBulkUnassignClick = async () => {
        try {
           await Promise.all(selectedPoolUsers.map(id => AdminAPI.unassignUser(parseInt(id), 2)));
           executeUniversalMove(selectedPoolUsers, 'UNASSIGN');
           setSelectedPoolUsers([]);
           alert('تم إرجاع المستخدمين بنجاح!');
        } catch (e) {
           console.error('Failed to unassign', e);
           alert('حدث خطأ أثناء الإرجاع');
        }
  };`;

if (content.includes("if (window.confirm('هل أنت متأكد")) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(path, content);
  console.log('Patched bulk unassign');
} else {
  console.log('Could not find window.confirm in handleBulkUnassignClick');
}
