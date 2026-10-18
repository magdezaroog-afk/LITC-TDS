/**
 * LITC Enterprise OS v43 - Analytics Permission Controller
 * =========================================================
 * حوكمة ومنح صلاحيات استعراض التحليلات والتقارير المتقاطعة عبر الإدارات.
 * خاضع لرقابة الأدمن الصارمة مع الفصل التام عن الصلاحيات التشغيلية للتذاكر.
 */
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

export class AnalyticsPermissionControllerClass {
  /**
   * جلب قائمة كافة الصلاحيات التحليلية الممنوحة (حصري لمدير النظام)
   */
  public getPermissionsList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const roleId = Number(user?.roleId || 0);
      const isAdmin = roleId === 1 || roleId === 22;

      // فحص إن كان المستخدم مدير نظام أو رئيس إدارة
      let allowedDeptIds: number[] = [];
      if (isAdmin) {
        // جميع الإدارات متاحة للأدمن
        const allDepts = await prisma.department.findMany({ where: { isDeleted: false }, select: { id: true } });
        allowedDeptIds = allDepts.map(d => d.id);
      } else {
        // رئيس الإدارة / القيادي: تقتصر صلاحياته على إدارته
        const dbCaller = await prisma.user.findUnique({
          where: { id: user?.id },
          select: { id: true, departmentId: true, role: { select: { name: true } } }
        });
        if (dbCaller?.departmentId) {
          allowedDeptIds = [dbCaller.departmentId];
        } else {
          res.status(403).json({ success: false, error: 'غير مصرح: ليس لديك صلاحية حوكمة التحليلات.' });
          return;
        }
      }

