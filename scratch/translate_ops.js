const fs = require('fs');
const path = 'src/pages/admin/tabs/OperationalStructureTab.tsx';
let c = fs.readFileSync(path, 'utf8');

if (!c.includes('useLanguage')) {
  c = c.replace(/import \{ useAuth \} from '\.\.\/\.\.\/\.\.\/engine\/auth\/AuthContext';/, "import { useAuth } from '../../../engine/auth/AuthContext';\nimport { useLanguage } from '../../../engine/ui-loader/LanguageContext';");
}
if (!c.includes('const { t } = useLanguage();')) {
  c = c.replace(/const \{ user \} = useAuth\(\);/, "const { user } = useAuth();\n  const { t } = useLanguage();");
}

c = c.replace(/<h2>الهيكل التشغيلي \(Operational Structure\)<\/h2>/, "<h2>{t('ops.title')}</h2>");
c = c.replace(/<p style={{ margin: 0, opacity: 0\.8, fontSize: '14px' }}>إدارة الهيكل التنظيمي للمؤسسة \(إدارات، أقسام، وفرق\/وحدات\)\.<\/p>/, "<p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>{t('ops.subtitle')}</p>");

c = c.replace(/<span>إضافة إدارة تشغيلية<\/span>/, "<span>{t('ops.add_dept')}</span>");
c = c.replace(/<span>إضافة قسم<\/span>/g, "<span>{t('ops.add_div')}</span>");
c = c.replace(/<span>إضافة فريق\/وحدة<\/span>/g, "<span>{t('ops.add_team')}</span>");

fs.writeFileSync(path, c);
console.log('OperationalStructureTab translated!');
