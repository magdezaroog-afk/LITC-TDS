import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHub } from '../context/HubContext';
import * as LucideIcons from 'lucide-react';
import {
  Plus, CheckCircle2, XCircle, FileText,
  Search, Clock, ChevronLeft, ChevronUp, Building2,
  Activity, Layers, X, Sparkles, Filter, Ticket, Archive
} from 'lucide-react';
import { RequestTrackingModal } from '../components/RequestTrackingModal';
import { CinemaTicketFrame, TicketCodeBadge } from '../components/CinemaTicketFrame';
import { InlineRequestCreator } from '../components/InlineRequestCreator';
import { UserRecentRequest } from '../types';

// ── Dynamic Icon Resolver ──────────────────────────────────
const resolveCategoryIcon = (iconName?: string) => {
  if (!iconName) return FileText;
  const emojiMap: Record<string, string> = {
    '💻': 'Monitor', '🏗️': 'Building2', '📋': 'ClipboardList', '🔧': 'Wrench',
    '📡': 'Radio', '🔒': 'Lock', '📊': 'BarChart3', '🏥': 'HeartPulse',
    '📞': 'Phone', '🖨️': 'Printer', '⚡': 'Zap', '🌐': 'Globe',
    '🗄️': 'Archive', '📱': 'Smartphone', '🔑': 'Key'
  };
  const resolved = emojiMap[iconName] || iconName;
  return (LucideIcons as any)[resolved] || FileText;
};

// ── Semantic Status Badges (ERP Guidelines: Muted Tints & Subtle Glow) ──
const STATUS_CONFIG = {
  pending: {
    label: 'قيد الانتظار',
    color: '#fbbf24',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.25)',
    dot: '#f59e0b',
    icon: Clock,
  },
  in_progress: {
    label: 'قيد المعالجة',
    color: '#60a5fa',
    bg: 'rgba(59, 130, 246, 0.12)',
    border: 'rgba(59, 130, 246, 0.25)',
    dot: '#3b82f6',
    icon: Activity,
  },
  completed: {
    label: 'مؤرشف ومُعتمد',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
    dot: '#10b981',
    icon: Archive,
  },
  approved: {
    label: 'موافق عليه',
    color: '#34d399',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.25)',
    dot: '#10b981',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'مرفوض',
    color: '#f87171',
    bg: 'rgba(239, 68, 68, 0.12)',
    border: 'rgba(239, 68, 68, 0.25)',
    dot: '#ef4444',
    icon: XCircle,
  },
};

