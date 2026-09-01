const fs = require('fs');

const path = 'src/components/molecules/SystemModeToggle.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(/import \{ useAuth \} from '..\/..\/engine\/auth\/AuthContext';/, "import { useAuth } from '../../engine/auth/AuthContext';\nimport { useLanguage } from '../../engine/ui-loader/LanguageContext';");

c = c.replace(/const \{ systemMode, setSystemMode, user \} = useAuth\(\);/, "const { systemMode, setSystemMode, user } = useAuth();\n  const { t } = useLanguage();");

c = c.replace(/alert\("([^"]+)"\);/, 'alert(t("access.denied.msg"));');

c = c.replace(/<span>\{isWorkMode \? 'تبديل لوضع العمل' : 'أنت في وضع العمل'\}<\/span>/, "<span>{isWorkMode ? t('system.mode.employee') : t('system.mode.work')}</span>");
c = c.replace(/<span>\{isWorkMode \? 'أنت في وضع العمل' : 'تبديل لوضع العمل'\}<\/span>/, "<span>{isWorkMode ? t('system.mode.work') : t('system.mode.employee')}</span>");

fs.writeFileSync(path, c);
console.log('SystemModeToggle translated!');
