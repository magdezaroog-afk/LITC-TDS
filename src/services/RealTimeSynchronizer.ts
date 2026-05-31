/**
 * LITC-TS v43.2 - Real-Time Synchronizer
 * وحدة المزامنة اللحظية: إدارة قنوات الاتصال ثنائية الاتجاه، حظر التكرار اللانهائي، وتوجيه الأحداث المشفرة.
 * المرحلة v43.2: إضافة آلية إعادة الاتصال الأسية (Exponential Backoff Reconnection Loop)
 *               وبث حالة الاتصال الحية (CONNECTING / CONNECTED / DISCONNECTED) عبر EventBus.
 */

import { EventBus } from '../engine/events/EventBus';
import { SecurityUtils } from '../utils/SecurityUtils';
import { Ticket, WorkflowEngine } from '../engine/workflow/WorkflowEngine';
import { TicketRepository } from './TicketRepository';

// =========================================================================
// Module-level private state — يجب أن تبقى هنا لدعم Object.freeze على الكلاس
// =========================================================================
let activeIntervalId: NodeJS.Timeout | null = null;
let isConnected = false;
const processedVersions = new Map<string, number>(); // تتبع الإصدارات المعالجة لمنع الدوران اللانهائي

const activeSessions: Array<{
  id: string;
  userPermissions: string[];
  userDepartment: string;
}> = [];

// =========================================================================
// حالة إعادة الاتصال الأسي (Exponential Backoff Reconnection State)
// =========================================================================
/** الفواصل الزمنية لإعادة الاتصال بالتصاعد الأسي: 2s، 4s، 8s، 16s */
const RECONNECT_DELAYS_MS = [2000, 4000, 8000, 16000];
let reconnectAttempt = 0;
let reconnectTimeoutId: NodeJS.Timeout | null = null;
let isReconnecting = false;

/** نوع حالة الاتصال الحية المبثوثة عبر EventBus */
export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED';
let currentConnectionStatus: ConnectionStatus = 'DISCONNECTED';

/** الوسيطة المحفوظة لإعادة الاتصال التلقائي */
let savedReconnectParams: {
  userPermissions: string[];
  userDepartment: string;
  sessionId: string;
} | null = null;

/** إرسال حالة الاتصال الحية عبر EventBus لاستقبالها في الواجهات */
function emitConnectionStatus(status: ConnectionStatus): void {
  currentConnectionStatus = status;
  EventBus.emit('CONNECTION_STATUS_CHANGED', { status, timestamp: new Date().toISOString() });
  console.log(`[RealTimeSync - Status] Connection status changed: ${status}`);
}

/** إلغاء أي مؤقت إعادة اتصال نشط */
function cancelReconnectTimer(): void {
  if (reconnectTimeoutId) {
    clearTimeout(reconnectTimeoutId);
    reconnectTimeoutId = null;
  }
  isReconnecting = false;
  reconnectAttempt = 0;
}

class RealTimeSynchronizerClass {
  /**
   * محاكاة فتح قنوات اتصال لحظية (WebSocket/SSE Connection)
   */
  public connect(userPermissions: string[], userDepartment: string, sessionId = 'default'): void {
    // حفظ معاملات الاتصال لإعادة الاتصال التلقائي لاحقاً
    savedReconnectParams = { userPermissions, userDepartment, sessionId };

    // إضافة الجلسة الجديدة للسيرفر
    if (!activeSessions.some(s => s.id === sessionId)) {
      activeSessions.push({
        id: sessionId,
        userPermissions,
        userDepartment
      });
    }

    if (isConnected) return;

    // إلغاء أي محاولة إعادة اتصال قيد التنفيذ قبل إتمام الاتصال الجديد
    cancelReconnectTimer();

    isConnected = true;
    emitConnectionStatus('CONNECTED');
    console.log(`[RealTimeSync] Connected to real-time stream. Session: ${sessionId}, User department: "${userDepartment}"`);

    // محاكاة استلام أحداث عشوائية من السيرفر كل 3 ثوانٍ
    activeIntervalId = setInterval(() => {
      this.simulateIncomingServerEvent(userPermissions, userDepartment);
    }, 3000);
  }

  /**
   * قطع الاتصال وإلغاء الاشتراكات لتجنب تسريبات الذاكرة (Memory Leak Prevention)
   */
  public disconnect(sessionId = 'default'): void {
    // تصفية الجلسة المُقطوعة من المصفوفة في-الموضع (in-place)
    const filtered = activeSessions.filter(s => s.id !== sessionId);
    activeSessions.length = 0;
    activeSessions.push(...filtered);

    if (activeSessions.length === 0 && activeIntervalId) {
      clearInterval(activeIntervalId);
      activeIntervalId = null;
      isConnected = false;
      processedVersions.clear();
      cancelReconnectTimer();
      savedReconnectParams = null;
      emitConnectionStatus('DISCONNECTED');
      console.log('[RealTimeSync] Disconnected all sessions from real-time stream. Cache cleared.');
    } else {
      console.log(`[RealTimeSync] Disconnected session: ${sessionId}. Remaining sessions: ${activeSessions.length}`);
    }
  }

