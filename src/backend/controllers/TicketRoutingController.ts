import { Request, Response } from 'express';
import { prisma } from '../../db/client';

// Helper: Sync a route object to FlowDefinition table
async function syncRouteToFlowDefinition(route: any) {
  if (!route?.id) return;
  const deptId = isNaN(Number(route.targetDepartmentId)) ? undefined : Number(route.targetDepartmentId);
  const managerId = route.managerId && !isNaN(Number(route.managerId)) ? Number(route.managerId) : null;
  await prisma.flowDefinition.upsert({
    where: { id: route.id },
    update: {
      name: route.name,
      description: route.description,
      icon: route.icon,
      isActive: route.isActive !== false,
      departmentId: deptId,
      managerId: managerId,
    },
    create: {
      id: route.id,
      name: route.name,
      description: route.description,
      icon: route.icon,
      isActive: route.isActive !== false,
      departmentId: deptId,
      managerId: managerId,
    }
  }).catch(err => console.error('[TicketRoutingController] syncRouteToFlowDefinition error:', err));
}

export class TicketRoutingController {
  
  /** GET /api/v1/routing/routes - Fetch all routes from DB */
  static async getRoutes(req: Request, res: Response) {
    try {
      const { departmentId } = req.query;

      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });

      let routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];

      if (departmentId) {
        routes = routes.filter((r: any) => 
          String(r.targetDepartmentId) === String(departmentId)
        );
      }

      return res.json({ success: true, routes });
    } catch (error) {
      console.error(`[TicketRoutingController] getRoutes error: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch routes' });
    }
  }

  /** GET /api/v1/routing/routes/public - Fetch active routes for employee portal */
  static async getPublicRoutes(req: Request, res: Response) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });

      let routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      routes = routes.filter((r: any) => r.isActive !== false);

      return res.json({ success: true, routes });
    } catch (error) {
      console.error(`[TicketRoutingController] getPublicRoutes error: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch public routes' });
    }
  }

  /** POST /api/v1/routing/routes - Save snapshot of all routes to DB */
  static async saveRoutes(req: Request, res: Response) {
    try {
      const { routes } = req.body;
      if (!Array.isArray(routes)) {
        return res.status(400).json({ error: 'routes array required' });
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

      // Sync all routes to FlowDefinition table
      for (const r of routes) {
        await syncRouteToFlowDefinition(r);
      }

      console.log(`[TicketRoutingController] Saved and synced ${routes.length} routes to DB`);
      return res.json({ success: true, message: `تم حفظ ${routes.length} مسار بنجاح`, routes });
    } catch (error) {
      console.error(`[TicketRoutingController] saveRoutes error: ${error}`);
      return res.status(500).json({ error: 'Failed to save routes' });
    }
  }

  /** POST /api/v1/routing/routes/single - Add a single route */
  static async createRoute(req: Request, res: Response) {
    try {
      const newRoute = req.body;
      if (!newRoute.id) newRoute.id = `route_${Date.now()}`;
      if (!newRoute.targetDepartmentId) {
        return res.status(400).json({ error: 'targetDepartmentId is required' });
      }

      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });
      const routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];

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

      await syncRouteToFlowDefinition(newRoute);

      return res.status(201).json({ success: true, route: newRoute });
    } catch (error) {
      console.error(`[TicketRoutingController] createRoute error: ${error}`);
      return res.status(500).json({ error: 'Failed to create route' });
    }
  }

  /** PUT /api/v1/routing/routes/:id - Update single route */
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

      await syncRouteToFlowDefinition(routes[index]);

      return res.json({ success: true, route: routes[index] });
    } catch (error) {
      console.error(`[TicketRoutingController] updateRoute error: ${error}`);
      return res.status(500).json({ error: 'Failed to update route' });
    }
  }

  /** DELETE /api/v1/routing/routes/:id - Delete single route */
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

      await prisma.flowDefinition.update({
        where: { id },
        data: { isActive: false }
      }).catch(() => {});

      return res.json({ success: true, message: 'تم حذف المسار بنجاح' });
    } catch (error) {
      console.error(`[TicketRoutingController] deleteRoute error: ${error}`);
      return res.status(500).json({ error: 'Failed to delete route' });
    }
  }

  /** GET /api/v1/routing/dynamic-fields - Fetch custom dynamic fields */
  static async getDynamicFields(req: Request, res: Response) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_dynamic_fields' }
      });
      const fields = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      return res.json({ success: true, fields });
    } catch (error) {
      console.error(`[TicketRoutingController] getDynamicFields error: ${error}`);
      return res.status(500).json({ error: 'Failed to fetch dynamic fields' });
    }
  }

  /** POST /api/v1/routing/dynamic-fields - Save custom dynamic fields */
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

      return res.json({ success: true, fields, message: `تم حفظ ${fields.length} حقل ديناميكي` });
    } catch (error) {
      console.error(`[TicketRoutingController] saveDynamicFields error: ${error}`);
      return res.status(500).json({ error: 'Failed to save dynamic fields' });
    }
  }
}

