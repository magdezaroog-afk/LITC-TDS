import { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHub } from '../context/HubContext';
import * as LucideIcons from 'lucide-react';
import {
  FileText, Search, Clock, ChevronLeft, ChevronRight, Building2,
  Activity, X, Sparkles, Ticket, Archive,
  CheckCircle2, XCircle, ArrowUpRight, FolderArchive,
  Plus, Minus, GripHorizontal
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

// ── Semantic Status Badges (Anti-AI Cliché, Crisp & Symmetrical) ──
const STATUS_CONFIG = {
  pending: {
    label: 'قيد الانتظار',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.25)',
    dot: '#f59e0b',
    icon: Clock,
  },
  in_progress: {
    label: 'قيد المعالجة',
    color: '#135d79',
    bg: 'rgba(19, 93, 121, 0.12)',
    border: 'rgba(19, 93, 121, 0.28)',
    dot: '#135d79',
    icon: Activity,
  },
  completed: {
    label: 'مؤرشف ومعتمد',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    dot: '#10b981',
    icon: Archive,
  },
  approved: {
    label: 'موافق عليه',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.25)',
    dot: '#10b981',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'مرفوض',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.25)',
    dot: '#ef4444',
    icon: XCircle,
  },
};

// ── Status Badge Component (Anti-AI Cliché, Crisp & Symmetrical) ──
function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: compact ? '3px' : '5px',
      padding: compact ? '2px 6px' : '3px 9px',
      borderRadius: '9999px',
      backgroundColor: cfg.bg,
      border: `1px solid ${cfg.border}`,
      color: cfg.color,
      fontSize: compact ? '9px' : '11px',
      fontWeight: 700,
      fontFamily: "'Cairo', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: compact ? '4px' : '5px',
        height: compact ? '4px' : '5px',
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
// MAIN REQUESTS PAGE (EXECUTIVE CLEAN EMPLOYEE DESK 2026)
// ══════════════════════════════════════════════════════════════
export default function RequestsPage() {
  const { requests, userRequests, language, darkMode } = useHub();
  const isRtl = language === 'ar';
  const [selectedRequest, setSelectedRequest] = useState<UserRecentRequest | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'active' | 'needs_rating' | 'archived'>('active');
  const creatorRef = useRef<HTMLDivElement>(null);
  const cardsBasinRef = useRef<HTMLDivElement>(null);
  const trackScrollRef = useRef<HTMLDivElement>(null);

  // ── Highlight recently printed ticket ──
  const [highlightedTicketId, setHighlightedTicketId] = useState<string | null>(null);

  // ── Responsive Dimensions State ──
  const [windowWidth, setWindowWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200));
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 840;

  // ── Dynamic Rows State (1 to 7 rows, default 1 row) ──
  const [visibleRows, setVisibleRows] = useState<number>(1);
  const [scrollProgress, setScrollProgress] = useState<{ current: number; total: number }>({ current: 1, total: 1 });

  // تمييز ما إذا كانت المعاملة مكتملة ومؤرشفة
  const isDone = useCallback((r: UserRecentRequest) =>
    r.isArchived ||
    r.status === 'completed' ||
    r.status === 'approved' ||
    r.rating !== undefined ||
    (r as any).statusName === 'CLOSED', []);

  // المعاملات المكتملة التي تحتاج إلى تقييم الموظف
  const isNeedsRating = useCallback((r: UserRecentRequest) =>
    isDone(r) && (r.rating === undefined || r.rating === null || r.rating === 0), [isDone]);

  // الأعداد الإحصائية السريعة
  const stats = useMemo(() => {
    return {
      active: userRequests.filter(r => !isDone(r)).length,
      needsRating: userRequests.filter(r => isNeedsRating(r)).length,
      archived: userRequests.filter(r => isDone(r)).length,
    };
  }, [userRequests, isDone, isNeedsRating]);

  // التذاكر المفلترة حسب التبويب النشط والبحث
  const filteredList = useMemo(() => {
    return userRequests.filter(r => {
      const done = isDone(r);
      const ratingPending = isNeedsRating(r);

      const matchSearch = searchQuery === '' ||
        (isRtl ? r.title : r.titleEn || r.title).toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (filterTab === 'needs_rating') return ratingPending;
      if (filterTab === 'archived') return done;
      return !done;
    });
  }, [userRequests, searchQuery, filterTab, isRtl, isDone, isNeedsRating]);

  // ── Scroll Indicator Calculation ──
  const updateScrollIndicator = useCallback(() => {
    const el = trackScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 8) {
      setScrollProgress({ current: 1, total: 1 });
      return;
    }
    const currentOffset = Math.abs(el.scrollLeft);
    const totalPages = Math.max(1, Math.ceil(el.scrollWidth / (el.clientWidth || 1)));
    const currentPage = Math.min(
      totalPages,
      Math.max(1, Math.round((currentOffset / maxScroll) * (totalPages - 1)) + 1)
    );
    setScrollProgress({ current: currentPage, total: totalPages });
  }, []);

  useEffect(() => {
    // When tab changes, reset track to start smoothly
    if (trackScrollRef.current) {
      trackScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    const timer = setTimeout(updateScrollIndicator, 80);
    return () => clearTimeout(timer);
  }, [filterTab, searchQuery, visibleRows, filteredList.length, updateScrollIndicator]);

  // Listen for new ticket landing event from the in-place thermal printer
  useEffect(() => {
    const handleTicketLanded = (e: any) => {
      setFilterTab('active');
      if (trackScrollRef.current) {
        trackScrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      }
      const ticketId = e.detail?.id || e.detail?.ticketId;
      if (ticketId) {
        setHighlightedTicketId(ticketId);
        setTimeout(() => setHighlightedTicketId(null), 4500);
      }
      setTimeout(updateScrollIndicator, 120);
    };
    window.addEventListener('litc_new_ticket_created', handleTicketLanded);
    return () => window.removeEventListener('litc_new_ticket_created', handleTicketLanded);
  }, [updateScrollIndicator]);

  // ── Continuous Horizontal Smooth Scroll Navigation ──
  const scrollTrack = (direction: 'prev' | 'next') => {
    if (!trackScrollRef.current) return;
    const containerWidth = trackScrollRef.current.clientWidth;
    // In Arabic RTL, scrolling left (negative values) advances forward to newer items
    const offset = direction === 'next' ? -containerWidth * 0.8 : containerWidth * 0.8;
    trackScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  const handleTrackWheel = (e: React.WheelEvent) => {
    if (!trackScrollRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && trackScrollRef.current.scrollWidth > trackScrollRef.current.clientWidth) {
      trackScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  // ── Drag Handle Logic for Vertical Row Resizing (1 to 7 rows) ──
  const dragStartYRef = useRef<number | null>(null);
  const dragStartRowsRef = useRef<number>(1);
  const [isDraggingHandle, setIsDraggingHandle] = useState<boolean>(false);

  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartYRef.current = e.clientY;
    dragStartRowsRef.current = visibleRows;
    setIsDraggingHandle(true);
  };

  const handlePointerMoveResize = (e: React.PointerEvent) => {
    if (!isDraggingHandle || dragStartYRef.current === null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    // كل سحب بمقدار 35 بكسل للأسفل يزيد صفاً، وللأعلى ينقص صفاً
    const rowDelta = Math.round(deltaY / 35);
    const targetRows = Math.min(7, Math.max(1, dragStartRowsRef.current + rowDelta));
    if (targetRows !== visibleRows) {
      setVisibleRows(targetRows);
    }
  };

  const handlePointerUpResize = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragStartYRef.current = null;
    setIsDraggingHandle(false);
  };

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: isMobile ? 'calc(100vh - 74px)' : 'calc(100vh - 86px)',
        gap: '8px',
        position: 'relative',
        paddingBottom: isMobile ? '76px' : '4px',
      }}
    >
      {/* ═══ 1. CLEAN REFINED HEADER ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderRadius: '12px',
        backgroundColor: darkMode ? '#0e1726' : '#ffffff',
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #e2e8f0',
        boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.25)' : '0 2px 10px rgba(19, 93, 121, 0.04)',
        flexWrap: 'wrap',
        gap: '10px',
        transition: 'all 0.2s ease',
      }}>
        <div>
          <h1 style={{
            fontSize: '17px',
            fontWeight: 800,
            color: darkMode ? '#ffffff' : '#0f172a',
            margin: '0 0 3px',
            letterSpacing: '-0.02em',
            fontFamily: "'Tajawal', sans-serif",
          }}>
            مرحباً بك، من هنا تستطيع إنشاء وإدارة طلباتك
          </h1>
          <p style={{
            fontSize: '11.5px',
            color: darkMode ? '#94a3b8' : '#64748b',
            margin: 0,
            fontFamily: "'Cairo', sans-serif",
            fontWeight: 500,
          }}>
            اختر نوع الخدمة لتقديم معاملة جديدة، وتابع مسار طلباتك الجارية والسابقة عبر الشريط أدناه.
          </p>
        </div>
      </div>

      {/* ═══ 2. PROMINENT CLEAN TICKET CONSOLE (ماكينة استخراج التذاكر الذكية - مركز الصفحة) ═══ */}
      <div ref={creatorRef} style={{ position: 'relative', zIndex: 30, width: '100%', maxWidth: '980px', margin: '0 auto' }}>
        <InlineRequestCreator
          onCancel={() => {}}
          onSuccess={() => setFilterTab('active')}
        />
      </div>

      {/* Flex spacer to dock the tickets basin cleanly to the bottom edge */}
      <div style={{ flex: 1, minHeight: '6px' }} />

      {/* ═══ 3. DOCKED BOTTOM TICKETS BASIN (حوض التذاكر شبحة على حافة الصفحة السفلية) ═══ */}
      <div
        id="litc-tickets-basin"
        ref={cardsBasinRef}
        style={{
          width: '100%',
          maxWidth: '1480px',
          margin: '0 auto 0px', // ملاصق لحافة الصفحة السفلية تماماً بدون فراغ ميت
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '6px' : '8px',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Ribbon Header: Tabs (مفتوحة، تحتاج لتقييم، أرشيف) + أزرار التمرير المستمر وترقيم الصفحات + البحث */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '0 2px',
        }}>
          {/* خيارات الطلبات: تبويبات حرة عائمة بأبعاد مستقرة */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '5px' : '8px',
            flexWrap: 'wrap',
          }}>
            {/* Tab 1: الطلبات المفتوحة */}
            <button
              type="button"
              onClick={() => setFilterTab('active')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                padding: isMobile ? '5px 10px' : '7px 14px',
                borderRadius: '8px',
                border: filterTab === 'active'
                  ? '1px solid rgba(56, 189, 248, 0.4)'
                  : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1'),
                cursor: 'pointer',
                backgroundColor: filterTab === 'active'
                  ? '#135d79'
                  : (darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
                color: filterTab === 'active' ? '#ffffff' : (darkMode ? '#94a3b8' : '#475569'),
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: 700,
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: filterTab === 'active' ? '0 4px 14px rgba(19, 93, 121, 0.35)' : 'none',
              }}
            >
              <Activity size={isMobile ? 12 : 14} strokeWidth={2.4} />
              <span>الطلبات المفتوحة</span>
              <span style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '9999px',
                backgroundColor: filterTab === 'active' ? 'rgba(255, 255, 255, 0.22)' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                color: filterTab === 'active' ? '#ffffff' : (darkMode ? '#cbd5e1' : '#334155'),
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {stats.active}
              </span>
            </button>

            {/* Tab 2: تحتاج إلى تقييم */}
            <button
              type="button"
              onClick={() => setFilterTab('needs_rating')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                padding: isMobile ? '5px 10px' : '7px 14px',
                borderRadius: '8px',
                border: filterTab === 'needs_rating'
                  ? '1px solid rgba(243, 108, 33, 0.4)'
                  : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1'),
                cursor: 'pointer',
                backgroundColor: filterTab === 'needs_rating'
                  ? '#f36c21'
                  : (darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
                color: filterTab === 'needs_rating' ? '#ffffff' : (darkMode ? '#94a3b8' : '#475569'),
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: 700,
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: filterTab === 'needs_rating' ? '0 4px 14px rgba(243, 108, 33, 0.35)' : 'none',
              }}
            >
              <Sparkles size={isMobile ? 12 : 14} strokeWidth={2.4} />
              <span>تحتاج إلى تقييم</span>
              {stats.needsRating > 0 && (
                <span style={{
                  fontSize: '10px',
                  padding: '1px 5px',
                  borderRadius: '9999px',
                  backgroundColor: filterTab === 'needs_rating' ? 'rgba(255, 255, 255, 0.25)' : '#f59e0b',
                  color: filterTab === 'needs_rating' ? '#ffffff' : '#000000',
                  fontWeight: 900,
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {stats.needsRating}
                </span>
              )}
            </button>

            {/* Tab 3: أرشيف طلباتي السابقة */}
            <button
              type="button"
              onClick={() => setFilterTab('archived')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: isMobile ? '4px' : '6px',
                padding: isMobile ? '5px 10px' : '7px 14px',
                borderRadius: '8px',
                border: filterTab === 'archived'
                  ? (darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #475569')
                  : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1'),
                cursor: 'pointer',
                backgroundColor: filterTab === 'archived'
                  ? (darkMode ? '#1e293b' : '#334155')
                  : (darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
                color: filterTab === 'archived' ? '#ffffff' : (darkMode ? '#94a3b8' : '#475569'),
                fontSize: isMobile ? '11px' : '12px',
                fontWeight: 700,
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: filterTab === 'archived' ? '0 4px 14px rgba(0, 0, 0, 0.25)' : 'none',
              }}
            >
              <FolderArchive size={isMobile ? 12 : 14} />
              <span>الأرشيف</span>
              <span style={{
                fontSize: '10px',
                padding: '1px 5px',
                borderRadius: '9999px',
                backgroundColor: filterTab === 'archived' ? 'rgba(255, 255, 255, 0.22)' : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'),
                color: filterTab === 'archived' ? '#ffffff' : (darkMode ? '#cbd5e1' : '#334155'),
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
              }}>
                {stats.archived}
              </span>
            </button>
          </div>

          {/* Controls: ترقيم الصفحات وأزرار التمرير لليمين واليسار + البحث */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '10px',
            flexWrap: 'wrap',
          }}>
            {/* أزرار التمرير الأفقي المستمر (يمين ويسار) ويتوسطهم عدد الصفحات */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 6px',
              borderRadius: '8px',
              backgroundColor: darkMode ? '#0e1726' : '#ffffff',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            }}>
              {/* زر التمرير لليمين (السابق في RTL) */}
              <button
                type="button"
                onClick={() => scrollTrack('prev')}
                disabled={scrollProgress.current <= 1}
                title="التمرير لليمين (البطاقات السابقة)"
                style={{
                  width: isMobile ? '24px' : '26px',
                  height: isMobile ? '24px' : '26px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: scrollProgress.current <= 1
                    ? 'transparent'
                    : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'),
                  color: scrollProgress.current <= 1
                    ? (darkMode ? '#475569' : '#cbd5e1')
                    : (darkMode ? '#f8fafc' : '#0f172a'),
                  cursor: scrollProgress.current <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
              >
                <ChevronRight size={isMobile ? 13 : 15} />
              </button>

              {/* مؤشر الصفحة في المنتصف: صفحة X من Y */}
              <div style={{
                fontSize: isMobile ? '10.5px' : '11.5px',
                fontWeight: 700,
                fontFamily: "'Cairo', sans-serif",
                color: darkMode ? '#e2e8f0' : '#1e293b',
                padding: '0 4px',
                userSelect: 'none',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}>
                صفحة <span style={{ color: '#135d79', fontWeight: 800 }}>{scrollProgress.current}</span> من {scrollProgress.total}
                {filteredList.length > 0 && (
                  <span style={{ fontSize: '9.5px', color: '#64748b', marginInlineStart: '4px' }}>
                    ({filteredList.length} تذكرة)
                  </span>
                )}
              </div>

              {/* زر التمرير لليسار (التالي في RTL) */}
              <button
                type="button"
                onClick={() => scrollTrack('next')}
                disabled={scrollProgress.current >= scrollProgress.total}
                title="التمرير لليسار (البطاقات التالية)"
                style={{
                  width: isMobile ? '24px' : '26px',
                  height: isMobile ? '24px' : '26px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: scrollProgress.current >= scrollProgress.total
                    ? 'transparent'
                    : (darkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9'),
                  color: scrollProgress.current >= scrollProgress.total
                    ? (darkMode ? '#475569' : '#cbd5e1')
                    : (darkMode ? '#f8fafc' : '#0f172a'),
                  cursor: scrollProgress.current >= scrollProgress.total ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  padding: 0,
                }}
              >
                <ChevronLeft size={isMobile ? 13 : 15} />
              </button>
            </div>

            {/* Compact Search Filter Box */}
            <div style={{ position: 'relative' }}>
              <Search
                size={11}
                color="#64748b"
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  insetInlineStart: '8px',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="تصفية..."
                style={{
                  paddingInlineStart: '24px',
                  paddingInlineEnd: searchQuery ? '22px' : '8px',
                  paddingTop: '4px',
                  paddingBottom: '4px',
                  borderRadius: '7px',
                  backgroundColor: darkMode ? '#111827' : '#ffffff',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  fontSize: '11px',
                  fontFamily: "'Cairo', sans-serif",
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  outline: 'none',
                  width: isMobile ? '100px' : '150px',
                  transition: 'all 0.15s ease',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    insetInlineEnd: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="مسح التصفية"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ مستطيل البطاقات: تمرير أفقي سلس ومستمر لليمين واليسار مع توسعة من 1 إلى 7 صفوف ═══ */}
        <div
          style={{
            position: 'relative',
            borderRadius: '12px',
            backgroundColor: darkMode ? '#0b1320' : '#ffffff',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            boxShadow: darkMode
              ? '0 6px 24px rgba(0, 0, 0, 0.4)'
              : '0 2px 14px rgba(19, 93, 121, 0.06)',
            padding: isMobile ? '8px 6px 26px' : '10px 10px 28px',
            overflow: 'hidden',
            minHeight: isMobile
              ? `${visibleRows * 120 + 38}px`
              : `${visibleRows * 144 + 44}px`,
            transition: 'min-height 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <AnimatePresence mode="wait">
            {filteredList.length === 0 ? (
              <motion.div
                key={`empty_${filterTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  width: '100%',
                  minHeight: isMobile
                    ? `${visibleRows * 120}px`
                    : `${visibleRows * 144}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(19, 93, 121, 0.05)',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                }}>
                  <Ticket size={18} color="#64748b" />
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e293b', fontFamily: "'Cairo', sans-serif" }}>
                  {filterTab === 'archived'
                    ? 'لا توجد طلبات سابقة في الأرشيف'
                    : filterTab === 'needs_rating'
                    ? 'لا توجد طلبات بانتظار التقييم حالياً ⭐'
                    : 'لا توجد تذاكر مفتوحة حالياً'}
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px', fontFamily: "'Cairo', sans-serif" }}>
                  {searchQuery
                    ? 'لا توجد نتائج مطابقة للتصفية الحالية'
                    : filterTab === 'active'
                    ? 'اختر الخدمة من الماكينة أعلاه لإنشاء تذكرة وستخرج وتستقر هنا فوراً'
                    : 'كافة المعاملات في حالتها المثالية'}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`grid_${filterTab}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ width: '100%' }}
              >
                {/* Continuous Smooth Horizontal Track (شبكة أعمدة مستمرة تتسع لليمين واليسار) */}
                <div
                  ref={trackScrollRef}
                  onScroll={updateScrollIndicator}
                  onWheel={handleTrackWheel}
                  style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${visibleRows}, minmax(${isMobile ? '120px' : '142px'}, 1fr))`,
                    gridAutoFlow: 'column',
                    // البطاقات أعرض بنسبة قليلة كما طلب مدير المشروع مع دعم حتى 7 صفوف
                    gridAutoColumns: isMobile
                      ? 'calc((100% - 10px) / 2.35)'
                      : 'calc((100% - 44px) / 5)',
                    columnGap: isMobile ? '6px' : '10px',
                    rowGap: isMobile ? '6px' : '10px',
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    scrollSnapType: 'x mandatory',
                    scrollBehavior: 'smooth',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    padding: '2px 1px',
                  }}
                >
                  {filteredList.map((req, idx) => {
                    const matchedFlow = requests.find(f => f.id === req.categoryId || f.id === (req as any).flowDefinitionId || f.title === req.title);
                    const routeColor = matchedFlow?.color || '#135d79';
                    const IconComp = resolveCategoryIcon(matchedFlow?.icon || (req as any).icon);
                    const isRatePending = isNeedsRating(req);
                    const isJustLanded = highlightedTicketId === req.id || (highlightedTicketId && idx === 0);

                    return (
                      <div
                        key={req.id}
                        onClick={() => {
                          setSelectedRequest(req);
                          setIsTrackingOpen(true);
                        }}
                        style={{
                          cursor: 'pointer',
                          userSelect: 'none',
                          transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease',
                          minWidth: 0,
                          scrollSnapAlign: 'start',
                          position: 'relative',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLElement).style.transform = 'none';
                        }}
                        title="انقر على التذكرة لعرض وتكبير كامل التفاصيل والمسار الحالي"
                      >
                        <CinemaTicketFrame
                          accentColor={routeColor}
                          cornerCutout={isMobile ? 5 : 7}
                          notchRadius={isMobile ? 2.5 : 3.5}
                          numNotches={isMobile ? 1 : 2}
                          dashIndent={isMobile ? 6 : 8}
                          contentPadding={isMobile ? '6px 7px' : '8px 11px'}
                          role="button"
                          tabIndex={0}
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: isMobile ? '114px' : '134px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            border: isJustLanded
                              ? `2px solid #10b981`
                              : `1px solid ${routeColor}35`,
                            borderRadius: '8px',
                            boxShadow: isJustLanded
                              ? '0 0 20px rgba(16, 185, 129, 0.6), inset 0 0 10px rgba(16, 185, 129, 0.3)'
                              : 'none',
                            animation: isJustLanded ? 'pulse 1.5s infinite' : 'none',
                          }}
                        >
                          {/* Top Row: Route Icon + Ticket Code Badge + Status Dot */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '4px',
                            marginBottom: isMobile ? '3px' : '5px',
                            minWidth: 0,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
                              <div style={{
                                width: isMobile ? '20px' : '22px',
                                height: isMobile ? '20px' : '22px',
                                borderRadius: '5px',
                                backgroundColor: `${routeColor}20`,
                                border: `1px solid ${routeColor}50`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: routeColor,
                                flexShrink: 0,
                              }}>
                                <IconComp size={isMobile ? 11 : 12} strokeWidth={2.4} />
                              </div>
                              <TicketCodeBadge
                                code={req.code || `#${req.id.slice(-4).toUpperCase()}`}
                                color={routeColor}
                                compact
                              />
                            </div>
                            <StatusBadge status={req.status} compact />
                          </div>

                          {/* Middle: Title & Current Stage */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                            <h3 style={{
                              fontSize: isMobile ? '10.5px' : '11.8px',
                              fontWeight: 800,
                              color: darkMode ? '#ffffff' : '#0f172a',
                              fontFamily: "'Tajawal', sans-serif",
                              lineHeight: 1.3,
                              margin: 0,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                            }}>
                              {isRtl ? req.title : req.titleEn || req.title}
                            </h3>

                            {req.stage && (
                              <div style={{
                                fontSize: isMobile ? '8.5px' : '9.5px',
                                color: '#64748b',
                                fontFamily: "'Cairo', sans-serif",
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: '1px',
                              }}>
                                <span style={{ color: darkMode ? '#94a3b8' : '#334155', fontWeight: 600 }}>{req.stage}</span>
                              </div>
                            )}
                          </div>

                          {/* Bottom Metadata: Dept + Submission Date */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '5px',
                            borderTop: darkMode ? '1px dashed rgba(255, 255, 255, 0.08)' : '1px dashed #e2e8f0',
                            fontSize: isMobile ? '8px' : '9px',
                            color: '#64748b',
                            fontFamily: "'Cairo', sans-serif",
                            marginTop: '4px',
                            minWidth: 0,
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                              <Building2 size={isMobile ? 9 : 10} color="#64748b" style={{ flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {req.department || 'إدارة الخدمات'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                              <Clock size={isMobile ? 8 : 9} color="#64748b" />
                              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{req.date || 'اليوم'}</span>
                              {isRatePending ? (
                                <span style={{
                                  color: '#f59e0b',
                                  fontWeight: 800,
                                  marginInlineStart: '2px',
                                }}>
                                  ★
                                </span>
                              ) : (
                                <ArrowUpRight size={isMobile ? 9 : 10} color={routeColor} style={{ marginInlineStart: '1px' }} />
                              )}
                            </div>
                          </div>
                        </CinemaTicketFrame>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══ 4. مقبض السحب الرأسي في منتصف الحافة السفلية لمستطيل البطاقات (من 1 إلى 7 صفوف) ═══ */}
          <div
            style={{
              position: 'absolute',
              bottom: '4px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: isDraggingHandle
                ? (darkMode ? '#1e293b' : '#e2e8f0')
                : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(19, 93, 121, 0.05)'),
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(19, 93, 121, 0.12)',
              boxShadow: isDraggingHandle ? '0 0 12px rgba(19, 93, 121, 0.3)' : 'none',
              transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
              userSelect: 'none',
              zIndex: 30,
            }}
          >
            {/* زر تقليل الصفوف (-) */}
            <button
              type="button"
              onClick={() => setVisibleRows(r => Math.max(1, r - 1))}
              disabled={visibleRows <= 1}
              title="تقليل عدد صفوف البطاقات (الحد الأدنى: 1 صف)"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: visibleRows <= 1 ? 'transparent' : (darkMode ? 'rgba(255, 255, 255, 0.1)' : '#ffffff'),
                color: visibleRows <= 1 ? (darkMode ? '#475569' : '#cbd5e1') : (darkMode ? '#f8fafc' : '#0f172a'),
                cursor: visibleRows <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                fontSize: '11px',
                fontWeight: 900,
                boxShadow: visibleRows <= 1 ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <Minus size={11} strokeWidth={2.8} />
            </button>

            {/* مقبض السحب الرئيسي بالماوس أو اللمس (Drag Bar) */}
            <div
              onPointerDown={handlePointerDownResize}
              onPointerMove={handlePointerMoveResize}
              onPointerUp={handlePointerUpResize}
              onPointerCancel={handlePointerUpResize}
              title="امسكه واسحب لأسفل لزيادة صفوف البطاقات أو لأعلى للتقليل (من 1 إلى 7 صفوف)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'ns-resize',
                touchAction: 'none',
                padding: '2px 4px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '4.5px',
                  borderRadius: '9999px',
                  backgroundColor: isDraggingHandle
                    ? '#f36c21'
                    : (darkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(19, 93, 121, 0.35)'),
                  transition: 'background-color 0.15s ease',
                }}
              />
              <span style={{
                fontSize: '9.5px',
                fontWeight: 800,
                color: darkMode ? '#cbd5e1' : '#475569',
                fontFamily: "'Cairo', sans-serif",
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}>
                {visibleRows} {visibleRows === 1 ? 'صف' : visibleRows === 2 ? 'صفان' : 'صفوف'}
              </span>
            </div>

            {/* زر زيادة الصفوف (+) */}
            <button
              type="button"
              onClick={() => setVisibleRows(r => Math.min(7, r + 1))}
              disabled={visibleRows >= 7}
              title="زيادة عدد صفوف البطاقات (الحد الأقصى: 7 صفوف)"
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: visibleRows >= 7 ? 'transparent' : (darkMode ? 'rgba(255, 255, 255, 0.1)' : '#ffffff'),
                color: visibleRows >= 7 ? (darkMode ? '#475569' : '#cbd5e1') : (darkMode ? '#f8fafc' : '#0f172a'),
                cursor: visibleRows >= 7 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                fontSize: '11px',
                fontWeight: 900,
                boxShadow: visibleRows >= 7 ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
              }}
            >
              <Plus size={11} strokeWidth={2.8} />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ 4. TRACKING MODAL (تظهر عند النقر على أي تذكرة لتكبيرها وعرض كافة التفاصيل والمسار والتقييم) ═══ */}
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
