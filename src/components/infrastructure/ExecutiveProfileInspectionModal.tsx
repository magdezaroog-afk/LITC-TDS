import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Phone, 
  Building2, 
  Briefcase, 
  MapPin, 
  Shield, 
  Edit3, 
  Users, 
  RefreshCw,
  Check,
  Hash,
  Globe,
  CheckCircle2,
  AlertCircle,
  Info,
  Sparkles,
  Layers,
  Sliders,
  PhoneCall,
  Compass,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../../engine/auth/AuthContext';

export interface ExecutiveProfileInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExecutiveProfileInspectionModal: React.FC<ExecutiveProfileInspectionModalProps> = ({
  isOpen: propIsOpen,
  onClose
}) => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [internalOpen, setInternalOpen] = useState<boolean>(false);

  const activeIsOpen = propIsOpen || internalOpen;

  // Listen to the global open event
  useEffect(() => {
    const handleOpen = () => setInternalOpen(true);
    window.addEventListener('litc_open_profile_modal', handleOpen);
    return () => window.removeEventListener('litc_open_profile_modal', handleOpen);
  }, []);

  const handleClose = () => {
    setInternalOpen(false);
    setIsEditing(false);
    onClose();
  };

  // Keyboard navigation (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeIsOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIsOpen]);

  // Lock body scroll when modal is active
  useEffect(() => {
    if (activeIsOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [activeIsOpen]);

  // Form State for Editing Corporate Profile
  const [formData, setFormData] = useState({
    fullName: '',
    employeeId: '',
    jobTitle: '',
    phone: '',
    businessPhone: '',
    officeLocation: '',
    city: '',
    company: ''
  });

  // Dark mode detector
  const [isDark, setIsDark] = useState<boolean>(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchProfile = async () => {
    if (!authUser) return;
    try {
      setLoading(true);
      const tkn = sessionStorage.getItem('litc_token') || sessionStorage.getItem('token') || localStorage.getItem('litc_token') || localStorage.getItem('token');
      const activeUserId = authUser?.id ? String(authUser.id).replace(/\D/g, '') : '';
      
      const res = await fetch('/api/v1/functional/me', {
        headers: {
          ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {}),
          ...(activeUserId ? { 'x-user-id': activeUserId } : {})
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.data) {
        setProfile(data.data);
        setFormData({
          fullName: data.data.name || authUser.name || '',
          employeeId: data.data.employeeId || '',
          jobTitle: data.data.jobTitle || data.data.corporateJobTitle || '',
          phone: data.data.mobilePhone || data.data.phone || '',
          businessPhone: data.data.businessPhone || '',
          officeLocation: data.data.officeLocation || '',
          city: data.data.city || 'طرابلس',
          company: data.data.company || 'الشركة الليبية للاتصالات وتقنية المعلومات (LITC)'
        });
      }
    } catch (err) {
      console.error('Failed to load user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeIsOpen) {
      fetchProfile();
      setIsEditing(false);
    }
  }, [activeIsOpen, authUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const tkn = sessionStorage.getItem('litc_token') || sessionStorage.getItem('token') || localStorage.getItem('litc_token') || localStorage.getItem('token');
      const activeUserId = authUser?.id ? String(authUser.id).replace(/\D/g, '') : '';

      const res = await fetch('/api/v1/functional/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(tkn ? { 'Authorization': `Bearer ${tkn}` } : {}),
          ...(activeUserId ? { 'x-user-id': activeUserId } : {})
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const resData = await res.json();
      if (resData.success) {
        showToast('تم حفظ وتحديث السجل المؤسسي للموظف بنجاح');
        setIsEditing(false);
        fetchProfile();
        window.dispatchEvent(new CustomEvent('litc_profile_updated', { detail: resData.data }));
      } else {
        showToast(resData.message || 'حدث خطأ أثناء حفظ البيانات');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('تعذر الاتصال بالخادم لحفظ التعديلات');
    } finally {
      setIsSaving(false);
    }
  };

  // Corporate Institutional Identity (الموحدة مع الأنظمة ومايكروسوفت)
  const currentName = profile?.name || authUser?.name || 'مستخدم النظام';
  const currentCorporateTitle = profile?.corporateJobTitle || profile?.jobTitle || 'موظف مؤسسي معتمد';
  const currentDept = profile?.department || authUser?.department || 'إدارة العمليات المركزية';
  const currentEmail = profile?.email || authUser?.email || 'user@litc.ly';
  const currentEmpId = profile?.employeeId || '1059';
  const currentPhone = profile?.mobilePhone || profile?.phone || 'لم يُحدد بعد';
  const currentLandline = profile?.businessPhone || '021-3600000 (داخلي)';
  const currentLocation = profile?.officeLocation || 'المقر الرئيسي، شارع النصر';
  const currentCity = profile?.city || 'طرابلس';
  const currentCompany = profile?.company || 'الشركة الليبية للاتصالات وتقنية المعلومات (LITC)';

  // System Role in NEXUS TDS (الصفة والصلاحية داخل النظام فقط)
  const rawSystemRole = profile?.systemRole || profile?.role || authUser?.role || 'EMPLOYEE';
  const systemRoleMap: Record<string, { label: string; desc: string; color: string; badge: string }> = {
    super_admin: { 
      label: 'مدير النظام الأعلى (Super Admin)', 
      desc: 'صلاحيات تشغيلية وسيادية كاملة على كافة العمليات، التذاكر، وضبط البنية التحتية للنظام',
      color: '#f36c21',
      badge: 'كامل الصلاحيات المركزية'
    },
    system_director: { 
      label: 'مدير الأنظمة والتقنية', 
      desc: 'إشراف تشغيلي وتوجيه مركزي لمسارات العمل وتدفق التذاكر بين الإدارات',
      color: '#135d79',
      badge: 'إشراف وتوجيه مركزي'
    },
    tech_director: { 
      label: 'مدير العمليات الفنية', 
      desc: 'إدارة وتوجيه التذاكر الفنية واعتماد الإغلاق وحل المشكلات التخصصية',
      color: '#135d79',
      badge: 'إدارة تشغيلية فنية'
    },
    dept_head: { 
      label: 'رئيس قسم / جهة معتمدة', 
      desc: 'استلام التذاكر المحالة للقسم، تكليف أعضاء الفريق، واعتماد إنجاز المعاملات',
      color: '#0284c7',
      badge: 'اعتماد وتكليف قسم'
    },
    operational_user: { 
      label: 'عضو كادر تشغيلي', 
      desc: 'استلام التذاكر المباشرة، تنفيذ الإجراءات الميدانية، وتحديث حالات المعالجة',
      color: '#10b981',
      badge: 'تنفيذ واستلام تذاكر'
    },
    employee: { 
      label: 'موظف مؤسسي (مقدم طلبات)', 
      desc: 'إنشاء ومتابعة طلبات الخدمات والتذاكر الذاتية والاستعلام عن مسارها',
      color: '#64748b',
      badge: 'تقديم ومتابعة الطلبات'
    }
  };

  const currentSystemConfig = systemRoleMap[rawSystemRole.toLowerCase()] || {
    label: rawSystemRole,
    desc: 'مستخدم معتمد ضمن صلاحيات مسارات العمل المحددة في النظام',
    color: '#135d79',
    badge: 'صلاحية نظام TDS'
  };

  // Operational Queues in TDS
  const assignedTeams: string[] = profile?.teams && profile.teams.length > 0 
    ? profile.teams 
    : ['إدارة العمليات المركزية', 'فريق الدعم والمساندة الفنية'];

  // Theme design tokens
  const bgSurface = isDark ? '#111827' : '#ffffff';
  const borderSubtle = isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0';
  const textPrimary = isDark ? '#f8fafc' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const tealAccent = '#135d79';
  const orangeAccent = '#f36c21';

  // Do not render anything if closed or document is not ready
  if (typeof document === 'undefined' || !activeIsOpen) return null;

  return createPortal(
    <AnimatePresence>
      {activeIsOpen && (
        <div 
          dir="rtl"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            fontFamily: "'Cairo', 'Segoe UI', system-ui, sans-serif"
          }}
        >
          {/* Backdrop (Slate Blur) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 8, 16, 0.85)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)'
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '820px',
              maxHeight: '90vh',
              borderRadius: '20px',
              backgroundColor: bgSurface,
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
              boxShadow: isDark
                ? '0 25px 60px -15px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                : '0 20px 50px -12px rgba(19, 93, 121, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 10
            }}
          >
            {/* Toast Notification */}
            {toastMsg && (
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 60,
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  padding: '6px 18px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
                }}
              >
                <Check size={14} strokeWidth={3} />
                <span>{toastMsg}</span>
              </div>
            )}

            {/* 1. Modal Top Bar */}
            <div
              style={{
                padding: '16px 22px',
                borderBottom: borderSubtle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isDark ? '#0d1322' : '#f8fafc',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  style={{ 
                    width: '34px', 
                    height: '34px', 
                    borderRadius: '10px', 
                    backgroundColor: 'rgba(19, 93, 121, 0.14)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: tealAccent
                  }}
                >
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: textPrimary }}>
                    الملف الشخصي والسجل الوظيفي
                  </h3>
                  <span style={{ fontSize: '11px', color: textMuted, fontWeight: 500 }}>
                    فصل الهوية المؤسسية الموحدة عن الصلاحيات التشغيلية في النظام • NEXUS TDS
                  </span>
                </div>
              </div>

              {/* Action Buttons: Edit & Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid #cbd5e1',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Edit3 size={13} color={orangeAccent} />
                    <span>تعديل السجل المؤسسي</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="إغلاق النافذة"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
                    border: 'none',
                    color: textMuted,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)'}
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* 2. Top Summary Strip */}
            <div
              style={{
                padding: '16px 22px',
                backgroundColor: isDark ? 'rgba(19, 93, 121, 0.06)' : 'rgba(19, 93, 121, 0.03)',
                borderBottom: borderSubtle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Avatar with Dual Accent Border */}
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '14px',
                    backgroundColor: isDark ? '#0b141f' : '#ffffff',
                    border: `2px solid ${tealAccent}`,
                    boxShadow: isDark ? '0 0 16px rgba(19, 93, 121, 0.3)' : '0 4px 12px rgba(19, 93, 121, 0.15)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative'
                  }}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentName)}`}
                    alt={currentName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: textPrimary }}>
                      {currentName}
                    </h2>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: isDark ? 'rgba(243, 108, 33, 0.15)' : 'rgba(243, 108, 33, 0.1)',
                        color: orangeAccent,
                        border: '1px solid rgba(243, 108, 33, 0.25)',
                        fontFamily: 'monospace'
                      }}
                      title="الرقم الوظيفي المعتمد"
                    >
                      ID: {currentEmpId}
                    </span>
                  </div>
                  
                  {/* Visual Dual-Identity Subtitles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: tealAccent, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Briefcase size={12} />
                      <span>{currentCorporateTitle}</span>
                    </span>
                    <span style={{ color: textMuted, fontSize: '11px' }}>•</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: textMuted }}>
                      {currentDept}
                    </span>
                  </div>
                </div>
              </div>

              {/* Institution Tag */}
              <div
                style={{
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '6.5px', height: '6.5px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>حساب مؤسسي معتمد نشط</span>
              </div>
            </div>

            {/* 3. Modal Body: Divided into Two Distinct Architectural Sections */}
            <div
              style={{
                padding: '22px',
                overflowY: 'auto',
                flex: 1
              }}
            >
              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: textMuted }}>
                  <RefreshCw size={22} className="animate-spin" style={{ margin: '0 auto 10px', color: tealAccent }} />
                  <p style={{ fontSize: '13px', fontWeight: 700 }}>جارٍ استرجاع بيانات السجل الوظيفي من قاعدة البيانات...</p>
                </div>
              ) : isEditing ? (
                /* Clean Edit Form for Corporate Identity */
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: isDark ? 'rgba(19, 93, 121, 0.15)' : 'rgba(19, 93, 121, 0.08)',
                      border: '1px solid rgba(19, 93, 121, 0.25)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                  >
                    <Info size={16} color={tealAccent} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: isDark ? '#bae6fd' : '#075985', fontWeight: 600 }}>
                      <strong>تنبيه توحيد البيانات:</strong> الحقول أدناه تمثل <strong>الهوية المؤسسية الموحدة</strong> للموظف المعتمدة والمشتركة عبر كافة الأنظمة المساندة (نظام الجرد، Microsoft Entra ID، وغيرها). بينما يتم ضبط الصلاحيات والصفة في نظام TDS عبر لوحة التحكم المركزية.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                    {/* Full Name */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: textPrimary }}>
                        الاسم الكامل المعتمد
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          color: textPrimary,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Employee ID */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: textPrimary }}>
                        الرقم الوظيفي المؤسسي (Employee ID)
                      </label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                        placeholder="مثال: 1059"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          color: textPrimary,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Corporate Job Title */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: textPrimary }}>
                        المسمى الوظيفي المعتمد في المؤسسة
                      </label>
                      <input
                        type="text"
                        value={formData.jobTitle}
                        onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                        placeholder="مثال: مهندس اتصالات أول"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          color: textPrimary,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Mobile Phone */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: textPrimary }}>
                        رقم الهاتف المحمول المؤسسي
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="0910000000"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          color: textPrimary,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Business Phone (Landline & Ext) */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: textPrimary }}>
                        الهاتف المكتبي والتحويلة الداخلية
                      </label>
                      <input
                        type="text"
                        value={formData.businessPhone}
                        onChange={e => setFormData({ ...formData, businessPhone: e.target.value })}
                        placeholder="021-3600000 تحويلة 104"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          color: textPrimary,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Office Location */}
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '5px', color: textPrimary }}>
                        المقر والموقع المكتبي
                      </label>
                      <input
                        type="text"
                        value={formData.officeLocation}
                        onChange={e => setFormData({ ...formData, officeLocation: e.target.value })}
                        placeholder="المقر الرئيسي، الطابق الثاني"
                        style={{
                          width: '100%',
                          height: '40px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          color: textPrimary,
                          fontSize: '12.5px',
                          fontWeight: 600,
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* Form Footer */}
                  <div 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: '8px', 
                      marginTop: '10px', 
                      paddingTop: '16px', 
                      borderTop: borderSubtle 
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      style={{
                        height: '38px',
                        padding: '0 18px',
                        borderRadius: '8px',
                        border: borderSubtle,
                        backgroundColor: 'transparent',
                        color: textMuted,
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      إلغاء التعديل
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      style={{
                        height: '38px',
                        padding: '0 22px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: tealAccent,
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <span>{isSaving ? 'جارٍ الحفظ والاعتماد...' : 'حفظ السجل المؤسسي'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* ── DUAL ARCHITECTURE DISPLAY: Institutional vs TDS System ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                  
                  {/* ══════════════════════════════════════════════════════════
                      BLOCK 1: الهوية والبيانات الوظيفية المؤسسية (CROSS-SYSTEM)
                      ══════════════════════════════════════════════════════════ */}
                  <div
                    style={{
                      borderRadius: '14px',
                      backgroundColor: isDark ? '#0d1322' : '#f8fafc',
                      border: isDark ? '1px solid rgba(19, 93, 121, 0.25)' : '1px solid rgba(19, 93, 121, 0.15)',
                      padding: '16px 18px',
                      boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    {/* Block 1 Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(19, 93, 121, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Globe size={16} color={tealAccent} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: textPrimary }}>
                            1. الهوية والبيانات الوظيفية المؤسسية (Corporate Identity)
                          </h4>
                          <span style={{ fontSize: '11px', color: textMuted, fontWeight: 500 }}>
                            السجل المؤسسي المعتمد والموحد المشترك بين كافة الأنظمة المساندة و Microsoft Entra ID
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: isDark ? 'rgba(19, 93, 121, 0.2)' : 'rgba(19, 93, 121, 0.08)',
                          border: '1px solid rgba(19, 93, 121, 0.3)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: isDark ? '#38bdf8' : tealAccent,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <FileCheck2 size={12} />
                        <span>بيانات موحدة مركزياً</span>
                      </div>
                    </div>

                    {/* Block 1 Grid (2x4) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
                      {/* 1. Official Corporate Job Title */}
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#ffffff', border: borderSubtle }}>
                        <span style={{ fontSize: '10.5px', color: textMuted, fontWeight: 600 }}>المسمى الوظيفي المعتمد في المؤسسة</span>
                        <p style={{ margin: '3px 0 0', fontSize: '13px', fontWeight: 800, color: textPrimary }}>
                          {currentCorporateTitle}
                        </p>
                      </div>

                      {/* 2. Employee ID */}
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#ffffff', border: borderSubtle }}>
                        <span style={{ fontSize: '10.5px', color: textMuted, fontWeight: 600 }}>الرقم الوظيفي المؤسسي الموحد</span>
                        <p style={{ margin: '3px 0 0', fontSize: '13px', fontWeight: 800, color: orangeAccent, fontFamily: 'monospace' }}>
                          {currentEmpId}
                        </p>
                      </div>

                      {/* 3. Directorate & Department */}
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#ffffff', border: borderSubtle }}>
                        <span style={{ fontSize: '10.5px', color: textMuted, fontWeight: 600 }}>الإدارة العامة والقسم</span>
                        <p style={{ margin: '3px 0 0', fontSize: '12.5px', fontWeight: 700, color: textPrimary }}>
                          {currentDept}
                        </p>
                      </div>

                      {/* 4. Official Corporate Email */}
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#ffffff', border: borderSubtle }}>
                        <span style={{ fontSize: '10.5px', color: textMuted, fontWeight: 600 }}>البريد المؤسسي الرسمي (Microsoft)</span>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 700, color: tealAccent, wordBreak: 'break-all' }}>
                          {currentEmail}
                        </p>
                      </div>

                      {/* 5. Mobile Phone */}
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#ffffff', border: borderSubtle }}>
                        <span style={{ fontSize: '10.5px', color: textMuted, fontWeight: 600 }}>رقم الهاتف المحمول</span>
                        <p style={{ margin: '3px 0 0', fontSize: '12.5px', fontWeight: 700, color: textPrimary, fontFamily: 'monospace' }}>
                          {currentPhone}
                        </p>
                      </div>

                      {/* 6. Business Landline & Extension */}
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#ffffff', border: borderSubtle }}>
                        <span style={{ fontSize: '10.5px', color: textMuted, fontWeight: 600 }}>الهاتف الأرضي والتحويلة</span>
                        <p style={{ margin: '3px 0 0', fontSize: '12.5px', fontWeight: 700, color: textPrimary }}>
                          {currentLandline}
                        </p>
                      </div>

                      {/* 7. Office Location */}
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#ffffff', border: borderSubtle }}>
                        <span style={{ fontSize: '10.5px', color: textMuted, fontWeight: 600 }}>الموقع والمكتب والمقر</span>
                        <p style={{ margin: '3px 0 0', fontSize: '12px', fontWeight: 700, color: textPrimary }}>
                          {currentLocation} • {currentCity}
                        </p>
                      </div>

                      {/* 8. Institutional Entity */}
                      <div style={{ padding: '10px 12px', borderRadius: '8px', backgroundColor: isDark ? '#111827' : '#ffffff', border: borderSubtle }}>
                        <span style={{ fontSize: '10.5px', color: textMuted, fontWeight: 600 }}>جهة العمل والتبعية</span>
                        <p style={{ margin: '3px 0 0', fontSize: '11.5px', fontWeight: 700, color: textMuted }}>
                          {currentCompany}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ══════════════════════════════════════════════════════════
                      BLOCK 2: الصفة والصلاحيات التشغيلية (خاص بنظام NEXUS TDS)
                      ══════════════════════════════════════════════════════════ */}
                  <div
                    style={{
                      borderRadius: '14px',
                      backgroundColor: isDark ? '#0d1322' : '#f8fafc',
                      border: isDark ? '1px solid rgba(243, 108, 33, 0.25)' : '1px solid rgba(243, 108, 33, 0.2)',
                      padding: '16px 18px',
                      boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    {/* Block 2 Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '7px', backgroundColor: 'rgba(243, 108, 33, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Shield size={16} color={orangeAccent} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: textPrimary }}>
                            2. الصفة والصلاحيات التشغيلية (NEXUS TDS Operations Role)
                          </h4>
                          <span style={{ fontSize: '11px', color: textMuted, fontWeight: 500 }}>
                            تحدد الصلاحيات الميدانية لإدارة ومعالجة التذاكر ومسارات العمل داخل نظام TDS حصراً
                          </span>
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: isDark ? 'rgba(243, 108, 33, 0.15)' : 'rgba(243, 108, 33, 0.08)',
                          border: '1px solid rgba(243, 108, 33, 0.3)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: orangeAccent,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Sliders size={12} />
                        <span>خاص بنظام TDS</span>
                      </div>
                    </div>

                    {/* Operational Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                      {/* System Role Card */}
                      <div 
                        style={{ 
                          padding: '14px', 
                          borderRadius: '10px', 
                          backgroundColor: isDark ? '#111827' : '#ffffff', 
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: textMuted }}>الدور والصلاحية في النظام</span>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor: isDark ? 'rgba(243, 108, 33, 0.15)' : 'rgba(243, 108, 33, 0.1)',
                              color: currentSystemConfig.color,
                              border: `1px solid ${currentSystemConfig.color}40`
                            }}
                          >
                            {currentSystemConfig.badge}
                          </span>
                        </div>
                        <h5 style={{ margin: '2px 0 0', fontSize: '14px', fontWeight: 800, color: currentSystemConfig.color }}>
                          {currentSystemConfig.label}
                        </h5>
                        <p style={{ margin: 0, fontSize: '11.5px', lineHeight: 1.5, color: textMuted }}>
                          {currentSystemConfig.desc}
                        </p>
                      </div>

                      {/* Operational Teams & Queues */}
                      <div 
                        style={{ 
                          padding: '14px', 
                          borderRadius: '10px', 
                          backgroundColor: isDark ? '#111827' : '#ffffff', 
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 700, color: textMuted }}>فرق وقنوات المعالجة المسندة</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                          {assignedTeams.map((tName: string, i: number) => (
                            <span
                              key={i}
                              style={{
                                padding: '3px 9px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isDark ? 'rgba(19, 93, 121, 0.2)' : 'rgba(19, 93, 121, 0.08)',
                                color: isDark ? '#38bdf8' : tealAccent,
                                border: '1px solid rgba(19, 93, 121, 0.25)'
                              }}
                            >
                              {tName}
                            </span>
                          ))}
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: textMuted }}>
                          مخوّل بتلقي الإشعارات الفورية وسحب التذاكر ضمن هذه القنوات.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* 4. Modal Bottom Bar */}
            <div
              style={{
                padding: '12px 22px',
                borderTop: borderSubtle,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: isDark ? '#0d1322' : '#f8fafc',
                flexShrink: 0
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: textMuted }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span>إصدار الهوية الموحدة v43.6 • NEXUS Single Sign-On Ready</span>
              </div>

              <button
                type="button"
                onClick={handleClose}
                style={{
                  height: '32px',
                  padding: '0 16px',
                  borderRadius: '6px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: textPrimary,
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ExecutiveProfileInspectionModal;
