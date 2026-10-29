import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightLeft, ShieldCheck, Users, Building2, Sliders, CheckCircle2, 
  AlertCircle, RefreshCw, Lock, Save, Sparkles, UserCheck, Check, X,
  ShieldAlert, Settings, Layers
} from 'lucide-react';
import { OpsAPI } from '../../../services/ops.api';

interface DepartmentGovernance {
  enabled: boolean;
  allowAllUsers: boolean;
  allowedUserIds: number[];
  delegatedManagerIds: number[];
  maxConcurrentActive: number;
}

interface StandaloneGovernanceConfig {
  globalEnabled: boolean;
  defaultMaxActive: number;
  departmentConfigs: Record<string, DepartmentGovernance>;
}

export const InternalRequestsGovernanceTab: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [usersPool, setUsersPool] = useState<Array<{ id: number; fullName: string; departmentId?: number; role?: string }>>([]);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [config, setConfig] = useState<StandaloneGovernanceConfig>({
    globalEnabled: true,
    defaultMaxActive: 5,
    departmentConfigs: {}
  });

  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('litc_token') || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

      const [deptRes, usersRes, govRes] = await Promise.all([
        OpsAPI.getDepartments().catch(() => ({ data: [] })),
        fetch('/api/v1/org/users/pool', { headers, credentials: 'include' }).then(r => r.json()).catch(() => ({ users: [] })),
        fetch('/api/v1/admin/standalone-governance', { headers, credentials: 'include' }).then(r => r.json()).catch(() => ({ data: null }))
      ]);

      const deptsList = deptRes.data || [];
      setDepartments(deptsList);
      if (deptsList.length > 0 && !selectedDeptId) {
        setSelectedDeptId(deptsList[0].id);
      }

      setUsersPool(usersRes.users || usersRes.data || []);

      if (govRes.success && govRes.data) {
        setConfig(prev => ({
          ...prev,
          globalEnabled: govRes.data.globalEnabled !== false,
          defaultMaxActive: govRes.data.defaultMaxActive || 5,
          departmentConfigs: govRes.data.departmentConfigs || {}
        }));
      }
    } catch (err: any) {
      console.error('Failed to load standalone governance data', err);
      setToastMsg({ type: 'error', text: 'فشل تحميل بيانات الحوكمة' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('litc_token') || localStorage.getItem('token');
      const res = await fetch('/api/v1/admin/standalone-governance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        credentials: 'include',
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        setToastMsg({ type: 'success', text: 'تم حفظ إعدادات حوكمة الطلبات الداخلية بنجاح 🎯' });
        setTimeout(() => setToastMsg(null), 4000);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err?.message || 'فشل حفظ الإعدادات' });
    } finally {
      setSaving(false);
    }
  };

  const getDeptConfig = (deptId: number): DepartmentGovernance => {
    return config.departmentConfigs[String(deptId)] || {
      enabled: true,
      allowAllUsers: true,
      allowedUserIds: [],
      delegatedManagerIds: [],
      maxConcurrentActive: config.defaultMaxActive || 5
    };
  };

  const updateDeptConfig = (deptId: number, partial: Partial<DepartmentGovernance>) => {
    setConfig(prev => ({
      ...prev,
      departmentConfigs: {
        ...prev.departmentConfigs,
        [String(deptId)]: {
          ...getDeptConfig(deptId),
          ...partial
        }
      }
    }));
  };

  const activeDeptConfig = selectedDeptId ? getDeptConfig(selectedDeptId) : null;
  const deptUsers = selectedDeptId
    ? usersPool.filter(u => Number(u.departmentId) === Number(selectedDeptId))
    : [];

  return (
    <div style={{ direction: 'rtl', fontFamily: "'Cairo', sans-serif", display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ═══ Header ═══ */}
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        padding: '24px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
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
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 6px 16px rgba(14, 165, 233, 0.3)'
          }}>
            <ArrowRightLeft size={24} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
              حوكمة التنسيق والطلبات الداخلية المستقلة
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748b' }}>
              إدارة صلاحيات التنسيق البيني بين الإدارات، ضبط سقوف التكليفات المفتوحة، وتعيين المفوّضين بإدارة الخصائص
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Global Toggle */}
          <button
            type="button"
            onClick={() => setConfig(prev => ({ ...prev, globalEnabled: !prev.globalEnabled }))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '12px',
              border: config.globalEnabled ? '1.5px solid #10b981' : '1px solid #cbd5e1',
              background: config.globalEnabled ? '#ecfdf5' : '#f8fafc',
              color: config.globalEnabled ? '#047857' : '#64748b',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={16} />
            <span>{config.globalEnabled ? 'الميزة مفعلة بالمنظومة' : 'الميزة معطلة بالكامل'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '13.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)'
            }}
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            <span>حفظ السياسات</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: toastMsg.type === 'success' ? '#ecfdf5' : '#fef2f2',
          border: `1px solid ${toastMsg.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          color: toastMsg.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* ═══ Main Control Split ═══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(400px, 2.5fr)', gap: '20px' }}>
        
        {/* Left: Operational Departments List */}
        <div style={{
          background: '#ffffff',
          borderRadius: '18px',
          padding: '18px',
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={15} color="#0ea5e9" />
            <span>الإدارات التشغيلية المعتمدة ({departments.length})</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '520px', overflowY: 'auto' }}>
            {departments.map((dept) => {
              const dCfg = getDeptConfig(dept.id);
              const isSelected = selectedDeptId === dept.id;
              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDeptId(dept.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid #0ea5e9' : '1px solid #f1f5f9',
                    background: isSelected ? '#f0f9ff' : '#fafafa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#0284c7' : '#1e293b' }}>
                      {dept.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {dCfg.enabled ? '✓ مفعلة' : '✗ معطلة'} • {dCfg.allowAllUsers ? 'كافة المستخدمين' : `مخصص (${dCfg.allowedUserIds?.length || 0})`}
                    </div>
                  </div>

                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: dCfg.enabled ? '#10b981' : '#cbd5e1',
                    boxShadow: dCfg.enabled ? '0 0 6px #10b981' : 'none'
                  }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Department Governance Matrix */}
        {selectedDeptId && activeDeptConfig ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  إعدادات: {departments.find(d => d.id === selectedDeptId)?.name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  حوكمة إرسال واستقبال الطلبات المستقلة والتكليفات البينية المباشرة
                </p>
              </div>

              {/* Department Enable Switch */}
              <button
                type="button"
                onClick={() => updateDeptConfig(selectedDeptId, { enabled: !activeDeptConfig.enabled })}
                style={{
                  padding: '7px 16px',
                  borderRadius: '10px',
                  border: activeDeptConfig.enabled ? '1px solid #10b981' : '1px solid #cbd5e1',
                  background: activeDeptConfig.enabled ? '#ecfdf5' : '#f8fafc',
                  color: activeDeptConfig.enabled ? '#047857' : '#64748b',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {activeDeptConfig.enabled ? '✓ مسموح لها بالتنسيق البيني' : '✗ التنسيق البيني معطل'}
              </button>
            </div>

            {/* Scope: All Users vs Specific */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                نطاق المستفيدين المصرح لهم بإرسال طلبات مستقلة من هذه الإدارة:
              </label>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => updateDeptConfig(selectedDeptId, { allowAllUsers: true })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: activeDeptConfig.allowAllUsers ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                    background: activeDeptConfig.allowAllUsers ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'right'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: activeDeptConfig.allowAllUsers ? '#0284c7' : '#334155' }}>
                    كافة كادر الإدارة (مفتوح)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    يحق لكافة موظفي ومهندسي الإدارة إرسال واستقبال المعاملات البينية المستقلة
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateDeptConfig(selectedDeptId, { allowAllUsers: false })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: !activeDeptConfig.allowAllUsers ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                    background: !activeDeptConfig.allowAllUsers ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'right'
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 800, color: !activeDeptConfig.allowAllUsers ? '#0284c7' : '#334155' }}>
                    مستخدمون محددون بالاسم فقط
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    حصر إرسال الطلبات البينية المستقلة في كبار الموظفين أو المعينين حصراً
                  </div>
                </button>
              </div>
            </div>

            {/* If Specific Users: Picker */}
            {!activeDeptConfig.allowAllUsers && (
              <div style={{
                background: '#f8fafc',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                  اختر المستخدمين المصرح لهم بإرسال واستقبال الطلبات المستقلة:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                  {deptUsers.map(u => {
                    const isSelected = activeDeptConfig.allowedUserIds?.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => {
                          const current = activeDeptConfig.allowedUserIds || [];
                          const next = isSelected ? current.filter(id => id !== u.id) : [...current, u.id];
                          updateDeptConfig(selectedDeptId, { allowedUserIds: next });
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '1.5px solid #0ea5e9' : '1px solid #cbd5e1',
                          background: isSelected ? '#e0f2fe' : '#ffffff',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: isSelected ? '#0369a1' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <span>{u.fullName}</span>
                        {isSelected && <Check size={14} color="#0284c7" />}
                      </div>
                    );
                  })}
                  {deptUsers.length === 0 && (
                    <div style={{ fontSize: '12px', color: '#94a3b8', padding: '8px' }}>
                      لا يوجد مستخدمون مسجلون في هذه الإدارة حالياً
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Delegated Managers for Flow Reception Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#7e22ce" />
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                  مفوّضو إدارة خصائص الطلبات الداخلية (Governance Delegators):
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b' }}>
                الأشخاص الذين يملكون صلاحية الدخول لشاشة "خصائص استقبال الطلبات" لضبط إعدادات وسقوف ومسارات التكليف الداخلي دون منحهم صلاحية أدمن عام:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                {deptUsers.map(u => {
                  const isManager = activeDeptConfig.delegatedManagerIds?.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => {
                        const current = activeDeptConfig.delegatedManagerIds || [];
                        const next = isManager ? current.filter(id => id !== u.id) : [...current, u.id];
                        updateDeptConfig(selectedDeptId, { delegatedManagerIds: next });
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isManager ? '1.5px solid #7e22ce' : '1px solid #cbd5e1',
                        background: isManager ? '#faf5ff' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: isManager ? '#6b21a8' : '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{u.fullName}</span>
                      {isManager && <Check size={14} color="#7e22ce" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Concurrency Ceilings */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                  سقف الطلبات المستقلة النشطة (Concurrency Limit):
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  الحد الأقصى للتذاكر المستقلة المفتوحة في وقت واحد لكل موظف لمنع الإغراق الإداري
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={activeDeptConfig.maxConcurrentActive || 5}
                  onChange={(e) => updateDeptConfig(selectedDeptId, { maxConcurrentActive: Math.max(1, parseInt(e.target.value) || 1) })}
                  style={{
                    width: '65px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    fontWeight: 800,
                    textAlign: 'center',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>تذاكر نشطة</span>
              </div>
            </div>

          </div>
        ) : (
          <div style={{
            background: '#ffffff',
            borderRadius: '18px',
            padding: '40px',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            اختر إدارة تشغيلية لتعديل خصائصها
          </div>
        )}
      </div>
    </div>
  );
};
