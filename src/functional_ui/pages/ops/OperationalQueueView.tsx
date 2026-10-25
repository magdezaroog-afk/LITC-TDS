import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OpsAPI } from '../../../services/ops.api';
import { useAuth } from '../../../engine/auth/AuthContext';
import { FlowReceptionGovernanceView } from './FlowReceptionGovernanceView';
import { DynamicFormAwareAnalytics } from '../../../components/analytics/DynamicFormAwareAnalytics';
import { AnalyticsGovernanceView } from '../../../components/analytics/AnalyticsGovernanceView';
import { CinemaTicketFrame, TicketCodeBadge } from '../../components/CinemaTicketFrame';
import { 
  Inbox, Activity, CheckCircle, Clock, Search, Filter, 
  AlertCircle, RefreshCw, Layers, MoreVertical, ArrowUpRight,
  Sliders, ShieldCheck, Shield, Tag, X, User, Building2, FileText, Check,
  AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Send, CornerDownLeft,
  MessageSquare, RotateCcw, FileCheck, XCircle, History,
  ArrowRightLeft, Hourglass, Plus, PlusCircle, GitBranch, ArrowLeft, ExternalLink,
  GitPullRequest, Zap, Sun, Moon, BarChart3, Paperclip, Download, Eye,
  LayoutGrid, List, SlidersHorizontal, Minus
} from 'lucide-react';

// --- Types ---
interface Ticket {
  id: number;
  code?: string;
  subject?: string;
  title?: string;
  description?: string;
  priority: string;
  requesterPriority?: string;
  businessPriority?: string;
  status?: string;
  state?: { name: string; label: string };
  creatorId?: number;
  creatorName?: string;
  creator?: { fullName?: string; email?: string; department?: { name?: string } };
  departmentName?: string;
  createdAt: string;
  updatedAt?: string;
  slaBreachAt?: string;
  flowDefinitionName?: string;
  flowDefinitionId?: string;
  isUnassigned?: boolean;
  routingMetadata?: any;
  assignedTo?: { id: number; fullName: string; avatarUrl?: string } | null;
  resolutionNotes?: string;
  parentId?: number | null;
  isSubTicket?: boolean;
  targetDivisionId?: string;
  targetDivisionName?: string;
  handoverInfo?: any;
  isPendingHandover?: boolean;
  parentTicket?: {
    id: number;
    code: string;
    title: string;
    priority: string;
    state?: { name: string; label: string };
    departmentName?: string;
  } | null;
}

interface Stats {
  open: number;
  breached: number;
  completed: number;
}

// --- Helpers for Dual Priority ---
const getLampStyle = (priority?: string) => {
  const p = (priority || 'NORMAL').toUpperCase();
  if (p === 'CRITICAL' || p === 'URGENT') {
    return { color: '#ef4444', label: 'حرج', bg: '#fee2e2' };
  }
  if (p === 'HIGH') {
    return { color: '#ea580c', label: 'عالي', bg: '#ffedd5' };
  }
  if (p === 'MEDIUM') {
    return { color: '#eab308', label: 'متوسط', bg: '#fef9c3' };
  }
  return { color: '#10b981', label: 'عادي', bg: '#dcfce7' };
};

const formatPriorityText = (priority?: string) => {
  const p = (priority || 'NORMAL').toUpperCase();
  if (p === 'CRITICAL' || p === 'URGENT') return 'عاجل جداً';
  if (p === 'HIGH') return 'عالي';
  if (p === 'MEDIUM') return 'متوسط';
  if (p === 'LOW') return 'منخفض';
  return 'عادي';
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return '';
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    return `منذ ${diffDays} يوم`;
  } catch {
    return '';
  }
};

// --- Styles (Glassmorphism & 2026 Standards) ---
const styles = {
  container: {
    padding: '32px',
    minHeight: '100vh',
    background: 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
    direction: 'rtl' as const,
    fontFamily: "var(--font-family, system-ui, -apple-system, sans-serif)"
  },
  glassPanel: {
    background: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '24px',
    boxShadow: '0 4px 24px -2px rgba(15, 23, 42, 0.04), 0 1px 2px 0 rgba(15, 23, 42, 0.02)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    margin: '0 0 8px 0'
  },
  subtitle: {
    color: '#64748b',
    fontSize: '15px',
    margin: 0
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '32px'
  },
  statCard: {
    padding: '24px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(15, 23, 42, 0.04)',
    padding: '6px',
    borderRadius: '16px',
    marginBottom: '24px',
    width: 'fit-content',
    flexWrap: 'wrap' as const
  },
  tab: (isActive: boolean) => ({
    padding: '10px 20px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: isActive ? 700 : 500,
    color: isActive ? '#0f172a' : '#64748b',
    background: isActive ? '#ffffff' : 'transparent',
    boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }),
  listControls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    alignItems: 'center'
  },
  searchBox: {
    flex: 1,
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center'
  },
  searchInput: {
    width: '100%',
    padding: '14px 16px 14px 44px',
    borderRadius: '14px',
    border: '1px solid rgba(0,0,0,0.06)',
    background: 'rgba(255,255,255,0.9)',
    fontSize: '14px',
    outline: 'none',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '14px',
    color: '#94a3b8'
  },
  ticketCard: {
    padding: '20px 24px',
    borderRadius: '18px',
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: '12px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
  },
  priorityBadge: (priority: string) => {
    const map: any = {
      CRITICAL: { bg: '#fee2e2', color: '#dc2626' },
      URGENT: { bg: '#fee2e2', color: '#dc2626' },
      HIGH: { bg: '#ffedd5', color: '#ea580c' },
      MEDIUM: { bg: '#fef9c3', color: '#ca8a04' },
      NORMAL: { bg: '#e0f2fe', color: '#0284c7' },
      LOW: { bg: '#f1f5f9', color: '#64748b' }
    };
    const style = map[priority] || map.NORMAL;
    return {
      padding: '4px 10px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 700,
      background: style.bg,
      color: style.color
    };
  }
};

