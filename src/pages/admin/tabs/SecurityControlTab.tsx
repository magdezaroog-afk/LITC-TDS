import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Server, 
  Cpu, 
  Database, 
  Activity, 
  Flame, 
  UserX, 
  UserCheck,
  RefreshCw, 
  Trash2, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Lock, 
  Globe, 
  Terminal, 
  Filter,
  Eye,
  AlertOctagon,
  Download,
  Search,
  FileText,
  User,
  Building,
  KeyRound,
  LogOut,
  Copy,
  ExternalLink,
  Zap
} from 'lucide-react';
import { AdminAPI } from '../../../services/admin.api';

// Enterprise SOC Theme Tokens
const SOC_THEME = {
  navy: '#135d79',
  navyDark: '#0c3c4e',
  navyLight: '#1e7898',
  orange: '#f36c21',
  orangeLight: '#ff853f',
  emerald: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  purple: '#8b5cf6',
  slateBg: '#0f172a',
  cardBg: '#ffffff',
  cardBorder: 'rgba(19, 93, 121, 0.12)',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  radius: '16px',
  shadow: '0 4px 20px -2px rgba(19, 93, 121, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)'
};

export const SecurityControlTab: React.FC = () => {
  // Navigation & Active Section
  const [activeSection, setActiveSection] = useState<'SESSIONS' | 'LOGS' | 'WAF'>('SESSIONS');

  // Telemetry & Data States
  const [telemetry, setTelemetry] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [siemLogs, setSiemLogs] = useState<any[]>([]);
  const [siemStats, setSiemStats] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);

  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  // Sessions Filtering & Search
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'ALL' | 'ACTIVE' | 'FROZEN'>('ALL');
  const [sessionSearch, setSessionSearch] = useState('');

  // Logs Source & Filtering
  const [logSource, setLogSource] = useState<'SIEM' | 'AUDIT'>('SIEM');
  const [logSeverityFilter, setLogSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [logSearch, setLogSearch] = useState('');
  const [inspectedLog, setInspectedLog] = useState<any | null>(null);

  // WAF Rule Creation Form
  const [ruleType, setRuleType] = useState<'IP_BLOCK' | 'PAYLOAD_BLOCK'>('IP_BLOCK');
  const [target, setTarget] = useState('');
  const [action, setAction] = useState('BLOCK');
  const [creatingRule, setCreatingRule] = useState(false);

  // Modals & Action States
  const [userToFreeze, setUserToFreeze] = useState<any | null>(null);
  const [freezeReasonPreset, setFreezeReasonPreset] = useState<string>('شبهة اختراق أو نشاط أمني مريب');
  const [freezeCustomReason, setFreezeCustomReason] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Status Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Synchronize All Real SOC Data
  const fetchSOCData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [telRes, ruleRes, siemRes, auditRes, sessRes] = await Promise.allSettled([
        AdminAPI.getSOCTelemetry(),
        AdminAPI.getWAFRules(),
        AdminAPI.getSIEMLogs({ limit: 150 }),
        AdminAPI.getAuditLogs({ limit: 150 }),
        AdminAPI.getActiveSessions()
      ]);

      if (telRes.status === 'fulfilled') setTelemetry(telRes.value);
      if (ruleRes.status === 'fulfilled') setRules(ruleRes.value?.rules || []);
      if (siemRes.status === 'fulfilled') {
        setSiemLogs(siemRes.value?.logs || []);
        setSiemStats(siemRes.value?.stats || null);
      }
      if (auditRes.status === 'fulfilled') {
        setAuditLogs(auditRes.value?.logs || []);
        setAuditStats(auditRes.value?.stats || null);
      }
      if (sessRes.status === 'fulfilled') {
        setUsers(sessRes.value?.users || []);
        setUserStats(sessRes.value?.stats || null);
      }

      setLastSyncTime(new Date());
    } catch (err: any) {
      console.error('[SOC] Error synchronizing telemetry:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSOCData();
    if (!autoSync) return;
    const interval = setInterval(() => {
      fetchSOCData();
    }, 10000); // 10s Live Sync
    return () => clearInterval(interval);
  }, [fetchSOCData, autoSync]);

  // Handle Freeze User
  const handleConfirmFreeze = async () => {
    if (!userToFreeze) return;
    setActionInProgress(`freeze-${userToFreeze.id}`);
    try {
      const finalReason = freezeCustomReason.trim() ? `${freezeReasonPreset} — ${freezeCustomReason.trim()}` : freezeReasonPreset;
      const res = await AdminAPI.kickUserSession(userToFreeze.id, finalReason);
      showToast(res.message || `تم تجميد حساب [${userToFreeze.fullName}] وإبطال كافة جلساته بنجاح.`);
      setUserToFreeze(null);
      setFreezeCustomReason('');
      await fetchSOCData();
    } catch (err: any) {
      showToast(err.message || 'فشل في تجميد الحساب', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Unfreeze User
  const handleUnfreeze = async (user: any) => {
    setActionInProgress(`unfreeze-${user.id}`);
    try {
      const res = await AdminAPI.unfreezeUserSession(user.id);
      showToast(res.message || `تم استعادة وتفعيل حساب [${user.fullName}] بنجاح.`);
      await fetchSOCData();
    } catch (err: any) {
      showToast(err.message || 'فشل في إلغاء تجميد الحساب', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Terminate Session Only
  const handleTerminateSession = async (user: any) => {
    setActionInProgress(`term-${user.id}`);
    try {
      const res = await AdminAPI.terminateUserSession(user.id);
      showToast(res.message || `تم إنهاء جلسة [${user.fullName}] وإلزامه بإعادة تسجيل الدخول.`);
      await fetchSOCData();
    } catch (err: any) {
      showToast(err.message || 'فشل في إنهاء الجلسة', 'error');
    } finally {
      setActionInProgress(null);
    }
  };

  // Create WAF Rule Handler
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) {
      showToast('يرجى تحديد المعيار المراد حظره (عنوان IP أو نص Regex)', 'error');
      return;
    }

    setCreatingRule(true);
    try {
      await AdminAPI.createWAFRule({
        ruleType,
        target: target.trim(),
        action
      });
      showToast(`تم بنجاح تفعيل قاعدة الحماية للجدار الناري [${ruleType}] وتحديث ذاكرة Redis اللحظية.`);
      setTarget('');
      await fetchSOCData();
    } catch (err: any) {
      showToast(err.message || 'فشل في تطبيق قاعدة الجدار الناري', 'error');
    } finally {
      setCreatingRule(false);
    }
  };

  // Delete WAF Rule Handler
  const handleDeleteRule = async (id: string) => {
    try {
      await AdminAPI.deleteWAFRule(id);
      showToast('تم إلغاء تفعيل وحذف قاعدة الحماية وتحديث محرك الفحص.');
      await fetchSOCData();
    } catch (err: any) {
      showToast(err.message || 'فشل حذف القاعدة', 'error');
    }
  };

  // Export Security & Audit Report to CSV / JSON
  const handleExportReport = (format: 'CSV' | 'JSON') => {
    const isSiem = logSource === 'SIEM';
    const dataToExport = isSiem ? filteredSiemLogs : filteredAuditLogs;

    if (dataToExport.length === 0) {
      showToast('لا توجد سجلات لتصديرها وفق معايير التصفية المحددة', 'error');
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `NEXUS-TDS-Security-Report-${logSource}-${timestamp}.${format.toLowerCase()}`;

    if (format === 'JSON') {
      const jsonContent = JSON.stringify({
        reportTitle: `تقرير ${isSiem ? 'أحداث الأمن السيبراني والـ SIEM' : 'سجل التدقيق المؤسسي والعمليات الحساسة'}`,
        generatedAt: new Date().toISOString(),
        totalRecords: dataToExport.length,
        logs: dataToExport
      }, null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`تم تصدير التقرير بنجاح: ${filename}`);
    } else {
      // CSV format
      let csv = '';
      if (isSiem) {
        csv = 'معرف الحدث,التوقيت,مستوى الخطورة,نوع الحدث,عنوان IP,المستخدم المستهدف,التفاصيل\r\n';
        dataToExport.forEach(log => {
          const dt = new Date(log.createdAt).toLocaleString('ar-LY');
          const detailsEscaped = `"${(log.details || '').replace(/"/g, '""')}"`;
          csv += `"${log.id}","${dt}","${log.severity}","${log.eventType}","${log.sourceIp || ''}","${log.targetUserId || ''}",${detailsEscaped}\r\n`;
        });
      } else {
        csv = 'رقم السجل,التوقيت,الكيان,معرف الكيان,الإجراء,المنفذ,عنوان IP,التفاصيل\r\n';
        dataToExport.forEach(log => {
          const dt = new Date(log.createdAt).toLocaleString('ar-LY');
          const author = log.author?.fullName || log.changedBy || '';
          const changesEscaped = `"${(log.changes || '').replace(/"/g, '""')}"`;
          csv += `"${log.id}","${dt}","${log.entity}","${log.entityId}","${log.action}","${author}","${log.ipAddress || ''}",${changesEscaped}\r\n`;
        });
      }

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`تم تصدير التقرير بصيغة CSV بنجاح: ${filename}`);
    }
  };

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    if (sessionStatusFilter === 'ACTIVE' && (!u.isActive || u.isFrozen)) return false;
    if (sessionStatusFilter === 'FROZEN' && !u.isFrozen) return false;
    if (!sessionSearch.trim()) return true;
    const q = sessionSearch.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.role?.name || '').toLowerCase().includes(q) ||
      (u.department?.name || '').toLowerCase().includes(q)
    );
  });

  // Filtered SIEM Logs
  const filteredSiemLogs = siemLogs.filter(log => {
    if (logSeverityFilter !== 'ALL' && log.severity !== logSeverityFilter) return false;
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      (log.eventType || '').toLowerCase().includes(q) ||
      (log.sourceIp || '').toLowerCase().includes(q) ||
      (log.details || '').toLowerCase().includes(q)
    );
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    if (!logSearch.trim()) return true;
    const q = logSearch.toLowerCase();
    return (
      (log.action || '').toLowerCase().includes(q) ||
      (log.entity || '').toLowerCase().includes(q) ||
      (log.ipAddress || '').toLowerCase().includes(q) ||
      (log.author?.fullName || '').toLowerCase().includes(q) ||
      (log.changes || '').toLowerCase().includes(q)
    );
  });

  // Formatter for Server Uptime
  const formatUptime = (seconds: number = 0) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d} يوم ` : ''}${h} س ${m} د ${s} ث`;
  };

  if (loading) {
    return (
      <div dir="rtl" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '400px', gap: '16px', color: SOC_THEME.navy
      }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: SOC_THEME.navy }} />
        <span style={{ fontSize: '15px', fontWeight: '700' }}>جاري الاتصال بمركز العمليات الأمنية والسيبرانية (LITC SOC)...</span>
      </div>
    );
  }

  const cpuVal = telemetry?.cpu ?? 0;
  const ramUsage = telemetry?.memoryUsage ?? 0;
  const totalRam = telemetry?.totalMemory ?? 0;
  const ramPercent = totalRam > 0 ? Math.round((ramUsage / totalRam) * 100) : 0;

  return (
    <div dir="rtl" style={{
      display: 'flex', flexDirection: 'column', gap: '24px', padding: '8px 4px 40px 4px',
      fontFamily: "-apple-system, 'SF Pro Display', 'Inter', 'Segoe UI', sans-serif"
    }}>
      
      {/* ─── Notification Toast ────────────────────────────────────────────── */}
      {notification && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, background: notification.type === 'success' ? '#065f46' : '#991b1b',
          color: '#ffffff', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px',
          animation: 'fadeInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* ─── Top Control Header ────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${SOC_THEME.navy} 0%, ${SOC_THEME.navyDark} 100%)`,
        borderRadius: SOC_THEME.radius, padding: '24px 28px', color: '#ffffff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
        gap: '20px', boxShadow: '0 8px 30px rgba(19, 93, 121, 0.25)', position: 'relative', overflow: 'hidden'
      }}>
        {/* Glow Accent */}
        <div style={{
          position: 'absolute', top: '-60px', left: '-60px', width: '180px', height: '180px',
          background: 'radial-gradient(circle, rgba(243, 108, 33, 0.35) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ShieldAlert size={24} style={{ color: SOC_THEME.orange }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                مركز العمليات الأمنية والحوكمة السيبرانية (Enterprise SOC & Identity Governance)
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>
                مراقبة لحظية استباقية لمعايير NIST CSF 2.0 والتحكم بعدم الثقة (Zero-Trust) وسجلات التدقيق غير القابلة للعبث
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Sync Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 255, 255, 0.1)',
            padding: '8px 14px', borderRadius: '10px', fontSize: '12px', backdropFilter: 'blur(6px)'
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: autoSync ? SOC_THEME.emerald : '#94a3b8',
              boxShadow: autoSync ? `0 0 8px ${SOC_THEME.emerald}` : 'none'
            }} />
            <span>مزامنة حية (10 ث):</span>
            <button 
              onClick={() => setAutoSync(!autoSync)} 
              style={{
                background: autoSync ? SOC_THEME.emerald : 'rgba(255,255,255,0.2)',
                border: 'none', color: '#fff', padding: '2px 8px', borderRadius: '6px',
                fontSize: '11px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              {autoSync ? 'نشط' : 'متوقف'}
            </button>
          </div>

          <button
            onClick={() => fetchSOCData(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: SOC_THEME.orange, border: 'none', color: '#ffffff',
              padding: '10px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: '700',
              cursor: refreshing ? 'wait' : 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(243, 108, 33, 0.35)'
            }}
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'جاري التحديث...' : 'تحديث فوري'}</span>
          </button>
        </div>
      </div>

      {/* ─── Hardware & Core Telemetry Cards ─────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px'
      }}>
        {/* CPU */}
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '18px 20px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>استهلاك المعالج (CPU)</span>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(19, 93, 121, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.navy
            }}>
              <Cpu size={16} />
            </div>
          </div>
          <div style={{ margin: '10px 0 6px' }}>
            <div style={{
              fontSize: '24px', fontWeight: '800',
              color: cpuVal > 80 ? SOC_THEME.red : cpuVal > 50 ? SOC_THEME.amber : SOC_THEME.navy
            }}>
              {cpuVal}%
            </div>
            <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(cpuVal, 100)}%`,
                background: cpuVal > 80 ? SOC_THEME.red : cpuVal > 50 ? SOC_THEME.amber : SOC_THEME.navy,
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: SOC_THEME.textMuted }}>الحمل اللحظي لنواة المحرك</span>
        </div>

        {/* RAM */}
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '18px 20px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>ذاكرة الخادم (RAM)</span>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(243, 108, 33, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.orange
            }}>
              <Server size={16} />
            </div>
          </div>
          <div style={{ margin: '10px 0 6px' }}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: SOC_THEME.navy }}>
              {ramUsage} <span style={{ fontSize: '13px', fontWeight: '600', color: SOC_THEME.textSecondary }}>MB</span>
            </div>
            <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${Math.min(ramPercent, 100)}%`,
                background: SOC_THEME.orange, transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
          <span style={{ fontSize: '11px', color: SOC_THEME.textMuted }}>
            {totalRam > 0 ? `من إجمالي ${totalRam} MB المتاحة (${ramPercent}%)` : 'استهلاك حقيقي للعملية'}
          </span>
        </div>

        {/* Database Health */}
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '18px 20px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>قاعدة البيانات (Prisma DB)</span>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.emerald
            }}>
              <Database size={16} />
            </div>
          </div>
          <div style={{ margin: '10px 0 6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: '20px',
                background: telemetry?.dbAlive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: telemetry?.dbAlive ? SOC_THEME.emerald : SOC_THEME.red,
                fontSize: '13px', fontWeight: '700'
              }}>
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: telemetry?.dbAlive ? SOC_THEME.emerald : SOC_THEME.red
                }} />
                {telemetry?.dbAlive ? 'متصل ومؤمن (Healthy)' : 'انقطاع الاتصال!'}
              </span>
            </div>
          </div>
          <span style={{ fontSize: '11px', color: SOC_THEME.textMuted }}>مستجيب للاستعلامات المشفرة</span>
        </div>

        {/* System Uptime */}
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '18px 20px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>مدة التشغيل المستمر</span>
            <div style={{
              width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(19, 93, 121, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.navy
            }}>
              <Clock size={16} />
            </div>
          </div>
          <div style={{ margin: '10px 0 6px' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', color: SOC_THEME.navy }}>
              {formatUptime(telemetry?.uptime)}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: SOC_THEME.textMuted }}>منذ آخر إعادة تشغيل للمحرك</span>
        </div>
      </div>

      {/* ─── Navigation Switcher: Sessions vs Logs vs WAF ────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px', background: '#f1f5f9',
        padding: '6px', borderRadius: '12px', width: 'fit-content', border: '1px solid #e2e8f0'
      }}>
        <button
          type="button"
          onClick={() => setActiveSection('SESSIONS')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 800,
            background: activeSection === 'SESSIONS' ? '#ffffff' : 'transparent',
            color: activeSection === 'SESSIONS' ? SOC_THEME.navy : SOC_THEME.textSecondary,
            boxShadow: activeSection === 'SESSIONS' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Lock size={16} style={{ color: activeSection === 'SESSIONS' ? SOC_THEME.emerald : SOC_THEME.textMuted }} />
          <span>حوض الجلسات والحسابات (Zero-Trust Sessions)</span>
          {userStats?.frozenUsers > 0 && (
            <span style={{
              background: SOC_THEME.red, color: '#fff', fontSize: '10px', padding: '1px 6px',
              borderRadius: '10px', fontWeight: 800
            }}>
              {userStats.frozenUsers} مجمد
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('LOGS')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 800,
            background: activeSection === 'LOGS' ? '#ffffff' : 'transparent',
            color: activeSection === 'LOGS' ? SOC_THEME.navy : SOC_THEME.textSecondary,
            boxShadow: activeSection === 'LOGS' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Terminal size={16} style={{ color: activeSection === 'LOGS' ? SOC_THEME.navy : SOC_THEME.textMuted }} />
          <span>مستكشف السجلات والـ SIEM الموحد (Audit & SIEM Explorer)</span>
          {siemStats?.criticalCount > 0 && (
            <span style={{
              background: 'rgba(239, 68, 68, 0.12)', color: SOC_THEME.red, fontSize: '10px',
              padding: '1px 6px', borderRadius: '10px', fontWeight: 800
            }}>
              {siemStats.criticalCount} خطر
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('WAF')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
            borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 800,
            background: activeSection === 'WAF' ? '#ffffff' : 'transparent',
            color: activeSection === 'WAF' ? SOC_THEME.navy : SOC_THEME.textSecondary,
            boxShadow: activeSection === 'WAF' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Flame size={16} style={{ color: activeSection === 'WAF' ? SOC_THEME.orange : SOC_THEME.textMuted }} />
          <span>جدار حماية التطبيقات (WAF Policies)</span>
          <span style={{
            background: '#e2e8f0', color: SOC_THEME.textSecondary, fontSize: '10px',
            padding: '1px 6px', borderRadius: '10px', fontWeight: 800
          }}>
            {rules.length}
          </span>
        </button>
      </div>

      {/* ─── SECTION 1: SESSIONS & ACCOUNTS GOVERNANCE ─────────────────────── */}
      {activeSection === 'SESSIONS' && (
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '24px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', gap: '20px'
        }}>
          {/* Header & Stats Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: SOC_THEME.navy, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={20} style={{ color: SOC_THEME.emerald }} />
                حوض الجلسات والحسابات وتطبيق عدم الثقة (Zero-Trust Session & Identity Governance)
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: SOC_THEME.textSecondary }}>
                مراقبة الحسابات المتصلة، صلاحيات الأدوار، والمواقع الجغرافية مع إمكانية التجميد الفوري وطرد الجلسات المشبوهة
              </p>
            </div>

            {/* Micro Stats Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{
                padding: '6px 14px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700'
              }}>
                <span style={{ color: SOC_THEME.textSecondary }}>إجمالي الحسابات:</span>
                <span style={{ color: SOC_THEME.navy, fontWeight: '800' }}>{userStats?.totalUsers ?? users.length}</span>
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '12px', fontWeight: '700', color: SOC_THEME.emerald
              }}>
                <span>النشطة والمؤمنة:</span>
                <span style={{ fontWeight: '800' }}>{userStats?.activeUsers ?? users.filter(u => !u.isFrozen).length}</span>
              </div>
              <div style={{
                padding: '6px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '12px', fontWeight: '700', color: SOC_THEME.red
              }}>
                <span>المجمدة أمنياً:</span>
                <span style={{ fontWeight: '800' }}>{userStats?.frozenUsers ?? users.filter(u => u.isFrozen).length}</span>
              </div>
              {userStats?.lockedOutUsers > 0 && (
                <div style={{
                  padding: '6px 14px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', gap: '8px',
                  fontSize: '12px', fontWeight: '700', color: SOC_THEME.amber
                }}>
                  <span>إقفال مؤقت (Lockout):</span>
                  <span style={{ fontWeight: '800' }}>{userStats.lockedOutUsers}</span>
                </div>
              )}
            </div>
          </div>

          {/* Filters & Search Toolbar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
            gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0'
          }}>
            {/* Status Pills */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['ALL', 'ACTIVE', 'FROZEN'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSessionStatusFilter(st)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '12px', fontWeight: sessionStatusFilter === st ? 800 : 600,
                    background: sessionStatusFilter === st ? SOC_THEME.navy : '#ffffff',
                    color: sessionStatusFilter === st ? '#ffffff' : SOC_THEME.textSecondary,
                    boxShadow: sessionStatusFilter === st ? '0 2px 6px rgba(19, 93, 121, 0.25)' : 'none',
                    borderStyle: 'solid', borderWidth: '1px',
                    borderColor: sessionStatusFilter === st ? SOC_THEME.navy : '#e2e8f0'
                  }}
                >
                  {st === 'ALL' ? 'كافة الحسابات' : st === 'ACTIVE' ? 'الحسابات النشطة فقط' : 'الحسابات المجمدة فقط'}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '400px' }}>
              <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: SOC_THEME.textMuted }} />
              <input
                type="text"
                placeholder="بحث بالاسم، البريد، الإدارة، أو الدور..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 36px 8px 12px', borderRadius: '8px',
                  border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none', background: '#ffffff',
                  color: SOC_THEME.textPrimary
                }}
              />
            </div>
          </div>

          {/* Accounts & Sessions Table */}
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>المستخدم والحساب</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>الدور والصلاحيات</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>الإدارة والموقع</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>الحالة الأمنية</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>آخر ظهور وعنوان IP</th>
                  <th style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary, textAlign: 'center' }}>إجراءات السيطرة الأمنية</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: SOC_THEME.textMuted, fontSize: '13px' }}>
                      لا توجد حسابات مطابقة لمعايير البحث والتصفية.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => {
                    const isFrozen = user.isFrozen;
                    const isLocked = user.lockoutEnd && new Date(user.lockoutEnd) > new Date();
                    const actionKey = actionInProgress;

                    return (
                      <tr 
                        key={user.id} 
                        style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          background: isFrozen ? 'rgba(239, 68, 68, 0.03)' : '#ffffff',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* User identity */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: isFrozen ? 'rgba(239, 68, 68, 0.15)' : 'rgba(19, 93, 121, 0.1)',
                              color: isFrozen ? SOC_THEME.red : SOC_THEME.navy,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '13px', fontWeight: '800'
                            }}>
                              {user.fullName ? user.fullName.substring(0, 2) : 'US'}
                            </div>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '800', color: isFrozen ? SOC_THEME.red : SOC_THEME.textPrimary }}>
                                {user.fullName || 'مستخدم غير مسمى'}
                              </div>
                              <div style={{ fontSize: '11px', color: SOC_THEME.textSecondary, fontFamily: 'monospace' }}>
                                {user.email || user.username}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{
                              display: 'inline-block', width: 'fit-content', padding: '3px 8px', borderRadius: '6px',
                              background: 'rgba(19, 93, 121, 0.08)', color: SOC_THEME.navy, fontSize: '11px', fontWeight: '700'
                            }}>
                              {user.role?.name || 'مستخدم عام'}
                            </span>
                            {user.jobTitle && (
                              <span style={{ fontSize: '11px', color: SOC_THEME.textMuted }}>
                                {user.jobTitle}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Department & Building */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: SOC_THEME.textPrimary }}>
                            {user.department?.name || '—'}
                          </div>
                          {user.building?.name && (
                            <div style={{ fontSize: '11px', color: SOC_THEME.textMuted, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <Building size={11} />
                              <span>{user.building.name}</span>
                            </div>
                          )}
                        </td>

                        {/* Security Status */}
                        <td style={{ padding: '14px 16px' }}>
                          {isFrozen ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '4px 10px', borderRadius: '20px',
                              background: 'rgba(239, 68, 68, 0.12)', color: SOC_THEME.red,
                              fontSize: '11px', fontWeight: '800'
                            }}>
                              <AlertOctagon size={12} />
                              مجمد أمنياً
                            </span>
                          ) : isLocked ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '4px 10px', borderRadius: '20px',
                              background: 'rgba(245, 158, 11, 0.12)', color: SOC_THEME.amber,
                              fontSize: '11px', fontWeight: '800'
                            }}>
                              <Clock size={12} />
                              مقفل مؤقتاً (Lockout)
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '4px 10px', borderRadius: '20px',
                              background: 'rgba(16, 185, 129, 0.1)', color: SOC_THEME.emerald,
                              fontSize: '11px', fontWeight: '700'
                            }}>
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: SOC_THEME.emerald }} />
                              نشط وموثق
                            </span>
                          )}
                        </td>

                        {/* Last IP & Activity */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontFamily: 'monospace', fontSize: '12px', color: SOC_THEME.navy, fontWeight: '700' }}>
                            {user.lastIp || '127.0.0.1'}
                          </div>
                          <div style={{ fontSize: '11px', color: SOC_THEME.textMuted, marginTop: '2px' }}>
                            {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString('ar-LY', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : 'غير محدد'}
                          </div>
                        </td>

                        {/* Emergency Actions */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {isFrozen ? (
                              <button
                                type="button"
                                onClick={() => handleUnfreeze(user)}
                                disabled={actionKey === `unfreeze-${user.id}`}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '6px',
                                  background: 'rgba(16, 185, 129, 0.1)', color: SOC_THEME.emerald,
                                  border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 12px',
                                  borderRadius: '8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {actionKey === `unfreeze-${user.id}` ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <UserCheck size={13} />
                                )}
                                <span>إلغاء التجميد واستعادة الحساب</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setUserToFreeze(user)}
                                  title="تجميد الحساب وإلغاء كافة صلاحيات الدخول"
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(239, 68, 68, 0.08)', color: SOC_THEME.red,
                                    border: '1px solid rgba(239, 68, 68, 0.25)', padding: '6px 12px',
                                    borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = SOC_THEME.red;
                                    e.currentTarget.style.color = '#fff';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                    e.currentTarget.style.color = SOC_THEME.red;
                                  }}
                                >
                                  <UserX size={13} />
                                  <span>تجميد فوري</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleTerminateSession(user)}
                                  disabled={actionKey === `term-${user.id}`}
                                  title="إنهاء الجلسة النشطة الحالية وإجبار المستخدم على تسجيل الدخول مجدداً"
                                  style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: '#f8fafc', color: SOC_THEME.textSecondary,
                                    border: '1px solid #cbd5e1', padding: '6px 10px',
                                    borderRadius: '8px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#e2e8f0';
                                    e.currentTarget.style.color = SOC_THEME.textPrimary;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#f8fafc';
                                    e.currentTarget.style.color = SOC_THEME.textSecondary;
                                  }}
                                >
                                  {actionKey === `term-${user.id}` ? (
                                    <RefreshCw size={12} className="animate-spin" />
                                  ) : (
                                    <LogOut size={12} />
                                  )}
                                  <span>طرد الجلسة</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── SECTION 2: SIEM & AUDIT LOGS EXPLORER ────────────────────────── */}
      {activeSection === 'LOGS' && (
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '24px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', gap: '20px'
        }}>
          {/* Header & Source Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: SOC_THEME.navy, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={20} style={{ color: SOC_THEME.navy }} />
                مستكشف السجلات الجنائية والأمنية الموحد (Unified SIEM & Forensic Audit Trail)
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: SOC_THEME.textSecondary }}>
                تدفق لحظي لسجلات الأحداث الأمنية (SIEM) وسجل التدقيق المؤسسي غير القابل للعبث (Immutable Ledger)
              </p>
            </div>

            {/* Source Switcher Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setLogSource('SIEM')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                  borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800,
                  background: logSource === 'SIEM' ? SOC_THEME.navy : '#f1f5f9',
                  color: logSource === 'SIEM' ? '#ffffff' : SOC_THEME.textSecondary,
                  transition: 'all 0.15s ease'
                }}
              >
                <ShieldAlert size={14} />
                <span>سجلات التهديدات (SIEM Events)</span>
                <span style={{
                  background: logSource === 'SIEM' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                  padding: '1px 6px', borderRadius: '10px', fontSize: '10px'
                }}>
                  {siemStats?.total || siemLogs.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setLogSource('AUDIT')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                  borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800,
                  background: logSource === 'AUDIT' ? SOC_THEME.navy : '#f1f5f9',
                  color: logSource === 'AUDIT' ? '#ffffff' : SOC_THEME.textSecondary,
                  transition: 'all 0.15s ease'
                }}
              >
                <FileText size={14} />
                <span>سجل التدقيق المؤسسي (Audit Trail)</span>
                <span style={{
                  background: logSource === 'AUDIT' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
                  padding: '1px 6px', borderRadius: '10px', fontSize: '10px'
                }}>
                  {auditStats?.total || auditLogs.length}
                </span>
              </button>
            </div>
          </div>

          {/* Micro Telemetry Bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px'
          }}>
            <div style={{
              background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: SOC_THEME.textSecondary, fontWeight: 700 }}>إجمالي السجلات المسجلة</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: SOC_THEME.navy }}>
                  {(logSource === 'SIEM' ? siemStats?.total : auditStats?.total) || (logSource === 'SIEM' ? siemLogs.length : auditLogs.length)}
                </div>
              </div>
              <Terminal size={22} style={{ color: SOC_THEME.navy, opacity: 0.5 }} />
            </div>

            {logSource === 'SIEM' && (
              <>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.05)', padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: SOC_THEME.red, fontWeight: 700 }}>تهديدات حرجة (CRITICAL)</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: SOC_THEME.red }}>
                      {siemStats?.criticalCount || 0}
                    </div>
                  </div>
                  <AlertOctagon size={22} style={{ color: SOC_THEME.red }} />
                </div>

                <div style={{
                  background: 'rgba(245, 158, 11, 0.05)', padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: SOC_THEME.amber, fontWeight: 700 }}>تحذيرات أمنية (WARNING)</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: SOC_THEME.amber }}>
                      {siemStats?.warningCount || 0}
                    </div>
                  </div>
                  <AlertTriangle size={22} style={{ color: SOC_THEME.amber }} />
                </div>

                <div style={{
                  background: 'rgba(16, 185, 129, 0.05)', padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: SOC_THEME.emerald, fontWeight: 700 }}>أحداث اليوم النشطة</div>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: SOC_THEME.emerald }}>
                      {siemStats?.todayCount || 0}
                    </div>
                  </div>
                  <Activity size={22} style={{ color: SOC_THEME.emerald }} />
                </div>
              </>
            )}
          </div>

          {/* Filters, Search & Export Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
            gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Severity Pills for SIEM */}
              {logSource === 'SIEM' && (
                <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
                  {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(sev => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setLogSeverityFilter(sev)}
                      style={{
                        border: 'none', background: logSeverityFilter === sev ? '#ffffff' : 'transparent',
                        color: logSeverityFilter === sev ? SOC_THEME.navy : SOC_THEME.textSecondary,
                        padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                        cursor: 'pointer', boxShadow: logSeverityFilter === sev ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                      }}
                    >
                      {sev === 'ALL' ? 'كافة المستويات' : sev}
                    </button>
                  ))}
                </div>
              )}

              {/* Text Search */}
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: SOC_THEME.textMuted }} />
                <input
                  type="text"
                  placeholder={logSource === 'SIEM' ? 'بحث بالحدث، عنوان IP، أو التفاصيل...' : 'بحث بالإجراء، الكيان، المنفذ، أو IP...'}
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  style={{
                    padding: '7px 32px 7px 10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                    fontSize: '12px', outline: 'none', background: '#ffffff', minWidth: '240px'
                  }}
                />
              </div>
            </div>

            {/* Export Report Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleExportReport('CSV')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff',
                  border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: '700', color: SOC_THEME.navy, cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Download size={14} />
                <span>تصدير تقرير أمني (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => handleExportReport('JSON')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff',
                  border: '1px solid #cbd5e1', padding: '7px 14px', borderRadius: '8px',
                  fontSize: '12px', fontWeight: '700', color: SOC_THEME.navy, cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Download size={14} />
                <span>تصدير JSON</span>
              </button>
            </div>
          </div>

          {/* Logs Feed Container */}
          <div style={{
            maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
            padding: '4px', borderRadius: '10px'
          }}>
            {logSource === 'SIEM' ? (
              filteredSiemLogs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: SOC_THEME.textMuted, fontSize: '13px', background: '#f8fafc', borderRadius: '10px' }}>
                  لا توجد أحداث أمنية مسجلة مطابقة لمعايير البحث.
                </div>
              ) : (
                filteredSiemLogs.map(log => {
                  const isCrit = log.severity === 'CRITICAL';
                  const isWarn = log.severity === 'WARNING';
                  const sevColor = isCrit ? SOC_THEME.red : isWarn ? SOC_THEME.amber : SOC_THEME.navy;

                  return (
                    <div 
                      key={log.id} 
                      onClick={() => setInspectedLog(log)}
                      style={{
                        padding: '12px 16px', borderRadius: '10px', cursor: 'pointer',
                        background: isCrit ? 'rgba(239, 68, 68, 0.04)' : '#ffffff',
                        border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.25)' : '#e2e8f0'}`,
                        display: 'flex', flexDirection: 'column', gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = SOC_THEME.navy}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = isCrit ? 'rgba(239, 68, 68, 0.25)' : '#e2e8f0'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px',
                            background: `${sevColor}15`, color: sevColor
                          }}>
                            {log.severity}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: SOC_THEME.textPrimary, fontFamily: 'monospace' }}>
                            {log.eventType}
                          </span>
                          <span style={{ fontSize: '11px', color: SOC_THEME.textMuted, fontFamily: 'monospace' }}>
                            #{log.id.substring(0, 10)}...
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', color: SOC_THEME.textSecondary }}>
                          {new Date(log.createdAt).toLocaleString('ar-LY')}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: SOC_THEME.textSecondary }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: SOC_THEME.navy }}>
                            IP: {log.sourceIp || '127.0.0.1'}
                          </span>
                          {log.targetUserId && (
                            <span>المستخدم المستهدف: #{log.targetUserId}</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: SOC_THEME.navy, fontWeight: 700 }}>
                          <Eye size={12} />
                          <span>فحص الحمولة (Inspect)</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              filteredAuditLogs.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: SOC_THEME.textMuted, fontSize: '13px', background: '#f8fafc', borderRadius: '10px' }}>
                  لا توجد سجلات تدقيق مطابقة لمعايير البحث.
                </div>
              ) : (
                filteredAuditLogs.map(log => (
                  <div 
                    key={log.id} 
                    onClick={() => setInspectedLog(log)}
                    style={{
                      padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', background: '#ffffff',
                      border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = SOC_THEME.navy}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px',
                          background: 'rgba(19, 93, 121, 0.08)', color: SOC_THEME.navy
                        }}>
                          {log.entity} #{log.entityId}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: SOC_THEME.textPrimary }}>
                          {log.action}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: SOC_THEME.textSecondary }}>
                        {new Date(log.createdAt).toLocaleString('ar-LY')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: SOC_THEME.textSecondary }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span>المنفذ: <strong>{log.author?.fullName || `مستخدم #${log.changedBy}`}</strong></span>
                        <span style={{ fontFamily: 'monospace' }}>IP: {log.ipAddress || 'INTERNAL'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: SOC_THEME.navy, fontWeight: 700 }}>
                        <Eye size={12} />
                        <span>فحص التعديلات</span>
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

      {/* ─── SECTION 3: WAF POLICIES & ATTACK DEFENSE ─────────────────────── */}
      {activeSection === 'WAF' && (
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '24px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: SOC_THEME.navy, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} style={{ color: SOC_THEME.orange }} />
                جدار حماية التطبيقات وقواعد الحظر الميداني (WAF Policy Engine)
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: SOC_THEME.textSecondary }}>
                قواعد حظر العناوين المشبوهة وحمولات هجمات الحقن (SQLi & XSS) وتحديث الذاكرة الحية في أجزاء من الثانية
              </p>
            </div>
            <span style={{
              fontSize: '12px', fontWeight: '700', padding: '6px 14px',
              borderRadius: '20px', background: 'rgba(19, 93, 121, 0.08)', color: SOC_THEME.navy
            }}>
              {rules.length} قواعد نشطة
            </span>
          </div>

          {/* Form to add rule */}
          <form onSubmit={handleCreateRule} style={{
            background: '#f8fafc', padding: '16px', borderRadius: '12px',
            border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 100px', gap: '8px' }}>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as any)}
                style={{
                  padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '12px', fontWeight: '700', color: SOC_THEME.textPrimary, background: '#fff'
                }}
              >
                <option value="IP_BLOCK">حظر عنوان IP</option>
                <option value="PAYLOAD_BLOCK">حظر نص (Regex)</option>
              </select>

              <input
                type="text"
                placeholder={ruleType === 'IP_BLOCK' ? 'مثال: 192.168.1.55 أو 10.0.0.1' : 'مثال: UNION SELECT أو <script>'}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={{
                  padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '12px', background: '#fff', color: SOC_THEME.textPrimary, outline: 'none'
                }}
              />

              <button
                type="submit"
                disabled={creatingRule}
                style={{
                  background: SOC_THEME.navy, color: '#fff', border: 'none',
                  borderRadius: '8px', fontSize: '12px', fontWeight: '700',
                  cursor: creatingRule ? 'wait' : 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '6px'
                }}
              >
                {creatingRule ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                <span>إضافة</span>
              </button>
            </div>
            <div style={{ fontSize: '11px', color: SOC_THEME.textMuted }}>
              * يتم بث القاعدة فورياً إلى ذاكرة Redis المشتركة لتطبيقها خلال أجزاء من الثانية دون إعادة تشغيل الخادم.
            </div>
          </form>

          {/* Rules List */}
          <div style={{
            maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            {rules.length === 0 ? (
              <div style={{
                padding: '30px', textAlign: 'center', color: SOC_THEME.textMuted, fontSize: '13px',
                background: '#f8fafc', borderRadius: '10px'
              }}>
                لا توجد قواعد حظر مخصصة حالياً. محرك WAF يعتمد القواعد الأساسية المدمجة.
              </div>
            ) : (
              rules.map(rule => (
                <div key={rule.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px', background: '#ffffff', borderRadius: '10px',
                  border: '1px solid #e2e8f0', transition: 'all 0.15s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{
                      fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px',
                      background: rule.ruleType === 'IP_BLOCK' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(243, 108, 33, 0.1)',
                      color: rule.ruleType === 'IP_BLOCK' ? SOC_THEME.red : SOC_THEME.orange
                    }}>
                      {rule.ruleType}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '700', color: SOC_THEME.textPrimary }}>
                      {rule.target}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    title="حذف وإلغاء الحظر"
                    style={{
                      background: 'transparent', border: 'none', color: SOC_THEME.textMuted,
                      cursor: 'pointer', padding: '6px', borderRadius: '6px', transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = SOC_THEME.red}
                    onMouseLeave={(e) => e.currentTarget.style.color = SOC_THEME.textMuted}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 1: Freeze User Lockdown Modal ──────────────────────────── */}
      {userToFreeze && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', display: 'flex',
            flexDirection: 'column', gap: '16px', animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.red
              }}>
                <AlertOctagon size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: SOC_THEME.textPrimary }}>
                  تأكيد إجراء التجميد الأمني الصارم
                </h4>
                <span style={{ fontSize: '12px', color: SOC_THEME.textSecondary }}>مبدأ عدم الثقة المطلق (Zero-Trust Enforcement)</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: SOC_THEME.textSecondary }}>
              أنت على وشك تجميد حساب المستخدم <strong style={{ color: SOC_THEME.textPrimary }}>{userToFreeze.fullName}</strong> ({userToFreeze.email}).
              سيؤدي هذا الإجراء إلى إبطال توكن الجلسة في Redis فوراً وحظر الدخول وتسجيل الواقعة في السجل الجنائي.
            </p>

            {/* Freeze Reason Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: SOC_THEME.textPrimary }}>
                سبب التجميد الأمني (للتوثيق الجنائي):
              </label>
              <select
                value={freezeReasonPreset}
                onChange={(e) => setFreezeReasonPreset(e.target.value)}
                style={{
                  padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '12px', background: '#fff', color: SOC_THEME.textPrimary
                }}
              >
                <option value="شبهة اختراق أو نشاط أمني مريب">شبهة اختراق أو نشاط أمني مريب</option>
                <option value="محاولة وصول غير مصرح بها أو تجاوز صلاحيات">محاولة وصول غير مصرح بها أو تجاوز صلاحيات</option>
                <option value="إيقاف إداري احترازي بطلب من القيادة العليا">إيقاف إداري احترازي بطلب من القيادة العليا</option>
                <option value="انتهاك سياسة أمن المعلومات وحوكمة البيانات">انتهاك سياسة أمن المعلومات وحوكمة البيانات</option>
                <option value="مغادرة أو نقل مؤقت للموظف">مغادرة أو نقل مؤقت للموظف</option>
              </select>
            </div>

            {/* Custom Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: SOC_THEME.textPrimary }}>
                ملاحظات وتفاصيل إضافية (اختياري):
              </label>
              <textarea
                rows={2}
                placeholder="أدخل أي تفاصيل داعمة لقرار التجميد..."
                value={freezeCustomReason}
                onChange={(e) => setFreezeCustomReason(e.target.value)}
                style={{
                  padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '12px', outline: 'none', resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleConfirmFreeze}
                disabled={actionInProgress !== null}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: SOC_THEME.red, color: '#fff', fontSize: '13px', fontWeight: '800',
                  cursor: actionInProgress !== null ? 'wait' : 'pointer'
                }}
              >
                {actionInProgress !== null ? 'جاري التجميد والتعميم...' : 'تأكيد التجميد والطرد الفوري'}
              </button>
              <button
                type="button"
                onClick={() => setUserToFreeze(null)}
                disabled={actionInProgress !== null}
                style={{
                  padding: '10px 18px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: '#f8fafc', color: SOC_THEME.textSecondary, fontSize: '13px',
                  fontWeight: '600', cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Payload Forensic Inspector ─────────────────────────── */}
      {inspectedLog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', maxWidth: '640px', width: '100%',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', display: 'flex',
            flexDirection: 'column', gap: '16px', maxHeight: '85vh', overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={20} style={{ color: SOC_THEME.navy }} />
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: SOC_THEME.navy }}>
                  فحص الحمولة الجنائية للسجل (Forensic Payload Inspector)
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setInspectedLog(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: SOC_THEME.textMuted }}
              >
                ✕
              </button>
            </div>

            {/* Metadata Summary */}
            <div style={{
              background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', border: '1px solid #e2e8f0',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '12px'
            }}>
              <div>
                <span style={{ color: SOC_THEME.textSecondary }}>الحدث / الإجراء: </span>
                <strong style={{ color: SOC_THEME.textPrimary }}>{inspectedLog.eventType || inspectedLog.action}</strong>
              </div>
              <div>
                <span style={{ color: SOC_THEME.textSecondary }}>عنوان IP المصدر: </span>
                <strong style={{ color: SOC_THEME.navy, fontFamily: 'monospace' }}>{inspectedLog.sourceIp || inspectedLog.ipAddress || '127.0.0.1'}</strong>
              </div>
              <div>
                <span style={{ color: SOC_THEME.textSecondary }}>التوقيت الدقيق: </span>
                <strong style={{ color: SOC_THEME.textPrimary }}>{new Date(inspectedLog.createdAt).toLocaleString('ar-LY')}</strong>
              </div>
              <div>
                <span style={{ color: SOC_THEME.textSecondary }}>مستوى الخطورة: </span>
                <strong style={{ color: inspectedLog.severity === 'CRITICAL' ? SOC_THEME.red : SOC_THEME.navy }}>
                  {inspectedLog.severity || 'تدقيق معتمد'}
                </strong>
              </div>
            </div>

            {/* JSON / Payload Viewer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>
                  محتوى الحمولة التقنية (Payload Data):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const raw = inspectedLog.details || inspectedLog.changes;
                    navigator.clipboard.writeText(typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2));
                    showToast('تم نسخ تفاصيل الحمولة إلى الحافظة بنجاح.');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent',
                    border: 'none', color: SOC_THEME.navy, fontSize: '11px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  <Copy size={12} />
                  <span>نسخ البيانات</span>
                </button>
              </div>

              <pre style={{
                margin: 0, padding: '14px', borderRadius: '10px', background: '#0f172a', color: '#38bdf8',
                fontSize: '11px', fontFamily: 'monospace', overflowY: 'auto', flex: 1, direction: 'ltr',
                textAlign: 'left', lineHeight: '1.5'
              }}>
                {(() => {
                  const raw = inspectedLog.details || inspectedLog.changes;
                  if (!raw) return '// No payload details recorded';
                  try {
                    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    return JSON.stringify(parsed, null, 2);
                  } catch {
                    return String(raw);
                  }
                })()}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setInspectedLog(null)}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: '#f8fafc', color: SOC_THEME.textPrimary, fontSize: '12px',
                  fontWeight: '700', cursor: 'pointer'
                }}
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
