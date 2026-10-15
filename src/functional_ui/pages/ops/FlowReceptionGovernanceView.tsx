import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Users, GitBranch, AlertTriangle, Search, Check, X, 
  ToggleLeft, ToggleRight, Plus, Trash2, Edit3, Clock, ArrowRight,
  Eye, UserCheck, RefreshCw, Sparkles, Sliders, History, Lock,
  FileText, CornerDownLeft, MessageSquare, AlertCircle, ChevronDown,
  ShieldCheck, CheckCircle2, ArrowRightLeft, Layers, Send, Share2, Zap, Hourglass
} from 'lucide-react';

interface CandidateMember {
  id: number;
  name: string;
  email: string;
  role: string;
  title: string;
  hierarchyRole: string;
}

interface FlowRule {
  id: string;
  name: string;
  ruleOrder: number;
  isActive: boolean;
  conditions: Array<{ fieldId: string; fieldName: string; operator: string; value: string; label?: string }>;
  actionType: 'VISIBILITY_FILTER' | 'DIRECT_ASSIGN' | 'ROUND_ROBIN';
  targetUserIds: number[];
  lastAssignedUserId?: number | null;
}

interface AuditLogItem {
  id: string;
  actionType: string;
  details: string;
  createdAt: string;
  actor: { id: number; fullName: string; username: string };
}

interface FlowDetailsResponse {
  flow: {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    targetDepartmentName?: string;
    targetDivisionName?: string;
    targetTeamName?: string;
    managerId?: number;
    managerName?: string;
    closureApproverIds?: number[];
    priorityConfig?: {
      allowAutoEscalate: boolean;
      escalateAfterHours: number;
      escalateTo: string;
      closureApproverIds?: number[];
    };
    transferConfig?: {
      directTransferUserIds: number[];
      requireAcceptanceUserIds: number[];
    };
    subTicketConfig?: {
      enabled: boolean;
      allowedUserIds: number[];
      userScopes: Record<string, 'SAME_DIVISION' | 'SAME_DEPARTMENT' | 'CROSS_DEPARTMENT'>;
    };
  };
  closureApproverIds?: number[];
  transferConfig?: {
    directTransferUserIds: number[];
    requireAcceptanceUserIds: number[];
  };
  subTicketConfig?: {
    enabled: boolean;
    allowedUserIds: number[];
    userScopes: Record<string, 'SAME_DIVISION' | 'SAME_DEPARTMENT' | 'CROSS_DEPARTMENT'>;
  };
  members: CandidateMember[];
  permissions: Array<{
    userId: number;
    canViewPool: boolean;
    canPull: boolean;
    canResolve: boolean;
    canTransferInternal: boolean;
    canTransferExternal: boolean;
    canReopen: boolean;
    canAddInternalNotes: boolean;
    canCalibratePriority: boolean;
  }>;
  rules: FlowRule[];
  auditLogs: AuditLogItem[];
  formFields: Array<{
    id: string;
    name: string;
    options: Array<{ id: string; label: string; isActive: boolean }>;
  }>;
  buildings: Array<{ id: number; globalId: string; name: string }>;
}

interface FlowItemSummary {
  id: string;
  name: string;
  icon: string;
  color: string;
  targetDepartmentName: string;
  targetDivisionName?: string;
  activeTicketsCount: number;
  rulesCount: number;
}