  /**
   * محاكاة انقطاع عابر لاختبار آلية إعادة الاتصال الأسي (للاستخدام في بيئة الاختبار فقط)
   */
  public simulateDisconnect(): void {
    console.warn('[RealTimeSync - Resiliency] Simulating transient disconnection for testing...');
    if (activeIntervalId) {
      clearInterval(activeIntervalId);
      activeIntervalId = null;
    }
    isConnected = false;
    emitConnectionStatus('DISCONNECTED');
    // تشغيل آلية إعادة الاتصال الأسي فوراً
    this._scheduleReconnect();
  }

  /**
   * آلية إعادة الاتصال الأسي (Exponential Backoff Reconnection)
   * تحاول الاتصال بفواصل: 2s ← 4s ← 8s ← 16s
   * تبث حالة 'CONNECTING' على كل محاولة، و'CONNECTED' عند النجاح.
   * تتوقف تلقائياً عند نجاح الاتصال أو عند استنفاد كل المحاولات.
   */
  public _scheduleReconnect(): void {
    if (isReconnecting || !savedReconnectParams) return;
    isReconnecting = true;

    const attemptReconnect = () => {
      if (isConnected) {
        // تم الاتصال بالفعل — إلغاء حلقة إعادة الاتصال
        cancelReconnectTimer();
        return;
      }

      if (reconnectAttempt >= RECONNECT_DELAYS_MS.length) {
        // استنفاد جميع المحاولات
        console.error(
          `[RealTimeSync - Reconnect] All ${RECONNECT_DELAYS_MS.length} reconnection attempts exhausted. ` +
          'Stream will remain disconnected until manual reconnect.'
        );
        emitConnectionStatus('DISCONNECTED');
        isReconnecting = false;
        reconnectAttempt = 0;
        return;
      }

      const delay = RECONNECT_DELAYS_MS[reconnectAttempt];
      console.warn(
        `[RealTimeSync - Reconnect] Attempt ${reconnectAttempt + 1}/${RECONNECT_DELAYS_MS.length}. ` +
        `Reconnecting in ${delay / 1000}s...`
      );
      emitConnectionStatus('CONNECTING');

      reconnectTimeoutId = setTimeout(() => {
        reconnectAttempt++;
        try {
          // محاولة إعادة الاتصال باستخدام المعاملات المحفوظة
          const { userPermissions, userDepartment, sessionId } = savedReconnectParams!;
          this.connect(userPermissions, userDepartment, sessionId);

          if (isConnected) {
            // نجاح الاتصال
            reconnectAttempt = 0;
            isReconnecting = false;
            reconnectTimeoutId = null;
            console.log('[RealTimeSync - Reconnect] Reconnection successful.');
          } else {
            // فشل — جدولة المحاولة التالية
            attemptReconnect();
          }
        } catch (err) {
          console.error('[RealTimeSync - Reconnect] Error during reconnect attempt:', err);
          attemptReconnect();
        }
      }, delay);
    };

    attemptReconnect();
  }

  /**
   * الحصول على حالة الاتصال الحية الحالية
   */
  public getConnectionStatus(): ConnectionStatus {
    return currentConnectionStatus;
  }

