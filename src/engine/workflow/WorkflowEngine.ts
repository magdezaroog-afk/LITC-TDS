/**
 * LITC-TS v43.0 - Workflow Engine
 * المحرك المركزي لإدارة دورة حياة التذاكر، الإسناد، التحويل بين الأقسام، وحوكمة التذاكر الفرعية.
 */

import { SecurityUtils } from '../../utils/SecurityUtils';
import { RealTimeSynchronizer } from '../../services/RealTimeSynchronizer';

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
  mainCategory?: string; // Legacy
  subCategory?: string; // Legacy
  attachments: Attachment[];
  location?: string; // Legacy
  department: string; // القسم الحالي المالك للتذكرة
  creatorId: string;
  assignedTechId?: string;
  parentTicketId?: string; // لربط التذكرة الفرعية بالتذكرة الأبوية
  childTicketIds: string[]; // قائمة بمعرفات التذاكر الفرعية التابعة
  workflowPath: WorkflowStep[]; // سجل رحلة التذكرة والتحويلات المعتمدة
  version: number;
  createdAt?: number;
  slaDeadline?: string | null;
  isEscalated?: boolean;
  escalatedTo?: string;
  routeId?: string;
  customFields?: Record<string, string>;
  captured_historical_data?: {
    mainIssueLabel?: string;
    subIssueLabel?: string;
    customFieldsLabels?: Record<string, string>;
  };
}

export class WorkflowEngine {
  private static mockDatabase: Map<string, Ticket> = new Map();

  /**
   * تسجيل أو تحديث تذكرة في قاعدة البيانات الافتراضية للمحرك
   */
  public static saveTicket(ticket: Ticket): void {
    // تطهير نصوص التذكرة أمنياً لمنع الاختراقات
    
    // [TODO/API Blueprint] SLA Calculation Layer:
    // هذا المنطق المحلي (Fallback Map) مؤقت للبيئة التجريبية.
    // مستقبلاً في الـ Backend، سيتم حساب الـ `slaDeadline` الدقيق عند إنشاء التذكرة 
    // بالاعتماد على (Taxonomy ID) وليس النصوص، مع تخزينه مباشرة في قاعدة البيانات.
    if (!ticket.slaDeadline) {
      const issueLabel = ticket.captured_historical_data?.mainIssueLabel?.toLowerCase() || '';
      let thresholdMinutes = 120; // Default: 2 hours

      // Fallback Map: تحديد وقت الحل حسب خطورة المشكلة التاريخية
      if (issueLabel.includes('hardware') || issueLabel.includes('server') || issueLabel.includes('حرج') || issueLabel.includes('هاردوير')) {
        thresholdMinutes = 15;
      } else if (issueLabel.includes('شبكة') || issueLabel.includes('network') || issueLabel.includes('انقطاع')) {
        thresholdMinutes = 30;
      }

      const createdTime = ticket.createdAt || Date.now();
      ticket.slaDeadline = new Date(createdTime + thresholdMinutes * 60 * 1000).toISOString();
    }

    const sanitizedTicket = {
      ...ticket,
      title: SecurityUtils.sanitize(ticket.title),
      description: SecurityUtils.sanitize(ticket.description),
      mainCategory: ticket.mainCategory ? SecurityUtils.sanitize(ticket.mainCategory) : undefined,
      subCategory: ticket.subCategory ? SecurityUtils.sanitize(ticket.subCategory) : undefined,
      location: ticket.location ? SecurityUtils.sanitize(ticket.location) : undefined,
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
      

      // [TODO/API Blueprint] Future Escalation Offloading (Server-Side Cron Job):
      // هذه الفئة (SLABackgroundWorkerClass) بالكامل عبارة عن محاكاة في بيئة المتصفح.
      // في الإنتاج (Production)، سيتم إيقاف هذا الـ Worker واستبداله بـ Server-Side Cron Job 
      // (مثل Node-Cron أو رسائل Queue) يبحث في قاعدة البيانات عبر استعلام مباشر:
      // WHERE slaDeadline < NOW() AND status IN ('new', 'in-progress')
      // ليضمن تصعيد التذاكر فوراً حتى لو كان المتصفح مغلقاً، مما يمنع ضياع أي خرق للـ SLA.
      
      const now = Date.now();

      // Loop over mock database and escalate tickets exceeding their specific slaDeadline
      WorkflowEngine.getMockDatabase().forEach((ticket) => {
        // Only process open tickets ('new' or 'in-progress') that are not already escalated
        if ((ticket.status === 'new' || ticket.status === 'in-progress') && !ticket.isEscalated && ticket.slaDeadline) {
          const deadlineMs = new Date(ticket.slaDeadline).getTime();
          
          if (now > deadlineMs) {
            console.log(`[SLABackgroundWorker] Escalating ticket ${ticket.id} because it exceeded its specific slaDeadline.`);
            
            ticket.isEscalated = true;
            ticket.escalatedTo = 'Manager'; // Fallback Escalation Role
            ticket.status = 'in-progress';
            ticket.version += 1;
            WorkflowEngine.saveTicket(ticket);

            // Broadcast TICKET_ESCALATED event in real-time
            RealTimeSynchronizer.broadcast('TICKET_ESCALATED', {
              ticketId: ticket.id,
              department: ticket.department,
              escalatedTo: ticket.escalatedTo
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
