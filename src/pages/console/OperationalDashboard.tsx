/**
 * LITC-TS v43.3 - OperationalDashboard Component (Glassmorphism & Secure Guard)
 * لوحة العمليات المركزية للمستخدمين: تدعم حوكمة الصلاحيات الديناميكية، التحديث اللحظي، والجمالية الزجاجية (Glassmorphism).
 * v43.2: إضافة شارة إعادة الاتصال النيونية (Reconnecting Badge) ومستمع حالة الاتصال الحية (CONNECTION_STATUS_CHANGED).
 * v43.3: إضافة مستمع قاطع الدائرة (CIRCUIT_BREAKER_STATE_CHANGED) وشارة الطابور المعلق النيونية.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { EventBus } from '../../engine/events/EventBus';
import { RealTimeSynchronizer, ConnectionStatus } from '../../services/RealTimeSynchronizer';
import { Ticket, WorkflowEngine } from '../../engine/workflow/WorkflowEngine';
import { FieldDefinition, FieldType } from '../../types/dynamicFields';
import { SlaCountdownTimer } from '../../components/atoms/SlaCountdownTimer';
import { ActionModals } from '../../components/organisms/ActionModals';
import { useRealTimeConnection, CircuitState } from '../../hooks/useRealTimeConnection';

// =========================================================================
// واجهة محاكاة لـ DatabaseController للربط مع الـ API الخلفي
// =========================================================================
const DatabaseControllerClient = {
  transferTicket: async (ticketId: string, targetDepartment: string, username: string, transferReason: string): Promise<void> => {
    const response = await fetch(`/api/v1/db-tickets/${ticketId}/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token' // يتم سحب التوكن أمنياً في الإنتاج
      },
      body: JSON.stringify({ targetDepartment, user: username, transferReason })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || 'فشلت عملية تحويل التذكرة',
        status: response.status,
        errorName: errorData.errorName
      };
    }
  },

  closeParentTicket: async (ticketId: string): Promise<void> => {
    const response = await fetch(`/api/v1/db-tickets/${ticketId}/close`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || 'فشلت عملية إغلاق التذكرة',
        status: response.status,
        errorName: errorData.errorName
      };
    }
  },

  createSubTicket: async (parentId: string, payload: { title: string, description: string, targetDepartment: string }): Promise<void> => {
    const response = await fetch(`/api/v1/tickets/${parentId}/sub-tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.message || 'فشل إنشاء التذكرة الفرعية',
        status: response.status,
        errorName: errorData.errorName
      };
    }
  }
};

// =========================================================================
// المكون الفرعي لسطر التذكرة لضمان كفاءة التصيير وحظر الـ Re-renders الزائدة
// =========================================================================
const TicketRowComponent: React.FC<{
  ticket: Ticket;
  canTransfer: boolean;
  canClose: boolean;
  disabled?: boolean;
  isHighlighted?: boolean;
  isEscalatedHighlighted?: boolean;
  onOpenTransferModal: (ticketId: string) => void;
  onCloseTicket: (ticketId: string) => void;
  onCreateSubTicket: (ticketId: string) => void;
}> = React.memo(({ ticket, canTransfer, canClose, disabled, isHighlighted, isEscalatedHighlighted, onOpenTransferModal, onCloseTicket, onCreateSubTicket }) => {
  const theme = useTheme();

  const statusColors: Record<string, string> = {
    'new': '#0052cc',
    'in-progress': '#ff8c00',
    'transferred': '#8a2be2',
    'resolved': '#00875a',
    'closed': '#6b778c'
  };

  const statusLabels: Record<string, string> = {
    'new': 'جديدة',
    'in-progress': 'قيد المعالجة',
    'transferred': 'محولة للقسم',
    'resolved': 'تم حلها',
    'closed': 'مغلقة'
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr 1fr 1.5fr',
    alignItems: 'center',
    padding: theme.spacing.md,
    background: isHighlighted 
      ? 'rgba(0, 135, 90, 0.15)' 
      : isEscalatedHighlighted 
        ? 'rgba(255, 140, 0, 0.15)' 
        : 'rgba(255, 255, 255, 0.08)',
    border: isHighlighted 
      ? '2px solid #00875a' 
      : isEscalatedHighlighted 
        ? '2px solid #ff8c00' 
        : '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: isHighlighted 
      ? '0 0 15px rgba(0, 135, 90, 0.5)' 
      : isEscalatedHighlighted 
        ? '0 0 20px #ff8c00' 
        : 'none',
    borderRadius: '12px',
    marginBottom: theme.spacing.sm,
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily,
    backdropFilter: 'blur(8px)',
    transition: 'all 0.4s ease'
  };

  const badgeStyle: React.CSSProperties = {
    backgroundColor: statusColors[ticket.status] || '#ccc',
    color: '#ffffff',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  };

  const buttonStyle = (variant: 'danger' | 'warning', btnDisabled?: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: btnDisabled ? 'not-allowed' : 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    color: '#ffffff',
    backgroundColor: btnDisabled ? 'rgba(255, 255, 255, 0.15)' : (variant === 'danger' ? theme.colors.error : '#ff8c00'),
    marginRight: theme.spacing.xs,
    transition: 'all 0.2s',
    opacity: btnDisabled ? 0.5 : 1
  });

  const slaDeadline = ticket.slaDeadline || new Date(new Date(ticket.createdAt || Date.now()).getTime() + 60 * 60 * 1000).toISOString();

  return (
    <div style={rowStyle} className="hover:scale-[1.01] hover:bg-white/15">
      <strong>{ticket.id}</strong>
      <span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {ticket.title}
          {ticket.isEscalated && (
            <span style={{
              marginLeft: '8px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#ff8c00',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              تصعيد SLA
            </span>
          )}
        </div>
        {ticket.captured_historical_data && (
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px', background: 'rgba(0,0,0,0.1)', padding: '6px', borderRadius: '6px' }}>
            {ticket.captured_historical_data.mainIssueLabel && (
              <span style={{ fontWeight: 'bold', color: theme.colors.primary || '#00e5ff' }}>
                📌 {ticket.captured_historical_data.mainIssueLabel} 
                {ticket.captured_historical_data.subIssueLabel ? ` > ${ticket.captured_historical_data.subIssueLabel}` : ''}
              </span>
            )}
            {ticket.captured_historical_data.customFieldsLabels && Object.entries(ticket.captured_historical_data.customFieldsLabels).map(([key, val]) => (
               <span key={key}>▪️ {key}: <strong>{String(val)}</strong></span>
            ))}
          </div>
        )}
      </span>
      <span>
        {ticket.department}
        <div style={{ marginTop: '5px' }}>
          <SlaCountdownTimer deadline={slaDeadline} />
        </div>
      </span>
      <div>
        <span style={badgeStyle}>{statusLabels[ticket.status]}</span>
      </div>
      <div>
        {canTransfer && ticket.status !== 'closed' && (
          <button 
            style={buttonStyle('warning', disabled)}
            onClick={() => onOpenTransferModal(ticket.id)}
            disabled={disabled}
          >
            تحويل القسم
          </button>
        )}
        {canClose && ticket.status !== 'closed' && (
          <button 
            style={buttonStyle('danger', disabled)}
            onClick={() => onCloseTicket(ticket.id)}
            disabled={disabled}
          >
            إغلاق
          </button>
        )}
        {ticket.status !== 'closed' && (
          <button 
            style={buttonStyle('warning', disabled)}
            onClick={() => onCreateSubTicket(ticket.id)}
            disabled={disabled}
          >
            تذكرة فرعية
          </button>
        )}
      </div>
      
      {/* Sub-Tickets Tree View */}
      {(ticket as any).subTickets && (ticket as any).subTickets.length > 0 && (
        <div style={{ gridColumn: '1 / -1', marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: `4px solid ${theme.colors?.primary || '#00e5ff'}` }}>
          <h5 style={{ margin: '0 0 10px 0', color: theme.colors?.primary || '#00e5ff', fontSize: '12px' }}>التذاكر المتفرعة (Sub-Tickets):</h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {(ticket as any).subTickets.map((st: any) => (
              <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', fontSize: '11px' }}>
                <span><strong>#{st.id}</strong> {st.title}</span>
                <span style={{
                  color: st.stateId === 5 || st.stateId === 6 ? '#00875a' : '#ff8c00',
                  fontWeight: 'bold'
                }}>
                  {st.stateId === 5 || st.stateId === 6 ? 'مغلقة' : 'مفتوحة'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

TicketRowComponent.displayName = 'TicketRowComponent';

// =========================================================================
// المكون الرئيسي: OperationalDashboard.tsx
// =========================================================================
export const OperationalDashboard: React.FC<{
  permissions?: {
    canTransfer: boolean;
    canClose: boolean;
  };
}> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // الحالة المحلية لإدارة صلاحيات الدور المستلمة ديناميكياً
  const [permissions, setPermissions] = useState<{ canTransfer: boolean; canClose: boolean } | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState<boolean>(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
  // خطاف جلب الصلاحيات ديناميكياً من الباك-إند بناءً على دور المستخدم
  const fetchPermissions = useCallback(async (showLoading = true) => {
    if (!user) {
      if (isMountedRef.current) {
        setLoadingPermissions(false);
      }
      return;
    }
    try {
      if (showLoading) {
        setLoadingPermissions(true);
      }
      setPermissionsError(null);
      
      // محاكاة تأخير شبكي طفيف (Latency) لاختبار استمرارية وتأثير المؤشر الزجاجي
      if (showLoading) {
        await new Promise((resolve) => setTimeout(resolve, 800));
      }

      const response = await fetch(`/api/v1/auth/permissions/${user.role}`, {
        headers: {
          'Authorization': 'Bearer system_token_123',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load permissions: ${response.statusText}`);
      }

      const data = await response.json();
      if (isMountedRef.current) {
        setPermissions(data);
      }
    } catch (err: any) {
      console.error('[OperationalDashboard] permissions fetch error:', err);
      if (isMountedRef.current) {
        setPermissionsError(err.message || 'خطأ في تحميل الصلاحيات');
        // أدنى صلاحية أمنية عند الفشل لمنع الاختراقات
        setPermissions({ canTransfer: false, canClose: false });
      }
    } finally {
      if (showLoading && isMountedRef.current) {
        setLoadingPermissions(false);
      }
    }
  }, [user]);

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // القسم الحالي الخاص بالموظف
  const userDept = useMemo(() => {
    return (user as any)?.department || 'IT';
  }, [user]);

  const {
    connectionStatus,
    circuitBreakerState,
    queuedOpsCount,
    tickets,
    highlightedTicketId,
    escalatedHighlightTicketId,
    notifications,
    toasts,
    setNotifications,
    setToasts,
    loadTickets,
    showToast
  } = useRealTimeConnection({ user, userDept, fetchPermissions });

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Ticket Creation Form State with Dynamic Fields
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createTitle, setCreateTitle] = useState<string>('');
  const [createDescription, setCreateDescription] = useState<string>('');
  const [createDept, setCreateDept] = useState<string>('IT');
  const [createLocation, setCreateLocation] = useState<string>('المقر الرئيسي');
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});

  // Sub-Ticket Form State
  const [isSubTicketModalOpen, setIsSubTicketModalOpen] = useState<boolean>(false);
  const [subTicketParentId, setSubTicketParentId] = useState<string | null>(null);
  const [subTicketTitle, setSubTicketTitle] = useState<string>('');
  const [subTicketDescription, setSubTicketDescription] = useState<string>('');
  const [subTicketDept, setSubTicketDept] = useState<string>('IT');

  const createDeptRef = useRef(createDept);
  useEffect(() => {
    createDeptRef.current = createDept;
  }, [createDept]);

  // Fetch dynamic fields on department selection change
  const fetchFieldsForDept = useCallback(async (dept: string, signal?: AbortSignal) => {
    try {
      const res = await fetch(`/api/v1/departments/fields/${dept}`, {
        signal,
        headers: {
          'Authorization': 'Bearer system_token_123'
        }
      });
      if (res.ok) {
        const json = await res.json();
        setFields(json.data || []);
      } else {
        setFields([]);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[OperationalDashboard] Failed to fetch department fields:', err);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchFieldsForDept(createDept, controller.signal);
    return () => {
      controller.abort();
    };
  }, [createDept, fetchFieldsForDept]);




  // حالة التحكم بقفل التبريد وإرسال النموذج لمنع السبام وحماية السيرفر
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [isCooldownActive, setIsCooldownActive] = useState<boolean>(false);

  // إدارة العداد التنازلي وتطهيره أمنياً لمنع تسريب الذاكرة (Memory Leaks)
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (isCooldownActive && cooldownSeconds > 0) {
      intervalId = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            setIsCooldownActive(false);
            if (intervalId) clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isCooldownActive, cooldownSeconds]);

  // Smart Filters
  const [filterBuildingText, setFilterBuildingText] = useState<string>('');
  const [filterMainIssueText, setFilterMainIssueText] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetDept, setTargetDept] = useState('IT');
  const [reason, setReason] = useState('');
  
  // حالة الإشعارات والتحذيرات
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);

  // إغلاق التذكرة بقفل التبعية التراكمي
  const handleCloseTicket = useCallback(async (ticketId: string) => {
    if (isSubmitting || isCooldownActive) return;

    try {
      setIsSubmitting(true);
      setAlertMessage(null);
      setSuccessMessage(null);

      await DatabaseControllerClient.closeParentTicket(ticketId);

      // في حال النجاح، تحديث الواجهة وبث تحديث
      setSuccessMessage(`تم إغلاق التذكرة ${ticketId} بنجاح.`);
      loadTickets();
      EventBus.emit('TICKET_REFRESH', { ticketId });
    } catch (error: any) {
      // التقاط حوكمة الأخطاء 409 للـ WorkflowViolation
      if (error.status === 409 || error.errorName === 'WorkflowViolationError') {
        setAlertMessage(`خطأ حوكمة العمليات: ${error.message}`);
        // تفعيل قفل التبريد الأمني والعداد التنازلي لحماية قاعدة البيانات
        setCooldownSeconds(10);
        setIsCooldownActive(true);
      } else {
        setAlertMessage(`فشل الإغلاق: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [loadTickets, isSubmitting, isCooldownActive]);

  // تحويل التذكرة للقسم المستهدف
  const handleTransferSubmit = useCallback(async () => {
    if (!selectedTicketId || isSubmitting || isCooldownActive) return;

    try {
      setIsSubmitting(true);
      setAlertMessage(null);
      setSuccessMessage(null);

      if (!reason.trim()) {
        throw new Error('يرجى كتابة سبب التحويل.');
      }

      await DatabaseControllerClient.transferTicket(
        selectedTicketId,
        targetDept,
        user?.id || 'anonymous',
        reason
      );

      setSuccessMessage(`تم تحويل التذكرة ${selectedTicketId} للقسم ${targetDept} بنجاح.`);
      setIsModalOpen(false);
      setReason('');
      loadTickets();
      EventBus.emit('TICKET_REFRESH', { ticketId: selectedTicketId });
    } catch (error: any) {
      if (error.status === 409 || error.errorName === 'WorkflowViolationError') {
        setAlertMessage(`خطأ حوكمة العمليات: ${error.message}`);
        // تفعيل قفل التبريد الأمني والعداد التنازلي
        setCooldownSeconds(10);
        setIsCooldownActive(true);
      } else {
        setAlertMessage(`فشل التحويل: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTicketId, targetDept, user, reason, loadTickets, isSubmitting, isCooldownActive]);

  const openSubTicketModal = useCallback((ticketId: string) => {
    setSubTicketParentId(ticketId);
    setSubTicketTitle('');
    setSubTicketDescription('');
    setSubTicketDept('IT'); // Default or could be dynamic
    setIsSubTicketModalOpen(true);
  }, []);

  const handleSubTicketSubmit = useCallback(async () => {
    if (!subTicketParentId || isSubmitting || isCooldownActive) return;
    try {
      setIsSubmitting(true);
      setAlertMessage(null);
      setSuccessMessage(null);

      if (!subTicketTitle.trim() || !subTicketDescription.trim()) {
        throw new Error('يرجى ملء الحقول المطلوبة للتذكرة الفرعية.');
      }

      await DatabaseControllerClient.createSubTicket(subTicketParentId, {
        title: subTicketTitle,
        description: subTicketDescription,
        targetDepartment: subTicketDept
      });

      // Update UI Mock Database so it renders immediately
      const parentTicket = (WorkflowEngine as any)['mockDatabase'].get(subTicketParentId);
      if (parentTicket) {
        if (!parentTicket.subTickets) parentTicket.subTickets = [];
        const newSubTicket = {
          id: `SUB-${Date.now().toString().slice(-4)}`,
          title: `[Sub-Ticket] ${subTicketTitle}`,
          description: subTicketDescription,
          status: 'new',
          stateId: 1, // OPEN
          department: subTicketDept
        };
        parentTicket.subTickets.push(newSubTicket);
      }

      setSuccessMessage(`تم إنشاء التذكرة الفرعية تحت التذكرة رقم ${subTicketParentId}`);
      setIsSubTicketModalOpen(false);
      setSubTicketParentId(null);
      setSubTicketTitle('');
      setSubTicketDescription('');
      loadTickets();
      EventBus.emit('TICKET_REFRESH', { ticketId: subTicketParentId });
    } catch (error: any) {
      if (error.status === 409 || error.errorName === 'WorkflowViolationError') {
        setAlertMessage(`خطأ حوكمة العمليات: ${error.message}`);
        setCooldownSeconds(10);
        setIsCooldownActive(true);
      } else {
        setAlertMessage(`فشل الإنشاء: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [subTicketParentId, subTicketTitle, subTicketDescription, subTicketDept, isSubmitting, isCooldownActive, loadTickets]);

  const handleCreateTicketSubmit = useCallback(async () => {
    if (isSubmitting || isCooldownActive) return;
    try {
      setIsSubmitting(true);
      setAlertMessage(null);
      setSuccessMessage(null);

      if (!createTitle.trim() || !createDescription.trim()) {
        throw new Error('يرجى ملء الحقول الأساسية (العنوان والوصف).');
      }

      // Check required dynamic fields
      for (const f of fields) {
        if (f.required && !dynamicFieldValues[f.fieldId]?.trim()) {
          throw new Error(`الحقل "${f.label}" مطلوب.`);
        }
      }

      // Serialize dynamic field values into the description or a structured payload
      const serializedCustomFields = Object.keys(dynamicFieldValues)
        .map(key => {
          const fieldDef = fields.find(f => f.fieldId === key);
          return fieldDef ? `${fieldDef.label}: ${dynamicFieldValues[key]}` : '';
        })
        .filter(Boolean)
        .join(' | ');

      const fullDescription = serializedCustomFields 
        ? `${createDescription}\n\n[حقول ديناميكية مخصصة]: ${serializedCustomFields}`
        : createDescription;

      const response = await fetch('/api/v1/db-tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer system_token_123'
        },
        body: JSON.stringify({
          title: createTitle,
          description: fullDescription,
          creatorId: user?.id || 'unknown',
          department: createDept,
          building: createLocation
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'فشلت عملية إنشاء التذكرة');
      }

      setSuccessMessage(`تم إنشاء التذكرة بنجاح للقسم ${createDept}.`);
      setIsCreateModalOpen(false);
      setCreateTitle('');
      setCreateDescription('');
      setDynamicFieldValues({});
      loadTickets();
      EventBus.emit('TICKET_REFRESH', {});
    } catch (err: any) {
      setAlertMessage(err.message || 'حدث خطأ أثناء إنشاء التذكرة');
    } finally {
      setIsSubmitting(false);
    }
  }, [createTitle, createDescription, createDept, createLocation, fields, dynamicFieldValues, user, isSubmitting, isCooldownActive, loadTickets]);

  const openTransferModal = useCallback((ticketId: string) => {
    setSelectedTicketId(ticketId);
    setIsModalOpen(true);
  }, []);

  // الجمالية البصرية الزجاجية (Glassmorphism Layout Styling)
  const dashboardContainerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderRadius: '24px',
    background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.15) 0%, rgba(255, 140, 0, 0.1) 100%)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily,
    maxWidth: '1200px',
    margin: '20px auto',
    boxSizing: 'border-box'
  };

  const headerStyle: React.CSSProperties = {
    fontSize: theme.typography.sizes.xlarge,
    fontWeight: theme.typography.fontWeight.bold,
    marginBottom: theme.spacing.md,
    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
    paddingBottom: theme.spacing.sm,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const bellContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    marginRight: theme.spacing.md,
    cursor: 'pointer'
  };

  const bellIconStyle: React.CSSProperties = {
    fontSize: '18px',
    padding: '6px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: unreadCount > 0 ? '#ff3366' : '#ffffff',
    textShadow: unreadCount > 0 ? '0 0 8px #ff3366' : 'none',
    boxShadow: unreadCount > 0 ? '0 0 12px rgba(255, 51, 102, 0.4)' : '0 0 10px rgba(255, 255, 255, 0.1)',
  };

  const bellBadgeStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    background: '#ff3366',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 'bold',
    borderRadius: '50%',
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 8px #ff3366',
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '36px',
    left: '0',
    width: '300px',
    maxHeight: '350px',
    overflowY: 'auto',
    background: 'rgba(23, 43, 77, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
    zIndex: 100,
    padding: theme.spacing.sm,
    color: '#ffffff',
    direction: 'rtl',
    textAlign: 'right'
  };

  const notifItemStyle = (read: boolean): React.CSSProperties => ({
    padding: theme.spacing.xs,
    borderRadius: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    background: read ? 'transparent' : 'rgba(255, 255, 255, 0.04)',
    marginBottom: '4px',
    fontSize: '12px',
    transition: 'background 0.2s'
  });

  const toastContainerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1100,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    pointerEvents: 'none'
  };

  const toastStyle: React.CSSProperties = {
    pointerEvents: 'auto',
    background: 'rgba(23, 43, 77, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(0, 163, 255, 0.4)',
    boxShadow: '0 0 15px rgba(0, 163, 255, 0.3)',
    borderRadius: '12px',
    padding: '12px 20px',
    width: '280px',
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    animation: 'slideIn 0.3s ease-out',
    direction: 'rtl'
  };

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)'
  };

  const modalContentStyle: React.CSSProperties = {
    background: 'rgba(23, 43, 77, 0.85)',
    backdropFilter: 'blur(25px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '16px',
    padding: theme.spacing.lg,
    width: '450px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
    color: '#ffffff',
    fontFamily: theme.typography.fontFamily
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: theme.spacing.sm,
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
    marginBottom: theme.spacing.md,
    fontSize: '14px',
    boxSizing: 'border-box'
  };

  const submitButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#0052cc',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: theme.spacing.sm
  };

  const cancelButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer'
  };

  if (loadingPermissions) {
    const loaderContainerStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
      borderRadius: '24px',
      background: 'linear-gradient(135deg, rgba(0, 82, 204, 0.1) 0%, rgba(255, 140, 0, 0.05) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.25)',
      maxWidth: '600px',
      margin: '80px auto',
      color: '#ffffff',
      fontFamily: theme.typography.fontFamily,
      boxSizing: 'border-box',
      textAlign: 'center'
    };

    const spinnerStyle: React.CSSProperties = {
      width: '50px',
      height: '50px',
      border: '3px solid rgba(255, 255, 255, 0.1)',
      borderTop: `3px solid ${theme.colors.primary || '#0052cc'}`,
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: theme.spacing.md
    };

    return (
      <div style={loaderContainerStyle}>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div style={spinnerStyle} />
        <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold' }}>نظام الحوكمة السيادي للأمان</h3>
        <p style={{ margin: 0, opacity: 0.8, fontSize: '13px' }}>جاري استدعاء صلاحيات الوصول الفعالة ديناميكياً...</p>
      </div>
    );
  }

  return (
    <div style={dashboardContainerStyle}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes reconnectPulse {
          0%   { opacity: 1; box-shadow: 0 0 10px rgba(255, 140, 0, 0.7); }
          50%  { opacity: 0.55; box-shadow: 0 0 22px rgba(255, 140, 0, 0.3); }
          100% { opacity: 1; box-shadow: 0 0 10px rgba(255, 140, 0, 0.7); }
        }
        @keyframes circuitBreakerFlash {
          0%   { opacity: 1; box-shadow: 0 0 14px rgba(255, 200, 0, 0.9); }
          50%  { opacity: 0.6; box-shadow: 0 0 6px rgba(255, 200, 0, 0.3); }
          100% { opacity: 1; box-shadow: 0 0 14px rgba(255, 200, 0, 0.9); }
        }
      `}</style>
      <div style={headerStyle}>
        <span>لوحة العمليات المركزية للأقسام (v43.5)</span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: '6px 14px',
              background: 'rgba(0, 163, 255, 0.15)',
              border: '2px solid rgba(0, 163, 255, 0.5)',
              boxShadow: '0 0 10px rgba(0, 163, 255, 0.3)',
              borderRadius: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              marginLeft: '15px',
              transition: 'all 0.2s'
            }}
          >
            ➕ إنشاء تذكرة جديدة
          </button>
          <span style={{ fontSize: '13px', opacity: 0.8 }}>القسم النشط: <strong>{userDept}</strong></span>
          {notifSettings.isBellEnabled && (
            <div style={bellContainerStyle} onClick={() => {
              setIsNotifOpen(prev => !prev);
              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            }}>
              <div style={bellIconStyle}>
                🔔
                {unreadCount > 0 && <span style={bellBadgeStyle}>{unreadCount}</span>}
              </div>
              {isNotifOpen && (
                <div style={dropdownStyle} onClick={(e) => e.stopPropagation()}>
                  <div style={{ fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '6px', marginBottom: '8px', fontSize: '13px' }}>
                    الإشعارات اللحظية
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: theme.spacing.md, textAlign: 'center', opacity: 0.6, fontSize: '12px' }}>
                      لا توجد إشعارات جديدة.
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} style={notifItemStyle(n.read)}>
                        <div style={{ fontWeight: 'bold', color: '#ff8c00', marginBottom: '2px' }}>{n.title}</div>
                        <div style={{ opacity: 0.9 }}>{n.content}</div>
                        <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', textAlign: 'left' }}>{n.timestamp}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <div style={{ padding: theme.spacing.sm, backgroundColor: 'rgba(0, 135, 90, 0.2)', border: '1px solid #00875a', borderRadius: '8px', marginBottom: theme.spacing.md, fontSize: '13px' }}>
          ✓ {successMessage}
        </div>
      )}

      {alertMessage && (
        <div style={{ 
          padding: theme.spacing.sm, 
          backgroundColor: 'rgba(222, 53, 11, 0.2)', 
          border: '1px solid #de350b', 
          borderRadius: '8px', 
          marginBottom: theme.spacing.md, 
          fontSize: '13px',
          color: '#ffdddd',
          fontWeight: 'bold',
          boxShadow: alertMessage.includes('حوكمة العمليات') ? '0 0 20px rgba(222, 53, 11, 0.8), inset 0 0 10px rgba(222, 53, 11, 0.5)' : 'none',
          textShadow: alertMessage.includes('حوكمة العمليات') ? '0 0 8px rgba(255, 100, 100, 0.8)' : 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ {alertMessage}</span>
          {isCooldownActive && (
            <span style={{
              padding: '4px 10px',
              borderRadius: '20px',
              background: 'rgba(255, 0, 85, 0.15)',
              border: '1px solid rgba(255, 0, 85, 0.4)',
              boxShadow: '0 0 10px rgba(255, 0, 85, 0.4)',
              color: '#ff3366',
              fontSize: '11px',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              backdropFilter: 'blur(5px)',
              marginLeft: '10px',
              whiteSpace: 'nowrap'
            }}>
              يرجى الانتظار {cooldownSeconds} ثوانٍ قبل المحاولة مجدداً
            </span>
          )}
        </div>
      )}

      <div style={{ marginBottom: theme.spacing.md, fontWeight: 'bold', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>قائمة التذاكر التشغيلية الخاصة بقسمك:</span>
      </div>

      {/* Smart Filter Panel (Glassmorphism) */}
      <div style={{ marginBottom: theme.spacing.lg, padding: theme.spacing.md, background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '15px', alignItems: 'center', backdropFilter: 'blur(10px)' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', color: theme.colors?.primary || '#00e5ff' }}>🔍 فلاتر ذكية:</div>
        <input 
          type="text" 
          placeholder="بحث بنوع المشكلة (مثال: هاردوير)..." 
          value={filterMainIssueText}
          onChange={e => setFilterMainIssueText(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '12px', flex: 1, outline: 'none' }}
        />
        <input 
          type="text" 
          placeholder="بحث بالمبنى/الموقع..." 
          value={filterBuildingText}
          onChange={e => setFilterBuildingText(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: '#fff', fontSize: '12px', flex: 1, outline: 'none' }}
        />
      </div>

      {(() => {
        // [TODO/Blueprint] Decoupling Filter Logic: 
        // الفلترة النصية الحالية (Client-Side) مخصصة للبيئة التجريبية (Mock) فقط.
        // عند الربط الفعلي بقاعدة البيانات (SQL Server)، يجب تفريغ هذه العملية (Offloading)
        // وتمرير قيم الفلاتر (filterMainIssueText, filterBuildingText) كـ Server-Side Query Parameters
        // مثال: GET /api/v1/tickets?building=123&issueType=456 
        // لضمان استقرار أداء الواجهة (UI Rendering) وعدم حدوث تجميد عند كثرة التذاكر.
        const filteredTickets = tickets.filter(t => {
          if (filterMainIssueText && !t.captured_historical_data?.mainIssueLabel?.toLowerCase().includes(filterMainIssueText.toLowerCase()) && !t.title.toLowerCase().includes(filterMainIssueText.toLowerCase())) return false;
          
          if (filterBuildingText) {
            let foundBuilding = false;
            if (t.captured_historical_data?.customFieldsLabels) {
              for (const val of Object.values(t.captured_historical_data.customFieldsLabels)) {
                if (String(val).toLowerCase().includes(filterBuildingText.toLowerCase())) {
                  foundBuilding = true;
                  break;
                }
              }
            }
            if (!foundBuilding) return false;
          }
          return true;
        });

        if (filteredTickets.length === 0) {
          return (
            <div style={{ padding: theme.spacing.xl, textAlign: 'center', opacity: 0.6, fontSize: '14px' }}>
              لا توجد تذاكر مطابقة لخيارات الفلترة المحددة.
            </div>
          );
        }

        return (
          <div>
            {filteredTickets.map((ticket) => (
              <TicketRowComponent
                key={ticket.id}
                ticket={ticket}
                canTransfer={permissions?.canTransfer || false}
                canClose={permissions?.canClose || false}
                disabled={isSubmitting || isCooldownActive}
                isHighlighted={highlightedTicketId === ticket.id}
                isEscalatedHighlighted={escalatedHighlightTicketId === ticket.id}
                onOpenTransferModal={openTransferModal}
                onCloseTicket={handleCloseTicket}
                onCreateSubTicket={openSubTicketModal}
              />
            ))}
          </div>
        );
      })()}

      {/* All Action Modals */}
      <ActionModals
        theme={theme}
        isSubmitting={isSubmitting}
        isCooldownActive={isCooldownActive}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        targetDept={targetDept}
        setTargetDept={setTargetDept}
        reason={reason}
        setReason={setReason}
        handleTransferSubmit={handleTransferSubmit}
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        createTitle={createTitle}
        setCreateTitle={setCreateTitle}
        createDescription={createDescription}
        setCreateDescription={setCreateDescription}
        createLocation={createLocation}
        setCreateLocation={setCreateLocation}
        createDept={createDept}
        setCreateDept={setCreateDept}
        fields={fields}
        dynamicFieldValues={dynamicFieldValues}
        setDynamicFieldValues={setDynamicFieldValues}
        handleCreateTicketSubmit={handleCreateTicketSubmit}
        isSubTicketModalOpen={isSubTicketModalOpen}
        setIsSubTicketModalOpen={setIsSubTicketModalOpen}
        subTicketParentId={subTicketParentId}
        subTicketTitle={subTicketTitle}
        setSubTicketTitle={setSubTicketTitle}
        subTicketDescription={subTicketDescription}
        setSubTicketDescription={setSubTicketDescription}
        subTicketDept={subTicketDept}
        setSubTicketDept={setSubTicketDept}
        handleSubTicketSubmit={handleSubTicketSubmit}
      />

      {/* Toast Alert Container */}
      <div style={toastContainerStyle}>
        {toasts.map(t => (
          <div key={t.id} style={toastStyle}>
            <div style={{ fontWeight: 'bold', color: '#00a3ff', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔔</span> {t.title}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.9 }}>{t.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
OperationalDashboard.displayName = 'OperationalDashboard';
