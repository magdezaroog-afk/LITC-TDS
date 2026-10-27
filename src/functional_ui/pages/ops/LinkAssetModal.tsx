import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Laptop, Search, CheckCircle2, X, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { OpsAPI } from '../../../services/ops.api';

interface LinkAssetModalProps {
  isOpen: boolean;
  ticketId: number;
  ticketTitle: string;
  isDark?: boolean;
  onClose: () => void;
  onSuccess: (updatedTicket: any) => void;
}

export const LinkAssetModal: React.FC<LinkAssetModalProps> = ({
  isOpen,
  ticketId,
  ticketTitle,
  isDark = true,
  onClose,
  onSuccess
}) => {
  const [assetTag, setAssetTag] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('حاسوب مكتبي / محمول');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSearchInventory = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setErrorMsg('');
    try {
      const res = await OpsAPI.getInventoryDevices({ search: searchQuery.trim() });
      if (res.isOffline) {
        setErrorMsg('منظومة جرد الأصول غير متصلة بالشبكة، يمكنك إدخال رقم الأصل أو اسم الجهاز يدوياً أدناه.');
        setSearchResults([]);
      } else {
        setSearchResults(res.devices || []);
      }
    } catch {
      setErrorMsg('تعذر البحث اللحظي في جرد الأصول، يرجى كتابة البيانات يدوياً.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDevice = (dev: any) => {
    setAssetTag(dev.assetTag || dev.id || dev.serialNumber || '');
    setAssetName(dev.name || dev.model || dev.deviceType || '');
    setAssetCategory(dev.deviceType || dev.category || 'IT_HARDWARE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetTag.trim()) {
      setErrorMsg('يرجى تحديد أو إدخال رقم الأصل (Asset Tag / Serial)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await OpsAPI.linkAssetToTicket({
        ticketId,
        assetId: assetTag.trim(),
        assetName: assetName.trim() || undefined,
        assetCategory: assetCategory.trim() || undefined
      });

      if (res.success) {
        onSuccess(res.ticket);
        onClose();
      } else {
        setErrorMsg(res.error || res.message || 'فشل ربط الأصل بالتذكرة.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في عملية الربط.');
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
          maxWidth: '560px',
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
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(19, 93, 121, 0.2)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Laptop size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                ربط وتحقيق الأصل التقني للتذكرة #{ticketId}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                {ticketTitle}
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

        {/* Notice */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: isDark ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff',
            border: isDark ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid #bae6fd',
            fontSize: '11.5px',
            color: isDark ? '#bae6fd' : '#0369a1',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldCheck size={16} style={{ flexShrink: 0 }} />
          <span>
            سيؤدي إتمام هذا الإجراء إلى ربط الجهاز بسجلات التذكرة، وفك قيد الإغلاق (Gated Resolution) ليتاح إغلاقها رسمياً.
          </span>
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

        {/* Search Bar in Live Inventory */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchInventory()}
            placeholder="ابحث في جرد الأصول برقم الأصل أو السيريال..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '10px',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: '11.5px',
              outline: 'none'
            }}
          />
          <button
            type="button"
            onClick={handleSearchInventory}
            disabled={isSearching}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: '#135d79',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '11.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isSearching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
            <span>بحث</span>
          </button>
        </div>

        {/* Search Results Preview */}
        {searchResults.length > 0 && (
          <div
            style={{
              maxHeight: '140px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              padding: '4px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(0,0,0,0.25)' : '#f8fafc',
              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #e2e8f0'
            }}
          >
            {searchResults.map((dev: any) => (
              <div
                key={dev.id || dev.assetTag}
                onClick={() => handleSelectDevice(dev)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                  border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px'
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, color: '#38bdf8' }}>{dev.assetTag || dev.id}</span>
                  <span style={{ margin: '0 8px', color: isDark ? '#cbd5e1' : '#334155' }}>{dev.name || dev.model}</span>
                </div>
                <button
                  type="button"
                  style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: '#135d79',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '10px',
                    fontWeight: 700
                  }}
                >
                  اختيار
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '4px' }}>
              رقم الأصل المعتمد (Asset Tag / Serial Number) * :
            </label>
            <input
              type="text"
              required
              value={assetTag}
              onChange={(e) => setAssetTag(e.target.value)}
              placeholder="مثال: AST-LITC-PC-042 أو رقم السيريال"
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
                اسم / موديل الجهاز:
              </label>
              <input
                type="text"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
                placeholder="Dell OptiPlex 7090"
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

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155', marginBottom: '4px' }}>
                تصنيف الأصل:
              </label>
              <select
                value={assetCategory}
                onChange={(e) => setAssetCategory(e.target.value)}
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
                <option value="حاسوب مكتبي / محمول">حاسوب مكتبي / محمول</option>
                <option value="طابعة / ماسح ضوئي">طابعة / ماسح ضوئي</option>
                <option value="شاشة عرض">شاشة عرض</option>
                <option value="معدات شبكة واتصالات">معدات شبكة واتصالات</option>
                <option value="خادم / تجهيزات غرفة العمليات">خادم / تجهيزات غرفة العمليات</option>
                <option value="ملحقات طرفية">ملحقات طرفية</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
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
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}
            >
              {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={15} />}
              <span>تأكيد الربط وفك قيد الإغلاق</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
