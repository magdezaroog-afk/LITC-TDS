const fs = require('fs');
const path = 'src/pages/workspace/EmployeeWorkspace.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/'نظام LITC'/g, "t('app.title')");
c = c.replace(/'الرئيسية'/g, "t('tab.dashboard')");
c = c.replace(/'مساحة العمل المخصصة'/g, "t('workspace.custom')");
c = c.replace(/'مساحة عمل الموظف'/g, "t('workspace.employee')");
c = c.replace(/'أنت الآن في وضع إدارة النظام - بعض الوظائف مقفلة'/g, "t('workspace.admin_mode_warning') || 'أنت الآن في وضع إدارة النظام - بعض الوظائف مقفلة'");
c = c.replace(/'تبديل إلى واجهة المشرف'/g, "t('workspace.switch_admin') || 'تبديل إلى واجهة المشرف'");

fs.writeFileSync(path, c);
console.log('EmployeeWorkspace lightly translated!');
