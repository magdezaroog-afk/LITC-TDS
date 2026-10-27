import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Laptop, Monitor, Printer, Wifi, Server, Search, AlertTriangle,
  CheckCircle2, HelpCircle, PlusCircle, History, Info, RefreshCw, X, ShieldAlert
} from 'lucide-react';
import { OpsAPI } from '../../services/ops.api';

export interface SelectedAssetInfo {
  assetId?: string;
  assetName?: string;
  assetCategory?: string;
  isUnregisteredAsset?: boolean;
  isUserUnableToIdentify?: boolean;
}

interface AssetInventorySelectorProps {
  darkMode?: boolean;
  flowColor?: string;
  userEmail?: string;
  departmentName?: string;
  value?: SelectedAssetInfo;
  onChange: (assetInfo: SelectedAssetInfo) => void;
}

export const AssetInventorySelector: React.FC<AssetInventorySelectorProps> = ({
  darkMode = true,
  flowColor = '#135d79',
  userEmail,
  departmentName,
  value = {},
  onChange
}) => {
  const [activeTab, setActiveTab] = useState<'MY_DEVICES' | 'SHARED' | 'SEARCH'>('MY_DEVICES');
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom manual input for unregistered device
  const [manualDeviceName, setManualDeviceName] = useState(value.assetName || '');
  const [manualDeviceCategory, setManualDeviceCategory] = useState(value.assetCategory || 'حاسوب مكتبي / محمول');

  // Maintenance history inspection modal
  const [inspectingHistoryAssetId, setInspectingHistoryAssetId] = useState<string | null>(null);
  const [assetHistoryLogs, setAssetHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch devices based on current tab
  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      let params: any = {};
      if (activeTab === 'MY_DEVICES') {
        params.userOnly = true;
      } else if (activeTab === 'SHARED') {
        params.department = departmentName || '';
        params.type = 'SHARED';
      } else if (activeTab === 'SEARCH' && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const res = await OpsAPI.getInventoryDevices(params);
      if (res.isOffline) {
        setIsOffline(true);
        setOfflineMessage(res.message || 'منظومة جرد الأصول غير متصلة بالشبكة حالياً.');
        setDevices([]);
      } else {
        setIsOffline(false);
        setDevices(Array.isArray(res.devices) ? res.devices : []);
      }
    } catch {
      setIsOffline(true);
      setOfflineMessage('تعذر الاتصال اللحظي بخدمة جرد الأصول. يمكنك الاستمرار يدوياً.');
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [activeTab]);

  // Load maintenance history for a specific device
  const handleViewHistory = async (assetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setInspectingHistoryAssetId(assetId);
    setIsLoadingHistory(true);
    try {
      const res = await OpsAPI.getAssetMaintenanceHistory(assetId, true);
      setAssetHistoryLogs(res.history || []);
    } catch {
      setAssetHistoryLogs([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const getDeviceIcon = (type?: string, name?: string) => {
    const blob = `${type || ''} ${name || ''}`.toLowerCase();
    if (blob.includes('print') || blob.includes('طابع')) return <Printer size={16} />;
    if (blob.includes('screen') || blob.includes('شاش')) return <Monitor size={16} />;
    if (blob.includes('switch') || blob.includes('router') || blob.includes('شبك')) return <Wifi size={16} />;
    if (blob.includes('server') || blob.includes('خادم')) return <Server size={16} />;
    return <Laptop size={16} />;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        boxSizing: 'border-box',
        direction: 'rtl'
      }}
    >
      {/* Header with Title and Mode Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '7px',
              backgroundColor: `${flowColor}20`,
              color: flowColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Laptop size={15} />
          </div>
          <span style={{ fontSize: '12.5px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
            تحديد الجهاز المرتبط بالطلب (منظومة جرد الأصول):
          </span>
        </div>

        {isOffline ? (
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.14)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <ShieldAlert size={12} />
            <span>الجرد غير متصل (متاح الإدخال اليدوي)</span>
          </span>
        ) : (
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              color: '#10b981',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CheckCircle2 size={12} />
            <span>ربط حي ومباشر مع الأصول</span>
          </span>
        )}
      </div>

      {/* Tabs Switcher */}
      {!isOffline && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '4px',
            borderRadius: '10px',
            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.6)' : '#f1f5f9',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('MY_DEVICES')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeTab === 'MY_DEVICES' ? 800 : 600,
              backgroundColor: activeTab === 'MY_DEVICES' ? flowColor : 'transparent',
              color: activeTab === 'MY_DEVICES' ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Laptop size={13} />
            <span>أجهزتي المخصصة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SHARED')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeTab === 'SHARED' ? 800 : 600,
              backgroundColor: activeTab === 'SHARED' ? flowColor : 'transparent',
              color: activeTab === 'SHARED' ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Printer size={13} />
            <span>أجهزة القسم المشتركة</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SEARCH')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: '7px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: activeTab === 'SEARCH' ? 800 : 600,
              backgroundColor: activeTab === 'SEARCH' ? flowColor : 'transparent',
              color: activeTab === 'SEARCH' ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <Search size={13} />
            <span>بحث في كامل الجرد</span>
          </button>
        </div>
      )}

      {/* Search Input if in SEARCH Tab */}
      {activeTab === 'SEARCH' && !isOffline && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchDevices()}
            placeholder="اكتب رقم الأصل (Asset Tag) أو السيريال أو اسم الموديل..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
              backgroundColor: darkMode ? '#1e293b' : '#ffffff',
              color: darkMode ? '#ffffff' : '#0f172a',
              fontSize: '11.5px',
              outline: 'none',
              fontFamily: "'Cairo', sans-serif"
            }}
          />
          <button
            type="button"
            onClick={fetchDevices}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: flowColor,
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            بحث
          </button>
        </div>
      )}

      {/* Device List or Fallback Message */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '8px',
          maxHeight: '220px',
          overflowY: 'auto',
          padding: '2px'
        }}
      >
        {isLoading ? (
          <div style={{ gridColumn: '1 / -1', padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
            جاري استعلام الأجهزة من المنظومة...
          </div>
        ) : isOffline ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.08)' : '#fee2e2',
              border: darkMode ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #fca5a5',
              fontSize: '11px',
              color: darkMode ? '#fca5a5' : '#b91c1c',
              lineHeight: 1.6
            }}
          >
            {offlineMessage}
          </div>
        ) : devices.length === 0 ? (
          <div
            style={{
              gridColumn: '1 / -1',
              padding: '16px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '11.5px',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
              borderRadius: '8px',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0'
            }}
          >
            لا توجد أجهزة مسجلة في هذا التبويب حالياً.
          </div>
        ) : (
          devices.map((dev: any) => {
            const devId = String(dev.assetTag || dev.id || dev.serialNumber || '');
            const devName = dev.name || dev.model || dev.deviceType || 'جهاز تقني';
            const isSelected = value.assetId === devId && !value.isUnregisteredAsset && !value.isUserUnableToIdentify;

            return (
              <div
                key={devId}
                onClick={() => {
                  onChange({
                    assetId: devId,
                    assetName: devName,
                    assetCategory: dev.deviceType || dev.category || 'IT_HARDWARE',
                    isUnregisteredAsset: false,
                    isUserUnableToIdentify: false
                  });
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: isSelected
                    ? (darkMode ? `${flowColor}25` : `${flowColor}15`)
                    : (darkMode ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
                  border: isSelected
                    ? `1.5px solid ${flowColor}`
                    : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'all 0.18s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: isSelected ? flowColor : '#94a3b8' }}>
                      {getDeviceIcon(dev.deviceType, devName)}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                      {dev.assetTag || devId}
                    </span>
                  </div>
                  {isSelected && <CheckCircle2 size={14} color={flowColor} />}
                </div>

                <div style={{ fontSize: '10.5px', color: darkMode ? '#cbd5e1' : '#334155', fontWeight: 600 }}>
                  {devName}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                    {dev.location || dev.office || 'المقر الرئيسي'}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => handleViewHistory(devId, e)}
                    title="عرض سجل الصيانة التاريخي لهذا الجهاز"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: flowColor,
                      cursor: 'pointer',
                      fontSize: '9.5px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}
                  >
                    <History size={10} />
                    <span>سجل الصيانة</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alternative Options: Unregistered Device & Unqualified Requester */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '8px',
          marginTop: '4px'
        }}
      >
        {/* Option 1: Unregistered Device */}
        <div
          onClick={() => {
            onChange({
              assetId: '',
              assetName: manualDeviceName || 'جهاز جديد غير مسجل',
              assetCategory: manualDeviceCategory,
              isUnregisteredAsset: true,
              isUserUnableToIdentify: false
            });
          }}
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            backgroundColor: value.isUnregisteredAsset
              ? (darkMode ? 'rgba(243, 108, 33, 0.15)' : 'rgba(243, 108, 33, 0.1)')
              : (darkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
            border: value.isUnregisteredAsset
              ? '1.5px solid #f36c21'
              : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f36c21' }}>
              <PlusCircle size={15} />
              <span style={{ fontSize: '11.5px', fontWeight: 800 }}>جهاز جديد / غير مسجل بعد في الجرد</span>
            </div>
            {value.isUnregisteredAsset && <CheckCircle2 size={14} color="#f36c21" />}
          </div>
          <span style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            اختر هذا الخيار إذا كان الجهاز جديداً ولم يوضع عليه ملصق الأصل بعد. سيتم قيد إغلاق التذكرة لحين تسجيله.
          </span>

          {value.isUnregisteredAsset && (
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                type="text"
                value={manualDeviceName}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  setManualDeviceName(e.target.value);
                  onChange({
                    assetId: '',
                    assetName: e.target.value,
                    assetCategory: manualDeviceCategory,
                    isUnregisteredAsset: true,
                    isUserUnableToIdentify: false
                  });
                }}
                placeholder="اكتب اسم أو موديل الجهاز التقريبي..."
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
                  backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                  color: darkMode ? '#ffffff' : '#0f172a',
                  fontSize: '11px',
                  outline: 'none',
                  fontFamily: "'Cairo', sans-serif"
                }}
              />
            </div>
          )}
        </div>

        {/* Option 2: Unable to Identify */}
        <div
          onClick={() => {
            onChange({
              assetId: '',
              assetName: 'غير محدد من الموظف',
              assetCategory: 'UNSPECIFIED',
              isUnregisteredAsset: false,
              isUserUnableToIdentify: true
            });
          }}
          style={{
            padding: '10px 12px',
            borderRadius: '10px',
            backgroundColor: value.isUserUnableToIdentify
              ? (darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.1)')
              : (darkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc'),
            border: value.isUserUnableToIdentify
              ? '1.5px solid #38bdf8'
              : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
              <HelpCircle size={15} />
              <span style={{ fontSize: '11.5px', fontWeight: 800 }}>لا أعرف نوع الجهاز / غير مؤهل لتحديده</span>
            </div>
            {value.isUserUnableToIdentify && <CheckCircle2 size={14} color="#38bdf8" />}
          </div>
          <span style={{ fontSize: '9.5px', color: '#94a3b8', lineHeight: 1.5 }}>
            لا داعي للقلق؛ سيقوم مهندس الدعم الفني بالمعاينة الميدانية وتحديد الجهاز وربطه رسمياً قبل إنهاء الطلب.
          </span>
        </div>
      </div>

      {/* Maintenance History Modal / Popover */}
      <AnimatePresence>
        {inspectingHistoryAssetId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(3, 7, 18, 0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 110000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%',
                maxWidth: '520px',
                backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                borderRadius: '16px',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                padding: '18px 20px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                direction: 'rtl'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <History size={16} color={flowColor} />
                  <span style={{ fontSize: '13px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                    سجل الصيانة التاريخي: {inspectingHistoryAssetId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingHistoryAssetId(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isLoadingHistory ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                    جاري جلب سجلات الصيانة السابقة...
                  </div>
                ) : assetHistoryLogs.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '11px' }}>
                    لا توجد أعمال صيانة مسجلة مسبقاً لهذا الجهاز.
                  </div>
                ) : (
                  assetHistoryLogs.map((log: any) => (
                    <div
                      key={log.ticketId}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                        fontSize: '11px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                          تذكرة #{log.ticketId} - {log.title}
                        </span>
                        <span style={{ fontSize: '9.5px', color: '#64748b' }}>
                          {new Date(log.closedAt).toLocaleDateString('ar-LY')}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#475569' }}>
                        {log.resolutionNotes}
                      </div>
                      <div style={{ fontSize: '9.5px', color: flowColor, fontWeight: 700 }}>
                        بواسطة: {log.technician}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                onClick={() => setInspectingHistoryAssetId(null)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: flowColor,
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  cursor: 'pointer'
                }}
              >
                إغلاق النافذة
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
