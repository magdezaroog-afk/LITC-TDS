import React, { useState, useEffect, useRef } from 'react';

// Dummy translation helper for graceful localization
const t = (key: any, fallback?: any) => fallback || key;

/* ─────────────────────────────────────────────────────────────
   BrandingTab — SaaS White-Label Identity Console
   لوحة الهوية البصرية وشعار الشركة
   ───────────────────────────────────────────────────────────── */

interface BrandingConfig {
  orgName: string;
  orgLogo: string | null;
  lightPrimary: string;
  darkPrimary: string;
  headerBg: string | null;
  fontFamily: string;
}

const FONT_OPTIONS = [
  { value: 'Inter',          label: 'Inter (عصري متوازن)' },
  { value: 'Cairo',          label: 'Cairo (عربي أصيل)' },
  { value: 'Tajawal',        label: 'Tajawal (عربي خفيف)' },
  { value: 'IBM Plex Sans', label: 'IBM Plex Sans (تقني)' },
  { value: 'DM Sans',        label: 'DM Sans (حديث)' },
];

const PRESET_LIGHTS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PRESET_DARKS  = ['#00a3ff', '#22d3ee', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];

const STYLES_ID = 'litc-branding-tab-styles';
const injectStyles = () => {
  if (document.getElementById(STYLES_ID)) return;
  const s = document.createElement('style');
  s.id = STYLES_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&family=Tajawal:wght@400;500;700;800&display=swap');

    @keyframes brandingReveal {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .branding-section {
      animation: brandingReveal 0.35s cubic-bezier(0.28, 0.11, 0.32, 1) both;
    }
    .branding-color-swatch {
      width: 32px; height: 32px; border-radius: 50%;
      cursor: pointer;
      border: 3px solid transparent;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      flex-shrink: 0;
    }
    .branding-color-swatch:hover { transform: scale(1.15); }
    .branding-color-swatch.active {
      border-color: #fff;
      box-shadow: 0 0 0 2px #6366f1;
    }
    .branding-input {
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1.5px solid rgba(0,0,0,0.1);
      background: rgba(255,255,255,0.95);
      font-size: 14px;
      font-family: inherit;
      color: #1d1d1f;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
    }
    .branding-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
    }
    .branding-btn-save {
      padding: 12px 32px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s ease;
      display: flex; align-items: center; gap: 8px;
    }
    .branding-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.35); }
    .branding-btn-save:active { transform: translateY(0); }
    .branding-preview-bar {
      height: 60px; border-radius: 14px;
      display: flex; align-items: center; gap: 14px;
      padding: 0 20px;
      transition: all 0.3s ease;
    }
    .branding-font-option {
      padding: 10px 16px;
      border-radius: 10px;
      border: 1.5px solid rgba(0,0,0,0.08);
      cursor: pointer;
      font-size: 13px;
      transition: all 0.2s;
      background: #fff;
    }
    .branding-font-option.active {
      border-color: #6366f1;
      background: rgba(99,102,241,0.07);
      color: #6366f1;
      font-weight: 700;
    }
    .branding-font-option:hover { border-color: #a5b4fc; }
    .branding-logo-dropzone {
      border: 2px dashed rgba(99,102,241,0.3);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(99,102,241,0.02);
    }
    .branding-logo-dropzone:hover {
      border-color: #6366f1;
      background: rgba(99,102,241,0.06);
    }
    .branding-toast {
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      background: #111827; color: #fff;
      padding: 14px 28px; border-radius: 14px;
      font-size: 14px; font-weight: 600;
      box-shadow: 0 10px 35px rgba(0,0,0,0.25);
      z-index: 99999;
      animation: brandingReveal 0.3s ease both;
    }
  `;
  document.head.appendChild(s);
};

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode; delay?: number }> = ({
  title, icon, children, delay = 0
}) => (
  <div
    className="branding-section"
    style={{
      background: '#FFFFFF',
      borderRadius: '18px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.06)',
      animationDelay: `${delay}ms`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1d1d1f' }}>{title}</h3>
    </div>
    {children}
  </div>
);

export const BrandingTab: React.FC = () => {
  injectStyles();

  const [config, setConfig] = useState<BrandingConfig>({
    orgName: 'LITC System',
    orgLogo: null,
    lightPrimary: '#6366f1',
    darkPrimary: '#00a3ff',
    headerBg: null,
    fontFamily: 'Cairo',
  });

  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Load current branding ── */
  useEffect(() => {
    fetch('/api/v1/branding', { credentials: 'include' })
      .then(r => r.json())
      .then((data: any) => {
        if (data) {
          const payload = data.branding || data.config || data;
          setConfig(prev => ({
            ...prev,
            ...payload,
            orgName: payload.orgName || prev.orgName || 'LITC System',
            lightPrimary: payload.lightPrimary || prev.lightPrimary || '#6366f1',
            darkPrimary: payload.darkPrimary || prev.darkPrimary || '#00a3ff',
            fontFamily: payload.fontFamily || prev.fontFamily || 'Cairo'
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Save branding ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/v1/branding', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Save failed');
      showToast('✓ تم حفظ وتطبيق هوية المنظومة وشعار الشركة بنجاح');
      window.dispatchEvent(new CustomEvent('litc_branding_updated', { detail: config }));
    } catch {
      showToast('✕ فشل حفظ الإعدادات، يرجى المحاولة لاحقاً');
    } finally {
      setSaving(false);
    }
  };

  /* ── File Upload Handler ── */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('⚠️ حجم الشعار يجب ألا يتجاوز 2 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setConfig(c => ({ ...c, orgLogo: base64 }));
      showToast('✓ تم تحميل الشعار بنجاح، اضغط حفظ لتطبيقه');
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>⏳ جاري تحميل إعدادات الهوية والشعار...</div>
      </div>
    );
  }

  /* ── Live Preview Bar ── */
  const orgDisplayName = config?.orgName || 'LITC System';
  const lightColor = config?.lightPrimary || '#6366f1';
  const darkColor = config?.darkPrimary || '#00a3ff';

  return (
    <div style={{
      padding: '24px',
      maxWidth: '880px',
      margin: '0 auto',
      fontFamily: config.fontFamily ? `${config.fontFamily}, sans-serif` : "'Cairo', 'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      direction: 'rtl'
    }}>

      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: '#1d1d1f' }}>
          🎨 هوية وشعار الشركة (Brand Identity)
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', lineHeight: '1.6' }}>
          تحكم في اسم وشعار وهوية المنظومة المعتمدة لدى شركتك. سيظهر الشعار المرفوع بجانب اسم النظام في الترويسة الرئيسية لجميع المستخدمين.
        </p>
      </div>

      {/* Live Preview */}
      <Section title="معاينة مباشرة لشريط النظام" icon="👁️" delay={0}>
        <div
          className="branding-preview-bar"
          style={{
            background: config?.headerBg ?? `linear-gradient(135deg, ${darkColor}15, ${lightColor}08)`,
            border: `1.5px solid ${lightColor}30`,
          }}
        >
          {config?.orgLogo ? (
            <img 
              src={config.orgLogo} 
              alt="شعار الشركة" 
              style={{ maxHeight: '40px', maxWidth: '140px', borderRadius: '6px', objectFit: 'contain' }} 
            />
          ) : (
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `linear-gradient(135deg, ${lightColor}, ${darkColor})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '800', fontSize: '15px',
            }}>
              {orgDisplayName.charAt(0)}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: '800', color: '#1d1d1f' }}>
              {orgDisplayName}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              نظام التشغيل وإدارة العمليات المؤسسية — LITC v43
            </span>
          </div>

          <div style={{ marginRight: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>ألوان المظهر:</span>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: lightColor }} title="الفاتح" />
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: darkColor }} title="الداكن" />
          </div>
        </div>
      </Section>

      {/* Org Identity & Logo Upload */}
      <Section title="شعار واسم الشركة" icon="🏢" delay={60}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Org Name */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '8px' }}>
              اسم الشركة أو المؤسسة:
            </label>
            <input
              className="branding-input"
              value={config.orgName}
              onChange={e => setConfig(c => ({ ...c, orgName: e.target.value }))}
              placeholder="مثال: شركة التقنية الحديثة — Modern Tech Co."
            />
          </div>

          {/* Logo Upload Box */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '8px' }}>
              شعار الشركة (Upload Logo):
            </label>

            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/png, image/jpeg, image/svg+xml, image/webp" 
              onChange={handleFileUpload} 
            />

            <div 
              className="branding-logo-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              {config.orgLogo ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  <img 
                    src={config.orgLogo} 
                    alt="الشعار الحالي" 
                    style={{ maxHeight: '60px', maxWidth: '160px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', padding: '4px' }} 
                  />
                  <div>
                    <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#16a34a' }}>
                      ✓ تم تحديد الشعار
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      اضغط لتغيير الصورة أو استبدالها (يدعم PNG, JPG, SVG, WebP حتى 2 ميجابايت)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfig(c => ({ ...c, orgLogo: null }));
                    }}
                    style={{
                      marginRight: 'auto',
                      padding: '6px 14px',
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    ✕ حذف الشعار
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>📁</div>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#4f46e5', display: 'block' }}>
                    اضغط هنا لاختيار وتحميل شعار الشركة من جهازك
                  </span>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    يُفضل استخدام صورة شفافة بخلفية مفرغة (PNG أو SVG)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Colors */}
      <Section title="الألوان الرئيسية للواجهات" icon="🎨" delay={120}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Light Color */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '10px' }}>
              اللون الرئيسي للوضع الفاتح (Light Accent):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {PRESET_LIGHTS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`branding-color-swatch${config.lightPrimary === c ? ' active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setConfig(cfg => ({ ...cfg, lightPrimary: c }))}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={config.lightPrimary}
                onChange={e => setConfig(c => ({ ...c, lightPrimary: e.target.value }))}
                style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: 0, background: 'none' }}
                title="لون مخصص"
              />
              <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{config.lightPrimary}</span>
            </div>
          </div>

          {/* Dark Color */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151', display: 'block', marginBottom: '10px' }}>
              اللون الرئيسي للوضع الداكن (Dark Accent):
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {PRESET_DARKS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`branding-color-swatch${config.darkPrimary === c ? ' active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setConfig(cfg => ({ ...cfg, darkPrimary: c }))}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={config.darkPrimary}
                onChange={e => setConfig(c => ({ ...c, darkPrimary: e.target.value }))}
                style={{ width: '36px', height: '36px', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: 0, background: 'none' }}
                title="لون مخصص"
              />
              <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{config.darkPrimary}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section title="الخط الرسمي المعتمد" icon="✍️" delay={180}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {FONT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`branding-font-option${config.fontFamily === opt.value ? ' active' : ''}`}
              style={{ fontFamily: `${opt.value}, sans-serif` }}
              onClick={() => setConfig(c => ({ ...c, fontFamily: opt.value }))}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', paddingBottom: '30px' }}>
        <button
          type="button"
          className="branding-btn-save"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? '#9ca3af' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.75 : 1,
            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.35)'
          }}
        >
          {saving ? '⏳ جاري الحفظ...' : '💾 حفظ وتطبيق هوية وشعار الشركة'}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && <div className="branding-toast">{toast}</div>}
    </div>
  );
};
