import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../../engine/auth/AuthContext';
import { NexusTdsBrand } from '../../components/brand/NexusTdsBrand';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sun,
  Moon,
  Check
} from 'lucide-react';

/**
 * Login — NEXUS TDS Official Authentication
 * Creative Direction: Purity & Minimalism (النقاء الإبداعي)
 * Aesthetic: High-End Enterprise / Kitchn & Geist inspired
 * Palette:
 *  - Teal: #135d79
 *  - Orange: #f36c21
 */
export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Light / Dark Mode Toggle State ──
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('litc_theme') || localStorage.getItem('litc_theme_mode');
    return saved !== null ? saved === 'dark' : true;
  });

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('litc_theme', next ? 'dark' : 'light');
      localStorage.setItem('litc_theme_mode', next ? 'dark' : 'light');
      if (next) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Support for impersonation token if passed via URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const impersonateToken = params.get('impersonate');
    if (impersonateToken) {
      localStorage.setItem('litc_token', impersonateToken);
      fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${impersonateToken}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          const dbUser = data.user;
          const roleMap: Record<string, Role> = {
            'System_Admin':       'super_admin',
            'SUPER_ADMIN':        'super_admin',
            'SYSTEM_ADMIN':       'super_admin',
            'IT_Admin':           'system_director',
            'IT_ADMIN':           'system_director',
            'OPERATIONAL_MANAGER':'tech_director',
            'SECTION_HEAD':       'dept_head',
            'TEAM_LEADER':        'team_leader',
            'OPERATIONAL_USER':   'operational_user',
            'Employee':           'employee',
            'EMPLOYEE':           'employee',
          };
          let finalRole: Role = roleMap[dbUser.role?.name] || 'employee';
          if (dbUser.email === 'admin@litc.ly' || dbUser.email?.includes('admin')) {
            finalRole = 'super_admin';
          }
          login({
            id: dbUser.id.toString(),
            role: finalRole,
            name: dbUser.fullName || dbUser.username,
            email: dbUser.email,
            department: dbUser.department?.name || 'CORE'
          });
          window.history.replaceState({}, document.title, window.location.pathname);
          if (finalRole === 'super_admin' || finalRole === 'system_director') {
            navigate('/admin');
          } else {
            navigate('/hub');
          }
        }
      })
      .catch(err => {
        console.error("Impersonation failed:", err);
      });
    }
  }, [login, navigate]);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
        setLoading(false);
        return;
      }

      if (data.token) {
        sessionStorage.setItem('litc_token', data.token);
        sessionStorage.setItem('token', data.token);
        localStorage.setItem('litc_token', data.token);
        localStorage.setItem('token', data.token);
      }

      const dbUser = data.user;
      const roleMap: Record<string, Role> = {
        'System_Admin':       'super_admin',
        'SUPER_ADMIN':        'super_admin',
        'SYSTEM_ADMIN':       'super_admin',
        'IT_Admin':           'system_director',
        'IT_ADMIN':           'system_director',
        'OPERATIONAL_MANAGER':'tech_director',
        'SECTION_HEAD':       'dept_head',
        'TEAM_LEADER':        'team_leader',
        'OPERATIONAL_USER':   'operational_user',
        'Employee':           'employee',
        'EMPLOYEE':           'employee',
      };

      let finalRole: Role = roleMap[dbUser.role?.name] || 'employee';
      if (dbUser.email === 'admin@litc.ly' || dbUser.email?.includes('admin')) {
        finalRole = 'super_admin';
      }

      login({
        id: dbUser.id.toString(),
        role: finalRole,
        name: dbUser.fullName || dbUser.username,
        email: dbUser.email,
        department: dbUser.department?.name || 'CORE'
      });

      navigate('/');
    } catch (err) {
      setError('تعذر الاتصال بخادم النظام. يرجى التأكد من اتصال الشبكة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`nexus-pure-root ${isDark ? 'is-dark' : 'is-light'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@500;700;800;900&display=swap');

        /* ── Base Canvas ── */
        .nexus-pure-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          direction: rtl;
          font-family: 'Cairo', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 24px;
          box-sizing: border-box;
          overflow: hidden;
          transition: background-color 0.4s ease, color 0.4s ease;
        }

        .nexus-pure-root.is-dark {
          background-color: #070d14;
          color: #f8fafc;
        }

        .nexus-pure-root.is-light {
          background-color: #f8fafc;
          color: #0f172a;
        }

        /* ── Floating Theme Toggle Button ── */
        .nexus-theme-pill {
          position: absolute;
          top: 24px;
          left: 28px;
          z-index: 50;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 14px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          user-select: none;
        }

        .is-dark .nexus-theme-pill {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        }

        .is-dark .nexus-theme-pill:hover {
          background: rgba(30, 41, 59, 0.95);
          border-color: #f36c21;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .is-light .nexus-theme-pill {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(203, 213, 225, 0.85);
          color: #1e293b;
          box-shadow: 0 4px 16px rgba(19, 93, 121, 0.08);
        }

        .is-light .nexus-theme-pill:hover {
          background: #ffffff;
          border-color: #f36c21;
          color: #f36c21;
          transform: translateY(-1px);
        }

        /* ── Subtle Institutional Tech Background ── */
        .nexus-ambient-orb-teal {
          position: absolute;
          top: 15%;
          right: 25%;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(19, 93, 121, 0.25) 0%, rgba(19, 93, 121, 0.05) 50%, transparent 70%);
          filter: blur(85px);
          animation: nexusFloatTeal 22s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 1;
        }

        .nexus-ambient-orb-orange {
          position: absolute;
          bottom: 12%;
          left: 20%;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(243, 108, 33, 0.18) 0%, rgba(243, 108, 33, 0.04) 50%, transparent 70%);
          filter: blur(95px);
          animation: nexusFloatOrange 26s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes nexusFloatTeal {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.08); }
          100% { transform: translate(30px, -25px) scale(0.95); }
        }

        @keyframes nexusFloatOrange {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(35px, -35px) scale(1.06); }
          100% { transform: translate(-25px, 25px) scale(0.92); }
        }

        /* Minimal Tech Grid Overlay */
        .nexus-tech-dots {
          position: absolute;
          inset: 0;
          background-size: 36px 36px;
          mask-image: radial-gradient(circle at 50% 50%, black 35%, transparent 75%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, black 35%, transparent 75%);
          pointer-events: none;
          z-index: 2;
        }

        .is-dark .nexus-tech-dots {
          background-image: 
            radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px);
        }

        .is-light .nexus-tech-dots {
          background-image: 
            radial-gradient(rgba(19, 93, 121, 0.09) 1px, transparent 1px);
        }

        /* ── Central Authentication Card (Purity & Elegance) ── */
        .nexus-card {
          width: 100%;
          max-width: 440px;
          padding: 44px 40px;
          border-radius: 20px;
          position: relative;
          z-index: 10;
          box-sizing: border-box;
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          animation: nexusCardReveal 0.45s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes nexusCardReveal {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .is-dark .nexus-card {
          background: rgba(11, 20, 31, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 24px 64px -12px rgba(0, 0, 0, 0.65),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
        }

        .is-light .nexus-card {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(226, 232, 240, 0.9);
          box-shadow: 
            0 20px 50px -10px rgba(19, 93, 121, 0.1),
            0 0 0 1px rgba(255, 255, 255, 0.9) inset;
        }

        /* ── Kitchn UI Inspired Input Controls ── */
        .nexus-kitchn-group {
          margin-bottom: 20px;
          position: relative;
        }

        .nexus-kitchn-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12.5px;
          font-weight: 700;
          margin-bottom: 7px;
          font-family: 'Cairo', sans-serif;
          user-select: none;
        }

        .is-dark .nexus-kitchn-label {
          color: #cbd5e1;
        }

        .is-light .nexus-kitchn-label {
          color: #334155;
        }

        .nexus-kitchn-input-box {
          position: relative;
          display: flex;
          align-items: center;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        .is-dark .nexus-kitchn-input-box {
          background-color: rgba(15, 23, 42, 0.75);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
        }

        .is-dark .nexus-kitchn-input-box:focus-within {
          background-color: rgba(15, 23, 42, 0.95);
          border-color: #f36c21;
          box-shadow: 0 0 0 3.5px rgba(243, 108, 33, 0.2);
        }

        .is-light .nexus-kitchn-input-box {
          background-color: #ffffff;
          border: 1.5px solid #cbd5e1;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .is-light .nexus-kitchn-input-box:focus-within {
          border-color: #f36c21;
          box-shadow: 0 0 0 3.5px rgba(243, 108, 33, 0.15);
        }

        .nexus-kitchn-input {
          width: 100%;
          border: none;
          background: transparent;
          padding: 13px 44px 13px 16px;
          font-size: 14.5px;
          font-family: inherit;
          outline: none;
          box-sizing: border-box;
          direction: rtl;
          text-align: right;
        }

        .is-dark .nexus-kitchn-input {
          color: #f8fafc;
        }

        .is-dark .nexus-kitchn-input::placeholder {
          color: rgba(148, 163, 184, 0.45);
        }

        .is-light .nexus-kitchn-input {
          color: #0f172a;
        }

        .is-light .nexus-kitchn-input::placeholder {
          color: #94a3b8;
        }

        .nexus-kitchn-icon {
          position: absolute;
          right: 14px;
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s ease;
        }

        .is-dark .nexus-kitchn-icon {
          color: rgba(148, 163, 184, 0.55);
        }

        .is-dark .nexus-kitchn-input-box:focus-within .nexus-kitchn-icon {
          color: #f36c21;
        }

        .is-light .nexus-kitchn-icon {
          color: #94a3b8;
        }

        .is-light .nexus-kitchn-input-box:focus-within .nexus-kitchn-icon {
          color: #f36c21;
        }

        .nexus-password-reveal {
          position: absolute;
          left: 12px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: color 0.18s ease;
        }

        .is-dark .nexus-password-reveal {
          color: rgba(148, 163, 184, 0.5);
        }

        .is-dark .nexus-password-reveal:hover {
          color: #f36c21;
        }

        .is-light .nexus-password-reveal {
          color: #94a3b8;
        }

        .is-light .nexus-password-reveal:hover {
          color: #f36c21;
        }

        /* ── Primary Submit Button (Brand Vibrant Orange) ── */
        .nexus-kitchn-btn {
          width: 100%;
          padding: 13.5px 20px;
          background: linear-gradient(135deg, #f36c21 0%, #ea580c 100%);
          border: none;
          border-radius: 12px;
          color: #ffffff;
          font-family: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 18px rgba(243, 108, 33, 0.38);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          margin-top: 10px;
        }

        .nexus-kitchn-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          background: linear-gradient(135deg, #fb923c 0%, #f36c21 100%);
          box-shadow: 0 8px 24px rgba(243, 108, 33, 0.48);
        }

        .nexus-kitchn-btn:active:not(:disabled) {
          transform: translateY(0.5px);
        }

        .nexus-kitchn-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }
      `}</style>

      {/* ── Theme Switcher Floating Pill ── */}
      <button
        onClick={toggleTheme}
        type="button"
        className="nexus-theme-pill"
        title={isDark ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
      >
        {isDark ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#f36c21" />}
        <span>{isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}</span>
      </button>

      {/* ── Subtle Institutional Tech Ambient Animations ── */}
      <div className="nexus-ambient-orb-teal" />
      <div className="nexus-ambient-orb-orange" />
      <div className="nexus-tech-dots" />

      {/* ── Focused Purity Login Card ── */}
      <div className="nexus-card">

        {/* 1. Official NEXUS TDS Logo (Stacked & Centered) */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <NexusTdsBrand
            variant="stacked"
            size="lg"
            theme={isDark ? 'dark' : 'light'}
            showSubtitle={true}
          />
        </div>

        {/* 2. Error Banner */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(254, 242, 242, 0.95)',
              border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #fecaca',
              color: isDark ? '#fca5a5' : '#dc2626',
              borderRadius: '10px',
              padding: '11px 14px',
              marginBottom: '20px',
              fontSize: '13px',
              fontWeight: 600,
              animation: 'fadeIn 0.2s ease'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* 3. Credentials Form (Kitchn UI Style) */}
        <form onSubmit={handleCredentialLogin}>

          {/* Email Field */}
          <div className="nexus-kitchn-group">
            <label className="nexus-kitchn-label">
              <span>البريد الإلكتروني المؤسسي</span>
              <span style={{ fontSize: '11px', color: '#f36c21', fontWeight: 600 }}>Work Email</span>
            </label>
            <div className="nexus-kitchn-input-box">
              <span className="nexus-kitchn-icon">
                <Mail size={17} />
              </span>
              <input
                type="email"
                className="nexus-kitchn-input"
                placeholder="name@nexus.ly"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="nexus-kitchn-group">
            <div className="nexus-kitchn-label">
              <span>كلمة المرور</span>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('يرجى التواصل مع إدارة تقنية المعلومات لإعادة تعيين كلمة المرور الخاصة بحسابك.');
                }}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#f36c21',
                  textDecoration: 'none'
                }}
              >
                نسيت كلمة المرور؟
              </a>
            </div>
            <div className="nexus-kitchn-input-box">
              <span className="nexus-kitchn-icon">
                <Lock size={17} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="nexus-kitchn-input"
                placeholder="أدخل كلمة المرور الخاصة بك"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="nexus-password-reveal"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 600,
                color: isDark ? '#cbd5e1' : '#475569',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: '#f36c21',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              />
              <span>تذكر بيانات الدخول (Remember me)</span>
            </label>
          </div>

          {/* Submit Primary Button */}
          <button
            type="submit"
            className="nexus-kitchn-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <span>جاري التحقق من الهوية...</span>
              </>
            ) : (
              <>
                <span>تسجيل الدخول للنظام</span>
                <ArrowLeft size={16} />
              </>
            )}
          </button>
        </form>

        {/* 4. Enterprise Security Footer */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '16px',
            borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '11px',
            color: isDark ? '#64748b' : '#94a3b8'
          }}
        >
          <ShieldCheck size={13} color="#10b981" />
          <span>اتصال مشفّر وآمن • Enterprise TLS 1.3 • NEXUS Identity Guard</span>
        </div>

      </div>

    </div>
  );
};
export default Login;
