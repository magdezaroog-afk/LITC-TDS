const fs = require('fs');
const path = 'src/pages/admin/AdminGovernanceConsole.tsx';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('useLanguage')) {
  c = c.replace(/import \{ useAuth \} from '\.\.\/\.\.\/engine\/auth\/AuthContext';/, "import { useAuth } from '../../engine/auth/AuthContext';\nimport { useLanguage } from '../../engine/ui-loader/LanguageContext';");
}

if (!c.includes('const { t } = useLanguage();')) {
  c = c.replace(/const \{ user \} = useAuth\(\);/, "const { user } = useAuth();\n  const { t } = useLanguage();");
}

c = c.replace(/<h2>مركز حوكمة الإدارة والصلاحيات<\/h2>/, "<h2>{t('admin.governance.title')}</h2>");
c = c.replace(/<p style={{ margin: 0, opacity: 0\.9 }}>مراقبة وإدارة الإعدادات التشغيلية والمصفوفة الأمنية للنظام\.<\/p>/, "<p style={{ margin: 0, opacity: 0.9 }}>{t('admin.governance.subtitle')}</p>");

fs.writeFileSync(path, c);
console.log('AdminGovernanceConsole translated!');
