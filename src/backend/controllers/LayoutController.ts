/**
 * LITC-TS v43 — LayoutController (Refactored)
 * =============================================
 * يُدير جلب وحفظ الواجهات من جدول Interface (وليس DynamicLayout فقط).
 * يدعم الجلب بـ: userId, roleType, departmentId, interfaceId.
 */
import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { Logger } from '../infrastructure/Logger';

export class LayoutController {

  /**
   * GET /api/v1/layouts
   * يدعم عدة طرق للجلب:
   * - ?roleType=OPERATIONAL_MANAGER → جلب الواجهات المرتبطة بهذا الدور
   * - ?userId=42 → جلب الواجهة المسندة لهذا المستخدم مباشرة (بحسب دوره وإدارته)
   * - ?interfaceId=abc123 → جلب واجهة بعينها
   * - ?departmentId=5&roleType=SECTION_HEAD → جلب واجهة قسم + دور معاً
   */
  static async getLayout(req: Request, res: Response): Promise<void> {
    try {
      const { roleType, userId, interfaceId, departmentId } = req.query;

      // جلب واجهة محددة بـ ID
      if (interfaceId) {
        const iface = await prisma.interface.findUnique({
          where: { id: interfaceId as string },
        });
        if (!iface) {
          res.status(404).json({ success: false, error: 'الواجهة غير موجودة' });
          return;
        }
        const components = iface.configJson ? JSON.parse(iface.configJson).components || [] : [];
        res.status(200).json({ success: true, components, interface: iface });
        return;
      }

      // جلب الواجهة المناسبة للمستخدم (بحسب دوره وإدارته)
      if (userId) {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(userId as string) },
          include: { role: true },
        });
        if (!user) {
          res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
          return;
        }

        // نبحث عن واجهة مطابقة للدور + الإدارة
        const whereClause: any = { roleType: user.role.name };
        if (user.departmentId) {
          whereClause.departmentId = user.departmentId;
        }

        const iface = await prisma.interface.findFirst({ where: whereClause });
        if (iface?.configJson) {
          const components = JSON.parse(iface.configJson).components || [];
          res.status(200).json({ success: true, components, interface: iface });
          return;
        }

