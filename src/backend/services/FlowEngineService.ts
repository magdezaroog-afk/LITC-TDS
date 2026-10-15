/**
 * LITC Enterprise Platform Core (LEPC)
 * FlowEngine Service — المحرك المركزي للمسارات الديناميكية
 *
 * المبدأ: كل مسار طلب يُعرَّف كـ بيانات (FlowDefinition + FlowStep + FormSchema)
 * وليس كـ كود ثابت. هذا يعني إضافة مسار جديد لا يحتاج لتطوير برمجي.
 */

import { prisma } from '../../db/client';
import { NotificationEngine } from './NotificationEngine';
import { eventDispatcher, SYSTEM_EVENTS } from './EventDispatcher';

// ===================================================================
// Types
// ===================================================================

export interface FormFieldDefinition {
  fieldKey: string;             // المفتاح الفريد للحقل
  label: string;                // الاسم المعروض للمستخدم
  type: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTISELECT' | 'DATE' | 'FILE' | 'TEXTAREA' | 'BOOLEAN';
  required: boolean;
  placeholder?: string;
  options?: string[];           // للـ SELECT و MULTISELECT
  validationJson?: string;      // قواعد validation كـ JSON (min, max, pattern)
  visibilityCondition?: string; // شرط ظهور الحقل (JSON expression)
  enrichmentKey?: string;       // ربط بنظام خارجي (External Enrichment)
}

export interface CreateFlowRequest {
  name: string;
  description?: string;
  icon?: string;
  formFields: FormFieldDefinition[];
  steps: {
    stepName: string;
    assignToType: 'DEPARTMENT' | 'ROLE' | 'TEAM' | 'USER';
    assignToId: string;
    slaMinutes?: number;
    autoEscalate?: boolean;
    conditionsJson?: string;
    actionsJson?: string;
  }[];
}

// ===================================================================
// FlowEngine Service
// ===================================================================

export class FlowEngineService {

