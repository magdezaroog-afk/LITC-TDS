/**
 * LITC-TS v43.0 - Workflow Engine
 * المحرك المركزي لإدارة دورة حياة التذاكر، الإسناد، التحويل بين الأقسام، وحوكمة التذاكر الفرعية.
 */

import { SecurityUtils } from '../../utils/SecurityUtils';

export type TicketStatus = 'new' | 'in-progress' | 'transferred' | 'resolved' | 'closed';
export type WorkflowAction = 'open' | 'transfer' | 'assign' | 'resolve' | 'close';
export type UserRole = 'admin' | 'editor' | 'viewer' | 'technician';

export interface WorkflowStep {
  fromDepartment: string;
  toDepartment: string;
  transferredBy: string; // معرف الموظف أو المستخدم الناقل
  timestamp: number;
  reason?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  mainCategory: string;
  subCategory: string;
  attachments: Attachment[];
  location: string;
  department: string; // القسم الحالي المالك للتذكرة
  creatorId: string;
  assignedTechId?: string;
  parentTicketId?: string; // لربط التذكرة الفرعية بالتذكرة الأبوية
  childTicketIds: string[]; // قائمة بمعرفات التذاكر الفرعية التابعة
  workflowPath: WorkflowStep[]; // سجل رحلة التذكرة والتحويلات المعتمدة
  version: number;
  createdAt?: number;
  isEscalated?: boolean;
  escalatedTo?: string;
}

export class WorkflowEngine {
  private static mockDatabase: Map<string, Ticket> = new Map();

  /**
   * تسجيل أو تحديث تذكرة في قاعدة البيانات الافتراضية للمحرك
   */
  public static saveTicket(ticket: Ticket): void {
    // تطهير نصوص التذكرة أمنياً لمنع الاختراقات
    const sanitizedTicket = {
      ...ticket,
      title: SecurityUtils.sanitize(ticket.title),
      description: SecurityUtils.sanitize(ticket.description),
      mainCategory: SecurityUtils.sanitize(ticket.mainCategory),
      subCategory: SecurityUtils.sanitize(ticket.subCategory),
      location: SecurityUtils.sanitize(ticket.location),
      department: SecurityUtils.sanitize(ticket.department),
    };
    this.mockDatabase.set(sanitizedTicket.id, sanitizedTicket);
  }

  /**
   * جلب تذكرة بالمعرف الخاص بها
   */
  public static getTicket(id: string): Ticket | undefined {
    return this.mockDatabase.get(id);
  }

  /**
   * تفريغ قاعدة البيانات الموك للأغراض الاختبارية
   */
  public static clearDatabase(): void {
    this.mockDatabase.clear();
  }

  /**
   * محرك الصلاحيات والأدوار: يقرر إمكانية تنفيذ إجراء معين بناءً على الدور وحالة التذكرة
   */
  public static canPerformAction(
    userRole: UserRole,
    action: WorkflowAction,
    ticketStatus: TicketStatus
  ): boolean {
    // 1. المشرفين يملكون الصلاحية الكاملة لتخطي أي قيود
    if (userRole === 'admin') return true;

    // 2. القواعد الصارمة للمستخدمين العاديين والتقنيين
    switch (ticketStatus) {
      case 'new':
        if (action === 'open' || action === 'assign') return userRole === 'technician' || userRole === 'editor';
        if (action === 'close') return userRole === 'editor'; 
        return false;

      case 'in-progress':
        if (action === 'transfer' || action === 'resolve') return userRole === 'technician';
        if (action === 'close') return userRole === 'editor';
        return false;

      case 'transferred':
        if (action === 'assign' || action === 'transfer') return userRole === 'technician';
        return false;

      case 'resolved':
        if (action === 'close') return userRole === 'editor'; 
        if (action === 'assign') return userRole === 'technician'; // لإعادة الفتح
        return false;

      case 'closed':
      default:
        // لا يمكن إجراء أي عمليات على التذاكر المغلقة
        return false;
    }
  }

