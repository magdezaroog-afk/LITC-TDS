const fs = require('fs');

// Translation mappings for Login.tsx
const arAdditions = {
  "login.title": "LITC OS",
  "login.subtitle": "بوابة الوصول الآمن",
  "login.corporate": "الدخول بحساب الشركة (Microsoft 365)",
  "login.credential_title": "الدخول المباشر للتجربة (Credential Login)",
  "login.username_ph": "اسم المستخدم (مثل: admin, tech, emp)",
  "login.password_ph": "كلمة المرور (admin123)",
  "login.submit": "دخول للنظام",
  "login.director_btn": "دخول مدير النظام المطلق (Master Builder)",
  "login.err_empty": "يرجى إدخال اسم المستخدم وكلمة المرور",
  "login.err_fail": "فشل تسجيل الدخول",
  "login.err_net": "حدث خطأ في الاتصال بالخادم"
};

const enAdditions = {
  "login.title": "LITC OS",
  "login.subtitle": "Secure Access Gateway",
  "login.corporate": "Login with Corporate Account (Microsoft 365)",
  "login.credential_title": "Direct Login for Testing (Credential Login)",
  "login.username_ph": "Username (e.g., admin, tech, emp)",
  "login.password_ph": "Password (admin123)",
  "login.submit": "System Login",
  "login.director_btn": "Master Builder Login",
  "login.err_empty": "Please enter username and password",
  "login.err_fail": "Login failed",
  "login.err_net": "Server connection error"
};

// 1. Update Locales
const arPath = 'src/locales/ar.json';
const enPath = 'src/locales/en.json';

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

Object.assign(ar, arAdditions);
Object.assign(en, enAdditions);

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

// 2. Modify Login.tsx
const loginPath = 'src/pages/auth/Login.tsx';
let c = fs.readFileSync(loginPath, 'utf8');

if (!c.includes('useLanguage')) {
  c = c.replace(/import \{ useAuth, Role \} from '\.\.\/\.\.\/engine\/auth\/AuthContext';/, "import { useAuth, Role } from '../../engine/auth/AuthContext';\nimport { useLanguage } from '../../engine/ui-loader/LanguageContext';");
  c = c.replace(/const \{ login \} = useAuth\(\);/, "const { login } = useAuth();\n  const { t } = useLanguage();");
}

c = c.replace(/'يرجى إدخال اسم المستخدم وكلمة المرور'/g, "t('login.err_empty')");
c = c.replace(/'فشل تسجيل الدخول'/g, "t('login.err_fail')");
c = c.replace(/'حدث خطأ في الاتصال بالخادم'/g, "t('login.err_net')");
c = c.replace(/'دخول مدير النظام المطلق \(Master Builder\)'/g, "t('login.director_btn')");
c = c.replace(/>بوابة الوصول الآمن</g, ">{t('login.subtitle')}<");
c = c.replace(/الدخول بحساب الشركة \(Microsoft 365\)/g, "{t('login.corporate')}");
c = c.replace(/الدخول المباشر للتجربة \(Credential Login\)/g, "{t('login.credential_title')}");
c = c.replace(/"اسم المستخدم \(مثل: admin, tech, emp\)"/g, "{t('login.username_ph')}");
c = c.replace(/"كلمة المرور \(admin123\)"/g, "{t('login.password_ph')}");
c = c.replace(/>دخول للنظام</g, ">{t('login.submit')}<");

fs.writeFileSync(loginPath, c);
console.log('Login.tsx translated!');
