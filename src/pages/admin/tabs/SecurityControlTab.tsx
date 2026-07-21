import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../../../engine/ui-loader/ThemeProvider';
import { EventBus } from '../../../engine/events/EventBus';

/* ── Apple Design Tokens ── */
const A = {
  text: '#1D1D1F',
  textSub: '#6E6E73',
  textTer: '#AEAEB2',
  surface: '#FFFFFF',
  bg: '#F5F5F7',
  sep: 'rgba(0,0,0,0.08)',
  radius: '14px',
  shadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)',
  blue: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  amber: '#FF9500',
  font: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif",
};

/* ── Shared Sub-components ── */
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: A.surface,
    borderRadius: A.radius,
    border: `1px solid ${A.sep}`,
    boxShadow: A.shadow,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    ...style
  }}>
    {children}
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode; subtitle?: string; color?: string }> = ({ children, subtitle, color = A.text }) => (
  <div>
    <h4 style={{ margin: '0', fontSize: '16px', fontWeight: '700', color, letterSpacing: '-0.2px', fontFamily: A.font }}>
      {children}
    </h4>
    {subtitle && (
      <p style={{ margin: '4px 0 0', fontSize: '13px', color: A.textSub }}>{subtitle}</p>
    )}
  </div>
);

const StatusIndicator: React.FC<{ status: 'healthy' | 'degraded' | 'critical' | 'loading' | 'archived' }> = ({ status }) => {
  const colors: Record<string, string> = {
    healthy: A.green,
    degraded: A.amber,
    critical: A.red,
    loading: A.textTer,
    archived: A.blue
  };
  return (
    <div style={{
      width: '10px', height: '10px', borderRadius: '50%',
      background: colors[status] || A.textTer,
      boxShadow: status === 'loading' || status === 'archived' ? 'none' : `0 0 6px ${colors[status]}80`,
      flexShrink: 0,
    }} />
  );
};

const ActionButton: React.FC<{ onClick: () => void; label: string; icon?: string; color?: string; loading?: boolean; }> = ({ onClick, label, icon, color = A.blue, loading }) => (
  <button onClick={onClick} disabled={loading} style={{
    background: `${color}15`,
    color: color,
    border: `1px solid ${color}25`,
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: loading ? 'wait' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s',
    opacity: loading ? 0.6 : 1,
  }}>
    {loading ? '⏳ جاري...' : <>{icon && <span>{icon}</span>}{label}</>}
  </button>
);

const MetricRow: React.FC<{ label: string; value: string; status: 'healthy'|'degraded'|'critical'; action?: React.ReactNode }> = ({ label, value, status, action }) => {
  const colors = { healthy: A.green, degraded: A.amber, critical: A.red };
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: A.bg, padding: '12px 16px', borderRadius: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <StatusIndicator status={status} />
        <span style={{ fontSize: '13px', fontWeight: '500', color: A.text }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '14px', fontWeight: '700', color: colors[status] }}>{value}</span>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
};

