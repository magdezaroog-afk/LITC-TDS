const fs = require('fs');
const path = require('path');

const arAdditions = {
  // Admin Dashboard Shell Settings
  "admin.shell.settings": "الإعدادات",
  "admin.shell.dir_toggle": "تغيير الاتجاه (أفقي / عمودي)",
  "admin.shell.drag_scale": "اسحب لتصغير / تكبير سعة الشريط",
  "admin.shell.taskbar_settings": "إعدادات شريط المهام",
  "admin.shell.position": "موضع الشريط",
  "admin.shell.pos_bottom": "أسفل (أفقي)",
  "admin.shell.pos_right": "يمين (عمودي)",
  "admin.shell.pos_left": "يسار (عمودي)",
  "admin.shell.size": "حجم الشريط",
  "admin.shell.save": "حفظ وإغلاق",

  // Security Access Tab
  "sec.title": "الأمان وقاعدة البيانات",
  "sec.subtitle": "حماية النظام ومراقبة النشاط",
  
  // Dynamic Fields Tab
  "dyn.title": "الحقول الديناميكية",
  "dyn.subtitle": "إدارة النماذج المخصصة",

  // Notification Policies
  "notif.title": "سياسات الإشعارات",
  "notif.subtitle": "إعدادات التنبيهات المتقدمة",

  // Ticket Routing
  "route.title": "توجيه التذاكر",
  "route.subtitle": "قواعد التوجيه المتقدمة",

  // User Matrix
  "matrix.title": "مصفوفة المستخدمين",
  "matrix.subtitle": "إدارة الصلاحيات العامة"
};

const enAdditions = {
  "admin.shell.settings": "Settings",
  "admin.shell.dir_toggle": "Toggle Direction (H/V)",
  "admin.shell.drag_scale": "Drag to scale taskbar",
  "admin.shell.taskbar_settings": "Taskbar Settings",
  "admin.shell.position": "Position",
  "admin.shell.pos_bottom": "Bottom (Horizontal)",
  "admin.shell.pos_right": "Right (Vertical)",
  "admin.shell.pos_left": "Left (Vertical)",
  "admin.shell.size": "Size",
  "admin.shell.save": "Save & Close",

  "sec.title": "Security & Database",
  "sec.subtitle": "System protection & activity monitoring",
  
  "dyn.title": "Dynamic Fields",
  "dyn.subtitle": "Manage custom forms",

  "notif.title": "Notification Policies",
  "notif.subtitle": "Advanced alert settings",

  "route.title": "Ticket Routing",
  "route.subtitle": "Advanced routing rules",

  "matrix.title": "User Matrix",
  "matrix.subtitle": "Global permission management"
};

const arPath = 'src/locales/ar.json';
const enPath = 'src/locales/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

Object.assign(ar, arAdditions);
Object.assign(en, enAdditions);

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

// Function to inject language hook
function injectT(content) {
  if (!content.includes('useLanguage')) {
    content = content.replace(/import \{ useAuth \} from '\.\.\/\.\.\/\.\.\/engine\/auth\/AuthContext';/, "import { useAuth } from '../../../engine/auth/AuthContext';\nimport { useLanguage } from '../../../engine/ui-loader/LanguageContext';");
  }
  if (!content.includes('const { t } = useLanguage();')) {
    content = content.replace(/const \{ user \} = useAuth\(\);/, "const { user } = useAuth();\n  const { t } = useLanguage();");
  }
  return content;
}

// 1. Admin Dashboard Shell
let shellPath = 'src/pages/admin/AdminDashboardShell.tsx';
let shellContent = fs.readFileSync(shellPath, 'utf8');
if (!shellContent.includes('const { t } = useLanguage();')) {
  shellContent = shellContent.replace(/const \{ mode \} = useThemeEngine\(\);/, "const { mode } = useThemeEngine();\n  const { t } = useLanguage();");
}
shellContent = shellContent.replace(/>الإعدادات</g, ">{t('admin.shell.settings')}<");
shellContent = shellContent.replace(/تغيير الاتجاه \(أفقي \/ عمودي\)/g, "{t('admin.shell.dir_toggle')}");
shellContent = shellContent.replace(/اسحب لتصغير \/ تكبير سعة الشريط/g, "{t('admin.shell.drag_scale')}");
shellContent = shellContent.replace(/>إعدادات شريط المهام</g, ">{t('admin.shell.taskbar_settings')}<");
shellContent = shellContent.replace(/>موضع الشريط</g, ">{t('admin.shell.position')}<");
shellContent = shellContent.replace(/>أسفل \(أفقي\)</g, ">{t('admin.shell.pos_bottom')}<");
shellContent = shellContent.replace(/>يمين \(عمودي\)</g, ">{t('admin.shell.pos_right')}<");
shellContent = shellContent.replace(/>يسار \(عمودي\)</g, ">{t('admin.shell.pos_left')}<");
shellContent = shellContent.replace(/>حجم الشريط</g, ">{t('admin.shell.size')}<");
shellContent = shellContent.replace(/>حفظ وإغلاق</g, ">{t('admin.shell.save')}<");
fs.writeFileSync(shellPath, shellContent);

// 2. Tabs
const tabs = [
  { p: 'src/pages/admin/tabs/SecurityAccessTab.tsx', title: 'sec.title', sub: 'sec.subtitle', arT: 'الأمان وقاعدة البيانات', arS: 'حماية النظام ومراقبة النشاط' },
  { p: 'src/pages/admin/tabs/DynamicFieldsTab.tsx', title: 'dyn.title', sub: 'dyn.subtitle', arT: 'الحقول الديناميكية', arS: 'إدارة النماذج المخصصة' },
  { p: 'src/pages/admin/tabs/NotificationPoliciesTab.tsx', title: 'notif.title', sub: 'notif.subtitle', arT: 'سياسات الإشعارات', arS: 'إعدادات التنبيهات المتقدمة' },
  { p: 'src/pages/admin/tabs/TicketRoutingTab.tsx', title: 'route.title', sub: 'route.subtitle', arT: 'توجيه التذاكر', arS: 'قواعد التوجيه المتقدمة' },
  { p: 'src/pages/admin/tabs/UserMatrixTab.tsx', title: 'matrix.title', sub: 'matrix.subtitle', arT: 'مصفوفة المستخدمين', arS: 'إدارة الصلاحيات العامة' }
];

tabs.forEach(tInfo => {
  if (fs.existsSync(tInfo.p)) {
    let c = fs.readFileSync(tInfo.p, 'utf8');
    c = injectT(c);
    
    // Replace <h2> title
    const h2Regex = new RegExp(`<h2>${tInfo.arT}</h2>`, 'g');
    c = c.replace(h2Regex, `<h2>{t('${tInfo.title}')}</h2>`);
    
    // Replace <p> subtitle
    const pRegex = new RegExp(`>\\s*${tInfo.arS}\\s*<`, 'g');
    c = c.replace(pRegex, `>{t('${tInfo.sub}')}<`);
    
    fs.writeFileSync(tInfo.p, c);
  }
});

console.log('Admin tabs and shell translated!');
