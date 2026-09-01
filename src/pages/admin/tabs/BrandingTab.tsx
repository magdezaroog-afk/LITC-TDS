import React, { useState, useEffect, useRef } from 'react';


/* ─────────────────────────────────────────────────────────────
   BrandingTab — SaaS White-Label Identity Console
   Admin-only tab for full brand customization
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
  { value: 'Inter',          label: 'Inter (Modern)' },
  { value: 'IBM Plex Sans', label: 'IBM Plex Sans (Technical)' },
  { value: 'Cairo',          label: t('admin.branding.font_cairo', 'Cairo (عربي أصيل)') },
  { value: 'Tajawal',        label: t('admin.branding.font_tajawal', 'Tajawal (عربي عصري)') },
  { value: 'DM Sans',        label: 'DM Sans (Clean)' },
];

const PRESET_LIGHTS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const PRESET_DARKS  = ['#00a3ff', '#22d3ee', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];

const STYLES_ID = 'litc-branding-tab-styles';
const injectStyles = () => {
  if (document.getElementById(STYLES_ID)) return;
  const s = document.createElement('style');
  s.id = STYLES_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

// Dummy t function to prevent crash
const t = (key: any, fallback?: any) => fallback || key;
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
      background: rgba(255,255,255,0.9);
      font-size: 14px;
      font-family: 'Inter', sans-serif;
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
      font-family: 'Inter', sans-serif;
      transition: all 0.2s ease;
      display: flex; align-items: center; gap: 8px;
    }
    .branding-btn-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.35); }
    .branding-btn-save:active { transform: translateY(0); }
    .branding-preview-bar {
      height: 56px; border-radius: 12px;
      display: flex; align-items: center; gap: 12px;
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
      font-weight: 600;
    }
    .branding-font-option:hover { border-color: #a5b4fc; }
    .branding-logo-zone {
      border: 2px dashed rgba(99,102,241,0.3);
      border-radius: 14px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(99,102,241,0.03);
    }
    .branding-logo-zone:hover {
      border-color: #6366f1;
      background: rgba(99,102,241,0.07);
    }
    .branding-toast {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #111827; color: #fff;
      padding: 12px 24px; border-radius: 12px;
      font-size: 14px; font-weight: 500;
      box-shadow: 0 8px 32px rgba(0,0,0,0.25);
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
      background: 'var(--bg-surface)',
      borderRadius: '18px',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      border: '1px solid rgba(0,0,0,0.06)',
      animationDelay: `${delay}ms`,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1d1d1f' }}>{title}</h3>
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
    fontFamily: 'Inter',
  });

  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const logoInputRef = useRef<HTMLInputElement>(null);

  /* ── Load current config ── */
  useEffect(() => {
    fetch('/api/v1/branding', { credentials: 'include' })
      .then(r => r.json())
      .then((data: any) => {
        if (data) {
          const payload = data.branding || data.data || data;
          setConfig(prev => ({
            ...prev,
            ...payload,
            orgName: payload.orgName || prev.orgName || 'LITC System',
            lightPrimary: payload.lightPrimary || prev.lightPrimary || '#6366f1',
            darkPrimary: payload.darkPrimary || prev.darkPrimary || '#00a3ff',
            fontFamily: payload.fontFamily || prev.fontFamily || 'Inter'
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

  /* ── Save ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const csrfRes = await fetch('/api/v1/csrf-token', { credentials: 'include' });
      const { csrfToken } = await csrfRes.json();

      const res = await fetch('/api/v1/branding', {
        method: 'POST',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'CSRF-Token': csrfToken
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) throw new Error('Save failed');
      showToast(t('admin.branding.save_success', '✓ تم حفظ إعدادات الهوية بنجاح'));
    } catch {
      showToast(t('admin.branding.save_fail', '✕ فشل حفظ الإعدادات، يرجى المحاولة لاحقاً'));
    } finally {
      setSaving(false);
    }
  };

  /* ── Logo URL from input ── */
  const handleLogoUrl = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(c => ({ ...c, orgLogo: e.target.value || null }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setConfig(c => ({ ...c, orgLogo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>{t('ui.auto_53') || t('ui.auto_53', '⏳ جاري تحميل إعدادات الهوية...')}</div>
      </div>
    );
  }

  /* ── Live Preview Bar ── */
  const orgDisplayName = config?.orgName || 'LITC System';
  const lightColor = config?.lightPrimary || '#6366f1';
  const darkColor = config?.darkPrimary || '#00a3ff';

  const PreviewBar = () => (
    <div
      className="branding-preview-bar"
      style={{
        background: config?.headerBg ?? `linear-gradient(135deg, ${darkColor}22, ${lightColor}11)`,
        border: `1px solid ${lightColor}33`,
      }}
    >
      {config?.orgLogo ? (
        <img src={config.orgLogo} alt="Logo" style={{ height: '28px', borderRadius: '6px', objectFit: 'contain' }} />
      ) : (
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `linear-gradient(135deg, ${lightColor}, ${darkColor})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: '800', fontSize: '13px',
        }}>
          {orgDisplayName.charAt(0)}
        </div>
      )}
      <span style={{ fontSize: '14px', fontWeight: '700', color: '#1d1d1f', fontFamily: config?.fontFamily || 'Inter' }}>
        {orgDisplayName}
      </span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: lightColor }} title="Light" />
        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: darkColor }} title="Dark" />
      </div>
    </div>
  );

  return (
    <div style={{
      padding: '24px',
      maxWidth: '860px',
      margin: '0 auto',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    }}>

      {/* Header */}
      <div style={{ marginBottom: '4px' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: '800', color: '#1d1d1f' }}>{t('admin.branding.title') || '🎨 هوية المنظومة'}</h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{t('admin.branding.subtitle') || 'تحكم كامل في الهوية البصرية للمنظومة — الألوان، الشعار، الخط، والمظهر الذي يراه جميع المستخدمين.'}</p>
      </div>

      {/* Live Preview */}
      <Section title={t('admin.branding.preview_title') || 'معاينة مباشرة'} icon="👁️" delay={0}>
        <PreviewBar />
        <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>{t('admin.branding.preview_desc') || 'هذا ما سيظهر في شريط النظام لجميع المستخدمين'}</p>
      </Section>

      {/* Org Identity */}
      <Section title={t('admin.branding.org_identity_title') || 'هوية المؤسسة'} icon="🏢" delay={60}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>{t('admin.branding.org_name') || 'اسم المؤسسة'}</label>
            <input
              className="branding-input"
              value={config.orgName}
              onChange={e => setConfig(c => ({ ...c, orgName: e.target.value }))}
              placeholder={t('admin.branding.org_name_placeholder') || 'اسم المؤسسة أو المنظومة'}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>{t('admin.branding.logo_url') || 'رابط الشعار (URL)'}</label>
            <input
              className="branding-input"
              value={config.orgLogo ?? ''}
              onChange={handleLogoUrl}
              placeholder="https://example.com/logo.png"
              dir="ltr"
            />
            {config.orgLogo && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={config.orgLogo} alt="logo preview" style={{ height: '40px', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <button
                  onClick={() => setConfig(c => ({ ...c, orgLogo: null }))}
                  style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                >
                  {t('admin.branding.remove_logo') || '✕ إزالة'}</button>
              </div>
            )}
          </div>
        </div>
      </Section>

      {/* Colors */}
      <Section title={t('admin.branding.colors_title') || 'ألوان المظهر'} icon="🎨" delay={120}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Light Mode Color */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '10px' }}>{t('admin.branding.light_color') || '☀️ لون المظهر الفاتح (Light Mode)'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {PRESET_LIGHTS.map(c => (
                <button
                  key={c}
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
                title={t('admin.branding.custom_color') || 'لون مخصص'}
              />
              <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{config.lightPrimary}</span>
            </div>
          </div>

          {/* Dark Mode Color */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '10px' }}>{t('admin.branding.dark_color') || '🌙 لون المظهر الغامق (Dark Mode)'}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {PRESET_DARKS.map(c => (
                <button
                  key={c}
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
                title={t('admin.branding.custom_color') || 'لون مخصص'}
              />
              <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'monospace' }}>{config.darkPrimary}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Typography */}
      <Section title={t('admin.branding.font_title') || 'الخط الرسمي'} icon="✍️" delay={180}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {FONT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`branding-font-option${config.fontFamily === opt.value ? ' active' : ''}`}
              style={{ fontFamily: opt.value }}
              onClick={() => setConfig(c => ({ ...c, fontFamily: opt.value }))}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#9ca3af' }}>{t('admin.branding.font_preview') || 'معاينة:'} <span style={{ fontFamily: config.fontFamily, fontWeight: '600', color: '#374151', fontSize: '15px' }}>{t('admin.branding.font_preview_text') || 'نظام إدارة الطلبات والتذاكر — LITC TDS'}</span>
        </p>
      </Section>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '24px' }}>
        <button
          className="branding-btn-save"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: saving ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.75 : 1,
          }}
        >
          {saving ? t('admin.branding.saving_btn', '⏳ جاري الحفظ...') : t('admin.branding.save_btn', '💾 حفظ وتطبيق هوية المنظومة')}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && <div className="branding-toast">{toast}</div>}
    </div>
  );
};