// ── Ops Status Pill (Sleek, rounded pill with glowing indicator dot) ──
function OpsStatusPill({ status, stateLabel, isDark = true }: { status?: string; stateLabel?: string; isDark?: boolean }) {
  const s = (status || '').toUpperCase();
  let color = '#38bdf8';
  let bg = isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(56, 189, 248, 0.1)';
  let border = 'rgba(56, 189, 248, 0.3)';
  let label = stateLabel || 'مفتوح';

  if (s === 'PENDING' || s === 'NEW') {
    color = '#f59e0b';
    bg = isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.1)';
    border = 'rgba(245, 158, 11, 0.3)';
    label = stateLabel || 'قيد الانتظار';
  } else if (s === 'IN_PROGRESS' || s === 'PROCESSING') {
    color = '#0284c7';
    bg = isDark ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.1)';
    border = 'rgba(2, 132, 199, 0.35)';
    label = stateLabel || 'قيد المعالجة';
  } else if (s === 'RESOLVED' || s === 'COMPLETED' || s === 'CLOSED') {
    color = '#10b981';
    bg = isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)';
    border = 'rgba(16, 185, 129, 0.3)';
    label = stateLabel || 'مكتمل ومغلق';
  } else if (s === 'REJECTED' || s === 'CANCELLED') {
    color = '#ef4444';
    bg = isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)';
    border = 'rgba(239, 68, 68, 0.3)';
    label = stateLabel || 'ملغي / مرفوض';
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 7px',
      borderRadius: '9999px',
      backgroundColor: bg,
      border: `1px solid ${border}`,
      color: color,
      fontSize: '9.5px',
      fontWeight: 700,
      fontFamily: "'Cairo', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: '4.5px',
        height: '4.5px',
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 5px ${color}`,
        flexShrink: 0,
      }} />
      {label}
    </span>
  );
}

// ── Authentic Cinema-Ticket Queue Selector Tile (Exact 28px Icon box matching Requests.tsx) ──
function OpsQueueTile({
  label,
  value,
  sublabel,
  icon: Icon,
  accentColor,
  isSelected,
  onClick,
  isDark,
}: {
  label: string;
  value: number | string;
  sublabel: string;
  icon: any;
  accentColor: string;
  isSelected: boolean;
  onClick: () => void;
  isDark: boolean;
}) {
  return (
    <CinemaTicketFrame
      accentColor={accentColor}
      isSelected={isSelected}
      alwaysGlow={isSelected}
      cornerCutout={13}
      notchRadius={5.5}
      numNotches={3}
      dashIndent={18}
      role="button"
      tabIndex={0}
      customFill={isDark ? (isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.85)') : (isSelected ? '#f8fafc' : '#ffffff')}
      onClick={onClick}
      style={{ width: '100%', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '12.5px',
            fontWeight: isSelected ? 800 : 700,
            color: isSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#334155'),
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

        {/* Exact 28px x 28px icon box with size 14 icon matching Requests.tsx */}
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          backgroundColor: isSelected ? `${accentColor}18` : (isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(30, 58, 82, 0.05)'),
          border: isSelected ? `1px solid ${accentColor}40` : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(30, 58, 82, 0.12)'),
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
          color: isDark ? '#ffffff' : '#0f172a',
          lineHeight: 1,
          fontFamily: "'Tajawal', sans-serif",
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '10.5px',
          color: isSelected ? (isDark ? '#cbd5e1' : '#334155') : (isDark ? '#94a3b8' : '#64748b'),
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

export const OperationalQueueView: React.FC = () => {
  const { user } = useAuth();

  // Adaptive Dark/Light Mode Theme Listener
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        localStorage.getItem('litc_theme') === 'dark' ||
        localStorage.getItem('litc_theme_mode') === 'dark'
      );
    }
    return true;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => {
      const dark =
        document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') && localStorage.getItem('litc_theme') !== 'light');
      setIsDark(dark);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [activeTab, setActiveTab] = useState<'POOL' | 'MY_QUEUE' | 'SUB_TICKETS' | 'ALL_TICKETS' | 'FLOW_SETTINGS' | 'ANALYTICS' | 'COMPARISON' | 'ANALYTICS_GOVERNANCE'>('POOL');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, breached: 0, completed: 0 });
  const [poolCount, setPoolCount] = useState<number>(0);
  const [myCount, setMyCount] = useState<number>(0);
  const [subTicketsCount, setSubTicketsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [managedFlowsCount, setManagedFlowsCount] = useState<number>(0);
  const [canManageFlows, setCanManageFlows] = useState<boolean>(false);

  // View Mode: Horizontal Rail vs. Enterprise Structured List (7 rows per page)
  const [ticketLayoutMode, setTicketLayoutMode] = useState<'RAIL' | 'LIST'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_ops_ticket_layout_mode');
      if (saved === 'LIST') return 'LIST';
      return 'RAIL';
    }
    return 'RAIL';
  });

  const handleToggleLayout = (mode: 'RAIL' | 'LIST') => {
    setTicketLayoutMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_ops_ticket_layout_mode', mode);
    }
  };

  // Horizontal Tickets Rail: Visible Rows (1 to 7) with Vertical Drag Handle Expansion
  const [railVisibleRows, setRailVisibleRows] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_ops_rail_rows');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 1 && parsed <= 7) return parsed;
      }
    }
    return 1;
  });

  const handleSetRailRows = (rowsOrUpdater: number | ((prev: number) => number)) => {
    setRailVisibleRows(prev => {
      const next = typeof rowsOrUpdater === 'function' ? rowsOrUpdater(prev) : rowsOrUpdater;
      const clamped = Math.min(7, Math.max(1, next));
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexus_ops_rail_rows', String(clamped));
      }
      return clamped;
    });
  };

  // Drag Handle Logic for Vertical Row Resizing (1 to 7 rows)
  const dragStartYRef = React.useRef<number | null>(null);
  const dragStartRowsRef = React.useRef<number>(1);
  const [isDraggingHandle, setIsDraggingHandle] = useState<boolean>(false);

  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartYRef.current = e.clientY;
    dragStartRowsRef.current = railVisibleRows;
    setIsDraggingHandle(true);
  };

  const handlePointerMoveResize = (e: React.PointerEvent) => {
    if (!isDraggingHandle || dragStartYRef.current === null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    // Every 35px dragged downwards adds a row, upwards removes a row
    const rowDelta = Math.round(deltaY / 35);
    const targetRows = Math.min(7, Math.max(1, dragStartRowsRef.current + rowDelta));
    if (targetRows !== railVisibleRows) {
      handleSetRailRows(targetRows);
    }
  };

  const handlePointerUpResize = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragStartYRef.current = null;
    setIsDraggingHandle(false);
  };

  // Enterprise List View Pagination: exactly 7 rows per page
  const [listCurrentPage, setListCurrentPage] = useState<number>(1);
  const listRowsPerPage = 7;

  // Reset list page to 1 when search or tab changes
  useEffect(() => {
    setListCurrentPage(1);
  }, [search, activeTab]);

  // Horizontal Tickets Rail Scrolling State & Refs
  const ticketsRailRef = React.useRef<HTMLDivElement>(null);
  const [canScrollTicketsLeft, setCanScrollTicketsLeft] = useState(false);
  const [canScrollTicketsRight, setCanScrollTicketsRight] = useState(false);
  const [isDraggingRail, setIsDraggingRail] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const checkTicketsRailScroll = useCallback(() => {
    const el = ticketsRailRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    const absScroll = Math.abs(scrollLeft);
    setCanScrollTicketsRight(absScroll > 8);
    setCanScrollTicketsLeft(absScroll < maxScroll - 8);
  }, []);

  const handleScrollTicketsRail = (direction: 'right' | 'left') => {
    const el = ticketsRailRef.current;
    if (!el) return;
    const scrollAmount = 330 * 2;
    const sign = direction === 'right' ? 1 : -1;
    el.scrollBy({ left: sign * scrollAmount * -1, behavior: 'smooth' });
    setTimeout(checkTicketsRailScroll, 320);
  };

  const handleRailMouseDown = (e: React.MouseEvent) => {
    const el = ticketsRailRef.current;
    if (!el) return;
    setIsDraggingRail(true);
    setDragStartX(e.pageX - el.offsetLeft);
    setDragScrollLeft(el.scrollLeft);
  };

  const handleRailMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRail) return;
    const el = ticketsRailRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartX) * 1.5;
    el.scrollLeft = dragScrollLeft - walk;
    checkTicketsRailScroll();
  };

  const handleRailMouseUpOrLeave = () => {
    setIsDraggingRail(false);
  };

  useEffect(() => {
    if (ticketLayoutMode === 'RAIL') {
      const timer = setTimeout(checkTicketsRailScroll, 200);
      return () => clearTimeout(timer);
    }
  }, [ticketLayoutMode, tickets, railVisibleRows, checkTicketsRailScroll]);
  
  // Claiming & Inspecting state
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [inspectTicket, setInspectTicket] = useState<Ticket | null>(null);
  const [inspectTicketDetails, setInspectTicketDetails] = useState<any>(null);
  const [inspectPermissions, setInspectPermissions] = useState<any>(null);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState<boolean>(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'DETAILS' | 'HISTORY'>('DETAILS');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Action Modal State
  const [actionModal, setActionModal] = useState<{
    type: 'CLOSE' | 'REQUEST_CLOSURE' | 'APPROVE_CLOSURE' | 'REJECT_CLOSURE' | 'INTERNAL_TRANSFER' | 'ADD_NOTE' | 'REOPEN' | 'REJECT_HANDOVER';
    title: string;
    description: string;
    confirmLabel: string;
    confirmColor: string;
    isNoteRequired: boolean;
  } | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionTargetDeptId, setActionTargetDeptId] = useState<number | null>(null);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; divisions?: Array<{ id: string; name: string; teams?: any[] }> }>>([]);
  const [isExecutingAction, setIsExecutingAction] = useState(false);

  // Colleague Transfer State (Two-Tier Handover)
  const [transferTargetTab, setTransferTargetTab] = useState<'COLLEAGUE' | 'DEPARTMENT'>('COLLEAGUE');
  const [flowMembers, setFlowMembers] = useState<Array<{ id: number; name: string; avatar?: string; jobTitle: string; activeTickets: number }>>([]);
  const [selectedColleagueId, setSelectedColleagueId] = useState<number | null>(null);
  const [transferMode, setTransferMode] = useState<'DIRECT' | 'REQUIRE_ACCEPTANCE'>('REQUIRE_ACCEPTANCE');
  const [loadingFlowMembers, setLoadingFlowMembers] = useState(false);

  // Sub-Tickets Creation Modal State
  const [showSubTicketModal, setShowSubTicketModal] = useState(false);
  const [subTicketTitle, setSubTicketTitle] = useState('');
  const [subTicketDesc, setSubTicketDesc] = useState('');
  const [subTicketDeptId, setSubTicketDeptId] = useState<number | null>(null);
  const [subTicketDivisionId, setSubTicketDivisionId] = useState<string>('');
  const [subTicketPriority, setSubTicketPriority] = useState('MEDIUM');
  const [isCreatingSubTicket, setIsCreatingSubTicket] = useState(false);

  // Fetch Full Ticket Details on inspection
  useEffect(() => {
    if (!inspectTicket) {
      setInspectTicketDetails(null);
      setInspectPermissions(null);
      return;
    }
    setLoadingTicketDetails(true);
    OpsAPI.getTicketDetails(inspectTicket.id)
      .then(res => {
        if (res.success) {
          setInspectTicketDetails(res.data);
          setInspectPermissions(res.permissions || null);
        }
      })
      .catch(err => {
        console.error('Failed to fetch ticket details:', err);
      })
      .finally(() => {
        setLoadingTicketDetails(false);
      });
  }, [inspectTicket]);

  // Load available departments for internal transfer
  useEffect(() => {
    OpsAPI.getDepartments()
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setDepartments(res.data);
        }
      })
      .catch(() => {});
  }, []);

  // Check if current user has managed flows
  useEffect(() => {
    const token = localStorage.getItem('litc_token') || localStorage.getItem('token');
    fetch('/api/v1/flow-governance/my-flows', {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.flows)) {
          setManagedFlowsCount(res.flows.length);
          const role = (user?.role || '').toUpperCase();
          const isElevated = ['SUPER_ADMIN', 'SYSTEM_ADMIN', 'SYSTEM_DIRECTOR', 'TECH_DIRECTOR', 'DEPT_HEAD', 'TEAM_LEADER'].includes(role);
          if (res.flows.length > 0 || isElevated) {
            setCanManageFlows(true);
          }
        }
      })
      .catch(err => console.error('Failed to check managed flows:', err));
  }, [user]);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    if (activeTab === 'FLOW_SETTINGS') return;
    setLoading(true);
    try {
      const [statsRes, poolRes, myRes, subRes, targetRes] = await Promise.all([
        OpsAPI.getStats().catch(() => ({ data: { openCount: 0, slaBreachedCount: 0, closedTodayCount: 0 } })),
        OpsAPI.getAllTickets({ unassigned: true, limit: 50 }).catch(() => ({ data: [] })),
        OpsAPI.getMyQueue({ limit: 50 }).catch(() => ({ data: [] })),
        OpsAPI.getAllSubTickets({ limit: 50 }).catch(() => ({ data: [] })),
        activeTab === 'POOL'
          ? OpsAPI.getAllTickets({ unassigned: true, limit: 50 }).catch(() => ({ data: [] }))
          : activeTab === 'MY_QUEUE'
          ? OpsAPI.getMyQueue({ limit: 50 }).catch(() => ({ data: [] }))
          : activeTab === 'SUB_TICKETS'
          ? OpsAPI.getAllSubTickets({ limit: 50 }).catch(() => ({ data: [] }))
          : OpsAPI.getAllTickets({ limit: 50 }).catch(() => ({ data: [] }))
      ]);

      const statPayload = statsRes.data || statsRes.stats || {};
      setStats({
        open: statPayload.openCount ?? statPayload.open ?? 0,
        breached: statPayload.slaBreachedCount ?? statPayload.breached ?? 0,
        completed: statPayload.closedTodayCount ?? statPayload.completed ?? 0,
      });

      const pList = poolRes.data || poolRes.tickets || [];
      const mList = myRes.data || myRes.tickets || [];
      const sList = subRes.data || subRes.tickets || [];
      const tList = targetRes.data || targetRes.tickets || [];

      setPoolCount(pList.length);
      setMyCount(mList.length);
      setSubTicketsCount(sList.length);
      setTickets(tList);
    } catch (error) {
      console.error('Failed to fetch ops data', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle claiming ticket from pool
  const handleClaimTicket = async (ticketId: number) => {
    setClaimingId(ticketId);
    try {
      const res = await OpsAPI.executeAction(ticketId, { type: 'ACCEPT' });
      if (res.success) {
        setToastMessage(`تم استلام الطلب #${ticketId} بنجاح وإسناده لحسابك للبدء في المعالجة! 🎯`);
        setTimeout(() => setToastMessage(null), 4000);
        if (inspectTicket?.id === ticketId) {
          setInspectTicket(null);
        }
        await fetchData();
      }
    } catch (err: any) {
      alert(err?.message || 'فشل استلام الطلب');
    } finally {
      setClaimingId(null);
    }
  };

  // Open Transfer Modal with colleague fetching
  const handleOpenTransferModal = async () => {
    if (!inspectTicket) return;
    setTransferTargetTab('COLLEAGUE');
    setSelectedColleagueId(null);
    setTransferMode(inspectPermissions?.canTransferDirect ? 'DIRECT' : 'REQUIRE_ACCEPTANCE');
    setActionNote('');
    setActionModal({
      type: 'INTERNAL_TRANSFER',
      title: 'تحويل التذكرة (إسناد لزميل أو إدارة أخرى)',
      description: 'يمكنك تحويل التذكرة لزميل مصرح له بالعمل على هذا المسار مباشرة أو مع تعليقها حتى قبوله، أو تحويلها لإدارة أخرى.',
      confirmLabel: 'تأكيد تحويل التذكرة',
      confirmColor: '#0d9488',
      isNoteRequired: false
    });

    setLoadingFlowMembers(true);
    try {
      const res = await OpsAPI.getTicketFlowMembers(inspectTicket.id);
      if (res.success && Array.isArray(res.data)) {
        setFlowMembers(res.data);
        if (res.data.length > 0) {
          setSelectedColleagueId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load flow members:', err);
    } finally {
      setLoadingFlowMembers(false);
    }
  };

  // Accept pending handover
  const handleAcceptHandover = async (ticketId: number) => {
    setIsExecutingAction(true);
    try {
      const res = await OpsAPI.executeAction(ticketId, { type: 'ACCEPT_HANDOVER' });
      if (res.success) {
        setToastMessage('تم قبول استلام التذكرة وبدء معالجتها بنجاح! 🎯');
        setInspectTicket(null);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'فشل قبول استلام التذكرة');
    } finally {
      setIsExecutingAction(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Open Reject handover modal
  const handleOpenRejectHandoverModal = () => {
    setActionModal({
      type: 'REJECT_HANDOVER',
      title: 'رفض استلام التذكرة المحولة',
      description: 'سيتم إعادة التذكرة إلى الزميل الذي قام بتحويلها إليك مع توضيح سبب الرفض.',
      confirmLabel: 'تأكيد الرفض وإعادة التذكرة للمرسل',
      confirmColor: '#ef4444',
      isNoteRequired: true
    });
    setActionNote('');
  };

  // Open Sub-Ticket Modal with scope calculation
  const openSubTicketModal = () => {
    const isScopeRestricted = inspectPermissions?.subTicketScope === 'SAME_DEPARTMENT' || inspectPermissions?.subTicketScope === 'SAME_DIVISION';
    const userDeptId = inspectPermissions?.userDepartmentId || (user as any)?.departmentId || inspectTicketDetails?.departmentId;

    let targetDept = departments[0];
    if (isScopeRestricted && userDeptId) {
      const matched = departments.find(d => Number(d.id) === Number(userDeptId));
      if (matched) targetDept = matched;
    }

    setSubTicketDeptId(targetDept ? targetDept.id : (userDeptId ? Number(userDeptId) : null));
    setSubTicketDivisionId('');
    setShowSubTicketModal(true);
  };

  // Create Sub-Ticket
  const handleCreateSubTicket = async () => {
    if (!inspectTicket) return;
    if (!subTicketTitle.trim()) {
      alert('يرجى كتابة عنوان المهمة الداخلية الفرعية');
      return;
    }
    if (!subTicketDesc.trim()) {
      alert('يرجى كتابة تفاصيل العمل والمهام المطلوبة من القسم المستهدف');
      return;
    }
    if (!subTicketDeptId) {
      alert('يرجى اختيار الإدارة أو القسم المستهدف للمهمة');
      return;
    }

    setIsCreatingSubTicket(true);
    try {
      const res = await OpsAPI.createSubTicket(inspectTicket.id, {
        title: subTicketTitle.trim(),
        description: subTicketDesc.trim(),
        targetDeptId: subTicketDeptId,
        targetDivisionId: subTicketDivisionId || undefined,
        priority: subTicketPriority
      });
      if (res.success) {
        setToastMessage('تم فتح التذكرة والمهمة الداخلية الفرعية بنجاح! 🚀');
        setShowSubTicketModal(false);
        setSubTicketTitle('');
        setSubTicketDesc('');
        setSubTicketDivisionId('');
        const fresh = await OpsAPI.getTicketDetails(inspectTicket.id);
        if (fresh.success) setInspectTicketDetails(fresh.data);
        await fetchData();
      }
    } catch (err: any) {
      alert(err.message || 'فشل إنشاء التذكرة الداخلية الفرعية');
    } finally {
      setIsCreatingSubTicket(false);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Handle executing operational ticket action
  const handleExecuteTicketAction = async () => {
    if (!inspectTicket || !actionModal) return;
    if (actionModal.isNoteRequired && !actionNote.trim()) {
      alert('يرجى كتابة الملاحظات / تقرير الإنجاز للمتابعة');
      return;
    }

    setIsExecutingAction(true);
    try {
      if (actionModal.type === 'ADD_NOTE') {
        const res = await OpsAPI.addComment(inspectTicket.id, actionNote.trim(), true);
        if (res.success) {
          setToastMessage('تمت إضافة الملاحظة الداخلية بنجاح! 💬');
          setActionModal(null);
          setActionNote('');
          const fresh = await OpsAPI.getTicketDetails(inspectTicket.id);
          if (fresh.success) setInspectTicketDetails(fresh.data);
        }
      } else {
        const payload: any = { type: actionModal.type };
        if (actionModal.type === 'CLOSE' || actionModal.type === 'REQUEST_CLOSURE') {
          payload.resolutionNote = actionNote.trim();
        } else {
          payload.note = actionNote.trim();
        }
        
        if (actionModal.type === 'INTERNAL_TRANSFER') {
          if (transferTargetTab === 'COLLEAGUE') {
            if (!selectedColleagueId) {
              alert('يرجى اختيار الزميل المستهدف لتحويل التذكرة إليه');
              setIsExecutingAction(false);
              return;
            }
            payload.transferTargetType = 'COLLEAGUE';
            payload.targetUserId = selectedColleagueId;
            payload.mode = transferMode;
          } else {
            if (!actionTargetDeptId) {
              alert('يرجى اختيار الإدارة المستهدفة للتحويل');
              setIsExecutingAction(false);
              return;
            }
            payload.transferTargetType = 'DEPARTMENT';
            payload.targetDeptId = actionTargetDeptId;
          }
        }

        const res = await OpsAPI.executeAction(inspectTicket.id, payload);
        if (res.success) {
          const successMsg = 
            actionModal.type === 'CLOSE' ? 'تم إغلاق وإنهاء التذكرة بنجاح! ✅' :
            actionModal.type === 'REQUEST_CLOSURE' ? 'تم رفع طلب اعتماد الإغلاق بنجاح! 📤 سيتم مراجعته من قبل المعتمدين.' :
            actionModal.type === 'APPROVE_CLOSURE' ? 'تم اعتماد الإغلاق النهائي للتذكرة بنجاح! 🛡️' :
            actionModal.type === 'REJECT_CLOSURE' ? 'تم رفض الاعتماد وإعادة التذكرة للمعالجة الفنية. ↩️' :
            actionModal.type === 'REOPEN' ? 'تمت إعادة فتح التذكرة بنجاح! 🔄' :
            actionModal.type === 'REJECT_HANDOVER' ? 'تم رفض استلام التذكرة وإعادتها للمرسل بنجاح! ↩️' :
            actionModal.type === 'INTERNAL_TRANSFER' ? (
              transferTargetTab === 'COLLEAGUE'
                ? (transferMode === 'DIRECT' ? 'تم التحويل المباشر للزميل بنجاح! ⚡' : 'تم إرسال طلب التحويل للزميل وهو معلق بانتظار قبوله! ⏳')
                : 'تم تحويل التذكرة للإدارة المستهدفة بنجاح! 🏢'
            ) :
            'تم تنفيذ الإجراء بنجاح!';
          
          setToastMessage(successMsg);
          setActionModal(null);
          setActionNote('');
          setActionTargetDeptId(null);
          setInspectTicket(null);
          await fetchData();
        }
      }
    } catch (err: any) {
      alert(err?.message || 'فشل تنفيذ الإجراء');
    } finally {
      setIsExecutingAction(false);
      setTimeout(() => setToastMessage(null), 4500);
    }
  };

  // ── Unified View Configurations & Standards ──
  const isTicketView = ['POOL', 'MY_QUEUE', 'ALL_TICKETS', 'SUB_TICKETS'].includes(activeTab);

  const activeViewConfig = React.useMemo(() => {
    switch (activeTab) {
      case 'POOL':
        return {
          title: 'حوض الطلبات الواردة',
          subtitle: 'الطلبات العامة المعلقة بانتظار السحب والإسناد المباشر للفريق',
          badgeText: `${poolCount} معلقة`,
          badgeColor: '#0284c7',
          badgeBg: 'rgba(2, 132, 199, 0.12)',
          icon: Inbox,
          iconBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          glowColor: 'rgba(2, 132, 199, 0.35)'
        };
      case 'MY_QUEUE':
        return {
          title: 'بريدي (المهام المسندة إليّ)',
          subtitle: 'المعاملات والتذاكر التشغيلية المسندة إليك مباشرة قيد المتابعة والإنجاز',
          badgeText: `${myCount} جارية`,
          badgeColor: '#4f46e5',
          badgeBg: 'rgba(79, 70, 229, 0.12)',
          icon: ShieldCheck,
          iconBg: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          glowColor: 'rgba(79, 70, 229, 0.35)'
        };
      case 'ALL_TICKETS':
        return {
          title: 'كافة طلبات وسجل الإدارة',
          subtitle: 'الأرشيف والسجل التشغيلي الشامل لكافة طلبات ومعاملات القسم',
          badgeText: `${stats.open} مفتوحة`,
          badgeColor: isDark ? '#38bdf8' : '#0f172a',
          badgeBg: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(15, 23, 42, 0.08)',
          icon: Layers,
          iconBg: 'linear-gradient(135deg, #1e3a52 0%, #0f172a 100%)',
          glowColor: 'rgba(30, 58, 82, 0.35)'
        };
      case 'SUB_TICKETS':
        return {
          title: 'التذاكر والمهام الداخلية المنبثقة',
          subtitle: 'التكليفات والمهام الفرعية المستحدثة لمعالجة أجزاء من الطلبات الرئيسية',
          badgeText: `${subTicketsCount} فرعية`,
          badgeColor: '#7e22ce',
          badgeBg: 'rgba(126, 34, 206, 0.12)',
          icon: GitPullRequest,
          iconBg: 'linear-gradient(135deg, #7e22ce 0%, #581c87 100%)',
          glowColor: 'rgba(126, 34, 206, 0.35)'
        };
      case 'FLOW_SETTINGS':
        return {
          title: 'خصائص واستقبال الطلبات',
          subtitle: 'حوكمة مسارات استقبال التذاكر، صلاحيات السحب، وأتمتة قواعد التوجيه',
          badgeText: `${managedFlowsCount} مسار`,
          badgeColor: '#d97706',
          badgeBg: 'rgba(217, 119, 6, 0.12)',
          icon: Sliders,
          iconBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
          glowColor: 'rgba(217, 119, 6, 0.35)'
        };
      case 'ANALYTICS':
        return {
          title: 'التحليلات التكيفية للمسار (NACE Universal Pillars)',
          subtitle: 'استخراج مؤشرات الأداء الحية، الركائز الـ 5، وتصنيف البلاغات والمشاكل الأكثر تكراراً',
          badgeText: 'NACE Analytics',
          badgeColor: '#135d79',
          badgeBg: 'rgba(19, 93, 121, 0.12)',
          icon: BarChart3,
          iconBg: 'linear-gradient(135deg, #135d79 0%, #0d4257 100%)',
          glowColor: 'rgba(19, 93, 121, 0.35)'
        };
      case 'COMPARISON':
        return {
          title: 'محرك المقارنة والمفاضلة متعدد الأبعاد (N-Entities)',
          subtitle: 'المفاضلة الشاملة بين الكوادر، المباني والمواقع، المسارات والتدفقات، والمدد الزمنية',
          badgeText: 'N-Entity Comparator',
          badgeColor: '#f36c21',
          badgeBg: 'rgba(243, 108, 33, 0.12)',
          icon: ArrowRightLeft,
          iconBg: 'linear-gradient(135deg, #f36c21 0%, #c2410c 100%)',
          glowColor: 'rgba(243, 108, 33, 0.35)'
        };
      case 'ANALYTICS_GOVERNANCE':
        return {
          title: 'حوكمة وتفويض صلاحيات التحليل (RBAC Delegation)',
          subtitle: 'تفويض قادة الفرق والمهندسين لاستعراض مؤشرات الأداء والمقارنة مع منع تسرب بيانات المسارات',
          badgeText: 'RBAC Delegation',
          badgeColor: '#059669',
          badgeBg: 'rgba(5, 150, 105, 0.12)',
          icon: ShieldCheck,
          iconBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          glowColor: 'rgba(5, 150, 105, 0.35)'
        };
      default:
        return {
          title: 'إدارة واستقبال الطلبات',
          subtitle: 'مركز المعالجة والتشغيل',
          badgeText: 'نشط',
          badgeColor: '#135d79',
          badgeBg: 'rgba(19, 93, 121, 0.12)',
          icon: Inbox,
          iconBg: 'linear-gradient(135deg, #135d79 0%, #0d4257 100%)',
          glowColor: 'rgba(19, 93, 121, 0.35)'
        };
    }
  }, [activeTab, poolCount, myCount, stats.open, subTicketsCount, managedFlowsCount, isDark]);

  // --- UI Render ---
  return (
    <div style={{
      ...styles.container,
      background: isDark
        ? 'radial-gradient(ellipse at 80% 0%, #172554 0%, #0b1120 70%, #050811 100%)'
        : 'linear-gradient(145deg, #f8fafc 0%, #f1f5f9 100%)',
      color: isDark ? '#ffffff' : '#0f172a',
      transition: 'background 0.3s ease, color 0.3s ease',
    }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            style={{
              position: 'fixed',
              top: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 99999,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '14px 28px',
              borderRadius: '16px',
              fontWeight: 700,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 12px 32px rgba(16, 185, 129, 0.35)',
            }}
          >
            <CheckCircle2 size={20} />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 1. OPERATIONAL HEADER & LIVE STATUS ═══ */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '24px',
              fontWeight: 900,
              color: isDark ? '#ffffff' : '#0f172a',
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
              letterSpacing: '-0.02em'
            }}>
              إدارة واستقبال الطلبات
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '6px',
              background: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)',
              border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(37, 99, 235, 0.25)',
              color: isDark ? '#93c5fd' : '#1d4ed8'
            }}>
              مركز العمليات المباشر
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
            إدارة حوض الطلبات الواردة، مهام الكادر، وحوكمة الأتمتة للمسارات التشغيلية
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Live System Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 700,
            color: isDark ? '#4ade80' : '#16a34a',
            background: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(22, 163, 74, 0.08)',
            border: isDark ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(22, 163, 74, 0.25)',
            padding: '6px 12px',
            borderRadius: '9999px',
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              boxShadow: '0 0 8px #16a34a'
            }} />
            <span>الخدمات التشغيلية: نشطة ومباشرة</span>
          </div>


          {/* Unified Refresh Button */}
          {activeTab !== 'FLOW_SETTINGS' && (
            <button 
              onClick={fetchData}
              title="تحديث البيانات الفورية"
              style={{ 
                background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
                padding: '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                fontWeight: 700,
                color: isDark ? '#f1f5f9' : '#334155',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = isDark ? '#38bdf8' : '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
            >
              <RefreshCw size={15} color={isDark ? '#38bdf8' : '#475569'} className={loading ? 'animate-spin' : ''} />
              <span>تحديث البيانات</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ 2. MAIN 2-COLUMN WORKSPACE (VERTICAL RAIL ON RIGHT + MAIN CANVAS ON LEFT) ═══ */}
      <div className="enterprise-adaptive-workspace" style={{ direction: 'rtl' }}>

        {/* ── RIGHT COLUMN: VERTICAL OPERATIONAL RAIL (يمين الشاشة) ── */}
        <aside className="enterprise-operational-rail" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          position: 'sticky',
          top: '96px',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
          paddingBottom: '24px',
          scrollbarWidth: 'none'
        }}>
          {/* Quick KPI Summary Tile */}
          <div style={{
            background: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff',
            backdropFilter: 'blur(16px)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '14px',
            boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 4px 16px rgba(15, 23, 42, 0.04)'
          }}>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: isDark ? '#f1f5f9' : '#64748b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="#38bdf8" />
              <span>مؤشرات أداء القسم</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', textAlign: 'center' }}>
              <div style={{
                background: isDark ? 'rgba(2, 132, 199, 0.15)' : '#eff6ff',
                padding: '8px 2px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(2, 132, 199, 0.3)' : '1px solid #dbeafe'
              }}>
                <div style={{ fontSize: '10px', color: isDark ? '#38bdf8' : '#1e40af', fontWeight: 700 }}>المفتوحة</div>
                <div style={{ fontSize: '16px', color: isDark ? '#7dd3fc' : '#1d4ed8', fontWeight: 900 }}>{stats.open}</div>
              </div>
              <div style={{
                background: stats.breached > 0
                  ? (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2')
                  : (isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc'),
                padding: '8px 2px',
                borderRadius: '8px',
                border: stats.breached > 0
                  ? (isDark ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid #fee2e2')
                  : (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0')
              }}>
                <div style={{ fontSize: '10px', color: stats.breached > 0 ? (isDark ? '#fca5a5' : '#b91c1c') : (isDark ? '#94a3b8' : '#64748b'), fontWeight: 700 }}>متأخرة</div>
                <div style={{ fontSize: '16px', color: stats.breached > 0 ? (isDark ? '#ef4444' : '#dc2626') : (isDark ? '#94a3b8' : '#64748b'), fontWeight: 900 }}>{stats.breached}</div>
              </div>
              <div style={{
                background: isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4',
                padding: '8px 2px',
                borderRadius: '8px',
                border: isDark ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #dcfce7'
              }}>
                <div style={{ fontSize: '10px', color: isDark ? '#6ee7b7' : '#15803d', fontWeight: 700 }}>مكتملة</div>
                <div style={{ fontSize: '16px', color: isDark ? '#34d399' : '#16a34a', fontWeight: 900 }}>{stats.completed}</div>
              </div>
            </div>
          </div>

          {/* Rail Section Title */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 4px 6px',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: isDark ? '#cbd5e1' : '#1e293b',
              fontFamily: "'Cairo', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <Filter size={13} color={isDark ? "#60a5fa" : "#1e3a52"} />
              <span>أحواض العمل والمهام</span>
            </span>
            <span style={{
              fontSize: '10.5px',
              color: '#64748b',
              fontFamily: "'Cairo', sans-serif",
            }}>
              تصفية سريعة
            </span>
          </div>

          {/* Touch-Scrollable Tabs Rail (Stacks vertically on desktop, swipes horizontally on mobile) */}
          <div className="mobile-tabs-rail" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. الطلبات الواردة (تجمع كافة أحواض العمل والمهام التشغيلية الأربعة) */}
            <OpsQueueTile
              label="الطلبات الواردة"
              value={stats.open}
              sublabel="أحواض العمل والمهام التشغيلية"
              icon={Inbox}
              accentColor="#0284c7"
              isSelected={isTicketView}
              onClick={() => {
                if (!isTicketView) setActiveTab('POOL');
              }}
              isDark={isDark}
            />

          {/* 5. خصائص استقبال الطلبات */}
          {canManageFlows && (
            <OpsQueueTile
              label="خصائص استقبال الطلبات"
              value={managedFlowsCount}
              sublabel="حوكمة وأتمتة مسارات الاستقبال"
              icon={Sliders}
              accentColor="#d97706"
              isSelected={activeTab === 'FLOW_SETTINGS'}
              onClick={() => setActiveTab('FLOW_SETTINGS')}
              isDark={isDark}
            />
          )}

          {/* Rail Section Title: التحليلات والمقارنة المؤسسية */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 4px 6px',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            marginTop: '4px'
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: isDark ? '#cbd5e1' : '#1e293b',
              fontFamily: "'Cairo', sans-serif",
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}>
              <BarChart3 size={13} color={isDark ? "#f36c21" : "#135d79"} />
              <span>التحليلات والمقارنة</span>
            </span>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#f36c21',
              backgroundColor: 'rgba(243, 108, 33, 0.12)',
              padding: '1px 6px',
              borderRadius: '9999px',
              fontFamily: "'Cairo', sans-serif",
            }}>
              NACE
            </span>
          </div>

          {/* 6. التحليلات التكيفية للمسار */}
          <OpsQueueTile
            label="التحليلات التكيفية للمسار"
            value="NACE"
            sublabel="الركائز الـ 5 ونماذج المسار"
            icon={BarChart3}
            accentColor="#135d79"
            isSelected={activeTab === 'ANALYTICS'}
            onClick={() => setActiveTab('ANALYTICS')}
            isDark={isDark}
          />

          {/* 7. محرك المقارنة متعدد الأبعاد */}
          <OpsQueueTile
            label="محرك المقارنة والمفاضلة"
            value="N-Entity"
            sublabel="مفاضلة الكوادر والمباني والمسارات"
            icon={ArrowRightLeft}
            accentColor="#f36c21"
            isSelected={activeTab === 'COMPARISON'}
            onClick={() => setActiveTab('COMPARISON')}
            isDark={isDark}
          />

          {/* 8. تفويض صلاحيات التحليل (للمدراء وقادة المسارات) */}
          {canManageFlows && (
            <OpsQueueTile
              label="حوكمة وتفويض التحليل"
              value="RBAC"
              sublabel="تفويض الصلاحيات لقادة الفرق"
              icon={ShieldCheck}
              accentColor="#059669"
              isSelected={activeTab === 'ANALYTICS_GOVERNANCE'}
              onClick={() => setActiveTab('ANALYTICS_GOVERNANCE')}
              isDark={isDark}
            />
          )}
          </div>
        </aside>

        {/* ── LEFT COLUMN: UNIFIED MAIN OPERATIONS CANVAS FRAME (مستطيل العرض الموحد) ── */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* ═══ TOP OPERATIONAL QUEUES SWITCHER (أحواض الطلبات الأربعة الموحدة أعلاها) ═══ */}
          {isTicketView && (
            <div className="operational-top-queues-bar">
              {[
                {
                  id: 'POOL',
                  label: 'حوض الطلبات الواردة',
                  count: poolCount,
                  badge: 'معلقة للسحب',
                  sublabel: 'الطلبات العامة بانتظار الإسناد',
                  icon: Inbox,
                  accentColor: '#0284c7',
                },
                {
                  id: 'MY_QUEUE',
                  label: 'بريدي (مسندة إليّ)',
                  count: myCount,
                  badge: 'مهام جارية',
                  sublabel: 'المعاملات المباشرة قيد إنجازك',
                  icon: ShieldCheck,
                  accentColor: '#4f46e5',
                },
                {
                  id: 'ALL_TICKETS',
                  label: 'كافة طلبات الإدارة',
                  count: stats.open,
                  badge: 'سجل القسم',
                  sublabel: 'الأرشيف التشغيلي العام للقسم',
                  icon: Layers,
                  accentColor: isDark ? '#38bdf8' : '#0f172a',
                },
                {
                  id: 'SUB_TICKETS',
                  label: 'التذاكر والمهام الداخلية',
                  count: subTicketsCount,
                  badge: 'مهام فرعية',
                  sublabel: 'التكليفات المنبثقة للفرق',
                  icon: GitPullRequest,
                  accentColor: '#7e22ce',
                },
              ].map((q) => {
                const isSelected = activeTab === q.id;
                const IconComponent = q.icon;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActiveTab(q.id as any)}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontFamily: "'Cairo', sans-serif",
                      outline: 'none',
                      transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: isSelected
                        ? (isDark
                            ? `linear-gradient(135deg, ${q.accentColor}26 0%, rgba(15, 23, 42, 0.95) 100%)`
                            : `linear-gradient(135deg, #ffffff 0%, ${q.accentColor}12 100%)`)
                        : (isDark ? 'rgba(15, 23, 42, 0.72)' : '#ffffff'),
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: isSelected
                        ? `1.5px solid ${q.accentColor}`
                        : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                      boxShadow: isSelected
                        ? (isDark
                            ? `0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px ${q.accentColor}25`
                            : `0 8px 20px -4px rgba(0, 0, 0, 0.08), 0 0 12px ${q.accentColor}20`)
                        : (isDark ? '0 4px 14px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.03)'),
                      transform: isSelected ? 'translateY(-1.5px)' : 'none',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = isDark ? `${q.accentColor}80` : `${q.accentColor}60`;
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    {/* Top Row: Icon + Count/Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '9px',
                        backgroundColor: isSelected ? `${q.accentColor}22` : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'),
                        border: isSelected ? `1px solid ${q.accentColor}40` : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                        color: q.accentColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.2s ease',
                      }}>
                        <IconComponent size={16} strokeWidth={isSelected ? 2.5 : 2} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontSize: '18px',
                          fontWeight: 900,
                          color: isSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#cbd5e1' : '#334155'),
                          fontFamily: "'Tajawal', sans-serif",
                          fontVariantNumeric: 'tabular-nums',
                          lineHeight: 1,
                        }}>
                          {q.count}
                        </span>
                        <span style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          color: isSelected ? q.accentColor : '#64748b',
                          backgroundColor: isSelected ? `${q.accentColor}18` : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9'),
                          border: isSelected ? `1px solid ${q.accentColor}35` : '1px solid transparent',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}>
                          {isSelected && (
                            <span style={{
                              width: '4px',
                              height: '4px',
                              borderRadius: '50%',
                              backgroundColor: q.accentColor,
                              boxShadow: `0 0 6px ${q.accentColor}`,
                            }} />
                          )}
                          {q.badge}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Title */}
                    <div>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 800 : 700,
                        color: isSelected ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#e2e8f0' : '#1e293b'),
                        lineHeight: 1.3,
                        marginBottom: '2px',
                      }}>
                        {q.label}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: 500,
                        color: isSelected ? (isDark ? '#94a3b8' : '#64748b') : (isDark ? '#64748b' : '#94a3b8'),
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {q.sublabel}
                      </div>
                    </div>

                    {/* Bottom Active Glow Line */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: '16px',
                        left: '16px',
                        height: '2.5px',
                        borderRadius: '9999px 9999px 0 0',
                        backgroundColor: q.accentColor,
                        boxShadow: `0 0 10px ${q.accentColor}`,
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <div 
            className="unified-operations-canvas-card"
            style={{
              background: isDark ? 'rgba(15, 23, 42, 0.78)' : 'rgba(255, 255, 255, 0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(226, 232, 240, 0.85)',
              borderRadius: '20px',
              padding: '24px 28px',
              boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.4)' : '0 4px 24px -2px rgba(15, 23, 42, 0.05)',
              minHeight: '780px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              transition: 'all 0.25s ease'
            }}
          >
            {/* ═══ 1. UNIFIED VIEW TITLE & ACTION HEADER STRIP ═══ */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
              paddingBottom: '18px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9'
            }}>
              {/* Identity (Icon + Title + Badge + Subtitle) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: activeViewConfig.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: `0 4px 14px ${activeViewConfig.glowColor}`,
                  flexShrink: 0
                }}>
                  <activeViewConfig.icon size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 800,
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      {activeViewConfig.title}
                    </h2>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      color: activeViewConfig.badgeColor,
                      backgroundColor: activeViewConfig.badgeBg,
                      border: `1px solid ${activeViewConfig.badgeColor}33`,
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      {activeViewConfig.badgeText}
                    </span>
                  </div>
                  <p style={{
                    margin: '3px 0 0 0',
                    fontSize: '12.5px',
                    color: isDark ? '#94a3b8' : '#64748b'
                  }}>
                    {activeViewConfig.subtitle}
                  </p>
                </div>
              </div>

              {/* View-Specific Contextual Search / Refresh / Layout Controls for Tickets */}
              {isTicketView && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  {/* View Mode Switcher: Rail (~7 cards) vs. Grid vs. Table/List */}
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#f1f5f9',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '2.5px',
                    gap: '2px',
                  }}>
                    <button
                      type="button"
                      onClick={() => handleToggleLayout('RAIL')}
                      title="شريط الكروت الأفقي (تذاكر مريحة قابلة للتمرير مع إمكانية تمديد الصفوف لأسفل)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '7px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: ticketLayoutMode === 'RAIL' ? 800 : 600,
                        fontFamily: "'Cairo', sans-serif",
                        background: ticketLayoutMode === 'RAIL'
                          ? (isDark ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff')
                          : 'transparent',
                        color: ticketLayoutMode === 'RAIL'
                          ? '#ffffff'
                          : (isDark ? '#94a3b8' : '#64748b'),
                        boxShadow: ticketLayoutMode === 'RAIL'
                          ? (isDark ? '0 2px 8px rgba(2, 132, 199, 0.4)' : '0 2px 6px rgba(0,0,0,0.06)')
                          : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <SlidersHorizontal size={13} />
                      <span>شريط أفقي</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleLayout('LIST')}
                      title="عرض القائمة المنظمة (7 صفوف لكل صفحة مع ترقيم وتصفح)"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '6px 12px',
                        borderRadius: '7px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '11.5px',
                        fontWeight: ticketLayoutMode === 'LIST' ? 800 : 600,
                        fontFamily: "'Cairo', sans-serif",
                        background: ticketLayoutMode === 'LIST'
                          ? (isDark ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff')
                          : 'transparent',
                        color: ticketLayoutMode === 'LIST'
                          ? '#ffffff'
                          : (isDark ? '#94a3b8' : '#64748b'),
                        boxShadow: ticketLayoutMode === 'LIST'
                          ? (isDark ? '0 2px 8px rgba(2, 132, 199, 0.4)' : '0 2px 6px rgba(0,0,0,0.06)')
                          : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <List size={13} />
                      <span>قائمة منظمة (7 صفوف)</span>
                    </button>
                  </div>

                  <div style={{ position: 'relative', flex: 1, minWidth: '180px', maxWidth: '320px' }}>
                    <Search size={15} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input 
                      type="text" 
                      placeholder="ابحث برقم الطلب، الموضوع، أو اسم المُرسل..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '9px 36px 9px 12px',
                        borderRadius: '10px',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                        background: isDark ? 'rgba(30, 41, 59, 0.6)' : '#ffffff',
                        fontSize: '13px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    {search && (
                      <button
                        onClick={() => setSearch('')}
                        style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={fetchData}
                    disabled={loading}
                    title="تحديث البيانات الفورية"
                    style={{
                      padding: '9px 14px',
                      borderRadius: '10px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12.5px',
                      fontWeight: 700
                    }}
                  >
                    <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                    <span>تحديث</span>
                  </button>
                </div>
              )}
            </div>

            {/* ═══ 2. VIEW BODY (ALL VIEWS EMBEDDED SEAMLESSLY INSIDE) ═══ */}
            {activeTab === 'FLOW_SETTINGS' ? (
              <FlowReceptionGovernanceView />
            ) : activeTab === 'ANALYTICS' ? (
              <DynamicFormAwareAnalytics initialTab="OVERVIEW" isDark={isDark} isEmbedded={true} />
            ) : activeTab === 'COMPARISON' ? (
              <DynamicFormAwareAnalytics initialTab="COMPARISON" isDark={isDark} isEmbedded={true} />
            ) : activeTab === 'ANALYTICS_GOVERNANCE' ? (
              <AnalyticsGovernanceView isDark={isDark} />
            ) : (
              /* Tickets List Rendered in RAIL, GRID, or LIST */
              <div style={{ minHeight: '520px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#94a3b8', gap: '14px', flex: 1 }}>
                    <RefreshCw size={28} className="animate-spin" color="#2563eb" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: isDark ? '#94a3b8' : '#475569' }}>جاري استرجاع طابور الطلبات...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8', flex: 1 }}>
                    <div style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '20px',
                      background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>
                      <Inbox size={32} />
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: isDark ? '#f1f5f9' : '#334155', marginBottom: '6px' }}>
                      {activeTab === 'POOL' ? 'حوض الطلبات فارغ حالياً' : activeTab === 'MY_QUEUE' ? 'بريدك الشخصي فارغ' : 'لا توجد طلبات مسجلة'}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
                      {activeTab === 'POOL' ? 'لا توجد طلبات جديدة معلقة في انتظار السحب والإسناد.' : 'لم يتم إسناد أي طلبات نشطة إليك حالياً.'}
                    </p>
                  </div>
                ) : (() => {
                  const filteredTickets = tickets.filter(t => 
                    (t.subject || t.title || '').toLowerCase().includes(search.toLowerCase()) || 
                    t.id.toString().includes(search) || 
                    (t.creatorName || '').toLowerCase().includes(search.toLowerCase()) ||
                    (t.code || '').toLowerCase().includes(search.toLowerCase()) ||
                    (t.departmentName || '').toLowerCase().includes(search.toLowerCase())
                  );

                                    const renderCinemaCard = (ticket: Ticket, i: number, isRail: boolean = false) => {
                    const reqPriority = ticket.requesterPriority || ticket.priority;
                    const bizPriority = ticket.businessPriority || ticket.priority;
                    const lamp = getLampStyle(reqPriority);
                    const isUnassigned = ticket.isUnassigned !== false && !ticket.assignedTo;
                    const ticketCode = ticket.code || `REQ-${String(ticket.id).padStart(4, '0')}`;
                    
                    const accentColor = (bizPriority === 'CRITICAL' || bizPriority === 'URGENT')
                      ? '#ef4444'
                      : bizPriority === 'HIGH'
                      ? '#ea580c'
                      : isUnassigned
                      ? '#0284c7'
                      : '#4f46e5';

                    const timeStr = new Date(ticket.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' });
                    const timeAgoStr = formatTimeAgo(ticket.createdAt);

                    return (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: Math.min(i * 0.015, 0.25) }}
                        className={isRail ? 'ops-tickets-rail-item' : ''}
                        style={isRail ? undefined : { minWidth: 0, height: '100%' }}
                      >
                        <CinemaTicketFrame
                          accentColor={accentColor}
                          isSelected={inspectTicket?.id === ticket.id}
                          alwaysGlow={bizPriority === 'CRITICAL' || bizPriority === 'URGENT'}
                          cornerCutout={7}
                          notchRadius={3.5}
                          numNotches={2}
                          dashIndent={10}
                          contentPadding="12px 14px"
                          customFill={isDark ? 'rgba(15, 23, 42, 0.92)' : '#ffffff'}
                          onClick={() => setInspectTicket(ticket)}
                          style={{
                            width: '100%',
                            height: '100%',
                            minHeight: '235px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'none';
                          }}
                        >
                          {/* Card Content Top & Middle */}
                          <div>
                            {/* Card Header: Code Badge + Status + Requester Priority Lamp */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                <div style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '6px',
                                  backgroundColor: `${accentColor}18`,
                                  border: `1px solid ${accentColor}40`,
                                  color: accentColor,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  <Zap size={12} strokeWidth={2.4} />
                                </div>
                                <TicketCodeBadge code={ticketCode} color={accentColor} compact />
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                                <OpsStatusPill status={ticket.status} stateLabel={ticket.state?.label} isDark={isDark} />
                                
                                <div
                                  style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    backgroundColor: lamp.color,
                                    boxShadow: `0 0 6px ${lamp.color}`,
                                    flexShrink: 0,
                                  }}
                                  title={`أولوية صاحب الطلب: ${lamp.label}`}
                                />
                              </div>
                            </div>

                            {/* Business Priority & Service Flow Category */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '7px' }}>
                              <span style={{
                                ...styles.priorityBadge(bizPriority),
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontFamily: "'Cairo', sans-serif",
                              }}>
                                {formatPriorityText(bizPriority)}
                              </span>
                              <span style={{
                                fontSize: '10.5px',
                                color: isDark ? '#94a3b8' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                <Layers size={10.5} color="#6366f1" />
                                <span style={{ fontWeight: 600 }}>{ticket.flowDefinitionName || 'مسار عام'}</span>
                              </span>
                            </div>

                            {/* Ticket Subject/Title */}
                            <h3 style={{
                              margin: '0 0 6px 0',
                              fontSize: '13px',
                              fontWeight: 800,
                              color: isDark ? '#ffffff' : '#0f172a',
                              fontFamily: "'Tajawal', sans-serif",
                              lineHeight: 1.45,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {ticket.subject || ticket.title}
                            </h3>

                            {/* Sub-badges (Handover / Sub-ticket) */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', marginBottom: '6px' }}>
                              {ticket.isPendingHandover && (
                                <span style={{
                                  background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                  color: isDark ? '#fbbf24' : '#b45309',
                                  border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #fde68a',
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}>
                                  ⏳ {ticket.handoverInfo?.toUserId === user?.id ? 'محولة إليك' : 'بانتظار التحويل'}
                                </span>
                              )}
                              {(ticket.isSubTicket || ticket.parentId) && (
                                <span style={{
                                  background: isDark ? 'rgba(168, 85, 247, 0.2)' : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                                  color: isDark ? '#c084fc' : '#7e22ce',
                                  border: isDark ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid #e9d5ff',
                                  fontSize: '9.5px',
                                  fontWeight: 800,
                                  padding: '1px 6px',
                                  borderRadius: '5px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}>
                                  📎 مهمة فرعية {ticket.parentId ? `(#${ticket.parentId})` : ''}
                                </span>
                              )}
                            </div>

                            {/* Detailed Metadata: Requester & Requester Department + Target Dept + Assignee */}
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '3.5px',
                              fontSize: '11px',
                              color: isDark ? '#94a3b8' : '#64748b',
                              fontFamily: "'Cairo', sans-serif",
                              marginTop: '5px',
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <User size={12} color="#6366f1" style={{ flexShrink: 0 }} />
                                <span style={{ color: isDark ? '#cbd5e1' : '#334155', fontWeight: 700 }}>
                                  {ticket.creatorName || ticket.creator?.fullName || 'غير معروف'}
                                </span>
                                <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                                  ({ticket.creator?.department?.name || ticket.departmentName || 'إدارة التشغيل'})
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <Building2 size={12} color="#0284c7" style={{ flexShrink: 0 }} />
                                <span>المختصة: {ticket.departmentName || 'إدارة الخدمات'}</span>
                              </div>

                              {ticket.assignedTo ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isDark ? '#a5b4fc' : '#4f46e5', fontWeight: 700, fontSize: '10.5px' }}>
                                  <ShieldCheck size={12} style={{ flexShrink: 0 }} />
                                  <span>المسؤول: {ticket.assignedTo.fullName}</span>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isDark ? '#38bdf8' : '#0284c7', fontWeight: 700, fontSize: '10.5px' }}>
                                  <Zap size={12} style={{ flexShrink: 0 }} />
                                  <span>شاغر (غير مسند - بالحوض)</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer: Timestamp and Click hint (Clicking anywhere on card opens details) */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '8px',
                            borderTop: isDark ? '1px dashed rgba(255, 255, 255, 0.08)' : '1px dashed #e2e8f0',
                            marginTop: '10px',
                            gap: '8px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isDark ? '#cbd5e1' : '#334155', fontSize: '11px', fontWeight: 700 }}>
                              <Clock size={11} color="#64748b" />
                              <span>{timeAgoStr}</span>
                            </div>
                            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                              {timeStr}
                            </div>
                          </div>
                        </CinemaTicketFrame>
                      </motion.div>
                    );
                  };

                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      {ticketLayoutMode === 'RAIL' ? (
                        /* ── 1. HORIZONTAL CAROUSEL / RAIL VIEW (Multi-row expandable track with drag handle + scroll arrows) ── */
                        <div className="ops-tickets-rail-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                          {/* Right Arrow Button (RTL) */}
                          <button
                            type="button"
                            className="ops-tickets-rail-btn ops-tickets-rail-btn-right"
                            onClick={() => handleScrollTicketsRail('right')}
                            disabled={!canScrollTicketsRight}
                            title="تمرير التذاكر لليمين"
                            aria-label="تمرير لليمين"
                          >
                            <ChevronRight size={20} />
                          </button>

                          {/* Left Arrow Button (RTL) */}
                          <button
                            type="button"
                            className="ops-tickets-rail-btn ops-tickets-rail-btn-left"
                            onClick={() => handleScrollTicketsRail('left')}
                            disabled={!canScrollTicketsLeft}
                            title="تمرير التذاكر لليسار"
                            aria-label="تمرير لليسار"
                          >
                            <ChevronLeft size={20} />
                          </button>

                          {/* Top Rail Feed Info Bar */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                            padding: '0 4px',
                            fontSize: '11.5px',
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontFamily: "'Cairo', sans-serif"
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{
                                display: 'inline-block',
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: '#0284c7',
                                boxShadow: '0 0 6px #0284c7'
                              }} />
                              <span>شريط التذاكر المباشر • مرر بالأسهم أو اسحب بالماوس • انقر على أي تذكرة لفحصها</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: isDark ? '#38bdf8' : '#0284c7',
                                background: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
                                padding: '1px 8px',
                                borderRadius: '6px',
                              }}>
                                {railVisibleRows} {railVisibleRows === 1 ? 'صف' : railVisibleRows === 2 ? 'صفان' : 'صفوف'}
                              </span>
                              <span style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                                معروض {filteredTickets.length} تذكرة
                              </span>
                            </div>
                          </div>

                          {/* Horizontal Scrollable Rail with Multi-Row Grid Track */}
                          <div
                            ref={ticketsRailRef}
                            className="ops-tickets-rail"
                            onScroll={checkTicketsRailScroll}
                            onMouseDown={handleRailMouseDown}
                            onMouseMove={handleRailMouseMove}
                            onMouseUp={handleRailMouseUpOrLeave}
                            onMouseLeave={handleRailMouseUpOrLeave}
                            style={{
                              display: 'grid',
                              gridTemplateRows: `repeat(${railVisibleRows}, minmax(215px, 1fr))`,
                              gridAutoFlow: 'column',
                              gridAutoColumns: '315px',
                              columnGap: '16px',
                              rowGap: '14px',
                              minHeight: `${railVisibleRows * 225 + 35}px`,
                              transition: 'min-height 0.2s ease',
                              position: 'relative',
                            }}
                          >
                            <AnimatePresence>
                              {filteredTickets.map((ticket, i) => renderCinemaCard(ticket, i, true))}
                            </AnimatePresence>
                          </div>

                          {/* ═══ مقبض السحب الرأسي في منتصف الحافة السفلية للتحكم بعدد الصفوف من 1 إلى 7 ═══ */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '6px 12px',
                              borderRadius: '9999px',
                              backgroundColor: isDraggingHandle
                                ? (isDark ? '#1e293b' : '#e2e8f0')
                                : (isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.95)'),
                              border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(19, 93, 121, 0.15)',
                              boxShadow: isDraggingHandle ? '0 0 14px rgba(2, 132, 199, 0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
                              transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                              userSelect: 'none',
                              margin: '4px auto 0 auto',
                              width: 'fit-content',
                            }}
                          >
                            {/* زر تقليل الصفوف (-) */}
                            <button
                              type="button"
                              onClick={() => handleSetRailRows(r => Math.max(1, r - 1))}
                              disabled={railVisibleRows <= 1}
                              title="تقليل عدد صفوف البطاقات (الحد الأدنى: 1 صف)"
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: railVisibleRows <= 1 ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#ffffff'),
                                color: railVisibleRows <= 1 ? (isDark ? '#475569' : '#cbd5e1') : (isDark ? '#f8fafc' : '#0f172a'),
                                cursor: railVisibleRows <= 1 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                fontSize: '11px',
                                fontWeight: 900,
                                boxShadow: railVisibleRows <= 1 ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
                              }}
                            >
                              <Minus size={12} strokeWidth={2.8} />
                            </button>

                            {/* مقبض السحب بالماوس أو اللمس (Drag Bar) */}
                            <div
                              onPointerDown={handlePointerDownResize}
                              onPointerMove={handlePointerMoveResize}
                              onPointerUp={handlePointerUpResize}
                              onPointerCancel={handlePointerUpResize}
                              title="امسكه واسحب لأسفل لزيادة صفوف البطاقات أو لأعلى للتقليل (من 1 إلى 7 صفوف)"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'ns-resize',
                                touchAction: 'none',
                                padding: '2px 6px',
                              }}
                            >
                              <div
                                style={{
                                  width: '38px',
                                  height: '4.5px',
                                  borderRadius: '9999px',
                                  backgroundColor: isDraggingHandle
                                    ? '#0284c7'
                                    : (isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(19, 93, 121, 0.35)'),
                                  transition: 'background-color 0.15s ease',
                                }}
                              />
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                color: isDark ? '#cbd5e1' : '#475569',
                                fontFamily: "'Cairo', sans-serif",
                                fontVariantNumeric: 'tabular-nums',
                                whiteSpace: 'nowrap',
                              }}>
                                {railVisibleRows} {railVisibleRows === 1 ? 'صف' : railVisibleRows === 2 ? 'صفان' : 'صفوف'}
                              </span>
                            </div>

                            {/* زر زيادة الصفوف (+) */}
                            <button
                              type="button"
                              onClick={() => handleSetRailRows(r => Math.min(7, r + 1))}
                              disabled={railVisibleRows >= 7}
                              title="زيادة عدد صفوف البطاقات (الحد الأقصى: 7 صفوف)"
                              style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: railVisibleRows >= 7 ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#ffffff'),
                                color: railVisibleRows >= 7 ? (isDark ? '#475569' : '#cbd5e1') : (isDark ? '#f8fafc' : '#0f172a'),
                                cursor: railVisibleRows >= 7 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                fontSize: '11px',
                                fontWeight: 900,
                                boxShadow: railVisibleRows >= 7 ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
                              }}
                            >
                              <Plus size={12} strokeWidth={2.8} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── 2. ENTERPRISE STRUCTURED LIST (معيار الـ 7 صفوف المنظم مع الترقيم وأزرار التصفح) ── */
                        (() => {
                          const totalListPages = Math.max(1, Math.ceil(filteredTickets.length / listRowsPerPage));
                          const safePage = Math.min(totalListPages, Math.max(1, listCurrentPage));
                          const startIdx = (safePage - 1) * listRowsPerPage;
                          const pageTickets = filteredTickets.slice(startIdx, startIdx + listRowsPerPage);

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div className="ops-tickets-table-wrapper" style={{
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                                background: isDark ? 'rgba(15, 23, 42, 0.45)' : '#ffffff',
                                backdropFilter: 'blur(16px)',
                                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
                              }}>
                                <div className="ops-tickets-table-inner">
                                  {/* Table Header Strip (8 الأعمدة الكاملة بدون عمود زر التفاصيل المنفصل) */}
                                  <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '95px minmax(220px, 2.5fr) minmax(180px, 2fr) 130px 120px 110px 140px 115px',
                                    padding: '11px 16px',
                                    background: isDark ? 'rgba(30, 41, 59, 0.75)' : '#f8fafc',
                                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    color: isDark ? '#94a3b8' : '#64748b',
                                    fontFamily: "'Cairo', sans-serif",
                                    alignItems: 'center',
                                    gap: '12px',
                                  }}>
                                    <div>الرمز</div>
                                    <div>المعاملة والمسار</div>
                                    <div>المُرسل والجهة التابع لها</div>
                                    <div>الجهة المختصة</div>
                                    <div>الأولوية</div>
                                    <div>الحالة</div>
                                    <div>المسؤول الحالي</div>
                                    <div>التوقيت والمدة</div>
                                  </div>

                                  {/* Table Rows (Exactly up to 7 rows per page) */}
                                  <AnimatePresence mode="wait">
                                    {pageTickets.map((ticket, i) => {
                                      const reqPriority = ticket.requesterPriority || ticket.priority;
                                      const bizPriority = ticket.businessPriority || ticket.priority;
                                      const lamp = getLampStyle(reqPriority);
                                      const isUnassigned = ticket.isUnassigned !== false && !ticket.assignedTo;
                                      const ticketCode = ticket.code || `REQ-${String(ticket.id).padStart(4, '0')}`;
                                      
                                      const accentColor = (bizPriority === 'CRITICAL' || bizPriority === 'URGENT')
                                        ? '#ef4444'
                                        : bizPriority === 'HIGH'
                                        ? '#ea580c'
                                        : isUnassigned
                                        ? '#0284c7'
                                        : '#4f46e5';

                                      const timeStr = new Date(ticket.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' });
                                      const timeAgoStr = formatTimeAgo(ticket.createdAt);

                                      return (
                                        <motion.div
                                          key={ticket.id}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ delay: Math.min(i * 0.015, 0.15) }}
                                          onClick={() => setInspectTicket(ticket)}
                                          title="انقر على أي مكان في الصف لعرض التفاصيل وفحص المعاملة"
                                          style={{
                                            display: 'grid',
                                            gridTemplateColumns: '95px minmax(220px, 2.5fr) minmax(180px, 2fr) 130px 120px 110px 140px 115px',
                                            padding: '12px 16px',
                                            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #f1f5f9',
                                            borderRight: `3.5px solid ${accentColor}`,
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s ease',
                                            background: inspectTicket?.id === ticket.id
                                              ? (isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.06)')
                                              : 'transparent',
                                          }}
                                          onMouseEnter={(e) => {
                                            if (inspectTicket?.id !== ticket.id) {
                                              e.currentTarget.style.backgroundColor = isDark ? 'rgba(56, 189, 248, 0.04)' : '#f8fafc';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (inspectTicket?.id !== ticket.id) {
                                              e.currentTarget.style.backgroundColor = 'transparent';
                                            }
                                          }}
                                        >
                                          {/* 1. الرمز */}
                                          <div>
                                            <TicketCodeBadge code={ticketCode} color={accentColor} compact />
                                          </div>

                                          {/* 2. المعاملة والمسار */}
                                          <div style={{ minWidth: 0 }}>
                                            <div style={{
                                              fontSize: '12.5px',
                                              fontWeight: 800,
                                              color: isDark ? '#ffffff' : '#0f172a',
                                              fontFamily: "'Tajawal', sans-serif",
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}>
                                              {ticket.subject || ticket.title}
                                            </div>
                                            <div style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              marginTop: '2px',
                                              flexWrap: 'wrap',
                                            }}>
                                              <span style={{ fontSize: '10.5px', color: '#6366f1', fontWeight: 600 }}>
                                                {ticket.flowDefinitionName || 'مسار عام'}
                                              </span>
                                              {ticket.isPendingHandover && (
                                                <span style={{
                                                  background: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7',
                                                  color: isDark ? '#fbbf24' : '#b45309',
                                                  fontSize: '9px',
                                                  fontWeight: 800,
                                                  padding: '0 4px',
                                                  borderRadius: '4px',
                                                }}>
                                                  ⏳ تحويل معلق
                                                </span>
                                              )}
                                              {(ticket.isSubTicket || ticket.parentId) && (
                                                <span style={{
                                                  background: isDark ? 'rgba(168, 85, 247, 0.2)' : '#f3e8ff',
                                                  color: isDark ? '#c084fc' : '#7e22ce',
                                                  fontSize: '9px',
                                                  fontWeight: 800,
                                                  padding: '0 4px',
                                                  borderRadius: '4px',
                                                }}>
                                                  📎 مهمة فرعية
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* 3. المُرسل والجهة التابع لها */}
                                          <div style={{ minWidth: 0 }}>
                                            <div style={{
                                              fontSize: '11.5px',
                                              fontWeight: 700,
                                              color: isDark ? '#cbd5e1' : '#1e293b',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}>
                                              {ticket.creatorName || ticket.creator?.fullName || 'غير معروف'}
                                            </div>
                                            <div style={{
                                              fontSize: '10px',
                                              color: '#64748b',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              marginTop: '1px',
                                            }}>
                                              {ticket.creator?.department?.name || ticket.departmentName || 'إدارة التشغيل'}
                                            </div>
                                          </div>

                                          {/* 4. الجهة المختصة */}
                                          <div style={{ minWidth: 0 }}>
                                            <div style={{
                                              fontSize: '11px',
                                              fontWeight: 600,
                                              color: isDark ? '#94a3b8' : '#475569',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                            }}>
                                              {ticket.departmentName || 'إدارة الخدمات'}
                                            </div>
                                          </div>

                                          {/* 5. الأولوية */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                              ...styles.priorityBadge(bizPriority),
                                              fontSize: '10px',
                                              padding: '2px 7px',
                                              borderRadius: '5px',
                                              fontFamily: "'Cairo', sans-serif",
                                            }}>
                                              {formatPriorityText(bizPriority)}
                                            </span>
                                            <span
                                              style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: lamp.color,
                                                boxShadow: `0 0 5px ${lamp.color}`,
                                                flexShrink: 0,
                                              }}
                                              title={`طالب: ${lamp.label}`}
                                            />
                                          </div>

                                          {/* 6. الحالة */}
                                          <div>
                                            <OpsStatusPill status={ticket.status} stateLabel={ticket.state?.label} isDark={isDark} />
                                          </div>

                                          {/* 7. المسؤول الحالي */}
                                          <div style={{ minWidth: 0 }}>
                                            {ticket.assignedTo ? (
                                              <div style={{
                                                fontSize: '11px',
                                                fontWeight: 700,
                                                color: isDark ? '#a5b4fc' : '#4f46e5',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                              }}>
                                                <ShieldCheck size={11} style={{ flexShrink: 0 }} />
                                                <span>{ticket.assignedTo.fullName}</span>
                                              </div>
                                            ) : (
                                              <span style={{
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                color: isDark ? '#38bdf8' : '#0284c7',
                                                background: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.08)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                              }}>
                                                <Zap size={9.5} />
                                                <span>شاغر (بالحوض)</span>
                                              </span>
                                            )}
                                          </div>

                                          {/* 8. التوقيت والمدة المنقضية */}
                                          <div style={{
                                            fontSize: '10.5px',
                                            color: isDark ? '#94a3b8' : '#64748b',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1px',
                                          }}>
                                            <span style={{ fontWeight: 700, color: isDark ? '#cbd5e1' : '#334155' }}>
                                              {timeAgoStr}
                                            </span>
                                            <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '9.5px', color: '#94a3b8' }}>
                                              {timeStr}
                                            </span>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </AnimatePresence>
                                </div>
                              </div>

                              {/* ═══ Pagination Bar for 7-Row List View (أرقام الصفحات وأزرار التمرير لليمين واليسار) ═══ */}
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 16px',
                                background: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                                borderRadius: '12px',
                                flexWrap: 'wrap',
                                gap: '10px',
                                fontFamily: "'Cairo', sans-serif",
                              }}>
                                <div style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                                  عرض صفوف <span style={{ fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>{startIdx + 1}</span> إلى{' '}
                                  <span style={{ fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>{Math.min(startIdx + listRowsPerPage, filteredTickets.length)}</span> من أصل{' '}
                                  <span style={{ fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7' }}>{filteredTickets.length}</span> تذكرة
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  {/* زر الصفحة السابقة (لليمين في RTL) */}
                                  <button
                                    type="button"
                                    onClick={() => setListCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={safePage <= 1}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '5px 12px',
                                      borderRadius: '8px',
                                      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                                      background: safePage <= 1
                                        ? 'transparent'
                                        : (isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc'),
                                      color: safePage <= 1
                                        ? (isDark ? '#475569' : '#cbd5e1')
                                        : (isDark ? '#f8fafc' : '#0f172a'),
                                      cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      transition: 'all 0.18s ease',
                                    }}
                                  >
                                    <ChevronRight size={15} />
                                    <span>السابق</span>
                                  </button>

                                  {/* ترقيم الصفحات */}
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    borderRadius: '8px',
                                    background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9',
                                    fontSize: '12px',
                                    fontWeight: 800,
                                  }}>
                                    <span style={{ color: isDark ? '#38bdf8' : '#0284c7' }}>{safePage}</span>
                                    <span style={{ color: '#94a3b8' }}>/</span>
                                    <span style={{ color: isDark ? '#cbd5e1' : '#475569' }}>{totalListPages}</span>
                                  </div>

                                  {/* زر الصفحة التالية (لليسار في RTL) */}
                                  <button
                                    type="button"
                                    onClick={() => setListCurrentPage(p => Math.min(totalListPages, p + 1))}
                                    disabled={safePage >= totalListPages}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '5px 12px',
                                      borderRadius: '8px',
                                      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                                      background: safePage >= totalListPages
                                        ? 'transparent'
                                        : (isDark ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc'),
                                      color: safePage >= totalListPages
                                        ? (isDark ? '#475569' : '#cbd5e1')
                                        : (isDark ? '#f8fafc' : '#0f172a'),
                                      cursor: safePage >= totalListPages ? 'not-allowed' : 'pointer',
                                      fontSize: '11.5px',
                                      fontWeight: 700,
                                      transition: 'all 0.18s ease',
                                    }}
                                  >
                                    <span>التالي</span>
                                    <ChevronLeft size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>



      </div>

      {/* Ticket Details Drawer / Modal */}
      <AnimatePresence>
        {inspectTicket && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            zIndex: 100000,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'stretch'
          }}>
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              style={{
                width: '100%',
                maxWidth: '650px',
                background: '#ffffff',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                overflowY: 'auto'
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 28px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#6366f1' }}>#{inspectTicket.id}</span>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>•</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                      {inspectTicket.flowDefinitionName || 'مسار عام'}
                    </span>
                    {inspectTicketDetails?.state?.name === 'RESOLVED' && (
                      <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                        ⏳ بانتظار الاعتماد
                      </span>
                    )}
                    {inspectTicketDetails?.state?.name === 'CLOSED' && (
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                        ✅ مغلقة نهائياً
                      </span>
                    )}
                  </div>
                  <h2 style={{ margin: 0, fontSize: '19px', fontWeight: 800, color: '#0f172a' }}>
                    {inspectTicket.subject || inspectTicket.title}
                  </h2>
                </div>
                <button
                  onClick={() => setInspectTicket(null)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sub-tabs: Details vs History */}
              <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', padding: '0 24px' }}>
                <button
                  onClick={() => setActiveDrawerTab('DETAILS')}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: activeDrawerTab === 'DETAILS' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
                    color: activeDrawerTab === 'DETAILS' ? '#4f46e5' : '#64748b',
                    fontWeight: activeDrawerTab === 'DETAILS' ? 800 : 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FileText size={15} /> تفاصيل ومجريات المعاملة
                </button>
                <button
                  onClick={() => setActiveDrawerTab('HISTORY')}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    background: 'transparent',
                    borderBottom: activeDrawerTab === 'HISTORY' ? '2.5px solid #4f46e5' : '2.5px solid transparent',
                    color: activeDrawerTab === 'HISTORY' ? '#4f46e5' : '#64748b',
                    fontWeight: activeDrawerTab === 'HISTORY' ? 800 : 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <History size={15} /> سجل العمليات والتتبع ({inspectTicketDetails?.logs?.length || 0})
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                {loadingTicketDetails ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <RefreshCw size={24} className="animate-spin text-indigo-600" />
                    <span>جاري تحميل أحدث البيانات والخصائص...</span>
                  </div>
                ) : activeDrawerTab === 'DETAILS' ? (
                  <>
                    {/* Strategic Claim Ticket Banner for Unassigned Ticket */}
                    {(!inspectTicket.assignedTo || inspectTicket.isUnassigned !== false) && (
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.08) 100%)',
                        border: '1.5px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        flexWrap: 'wrap',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: '#10b981',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                            flexShrink: 0,
                          }}>
                            <Zap size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: '#065f46' }}>
                              هذا الطلب شاغر حالياً في حوض العمليات
                            </div>
                            <div style={{ fontSize: '12.5px', color: '#047857', marginTop: '2px' }}>
                              يمكنك استلام وسحب هذه التذكرة لحسابك لمباشرة المعالجة والتنفيذ الفني.
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleClaimTicket(inspectTicket.id)}
                          disabled={claimingId === inspectTicket.id}
                          style={{
                            padding: '10px 22px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: claimingId === inspectTicket.id ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                            fontFamily: "'Cairo', sans-serif",
                          }}
                        >
                          {claimingId === inspectTicket.id ? (
                            <><RefreshCw size={15} className="animate-spin" /> جاري السحب...</>
                          ) : (
                            <><CheckCircle2 size={16} /> استلام وسحب الطلب لحسابي</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Handover Acceptance Banner */}
                    {inspectTicketDetails?.isPendingHandover && inspectTicketDetails?.handoverInfo?.toUserId === user?.id && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        border: '1.5px solid #f59e0b',
                        borderRadius: '16px',
                        padding: '18px 20px',
                        boxShadow: '0 8px 24px rgba(245, 158, 11, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ padding: '8px', borderRadius: '10px', background: '#fde68a', color: '#b45309' }}>
                              <CornerDownLeft size={20} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '15px', color: '#92400e' }}>
                                طلب تحويل تذكرة وارد إليك 📥
                              </div>
                              <div style={{ fontSize: '13px', color: '#78350f', marginTop: '2px' }}>
                                قام المهندس <span style={{ fontWeight: 700 }}>{inspectTicketDetails.handoverInfo.fromUserName}</span> بتحويل هذه التذكرة إليك
                              </div>
                            </div>
                          </div>
                          <span style={{
                            background: '#d97706',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '20px'
                          }}>
                            معلقة بانتظار موافقتك
                          </span>
                        </div>

                        {inspectTicketDetails.handoverInfo.note && (
                          <div style={{
                            background: '#ffffff',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid #fde68a',
                            fontSize: '13px',
                            color: '#451a03'
                          }}>
                            <span style={{ fontWeight: 700 }}>ملاحظة المحوّل: </span>
                            {inspectTicketDetails.handoverInfo.note}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleAcceptHandover(inspectTicket.id)}
                            disabled={isExecutingAction}
                            style={{
                              flex: 1,
                              padding: '11px 18px',
                              borderRadius: '12px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              fontWeight: 800,
                              fontSize: '13.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            <CheckCircle2 size={16} /> قبول استلام التذكرة وبدء المعالجة
                          </button>
                          <button
                            onClick={handleOpenRejectHandoverModal}
                            disabled={isExecutingAction}
                            style={{
                              padding: '11px 18px',
                              borderRadius: '12px',
                              border: '1px solid #fca5a5',
                              background: '#ffffff',
                              color: '#b91c1c',
                              fontWeight: 700,
                              fontSize: '13.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <RotateCcw size={15} /> رفض الاستلام وإعادة التذكرة
                          </button>
                        </div>
                      </div>
                    )}

                    {inspectTicketDetails?.isPendingHandover && inspectTicketDetails?.handoverInfo?.toUserId !== user?.id && (
                      <div style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        color: '#92400e'
                      }}>
                        <Clock size={16} />
                        <span>
                          تم إرسال طلب تحويل التذكرة إلى المهندس <span style={{ fontWeight: 700 }}>{inspectTicketDetails.handoverInfo?.toUserName}</span> وهو معلق حالياً بانتظار قبوله.
                        </span>
                      </div>
                    )}

                    {/* Status Alert Banners */}
                    {inspectTicketDetails?.state?.name === 'RESOLVED' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        border: '1px solid #fde68a',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <div style={{ padding: '6px', borderRadius: '8px', background: '#fef08a', color: '#854d0e' }}>
                          <AlertTriangle size={18} />
                        </div>
                        <div style={{ flex: 1, fontSize: '13px', color: '#92400e', lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 800, marginBottom: '2px' }}>التذكرة منجزة وفي انتظار اعتماد الإغلاق النهائي</div>
                          قام المهندس المعني بإنهاء المعالجة ورفع طلب الاعتماد. يرجى من مدير المسار أو المهندس المخول مراجعة التقرير واعتماد الإغلاق.
                        </div>
                      </div>
                    )}

                    {inspectTicketDetails?.state?.name === 'CLOSED' && (
                      <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid #bbf7d0',
                        borderRadius: '16px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <CheckCircle size={20} color="#15803d" />
                        <div style={{ fontSize: '13px', color: '#166534', fontWeight: 700 }}>
                          تم إغلاق هذه التذكرة نهائياً واستكمال جميع متطلبات الإنجاز.
                        </div>
                      </div>
                    )}

                    {inspectTicketDetails?.state?.name !== 'CLOSED' && inspectTicketDetails?.state?.name !== 'RESOLVED' && (
                      <div style={{
                        background: inspectPermissions?.canClose ? '#f0fdf4' : '#f8fafc',
                        border: inspectPermissions?.canClose ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12.5px',
                        color: inspectPermissions?.canClose ? '#166534' : '#475569'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Shield size={16} color={inspectPermissions?.canClose ? '#16a34a' : '#6366f1'} />
                          <span>
                            {inspectPermissions?.canClose
                              ? 'أنت مخول بالإغلاق المباشر لهذا المسار (مدير المسار / معتمد مخول)'
                              : 'إغلاق هذا الطلب يتطلب رفع طلب اعتماد للمراجعة والاعتماد من قبل مدير المسار أو المعتمدين'}
                          </span>
                        </div>
                        <span style={{
                          background: inspectPermissions?.canClose ? '#dcfce7' : '#e0e7ff',
                          color: inspectPermissions?.canClose ? '#15803d' : '#4338ca',
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {inspectPermissions?.canClose ? 'إغلاق مباشر' : 'طلب اعتماد'}
                        </span>
                      </div>
                    )}

                    {/* Meta grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '14px',
                      background: '#f8fafc',
                      padding: '16px',
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>المُرسل (صاحب الطلب)</span>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="#6366f1" />
                          {inspectTicketDetails?.creator?.fullName || inspectTicket.creatorName || 'غير معروف'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>الجهة المختصة</span>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={14} color="#0284c7" />
                          {inspectTicketDetails?.departmentObj?.name || inspectTicket.departmentName || 'إدارة تقنية المعلومات'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>المهندس المكلف (المسند إليه)</span>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="#059669" />
                          {inspectTicketDetails?.assignments?.find((a: any) => a.isCurrentActive)?.assignedTech?.fullName || inspectTicket.assignedTo?.fullName || 'غير مسند (حوض عام)'}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>تاريخ وتوقيت الإنشاء</span>
                        <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#64748b" />
                          {new Date(inspectTicket.createdAt).toLocaleString('ar-LY')}
                        </div>
                      </div>
                    </div>

                    {/* Resolution Notes Box (If present) */}
                    {(inspectTicketDetails?.resolutionNotes || inspectTicket.resolutionNotes) && (
                      <div style={{
                        background: '#ffffff',
                        border: '1.5px solid #10b981',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#059669', fontWeight: 800, fontSize: '14px' }}>
                          <FileCheck size={18} />
                          <span>تقرير الإنجاز والمعالجة الفنية:</span>
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#1e293b',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          background: '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: '10px'
                        }}>
                          {inspectTicketDetails?.resolutionNotes || inspectTicket.resolutionNotes}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
                        تفاصيل ومحتوى الطلب:
                      </h4>
                      <div style={{
                        padding: '16px',
                        borderRadius: '14px',
                        background: '#ffffff',
                        border: '1px solid #e2e8f0',
                        lineHeight: 1.7,
                        color: '#334155',
                        fontSize: '13px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {inspectTicketDetails?.description || inspectTicket.description || 'لا يوجد وصف مدخل.'}
                      </div>
                    </div>

                    {/* ── Form Fields & Detailed Route Data Bento Card ── */}
                    {(() => {
                      const rawMeta = inspectTicketDetails?.routingMetadata || inspectTicket?.routingMetadata;
                      let resolvedMeta: any = {};
                      if (rawMeta) {
                        resolvedMeta = typeof rawMeta === 'object' ? rawMeta : (() => {
                          try { return JSON.parse(rawMeta); } catch { return {}; }
                        })();
                      }
                      const fieldsData = resolvedMeta.formData || resolvedMeta.dynamicFields || resolvedMeta.fields || {};
                      const fieldEntries = Object.entries(fieldsData).filter(([k, v]) => {
                        if (!v) return false;
                        if (['submittedAt', 'targetDepartmentName', 'targetDivisionName', 'targetTeamName', 'attachment'].includes(k)) return false;
                        return true;
                      });

                      const getFieldLabel = (key: string) => {
                        if (key === 'taxonomyMain') return 'التصنيف والمستدلة الرئيسية';
                        if (key === 'taxonomySub') return 'المشكلة / الخيار الفرعي';
                        if (key === 'building' || key === 'buildingId') return 'المبنى والموقع';
                        if (key === 'department') return 'الإدارة المعنية بالطلب';
                        if (key === 'division') return 'القسم المؤسسي';
                        if (key === 'team') return 'الفريق / الوحدة';
                        if (key === 'scheduleEngine' || key === 'dateRange') return 'فترة السريان / الجدولة';
                        if (key === 'delegateUser') return 'الموظف البديل المكلف';
                        if (key.startsWith('dyn_')) return 'مستدلة ديناميكية مخصصة';
                        if (key.startsWith('custom_') || key.startsWith('opt_input_')) return 'بيان إضافي مطلوب';
                        return key;
                      };

                      if (fieldEntries.length === 0) return null;

                      return (
                        <div style={{
                          background: isDark ? '#111827' : '#ffffff',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                background: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                                color: isDark ? '#38bdf8' : '#2563eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <FileText size={16} />
                              </div>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                                بيانات نموذج المسار المعبأة:
                              </h4>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                              {fieldEntries.length} حقول مدخلة
                            </span>
                          </div>

                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                            gap: '10px'
                          }}>
                            {fieldEntries.map(([key, val]: any) => {
                              const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                              return (
                                <div
                                  key={key}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #f1f5f9',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px'
                                  }}
                                >
                                  <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                    {getFieldLabel(key)}
                                  </span>
                                  <span style={{ fontSize: '12.5px', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 800, wordBreak: 'break-word' }}>
                                    {displayVal}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── Official Attachments & Documents Bento Card ── */}
                    {(() => {
                      const rawMeta = inspectTicketDetails?.routingMetadata || inspectTicket?.routingMetadata;
                      let resolvedMeta: any = {};
                      if (rawMeta) {
                        resolvedMeta = typeof rawMeta === 'object' ? rawMeta : (() => {
                          try { return JSON.parse(rawMeta); } catch { return {}; }
                        })();
                      }
                      const dbFiles: any[] = inspectTicketDetails?.files || [];
                      const metaAttachments: any[] = resolvedMeta.attachments || (resolvedMeta.formData?.attachment ? [resolvedMeta.formData.attachment] : []);

                      // Combine files cleanly
                      const combinedFiles: any[] = [...dbFiles];
                      metaAttachments.forEach(ma => {
                        const parsed = typeof ma === 'string' && ma.startsWith('{') ? JSON.parse(ma) : ma;
                        const name = typeof parsed === 'string' ? parsed : (parsed.fileName || parsed.name);
                        if (!name) return;
                        const alreadyIn = combinedFiles.some(f => (f.fileName || f.name) === name);
                        if (!alreadyIn) {
                          combinedFiles.push({
                            id: parsed.id || `meta_${Date.now()}`,
                            fileName: name,
                            sizeBytes: parsed.sizeBytes || parsed.size,
                            sizeMB: parsed.sizeMB,
                            mimeType: parsed.mimeType || parsed.type,
                            fileUrl: parsed.url || parsed.fileUrl || parsed.base64,
                            uploadedAt: parsed.uploadedAt || inspectTicket.createdAt,
                            uploadedBy: inspectTicketDetails?.creator || { fullName: inspectTicket.creatorName }
                          });
                        }
                      });

                      return (
                        <div style={{
                          background: isDark ? '#111827' : '#ffffff',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '8px',
                                background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <Paperclip size={16} />
                              </div>
                              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                                المرفقات والوثائق الرسمية ({combinedFiles.length}):
                              </h4>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                              {combinedFiles.length > 0 ? 'مستندات ثبوتية معتمدة' : 'لا توجد مرفقات'}
                            </span>
                          </div>

                          {combinedFiles.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {combinedFiles.map((file, idx) => {
                                const fName = file.fileName || file.name || `مستند_${idx + 1}`;
                                const fSize = file.sizeMB
                                  ? `${file.sizeMB} MB`
                                  : (file.sizeBytes ? `${(Number(file.sizeBytes) / (1024 * 1024)).toFixed(2)} MB` : '');
                                const fileTarget = file.fileUrl || file.storageKey || (file.id ? `/api/v1/storage/${file.fileName}` : '#');

                                return (
                                  <div
                                    key={file.id || idx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '10px 14px',
                                      borderRadius: '12px',
                                      background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                                      gap: '12px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                      <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                                        color: isDark ? '#38bdf8' : '#2563eb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        <FileText size={18} />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <span style={{
                                          fontSize: '12.5px', fontWeight: 700,
                                          color: isDark ? '#ffffff' : '#0f172a',
                                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                          maxWidth: '280px'
                                        }}>
                                          {fName}
                                        </span>
                                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                          {fSize && `${fSize} • `}مرفوع بواسطة: {file.uploadedBy?.fullName || inspectTicket.creatorName || 'صاحب الطلب'}
                                        </span>
                                      </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                      {fileTarget && fileTarget !== '#' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (file.fileUrl && file.fileUrl.startsWith('data:')) {
                                              const win = window.open();
                                              if (win) {
                                                win.document.write(`<iframe src="${file.fileUrl}" frameborder="0" style="border:0; top:0; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>`);
                                              }
                                            } else {
                                              window.open(fileTarget, '_blank');
                                            }
                                          }}
                                          style={{
                                            padding: '5px 10px', borderRadius: '7px',
                                            border: isDark ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid #bfdbfe',
                                            background: isDark ? 'rgba(56, 189, 248, 0.12)' : '#eff6ff',
                                            color: isDark ? '#38bdf8' : '#2563eb',
                                            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '5px'
                                          }}
                                        >
                                          <Eye size={13} />
                                          <span>معاينة</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{
                              padding: '14px', borderRadius: '10px',
                              background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                              border: isDark ? '1px dashed rgba(255, 255, 255, 0.06)' : '1px dashed #e2e8f0',
                              textAlign: 'center', color: '#94a3b8', fontSize: '12px'
                            }}>
                              لم يُرفق صاحب المعاملة أي ملفات إضافية مع هذا الطلب.
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Linked Parent Ticket Info if this is a sub-ticket */}
                    {(inspectTicketDetails?.parentTicket || inspectTicket.parentId) && (
                      <div style={{
                        background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                        border: '1.5px solid #c4b5fd',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '8px', borderRadius: '10px', background: '#ddd6fe', color: '#6d28d9' }}>
                            <GitPullRequest size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: '11.5px', color: '#6d28d9', fontWeight: 700 }}>مهمة فرعية منبثقة من تذكرة رئيسية</div>
                            <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#4c1d95' }}>
                              #{inspectTicketDetails?.parentTicket?.id || inspectTicket.parentId}: {inspectTicketDetails?.parentTicket?.subject || 'التذكرة الأصل'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Linked Sub-Tickets / Tasks Bento Card */}
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '18px',
                      padding: '18px 20px',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.03)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ padding: '8px', borderRadius: '10px', background: '#f3e8ff', color: '#7e22ce' }}>
                            <GitPullRequest size={18} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                              المهام والتذاكر الداخلية الفرعية المرتبطة
                            </h4>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              توزيع أجزاء من العمل على أقسام وإدارات تشغيلية أخرى
                            </div>
                          </div>
                        </div>

                        {inspectPermissions?.canCreateSubTickets !== false && inspectTicketDetails?.state?.name !== 'CLOSED' && (
                          <button
                            onClick={openSubTicketModal}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '10px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '12.5px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 8px rgba(126, 34, 206, 0.25)'
                            }}
                          >
                            <PlusCircle size={14} /> فتح تذكرة داخلية جديدة
                          </button>
                        )}
                      </div>

                      {/* Sub-tickets Progress Bar */}
                      {Array.isArray(inspectTicketDetails?.subTickets) && inspectTicketDetails.subTickets.length > 0 ? (
                        <>
                          <div style={{
                            background: '#f8fafc',
                            borderRadius: '12px',
                            padding: '10px 14px',
                            marginBottom: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12px'
                          }}>
                            <span style={{ fontWeight: 700, color: '#475569' }}>
                              نسبة إنجاز المهام الداخلية: {inspectTicketDetails.subTickets.filter((s: any) => s.state?.name === 'CLOSED' || s.status === 'CLOSED').length} من {inspectTicketDetails.subTickets.length} مكتملة
                            </span>
                            <div style={{ width: '120px', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.round((inspectTicketDetails.subTickets.filter((s: any) => s.state?.name === 'CLOSED' || s.status === 'CLOSED').length / inspectTicketDetails.subTickets.length) * 100)}%`,
                                height: '100%',
                                background: '#10b981',
                                borderRadius: '4px',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {inspectTicketDetails.subTickets.map((st: any) => (
                              <div key={st.id} style={{
                                padding: '12px 14px',
                                borderRadius: '12px',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px'
                              }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#7e22ce' }}>#{st.id}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{st.subject || st.title}</span>
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', gap: '10px' }}>
                                    <span>الجهة: {st.departmentObj?.name || st.departmentName || 'إدارة تشغيلية'}{st.targetDivisionName ? ` • ${st.targetDivisionName}` : ''}</span>
                                    {st.assignments?.[0]?.assignedTech && (
                                      <span>المسند إليه: {st.assignments[0].assignedTech.fullName}</span>
                                    )}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: (st.state?.name === 'CLOSED' || st.status === 'CLOSED') ? '#dcfce7' : '#fef3c7',
                                    color: (st.state?.name === 'CLOSED' || st.status === 'CLOSED') ? '#15803d' : '#b45309'
                                  }}>
                                    {(st.state?.name === 'CLOSED' || st.status === 'CLOSED') ? 'مكتملة ✅' : (st.state?.label || 'قيد المعالجة ⏳')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '20px 10px',
                          color: '#94a3b8',
                          fontSize: '12.5px',
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px dashed #cbd5e1'
                        }}>
                          لم يتم فتح أي تذاكر أو مهام داخلية فرعية لهذه المعاملة بعد.
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* HISTORY TAB */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                      سجل التتبع والعمليات المنفذة:
                    </div>
                    {(!inspectTicketDetails?.logs || inspectTicketDetails.logs.length === 0) ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '13px' }}>
                        لا توجد سجلات تتبع مسجلة بعد.
                      </div>
                    ) : (
                      inspectTicketDetails.logs.map((log: any, idx: number) => (
                        <div key={log.id || idx} style={{
                          padding: '12px 16px',
                          background: '#f8fafc',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, color: '#334155' }}>{log.action}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {new Date(log.createdAt || Date.now()).toLocaleString('ar-LY')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions - ITIL Operational Action Bar */}
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Action 1: Claim unassigned ticket */}
                  {(!inspectTicket.assignedTo || inspectTicket.isUnassigned !== false) && (
                    <button
                      onClick={() => handleClaimTicket(inspectTicket.id)}
                      disabled={claimingId === inspectTicket.id}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: claimingId === inspectTicket.id ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                      }}
                    >
                      {claimingId === inspectTicket.id ? (
                        <><RefreshCw size={14} className="animate-spin" /> جاري السحب...</>
                      ) : (
                        <><CheckCircle2 size={15} /> استلام وسحب الطلب لحسابي</>
                      )}
                    </button>
                  )}

                  {/* Action 2: If Active - Direct Close OR Request Closure */}
                  {loadingTicketDetails ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', padding: '6px 12px' }}>
                      <RefreshCw size={14} className="animate-spin" color="#4f46e5" />
                      <span>جاري التحقق من صلاحيات المسار...</span>
                    </div>
                  ) : (
                    <>
                      {/* تنبيه وجود مهام فرعية مفتوحة تحظر الإغلاق */}
                      {(inspectTicketDetails?.subTickets || []).some((st: any) => !['CLOSED', 'RESOLVED'].includes(st.state?.name)) && (
                        <div style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#f59e0b',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <AlertCircle size={16} />
                          <span>تنبيه حوكمة: توجد مهام فرعية ما زالت قيد المعالجة لدى الأطراف المستلمة. لا يمكن إغلاق هذه التذكرة حتى تُقفل جميع المهام الفرعية من قبلهم أولاً.</span>
                        </div>
                      )}

                      {(inspectTicketDetails?.state?.name !== 'CLOSED' && inspectTicketDetails?.state?.name !== 'RESOLVED') && (
                        <>
                          {inspectPermissions?.canClose ? (
                            /* Direct Close */
                            <button
                              onClick={() => {
                                const openSubs = (inspectTicketDetails?.subTickets || []).filter((st: any) => !['CLOSED', 'RESOLVED'].includes(st.state?.name));
                                if (openSubs.length > 0) {
                                  alert(`⚠️ لا يمكن إغلاق التذكرة: يوجد (${openSubs.length}) مهام فرعية ما زالت مفتوحة لدى الأطراف المستلمة.\nيجب إغلاق كافة المهام الفرعية من قبل الأطراف المستلمة أولاً.`);
                                  return;
                                }
                                setActionModal({
                                  type: 'CLOSE',
                                  title: 'إغلاق وإنهاء التذكرة مباشرة',
                                  description: 'أنت مخول بالإغلاق المباشر لهذا المسار (كمدير للمسار أو معتمد مفوض). يرجى إدخال مذكرة الحل وتقرير الأعمال المنفذة لإنهاء التذكرة نهائياً.',
                                  confirmLabel: 'تأكيد إغلاق التذكرة نهائياً',
                                  confirmColor: '#10b981',
                                  isNoteRequired: true
                                });
                                setActionNote('');
                              }}
                              style={{
                                padding: '10px 18px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                              }}
                            >
                              <CheckCircle size={15} /> إغلاق وإنهاء التذكرة
                            </button>
                          ) : (
                            /* Request Closure Approval */
                            <button
                              onClick={() => {
                                const openSubs = (inspectTicketDetails?.subTickets || []).filter((st: any) => !['CLOSED', 'RESOLVED'].includes(st.state?.name));
                                if (openSubs.length > 0) {
                                  alert(`⚠️ لا يمكن طلب اعتماد إغلاق التذكرة: يوجد (${openSubs.length}) مهام فرعية ما زالت مفتوحة لدى الأطراف المستلمة.\nيجب إغلاق كافة المهام الفرعية من قبل الأطراف المستلمة أولاً.`);
                                  return;
                                }
                                setActionModal({
                                  type: 'REQUEST_CLOSURE',
                                  title: 'طلب اعتماد إغلاق التذكرة',
                                  description: 'أنت لا تملك صلاحية الإغلاق المباشر. يرجى تدوين تقرير المعالجة الفنية ليتم إرساله إلى مدير المسار والمعتمدين لمراجعته واعتماده.',
                                  confirmLabel: 'إرسال طلب اعتماد الإغلاق',
                                  confirmColor: '#4f46e5',
                                  isNoteRequired: true
                                });
                                setActionNote('');
                              }}
                              style={{
                                padding: '10px 18px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                                color: '#ffffff',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
                              }}
                            >
                              <Send size={15} /> طلب اعتماد الإغلاق / إرسال للمراجعة
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Action 3: If Resolved (Pending Approval) */}
                  {inspectTicketDetails?.state?.name === 'RESOLVED' && (
                    <>
                      {(inspectPermissions?.isClosureApprover || inspectPermissions?.canClose) ? (
                        <>
                          <button
                            onClick={() => {
                              const openSubs = (inspectTicketDetails?.subTickets || []).filter((st: any) => !['CLOSED', 'RESOLVED'].includes(st.state?.name));
                              if (openSubs.length > 0) {
                                alert(`⚠️ لا يمكن اعتماد الإغلاق النهائي: يوجد (${openSubs.length}) مهام فرعية ما زالت مفتوحة لدى الأطراف المستلمة.\nيجب إغلاق كافة المهام الفرعية من قبل الأطراف المستلمة أولاً.`);
                                return;
                              }
                              setActionModal({
                                type: 'APPROVE_CLOSURE',
                                title: 'اعتماد الإغلاق النهائي للتذكرة',
                                description: 'بصفتك معتمداً مخولاً، سيؤدي هذا الإجراء إلى اعتماد تقرير الإنجاز وإغلاق التذكرة نهائياً في النظام.',
                                confirmLabel: 'اعتماد الإغلاق النهائي',
                                confirmColor: '#10b981',
                                isNoteRequired: false
                              });
                              setActionNote('');
                            }}
                            style={{
                              padding: '10px 18px',
                              borderRadius: '12px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                            }}
                          >
                            <ShieldCheck size={16} /> اعتماد الإغلاق النهائي
                          </button>

                          <button
                            onClick={() => {
                              setActionModal({
                                type: 'REJECT_CLOSURE',
                                title: 'رفض اعتماد الإغلاق وإعادة المعالجة',
                                description: 'يرجى كتابة أسباب الرفض والملاحظات الإضافية المطلوبة لتتم إعادة التذكرة إلى المهندس لاستكمالها.',
                                confirmLabel: 'إعادة التذكرة للمعالجة الفنية',
                                confirmColor: '#ef4444',
                                isNoteRequired: true
                              });
                              setActionNote('');
                            }}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '12px',
                              border: '1px solid #fca5a5',
                              background: '#fff1f2',
                              color: '#b91c1c',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <RotateCcw size={15} /> رفض وإعادة للمعالجة
                          </button>
                        </>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', background: '#fef3c7', padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                          <Clock size={14} /> بانتظار اعتماد مدير المسار أو المهندس المخول
                        </div>
                      )}
                    </>
                  )}

                  {/* Action 4: Transfer */}
                  {inspectPermissions?.canTransfer && inspectTicketDetails?.state?.name !== 'CLOSED' && (
                    <button
                      onClick={handleOpenTransferModal}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid #f59e0b',
                        background: '#fffbeb',
                        color: '#b45309',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <CornerDownLeft size={14} /> تحويل التذكرة
                    </button>
                  )}

                  {/* Action 4.5: Open Sub-Ticket */}
                  {inspectPermissions?.canCreateSubTickets !== false && inspectTicketDetails?.state?.name !== 'CLOSED' && (
                    <button
                      onClick={openSubTicketModal}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid #e9d5ff',
                        background: '#faf5ff',
                        color: '#7e22ce',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <GitPullRequest size={14} /> فتح مهمة فرعية
                    </button>
                  )}

                  {/* Action 5: Add Note */}
                  {inspectPermissions?.canAddInternalComment && (
                    <button
                      onClick={() => {
                        setActionModal({
                          type: 'ADD_NOTE',
                          title: 'إضافة ملاحظة داخلية فنية',
                          description: 'هذه الملاحظة تظهر للكادر الفني والإداري فقط ولا يراها صاحب الطلب.',
                          confirmLabel: 'إضافة الملاحظة',
                          confirmColor: '#6366f1',
                          isNoteRequired: true
                        });
                        setActionNote('');
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        fontWeight: 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <MessageSquare size={14} /> ملاحظة داخلية
                    </button>
                  )}

                  {/* Action 6: Reopen if closed */}
                  {inspectTicketDetails?.state?.name === 'CLOSED' && inspectPermissions?.canReopen && (
                    <button
                      onClick={() => {
                        setActionModal({
                          type: 'REOPEN',
                          title: 'إعادة فتح التذكرة',
                          description: 'سيؤدي هذا الإجراء إلى إعادة تنشيط التذكرة وإعادتها لحالة (مفتوح). يرجى كتابة السبب.',
                          confirmLabel: 'تأكيد إعادة الفتح',
                          confirmColor: '#0284c7',
                          isNoteRequired: false
                        });
                        setActionNote('');
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '12px',
                        border: '1px solid #93c5fd',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RotateCcw size={15} /> إعادة فتح التذكرة
                    </button>
                  )}
                </div>

                {/* Dismiss Drawer */}
                <button
                  onClick={() => setInspectTicket(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#64748b',
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  إغلاق النافذة
                </button>
              </div>

              {/* Action Confirmation Modal */}
              <AnimatePresence>
                {actionModal && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 100010,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                  }}>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '480px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        direction: 'rtl'
                      }}
                    >
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                        {actionModal.title}
                      </h3>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b', lineHeight: 1.6 }}>
                        {actionModal.description}
                      </p>

                      {actionModal.type === 'INTERNAL_TRANSFER' && (
                        <div style={{ marginBottom: '16px' }}>
                          {/* Transfer Target Sub-tabs */}
                          <div style={{
                            display: 'flex',
                            gap: '8px',
                            background: '#f1f5f9',
                            padding: '4px',
                            borderRadius: '12px',
                            marginBottom: '16px'
                          }}>
                            <button
                              type="button"
                              onClick={() => setTransferTargetTab('COLLEAGUE')}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '10px',
                                border: 'none',
                                background: transferTargetTab === 'COLLEAGUE' ? '#ffffff' : 'transparent',
                                color: transferTargetTab === 'COLLEAGUE' ? '#0f172a' : '#64748b',
                                fontWeight: transferTargetTab === 'COLLEAGUE' ? 800 : 600,
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                boxShadow: transferTargetTab === 'COLLEAGUE' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.2s'
                              }}
                            >
                              👥 تحويل لزميل في نفس المسار
                            </button>
                            <button
                              type="button"
                              onClick={() => setTransferTargetTab('DEPARTMENT')}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '10px',
                                border: 'none',
                                background: transferTargetTab === 'DEPARTMENT' ? '#ffffff' : 'transparent',
                                color: transferTargetTab === 'DEPARTMENT' ? '#0f172a' : '#64748b',
                                fontWeight: transferTargetTab === 'DEPARTMENT' ? 800 : 600,
                                fontSize: '12.5px',
                                cursor: 'pointer',
                                boxShadow: transferTargetTab === 'DEPARTMENT' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.2s'
                              }}
                            >
                              🏢 تحويل لإدارة أخرى
                            </button>
                          </div>

                          {transferTargetTab === 'COLLEAGUE' ? (
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                الزميل المستهدف (ضمن الفريق أو القسم أو الإدارة المخولة بالمسار):
                              </label>
                              {loadingFlowMembers ? (
                                <div style={{ padding: '12px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                  <RefreshCw size={14} className="animate-spin inline mr-1" /> جاري تحميل قائمة الزملاء...
                                </div>
                              ) : (
                                <select
                                  value={selectedColleagueId || ''}
                                  onChange={e => setSelectedColleagueId(Number(e.target.value))}
                                  style={{
                                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none',
                                    background: '#ffffff'
                                  }}
                                >
                                  {flowMembers.length === 0 ? (
                                    <option value="">لا يوجد أعضاء آخرين مسجلين في هذا المسار</option>
                                  ) : (
                                    flowMembers.map((m: any) => (
                                      <option key={m.id} value={m.id}>
                                        {m.fullName || m.username} ({m.deptName || 'عضو بالمسار'})
                                      </option>
                                    ))
                                  )}
                                </select>
                              )}

                              {/* Transfer Mode selector */}
                              <div style={{ marginTop: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                                  نمط التحويل:
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  {/* Direct Transfer */}
                                  <button
                                    type="button"
                                    disabled={!inspectPermissions?.canTransferDirect}
                                    onClick={() => setTransferMode('DIRECT')}
                                    style={{
                                      padding: '12px',
                                      borderRadius: '12px',
                                      border: transferMode === 'DIRECT' ? '2px solid #10b981' : '1px solid #e2e8f0',
                                      background: transferMode === 'DIRECT' ? '#f0fdf4' : (!inspectPermissions?.canTransferDirect ? '#f8fafc' : '#ffffff'),
                                      cursor: !inspectPermissions?.canTransferDirect ? 'not-allowed' : 'pointer',
                                      textAlign: 'right',
                                      opacity: !inspectPermissions?.canTransferDirect ? 0.6 : 1,
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px', color: '#166534', marginBottom: '4px' }}>
                                      <Zap size={14} /> تحويل مباشر (بدون إذن)
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                                      {inspectPermissions?.canTransferDirect
                                        ? 'يتم إسناد التذكرة فورياً للزميل'
                                        : 'غير مخول بالتحويل المباشر'}
                                    </div>
                                  </button>

                                  {/* Pending Acceptance */}
                                  <button
                                    type="button"
                                    onClick={() => setTransferMode('REQUIRE_ACCEPTANCE')}
                                    style={{
                                      padding: '12px',
                                      borderRadius: '12px',
                                      border: transferMode === 'REQUIRE_ACCEPTANCE' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                                      background: transferMode === 'REQUIRE_ACCEPTANCE' ? '#fffbeb' : '#ffffff',
                                      cursor: 'pointer',
                                      textAlign: 'right',
                                      transition: 'all 0.2s'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '12.5px', color: '#92400e', marginBottom: '4px' }}>
                                      <Clock size={14} /> بانتظار قبول الطرف الآخر
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>
                                      تبقى معلقة حتى يوافق الزميل
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                الإدارة المستهدفة:
                              </label>
                              <select
                                value={actionTargetDeptId || ''}
                                onChange={e => setActionTargetDeptId(Number(e.target.value))}
                                style={{
                                  width: '100%', padding: '10px 14px', borderRadius: '12px',
                                  border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none'
                                }}
                              >
                                {departments.map(d => (
                                  <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}

                      <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                          {actionModal.type === 'CLOSE' || actionModal.type === 'REQUEST_CLOSURE'
                            ? 'تقرير الإنجاز والمعالجة الفنية (مطلوب):'
                            : actionModal.type === 'REJECT_CLOSURE'
                            ? 'سبب الرفض والملاحظات الإضافية (مطلوب):'
                            : 'الملاحظات:'}
                        </label>
                        <textarea
                          rows={4}
                          value={actionNote}
                          onChange={e => setActionNote(e.target.value)}
                          placeholder={
                            actionModal.type === 'CLOSE' || actionModal.type === 'REQUEST_CLOSURE'
                              ? 'اكتب بالتفصيل ما تم إنجازه لحل هذه المعاملة...'
                              : 'اكتب ملاحظاتك هنا...'
                          }
                          style={{
                            width: '100%', padding: '12px 14px', borderRadius: '12px',
                            border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none',
                            fontFamily: 'inherit', resize: 'vertical'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setActionModal(null)}
                          disabled={isExecutingAction}
                          style={{
                            padding: '10px 16px', borderRadius: '10px',
                            border: '1px solid #cbd5e1', background: '#f8fafc',
                            color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                          }}
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={handleExecuteTicketAction}
                          disabled={isExecutingAction}
                          style={{
                            padding: '10px 20px', borderRadius: '10px',
                            border: 'none', background: actionModal.confirmColor,
                            color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: `0 4px 12px ${actionModal.confirmColor}40`
                          }}
                        >
                          {isExecutingAction ? (
                            <><RefreshCw size={14} className="animate-spin" /> جاري التنفيذ...</>
                          ) : (
                            actionModal.confirmLabel
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* Sub-Ticket Creation Modal */}
              <AnimatePresence>
                {showSubTicketModal && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 100010,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                  }}>
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      style={{
                        background: '#ffffff',
                        borderRadius: '20px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '520px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        direction: 'rtl'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                        <div style={{ padding: '8px', borderRadius: '10px', background: '#f3e8ff', color: '#7e22ce' }}>
                          <GitPullRequest size={20} />
                        </div>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                            فتح تذكرة ومهمة داخلية فرعية
                          </h3>
                          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
                            إسناد جزء من المعاملة لقسم أو إدارة أخرى تحت التذكرة #{inspectTicket?.id}
                          </p>
                        </div>
                      </div>

                      {/* Scope Badge */}
                      {(() => {
                        const isRestricted = inspectPermissions?.subTicketScope === 'SAME_DEPARTMENT' || inspectPermissions?.subTicketScope === 'SAME_DIVISION';
                        const userDeptName = inspectPermissions?.userDepartmentName || departments.find(d => Number(d.id) === Number(inspectPermissions?.userDepartmentId || (user as any)?.departmentId))?.name || 'إدارتك التشغيلية';

                        return (
                          <div style={{
                            background: isRestricted ? '#fffbeb' : '#f0fdf4',
                            border: `1px solid ${isRestricted ? '#fde68a' : '#bbf7d0'}`,
                            padding: '10px 14px',
                            borderRadius: '12px',
                            marginBottom: '16px',
                            fontSize: '12px',
                            color: isRestricted ? '#92400e' : '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Shield size={16} color={isRestricted ? '#d97706' : '#16a34a'} />
                            <div>
                              <div style={{ fontWeight: 800 }}>
                                {isRestricted 
                                  ? `🔒 مقيد ضمن: ${userDeptName}`
                                  : '🌐 توجيه عابر للإدارات متاح'}
                              </div>
                              <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                                {isRestricted
                                  ? 'وفق خصائص حوكمة هذا المسار، يمكنك فقط إسناد مهام فرعية للأقسام الواقعة داخل إدارتك التشغيلية.'
                                  : 'مخول رسمياً بتوجيه مهام فرعية لأي إدارة تشغيلية وأقسامها في المؤسسة.'}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Fields */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            عنوان المهمة الفرعية:
                          </label>
                          <input
                            type="text"
                            value={subTicketTitle}
                            onChange={e => setSubTicketTitle(e.target.value)}
                            placeholder="مثال: فحص قاعدة البيانات، تهيئة حساب جديد، إعداد الصلاحيات..."
                            style={{
                              width: '100%', padding: '10px 14px', borderRadius: '12px',
                              border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none'
                            }}
                          />
                        </div>

                        {(() => {
                          const isRestricted = inspectPermissions?.subTicketScope === 'SAME_DEPARTMENT' || inspectPermissions?.subTicketScope === 'SAME_DIVISION';
                          const userDeptId = inspectPermissions?.userDepartmentId || (user as any)?.departmentId || inspectTicketDetails?.departmentId;
                          const availableDepts = isRestricted && userDeptId
                            ? departments.filter(d => Number(d.id) === Number(userDeptId))
                            : departments;
                          const currentDept = departments.find(d => Number(d.id) === Number(subTicketDeptId));
                          const divisions = currentDept?.divisions || [];

                          return (
                            <>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    الإدارة التشغيلية المستهدفة:
                                  </label>
                                  <select
                                    value={subTicketDeptId || ''}
                                    onChange={e => {
                                      setSubTicketDeptId(Number(e.target.value));
                                      setSubTicketDivisionId('');
                                    }}
                                    style={{
                                      width: '100%', padding: '10px 14px', borderRadius: '12px',
                                      border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none'
                                    }}
                                  >
                                    {availableDepts.length === 0 ? (
                                      <option value="">لا توجد إدارات متاحة</option>
                                    ) : (
                                      availableDepts.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                      ))
                                    )}
                                  </select>
                                </div>

                                <div>
                                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                    القسم التشغيلي / التخصص:
                                  </label>
                                  <select
                                    value={subTicketDivisionId}
                                    onChange={e => setSubTicketDivisionId(e.target.value)}
                                    disabled={divisions.length === 0}
                                    style={{
                                      width: '100%', padding: '10px 14px', borderRadius: '12px',
                                      border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none',
                                      background: divisions.length === 0 ? '#f8fafc' : '#ffffff',
                                      color: divisions.length === 0 ? '#94a3b8' : '#1e293b'
                                    }}
                                  >
                                    <option value="">
                                      {divisions.length > 0 ? '-- توجيه عام للإدارة / بدون تخصيص قسم --' : '-- لا توجد أقسام فرعية مسجلة --'}
                                    </option>
                                    {divisions.map((div: any) => (
                                      <option key={div.id} value={div.id}>{div.name}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                                  الأولوية:
                                </label>
                                <select
                                  value={subTicketPriority}
                                  onChange={e => setSubTicketPriority(e.target.value)}
                                  style={{
                                    width: '100%', padding: '10px 14px', borderRadius: '12px',
                                    border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none'
                                  }}
                                >
                                  <option value="LOW">منخفضة (Low)</option>
                                  <option value="MEDIUM">متوسطة (Medium)</option>
                                  <option value="HIGH">عالية (High)</option>
                                  <option value="URGENT">حرجة جداً (Urgent)</option>
                                </select>
                              </div>
                            </>
                          );
                        })()}

                        <div>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            العمل والمهام المطلوبة من القسم المستهدف:
                          </label>
                          <textarea
                            rows={4}
                            value={subTicketDesc}
                            onChange={e => setSubTicketDesc(e.target.value)}
                            placeholder="اكتب بالتفصيل ما تريده من القسم المستهدف لإنجازه حتى تتمكن بعد ذلك من إغلاق التذكرة..."
                            style={{
                              width: '100%', padding: '10px 14px', borderRadius: '12px',
                              border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none',
                              fontFamily: 'inherit', resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => setShowSubTicketModal(false)}
                          disabled={isCreatingSubTicket}
                          style={{
                            padding: '10px 16px', borderRadius: '10px',
                            border: '1px solid #cbd5e1', background: '#f8fafc',
                            color: '#64748b', fontWeight: 600, fontSize: '13px', cursor: 'pointer'
                          }}
                        >
                          إلغاء
                        </button>
                        <button
                          onClick={handleCreateSubTicket}
                          disabled={isCreatingSubTicket}
                          style={{
                            padding: '10px 20px', borderRadius: '10px',
                            border: 'none', background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                            color: '#ffffff', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '6px',
                            boxShadow: '0 4px 14px rgba(126, 34, 206, 0.3)'
                          }}
                        >
                          {isCreatingSubTicket ? (
                            <><RefreshCw size={14} className="animate-spin" /> جاري الفتح...</>
                          ) : (
                            <><PlusCircle size={15} /> فتح المهمة الداخلية</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
