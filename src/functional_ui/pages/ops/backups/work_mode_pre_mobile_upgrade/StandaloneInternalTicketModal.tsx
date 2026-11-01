import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitPullRequest, X, RefreshCw, Send, Building2, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../engine/auth/AuthContext';

interface StandaloneInternalTicketModalProps {
  isOpen: boolean;
  departments: any[];
  isDark?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StandaloneInternalTicketModal: React.FC<StandaloneInternalTicketModalProps> = ({
  isOpen,
  departments,
  isDark = true,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDeptId, setTargetDeptId] = useState<number | null>(departments[0]?.id || null);
  const [internalScope, setInternalScope] = useState<'TEAM' | 'DEPARTMENT' | 'CROSS_DEPT'>('TEAM');
  const [priority, setPriority] = useState('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('عنوان الطلب الداخلي مطلوب');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('تفاصيل المهمة أو الطلب الداخلي مطلوبة');
      return;
    }
    if (!targetDeptId) {
      setErrorMsg('يرجى تحديد الجهة أو القسم المستهدف');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('nexus_token') || localStorage.getItem('litc_token') || sessionStorage.getItem('nexus_token') || localStorage.getItem('token');
      const targetDeptObj = departments.find(d => Number(d.id) === Number(targetDeptId));

      const res = await fetch('/api/v1/functional/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          routeId: 'internal_ops_flow',
          flowDefinitionId: 'internal_ops_flow',
          title: `[طلب داخلي] ${title.trim()}`,
          description: description.trim(),
          departmentId: targetDeptId,
          targetDepartmentName: targetDeptObj?.name || 'القسم المستهدف',
          priority,
          isInternalRequest: true,
          internalScope,
          fields: {
            isInternalRequest: true,
            internalScope,
            openedByRole: user?.role || 'OPERATIONAL'
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setTitle('');
        setDescription('');
        onSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || data.message || 'فشل إرسال الطلب الداخلي.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'تعذر الاتصال بالخادم المركزي.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 120000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        direction: 'rtl',
        fontFamily: "'Cairo', 'Tajawal', sans-serif"
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        style={{
          width: '100%',
          maxWidth: '580px',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderRadius: '20px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(126, 34, 206, 0.2)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <GitPullRequest size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900, color: isDark ? '#f8fafc' : '#0f172a' }}>
                إنشاء طلب داخلي مستقل جديد
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                إرسال مهمة أو طلب بين الفرق والأقسام التشغيلية دون الارتباط بتذكرة واردة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid #ef4444',
              color: '#ef4444',
              fontSize: '11.5px'
            }}
          >
            {errorMsg}
          </div>
        )}

        {/* Scope Selector */}
        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '6px' }}>
            نطاق الطلب الداخلي:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { id: 'TEAM', label: 'ضمن الفريق نفسه', desc: 'مهام الزملاء' },
              { id: 'DEPARTMENT', label: 'بين أقسام الإدارة', desc: 'داخل نفس الإدارة' },
              { id: 'CROSS_DEPT', label: 'عابر للإدارات', desc: 'إلى إدارة أخرى' }
            ].map((sc) => (
              <button
                key={sc.id}
                type="button"
                onClick={() => setInternalScope(sc.id as any)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '10px',
                  border: internalScope === sc.id ? '2px solid #a855f7' : (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #cbd5e1'),
                  backgroundColor: internalScope === sc.id ? (isDark ? 'rgba(126, 34, 206, 0.2)' : '#f3e8ff') : 'transparent',
                  color: internalScope === sc.id ? (isDark ? '#c084fc' : '#7e22ce') : (isDark ? '#cbd5e1' : '#64748b'),
                  cursor: 'pointer',
                  textAlign: 'right',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 800 }}>{sc.label}</div>
                <div style={{ fontSize: '9.5px', opacity: 0.8 }}>{sc.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '4px' }}>
              عنوان الطلب الداخلي *:
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: مراجعة إعدادات المحول الرئيسي / طلب إفادة فنية"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '4px' }}>
                الجهة المستهدفة *:
              </label>
              <select
                value={targetDeptId || ''}
                onChange={(e) => setTargetDeptId(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '4px' }}>
                الأولوية التشغيلية:
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontSize: '12px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="LOW">منخفضة</option>
                <option value="MEDIUM">متوسطة (عادية)</option>
                <option value="HIGH">عالية</option>
                <option value="CRITICAL">حرجة / عاجلة جداً</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '4px' }}>
              تفاصيل العمل والمخرجات المطلوبة *:
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اكتب بوضوح المهام والمخرجات المطلوبة من الفريق المستلم..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #cbd5e1',
                backgroundColor: 'transparent',
                color: isDark ? '#cbd5e1' : '#64748b',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#7e22ce',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(126, 34, 206, 0.35)'
              }}
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>إرسال الطلب الداخلي</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
