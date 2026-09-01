const fs = require('fs');
const path = 'src/pages/admin/tabs/LayoutEngineLanding.tsx';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('useLanguage')) {
  c = c.replace(/import \{ useAuth \} from '\.\.\/\.\.\/\.\.\/engine\/auth\/AuthContext';/, "import { useAuth } from '../../../engine/auth/AuthContext';\nimport { useLanguage } from '../../../engine/ui-loader/LanguageContext';");
}
if (!c.includes('const { t } = useLanguage();')) {
  c = c.replace(/const \{ user \} = useAuth\(\);/, "const { user } = useAuth();\n  const { t } = useLanguage();");
}

c = c.replace(/<h2>محرك الواجهات المرنة<\/h2>/, "<h2>{t('sidebar.ui_engine')}</h2>");
c = c.replace(/<span>إنشاء واجهة جديدة<\/span>/, "<span>{t('btn.add')}</span>");

fs.writeFileSync(path, c);
console.log('LayoutEngineLanding lightly translated!');
