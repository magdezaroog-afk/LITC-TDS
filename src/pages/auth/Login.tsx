import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../../engine/auth/AuthContext';
import litcLogo from '../../functional_ui/assets/litc_palm_transparent.png';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft, Loader2, Sun, Moon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            'OPERATIONAL_USER':   'employee',
            'Employee':           'employee',
            'EMPLOYEE':           'employee',
          };
          let finalRole: Role = roleMap[dbUser.role?.name] || 'employee';
          if (dbUser.email === 'admin@litc.ly') {
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

      if (data.token) localStorage.setItem('litc_token', data.token);

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
        'OPERATIONAL_USER':   'employee',
        'Employee':           'employee',
        'EMPLOYEE':           'employee',
      };

      let finalRole: Role = roleMap[dbUser.role?.name] || 'employee';
      if (dbUser.email === 'admin@litc.ly') {
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
    <div className={`tds-login-root ${isDark ? 'is-dark' : 'is-light'}`}>
      {/* ── Keyframe Animations & Responsive Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap');

        .tds-login-root {
          min-height: 100vh;
          width: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          direction: rtl;
          font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 24px;
          box-sizing: border-box;
          transition: background-color 0.35s ease, color 0.35s ease;
        }

        /* ── Dark Theme Defaults ── */
        .tds-login-root.is-dark {
          background-color: #080c16;
          color: #f8fafc;
        }

        /* ── Light Theme Defaults ── */
        .tds-login-root.is-light {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
          color: #0f172a;
        }

        /* ── Floating Theme Toggle Button (Top Right in RTL) ── */
        .tds-theme-toggle {
          position: absolute;
          top: 24px;
          right: 24px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 30px;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 700;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          outline: none;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .is-dark .tds-theme-toggle {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #e2e8f0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
        }

        .is-dark .tds-theme-toggle:hover {
          background: rgba(30, 41, 59, 0.9);
          border-color: rgba(96, 165, 250, 0.4);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
        }

        .is-light .tds-theme-toggle {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(203, 213, 225, 0.9);
          color: #1e293b;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
        }

        .is-light .tds-theme-toggle:hover {
          background: #ffffff;
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-1.5px);
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.12);
        }

        .tds-theme-toggle-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .tds-theme-toggle:hover .tds-theme-toggle-icon {
          transform: rotate(20deg);
        }

        /* ── Technological Background Elements ── */
        .tds-tech-grid {
          position: absolute;
          inset: 0;
          background-size: 48px 48px;
          mask-image: radial-gradient(circle at 50% 50%, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at 50% 50%, black 30%, transparent 80%);
          pointer-events: none;
          z-index: 1;
          transition: opacity 0.35s ease;
        }

        .is-dark .tds-tech-grid {
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
        }

        .is-light .tds-tech-grid {
          background-image: 
            linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px);
        }

        .tds-ambient-glow-1 {
          position: absolute;
          top: 15%;
          left: 20%;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          filter: blur(80px);
          animation: tdsFloat1 18s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        .is-dark .tds-ambient-glow-1 {
          background: radial-gradient(circle, rgba(37, 99, 235, 0.16) 0%, rgba(30, 58, 138, 0.05) 50%, transparent 70%);
        }

        .is-light .tds-ambient-glow-1 {
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.04) 50%, transparent 70%);
        }

        .tds-ambient-glow-2 {
          position: absolute;
          bottom: 10%;
          right: 20%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(90px);
          animation: tdsFloat2 22s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        .is-dark .tds-ambient-glow-2 {
          background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(59, 130, 246, 0.04) 50%, transparent 70%);
        }

        .is-light .tds-ambient-glow-2 {
          background: radial-gradient(circle, rgba(14, 165, 233, 0.1) 0%, rgba(37, 99, 235, 0.03) 50%, transparent 70%);
        }

        .tds-tech-beam {
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 1px;
          animation: tdsBeamSweep 8s linear infinite;
          pointer-events: none;
          z-index: 2;
        }

        .is-dark .tds-tech-beam {
          background: linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.6), transparent);
        }

        .is-light .tds-tech-beam {
          background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.45), transparent);
        }

        @keyframes tdsFloat1 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(45px, -35px) scale(1.12); }
        }

        @keyframes tdsFloat2 {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          50% { transform: translate(-50px, 40px) scale(1.15); }
        }

        @keyframes tdsBeamSweep {
          0% { left: -60%; }
          100% { left: 160%; }
        }

        @keyframes tdsCardReveal {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* ── Glassmorphic Executive Card ── */
        .tds-login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          border-radius: 24px;
          padding: 38px 34px;
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          animation: tdsCardReveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          box-sizing: border-box;
          transition: background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
        }

        .is-dark .tds-login-card {
          background: rgba(13, 20, 36, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.09);
          box-shadow: 
            0 24px 60px -12px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .is-light .tds-login-card {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(226, 232, 240, 0.95);
          box-shadow: 
            0 24px 60px -12px rgba(15, 23, 42, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.03),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        /* ── Input Styling ── */
        .tds-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          border-radius: 12px;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        .is-dark .tds-input-wrapper {
          background: rgba(10, 16, 29, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.09);
        }

        .is-dark .tds-input-wrapper:hover {
          border-color: rgba(96, 165, 250, 0.35);
          background: rgba(10, 16, 29, 0.85);
        }

        .is-dark .tds-input-wrapper:focus-within {
          border-color: #3b82f6;
          background: rgba(10, 16, 29, 0.95);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18), 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .is-light .tds-input-wrapper {
          background: #ffffff;
          border: 1px solid #cbd5e1;
        }

        .is-light .tds-input-wrapper:hover {
          border-color: rgba(59, 130, 246, 0.5);
        }

        .is-light .tds-input-wrapper:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15), 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .tds-input-field {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 500;
          padding: 13px 46px 13px 46px;
          box-sizing: border-box;
          direction: rtl;
          transition: color 0.2s ease;
        }

        .is-dark .tds-input-field {
          color: #f8fafc;
        }

        .is-dark .tds-input-field::placeholder {
          color: rgba(148, 163, 184, 0.45);
        }

        .is-light .tds-input-field {
          color: #0f172a;
        }

        .is-light .tds-input-field::placeholder {
          color: #94a3b8;
        }

        .tds-input-icon {
          position: absolute;
          right: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .is-dark .tds-input-icon {
          color: rgba(148, 163, 184, 0.6);
        }

        .is-dark .tds-input-wrapper:focus-within .tds-input-icon {
          color: #60a5fa;
        }

        .is-light .tds-input-icon {
          color: #64748b;
        }

        .is-light .tds-input-wrapper:focus-within .tds-input-icon {
          color: #2563eb;
        }

        .tds-password-toggle {
          position: absolute;
          left: 12px;
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }

        .is-dark .tds-password-toggle {
          color: rgba(148, 163, 184, 0.5);
        }

        .is-dark .tds-password-toggle:hover {
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.05);
        }

        .is-light .tds-password-toggle {
          color: #64748b;
        }

        .is-light .tds-password-toggle:hover {
          color: #0f172a;
          background: rgba(0, 0, 0, 0.05);
        }

        /* ── Submit Button ── */
        .tds-submit-btn {
          width: 100%;
          padding: 13.5px 20px;
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 60%, #1e40af 100%);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 12px;
          color: #ffffff;
          font-family: inherit;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 18px rgba(37, 99, 235, 0.35);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
          margin-top: 6px;
        }

        .tds-submit-btn:hover:not(:disabled) {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 24px rgba(37, 99, 235, 0.45);
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 60%, #1d4ed8 100%);
        }

        .tds-submit-btn:active:not(:disabled) {
          transform: translateY(0.5px);
        }

        .tds-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>

      {/* ── Theme Switcher Button (Top Right) ── */}
      <button
        onClick={toggleTheme}
        type="button"
        title={isDark ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
        className="tds-theme-toggle"
      >
        <span className="tds-theme-toggle-icon">
          {isDark ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#2563eb" />}
        </span>
        <span>
          {isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        </span>
      </button>

      {/* ── Background Moving Tech Elements ── */}
      <div className="tds-tech-grid" />
      <div className="tds-ambient-glow-1" />
      <div className="tds-ambient-glow-2" />
      <div className="tds-tech-beam" />

      {/* ── Main Login Card ── */}
      <div className="tds-login-card">

        {/* 1. Brand Logo & System Title */}
        <div style={{ textAlign: 'center', marginBottom: '26px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '18px',
            background: isDark 
              ? 'linear-gradient(145deg, rgba(30, 58, 138, 0.3) 0%, rgba(15, 23, 42, 0.5) 100%)' 
              : 'linear-gradient(145deg, rgba(239, 246, 255, 0.95) 0%, rgba(219, 234, 254, 0.6) 100%)',
            border: isDark ? '1px solid rgba(96, 165, 250, 0.25)' : '1px solid rgba(191, 219, 254, 0.9)',
            boxShadow: isDark 
              ? '0 8px 24px -4px rgba(37, 99, 235, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)' 
              : '0 8px 24px -4px rgba(37, 99, 235, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            marginBottom: '14px',
            padding: '10px',
            boxSizing: 'border-box',
            transition: 'all 0.3s ease'
          }}>
            <img 
              src={litcLogo} 
              alt="LITC Logo" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', 
                filter: isDark 
                  ? 'brightness(2.2) drop-shadow(0 0 10px rgba(96, 165, 250, 0.75))' 
                  : 'drop-shadow(0 2px 8px rgba(30, 58, 82, 0.2))'
              }} 
            />
          </div>

          {/* System Name: TdS */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 900,
              color: isDark ? '#ffffff' : '#0f172a',
              letterSpacing: '-0.02em',
              fontFamily: "'Tajawal', 'Cairo', sans-serif"
            }}>
              TdS
            </h1>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '5px',
              background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
              border: isDark ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(37, 99, 235, 0.25)',
              color: isDark ? '#93c5fd' : '#1d4ed8',
              letterSpacing: '0.04em'
            }}>
              v43.5
            </span>
          </div>

          <p style={{
            margin: '0 0 4px 0',
            fontSize: '13px',
            fontWeight: 600,
            color: isDark ? 'rgba(241, 245, 249, 0.85)' : '#334155',
          }}>
            منظومة إدارة الخدمات والعمليات المؤسسية
          </p>
          <p style={{
            margin: 0,
            fontSize: '11.5px',
            color: isDark ? 'rgba(148, 163, 184, 0.7)' : '#64748b',
          }}>
            شركة الاتصالات الدولية الليبية • LITC
          </p>
        </div>

        {/* 2. Corporate Access Badge (Microsoft Entra / Corporate Identity) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(241, 245, 249, 0.85)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(203, 213, 225, 0.8)',
          borderRadius: '10px',
          padding: '8px 12px',
          marginBottom: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 21 21" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f25022" d="M1 1h9v9H1z"/>
              <path fill="#00a4ef" d="M1 11h9v9H1z"/>
              <path fill="#7fba00" d="M11 1h9v9H11z"/>
              <path fill="#ffb900" d="M11 11h9v9H11z"/>
            </svg>
            <span style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>
              الدخول عبر بريد الشركة
            </span>
          </div>
          <span style={{
            fontSize: '10.5px',
            color: isDark ? '#60a5fa' : '#2563eb',
            fontWeight: 700,
            background: isDark ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.08)',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            @litc.ly
          </span>
        </div>

        {/* 3. Error Banner */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isDark ? 'rgba(239, 68, 68, 0.12)' : 'rgba(239, 68, 68, 0.08)',
            border: isDark ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px',
            padding: '10px 12px',
            marginBottom: '16px',
            color: isDark ? '#fca5a5' : '#dc2626',
            fontSize: '12.5px',
            fontWeight: 600,
            animation: 'tdsCardReveal 0.2s ease-out'
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span>{error}</span>
          </div>
        )}

        {/* 4. Credentials Form */}
        <form onSubmit={handleCredentialLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Email Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: isDark ? '#cbd5e1' : '#334155',
              marginBottom: '6px'
            }}>
              البريد الإلكتروني المؤسسي
            </label>
            <div className="tds-input-wrapper">
              <span className="tds-input-icon">
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="tds-input-field"
                placeholder="اسم المستخدم@litc.ly"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 700,
              color: isDark ? '#cbd5e1' : '#334155',
              marginBottom: '6px'
            }}>
              كلمة المرور
            </label>
            <div className="tds-input-wrapper">
              <span className="tds-input-icon">
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="tds-input-field"
                placeholder="أدخل كلمة المرور الخاصة بحسابك"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="tds-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="tds-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>جاري التحقق من الهوية المؤسسية...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>تسجيل الدخول للنظام</span>
                <ArrowLeft size={15} style={{ marginRight: 'auto' }} />
              </>
            )}
          </button>
        </form>

        {/* 5. Trust & Compliance Footer */}
        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid rgba(226, 232, 240, 0.9)',
          textAlign: 'center'
        }}>
          <p style={{
            margin: '0 0 6px 0',
            fontSize: '11px',
            color: isDark ? 'rgba(148, 163, 184, 0.6)' : '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <span>🔒</span>
            <span>جلسة اتصال آمنة ومشفّرة (TLS 1.3 / Enterprise Grade)</span>
          </p>
          <p style={{
            margin: 0,
            fontSize: '10.5px',
            color: isDark ? 'rgba(100, 116, 139, 0.7)' : '#94a3b8'
          }}>
            للمساعدة أو الدعم الفني، يرجى التواصل مع إدارة تقنية المعلومات
          </p>
        </div>

      </div>

    </div>
  );
};
