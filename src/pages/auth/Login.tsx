import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Role } from '../../engine/auth/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Set to true by default to show the username/password form for testing
  const [showAdminBypass, setShowAdminBypass] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleCorporateLogin = () => {
    login({
      id: 'usr-employee',
      role: 'employee',
      name: 'موظف ميكروسوفت',
      email: 'employee@litc.local',
      department: 'GENERAL'
    });
    navigate('/employee');
  };

  const handleCredentialLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== 'admin123') {
      setError('كلمة المرور غير صحيحة');
      return;
    }

    let assignedRole: Role | null = null;
    let assignedName = '';

    switch (username) {
      case 'admin':
        assignedRole = 'super_admin';
        assignedName = 'Super Admin';
        break;
      case 'coadmin':
        assignedRole = 'co_admin';
        assignedName = 'Co-Admin';
        break;
      case 'tech':
        assignedRole = 'tech_director';
        assignedName = 'Tech Director';
        break;
      case 'head':
        assignedRole = 'dept_head';
        assignedName = 'Department Head';
        break;
      case 'leader':
        assignedRole = 'team_leader';
        assignedName = 'Team Leader';
        break;
      case 'emp':
        assignedRole = 'employee';
        assignedName = 'Employee';
        break;
      default:
        setError('اسم المستخدم غير صحيح');
        return;
    }

    if (assignedRole) {
      login({
        id: `usr-${username}`,
        role: assignedRole,
        name: assignedName,
        email: `${username}@litc.local`,
        department: 'CORE'
      });
      // The UniversalRouter handles where they go, we just need to go to root (/) which will direct them.
      // But let's trigger a navigate to "/" to let the router handle it
      navigate('/');
    }
  };


  const handleSystemDirectorLogin = () => {
    login({
      id: 'usr-director',
      role: 'system_director',
      name: 'System Director',
      email: 'director@litc.local',
      department: 'MASTER_BUILDER'
    });
    navigate('/');
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
      {/* Absolute System Director Gear Icon */}
      <button 
        onClick={handleSystemDirectorLogin}
        title="دخول مدير النظام المطلق (Master Builder)"
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px', // In RTL, left is visually left
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

        {/* Corporate Login Button */}
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
          الدخول بحساب الشركة (Microsoft 365)
        </button>

        {/* Credential Login Form */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
          <h3 style={{ color: '#fff', fontSize: '14px', marginBottom: '15px', fontWeight: 'normal' }}>
            الدخول المباشر للتجربة (Credential Login)
          </h3>
          <form onSubmit={handleCredentialLogin} style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <input
              type="text"
              placeholder="اسم المستخدم (مثل: admin, tech, emp)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '12px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                outline: 'none'
              }}
            />
            <input
              type="password"
              placeholder="كلمة المرور (admin123)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '16px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                outline: 'none'
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
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            >
              تسجيل الدخول (Login)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
