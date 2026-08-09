/**
 * LEPC — FlowEngine Controller
 * API Layer لإدارة المسارات الديناميكية (إنشاء، قراءة، تعديل، تفعيل، إنجاز)
 */
import { Request, Response, NextFunction } from 'express';
import { FlowEngineService } from '../services/FlowEngineService';
import { prisma } from '../../db/client';

const flowEngine = new FlowEngineService();

export class FlowController {

  // POST /api/flows — إنشاء مسار جديد كامل
  async createFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await flowEngine.createFlow(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err: any) {
      if (err.code === 'P2002') return res.status(409).json({ success: false, error: 'اسم المسار موجود مسبقاً' });
      next(err);
    }
  }

  // GET /api/flows — كل المسارات النشطة
  async getFlows(req: Request, res: Response, next: NextFunction) {
    try {
      const flows = await flowEngine.getActiveFlows();
      res.json({ success: true, data: flows });
    } catch (err) { next(err); }
  }

  // GET /api/flows/:id — تفاصيل مسار مع الخطوات والفورم
  async getFlowById(req: Request, res: Response, next: NextFunction) {
    try {
      const flow = await flowEngine.getFlowById(req.params.id);
      res.json({ success: true, data: flow });
    } catch (err) { next(err); }
  }

  // PATCH /api/flows/:id/deactivate — تعطيل مسار
  async deactivateFlow(req: Request, res: Response, next: NextFunction) {
    try {
      await flowEngine.deactivateFlow(req.params.id);
      res.json({ success: true, message: 'تم تعطيل المسار' });
    } catch (err) { next(err); }
  }

  // PUT /api/flows/schemas/:schemaId — تحديث مخطط الفورم
  async updateFormSchema(req: Request, res: Response, next: NextFunction) {
    try {
      await flowEngine.updateFormSchema(req.params.schemaId, req.body.fields);
      res.json({ success: true, message: 'تم تحديث مخطط الفورم' });
    } catch (err) { next(err); }
  }

  // POST /api/tickets/:id/activate-flow — تفعيل مسار على تذكرة
  async activateFlowForTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = Number(req.params.id);
      const { flowId } = req.body;
      await flowEngine.activateFlowForTicket(ticketId, flowId);
      res.json({ success: true, message: 'تم تفعيل المسار على التذكرة' });
    } catch (err) { next(err); }
  }

  // POST /api/tickets/:id/advance — الانتقال للخطوة التالية
  async advanceFlow(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = Number(req.params.id);
      const userId = (req as any).user?.id;
      const { notes } = req.body;
      const result = await flowEngine.advanceFlow(ticketId, userId, notes);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  // POST /api/tickets/:id/reject-step — رفض الخطوة الحالية
  async rejectStep(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = Number(req.params.id);
      const userId = (req as any).user?.id;
      const { reason } = req.body;
      if (!reason) return res.status(400).json({ success: false, error: 'سبب الرفض مطلوب' });
      await flowEngine.rejectStep(ticketId, userId, reason);
      res.json({ success: true, message: 'تم رفض الخطوة' });
    } catch (err) { next(err); }
  }

  // GET /api/tickets/:id/journey — خريطة رحلة التذكرة
  async getTicketJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const journey = await flowEngine.getTicketJourney(Number(req.params.id));
      res.json({ success: true, data: journey });
    } catch (err) { next(err); }
  }

  // POST /api/tickets/:id/form-data — حفظ بيانات الفورم الديناميكي
  async saveFormData(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = Number(req.params.id);
      const { fields } = req.body as { fields: Record<string, string> };
      
      if (!fields || typeof fields !== 'object') {
        return res.status(400).json({ success: false, error: 'حقول الفورم مطلوبة' });
      }

      const upserts = Object.entries(fields).map(([fieldKey, fieldValue]) =>
        prisma.ticketFormData.upsert({
          where: { ticketId_fieldKey: { ticketId, fieldKey } },
          create: { ticketId, fieldKey, fieldValue: String(fieldValue) },
          update: { fieldValue: String(fieldValue) },
        })
      );
      await prisma.$transaction(upserts);
      res.json({ success: true, message: 'تم حفظ بيانات الفورم' });
    } catch (err) { next(err); }
  }

  // GET /api/tickets/:id/form-data — قراءة بيانات الفورم
  async getFormData(req: Request, res: Response, next: NextFunction) {
    try {
      const ticketId = Number(req.params.id);
      const records = await prisma.ticketFormData.findMany({ where: { ticketId } });
      const data = Object.fromEntries(records.map(r => [r.fieldKey, r.fieldValue]));
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}
