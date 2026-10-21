import { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHub } from '../context/HubContext';
import * as LucideIcons from 'lucide-react';
import {
  Plus, CheckCircle2, XCircle, FileText,
  Search, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Building2,
  Activity, Layers, X, Sparkles, Filter, Ticket, Archive,
  LayoutGrid, List
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

// ── Compact Cinema-Ticket KPI Metric Card (Refined & Space-Efficient) ──
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
      cornerCutout={7}
      notchRadius={3.5}
      numNotches={2}
      dashIndent={9}
      contentPadding="clamp(6px, 1.2vw, 9px) clamp(6px, 1.5vw, 12px)"
      role="button"
      tabIndex={0}
      style={{
        width: '100%',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <div style={{
            width: 'clamp(18px, 3.5vw, 22px)',
            height: 'clamp(18px, 3.5vw, 22px)',
            borderRadius: '5px',
            backgroundColor: isSelected ? `${accentColor}25` : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(30, 58, 82, 0.06)'),
            border: isSelected ? `1px solid ${accentColor}50` : (darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(30, 58, 82, 0.12)'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: accentColor,
          }}>
            <Icon size={11} strokeWidth={isSelected ? 2.5 : 2} />
          </div>
          <span style={{
            fontSize: 'clamp(9px, 2vw, 11.5px)',
            fontWeight: isSelected ? 800 : 700,
            color: isSelected ? (darkMode ? '#ffffff' : '#0f172a') : (darkMode ? '#94a3b8' : '#475569'),
            fontFamily: "'Cairo', sans-serif",
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {label}
          </span>
        </div>

        {/* Value Tag Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexShrink: 0,
        }}>
          {isSelected && (
            <span style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: accentColor,
              boxShadow: `0 0 6px ${accentColor}`,
            }} />
          )}
          <span style={{
            fontSize: 'clamp(13px, 3vw, 17px)',
            fontWeight: 800,
            color: isSelected ? accentColor : (darkMode ? '#ffffff' : '#0f172a'),
            fontFamily: "'Tajawal', sans-serif",
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}>
            {value}
          </span>
        </div>
      </div>

      <div style={{
        fontSize: 'clamp(7.5px, 1.6vw, 9px)',
        color: isSelected ? (darkMode ? '#cbd5e1' : '#334155') : '#64748b',
        marginTop: '3px',
        fontWeight: 500,
        fontFamily: "'Cairo', sans-serif",
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {sublabel}
      </div>
    </CinemaTicketFrame>
  );
}

// ── Status Badge Component (Anti-AI Cliché, Crisp & Symmetrical) ──
function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: compact ? '3px' : '6px',
      padding: compact ? '2px 6px' : '3px 9px',
      borderRadius: '9999px',
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      fontSize: compact ? '8.5px' : '11.5px',
      fontWeight: 700,
      fontFamily: "'Cairo', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: compact ? '3.5px' : '5px',
        height: compact ? '3.5px' : '5px',
        borderRadius: '50%',
        backgroundColor: cfg.dot,
        flexShrink: 0,
        boxShadow: `0 0 4px ${cfg.dot}`,
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
  const [filterStatus, setFilterStatus] = useState<'active' | 'needs_rating' | 'completed'>('active');
  const [viewMode, setViewMode] = useState<'list' | 'cards'>('list');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 6;
  const creatorRef = useRef<HTMLDivElement>(null);
  const [stubLanded, setStubLanded] = useState(false);

  useEffect(() => {
    const handleStubLanded = () => {
      setFilterStatus('active');
      setStubLanded(true);
      setTimeout(() => setStubLanded(false), 2200);
    };
    window.addEventListener('litc_stub_landed', handleStubLanded);
    return () => window.removeEventListener('litc_stub_landed', handleStubLanded);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchQuery]);

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
      active: userRequests.filter(r => !isDone(r)).length,
      needsRating: userRequests.filter(r => isNeedsRating(r)).length,
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

      if (filterStatus === 'needs_rating') return needsRating;
      if (filterStatus === 'completed') return archived;
      return !archived;
    });
  }, [userRequests, searchQuery, filterStatus, isRtl]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const displayedRequests = useMemo(() => {
    if (!isExpanded) {
      return filteredRequests.slice(0, 3);
    }
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRequests.slice(start, start + PAGE_SIZE);
  }, [filteredRequests, isExpanded, currentPage]);

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '22px', position: 'relative', paddingBottom: '84px' }}>

      {/* ═══ 1. REFINED PAGE HEADER & CONTEXT ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
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
            fontSize: '11px',
            color: '#64748b',
            fontFamily: "'Cairo', sans-serif",
            fontWeight: 500,
            marginBottom: '3px',
          }}>
            <span>بوابة الموظف</span>
            <span>/</span>
            <span style={{ color: darkMode ? '#60a5fa' : '#1e3a52', fontWeight: 600 }}>مركز المعاملات والطلبات</span>
          </div>

          <h1 style={{
            fontSize: '20px',
            fontWeight: 800,
            color: darkMode ? '#ffffff' : '#0f172a',
            margin: '0 0 2px',
            letterSpacing: '-0.02em',
            fontFamily: "'Tajawal', sans-serif",
          }}>
            مركز متابعة المعاملات والطلبات
          </h1>
          <p style={{ fontSize: '12px', color: darkMode ? '#94a3b8' : '#475569', margin: 0, fontFamily: "'Cairo', sans-serif", fontWeight: 500 }}>
            منظومة NEXUS TDS الذكية لمتابعة مسار الإجراءات وحالات الاعتماد وإدارة التذاكر.
          </p>
        </div>

        {/* Live Operational Status Indicator */}
        <div style={{
          fontSize: '11px',
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

      {/* ═══ 2. SMART TICKET CREATION CONSOLE (ماكينة استخراج التذاكر الذكية - تتوسط الشاشة) ═══ */}
      <div ref={creatorRef} style={{ position: 'relative', zIndex: 40, width: '100%', maxWidth: '980px', margin: '0 auto' }}>
        <InlineRequestCreator
          onCancel={() => {}}
          onSuccess={() => setFilterStatus('active')}
        />
      </div>

      {/* ═══ 3. THREE COMPACT KPI METRIC TILES (المعاملات النشطة | التقييم | الأرشيف) ═══ */}
      <div
        className="enterprise-kpi-grid"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '12px',
          width: '100%',
        }}
      >
        {/* Box 1 (Right): المعاملات النشطة */}
        <div style={{
          position: 'relative',
          transform: stubLanded ? 'scale(1.03)' : 'none',
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: stubLanded ? '0 0 24px rgba(56, 189, 248, 0.65)' : 'none',
          borderRadius: '10px',
        }}>
          <MetricTile
            label="المعاملات النشطة"
            value={stats.active}
            sublabel={stubLanded ? "✨ استلمت التذكرة بنجاح في الحوض!" : "جميع المعاملات الجارية ولم تكتمل"}
            icon={Activity}
            accentColor={darkMode ? "#38bdf8" : "#0284c7"}
            isSelected={filterStatus === 'active'}
            onClick={() => setFilterStatus('active')}
            darkMode={darkMode}
          />
        </div>

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
          isSelected={filterStatus === 'completed'}
          onClick={() => setFilterStatus('completed')}
          darkMode={darkMode}
        />
      </div>

      {/* ═══ 4. TRANSACTIONS LEDGER (سجل المعاملات: قائمة أو بطاقات مع تمديد لأسفل وترقيم) ═══ */}
      <div style={{
        backgroundColor: darkMode ? '#111827' : '#ffffff',
        borderRadius: '10px',
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
              fontSize: '14px',
              fontWeight: 800,
              color: darkMode ? '#ffffff' : '#0f172a',
              margin: 0,
              letterSpacing: '-0.01em',
              fontFamily: "'Tajawal', sans-serif",
            }}>
              {filterStatus === 'completed'
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
                filterStatus === 'completed' ? 'معاملة سابقة' :
                filterStatus === 'needs_rating' ? 'بانتظار التقييم' : 'معاملة نشطة'
              }
            </span>

            {/* Quick Filter Reset Badge when not 'active' */}
            {filterStatus !== 'active' && (
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
                  filterStatus === 'needs_rating' ? 'طلبات تحتاج إلى التقييم' : 'أرشيف المعاملات'
                }</span>
                <X size={12} />
              </button>
            )}
          </div>

          {/* Controls: View Switcher (List vs Cards) & Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* View Mode Toggle (قائمة / بطاقات) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: darkMode ? '#0b0f19' : '#e2e8f0',
              borderRadius: '7px',
              padding: '2px',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1',
            }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="عرض جدولي كقائمة"
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'list' ? (darkMode ? '#2563eb' : '#ffffff') : 'transparent',
                  color: viewMode === 'list' ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
              >
                <List size={13} />
                <span className="hide-on-mobile">قائمة</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                title="عرض كبطاقات وتذاكر"
                style={{
                  padding: '4px 8px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: viewMode === 'cards' ? (darkMode ? '#2563eb' : '#ffffff') : 'transparent',
                  color: viewMode === 'cards' ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutGrid size={13} />
                <span className="hide-on-mobile">بطاقات</span>
              </button>
            </div>

            {/* Search Box */}
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
                  width: '210px',
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

        {/* Content Area: Empty State vs Table vs Cards Grid */}
        {filteredRequests.length === 0 ? (
          <div style={{
            padding: '45px 20px',
            textAlign: 'center',
            backgroundColor: darkMode ? '#111827' : '#ffffff',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(30, 58, 82, 0.05)',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
            }}>
              <FileText size={18} color="#64748b" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e293b', fontFamily: "'Cairo', sans-serif" }}>
              {filterStatus === 'completed' ? 'لا توجد طلبات سابقة في الأرشيف' : 'لا توجد معاملات نشطة حالياً'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontFamily: "'Cairo', sans-serif" }}>
              {searchQuery
                ? 'لا توجد نتائج مطابقة لبحثك الحالي'
                : filterStatus === 'completed'
                ? 'عند إنجاز وتقييم أي معاملة ستنتقل تلقائياً إلى هذا الأرشيف'
                : 'كافة معاملاتك السابقة مؤرشفة بنجاح. يمكنك تقديم معاملة جديدة بسحب تذكرة من الماكينة أعلاه'}
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* ── 1. LIST / TABLE VIEW ── */
          <>
            {/* Desktop Table View */}
            <div className="desktop-table-view litc-table-wrapper" style={{ overflowX: 'auto' }}>
              <table className="litc-table">
                <thead>
                  <tr>
                    <th style={{ width: '130px' }}>رمز المعاملة</th>
                    <th>نوع الخدمة والموضوع</th>
                    <th style={{ width: '190px' }}>الإدارة المستهدفة</th>
                    <th style={{ width: '110px' }}>تاريخ التقديم</th>
                    <th style={{ width: '120px' }}>الحالة الإجرائية</th>
                    <th style={{ width: '120px', textAlign: 'start' }}>الإجراء والمتابعة</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRequests.map(req => {
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
                          <div style={{ fontWeight: 600, color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13px', fontFamily: "'Cairo', sans-serif" }}>
                            {isRtl ? req.title : req.titleEn || req.title}
                          </div>
                          {req.stage && (
                            <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', fontFamily: "'Cairo', sans-serif" }}>
                              المرحلة الحالية: {req.stage}
                            </div>
                          )}
                        </td>

                        {/* Target Department */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: darkMode ? '#cbd5e1' : '#334155', fontFamily: "'Cairo', sans-serif", fontWeight: 500 }}>
                            <Building2 size={12} color="#64748b" />
                            <span>{req.department || 'إدارة الشؤون الفنية'}</span>
                          </div>
                        </td>

                        {/* Tabular Formatted Date */}
                        <td style={{ whiteSpace: 'nowrap', fontSize: '11.5px', color: darkMode ? '#94a3b8' : '#64748b', fontVariantNumeric: 'tabular-nums', fontFamily: "'Cairo', sans-serif" }}>
                          {req.date || 'اليوم'}
                        </td>

                        {/* Semantic Status Badge */}
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <StatusBadge status={req.status} />
                        </td>

                        {/* Action Button */}
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
                              fontSize: '11px',
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

            {/* Mobile Adaptive Cards View (Linear/Stripe Enterprise Mobile Benchmark) */}
            <div className="mobile-cards-view">
              {displayedRequests.map(req => {
                const matchedFlow = requests.find(f => f.id === req.categoryId || f.id === (req as any).flowDefinitionId || f.title === req.title);
                const routeColor = matchedFlow?.color || '#38bdf8';

                return (
                  <div
                    key={req.id}
                    onClick={() => {
                      setSelectedRequest(req);
                      setIsTrackingOpen(true);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor: darkMode ? '#111827' : '#ffffff',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      cursor: 'pointer',
                      boxShadow: darkMode ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease',
                      fontFamily: "'Cairo', sans-serif",
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <TicketCodeBadge
                        code={req.code || `#REQ-${req.id.slice(-4).toUpperCase()}`}
                        color={routeColor}
                      />
                      <StatusBadge status={req.status} compact />
                    </div>

                    <div style={{ fontWeight: 700, color: darkMode ? '#ffffff' : '#0f172a', fontSize: '13px' }}>
                      {isRtl ? req.title : req.titleEn || req.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                      <Building2 size={12} color="#64748b" />
                      <span>{req.department || 'إدارة الشؤون الفنية'}</span>
                      {req.stage && <span>• {req.stage}</span>}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9',
                      paddingTop: '8px',
                      marginTop: '2px',
                    }}>
                      <span style={{ fontSize: '11px', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                        📅 {req.date || 'اليوم'}
                      </span>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedRequest(req);
                          setIsTrackingOpen(true);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: isNeedsRating(req)
                            ? '1px solid #f59e0b'
                            : (darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                          backgroundColor: isNeedsRating(req)
                            ? (darkMode ? 'rgba(245, 158, 11, 0.18)' : '#fffbeb')
                            : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc'),
                          color: isNeedsRating(req)
                            ? '#d97706'
                            : (darkMode ? '#38bdf8' : '#0284c7'),
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span>{isNeedsRating(req) ? '⭐ قيّم الطلب' : 'تتبع المسار'}</span>
                        <ChevronLeft size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* ── 2. CARDS / GRID VIEW (نظام البطاقات السينمائية الأنيقة - 3 كروت بجانب بعضها دائماً) ── */
          <div
            className="enterprise-cards-grid-3col"
            style={{
              padding: 'clamp(8px, 1.4vw, 14px)',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 'clamp(6px, 1.2vw, 12px)',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {displayedRequests.map(req => {
              const matchedFlow = requests.find(f => f.id === req.categoryId || f.id === (req as any).flowDefinitionId || f.title === req.title);
              const routeColor = matchedFlow?.color || '#38bdf8';

              return (
                <CinemaTicketFrame
                  key={req.id}
                  accentColor={routeColor}
                  cornerCutout={7}
                  notchRadius={3.5}
                  numNotches={2}
                  dashIndent={10}
                  contentPadding="clamp(7px, 1.4vw, 12px) clamp(6px, 1.2vw, 12px)"
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedRequest(req);
                    setIsTrackingOpen(true);
                  }}
                  style={{
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Card Header: Code & Status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <TicketCodeBadge code={req.code || `#REQ-${req.id.slice(-4).toUpperCase()}`} color={routeColor} compact />
                    <StatusBadge status={req.status} compact />
                  </div>

                  {/* Card Title */}
                  <div style={{
                    fontWeight: 700,
                    color: darkMode ? '#ffffff' : '#0f172a',
                    fontSize: 'clamp(10px, 2vw, 13px)',
                    fontFamily: "'Tajawal', sans-serif",
                    marginBottom: '3px',
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {isRtl ? req.title : req.titleEn || req.title}
                  </div>

                  {/* Stage subtitle */}
                  {req.stage && (
                    <div style={{ fontSize: 'clamp(7.5px, 1.6vw, 9.5px)', color: '#64748b', marginBottom: '6px', fontFamily: "'Cairo', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      المرحلة: <span style={{ color: darkMode ? '#cbd5e1' : '#475569', fontWeight: 600 }}>{req.stage}</span>
                    </div>
                  )}

                  {/* Meta: Dept & Date */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: darkMode ? '1px dashed rgba(255, 255, 255, 0.08)' : '1px dashed #e2e8f0',
                    fontSize: 'clamp(7.5px, 1.6vw, 10px)',
                    color: '#64748b',
                    fontFamily: "'Cairo', sans-serif",
                    gap: '4px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      <Building2 size={11} color="#64748b" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.department || 'إدارة الشؤون الفنية'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      <Clock size={11} color="#64748b" />
                      <span>{req.date || 'اليوم'}</span>
                    </div>
                  </div>

                  {/* Action Link Footer */}
                  <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{
                      fontSize: 'clamp(8.5px, 1.8vw, 10.5px)',
                      fontWeight: 700,
                      color: isNeedsRating(req) ? '#d97706' : (darkMode ? '#38bdf8' : '#1e3a52'),
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      {isNeedsRating(req) ? '⭐ قيّم المعاملة' : 'متابعة وتتبع'}
                      <ChevronLeft size={11} />
                    </span>
                  </div>
                </CinemaTicketFrame>
              );
            })}
          </div>
        )}

        {/* ── EXPANSION / PAGINATION DRAWER (تمديد لأسفل وترقيم الصفحات) ── */}
        <div style={{
          padding: '10px 18px',
          borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          backgroundColor: darkMode ? '#0b101d' : '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Expansion Toggle Button */}
          {filteredRequests.length > 3 ? (
            <button
              onClick={() => {
                setIsExpanded(!isExpanded);
                setCurrentPage(1);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                backgroundColor: isExpanded
                  ? (darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(30, 58, 82, 0.08)')
                  : (darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'),
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                color: isExpanded ? '#38bdf8' : (darkMode ? '#cbd5e1' : '#334155'),
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s ease',
              }}
            >
              <span>{isExpanded ? 'طي السجل (عرض آخر 3 فقط)' : `عرض كافة المعاملات (${filteredRequests.length} معاملة)`}</span>
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          ) : (
            <div />
          )}

          {/* Pagination Controls (shown when isExpanded and totalPages > 1) */}
          {isExpanded && totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title="الصفحة السابقة"
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                  color: currentPage === 1 ? '#64748b' : (darkMode ? '#fff' : '#000'),
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronRight size={13} />
              </button>

              {/* Direct Page Numbers */}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pNum = idx + 1;
                const isActive = currentPage === pNum;
                return (
                  <button
                    key={pNum}
                    onClick={() => setCurrentPage(pNum)}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: isActive ? '#38bdf8' : 'transparent',
                      color: isActive ? '#ffffff' : (darkMode ? '#94a3b8' : '#64748b'),
                      border: isActive ? 'none' : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'Tajawal', sans-serif"
                    }}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title="الصفحة التالية"
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'transparent',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                  color: currentPage === totalPages ? '#64748b' : (darkMode ? '#fff' : '#000'),
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                <ChevronLeft size={13} />
              </button>
            </div>
          )}

          {/* Records Counter Info */}
          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: "'Cairo', sans-serif" }}>
            {!isExpanded
              ? `عرض آخر ${Math.min(3, filteredRequests.length)} معاملات من إجمالي ${filteredRequests.length}`
              : `صفحة ${currentPage} من ${totalPages} (إجمالي ${filteredRequests.length} معاملة)`
            }
          </div>
        </div>
      </div>

      {/* ═══ 5. TRACKING MODAL ═══ */}
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