  /**
   * بث حدث حقيقي لجميع الجلسات النشطة مع تصفية أمنية صارمة لكل مستخدم لمنع تسريب البيانات بين الأقسام
   */
  public broadcast(type: 'PERMISSIONS_UPDATED' | 'TICKET_TRANSFERRED' | 'TICKET_ESCALATED' | 'CONFIG_UPDATED', payload: any): void {
    console.log(`[RealTimeSync - Broadcast] Initiating secure broadcast for: ${type}`);

    activeSessions.forEach((session) => {
      if (type === 'PERMISSIONS_UPDATED') {
        // إشعار تغيير الصلاحيات للكل لإعادة الجلب
        console.log(`[RealTimeSync - Security Router] Routing PERMISSIONS_UPDATED to session: ${session.id}`);
        EventBus.emit('PERMISSIONS_UPDATED', payload);
      } else if (type === 'CONFIG_UPDATED') {
        // التحقق الأمني للقسم لضمان بث الحدث للأقسام المعنية فقط
        const targetDept = payload.ServiceType || '';
        const hasAccess = session.userPermissions.includes('admin') ||
                          session.userDepartment === targetDept ||
                          session.userPermissions.includes(`dept_handler_${targetDept}`);

        if (hasAccess) {
          console.log(`[RealTimeSync - Security Router] Routing CONFIG_UPDATED to session: ${session.id} for department: ${targetDept}`);
          EventBus.emit('CONFIG_UPDATED', payload);
        } else {
          console.log(`[RealTimeSync - Security Check] Blocked CONFIG_UPDATED for session: ${session.id} (Department: ${targetDept} is unauthorized)`);
        }
      } else if (type === 'TICKET_TRANSFERRED') {
        // التحقق الأمني للقسم لمنع تسريب بيانات التذاكر بين الأقسام
        const ticketDept = payload.department || '';
        const hasAccess = session.userPermissions.includes('admin') ||
                          session.userDepartment === ticketDept ||
                          session.userPermissions.includes(`dept_handler_${ticketDept}`);

        if (hasAccess) {
          console.log(`[RealTimeSync - Security Router] Routing TICKET_TRANSFERRED to session: ${session.id} for department: ${ticketDept}`);
          EventBus.emit('TICKET_TRANSFERRED', payload);
        } else {
          console.log(`[RealTimeSync - Security Check] Blocked TICKET_TRANSFERRED for session: ${session.id} (Department: ${ticketDept} is unauthorized)`);
        }
      } else if (type === 'TICKET_ESCALATED') {
        // التحقق الأمني للقسم لمنع تسريب بيانات التصعيد
        const ticketDept = payload.department || '';
        const hasAccess = session.userPermissions.includes('admin') ||
                          session.userDepartment === ticketDept ||
                          session.userPermissions.includes(`dept_handler_${ticketDept}`);

        if (hasAccess) {
          console.log(`[RealTimeSync - Security Router] Routing TICKET_ESCALATED to session: ${session.id} for department: ${ticketDept}`);
          EventBus.emit('TICKET_ESCALATED', payload);
        } else {
          console.log(`[RealTimeSync - Security Check] Blocked TICKET_ESCALATED for session: ${session.id} (Department: ${ticketDept} is unauthorized)`);
        }
      }
    });
  }

  /**
   * محاكاة إشعار لحظي قادم من السيرفر
   */
  private simulateIncomingServerEvent(userPermissions: string[], userDepartment: string) {
    const activeTickets = Array.from(WorkflowEngine['mockDatabase'].keys());
    if (activeTickets.length === 0) return;

    const randomTicketId = activeTickets[Math.floor(Math.random() * activeTickets.length)];
    const ticket = WorkflowEngine.getTicket(randomTicketId);
    if (!ticket) return;

    const serverPayload: Partial<Ticket> = {
      id: ticket.id,
      title: ticket.title + ' (تحديث لحظي)',
      description: ticket.description,
      status: ticket.status,
      department: ticket.department,
      version: ticket.version + 1
    };

    this.processServerNotification(serverPayload, userPermissions, userDepartment);
  }

  /**
   * معالجة الإشعارات الواردة أمنياً وتزامناً
   */
  public processServerNotification(
    rawPayload: Partial<Ticket>,
    userPermissions: string[],
    userDepartment: string
  ): void {
    if (!isConnected) return;
    if (!rawPayload.id || rawPayload.version === undefined) return;

    const ticketId = rawPayload.id;
    const incomingVersion = rawPayload.version;

    const lastProcessedVersion = processedVersions.get(ticketId) || 0;
    const localTicket = WorkflowEngine.getTicket(ticketId);
    const currentLocalVersion = localTicket ? localTicket.version : 0;

    if (incomingVersion <= lastProcessedVersion || incomingVersion <= currentLocalVersion) {
      console.log(`[RealTimeSync - Loop Guard] Discarded redundant update for Ticket ${ticketId}. Incoming: v${incomingVersion}, Local: v${currentLocalVersion}`);
      return;
    }

    const targetDept = rawPayload.department || '';
    const hasDeptAccess = userPermissions.includes('admin') ||
                          userDepartment === targetDept ||
                          userPermissions.includes(`dept_handler_${targetDept}`);

    if (!hasDeptAccess) {
      console.warn(`[RealTimeSync - Security Check] Dropped real-time event. User has no permission to view department: "${targetDept}"`);
      return;
    }

    const sanitizedPayload = SecurityUtils.sanitizeObject(rawPayload);
    processedVersions.set(ticketId, incomingVersion);

    if (localTicket) {
      const updatedTicket: Ticket = {
        ...localTicket,
        ...sanitizedPayload
      } as Ticket;

      TicketRepository.cacheTicket(updatedTicket);
    }

    console.log(`[RealTimeSync - Event Router] Routing event for Ticket: ${ticketId} to Department: "${targetDept}"`);
    EventBus.emit('TICKET_ASSIGNED_TO_DEPT', {
      ticketId,
      department: targetDept,
      version: incomingVersion,
      payload: sanitizedPayload
    });
  }
}

export const RealTimeSynchronizer = Object.freeze(new RealTimeSynchronizerClass());
