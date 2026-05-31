/**
 * LITC-TS v43.0 - TicketOperationPanel Organism
 * لوحة عمليات وإدارة التذكرة: تتيح للموظف التفاعل مع التذكرة وتحويلها وإغلاقها بشكل أمن وتفاعلي.
 */
import React, { useEffect, useState } from 'react';
import { useTheme } from '../../engine/ui-loader/ThemeProvider';
import { useAuth } from '../../engine/auth/AuthContext';
import { EventBus } from '../../engine/events/EventBus';
import { WorkflowEngine, Ticket, TicketStatus, UserRole } from '../../engine/workflow/WorkflowEngine';
import { BaseCard } from '../atoms/BaseCard';
import { BaseButton } from '../atoms/BaseButton';

interface PanelProps {
  ticketId: string;
}

export const TicketOperationPanel: React.FC<PanelProps> = ({ ticketId }) => {
  const theme = useTheme();
  const { user, hasPermission } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // تحديث بيانات التذكرة محلياً من الـ WorkflowEngine
  const refreshTicketData = () => {
    const data = WorkflowEngine.getTicket(ticketId);
    if (data) {
      setTicket({ ...data });
    } else {
      setErrorMessage('التذكرة غير موجودة في النظام.');
    }
  };

  useEffect(() => {
    refreshTicketData();

    // الاستماع لحدث تحديث التذاكر لإعادة التحميل ديناميكياً
    const handleRefresh = (eventData: any) => {
      if (eventData && eventData.ticketId === ticketId) {
        refreshTicketData();
      }
    };

    EventBus.on('TICKET_REFRESH', handleRefresh);
    return () => EventBus.off('TICKET_REFRESH', handleRefresh);
  }, [ticketId]);

  if (!user) {
    return React.createElement('div', null, 'يرجى تسجيل الدخول للوصول للوحة العمليات.');
  }

  if (errorMessage) {
    return React.createElement(
      'div',
      { style: { color: theme.colors.error, padding: theme.spacing.md } },
      errorMessage
    );
  }

  if (!ticket) {
    return React.createElement('div', null, 'جاري تحميل بيانات التذكرة...');
  }

  // 1. التحقق من التذاكر الفرعية النشطة
  const hasActiveChildren = !WorkflowEngine.canCloseParent(ticketId);

  // 2. فحص صلاحيات الأزرار ديناميكياً بناءً على الدور الحالي وحالة التذكرة
  const userRole = user.role as UserRole;
  const canAssign = WorkflowEngine.canPerformAction(userRole, 'assign', ticket.status);
  const canTransfer = WorkflowEngine.canPerformAction(userRole, 'transfer', ticket.status);
  const canClose = WorkflowEngine.canPerformAction(userRole, 'close', ticket.status);

  // دالة إسناد التذكرة
  const handleAssign = () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      // تطبيق التحديث الفعلي
      ticket.status = 'in-progress';
      ticket.assignedTechId = user.id;
      ticket.version += 1;

      WorkflowEngine.saveTicket(ticket);
      setSuccessMessage('تم إسناد التذكرة إليك بنجاح وبدء معالجتها.');
      refreshTicketData();

      // بث الحدث للجميع
      EventBus.emit('TICKET_REFRESH', { ticketId });
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // دالة تحويل القسم
  const handleTransfer = () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const targetDept = ticket.department === 'IT' ? 'Maintenance' : 'IT';
      
      // فحص أمني مزدوج: التحقق من الصلاحيات محلياً وفي الباك إند
      const userPerms = user.permissions;
      WorkflowEngine.transferDepartment(
        ticketId,
        ticket.department,
        targetDept,
        user.id,
        userPerms,
        'تم نقل التذكرة لعدم الاختصاص الفني'
      );

      setSuccessMessage(`تم تحويل التذكرة بنجاح إلى قسم: ${targetDept}`);
      refreshTicketData();

      // بث الحدث
      EventBus.emit('TICKET_REFRESH', { ticketId });
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // دالة إغلاق التذكرة
  const handleClose = () => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      // محاولة إغلاق التذكرة عبر محرك العمليات (تطبق OCC والتحقق من التذاكر الفرعية)
      WorkflowEngine.closeTicket(ticketId, user.id, userRole);

      setSuccessMessage('تم إغلاق التذكرة بنجاح وأرشفتها.');
      refreshTicketData();

      // بث الحدث
      EventBus.emit('TICKET_REFRESH', { ticketId });
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return React.createElement(
    BaseCard,
    { title: `إدارة التذكرة: ${ticket.title}` },
    React.createElement(
      'div',
      { style: { marginBottom: theme.spacing.md } },
      React.createElement('p', null, React.createElement('strong', null, 'الوصف: '), ticket.description),
      React.createElement('p', null, React.createElement('strong', null, 'القسم الحالي: '), ticket.department),
      React.createElement(
        'p',
        null,
        React.createElement('strong', null, 'الحالة الحالية: '),
        React.createElement('span', { style: { fontWeight: 'bold', color: theme.colors.primary } }, ticket.status.toUpperCase())
      ),
      React.createElement('p', null, React.createElement('strong', null, 'الموظف المعني: '), ticket.assignedTechId || 'لم تسند بعد'),
      React.createElement('p', null, React.createElement('strong', null, 'الإصدار الحالي (OCC): '), ticket.version)
    ),
    hasActiveChildren && React.createElement(
      'div',
      {
        style: {
          padding: theme.spacing.sm,
          backgroundColor: '#ffebe6',
          border: `1px solid ${theme.colors.error}`,
          color: theme.colors.error,
          borderRadius: '4px',
          marginBottom: theme.spacing.md,
          fontSize: '13px',
          fontWeight: 'bold'
        }
      },
      '⚠️ لا يمكن الإغلاق: توجد تذاكر فرعية نشطة تابعة لهذه التذكرة.'
    ),
    successMessage && React.createElement(
      'div',
      { style: { color: theme.colors.success, marginBottom: theme.spacing.sm, fontSize: '13px' } },
      `✓ ${successMessage}`
    ),
    errorMessage && React.createElement(
      'div',
      { style: { color: theme.colors.error, marginBottom: theme.spacing.sm, fontSize: '13px' } },
      `❌ ${errorMessage}`
    ),
    React.createElement(
      'div',
      { style: { display: 'flex', gap: theme.spacing.sm } },
      canAssign && React.createElement(BaseButton, { label: 'إسناد التذكرة لي', onClick: handleAssign, variant: 'primary' }),
      canTransfer && React.createElement(BaseButton, { label: 'تحويل التذكرة', onClick: handleTransfer, variant: 'secondary' }),
      canClose && React.createElement(BaseButton, {
        label: 'إغلاق التذكرة',
        onClick: handleClose,
        variant: 'primary',
        disabled: hasActiveChildren
      })
    ),
    ticket.workflowPath.length > 0 && React.createElement(
      'div',
      { style: { marginTop: theme.spacing.lg, paddingTop: theme.spacing.md, borderTop: '1px solid #eee' } },
      React.createElement('h4', { style: { margin: 0, marginBottom: theme.spacing.sm, color: theme.colors.text } }, 'سجل التحويلات بين الأقسام:'),
      React.createElement(
        'ul',
        { style: { paddingRight: '20px', fontSize: '12px', color: '#555' } },
        ticket.workflowPath.map((step, idx) =>
          React.createElement(
            'li',
            { key: idx, style: { marginBottom: theme.spacing.xs } },
            'تم نقلها من ',
            React.createElement('strong', null, step.fromDepartment),
            ' إلى ',
            React.createElement('strong', null, step.toDepartment),
            ' بواسطة ',
            React.createElement('strong', null, step.transferredBy),
            ` (السبب: ${step.reason})`
          )
        )
      )
    )
  );
};
