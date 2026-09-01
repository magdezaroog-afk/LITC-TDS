import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';
import { Logger } from '../infrastructure/Logger';

/**
 * OperationalStructureController
 * 
 * يدير الهيكل التشغيلي الكامل (الإدارات التشغيلية، الأقسام، الفرق، المستخدمين)
 * مع التحقق من الهيكل المؤسسي قبل أي إضافة.
 * 
 * القاعدة الذهبية: لا يمكن إضافة إدارة تشغيلية إلا إذا كانت موجودة في الهيكل المؤسسي.
 */

// ─── Helper: Get Org Tree from DB ───────────────────────────────────────────
async function getOrgTreeFromDB(): Promise<any> {
  const setting = await prisma.systemSetting.findUnique({
    where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' }
  });
  if (!setting?.settingValue) return null;
  return JSON.parse(setting.settingValue);
}

// ─── Helper: Extract all nodes of a certain type from org tree ───────────────
function extractNodesFromTree(tree: any, types: string[]): any[] {
  const nodes: any[] = [];
  function traverse(node: any) {
    if (types.includes(node.type)) nodes.push(node);
    if (node.children) node.children.forEach(traverse);
  }
  traverse(tree);
  return nodes;
}

// ─── Helper: Check if a department name exists in institutional tree ──────────
function deptExistsInInstitutionalTree(tree: any, deptName: string): boolean {
  const allDepts = extractNodesFromTree(tree, ['DEPARTMENT', 'DIVISION', 'SECTION']);
  return allDepts.some(d => d.name.trim() === deptName.trim());
}

export class OrganizationController {

// -----------------------------------------------------
  // Buildings (using SystemReference type="BUILDING")
  // -----------------------------------------------------
  static async getBuildings(req: Request, res: Response): Promise<void> {
    try {
      const buildings = await prisma.systemReference.findMany({
        where: { type: { in: ['BUILDING', 'LOCATION'] }, isActive: true },
        select: { id: true, globalId: true, name: true, type: true, parentId: true }
      });
      const dataToReturn = buildings.length ? buildings : [{ globalId: 'b1', name: 'المبنى الرئيسي (المركز)' }];

      res.json(dataToReturn);
    } catch (error) {
      Logger.error(`[OrgStructureController] Error getting buildings: ${error}`);
      res.status(500).json({ error: 'Failed to retrieve buildings' });
    }
  }

  static async saveBuildings(req: Request, res: Response): Promise<void> {
    try {
      const { buildings } = req.body;
      if (!Array.isArray(buildings)) {
        res.status(400).json({ error: 'Buildings must be an array' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        // Soft delete all old buildings and locations
        await tx.systemReference.updateMany({
          where: { type: { in: ['BUILDING', 'LOCATION'] } },
          data: { isActive: false }
        });

        // Insert new buildings and locations
        for (const b of buildings) {
          const type = b.type === 'LOCATION' ? 'LOCATION' : 'BUILDING';
          await tx.systemReference.upsert({
            where: { globalId: b.id || b.globalId },
            create: { globalId: b.id || b.globalId, name: b.name, type: type, isActive: true },
            update: { name: b.name, type: type, isActive: true }
          });
        }
      });

      res.json({ message: 'Buildings saved successfully' });
    } catch (error) {
      Logger.error(`[OrgStructureController] Error saving buildings: ${error}`);
      res.status(500).json({ error: 'Failed to save buildings' });
    }
  }


// -----------------------------------------------------
  // Departments & Full Organizational Structure
  // -----------------------------------------------------
  static async getLegacyDepartments(req: Request, res: Response): Promise<void> {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
      });
      if (setting && setting.settingValue) {
        res.json(JSON.parse(setting.settingValue));
        return;
      }

      const depts = await prisma.department.findMany({
        where: { isDeleted: false },
        include: {
          division: true,
          teams: {
            where: { isDeleted: false },
            include: {
              members: {
                include: {
                  user: {
                    select: { id: true, fullName: true, username: true, email: true, roleId: true }
                  }
                }
              }
            }
          }
        }
      });

