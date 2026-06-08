import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { UILayoutEngineTab } from './tabs/UILayoutEngineTab';
import { OperationalStructureTab } from './tabs/OperationalStructureTab';
import { DynamicFieldsTab } from './tabs/DynamicFieldsTab';

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

      // Draw connections
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

      // Draw particles
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
const KEYFRAMES_ID = 'admin-shell-keyframes-2026';
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
    @keyframes adminShellSlideUp {
      from { opacity: 0; transform: translateY(30px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
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
    @keyframes adminFloat {
      0%, 100% { transform: translateY(0px); }
      50%      { transform: translateY(-4px); }
    }
    @keyframes adminShimmer {
      0%   { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes adminContentReveal {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
};

/* ─────────────────────────────────────────────
   Tab Definitions
   ───────────────────────────────────────────── */
const TAB_CONFIG = [
  {
    id: 'ui' as const,
    icon: '🎨',
    label: 'هندسة وتخصيص الواجهات',
    sublabel: 'UI Layout Engine',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    lightBg: 'rgba(99, 102, 241, 0.06)',
    accentColor: '#6366f1',
    description: 'تصميم وبناء واجهات النظام بأداة السحب والإفلات المتقدمة'
  },
  {
    id: 'operations' as const,
    icon: '🏢',
    label: 'إدارة الهيكل التشغيلي',
    sublabel: 'Operations Center',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    lightBg: 'rgba(14, 165, 233, 0.06)',
    accentColor: '#0ea5e9',
    description: 'إدارة الإدارات والأقسام والفرق وتنسيب الكوادر'
  },
  {
    id: 'dynamic_fields' as const,
    icon: '✨',
    label: 'الحقول الديناميكية',
    sublabel: 'Dynamic Fields',
    gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
    lightBg: 'rgba(245, 158, 11, 0.06)',
    accentColor: '#f59e0b',
    description: 'إنشاء وإدارة الحقول المخصصة والنماذج التفاعلية'
  }
];

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
export const AdminDashboardShell: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'ui' | 'operations' | 'dynamic_fields'>('ui');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  useEffect(() => { injectKeyframes(); }, []);

  const isAdmin = user && user.role === 'IT_Admin';

  const handleTabSwitch = (tabId: 'ui' | 'operations' | 'dynamic_fields') => {
    if (tabId === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsTransitioning(false);
    }, 200);
  };

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
        boxSizing: 'border-box'
      }}>
        <div style={{ fontSize: '50px', marginBottom: '16px' }}>🛑</div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 10px 0' }}>حظر أمني - واجهة مغلقة</h2>
        <p style={{ fontSize: '14px', margin: 0, color: '#b91c1c' }}>
          هذه الشاشة مخصصة حصرياً للمسؤول الأعلى للتطبيق (IT_Admin). حسابك الحالي لا يمتلك الصلاحيات الكافية.
        </p>
      </div>
    );
  }

  const activeConfig = TAB_CONFIG.find(t => t.id === activeTab)!;

  return (
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 80px)',
      background: 'linear-gradient(160deg, #f8faff 0%, #eef2ff 25%, #f0f4ff 50%, #faf5ff 75%, #f8faff 100%)',
      backgroundSize: '400% 400%',
      animation: 'adminGradientShift 20s ease infinite',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden'
    }}>
      {/* Tech Background Canvas */}
      <TechBackground />

      {/* Decorative Gradient Orbs */}
      <div style={{
        position: 'absolute', top: '-120px', right: '-80px',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '-100px', left: '-60px',
        width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(14, 165, 233, 0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '50%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.04) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        transform: 'translate(-50%, -50%)'
      }} />

      {/* Main Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '32px 24px'
      }}>

        {/* ── Header Section ── */}
        <div style={{
          marginBottom: '36px',
          animation: 'adminShellFadeIn 0.6s ease-out',
          textAlign: 'right'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08))',
            padding: '6px 16px',
            borderRadius: '20px',
            marginBottom: '12px',
            fontSize: '12px',
            fontWeight: '600',
            color: '#6366f1',
            letterSpacing: '0.5px'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'adminPulseGlow 2s infinite' }} />
            نشط • {user?.name || 'مسؤول النظام'}
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: '800',
            margin: '0 0 8px 0',
            color: '#0f172a',
            letterSpacing: '-0.5px',
            lineHeight: '1.2'
          }}>
            قمرة القيادة المركزية
          </h1>
          <p style={{
            fontSize: '15px',
            color: '#64748b',
            margin: 0,
            fontWeight: '400',
            lineHeight: '1.6'
          }}>
            مركز التحكم الشامل لإدارة وتخصيص جميع مكونات النظام
          </p>
        </div>

        {/* ── Navigation Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '28px',
          animation: 'adminShellSlideUp 0.7s ease-out 0.15s both'
        }}>
          {TAB_CONFIG.map((tab, idx) => {
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
                  padding: '20px',
                  borderRadius: '20px',
                  background: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: isActive
                    ? `2px solid ${tab.accentColor}30`
                    : '1px solid rgba(255, 255, 255, 0.8)',
                  boxShadow: isActive
                    ? `0 8px 32px ${tab.accentColor}15, 0 2px 8px rgba(0,0,0,0.04)`
                    : isHovered
                    ? '0 8px 24px rgba(0, 0, 0, 0.06)'
                    : '0 2px 8px rgba(0, 0, 0, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered && !isActive ? 'translateY(-4px)' : 'translateY(0)',
                  overflow: 'hidden',
                  textAlign: 'right'
                }}
              >
                {/* Active indicator bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: isActive ? '100%' : '0%',
                  height: '3px',
                  background: tab.gradient,
                  borderRadius: '0 0 4px 4px',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />

                {/* Icon */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: isActive ? tab.gradient : tab.lightBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  marginBottom: '14px',
                  transition: 'all 0.35s ease',
                  animation: isActive ? 'adminFloat 3s ease-in-out infinite' : 'none',
                  boxShadow: isActive ? `0 4px 12px ${tab.accentColor}25` : 'none'
                }}>
                  {tab.icon}
                </div>

                {/* Label */}
                <div style={{
                  fontSize: '15px',
                  fontWeight: '700',
                  color: isActive ? '#0f172a' : '#334155',
                  marginBottom: '4px',
                  transition: 'color 0.3s ease'
                }}>
                  {tab.label}
                </div>

                {/* Sublabel */}
                <div style={{
                  fontSize: '11px',
                  fontWeight: '500',
                  color: isActive ? tab.accentColor : '#94a3b8',
                  letterSpacing: '0.3px',
                  marginBottom: '8px',
                  transition: 'color 0.3s ease'
                }}>
                  {tab.sublabel}
                </div>

                {/* Description */}
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  lineHeight: '1.5',
                  fontWeight: '400'
                }}>
                  {tab.description}
                </div>

                {/* Active checkmark */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '16px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: tab.gradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    color: '#fff',
                    boxShadow: `0 2px 8px ${tab.accentColor}30`,
                    animation: 'adminShellFadeIn 0.3s ease-out'
                  }}>
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Active Tab Content Area ── */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(24px)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0, 0, 0, 0.02)',
          padding: '4px',
          animation: 'adminShellSlideUp 0.8s ease-out 0.3s both',
          minHeight: '500px'
        }}>
          {/* Content header strip */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
            borderRadius: '20px 20px 0 0',
            background: 'rgba(255, 255, 255, 0.5)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: activeConfig.gradient,
                boxShadow: `0 0 8px ${activeConfig.accentColor}40`
              }} />
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155'
              }}>
                {activeConfig.label}
              </span>
              <span style={{
                fontSize: '11px',
                color: '#94a3b8',
                fontWeight: '500',
                padding: '2px 10px',
                background: activeConfig.lightBg,
                borderRadius: '12px'
              }}>
                {activeConfig.sublabel}
              </span>
            </div>

            {/* Breadcrumb dots */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {TAB_CONFIG.map(t => (
                <div
                  key={t.id}
                  onClick={() => handleTabSwitch(t.id)}
                  style={{
                    width: activeTab === t.id ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    background: activeTab === t.id ? t.gradient : 'rgba(0, 0, 0, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Tab Content with transition */}
          <div style={{
            opacity: isTransitioning ? 0 : 1,
            transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
            animation: !isTransitioning ? 'adminContentReveal 0.35s ease-out' : 'none',
            padding: '8px'
          }}>
            {activeTab === 'ui' && <UILayoutEngineTab />}
            {activeTab === 'operations' && <OperationalStructureTab />}
            {activeTab === 'dynamic_fields' && <DynamicFieldsTab />}
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{
          textAlign: 'center',
          padding: '24px 0 8px',
          animation: 'adminShellFadeIn 1s ease-out 0.5s both'
        }}>
          <span style={{
            fontSize: '11px',
            color: '#cbd5e1',
            fontWeight: '500',
            letterSpacing: '0.5px'
          }}>
            LITC-TDS v43.5 • Command Center • 2026
          </span>
        </div>
      </div>
    </div>
  );
};
