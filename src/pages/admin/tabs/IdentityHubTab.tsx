import React, { useState, useEffect } from 'react';
import { AdminAPI } from '../../../services/admin.api';
import { 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  UserCheck, 
  Edit3, 
  Search, 
  Lock, 
  Globe, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Users,
  Building,
  UserX,
  Server
} from 'lucide-react';

interface DirectoryUser {
  id: number;
  fullName?: string;
  name?: string;
  email?: string;
  phone?: string;
  jobTitle?: string;
  ssoProvider?: string;
  syncStatus?: 'synced' | 'overridden' | string;
  entraObjectId?: string;
  isActive?: boolean;
  isFrozen?: boolean;
  department?: { id: number; name: string } | null;
  departmentId?: number | null;
  role?: { id: number; name: string } | null;
  lastSyncedAt?: string;
}

interface EntraConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  autoSyncEnabled: boolean;
  syncIntervalMinutes: number;
}

export const IdentityHubTab: React.FC = () => {
  // ── States ──
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSyncStatus, setFilterSyncStatus] = useState<'all' | 'synced' | 'overridden'>('all');

  // Config States
  const [config, setConfig] = useState<EntraConfig>({
    tenantId: '',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    autoSyncEnabled: false,
    syncIntervalMinutes: 60,
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [configStatusMsg, setConfigStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Test Connection States
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; tenantId?: string } | null>(null);

  // Sync Process States
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState<{
    total: number;
    created: number;
    updated: number;
    deactivated: number;
    durationMs?: number;
  } | null>(null);

  // Edit / Patch Modal State
  const [editingUser, setEditingUser] = useState<DirectoryUser | null>(null);
  const [patchName, setPatchName] = useState('');
  const [patchEmail, setPatchEmail] = useState('');
  const [patchPhone, setPatchPhone] = useState('');
  const [patchJobTitle, setPatchJobTitle] = useState('');
  const [patchIsActive, setPatchIsActive] = useState(true);
  const [savingPatch, setSavingPatch] = useState(false);

  // ── Initial Data Load ──
  useEffect(() => {
    fetchUsers();
    fetchConfig();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await AdminAPI.getUserPool();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Failed to load user pool:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await AdminAPI.getIdentityConfig();
      if (res?.success && res?.data) {
        setConfig({
          tenantId: res.data.tenantId || '',
          clientId: res.data.clientId || '',
          clientSecret: res.data.clientSecret || '',
          redirectUri: res.data.redirectUri || '',
          autoSyncEnabled: !!res.data.autoSyncEnabled,
          syncIntervalMinutes: res.data.syncIntervalMinutes || 60,
        });
      }
    } catch (err: any) {
      console.error('Failed to load identity config:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  // ── Actions ──
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigStatusMsg(null);
    try {
      const res = await AdminAPI.saveIdentityConfig(config);
      if (res.success) {
        setConfigStatusMsg({ text: 'تم حفظ إعدادات Microsoft Entra ID بنجاح في قاعدة البيانات', type: 'success' });
        if (res.data) {
          setConfig(prev => ({
            ...prev,
            ...res.data,
          }));
        }
      } else {
        setConfigStatusMsg({ text: res.message || 'فشل حفظ الإعدادات', type: 'error' });
      }
    } catch (err: any) {
      setConfigStatusMsg({ text: err.message || 'حدث خطأ أثناء حفظ الإعدادات', type: 'error' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await AdminAPI.testIdentityConnection({
        tenantId: config.tenantId,
        clientId: config.clientId,
        clientSecret: config.clientSecret.includes('•') ? undefined : config.clientSecret,
      });
      setTestResult({
        ok: res.ok,
        message: res.message,
        tenantId: res.tenantId,
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'فشل الاتصال بخدمة Microsoft Identity',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTriggerSync = async () => {
    if (!confirm('هل أنت متأكد من بدء مزامنة دليل المستخدمين مع Microsoft Graph API الآن؟')) {
      return;
    }
    setSyncing(true);
    setSyncStats(null);
    try {
      const res = await AdminAPI.syncEntraUsers();
      if (res.success && res.stats) {
        setSyncStats(res.stats);
        await fetchUsers();
      } else {
        alert(res.message || 'فشلت المزامنة مع مايكروسوفت');
      }
    } catch (err: any) {
      alert(`خطأ أثناء المزامنة: ${err.message || 'تعذر استدعاء Microsoft Graph API'}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenEdit = (user: DirectoryUser) => {
    setEditingUser(user);
    setPatchName(user.fullName || user.name || '');
    setPatchEmail(user.email || '');
    setPatchPhone(user.phone || '');
    setPatchJobTitle(user.jobTitle || '');
    setPatchIsActive(user.isActive !== false && !user.isFrozen);
  };

  const handleSavePatch = async () => {
    if (!editingUser) return;
    setSavingPatch(true);
    try {
      const res = await AdminAPI.patchIdentityUser(editingUser.id, {
        name: patchName,
        email: patchEmail,
        phone: patchPhone,
        jobTitle: patchJobTitle,
        isActive: patchIsActive,
      });
      if (res.success) {
        // Update local list
        setUsers(prev => prev.map(u => {
          if (u.id === editingUser.id) {
            return {
              ...u,
              fullName: patchName,
              name: patchName,
              email: patchEmail,
              phone: patchPhone,
              jobTitle: patchJobTitle,
              isActive: patchIsActive,
              syncStatus: 'overridden',
            };
          }
          return u;
        }));
        setEditingUser(null);
      } else {
        alert(res.message || 'فشل تحديث بيانات المستخدم');
      }
    } catch (err: any) {
      alert(`خطأ أثناء التحديث: ${err.message}`);
    } finally {
      setSavingPatch(false);
    }
  };

  // ── Filtered Users ──
  const filteredUsers = users.filter(user => {
    const term = searchQuery.toLowerCase().trim();
    const nameMatch = (user.fullName || user.name || '').toLowerCase().includes(term);
    const emailMatch = (user.email || '').toLowerCase().includes(term);
    const phoneMatch = (user.phone || '').toLowerCase().includes(term);
    const titleMatch = (user.jobTitle || '').toLowerCase().includes(term);
    const idMatch = String(user.id).includes(term);

    const matchesSearch = !term || nameMatch || emailMatch || phoneMatch || titleMatch || idMatch;

    if (!matchesSearch) return false;

    if (filterSyncStatus === 'synced') return user.syncStatus === 'synced';
    if (filterSyncStatus === 'overridden') return user.syncStatus === 'overridden';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1440px', margin: '0 auto' }}>
      
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        background: '#ffffff',
        padding: '24px 28px',
        borderRadius: '20px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)'
          }}>
            <Key size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                إدارة الهوية والربط المؤسسي (Identity Hub & Entra ID)
              </h1>
              <span style={{
                background: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 700
              }}>
                Enterprise OIDC / SSO
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              إعداد ومزامنة حسابات الموظفين المركزية عبر Microsoft Graph API والتوافق التام مع الهيكل التنظيمي المحلي
            </p>
          </div>
        </div>

        {/* Global Sync Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 22px',
              borderRadius: '14px',
              background: syncing ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: syncing ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <RefreshCw size={17} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'جاري مزامنة الدليل...' : 'مزامنة دليل الموظفين الآن (Graph Sync)'}</span>
          </button>
        </div>
      </div>

      {/* ── Stats Banner if Sync Just Ran ── */}
      {syncStats && (
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          border: '1px solid #86efac',
          borderRadius: '16px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={24} color="#16a34a" />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#14532d' }}>
                اكتملت مزامنة دليل Microsoft Entra ID بنجاح!
              </div>
              <div style={{ fontSize: '12.5px', color: '#166534', marginTop: '2px' }}>
                تم استدعاء Microsoft Graph ومعالجة جميع الحسابات في {syncStats.durationMs ? `${(syncStats.durationMs / 1000).toFixed(1)} ثانية` : 'وقت قياسي'}.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{syncStats.total}</div>
              <div style={{ fontSize: '11px', color: '#166534' }}>إجمالي المعالجة</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>+{syncStats.created}</div>
              <div style={{ fontSize: '11px', color: '#166534' }}>موظف جديد</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 12px', borderLeft: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>{syncStats.updated}</div>
              <div style={{ fontSize: '11px', color: '#166534' }}>سجل محدث</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }}>{syncStats.deactivated}</div>
              <div style={{ fontSize: '11px', color: '#166534' }}>حساب معطل/مجمد</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Two-Column Section: Config & Integration Details ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        
        {/* Entra ID Configuration Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>💠</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    إعدادات الاتصال بـ Microsoft Entra ID
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>App Registration & Client Credentials</span>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px',
                background: '#f1f5f9',
                color: '#475569',
                fontWeight: 600
              }}>
                SystemSetting
              </span>
            </div>

            {configStatusMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '12.5px',
                fontWeight: 600,
                background: configStatusMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: configStatusMsg.type === 'success' ? '#065f46' : '#991b1b',
                border: `1px solid ${configStatusMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              }}>
                {configStatusMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  معرّف المؤسسة (Tenant ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 8aef4352-..."
                  value={config.tenantId}
                  onChange={e => setConfig({ ...config, tenantId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    background: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  معرّف التطبيق (Client ID)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1b2c4d6e-..."
                  value={config.clientId}
                  onChange={e => setConfig({ ...config, clientId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    background: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                  required
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                    سر العميل (Client Secret)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{showSecret ? 'إخفاء' : 'إظهار'}</span>
                  </button>
                </div>
                <input
                  type={showSecret ? 'text' : 'password'}
                  placeholder={config.clientSecret ? '••••••••' : 'أدخل Client Secret الجديد'}
                  value={config.clientSecret}
                  onChange={e => setConfig({ ...config, clientSecret: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    background: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  عنوان إعادة التوجيه الرسمي (OAuth2 Redirect URI)
                </label>
                <input
                  type="text"
                  value={config.redirectUri || `${window.location.origin}/api/v1/auth/microsoft/callback`}
                  onChange={e => setConfig({ ...config, redirectUri: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    background: '#f1f5f9',
                    color: '#475569',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="submit"
                  disabled={savingConfig}
                  style={{
                    flex: 1,
                    padding: '11px 18px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: savingConfig ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {savingConfig ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  style={{
                    padding: '11px 18px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: testingConnection ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Server size={15} />
                  <span>{testingConnection ? 'فحص...' : 'فحص الاتصال (Test)'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Test Result Box */}
          {testResult && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: testResult.ok ? '#ecfdf5' : '#fef2f2',
              border: `1px solid ${testResult.ok ? '#86efac' : '#fca5a5'}`,
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '12px'
            }}>
              {testResult.ok ? <CheckCircle2 size={18} color="#16a34a" /> : <AlertTriangle size={18} color="#dc2626" />}
              <div>
                <div style={{ fontWeight: 700, color: testResult.ok ? '#14532d' : '#7f1d1d' }}>
                  {testResult.ok ? 'الاتصال سليم مع Microsoft Entra ID!' : 'فشل الاتصال بـ Microsoft!'}
                </div>
                <div style={{ color: testResult.ok ? '#166534' : '#991b1b', marginTop: '2px' }}>
                  {testResult.message}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Integration Architecture & Rules Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span style={{ fontSize: '24px' }}>🛡️</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  حوكمة المزامنة وضمان النزاهة المؤسسية
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Reconciliation Architecture & Safeguards</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '12px'
              }}>
                <div style={{ color: '#0284c7', fontSize: '18px' }}>❶</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>عزل الأدوار والصلاحيات (Role Isolation)</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: '1.5' }}>
                    المزامنة لا تعدل إطلاقاً حقل الدور <code style={{ color: '#0284c7' }}>roleId</code> للموظفين المرقّين (فني دعم، مدير قسم، وكيل). تبقى الصلاحيات خاضعة حصراً لحوكمة النظام الداخلي.
                  </div>
                </div>
              </div>

              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '12px'
              }}>
                <div style={{ color: '#f59e0b', fontSize: '18px' }}>❷</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>حماية التعديلات المحلية (Overridden Guard)</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: '1.5' }}>
                    الموظف الذي يتم تعيينه يدوياً أو تصحيح بياناته يحمل علامة <span style={{ background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>overridden</span>، مما يمنع مايكروسوفت من الكتابة فوق إدارته أو رقمه.
                  </div>
                </div>
              </div>

              <div style={{
                padding: '14px',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                gap: '12px'
              }}>
                <div style={{ color: '#ef4444', fontSize: '18px' }}>❸</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>الطرد والتجميد الفوري (Zero-Trust Revocation)</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: '1.5' }}>
                    إذا عُطّل حساب الموظف في Entra ID، يُجمد حسابه محلياً وتُلغى جلسات Redis الحية الخاصة به فورياً لمنع الدخول غير المصرح به.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            marginTop: '18px',
            padding: '12px 16px',
            background: '#e0f2fe',
            borderRadius: '12px',
            color: '#0369a1',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>رابط الدخول المباشر للموظفين عبر Microsoft SSO:</span>
            <a
              href="/api/v1/auth/microsoft"
              target="_blank"
              rel="noreferrer"
              style={{ color: '#0284c7', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
            >
              <span>اختبار المسار</span>
              <ExternalLink size={13} />
            </a>
          </div>
        </div>

      </div>

      {/* ── User Directory & Reconciliation Table ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        padding: '24px 28px',
      }}>
        {/* Table Filters & Search */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #f1f5f9'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              دليل المستخدمين وسجل مطابقة الهوية (Reconciliation Directory)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              إجمالي {users.length} مستخدم في قاعدة البيانات الحقيقية
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Filter buttons */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: '10px'
            }}>
              <button
                onClick={() => setFilterSyncStatus('all')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterSyncStatus === 'all' ? '#ffffff' : 'transparent',
                  color: filterSyncStatus === 'all' ? '#0f172a' : '#64748b',
                  boxShadow: filterSyncStatus === 'all' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                الكل ({users.length})
              </button>
              <button
                onClick={() => setFilterSyncStatus('synced')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterSyncStatus === 'synced' ? '#ffffff' : 'transparent',
                  color: filterSyncStatus === 'synced' ? '#16a34a' : '#64748b',
                  boxShadow: filterSyncStatus === 'synced' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                متزامن ({users.filter(u => u.syncStatus === 'synced').length})
              </button>
              <button
                onClick={() => setFilterSyncStatus('overridden')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: filterSyncStatus === 'overridden' ? '#ffffff' : 'transparent',
                  color: filterSyncStatus === 'overridden' ? '#b45309' : '#64748b',
                  boxShadow: filterSyncStatus === 'overridden' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
                }}
              >
                معدل محلياً ({users.filter(u => u.syncStatus === 'overridden').length})
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '240px' }}>
              <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="بحث بالاسم، البريد، الرقم..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 36px 8px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={fetchUsers}
              disabled={loadingUsers}
              title="تحديث القائمة"
              style={{
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} className={loadingUsers ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', fontSize: '12px', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 14px' }}>#</th>
                <th style={{ padding: '12px 14px' }}>الموظف</th>
                <th style={{ padding: '12px 14px' }}>البريد المؤسسي</th>
                <th style={{ padding: '12px 14px' }}>الهاتف / الوظيفة</th>
                <th style={{ padding: '12px 14px' }}>الإدارة / الدور</th>
                <th style={{ padding: '12px 14px' }}>المصدر (Provider)</th>
                <th style={{ padding: '12px 14px' }}>حالة المزامنة</th>
                <th style={{ padding: '12px 14px', textAlign: 'center' }}>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    {loadingUsers ? 'جاري تحميل سجلات الموظفين...' : 'لا توجد سجلات مطابقة للبحث'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isOverridden = user.syncStatus === 'overridden';
                  const isInactive = user.isActive === false || user.isFrozen;
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                        background: isInactive ? 'rgba(239, 68, 68, 0.04)' : undefined
                      }}
                    >
                      <td style={{ padding: '14px', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        #{user.id}
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                          {user.fullName || user.name || 'بدون اسم'}
                        </div>
                        {user.entraObjectId && (
                          <div style={{ fontSize: '10.5px', color: '#94a3b8', fontFamily: 'monospace' }} title={`Entra ID: ${user.entraObjectId}`}>
                            OID: {user.entraObjectId.substring(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px', fontSize: '12.5px', color: user.email ? '#334155' : '#dc2626' }}>
                        {user.email || <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>غير متوفر</span>}
                      </td>
                      <td style={{ padding: '14px', fontSize: '12px', color: '#64748b' }}>
                        <div>{user.jobTitle || 'موظف'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user.phone || '—'}</div>
                      </td>
                      <td style={{ padding: '14px', fontSize: '12px' }}>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{user.department?.name || 'حوض الانتظار (Pool)'}</div>
                        <span style={{ fontSize: '11px', color: '#0284c7', background: '#e0f2fe', padding: '1px 6px', borderRadius: '4px' }}>
                          {user.role?.name || 'END_USER'}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: user.ssoProvider === 'Microsoft_SSO' || user.entraObjectId ? '#eff6ff' : '#f1f5f9',
                          color: user.ssoProvider === 'Microsoft_SSO' || user.entraObjectId ? '#2563eb' : '#475569'
                        }}>
                          {user.ssoProvider || (user.entraObjectId ? 'Microsoft Entra' : 'Local DB')}
                        </span>
                      </td>
                      <td style={{ padding: '14px' }}>
                        {isOverridden ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: '#fef3c7',
                            color: '#b45309'
                          }}>
                            <span>معدل محلياً</span>
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: '#ecfdf5',
                            color: '#059669'
                          }}>
                            <span>متزامن</span>
                          </span>
                        )}
                        {isInactive && (
                          <span style={{
                            marginRight: '6px',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontWeight: 700
                          }}>
                            مجمد
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleOpenEdit(user)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <Edit3 size={13} />
                          <span>تصحيح وتعديل</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Edit / Patch Overlay Modal ── */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '480px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(0,0,0,0.1)',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  تصحيح وتعديل بيانات الموظف
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  الموظف: #{editingUser.id} — {editingUser.fullName || editingUser.name}
                </span>
              </div>
              <span style={{
                background: '#fef3c7',
                color: '#b45309',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700
              }}>
                سيتحول إلى Overridden
              </span>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={patchName}
                  onChange={e => setPatchName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={patchEmail}
                  onChange={e => setPatchEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  رقم الهاتف المباشر
                </label>
                <input
                  type="text"
                  value={patchPhone}
                  onChange={e => setPatchPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  المسمى الوظيفي
                </label>
                <input
                  type="text"
                  value={patchJobTitle}
                  onChange={e => setPatchJobTitle(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0' }}>
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={patchIsActive}
                  onChange={e => setPatchIsActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                />
                <label htmlFor="isActiveCheck" style={{ fontSize: '13px', fontWeight: 700, color: '#334155', cursor: 'pointer' }}>
                  الحساب نشط (Active) وغير مجمد
                </label>
              </div>

              <div style={{
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                borderRadius: '10px',
                padding: '10px 12px',
                fontSize: '11.5px',
                color: '#92400e'
              }}>
                تنبيه: حفظ هذا التعديل يمنح السجل أولوية محلية ويعلم حالته كـ Overridden لمنع استبدال بياناته في المزامنة القادمة مع مايكروسوفت.
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSavePatch}
                disabled={savingPatch}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  background: '#10b981',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: savingPatch ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                }}
              >
                {savingPatch ? 'جاري الحفظ...' : 'حفظ التعديلات وتثبيتها'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