        // إذا لم نجد واجهة محددة بالإدارة، نبحث عن واجهة عامة لنفس الدور
        const genericIface = await prisma.interface.findFirst({
          where: { roleType: user.role.name },
        });
        const components = genericIface?.configJson
          ? JSON.parse(genericIface.configJson).components || []
          : [];
        res.status(200).json({ success: true, components, interface: genericIface || null });
        return;
      }

      // جلب بـ roleType (+ departmentId اختياري)
      if (roleType) {
        const whereClause: any = { roleType: roleType as string };
        if (departmentId) {
          whereClause.departmentId = parseInt(departmentId as string);
        }

        const interfaces = await prisma.interface.findMany({ where: whereClause });
        if (interfaces.length === 0) {
          res.status(200).json({ success: true, components: [], interfaces: [] });
          return;
        }

        // إذا وجدنا نتيجة واحدة، نُعيدها مباشرة
        if (interfaces.length === 1 && interfaces[0].configJson) {
          const components = JSON.parse(interfaces[0].configJson).components || [];
          res.status(200).json({ success: true, components, interface: interfaces[0] });
          return;
        }

        // إذا وجدنا عدة واجهات، نُعيد المصفوفة كاملة
        res.status(200).json({
          success: true,
          interfaces: interfaces.map(i => ({
            ...i,
            components: i.configJson ? JSON.parse(i.configJson).components || [] : [],
          })),
        });
        return;
      }

      res.status(400).json({ success: false, error: 'يجب تحديد: roleType أو userId أو interfaceId' });
    } catch (error) {
      Logger.error(`[LayoutController.getLayout] ${error}`);
      res.status(500).json({ success: false, error: 'خطأ داخلي في الخادم' });
    }
  }

  /**
   * POST /api/v1/layouts
   * حفظ أو تحديث واجهة.
   * Body: { name, interfaceType, roleType, departmentId, configJson: { components[] } }
   */
  static async saveLayout(req: Request, res: Response): Promise<void> {
    try {
      const { name, interfaceType, roleType, departmentId, configJson, id } = req.body;

      if (!name || !departmentId || !roleType) {
        res.status(400).json({ success: false, error: 'name, departmentId, و roleType مطلوبة' });
        return;
      }

      const configString = typeof configJson === 'string'
        ? configJson
        : JSON.stringify(configJson || { components: [] });

      const deptId = parseInt(departmentId, 10);

      // إذا كان هناك id → تحديث
      if (id) {
        const updated = await prisma.interface.update({
          where: { id },
          data: {
            name,
            interfaceType: interfaceType || 'OPERATIONAL',
            roleType,
            configJson: configString,
          },
        });
        Logger.info(`[LayoutController] Updated interface ${id} (${name})`);
        res.status(200).json({ success: true, interface: updated });
        return;
      }

      // إنشاء جديد
      const created = await prisma.interface.create({
        data: {
          name,
          interfaceType: interfaceType || 'OPERATIONAL',
          roleType,
          departmentId: deptId,
          configJson: configString,
        },
      });

      Logger.info(`[LayoutController] Created interface ${created.id} (${name})`);

      // إرسال حدث لتحديث الواجهة عند الموظفين المتصلين (مستقبلاً عبر WebSocket)
      res.status(201).json({ success: true, interface: created });
    } catch (error) {
      Logger.error(`[LayoutController.saveLayout] ${error}`);
      res.status(500).json({ success: false, error: 'خطأ داخلي في الخادم' });
    }
  }

  /**
   * DELETE /api/v1/layouts/:id
   * حذف واجهة (مع التحقق من عدم وجود مستخدمين مرتبطين — مستقبلاً).
   */
  static async deleteLayout(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await prisma.interface.delete({ where: { id } });
      Logger.info(`[LayoutController] Deleted interface ${id}`);
      res.status(200).json({ success: true, message: 'تم حذف الواجهة بنجاح' });
    } catch (error) {
      Logger.error(`[LayoutController.deleteLayout] ${error}`);
      res.status(500).json({ success: false, error: 'خطأ داخلي في الخادم' });
    }
  }

  // ---- Legacy: دعم مسار الـ roleId القديم لمنع كسر الكود القديم ----

  /**
   * GET /api/v1/layouts/list
   * جلب كل الواجهات المحفوظة مع أسماء الإدارات للواجهة الإدارية.
   */
  static async listAllLayouts(req: Request, res: Response): Promise<void> {
    try {
      const interfaces = await prisma.interface.findMany({
        include: { department: { select: { id: true, name: true } } },
        orderBy: { updatedAt: 'desc' },
      });
      res.status(200).json({ success: true, interfaces });
    } catch (error) {
      Logger.error(`[LayoutController.listAllLayouts] ${error}`);
      res.status(500).json({ success: false, error: 'خطأ داخلي في الخادم' });
    }
  }

  private static async resolveRoleId(roleParam: string): Promise<number | null> {
    const numericId = parseInt(roleParam, 10);
    if (!isNaN(numericId)) {
      const role = await prisma.role.findUnique({ where: { id: numericId } });
      if (role) return role.id;
    }
    let role = await prisma.role.findFirst({ where: { name: { equals: roleParam } } });
    if (!role) {
      try {
        role = await prisma.role.create({ data: { name: roleParam, defaultCanViewInternal: false } });
      } catch (_) {
        role = await prisma.role.findFirst({ where: { name: roleParam } });
      }
    }
    return role ? role.id : null;
  }

  static async getLayoutForRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const resolvedId = await LayoutController.resolveRoleId(roleId);
      if (!resolvedId) { res.status(404).json({ error: 'Role not found' }); return; }
      const layoutRecord = await prisma.dynamicLayout.findUnique({ where: { roleId: resolvedId } });
      if (!layoutRecord) { res.status(200).json({ success: true, layout: null, components: [] }); return; }
      const parsed = JSON.parse(layoutRecord.layoutJson);
      res.status(200).json({ success: true, layout: parsed, components: parsed.components || parsed });
    } catch (error) {
      Logger.error(`[LayoutController.getLayoutForRole] ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async saveLayoutForRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const layoutData = req.body;
      const resolvedId = await LayoutController.resolveRoleId(roleId);
      if (!resolvedId) { res.status(404).json({ error: 'Role could not be resolved' }); return; }
      const layoutJsonStr = JSON.stringify(layoutData);
      const savedLayout = await prisma.dynamicLayout.upsert({
        where: { roleId: resolvedId },
        update: { layoutJson: layoutJsonStr },
        create: { roleId: resolvedId, layoutJson: layoutJsonStr },
      });
      const parsed = JSON.parse(savedLayout.layoutJson);
      res.status(200).json({ success: true, layout: parsed, components: parsed.components || parsed });
    } catch (error) {
      Logger.error(`[LayoutController.saveLayoutForRole] ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
