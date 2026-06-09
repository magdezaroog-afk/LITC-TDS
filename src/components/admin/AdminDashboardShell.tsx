import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { useLanguage } from '../../engine/ui-loader/LanguageContext';
import { UILayoutEngineTab } from './tabs/UILayoutEngineTab';
import { OperationalStructureTab } from './tabs/OperationalStructureTab';
import { DynamicFieldsTab } from './tabs/DynamicFieldsTab';
import { SecurityControlTab } from './tabs/SecurityControlTab';
import { NotificationPolicyConsole } from './NotificationPolicyConsole';

/* ─────────────────────────────────────────────
   Animated Tech Background - Canvas Component
   ───────────────────────────────────────────── */
const TechBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    const initParticles = () => {
      particles = [];
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 0.5,
          opacity: Math.random() * 0.15 + 0.05
        });
      }
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.06 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initParticles();
    draw();
    window.addEventListener('resize', () => { resize(); initParticles(); });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

/* ─────────────────────────────────────────────
   Inject Global Keyframes (once)
   ───────────────────────────────────────────── */
const KEYFRAMES_ID = 'admin-shell-keyframes-2026-v2';
const injectKeyframes = () => {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

    @keyframes adminShellFadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes adminShellSlideRight {
      from { opacity: 0; transform: translateX(-30px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes adminShellSlideLeft {
      from { opacity: 0; transform: translateX(30px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes adminPulseGlow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
      50%      { box-shadow: 0 0 20px 4px rgba(99, 102, 241, 0.12); }
    }
    @keyframes adminGradientShift {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes adminContentReveal {
      from { opacity: 0; transform: translateY(12px) scale(0.99); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;
  document.head.appendChild(style);
};

export const AdminDashboardShell: React.FC = () => {
  const { user } = useAuth();
  const { t, dir } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<'ui' | 'operations' | 'dynamic_fields' | 'security' | 'policies'>('ui');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => { injectKeyframes(); }, []);

  const isAdmin = user && user.role === 'IT_Admin';

  if (!isAdmin) {
    return (
      <div style={{
        padding: '48px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        boxShadow: '0 8px 32px rgba(239, 68, 68, 0.08)',
        color: '#991b1b',
        fontFamily: "'Inter', sans-serif",
        maxWidth: '700px',
        margin: '60px auto',
        textAlign: 'center',
        boxSizing: 'border-box',
        direction: dir
      }}>
        <div style={{ fontSize: '50px', marginBottom: '16px' }}>🛑</div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 10px 0' }}>{t('access.denied.title')}</h2>
        <p style={{ fontSize: '14px', margin: 0, color: '#b91c1c' }}>
          {t('access.denied.msg')}
        </p>
      </div>
    );
  }

  const TAB_CONFIG = [
    {
      id: 'ui' as const, icon: '🎨', label: t('sidebar.ui_engine'), sublabel: t('sidebar.ui_engine.sub'),
      gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)', lightBg: 'rgba(99, 102, 241, 0.06)', accentColor: '#6366f1'
    },
    {
      id: 'operations' as const, icon: '🏢', label: t('sidebar.operations'), sublabel: t('sidebar.operations.sub'),
      gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', lightBg: 'rgba(14, 165, 233, 0.06)', accentColor: '#0ea5e9'
    },
    {
      id: 'dynamic_fields' as const, icon: '✨', label: t('sidebar.dynamic_fields'), sublabel: t('sidebar.dynamic_fields.sub'),
      gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', lightBg: 'rgba(245, 158, 11, 0.06)', accentColor: '#f59e0b'
    },
    {
      id: 'security' as const, icon: '🛡️', label: t('sidebar.security'), sublabel: t('sidebar.security.sub'),
      gradient: 'linear-gradient(135deg, #ef4444, #f43f5e)', lightBg: 'rgba(239, 68, 68, 0.06)', accentColor: '#ef4444'
    },
    {
      id: 'policies' as const, icon: '🔔', label: t('sidebar.policies'), sublabel: t('sidebar.policies.sub'),
      gradient: 'linear-gradient(135deg, #8b5cf6, #d946ef)', lightBg: 'rgba(139, 92, 246, 0.06)', accentColor: '#8b5cf6'
    }
  ];

  const handleTabSwitch = (tabId: typeof activeTab) => {
    if (tabId === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsTransitioning(false);
    }, 250);
  };

  const activeConfig = TAB_CONFIG.find(t => t.id === activeTab)!;

  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 80px)',
      background: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 25%, #f0f4ff 50%, #faf5ff 75%, #f8faff 100%)',
      backgroundSize: '400% 400%',
      animation: 'adminGradientShift 20s ease infinite',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
      direction: dir
    }}>
      <TechBackground />

      {/* Decorative Orbs */}
      <div style={{ position: 'absolute', top: '-120px', right: '-80px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-60px', width: '350px', height: '350px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '32px 24px',
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start'
      }}>
        {/* ── Sidebar ── */}
        <div style={{
          width: isSidebarOpen ? '280px' : '90px',
          flexShrink: 0,
          background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          borderRadius: '28px',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          borderRight: '1px solid rgba(255, 255, 255, 0.4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(255, 255, 255, 0.3)',
          padding: isSidebarOpen ? '24px' : '24px 16px',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          animation: dir === 'rtl' ? 'adminShellSlideLeft 0.6s ease-out' : 'adminShellSlideRight 0.6s ease-out',
          zIndex: 50
        }}>
          {/* Toggle Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            style={{
              position: 'absolute',
              top: '32px',
              [dir === 'rtl' ? 'left' : 'right']: isSidebarOpen ? '16px' : '50%',
              transform: isSidebarOpen ? 'none' : 'translateX(50%)',
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.8)',
              borderRadius: '50%',
              width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 100,
              color: '#6366f1',
              fontSize: '12px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = isSidebarOpen ? 'scale(1.1)' : 'translateX(50%) scale(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; e.currentTarget.style.transform = isSidebarOpen ? 'none' : 'translateX(50%)'; }}
            title={isSidebarOpen ? "Collapse" : "Expand"}
          >
            {isSidebarOpen ? (dir === 'rtl' ? '▶' : '◀') : (dir === 'rtl' ? '◀' : '▶')}
          </button>
          {/* Sidebar Header */}
          <div style={{ 
            marginBottom: '32px', 
            textAlign: dir === 'rtl' ? 'right' : 'left',
            opacity: isSidebarOpen ? 1 : 0,
            transform: isSidebarOpen ? 'translateX(0)' : (dir === 'rtl' ? 'translateX(20px)' : 'translateX(-20px)'),
            pointerEvents: isSidebarOpen ? 'auto' : 'none',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            whiteSpace: 'nowrap',
            paddingTop: '4px'
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))',
              padding: '6px 16px', borderRadius: '20px', marginBottom: '16px',
              fontSize: '12px', fontWeight: '600', color: '#6366f1'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'adminPulseGlow 2s infinite' }} />
              {t('admin.status')} • {user?.name || t('admin.role')}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', color: '#0f172a', lineHeight: '1.2' }}>
              {t('admin.console')}
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
              {t('admin.console.sub')}
            </p>
          </div>

          {/* Sidebar Navigation */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {TAB_CONFIG.map((tab) => {
              const isActive = activeTab === tab.id;
              const isHovered = hoveredTab === tab.id;

              return (
                <div
                  key={tab.id}
                  onClick={() => handleTabSwitch(tab.id)}
                  onMouseEnter={() => setHoveredTab(tab.id)}
                  onMouseLeave={() => setHoveredTab(null)}
                  style={{
                    position: 'relative',
                    padding: '16px',
                    borderRadius: '16px',
                    background: isActive ? '#ffffff' : isHovered ? 'rgba(255,255,255,0.5)' : 'transparent',
                    border: isActive ? `1px solid ${tab.accentColor}30` : '1px solid transparent',
                    boxShadow: isActive ? `0 4px 16px ${tab.accentColor}15` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    overflow: 'hidden'
                  }}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      [dir === 'rtl' ? 'right' : 'left']: 0,
                      top: '10%',
                      height: '80%',
                      width: '4px',
                      background: tab.gradient,
                      borderRadius: dir === 'rtl' ? '4px 0 0 4px' : '0 4px 4px 0'
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: isActive ? tab.gradient : tab.lightBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', color: isActive ? '#fff' : tab.accentColor,
                    boxShadow: isActive ? `0 4px 12px ${tab.accentColor}30` : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {tab.icon}
                  </div>

                  {/* Text Container */}
                  <div style={{ 
                    flex: 1, textAlign: dir === 'rtl' ? 'right' : 'left',
                    opacity: isSidebarOpen ? 1 : 0,
                    transform: isSidebarOpen ? 'translateX(0)' : (dir === 'rtl' ? 'translateX(15px)' : 'translateX(-15px)'),
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    whiteSpace: 'nowrap',
                    width: isSidebarOpen ? 'auto' : '0px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: isActive ? '#0f172a' : '#475569', marginBottom: '2px' }}>
                      {tab.label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {tab.sublabel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main Content Area ── */}
        <div style={{
          flex: 1,
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'adminShellFadeIn 0.8s ease-out',
          minHeight: 'calc(100vh - 140px)',
          overflow: 'hidden'
        }}>
          {/* Header Strip */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '20px 32px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
            background: 'linear-gradient(to right, rgba(255,255,255,0.8), rgba(255,255,255,0.4))'
          }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: activeConfig.gradient, marginRight: dir === 'rtl' ? '0' : '12px', marginLeft: dir === 'rtl' ? '12px' : '0' }} />
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{activeConfig.label}</h2>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{activeConfig.sublabel}</span>
            </div>
          </div>

          {/* Content Viewport */}
          <div style={{
            flex: 1, padding: '24px', overflowY: 'auto',
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(10px) scale(0.99)' : 'translateY(0) scale(1)',
            transition: 'all 0.25s ease-out',
            animation: !isTransitioning ? 'adminContentReveal 0.35s ease-out' : 'none'
          }}>
            {activeTab === 'ui' && <UILayoutEngineTab />}
            {activeTab === 'operations' && <OperationalStructureTab />}
            {activeTab === 'dynamic_fields' && <DynamicFieldsTab />}
            {activeTab === 'security' && <SecurityControlTab />}
            {activeTab === 'policies' && <NotificationPolicyConsole />}
          </div>
        </div>
      </div>
    </div>
  );
};