export const FlowReceptionGovernanceView: React.FC = () => {
  // Navigation & Flows List
  const [flows, setFlows] = useState<FlowItemSummary[]>([]);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [loadingFlows, setLoadingFlows] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [data, setData] = useState<FlowDetailsResponse | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');

  // Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({
    message: '',
    type: 'success',
    visible: false
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  // Rule Modal State
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleActionType, setRuleActionType] = useState<'VISIBILITY_FILTER' | 'DIRECT_ASSIGN' | 'ROUND_ROBIN'>('VISIBILITY_FILTER');
  const [ruleSelectedUsers, setRuleSelectedUsers] = useState<number[]>([]);
  const [ruleConditions, setRuleConditions] = useState<Array<{ fieldId: string; fieldName: string; operator: string; value: string; label?: string }>>([]);
  const [isSavingRule, setIsSavingRule] = useState(false);

  // Priority Settings State
  const [allowAutoEscalate, setAllowAutoEscalate] = useState(false);
  const [escalateHours, setEscalateHours] = useState(4);
  const [escalateLevel, setEscalateLevel] = useState('HIGH');
  const [isSavingPriority, setIsSavingPriority] = useState(false);

  // Designated Closure Approvers State
  const [closureApprovers, setClosureApprovers] = useState<number[]>([]);
  const [isSavingApprovers, setIsSavingApprovers] = useState(false);

  // Transfer Governance State (التحويل المباشر والتحويل المعلق بانتظار القبول)
  const [directTransferUsers, setDirectTransferUsers] = useState<number[]>([]);
  const [requireAcceptanceUsers, setRequireAcceptanceUsers] = useState<number[]>([]);
  const [isSavingTransferConfig, setIsSavingTransferConfig] = useState(false);

  // Sub-Tickets & Internal Tasks Governance State (حوكمة التذاكر والمهام الداخلية الفرعية)
  const [subTicketsEnabled, setSubTicketsEnabled] = useState(true);
  const [subTicketAllowedUsers, setSubTicketAllowedUsers] = useState<number[]>([]);
  const [subTicketUserScopes, setSubTicketUserScopes] = useState<Record<string, 'SAME_DIVISION' | 'SAME_DEPARTMENT' | 'CROSS_DEPARTMENT'>>({});
  const [isSavingSubTicketConfig, setIsSavingSubTicketConfig] = useState(false);

  // Auth Header Helper
  const getAuthHeaders = useCallback((extra: Record<string, string> = {}) => {
    const token = localStorage.getItem('litc_token');
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra
    };
  }, []);

  // ─── 1. Load Managed Flows ────────────────────────────────────────────────
  const loadMyFlows = useCallback(async () => {
    setLoadingFlows(true);
    try {
      const res = await fetch('/api/v1/flow-governance/my-flows', {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.flows)) {
        setFlows(json.flows);
        if (json.flows.length > 0 && !selectedFlowId) {
          setSelectedFlowId(json.flows[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load flows', err);
      showToast('تعذر تحميل مسارات الاستقبال', 'error');
    } finally {
      setLoadingFlows(false);
    }
  }, [selectedFlowId, getAuthHeaders]);

  useEffect(() => {
    loadMyFlows();
  }, [loadMyFlows]);

  // ─── 2. Load Selected Flow Details ────────────────────────────────────────
  const loadFlowDetails = useCallback(async (flowId: string) => {
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/v1/flow-governance/${flowId}/details`, {
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setData(json);
        const approverList = json.closureApproverIds || json.flow?.closureApproverIds || [];
        setClosureApprovers(Array.isArray(approverList) ? approverList : []);

        const tConfig = json.transferConfig || json.flow?.transferConfig || { directTransferUserIds: [], requireAcceptanceUserIds: [] };
        setDirectTransferUsers(Array.isArray(tConfig.directTransferUserIds) ? tConfig.directTransferUserIds : []);
        setRequireAcceptanceUsers(Array.isArray(tConfig.requireAcceptanceUserIds) ? tConfig.requireAcceptanceUserIds : []);

        const sConfig = json.subTicketConfig || json.flow?.subTicketConfig || { enabled: true, allowedUserIds: [], userScopes: {} };
        setSubTicketsEnabled(sConfig.enabled !== false);
        setSubTicketAllowedUsers(Array.isArray(sConfig.allowedUserIds) ? sConfig.allowedUserIds : []);
        setSubTicketUserScopes(sConfig.userScopes || {});

        if (json.flow?.priorityConfig) {
          setAllowAutoEscalate(!!json.flow.priorityConfig.allowAutoEscalate);
          setEscalateHours(json.flow.priorityConfig.escalateAfterHours || 4);
          setEscalateLevel(json.flow.priorityConfig.escalateTo || 'HIGH');
        }
      } else {
        showToast(json.message || 'فشل تحميل تفاصيل المسار', 'error');
      }
    } catch (err) {
      console.error('Failed to load flow details', err);
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setLoadingDetails(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (selectedFlowId) {
      loadFlowDetails(selectedFlowId);
    }
  }, [selectedFlowId, loadFlowDetails]);

  // ─── 3. Action Permissions Matrix Updates ─────────────────────────────────
  const handleToggleMemberPermission = async (actionType: string, memberId: number) => {
    if (!data || !selectedFlowId) return;

    const currentAuthorized = data.permissions
      .filter((p: any) => p[actionType])
      .map(p => p.userId);

    const isCurrentlyAuth = currentAuthorized.includes(memberId);
    const updatedIds = isCurrentlyAuth 
      ? currentAuthorized.filter(id => id !== memberId)
      : [...currentAuthorized, memberId];

    // Optimistic UI update
    setData(prev => {
      if (!prev) return null;
      const newPerms = [...prev.permissions];
      const idx = newPerms.findIndex(p => p.userId === memberId);
      if (idx !== -1) {
        newPerms[idx] = { ...newPerms[idx], [actionType]: !isCurrentlyAuth };
      } else {
        newPerms.push({
          userId: memberId,
          canViewPool: true,
          canPull: false,
          canResolve: false,
          canTransferInternal: false,
          canTransferExternal: false,
          canReopen: false,
          canAddInternalNotes: true,
          canCalibratePriority: false,
          [actionType]: true
        });
      }
      return { ...prev, permissions: newPerms };
    });

    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/permissions`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ actionType, userIds: updatedIds, applyToAll: false })
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم حفظ الصلاحيات لحظياً', 'success');
      } else {
        showToast(json.message || 'فشل حفظ الصلاحيات', 'error');
        loadFlowDetails(selectedFlowId); // Rollback
      }
    } catch {
      showToast('فشل الحفظ التلقائي', 'error');
      loadFlowDetails(selectedFlowId);
    }
  };

  const handleApplyToAllMembers = async (actionType: string, currentAllActive: boolean) => {
    if (!data || !selectedFlowId) return;

    const allMemberIds = data.members.map(m => m.id);
    const targetIds = currentAllActive ? [] : allMemberIds;

    // Optimistic UI
    setData(prev => {
      if (!prev) return null;
      const newPerms = prev.members.map(m => {
        const existing = prev.permissions.find(p => p.userId === m.id);
        return {
          userId: m.id,
          canViewPool: true,
          canPull: false,
          canResolve: false,
          canTransferInternal: false,
          canTransferExternal: false,
          canReopen: false,
          canAddInternalNotes: true,
          canCalibratePriority: false,
          ...(existing || {}),
          [actionType]: !currentAllActive
        };
      });
      return { ...prev, permissions: newPerms };
    });

    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/permissions`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ actionType, userIds: targetIds, applyToAll: !currentAllActive })
      });
      const json = await res.json();
      if (json.success) {
        showToast(!currentAllActive ? 'تم تفعيل الإجراء لجميع الأعضاء' : 'تم إلغاء تفعيل الإجراء للجميع', 'success');
      } else {
        showToast('فشل تطبيق الصلاحية', 'error');
        loadFlowDetails(selectedFlowId);
      }
    } catch {
      showToast('خطأ في الاتصال', 'error');
      loadFlowDetails(selectedFlowId);
    }
  };

  // ─── 4. Automated Workflow Rules Logic ────────────────────────────────────
  const handleToggleRuleStatus = async (ruleId: string) => {
    if (!selectedFlowId) return;
    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/rules/${ruleId}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => {
          if (!prev) return null;
          return {
            ...prev,
            rules: prev.rules.map(r => r.id === ruleId ? { ...r, isActive: json.isActive } : r)
          };
        });
        showToast(json.isActive ? 'تم تفعيل قاعدة التوجيه' : 'تم إيقاف قاعدة التوجيه', 'info');
      }
    } catch {
      showToast('فشل تحديث حالة القاعدة', 'error');
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!selectedFlowId || !window.confirm('هل أنت متأكد من حذف هذه القاعدة الشرطية؟')) return;
    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/rules/${ruleId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => {
          if (!prev) return null;
          return { ...prev, rules: prev.rules.filter(r => r.id !== ruleId) };
        });
        showToast('تم حذف قاعدة التوجيه بنجاح', 'success');
      }
    } catch {
      showToast('فشل حذف القاعدة', 'error');
    }
  };

  const openNewRuleModal = () => {
    if ((data?.rules || []).length >= 10) {
      showToast('وصلت إلى الحد الأقصى للقواعد (10 قواعد نشطة). احذف أو عدل قاعدة موجودة.', 'error');
      return;
    }
    setEditingRuleId(null);
    setRuleName('');
    setRuleActionType('VISIBILITY_FILTER');
    setRuleSelectedUsers([]);
    setRuleConditions([]);
    setShowRuleModal(true);
  };

  const openEditRuleModal = (rule: FlowRule) => {
    setEditingRuleId(rule.id);
    setRuleName(rule.name);
    setRuleActionType(rule.actionType);
    setRuleSelectedUsers(rule.targetUserIds || []);
    setRuleConditions(rule.conditions || []);
    setShowRuleModal(true);
  };

  const handleSaveRule = async () => {
    if (!selectedFlowId) return;
    if (!ruleName.trim()) {
      showToast('اسم القاعدة مطلوب', 'error');
      return;
    }
    if (ruleConditions.length === 0) {
      showToast('يجب تحديد شرط واحد على الأقل للقاعدة', 'error');
      return;
    }
    if (ruleSelectedUsers.length === 0) {
      showToast('يجب تحديد الموظفين المعنيين بالإجراء', 'error');
      return;
    }

    setIsSavingRule(true);
    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/rules`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          id: editingRuleId || undefined,
          name: ruleName.trim(),
          actionType: ruleActionType,
          conditions: ruleConditions,
          targetUserIds: ruleSelectedUsers
        })
      });
      const json = await res.json();
      if (json.success && json.rule) {
        showToast(editingRuleId ? 'تم تحديث قاعدة التوجيه بنجاح' : 'تم إنشاء قاعدة التوجيه بنجاح', 'success');
        setShowRuleModal(false);
        loadFlowDetails(selectedFlowId);
      } else {
        showToast(json.message || 'فشل حفظ القاعدة', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsSavingRule(false);
    }
  };

  // ─── 5. Priority Calibration Save ─────────────────────────────────────────
  const handleSavePriorityConfig = async () => {
    if (!selectedFlowId) return;
    setIsSavingPriority(true);
    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/priority-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          allowAutoEscalate,
          escalateAfterHours: escalateHours,
          escalateTo: escalateLevel
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم حفظ إعدادات الأولوية والترقية بنجاح', 'success');
      } else {
        showToast(json.message || 'فشل الحفظ', 'error');
      }
    } catch {
      showToast('فشل في حفظ إعدادات الأولوية', 'error');
    } finally {
      setIsSavingPriority(false);
    }
  };

  // ─── 6. Designated Closure Approvers Toggle ───────────────────────────────
  const handleToggleClosureApprover = async (memberId: number) => {
    if (!selectedFlowId) return;
    const isCurrentlyApprover = closureApprovers.includes(memberId);
    const updated = isCurrentlyApprover 
      ? closureApprovers.filter(id => id !== memberId)
      : [...closureApprovers, memberId];

    setClosureApprovers(updated);
    setIsSavingApprovers(true);

    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/closure-approvers`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ approverIds: updated })
      });
      const json = await res.json();
      if (json.success) {
        showToast(isCurrentlyApprover ? 'تم إلغاء تخويل الاعتماد للموظف' : 'تم تخويل الموظف باعتماد إغلاق التذاكر بنجاح 🛡️', 'success');
      } else {
        showToast(json.message || 'فشل حفظ التخويل', 'error');
        setClosureApprovers(closureApprovers); // Rollback
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
      setClosureApprovers(closureApprovers);
    } finally {
      setIsSavingApprovers(false);
    }
  };

  // ─── 7. Transfer Governance Handler ─────────────────────────────────────────
  const handleSetTransferMode = async (memberId: number, mode: 'DIRECT' | 'REQUIRE_ACCEPTANCE' | 'NONE') => {
    if (!selectedFlowId) return;
    let newDirect = directTransferUsers.filter(id => id !== memberId);
    let newRequire = requireAcceptanceUsers.filter(id => id !== memberId);

    if (mode === 'DIRECT') {
      newDirect.push(memberId);
    } else if (mode === 'REQUIRE_ACCEPTANCE') {
      newRequire.push(memberId);
    }

    setDirectTransferUsers(newDirect);
    setRequireAcceptanceUsers(newRequire);
    setIsSavingTransferConfig(true);

    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/transfer-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          directTransferUserIds: newDirect,
          requireAcceptanceUserIds: newRequire
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(
          mode === 'DIRECT' 
            ? 'تم منح صلاحية التحويل المباشر بدون إذن ⚡' 
            : mode === 'REQUIRE_ACCEPTANCE' 
            ? 'تم تعيين التحويل مع اشتراط قبول الطرف الآخر ⏳' 
            : 'تم إلغاء صلاحية التحويل للموظف',
          'success'
        );
      } else {
        showToast(json.message || 'فشل حفظ إعدادات التحويل', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsSavingTransferConfig(false);
    }
  };

  const handleApplyTransferModeToAll = async (mode: 'DIRECT' | 'REQUIRE_ACCEPTANCE') => {
    if (!selectedFlowId || !data?.members) return;
    const allIds = data.members.map(m => m.id);
    const newDirect = mode === 'DIRECT' ? allIds : [];
    const newRequire = mode === 'REQUIRE_ACCEPTANCE' ? allIds : [];

    setDirectTransferUsers(newDirect);
    setRequireAcceptanceUsers(newRequire);
    setIsSavingTransferConfig(true);

    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/transfer-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          directTransferUserIds: newDirect,
          requireAcceptanceUserIds: newRequire
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(mode === 'DIRECT' ? 'تم تطبيق التحويل المباشر لجميع أعضاء المسار ⚡' : 'تم فرض شرط قبول التحويل على الجميع ⏳', 'success');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsSavingTransferConfig(false);
    }
  };

  // ─── 8. Sub-Tickets Governance Handlers ─────────────────────────────────────
  const handleToggleSubTicketsEnabled = async (enabled: boolean) => {
    if (!selectedFlowId) return;
    setSubTicketsEnabled(enabled);
    setIsSavingSubTicketConfig(true);
    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/sub-ticket-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          enabled,
          allowedUserIds: subTicketAllowedUsers,
          userScopes: subTicketUserScopes
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(enabled ? 'تم تفعيل فتح التذاكر والمهام الداخلية بنجاح' : 'تم تعطيل فتح التذاكر الداخلية لهذا المسار', 'success');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsSavingSubTicketConfig(false);
    }
  };

  const handleToggleSubTicketUser = async (memberId: number) => {
    if (!selectedFlowId) return;
    const isAllowed = subTicketAllowedUsers.includes(memberId);
    const updated = isAllowed ? subTicketAllowedUsers.filter(id => id !== memberId) : [...subTicketAllowedUsers, memberId];
    setSubTicketAllowedUsers(updated);
    setIsSavingSubTicketConfig(true);

    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/sub-ticket-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          enabled: subTicketsEnabled,
          allowedUserIds: updated,
          userScopes: subTicketUserScopes
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast(isAllowed ? 'تم إلغاء تخويل فتح التذاكر الداخلية للموظف' : 'تم تخويل الموظف بفتح تذاكر داخلية فرعية 🎯', 'success');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsSavingSubTicketConfig(false);
    }
  };

  const handleChangeSubTicketScope = async (memberId: number, scope: 'SAME_DIVISION' | 'SAME_DEPARTMENT' | 'CROSS_DEPARTMENT') => {
    if (!selectedFlowId) return;
    const updatedScopes = { ...subTicketUserScopes, [String(memberId)]: scope };
    setSubTicketUserScopes(updatedScopes);
    setIsSavingSubTicketConfig(true);

    try {
      const res = await fetch(`/api/v1/flow-governance/${selectedFlowId}/sub-ticket-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          enabled: subTicketsEnabled,
          allowedUserIds: subTicketAllowedUsers,
          userScopes: updatedScopes
        })
      });
      const json = await res.json();
      if (json.success) {
        showToast('تم تحديث نطاق فتح التذاكر الداخلية للموظف', 'success');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setIsSavingSubTicketConfig(false);
    }
  };

  // Filtered members for in-tab search
  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    if (!searchTerm.trim()) return data.members;
    return data.members.filter(m => 
      m.name.includes(searchTerm) || 
      m.title?.includes(searchTerm) || 
      m.hierarchyRole?.includes(searchTerm)
    );
  }, [data?.members, searchTerm]);

  // Actions configuration definition for Pillar 1
  const ACTION_COLUMNS = [
    {
      key: 'canPull',
      title: 'سحب التذكرة (Claim / Take Ticket)',
      desc: 'من يملك حق أخذ التذكرة من الحوض العام وإسنادها لنفسه للبدء في العمل فوراً.',
      icon: <CornerDownLeft size={18} className="text-indigo-600" />,
      color: '#4f46e5'
    },
    {
      key: 'canResolve',
      title: 'إغلاق التذكرة (Resolve & Close)',
      desc: 'الموظفون المخولون بإنهاء المعاملة وإغلاقها نهائياً مع إرفاق مذكرة الإنجاز.',
      icon: <Check size={18} className="text-emerald-600" />,
      color: '#10b981'
    },
    {
      key: 'canTransferInternal',
      title: 'تحويل التذكرة (Transfer / Reassign)',
      desc: 'إمكانية تحويل التذكرة لزميل آخر داخل الفريق أو إعادة توجيهها لمسار خارجي.',
      icon: <GitBranch size={18} className="text-amber-600" />,
      color: '#f59e0b'
    },
    {
      key: 'canReopen',
      title: 'إعادة فتح التذكرة (Reopen)',
      desc: 'إعادة تنشيط تذكرة مغلقة عند ورود استفسار فني جديد أو عدم اكتمال المعالجة.',
      icon: <RefreshCw size={18} className="text-blue-600" />,
      color: '#0284c7'
    },
    {
      key: 'canAddInternalNotes',
      title: 'ملاحظات داخلية سرية (Internal Notes)',
      desc: 'كتابة تعليقات وملاحظات فنية يراها أعضاء الفريق فقط وتُحجب عن مقدم الطلب.',
      icon: <MessageSquare size={18} className="text-purple-600" />,
      color: '#9333ea'
    }
  ];

  if (loadingFlows) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '16px', color: '#64748b' }}>
        <RefreshCw size={32} className="animate-spin text-indigo-600" />
        <div style={{ fontSize: '15px', fontWeight: 600 }}>جاري استخراج مسارات استقبال الطلبات...</div>
      </div>
    );
  }

  if (flows.length === 0) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.06)' }}>
        <Shield size={56} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#4f46e5' }} />
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>ليس لديك مسارات مُدارة حالياً</h2>
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '480px', margin: '0 auto' }}>
          هذا التبويب مخصص للمسؤولين وقادة المسارات المعينين من قبل إدارة النظام لضبط وتخصيص استقبال الطلبات.
        </p>
      </div>
    );
  }

  return (
    <div style={{ direction: 'rtl', fontFamily: "var(--font-family, system-ui, sans-serif)", display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ─── Toast Feedback ────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            style={{
              position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 99999, display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 24px', borderRadius: '16px', fontSize: '13px', fontWeight: 700,
              background: toast.type === 'error' ? '#1e1b4b' : toast.type === 'info' ? '#0f172a' : '#064e3b',
              color: '#ffffff', boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            {toast.type === 'error' ? '❌' : toast.type === 'info' ? 'ℹ️' : '✅'}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Top Header & Multi-Flow Selector ───────────────────────────── */}
      <div style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderRadius: '24px', padding: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ padding: '8px', borderRadius: '12px', background: '#e0e7ff', color: '#4f46e5' }}>
                <Shield size={22} />
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                حوكمة خصائص استقبال الطلبات
              </h1>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
              تحكم كامل في مصفوفة صلاحيات الفريق، محرك الأتمتة الشرطي، ومعايرة مؤشرات الأولوية
            </p>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', top: '12px', right: '14px', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="بحث في أسماء الموظفين..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '10px 40px 10px 14px', borderRadius: '12px',
                border: '1px solid #e2e8f0', background: '#ffffff', fontSize: '13px', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Route Selector Chips */}
        {flows.length > 1 && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              المسارات التي تقودها:
            </span>
            {flows.map(f => {
              const isSelected = f.id === selectedFlowId;
              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedFlowId(f.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                    borderRadius: '12px', border: isSelected ? `2px solid ${f.color || '#4f46e5'}` : '1px solid #e2e8f0',
                    background: isSelected ? '#ffffff' : '#f8fafc', cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color || '#4f46e5' }} />
                  <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: isSelected ? '#0f172a' : '#64748b' }}>
                    {f.name}
                  </span>
                  <span style={{ fontSize: '11px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '6px', color: '#64748b', fontWeight: 700 }}>
                    {f.activeTicketsCount} طلب
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loadingDetails || !data ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>جارٍ استخراج خصائص المسار...</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* ═══════════════════════════════════════════════════════════════════
              الركيزة 1: مصفوفة الصلاحيات التشغيلية (Action Permissions Matrix)
             ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Users size={20} className="text-indigo-600" />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    الركيزة الأولى: مصفوفة الصلاحيات التشغيلية (Action Matrix)
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  تحديد دقيق لصلاحيات كل إجراء تشغيلي عبر العرض المعكوس الذكي مع الحفظ اللحظي
                </p>
              </div>
            </div>

            {/* Inverted Bento Action Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
              {ACTION_COLUMNS.map(col => {
                const authorizedMembers = filteredMembers.filter(m => {
                  const perm = data.permissions.find(p => p.userId === m.id);
                  return perm ? (perm as any)[col.key] : false;
                });
                const allActive = data.members.length > 0 && authorizedMembers.length === data.members.length;

                return (
                  <div
                    key={col.key}
                    style={{
                      background: '#ffffff', borderRadius: '18px', padding: '20px',
                      border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ padding: '6px', borderRadius: '8px', background: `${col.color}15` }}>
                            {col.icon}
                          </div>
                          <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {col.title.split('(')[0]}
                          </h3>
                        </div>

                        {/* Quick Toggle: Apply to all */}
                        <button
                          onClick={() => handleApplyToAllMembers(col.key, allActive)}
                          style={{
                            padding: '4px 10px', borderRadius: '8px', border: 'none',
                            background: allActive ? '#dcfce7' : '#f1f5f9',
                            color: allActive ? '#15803d' : '#64748b',
                            fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {allActive ? <Check size={12} /> : null}
                          {allActive ? 'مفعل للجميع' : 'تطبيق على الكل'}
                        </button>
                      </div>

                      <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5, minHeight: '36px' }}>
                        {col.desc}
                      </p>

                      {/* Multi-select Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '48px', marginBottom: '12px' }}>
                        {authorizedMembers.map(m => (
                          <span
                            key={m.id}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              background: `${col.color}12`, color: col.color,
                              padding: '5px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: 700
                            }}
                          >
                            <span>{m.name}</span>
                            <button
                              onClick={() => handleToggleMemberPermission(col.key, m.id)}
                              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: col.color, display: 'flex', alignItems: 'center' }}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        {authorizedMembers.length === 0 && (
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', padding: '6px 0' }}>
                            لم يتم تفويض أي موظف بعد
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Member Add Dropdown */}
                    <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                      <select
                        onChange={e => {
                          if (e.target.value) {
                            handleToggleMemberPermission(col.key, Number(e.target.value));
                            e.target.value = '';
                          }
                        }}
                        style={{
                          width: '100%', padding: '8px 12px', borderRadius: '10px',
                          border: '1px solid #e2e8f0', background: '#f8fafc',
                          fontSize: '12px', fontWeight: 600, color: '#475569', outline: 'none'
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>+ إضافة موظف لهذه الصلاحية...</option>
                        {filteredMembers
                          .filter(m => !authorizedMembers.some(am => am.id === m.id))
                          .map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.hierarchyRole})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              الركيزة المتقدمة: المخولون باعتماد وإغلاق التذاكر (Designated Closure Approvers)
             ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ padding: '8px', borderRadius: '12px', background: '#ecfdf5', color: '#059669' }}>
                    <ShieldCheck size={22} />
                  </div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    المخولون باعتماد وإغلاق التذاكر (Designated Closure Approvers)
                  </h2>
                  <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '8px' }}>
                    حوكمة الإغلاق الثنائي
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  تحديد الكادر والمهندسين المخولين باعتماد مذكرات الإنجاز وإغلاق التذاكر نهائياً نيابةً عن المهندسين الذين لا يملكون صلاحية الإغلاق المباشر.
                </p>
              </div>

              {isSavingApprovers && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontSize: '12px', fontWeight: 700 }}>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>جاري الحفظ اللحظي...</span>
                </div>
              )}
            </div>

            {/* Explanatory Callout Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(240, 253, 250, 0.7) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: '16px',
              padding: '16px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{ padding: '10px', borderRadius: '12px', background: '#ffffff', color: '#4f46e5', boxShadow: '0 2px 8px rgba(79, 70, 229, 0.1)' }}>
                <Sparkles size={20} />
              </div>
              <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                <strong>آلية عمل اعتماد الإغلاق:</strong> عندما يكمل مهندس (ليس لديه صلاحية إغلاق فوري) معالجة التذكرة، يضغط على <strong>[ طلب اعتماد الإغلاق ]</strong> ويرفق تقرير المعالجة الفنية. تنتقل التذكرة لحالة <strong>تم الإنجاز (بانتظار الاعتماد)</strong>، ويتم إشعار المعتمدين المحددين أدناه لمراجعة الأعمال المنفذة واعتماد الإغلاق النهائي أو إعادتها للتعديل.
              </div>
            </div>

            {/* Manager Permanent Badge */}
            {data.flow?.managerName && (
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #fde047',
                borderRadius: '16px',
                padding: '14px 20px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 16px rgba(234, 179, 8, 0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'linear-gradient(135deg, #fef08a 0%, #facc15 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#854d0e', fontSize: '15px' }}>
                    👑
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{data.flow.managerName}</span>
                      <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                        مدير المسار
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>معتمد دائم وتلقائي بحكم قيادته للمسار التشغيلي</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', background: '#ecfdf5', padding: '6px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700 }}>
                  <Check size={14} /> معتمد رئيسي دائم
                </div>
              </div>
            )}

            {/* Approvers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {filteredMembers
                .filter(m => !data.flow?.managerId || m.id !== Number(data.flow.managerId))
                .map(member => {
                  const isApprover = closureApprovers.includes(member.id);

                  return (
                    <motion.div
                      key={member.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        padding: '16px',
                        border: isApprover ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                        boxShadow: isApprover ? '0 4px 14px rgba(16, 185, 129, 0.08)' : '0 2px 6px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: 38,
                          height: 38,
                          borderRadius: '10px',
                          background: isApprover ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f1f5f9',
                          color: isApprover ? '#ffffff' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '13px'
                        }}>
                          {member.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span>{member.hierarchyRole}</span>
                            <span>•</span>
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.title || member.role}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleClosureApprover(member.id)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: isApprover ? 'none' : '1px solid #cbd5e1',
                          background: isApprover ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#f8fafc',
                          color: isApprover ? '#ffffff' : '#475569',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.2s ease',
                          boxShadow: isApprover ? '0 2px 8px rgba(16, 185, 129, 0.25)' : 'none'
                        }}
                      >
                        {isApprover ? (
                          <>
                            <CheckCircle2 size={14} />
                            <span>مخول باعتماد الإغلاق</span>
                          </>
                        ) : (
                          <>
                            <Plus size={14} />
                            <span>تخويل باعتماد الإغلاق</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              الركيزة 2: محرك الأتمتة والتوجيه الشرطي (Automated Workflow Engine)
             ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <GitBranch size={20} className="text-amber-600" />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    الركيزة الثانية: محرك الأتمتة والتوجيه الشرطي (Workflow Rules)
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  ربط خيارات مستدلات الفورم (مثل المبنى أو نوع المشكلة) بالتوجيه التلقائي المباشر أو حصر الظهور
                </p>
              </div>

              <button
                onClick={openNewRuleModal}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
                  borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#ffffff',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)'
                }}
              >
                <Plus size={16} /> إضافة قاعدة توجيه ذكية ({data.rules.length}/10)
              </button>
            </div>

            {/* Rules Cards List */}
            {data.rules.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <Sliders size={36} style={{ margin: '0 auto 12px', opacity: 0.4, color: '#64748b' }} />
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#334155' }}>لا توجد قواعد توجيه شرطية حالياً</div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 16px' }}>
                  يمكنك إنشاء حتى 10 قواعد ذكية لتوجيه التذاكر للمهندسين المتخصصين تلقائياً دون تدخل يدوي.
                </p>
                <button
                  onClick={openNewRuleModal}
                  style={{
                    padding: '8px 18px', borderRadius: '10px', background: '#e0e7ff', color: '#4f46e5',
                    border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  + إنشاء أول قاعدة الآن
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px' }}>
                {data.rules.map(rule => (
                  <motion.div
                    key={rule.id}
                    layout
                    style={{
                      background: '#ffffff', borderRadius: '16px', padding: '18px 22px',
                      border: `1.5px solid ${rule.isActive ? '#e2e8f0' : '#f1f5f9'}`,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)', opacity: rule.isActive ? 1 : 0.65,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                    }}
                  >
                    {/* Rule Info & Conditions */}
                    <div style={{ flex: 1, minWidth: '280px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>{rule.name}</span>
                        <span style={{
                          padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                          background: rule.actionType === 'VISIBILITY_FILTER' ? '#eff6ff' : rule.actionType === 'ROUND_ROBIN' ? '#fdf4ff' : '#f0fdf4',
                          color: rule.actionType === 'VISIBILITY_FILTER' ? '#1d4ed8' : rule.actionType === 'ROUND_ROBIN' ? '#a21caf' : '#15803d'
                        }}>
                          {rule.actionType === 'VISIBILITY_FILTER' ? '👁️ حصر الظهور' : rule.actionType === 'ROUND_ROBIN' ? '🔄 تناوب عادل (Round-Robin)' : '⚡ إسناد مباشر فوري'}
                        </span>
                      </div>

                      {/* Conditions Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '13px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>إذا اختار المستخدم:</span>
                        {rule.conditions.map((c, idx) => (
                          <span key={idx} style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#334155', fontWeight: 700, fontSize: '12px' }}>
                            [{c.fieldName}]: <strong style={{ color: '#4f46e5' }}>{c.label || c.value}</strong>
                          </span>
                        ))}
                      </div>

                      {/* Action Target Members */}
                      <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>الموظفون المعنيون:</span>
                        <strong style={{ color: '#0f172a' }}>
                          {rule.targetUserIds.map(uid => data.members.find(m => m.id === uid)?.name || `مستخدم #${uid}`).join('، ')}
                        </strong>
                      </div>
                    </div>

                    {/* Actions & Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* On/Off Toggle */}
                      <button
                        onClick={() => handleToggleRuleStatus(rule.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          color: rule.isActive ? '#10b981' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700
                        }}
                      >
                        {rule.isActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                        <span>{rule.isActive ? 'مفعلة' : 'معطلة'}</span>
                      </button>

                      <button
                        onClick={() => openEditRuleModal(rule)}
                        style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#f1f5f9', color: '#475569', cursor: 'pointer' }}
                        title="تعديل القاعدة"
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                        title="حذف القاعدة"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              الركيزة 3: معايرة الأولوية المزدوجة (Dual-Priority Calibration)
             ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <AlertTriangle size={20} className="text-rose-600" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                الركيزة الثالثة: معايرة الأولوية المزدوجة والترقية التلقائية (Dual-Priority Calibration)
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0' }}>
              الفصل بين مؤشر المستخدم (ما أرسله صاحب الطلب) ومؤشر الإدارة الرسمي (المعتمد في عداد SLA وترتيب الطابور)
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Authorized Calibrators */}
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                  🎯 المخولون باعتماد وفرض "أولوية الإدارة" الرسمية
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0' }}>
                  حدد من يحق له تعديل تقييم الأولوية الرسمي للتذاكر الواردة لهذا المسار:
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '44px', marginBottom: '12px' }}>
                  {data.members.filter(m => {
                    const p = data.permissions.find(perm => perm.userId === m.id);
                    return p?.canCalibratePriority;
                  }).map(m => (
                    <span
                      key={m.id}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        background: '#fef2f2', color: '#dc2626', padding: '5px 10px',
                        borderRadius: '10px', fontSize: '12px', fontWeight: 700
                      }}
                    >
                      <span>{m.name}</span>
                      <button
                        onClick={() => handleToggleMemberPermission('canCalibratePriority', m.id)}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#dc2626' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleToggleMemberPermission('canCalibratePriority', Number(e.target.value));
                      e.target.value = '';
                    }
                  }}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '10px',
                    border: '1px solid #e2e8f0', background: '#f8fafc',
                    fontSize: '12px', fontWeight: 600, color: '#475569', outline: 'none'
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>+ إضافة موظف مخول بمعايرة الأولوية...</option>
                  {data.members
                    .filter(m => !data.permissions.find(p => p.userId === m.id)?.canCalibratePriority)
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.hierarchyRole})</option>
                    ))}
                </select>
              </div>

              {/* Dwell-Time Auto-Escalation Rule */}
              <div style={{ background: '#ffffff', padding: '20px', borderRadius: '18px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                    ⏱️ قاعدة الترقية التلقائية للأولوية (Dwell-Time Escalation)
                  </h3>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 16px 0' }}>
                    ترقية لمبة أولوية الإدارة تلقائياً عند بقاء التذكرة دون إجراء لفترة محددة:
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={allowAutoEscalate} 
                        onChange={e => setAllowAutoEscalate(e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: '#4f46e5' }}
                      />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        تفعيل الترقية التلقائية في هذا المسار
                      </span>
                    </label>

                    {allowAutoEscalate && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>إذا بقيت التذكرة دون إجراء لأكثر من:</span>
                        <input 
                          type="number" 
                          min={1} 
                          max={72} 
                          value={escalateHours} 
                          onChange={e => setEscalateHours(Number(e.target.value))}
                          style={{ width: '60px', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>ساعات، ترقيتها إلى:</span>
                        <select 
                          value={escalateLevel} 
                          onChange={e => setEscalateLevel(e.target.value)}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                        >
                          <option value="HIGH">عالي 🟠</option>
                          <option value="CRITICAL">حرج / عاجل جداً 🔴</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSavePriorityConfig}
                    disabled={isSavingPriority}
                    style={{
                      padding: '8px 18px', borderRadius: '10px', border: 'none',
                      background: '#0f172a', color: '#ffffff', fontSize: '12px', fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {isSavingPriority ? 'جارٍ الحفظ...' : 'حفظ إعدادات الترقية'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              الركيزة 4: حوكمة تحويل التذاكر والاستلام (Transfer & Handover Governance)
             ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <ArrowRightLeft size={20} className="text-teal-600" />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    الركيزة الرابعة: حوكمة تحويل التذاكر والاستلام (Transfer & Handover Governance)
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  تحديد سياسة تحويل التذاكر بين الزملاء: هل يتم التحويل مباشرة وبشكل فوري ⚡، أو يبقى معلقاً بانتظار قبول الطرف الآخر ⏳
                </p>
              </div>

              {/* Bulk Quick Actions */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleApplyTransferModeToAll('DIRECT')}
                  disabled={isSavingTransferConfig}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', border: '1px solid #0d9488',
                    background: '#f0fdfa', color: '#0f766e', fontSize: '12px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Zap size={14} /> تطبيق التحويل المباشر للجميع
                </button>
                <button
                  onClick={() => handleApplyTransferModeToAll('REQUIRE_ACCEPTANCE')}
                  disabled={isSavingTransferConfig}
                  style={{
                    padding: '8px 14px', borderRadius: '10px', border: '1px solid #f59e0b',
                    background: '#fffbeb', color: '#b45309', fontSize: '12px', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Hourglass size={14} /> فرض شرط القبول على الجميع
                </button>
              </div>
            </div>

            {/* Member Cards with Transfer Mode Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {filteredMembers.map(member => {
                const isDirect = directTransferUsers.includes(member.id);
                const isRequireAcceptance = requireAcceptanceUsers.includes(member.id);
                const currentMode: 'DIRECT' | 'REQUIRE_ACCEPTANCE' | 'NONE' = isDirect ? 'DIRECT' : (isRequireAcceptance ? 'REQUIRE_ACCEPTANCE' : 'NONE');

                return (
                  <motion.div
                    key={member.id}
                    layout
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px',
                      border: `1.5px solid ${currentMode === 'DIRECT' ? '#99f6e4' : currentMode === 'REQUIRE_ACCEPTANCE' ? '#fde68a' : '#e2e8f0'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '12px',
                          background: currentMode === 'DIRECT' ? 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' : currentMode === 'REQUIRE_ACCEPTANCE' ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' : '#e2e8f0',
                          color: currentMode !== 'NONE' ? '#ffffff' : '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '15px'
                        }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{member.hierarchyRole}</span>
                          <span>•</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.title || member.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mode Selector Segmented Pill */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', background: '#f8fafc', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <button
                        onClick={() => handleSetTransferMode(member.id, 'DIRECT')}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '8px',
                          border: 'none',
                          background: currentMode === 'DIRECT' ? '#0d9488' : 'transparent',
                          color: currentMode === 'DIRECT' ? '#ffffff' : '#475569',
                          fontWeight: 700,
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Zap size={12} />
                        <span>مباشر</span>
                      </button>
                      <button
                        onClick={() => handleSetTransferMode(member.id, 'REQUIRE_ACCEPTANCE')}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '8px',
                          border: 'none',
                          background: currentMode === 'REQUIRE_ACCEPTANCE' ? '#d97706' : 'transparent',
                          color: currentMode === 'REQUIRE_ACCEPTANCE' ? '#ffffff' : '#475569',
                          fontWeight: 700,
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Hourglass size={12} />
                        <span>بشرط القبول</span>
                      </button>
                      <button
                        onClick={() => handleSetTransferMode(member.id, 'NONE')}
                        style={{
                          padding: '6px 4px',
                          borderRadius: '8px',
                          border: 'none',
                          background: currentMode === 'NONE' ? '#cbd5e1' : 'transparent',
                          color: currentMode === 'NONE' ? '#1e293b' : '#64748b',
                          fontWeight: 700,
                          fontSize: '11px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <X size={12} />
                        <span>تعطيل</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              الركيزة 5: حوكمة التذاكر والمهام الداخلية (Sub-Tickets Governance)
             ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)', borderRadius: '24px', padding: '28px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 24px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <Layers size={20} className="text-purple-600" />
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    الركيزة الخامسة: حوكمة التذاكر والمهام الداخلية الفرعية (Sub-Tickets & Delegations)
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  تخويل الموظفين بفتح مهام فرعية متعددة على التذكرة الأصلية وإسنادها لأقسام أو إدارات أخرى، مع تحديد نطاق الصلاحية الجغرافي والإداري لكل موظف
                </p>
              </div>

              {/* Global Route Switch */}
              <button
                onClick={() => handleToggleSubTicketsEnabled(!subTicketsEnabled)}
                disabled={isSavingSubTicketConfig}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                  borderRadius: '12px', border: '1px solid #cbd5e1',
                  background: subTicketsEnabled ? '#faf5ff' : '#f8fafc',
                  color: subTicketsEnabled ? '#7e22ce' : '#64748b',
                  fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                }}
              >
                {subTicketsEnabled ? <ToggleRight size={28} className="text-purple-600" /> : <ToggleLeft size={28} className="text-slate-400" />}
                <span>{subTicketsEnabled ? 'المهام الفرعية مفعلة في المسار' : 'المهام الفرعية معطلة في المسار'}</span>
              </button>
            </div>

            {/* Member Configuration Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '14px', opacity: subTicketsEnabled ? 1 : 0.5, pointerEvents: subTicketsEnabled ? 'auto' : 'none' }}>
              {filteredMembers.map(member => {
                const isAllowed = subTicketAllowedUsers.length === 0 || subTicketAllowedUsers.includes(member.id);
                const currentScope = subTicketUserScopes[String(member.id)] || 'SAME_DEPARTMENT';

                return (
                  <motion.div
                    key={member.id}
                    layout
                    style={{
                      background: '#ffffff',
                      borderRadius: '16px',
                      padding: '16px',
                      border: `1.5px solid ${isAllowed ? '#e9d5ff' : '#e2e8f0'}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: isAllowed ? 'linear-gradient(135deg, #7e22ce 0%, #9333ea 100%)' : '#e2e8f0',
                            color: isAllowed ? '#ffffff' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '15px'
                          }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{member.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{member.hierarchyRole}</div>
                        </div>
                      </div>

                      {/* Enable Sub-Tickets Toggle */}
                      <button
                        onClick={() => handleToggleSubTicketUser(member.id)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isAllowed ? 'none' : '1px solid #cbd5e1',
                          background: isAllowed ? '#7e22ce' : '#f8fafc',
                          color: isAllowed ? '#ffffff' : '#475569',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {isAllowed ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                        <span>{isAllowed ? 'مخول بالفتح' : 'غير مخول'}</span>
                      </button>
                    </div>

                    {/* Scope Selector */}
                    {isAllowed && (
                      <div style={{ background: '#faf5ff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #f3e8ff' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#6b21a8', marginBottom: '6px' }}>
                          النطاق المصرح له بفتح مهام داخلية إليه:
                        </div>
                        <select
                          value={currentScope}
                          onChange={e => handleChangeSubTicketScope(member.id, e.target.value as any)}
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #d8b4fe',
                            background: '#ffffff',
                            color: '#581c87',
                            fontSize: '12px',
                            fontWeight: 700,
                            outline: 'none'
                          }}
                        >
                          <option value="SAME_DIVISION">🏢 فقط لفرق وأقسام داخل قسمه (Division)</option>
                          <option value="SAME_DEPARTMENT">🏛️ لأي قسم داخل إدارته التشغيلية (Department)</option>
                          <option value="CROSS_DEPARTMENT">🌐 لكافة الإدارات التشغيلية والجهات (Cross-Dept)</option>
                        </select>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              سجل التغييرات والتدقيق السفلي (Audit Log)
             ═══════════════════════════════════════════════════════════════════ */}
          <div style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', borderRadius: '20px', padding: '20px 24px', border: '1px solid rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <History size={18} className="text-slate-500" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#334155', margin: 0 }}>
                سجل عمليات تدقيق خصائص المسار (Audit Log)
              </h3>
            </div>

            {data.auditLogs.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                لا توجد تغييرات مسجلة بعد على هذا المسار.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                {data.auditLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.8)',
                      fontSize: '12px', color: '#475569'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {log.actor?.fullName || log.actor?.username || 'المسؤول'}:
                      </span>
                      <span>
                        {log.actionType === 'PERMISSION_UPDATE' ? 'تعديل في مصفوفة الصلاحيات' :
                         log.actionType === 'RULE_CREATE' ? 'إنشاء قاعدة توجيه شرطية جديدة' :
                         log.actionType === 'RULE_TOGGLE' ? 'تبديل حالة تفعيل قاعدة توجيه' :
                         log.actionType === 'RULE_DELETE' ? 'حذف قاعدة توجيه شرطية' :
                         log.actionType === 'PRIORITY_CONFIG' ? 'تحديث إعدادات الأولوية والترقية' : log.actionType}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {new Date(log.createdAt).toLocaleString('ar-LY')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          نافذة منبثقة: إنشاء وتعديل قاعدة التوجيه الشرطي (Rule Modal)
         ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showRuleModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)' }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                width: '100%', maxWidth: '640px', background: '#ffffff', borderRadius: '24px',
                padding: '28px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(0,0,0,0.08)',
                maxHeight: '90vh', overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {editingRuleId ? 'تعديل قاعدة التوجيه الشرطي' : 'إضافة قاعدة توجيه ذكية جديدة'}
                </h3>
                <button onClick={() => setShowRuleModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Rule Name */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    اسم القاعدة <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: توجيه أعطال شبكات مبنى الشط"
                    value={ruleName}
                    onChange={e => setRuleName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                {/* Conditions (If-This) */}
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                      الشرط (إذا اختار المستخدم في النموذج):
                    </span>
                    <button
                      onClick={() => {
                        // Default to first field or building
                        if (data?.buildings && data.buildings.length > 0 && !ruleConditions.some(c => c.fieldId === 'buildingId')) {
                          setRuleConditions(prev => [...prev, { fieldId: 'buildingId', fieldName: 'المبنى والموقع', operator: 'EQUALS', value: data.buildings[0].globalId, label: data.buildings[0].name }]);
                        } else if (data?.formFields && data.formFields.length > 0) {
                          const f = data.formFields[0];
                          const opt = f.options[0];
                          setRuleConditions(prev => [...prev, { fieldId: f.id, fieldName: f.name, operator: 'EQUALS', value: opt?.id || '', label: opt?.label || '' }]);
                        }
                      }}
                      style={{ padding: '4px 10px', borderRadius: '8px', background: '#e0e7ff', color: '#4f46e5', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + إضافة شرط
                    </button>
                  </div>

                  {ruleConditions.length === 0 ? (
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
                      انقر "+ إضافة شرط" لاختيار حقل من مستدلات الفورم
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {ruleConditions.map((cond, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ffffff', padding: '8px 12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>شرط #{idx + 1}:</span>
                          
                          {/* Field Select */}
                          <select
                            value={cond.fieldId}
                            onChange={e => {
                              const fid = e.target.value;
                              if (fid === 'buildingId') {
                                const b = data?.buildings[0];
                                setRuleConditions(prev => prev.map((c, i) => i === idx ? { ...c, fieldId: 'buildingId', fieldName: 'المبنى والموقع', value: b?.globalId || '', label: b?.name || '' } : c));
                              } else {
                                const f = data?.formFields.find(fld => fld.id === fid);
                                const opt = f?.options[0];
                                setRuleConditions(prev => prev.map((c, i) => i === idx ? { ...c, fieldId: fid, fieldName: f?.name || '', value: opt?.id || '', label: opt?.label || '' } : c));
                              }
                            }}
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
                          >
                            {data?.buildings && data.buildings.length > 0 && <option value="buildingId">🏢 المبنى والموقع</option>}
                            {(data?.formFields || []).map(fld => (
                              <option key={fld.id} value={fld.id}>📋 {fld.name}</option>
                            ))}
                          </select>

                          <span style={{ fontSize: '12px', color: '#64748b' }}>يساوي:</span>

                          {/* Value Select */}
                          <select
                            value={cond.value}
                            onChange={e => {
                              const val = e.target.value;
                              let label = val;
                              if (cond.fieldId === 'buildingId') {
                                label = data?.buildings.find(b => b.globalId === val)?.name || val;
                              } else {
                                const f = data?.formFields.find(fld => fld.id === cond.fieldId);
                                label = f?.options.find(o => o.id === val)?.label || val;
                              }
                              setRuleConditions(prev => prev.map((c, i) => i === idx ? { ...c, value: val, label } : c));
                            }}
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 600 }}
                          >
                            {cond.fieldId === 'buildingId' ? (
                              (data?.buildings || []).map(b => (
                                <option key={b.globalId} value={b.globalId}>{b.name}</option>
                              ))
                            ) : (
                              (data?.formFields.find(f => f.id === cond.fieldId)?.options || []).map(o => (
                                <option key={o.id} value={o.id}>{o.label}</option>
                              ))
                            )}
                          </select>

                          <button
                            onClick={() => setRuleConditions(prev => prev.filter((_, i) => i !== idx))}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Type (Then-That) */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    نوع الإجراء عند تحقق الشرط <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { type: 'VISIBILITY_FILTER', label: 'حصر الظهور', desc: 'حجب التذكرة عن الآخرين وإظهارها للمعنيين فقط' },
                      { type: 'DIRECT_ASSIGN', label: 'إسناد مباشر فوري', desc: 'إسناد التذكرة لموظف محدد مباشرة' },
                      { type: 'ROUND_ROBIN', label: 'توزيع بالتناوب', desc: 'توزيع عادل دوري بين مجموعة موظفين' }
                    ].map(act => (
                      <div
                        key={act.type}
                        onClick={() => setRuleActionType(act.type as any)}
                        style={{
                          padding: '12px', borderRadius: '12px', cursor: 'pointer',
                          border: ruleActionType === act.type ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                          background: ruleActionType === act.type ? '#f5f3ff' : '#ffffff',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>{act.label}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>{act.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target Members Selection */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    الموظفون المعنيون بالتنفيذ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '140px', overflowY: 'auto', padding: '10px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    {data.members.map(m => {
                      const isSelected = ruleSelectedUsers.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            if (ruleActionType === 'DIRECT_ASSIGN') {
                              setRuleSelectedUsers([m.id]); // Single member for direct assign
                            } else {
                              setRuleSelectedUsers(prev => isSelected ? prev.filter(id => id !== m.id) : [...prev, m.id]);
                            }
                          }}
                          style={{
                            padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            background: isSelected ? '#4f46e5' : '#ffffff',
                            color: isSelected ? '#ffffff' : '#475569',
                            fontSize: '12px', fontWeight: 700,
                            boxShadow: isSelected ? '0 2px 6px rgba(79,70,229,0.3)' : '0 1px 3px rgba(0,0,0,0.05)'
                          }}
                        >
                          {isSelected ? '✓ ' : ''}{m.name} ({m.hierarchyRole})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowRuleModal(false)}
                    style={{ padding: '10px 20px', borderRadius: '12px', border: 'none', background: '#f1f5f9', color: '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRule}
                    disabled={isSavingRule}
                    style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', background: '#4f46e5', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    {isSavingRule ? 'جارٍ الحفظ...' : (editingRuleId ? 'حفظ التعديلات' : 'إنشاء القاعدة')}
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
