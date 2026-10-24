import { useMemo, useState, useRef, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import * as LucideIcons from 'lucide-react';
import {
  FileText, Search, Clock, ChevronLeft, ChevronRight, ChevronDown, Building2,
  Activity, X, Sparkles, Ticket, Archive,
  CheckCircle2, XCircle, ArrowUpRight, FolderArchive
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
      padding: compact ? '2px 7px' : '3px 9px',
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
  const [isExpandedView, setIsExpandedView] = useState(false);
  const creatorRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const offset = direction === 'left' ? -320 : 320;
    carouselRef.current.scrollBy({ left: isRtl ? -offset : offset, behavior: 'smooth' });
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

  // الأعداد الإحصائية السريعة
  const stats = useMemo(() => {
    return {
      active: userRequests.filter(r => !isDone(r)).length,
      needsRating: userRequests.filter(r => isNeedsRating(r)).length,
      archived: userRequests.filter(r => isDone(r)).length,
    };
  }, [userRequests]);

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
  }, [userRequests, searchQuery, filterTab, isRtl]);

  // الطلبات المعروضة في شريط التذاكر أسفل الشاشة:
  // في تبويب النشطة والمحتاجة لتقييم، نعرض آخر 3 تذاكر افتراضياً تلبية لطلب مدير المشروع
  const ribbonTickets = useMemo(() => {
    if (filterTab === 'archived') {
      return filteredList; // الأرشيف يعرض القائمة كاملة
    }
    // آخر 3 تذاكر مفتوحة أو تحتاج لتقييم
    return filteredList.slice(0, 3);
  }, [filteredList, filterTab]);

  return (
    <div
      dir="rtl"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        minHeight: '100%',
        paddingBottom: '24px',
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

      {/* ═══ 3. HORIZONTAL BOTTOM TICKETS RIBBON (حوض ومعاملات التذاكر) ═══ */}
      <div
        id="litc-tickets-basin"
        style={{
          width: '100%',
          maxWidth: '1280px',
          margin: '10px auto 30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'relative',
          zIndex: 20,
        }}
      >
        {/* Ribbon Header: Tabs & Carousel Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '0 4px',
        }}>
          {/* Freestanding Floating Tabs (بدون مستطيل محيط) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            {/* Tab 1: الطلبات المفتوحة */}
            <button
              type="button"
              onClick={() => {
                setFilterTab('active');
                setIsExpandedView(false);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '9px',
                border: filterTab === 'active'
                  ? '1px solid rgba(56, 189, 248, 0.4)'
                  : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1'),
                cursor: 'pointer',
                backgroundColor: filterTab === 'active'
                  ? '#135d79'
                  : (darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
                color: filterTab === 'active' ? '#ffffff' : (darkMode ? '#94a3b8' : '#475569'),
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: filterTab === 'active' ? '0 4px 14px rgba(19, 93, 121, 0.35)' : 'none',
              }}
            >
              <Activity size={14} strokeWidth={2.4} />
              <span>الطلبات المفتوحة</span>
              <span style={{
                fontSize: '10.5px',
                padding: '1px 6px',
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
              onClick={() => {
                setFilterTab('needs_rating');
                setIsExpandedView(false);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '9px',
                border: filterTab === 'needs_rating'
                  ? '1px solid rgba(243, 108, 33, 0.4)'
                  : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1'),
                cursor: 'pointer',
                backgroundColor: filterTab === 'needs_rating'
                  ? '#f36c21'
                  : (darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
                color: filterTab === 'needs_rating' ? '#ffffff' : (darkMode ? '#94a3b8' : '#475569'),
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: filterTab === 'needs_rating' ? '0 4px 14px rgba(243, 108, 33, 0.35)' : 'none',
              }}
            >
              <Sparkles size={14} strokeWidth={2.4} />
              <span>تحتاج إلى تقييم</span>
              {stats.needsRating > 0 && (
                <span style={{
                  fontSize: '10.5px',
                  padding: '1px 6px',
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
              onClick={() => {
                setFilterTab('archived');
                setIsExpandedView(false);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '9px',
                border: filterTab === 'archived'
                  ? (darkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #475569')
                  : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1'),
                cursor: 'pointer',
                backgroundColor: filterTab === 'archived'
                  ? (darkMode ? '#1e293b' : '#334155')
                  : (darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
                color: filterTab === 'archived' ? '#ffffff' : (darkMode ? '#94a3b8' : '#475569'),
                fontSize: '12px',
                fontWeight: 700,
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: filterTab === 'archived' ? '0 4px 14px rgba(0, 0, 0, 0.25)' : 'none',
              }}
            >
              <FolderArchive size={14} />
              <span>أرشيف طلباتي السابقة</span>
              <span style={{
                fontSize: '10.5px',
                padding: '1px 6px',
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

          {/* Controls: Compact Search & Carousel Arrows */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Compact Search Filter Box */}
            <div style={{ position: 'relative' }}>
              <Search
                size={12}
                color="#64748b"
                style={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  insetInlineStart: '9px',
                  pointerEvents: 'none',
                }}
              />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="تصفية بالرمز أو الموضوع..."
                style={{
                  paddingInlineStart: '28px',
                  paddingInlineEnd: searchQuery ? '26px' : '10px',
                  paddingTop: '5px',
                  paddingBottom: '5px',
                  borderRadius: '7px',
                  backgroundColor: darkMode ? '#111827' : '#ffffff',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                  fontSize: '11.5px',
                  fontFamily: "'Cairo', sans-serif",
                  color: darkMode ? '#f8fafc' : '#0f172a',
                  outline: 'none',
                  width: '180px',
                  transition: 'all 0.15s ease',
                }}
                onFocus={e => {
                  e.target.style.borderColor = '#135d79';
                  e.target.style.boxShadow = '0 0 0 1px #135d79';
                }}
                onBlur={e => {
                  e.target.style.borderColor = darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
                  e.target.style.boxShadow = 'none';
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
                    insetInlineEnd: '7px',
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
                  <X size={11} />
                </button>
              )}
            </div>

            {/* Horizontal Scroll Navigation Arrows */}
            {ribbonTickets.length > 2 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => scrollCarousel('right')}
                  title="التمرير لليمين"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                    backgroundColor: darkMode ? '#111827' : '#ffffff',
                    color: darkMode ? '#e2e8f0' : '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel('left')}
                  title="التمرير لليسار"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '7px',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                    backgroundColor: darkMode ? '#111827' : '#ffffff',
                    color: darkMode ? '#e2e8f0' : '#334155',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ribbon Body: Horizontal Scrollable Tickets Carousel */}
        {ribbonTickets.length === 0 ? (
          <div style={{
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: darkMode ? '#0e1726' : '#ffffff',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(19, 93, 121, 0.05)',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
            }}>
              <Ticket size={20} color="#64748b" />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: darkMode ? '#e2e8f0' : '#1e293b', fontFamily: "'Cairo', sans-serif" }}>
              {filterTab === 'archived'
                ? 'لا توجد طلبات سابقة في الأرشيف'
                : filterTab === 'needs_rating'
                ? 'لا توجد طلبات بانتظار التقييم حالياً ⭐'
                : 'لا توجد تذاكر مفتوحة حالياً'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontFamily: "'Cairo', sans-serif" }}>
              {searchQuery
                ? 'لا توجد نتائج مطابقة لبحثك'
                : filterTab === 'active'
                ? 'يمكنك إنشاء طلب معاملة جديدة من الزر أعلاه وستظهر هنا فوراً'
                : 'كافة المعاملات في حالتها المثالية'}
            </div>
          </div>
        ) : (
          <div
            ref={carouselRef}
            style={{
              display: isExpandedView ? 'grid' : 'flex',
              gridTemplateColumns: isExpandedView ? 'repeat(auto-fill, minmax(290px, 1fr))' : undefined,
              alignItems: isExpandedView ? undefined : 'stretch',
              gap: '14px',
              padding: '16px 18px',
              overflowX: isExpandedView ? 'visible' : 'auto',
              maxHeight: isExpandedView ? '560px' : undefined,
              overflowY: isExpandedView ? 'auto' : 'visible',
              scrollSnapType: isExpandedView ? undefined : 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'thin',
              scrollbarColor: darkMode ? '#1f293d transparent' : '#cbd5e1 transparent',
            }}
          >
            {(isExpandedView ? filteredList : ribbonTickets).map(req => {
              const matchedFlow = requests.find(f => f.id === req.categoryId || f.id === (req as any).flowDefinitionId || f.title === req.title);
              const routeColor = matchedFlow?.color || '#135d79';
              const IconComp = resolveCategoryIcon(matchedFlow?.icon || (req as any).icon);
              const isRatePending = isNeedsRating(req);

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    setSelectedRequest(req);
                    setIsTrackingOpen(true);
                  }}
                  style={{
                    flex: isExpandedView ? '1 1 auto' : '0 0 310px',
                    scrollSnapAlign: isExpandedView ? undefined : 'start',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'none';
                  }}
                  title="انقر على التذكرة لعرض وتكبير كامل التفاصيل والمسار الحالي"
                >
                  <CinemaTicketFrame
                    accentColor={routeColor}
                    cornerCutout={8}
                    notchRadius={4}
                    numNotches={2}
                    dashIndent={10}
                    contentPadding="12px 14px"
                    role="button"
                    tabIndex={0}
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: '165px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: `1.5px solid ${routeColor}40`,
                      borderRadius: '10px',
                    }}
                  >
                    {/* Top Row: Route Icon + Ticket Code Badge + Status Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Dynamic Route Icon */}
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          backgroundColor: `${routeColor}20`,
                          border: `1px solid ${routeColor}50`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: routeColor,
                          flexShrink: 0,
                        }}>
                          <IconComp size={14} strokeWidth={2.2} />
                        </div>
                        <TicketCodeBadge
                          code={req.code || `#REQ-${req.id.slice(-4).toUpperCase()}`}
                          color={routeColor}
                          compact
                        />
                      </div>
                      <StatusBadge status={req.status} compact />
                    </div>

                    {/* Middle: Title & Current Stage */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <h3 style={{
                        fontSize: '12.5px',
                        fontWeight: 800,
                        color: darkMode ? '#ffffff' : '#0f172a',
                        fontFamily: "'Tajawal', sans-serif",
                        lineHeight: 1.35,
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {isRtl ? req.title : req.titleEn || req.title}
                      </h3>

                      {req.stage && (
                        <div style={{
                          fontSize: '10px',
                          color: '#64748b',
                          fontFamily: "'Cairo', sans-serif",
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px',
                        }}>
                          المرحلة: <span style={{ color: darkMode ? '#94a3b8' : '#334155', fontWeight: 600 }}>{req.stage}</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Metadata: Dept + Submission Date + Micro Click Hint (No ugly button taking space) */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: darkMode ? '1px dashed rgba(255, 255, 255, 0.08)' : '1px dashed #e2e8f0',
                      fontSize: '9.5px',
                      color: '#64748b',
                      fontFamily: "'Cairo', sans-serif",
                      marginTop: '6px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                        <Building2 size={11} color="#64748b" style={{ flexShrink: 0 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {req.department || 'إدارة الشؤون الفنية'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <Clock size={10} color="#64748b" />
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{req.date || 'اليوم'}</span>
                        {isRatePending ? (
                          <span style={{
                            color: '#f59e0b',
                            fontWeight: 800,
                            marginInlineStart: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                          }}>
                            ★ قيّم
                          </span>
                        ) : (
                          <ArrowUpRight size={11} color={routeColor} style={{ marginInlineStart: '2px' }} />
                        )}
                      </div>
                    </div>
                  </CinemaTicketFrame>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══ زر عرض المزيد من المعاملات / طي القائمة ═══ */}
        {filteredList.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 18px',
            borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
          }}>
            <button
              type="button"
              onClick={() => setIsExpandedView(!isExpandedView)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 22px',
                borderRadius: '8px',
                backgroundColor: isExpandedView
                  ? (darkMode ? 'rgba(239, 68, 68, 0.12)' : '#fee2e2')
                  : (darkMode ? 'rgba(19, 93, 121, 0.18)' : 'rgba(19, 93, 121, 0.08)'),
                border: isExpandedView
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : (darkMode ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(19, 93, 121, 0.25)'),
                color: isExpandedView ? '#ef4444' : (darkMode ? '#38bdf8' : '#135d79'),
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'Cairo', sans-serif",
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isExpandedView ? 'none' : '0 2px 10px rgba(19, 93, 121, 0.15)',
              }}
            >
              <span>{isExpandedView ? 'طي القائمة (عرض الشريط المختصر)' : `عرض المزيد من المعاملات (${filteredList.length})`}</span>
              <ChevronDown size={14} style={{ transform: isExpandedView ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s ease' }} />
            </button>
          </div>
        )}

        {/* Ribbon Footer: Concise Info Note */}
        <div style={{
          padding: '8px 18px',
          backgroundColor: darkMode ? '#070b14' : '#f1f5f9',
          borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#64748b',
          fontFamily: "'Cairo', sans-serif",
        }}>
          <div>
            {filterTab === 'active' && (
              <span>{isExpandedView ? 'يتم عرض كافة الطلبات المفتوحة في شبكة متكاملة.' : 'يتم عرض آخر 3 تذاكر مفتوحة. يمكنك الضغط على "عرض المزيد" لفتح كامل الطلبات.'}</span>
            )}
            {filterTab === 'needs_rating' && (
              <span>المعاملات المكتملة التي تنتظر تقييمك لمستوى الخدمة المقدمة.</span>
            )}
            {filterTab === 'archived' && (
              <span>أرشيف شامل لجميع معاملاتك وطلباتك السابقة المعتمدة والمغلقة ({filteredList.length} معاملة).</span>
            )}
          </div>
          <div style={{ fontWeight: 700, color: darkMode ? '#cbd5e1' : '#334155', fontVariantNumeric: 'tabular-nums' }}>
            {isExpandedView ? `${filteredList.length} معروضة` : `${ribbonTickets.length} في الشريط`}
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
