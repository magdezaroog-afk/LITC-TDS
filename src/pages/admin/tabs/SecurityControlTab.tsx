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
  AlertOctagon
} from 'lucide-react';
import { AdminAPI } from '../../../services/admin.api';

// Enterprise Design Tokens
const SOC_THEME = {
  navy: '#135d79',
  navyDark: '#0c3c4e',
  orange: '#f36c21',
  emerald: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
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
  // Telemetry & SOC States
  const [telemetry, setTelemetry] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  
  // UI & Loading States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  // Rule Creation Form
  const [ruleType, setRuleType] = useState<'IP_BLOCK' | 'PAYLOAD_BLOCK'>('IP_BLOCK');
  const [target, setTarget] = useState('');
  const [action, setAction] = useState('BLOCK');
  const [creatingRule, setCreatingRule] = useState(false);
  
  // Filtering & Search
  const [logSeverityFilter, setLogSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  
  // Kick/Freeze Modal State
  const [userToKick, setUserToKick] = useState<{ id: number; fullName: string; email: string } | null>(null);
  const [kicking, setKicking] = useState(false);

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
      const [telRes, ruleRes, logRes, sessRes] = await Promise.allSettled([
        AdminAPI.getSOCTelemetry(),
        AdminAPI.getWAFRules(),
        AdminAPI.getSIEMLogs(),
        AdminAPI.getActiveSessions()
      ]);

      if (telRes.status === 'fulfilled') setTelemetry(telRes.value);
      if (ruleRes.status === 'fulfilled') setRules(ruleRes.value?.rules || []);
      if (logRes.status === 'fulfilled') setLogs(logRes.value?.logs || []);
      if (sessRes.status === 'fulfilled') setSessions(sessRes.value?.users || []);

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

  // Confirm Freeze & Kick Session
  const confirmKickSession = async () => {
    if (!userToKick) return;
    setKicking(true);
    try {
      await AdminAPI.kickUserSession(userToKick.id);
      showToast(`تم تجميد حساب [${userToKick.fullName}] وإبطال كافة جلساته النشطة فوراً.`);
      setUserToKick(null);
      await fetchSOCData();
    } catch (err: any) {
      showToast(err.message || 'فشل في تجميد الجلسة', 'error');
    } finally {
      setKicking(false);
    }
  };

  // Formatter for Server Uptime
  const formatUptime = (seconds: number = 0) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d} يوم ` : ''}${h} س ${m} د ${s} ث`;
  };

  // Filtered SIEM logs
  const filteredLogs = logs.filter(log => {
    if (logSeverityFilter === 'ALL') return true;
    return log.severity === logSeverityFilter;
  });

  if (loading) {
    return (
      <div dir="rtl" style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '400px', gap: '16px', color: SOC_THEME.navy
      }}>
        <RefreshCw size={36} className="animate-spin" style={{ color: SOC_THEME.navy }} />
        <span style={{ fontSize: '15px', fontWeight: '600' }}>جاري الاتصال بمركز العمليات الأمنية (LITC SOC)...</span>
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
                مركز العمليات الأمنية والحوكمة السيبرانية (Enterprise SOC)
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '13px', opacity: 0.85 }}>
                مراقبة لحظية استباقية لمعايير NIST CSF 2.0 ومحرك الحماية من هجمات OWASP Top 10
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Sync Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1, flexWrap: 'wrap' }}>
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

      {/* ─── Bento Row 1: Bare-Metal Hardware & Telemetry ─────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px'
      }}>
        {/* CPU */}
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '20px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: SOC_THEME.textSecondary }}>استهلاك المعالج (CPU)</span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(19, 93, 121, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.navy
            }}>
              <Cpu size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 10px' }}>
            <div style={{
              fontSize: '28px', fontWeight: '800',
              color: cpuVal > 80 ? SOC_THEME.red : cpuVal > 50 ? SOC_THEME.amber : SOC_THEME.navy
            }}>
              {cpuVal}%
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
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
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '20px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: SOC_THEME.textSecondary }}>ذاكرة الخادم (RAM)</span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(243, 108, 33, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.orange
            }}>
              <Server size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 10px' }}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: SOC_THEME.navy }}>
              {ramUsage} <span style={{ fontSize: '14px', fontWeight: '600', color: SOC_THEME.textSecondary }}>MB</span>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
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
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '20px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: SOC_THEME.textSecondary }}>قاعدة البيانات (Prisma DB)</span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.emerald
            }}>
              <Database size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px',
                background: telemetry?.dbAlive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                color: telemetry?.dbAlive ? SOC_THEME.emerald : SOC_THEME.red,
                fontSize: '14px', fontWeight: '700'
              }}>
                <div style={{
                  width: '8px', height: '8px', borderRadius: '50%',
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
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '20px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: SOC_THEME.textSecondary }}>مدة التشغيل المستمر</span>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(19, 93, 121, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.navy
            }}>
              <Clock size={18} />
            </div>
          </div>
          <div style={{ margin: '14px 0 10px' }}>
            <div style={{ fontSize: '20px', fontWeight: '800', color: SOC_THEME.navy }}>
              {formatUptime(telemetry?.uptime)}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: SOC_THEME.textMuted }}>منذ آخر إعادة تشغيل للمحرك</span>
        </div>
      </div>

      {/* ─── Bento Row 2: WAF Rules Builder + SIEM Logs Explorer ──────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px'
      }}>
        
        {/* WAF Policies Engine */}
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '24px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: SOC_THEME.navy, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} style={{ color: SOC_THEME.orange }} />
                جدار الحماية من الهجمات (WAF Policy Engine)
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: SOC_THEME.textSecondary }}>
                قواعد حظر العناوين المشبوهة وحمولات هجمات الحقن (SQLi & XSS) لحظياً
              </p>
            </div>
            <span style={{
              fontSize: '11px', fontWeight: '700', padding: '4px 10px',
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
            <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 100px', gap: '8px' }}>
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as any)}
                style={{
                  padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  fontSize: '12px', fontWeight: '600', color: SOC_THEME.textPrimary, background: '#fff'
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
            maxHeight: '260px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'
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
                  padding: '10px 14px', background: '#ffffff', borderRadius: '10px',
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
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '600', color: SOC_THEME.textPrimary }}>
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

        {/* SIEM Security Logs Feed */}
        <div style={{
          background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '24px',
          border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
          flexDirection: 'column', gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: SOC_THEME.navy, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={18} style={{ color: SOC_THEME.navy }} />
                سجلات الأمن والـ SIEM الحقيقية
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: SOC_THEME.textSecondary }}>
                تدفق مباشر للأحداث المسجلة في جدول SecurityEventLog
              </p>
            </div>

            {/* Severity Filter */}
            <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(sev => (
                <button
                  key={sev}
                  onClick={() => setLogSeverityFilter(sev)}
                  style={{
                    border: 'none', background: logSeverityFilter === sev ? '#ffffff' : 'transparent',
                    color: logSeverityFilter === sev ? SOC_THEME.navy : SOC_THEME.textSecondary,
                    padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                    cursor: 'pointer', boxShadow: logSeverityFilter === sev ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                >
                  {sev === 'ALL' ? 'الكل' : sev}
                </button>
              ))}
            </div>
          </div>

          {/* Logs Feed Container */}
          <div style={{
            maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px'
          }}>
            {filteredLogs.length === 0 ? (
              <div style={{
                padding: '40px', textAlign: 'center', color: SOC_THEME.textMuted, fontSize: '13px',
                background: '#f8fafc', borderRadius: '10px'
              }}>
                لا توجد اختراقات أو أحداث مسجلة بمستوى الخطورة المحدد.
              </div>
            ) : (
              filteredLogs.map(log => {
                const isCrit = log.severity === 'CRITICAL';
                const isWarn = log.severity === 'WARNING';
                const sevColor = isCrit ? SOC_THEME.red : isWarn ? SOC_THEME.amber : SOC_THEME.navy;

                return (
                  <div key={log.id} style={{
                    padding: '12px 14px', borderRadius: '10px',
                    background: isCrit ? 'rgba(239, 68, 68, 0.04)' : '#ffffff',
                    border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.2)' : '#e2e8f0'}`,
                    display: 'flex', flexDirection: 'column', gap: '4px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '4px',
                          background: `${sevColor}15`, color: sevColor
                        }}>
                          {log.severity}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: SOC_THEME.textPrimary }}>
                          {log.eventType}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: SOC_THEME.textMuted }}>
                        {new Date(log.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', color: SOC_THEME.textSecondary }}>
                        IP: {log.sourceIp || '127.0.0.1'}
                      </span>
                      {log.payload && (
                        <span style={{
                          fontSize: '10px', color: SOC_THEME.textMuted, maxWidth: '240px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                          {typeof log.payload === 'string' ? log.payload : JSON.stringify(log.payload)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─── Bento Row 3: Active User Sessions & Zero-Trust Governance ───── */}
      <div style={{
        background: SOC_THEME.cardBg, borderRadius: SOC_THEME.radius, padding: '24px',
        border: `1px solid ${SOC_THEME.cardBorder}`, boxShadow: SOC_THEME.shadow, display: 'flex',
        flexDirection: 'column', gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: SOC_THEME.navy, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} style={{ color: SOC_THEME.emerald }} />
              حوض الجلسات النشطة والحوكمة الفورية (Zero-Trust Session Management)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: SOC_THEME.textSecondary }}>
              مراقبة الحسابات المتصلة حالياً مع إمكانية التجميد الفوري وطرد أي حساب مشبوه
            </p>
          </div>
          <span style={{
            fontSize: '12px', fontWeight: '700', padding: '6px 14px',
            borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)', color: SOC_THEME.emerald
          }}>
            {sessions.length} حساب نشط
          </span>
        </div>

        {/* Sessions Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>معرف المستخدم</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>الاسم الكامل</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>البريد الإلكتروني المؤسسي</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary }}>الحالة الأمنية</th>
                <th style={{ padding: '12px 14px', fontSize: '12px', fontWeight: '700', color: SOC_THEME.textSecondary, textAlign: 'center' }}>إجراء الطوارئ</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: SOC_THEME.textMuted, fontSize: '13px' }}>
                    لا توجد جلسات نشطة حالياً.
                  </td>
                </tr>
              ) : (
                sessions.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px', fontSize: '12px', fontFamily: 'monospace', color: SOC_THEME.textMuted }}>
                      #{user.id}
                    </td>
                    <td style={{ padding: '14px', fontSize: '13px', fontWeight: '700', color: SOC_THEME.textPrimary }}>
                      {user.fullName || 'مستخدم غير مسمى'}
                    </td>
                    <td style={{ padding: '14px', fontSize: '12px', color: SOC_THEME.textSecondary }}>
                      {user.email}
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px',
                        background: 'rgba(16, 185, 129, 0.1)', color: SOC_THEME.emerald
                      }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: SOC_THEME.emerald }} />
                        جلسة موثقة
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'center' }}>
                      <button
                        onClick={() => setUserToKick(user)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)', color: SOC_THEME.red,
                          border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 12px',
                          borderRadius: '8px', fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                          display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s'
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
                        <span>تجميد وطرد الجلسة</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Confirmation Modal for Freeze/Kick ────────────────────────────── */}
      {userToKick && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%',
            padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex',
            flexDirection: 'column', gap: '16px', animation: 'scaleUp 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: SOC_THEME.red
              }}>
                <AlertOctagon size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: SOC_THEME.textPrimary }}>
                  تأكيد إجراء الطوارئ الأمني
                </h4>
                <span style={{ fontSize: '12px', color: SOC_THEME.textSecondary }}>مبدأ عدم الثقة المطلق (Zero-Trust)</span>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.6', color: SOC_THEME.textSecondary }}>
              أنت على وشك تجميد حساب المستخدم <strong style={{ color: SOC_THEME.textPrimary }}>{userToKick.fullName}</strong> ({userToKick.email}).
              سيؤدي هذا الإجراء إلى إبطال توكن الجلسة فوراً ومنعه من تسجيل الدخول حتى مراجعة الأدمن.
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                onClick={confirmKickSession}
                disabled={kicking}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: SOC_THEME.red, color: '#fff', fontSize: '13px', fontWeight: '700',
                  cursor: kicking ? 'wait' : 'pointer'
                }}
              >
                {kicking ? 'جاري التجميد...' : 'تأكيد التجميد والطرد'}
              </button>
              <button
                onClick={() => setUserToKick(null)}
                disabled={kicking}
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

    </div>
  );
};