  /**
   * منطق تحويل التذكرة بين الأقسام مع تسجيل سجل تحركات صارم (Handoff & Audit Log)
   */
  public static transferDepartment(
    ticketId: string,
    fromDept: string,
    toDept: string,
    userId: string,
    userPermissions: string[],
    reason?: string
  ): Ticket {
    const ticket = this.mockDatabase.get(ticketId);
    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found.`);
    }

    // التحقق الأمني: هل يملك المستخدم صلاحية التحويل في هذا القسم؟
    if (!userPermissions.includes('admin') && !userPermissions.includes(`dept_handler_${fromDept}`)) {
      throw new Error(`SECURITY_CRITICAL: User ${userId} unauthorized to transfer tickets out of department ${fromDept}.`);
    }

    if (ticket.status === 'closed') {
      throw new Error('Invalid operation: Cannot transfer a closed ticket.');
    }

    // تطهير نصوص سبب النقل
    const cleanReason = reason ? SecurityUtils.sanitize(reason) : '';

    // إعداد خطوة التحويل الجديدة في السجل
    const step: WorkflowStep = {
      fromDepartment: fromDept,
      toDepartment: toDept,
      transferredBy: userId,
      timestamp: Date.now(),
      reason: cleanReason
    };

    // تحديث التذكرة
    ticket.department = toDept;
    ticket.status = 'transferred';
    ticket.workflowPath.push(step);
    ticket.version += 1;

    this.saveTicket(ticket);
    return ticket;
  }

  /**
   * منطق التحقق من إغلاق التذاكر الفرعية لمنع إغلاق التذكرة الأبوية مبكراً
   */
  public static canCloseParent(ticketId: string): boolean {
    const ticket = this.mockDatabase.get(ticketId);
    if (!ticket) return false;

    // فحص جميع التذاكر الفرعية المرتبطة
    for (const childId of ticket.childTicketIds) {
      const child = this.mockDatabase.get(childId);
      if (child && child.status !== 'closed' && child.status !== 'resolved') {
        // إذا وجدنا تذكرة فرعية واحدة لم تكتمل، يمنع الإغلاق
        return false;
      }
    }
    return true;
  }

  /**
   * محاولة إغلاق التذكرة مع تطبيق القيود الأمنية والتراكمية
   */
  public static closeTicket(ticketId: string, userId: string, userRole: UserRole): Ticket {
    const ticket = this.mockDatabase.get(ticketId);
    if (!ticket) {
      throw new Error(`Ticket with ID ${ticketId} not found.`);
    }

    // 1. التحقق من التذاكر الفرعية
    if (!this.canCloseParent(ticketId)) {
      throw new Error(`WORKFLOW_VIOLATION: Cannot close parent ticket ${ticketId} because one or more child tickets are still active.`);
    }

    // 2. التحقق من صلاحيات دور المستخدم
    if (!this.canPerformAction(userRole, 'close', ticket.status)) {
      throw new Error(`SECURITY_CRITICAL: User role ${userRole} is unauthorized to close ticket ${ticketId} in status ${ticket.status}.`);
    }

    ticket.status = 'closed';
    ticket.version += 1;

    this.saveTicket(ticket);
    return ticket;
  }

  /**
   * الحصول على نسخة من قاعدة البيانات الافتراضية
   */
  public static getMockDatabase(): Map<string, Ticket> {
    return this.mockDatabase;
  }
}

let activeTimer: NodeJS.Timeout | null = null;
let activeChecking = false;

export class SLABackgroundWorkerClass {
  public start(intervalMs: number = 5000): void {
    if (activeTimer) return;
    console.log(`[SLABackgroundWorker] Starting SLA dynamic worker (Interval: ${intervalMs} ms)...`);
    activeTimer = setInterval(async () => {
      try {
        await this.checkDynamicSLABreaches();
      } catch (error) {
        console.error('[SLABackgroundWorker] Error in background SLA check:', error);
      }
    }, intervalMs);
  }

  public stop(): void {
    if (activeTimer) {
      clearInterval(activeTimer);
      activeTimer = null;
      console.log('[SLABackgroundWorker] Stopped background SLA worker.');
    }
  }

  public async checkDynamicSLABreaches(): Promise<void> {
    if (activeChecking) return;
    activeChecking = true;

    try {
      const { RealTimeSynchronizer } = await import('../../services/RealTimeSynchronizer');

      // Fetch SLA Configuration from API instead of DatabaseController directly
      const response = await fetch('/api/v1/admin/sla-config/IT', {
        headers: { 'Authorization': 'Bearer system_token_123' }
      });
      const config = response.ok ? await response.json() : null;
      if (!config) {
        return;
      }

      // If escalation is disabled, ignore escalation entirely
      if (!config.isEscalationEnabled) {
        return;
      }

      const thresholdMs = config.thresholdMinutes * 60 * 1000;
      const now = Date.now();

      // 2. Loop over mock database and escalate tickets exceeding threshold
      WorkflowEngine.getMockDatabase().forEach((ticket) => {
        // Only process open tickets ('new' or 'in-progress') that are not already escalated
        if ((ticket.status === 'new' || ticket.status === 'in-progress') && !ticket.isEscalated) {
          const createdAt = ticket.createdAt || now; // fallback to now if not set
          if (now - createdAt > thresholdMs) {
            console.log(`[SLABackgroundWorker] Escalating ticket ${ticket.id} because it exceeded threshold of ${config.thresholdMinutes} minutes.`);
            
            ticket.isEscalated = true;
            ticket.escalatedTo = config.escalationTargetRole;
            ticket.status = 'in-progress';
            ticket.version += 1;
            WorkflowEngine.saveTicket(ticket);

            // Broadcast TICKET_ESCALATED event in real-time
            RealTimeSynchronizer.broadcast('TICKET_ESCALATED', {
              ticketId: ticket.id,
              department: ticket.department,
              escalatedTo: config.escalationTargetRole
            });
          }
        }
      });
    } finally {
      activeChecking = false;
    }
  }
}

export const SLABackgroundWorker = Object.freeze(new SLABackgroundWorkerClass());
