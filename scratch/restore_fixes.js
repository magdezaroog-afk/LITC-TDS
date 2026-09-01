const fs = require('fs');

// 1. Fix UserTicketTracker.tsx
let f1 = 'src/components/organisms/UserTicketTracker.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/OPEN: \{ label: t\('ui\.in_progress'\), icon: '⚙️', color: '#3b82f6' \},/, 
               `OPEN: { label: 'قيد التنفيذ', icon: '⚙️', color: '#3b82f6' },`);
fs.writeFileSync(f1, c1);

// 2. Fix MobileBottomNav.tsx
let f2 = 'src/components/shell/MobileBottomNav.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/const ALL_NAV_ITEMS: NavItem\[\] = \[\s*\{ icon: '🏠', label: t\('ui\.home'\),  path: '\/' \},\s*\{ icon: '📊', label: 'التحليلات', path: '\/mobile\/analytics' \},\s*\{ icon: '🔔', label: t\('notifications\.title'\), path: '\/notifications' \},\s*\{ icon: '🛡️', label: 'الحوكمة',\s*path: '\/admin', roles: \['super_admin', 'co_admin', 'system_director'\] \},\s*\];\s*export const MobileBottomNav: React\.FC = \(\) => \{\s*const \{ t \} = useLanguage\(\);/,
`export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();

  const ALL_NAV_ITEMS: NavItem[] = [
    { icon: '🏠', label: t('ui.home'),  path: '/' },
    { icon: '📊', label: 'التحليلات', path: '/mobile/analytics' },
    { icon: '🔔', label: t('notifications.title'), path: '/notifications' },
    { icon: '🛡️', label: 'الحوكمة',   path: '/admin', roles: ['super_admin', 'co_admin', 'system_director'] },
  ];`);
fs.writeFileSync(f2, c2);

// 3. Fix UnifiedTopBar.tsx
let f3 = 'src/components/shell/UnifiedTopBar.tsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(`import { SystemModeToggle } from '../molecules/SystemModeToggle';\nimport { useBreakpoint }`, 
`import { SystemModeToggle } from '../molecules/SystemModeToggle';
import { LanguageToggle } from '../molecules/LanguageToggle';
import { useBreakpoint }`);
c3 = c3.replace(`{/* Language Toggle — hidden on mobile (inside menu) */}\n          {!isMobile && (\n            <Btn icon="🌐" label={t('nav.language') ?? 'اللغة'} onClick={toggleLanguage} />\n          )}`,
`{/* Language Toggle */}\n          {!isMobile && (\n            <LanguageToggle />\n          )}`);
fs.writeFileSync(f3, c3);

// 4. Fix Login.tsx
let f4 = 'src/pages/auth/Login.tsx';
let c4 = fs.readFileSync(f4, 'utf8');
c4 = c4.replace(`import { Eye, EyeOff } from 'lucide-react';`, `import { Eye, EyeOff } from 'lucide-react';\nimport { LanguageToggle } from '../../components/molecules/LanguageToggle';`);
c4 = c4.replace(/<button\s*onClick=\{toggleLanguage\}[\s\S]*?<span style=\{\{ fontSize: '16px' \}\}>🌐<\/span>\s*<span>\{language === 'ar' \? 'English' : 'العربية'\}<\/span>\s*<\/button>/,
`<div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 999999 }}>\n        <LanguageToggle />\n      </div>`);
// Re-apply translated strings to Login.tsx
c4 = c4.replace(/{showPassword \? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}/g, "{showPassword ? t('login.hide_password') || 'إخفاء كلمة المرور' : t('login.show_password') || 'إظهار كلمة المرور'}");
c4 = c4.replace(/>\s*تسجيل الدخول \(Login\)\s*<\/button>/, ">{t('login.submit_btn') || 'تسجيل الدخول (Login)'}</button>");
fs.writeFileSync(f4, c4);

// 5. Fix InstitutionalStructureTab.tsx
let f5 = 'src/pages/admin/tabs/InstitutionalStructureTab.tsx';
let c5 = fs.readFileSync(f5, 'utf8');
c5 = c5.replace(/import \{ useLanguage \} from '..\/..\/..\/engine\/ui-loader\/LanguageContext';\r?\n/, '');
c5 = c5.replace(
  /export const OrgTreeView: React\.FC<any> = \(\{ orgTree, onEdit, onDelete, onAdd \}\) => \{/,
  `export const OrgTreeView: React.FC<any> = ({ orgTree, onEdit, onDelete, onAdd }) => {\n  const { t } = useLanguage();`
);
c5 = c5.replace(
  /export const InstitutionalStructureTab: React\.FC<.*> = \(\{ orgTree, setOrgTree \}\) => \{/,
  `export const InstitutionalStructureTab: React.FC<{ orgTree: OrgNode, setOrgTree: React.Dispatch<React.SetStateAction<OrgNode>> }> = ({ orgTree, setOrgTree }) => {\n  const { t } = useLanguage();`
);
fs.writeFileSync(f5, c5);

console.log('Restored all fixes!');
