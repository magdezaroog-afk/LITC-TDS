import { useState, useEffect, useRef, useCallback } from 'react';
import { EventBus } from '../engine/events/EventBus';
import { RealTimeSynchronizer, ConnectionStatus } from '../services/RealTimeSynchronizer';
import { Ticket, WorkflowEngine } from '../engine/workflow/WorkflowEngine';

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

interface NotifSettings {
  isToastEnabled: boolean;
  isBellEnabled: boolean;
}

interface RealTimeConnectionProps {
  user: any;
  userDept: string;
  fetchPermissions: (showLoading?: boolean) => void;
}

export const useRealTimeConnection = ({ user, userDept, fetchPermissions }: RealTimeConnectionProps) => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('CONNECTED');
  const [circuitBreakerState, setCircuitBreakerState] = useState<CircuitState>('CLOSED');
  const [queuedOpsCount, setQueuedOpsCount] = useState<number>(0);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [highlightedTicketId, setHighlightedTicketId] = useState<string | null>(null);
  const [escalatedHighlightTicketId, setEscalatedHighlightTicketId] = useState<string | null>(null);
  
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; content: string; timestamp: string; read: boolean }>>([]);
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string }>>([]);
  const [notifSettings, setNotifSettings] = useState<NotifSettings>({ isToastEnabled: true, isBellEnabled: true });

  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const escalateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const notifSettingsRef = useRef(notifSettings);
  const toastTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const showToast = useCallback((title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message }]);
    const timeout = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
    toastTimeoutsRef.current.push(timeout);
  }, []);

  const fetchNotifSettings = useCallback(async () => {
    if (!userDept) return;
    try {
      const response = await fetch(`/api/v1/admin/notification-config/${userDept}`, {
        headers: {
          'Authorization': 'Bearer system_token_123'
        }
      });
      if (response.ok) {
        const data = await response.json();
        const settings = {
          isToastEnabled: !!data.isToastEnabled,
          isBellEnabled: !!data.isBellEnabled
        };
        if (isMountedRef.current) {
          setNotifSettings(settings);
          notifSettingsRef.current = settings;
        }
      }
    } catch (err) {
      console.error('[OperationalDashboard] failed to fetch notification config:', err);
    }
  }, [userDept]);

  const loadTickets = useCallback(() => {
    if (!user) return;
    const allTickets: Ticket[] = [];
    const role = (user as any)?.role || 'technician';
    const isTopManager = role === 'admin' || role === 'manager'; 

    WorkflowEngine['mockDatabase'].forEach((t) => {
      const belongsToUserDept = t.department === userDept || t.routeId === userDept; 
      if (isTopManager || belongsToUserDept) {
        allTickets.push(t);
      }
    });

    allTickets.sort((a, b) => {
      const aEsc = a.isEscalated ? 1 : 0;
      const bEsc = b.isEscalated ? 1 : 0;
      return bEsc - aEsc;
    });
    
    if (isMountedRef.current) {
      setTickets(allTickets);
    }
  }, [userDept, user]);

  useEffect(() => {
    if (user) {
      RealTimeSynchronizer.connect(user.permissions, userDept);
      loadTickets();
      fetchNotifSettings();

      const handleTicketUpdate = (event: any) => {
        if (event.department === userDept) {
          loadTickets();
        }
      };

      const handlePermissionsUpdate = () => {
        fetchPermissions(false);
        fetchNotifSettings();
      };

      const handleTicketTransferred = (event: any) => {
        if (event && event.ticketId) {
          const ticket = WorkflowEngine.getTicket(event.ticketId);
          if (ticket) {
            ticket.department = event.department;
            ticket.status = 'transferred';
            ticket.version = (ticket.version || 0) + 1;
            WorkflowEngine.saveTicket(ticket);
          } else {
            const newMockTicket: Ticket = {
              id: event.ticketId,
              title: `تذكرة محولة جديدة (${event.ticketId})`,
              description: 'تفاصيل التذكرة المحولة تلقائياً عبر ناقل الأحداث',
              status: 'transferred',
              mainCategory: 'IT',
              subCategory: 'Network',
              attachments: [],
              location: 'غير محدد',
              department: event.department,
              creatorId: 'system-sync',
              childTicketIds: [],
              workflowPath: [],
              version: 1
            };
            WorkflowEngine.saveTicket(newMockTicket);
          }

          if (event.department === userDept) {
            const settings = notifSettingsRef.current;
            if (settings.isBellEnabled) {
              setNotifications(prev => [
                {
                  id: Math.random().toString(36).substring(2, 9),
                  title: 'تحويل تذكرة',
                  content: `تم تحويل التذكرة رقم ${event.ticketId} لقسمك.`,
                  timestamp: new Date().toLocaleTimeString('ar-EG'),
                  read: false
                },
                ...prev
              ]);
            }
            if (settings.isToastEnabled) {
              showToast('تحويل تذكرة', `تم تحويل التذكرة رقم ${event.ticketId} لقسمك.`);
            }

            if (isMountedRef.current) {
              setHighlightedTicketId(event.ticketId);
            }
            if (highlightTimeoutRef.current) {
              clearTimeout(highlightTimeoutRef.current);
            }
            highlightTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) setHighlightedTicketId(null);
            }, 2500);
          }
          loadTickets();
        }
      };

      const handleTicketEscalated = (event: any) => {
        if (event && event.ticketId) {
          const ticket = WorkflowEngine.getTicket(event.ticketId);
          if (ticket) {
            ticket.isEscalated = true;
            ticket.escalatedTo = event.escalatedTo;
            ticket.status = 'in-progress';
            ticket.version = (ticket.version || 0) + 1;
            WorkflowEngine.saveTicket(ticket);
          } else {
            const newMockTicket: Ticket = {
              id: event.ticketId,
              title: `تذكرة مصعدة جديدة (${event.ticketId})`,
              description: 'تفاصيل التذكرة المصعدة تلقائياً عبر مراقب الـ SLA',
              status: 'in-progress',
              mainCategory: 'IT',
              subCategory: 'Network',
              attachments: [],
              location: 'غير محدد',
              department: event.department,
              creatorId: 'system-sync',
              childTicketIds: [],
              workflowPath: [],
              version: 1,
              isEscalated: true,
              escalatedTo: event.escalatedTo
            };
            WorkflowEngine.saveTicket(newMockTicket);
          }

          if (event.department === userDept) {
            const settings = notifSettingsRef.current;
            if (settings.isBellEnabled) {
              setNotifications(prev => [
                {
                  id: Math.random().toString(36).substring(2, 9),
                  title: 'تصعيد SLA للتذكرة',
                  content: `تم تصعيد التذكرة رقم ${event.ticketId} إلى ${event.escalatedTo || 'IT_Admin'}.`,
                  timestamp: new Date().toLocaleTimeString('ar-EG'),
                  read: false
                },
                ...prev
              ]);
            }
            if (settings.isToastEnabled) {
              showToast('تصعيد SLA', `تم تصعيد التذكرة رقم ${event.ticketId} إلى ${event.escalatedTo || 'IT_Admin'}.`);
            }

            if (isMountedRef.current) {
              setEscalatedHighlightTicketId(event.ticketId);
            }
            if (escalateTimeoutRef.current) {
              clearTimeout(escalateTimeoutRef.current);
            }
            escalateTimeoutRef.current = setTimeout(() => {
              if (isMountedRef.current) setEscalatedHighlightTicketId(null);
            }, 2500);
          }
          loadTickets();
        }
      };

      const handleConfigUpdated = (event: any) => {
        if (event && event.ServiceType === userDept) {
          fetchNotifSettings();
        }
      };

      const handleConnectionStatusChanged = (event: any) => {
        if (isMountedRef.current && event?.status) {
          setConnectionStatus(event.status as ConnectionStatus);
        }
      };

      const handleCircuitBreakerStateChanged = (event: any) => {
        if (isMountedRef.current && event?.state) {
          setCircuitBreakerState(event.state as CircuitState);
          if (typeof event.queueSize === 'number') {
            setQueuedOpsCount(event.queueSize);
          }
        }
      };

      const handleQueueFlushed = (event: any) => {
        if (isMountedRef.current) {
          setCircuitBreakerState('CLOSED');
          setQueuedOpsCount(event?.remaining ?? 0);
          if (event?.flushedCount > 0) {
            showToast('تم تنفيذ العمليات المؤجلة', `تم حقن ${event.flushedCount} عملية مؤجلة بنجاح في قاعدة البيانات.`);
          }
        }
      };

      EventBus.on('TICKET_ASSIGNED_TO_DEPT', handleTicketUpdate);
      EventBus.on('TICKET_REFRESH', loadTickets);
      EventBus.on('PERMISSIONS_UPDATED', handlePermissionsUpdate);
      EventBus.on('TICKET_TRANSFERRED', handleTicketTransferred);
      EventBus.on('TICKET_ESCALATED', handleTicketEscalated);
      EventBus.on('CONFIG_UPDATED', handleConfigUpdated);
      EventBus.on('CONNECTION_STATUS_CHANGED', handleConnectionStatusChanged);
      EventBus.on('CIRCUIT_BREAKER_STATE_CHANGED', handleCircuitBreakerStateChanged);
      EventBus.on('QUEUE_FLUSHED', handleQueueFlushed);

      return () => {
        RealTimeSynchronizer.disconnect();
        EventBus.off('TICKET_ASSIGNED_TO_DEPT', handleTicketUpdate);
        EventBus.off('TICKET_REFRESH', loadTickets);
        EventBus.off('PERMISSIONS_UPDATED', handlePermissionsUpdate);
        EventBus.off('TICKET_TRANSFERRED', handleTicketTransferred);
        EventBus.off('TICKET_ESCALATED', handleTicketEscalated);
        EventBus.off('CONFIG_UPDATED', handleConfigUpdated);
        EventBus.off('CONNECTION_STATUS_CHANGED', handleConnectionStatusChanged);
        EventBus.off('CIRCUIT_BREAKER_STATE_CHANGED', handleCircuitBreakerStateChanged);
        EventBus.off('QUEUE_FLUSHED', handleQueueFlushed);
        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        if (escalateTimeoutRef.current) clearTimeout(escalateTimeoutRef.current);
        if (toastTimeoutsRef.current) {
          toastTimeoutsRef.current.forEach(clearTimeout);
          toastTimeoutsRef.current = [];
        }
      };
    }
  }, [user, userDept, loadTickets, fetchPermissions, fetchNotifSettings, showToast]);

  return {
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
  };
};
