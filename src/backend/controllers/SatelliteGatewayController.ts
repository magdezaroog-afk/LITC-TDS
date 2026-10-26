import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/client';

interface SatelliteSystemConfig {
  id: string;
  name: string;
  category: string;
  defaultPort: number;
  targetUrl: string;
  isActive: boolean;
  allowedRoles: string[];
  allowedDepartments?: number[];
  allowedUserIds?: number[];
  description: string;
}

// In-memory registry with sensible defaults (synced and persisted in DB via SystemSetting)
let SATELLITE_REGISTRY: Record<string, SatelliteSystemConfig> = {
  asset_inventory: {
    id: 'asset_inventory',
    name: 'منظومة جرد الأصول والأنظمة التقنية',
    category: 'IT_OPERATIONS',
    defaultPort: 3000,
    targetUrl: process.env.ASSET_INVENTORY_URL || 'http://localhost:3000',
    isActive: true,
    allowedRoles: ['super_admin', 'system_director', 'co_admin', 'tech_director', 'dept_head', 'team_leader', 'operational_user', 'IT_SUPPORT', '26'],
    allowedDepartments: [1], // إدارة تقنية المعلومات
    allowedUserIds: [1048], // نضال أبو غامجة
    description: 'إدارة وتتبع الأجهزة والمعدات التقنية والأصول التشغيلية لشركة LITC (743+ جهاز مسجل).'
  },
  hrms_satellite: {
    id: 'hrms_satellite',
    name: 'منظومة إدارة الموارد البشرية المساندة',
    category: 'HR_OPERATIONS',
    defaultPort: 4000,
    targetUrl: process.env.HRMS_SATELLITE_URL || 'http://localhost:4000',
    isActive: false, // In preparation for colleague integration
    allowedRoles: ['super_admin', 'system_director', 'dept_head'],
    allowedDepartments: [2], // الموارد البشرية
    description: 'منظومة مساندة قادمة لإدارة الكوادر والإجازات والهيكل الإداري.'
  }
};

let isRegistryLoaded = false;

/**
 * مزامنة واسترجاع سجل المنظومات المساندة من جدول SystemSetting في قاعدة البيانات
 */
async function ensureRegistryLoaded() {
  if (isRegistryLoaded) return;
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'SATELLITE_SYSTEMS_REGISTRY' }
    });

    if (setting?.settingValue) {
      try {
        const parsed = JSON.parse(setting.settingValue);
        if (parsed && typeof parsed === 'object') {
          // دمج السجل المحفوظ مع الحفاظ على المنظومات الأساسية
          SATELLITE_REGISTRY = {
            ...SATELLITE_REGISTRY,
            ...parsed
          };
          // ضمان وجود منظومة جرد الأصول دائماً
          if (!SATELLITE_REGISTRY.asset_inventory) {
            SATELLITE_REGISTRY.asset_inventory = {
              id: 'asset_inventory',
              name: 'منظومة جرد الأصول والأنظمة التقنية',
              category: 'IT_OPERATIONS',
              defaultPort: 3000,
              targetUrl: process.env.ASSET_INVENTORY_URL || 'http://localhost:3000',
              isActive: true,
              allowedRoles: ['super_admin', 'system_director', 'co_admin', 'tech_director', 'dept_head', 'team_leader', 'operational_user', 'IT_SUPPORT', '26'],
              allowedDepartments: [1],
              allowedUserIds: [1048],
              description: 'إدارة وتتبع الأجهزة والمعدات التقنية والأصول التشغيلية لشركة LITC (743+ جهاز مسجل).'
            };
          }
        }
      } catch (parseErr) {
        console.warn('[SatelliteGatewayController] Failed to parse SATELLITE_SYSTEMS_REGISTRY setting:', parseErr);
      }
    } else {
      // التهيئة الأولى في قاعدة البيانات
      await prisma.systemSetting.upsert({
        where: { settingKey: 'SATELLITE_SYSTEMS_REGISTRY' },
        create: {
          settingKey: 'SATELLITE_SYSTEMS_REGISTRY',
          settingValue: JSON.stringify(SATELLITE_REGISTRY),
          description: 'سجل حوكمة المنظومات المساندة والميكروسيرفس الموزعة لشركة LITC'
        },
        update: {}
      });
    }
    isRegistryLoaded = true;
  } catch (err) {
    console.warn('[SatelliteGatewayController] Failed to query SystemSetting table:', err);
  }
}

/**
 * حفظ السجل كاملاً ومحدثاً في قاعدة البيانات بشكل دائم
 */
