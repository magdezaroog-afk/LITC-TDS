const fs = require('fs');
let c = fs.readFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', 'utf8');

c = c.replace(
  /alert\('لا توجد إدارات أو مكاتب في الهيكل المؤسسي لإضافتها.'\);/g,
  "setToastMessage({ title: 'غير مسموح', msg: 'لا توجد إدارات أو مكاتب في الهيكل المؤسسي لإضافتها.', type: 'error' }); setTimeout(() => setToastMessage(null), 3500);"
);

c = c.replace(
  /alert\('جميع الإدارات في الهيكل المؤسسي تم إضافتها مسبقاً.'\);/g,
  "setToastMessage({ title: 'مكتمل', msg: 'جميع الإدارات في الهيكل المؤسسي تم إضافتها مسبقاً.', type: 'success' }); setTimeout(() => setToastMessage(null), 3500);"
);

c = c.replace(
  /alert\(\`لا توجد أقسام متفرعة من "\$\{deptName\}" في الهيكل المؤسسي\.\`\);/g,
  "setToastMessage({ title: 'غير مسموح', msg: `لا توجد أقسام متفرعة من \"${deptName}\" في الهيكل المؤسسي.`, type: 'error' }); setTimeout(() => setToastMessage(null), 3500);"
);

c = c.replace(
  /alert\('تم إضافة جميع الأقسام المتاحة لهذه الإدارة.'\);/g,
  "setToastMessage({ title: 'مكتمل', msg: 'تم إضافة جميع الأقسام المتاحة لهذه الإدارة.', type: 'success' }); setTimeout(() => setToastMessage(null), 3500);"
);

c = c.replace(
  /alert\(\`لا توجد وحدات أو فرق متفرعة من القسم "\$\{divName\}" في الهيكل المؤسسي\.\`\);/g,
  "setToastMessage({ title: 'غير مسموح', msg: `لا توجد وحدات أو فرق متفرعة من القسم \"${divName}\" في الهيكل المؤسسي.`, type: 'error' }); setTimeout(() => setToastMessage(null), 3500);"
);

c = c.replace(
  /alert\('تم إضافة جميع الوحدات والفرق المتاحة لهذا القسم.'\);/g,
  "setToastMessage({ title: 'مكتمل', msg: 'تم إضافة جميع الوحدات والفرق المتاحة لهذا القسم.', type: 'success' }); setTimeout(() => setToastMessage(null), 3500);"
);

fs.writeFileSync('src/pages/admin/tabs/OperationalStructureTab.tsx', c);
console.log('Done!');
