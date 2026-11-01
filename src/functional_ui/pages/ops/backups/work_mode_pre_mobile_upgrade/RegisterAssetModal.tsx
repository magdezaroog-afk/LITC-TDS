import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, CheckCircle2, AlertCircle, Laptop, 
  Printer, Server, Wifi, Cpu, ShieldCheck, Sparkles, Building, Hash, FileText
} from 'lucide-react';
import { opsApi } from '../../../services/ops.api';

interface RegisterAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  ticket: {
    id: number;
    title?: string;
    creator?: {
      fullName?: string;
      email?: string;
      department?: { name?: string };
    };
    routingMetadata?: any;
  } | null;
  onSuccess?: (asset: any, updatedTicket?: any) => void;
  onAssetRegistered?: (asset: any) => void;
}

const ASSET_CATEGORIES = [
  { id: 'PRINTER', name: 'طابعة ومسح ضوئي', icon: Printer, color: '#f59e0b' },
  { id: 'LAPTOP', name: 'حاسوب محمول (Laptop)', icon: Laptop, color: '#3b82f6' },
  { id: 'PC', name: 'حاسوب مكتبي وشاشة', icon: Cpu, color: '#10b981' },
  { id: 'SERVER', name: 'خادم أو تجهيزات مركزية', icon: Server, color: '#8b5cf6' },
  { id: 'NETWORK', name: 'جهاز شبكة وراوتر', icon: Wifi, color: '#06b6d4' },
  { id: 'OTHER', name: 'أصل تقني آخر', icon: Sparkles, color: '#64748b' }
];

export const RegisterAssetModal: React.FC<RegisterAssetModalProps> = ({
  isOpen,
  onClose,
  isDark = true,
  ticket,
  onSuccess,
  onAssetRegistered
}) => {
  const [category, setCategory] = useState('PRINTER');
  const [name, setName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [location, setLocation] = useState('');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('يرجى إدخال اسم أو مسمى الجهاز التقني.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await opsApi.registerInventoryDevice({
        assetName: name.trim(),
        assetCategory: category,
        serialNumber: serialNumber.trim() || undefined,
        model: model.trim() || undefined,
        location: location.trim() || undefined,
        assignedToEmail: ticket.creator?.email || undefined,
        department: ticket.creator?.department?.name || undefined,
        ticketId: ticket.id,
        maintenanceNotes: maintenanceNotes.trim() || undefined
      });

      if (res && res.success) {
        if (onSuccess) {
          onSuccess(res.asset, res.ticket || {
            id: ticket.id,
            assetId: res.asset?.assetId,
            assetName: res.asset?.name,
            assetCategory: res.asset?.category
          });
        }
        if (onAssetRegistered) {
          onAssetRegistered(res.asset);
        }
        onClose();
      } else {
        setErrorMsg(res?.error || 'فشل تسجيل الجهاز كأصل رسمي.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'تعذر الاتصال بمنظومة جرد الأصول.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        dir="rtl"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 14 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%',
            maxWidth: '680px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(226, 232, 240, 0.8)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #135d79 0%, #0d465c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(19, 93, 121, 0.3)',
                }}
              >
                <Plus size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a', fontFamily: "'Cairo', sans-serif" }}>
                  تسجيل جهاز جديد في منظومة جرد الأصول
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontFamily: "'Cairo', sans-serif" }}>
                  إدراج الأصل كمرجع دائم للطلب #{ticket.id} وفك قيد الإغلاق تلقائياً
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#e2e8f0',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {errorMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600
                }}
              >
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Category Grid */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                نوع الأصل التقني <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {ASSET_CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '12px',
                        border: isSelected ? `2px solid ${cat.color}` : '1.5px solid #e2e8f0',
                        backgroundColor: isSelected ? `${cat.color}15` : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        textAlign: 'right'
                      }}
                    >
                      <Icon size={18} color={cat.color} />
                      <span style={{ fontSize: '12px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0f172a' : '#475569' }}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name & Serial */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  اسم ومسمى الأصل <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: طابعة مكتب الدور الثاني"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  الرقم التسلسلي (Serial / Barcode)
                </label>
                <input
                  type="text"
                  placeholder="مثال: SN-HP-2026-99"
                  value={serialNumber}
                  onChange={e => setSerialNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Model & Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  الموديل والطراز (Model / Brand)
                </label>
                <input
                  type="text"
                  placeholder="مثال: HP LaserJet Pro M404"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  الموقع والمبنى (Location)
                </label>
                <input
                  type="text"
                  placeholder="مثال: مبنى الإدارة - الطابق 2 - مكتب 204"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Initial Maintenance Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                مذكرة الصيانة الأولية وسجل التدخل
              </label>
              <textarea
                rows={3}
                placeholder="بيان الأعمال المنجزة لتسجيلها بسجل تاريخ الجهاز في منظومة الجرد..."
                value={maintenanceNotes}
                onChange={e => setMaintenanceNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: "'Cairo', sans-serif"
                }}
              />
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #135d79 0%, #0d465c 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(19, 93, 121, 0.3)'
                }}
              >
                {isSubmitting ? (
                  <span>جارٍ التسجيل في جرد الأصول...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>حفظ وتسجيل كأصل رسمي</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
