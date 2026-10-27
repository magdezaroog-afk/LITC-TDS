import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Search, RefreshCw, X, Laptop, User, Calendar, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { OpsAPI } from '../../../services/ops.api';

interface UnlinkedAssetsLedgerModalProps {
  isOpen: boolean;
  isDark?: boolean;
  onClose: () => void;
  onSelectTicketToLink: (ticket: any) => void;
}

export const UnlinkedAssetsLedgerModal: React.FC<UnlinkedAssetsLedgerModalProps> = ({
  isOpen,
  isDark = true,
  onClose,
  onSelectTicketToLink
}) => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchUnlinkedTickets = async () => {
    setIsLoading(true);
    try {
      const res = await OpsAPI.getUnlinkedRequestsLedger();
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch {
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUnlinkedTickets();
    }
  }, [isOpen]);

  const filteredTickets = tickets.filter(t => {
    const q = searchFilter.toLowerCase();
    const title = (t.title || '').toLowerCase();
    const creator = (t.creator?.fullName || '').toLowerCase();
    const dept = (t.departmentObj?.name || '').toLowerCase();
    const id = String(t.id);
    return title.includes(q) || creator.includes(q) || dept.includes(q) || id.includes(q);
  });

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.78)',
        backdropFilter: 'blur(12px)',
        zIndex: 110000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        direction: 'rtl',
        fontFamily: "'Cairo', 'Tajawal', sans-serif"
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderRadius: '24px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isDark ? 'rgba(245, 158, 11, 0.06)' : '#fffbeb'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldAlert size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900, color: isDark ? '#ffffff' : '#0f172a' }}>
                  السجل الرقابي للأصول غير المسجلة وغير المحددة
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff'
                  }}
                >
                  {tickets.length} طلب بحاجة لتدقيق
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                حصر كافة طلبات الموظفين التي لم يُحدد لها أصل أو سجلت كأجهزة جديدة لحين مطابقتها مع جرد الأصول
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div
          style={{
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9'
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={15} style={{ position: 'absolute', right: '12px', top: '10px', color: '#64748b' }} />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="تصفية بالموظف، التذكرة، أو الإدارة..."
              style={{
                width: '100%',
                padding: '8px 36px 8px 12px',
                borderRadius: '10px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="button"
            onClick={fetchUnlinkedTickets}
            disabled={isLoading}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
              color: isDark ? '#cbd5e1' : '#475569',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>تحديث السجل</span>
          </button>
        </div>

        {/* Content Table / Card List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {isLoading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#f59e0b' }} />
              <div>جاري جلب سجل الطلبات غير المحددة أصولها...</div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', color: '#10b981', fontSize: '13px' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 10px' }} />
              <div style={{ fontWeight: 800 }}>ممتاز! لا توجد طلبات معلقة بدون أصل محدد.</div>
              <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px' }}>
                كافة طلبات الصيانة مرتبطة ومحققة رسمياً في منظومة جرد الأصول.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filteredTickets.map((t) => (
                <div
                  key={t.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 900, color: '#f59e0b' }}>
                        #{t.id}
                      </span>
                      <span style={{ fontSize: '13.5px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                        {t.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '6px',
                          backgroundColor: t.isUserUnableToIdentify ? 'rgba(56, 189, 248, 0.15)' : 'rgba(243, 108, 33, 0.15)',
                          color: t.isUserUnableToIdentify ? '#38bdf8' : '#f36c21'
                        }}
                      >
                        {t.isUserUnableToIdentify ? 'الموظف غير قادر على التحديد' : 'جهاز جديد غير مسجل'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#64748b' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} />
                        <span>{t.creator?.fullName || 'موظف'} ({t.departmentObj?.name || 'الإدارة العامة'})</span>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} />
                        <span>{new Date(t.createdAt).toLocaleDateString('ar-LY')}</span>
                      </span>
                      {t.assetCategory && (
                        <span>• التصنيف المقترح: {t.assetCategory}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectTicketToLink(t);
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#10b981',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      <Laptop size={14} />
                      <span>ربط وتدقيق الأصل الآن 🔗</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