  /**
   * إنشاء مسار جديد كامل (FormSchema + FlowDefinition + FlowSteps) في عملية واحدة
   */
  async createFlow(data: CreateFlowRequest): Promise<{ flowId: string; schemaId: string }> {
    return prisma.$transaction(async (tx) => {
      // 1. إنشاء مخطط الفورم
      const formSchema = await tx.formSchema.create({
        data: {
          name: `schema_${data.name}`,
          fieldsJson: JSON.stringify(data.formFields),
          isActive: true,
        },
      });

      // 2. إنشاء تعريف المسار
      const flow = await tx.flowDefinition.create({
        data: {
          name: data.name,
          description: data.description,
          icon: data.icon,
          isActive: true,
          formSchemaId: formSchema.id,
        },
      });

      // 3. إنشاء خطوات المسار بالترتيب
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        await tx.flowStep.create({
          data: {
            flowDefinitionId: flow.id,
            stepOrder: i + 1,
            stepName: step.stepName,
            assignToType: step.assignToType,
            assignToId: step.assignToId,
            slaMinutes: step.slaMinutes ?? 60,
            autoEscalate: step.autoEscalate ?? true,
            conditionsJson: step.conditionsJson,
            actionsJson: step.actionsJson,
          },
        });
      }

      return { flowId: flow.id, schemaId: formSchema.id };
    });
  }

  /**
   * قراءة جميع المسارات النشطة (للعرض في قائمة إنشاء الطلبات)
   */
  async getActiveFlows() {
    return prisma.flowDefinition.findMany({
      where: { isActive: true },
      include: {
        formSchema: { select: { id: true, name: true, version: true } },
        _count: { select: { steps: true, tickets: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * قراءة تفاصيل مسار كامل مع الخطوات والفورم
   */
  async getFlowById(flowId: string) {
    const flow = await prisma.flowDefinition.findUnique({
      where: { id: flowId },
      include: {
        formSchema: true,
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });

    if (!flow) throw new Error(`FlowDefinition [${flowId}] not found`);

    // Parse formSchema.fieldsJson
    const fields: FormFieldDefinition[] = JSON.parse(flow.formSchema.fieldsJson);
    return { ...flow, formFields: fields };
  }

  /**
   * تفعيل مسار جديد على تذكرة — يُنشئ TicketFlowProgress لكل خطوة
   */
  async activateFlowForTicket(ticketId: number, flowId: string): Promise<void> {
    const flow = await prisma.flowDefinition.findUnique({
      where: { id: flowId },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });

    if (!flow) throw new Error(`FlowDefinition [${flowId}] not found`);
    if (flow.steps.length === 0) throw new Error(`Flow [${flowId}] has no steps`);

    await prisma.$transaction(async (tx) => {
      // إنشاء سجل تقدم لكل خطوة
      const progressData = flow.steps.map((step, index) => ({
        ticketId,
        stepId: step.id,
        status: index === 0 ? 'ACTIVE' : 'PENDING',  // الخطوة الأولى تبدأ فوراً
        startedAt: index === 0 ? new Date() : null,
      }));

      await tx.ticketFlowProgress.createMany({ data: progressData });

      // ربط المسار بالتذكرة
      await tx.ticket.update({
        where: { id: ticketId },
        data: { flowDefinitionId: flowId },
      });
    });

    // إشعار الجهة المسؤولة عن الخطوة الأولى
    const firstStep = flow.steps[0];
    NotificationEngine.broadcast({
      type: 'INFO',
      message: `تذكرة جديدة (#${ticketId}) تنتظر معالجتها في خطوة "${firstStep.stepName}".`,
      targetDepartment: firstStep.assignToType === 'DEPARTMENT' ? firstStep.assignToId : undefined,
    });

    eventDispatcher.dispatch(SYSTEM_EVENTS.TICKET_STATE_CHANGED, {
      ticketId,
      action: 'FLOW_ACTIVATED',
      flowId,
      stepId: firstStep.id
    });
  }

  /**
   * الانتقال للخطوة التالية في مسار التذكرة
   */
  async advanceFlow(ticketId: number, userId: number, notes?: string): Promise<{
    previousStep: string;
    nextStep: string | null;
    isCompleted: boolean;
  }> {
    // جلب الخطوة الحالية
    const currentProgress = await prisma.ticketFlowProgress.findFirst({
      where: { ticketId, status: 'ACTIVE' },
      include: { step: true },
    });

    if (!currentProgress) {
      throw new Error(`No active step found for ticket [${ticketId}]`);
    }

    return prisma.$transaction(async (tx) => {
      // إنهاء الخطوة الحالية
      await tx.ticketFlowProgress.update({
        where: { id: currentProgress.id },
        data: {
          status: 'DONE',
          completedAt: new Date(),
          handledByUserId: userId,
          notes: notes ?? null,
        },
      });

      // إيجاد الخطوة التالية
      const nextProgress = await tx.ticketFlowProgress.findFirst({
        where: { ticketId, status: 'PENDING' },
        include: { step: true },
        orderBy: { step: { stepOrder: 'asc' } },
      });

      let isCompleted = false;

      if (nextProgress) {
        // تفعيل الخطوة التالية
        await tx.ticketFlowProgress.update({
          where: { id: nextProgress.id },
          data: { status: 'ACTIVE', startedAt: new Date() },
        });

        // إشعار الجهة التالية
        NotificationEngine.broadcast({
          type: 'INFO',
          message: `التذكرة (#${ticketId}) انتقلت إلى مرحلة "${nextProgress.step.stepName}".`,
          targetDepartment: nextProgress.step.assignToType === 'DEPARTMENT' ? nextProgress.step.assignToId : undefined,
        });
      } else {
        // المسار اكتمل — إغلاق التذكرة
        isCompleted = true;
        NotificationEngine.broadcast({
          type: 'SUCCESS',
          message: `تم إنجاز جميع مراحل التذكرة (#${ticketId}) بنجاح.`,
        });
      }

      eventDispatcher.dispatch(SYSTEM_EVENTS.TICKET_STATE_CHANGED, {
        ticketId,
        action: 'FLOW_ADVANCED',
        previousStep: currentProgress.step.stepName,
        nextStep: nextProgress?.step.stepName ?? null,
        isCompleted
      });

      return {
        previousStep: currentProgress.step.stepName,
        nextStep: nextProgress?.step.stepName ?? null,
        isCompleted,
      };
    });
  }

  /**
   * رفض / إعادة تذكرة لخطوة سابقة
   */
  async rejectStep(ticketId: number, userId: number, reason: string): Promise<void> {
    const currentProgress = await prisma.ticketFlowProgress.findFirst({
      where: { ticketId, status: 'ACTIVE' },
      include: { step: true },
    });

    if (!currentProgress) throw new Error(`No active step for ticket [${ticketId}]`);

    await prisma.ticketFlowProgress.update({
      where: { id: currentProgress.id },
      data: {
        status: 'REJECTED',
        completedAt: new Date(),
        handledByUserId: userId,
        notes: `[مرفوض] ${reason}`,
      },
    });
  }

  /**
   * جلب خريطة رحلة التذكرة الكاملة (Journey Map)
   * تشمل دورة حياة الطلب كاملة، التذاكر الفرعية المحالة للأقسام، وإشعار الإنجاز والعودة للمستلم الرئيسي
   */
  async getTicketJourney(ticketId: number) {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        creator: { select: { id: true, fullName: true, department: { select: { name: true } } } },
        departmentObj: { select: { id: true, name: true } },
        state: { select: { id: true, name: true, label: true } },
        assignments: {
          where: { isCurrentActive: true },
          include: { assignedTech: { select: { id: true, fullName: true, department: { select: { name: true } } } } }
        },
        subTickets: {
          where: { isDeleted: false },
          include: {
            state: { select: { id: true, name: true, label: true } },
            departmentObj: { select: { id: true, name: true } },
            creator: { select: { id: true, fullName: true } },
            assignments: {
              where: { isCurrentActive: true },
              include: { assignedTech: { select: { id: true, fullName: true } } }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        flowProgress: {
          include: {
            step: { select: { stepName: true, stepOrder: true, assignToType: true, assignToId: true, slaMinutes: true } },
            handledByUser: { select: { id: true, fullName: true, jobTitle: true, avatarUrl: true } },
          },
          orderBy: { step: { stepOrder: 'asc' } },
        },
        logs: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!ticket) return [];

    const primaryAssignee = ticket.assignments?.[0]?.assignedTech?.fullName || ticket.departmentObj?.name || 'مستلم الطلب الرئيسي';
    const isMainClosed = ticket.state?.name === 'CLOSED';
    const isMainResolved = ticket.state?.name === 'RESOLVED';

    const steps: any[] = [];
    let order = 1;

    // 1. مرحلة التقديم والتسجيل
    steps.push({
      id: 'step-creation',
      stepOrder: order++,
      stepName: 'تقديم الطلب',
      label: 'تم تقديم الطلب واعتماده بالمنظومة',
      labelEn: 'Request Submitted & Registered',
      action: 'تم تقديم الطلب واعتماده بالمنظومة',
      status: 'completed',
      actorName: ticket.creator?.fullName || 'مقدم الطلب',
      actor: ticket.creator?.fullName || 'مقدم الطلب',
      timestamp: ticket.createdAt.toISOString(),
      notes: `تم توجيه المعاملة إلى: ${ticket.departmentObj?.name || 'الجهة المختصة'}`
    });

    // 2. مرحلة استلام المستلم الرئيسي وبدء المعالجة
    const isAccepted = ticket.state?.name !== 'OPEN' || ticket.assignments?.length > 0;
    if (isAccepted) {
      steps.push({
        id: 'step-acceptance',
        stepOrder: order++,
        stepName: 'استلام الطلب الرئيسي',
        label: `استلام وبدء المعالجة لدى مستلم الطلب الرئيسي (${primaryAssignee})`,
        labelEn: `Under Processing by Primary Handler (${primaryAssignee})`,
        action: `استلام وبدء المعالجة لدى مستلم الطلب الرئيسي (${primaryAssignee})`,
        status: 'completed',
        actorName: primaryAssignee,
        actor: primaryAssignee,
        timestamp: ticket.createdAt.toISOString(),
        notes: `المعاملة قيد المتابعة والإشراف المباشر من قبل: ${primaryAssignee}.`
      });
    }

    // 3. مسار التذاكر والمهام الفرعية المحالة
    const subTickets = ticket.subTickets || [];
    for (const sub of subTickets) {
      const targetDept = sub.departmentObj?.name || 'الجهة المستلمة للمهمة الفرعية';
      const cleanTitle = sub.title.replace(/^\[مهمة فرعية\]\s*/, '');
      const subTech = sub.assignments?.[0]?.assignedTech?.fullName;
      const isSubDone = ['CLOSED', 'RESOLVED'].includes(sub.state?.name);

      // أ) محطة إحالة المهمة الفرعية للطرف المستلم
      steps.push({
        id: `sub-dispatch-${sub.id}`,
        stepOrder: order++,
        stepName: 'إحالة مهمة فرعية',
        label: `إحالة مهمة فرعية إلى (${targetDept}): ${cleanTitle}`,
        labelEn: `Sub-ticket Dispatched to (${targetDept}): ${cleanTitle}`,
        action: `إحالة مهمة فرعية إلى (${targetDept}): ${cleanTitle}`,
        status: isSubDone ? 'completed' : 'current',
        actorName: sub.creator?.fullName || primaryAssignee,
        actor: sub.creator?.fullName || primaryAssignee,
        timestamp: sub.createdAt.toISOString(),
        notes: isSubDone 
          ? `تمت إحالة المهمة مسبقاً إلى: ${targetDept}`
          : `المهمة قيد التنفيذ حالياً لدى الطرف المستلم: ${targetDept}${subTech ? ` (${subTech})` : ''}`,
        isSubTicketStep: true,
        isReturnToPrimary: false,
        subTicket: {
          id: sub.id,
          title: cleanTitle,
          department: targetDept,
          assignedTech: subTech,
          status: sub.state?.label || sub.state?.name,
          isClosed: isSubDone
        }
      });

      // ب) محطة إنجاز المهمة الفرعية وعودتها للمستلم الرئيسي
      if (isSubDone) {
        steps.push({
          id: `sub-complete-${sub.id}`,
          stepOrder: order++,
          stepName: 'إنجاز المهمة الفرعية',
          label: `تم إنجاز المهمة الفرعية لدى (${targetDept}) — المعاملة الآن لدى مستلم الطلب الرئيسي (${primaryAssignee})`,
          labelEn: `Sub-ticket Completed by (${targetDept}) — Handed Back to Primary Handler (${primaryAssignee})`,
          action: `تم إنجاز المهمة الفرعية لدى (${targetDept}) — المعاملة الآن لدى مستلم الطلب الرئيسي (${primaryAssignee})`,
          status: 'completed',
          actorName: subTech || targetDept,
          actor: subTech || targetDept,
          timestamp: sub.updatedAt.toISOString(),
          notes: `أنجز الطرف المستلم (${targetDept}) المهمة بنجاح وأقفلها من جهته. عادت المعاملة الآن لمتابعة مستلم الطلب الرئيسي (${primaryAssignee}).`,
          isSubTicketStep: true,
          isReturnToPrimary: true,
          subTicket: {
            id: sub.id,
            title: cleanTitle,
            department: targetDept,
            assignedTech: subTech,
            status: 'مكتملة ومقفلة',
            isClosed: true
          }
        });
      }
    }

    // 4. دمج خطوات محرك المسارات TicketFlowProgress (إن وجدت)
    if (ticket.flowProgress && ticket.flowProgress.length > 0) {
      for (const p of ticket.flowProgress) {
        steps.push({
          id: `flow-progress-${p.id}`,
          stepOrder: order++,
          stepName: p.step.stepName,
          label: p.step.stepName,
          labelEn: p.step.stepName,
          action: p.step.stepName,
          status: p.status === 'COMPLETED' ? 'completed' : p.status === 'IN_PROGRESS' ? 'current' : 'pending',
          actorName: p.handledByUser?.fullName || primaryAssignee,
          actor: p.handledByUser?.fullName || primaryAssignee,
          timestamp: (p.completedAt || p.startedAt || ticket.updatedAt).toISOString(),
          notes: p.notes,
        });
      }
    }

    // 5. الحالة الختامية والجارية للمعاملة
    const hasOpenSubs = subTickets.some((s: any) => !['CLOSED', 'RESOLVED'].includes(s.state?.name));

    if (isMainClosed) {
      steps.push({
        id: 'step-final-closed',
        stepOrder: order++,
        stepName: 'الإغلاق والاعتماد النهائي',
        label: 'تم إنجاز الطلب وإغلاقه نهائياً',
        labelEn: 'Ticket Successfully Resolved & Closed',
        action: 'تم إنجاز الطلب وإغلاقه نهائياً',
        status: 'completed',
        actorName: primaryAssignee,
        actor: primaryAssignee,
        timestamp: ticket.updatedAt.toISOString(),
        notes: ticket.resolutionNotes || 'تم استيفاء جميع المتطلبات وإقفال التذكرة بالكامل.'
      });
    } else if (isMainResolved) {
      steps.push({
        id: 'step-final-resolved',
        stepOrder: order++,
        stepName: 'بانتظار الاعتماد النهائي',
        label: 'تم إنجاز الأعمال الفنية — بانتظار الاعتماد النهائي للإغلاق',
        labelEn: 'Pending Final Closure Approval',
        action: 'تم إنجاز الأعمال الفنية — بانتظار الاعتماد النهائي للإغلاق',
        status: 'current',
        actorName: primaryAssignee,
        actor: primaryAssignee,
        timestamp: ticket.updatedAt.toISOString(),
        notes: 'الطلب بانتظار مراجعة واعتماد الإغلاق من المخولين.'
      });
    } else {
      if (hasOpenSubs) {
        steps.push({
          id: 'step-waiting-subs',
          stepOrder: order++,
          stepName: 'بانتظار إنجاز المهام الفرعية',
          label: 'المعاملة معلقة بانتظار قفل المهام الفرعية من الأطراف المستلمة',
          labelEn: 'Waiting on Recipient Parties to Complete Sub-tickets',
          action: 'المعاملة معلقة بانتظار قفل المهام الفرعية من الأطراف المستلمة',
          status: 'current',
          actorName: primaryAssignee,
          actor: primaryAssignee,
          timestamp: ticket.updatedAt.toISOString(),
          notes: 'لا يمكن إقفال التذكرة حتى يقوم كل طرف مستلم للمهام الفرعية بإغلاقها من جهته أولاً.'
        });
      } else {
        steps.push({
          id: 'step-active-processing',
          stepOrder: order++,
          stepName: 'قيد المتابعة والإجراء النهائي',
          label: subTickets.length > 0 
            ? `اكتملت كافة المهام الفرعية — المعاملة الآن لدى مستلم الطلب الرئيسي (${primaryAssignee}) للإجراء النهائي`
            : `المعاملة قيد المعالجة الفنية لدى مستلم الطلب الرئيسي (${primaryAssignee})`,
          labelEn: `Active Processing by Primary Handler (${primaryAssignee})`,
          action: `المعاملة لدى مستلم الطلب الرئيسي (${primaryAssignee})`,
          status: 'current',
          actorName: primaryAssignee,
          actor: primaryAssignee,
          timestamp: ticket.updatedAt.toISOString(),
          notes: 'جاري العمل على إتمام متطلبات الطلب.'
        });
      }
    }

    return steps;
  }

  /**
   * حذف مسار (soft — تعطيل فقط لحماية التذاكر القائمة)
   */
  async deactivateFlow(flowId: string): Promise<void> {
    await prisma.flowDefinition.update({
      where: { id: flowId },
      data: { isActive: false },
    });
  }

  /**
   * تحديث فورم مسار (يُنشئ نسخة جديدة — version++)
   */
  async updateFormSchema(schemaId: string, newFields: FormFieldDefinition[]): Promise<void> {
    const schema = await prisma.formSchema.findUnique({ where: { id: schemaId } });
    if (!schema) throw new Error(`FormSchema [${schemaId}] not found`);

    await prisma.formSchema.update({
      where: { id: schemaId },
      data: {
        fieldsJson: JSON.stringify(newFields),
        version: { increment: 1 },
      },
    });
  }
}
