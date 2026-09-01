import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { Logger } from '../infrastructure/Logger';

/**
 * TicketRoutingController (Enhanced)
 * 
 * يدير مسارات الطلبات (Ticket Routes) بالكامل في قاعدة البيانات.
 * كل مسار مرتبط بإدارة تشغيلية حقيقية من DB.
 */
export class TicketRoutingController {

  // ─── Routes CRUD ──────────────────────────────────────────────────────────

  /** GET /api/v1/routing/routes - جلب جميع المسارات */
  static async getRoutes(req: Request, res: Response) {
    try {
      const { departmentId } = req.query;

      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });

      let routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];

      // Filter by department if requested
      if (departmentId) {
        routes = routes.filter((r: any) => r.targetDepartmentId === departmentId || r.targetDepartmentId === parseInt(departmentId as string));
      }

      res.json({ success: true, routes });
    } catch (error) {
      Logger.error(`[TicketRoutingController] getRoutes error: ${error}`);
      res.status(500).json({ error: 'Failed to fetch routes' });
    }
  }

  /** POST /api/v1/routing/routes - حفظ المسارات كاملة */
  static async saveRoutes(req: Request, res: Response) {
    try {
      const { routes } = req.body;
      if (!Array.isArray(routes)) return res.status(400).json({ error: 'routes array required' });

      // Validate each route has a target department that exists in DB
      const deptIds = [...new Set(routes.map((r: any) => r.targetDepartmentId).filter(Boolean))];
      
      for (const deptId of deptIds) {
        const deptExists = await prisma.department.findFirst({
          where: {
            OR: [
              { id: typeof deptId === 'number' ? deptId : undefined },
              { name: typeof deptId === 'string' ? deptId : undefined }
            ],
            isDeleted: false
          }
        });
        if (!deptExists) {
          Logger.warn(`[TicketRoutingController] Route references unknown dept: ${deptId}`);
          // Don't block - just log warning, dept might be a new one being created
        }
      }

      await prisma.systemSetting.upsert({
        where: { settingKey: 'litc_ticket_routes' },
        create: {
          settingKey: 'litc_ticket_routes',
          settingValue: JSON.stringify(routes),
          description: 'Ticket Routing Rules Configuration'
        },
        update: { settingValue: JSON.stringify(routes) }
      });

      Logger.info(`[TicketRoutingController] Saved ${routes.length} routes to DB`);
      res.json({ success: true, message: `تم حفظ ${routes.length} مسار بنجاح` });
    } catch (error) {
      Logger.error(`[TicketRoutingController] saveRoutes error: ${error}`);
      res.status(500).json({ error: 'Failed to save routes' });
    }
  }

  /** POST /api/v1/routing/routes/single - إضافة مسار واحد جديد */
  static async createRoute(req: Request, res: Response) {
    try {
      const newRoute = req.body;
      if (!newRoute.id) newRoute.id = `route_${Date.now()}`;
      if (!newRoute.targetDepartmentId) {
        return res.status(400).json({ error: 'targetDepartmentId is required' });
      }

      // Get existing routes
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });
      const routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];

      // Check for duplicate
      if (routes.find((r: any) => r.id === newRoute.id)) {
        return res.status(409).json({ error: 'Route with this ID already exists' });
      }

      routes.push(newRoute);

      await prisma.systemSetting.upsert({
        where: { settingKey: 'litc_ticket_routes' },
        create: {
          settingKey: 'litc_ticket_routes',
          settingValue: JSON.stringify(routes),
          description: 'Ticket Routing Rules Configuration'
        },
        update: { settingValue: JSON.stringify(routes) }
      });

      res.status(201).json({ success: true, route: newRoute });
    } catch (error) {
      Logger.error(`[TicketRoutingController] createRoute error: ${error}`);
      res.status(500).json({ error: 'Failed to create route' });
    }
  }

  /** PUT /api/v1/routing/routes/:id - تعديل مسار */
  static async updateRoute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });
      const routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      const index = routes.findIndex((r: any) => r.id === id);

      if (index === -1) return res.status(404).json({ error: 'Route not found' });

      routes[index] = { ...routes[index], ...updates };

      await prisma.systemSetting.update({
        where: { settingKey: 'litc_ticket_routes' },
        data: { settingValue: JSON.stringify(routes) }
      });

      res.json({ success: true, route: routes[index] });
    } catch (error) {
      Logger.error(`[TicketRoutingController] updateRoute error: ${error}`);
      res.status(500).json({ error: 'Failed to update route' });
    }
  }

  /** DELETE /api/v1/routing/routes/:id - حذف مسار */
  static async deleteRoute(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });
      const routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      const filtered = routes.filter((r: any) => r.id !== id);

      if (filtered.length === routes.length) {
        return res.status(404).json({ error: 'Route not found' });
      }

      await prisma.systemSetting.update({
        where: { settingKey: 'litc_ticket_routes' },
        data: { settingValue: JSON.stringify(filtered) }
      });

      res.json({ success: true, message: 'تم حذف المسار بنجاح' });
    } catch (error) {
      Logger.error(`[TicketRoutingController] deleteRoute error: ${error}`);
      res.status(500).json({ error: 'Failed to delete route' });
    }
  }

  // ─── Dynamic Fields ────────────────────────────────────────────────────────

  /** GET /api/v1/routing/dynamic-fields - جلب الحقول الديناميكية */
  static async getDynamicFields(req: Request, res: Response) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_dynamic_fields' }
      });
      const fields = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      res.json({ success: true, fields });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dynamic fields' });
    }
  }

  /** POST /api/v1/routing/dynamic-fields - حفظ الحقول الديناميكية */
  static async saveDynamicFields(req: Request, res: Response) {
    try {
      const { fields } = req.body;
      if (!Array.isArray(fields)) return res.status(400).json({ error: 'fields array required' });

      await prisma.systemSetting.upsert({
        where: { settingKey: 'litc_dynamic_fields' },
        create: {
          settingKey: 'litc_dynamic_fields',
          settingValue: JSON.stringify(fields),
          description: 'Ticket Dynamic Custom Fields'
        },
        update: { settingValue: JSON.stringify(fields) }
      });

      res.json({ success: true, message: `تم حفظ ${fields.length} حقل ديناميكي` });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save dynamic fields' });
    }
  }
}