async function persistRegistryToDB() {
  try {
    await prisma.systemSetting.upsert({
      where: { settingKey: 'SATELLITE_SYSTEMS_REGISTRY' },
      create: {
        settingKey: 'SATELLITE_SYSTEMS_REGISTRY',
        settingValue: JSON.stringify(SATELLITE_REGISTRY),
        description: 'سجل حوكمة المنظومات المساندة والميكروسيرفس الموزعة لشركة LITC'
      },
      update: {
        settingValue: JSON.stringify(SATELLITE_REGISTRY),
        updatedAt: new Date()
      }
    });
  } catch (err) {
    console.error('[SatelliteGatewayController] Failed to persist registry to DB:', err);
  }
}

export class SatelliteGatewayController {
  
  /**
   * جلب قائمة المنظومات المساندة المتاحة للمستخدم الحالي مع حالة الاتصال الحقيقية
   * GET /api/v1/satellites/config
   */
  static async getSatellites(req: Request, res: Response) {
    try {
      await ensureRegistryLoaded();

      const user = (req as any).user;
      const userRole = (typeof user?.role === 'string' ? user.role : user?.role?.name || '').toLowerCase();
      const userRoleId = user?.roleId ? Number(user?.roleId) : null;
      const userDeptId = user?.departmentId ? Number(user?.departmentId) : null;
      const userId = user?.id ? Number(user.id) : null;

      // Extract client hostname to adapt localhost into LAN IP if needed
      const rawHost = ((req.headers['x-forwarded-host'] || req.headers['host'] || req.hostname || 'localhost') as string).trim();
      const clientHost = rawHost.split(':')[0];

      const isPrivilegedAdmin = userRole === 'super_admin' || userRole === 'system_director' || userRole === 'co_admin' || userRoleId === 1 || userRoleId === 22;

      // Single Sign-On (SSO) Handshake: Automatically establish asset inventory session cookie
      try {
        const inventorySecret = process.env.ASSET_INVENTORY_JWT_SECRET || 'super_secret_jwt_key_2026';
        const inventoryToken = jwt.sign(
          {
            id: userId || 1,
            username: user?.username || 'admin',
            role: isPrivilegedAdmin ? 'Admin' : 'User',
            permissions: '{}'
          },
          inventorySecret,
          { expiresIn: '24h' }
        );
        res.cookie('token', inventoryToken, {
          path: '/',
          sameSite: 'lax',
          httpOnly: false,
          maxAge: 24 * 60 * 60 * 1000
        });
      } catch (err) {
        console.warn('[SatelliteGatewayController] Failed to set inventory SSO cookie:', err);
      }

      const results = await Promise.all(
        Object.values(SATELLITE_REGISTRY).map(async (satellite) => {
          // Check role, department, or user based permission
          const roleMatch = 
            satellite.allowedRoles.includes('ALL') ||
            satellite.allowedRoles.map(r => r.toLowerCase()).includes(userRole) ||
            (userRoleId !== null && satellite.allowedRoles.includes(String(userRoleId)));

          const deptMatch = 
            userDeptId !== null && Array.isArray(satellite.allowedDepartments) && satellite.allowedDepartments.includes(userDeptId);

          const userMatch = 
            userId !== null && Array.isArray(satellite.allowedUserIds) && satellite.allowedUserIds.includes(userId);

          const hasAccess = Boolean(isPrivilegedAdmin || roleMatch || deptMatch || userMatch);

          let isOnline = false;
          let latencyMs = 0;

          // If active and user has access, perform lightweight server-side health check
          if (satellite.isActive && hasAccess) {
            const start = Date.now();
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout

              const check = await fetch(`${satellite.targetUrl}/api/auth/me`, {
                signal: controller.signal
              }).catch(() => null);

              clearTimeout(timeoutId);
              latencyMs = Date.now() - start;

              // Any response (even 401 unauthenticated or 200) proves server is alive
              if (check && (check.status >= 200 && check.status < 500)) {
                isOnline = true;
              } else {
                // Try fallback ping to root
                const rootCheck = await fetch(satellite.targetUrl, { method: 'HEAD', signal: controller.signal }).catch(() => null);
                isOnline = !!rootCheck;
              }
            } catch {
              isOnline = false;
            }
          }

          // Compute client-adapted URL (for asset inventory, always use single-origin reverse proxy)
          let clientAdaptedUrl = satellite.targetUrl;
          let publicTargetUrl = satellite.targetUrl;
          if (satellite.id === 'asset_inventory') {
            clientAdaptedUrl = '/satellites/proxy/asset_inventory/';
            publicTargetUrl = '/satellites/proxy/asset_inventory/';
          } else if (satellite.targetUrl.includes('localhost') && clientHost !== 'localhost' && clientHost !== '127.0.0.1') {
            clientAdaptedUrl = satellite.targetUrl.replace('localhost', clientHost);
          }

          return {
            id: satellite.id,
            name: satellite.name,
            category: satellite.category,
            targetUrl: publicTargetUrl,
            clientAdaptedUrl,
            isActive: satellite.isActive,
            hasAccess,
            isOnline,
            latencyMs,
            description: satellite.description
          };
        })
      );

      return res.json({ success: true, satellites: results });
    } catch (error: any) {
      console.error('[SatelliteGatewayController] Error fetching satellites:', error);
      return res.status(500).json({ success: false, error: 'تعذر جلب إعدادات المنظومات المساندة.' });
    }
  }

  /**
   * جلب بيانات الحوكمة الكاملة للمنظومات المساندة (للأدمن ومدير النظام)
   * GET /api/v1/satellites/governance
   */
  static async getGovernanceOverview(req: Request, res: Response) {
    try {
      await ensureRegistryLoaded();

      // جلب قائمة الإدارات والأدوار الحقيقية من قاعدة البيانات
      const [departments, roles] = await Promise.all([
        prisma.department.findMany({
          where: { isDeleted: false },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        }),
        prisma.role.findMany({
          select: { id: true, name: true },
          orderBy: { id: 'asc' }
        })
      ]);

      // استخراج تفاصيل الموظفين المخصصين استثنائياً لكل منظومة
      const satelliteList = await Promise.all(
        Object.values(SATELLITE_REGISTRY).map(async (sat) => {
          let userOverrides: Array<{ id: number; fullName: string | null; username: string; email: string | null; departmentName?: string }> = [];

          if (Array.isArray(sat.allowedUserIds) && sat.allowedUserIds.length > 0) {
            const users = await prisma.user.findMany({
              where: {
                id: { in: sat.allowedUserIds },
                isDeleted: false
              },
              select: {
                id: true,
                fullName: true,
                username: true,
                email: true,
                department: { select: { id: true, name: true } }
              }
            });

            userOverrides = users.map(u => ({
              id: u.id,
              fullName: u.fullName,
              username: u.username,
              email: u.email,
              departmentName: u.department?.name
            }));
          }

          // فحص خفيف لحالة الاتصال الحية
          let isOnline = false;
          let latencyMs = 0;
          const start = Date.now();
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1800);
            const check = await fetch(`${sat.targetUrl}/api/auth/me`, { signal: controller.signal }).catch(() => null);
            clearTimeout(timeoutId);
            latencyMs = Date.now() - start;
            if (check && (check.status >= 200 && check.status < 500)) {
              isOnline = true;
            } else {
              const rootCheck = await fetch(sat.targetUrl, { method: 'HEAD' }).catch(() => null);
              isOnline = !!rootCheck;
            }
          } catch {
            isOnline = false;
          }

          return {
            id: sat.id,
            name: sat.name,
            category: sat.category,
            defaultPort: sat.defaultPort,
            targetUrl: sat.targetUrl,
            proxyUrl: sat.id === 'asset_inventory' ? '/satellites/proxy/asset_inventory/' : undefined,
            isActive: sat.isActive,
            allowedRoles: sat.allowedRoles || [],
            allowedDepartments: sat.allowedDepartments || [],
            allowedUserIds: sat.allowedUserIds || [],
            userOverrides,
            description: sat.description,
            isOnline,
            latencyMs,
            isProtected: sat.id === 'asset_inventory'
          };
        })
      );

      return res.json({
        success: true,
        satellites: satelliteList,
        departments,
        roles
      });
    } catch (error: any) {
      console.error('[SatelliteGatewayController] getGovernanceOverview error:', error);
      return res.status(500).json({ success: false, error: 'تعذر جلب بيانات حوكمة المنظومات المساندة.' });
    }
  }

  /**
   * محرك البحث عن الموظفين بالاسم أو الرقم لإضافتهم لقائمة الاستثناءات الحية
   * GET /api/v1/satellites/users/search?q=...
   */
  static async searchUsers(req: Request, res: Response) {
    try {
      const q = String(req.query.q || '').trim();
      if (!q || q.length < 2) {
        return res.json({ success: true, users: [] });
      }

      const users = await prisma.user.findMany({
        where: {
          isDeleted: false,
          OR: [
            { fullName: { contains: q } },
            { username: { contains: q } },
            { email: { contains: q } }
          ]
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          email: true,
          departmentId: true,
          department: { select: { id: true, name: true } },
          role: { select: { id: true, name: true } }
        },
        take: 12
      });

      return res.json({ success: true, users });
    } catch (error: any) {
      console.error('[SatelliteGatewayController] searchUsers error:', error);
      return res.status(500).json({ success: false, error: 'فشل البحث عن الموظفين.' });
    }
  }

  /**
   * تحديث وتطبيق صلاحيات المنظومة (إدارات، أدوار، موظفين مستثنين)
   * PUT /api/v1/satellites/:id/permissions
   */
  static async updateSatellitePermissions(req: Request, res: Response) {
    try {
      await ensureRegistryLoaded();
      const { id } = req.params;
      const { allowedRoles, allowedDepartments, allowedUserIds, isActive, name, targetUrl, description } = req.body;

      if (!SATELLITE_REGISTRY[id]) {
        return res.status(404).json({ success: false, error: 'المنظومة غير مسجلة في النظام.' });
      }

      if (Array.isArray(allowedRoles)) {
        SATELLITE_REGISTRY[id].allowedRoles = allowedRoles;
      }
      if (Array.isArray(allowedDepartments)) {
        SATELLITE_REGISTRY[id].allowedDepartments = allowedDepartments.map(Number).filter(n => !isNaN(n));
      }
      if (Array.isArray(allowedUserIds)) {
        SATELLITE_REGISTRY[id].allowedUserIds = allowedUserIds.map(Number).filter(n => !isNaN(n));
      }
      if (typeof isActive === 'boolean') {
        SATELLITE_REGISTRY[id].isActive = isActive;
      }
      if (name && typeof name === 'string') {
        SATELLITE_REGISTRY[id].name = name.trim();
      }
      if (targetUrl && typeof targetUrl === 'string') {
        SATELLITE_REGISTRY[id].targetUrl = targetUrl.trim();
      }
      if (description && typeof description === 'string') {
        SATELLITE_REGISTRY[id].description = description.trim();
      }

      await persistRegistryToDB();

      return res.json({
        success: true,
        message: `تم حفظ وتحديث صلاحيات منظومة "${SATELLITE_REGISTRY[id].name}" بنجاح في قاعدة البيانات.`,
        config: SATELLITE_REGISTRY[id]
      });
    } catch (error: any) {
      console.error('[SatelliteGatewayController] updateSatellitePermissions error:', error);
      return res.status(500).json({ success: false, error: 'تعذر حفظ صلاحيات المنظومة.' });
    }
  }

  /**
   * فحص فوري لحالة أي رابط خارجي (Live Ping Test)
   * POST /api/v1/satellites/ping
   */
  static async pingHost(req: Request, res: Response) {
    try {
      const { targetUrl } = req.body;
      if (!targetUrl) {
        return res.status(400).json({ success: false, error: 'targetUrl is required' });
      }

      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const response = await fetch(targetUrl, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        const latencyMs = Date.now() - start;

        return res.json({
          success: true,
          isOnline: true,
          status: response.status,
          latencyMs,
          targetUrl
        });
      } catch (err: any) {
        return res.json({
          success: true,
          isOnline: false,
          error: err.message || 'Host unreachable or timed out',
          targetUrl
        });
      }
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'فشل فحص الاتصال بالخادم.' });
    }
  }

  /**
   * تحديث رابط وعنوان سيرفر المنظومة (للآدمن)
   * PUT /api/v1/satellites/:id/config
   */
  static async updateConfig(req: Request, res: Response) {
    try {
      await ensureRegistryLoaded();
      const { id } = req.params;
      const { name, targetUrl, isActive, allowedRoles, allowedDepartments, allowedUserIds, description } = req.body;

      if (!SATELLITE_REGISTRY[id]) {
        return res.status(404).json({ success: false, error: 'المنظومة غير مسجلة في النظام.' });
      }

      if (name) SATELLITE_REGISTRY[id].name = name;
      if (targetUrl) SATELLITE_REGISTRY[id].targetUrl = targetUrl;
      if (typeof isActive === 'boolean') SATELLITE_REGISTRY[id].isActive = isActive;
      if (Array.isArray(allowedRoles)) SATELLITE_REGISTRY[id].allowedRoles = allowedRoles;
      if (Array.isArray(allowedDepartments)) SATELLITE_REGISTRY[id].allowedDepartments = allowedDepartments;
      if (Array.isArray(allowedUserIds)) SATELLITE_REGISTRY[id].allowedUserIds = allowedUserIds;
      if (description) SATELLITE_REGISTRY[id].description = description;

      await persistRegistryToDB();

      return res.json({
        success: true,
        message: 'تم تحديث إعدادات المنظومة بنجاح في قاعدة البيانات.',
        config: SATELLITE_REGISTRY[id]
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'تعذر تحديث إعدادات المنظومة.' });
    }
  }

  /**
   * تسجيل منظومة مساندة جديدة قادمة من زميل عبر الشبكة
   * POST /api/v1/satellites/register
   */
  static async registerSatellite(req: Request, res: Response) {
    try {
      await ensureRegistryLoaded();
      const { id, name, category, defaultPort, targetUrl, isActive, allowedRoles, allowedDepartments, allowedUserIds, description } = req.body;

      if (!id || !name || !targetUrl) {
        return res.status(400).json({ success: false, error: 'المعرف والاسم ورابط الهدف مطلوبة لتسجيل المنظومة.' });
      }

      const cleanId = String(id).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');

      SATELLITE_REGISTRY[cleanId] = {
        id: cleanId,
        name: String(name).trim(),
        category: category || 'CUSTOM_SATELLITE',
        defaultPort: defaultPort ? Number(defaultPort) : 3000,
        targetUrl: String(targetUrl).trim(),
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        allowedRoles: Array.isArray(allowedRoles) && allowedRoles.length > 0 ? allowedRoles : ['super_admin', 'system_director', 'co_admin', 'tech_director', 'dept_head'],
        allowedDepartments: Array.isArray(allowedDepartments) ? allowedDepartments.map(Number) : [],
        allowedUserIds: Array.isArray(allowedUserIds) ? allowedUserIds.map(Number) : [],
        description: description || 'منظومة مساندة مستقلة مطورة من أحد الزملاء.'
      };

      await persistRegistryToDB();

      return res.json({
        success: true,
        message: `تم تسجيل منظومة "${name}" بنجاح في المنصة المركزية وحفظها في قاعدة البيانات.`,
        satellite: SATELLITE_REGISTRY[cleanId]
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'تعذر تسجيل المنظومة الجديدة.' });
    }
  }

  /**
   * حذف منظومة مساندة من السجل
   * DELETE /api/v1/satellites/:id
   */
  static async deleteSatellite(req: Request, res: Response) {
    try {
      await ensureRegistryLoaded();
      const { id } = req.params;
      if (!SATELLITE_REGISTRY[id]) {
        return res.status(404).json({ success: false, error: 'المنظومة غير موجودة.' });
      }

      if (id === 'asset_inventory') {
        return res.status(400).json({ success: false, error: 'لا يمكن حذف منظومة جرد الأصول الأساسية، يمكن فقط تعطيلها.' });
      }

      delete SATELLITE_REGISTRY[id];
      await persistRegistryToDB();

      return res.json({ success: true, message: 'تم إزالة المنظومة بنجاح من السجل وقاعدة البيانات.' });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'تعذر حذف المنظومة.' });
    }
  }

  /**
   * استعلام التلميح الذكي للأصول بناءً على بيانات مقدم التذكرة
   * GET /api/v1/satellites/inventory/smart-hint?requesterEmail=...&department=...
   */
  static async getAssetSmartHint(req: Request, res: Response) {
    try {
      await ensureRegistryLoaded();
      const { requesterEmail, department, building } = req.query;
      const inventoryUrl = SATELLITE_REGISTRY['asset_inventory']?.targetUrl || 'http://localhost:3000';

      // Attempt to query the inventory SQLite/API if available
      try {
        const queryParams = new URLSearchParams();
        if (requesterEmail) queryParams.set('email', String(requesterEmail));
        if (department) queryParams.set('department', String(department));

        const fetchRes = await fetch(`${inventoryUrl}/api/devices?${queryParams.toString()}`, {
          headers: { 'Accept': 'application/json' }
        }).catch(() => null);

        if (fetchRes && fetchRes.ok) {
          const data = await fetchRes.json();
          return res.json({ success: true, source: 'LIVE_INVENTORY', devices: data });
        }
      } catch {
        // Fallback gracefully
      }

      // Fallback: return heuristic match if inventory server is offline
      return res.json({
        success: true,
        source: 'HEURISTIC_CACHE',
        devices: [
          {
            assetTag: 'AST-LITC-PRN-042',
            deviceType: 'طابعة شبكية مركزية',
            model: 'HP LaserJet Enterprise M608',
            location: building ? `${building} - الطابق الثاني` : 'المقر الرئيسي',
            status: 'نشط'
          }
        ]
      });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: 'تعذر جلب تلميحات الأصول.' });
    }
  }
}
