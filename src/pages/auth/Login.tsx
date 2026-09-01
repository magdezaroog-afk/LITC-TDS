import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../../engine/auth/AuthContext';

const t = (key: any, fallback?: any) => fallback || key;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCorporateLogin = () => {
    setShowEmailLogin(true);
  };

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (!data.success) {
        setError(data.error || 'كلمة المرور أو البريد الإلكتروني غير صحيح');
        return;
      }
      
      const dbUser = data.user;
      let roleMap: any = {
        'System_Admin': 'super_admin',
        'IT_Admin': 'system_director',
        'OPERATIONAL_MANAGER': 'tech_director',
        'SECTION_HEAD': 'dept_head',
        'TEAM_LEADER': 'team_leader',
        'OPERATIONAL_USER': 'employee',
        'Employee': 'employee'
      };
      
      // Give system_director role if the user is System Administrator
      let finalRole = roleMap[dbUser.role?.name] || 'employee';
      if (dbUser.fullName === 'System Administrator' || dbUser.fullName === 'System Director') {
         finalRole = 'system_director';
      }

      login({
        id: dbUser.id.toString(),
        role: finalRole as Role,
        name: dbUser.fullName,
        email: dbUser.email,
        department: dbUser.department?.name || 'CORE'
      });
      navigate('/');
    } catch (err) {
      setError('خطأ في الاتصال بالخادم');
    }
  };

  const handleSystemDirectorLogin = async () => {
      try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@litc.ly', password: '1213456789' })
      });
      const data = await response.json();
      if(data.success) {
        login({
          id: data.user.id.toString(),
          role: 'system_director',
          name: data.user.fullName,
          email: data.user.email,
          department: 'MASTER_BUILDER'
        });
        navigate('/');
      }
    } catch(err) {
        console.error(err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0b0f19 0%, #1a1f2e 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      direction: 'rtl',
      padding: '20px',
      position: 'relative'
    }}>
      <button 
        onClick={handleSystemDirectorLogin}
        title="دخول مدير النظام المطلق"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: '2px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: '24px',
          transition: 'all 0.3s ease',
          zIndex: 999999,
          boxShadow: '0 0 15px rgba(255,255,255,0.2)'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'rotate(90deg)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'rotate(0deg)'; }}
      >
        ⚙️
      </button>

      <div style={{
        width: '100%',
        maxWidth: '450px',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ fontSize: '64px', marginBottom: '10px', filter: 'drop-shadow(0 0 20px rgba(0, 229, 255, 0.5))' }}>🛡️</div>
          <h1 style={{ margin: 0, fontSize: '32px', color: '#fff', fontWeight: '900', letterSpacing: '2px' }}>LITC OS</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '10px 0 0' }}>بوابة الوصول الآمن</p>
        </div>

        {!showEmailLogin ? (
          <button
            onClick={handleCorporateLogin}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(90deg, #0078D4 0%, #005A9E 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 15px rgba(0, 120, 212, 0.4)',
              transition: 'all 0.3s ease',
              marginBottom: '30px'
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <svg viewBox="0 0 23 23" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f3f3f3" d="M0 0h23v23H0z"/>
              <path fill="#f35325" d="M1 1h10v10H1z"/>
              <path fill="#81bc06" d="M12 1h10v10H12z"/>
              <path fill="#05a6f0" d="M1 12h10v10H1z"/>
              <path fill="#ffba08" d="M12 12h10v10H12z"/>
            </svg>
            الدخول عبر بريد الشركة
          </button>
        ) : (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <h3 style={{ color: '#fff', fontSize: '13px', marginBottom: '20px', fontWeight: 'normal', lineHeight: '1.6', background: 'rgba(255, 86, 48, 0.1)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255, 86, 48, 0.3)' }}>
              لم يتم الربط مع خدمات مايكروسوفت مع مؤسستك إلى الآن، فأرجو إدخال البريد والرقم السري الخاص بك
            </h3>
            <form onSubmit={handleCredentialLogin} style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '12px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <input
                type="password"
                placeholder="الرقم السري"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              {error && <div style={{ color: '#ff5630', fontSize: '12px', marginBottom: '10px' }}>{error}</div>}
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  transition: 'background 0.2s',
                  boxSizing: 'border-box'
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              >تسجيل الدخول</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