// ── Authentic Cinema-Ticket KPI Metric Card (Matching User's Reference Exact Contour) ──
function MetricTile({
  label,
  value,
  sublabel,
  icon: Icon,
  accentColor,
  isSelected = false,
  onClick,
  darkMode = true,
}: {
  label: string;
  value: string | number;
  sublabel: string;
  icon: any;
  accentColor: string;
  isSelected?: boolean;
  onClick?: () => void;
  darkMode?: boolean;
}) {
  return (
    <CinemaTicketFrame
      accentColor={accentColor}
      isSelected={isSelected}
      onClick={onClick}
      cornerCutout={13}
      notchRadius={5.5}
      numNotches={3}
      dashIndent={18}
      role="button"
      tabIndex={0}
      style={{
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12px',
            fontWeight: isSelected ? 800 : 600,
            color: isSelected ? (darkMode ? '#ffffff' : '#0f172a') : (darkMode ? '#94a3b8' : '#475569'),
            fontFamily: "'Cairo', sans-serif",
            transition: 'color 0.15s ease',
          }}>
            {label}
          </span>
          {isSelected && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '9.5px',
              fontWeight: 700,
              color: accentColor,
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}35`,
              padding: '1px 6px',
              borderRadius: '9999px',
              fontFamily: "'Cairo', sans-serif",
            }}>
              <span style={{
                width: '4.5px',
                height: '4.5px',
                borderRadius: '50%',
                backgroundColor: accentColor,
                boxShadow: `0 0 6px ${accentColor}`,
              }} />
              نشط
            </span>
          )}
        </div>
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: isSelected ? `${accentColor}18` : (darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(30, 58, 82, 0.05)'),
          border: isSelected ? `1px solid ${accentColor}40` : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(30, 58, 82, 0.12)'),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}>
          <Icon size={14} color={accentColor} strokeWidth={isSelected ? 2.3 : 2} />
        </div>
      </div>

      <div style={{ marginTop: '8px' }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 800,
          color: darkMode ? '#ffffff' : '#0f172a',
          lineHeight: 1,
          fontFamily: "'Tajawal', sans-serif",
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '10.5px',
          color: isSelected ? (darkMode ? '#cbd5e1' : '#334155') : (darkMode ? '#64748b' : '#64748b'),
          marginTop: '4px',
          fontWeight: 500,
          fontFamily: "'Cairo', sans-serif",
        }}>
          {sublabel}
        </div>
      </div>
    </CinemaTicketFrame>
  );
}

// ── Status Badge Component (Anti-AI Cliché, Crisp & Symmetrical) ──
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '3px 9px',
      borderRadius: '9999px',
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      fontSize: '11.5px',
      fontWeight: 700,
      fontFamily: "'Cairo', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        backgroundColor: cfg.dot,
        flexShrink: 0,
        boxShadow: `0 0 6px ${cfg.dot}`,
      }} />
      {cfg.label}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN REQUESTS PAGE (THE EXECUTIVE SERVICE DESK)
// ══════════════════════════════════════════════════════════════
export default function RequestsPage() {
  const { setRequestOpen, setActiveRequest, requests, userRequests, language, darkMode } = useHub();
  const isRtl = language === 'ar';
  const [selectedRequest, setSelectedRequest] = useState<UserRecentRequest | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('create');
  
  const handleSelectFlow = (flow: any) => {
    setActiveRequest(flow);
    setRequestOpen(true);
  };

  // تمييز ما إذا كانت المعاملة مكتملة ومؤرشفة
  const isDone = (r: UserRecentRequest) =>
    r.isArchived ||
    r.status === 'completed' ||
    r.status === 'approved' ||
    r.rating !== undefined ||
    (r as any).statusName === 'CLOSED';

  // المعاملات المكتملة التي تحتاج إلى تقييم الموظف
  const isNeedsRating = (r: UserRecentRequest) =>
    isDone(r) && (r.rating === undefined || r.rating === null || r.rating === 0);

  const stats = useMemo(() => {
    return {
      // 1. المعاملات النشطة (كل المعاملات التي تم تقديمها ولم تكتمل)
      active: userRequests.filter(r => !isDone(r)).length,
      // 2. طلبات تحتاج إلى التقييم
      needsRating: userRequests.filter(r => isNeedsRating(r)).length,
      // 3. أرشيف المعاملات (المعاملات المكتملة السابقة)
      archived: userRequests.filter(r => isDone(r)).length,
    };
  }, [userRequests]);

  const filteredRequests = useMemo(() => {
    return userRequests.filter(r => {
      const archived = isDone(r);
      const needsRating = isNeedsRating(r);

      const matchSearch = searchQuery === '' ||
        (isRtl ? r.title : r.titleEn || r.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchSearch) return false;

      // 2. طلبات تحتاج إلى التقييم
      if (filterStatus === 'needs_rating') {
        return needsRating;
      }
      // 3. أرشيف المعاملات (المعاملات المكتملة السابقة)
      if (filterStatus === 'completed' || filterStatus === 'archived') {
        return archived;
      }
      // 1. المعاملات النشطة (active, create, all) - كل المعاملات التي لم تكتمل
      return !archived;
    });
  }, [userRequests, searchQuery, filterStatus, isRtl]);

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>

      {/* ═══ 1. REFINED PAGE HEADER & CONTEXT ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '14px',
        borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        flexWrap: 'wrap',
        gap: '12px',
        transition: 'border-color 0.25s ease',
      }}>
        <div>
          {/* Breadcrumb Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            color: '#64748b',
            fontFamily: "'Cairo', sans-serif",
            fontWeight: 500,
            marginBottom: '4px',
          }}>
            <span>بوابة الموظف</span>
            <span>/</span>
            <span style={{ color: darkMode ? '#60a5fa' : '#1e3a52', fontWeight: 600 }}>مركز المعاملات والطلبات</span>
          </div>

          <h1 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: darkMode ? '#ffffff' : '#0f172a',
            margin: '0 0 2px',
            letterSpacing: '-0.02em',
            fontFamily: "'Tajawal', sans-serif",
          }}>
            مركز متابعة المعاملات والطلبات
          </h1>
          <p style={{ fontSize: '12.5px', color: darkMode ? '#94a3b8' : '#475569', margin: 0, fontFamily: "'Cairo', sans-serif", fontWeight: 500 }}>
            منظومة NEXUS TDS الذكية لمتابعة مسار الإجراءات وحالات الاعتماد وإدارة التذاكر.
          </p>
        </div>

        {/* Live Operational Status Indicator */}
        <div style={{
          fontSize: '11.5px',
          fontWeight: 600,
          color: darkMode ? '#34d399' : '#059669',
          backgroundColor: darkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.08)',
          border: darkMode ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.3)',
          padding: '4px 10px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: "'Cairo', sans-serif",
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }} />
          <span>الخدمات التشغيلية: نشطة ومتاحة</span>
        </div>
      </div>

      {/* ═══ 2. MAIN WORKSPACE: 2-COLUMN LAYOUT (VERTICAL FILTER RAIL ON RIGHT + TABLE ON LEFT) ═══ */}
      <div className="workspace-grid-layout">

        {/* ── RIGHT COLUMN: VERTICAL KPI STATUS FILTER RAIL (يمين الشاشة تحت بعض) ── */}
        <aside
          className="mobile-status-rail"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            position: 'sticky',
            top: '20px',
          }}
        >
          {/* ── 1. PRIMARY CREATION TICKET: إنشاء طلب جديد (الوضع الفاتح بلمسة ذهبي الشعار) ── */}
          <CinemaTicketFrame
            accentColor={darkMode ? "#38bdf8" : "#d97706"}
            isSelected={filterStatus === 'create'}
            alwaysGlow={filterStatus === 'create'}
            cornerCutout={13}
            notchRadius={5.5}
            numNotches={3}
            dashIndent={18}
            role="button"
            tabIndex={0}
            className="mobile-create-ticket"
            onClick={() => {
              setFilterStatus(filterStatus === 'create' ? 'all' : 'create');
            }}
            style={{
              width: '100%',
              marginBottom: '2px',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: darkMode ? '#ffffff' : '#0f172a',
                  fontFamily: "'Cairo', sans-serif",
                }}>
                  إنشاء طلب جديد
                </span>
                {filterStatus === 'create' ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: darkMode ? '#38bdf8' : '#d97706',
                    backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(217, 119, 6, 0.15)',
                    border: `1px solid ${darkMode ? 'rgba(56, 189, 248, 0.4)' : 'rgba(217, 119, 6, 0.35)'}`,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    fontFamily: "'Cairo', sans-serif",
                  }}>
                    <span style={{
                      width: '4.5px',
                      height: '4.5px',
                      borderRadius: '50%',
                      backgroundColor: darkMode ? '#38bdf8' : '#d97706',
                      boxShadow: `0 0 6px ${darkMode ? '#38bdf8' : '#d97706'}`,
                    }} />
                    نشط
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    color: darkMode ? '#38bdf8' : '#d97706',
                    backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(217, 119, 6, 0.12)',
                    border: `1px solid ${darkMode ? 'rgba(56, 189, 248, 0.35)' : 'rgba(217, 119, 6, 0.3)'}`,
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    fontFamily: "'Cairo', sans-serif",
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    <span style={{
                      width: '4.5px',
                      height: '4.5px',
                      borderRadius: '50%',
                      backgroundColor: darkMode ? '#38bdf8' : '#d97706',
                      boxShadow: `0 0 6px ${darkMode ? '#38bdf8' : '#d97706'}`,
                    }} />
                    {requests.length} مسارات
                  </span>
                )}
              </div>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: filterStatus === 'create' 
                  ? (darkMode ? 'rgba(56, 189, 248, 0.28)' : 'rgba(217, 119, 6, 0.2)')
                  : (darkMode ? 'rgba(56, 189, 248, 0.18)' : 'rgba(217, 119, 6, 0.12)'),
                border: filterStatus === 'create' 
                  ? (darkMode ? '1px solid #38bdf8' : '1px solid #d97706')
                  : (darkMode ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(217, 119, 6, 0.3)'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: darkMode ? '#38bdf8' : '#d97706',
              }}>
                <Plus size={15} strokeWidth={2.4} />
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <div style={{
                fontSize: '17px',
                fontWeight: 800,
                color: darkMode ? '#38bdf8' : '#d97706',
                lineHeight: 1.2,
                fontFamily: "'Tajawal', sans-serif",
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span>تقديم معاملة جديدة</span>
                <ChevronLeft size={16} />
              </div>
              <div style={{
                fontSize: '10.5px',
                color: filterStatus === 'create' ? (darkMode ? '#e0f2fe' : '#92400e') : (darkMode ? '#94a3b8' : '#64748b'),
                marginTop: '4px',
                fontWeight: 500,
                fontFamily: "'Cairo', sans-serif",
              }}>
                انقر لفتح دليل المسارات وتعبئة الطلب
              </div>
            </div>
          </CinemaTicketFrame>
        </aside>

        {/* ── LEFT COLUMN: WORKSPACE SECTION (3 CARDS + ROUTE CREATOR + LEDGER TABLE) ── */}
        <section style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── 1. ROUTE PICKER & CREATOR (When in create mode) ── */}
          <AnimatePresence>
            {filterStatus === 'create' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <InlineRequestCreator
                  onCancel={() => setFilterStatus('active')}
                  onSuccess={() => setFilterStatus('active')}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 2. THREE PRIMARY HORIZONTAL KPI TILES (1: المعاملات النشطة | 2: طلبات تحتاج إلى التقييم | 3: أرشيف المعاملات) ── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
          }}>
            {/* Box 1 (Right): المعاملات النشطة */}
            <MetricTile
              label="المعاملات النشطة"
              value={stats.active}
              sublabel="جميع المعاملات الجارية ولم تكتمل"
              icon={Activity}
              accentColor={darkMode ? "#38bdf8" : "#0284c7"}
              isSelected={filterStatus === 'active' || filterStatus === 'all'}
              onClick={() => setFilterStatus('active')}
              darkMode={darkMode}
            />

            {/* Box 2 (Center): طلبات تحتاج الي التقييم */}
            <MetricTile
              label="طلبات تحتاج الي التقييم"
              value={stats.needsRating}
              sublabel="معاملات مكتملة بانتظار تقييمك"
              icon={Sparkles}
              accentColor="#f59e0b"
              isSelected={filterStatus === 'needs_rating'}
              onClick={() => setFilterStatus('needs_rating')}
              darkMode={darkMode}
            />

            {/* Box 3 (Left): أرشيف المعاملات */}
            <MetricTile
              label="أرشيف المعاملات"
              value={stats.archived}
              sublabel="المعاملات المنجزة والمقيمة سابقاً"
              icon={Archive}
              accentColor="#10b981"
              isSelected={filterStatus === 'completed' || filterStatus === 'archived'}
              onClick={() => setFilterStatus('completed')}
              darkMode={darkMode}
            />
          </div>

          {/* ── 3. TRANSACTIONS LEDGER TABLE (سجل المعاملات المصفاة) ── */}
          <div style={{
            backgroundColor: darkMode ? '#111827' : '#ffffff',
            borderRadius: '8px',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            overflow: 'hidden',
            boxShadow: darkMode ? '0 8px 30px rgba(0, 0, 0, 0.35)' : '0 4px 20px -2px rgba(30, 58, 82, 0.08)',
            transition: 'all 0.25s ease',
          }}>
        {/* Table Toolbar */}
        <div style={{
          padding: '12px 18px',
          borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: darkMode ? '#0d1322' : '#f8fafc',
          transition: 'all 0.25s ease',
        }}>
          {/* Title & Count Badge & Active Filter Reset */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{
              fontSize: '14.5px',
              fontWeight: 700,
              color: darkMode ? '#ffffff' : '#0f172a',
              margin: 0,
              letterSpacing: '-0.01em',
              fontFamily: "'Tajawal', sans-serif",
            }}>
              {filterStatus === 'completed' || filterStatus === 'archived'
                ? 'أرشيف المعاملات المكتملة السابقة'
                : filterStatus === 'needs_rating'
                ? 'طلبات تحتاج إلى التقييم ⭐'
                : 'سجل المعاملات والطلبات النشطة'}
            </h2>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0',
              color: darkMode ? '#cbd5e1' : '#334155',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {filteredRequests.length} {
                filterStatus === 'completed' || filterStatus === 'archived' ? 'معاملة سابقة' :
                filterStatus === 'needs_rating' ? 'بانتظار التقييم' : 'معاملة نشطة'
              }
            </span>

            {/* Quick Filter Reset Badge when not 'active' */}
            {filterStatus !== 'active' && filterStatus !== 'create' && filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('active')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: darkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(30, 58, 82, 0.08)',
                  color: darkMode ? '#60a5fa' : '#1e3a52',
                  border: darkMode ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid rgba(30, 58, 82, 0.2)',
                  cursor: 'pointer',
                  fontFamily: "'Cairo', sans-serif",
                  transition: 'all 0.15s ease',
                }}
                title="إلغاء التصفية والعودة للمعاملات النشطة"
              >
                <span>تصفية: {
                  filterStatus === 'needs_rating' ? 'طلبات تحتاج إلى التقييم' :
                  filterStatus === 'completed' || filterStatus === 'archived' ? 'أرشيف المعاملات' : filterStatus
                }</span>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Controls: Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search
                size={13}
                color="#64748b"
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  insetInlineStart: '10px',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث بالرمز أو الموضوع أو الإدارة..."
                style={{
                  paddingInlineStart: '30px',
                  paddingInlineEnd: searchQuery ? '28px' : '12px',
                  paddingTop: '6px',
                  paddingBottom: '6px',
                  borderRadius: '6px',
                  backgroundColor: darkMode ? '#0b0f19' : '#ffffff',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  fontSize: '12px',
                  fontFamily: "'Cairo', sans-serif",
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  outline: 'none',
                  width: '240px',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                }}
                onFocus={e => {
                  e.target.style.borderColor = darkMode ? '#2563eb' : '#1e3a52';
                  e.target.style.boxShadow = `0 0 0 1px ${darkMode ? '#2563eb' : '#1e3a52'}`;
                }}
                onBlur={e => {
                  e.target.style.borderColor = darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    insetInlineEnd: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="مسح البحث"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Structured Data Table */}
        {filteredRequests.length === 0 ? (
          <div style={{
            padding: '50px 20px',
            textAlign: 'center',
            backgroundColor: darkMode ? '#111827' : '#ffffff',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(30, 58, 82, 0.05)',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}>
              <FileText size={18} color="#64748b" />
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e293b', fontFamily: "'Cairo', sans-serif" }}>
              {filterStatus === 'completed' ? 'لا توجد طلبات سابقة في الأرشيف' : 'لا توجد معاملات نشطة حالياً'}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px', fontFamily: "'Cairo', sans-serif" }}>
              {searchQuery
                ? 'لا توجد نتائج مطابقة لبحثك الحالي'
                : filterStatus === 'completed'
                ? 'عند إنجاز وتقييم أي معاملة ستنتقل تلقائياً إلى هذا الأرشيف'
                : 'كافة معاملاتك السابقة مؤرشفة بنجاح. يمكنك تقديم معاملة جديدة عند الحاجة'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="litc-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>رمز المعاملة</th>
                  <th>نوع الخدمة والموضوع</th>
                  <th style={{ width: '200px' }}>الإدارة المستهدفة</th>
                  <th style={{ width: '120px' }}>تاريخ التقديم</th>
                  <th style={{ width: '130px' }}>الحالة الإجرائية</th>
                  <th style={{ width: '120px', textAlign: 'start' }}>الإجراء والمتابعة</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => {
                  const matchedFlow = requests.find(f => f.id === req.categoryId || f.id === (req as any).flowDefinitionId || f.title === req.title);
                  const routeColor = matchedFlow?.color || '#38bdf8';

                  return (
                    <tr
                      key={req.id}
                      onClick={() => {
                        setSelectedRequest(req);
                        setIsTrackingOpen(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Monospace Code with Cinema Ticket Badge */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <TicketCodeBadge
                          code={req.code || `#REQ-${req.id.slice(-4).toUpperCase()}`}
                          color={routeColor}
                        />
                      </td>

                      {/* Title & Service */}
                      <td>
                        <div style={{ fontWeight: 600, color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13.5px', fontFamily: "'Cairo', sans-serif" }}>
                          {isRtl ? req.title : req.titleEn || req.title}
                        </div>
                        {req.stage && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontFamily: "'Cairo', sans-serif" }}>
                            المرحلة الحالية: {req.stage}
                          </div>
                        )}
                      </td>

                      {/* Target Department */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', color: darkMode ? '#cbd5e1' : '#334155', fontFamily: "'Cairo', sans-serif", fontWeight: 500 }}>
                          <Building2 size={13} color="#64748b" />
                          <span>{req.department || 'إدارة الشؤون الفنية'}</span>
                        </div>
                      </td>

                      {/* Tabular Formatted Date */}
                      <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: darkMode ? '#94a3b8' : '#64748b', fontVariantNumeric: 'tabular-nums', fontFamily: "'Cairo', sans-serif" }}>
                        {req.date || 'اليوم'}
                      </td>

                      {/* Semantic Status Badge */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <StatusBadge status={req.status} />
                      </td>

                      {/* Action Button (outline button or rating action) */}
                      <td style={{ whiteSpace: 'nowrap', textAlign: 'start' }}>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedRequest(req);
                            setIsTrackingOpen(true);
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: isNeedsRating(req)
                              ? '1px solid #f59e0b'
                              : (darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                            backgroundColor: isNeedsRating(req)
                              ? (darkMode ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb')
                              : (darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                            color: isNeedsRating(req)
                              ? '#d97706'
                              : (darkMode ? '#cbd5e1' : '#1e3a52'),
                            fontSize: '11.5px',
                            fontWeight: isNeedsRating(req) ? 700 : 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            fontFamily: "'Cairo', sans-serif",
                            boxShadow: isNeedsRating(req) ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                          }}
                        >
                          {isNeedsRating(req) ? (
                            <>
                              <span>⭐ قيّم الطلب</span>
                              <ChevronLeft size={12} />
                            </>
                          ) : (
                            <>
                              <span>تتبع المسار</span>
                              <ChevronLeft size={12} />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
          </div>
        </section>
      </div>

      {/* ═══ 3. TRACKING MODAL ═══ */}
      <RequestTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => {
          setIsTrackingOpen(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
      />
    </div>
  );
}
