/**
 * NEXUS TDS - Analytics Governance & Delegation View
 * ==================================================
 * لوحة حوكمة وتفويض صلاحيات استعراض التحليلات والتقارير.
 * تمكّن مدراء المسارات ورؤساء الإدارات من تفويض الكوادر والمهندسين
 * لاستعراض مؤشرات الأداء وإجراء المقارنات متعددة الأبعاد.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, UserPlus, Trash2, RefreshCw, CheckCircle2, 
  AlertCircle, Users, Building2, Sliders, Lock, ArrowRightLeft, Download
} from 'lucide-react';

interface DelegationRecord {
  id: string;
  userId: number;
  departmentId: number;
  routeId: string | null;
  canExport: boolean;
  canCompare: boolean;
  createdAt: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    jobTitle: string | null;
  };
  department: {
    id: number;
    name: string;
  };
  grantedBy?: {
    id: number;
    fullName: string;
    username: string;
  };
}

interface AnalyticsGovernanceViewProps {
  isDark?: boolean;
}

export const AnalyticsGovernanceView: React.FC<AnalyticsGovernanceViewProps> = ({ isDark = false }) => {
  const [delegations, setDelegations] = useState<DelegationRecord[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: number; fullName: string; username: string; jobTitle: string | null; departmentId: number | null }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // حالة نموذج المنح
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [canExport, setCanExport] = useState<boolean>(true);
  const [canCompare, setCanCompare] = useState<boolean>(true);

  const fetchDelegations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/analytics/delegations', { credentials: 'include' });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل جلب قائمة التفويضات');
      }
      const json = await res.json();
      if (json.success && json.data) {
        setDelegations(json.data.permissions || []);
        setDepartments(json.data.departments || []);
        setUsers(json.data.users || []);
        if (json.data.departments?.length > 0) {
          setSelectedDeptId(json.data.departments[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDelegations();
  }, [fetchDelegations]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedDeptId) {
      setError('يرجى اختيار الموظف والإدارة.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const res = await fetch('/api/v1/analytics/delegations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(selectedUserId),
          departmentId: Number(selectedDeptId),
          canExport,
          canCompare
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل منح صلاحية التحليل');
      }

      setSuccessMsg('تم تفويض صلاحية التحليل بنجاح');
      setShowAddModal(false);
      setSelectedUserId('');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDelegations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (id: string, userName: string) => {
    if (!window.confirm(`هل أنت متأكد من إلغاء تفويض التحليل الممنوح للمستخدم (${userName})؟`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await fetch(`/api/v1/analytics/delegations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل إلغاء التفويض');
      }

      setSuccessMsg('تم إلغاء التفويض بنجاح');
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchDelegations();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ألوان وتنسيقات السليت المؤسسي المعتمدة
  const cardBg = isDark ? '#111827' : '#ffffff';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const subtextColor = isDark ? '#94a3b8' : '#64748b';
  const tableHeaderBg = isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc';
  const rowHoverBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9';

  return (
    <div style={{
      fontFamily: "'Cairo', sans-serif",
      direction: 'rtl',
      lineHeight: 1.6
    }}>
      {/* الترويسة الرئيسية */}
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #135d79 0%, #0d4257 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(19, 93, 121, 0.35)'
          }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: textColor }}>
              حوكمة وتفويض صلاحيات التحليل
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: subtextColor }}>
              إدارة صلاحيات استعراض مؤشرات الأداء، تفويض قادة الفرق، وحظر تسرب بيانات المسارات
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchDelegations}
            disabled={loading}
            style={{
              padding: '9px 14px',
              borderRadius: '10px',
              border: `1px solid ${cardBorder}`,
              background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
              color: textColor,
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            تحديث
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #135d79 0%, #f36c21 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(243, 108, 33, 0.25)'
            }}
          >
            <UserPlus size={15} />
            منح تفويض جديد
          </button>
        </div>
      </div>

      {/* رسائل التنبيه والنجاح */}
      {successMsg && (
        <div style={{
          background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
          border: '1px solid #10b981',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: isDark ? '#6ee7b7' : '#15803d',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          color: isDark ? '#fca5a5' : '#b91c1c',
          fontSize: '13px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* جدول التفويضات النشطة */}
      <div style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={16} color="#135d79" />
            <span style={{ fontSize: '14px', fontWeight: 800, color: textColor }}>
              قائمة التفويضات الممنوحة ({delegations.length})
            </span>
          </div>
          <span style={{ fontSize: '12px', color: subtextColor }}>
            تخول أصحابها استعراض إحصائيات الإدارة وإجراء المقارنات
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#135d79' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '13px', fontWeight: 600 }}>جاري استرجاع سجلات التفويض...</div>
          </div>
        ) : delegations.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: subtextColor }}>
            <ShieldCheck size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: textColor, marginBottom: '4px' }}>
              لا توجد تفويضات خارجية مسجلة حالياً
            </div>
            <div style={{ fontSize: '13px' }}>
              الموظفون يشاهدون تحليلات إداراتهم الأصلية تلقائياً بحسب الصلاحيات القيادية.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: tableHeaderBg, borderBottom: `1px solid ${cardBorder}` }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الموظف المفوض</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المسمى الوظيفي</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الإدارة الممنوح عليها</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>الصلاحيات التحليلية</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>المفوض بواسطة</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: subtextColor }}>تاريخ المنح</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: subtextColor, textAlign: 'center' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {delegations.map(del => (
                  <tr
                    key={del.id}
                    style={{
                      borderBottom: `1px solid ${cardBorder}`,
                      transition: 'background-color 0.15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = rowHoverBg)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: textColor }}>
                        {del.user?.fullName || del.user?.username}
                      </div>
                      <div style={{ fontSize: '11px', color: subtextColor }}>@{del.user?.username}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12.5px', color: subtextColor }}>
                      {del.user?.jobTitle || 'عضو كادر تشغيلي'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: isDark ? 'rgba(19, 93, 121, 0.2)' : '#e0f2fe',
                        color: isDark ? '#38bdf8' : '#0369a1',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px'
                      }}>
                        {del.department?.name}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {del.canCompare && (
                          <span style={{
                            background: isDark ? 'rgba(243, 108, 33, 0.15)' : '#fff7ed',
                            color: '#ea580c',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(243, 108, 33, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <ArrowRightLeft size={10} /> محرك المقارنة
                          </span>
                        )}
                        {del.canExport && (
                          <span style={{
                            background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
                            color: '#16a34a',
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Download size={10} /> تصدير تقارير
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: subtextColor }}>
                      {del.grantedBy?.fullName || del.grantedBy?.username || 'مدير النظام'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: subtextColor }}>
                      {new Date(del.createdAt).toLocaleDateString('ar-LY')}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => handleRevoke(del.id, del.user?.fullName || del.user?.username)}
                        disabled={actionLoading}
                        title="إلغاء هذا التفويض"
                        style={{
                          background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
                          border: 'none',
                          color: '#dc2626',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                          transition: 'opacity 0.2s'
                        }}
                      >
                        <Trash2 size={13} />
                        إلغاء
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* نافذة مودال: منح تفويض جديد */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '20px',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            direction: 'rtl'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(19, 93, 121, 0.15)', color: '#135d79' }}>
                <UserPlus size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: textColor }}>
                  منح تفويض تحليلي لموظف
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: subtextColor }}>
                  السماح للموظف باستعراض بيانات وتقارير إدارة أو مسار محدد
                </p>
              </div>
            </div>

            <form onSubmit={handleGrant}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {/* اختيار الموظف */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, marginBottom: '6px' }}>
                    الموظف المستهدف:
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${cardBorder}`,
                      background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor,
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    <option value="">-- اختر الموظف --</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName || u.username} ({u.jobTitle || 'موظف'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* اختيار الإدارة */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: textColor, marginBottom: '6px' }}>
                    الإدارة / المسار المراد تفويضه عليه:
                  </label>
                  <select
                    value={selectedDeptId}
                    onChange={e => setSelectedDeptId(Number(e.target.value))}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1px solid ${cardBorder}`,
                      background: isDark ? '#1e293b' : '#ffffff',
                      color: textColor,
                      fontSize: '13px',
                      fontWeight: 600,
                      outline: 'none'
                    }}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* خيارات الصلاحية */}
                <div style={{
                  background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '12px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: textColor, marginBottom: '10px' }}>
                    الأدوات المصرح بها:
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: textColor, cursor: 'pointer', marginBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={canCompare}
                      onChange={e => setCanCompare(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#135d79' }}
                    />
                    <span>تمكين محرك المقارنة والمفاضلة متعدد الأبعاد (N-Entities)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: textColor, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={canExport}
                      onChange={e => setCanExport(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#135d79' }}
                    />
                    <span>تمكين تصدير التقارير الإحصائية (CSV / Data Sheet)</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={actionLoading}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${cardBorder}`,
                    background: 'transparent',
                    color: subtextColor,
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #135d79 0%, #f36c21 100%)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {actionLoading ? 'جاري الحفظ...' : 'تأكيد ومنح التفويض'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
