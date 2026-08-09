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
   */
  async getTicketJourney(ticketId: number) {
    const progress = await prisma.ticketFlowProgress.findMany({
      where: { ticketId },
      include: {
        step: { select: { stepName: true, stepOrder: true, assignToType: true, assignToId: true, slaMinutes: true } },
        handledByUser: { select: { id: true, fullName: true, jobTitle: true, avatarUrl: true } },
      },
      orderBy: { step: { stepOrder: 'asc' } },
    });

    return progress.map(p => ({
      stepOrder: p.step.stepOrder,
      stepName: p.step.stepName,
      assignToType: p.step.assignToType,
      assignToId: p.step.assignToId,
      slaMinutes: p.step.slaMinutes,
      status: p.status,
      startedAt: p.startedAt,
      completedAt: p.completedAt,
      handledBy: p.handledByUser,
      notes: p.notes,
    }));
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
