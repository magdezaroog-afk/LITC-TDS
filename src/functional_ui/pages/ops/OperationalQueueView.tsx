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
  AlertTriangle, CheckCircle2, ChevronRight, Send, CornerDownLeft,
  MessageSquare, RotateCcw, FileCheck, XCircle, History,
  ArrowRightLeft, Hourglass, Plus, PlusCircle, GitBranch, ArrowLeft, ExternalLink,
  GitPullRequest, Zap, Sun, Moon, BarChart3, Paperclip, Download, Eye
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
          title: 'غرفة العمليات',
          subtitle: 'مركز المعالجة التشغيلية',
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
              غرفة العمليات واستقبال الطلبات
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
            {/* 1. حوض الطلبات الواردة */}
            <OpsQueueTile
            label="حوض الطلبات الواردة"
            value={poolCount}
            sublabel="معلقة بانتظار السحب والإسناد"
            icon={Inbox}
            accentColor="#0284c7"
            isSelected={activeTab === 'POOL'}
            onClick={() => setActiveTab('POOL')}
            isDark={isDark}
          />

          {/* 2. بريدي (مسندة إليّ) */}
          <OpsQueueTile
            label="بريدي (مسندة إليّ)"
            value={myCount}
            sublabel="مهامك الجارية المباشرة"
            icon={ShieldCheck}
            accentColor="#4f46e5"
            isSelected={activeTab === 'MY_QUEUE'}
            onClick={() => setActiveTab('MY_QUEUE')}
            isDark={isDark}
          />

          {/* 3. كافة طلبات الإدارة */}
          <OpsQueueTile
            label="كافة طلبات الإدارة"
            value={stats.open}
            sublabel="سجل القسم العام التشغيلي"
            icon={Layers}
            accentColor={isDark ? "#38bdf8" : "#0f172a"}
            isSelected={activeTab === 'ALL_TICKETS'}
            onClick={() => setActiveTab('ALL_TICKETS')}
            isDark={isDark}
          />

          {/* 4. التذاكر والمهام الداخلية */}
          <OpsQueueTile
            label="التذاكر والمهام الداخلية"
            value={subTicketsCount}
            sublabel="التكليفات والمهام الفرعية"
            icon={GitPullRequest}
            accentColor="#7e22ce"
            isSelected={activeTab === 'SUB_TICKETS'}
            onClick={() => setActiveTab('SUB_TICKETS')}
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
        <div style={{ minWidth: 0 }}>
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

              {/* View-Specific Contextual Search / Refresh Controls for Tickets */}
              {isTicketView && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end', maxWidth: '580px' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
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
              /* Tickets List Rendered as Cinema Tickets */
              <div style={{ minHeight: '320px' }}>
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', color: '#94a3b8', gap: '14px' }}>
                    <RefreshCw size={28} className="animate-spin" color="#2563eb" />
                    <span style={{ fontWeight: 700, fontSize: '14px', color: isDark ? '#94a3b8' : '#475569' }}>جاري استرجاع طابور الطلبات...</span>
                  </div>
                ) : tickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>
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
                ) : (
                  <AnimatePresence>
                    {tickets.filter(t => (t.subject || t.title || '').includes(search) || t.id.toString().includes(search) || (t.creatorName || '').includes(search)).map((ticket, i) => {
                      const reqPriority = ticket.requesterPriority || ticket.priority;
                      const bizPriority = ticket.businessPriority || ticket.priority;
                      const lamp = getLampStyle(reqPriority);
                      const isUnassigned = ticket.isUnassigned !== false && !ticket.assignedTo;
                      const ticketCode = ticket.code || `REQ-${String(ticket.id).padStart(4, '0')}`;
                      
                      // Accent color based on operational priority
                      const accentColor = (bizPriority === 'CRITICAL' || bizPriority === 'URGENT')
                        ? '#ef4444'
                        : bizPriority === 'HIGH'
                        ? '#ea580c'
                        : isUnassigned
                        ? '#0284c7'
                        : '#4f46e5';

                      return (
                        <motion.div
                          key={ticket.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: i * 0.02 }}
                          style={{ marginBottom: '14px' }}
                        >
                          <CinemaTicketFrame
                            accentColor={accentColor}
                            isSelected={inspectTicket?.id === ticket.id}
                            alwaysGlow={bizPriority === 'CRITICAL' || bizPriority === 'URGENT'}
                            cornerCutout={13}
                            notchRadius={5.5}
                            numNotches={3}
                            dashIndent={22}
                            customFill={isDark ? 'rgba(15, 23, 42, 0.95)' : '#ffffff'}
                            onClick={() => setInspectTicket(ticket)}
                            style={{
                              width: '100%',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '20px',
                              padding: '4px 6px',
                              boxSizing: 'border-box',
                              flexWrap: 'wrap'
                            }}>
                              {/* ── Main Body (Right) ── */}
                              <div style={{ flex: 1, minWidth: '260px' }}>
                                {/* Top Badges Row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                  <TicketCodeBadge code={ticketCode} color={accentColor} />
                                  
                                  <h3 style={{
                                    margin: 0,
                                    fontSize: '15.5px',
                                    fontWeight: 800,
                                    color: isDark ? '#ffffff' : '#0f172a',
                                    fontFamily: "'Tajawal', 'Cairo', sans-serif",
                                    lineHeight: 1.3
                                  }}>
                                    {ticket.subject || ticket.title}
                                  </h3>

                                  {ticket.state?.label && (
                                    <span style={{
                                      background: isDark
                                        ? (ticket.state.name === 'OPEN' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)')
                                        : (ticket.state.name === 'OPEN' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(16, 185, 129, 0.12)'),
                                      color: isDark
                                        ? (ticket.state.name === 'OPEN' ? '#93c5fd' : '#6ee7b7')
                                        : (ticket.state.name === 'OPEN' ? '#2563eb' : '#059669'),
                                      fontSize: '10.5px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '6px'
                                    }}>
                                      {ticket.state.label}
                                    </span>
                                  )}

                                  {ticket.isPendingHandover && (
                                    <span style={{
                                      background: isDark ? 'rgba(245, 158, 11, 0.2)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                      color: isDark ? '#fbbf24' : '#b45309',
                                      border: isDark ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #fde68a',
                                      fontSize: '10.5px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      ⏳ {ticket.handoverInfo?.toUserId === user?.id ? '🔔 محولة إليك بانتظار قبولك' : 'بانتظار قبول التحويل'}
                                    </span>
                                  )}

                                  {(ticket.isSubTicket || ticket.parentId) && (
                                    <span style={{
                                      background: isDark ? 'rgba(168, 85, 247, 0.2)' : 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                                      color: isDark ? '#c084fc' : '#7e22ce',
                                      border: isDark ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid #e9d5ff',
                                      fontSize: '10.5px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '6px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      📎 مهمة داخلية {ticket.parentId ? `(الأصل #${ticket.parentId})` : ''}
                                    </span>
                                  )}
                                </div>

                                {/* Meta Details Row */}
                                <div style={{ display: 'flex', gap: '16px', fontSize: '12.5px', color: isDark ? '#94a3b8' : '#64748b', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <User size={13} color="#64748b" />
                                    <span>المُرسل:</span>
                                    <strong style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{ticket.creatorName || ticket.creator?.fullName || 'غير معروف'}</strong>
                                  </span>

                                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Layers size={13} color="#6366f1" />
                                    <span>المسار:</span>
                                    <strong style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{ticket.flowDefinitionName || 'عام'}</strong>
                                  </span>

                                  {ticket.departmentName && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                      <Building2 size={13} color="#0284c7" />
                                      <span>الجهة:</span>
                                      <strong style={{ color: isDark ? '#f1f5f9' : '#1e293b' }}>{ticket.departmentName}{ticket.targetDivisionName ? ` • ${ticket.targetDivisionName}` : ''}</strong>
                                    </span>
                                  )}

                                  {ticket.assignedTo && (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isDark ? '#a5b4fc' : '#4f46e5', fontWeight: 700 }}>
                                      <ShieldCheck size={13} />
                                      <span>مسند إلى: {ticket.assignedTo.fullName}</span>
                                    </span>
                                  )}
                                </div>

                                {/* Priority Row */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <span style={styles.priorityBadge(bizPriority)} title="أولوية الإدارة الرسمية المعتمدة">
                                    إدارة: {formatPriorityText(bizPriority)}
                                  </span>

                                  <div 
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      background: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.03)',
                                      padding: '3px 8px',
                                      borderRadius: '6px'
                                    }}
                                    title={`أولوية المُرسل: ${formatPriorityText(reqPriority)}`}
                                  >
                                    <span style={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: '50%',
                                      background: lamp.color,
                                      boxShadow: `0 0 6px ${lamp.color}`,
                                      display: 'inline-block'
                                    }} />
                                    <span style={{ fontSize: '11px', color: isDark ? '#cbd5e1' : '#64748b', fontWeight: 700 }}>
                                      طالب: {lamp.label}
                                    </span>
                                  </div>

                                  {isUnassigned && (
                                    <span style={{
                                      background: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.1)',
                                      color: isDark ? '#38bdf8' : '#0284c7',
                                      fontSize: '11px',
                                      fontWeight: 800,
                                      padding: '2px 8px',
                                      borderRadius: '6px'
                                    }}>
                                      حوض عام
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* ── Ticket Stub (Left - Perforated Controls) ── */}
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: '10px',
                                minWidth: '150px'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: isDark ? '#94a3b8' : '#64748b', fontSize: '12px', fontWeight: 600 }}>
                                  <Clock size={13} color="#94a3b8" />
                                  <span>{new Date(ticket.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>

                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  {isUnassigned && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClaimTicket(ticket.id);
                                      }}
                                      disabled={claimingId === ticket.id}
                                      style={{
                                        padding: '0 14px',
                                        height: '34px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                        color: '#ffffff',
                                        cursor: claimingId === ticket.id ? 'not-allowed' : 'pointer',
                                        fontWeight: 800,
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)',
                                        transition: 'all 0.2s ease',
                                        fontFamily: "'Cairo', sans-serif"
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
                                    >
                                      {claimingId === ticket.id ? (
                                        <><RefreshCw size={13} className="animate-spin" /> جاري السحب...</>
                                      ) : (
                                        <><CheckCircle size={14} /> استلام الطلب</>
                                      )}
                                    </button>
                                  )}

                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setInspectTicket(ticket);
                                    }}
                                    style={{ 
                                      padding: '0 12px',
                                      height: '34px',
                                      borderRadius: '8px',
                                      border: isDark ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(79, 70, 229, 0.25)', 
                                      background: isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(79, 70, 229, 0.08)',
                                      color: isDark ? '#c7d2fe' : '#4f46e5',
                                      cursor: 'pointer',
                                      fontWeight: 800,
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '5px',
                                      transition: 'all 0.2s ease',
                                      fontFamily: "'Cairo', sans-serif"
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = '#4f46e5'; e.currentTarget.style.color = '#ffffff'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = isDark ? 'rgba(99, 102, 241, 0.18)' : 'rgba(79, 70, 229, 0.08)'; e.currentTarget.style.color = isDark ? '#c7d2fe' : '#4f46e5'; }}
                                  >
                                    <span>التفاصيل</span>
                                    <ArrowUpRight size={14} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </CinemaTicketFrame>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
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
