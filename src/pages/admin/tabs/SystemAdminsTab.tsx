import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Key, 
  Lock, 
  UserX, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Users, 
  Eye, 
  SlidersHorizontal 
} from 'lucide-react';
import { AdminAPI } from '../../../services/admin.api';

const TOKENS = {
  navy: '#135d79',
  navyDark: '#0c3c4e',
  orange: '#f36c21',
  emerald: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  cardBg: '#ffffff',
  border: 'rgba(19, 93, 121, 0.12)',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  radius: '16px',
  shadow: '0 4px 20px -2px rgba(19, 93, 121, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)'
};

export const SystemAdminsTab: React.FC = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const data = await AdminAPI.getUserPool();
      const adminUsers = (data.users || []).filter((u: any) => 
        u.role?.name?.toLowerCase().includes('admin') || 
        u.role?.name === 'System_Admin' || 
        u.role?.name === 'SYSTEM_ADMIN' || 
        u.role?.name === 'IT_Admin' ||
        u.roleId === 1 || 
        u.roleId === 22
      );
      setAdmins(adminUsers);
    } catch (err) {
      console.error('[SystemAdminsTab] Error fetching admin pool:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleFreezeAdmin = async (userId: number, name: string) => {
    try {
      await AdminAPI.kickUserSession(userId);
      showNotification(`تم تجميد حساب المسؤول [${name}] بنجاح.`);
      setSelectedAdmin(null);
      await fetchAdmins();
    } catch (err: any) {
      showNotification(err.message || 'فشل في تطبيق إجراء التجميد');
    }
  };

  return (
    <div dir="rtl" style={{
      display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 4px 40px 4px',
      fontFamily: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif"
    }}>
      
      {/* Toast Notification */}
      {actionSuccess && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: '#065f46', color: '#ffffff', padding: '12px 24px',
          borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontSize: '14px',
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '16px', background: '#ffffff', padding: '20px 24px',
        borderRadius: TOKENS.radius, border: `1px solid ${TOKENS.border}`, boxShadow: TOKENS.shadow
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: TOKENS.navy, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Key size={24} style={{ color: TOKENS.orange }} />
            حوض مدراء النظام والحوكمة السيادية (System Admins & Security Officers)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: TOKENS.textSecondary }}>
            إدارة الحسابات ذات الصلاحيات العليا، فحص مصفوفة الأذونات، وتطبيق مبدأ الحد الأدنى من الصلاحيات (Least Privilege)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            padding: '6px 14px', borderRadius: '20px', background: 'rgba(19, 93, 121, 0.08)',
            color: TOKENS.navy, fontSize: '12px', fontWeight: '700'
          }}>
            {admins.length} مسؤول معتمد
          </span>

          <button
            onClick={fetchAdmins}
            disabled={isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 14px',
              borderRadius: '10px', fontSize: '12px', fontWeight: '600', color: TOKENS.textPrimary,
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>تحديث السجل</span>
          </button>
        </div>
      </div>

      {/* Admins Table Container */}
      <div style={{
        background: TOKENS.cardBg, borderRadius: TOKENS.radius, boxShadow: TOKENS.shadow,
        border: `1px solid ${TOKENS.border}`, overflow: 'hidden'
      }}>
        {isLoading ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '60px', gap: '12px', color: TOKENS.navy
          }}>
            <RefreshCw size={32} className="animate-spin" />
            <span style={{ fontSize: '14px', fontWeight: '600' }}>جاري جلب حسابات المسؤولين الموثقة...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: TOKENS.textSecondary }}>المسؤول</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: TOKENS.textSecondary }}>البريد المؤسسي</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: TOKENS.textSecondary }}>الدور السيادي (Role)</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: TOKENS.textSecondary }}>الحالة التشغيلية</th>
                  <th style={{ padding: '14px 20px', fontSize: '12px', fontWeight: '700', color: TOKENS.textSecondary, textAlign: 'center' }}>مصفوفة الصلاحيات</th>
                </tr>
              </thead>
              <tbody>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: TOKENS.textMuted }}>
                      لا يوجد مدراء نظام مسجلين حالياً يطابقون المعايير.
                    </td>
                  </tr>
                ) : (
                  admins.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'rgba(19, 93, 121, 0.1)', color: TOKENS.navy,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: '800', fontSize: '14px'
                          }}>
                            {(user.fullName || user.username || 'A')[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: TOKENS.textPrimary, fontSize: '14px' }}>
                              {user.fullName || user.username}
                            </div>
                            <div style={{ fontSize: '11px', color: TOKENS.textMuted }}>
                              ID: #{user.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px 20px', color: TOKENS.textSecondary, fontSize: '13px' }}>
                        {user.email}
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          background: 'rgba(19, 93, 121, 0.08)', color: TOKENS.navy,
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700'
                        }}>
                          <ShieldCheck size={14} style={{ color: TOKENS.navy }} />
                          {user.role?.name || 'System_Admin'}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px',
                          padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700',
                          background: user.isFrozen ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: user.isFrozen ? TOKENS.red : TOKENS.emerald
                        }}>
                          <div style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            background: user.isFrozen ? TOKENS.red : TOKENS.emerald
                          }} />
                          {user.isFrozen ? 'مجمد أمنياً' : 'مفعل ونشط'}
                        </span>
                      </td>

                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedAdmin(user)}
                          style={{
                            background: '#ffffff', color: TOKENS.navy,
                            border: `1px solid ${TOKENS.border}`, padding: '7px 14px',
                            borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                            gap: '6px', transition: 'all 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = TOKENS.navy;
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.color = TOKENS.navy;
                          }}
                        >
                          <SlidersHorizontal size={14} />
                          <span>فحص وحوكمة الصلاحيات</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Governance & Permissions Inspector Modal ─────────────────────── */}
      {selectedAdmin && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '20px', maxWidth: '580px', width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid rgba(19, 93, 121, 0.15)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'scaleUp 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${TOKENS.navy} 0%, ${TOKENS.navyDark} 100%)`,
              color: '#ffffff', padding: '20px 24px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <ShieldAlert size={22} style={{ color: TOKENS.orange }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800' }}>
                    مصفوفة الحوكمة السيادية للأدمن
                  </h3>
                  <span style={{ fontSize: '12px', opacity: 0.85 }}>معايير Zero-Trust & RBAC</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAdmin(null)}
                style={{
                  background: 'transparent', border: 'none', color: '#ffffff',
                  cursor: 'pointer', padding: '4px', opacity: 0.8
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* User Bio Box */}
              <div style={{
                background: '#f8fafc', padding: '16px', borderRadius: '12px',
                border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: TOKENS.textPrimary }}>
                    {selectedAdmin.fullName || selectedAdmin.username}
                  </div>
                  <div style={{ fontSize: '12px', color: TOKENS.textSecondary, marginTop: '2px' }}>
                    {selectedAdmin.email} | المعرف: #{selectedAdmin.id}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '8px', background: 'rgba(19, 93, 121, 0.1)',
                  color: TOKENS.navy, fontSize: '12px', fontWeight: '800'
                }}>
                  {selectedAdmin.role?.name || 'System_Admin'}
                </span>
              </div>

              {/* Permissions Checklist */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: TOKENS.textPrimary }}>
                  الأذونات المفوضة بموجب السياسات الأمنية:
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'الوصول الكامل إلى مركز العمليات الأمنية (Enterprise SOC)', desc: 'قراءة العتاد، فحص الذاكرة ومراقبة السجلات الأمنية', granted: true },
                    { label: 'صلاحية إضافة وحذف قواعد جدار الحماية (WAF Rules)', desc: 'حظر العناوين المشبوهة وحمولات الهجمات اللحظية عبر Redis', granted: true },
                    { label: 'حوكمة الجلسات وتجميد المستخدمين (Zero-Trust Session Control)', desc: 'إبطال التوكنات وتجميد أي حساب مشتبه به فوراً', granted: true },
                    { label: 'إدارة الهيكل المؤسسي والتشغيلي (Org Structure Governance)', desc: 'تعديل الإدارات والمباني ومسارات التذاكر', granted: true }
                  ].map((perm, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'flex-start', gap: '10px',
                      padding: '10px 12px', borderRadius: '8px', background: '#ffffff',
                      border: '1px solid #e2e8f0'
                    }}>
                      <CheckCircle2 size={16} style={{ color: TOKENS.emerald, marginTop: '2px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: TOKENS.textPrimary }}>
                          {perm.label}
                        </div>
                        <div style={{ fontSize: '11px', color: TOKENS.textMuted }}>
                          {perm.desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emergency Security Actions */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: '12px', borderTop: '1px solid #f1f5f9'
              }}>
                <button
                  onClick={() => handleFreezeAdmin(selectedAdmin.id, selectedAdmin.fullName || selectedAdmin.username)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)', color: TOKENS.red,
                    border: '1px solid rgba(239, 68, 68, 0.25)', padding: '9px 16px',
                    borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <UserX size={14} />
                  <span>تجميد الحساب وإلغاء صلاحياته فوراً</span>
                </button>

                <button
                  onClick={() => setSelectedAdmin(null)}
                  style={{
                    background: TOKENS.navy, color: '#ffffff', border: 'none',
                    padding: '9px 20px', borderRadius: '8px', fontSize: '13px',
                    fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  إغلاق الفحص
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
