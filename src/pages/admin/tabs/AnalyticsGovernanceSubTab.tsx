/**
 * LITC Enterprise OS v43 - Analytics Governance SubTab
 * ===================================================
 * شاشة إدارة وتوزيع صلاحيات التحليل والتقارير المتقاطعة عبر الإدارات.
 * خاصة بمدير النظام (Admin) فقط.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, UserPlus, Trash2, CheckCircle2, XCircle, 
  Search, Building2, User, AlertCircle, RefreshCw, Lock, Sparkles, FileSpreadsheet
} from 'lucide-react';

interface PermissionItem {
  id: string;
  userId: number;
  user: { id: number; username: string; fullName?: string; jobTitle?: string; departmentId?: number };
  departmentId: number;
  department: { id: number; name: string };
  routeId?: string | null;
  canExport: boolean;
  canCompare: boolean;
  grantedBy?: { id: number; username: string; fullName?: string };
  createdAt: string;
}

export const AnalyticsGovernanceSubTab: React.FC = () => {
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [users, setUsers] = useState<Array<{ id: number; username: string; fullName?: string; jobTitle?: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // حالة النافذة المنبثقة لمنح صلاحية جديدة
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [canExport, setCanExport] = useState<boolean>(true);
  const [canCompare, setCanCompare] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [userSearchTerm, setUserSearchTerm] = useState<string>('');

  const fetchPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/v1/admin/analytics/permissions', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('فشل جلب قائمة صلاحيات التحليل');
      const json = await res.json();
      if (json.success && json.data) {
        setPermissions(json.data.permissions || []);
        setDepartments(json.data.departments || []);
        setUsers(json.data.users || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // منح صلاحية جديدة
  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedDeptId) {
      setModalError('يرجى تحديد الموظف والإدارة المستهدفة');
      return;
    }

    try {
      setSubmitting(true);
      setModalError(null);
      const res = await fetch('/api/v1/admin/analytics/permissions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          departmentId: selectedDeptId,
          canExport,
          canCompare
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'فشل منح الصلاحية');
      }

      setIsModalOpen(false);
      setSelectedUserId('');
      setSelectedDeptId('');
      fetchPermissions();
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // إلغاء صلاحية
  const handleRevoke = async (permissionId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذه الصلاحية التحليلية فورياً؟')) return;
    try {
      const res = await fetch(`/api/v1/admin/analytics/permissions/${permissionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('فشل إلغاء الصلاحية');
      fetchPermissions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.fullName && u.fullName.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
    u.username.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    (u.jobTitle && u.jobTitle.toLowerCase().includes(userSearchTerm.toLowerCase()))
  );

  return (
    <div style={{
      fontFamily: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
      direction: 'rtl',
      lineHeight: 1.7,
      color: '#1e293b'
    }}>
      {/* ─── الترويسة والتحكم ───────────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        border: '1px solid #e2e8f0',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '14px',
            background: '#e0f2fe',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              حوكمة صلاحيات التحليلات والتقارير المتقاطعة
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
              منح صلاحيات استعراض ومقارنة مؤشرات الإدارات للقيادات والمراجعين دون المساس بالصلاحيات التشغيلية
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchPermissions}
            style={{
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => { setIsModalOpen(true); setModalError(null); }}
            style={{
              padding: '10px 18px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
            }}
          >
            <UserPlus size={16} />
            منح تفويض تحليلي جديد
          </button>
        </div>
      </div>

      {/* ─── بطاقة التنبيه الهندسي للحوكمة ──────────────────────────── */}
      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '14px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        fontSize: '13px',
        color: '#1e40af'
      }}>
        <Lock size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>قاعدة العزل والرقابة الآمنة:</strong> الصلاحيات الممنوحة هنا تتيح للمستفيد حق الرقابة والاطلاع على المؤشرات والمقارنات وتصدير التقارير فقط، <strong>دون منحه أي صلاحية تشغيلية</strong> للتدخل في تذاكر الإدارة أو سحبها أو تحويلها.
        </div>
      </div>

      {/* ─── جدول الصلاحيات الممنوحة ─────────────────────────────────── */}
      <div style={{
        background: '#ffffff',
        borderRadius: '18px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
              <th style={{ padding: '14px 20px' }}>الموظف المفوض</th>
              <th style={{ padding: '14px 20px' }}>الإدارة المصرح بها</th>
              <th style={{ padding: '14px 20px' }}>صلاحية المقارنة</th>
              <th style={{ padding: '14px 20px' }}>صلاحية التصدير</th>
              <th style={{ padding: '14px 20px' }}>تم المنح بواسطة</th>
              <th style={{ padding: '14px 20px' }}>تاريخ المنح</th>
              <th style={{ padding: '14px 20px', textAlign: 'center' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  جاري تحميل الصلاحيات...
                </td>
              </tr>
            ) : permissions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  لا توجد تفويضات تحليلية عابرة للإدارات حالياً.
                </td>
              </tr>
            ) : (
              permissions.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{p.user?.fullName || p.user?.username}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{p.user?.jobTitle || p.user?.username}</div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{
                      background: '#e0f2fe',
                      color: '#0369a1',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '12px'
                    }}>
                      {p.department?.name}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {p.canCompare ? (
                      <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <CheckCircle2 size={16} /> مسموح
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={16} /> معطل
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {p.canExport ? (
                      <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                        <CheckCircle2 size={16} /> مسموح
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <XCircle size={16} /> معطل
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>
                    {p.grantedBy?.fullName || p.grantedBy?.username || 'مدير النظام'}
                  </td>
                  <td style={{ padding: '14px 20px', color: '#64748b' }}>
                    {new Date(p.createdAt).toLocaleDateString('ar-LY')}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleRevoke(p.id)}
                      title="إلغاء الصلاحية"
                      style={{
                        padding: '6px',
                        borderRadius: '8px',
                        border: '1px solid #fee2e2',
                        background: '#fef2f2',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── نافذة منبثقة لمنح صلاحية جديدة ──────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '520px',
            padding: '28px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            direction: 'rtl'
          }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              منح تفويض تحليلي عابر للإدارات
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: '#64748b' }}>
              اختر الموظف والإدارة التي ترغب في تمكينه من استعراض تحليلاتها ومقارناتها.
            </p>

            {modalError && (
              <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', color: '#b91c1c', marginBottom: '16px', fontSize: '13px' }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleGrantAccess}>
              {/* اختيار الموظف مع شريط بحث */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  الموظف المستهدف:
                </label>
                <input
                  type="text"
                  placeholder="ابحث بالاسم أو الرقم أو المسمى..."
                  value={userSearchTerm}
                  onChange={e => setUserSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginBottom: '8px',
                    fontSize: '12px'
                  }}
                />
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- اختر الموظف --</option>
                  {filteredUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.username} ({u.jobTitle || 'موظف'})
                    </option>
                  ))}
                </select>
              </div>

              {/* اختيار الإدارة */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  الإدارة المصرح باستعراضها:
                </label>
                <select
                  value={selectedDeptId}
                  onChange={e => setSelectedDeptId(Number(e.target.value))}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                >
                  <option value="">-- اختر الإدارة --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* الميزات المصرح بها */}
              <div style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '12px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}>
                  القدرات التحليلية الممنوحة:
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={canCompare}
                    onChange={e => setCanCompare(e.target.checked)}
                  />
                  <span>السماح باستخدام محرك المقارنة والمفاضلة (الموظفين، المواقع، الأعطال)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={canExport}
                    onChange={e => setCanExport(e.target.checked)}
                  />
                  <span>السماح بتصدير التقارير (Excel / CSV)</span>
                </label>
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#64748b',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0284c7',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {submitting ? 'جاري الحفظ...' : 'تأكيد ومنح الصلاحية'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsGovernanceSubTab;