      res.json(depts);
    } catch (error) {
      Logger.error(`[OrgStructureController] Error getting departments: ${error}`);
      res.status(500).json({ error: 'Failed to retrieve departments' });
    }
  }

  static async saveLegacyDepartments(req: Request, res: Response): Promise<void> {
    try {
      const { departments, orgTree } = req.body;

      if (!Array.isArray(departments) && !orgTree) {
        res.status(400).json({ error: 'Departments array or orgTree is required' });
        return;
      }

      await prisma.$transaction(async (tx) => {
        // If an explicit orgTree snapshot is provided, save it to SystemSetting for persistent synchronization
        if (orgTree) {
          await tx.systemSetting.upsert({
            where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' },
            create: {
              settingKey: 'LITC_ORG_TREE_SNAPSHOT',
              settingValue: typeof orgTree === 'string' ? orgTree : JSON.stringify(orgTree),
              description: 'Global Organizational Tree Visual Layout'
            },
            update: {
              settingValue: typeof orgTree === 'string' ? orgTree : JSON.stringify(orgTree)
            }
          });
        }

        // Save the exact JSON structure for frontend
        if (departments && Array.isArray(departments)) {
          await tx.systemSetting.upsert({
            where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' },
            create: {
              settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON',
              settingValue: JSON.stringify(departments),
              description: 'Exact Frontend State for Operational Departments'
            },
            update: {
              settingValue: JSON.stringify(departments)
            }
          });
        }

        if (Array.isArray(departments)) {
          for (const d of departments) {
            let deptId = typeof d.id === 'number' ? d.id : undefined;
            
            // Check if department exists
            if (deptId) {
              await tx.department.upsert({
                where: { id: deptId },
                update: {
                  name: d.name,
                  routingStrategy: d.routingStrategy || 'POOL',
                  isDelegated: d.isDelegated ?? false
                },
                create: {
                  name: d.name,
                  routingStrategy: d.routingStrategy || 'POOL',
                  isDelegated: d.isDelegated ?? false
                }
              });
            } else {
              const created = await tx.department.create({
                data: {
                  name: d.name,
                  routingStrategy: d.routingStrategy || 'POOL',
                  isDelegated: d.isDelegated ?? false
                }
              });
              deptId = created.id;
            }

            // Sync Teams if nested in payload
            if (Array.isArray(d.teams) && deptId) {
              for (const team of d.teams) {
                if (team.id && typeof team.id === 'number') {
                  await tx.team.upsert({
                    where: { id: team.id },
                    update: { name: team.name, departmentId: deptId },
                    create: { name: team.name, departmentId: deptId }
                  });
                } else if (team.name) {
                  await tx.team.create({
                    data: { name: team.name, departmentId: deptId }
                  });
                }
              }
            }
          }
        }
      });

      res.json({ success: true, message: 'تم حفظ الهيكل التنظيمي والفرق بنجاح.' });
    } catch (error) {
      Logger.error(`[OrgStructureController] Error saving departments: ${error}`);
      res.status(500).json({ error: 'Failed to save departments' });
    }
  }


  // ==========================================================================
  // الهيكل المؤسسي (Institutional Org Tree)
  // ==========================================================================

  /** GET /api/v1/org/tree - جلب الهيكل المؤسسي كاملاً */
  static async getOrgTree(req: Request, res: Response) {
    try {
      const tree = await getOrgTreeFromDB();
      if (!tree) {
        // Return default empty tree structure
        return res.json({
          id: 'root',
          name: 'مؤسسة LITC',
          type: 'ROOT',
          children: []
        });
      }
      res.json(tree);
    } catch (error) {
      Logger.error(`[OperationalStructureController] getOrgTree error: ${error}`);
      res.status(500).json({ error: 'Failed to retrieve org tree' });
    }
  }

  /** POST /api/v1/org/tree - حفظ الهيكل المؤسسي */
  static async saveOrgTree(req: Request, res: Response) {
    try {
      const { tree } = req.body;
      if (!tree) return res.status(400).json({ error: 'tree is required' });

      await prisma.systemSetting.upsert({
        where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' },
        create: {
          settingKey: 'LITC_ORG_TREE_SNAPSHOT',
          settingValue: JSON.stringify(tree),
          description: 'Global Organizational Tree Visual Layout'
        },
        update: { settingValue: JSON.stringify(tree) }
      });

      Logger.info('[OperationalStructureController] Org tree saved to DB');
      res.json({ success: true, message: 'تم حفظ الهيكل المؤسسي بنجاح' });
    } catch (error) {
      Logger.error(`[OperationalStructureController] saveOrgTree error: ${error}`);
      res.status(500).json({ error: 'Failed to save org tree' });
    }
  }

  // ==========================================================================
  // الإدارات التشغيلية (Operational Departments)
  // ==========================================================================

  /** GET /api/v1/org/departments - جلب الإدارات مع الأقسام والمستخدمين */
  static async getDepartments(req: Request, res: Response) {
    try {
      // First try to get the JSON snapshot (maintained by frontend)
      const snapshot = await prisma.systemSetting.findUnique({
        where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
      });
      if (snapshot?.settingValue) {
        return res.json({ success: true, departments: JSON.parse(snapshot.settingValue) });
      }

      // Fallback: build from DB directly
      const depts = await prisma.department.findMany({
        where: { isDeleted: false },
        include: {
          teams: {
            where: { isDeleted: false },
            include: {
              users: {
                include: {
                  user: {
                    select: {
                      id: true, fullName: true, username: true, email: true,
                      jobTitle: true, roleId: true, role: { select: { name: true } }
                    }
                  }
                }
              }
            }
          }
        }
      });
      res.json({ success: true, departments: depts });
    } catch (error) {
      Logger.error(`[OperationalStructureController] getDepartments error: ${error}`);
      res.status(500).json({ error: 'Failed to retrieve departments' });
    }
  }

  /** POST /api/v1/org/departments - إضافة إدارة تشغيلية جديدة */
  static async createDepartment(req: Request, res: Response) {
    try {
      const { name, routingStrategy = 'POOL' } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

      // ─── القيد الأساسي: التحقق من الهيكل المؤسسي ───────────────────────────
      const orgTree = await getOrgTreeFromDB();
      if (orgTree && !deptExistsInInstitutionalTree(orgTree, name.trim())) {
        return res.status(422).json({
          error: 'DEPT_NOT_IN_INSTITUTIONAL_TREE',
          message: `لا يمكن إضافة إدارة تشغيلية لـ "${name}" لأنها غير موجودة في الهيكل المؤسسي. يجب إضافتها في الهيكل المؤسسي أولاً.`,
          availableFromTree: orgTree ? extractNodesFromTree(orgTree, ['DEPARTMENT', 'DIVISION', 'SECTION']).map(n => n.name) : []
        });
      }

      const dept = await prisma.department.create({
        data: { name: name.trim(), routingStrategy }
      });

      Logger.info(`[OperationalStructureController] Created department: ${dept.name} (id: ${dept.id})`);
      res.status(201).json({ success: true, department: dept });
    } catch (error) {
      Logger.error(`[OperationalStructureController] createDepartment error: ${error}`);
      res.status(500).json({ error: 'Failed to create department' });
    }
  }

  /** PUT /api/v1/org/departments/:id - تعديل إدارة */
  static async updateDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, routingStrategy } = req.body;

      const dept = await prisma.department.update({
        where: { id: parseInt(id) },
        data: {
          ...(name && { name: name.trim() }),
          ...(routingStrategy && { routingStrategy })
        }
      });

      res.json({ success: true, department: dept });
    } catch (error) {
      Logger.error(`[OperationalStructureController] updateDepartment error: ${error}`);
      res.status(500).json({ error: 'Failed to update department' });
    }
  }

  /** DELETE /api/v1/org/departments/:id - حذف ناعم للإدارة */
  static async deleteDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.department.update({
        where: { id: parseInt(id) },
        data: { isDeleted: true }
      });
      res.json({ success: true, message: 'تم حذف الإدارة بنجاح' });
    } catch (error) {
      Logger.error(`[OperationalStructureController] deleteDepartment error: ${error}`);
      res.status(500).json({ error: 'Failed to delete department' });
    }
  }

  /** POST /api/v1/org/departments/snapshot - حفظ الـ JSON snapshot الكامل */
  static async saveDepartmentsSnapshot(req: Request, res: Response) {
    try {
      const { departments } = req.body;
      if (!Array.isArray(departments)) return res.status(400).json({ error: 'departments array required' });

      await prisma.systemSetting.upsert({
        where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' },
        create: {
          settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON',
          settingValue: JSON.stringify(departments),
          description: 'Operational Departments Frontend State'
        },
        update: { settingValue: JSON.stringify(departments) }
      });

      res.json({ success: true, message: 'تم حفظ الهيكل التشغيلي بنجاح' });
    } catch (error) {
      Logger.error(`[OperationalStructureController] saveDepartmentsSnapshot error: ${error}`);
      res.status(500).json({ error: 'Failed to save departments snapshot' });
    }
  }

  // ==========================================================================
  // الأقسام والفرق (Teams/Divisions)
  // ==========================================================================

  /** POST /api/v1/org/teams - إنشاء قسم/فريق */
  static async createTeam(req: Request, res: Response) {
    try {
      const { name, departmentId } = req.body;
      if (!name?.trim() || !departmentId) return res.status(400).json({ error: 'name and departmentId required' });

      // Validate department exists
      const dept = await prisma.department.findFirst({
        where: { id: parseInt(departmentId), isDeleted: false }
      });
      if (!dept) return res.status(404).json({ error: 'Department not found' });

      const team = await prisma.team.create({
        data: { name: name.trim(), departmentId: parseInt(departmentId) }
      });

      res.status(201).json({ success: true, team });
    } catch (error) {
      Logger.error(`[OperationalStructureController] createTeam error: ${error}`);
      res.status(500).json({ error: 'Failed to create team' });
    }
  }

  // ==========================================================================
  // المستخدمون (User Pool & Assignment)
  // ==========================================================================

  /** GET /api/v1/org/users/pool - جلب جميع المستخدمين مع حالة تعيينهم */
  static async getUserPool(req: Request, res: Response) {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true, isDeleted: false },
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          jobTitle: true,
          departmentId: true,
          role: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          teams: {
            include: { team: { select: { id: true, name: true, departmentId: true } } }
          }
        },
        orderBy: { fullName: 'asc' }
      });

      // Classify users
      const pool = users.map(u => ({
        ...u,
        isAssigned: !!u.departmentId,
        teamAssignments: u.teams.map(ut => ut.team)
      }));

      res.json({ success: true, users: pool });
    } catch (error) {
      Logger.error(`[OperationalStructureController] getUserPool error: ${error}`);
      res.status(500).json({ error: 'Failed to retrieve user pool' });
    }
  }

  /** POST /api/v1/org/users/assign - تعيين مستخدم لإدارة/قسم/فريق */
  static async assignUser(req: Request, res: Response) {
    try {
      const { userId, departmentId, teamId, roleId } = req.body;
      if (!userId) return res.status(400).json({ error: 'userId is required' });

      const uid = parseInt(userId);
      const updates: any = {};

      if (departmentId !== undefined) updates.departmentId = departmentId ? parseInt(departmentId) : null;
      if (roleId !== undefined) updates.roleId = parseInt(roleId);

      // Update user's department & role
      const updatedUser = await prisma.user.update({
        where: { id: uid },
        data: updates,
        include: { role: true, department: true }
      });

      // If teamId provided, assign to team
      if (teamId) {
        const tid = parseInt(teamId);
        // Remove from other teams in same department first (if exclusive)
        await prisma.userTeam.upsert({
          where: { userId_teamId: { userId: uid, teamId: tid } },
          create: { userId: uid, teamId: tid },
          update: {}
        });
      }

      Logger.info(`[OperationalStructureController] User ${uid} assigned to dept ${departmentId}, team ${teamId}`);
      
      // Fix BigInt serialization
      const serializedUser = {
        ...updatedUser,
        totalStorageUsedBytes: updatedUser.totalStorageUsedBytes?.toString()
      };

      res.json({ success: true, user: serializedUser });
    } catch (error) {
      Logger.error(`[OperationalStructureController] assignUser error: ${error}`);
      res.status(500).json({ error: 'Failed to assign user' });
    }
  }

  /** DELETE /api/v1/org/users/:userId/unassign - إعادة مستخدم لحوض الانتظار */
  static async unassignUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const uid = parseInt(userId);
      const roleId = req.body.employeeRoleId; // Role to revert to (e.g., Employee=2)

      // Remove all team assignments
      await prisma.userTeam.deleteMany({ where: { userId: uid } });

      // Reset department and role
      await prisma.user.update({
        where: { id: uid },
        data: {
          departmentId: null,
          roleId: roleId || 2 // Default to Employee role
        }
      });

      Logger.info(`[OperationalStructureController] User ${uid} unassigned - returned to pool`);
      res.json({ success: true, message: 'تمت إعادة المستخدم إلى حوض الانتظار' });
    } catch (error) {
      Logger.error(`[OperationalStructureController] unassignUser error: ${error}`);
      res.status(500).json({ error: 'Failed to unassign user' });
    }
  }

  // ==========================================================================
  // واجهات العمل التشغيلية (UI Layout Assignments)
  // ==========================================================================

  /** POST /api/v1/org/layouts/assign - تعيين واجهة لمستخدم */
  static async assignLayoutToUser(req: Request, res: Response) {
    try {
      const { userId, interfaceId, interfaceConfig } = req.body;
      if (!userId || !interfaceId) return res.status(400).json({ error: 'userId and interfaceId required' });

      const key = `USER_INTERFACE_${userId}`;
      await prisma.systemSetting.upsert({
        where: { settingKey: key },
        create: {
          settingKey: key,
          settingValue: JSON.stringify({ interfaceId, config: interfaceConfig }),
          description: `Assigned interface for user ${userId}`
        },
        update: {
          settingValue: JSON.stringify({ interfaceId, config: interfaceConfig })
        }
      });

      Logger.info(`[OperationalStructureController] Interface ${interfaceId} assigned to user ${userId}`);
      res.json({ success: true, message: 'تم تعيين الواجهة للمستخدم بنجاح' });
    } catch (error) {
      Logger.error(`[OperationalStructureController] assignLayoutToUser error: ${error}`);
      res.status(500).json({ error: 'Failed to assign layout' });
    }
  }

  /** GET /api/v1/org/users/:userId/interface - جلب الواجهة المخصصة للمستخدم */
  static async getUserInterface(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const key = `USER_INTERFACE_${userId}`;

      const setting = await prisma.systemSetting.findUnique({ where: { settingKey: key } });
      if (!setting?.settingValue) {
        return res.json({ success: true, interface: null });
      }

      res.json({ success: true, interface: JSON.parse(setting.settingValue) });
    } catch (error) {
      Logger.error(`[OperationalStructureController] getUserInterface error: ${error}`);
      res.status(500).json({ error: 'Failed to get user interface' });
    }
  }

  // ==========================================================================
  // الأدوار المتاحة (Available Roles)
  // ==========================================================================

  /** GET /api/v1/org/roles - جلب جميع الأدوار */
  static async getRoles(req: Request, res: Response) {
    try {
      const roles = await prisma.role.findMany({ orderBy: { id: 'asc' } });
      res.json({ success: true, roles });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }
}
