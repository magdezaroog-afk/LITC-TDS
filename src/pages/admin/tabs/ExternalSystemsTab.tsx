import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../../engine/ui-loader/LanguageContext';

export interface ExternalSystem {
  id: string;
  systemName: string;
  manifestUrl: string;
  manifestData: string;
  isActive: boolean;
  createdAt: string;
}

export const ExternalSystemsTab: React.FC = () => {
  const { t, dir } = useLanguage();
  const [manifestUrl, setManifestUrl] = useState('');
  const [systems, setSystems] = useState<ExternalSystem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSystems = async () => {
    try {
      // Replace with actual API call once configured, fetching for now
      const res = await fetch('/admin/uecp/systems', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('litc_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSystems(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch systems', err);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manifestUrl.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/admin/uecp/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('litc_token')}`
        },
        body: JSON.stringify({ manifestUrl })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to register');
      }
      setManifestUrl('');
      fetchSystems();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: "-apple-system, 'SF Pro Display', 'Inter', sans-serif", color: '#1D1D1F', direction: dir }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8B5CF6, #C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}>🔌</div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, letterSpacing: '-0.5px' }}>الأنظمة الخارجية (UECP)</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6E6E73', marginTop: '2px' }}>محطة تسجيل وإدارة الواجهات والمكونات الخارجية</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Registration Form */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, marginBottom: '16px' }}>تسجيل نظام جديد</h3>
          <form onSubmit={handleRegister} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                type="url"
                placeholder="أدخل رابط المانيفيست (Manifest URL)"
                value={manifestUrl}
                onChange={(e) => setManifestUrl(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.12)', fontSize: '14px',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                required
              />
              {error && <div style={{ color: '#FF3B30', fontSize: '12px', marginTop: '8px', fontWeight: '600' }}>{error}</div>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                background: '#8B5CF6', color: '#FFF', border: 'none',
                padding: '12px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                transition: 'all 0.2s ease', opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? 'جاري التسجيل...' : '➕ ربط نظام خارجي'}
            </button>
          </form>
        </div>

        {/* Registry Table */}
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: 0, marginBottom: '16px' }}>الأنظمة المسجلة</h3>
          
          {systems.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6E6E73', background: '#F5F5F7', borderRadius: '12px', border: '1px dashed rgba(0,0,0,0.1)' }}>
              لا توجد أنظمة خارجية مسجلة حالياً.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {systems.map((sys) => (
                <div key={sys.id} style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === sys.id ? null : sys.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: sys.isActive ? '#34C759' : '#FF3B30', boxShadow: `0 0 8px ${sys.isActive ? '#34C75960' : '#FF3B3060'}` }}></div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#1D1D1F' }}>{sys.systemName}</div>
                        <div style={{ fontSize: '12px', color: '#6E6E73', marginTop: '2px' }}>{new Date(sys.createdAt).toLocaleDateString('ar-LY')}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#8B5CF6', background: '#F3E8FF', padding: '4px 10px', borderRadius: '8px' }}>
                        {expandedId === sys.id ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                      </span>
                    </div>
                  </div>
                  {expandedId === sys.id && (
                    <div style={{ padding: '16px', background: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600' }}>Manifest URL:</span>
                        <div style={{ fontSize: '13px', background: '#F5F5F7', padding: '8px 12px', borderRadius: '8px', marginTop: '4px', wordBreak: 'break-all' }}>{sys.manifestUrl}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '12px', color: '#6E6E73', fontWeight: '600' }}>Manifest Data:</span>
                        <pre style={{ fontSize: '12px', background: '#1E1E1E', color: '#D4D4D4', padding: '12px', borderRadius: '8px', marginTop: '4px', overflowX: 'auto', direction: 'ltr' }}>
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(sys.manifestData), null, 2);
                            } catch (e) {
                              return sys.manifestData;
                            }
                          })()}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
