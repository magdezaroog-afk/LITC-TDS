const fs = require('fs');

const arPath = 'src/locales/ar.json';
const enPath = 'src/locales/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// SystemModeToggle
ar['system.mode.work'] = 'أنت في وضع العمل';
en['system.mode.work'] = 'You are in Work Mode';
ar['system.mode.employee'] = 'تبديل لوضع العمل';
en['system.mode.employee'] = 'Switch to Work Mode';

// AdminGovernanceConsole
ar['admin.governance.title'] = 'مركز حوكمة الإدارة والصلاحيات';
en['admin.governance.title'] = 'Governance & Authorization Center';
ar['admin.governance.subtitle'] = 'مراقبة وإدارة الإعدادات التشغيلية والمصفوفة الأمنية للنظام.';
en['admin.governance.subtitle'] = 'Monitor and manage operational settings and security matrix of the system.';

// OperationalStructureTab
ar['ops.title'] = 'الهيكل التشغيلي (Operational Structure)';
en['ops.title'] = 'Operational Structure';
ar['ops.subtitle'] = 'إدارة الهيكل التنظيمي للمؤسسة (إدارات، أقسام، وفرق/وحدات).';
en['ops.subtitle'] = 'Manage the organizational structure (Departments, Divisions, and Teams).';
ar['ops.add_dept'] = 'إضافة إدارة تشغيلية';
en['ops.add_dept'] = 'Add Department';
ar['ops.add_div'] = 'إضافة قسم';
en['ops.add_div'] = 'Add Division';
ar['ops.add_team'] = 'إضافة فريق/وحدة';
en['ops.add_team'] = 'Add Team/Unit';

// Buttons
ar['btn.cancel'] = 'إلغاء';
en['btn.cancel'] = 'Cancel';
ar['btn.save'] = 'حفظ وإضافة';
en['btn.save'] = 'Save & Add';
ar['btn.delete'] = 'تأكيد الحذف';
en['btn.delete'] = 'Confirm Delete';
ar['btn.add'] = 'إضافة';
en['btn.add'] = 'Add';
ar['btn.close'] = 'إغلاق';
en['btn.close'] = 'Close';

// Forms
ar['form.name_ar'] = 'الاسم (بالعربية)';
en['form.name_ar'] = 'Name (Arabic)';
ar['form.name_en'] = 'الاسم (بالإنجليزية)';
en['form.name_en'] = 'Name (English)';
ar['form.description'] = 'الوصف / ملاحظات';
en['form.description'] = 'Description / Notes';
ar['form.select_parent'] = 'اختر الإدارة المرجعية أولاً';
en['form.select_parent'] = 'Select Parent Department First';
ar['form.select_dept'] = '-- اختر الإدارة التشغيلية --';
en['form.select_dept'] = '-- Select Department --';
ar['form.select_div'] = '-- اختر القسم التشغيلي --';
en['form.select_div'] = '-- Select Division --';

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('Dictionaries updated successfully.');
