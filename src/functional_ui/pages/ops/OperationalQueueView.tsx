import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OpsAPI } from '../../../services/ops.api';
import { useAuth } from '../../../engine/auth/AuthContext';
import { useMobileViewport } from '../../../mobile/hooks/useMobileViewport';
import { FlowReceptionGovernanceView } from './FlowReceptionGovernanceView';
import { DynamicFormAwareAnalytics } from '../../../components/analytics/DynamicFormAwareAnalytics';
import { AnalyticsGovernanceView } from '../../../components/analytics/AnalyticsGovernanceView';
import { CinemaTicketFrame, TicketCodeBadge } from '../../components/CinemaTicketFrame';
import { LinkAssetModal } from './LinkAssetModal';
import { UnlinkedAssetsLedgerModal } from './UnlinkedAssetsLedgerModal';
import { StandaloneInternalTicketModal } from './StandaloneInternalTicketModal';
import { RegisterAssetModal } from './RegisterAssetModal';
import { 
  Inbox, Activity, CheckCircle, Clock, Search, Filter, 
  AlertCircle, RefreshCw, Layers, MoreVertical, ArrowUpRight,
  Sliders, ShieldCheck, Shield, Tag, X, User, Building2, FileText, Check,
  AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft, Send, CornerDownLeft,
  MessageSquare, RotateCcw, FileCheck, XCircle, History,
  ArrowRightLeft, Hourglass, Plus, PlusCircle, GitBranch, ArrowLeft, ExternalLink,
  GitPullRequest, Zap, Sun, Moon, BarChart3, Paperclip, Download, Eye,
  LayoutGrid, List, SlidersHorizontal, Minus, Laptop, Lock, Unlock, Wrench, Crown
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
  assetId?: string | null;
  assetName?: string | null;
  assetCategory?: string | null;
  isUnregisteredAsset?: boolean;
  isUserUnableToIdentify?: boolean;
  assetSyncStatus?: string | null;
  assetResolutionLocked?: boolean;
  isInternalRequest?: boolean;
  internalScope?: string | null;
  isVip?: boolean;
  parentTicket?: {
    id: number;
    code: string;
    title: string;
    priority: string;
    state?: { name: string; label: string };
    departmentName?: string;
  } | null;
  subTicketsSummary?: {
    total: number;
    open: number;
    items: Array<{
      id: number;
      code: string;
      title: string;
      priority: string;
      state?: { name: string; label: string };
      assignedTo?: { id: number; fullName: string; avatarUrl?: string } | null;
      departmentName?: string;
      createdAt: string;
      isOpen: boolean;
    }>;
  };
  creatorBuilding?: string | null;
  creatorBuildingId?: number | null;
  targetDeptId?: number | null;
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

interface OperationalQueueViewProps {
  hideInternalDock?: boolean;
}

export const OperationalQueueView: React.FC<OperationalQueueViewProps> = ({ hideInternalDock = false }) => {
  const { user } = useAuth();
  const isMobile = useMobileViewport(768);

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

  const [analyticsSubTab, setAnalyticsSubTab] = useState<'OVERVIEW' | 'COMPARISON' | 'GOVERNANCE'>('OVERVIEW');
  const [activeTab, setActiveTab] = useState<'POOL' | 'MY_QUEUE' | 'OUTBOUND' | 'SUB_TICKETS' | 'ARCHIVE' | 'FLOW_SETTINGS' | 'ANALYTICS' | 'COMPARISON' | 'ANALYTICS_GOVERNANCE'>('POOL');

  // Universal Filter Engine & Standalone Requests States
  const [outboundCount, setOutboundCount] = useState<number>(0);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<number | 'ALL'>('ALL');
  const [selectedFlowFilter, setSelectedFlowFilter] = useState<string | 'ALL'>('ALL');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<number | 'ALL'>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [buildings, setBuildings] = useState<Array<{ id: number; name: string }>>([]);
  const [flowsList, setFlowsList] = useState<Array<{ id: string; name: string }>>([]);
  const [subTasksPopoverTicket, setSubTasksPopoverTicket] = useState<Ticket | null>(null);
  const [standaloneSubTab, setStandaloneSubTab] = useState<'MY_ASSIGNED' | 'INBOUND' | 'MY_OUTBOUND' | 'DEPT_OUTBOUND'>('MY_ASSIGNED');

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedDeptFilter !== 'ALL') count++;
    if (selectedFlowFilter !== 'ALL') count++;
    if (selectedBuildingFilter !== 'ALL') count++;
    if (selectedStatusFilter !== 'ALL') count++;
    return count;
  }, [selectedDeptFilter, selectedFlowFilter, selectedBuildingFilter, selectedStatusFilter]);

  useEffect(() => {
    const handler = (e: any) => {
      if (e.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('nexus_ops_switch_tab', handler);
    return () => window.removeEventListener('nexus_ops_switch_tab', handler);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nexus_ops_tab_changed', { detail: { tab: activeTab } }));
  }, [activeTab]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, breached: 0, completed: 0 });
  const [poolCount, setPoolCount] = useState<number>(0);
  const [myCount, setMyCount] = useState<number>(0);
  const [subTicketsCount, setSubTicketsCount] = useState<number>(0);
  const [archiveCount, setArchiveCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [managedFlowsCount, setManagedFlowsCount] = useState<number>(0);
  const [canManageFlows, setCanManageFlows] = useState<boolean>(false);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('nexus_ops_stats_changed', { 
      detail: { openCount: stats.open, poolCount, myCount, archiveCount } 
    }));
  }, [stats.open, poolCount, myCount, archiveCount]);

  // View Mode: Horizontal Rail vs. Enterprise Structured List (7 rows per page)
  const [mobileCardsCols, setMobileCardsCols] = useState<1 | 2>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nexus_ops_mobile_cols');
      if (saved === '2') return 2;
    }
    return 1;
  });

  const handleToggleMobileCols = (cols: 1 | 2) => {
    setMobileCardsCols(cols);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexus_ops_mobile_cols', String(cols));
    }
  };

  const [ticketLayoutMode, setTicketLayoutMode] = useState<'RAIL' | 'LIST'>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 768) return 'LIST';
      const saved = localStorage.getItem('nexus_ops_ticket_layout_mode');
      if (saved === 'LIST') return 'LIST';
      return 'RAIL';
    }
    return 'LIST';
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
  const [hoveredDockItem, setHoveredDockItem] = useState<string | null>(null);

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

  // Asset Management & Internal Tickets Modals State
  const [isLinkAssetModalOpen, setIsLinkAssetModalOpen] = useState(false);
  const [linkAssetTicket, setLinkAssetTicket] = useState<Ticket | null>(null);
  const [isRegisterAssetModalOpen, setIsRegisterAssetModalOpen] = useState(false);
  const [registerAssetTicket, setRegisterAssetTicket] = useState<Ticket | null>(null);
  const [isUnlinkedLedgerModalOpen, setIsUnlinkedLedgerModalOpen] = useState(false);
  const [isStandaloneInternalModalOpen, setIsStandaloneInternalModalOpen] = useState(false);
  const [subTicketDirection, setSubTicketDirection] = useState<'RECEIVED' | 'SENT' | 'ALL'>('RECEIVED');
  const [subTicketLinkage, setSubTicketLinkage] = useState<'ALL' | 'LINKED' | 'STANDALONE'>('ALL');
  const [assetHistoryModal, setAssetHistoryModal] = useState<{
    isOpen: boolean;
    assetId: string;
    assetName: string;
    history: any[];
    isLoading: boolean;
    hideTech: boolean;
  }>({
    isOpen: false,
    assetId: '',
    assetName: '',
    history: [],
    isLoading: false,
    hideTech: false
  });

  const handleOpenAssetHistory = async (assetId: string, assetName: string, hideTech = false) => {
    setAssetHistoryModal({
      isOpen: true,
      assetId,
      assetName,
      history: [],
      isLoading: true,
      hideTech
    });
    try {
      const res = await OpsAPI.getAssetMaintenanceHistory(assetId, hideTech);
      if (res.success) {
        setAssetHistoryModal(prev => ({ ...prev, history: res.history || [], isLoading: false }));
      } else {
        setAssetHistoryModal(prev => ({ ...prev, history: [], isLoading: false }));
      }
    } catch {
      setAssetHistoryModal(prev => ({ ...prev, history: [], isLoading: false }));
    }
  };

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

  // ── Leadership & RBAC Governance for Standalone Requests ──
  const isLeaderOrDirector = useMemo(() => {
    const role = (user?.role || '').toUpperCase();
    const roleName = ((user as any)?.role?.name || '').toUpperCase();
    const elevatedRoles = [
      'SUPER_ADMIN',
      'SYSTEM_ADMIN',
      'SYSTEM_DIRECTOR',
      'TECH_DIRECTOR',
      'DEPT_HEAD',
      'DEPARTMENT_HEAD',
      'TEAM_LEADER',
      'TEAM_LEAD',
      'CO_ADMIN',
      'DIRECTOR',
      'MANAGER'
    ];
    return (
      elevatedRoles.includes(role) ||
      elevatedRoles.includes(roleName) ||
      (user as any)?.roleId === 1 ||
      (user as any)?.roleId === 22 ||
      (user as any)?.isLeader === true ||
      (user as any)?.isManager === true
    );
  }, [user]);

  const canCreateStandaloneTicket = useMemo(() => {
    return Boolean(user);
  }, [user]);

  useEffect(() => {
    if (!isLeaderOrDirector && (standaloneSubTab === 'INBOUND' || standaloneSubTab === 'DEPT_OUTBOUND')) {
      setStandaloneSubTab('MY_ASSIGNED');
    }
  }, [isLeaderOrDirector, standaloneSubTab]);

  // --- Fetch Data ---
  const fetchData = useCallback(async () => {
    if (activeTab === 'FLOW_SETTINGS') return;
    setLoading(true);
    try {
      const filterParams: any = {};
      if (selectedDeptFilter !== 'ALL') filterParams.departmentId = selectedDeptFilter;
      if (selectedBuildingFilter !== 'ALL') filterParams.buildingId = selectedBuildingFilter;
      if (selectedFlowFilter !== 'ALL') filterParams.flowId = selectedFlowFilter;
      if (selectedStatusFilter !== 'ALL') filterParams.status = selectedStatusFilter;
      if (search.trim()) filterParams.search = search.trim();

      const [statsRes, poolRes, myRes, subRes, archiveRes, targetRes] = await Promise.all([
        OpsAPI.getStats().catch(() => ({ data: { openCount: 0, slaBreachedCount: 0, closedTodayCount: 0, totalClosedCount: 0, outboundCount: 0 } })),
        OpsAPI.getAllTickets({ unassigned: true, limit: 50, ...filterParams }).catch(() => ({ data: [] })),
        OpsAPI.getMyQueue({ limit: 50, ...filterParams }).catch(() => ({ data: [] })),
        OpsAPI.getAllSubTickets({ limit: 50, subTab: standaloneSubTab, ...filterParams }).catch(() => ({ data: [] })),
        OpsAPI.getAllTickets({ archive: true, limit: 50, ...filterParams }).catch(() => ({ data: [] })),
        activeTab === 'POOL'
          ? OpsAPI.getAllTickets({ unassigned: true, limit: 50, ...filterParams }).catch(() => ({ data: [] }))
          : activeTab === 'MY_QUEUE'
          ? OpsAPI.getMyQueue({ limit: 50, ...filterParams }).catch(() => ({ data: [] }))
          : activeTab === 'OUTBOUND'
          ? OpsAPI.getAllTickets({ category: 'OUTBOUND', limit: 50, ...filterParams }).catch(() => ({ data: [] }))
          : activeTab === 'SUB_TICKETS'
          ? OpsAPI.getAllSubTickets({ limit: 50, subTab: standaloneSubTab, ...filterParams }).catch(() => ({ data: [] }))
          : activeTab === 'ARCHIVE'
          ? OpsAPI.getAllTickets({ archive: true, limit: 50, ...filterParams }).catch(() => ({ data: [] }))
          : OpsAPI.getAllTickets({ limit: 50, ...filterParams }).catch(() => ({ data: [] }))
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
      const aList = archiveRes.data || archiveRes.tickets || [];
      const tList = targetRes.data || targetRes.tickets || [];

      setPoolCount(statPayload.poolCount ?? pList.length);
      setMyCount(statPayload.myQueueCount ?? mList.length);
      setSubTicketsCount(statPayload.activeSubTicketsCount ?? statPayload.standaloneInternalCount ?? sList.length);
      setArchiveCount(statPayload.totalClosedCount ?? aList.length);
      setOutboundCount(statPayload.outboundCount ?? 0);
      setTickets(tList);
    } catch (error) {
      console.error('Failed to fetch ops data', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedDeptFilter, selectedBuildingFilter, selectedFlowFilter, selectedStatusFilter, standaloneSubTab, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load auxiliary data: departments, buildings, flows
  useEffect(() => {
    OpsAPI.getDepartments().then(res => {
      if (res.success && Array.isArray(res.data)) {
        setDepartments(res.data);
      }
    }).catch(() => {});

    OpsAPI.getBuildings().then(res => {
      if (Array.isArray(res)) setBuildings(res);
      else if (res.success && Array.isArray(res.data)) setBuildings(res.data);
    }).catch(() => {});

    fetch('/api/v1/routing/routes/public', { credentials: 'include' })
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.routes)) {
          setFlowsList(res.routes.map((r: any) => ({ id: r.id, name: r.name })));
        } else if (Array.isArray(res)) {
          setFlowsList(res.map((r: any) => ({ id: r.id, name: r.name })));
        }
      })
      .catch(() => {});
  }, []);

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
  const isGeneralTicketsView = ['POOL', 'MY_QUEUE', 'ARCHIVE'].includes(activeTab);
  const isStandaloneView = activeTab === 'SUB_TICKETS';
  const isTicketView = isGeneralTicketsView || isStandaloneView;

  // Fallback if legacy OUTBOUND tab was active
  useEffect(() => {
    if ((activeTab as string) === 'OUTBOUND') {
      setActiveTab('POOL');
    }
  }, [activeTab]);

  const activeViewConfig = React.useMemo(() => {
    switch (activeTab) {
      case 'POOL':
        return {
          title: 'حوض التذاكر العام',
          subtitle: 'الطلبات العامة المعلقة بانتظار السحب والإسناد المباشر للفريق (المفتوحة فقط)',
          badgeText: `${poolCount} متاحة للسحب`,
          badgeColor: '#0284c7',
          badgeBg: 'rgba(2, 132, 199, 0.12)',
          icon: Inbox,
          iconBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          glowColor: 'rgba(2, 132, 199, 0.35)'
        };
      case 'MY_QUEUE':
        return {
          title: 'تذاكري المسندة',
          subtitle: 'المعاملات والتذاكر التشغيلية النشطة المسندة إليك مباشرة قيد المتابعة والإنجاز',
          badgeText: `${myCount} قيد المعالجة`,
          badgeColor: '#4f46e5',
          badgeBg: 'rgba(79, 70, 229, 0.12)',
          icon: ShieldCheck,
          iconBg: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
          glowColor: 'rgba(79, 70, 229, 0.35)'
        };
      case 'OUTBOUND':
        return {
          title: 'الطلبات والمعاملات الصادرة',
          subtitle: 'المعاملات والتذاكر الصادرة منك أو من إدارتك لمتابعة إنجازها وسير العمل عليها',
          badgeText: `${outboundCount} صادرة`,
          badgeColor: '#0ea5e9',
          badgeBg: 'rgba(14, 165, 233, 0.12)',
          icon: Send,
          iconBg: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          glowColor: 'rgba(14, 165, 233, 0.35)'
        };
      case 'SUB_TICKETS':
        return {
          title: 'الطلبات الداخلية والتنسيق البيني المستقل',
          subtitle: 'المعاملات والتكليفات التشغيلية المستقلة المتبادلة بين الإدارات والأقسام',
          badgeText: `${subTicketsCount} نشطة`,
          badgeColor: '#7e22ce',
          badgeBg: 'rgba(126, 34, 206, 0.12)',
          icon: ArrowRightLeft,
          iconBg: 'linear-gradient(135deg, #7e22ce 0%, #581c87 100%)',
          glowColor: 'rgba(126, 34, 206, 0.35)'
        };
      case 'ARCHIVE':
        return {
          title: 'أرشيف التذاكر',
          subtitle: 'السجل الأرشيفي التوثيقي لكافة التذاكر والمعاملات المقفلة والمحلولة المعتمدة بنجاح',
          badgeText: `${archiveCount} معاملة مغلقة`,
          badgeColor: '#10b981',
          badgeBg: 'rgba(16, 185, 129, 0.12)',
          icon: FileCheck,
          iconBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          glowColor: 'rgba(16, 185, 129, 0.35)'
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

  // ═══ OPERATIONAL MODES DEFINITION (التذاكر العامة، الطلبات المستقلة، المؤشرات، وخصائص الاستقبال) ═══
  const operationalModes = useMemo(() => [
    {
      id: 'GENERAL_TICKETS',
      label: 'التذاكر العامة وعمليات الحوض',
      shortLabel: 'التذاكر العامة',
      sublabel: 'أحواض العمل والمهام التشغيلية',
      count: stats.open,
      icon: Inbox,
      accentColor: '#0284c7',
      isActive: isGeneralTicketsView,
      onClick: () => {
        if (!isGeneralTicketsView) setActiveTab('POOL');
      }
    },
    {
      id: 'STANDALONE_REQUESTS',
      label: 'الطلبات والمهام المستقلة بين الإدارات',
      shortLabel: 'الطلبات المستقلة',
      sublabel: 'التنسيق البيني وسجل الأصول المرتبط',
      count: subTicketsCount,
      icon: ArrowRightLeft,
      accentColor: '#7e22ce',
      isActive: isStandaloneView,
      onClick: () => {
        setActiveTab('SUB_TICKETS');
      }
    },
    {
      id: 'ANALYTICS_SUITE',
      label: 'مؤشرات الأداء والمقارنة والحوكمة NACE',
      shortLabel: 'المؤشرات',
      sublabel: 'التحليلات الإحصائية، محرك المقارنة، وتفويض الحوكمة',
      badge: 'NACE',
      icon: BarChart3,
      accentColor: '#135d79',
      isActive: ['ANALYTICS', 'COMPARISON', 'ANALYTICS_GOVERNANCE'].includes(activeTab),
      onClick: () => {
        if (!['ANALYTICS', 'COMPARISON', 'ANALYTICS_GOVERNANCE'].includes(activeTab)) {
          setActiveTab('ANALYTICS');
          setAnalyticsSubTab('OVERVIEW');
        }
      }
    },
    ...(canManageFlows ? [{
      id: 'FLOW_SETTINGS',
      label: 'خصائص استقبال الطلبات',
      shortLabel: 'خصائص الاستقبال',
      sublabel: 'حوكمة وأتمتة مسارات الاستقبال',
      count: managedFlowsCount,
      icon: Sliders,
      accentColor: '#d97706',
      isActive: activeTab === 'FLOW_SETTINGS',
      onClick: () => setActiveTab('FLOW_SETTINGS' as any)
    }] : [])
  ], [isGeneralTicketsView, isStandaloneView, canManageFlows, managedFlowsCount, activeTab, stats.open, subTicketsCount]);

  // --- UI Render ---
  return (
    <div style={{
      ...styles.container,
      padding: isMobile ? '10px 10px 40px 10px' : '28px 32px 90px 32px',
      overflowX: 'hidden',
      maxWidth: '100%',
      background: isDark
        ? 'radial-gradient(circle at 50% 0%, #161920 0%, #0c0e12 60%, #07080a 100%)'
        : 'radial-gradient(ellipse at 50% -10%, #ffffff 0%, #f5f7fa 50%, #eaedf3 100%)',
      color: isDark ? '#f8fafc' : '#0f172a',
      transition: 'background 0.35s cubic-bezier(0.16, 1, 0.3, 1), color 0.35s ease',
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
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'space-between',
        flexDirection: isMobile ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: isMobile ? '10px' : '16px',
        marginBottom: isMobile ? '14px' : '24px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{
              margin: 0,
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 900,
              color: isDark ? '#ffffff' : '#0f172a',
              fontFamily: "'Tajawal', 'Cairo', sans-serif",
              letterSpacing: '-0.02em'
            }}>
              إدارة واستقبال الطلبات
            </h1>

          </div>
          <p style={{ margin: 0, fontSize: isMobile ? '11.5px' : '13px', color: isDark ? '#94a3b8' : '#64748b' }}>
            إدارة حوض الطلبات الواردة، مهام الكادر، وحوكمة الأتمتة للمسارات التشغيلية
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '6px' : '10px',
          justifyContent: isMobile ? 'flex-start' : 'flex-end'
        }}>
          {/* Unified Refresh Button */}
          {activeTab !== 'FLOW_SETTINGS' && (
            <button 
              onClick={fetchData}
              title="تحديث البيانات الفورية"
              style={{ 
                background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#ffffff',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #e2e8f0',
                padding: isMobile ? '5px 10px' : '8px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                fontSize: isMobile ? '11px' : '13px',
                fontWeight: 700,
                color: isDark ? '#f1f5f9' : '#334155',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 6px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = isDark ? '#38bdf8' : '#cbd5e1'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'; e.currentTarget.style.transform = 'none'; }}
            >
              <RefreshCw size={13} color={isDark ? '#38bdf8' : '#475569'} className={loading ? 'animate-spin' : ''} />
              <span>{isMobile ? '' : 'تحديث البيانات'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 🌟 UNIVERSAL TOP OPERATIONAL MODES STRIP (الشريط التشغيلي الموحد في أعلى الواجهة) ── */}
      {!hideInternalDock && (
        <div
          className="nexus-universal-top-ops-strip"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: isDark ? 'rgba(12, 16, 23, 0.94)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
            padding: isMobile ? '8px 4px' : '10px 8px',
            marginBottom: isMobile ? '12px' : '18px',
            width: '100%',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            direction: 'rtl',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            display: 'flex',
            gap: isMobile ? '8px' : '12px',
            padding: '0 4px',
            width: 'max-content',
            alignItems: 'center'
          }}>
            {operationalModes.map((item) => {
              const isSelected = item.isActive;
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: isMobile ? '8px 14px' : '10px 18px',
                    borderRadius: '14px',
                    border: isSelected
                      ? `1.5px solid ${item.accentColor}`
                      : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)'),
                    background: isSelected
                      ? `linear-gradient(135deg, ${item.accentColor}, ${item.accentColor}dd)`
                      : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff'),
                    color: isSelected ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: isSelected ? 800 : 700,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? `0 4px 16px ${item.accentColor}40`
                      : (isDark ? '0 1px 4px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.04)'),
                    transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <IconComponent size={16} strokeWidth={isSelected ? 2.5 : 2} color={isSelected ? '#ffffff' : item.accentColor} />
                  <span>{item.shortLabel || item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.28)' : (isDark ? 'rgba(255,255,255,0.1)' : '#f1f5f9'),
                      color: isSelected ? '#ffffff' : item.accentColor,
                      fontSize: '10.5px',
                      fontWeight: 900,
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      lineHeight: 1
                    }}>
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.22)' : `${item.accentColor}18`,
                      color: isSelected ? '#ffffff' : item.accentColor,
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '6px'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ 2. MAIN 2-COLUMN WORKSPACE (VERTICAL RAIL ON RIGHT + MAIN CANVAS ON LEFT) ═══ */}
      <div className="enterprise-adaptive-workspace" style={{ display: "flex", flexDirection: "column", width: "100%", direction: "rtl", gap: "20px" }}>

        {/* ── RIGHT COLUMN: VERTICAL OPERATIONAL RAIL (يمين الشاشة) ── */}

        {/* ── LEFT COLUMN: UNIFIED MAIN OPERATIONS CANVAS FRAME (مستطيل العرض الموحد) ── */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
          {/* ═══ TOP OPERATIONAL QUEUES SWITCHER (أحواض التذاكر العامة الثلاثة المنظمة) ═══ */}
          {isGeneralTicketsView && (
            <div 
              className="operational-top-queues-bar"
              style={{
                display: isMobile ? 'flex' : 'grid',
                gridTemplateColumns: isMobile ? undefined : 'repeat(3, minmax(0, 1fr))',
                flexDirection: isMobile ? 'row' : undefined,
                overflowX: isMobile ? 'auto' : undefined,
                WebkitOverflowScrolling: 'touch',
                gap: isMobile ? '8px' : '14px',
                paddingBottom: isMobile ? '6px' : '0',
                scrollbarWidth: 'none',
                width: '100%',
                boxSizing: 'border-box'
              }}
            >
              {[
                {
                  id: 'POOL',
                  label: 'حوض التذاكر العام',
                  count: poolCount,
                  badge: 'متاحة للسحب',
                  sublabel: 'الطلبات العامة بانتظار الإسناد',
                  icon: Inbox,
                  accentColor: '#0284c7',
                },
                {
                  id: 'MY_QUEUE',
                  label: 'تذاكري المسندة',
                  count: myCount,
                  badge: 'قيد المعالجة',
                  sublabel: 'المهام والمعاملات المباشرة في عهدتك',
                  icon: ShieldCheck,
                  accentColor: '#4f46e5',
                },
                {
                  id: 'ARCHIVE',
                  label: 'أرشيف التذاكر',
                  count: archiveCount,
                  badge: 'مقفلة ومكتملة',
                  sublabel: 'سجل المعاملات المنجزة والمغلقة',
                  icon: FileCheck,
                  accentColor: '#10b981',
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
                      gap: isMobile ? '4px' : '8px',
                      padding: isMobile ? '8px 10px' : '12px 14px',
                      borderRadius: isMobile ? '12px' : '16px',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontFamily: "'Cairo', sans-serif",
                      outline: 'none',
                      transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                      background: isSelected
                        ? (isDark
                            ? `linear-gradient(135deg, ${q.accentColor}26 0%, rgba(20, 24, 32, 0.95) 100%)`
                            : `linear-gradient(135deg, #ffffff 0%, ${q.accentColor}12 100%)`)
                        : (isDark ? 'rgba(19, 23, 30, 0.72)' : 'rgba(255, 255, 255, 0.88)'),
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: isSelected
                        ? `1.5px solid ${q.accentColor}`
                        : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)'),
                      boxShadow: isSelected
                        ? (isDark
                            ? `0 8px 24px rgba(0, 0, 0, 0.35), 0 0 16px ${q.accentColor}25`
                            : `0 8px 20px -4px rgba(0, 0, 0, 0.08), 0 0 12px ${q.accentColor}20`)
                        : (isDark ? '0 4px 14px rgba(0,0,0,0.25)' : '0 2px 8px rgba(15, 23, 42, 0.04)'),
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
                        display: isMobile ? 'none' : 'block',
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

          {/* ═══ STANDALONE REQUESTS DEDICATED COMMAND HUB (مركز التحكم بالطلبات المستقلة والتنسيق البيني) ═══ */}
          {isStandaloneView && (
            <div
              className="standalone-requests-command-hub"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: isMobile ? '12px' : '16px 20px',
                borderRadius: isMobile ? '14px' : '18px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(126, 34, 206, 0.16) 0%, rgba(20, 24, 33, 0.88) 100%)'
                  : 'linear-gradient(135deg, rgba(126, 34, 206, 0.08) 0%, rgba(255, 255, 255, 0.96) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: isDark ? '1px solid rgba(126, 34, 206, 0.35)' : '1px solid rgba(126, 34, 206, 0.22)',
                boxShadow: isDark
                  ? '0 8px 28px rgba(0, 0, 0, 0.35), 0 0 20px rgba(126, 34, 206, 0.15)'
                  : '0 4px 20px -4px rgba(126, 34, 206, 0.12), 0 1px 3px rgba(0,0,0,0.04)',
                boxSizing: 'border-box',
                width: '100%',
                transition: 'all 0.22s ease'
              }}
            >
              {/* Upper Section: Title + Badges + Action Buttons */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                {/* Title & Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 2px 10px rgba(126, 34, 206, 0.35)',
                    flexShrink: 0
                  }}>
                    <ArrowRightLeft size={18} strokeWidth={2.2} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: isMobile ? '14px' : '15px',
                        fontWeight: 800,
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontFamily: "'Cairo', sans-serif"
                      }}>
                        منظومة الطلبات المستقلة والتنسيق البيني
                      </h3>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        background: isLeaderOrDirector ? 'rgba(217, 119, 6, 0.16)' : 'rgba(126, 34, 206, 0.14)',
                        color: isLeaderOrDirector ? '#f59e0b' : '#a855f7',
                        border: isLeaderOrDirector ? '1px solid rgba(217, 119, 6, 0.3)' : '1px solid rgba(126, 34, 206, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {isLeaderOrDirector ? (
                          <>
                            <Crown size={11} strokeWidth={2.5} />
                            <span>صلاحيات إشرافية (عرض شامل للقسم والإدارة)</span>
                          </>
                        ) : (
                          <>
                            <User size={11} strokeWidth={2.5} />
                            <span>النطاق التشغيلي الفردي (مهامك الخاصة)</span>
                          </>
                        )}
                      </span>
                    </div>
                    <p style={{
                      margin: '2px 0 0 0',
                      fontSize: isMobile ? '11px' : '12px',
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>
                      التنسيق المباشر بين الإدارات والأقسام وسجلات العهد والأصول المرتبطة
                    </p>
                  </div>
                </div>

                {/* Action Buttons (سجل الأصول والعهد + إنشاء طلب مستقل) */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: isMobile ? '100%' : 'auto',
                  justifyContent: isMobile ? 'space-between' : 'flex-end',
                  flexWrap: 'wrap'
                }}>
                  {/* زر سجل الأصول والعهد */}
                  <button
                    type="button"
                    onClick={() => setIsUnlinkedLedgerModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: isMobile ? '7px 12px' : '8px 14px',
                      borderRadius: '10px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                      background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                      color: isDark ? '#e2e8f0' : '#334155',
                      fontSize: isMobile ? '11px' : '12px',
                      fontWeight: 700,
                      fontFamily: "'Cairo', sans-serif",
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                      flex: isMobile ? '1' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#7e22ce';
                      e.currentTarget.style.color = '#7e22ce';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
                      e.currentTarget.style.color = isDark ? '#e2e8f0' : '#334155';
                    }}
                  >
                    <Layers size={14} strokeWidth={2.2} />
                    <span>سجل الأصول والعهد</span>
                  </button>

                  {/* زر إنشاء طلب مستقل */}
                  <button
                    type="button"
                    onClick={() => setIsStandaloneInternalModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: isMobile ? '7px 14px' : '8px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)',
                      color: '#ffffff',
                      fontSize: isMobile ? '11.5px' : '12.5px',
                      fontWeight: 800,
                      fontFamily: "'Cairo', sans-serif",
                      cursor: 'pointer',
                      boxShadow: '0 3px 12px rgba(126, 34, 206, 0.35)',
                      transition: 'all 0.18s ease',
                      flex: isMobile ? '1.3' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 5px 16px rgba(126, 34, 206, 0.45)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 3px 12px rgba(126, 34, 206, 0.35)';
                    }}
                  >
                    <Plus size={15} strokeWidth={2.6} />
                    <span>+ إنشاء طلب مستقل</span>
                  </button>
                </div>
              </div>

              {/* Subtabs Selector (التبويبات الفرعية المحكومة بالصلاحيات) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
                paddingTop: '8px',
                borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(126, 34, 206, 0.1)'
              }}>
                {[
                  { id: 'MY_ASSIGNED', label: '👤 المسندة إليّ', desc: 'المهام والتكليفات الموجهة إليك' },
                  { id: 'MY_OUTBOUND', label: '📤 الصادرة مني', desc: 'الطلبات المستقلة التي أنشأتها' },
                  ...(isLeaderOrDirector ? [
                    { id: 'INBOUND', label: '📥 الواردة للقسم / فريقي', desc: 'كافة المعاملات المستقلة الواردة لقسمك' },
                    { id: 'DEPT_OUTBOUND', label: '🏢 كافة صادرة الإدارة', desc: 'جميع المعاملات الصادرة من منتسبي القسم' }
                  ] : [])
                ].map((sub) => {
                  const isCurrent = standaloneSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setStandaloneSubTab(sub.id as any)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: isMobile ? '6px 12px' : '7px 14px',
                        borderRadius: '10px',
                        border: isCurrent
                          ? '1.5px solid #9333ea'
                          : (isDark ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #e2e8f0'),
                        background: isCurrent
                          ? (isDark ? 'rgba(126, 34, 206, 0.35)' : 'rgba(126, 34, 206, 0.12)')
                          : (isDark ? 'rgba(15, 23, 42, 0.4)' : '#ffffff'),
                        color: isCurrent
                          ? (isDark ? '#f3e8ff' : '#7e22ce')
                          : (isDark ? '#94a3b8' : '#64748b'),
                        fontSize: isMobile ? '11px' : '12px',
                        fontWeight: isCurrent ? 800 : 600,
                        fontFamily: "'Cairo', sans-serif",
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0
                      }}
                    >
                      <span>{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className="unified-operations-canvas-card"
            style={{
              background: isDark ? 'rgba(18, 21, 28, 0.78)' : 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.07)',
              borderRadius: isMobile ? '16px' : '20px',
              padding: isMobile ? '14px 10px' : '24px 28px',
              boxShadow: isDark ? '0 12px 36px rgba(0, 0, 0, 0.45)' : '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.03)',
              minHeight: isMobile ? 'auto' : '780px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? '14px' : '20px',
              transition: 'all 0.25s ease'
            }}
          >
            {/* ═══ 1. UNIFIED VIEW TITLE & ACTION HEADER STRIP (للوجهات الإدارية والتحليلية فقط) ═══ */}
            {!isTicketView && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: isMobile ? '12px' : '16px',
                paddingBottom: isMobile ? '12px' : '18px',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9'
              }}>
                {/* Identity (Icon + Title + Badge + Subtitle) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
                  <div style={{
                    width: isMobile ? '38px' : '44px',
                    height: isMobile ? '38px' : '44px',
                    borderRadius: '12px',
                    background: activeViewConfig.iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: `0 4px 14px ${activeViewConfig.glowColor}`,
                    flexShrink: 0
                  }}>
                    <activeViewConfig.icon size={isMobile ? 18 : 22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h2 style={{
                        margin: 0,
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: 800,
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontFamily: "'Cairo', sans-serif"
                      }}>
                        {activeViewConfig.title}
                      </h2>
                      <span style={{
                        fontSize: isMobile ? '10px' : '11px',
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
                      fontSize: isMobile ? '11px' : '12.5px',
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>
                      {activeViewConfig.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ 2. VIEW BODY (ALL VIEWS EMBEDDED SEAMLESSLY INSIDE) ═══ */}
            {activeTab === 'FLOW_SETTINGS' ? (
              <FlowReceptionGovernanceView />
            ) : ['ANALYTICS', 'COMPARISON', 'ANALYTICS_GOVERNANCE'].includes(activeTab) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Unified Analytics Suite Sub-Navigation Tabs */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isDark ? 'rgba(15, 23, 42, 0.7)' : '#ffffff',
                  padding: '5px 8px',
                  borderRadius: '14px',
                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  width: 'fit-content',
                  flexWrap: 'wrap'
                }}>
                  <button
                    type="button"
                    onClick={() => { setActiveTab('ANALYTICS'); setAnalyticsSubTab('OVERVIEW'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: (activeTab === 'ANALYTICS' && analyticsSubTab === 'OVERVIEW')
                        ? 'linear-gradient(135deg, #135d79 0%, #0d4257 100%)'
                        : 'transparent',
                      color: (activeTab === 'ANALYTICS' && analyticsSubTab === 'OVERVIEW') ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Cairo', sans-serif",
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <BarChart3 size={14} />
                    <span>التحليلات ومؤشرات NACE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('COMPARISON'); setAnalyticsSubTab('COMPARISON'); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '10px',
                      border: 'none',
                      background: (activeTab === 'COMPARISON' || (activeTab === 'ANALYTICS' && analyticsSubTab === 'COMPARISON'))
                        ? 'linear-gradient(135deg, #f36c21 0%, #d45009 100%)'
                        : 'transparent',
                      color: (activeTab === 'COMPARISON' || (activeTab === 'ANALYTICS' && analyticsSubTab === 'COMPARISON')) ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Cairo', sans-serif",
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <ArrowRightLeft size={14} />
                    <span>محرك المقارنة والمفاضلة</span>
                  </button>

                  {canManageFlows && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('ANALYTICS_GOVERNANCE'); setAnalyticsSubTab('GOVERNANCE'); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        borderRadius: '10px',
                        border: 'none',
                        background: (activeTab === 'ANALYTICS_GOVERNANCE' || (activeTab === 'ANALYTICS' && analyticsSubTab === 'GOVERNANCE'))
                          ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                          : 'transparent',
                        color: (activeTab === 'ANALYTICS_GOVERNANCE' || (activeTab === 'ANALYTICS' && analyticsSubTab === 'GOVERNANCE')) ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: "'Cairo', sans-serif",
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <ShieldCheck size={14} />
                      <span>حوكمة وتفويض التحليل (RBAC)</span>
                    </button>
                  )}
                </div>

                {/* Sub-view Content */}
                {activeTab === 'ANALYTICS_GOVERNANCE' || analyticsSubTab === 'GOVERNANCE' ? (
                  <AnalyticsGovernanceView isDark={isDark} />
                ) : activeTab === 'COMPARISON' || analyticsSubTab === 'COMPARISON' ? (
                  <DynamicFormAwareAnalytics initialTab="COMPARISON" isDark={isDark} isEmbedded={true} />
                ) : (
                  <DynamicFormAwareAnalytics initialTab="OVERVIEW" isDark={isDark} isEmbedded={true} />
                )}
              </div>
            ) : (
              /* Tickets List Rendered in RAIL, GRID, or LIST */
              <div style={{ minHeight: '520px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* ═══ Universal Operational Command & Filter Suite (شريط التحكم والفلترة فائق الانسيابية) ═══ */}
                {isTicketView && (
                  <div
                    className="nexus-integrated-ops-toolbar"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: isMobile ? '10px' : '12px',
                      padding: isMobile ? '12px' : '14px 18px',
                      borderRadius: isMobile ? '14px' : '16px',
                      background: isDark ? 'rgba(24, 29, 41, 0.65)' : '#ffffff',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.07)',
                      boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 8px rgba(15, 23, 42, 0.03)',
                      marginBottom: '16px'
                    }}
                  >
                    {/* ── ROW 1: SEARCH + LAYOUT SWITCHER + REFRESH ── */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: isMobile ? '8px' : '12px',
                      flexWrap: isMobile ? 'wrap' : 'nowrap',
                      width: '100%'
                    }}>
                      {/* Search Bar */}
                      <div style={{
                        position: 'relative',
                        flex: 1,
                        minWidth: isMobile ? '100%' : '260px'
                      }}>
                        <Search
                          size={15}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: isDark ? '#94a3b8' : '#64748b',
                            pointerEvents: 'none'
                          }}
                        />
                        <input
                          type="text"
                          placeholder="ابحث برقم المعاملة، الموضوع، أو اسم صاحب الطلب..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: isMobile ? '8px 36px 8px 12px' : '9px 38px 9px 12px',
                            borderRadius: '10px',
                            border: search
                              ? '1.5px solid #0284c7'
                              : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#f8fafc',
                            fontSize: isMobile ? '12px' : '13px',
                            fontFamily: "'Cairo', sans-serif",
                            color: isDark ? '#ffffff' : '#0f172a',
                            outline: 'none',
                            boxSizing: 'border-box',
                            transition: 'all 0.18s ease'
                          }}
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch('')}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '2px'
                            }}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      {/* Right Controls Group: Layout Toggle + Refresh Button */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        width: isMobile ? '100%' : 'auto',
                        justifyContent: isMobile ? 'space-between' : 'flex-end',
                        flexShrink: 0
                      }}>
                        {/* View Mode Switcher (Rail vs List) */}
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#f1f5f9',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #cbd5e1',
                          borderRadius: '10px',
                          padding: '2.5px',
                          gap: '2px',
                          flex: isMobile ? 1 : 'none'
                        }}>
                          <button
                            type="button"
                            onClick={() => handleToggleLayout('RAIL')}
                            title="عرض الكروت الأفقي"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: isMobile ? 1 : 'none',
                              gap: '5px',
                              padding: isMobile ? '6px 8px' : '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: isMobile ? '11px' : '11.5px',
                              fontWeight: ticketLayoutMode === 'RAIL' ? 800 : 600,
                              fontFamily: "'Cairo', sans-serif",
                              background: ticketLayoutMode === 'RAIL'
                                ? (isDark ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff')
                                : 'transparent',
                              color: ticketLayoutMode === 'RAIL'
                                ? (isDark ? '#ffffff' : '#0284c7')
                                : (isDark ? '#94a3b8' : '#64748b'),
                              boxShadow: ticketLayoutMode === 'RAIL'
                                ? (isDark ? '0 2px 8px rgba(2, 132, 199, 0.4)' : '0 2px 6px rgba(0,0,0,0.06)')
                                : 'none',
                              transition: 'all 0.18s ease'
                            }}
                          >
                            <SlidersHorizontal size={13} />
                            <span>{isMobile ? 'كروت' : 'شريط الكروت'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleLayout('LIST')}
                            title="عرض القائمة المنظمة"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flex: isMobile ? 1 : 'none',
                              gap: '5px',
                              padding: isMobile ? '6px 8px' : '6px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: isMobile ? '11px' : '11.5px',
                              fontWeight: ticketLayoutMode === 'LIST' ? 800 : 600,
                              fontFamily: "'Cairo', sans-serif",
                              background: ticketLayoutMode === 'LIST'
                                ? (isDark ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#ffffff')
                                : 'transparent',
                              color: ticketLayoutMode === 'LIST'
                                ? (isDark ? '#ffffff' : '#0284c7')
                                : (isDark ? '#94a3b8' : '#64748b'),
                              boxShadow: ticketLayoutMode === 'LIST'
                                ? (isDark ? '0 2px 8px rgba(2, 132, 199, 0.4)' : '0 2px 6px rgba(0,0,0,0.06)')
                                : 'none',
                              transition: 'all 0.18s ease'
                            }}
                          >
                            <List size={13} />
                            <span>{isMobile ? 'قائمة' : 'قائمة منظمة'}</span>
                          </button>

                          {isMobile && ticketLayoutMode === 'RAIL' && (
                            <button
                              type="button"
                              onClick={() => handleSetRailRows(r => r === 1 ? 2 : 1)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 700,
                                fontFamily: "'Cairo', sans-serif",
                                background: 'transparent',
                                color: isDark ? '#38bdf8' : '#0284c7'
                              }}
                            >
                              <LayoutGrid size={13} />
                              <span>{railVisibleRows === 1 ? 'صفين' : 'صف'}</span>
                            </button>
                          )}
                        </div>

                        {/* Refresh Button */}
                        <button
                          type="button"
                          onClick={fetchData}
                          disabled={loading}
                          title="تحديث البيانات الفورية"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: isMobile ? '7px 12px' : '8px 14px',
                            borderRadius: '10px',
                            border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                            background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                            color: isDark ? '#e2e8f0' : '#334155',
                            cursor: 'pointer',
                            fontSize: isMobile ? '11px' : '12px',
                            fontWeight: 700,
                            fontFamily: "'Cairo', sans-serif",
                            transition: 'all 0.18s ease',
                            flexShrink: 0
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#0284c7';
                            e.currentTarget.style.color = '#0284c7';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
                            e.currentTarget.style.color = isDark ? '#e2e8f0' : '#334155';
                          }}
                        >
                          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                          <span>تحديث</span>
                        </button>
                      </div>
                    </div>

                    {/* ── ROW 2: ERGONOMIC SMART FILTERS (الإدارة | الموقع | المسار | الحالة) ── */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '6px' : '8px',
                      flexWrap: 'wrap',
                      paddingTop: isMobile ? '6px' : '8px',
                      borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(15, 23, 42, 0.06)',
                      fontSize: '12px'
                    }}>
                      {/* Filter Label & Indicator */}
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: isDark ? '#94a3b8' : '#64748b',
                        fontWeight: 800,
                        fontSize: '11px',
                        marginInlineEnd: '4px'
                      }}>
                        <Filter size={13} color="#0ea5e9" />
                        <span>تصفية مخصصة:</span>
                      </div>

                      {/* 1. الإدارة المختصة */}
                      <select
                        value={selectedDeptFilter}
                        onChange={(e) => setSelectedDeptFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '9px',
                          border: selectedDeptFilter !== 'ALL'
                            ? '1.5px solid #0284c7'
                            : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                          background: selectedDeptFilter !== 'ALL'
                            ? (isDark ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.08)')
                            : (isDark ? '#1e293b' : '#f8fafc'),
                          color: selectedDeptFilter !== 'ALL'
                            ? (isDark ? '#38bdf8' : '#0369a1')
                            : (isDark ? '#f8fafc' : '#0f172a'),
                          fontSize: '11.5px',
                          fontWeight: selectedDeptFilter !== 'ALL' ? 700 : 600,
                          fontFamily: "'Cairo', sans-serif",
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <option value="ALL">🏢 كافة الإدارات</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>

                      {/* 2. المبنى / الموقع الجغرافي */}
                      <select
                        value={selectedBuildingFilter}
                        onChange={(e) => setSelectedBuildingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '9px',
                          border: selectedBuildingFilter !== 'ALL'
                            ? '1.5px solid #0284c7'
                            : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                          background: selectedBuildingFilter !== 'ALL'
                            ? (isDark ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.08)')
                            : (isDark ? '#1e293b' : '#f8fafc'),
                          color: selectedBuildingFilter !== 'ALL'
                            ? (isDark ? '#38bdf8' : '#0369a1')
                            : (isDark ? '#f8fafc' : '#0f172a'),
                          fontSize: '11.5px',
                          fontWeight: selectedBuildingFilter !== 'ALL' ? 700 : 600,
                          fontFamily: "'Cairo', sans-serif",
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <option value="ALL">📍 كافة المباني والمواقع</option>
                        {buildings.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>

                      {/* 3. نوع المشكلة / المسار */}
                      <select
                        value={selectedFlowFilter}
                        onChange={(e) => setSelectedFlowFilter(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '9px',
                          border: selectedFlowFilter !== 'ALL'
                            ? '1.5px solid #0284c7'
                            : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                          background: selectedFlowFilter !== 'ALL'
                            ? (isDark ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.08)')
                            : (isDark ? '#1e293b' : '#f8fafc'),
                          color: selectedFlowFilter !== 'ALL'
                            ? (isDark ? '#38bdf8' : '#0369a1')
                            : (isDark ? '#f8fafc' : '#0f172a'),
                          fontSize: '11.5px',
                          fontWeight: selectedFlowFilter !== 'ALL' ? 700 : 600,
                          fontFamily: "'Cairo', sans-serif",
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <option value="ALL">🎯 كافة المسارات والمشاكل</option>
                        {flowsList.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>

                      {/* 4. حالة الطلب التشغيلية */}
                      <select
                        value={selectedStatusFilter}
                        onChange={(e) => setSelectedStatusFilter(e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '9px',
                          border: selectedStatusFilter !== 'ALL'
                            ? '1.5px solid #0284c7'
                            : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1'),
                          background: selectedStatusFilter !== 'ALL'
                            ? (isDark ? 'rgba(2, 132, 199, 0.18)' : 'rgba(2, 132, 199, 0.08)')
                            : (isDark ? '#1e293b' : '#f8fafc'),
                          color: selectedStatusFilter !== 'ALL'
                            ? (isDark ? '#38bdf8' : '#0369a1')
                            : (isDark ? '#f8fafc' : '#0f172a'),
                          fontSize: '11.5px',
                          fontWeight: selectedStatusFilter !== 'ALL' ? 700 : 600,
                          fontFamily: "'Cairo', sans-serif",
                          cursor: 'pointer',
                          outline: 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <option value="ALL">🔄 كل الحالات</option>
                        <option value="ACTIVE">⚡ المفتوحة والنشطة فقط</option>
                        <option value="PENDING">⏳ قيد الانتظار</option>
                        <option value="IN_PROGRESS">🛠️ قيد المعالجة</option>
                        <option value="CLOSED">✅ المغلقة والمكتملة</option>
                      </select>

                      {/* Reset Filters Button */}
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeptFilter('ALL');
                            setSelectedFlowFilter('ALL');
                            setSelectedBuildingFilter('ALL');
                            setSelectedStatusFilter('ALL');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                            color: isDark ? '#f87171' : '#dc2626',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            fontFamily: "'Cairo', sans-serif",
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2';
                          }}
                        >
                          <X size={12} strokeWidth={2.5} />
                          <span>إلغاء التصفية ({activeFiltersCount})</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

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
                  const filteredTickets = tickets.filter(t => {
                    const matchesSearch = !search || (
                      (t.subject || t.title || '').toLowerCase().includes(search.toLowerCase()) || 
                      t.id.toString().includes(search) || 
                      (t.creatorName || '').toLowerCase().includes(search.toLowerCase()) ||
                      (t.code || '').toLowerCase().includes(search.toLowerCase()) ||
                      (t.departmentName || '').toLowerCase().includes(search.toLowerCase())
                    );
                    const matchesDept = selectedDeptFilter === 'ALL' || t.targetDeptId === selectedDeptFilter || (t.creator as any)?.department?.id === selectedDeptFilter;
                    const matchesFlow = selectedFlowFilter === 'ALL' || t.flowDefinitionId === selectedFlowFilter;
                    const matchesBuilding = selectedBuildingFilter === 'ALL' || (t as any).creatorBuildingId === selectedBuildingFilter;
                    const sName = (t.state?.name || t.status || '').toUpperCase();
                    const matchesStatus = selectedStatusFilter === 'ALL' || (
                      selectedStatusFilter === 'ACTIVE' ? !['CLOSED', 'RESOLVED', 'COMPLETED', 'CANCELED', 'REJECTED'].includes(sName) :
                      selectedStatusFilter === 'CLOSED' ? ['CLOSED', 'RESOLVED', 'COMPLETED'].includes(sName) :
                      sName === selectedStatusFilter
                    );
                    return matchesSearch && matchesDept && matchesFlow && matchesBuilding && matchesStatus;
                  });

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
                            minHeight: isMobile ? '205px' : '235px',
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
                              {ticket.subTicketsSummary && ticket.subTicketsSummary.total > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSubTasksPopoverTicket(subTasksPopoverTicket?.id === ticket.id ? null : ticket);
                                  }}
                                  style={{
                                    background: isDark ? 'rgba(168, 85, 247, 0.25)' : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                                    color: isDark ? '#d8b4fe' : '#6b21a8',
                                    border: isDark ? '1px solid rgba(168, 85, 247, 0.45)' : '1px solid #d8b4fe',
                                    fontSize: '9.5px',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    boxShadow: ticket.subTicketsSummary.open > 0 ? '0 0 8px rgba(168, 85, 247, 0.35)' : 'none',
                                    transition: 'all 0.18s ease'
                                  }}
                                  title="انقر لاستعراض المهام الفرعية التابعة"
                                >
                                  <GitPullRequest size={10.5} />
                                  <span>📎 تذاكر فرعية ({ticket.subTicketsSummary.total}) • {ticket.subTicketsSummary.open} جارية</span>
                                </button>
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

                              {ticket.creatorBuilding && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <Building2 size={12} color="#f59e0b" style={{ flexShrink: 0 }} />
                                  <span>المبنى: {ticket.creatorBuilding}</span>
                                </div>
                              )}

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
                        /* ── 1. HORIZONTAL CAROUSEL / RAIL VIEW (Multi-row expandable track on desktop & mobile) ── */
                        <div className="ops-tickets-rail-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
                          {/* Right Arrow Button (RTL) - Desktop Only */}
                          {!isMobile && (
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
                          )}

                          {/* Left Arrow Button (RTL) - Desktop Only */}
                          {!isMobile && (
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
                          )}

                          {/* Top Rail Feed Info Bar */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '10px',
                            padding: '0 4px',
                            fontSize: isMobile ? '11px' : '11.5px',
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontFamily: "'Cairo', sans-serif",
                            flexWrap: 'wrap',
                            gap: '6px'
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
                              <span>{isMobile ? 'مرر أفقياً لتصفح البطاقات • استخدم الحافة السفلية لتمديد الصفوف' : 'شريط التذاكر المباشر • مرر بالأسهم أو اسحب بالماوس • انقر على أي تذكرة لفحصها'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '10.5px',
                                fontWeight: 800,
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
                              gridTemplateRows: `repeat(${railVisibleRows}, minmax(${isMobile ? '205px' : '215px'}, 1fr))`,
                              gridAutoFlow: 'column',
                              gridAutoColumns: isMobile ? 'min(295px, 82vw)' : '315px',
                              columnGap: isMobile ? '10px' : '16px',
                              rowGap: isMobile ? '10px' : '14px',
                              minHeight: `${railVisibleRows * (isMobile ? 215 : 225) + 30}px`,
                              transition: 'min-height 0.2s ease',
                              position: 'relative',
                            }}
                          >
                            <AnimatePresence>
                              {filteredTickets.map((ticket, i) => renderCinemaCard(ticket, i, true))}
                            </AnimatePresence>
                          </div>

                          {/* ═══ مقبض السحب الرأسي لتمديد أو تقليص عدد الصفوف (للهاتف والحاسوب) ═══ */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: isMobile ? '6px 14px' : '6px 12px',
                              borderRadius: '9999px',
                              backgroundColor: isDraggingHandle
                                ? (isDark ? '#1e293b' : '#e2e8f0')
                                : (isDark ? 'rgba(30, 41, 59, 0.85)' : 'rgba(241, 245, 249, 0.95)'),
                              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(19, 93, 121, 0.2)',
                              boxShadow: isDraggingHandle ? '0 0 16px rgba(2, 132, 199, 0.4)' : '0 2px 10px rgba(0,0,0,0.08)',
                              transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
                              userSelect: 'none',
                              margin: '6px auto 4px auto',
                              width: 'fit-content',
                              touchAction: 'none'
                            }}
                          >
                            {/* زر تقليل الصفوف (-) */}
                            <button
                              type="button"
                              onClick={() => handleSetRailRows(r => Math.max(1, r - 1))}
                              disabled={railVisibleRows <= 1}
                              title="تقليل عدد صفوف البطاقات (الحد الأدنى: 1 صف)"
                              style={{
                                width: isMobile ? '24px' : '20px',
                                height: isMobile ? '24px' : '20px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: railVisibleRows <= 1 ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.15)' : '#ffffff'),
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
                              <Minus size={13} strokeWidth={2.8} />
                            </button>

                            {/* مقبض السحب باللمس أو الماوس (Drag Bar) */}
                            <div
                              onPointerDown={handlePointerDownResize}
                              onPointerMove={handlePointerMoveResize}
                              onPointerUp={handlePointerUpResize}
                              onPointerCancel={handlePointerUpResize}
                              title="اسحب لأسفل لتمديد عدد الصفوف أو لأعلى للتقليل (من 1 إلى 7 صفوف)"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'ns-resize',
                                touchAction: 'none',
                                padding: '4px 8px',
                              }}
                            >
                              <div
                                style={{
                                  width: isMobile ? '48px' : '38px',
                                  height: '5px',
                                  borderRadius: '9999px',
                                  backgroundColor: isDraggingHandle
                                    ? '#0284c7'
                                    : (isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(19, 93, 121, 0.5)'),
                                  transition: 'background-color 0.15s ease',
                                }}
                              />
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: isDark ? '#cbd5e1' : '#334155',
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
                                width: isMobile ? '24px' : '20px',
                                height: isMobile ? '24px' : '20px',
                                borderRadius: '50%',
                                border: 'none',
                                backgroundColor: railVisibleRows >= 7 ? 'transparent' : (isDark ? 'rgba(255, 255, 255, 0.15)' : '#ffffff'),
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
                              <Plus size={13} strokeWidth={2.8} />
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
                              {!isMobile ? (
                                /* ── 2.A: DESKTOP TABLE VIEW (8 أعمدة كاملة) ── */
                                <div className="ops-tickets-table-wrapper" style={{
                                  border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                                  background: isDark ? 'rgba(15, 23, 42, 0.45)' : '#ffffff',
                                  backdropFilter: 'blur(16px)',
                                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.03)',
                                }}>
                                  <div className="ops-tickets-table-inner">
                                    {/* Table Header Strip (8 الأعمدة الكاملة) */}
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
                                                {ticket.subTicketsSummary && ticket.subTicketsSummary.total > 0 && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setSubTasksPopoverTicket(subTasksPopoverTicket?.id === ticket.id ? null : ticket);
                                                    }}
                                                    style={{
                                                      background: isDark ? 'rgba(168, 85, 247, 0.25)' : '#faf5ff',
                                                      color: isDark ? '#d8b4fe' : '#7e22ce',
                                                      border: isDark ? '1px solid rgba(168, 85, 247, 0.45)' : '1px solid #d8b4fe',
                                                      fontSize: '9.5px',
                                                      fontWeight: 800,
                                                      padding: '1px 6px',
                                                      borderRadius: '5px',
                                                      cursor: 'pointer',
                                                      display: 'inline-flex',
                                                      alignItems: 'center',
                                                      gap: '3px'
                                                    }}
                                                    title="انقر لاستعراض المهام الفرعية التابعة"
                                                  >
                                                    <GitPullRequest size={9.5} />
                                                    <span>تذاكر فرعية ({ticket.subTicketsSummary.total}) • {ticket.subTicketsSummary.open} جارية</span>
                                                  </button>
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
                              ) : (
                                /* ── 2.B: MOBILE COMPACT LIST VIEW (قائمة مدمجة فائقة التنظيم للهاتف ~52px) ── */
                                <div className="mobile-compact-list-view" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                          initial={{ opacity: 0, y: 6 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0 }}
                                          transition={{ delay: Math.min(i * 0.015, 0.12) }}
                                          onClick={() => setInspectTicket(ticket)}
                                          style={{
                                            background: inspectTicket?.id === ticket.id
                                              ? (isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(2, 132, 199, 0.08)')
                                              : (isDark ? 'rgba(15, 23, 42, 0.72)' : '#ffffff'),
                                            backdropFilter: 'blur(12px)',
                                            border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                                            borderRight: `4px solid ${accentColor}`,
                                            borderRadius: '12px',
                                            padding: '9px 12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: '8px',
                                            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.03)',
                                            transition: 'all 0.15s ease'
                                          }}
                                        >
                                          {/* Right: Code + Lamp */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                            <TicketCodeBadge code={ticketCode} color={accentColor} compact />
                                            <div
                                              style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                backgroundColor: lamp.color,
                                                boxShadow: `0 0 5px ${lamp.color}`,
                                                flexShrink: 0
                                              }}
                                              title={`أولوية طالب: ${lamp.label}`}
                                            />
                                          </div>

                                          {/* Center: Title & Requester */}
                                          <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                              fontSize: '12px',
                                              fontWeight: 800,
                                              color: isDark ? '#ffffff' : '#0f172a',
                                              fontFamily: "'Cairo', sans-serif",
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis'
                                            }}>
                                              {ticket.subject || ticket.title}
                                            </div>
                                            <div style={{
                                              fontSize: '10px',
                                              color: isDark ? '#94a3b8' : '#64748b',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis'
                                            }}>
                                              <span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155' }}>
                                                {ticket.creatorName || ticket.creator?.fullName || 'غير معروف'}
                                              </span>
                                              <span>•</span>
                                              <span>{ticket.flowDefinitionName || 'مسار عام'}</span>
                                            </div>
                                          </div>

                                          {/* Left: Status Pill + Time + Chevron */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                                            <OpsStatusPill status={ticket.status} stateLabel={ticket.state?.label} isDark={isDark} />
                                            <span style={{ fontSize: '9.5px', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>
                                              {timeAgoStr}
                                            </span>
                                            <ChevronLeft size={13} color="#94a3b8" />
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </AnimatePresence>
                                </div>
                              )}

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
            background: isDark ? 'rgba(3, 7, 18, 0.78)' : 'rgba(15, 23, 42, 0.62)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            zIndex: 100000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: isMobile ? 'flex-end' : 'center',
            padding: isMobile ? 0 : '16px',
            direction: 'rtl'
          }}>
            <motion.div
              initial={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.95, opacity: 0, y: 16 }}
              animate={isMobile ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%', opacity: 0 } : { scale: 0.95, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : '880px',
                background: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#f8fafc' : '#0f172a',
                borderRadius: isMobile ? '24px 24px 0 0' : '24px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                boxShadow: isDark
                  ? '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)'
                  : '0 25px 60px -15px rgba(15,23,42,0.22), 0 0 0 1px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: isMobile ? '94vh' : '90vh',
                height: isMobile ? '94vh' : 'auto',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {/* Drag indicator for mobile bottom sheet */}
              {isMobile && (
                <div style={{
                  width: '42px',
                  height: '4.5px',
                  borderRadius: '9999px',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                  margin: '8px auto 2px auto',
                  flexShrink: 0
                }} />
              )}
              {/* Modal Top Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark
                  ? 'linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.9) 100%)'
                  : 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, flex: 1 }}>
                  {/* Badges Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div style={{
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: isDark ? 'rgba(99, 102, 241, 0.18)' : '#e0e7ff',
                      color: isDark ? '#a5b4fc' : '#4338ca',
                      fontSize: '12px',
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      fontFamily: "'Cairo', sans-serif"
                    }}>
                      #{inspectTicket.code || inspectTicket.id}
                    </div>

                    <span style={{ fontSize: '11px', color: isDark ? '#64748b' : '#94a3b8' }}>•</span>

                    <span style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: isDark ? '#cbd5e1' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <Layers size={13} color="#6366f1" />
                      {inspectTicket.flowDefinitionName || 'مسار عام'}
                    </span>

                    {/* Dual Priority Badge */}
                    {(() => {
                      const lamp = getLampStyle(inspectTicket.businessPriority || inspectTicket.priority);
                      return (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isDark ? 'rgba(255,255,255,0.06)' : lamp.bg,
                          color: lamp.color,
                          fontSize: '11px',
                          fontWeight: 800
                        }}>
                          <span style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: lamp.color,
                            boxShadow: `0 0 6px ${lamp.color}`,
                            display: 'inline-block'
                          }} />
                          <span>{formatPriorityText(inspectTicket.businessPriority || inspectTicket.priority)}</span>
                        </div>
                      );
                    })()}

                    {/* Status Pill */}
                    <OpsStatusPill
                      status={inspectTicket.status || inspectTicketDetails?.state?.name}
                      stateLabel={inspectTicket.state?.label || inspectTicketDetails?.state?.label}
                      isDark={isDark}
                    />
                  </div>

                  {/* Main Subject Title */}
                  <h2 style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: 800,
                    color: isDark ? '#ffffff' : '#0f172a',
                    lineHeight: 1.4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {inspectTicket.subject || inspectTicket.title}
                  </h2>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setInspectTicket(null)}
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isDark ? '#cbd5e1' : '#64748b',
                    transition: 'all 0.15s ease',
                    flexShrink: 0
                  }}
                  title="إغلاق النافذة"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sub-tabs: Details vs Audit History (Apple/Linear Segmented Style) */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 24px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9',
                background: isDark ? '#0f1218' : '#f8fafc'
              }}>
                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('DETAILS')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeDrawerTab === 'DETAILS'
                      ? (isDark ? 'rgba(99, 102, 241, 0.18)' : '#ffffff')
                      : 'transparent',
                    color: activeDrawerTab === 'DETAILS'
                      ? (isDark ? '#a5b4fc' : '#4338ca')
                      : (isDark ? '#94a3b8' : '#64748b'),
                    fontWeight: activeDrawerTab === 'DETAILS' ? 800 : 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: activeDrawerTab === 'DETAILS' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <FileText size={14} /> تفاصيل وبيانات المعاملة
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDrawerTab('HISTORY')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeDrawerTab === 'HISTORY'
                      ? (isDark ? 'rgba(99, 102, 241, 0.18)' : '#ffffff')
                      : 'transparent',
                    color: activeDrawerTab === 'HISTORY'
                      ? (isDark ? '#a5b4fc' : '#4338ca')
                      : (isDark ? '#94a3b8' : '#64748b'),
                    fontWeight: activeDrawerTab === 'HISTORY' ? 800 : 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: activeDrawerTab === 'HISTORY' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <History size={14} /> سجل العمليات والتتبع ({inspectTicketDetails?.logs?.length || 0})
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                {loadingTicketDetails ? (
                  <div style={{ padding: '60px 0', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <RefreshCw size={24} className="animate-spin text-indigo-600" />
                    <span>جاري تحميل أحدث البيانات والخصائص...</span>
                  </div>
                ) : activeDrawerTab === 'DETAILS' ? (
                  <>
                    {/* Strategic Claim Ticket Hero Banner (Sole Hero Claim Button) */}
                    {(!inspectTicket.assignedTo || inspectTicket.isUnassigned !== false) && (
                      <div style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.16) 0%, rgba(5, 150, 105, 0.08) 100%)'
                          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.06) 100%)',
                        border: '1.5px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '16px',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        flexWrap: 'wrap',
                        boxShadow: '0 4px 16px rgba(16, 185, 129, 0.1)'
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
                            flexShrink: 0
                          }}>
                            <Zap size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '15px', color: isDark ? '#34d399' : '#065f46' }}>
                              هذا الطلب شاغر حالياً في حوض العمليات العام
                            </div>
                            <div style={{ fontSize: '12.5px', color: isDark ? '#a7f3d0' : '#047857', marginTop: '2px' }}>
                              يمكنك استلام وسحب هذه المعاملة لحسابك لمباشرة التنفيذ والمعالجة الفنية.
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
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
                            fontFamily: "'Cairo', sans-serif"
                          }}
                        >
                          {claimingId === inspectTicket.id ? (
                            <><RefreshCw size={15} className="animate-spin" /> جاري السحب...</>
                          ) : (
                            <><CheckCircle2 size={16} /> استلام وسحب المعاملة لحسابي</>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Handover Acceptance Banner */}
                    {inspectTicketDetails?.isPendingHandover && inspectTicketDetails?.handoverInfo?.toUserId === user?.id && (
                      <div style={{
                        background: isDark
                          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.08) 100%)'
                          : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        border: '1.5px solid #f59e0b',
                        borderRadius: '16px',
                        padding: '16px 20px',
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
                              <div style={{ fontWeight: 800, fontSize: '15px', color: isDark ? '#fbbf24' : '#92400e' }}>
                                طلب تحويل معلق وارد إليك 📥
                              </div>
                              <div style={{ fontSize: '13px', color: isDark ? '#fde68a' : '#78350f', marginTop: '2px' }}>
                                قام الزميل <span style={{ fontWeight: 700 }}>{inspectTicketDetails.handoverInfo.fromUserName}</span> بتحويل هذه التذكرة إليك
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
                            background: isDark ? 'rgba(0,0,0,0.2)' : '#ffffff',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            fontSize: '13px',
                            color: isDark ? '#fef3c7' : '#451a03'
                          }}>
                            <span style={{ fontWeight: 700 }}>ملاحظة المحوّل: </span>
                            {inspectTicketDetails.handoverInfo.note}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
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
                              fontSize: '13px',
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
                            type="button"
                            onClick={handleOpenRejectHandoverModal}
                            disabled={isExecutingAction}
                            style={{
                              padding: '11px 18px',
                              borderRadius: '12px',
                              border: '1px solid #fca5a5',
                              background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#ffffff',
                              color: '#b91c1c',
                              fontWeight: 700,
                              fontSize: '13px',
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
                        background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '14px',
                        padding: '12px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '13px',
                        color: isDark ? '#fbbf24' : '#92400e'
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
                        background: isDark ? 'rgba(245, 158, 11, 0.12)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        <div style={{ padding: '6px', borderRadius: '8px', background: '#fef08a', color: '#854d0e' }}>
                          <AlertTriangle size={18} />
                        </div>
                        <div style={{ flex: 1, fontSize: '13px', color: isDark ? '#fde68a' : '#92400e', lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 800, marginBottom: '2px' }}>التذكرة منجزة وفي انتظار اعتماد الإغلاق النهائي</div>
                          قام المهندس المعني بإنهاء المعالجة ورفع طلب الاعتماد للمراجعة والموافقة النهائية من قبل مدير المسار أو المعتمدين.
                        </div>
                      </div>
                    )}

                    {inspectTicketDetails?.state?.name === 'CLOSED' && (
                      <div style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.12)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '16px',
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <CheckCircle size={20} color="#15803d" />
                        <div style={{ fontSize: '13px', color: isDark ? '#6ee7b7' : '#166534', fontWeight: 700 }}>
                          تم إغلاق هذه التذكرة نهائياً واستكمال جميع متطلبات الإنجاز والمعالجة الفنية.
                        </div>
                      </div>
                    )}

                    {/* ── 1. Parties & Routing Bento Card ── */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px',
                      background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                      padding: '16px',
                      borderRadius: '16px',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0'
                    }}>
                      {/* Creator */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                          المُرسل (صاحب المعاملة)
                        </span>
                        <div style={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={14} color="#6366f1" />
                          <span>{inspectTicketDetails?.creator?.fullName || inspectTicket.creatorName || inspectTicket.creator?.fullName || 'صاحب المعاملة'}</span>
                        </div>
                      </div>

                      {/* Responsible Department */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                          الجهة المختصة بالمعالجة
                        </span>
                        <div style={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={14} color="#0284c7" />
                          <span>
                            {inspectTicketDetails?.departmentObj?.name || inspectTicket.departmentName || 'الإدارة العامة'}
                            {inspectTicket.targetDivisionName ? ` • ${inspectTicket.targetDivisionName}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Current Assignee */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                          المسؤول الحالي (المسند إليه)
                        </span>
                        <div style={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {(!inspectTicket.assignedTo || inspectTicket.isUnassigned !== false) ? (
                            <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
                              شاغر (حوض العمليات)
                            </span>
                          ) : (
                            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                              {inspectTicketDetails?.assignments?.find((a: any) => a.isCurrentActive)?.assignedTech?.fullName || inspectTicket.assignedTo?.fullName || 'مهندس مكلف'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Creation Time & Elapsed */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11.5px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                          التوقيت والمدة المنقضية
                        </span>
                        <div style={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={14} color="#64748b" />
                          <span>{new Date(inspectTicket.createdAt).toLocaleString('ar-LY', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          <span style={{ fontSize: '11px', color: isDark ? '#38bdf8' : '#2563eb', background: isDark ? 'rgba(56,189,248,0.1)' : '#eff6ff', padding: '1px 6px', borderRadius: '4px' }}>
                            {formatTimeAgo(inspectTicket.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── 1.5 Technical Asset & Inventory Linkage Bento Card ── */}
                    {(() => {
                      const curAssetId = inspectTicketDetails?.assetId || inspectTicket.assetId;
                      const curAssetName = inspectTicketDetails?.assetName || inspectTicket.assetName;
                      const curAssetCategory = inspectTicketDetails?.assetCategory || inspectTicket.assetCategory;
                      const isLocked = inspectTicketDetails?.assetResolutionLocked ?? inspectTicket.assetResolutionLocked;
                      const isUnable = inspectTicketDetails?.isUserUnableToIdentify ?? inspectTicket.isUserUnableToIdentify;
                      const isUnregistered = inspectTicketDetails?.isUnregisteredAsset ?? inspectTicket.isUnregisteredAsset;
                      const isInternal = inspectTicketDetails?.isInternalRequest ?? inspectTicket.isInternalRequest;
                      const internalScope = inspectTicketDetails?.internalScope || inspectTicket.internalScope;

                      return (
                        <div style={{
                          background: isLocked 
                            ? (isDark ? 'rgba(239, 68, 68, 0.08)' : 'rgba(254, 242, 242, 0.8)')
                            : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
                          border: isLocked 
                            ? (isDark ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid #fca5a5')
                            : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                          borderRadius: '16px',
                          padding: '16px 18px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          boxShadow: isLocked ? '0 4px 16px rgba(239, 68, 68, 0.08)' : 'none',
                          transition: 'all 0.2s ease'
                        }}>
                          {/* Card Header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '30px', height: '30px', borderRadius: '8px',
                                background: isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(19, 93, 121, 0.15)',
                                color: isLocked ? '#ef4444' : '#135d79',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                              }}>
                                <Laptop size={17} />
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                                  جرد الأجهزة والربط الفني (Asset Linkage):
                                </h4>
                                <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b' }}>
                                  التحقق التبادلي المعتمد مع قاعدة بيانات الأصول المركزية
                                </span>
                              </div>
                            </div>

                            {/* Badges */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              {isInternal && (
                                <span style={{
                                  fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                                  background: 'rgba(243, 108, 33, 0.12)', color: '#f36c21', border: '1px solid rgba(243, 108, 33, 0.3)'
                                }}>
                                  طلب داخلي ({internalScope === 'CROSS_DEPT' ? 'عابر للإدارات' : internalScope === 'DEPARTMENT' ? 'قسم' : 'فريق'})
                                </span>
                              )}
                              {isLocked ? (
                                <span style={{
                                  fontSize: '11px', fontWeight: 800, padding: '3px 9px', borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                  <Lock size={12} />
                                  قيد الإغلاق مفعل (يتطلب تدقيق)
                                </span>
                              ) : curAssetId ? (
                                <span style={{
                                  fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                                  background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)',
                                  display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                  <ShieldCheck size={13} />
                                  أصل معتمد وموثق
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Lock Warning Banner */}
                          {isLocked && (
                            <div style={{
                              background: isDark ? 'rgba(239, 68, 68, 0.12)' : '#fff1f2',
                              border: '1px dashed #ef4444',
                              borderRadius: '10px',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '12px',
                              color: isDark ? '#fca5a5' : '#991b1b',
                              lineHeight: 1.5
                            }}>
                              <AlertTriangle size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
                              <div>
                                <strong>تنبيه قيد الإغلاق (Gated Resolution Lock):</strong> هذه التذكرة مقفلة برمجياً لمنع التجاوز. لا يمكن للجهة الفنية إنهاء أو اعتماد إغلاق التذكرة إلا بعد تدقيق الجهاز وربط الأصل الحقيقي.
                              </div>
                            </div>
                          )}

                          {/* Asset Details Grid */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '10px',
                            background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                            padding: '12px',
                            borderRadius: '10px'
                          }}>
                            <div>
                              <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '2px' }}>
                                اسم / طراز الجهاز:
                              </span>
                              <strong style={{ fontSize: '13px', color: isDark ? '#f8fafc' : '#0f172a' }}>
                                {curAssetName || (isUnable ? 'غير محدد (الموظف لا يعرف)' : isUnregistered ? 'جهاز جديد غير مسجل' : 'لم يُربط بعد')}
                              </strong>
                            </div>

                            <div>
                              <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '2px' }}>
                                رقم الأصل (Asset Tag / ID):
                              </span>
                              <strong style={{ fontSize: '13px', color: curAssetId ? '#0284c7' : '#64748b', direction: 'ltr', display: 'inline-block' }}>
                                {curAssetId || '—'}
                              </strong>
                            </div>

                            <div>
                              <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', display: 'block', marginBottom: '2px' }}>
                                تصنيف الجهاز:
                              </span>
                              <strong style={{ fontSize: '12.5px', color: isDark ? '#cbd5e1' : '#334155' }}>
                                {curAssetCategory || 'معدات تقنية'}
                              </strong>
                            </div>
                          </div>

                          {/* Requester Asset Flag Notes */}
                          {(isUnable || isUnregistered) && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {isUnable && (
                                <span style={{ fontSize: '11.5px', color: '#ea580c', background: 'rgba(234, 88, 12, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                                  ℹ️ صاحب الطلب أشار: لا يعرف نوع الجهاز أو غير مؤهل لتحديده
                                </span>
                              )}
                              {isUnregistered && (
                                <span style={{ fontSize: '11.5px', color: '#0284c7', background: 'rgba(2, 132, 199, 0.1)', padding: '3px 8px', borderRadius: '6px' }}>
                                  ℹ️ صاحب الطلب أشار: الجهاز تم تركيبه حديثاً أو غير مسجل في الجرد
                                </span>
                              )}
                            </div>
                          )}

                          {/* Action Buttons for Engineers */}
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: '4px' }}>
                            {curAssetId && (
                              <button
                                type="button"
                                onClick={() => handleOpenAssetHistory(curAssetId, curAssetName || curAssetId)}
                                style={{
                                  padding: '7px 12px',
                                  borderRadius: '8px',
                                  border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                                  color: isDark ? '#f8fafc' : '#334155',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <History size={13} />
                                <span>سجل الصيانة التاريخي للأصل</span>
                              </button>
                            )}

                            {/* Register New Asset Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setRegisterAssetTicket(inspectTicket);
                                setIsRegisterAssetModalOpen(true);
                              }}
                              title="تسجيل جهاز جديد كلياً في منظومة الجرد وربطه بالتذكرة وفك قيد الإغلاق"
                              style={{
                                padding: '7px 13px',
                                borderRadius: '8px',
                                border: '1px solid rgba(243, 108, 33, 0.4)',
                                background: isDark ? 'rgba(243, 108, 33, 0.15)' : '#fff7ed',
                                color: '#f36c21',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <PlusCircle size={13} />
                              <span>تسجيل أصل جديد في المنظومة</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setLinkAssetTicket(inspectTicket);
                                setIsLinkAssetModalOpen(true);
                              }}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isLocked
                                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                  : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                color: '#ffffff',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: isLocked
                                  ? '0 2px 8px rgba(239, 68, 68, 0.3)'
                                  : '0 2px 8px rgba(2, 132, 199, 0.3)'
                              }}
                            >
                              {isLocked ? <Unlock size={13} /> : <Laptop size={13} />}
                              <span>{isLocked ? 'ربط وتدقيق الأصل وفك القيد' : 'تحديث ربط الأصل'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Resolution Notes Box (If present) */}
                    {(inspectTicketDetails?.resolutionNotes || inspectTicket.resolutionNotes) && (
                      <div style={{
                        background: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ffffff',
                        border: '1.5px solid #10b981',
                        borderRadius: '16px',
                        padding: '16px',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#10b981', fontWeight: 800, fontSize: '13.5px' }}>
                          <FileCheck size={18} />
                          <span>تقرير الإنجاز والمعالجة الفنية المعتمد:</span>
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: isDark ? '#e2e8f0' : '#1e293b',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          background: isDark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                          padding: '12px 14px',
                          borderRadius: '10px'
                        }}>
                          {inspectTicketDetails?.resolutionNotes || inspectTicket.resolutionNotes}
                        </div>
                      </div>
                    )}

                    {/* ── 2. Request Content & Clean Form Fields Bento Card ── */}
                    <div style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}>
                      <div>
                        <h4 style={{ margin: '0 0 8px', fontSize: '13.5px', fontWeight: 800, color: isDark ? '#f8fafc' : '#1e293b' }}>
                          تفاصيل ومحتوى الطلب:
                        </h4>
                        <div style={{
                          padding: '14px 16px',
                          borderRadius: '12px',
                          background: isDark ? '#0f1218' : '#f8fafc',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                          lineHeight: 1.7,
                          color: isDark ? '#cbd5e1' : '#334155',
                          fontSize: '13px',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {inspectTicketDetails?.description || inspectTicket.description || 'لا يوجد وصف مدخل لهذا الطلب.'}
                        </div>
                      </div>

                      {/* Clean Form Fields (No debug labels, no raw junk) */}
                      {(() => {
                        const rawMeta = inspectTicketDetails?.routingMetadata || inspectTicket?.routingMetadata;
                        let resolvedMeta: any = {};
                        if (rawMeta) {
                          resolvedMeta = typeof rawMeta === 'object' ? rawMeta : (() => {
                            try { return JSON.parse(rawMeta); } catch { return {}; }
                          })();
                        }
                        const fieldsData = resolvedMeta.formData || resolvedMeta.dynamicFields || resolvedMeta.fields || {};
                        
                        const ignoredKeys = [
                          'submittedAt', 'targetDepartmentName', 'targetDivisionName', 'targetTeamName',
                          'attachment', 'attachments', 'targetDepartmentId', 'targetDivisionId',
                          'targetTeamId', 'flowDefinitionId', 'internalStatus', 'schemaVersion',
                          '_id', 'id', 'token'
                        ];

                        const fieldEntries = Object.entries(fieldsData).filter(([k, v]) => {
                          if (v === null || v === undefined || v === '') return false;
                          if (ignoredKeys.includes(k) || k.startsWith('_')) return false;
                          return true;
                        });

                        const getCleanLabel = (key: string): string => {
                          const dictionary: Record<string, string> = {
                            taxonomyMain: 'التصنيف الرئيسي',
                            taxonomySub: 'الخدمة / المشكلة الفرعية',
                            building: 'المبنى والموقع',
                            buildingId: 'المبنى',
                            department: 'الإدارة المعنية بالطلب',
                            division: 'القسم المؤسسي',
                            team: 'الفريق / الوحدة',
                            scheduleEngine: 'فترة السريان والجدولة',
                            dateRange: 'الفترة الزمنية المحددة',
                            delegateUser: 'الموظف البديل المكلف',
                            notes: 'الملاحظات الإضافية',
                            reason: 'سبب ومبرر الطلب',
                            applicantPhone: 'رقم هاتف التواصل',
                            applicantEmail: 'البريد الإلكتروني',
                            urgencyLevel: 'درجة الاستعجال',
                            impactLevel: 'مستوى الأثر'
                          };
                          if (dictionary[key]) return dictionary[key];

                          let clean = key
                            .replace(/^(dyn_|custom_|opt_input_|opt_|fld_|form_|sys_)/i, '')
                            .replace(/_/g, ' ')
                            .trim();
                          clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
                          return clean.charAt(0).toUpperCase() + clean.slice(1);
                        };

                        const formatFieldValue = (val: any): string => {
                          if (typeof val === 'boolean') return val ? 'نعم' : 'لا';
                          if (Array.isArray(val)) return val.join('، ');
                          if (typeof val === 'object') {
                            try { return JSON.stringify(val); } catch { return String(val); }
                          }
                          return String(val);
                        };

                        if (fieldEntries.length === 0) return null;

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 800, color: isDark ? '#94a3b8' : '#475569' }}>
                                بيانات المسار المدخلة:
                              </span>
                              <span style={{ fontSize: '11px', color: '#64748b' }}>
                                {fieldEntries.length} حقول
                              </span>
                            </div>

                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                              gap: '10px'
                            }}>
                              {fieldEntries.map(([key, val]: any) => (
                                <div
                                  key={key}
                                  style={{
                                    padding: '9px 12px',
                                    borderRadius: '10px',
                                    background: isDark ? '#0f1218' : '#f8fafc',
                                    border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '3px'
                                  }}
                                >
                                  <span style={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                                    {getCleanLabel(key)}
                                  </span>
                                  <span style={{ fontSize: '12.5px', color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 700, wordBreak: 'break-word' }}>
                                    {formatFieldValue(val)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* ── 3. Official Attachments & Documents Bento Card ── */}
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
                          background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
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
                              <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                                المرفقات والوثائق الرسمية ({combinedFiles.length}):
                              </h4>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                              {combinedFiles.length > 0 ? 'مستندات معتمدة' : 'لا توجد مرفقات'}
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
                                      padding: '9px 12px',
                                      borderRadius: '10px',
                                      background: isDark ? '#0f1218' : '#f8fafc',
                                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                                      gap: '12px'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                      <div style={{
                                        width: '30px', height: '30px', borderRadius: '8px',
                                        background: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                                        color: isDark ? '#38bdf8' : '#2563eb',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        <FileText size={16} />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                        <span style={{
                                          fontSize: '12.5px', fontWeight: 700,
                                          color: isDark ? '#ffffff' : '#0f172a',
                                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                          maxWidth: '320px'
                                        }}>
                                          {fName}
                                        </span>
                                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                                          {fSize && `${fSize} • `}مرفوع بواسطة: {file.uploadedBy?.fullName || inspectTicket.creatorName || 'صاحب المعاملة'}
                                        </span>
                                      </div>
                                    </div>

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
                                          padding: '5px 12px', borderRadius: '8px',
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
                                );
                              })}
                            </div>
                          ) : (
                            <div style={{
                              padding: '12px', borderRadius: '10px',
                              background: isDark ? 'rgba(255, 255, 255, 0.01)' : '#f8fafc',
                              border: isDark ? '1px dashed rgba(255, 255, 255, 0.06)' : '1px dashed #e2e8f0',
                              textAlign: 'center', color: '#94a3b8', fontSize: '12px'
                            }}>
                              لا توجد وثائق مرفقة مع هذه المعاملة.
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── 4. Sub-Tickets & Internal Tasks Bento Card ── */}
                    <div style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '16px 18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '6px', borderRadius: '8px', background: isDark ? 'rgba(126, 34, 206, 0.2)' : '#f3e8ff', color: '#a855f7' }}>
                            <GitPullRequest size={16} />
                          </div>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                              المهام والتذاكر الداخلية الفرعية المرتبطة
                            </h4>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                              توزيع أجزاء من العمل على الإدارات والفرق التشغيلية
                            </div>
                          </div>
                        </div>

                        {/* Single Contextual Trigger for Sub-Tickets */}
                        {inspectPermissions?.canCreateSubTickets !== false && inspectTicketDetails?.state?.name !== 'CLOSED' && (
                          <button
                            type="button"
                            onClick={openSubTicketModal}
                            style={{
                              padding: '7px 14px',
                              borderRadius: '10px',
                              border: 'none',
                              background: 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)',
                              color: '#ffffff',
                              fontWeight: 700,
                              fontSize: '12px',
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

                      {/* Sub-tickets Progress Bar & List */}
                      {Array.isArray(inspectTicketDetails?.subTickets) && inspectTicketDetails.subTickets.length > 0 ? (
                        <>
                          <div style={{
                            background: isDark ? '#0f1218' : '#f8fafc',
                            borderRadius: '10px',
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '12px'
                          }}>
                            <span style={{ fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569' }}>
                              نسبة إنجاز المهام: {inspectTicketDetails.subTickets.filter((s: any) => s.state?.name === 'CLOSED' || s.status === 'CLOSED').length} من {inspectTicketDetails.subTickets.length} مكتملة
                            </span>
                            <div style={{ width: '120px', height: '6px', background: isDark ? '#1e293b' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${Math.round((inspectTicketDetails.subTickets.filter((s: any) => s.state?.name === 'CLOSED' || s.status === 'CLOSED').length / inspectTicketDetails.subTickets.length) * 100)}%`,
                                height: '100%',
                                background: '#10b981',
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }} />
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {inspectTicketDetails.subTickets.map((st: any) => (
                              <div key={st.id} style={{
                                padding: '10px 12px',
                                borderRadius: '10px',
                                background: isDark ? '#0f1218' : '#f8fafc',
                                border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px'
                              }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#a855f7' }}>#{st.id}</span>
                                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: isDark ? '#f8fafc' : '#1e293b' }}>{st.subject || st.title}</span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', gap: '8px' }}>
                                    <span>الجهة: {st.departmentObj?.name || st.departmentName || 'إدارة تشغيلية'}</span>
                                    {st.assignments?.[0]?.assignedTech && (
                                      <span>• المكلف: {st.assignments[0].assignedTech.fullName}</span>
                                    )}
                                  </div>
                                </div>

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
                            ))}
                          </div>
                        </>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '14px',
                          color: '#94a3b8',
                          fontSize: '12px',
                          background: isDark ? 'rgba(255, 255, 255, 0.01)' : '#f8fafc',
                          borderRadius: '10px',
                          border: isDark ? '1px dashed rgba(255, 255, 255, 0.06)' : '1px dashed #cbd5e1'
                        }}>
                          لم يتم إسناد مهام فرعية لهذه المعاملة بعد.
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

              {/* Modal Footer Actions - ITIL Operational Action Bar (Unified & Decluttered) */}
              <div style={{
                padding: isMobile ? '12px 14px' : '14px 24px',
                borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0',
                background: isDark ? '#0f1218' : '#f8fafc',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                position: isMobile ? 'sticky' : 'relative',
                bottom: 0,
                zIndex: 10
              }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Notice if ticket is unassigned: hero claim button already exists in top banner */}
                  {(!inspectTicket.assignedTo || inspectTicket.isUnassigned !== false) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                      <Zap size={14} />
                      <span>معاملة شاغرة في حوض العمليات العام (استلمها من البنر العلوي)</span>
                    </div>
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

                  {/* Action 5: Add Note */}
                  {inspectPermissions?.canAddInternalComment && (
                    <button
                      type="button"
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
                        padding: '9px 14px',
                        borderRadius: '10px',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                        background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                        color: isDark ? '#cbd5e1' : '#475569',
                        fontWeight: 600,
                        fontSize: '12.5px',
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
                      type="button"
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
                        padding: '9px 16px',
                        borderRadius: '10px',
                        border: '1px solid #93c5fd',
                        background: isDark ? 'rgba(37, 99, 235, 0.15)' : '#eff6ff',
                        color: isDark ? '#93c5fd' : '#1d4ed8',
                        fontWeight: 700,
                        fontSize: '12.5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <RotateCcw size={14} /> إعادة فتح التذكرة
                    </button>
                  )}
                </div>

                {/* Dismiss Modal */}
                <button
                  type="button"
                  onClick={() => setInspectTicket(null)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                    background: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                    color: isDark ? '#cbd5e1' : '#64748b',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
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




      {/* Link Asset Modal */}
      {isLinkAssetModalOpen && linkAssetTicket && (
        <LinkAssetModal
          isOpen={isLinkAssetModalOpen}
          ticketId={linkAssetTicket.id}
          ticketTitle={linkAssetTicket.title || linkAssetTicket.subject || `تذكرة #${linkAssetTicket.id}`}
          isDark={isDark}
          onClose={() => {
            setIsLinkAssetModalOpen(false);
            setLinkAssetTicket(null);
          }}
          onSuccess={() => {
            fetchData();
            if (inspectTicket && inspectTicket.id === linkAssetTicket.id) {
              OpsAPI.getTicketDetails(inspectTicket.id).then(res => {
                if (res.success && res.data) {
                  setInspectTicketDetails(res.data);
                  setInspectTicket(prev => prev ? { ...prev, ...res.data, assetResolutionLocked: false } : null);
                }
              });
            }
            setIsLinkAssetModalOpen(false);
            setLinkAssetTicket(null);
          }}
        />
      )}

      {/* Unlinked Assets Ledger Modal */}
      {isUnlinkedLedgerModalOpen && (
        <UnlinkedAssetsLedgerModal
          isOpen={isUnlinkedLedgerModalOpen}
          isDark={isDark}
          onClose={() => setIsUnlinkedLedgerModalOpen(false)}
          onSelectTicketToLink={(t) => {
            setIsUnlinkedLedgerModalOpen(false);
            const target = tickets.find(item => item.id === t.id);
            if (target) {
              setInspectTicket(target);
            } else {
              OpsAPI.getTicketDetails(t.id).then(res => {
                if (res.success && res.data) {
                  setInspectTicket(res.data);
                }
              });
            }
            setLinkAssetTicket(t);
            setIsLinkAssetModalOpen(true);
          }}
        />
      )}

      {/* Standalone Internal Ticket Modal */}
      {isStandaloneInternalModalOpen && (
        <StandaloneInternalTicketModal
          isOpen={isStandaloneInternalModalOpen}
          departments={departments}
          isDark={isDark}
          onClose={() => setIsStandaloneInternalModalOpen(false)}
          onSuccess={() => {
            setIsStandaloneInternalModalOpen(false);
            fetchData();
          }}
        />
      )}

      {/* Asset Maintenance History Modal */}
      {assetHistoryModal.isOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '640px', maxHeight: '85vh',
            background: isDark ? '#0f172a' : '#ffffff',
            borderRadius: '20px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
            direction: 'rtl'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: 'rgba(2, 132, 199, 0.15)', color: '#0284c7',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <History size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                    سجل الصيانة التاريخي للأصل ({assetHistoryModal.assetId})
                  </h3>
                  <span style={{ fontSize: '12px', color: isDark ? '#94a3b8' : '#64748b' }}>
                    {assetHistoryModal.assetName} • جميع التدخلات الفنية المعتمدة
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAssetHistoryModal(prev => ({ ...prev, isOpen: false }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Privacy Toggle Bar */}
            <div style={{
              padding: '10px 24px',
              background: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12.5px', color: isDark ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={assetHistoryModal.hideTech}
                  onChange={e => handleOpenAssetHistory(assetHistoryModal.assetId, assetHistoryModal.assetName, e.target.checked)}
                />
                <span>حجب اسم الفني (معايير الخصوصية للمنظومة)</span>
              </label>
              <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 700 }}>
                {assetHistoryModal.history.length} عمليات سابقة
              </span>
            </div>

            {/* History Content */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assetHistoryModal.isLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                  <span>جاري استرجاع سجل الصيانة من قاعدة البيانات...</span>
                </div>
              ) : assetHistoryModal.history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <span>لا توجد عمليات صيانة سابقة مسجلة لهذا الأصل في المنظومة.</span>
                </div>
              ) : (
                assetHistoryModal.history.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                      border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                        #{item.ticketId} — {item.title}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {item.closedAt ? new Date(item.closedAt).toLocaleDateString('ar-LY') : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: isDark ? '#cbd5e1' : '#334155', lineHeight: 1.6, background: isDark ? 'rgba(0,0,0,0.2)' : '#ffffff', padding: '8px 10px', borderRadius: '8px' }}>
                      {item.resolutionNotes}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748b' }}>
                      <span>الفني القائم بالعمل: <strong>{item.technician}</strong></span>
                      {item.rating && <span>التقييم: ⭐ {item.rating}/5</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 7. NEW MODALS: LINK ASSET, UNLINKED ASSETS LEDGER, STANDALONE INTERNAL TICKET ═══ */}
      {isLinkAssetModalOpen && linkAssetTicket && (
        <LinkAssetModal
          isOpen={isLinkAssetModalOpen}
          ticketId={linkAssetTicket.id}
          ticketTitle={linkAssetTicket.title || linkAssetTicket.subject || `REQ-${linkAssetTicket.id}`}
          isDark={isDark}
          onClose={() => {
            setIsLinkAssetModalOpen(false);
            setLinkAssetTicket(null);
          }}
          onSuccess={(updatedTicket) => {
            setIsLinkAssetModalOpen(false);
            setLinkAssetTicket(null);
            fetchData();
            if (inspectTicket && inspectTicket.id === updatedTicket?.id) {
              setInspectTicket((prev: any) => ({
                ...prev,
                assetId: updatedTicket.assetId,
                assetName: updatedTicket.assetName,
                assetCategory: updatedTicket.assetCategory,
                assetResolutionLocked: false
              }));
              if (inspectTicketDetails) {
                setInspectTicketDetails((prev: any) => ({
                  ...prev,
                  assetId: updatedTicket.assetId,
                  assetName: updatedTicket.assetName,
                  assetCategory: updatedTicket.assetCategory,
                  assetResolutionLocked: false
                }));
              }
            }
          }}
        />
      )}

      {isUnlinkedLedgerModalOpen && (
        <UnlinkedAssetsLedgerModal
          isOpen={isUnlinkedLedgerModalOpen}
          isDark={isDark}
          onClose={() => setIsUnlinkedLedgerModalOpen(false)}
          onSelectTicketToLink={(ticket) => {
            setIsUnlinkedLedgerModalOpen(false);
            setLinkAssetTicket(ticket);
            setIsLinkAssetModalOpen(true);
          }}
        />
      )}

      {isStandaloneInternalModalOpen && (
        <StandaloneInternalTicketModal
          isOpen={isStandaloneInternalModalOpen}
          departments={departments}
          isDark={isDark}
          onClose={() => setIsStandaloneInternalModalOpen(false)}
          onSuccess={() => {
            setIsStandaloneInternalModalOpen(false);
            fetchData();
          }}
        />
      )}

      {isRegisterAssetModalOpen && (
        <RegisterAssetModal
          isOpen={isRegisterAssetModalOpen}
          ticket={registerAssetTicket}
          isDark={isDark}
          onClose={() => {
            setIsRegisterAssetModalOpen(false);
            setRegisterAssetTicket(null);
          }}
          onSuccess={(newAsset, updatedTicket) => {
            setIsRegisterAssetModalOpen(false);
            setRegisterAssetTicket(null);
            fetchData();
            if (inspectTicket && inspectTicket.id === updatedTicket?.id) {
              setInspectTicket((prev: any) => ({
                ...prev,
                assetId: updatedTicket.assetId,
                assetName: updatedTicket.assetName,
                assetCategory: updatedTicket.assetCategory,
                assetResolutionLocked: false,
                isUnregisteredAsset: false
              }));
              if (inspectTicketDetails) {
                setInspectTicketDetails((prev: any) => ({
                  ...prev,
                  assetId: updatedTicket.assetId,
                  assetName: updatedTicket.assetName,
                  assetCategory: updatedTicket.assetCategory,
                  assetResolutionLocked: false,
                  isUnregisteredAsset: false
                }));
              }
            }
          }}
        />
      )}
      {/* ═══ Inline Sub-Tasks Mini-Drawer / Popover ═══ */}
      <AnimatePresence>
        {subTasksPopoverTicket && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              zIndex: 100020,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              direction: 'rtl'
            }}
            onClick={() => setSubTasksPopoverTicket(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.18 }}
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '540px',
                background: isDark ? '#0f172a' : '#ffffff',
                borderRadius: '20px',
                border: isDark ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid #e9d5ff',
                boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.6)' : '0 20px 40px -10px rgba(126, 34, 206, 0.15)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                fontFamily: "'Cairo', sans-serif"
              }}
            >
              {/* Header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#faf5ff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #7e22ce 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)'
                  }}>
                    <GitPullRequest size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                      المهام والتذاكر الداخلية التابعة للطلب #{subTasksPopoverTicket.id}
                    </h3>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {subTasksPopoverTicket.subject || subTasksPopoverTicket.title}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSubTasksPopoverTicket(null)}
                  style={{
                    background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sub-tickets Body */}
              <div style={{ padding: '16px 20px', maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {subTasksPopoverTicket.subTicketsSummary?.items && subTasksPopoverTicket.subTicketsSummary.items.length > 0 ? (
                  subTasksPopoverTicket.subTicketsSummary.items.map((st: any) => (
                    <div
                      key={st.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: isDark ? 'rgba(30, 41, 59, 0.45)' : '#f8fafc',
                        border: isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#7e22ce',
                            background: 'rgba(126, 34, 206, 0.1)',
                            padding: '2px 7px',
                            borderRadius: '6px',
                            border: '1px solid rgba(126, 34, 206, 0.2)'
                          }}>
                            {st.code}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                            {st.title}
                          </span>
                        </div>
                        <OpsStatusPill status={st.state?.name} stateLabel={st.state?.label} isDark={isDark} />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Building2 size={12} color="#0284c7" />
                            <span>{st.departmentName || 'إدارة التشغيل'}</span>
                          </span>
                          {st.assignedTo && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isDark ? '#a5b4fc' : '#4f46e5', fontWeight: 700 }}>
                              <ShieldCheck size={12} />
                              <span>{st.assignedTo.fullName}</span>
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10.5px' }}>{formatTimeAgo(st.createdAt)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8', fontSize: '13px' }}>
                    لا توجد مهام فرعية منبثقة مسجلة على هذه المعاملة
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '12px 20px',
                borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isDark ? 'rgba(15, 23, 42, 0.85)' : '#ffffff'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569' }}>
                  إجمالي المهام: {subTasksPopoverTicket.subTicketsSummary?.total || 0} • (الجارية: {subTasksPopoverTicket.subTicketsSummary?.open || 0})
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const t = subTasksPopoverTicket;
                      setSubTasksPopoverTicket(null);
                      setInspectTicket(t);
                    }}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '9px',
                      background: 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(126, 34, 206, 0.3)'
                    }}
                  >
                    فحص المعاملة الرئيسية
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTasksPopoverTicket(null)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '9px',
                      background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                      color: isDark ? '#cbd5e1' : '#475569',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