/* ── Main Component ── */
export const SecurityControlTab: React.FC = () => {
  const theme = useTheme();

  // Basic States
  const [latency, setLatency] = useState(120);
  const [cpu, setCpu] = useState(85);
  const [disk, setDisk] = useState(92);
  const [services, setServices] = useState({ smtp: { status: 'critical', latency: 400 }, storage: { status: 'healthy', latency: 15 }, sso: { status: 'healthy', latency: 30 } });
  const [load, setLoad] = useState({ activeUsers: 245, rps: 87 });
  const [errors, setErrors] = useState({ serverErrors: 2.4 });
  const [circuitState, setCircuitState] = useState<'CLOSED' | 'OPEN' | 'HALF-OPEN'>('CLOSED');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // --- Modal Visibility States ---
  const [showCacheInspector, setShowCacheInspector] = useState(false);
  const [showCpuInspector, setShowCpuInspector] = useState(false);
  const [showStorageInspector, setShowStorageInspector] = useState(false);

  // --- Cache Inspector State ---
  const [cacheGroups, setCacheGroups] = useState([
    { id: 'tickets', name: 'كاش التذاكر (Tickets)', size: '14.2 MB', status: 'active', details: [{ name: 'التذاكر المغلقة والأرشيف', size: '8.1 MB' }, { name: 'التذاكر المعلقة', size: '4.5 MB' }, { name: 'مصغرات المرفقات', size: '1.6 MB' }] },
    { id: 'structure', name: 'كاش الهيكلية الإدارية (Structure)', size: '3.8 MB', status: 'active', details: [{ name: 'شجرة الإدارات', size: '2.5 MB' }, { name: 'بيانات المباني', size: '1.3 MB' }] },
    { id: 'config', name: 'كاش الإعدادات (Config)', size: '1.1 MB', status: 'active', details: [{ name: 'صلاحيات المستخدمين', size: '0.8 MB' }, { name: 'إعدادات النظام الأساسية', size: '0.3 MB' }] },
  ]);
  const [selectedCacheGroups, setSelectedCacheGroups] = useState<string[]>([]);
  const [expandedCacheGroups, setExpandedCacheGroups] = useState<string[]>([]);
  const [isClearingCache, setIsClearingCache] = useState(false);

  // --- CPU Inspector State ---
  const [cpuProcesses, setCpuProcesses] = useState([
    { id: 'p1', name: 'توليد تقرير الأداء الشهري (Background)', status: 'running', cpuPercent: 45, timeElapsed: '12m 30s' },
    { id: 'p2', name: 'مزامنة دليل المستخدمين (AD Sync)', status: 'stuck', cpuPercent: 35, timeElapsed: '1h 14m' },
    { id: 'p3', name: 'إرسال طابور البريد (Batch Email)', status: 'running', cpuPercent: 5, timeElapsed: '2m 10s' }
  ]);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [isKillingProcess, setIsKillingProcess] = useState(false);

  // --- Storage & Archiving State ---
  const [storageItems, setStorageItems] = useState([
    { id: 's1', name: 'مرفقات التذاكر القديمة (> 6 أشهر)', size: '45.2 GB', type: 'archive', status: 'active' },
    { id: 's2', name: 'سجلات النظام المؤقتة (Logs)', size: '8.4 GB', type: 'temp', status: 'active' },
    { id: 's3', name: 'ملفات جلسات المستخدمين (Sessions)', size: '2.1 GB', type: 'temp', status: 'active' }
  ]);
  const [selectedStorage, setSelectedStorage] = useState<string[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);

  // --- Shared Handlers ---
  const executeAction = async (actionKey: string, onSuccess: () => void) => {
    setActionLoading(prev => ({ ...prev, [actionKey]: true }));
    try { await new Promise(res => setTimeout(res, 1500)); onSuccess(); setToast({ msg: `تم تنفيذ الإجراء بنجاح.`, type: 'success' }); } 
    catch (e) { setToast({ msg: `فشل التنفيذ.`, type: 'error' }); } 
    finally { setActionLoading(prev => ({ ...prev, [actionKey]: false })); setTimeout(() => setToast(null), 4000); }
  };

  // Cache Handlers
  const toggleCacheExpansion = (id: string) => setExpandedCacheGroups(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  const handleClearSelectedCache = async () => {
    if (selectedCacheGroups.length === 0) return;
    setIsClearingCache(true);
    await new Promise(res => setTimeout(res, 1500));
    setCacheGroups(prev => prev.map(g => selectedCacheGroups.includes(g.id) ? { ...g, size: '0.0 MB', status: 'cleared', details: g.details.map(d => ({...d, size: '0.0 MB'})) } : g));
    setLatency(prev => Math.max(45, prev - (selectedCacheGroups.length * 15)));
    setSelectedCacheGroups([]);
    setIsClearingCache(false);
    setToast({ msg: 'تم مسح الكاش المحدد بنجاح.', type: 'success' });
  };

  // CPU Handlers
  const handleKillProcesses = async () => {
    if (selectedProcesses.length === 0) return;
    setIsKillingProcess(true);
    await new Promise(res => setTimeout(res, 1500));
    const killedTotal = cpuProcesses.filter(p => selectedProcesses.includes(p.id)).reduce((acc, curr) => acc + curr.cpuPercent, 0);
    setCpuProcesses(prev => prev.map(p => selectedProcesses.includes(p.id) ? { ...p, status: 'killed', cpuPercent: 0 } : p));
    setCpu(prev => Math.max(5, prev - killedTotal));
    setSelectedProcesses([]);
    setIsKillingProcess(false);
    setToast({ msg: 'تم إنهاء المهام المحددة بنجاح وتخفيف حمل المعالج.', type: 'success' });
  };

  // Storage Handlers
  const handleStorageAction = async () => {
    if (selectedStorage.length === 0) return;
    setIsArchiving(true);
    await new Promise(res => setTimeout(res, 2000));
    
    // Determine if archiving or clearing temp
    setStorageItems(prev => prev.map(s => {
      if (selectedStorage.includes(s.id)) {
        if (s.type === 'archive') return { ...s, status: 'archived', size: '0.1 MB (Symlink)' };
        return { ...s, status: 'cleared', size: '0.0 MB' };
      }
      return s;
    }));
    
    setDisk(prev => Math.max(35, prev - (selectedStorage.length * 20)));
    setSelectedStorage([]);
    setIsArchiving(false);
    setToast({ msg: 'تم تنفيذ الأرشفة/التنظيف بنجاح.', type: 'success' });
  };

  const auditLogs = [
    { logId: 'LOG-001', action: 'مسح الذاكرة المؤقتة', reason: 'ارتفاع زمن الاستجابة (Latency)', timestamp: '2026-07-20 10:15:22' },
    { logId: 'LOG-002', action: 'إغلاق قاطع الدائرة (Circuit OPEN)', reason: 'ارتفاع الضغط (RPS > 200)', timestamp: '2026-07-19 23:10:05' },
  ];

  const ModalOverlay: React.FC<{children: React.ReactNode}> = ({children}) => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999
    }}>{children}</div>
  );

  return (
    <div style={{ fontFamily: A.font, color: A.text, maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
      
      {/* --- Advanced Cache Inspector Modal --- */}
      {showCacheInspector && (
        <ModalOverlay>
          <div style={{ background: A.surface, width: '550px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: A.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${A.sep}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: A.text, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>🔍 مفتش الذاكرة المؤقتة (Cache Inspector)</h3>
                <button onClick={() => setShowCacheInspector(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: A.textTer }}>×</button>
              </div>
              <p style={{ margin: 0, color: A.textSub, fontSize: '13px', lineHeight: '1.5' }}>حدد مجموعة البيانات المسببة للبطء لمسحها بشكل مخصص.</p>
            </div>
            
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cacheGroups.map(group => {
                  const isExpanded = expandedCacheGroups.includes(group.id);
                  const isSelected = selectedCacheGroups.includes(group.id);
                  const isCleared = group.status === 'cleared';
                  return (
                    <div key={group.id} style={{ background: A.bg, borderRadius: '10px', border: `1px solid ${isSelected ? A.blue : A.sep}`, overflow: 'hidden' }}>
                      <div onClick={() => toggleCacheExpansion(group.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer', opacity: isCleared ? 0.6 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <input type="checkbox" checked={isSelected} disabled={isCleared} onChange={(e) => { e.stopPropagation(); setSelectedCacheGroups(p => p.includes(group.id) ? p.filter(id => id !== group.id) : [...p, group.id]); }} />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: A.text }}>{isExpanded ? '▼' : '▶'} {group.name} {isCleared && <span style={{fontSize: '11px', color: A.green, background: `${A.green}15`, padding: '2px 6px', borderRadius: '4px'}}>تم المسح</span>}</div>
                            <div style={{ fontSize: '12px', color: A.textSub, marginTop: '4px' }}>المساحة: <strong>{group.size}</strong></div>
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ padding: '0 16px 12px 42px', borderTop: `1px solid ${A.sep}80`, background: `${A.surface}50` }}>
                          <div style={{ fontSize: '11px', color: A.textTer, marginBottom: '6px', marginTop: '8px', fontWeight: 'bold' }}>محتويات الكاش التفصيلية:</div>
                          {group.details.map((detail, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', color: A.textSub }}>
                              <span>• {detail.name}</span><span style={{ fontFamily: 'monospace' }}>{detail.size}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: A.bg, borderTop: `1px solid ${A.sep}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: A.textSub }}>محدد: <strong>{selectedCacheGroups.length}</strong></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowCacheInspector(false)} style={{ background: 'transparent', color: A.text, border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
                <button onClick={handleClearSelectedCache} disabled={selectedCacheGroups.length === 0 || isClearingCache} style={{ background: A.blue, color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: selectedCacheGroups.length === 0 || isClearingCache ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: selectedCacheGroups.length === 0 ? 0.5 : 1 }}>
                  {isClearingCache ? '⏳ جاري المسح...' : 'مسح المحدد'}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* --- CPU Process Inspector Modal --- */}
      {showCpuInspector && (
        <ModalOverlay>
          <div style={{ background: A.surface, width: '550px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: A.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${A.sep}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: A.text, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚡ مدير مهام السيرفر (CPU Tasks)</h3>
                <button onClick={() => setShowCpuInspector(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: A.textTer }}>×</button>
              </div>
              <p style={{ margin: 0, color: A.textSub, fontSize: '13px', lineHeight: '1.5' }}>حدد المهام التي تستهلك المعالج بشكل مفرط (Stuck Processes) لإنهائها دون إيقاف باقي النظام.</p>
            </div>
            
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cpuProcesses.map(proc => {
                  const isSelected = selectedProcesses.includes(proc.id);
                  const isKilled = proc.status === 'killed';
                  return (
                    <div key={proc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: A.bg, padding: '12px 16px', borderRadius: '10px', border: `1px solid ${isSelected ? A.red : A.sep}`, opacity: isKilled ? 0.5 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input type="checkbox" checked={isSelected} disabled={isKilled} onChange={() => setSelectedProcesses(p => p.includes(proc.id) ? p.filter(id => id !== proc.id) : [...p, proc.id])} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: A.text }}>{proc.name}</div>
                          <div style={{ fontSize: '12px', color: A.textSub, marginTop: '4px', display: 'flex', gap: '12px' }}>
                            <span>الاستهلاك: <strong style={{color: proc.cpuPercent > 30 ? A.red : A.text}}>{proc.cpuPercent}%</strong></span>
                            <span>الوقت المنقضي: <strong>{proc.timeElapsed}</strong></span>
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', background: isKilled ? `${A.textTer}20` : proc.status === 'stuck' ? `${A.red}15` : `${A.green}15`, color: isKilled ? A.textTer : proc.status === 'stuck' ? A.red : A.green }}>
                        {isKilled ? 'تم الإنهاء' : proc.status === 'stuck' ? 'معلق ⚠️' : 'يعمل 🟢'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: A.bg, borderTop: `1px solid ${A.sep}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: A.textSub }}>محدد: <strong>{selectedProcesses.length}</strong></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowCpuInspector(false)} style={{ background: 'transparent', color: A.text, border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
                <button onClick={handleKillProcesses} disabled={selectedProcesses.length === 0 || isKillingProcess} style={{ background: A.red, color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: selectedProcesses.length === 0 || isKillingProcess ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: selectedProcesses.length === 0 ? 0.5 : 1 }}>
                  {isKillingProcess ? '⏳ جاري الإنهاء...' : 'إنهاء المهام المحددة 🛑'}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* --- Storage & Smart Archiving Inspector Modal --- */}
      {showStorageInspector && (
        <ModalOverlay>
          <div style={{ background: A.surface, width: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: A.shadow, overflow: 'hidden' }}>
            <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${A.sep}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, color: A.text, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>🗄️ مفتش التخزين والأرشفة الذكية (Smart Tiering)</h3>
                <button onClick={() => setShowStorageInspector(false)} style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: A.textTer }}>×</button>
              </div>
              <p style={{ margin: 0, color: A.textSub, fontSize: '13px', lineHeight: '1.5' }}>قم بتنظيف الملفات المؤقتة، أو أرشفة المرفقات القديمة لـ (Cold Storage). الأرشفة تترك مؤشراً وهمياً (Symlink) لكي تُطلب البيانات لاحقاً كأنها لم تُحذف.</p>
            </div>
            
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {storageItems.map(item => {
                  const isSelected = selectedStorage.includes(item.id);
                  const isArchived = item.status === 'archived';
                  const isCleared = item.status === 'cleared';
                  return (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: A.bg, padding: '12px 16px', borderRadius: '10px', border: `1px solid ${isSelected ? A.blue : A.sep}`, opacity: isArchived || isCleared ? 0.5 : 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input type="checkbox" checked={isSelected} disabled={isArchived || isCleared} onChange={() => setSelectedStorage(p => p.includes(item.id) ? p.filter(id => id !== item.id) : [...p, item.id])} />
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: A.text }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: A.textSub, marginTop: '4px' }}>
                            المساحة المستهلكة: <strong>{item.size}</strong> 
                            <span style={{ margin: '0 6px', color: A.sep }}>|</span>
                            النوع: <span style={{ color: item.type === 'archive' ? A.blue : A.amber }}>{item.type === 'archive' ? 'بيانات قابلة للأرشفة' : 'ملفات مؤقتة'}</span>
                          </div>
                        </div>
                      </div>
                      {(isArchived || isCleared) && (
                        <div style={{ fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', background: `${A.green}15`, color: A.green }}>
                          {isArchived ? 'تم ترحيلها للأرشيف (Symlink)' : 'تم الحذف'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: A.bg, borderTop: `1px solid ${A.sep}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '12px', color: A.textSub }}>محدد: <strong>{selectedStorage.length}</strong></div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowStorageInspector(false)} style={{ background: 'transparent', color: A.text, border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
                <button onClick={handleStorageAction} disabled={selectedStorage.length === 0 || isArchiving} style={{ background: A.blue, color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: selectedStorage.length === 0 || isArchiving ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: selectedStorage.length === 0 ? 0.5 : 1 }}>
                  {isArchiving ? '⏳ جاري التنفيذ...' : 'أرشفة / تنظيف المحدد ⚡'}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
          background: toast.type === 'success' ? A.surface : '#FEF2F2',
          border: `1px solid ${toast.type === 'success' ? A.green : A.red}`,
          color: toast.type === 'success' ? A.green : A.red,
          padding: '12px 24px', borderRadius: '30px', boxShadow: A.shadow, zIndex: 999999,
          display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Page Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '800', color: A.text, letterSpacing: '-0.4px' }}>الأمان والحوكمة</h2>
          <p style={{ margin: 0, fontSize: '14px', color: A.textSub }}>قمرة القيادة الاستباقية - البنية التحتية السحابية الهجينة (Hybrid Cloud Dashboard)</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* 1. Server & DB Health */}
        <Card>
          <SectionTitle subtitle="مراقبة حية للموارد الأساسية مع أزرار للتدخل السريع">موارد الخادم وقاعدة البيانات (Core Resources)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <MetricRow 
              label="استجابة قاعدة البيانات (DB Latency)" 
              value={`${latency} ms`} 
              status={latency > 300 ? 'critical' : latency > 100 ? 'degraded' : 'healthy'} 
              action={<ActionButton label="مفتش الكاش 🔍" color={A.amber} onClick={() => setShowCacheInspector(true)} />}
            />
            <MetricRow 
              label="استهلاك المعالج (CPU)" 
              value={`${cpu}%`} 
              status={cpu > 90 ? 'critical' : cpu > 70 ? 'degraded' : 'healthy'} 
              action={<ActionButton label="مدير المهام ⚡" color={A.red} onClick={() => setShowCpuInspector(true)} />}
            />
            <MetricRow 
              label="مساحة التخزين (Disk Space)" 
              value={`${disk}% مستخدم`} 
              status={disk > 90 ? 'critical' : disk > 80 ? 'degraded' : 'healthy'} 
              action={<ActionButton label="مفتش التخزين والأرشفة 🗄️" color={A.blue} onClick={() => setShowStorageInspector(true)} />}
            />
          </div>
        </Card>

        {/* 2. Microservices Integrations */}
        <Card>
          <SectionTitle subtitle="الخدمات المرتبطة بنظام LITC وحلولها الفورية">الخدمات الخارجية (Microservices)</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <MetricRow label="خادم البريد (SMTP Office365)" value={services.smtp.status === 'healthy' ? 'متصل' : 'مقطوع'} status={services.smtp.status as any} action={<ActionButton label="إعادة تشغيل الطابور" icon="📧" color={A.blue} loading={actionLoading['smtp']} onClick={() => executeAction('smtp', () => setServices(p => ({...p, smtp: {status: 'healthy', latency: 40}})))} />} />
            <MetricRow label="بوابة المصادقة (Active Directory / SSO)" value={services.sso.status === 'healthy' ? 'متصل' : 'بطيء'} status={services.sso.status as any} action={<ActionButton label="مزامنة إجبارية (Sync)" icon="🔄" color={A.blue} loading={actionLoading['sso']} onClick={() => executeAction('sso', () => setServices(p => ({...p, sso: {status: 'healthy', latency: 20}})))} />} />
          </div>
        </Card>

        {/* 3. Traffic & Circuit Breaker */}
        <Card>
          <SectionTitle subtitle="مراقبة الأحمال والتحكم في استقبال الطلبات لضمان استقرار النظام">إدارة الضغط وقاطع الدائرة (Traffic Control)</SectionTitle>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ flex: 1, background: A.bg, padding: '16px', borderRadius: '12px', textAlign: 'center' }}><div style={{ fontSize: '13px', color: A.textSub, marginBottom: '4px' }}>المستخدمون النشطون (الآن)</div><div style={{ fontSize: '28px', fontWeight: '800', color: A.text }}>{load.activeUsers}</div></div>
            <div style={{ flex: 1, background: A.bg, padding: '16px', borderRadius: '12px', textAlign: 'center' }}><div style={{ fontSize: '13px', color: A.textSub, marginBottom: '4px' }}>الطلبات في الثانية (RPS)</div><div style={{ fontSize: '28px', fontWeight: '800', color: load.rps > 100 ? A.red : A.text }}>{load.rps}</div></div>
          </div>
        </Card>

      </div>
    </div>
  );
};