      const permissions = await prisma.analyticsPermission.findMany({
        where: {
          departmentId: { in: allowedDeptIds }
        },
        include: {
          user: {
            select: { id: true, username: true, fullName: true, jobTitle: true, departmentId: true }
          },
          department: {
            select: { id: true, name: true }
          },
          grantedBy: {
            select: { id: true, username: true, fullName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // جلب قائمة الإدارات والموظفين المسموح إدارتهم
      const departments = await prisma.department.findMany({
        where: { isDeleted: false, id: { in: allowedDeptIds } },
        select: { id: true, name: true }
      });

      const users = await prisma.user.findMany({
        where: {
          isDeleted: false,
          isActive: true,
          ...(isAdmin ? {} : { departmentId: { in: allowedDeptIds } })
        },
        select: { id: true, username: true, fullName: true, jobTitle: true, departmentId: true },
        take: 150
      });

      res.status(200).json({
        success: true,
        data: {
          isAdmin,
          permissions,
          departments,
          users
        }
      });
    } catch (error) {
      console.error('[AnalyticsPermissionController] getPermissionsList error:', error);
      next(error);
    }
  };

  /**
   * منح صلاحية استعراض تحليلات إدارة لمستخدم (Admin أو رئيس الإدارة)
   */
  public grantAnalyticsAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = (req as any).user;
      const roleId = Number(caller?.roleId || 0);
      const isAdmin = roleId === 1 || roleId === 22;

      const { userId, departmentId, routeId, canExport = true, canCompare = true } = req.body;

      if (!userId || !departmentId) {
        res.status(400).json({ success: false, error: 'المستخدم والإدارة مطلوبان.' });
        return;
      }

      const parsedUserId = Number(userId);
      const parsedDeptId = Number(departmentId);

      // التحقق من الصلاحية: إن لم يكن أدمن، يجب أن يكون هو رئيس/منسوب نفس الإدارة
      if (!isAdmin) {
        const dbCaller = await prisma.user.findUnique({
          where: { id: caller?.id },
          select: { id: true, departmentId: true }
        });
        if (dbCaller?.departmentId !== parsedDeptId) {
          res.status(403).json({ success: false, error: 'غير مصرح لك بتفويض صلاحيات لإدارة غير إدارتك.' });
          return;
        }
      }

      const permission = await prisma.analyticsPermission.upsert({
        where: {
          userId_departmentId_routeId: {
            userId: parsedUserId,
            departmentId: parsedDeptId,
            routeId: routeId || ''
          }
        },
        update: {
          canExport: Boolean(canExport),
          canCompare: Boolean(canCompare),
          grantedById: caller.id
        },
        create: {
          userId: parsedUserId,
          departmentId: parsedDeptId,
          routeId: routeId || '',
          canExport: Boolean(canExport),
          canCompare: Boolean(canCompare),
          grantedById: caller.id
        }
      });

      res.status(200).json({
        success: true,
        message: 'تم منح صلاحية التحليل بنجاح',
        data: permission
      });
    } catch (error) {
      console.error('[AnalyticsPermissionController] grantAnalyticsAccess error:', error);
      next(error);
    }
  };

  /**
   * إلغاء صلاحية تحليل معينة
   */
  public revokeAnalyticsAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const caller = (req as any).user;
      const roleId = Number(caller?.roleId || 0);
      const isAdmin = roleId === 1 || roleId === 22;

      const permissionId = req.params.id;
      if (!permissionId) {
        res.status(400).json({ success: false, error: 'معرف الصلاحية مطلوب.' });
        return;
      }

      const existing = await prisma.analyticsPermission.findUnique({
        where: { id: permissionId }
      });

      if (!existing) {
        res.status(404).json({ success: false, error: 'الصلاحية غير موجودة.' });
        return;
      }

      if (!isAdmin) {
        const dbCaller = await prisma.user.findUnique({
          where: { id: caller?.id },
          select: { departmentId: true }
        });
        if (dbCaller?.departmentId !== existing.departmentId) {
          res.status(403).json({ success: false, error: 'غير مصرح لك بإلغاء صلاحية تخص إدارة أخرى.' });
          return;
        }
      }

      await prisma.analyticsPermission.delete({
        where: { id: permissionId }
      });

      res.status(200).json({
        success: true,
        message: 'تم إلغاء صلاحية التحليل بنجاح'
      });
    } catch (error) {
      console.error('[AnalyticsPermissionController] revokeAnalyticsAccess error:', error);
      next(error);
    }
  };

  /**
   * استرجاع الإدارات المصرح للمستخدم الحالي استعراض تحليلاتها
   * (إدارته + الصلاحيات الممنوحة من الأدمن + أو جميع الإدارات إذا كان أدمن)
   */
  public getUserAccessibleDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      if (!user) {
        res.status(401).json({ success: false, error: 'غير مسجل الدخول' });
        return;
      }

      const roleId = Number(user.roleId || 0);
      const isAdmin = roleId === 1 || roleId === 22;

      // إذا كان مدير نظام، يملك الوصول الشامل لجميع الإدارات
      if (isAdmin) {
        const allDepts = await prisma.department.findMany({
          where: { isDeleted: false },
          select: { id: true, name: true }
        });

        res.status(200).json({
          success: true,
          data: {
            isAdmin: true,
            departments: allDepts.map(d => ({
              departmentId: d.id,
              departmentName: d.name,
              isNative: true,
              canExport: true,
              canCompare: true,
              routeId: null
            }))
          }
        });
        return;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, departmentId: true, roleId: true }
      });

      // المستخدم العادي / القيادي:
      const accessible: Array<{
        departmentId: number;
        departmentName: string;
        isNative: boolean;
        canExport: boolean;
        canCompare: boolean;
        routeId: string | null;
      }> = [];

      // 1. إدارته الأصلية
      if (dbUser?.departmentId) {
        const nativeDept = await prisma.department.findUnique({
          where: { id: dbUser.departmentId }
        });
        if (nativeDept && !nativeDept.isDeleted) {
          accessible.push({
            departmentId: nativeDept.id,
            departmentName: nativeDept.name,
            isNative: true,
            canExport: true,
            canCompare: true,
            routeId: null
          });
        }
      }

      // 2. الصلاحيات الممنوحة له من الأدمن
      const granted = await prisma.analyticsPermission.findMany({
        where: { userId: user.id },
        include: { department: true }
      });

      for (const g of granted) {
        if (!g.department || g.department.isDeleted) continue;
        if (!accessible.some(a => a.departmentId === g.departmentId && a.routeId === g.routeId)) {
          accessible.push({
            departmentId: g.departmentId,
            departmentName: g.department.name,
            isNative: false,
            canExport: g.canExport,
            canCompare: g.canCompare,
            routeId: g.routeId || null
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          isAdmin: false,
          departments: accessible
        }
      });
    } catch (error) {
      console.error('[AnalyticsPermissionController] getUserAccessibleDepartments error:', error);
      next(error);
    }
  };
}

export const AnalyticsPermissionController = Object.freeze(new AnalyticsPermissionControllerClass());

