import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';
import { Logger } from '../infrastructure/Logger';
import { InterfaceService } from '../services/InterfaceService';

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

// ─── Helper: Extract ALL nodes from org tree (any type) ──────────────────────
function extractAllNodesFromTree(tree: any): any[] {
  const nodes: any[] = [];
  function traverse(node: any) {
    if (node.name) nodes.push(node);
    if (node.children) node.children.forEach(traverse);
  }
  traverse(tree);
  return nodes;
}

// ─── Helper: Check if a department name exists ANYWHERE in institutional tree ──
// Searches all nodes regardless of type. Case-insensitive, trim-safe.
function deptExistsInInstitutionalTree(tree: any, deptName: string): boolean {
  const allNodes = extractAllNodesFromTree(tree);
  const normalized = deptName.trim().toLowerCase();
  return allNodes.some(n => 
    n.name && n.name.trim().toLowerCase() === normalized
  );
}

export class OrganizationController {

// -----------------------------------------------------
  // Buildings (using SystemReference type="BUILDING")
  // -----------------------------------------------------
  static async getBuildings(req: Request, res: Response): Promise<void> {
    try {
      const buildings = await prisma.systemReference.findMany({
        where: { type: { in: ['BUILDING', 'LOCATION'] }, isActive: true },
        select: { id: true, globalId: true, name: true, type: true, parentId: true },
        orderBy: { id: 'asc' }
      });
      res.json(buildings);
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

      const savedBuildings = await prisma.$transaction(async (tx) => {
        const activeIds: number[] = [];

        for (let idx = 0; idx < buildings.length; idx++) {
          const b = buildings[idx];
          const type = (b.type === 'LOCATION' || b.type === 'BUILDING') ? b.type : 'BUILDING';
          const name = String(b.name || '').trim();
          if (!name) continue;

          let existingRecord = null;

          // 1. Try to find by integer ID if provided
          const numericId = typeof b.id === 'number' ? b.id : (typeof b.id === 'string' && /^\d+$/.test(b.id) ? parseInt(b.id, 10) : null);
          if (numericId) {
            existingRecord = await tx.systemReference.findUnique({ where: { id: numericId } });
          }

          // 2. Try to find by globalId if not found yet
          if (!existingRecord && b.globalId && typeof b.globalId === 'string') {
            existingRecord = await tx.systemReference.findUnique({ where: { globalId: b.globalId } });
          }

          if (existingRecord) {
            const updated = await tx.systemReference.update({
              where: { id: existingRecord.id },
              data: { name, type, isActive: true }
            });
            activeIds.push(updated.id);
          } else {
            const newGlobalId = (typeof b.globalId === 'string' && b.globalId.trim()) 
              ? b.globalId.trim() 
              : (typeof b.id === 'string' && b.id.startsWith('b_') ? b.id : `b_${Date.now()}_${idx}`);
            
            const created = await tx.systemReference.create({
              data: {
                globalId: newGlobalId,
                name,
                type,
                isActive: true
              }
            });
            activeIds.push(created.id);
          }
        }

        // Soft delete any buildings/locations NOT in active list
        await tx.systemReference.updateMany({
          where: {
            type: { in: ['BUILDING', 'LOCATION'] },
            id: { notIn: activeIds }
          },
          data: { isActive: false }
        });

        const currentActive = await tx.systemReference.findMany({
          where: { type: { in: ['BUILDING', 'LOCATION'] }, isActive: true },
          select: { id: true, globalId: true, name: true, type: true, parentId: true },
          orderBy: { id: 'asc' }
        });

        // Sync with systemSetting for fast cached access
        await tx.systemSetting.upsert({
          where: { settingKey: 'LITC_BUILDINGS_LIST' },
          create: {
            settingKey: 'LITC_BUILDINGS_LIST',
            settingValue: JSON.stringify(currentActive),
            description: 'List of active buildings and locations'
          },
          update: {
            settingValue: JSON.stringify(currentActive)
          }
        });

        return currentActive;
      });

      Logger.info(`[OrgStructureController] Successfully saved ${savedBuildings.length} buildings/locations.`);
      res.json({ success: true, message: 'Buildings saved successfully', buildings: savedBuildings });
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
          teams: {
            where: { isDeleted: false },
            include: {
              users: {
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

      const newlyCreatedDepts: { id: number, name: string }[] = [];

      // ─── ATOMIC TRANSACTION: JSON snapshots + SQL rows must succeed or fail together ───
      await prisma.$transaction(async (tx) => {

        // 1. Save institutional org tree snapshot if provided
        if (orgTree) {
          await tx.systemSetting.upsert({
            where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' },
            create: {
              settingKey:   'LITC_ORG_TREE_SNAPSHOT',
              settingValue: typeof orgTree === 'string' ? orgTree : JSON.stringify(orgTree),
              description:  'Global Organizational Tree Visual Layout'
            },
            update: {
              settingValue: typeof orgTree === 'string' ? orgTree : JSON.stringify(orgTree)
            }
          });
        }

        // 2. Save operational departments JSON snapshot if provided
        if (departments && Array.isArray(departments)) {
          await tx.systemSetting.upsert({
            where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' },
            create: {
              settingKey:   'LITC_OPERATIONAL_DEPARTMENTS_JSON',
              settingValue: JSON.stringify(departments),
              description:  'Exact Frontend State for Operational Departments'
            },
            update: {
              settingValue: JSON.stringify(departments)
            }
          });
        }

        // 3. Sync SQL rows — must complete or the entire transaction rolls back
        if (Array.isArray(departments)) {
          for (const d of departments) {
            let deptId = typeof d.id === 'number' ? d.id : undefined;

            if (deptId) {
              await tx.department.upsert({
                where:  { id: deptId },
                update: { name: d.name, routingStrategy: d.routingStrategy || 'POOL', isDelegated: d.isDelegated ?? false },
                create: { name: d.name, routingStrategy: d.routingStrategy || 'POOL', isDelegated: d.isDelegated ?? false }
              });
            } else {
              const created = await tx.department.create({
                data: { name: d.name, routingStrategy: d.routingStrategy || 'POOL', isDelegated: d.isDelegated ?? false }
              });
              deptId = created.id;
              newlyCreatedDepts.push({ id: deptId, name: d.name });
            }

            if (Array.isArray(d.teams) && deptId) {
              for (const team of d.teams) {
                if (team.id && typeof team.id === 'number') {
                  await tx.team.upsert({
                    where:  { id: team.id },
                    update: { name: team.name, departmentId: deptId },
                    create: { name: team.name, departmentId: deptId }
                  });
                } else if (team.name) {
                  await tx.team.create({ data: { name: team.name, departmentId: deptId } });
                }
              }
            }
          }
        }
      }); // ─── END TRANSACTION ─────────────────────────────────────────────────

      // Auto-generate UI interfaces for newly created departments after transaction finishes
      if (newlyCreatedDepts && newlyCreatedDepts.length > 0) {
        for (const newDept of newlyCreatedDepts) {
          await InterfaceService.generateDefaultInterfacesForDepartment(newDept.id, newDept.name).catch(e => {
            Logger.error(`Failed to generate default interfaces for dept ${newDept.id}: ${e}`);
          });
        }
      }

      Logger.info('[OrganizationController] Org structure saved atomically (JSON + SQL in single transaction)');
      res.json({ success: true, message: 'تم حفظ الهيكل التنظيمي والفرق بنجاح.' });

    } catch (error) {
      Logger.error(`[OrganizationController] saveLegacyDepartments ATOMIC transaction failed: ${error}`);
      res.status(500).json({ error: 'Failed to save departments — transaction rolled back entirely for data integrity.' });
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
        const defaultTree = {
          id: 'root',
          name: 'مؤسسة LITC',
          type: 'إدارة عليا',
          children: []
        };
        return res.json({ success: true, tree: defaultTree, ...defaultTree });
      }
      res.json({ success: true, tree, ...tree });
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

      // -- Validation: Check for orphaned operational departments --
      const allNewNodes = extractAllNodesFromTree(tree).map(n => (n.name || '').trim().toLowerCase());
      
      const activeDepts = await prisma.department.findMany({
        where: { isDeleted: false },
        select: { name: true }
      });

      const orphanedDepts = activeDepts.filter(d => 
        !allNewNodes.includes(d.name.trim().toLowerCase())
      );

      if (orphanedDepts.length > 0) {
        const orphanedNames = orphanedDepts.map(d => d.name).join('، ');
        Logger.warn(`[OrganizationController] saveOrgTree blocked due to orphaned operational depts: ${orphanedNames}`);
        return res.status(400).json({ 
          error: `لا يمكن حفظ الهيكل المؤسسي لأنك قمت بحذف إدارات تشغيلية نشطة حالياً (${orphanedNames}). يرجى أرشفة أو حذف هذه الإدارات من لوحة التحكم التشغيلية أولاً لضمان سلامة البيانات.` 
        });
      }
      // -----------------------------------------------------------

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
      res.json({ success: true, tree, message: 'تم حفظ الهيكل المؤسسي بنجاح' });
    } catch (error) {
      Logger.error(`[OperationalStructureController] saveOrgTree error: ${error}`);
      res.status(500).json({ error: 'Failed to save org tree' });
    }
  }

  // ==========================================================================
  // الإدارات التشغيلية (Operational Departments)
  // ==========================================================================

  /** GET /api/v1/org/departments - جلب الإدارات مع الأقسام والمستخدمين مع دمج SQL و JSON */
  static async getDepartments(req: Request, res: Response) {
    try {
      // 1. Fetch real active departments from SQL DB
      const dbDepts = await prisma.department.findMany({
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
        },
        orderBy: { id: 'asc' }
      });

      // 2. Fetch snapshot if exists
      const snapshot = await prisma.systemSetting.findUnique({
        where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
      });

      let snapshotDepts: any[] = [];
      if (snapshot?.settingValue) {
        try {
          snapshotDepts = JSON.parse(snapshot.settingValue);
          if (!Array.isArray(snapshotDepts)) snapshotDepts = [];
        } catch (e) {
          snapshotDepts = [];
        }
      }

      // 3. Reconcile: Snapshot is the source of truth. We NEVER auto-create departments.
      //    If a snapshot entry doesn't have a matching active SQL row, it means the department
      //    was deleted externally — we skip it and it will be pruned on next user save.
      const mergedDepts: any[] = [];
      const orgTree = await getOrgTreeFromDB();

      if (!snapshot) {
        // No snapshot setting at all in DB — first-time setup only: use active SQL departments that exist in institutional tree
        for (const dbD of dbDepts) {
          if (orgTree && !deptExistsInInstitutionalTree(orgTree, dbD.name)) {
            continue; // Skip departments not in institutional tree
          }
          mergedDepts.push({
            id: dbD.id,
            name: dbD.name,
            routingStrategy: dbD.routingStrategy || 'POOL',
            isDelegated: dbD.isDelegated || false,
            divisions: [],
            teams: (dbD.teams || []).map((t: any) => ({
              id: t.id,
              name: t.name,
              users: (t.users || []).map((tu: any) => ({
                id: String(tu.user.id),
                name: tu.user.fullName || tu.user.username,
                email: tu.user.email,
                employeeId: `EMP-${tu.user.id}`,
                role: tu.user.role?.name || 'OPERATIONAL_USER',
                departmentId: dbD.id,
                teamId: t.id,
                positionTitle: tu.user.jobTitle
              })),
              expanded: false
            })),
            unassignedUsers: [],
            expanded: true
          });
        }
      } else {
        // Snapshot exists — it is the single source of truth.
        // RULE: Only merge snapshot entries that ALREADY have a matching active SQL department.
        // Do NOT auto-create SQL rows here — that caused the ghost department problem.
        for (const sd of snapshotDepts) {
          if (!sd || !sd.name || !sd.name.trim()) continue;
          const trimmedSnapName = sd.name.trim();

          // Look for existing active SQL match only — no upsert, no creation.
          const matchedDb: any = dbDepts.find((dbD: any) =>
            String(dbD.id) === String(sd.id) ||
            (dbD.name && dbD.name.trim().toLowerCase() === trimmedSnapName.toLowerCase())
          );

          // If no SQL match found, this department was deleted — skip it entirely.
          // It will be removed from snapshot on the next user save.
          if (!matchedDb) {
            Logger.warn(`[OrganizationController] getDepartments: Snapshot dept "${trimmedSnapName}" has no active SQL match — skipping (was likely deleted).`);
            continue;
          }

          mergedDepts.push({
            ...sd,
            id: matchedDb.id,     // Always use the real SQL numeric ID
            name: matchedDb.name, // Use the canonical SQL name
            routingStrategy: sd.routingStrategy || matchedDb.routingStrategy || 'POOL',
            isDelegated: sd.isDelegated ?? matchedDb.isDelegated ?? false,
            divisions: sd.divisions || [],
            teams: sd.teams || [],
            unassignedUsers: sd.unassignedUsers || [],
            expanded: sd.expanded ?? true
          });
        }
      }

      // 4. Also check for any users in DB that belong to this department but aren't placed anywhere
      const allAssignedUsers = await prisma.user.findMany({
        where: { departmentId: { not: null }, isDeleted: false },
        select: {
          id: true, fullName: true, username: true, email: true,
          jobTitle: true, departmentId: true, role: { select: { name: true } }
        }
      });

      for (const u of allAssignedUsers) {
        const dept = mergedDepts.find(d => String(d.id) === String(u.departmentId));
        if (dept) {
          const uidStr = String(u.id);
          const inManager = String(dept.managerId) === uidStr;
          const inDiv = (dept.divisions || []).some((dv: any) => 
            String(dv.headId) === uidStr || 
            (dv.unassignedUsers || []).some((du: any) => String(du.id) === uidStr) ||
            (dv.teams || []).some((t: any) => String(t.leaderId) === uidStr || (t.users || []).some((tu: any) => String(tu.id) === uidStr))
          );
          const inDeptTeams = (dept.teams || []).some((t: any) => 
            String(t.leaderId) === uidStr || (t.users || []).some((tu: any) => String(tu.id) === uidStr)
          );
          const inDeptUnassigned = (dept.unassignedUsers || []).some((du: any) => String(du.id) === uidStr);

          if (!inManager && !inDiv && !inDeptTeams && !inDeptUnassigned) {
            if (!dept.unassignedUsers) dept.unassignedUsers = [];
            dept.unassignedUsers.push({
              id: uidStr,
              name: u.fullName || u.username,
              email: u.email,
              employeeId: `EMP-${u.id}`,
              role: u.role?.name || 'OPERATIONAL_USER',
              departmentId: dept.id,
              positionTitle: u.jobTitle
            });
          }
        }
      }

      // NOTE: We do NOT automatically save the reconciled snapshot here.
      // The frontend is responsible for saving the snapshot (via saveDepartmentsSnapshot)
      // when the user makes actual changes. Saving on GET would cause a read→write loop
      // that overwrites user-edited data.

      res.json({ success: true, departments: mergedDepts });
    } catch (error) {
      Logger.error(`[OperationalStructureController] getDepartments error: ${error}`);
      res.status(500).json({ error: 'Failed to retrieve departments' });
    }
  }

  /** POST /api/v1/org/departments - إضافة إدارة تشغيلية جديدة (يتحقق من الشجرة المؤسسية أولاً) */
  static async createDepartment(req: Request, res: Response) {
    try {
      const { name, routingStrategy = 'POOL' } = req.body;
      if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

      const trimmedName = name.trim();

      // ─── INSTITUTIONAL TREE VALIDATION (القاعدة الذهبية) ───────────────────
      // لا يمكن إنشاء إدارة تشغيلية إلا إذا كانت موجودة في الهيكل المؤسسي.
      const orgTree = await getOrgTreeFromDB();
      if (orgTree) {
        const existsInTree = deptExistsInInstitutionalTree(orgTree, trimmedName);
        if (!existsInTree) {
          Logger.warn(`[OrganizationController] createDepartment BLOCKED: "${trimmedName}" not found in institutional tree.`);
          return res.status(403).json({
            error: `لا يمكن إضافة "${trimmedName}" — هذه الإدارة غير مدرجة في الهيكل المؤسسي. يجب إضافتها في تبويب "الهيكل المؤسسي" أولاً.`,
            code: 'NOT_IN_INSTITUTIONAL_TREE'
          });
        }
      }
      // ────────────────────────────────────────────────────────────────────────

      // Upsert: if department was soft-deleted before, reactivate it.
      const dept = await prisma.department.upsert({
        where: { name: trimmedName },
        create: { name: trimmedName, routingStrategy, isDeleted: false },
        update: { isDeleted: false, routingStrategy }
      });

      Logger.info(`[OrganizationController] createDepartment: "${dept.name}" (id: ${dept.id}) — validated against institutional tree.`);
      res.status(201).json({ success: true, department: dept });
    } catch (error) {
      Logger.error(`[OrganizationController] createDepartment error: ${error}`);
      res.status(500).json({ error: 'Failed to create department' });
    }
  }

  /** GET /api/v1/org/institutional-nodes - جلب عقد الشجرة المؤسسية المتاحة للإضافة التشغيلية */
  static async getInstitutionalNodes(req: Request, res: Response) {
    try {
      const orgTree = await getOrgTreeFromDB();
      if (!orgTree) {
        return res.json({ success: true, departments: [], divisions: [], teams: [] });
      }

      const allNodes = extractAllNodesFromTree(orgTree);

      const DEPT_TYPES = ['إدارة', 'مكتب', 'إدارة عليا'];
      const DIV_TYPES  = ['قسم'];
      const TEAM_TYPES = ['فريق', 'وحدة'];

      const departments = allNodes.filter(n => DEPT_TYPES.includes(n.type)).map(n => ({ id: n.id, name: n.name, type: n.type }));
      const divisions   = allNodes.filter(n => DIV_TYPES.includes(n.type)).map(n => ({ id: n.id, name: n.name, type: n.type }));
      const teams       = allNodes.filter(n => TEAM_TYPES.includes(n.type)).map(n => ({ id: n.id, name: n.name, type: n.type }));

      res.json({ success: true, departments, divisions, teams });
    } catch (error) {
      Logger.error(`[OrganizationController] getInstitutionalNodes error: ${error}`);
      res.status(500).json({ error: 'Failed to retrieve institutional nodes' });
    }
  }

  /** PUT /api/v1/org/departments/:id - تعديل إدارة */
  static async updateDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, routingStrategy } = req.body;

      if (name) {
        const trimmedName = name.trim();
        const orgTree = await getOrgTreeFromDB();
        if (orgTree && !deptExistsInInstitutionalTree(orgTree, trimmedName)) {
          return res.status(403).json({
            error: `لا يمكن تغيير اسم الإدارة إلى "${trimmedName}" — هذه الإدارة غير مدرجة في الهيكل المؤسسي.`,
            code: 'NOT_IN_INSTITUTIONAL_TREE'
          });
        }
      }

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

  /** DELETE /api/v1/org/departments/:id - حذف ناعم للإدارة مع تفريغ الفرق والمستخدمين ومزامنة اللقطة */
  static async deleteDepartment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deptId = parseInt(id);
      if (isNaN(deptId)) {
        return res.status(400).json({ error: 'معرّف الإدارة غير صالح' });
      }

      // 1. Soft-delete department in SQL
      await prisma.department.update({
        where: { id: deptId },
        data: { isDeleted: true }
      });

      // 2. Soft-delete teams under this department & clear userTeam memberships
      const teams = await prisma.team.findMany({
        where: { departmentId: deptId },
        select: { id: true }
      });
      const teamIds = teams.map(t => t.id);

      if (teamIds.length > 0) {
        await prisma.userTeam.deleteMany({
          where: { teamId: { in: teamIds } }
        });
        await prisma.team.updateMany({
          where: { departmentId: deptId },
          data: { isDeleted: true }
        });
      }

      // 3. Unassign users belonging to this department back to the operational pool
      await prisma.user.updateMany({
        where: { departmentId: deptId },
        data: { departmentId: null }
      });

      // 4. Also prune from LITC_OPERATIONAL_DEPARTMENTS_JSON snapshot
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
      });
      if (setting && setting.settingValue) {
        try {
          const snapshot = JSON.parse(setting.settingValue);
          if (Array.isArray(snapshot)) {
            const filtered = snapshot.filter((d: any) => String(d.id) !== String(deptId));
            await prisma.systemSetting.update({
              where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' },
              data: { settingValue: JSON.stringify(filtered) }
            });
          }
        } catch (e) {
          Logger.warn(`[OrganizationController] Failed to prune dept ${deptId} from snapshot: ${e}`);
        }
      }

      res.json({ success: true, message: 'تم حذف الإدارة وتفريغ الموظفين التابعين لها بنجاح' });
    } catch (error) {
      Logger.error(`[OperationalStructureController] deleteDepartment error: ${error}`);
      res.status(500).json({ error: 'Failed to delete department' });
    }
  }

  // ==========================================================================
  // معالج التفكيك الذكي (Smart Deletion Wizard APIs)
  // ==========================================================================

  /** GET /api/v1/org/departments/dependency-check?name=XYZ */
  static async checkDepartmentDependencies(req: Request, res: Response) {
    try {
      const { name } = req.query;
      if (!name || typeof name !== 'string') return res.status(400).json({ error: 'اسم الإدارة مطلوب' });

      // Find active operational department by name
      const dept = await prisma.department.findFirst({
        where: { name: name.trim(), isDeleted: false },
        select: { id: true, name: true }
      });

      const allActiveDepts = await prisma.department.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true }
      });

      if (!dept) {
        return res.json({ hasOperational: false, allDepts: allActiveDepts });
      }

      const userCount = await prisma.user.count({ where: { departmentId: dept.id } });
      const activeFlows = await prisma.flowStep.findMany({
        where: { assignToType: 'DEPARTMENT', assignToId: dept.id.toString(), flowDefinition: { isActive: true } },
        include: { flowDefinition: { select: { id: true, name: true } } }
      });
      const openTicketsCount = await prisma.ticket.count({
        where: { departmentId: dept.id, isDeleted: false, state: { name: { notIn: ['CLOSED', 'RESOLVED', 'مغلقة'] } } }
      });

      res.json({
        hasOperational: true,
        deptId: dept.id,
        userCount,
        activeFlowsCount: activeFlows.length,
        activeFlows: activeFlows.map(f => f.flowDefinition),
        openTicketsCount,
        allDepts: allActiveDepts.filter(d => d.id !== dept.id)
      });
    } catch (err) {
      Logger.error(`[OrganizationController] checkDepartmentDependencies error: ${err}`);
      res.status(500).json({ error: 'فشل فحص تبعيات الإدارة' });
    }
  }

  /** POST /api/v1/org/departments/smart-delete */
  static async smartDeleteDepartment(req: Request, res: Response) {
    try {
      const { deptId, treeWithoutNode, userAction, targetDeptIdForUsers, flowAction, targetDeptIdForFlows } = req.body;
      if (!deptId || !treeWithoutNode) return res.status(400).json({ error: 'بيانات غير مكتملة' });

      const dId = parseInt(deptId);

      // Verify no open tickets before proceeding
      const openTicketsCount = await prisma.ticket.count({
        where: { departmentId: dId, isDeleted: false, state: { name: { notIn: ['CLOSED', 'RESOLVED', 'مغلقة'] } } }
      });
      if (openTicketsCount > 0) {
        return res.status(400).json({ error: `لا يمكن المتابعة، الإدارة لا تزال تمتلك ${openTicketsCount} تذاكر مفتوحة.` });
      }

      await prisma.$transaction(async (tx) => {
        // 1. Handle Users
        if (userAction === 'reassign' && targetDeptIdForUsers) {
          await tx.user.updateMany({ where: { departmentId: dId }, data: { departmentId: parseInt(targetDeptIdForUsers) } });
        } else if (userAction === 'pool') {
          await tx.user.updateMany({ where: { departmentId: dId }, data: { departmentId: null } });
        }

        // 2. Handle Flows
        const affectedSteps = await tx.flowStep.findMany({
          where: { assignToType: 'DEPARTMENT', assignToId: dId.toString() }
        });
        
        if (affectedSteps.length > 0) {
          if (flowAction === 'reroute' && targetDeptIdForFlows) {
            await tx.flowStep.updateMany({
              where: { assignToType: 'DEPARTMENT', assignToId: dId.toString() },
              data: { assignToId: targetDeptIdForFlows.toString() }
            });
          } else if (flowAction === 'deactivate') {
            const flowDefIds = [...new Set(affectedSteps.map(s => s.flowDefinitionId))];
            await tx.flowDefinition.updateMany({
              where: { id: { in: flowDefIds } },
              data: { isActive: false }
            });
          }
        }

        // 3. Archive Operational Dept
        await tx.department.update({ where: { id: dId }, data: { isDeleted: true } });

        // 4. Update Institutional Tree
        await tx.systemSetting.upsert({
          where: { settingKey: 'LITC_ORG_TREE_SNAPSHOT' },
          create: { settingKey: 'LITC_ORG_TREE_SNAPSHOT', settingValue: JSON.stringify(treeWithoutNode), description: 'Global Organizational Tree Visual Layout' },
          update: { settingValue: JSON.stringify(treeWithoutNode) }
        });
      });

      res.json({ success: true, message: 'تم التفكيك الذكي وتحديث الشجرة بنجاح.' });
    } catch (err) {
      Logger.error(`[OrganizationController] smartDeleteDepartment error: ${err}`);
      res.status(500).json({ error: 'فشلت عملية التفكيك الذكي.' });
    }
  }

  /** POST /api/v1/org/departments/snapshot - حفظ الـ JSON snapshot الكامل مع مزامنة SQL */
  static async saveDepartmentsSnapshot(req: Request, res: Response) {
    try {
      const { departments } = req.body;
      if (!Array.isArray(departments)) return res.status(400).json({ error: 'departments array required' });

      const savedDeptIds: number[] = [];
      const savedTeamIds: number[] = [];
      const orgTree = await getOrgTreeFromDB();

      // Clean, validate and sync each department in SQL DB
      for (const d of departments) {
        if (!d || !d.name || typeof d.name !== 'string') continue;
        const trimmedName = d.name.trim();

        // Enforce institutional tree validity: skip any department outside institutional tree
        if (orgTree && !deptExistsInInstitutionalTree(orgTree, trimmedName)) {
          Logger.warn(`[OrganizationController] saveDepartmentsSnapshot: Skipping "${trimmedName}" - not in institutional tree.`);
          continue;
        }

        let dbDept: any = null;
        const existingNumericId = typeof d.id === 'number' ? d.id : (!isNaN(Number(d.id)) ? Number(d.id) : null);

        if (existingNumericId) {
          dbDept = await prisma.department.upsert({
            where: { id: existingNumericId },
            update: { name: trimmedName, routingStrategy: d.routingStrategy || 'POOL', isDeleted: false },
            create: { name: trimmedName, routingStrategy: d.routingStrategy || 'POOL', isDeleted: false }
          });
        } else {
          dbDept = await prisma.department.upsert({
            where: { name: trimmedName },
            update: { routingStrategy: d.routingStrategy || 'POOL', isDeleted: false },
            create: { name: trimmedName, routingStrategy: d.routingStrategy || 'POOL', isDeleted: false }
          });
        }

        d.id = dbDept.id; // Enforce real numeric ID in snapshot
        savedDeptIds.push(dbDept.id);

        // Sync department manager if set
        if (d.managerId) {
          const mgrId = Number(d.managerId);
          if (!isNaN(mgrId)) {
            await prisma.user.updateMany({
              where: { id: mgrId },
              data: { departmentId: dbDept.id, roleId: 23 } // OPERATIONAL_MANAGER
            });
          }
        }

        // Sync teams directly under department
        if (Array.isArray(d.teams)) {
          for (const t of d.teams) {
            if (!t || !t.name) continue;
            const tNumId = typeof t.id === 'number' ? t.id : (!isNaN(Number(t.id)) ? Number(t.id) : null);
            let dbTeam: any;
            if (tNumId) {
              dbTeam = await prisma.team.upsert({
                where: { id: tNumId },
                update: { name: t.name.trim(), departmentId: dbDept.id, isDeleted: false },
                create: { name: t.name.trim(), departmentId: dbDept.id, isDeleted: false }
              });
            } else {
              dbTeam = await prisma.team.create({
                data: { name: t.name.trim(), departmentId: dbDept.id }
              });
            }
            t.id = dbTeam.id;
            savedTeamIds.push(dbTeam.id);

            // Sync leader
            if (t.leaderId) {
              const lId = Number(t.leaderId);
              if (!isNaN(lId)) {
                await prisma.user.updateMany({
                  where: { id: lId },
                  data: { departmentId: dbDept.id, roleId: 25 } // TEAM_LEADER
                });
                await prisma.userTeam.upsert({
                  where: { userId_teamId: { userId: lId, teamId: dbTeam.id } },
                  create: { userId: lId, teamId: dbTeam.id },
                  update: {}
                });
              }
            }

            // Sync team members
            if (Array.isArray(t.users)) {
              for (const u of t.users) {
                const uid = Number(u.id);
                if (!isNaN(uid)) {
                  await prisma.user.updateMany({
                    where: { id: uid, roleId: { notIn: [1, 22, 23, 24, 25] } },
                    data: { departmentId: dbDept.id, roleId: 26 } // OPERATIONAL_USER
                  });
                  await prisma.user.updateMany({
                    where: { id: uid },
                    data: { departmentId: dbDept.id }
                  });
                  await prisma.userTeam.upsert({
                    where: { userId_teamId: { userId: uid, teamId: dbTeam.id } },
                    create: { userId: uid, teamId: dbTeam.id },
                    update: {}
                  });
                }
              }
            }
          }
        }

        // Sync divisions and their teams
        if (Array.isArray(d.divisions)) {
          for (const div of d.divisions) {
            if (!div) continue;
            // Sync division head
            if (div.headId) {
              const hId = Number(div.headId);
              if (!isNaN(hId)) {
                await prisma.user.updateMany({
                  where: { id: hId },
                  data: { departmentId: dbDept.id, roleId: 24 } // SECTION_HEAD
                });
              }
            }
            // Sync unassigned in division
            if (Array.isArray(div.unassignedUsers)) {
              for (const u of div.unassignedUsers) {
                const uid = Number(u.id);
                if (!isNaN(uid)) {
                  await prisma.user.updateMany({
                    where: { id: uid, roleId: { notIn: [1, 22, 23, 24, 25] } },
                    data: { departmentId: dbDept.id, roleId: 26 }
                  });
                  await prisma.user.updateMany({
                    where: { id: uid },
                    data: { departmentId: dbDept.id }
                  });
                }
              }
            }
            // Sync teams in division
            if (Array.isArray(div.teams)) {
              for (const t of div.teams) {
                if (!t || !t.name) continue;
                const tNumId = typeof t.id === 'number' ? t.id : (!isNaN(Number(t.id)) ? Number(t.id) : null);
                let dbTeam: any;
                if (tNumId) {
                  dbTeam = await prisma.team.upsert({
                    where: { id: tNumId },
                    update: { name: t.name.trim(), departmentId: dbDept.id, isDeleted: false },
                    create: { name: t.name.trim(), departmentId: dbDept.id, isDeleted: false }
                  });
                } else {
                  dbTeam = await prisma.team.create({
                    data: { name: t.name.trim(), departmentId: dbDept.id }
                  });
                }
                t.id = dbTeam.id;
                savedTeamIds.push(dbTeam.id);

                if (t.leaderId) {
                  const lId = Number(t.leaderId);
                  if (!isNaN(lId)) {
                    await prisma.user.updateMany({
                      where: { id: lId },
                      data: { departmentId: dbDept.id, roleId: 25 } // TEAM_LEADER
                    });
                    await prisma.userTeam.upsert({
                      where: { userId_teamId: { userId: lId, teamId: dbTeam.id } },
                      create: { userId: lId, teamId: dbTeam.id },
                      update: {}
                    });
                  }
                }

                if (Array.isArray(t.users)) {
                  for (const u of t.users) {
                    const uid = Number(u.id);
                    if (!isNaN(uid)) {
                      await prisma.user.updateMany({
                        where: { id: uid, roleId: { notIn: [1, 22, 23, 24, 25] } },
                        data: { departmentId: dbDept.id, roleId: 26 }
                      });
                      await prisma.user.updateMany({
                        where: { id: uid },
                        data: { departmentId: dbDept.id }
                      });
                      await prisma.userTeam.upsert({
                        where: { userId_teamId: { userId: uid, teamId: dbTeam.id } },
                        create: { userId: uid, teamId: dbTeam.id },
                        update: {}
                      });
                    }
                  }
                }
              }
            }
          }
        }

        // Sync department unassigned
        if (Array.isArray(d.unassignedUsers)) {
          for (const u of d.unassignedUsers) {
            const uid = Number(u.id);
            if (!isNaN(uid)) {
              await prisma.user.updateMany({
                where: { id: uid, roleId: { notIn: [1, 22, 23, 24, 25] } },
                data: { departmentId: dbDept.id, roleId: 26 }
              });
              await prisma.user.updateMany({
                where: { id: uid },
                data: { departmentId: dbDept.id }
              });
            }
          }
        }
      }

      // Soft-delete any SQL departments that are not in the saved snapshot
      const orphanedDepts = await prisma.department.findMany({
        where: {
          ...(savedDeptIds.length > 0 ? { id: { notIn: savedDeptIds } } : {}),
          isDeleted: false
        },
        select: { id: true }
      });

      for (const orphan of orphanedDepts) {
        await prisma.department.update({
          where: { id: orphan.id },
          data: { isDeleted: true }
        });
        // Unassign users from this orphaned department
        await prisma.user.updateMany({
          where: { departmentId: orphan.id },
          data: { departmentId: null }
        });
        // Soft-delete teams under this orphaned department
        await prisma.team.updateMany({
          where: { departmentId: orphan.id },
          data: { isDeleted: true }
        });
      }

      // Soft-delete any SQL teams that were removed from the saved departments
      if (savedDeptIds.length > 0) {
        const orphanedTeams = await prisma.team.findMany({
          where: {
            departmentId: { in: savedDeptIds },
            id: { notIn: savedTeamIds },
            isDeleted: false
          },
          select: { id: true }
        });

        for (const ot of orphanedTeams) {
          await prisma.team.update({
            where: { id: ot.id },
            data: { isDeleted: true }
          });
          await prisma.userTeam.deleteMany({
            where: { teamId: ot.id }
          });
        }
      }

      await prisma.systemSetting.upsert({
        where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' },
        create: {
          settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON',
          settingValue: JSON.stringify(departments),
          description: 'Operational Departments Frontend State'
        },
        update: { settingValue: JSON.stringify(departments) }
      });

      Logger.info('[OperationalStructureController] Full operational structure snapshot & SQL tables synced atomically');
      res.json({ success: true, departments, message: 'تم حفظ الهيكل التشغيلي ومزامنة المستخدمين بنجاح' });
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
          createdAt: true,
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

      if (departmentId !== undefined) {
        if (departmentId) {
          let deptIdNum = parseInt(departmentId);
          if (isNaN(deptIdNum)) {
            // Try resolving department name from snapshot or directly in DB
            const snapshot = await prisma.systemSetting.findUnique({
              where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
            });
            let resolvedName: string | null = null;
            if (snapshot?.settingValue) {
              try {
                const depts = JSON.parse(snapshot.settingValue);
                const found = depts.find((d: any) => String(d.id) === String(departmentId));
                if (found?.name) resolvedName = found.name.trim();
              } catch (e) {}
            }

            const searchName = resolvedName || String(departmentId).trim();
            const dbDept = await prisma.department.findFirst({
              where: {
                OR: [
                  { name: searchName },
                  { name: { contains: searchName } }
                ]
              }
            });
            if (dbDept) deptIdNum = dbDept.id;
          }
          if (!isNaN(deptIdNum)) {
            updates.department = { connect: { id: deptIdNum } };
          }
        } else {
          updates.department = { disconnect: true };
          await prisma.userTeam.deleteMany({ where: { userId: uid } });
        }
      }

      if (roleId !== undefined && roleId !== null) {
        const rId = parseInt(roleId);
        if (!isNaN(rId)) {
          updates.role = { connect: { id: rId } };
        }
      } else if (departmentId) {
        // Automatically ensure user has OPERATIONAL_USER role
        const opRole = await prisma.role.findUnique({ where: { name: 'OPERATIONAL_USER' } });
        if (opRole) updates.role = { connect: { id: opRole.id } };
      } else {
        // Unassigned from department: reset to Employee role
        const empRole = await prisma.role.findFirst({ where: { name: { in: ['Employee', 'موظف', 'EMPLOYEE'] } } });
        if (empRole) updates.role = { connect: { id: empRole.id } };
      }

      // Update user's department & role
      const updatedUser = await prisma.user.update({
        where: { id: uid },
        data: updates,
        include: { role: true, department: true }
      });

      // If teamId provided, assign to team
      if (teamId) {
        const tid = parseInt(teamId);
        if (!isNaN(tid)) {
          await prisma.userTeam.upsert({
            where: { userId_teamId: { userId: uid, teamId: tid } },
            create: { userId: uid, teamId: tid },
            update: {}
          });
        }
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

      // ─── Look up the 'Employee' role dynamically instead of hardcoding id=2 ───
      const employeeRole = await prisma.role.findFirst({
        where: { name: { in: ['Employee', 'موظف', 'EMPLOYEE'] } }
      });

      if (!employeeRole) {
        // Fallback: use explicitly provided roleId in body, or fail safely
        const fallbackRoleId = req.body.fallbackRoleId ? parseInt(req.body.fallbackRoleId) : null;
        if (!fallbackRoleId) {
          Logger.error(`[OrganizationController] Cannot unassign user ${uid}: Employee role not found in DB and no fallbackRoleId provided.`);
          res.status(500).json({ error: 'Employee role not configured in database. Cannot safely unassign user.' });
          return;
        }
        // Use body-provided fallback
        await prisma.userTeam.deleteMany({ where: { userId: uid } });
        await prisma.user.update({
          where: { id: uid },
          data: { department: { disconnect: true }, role: { connect: { id: fallbackRoleId } } }
        });
        Logger.info(`[OrganizationController] User ${uid} unassigned with fallback roleId ${fallbackRoleId}`);
        res.json({ success: true, message: 'تمت إعادة المستخدم إلى حوض الانتظار' });
        return;
      }

      // Remove all team assignments
      await prisma.userTeam.deleteMany({ where: { userId: uid } });

      // Reset department and set to Employee role (looked up dynamically)
      await prisma.user.update({
        where: { id: uid },
        data: {
          department: { disconnect: true },
          role:       { connect: { id: employeeRole.id } }
        }
      });

      Logger.info(`[OrganizationController] User ${uid} unassigned → returned to pool with role '${employeeRole.name}' (id: ${employeeRole.id})`);
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
  /** GET /api/v1/org/users/:userId/interface - جلب الواجهة المخصصة للمستخدم مع الاستكشاف التلقائي للكوادر التشغيلية */
  static async getUserInterface(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { 
          role: true, 
          department: true,
          teams: { include: { team: true } }
        }
      });

      if (!user) return res.status(404).json({ error: 'User not found' });

      const userTeamIds = user.teams?.map(t => t.teamId).filter(Boolean) as number[] || [];
      const teamNames = user.teams?.map(t => t.team?.name).filter(Boolean) as string[] || [];
      const primaryTeam = user.teams?.[0]?.team;

      // 1. User Specific Interface (Highest Priority)
      let ui = await prisma.interface.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' }
      });

      // 2. Team Specific Interface (فحص واجهات الفريق التشغيلي المنتمي إليه المستخدم)
      if (!ui && userTeamIds.length > 0) {
        ui = await prisma.interface.findFirst({
          where: { teamId: { in: userTeamIds } },
          orderBy: { updatedAt: 'desc' }
        });
      }

      // 3. Department + Role Specific Interface
      if (!ui && user.departmentId && user.role) {
        ui = await prisma.interface.findFirst({
          where: { 
            departmentId: user.departmentId,
            OR: [
              { roleType: user.role.name },
              { roleType: 'OPERATIONAL_USER' },
              { interfaceType: 'OPERATIONAL' }
            ]
          },
          orderBy: { updatedAt: 'desc' }
        });
      }

      // 4. استحقاق تلقائي للواجهة التشغيلية لأي عضو في كادر أو فريق تشغيلي (Auto-Provisioning for Operational Cadres)
      const isOperationalCadre = 
        userTeamIds.length > 0 || 
        ['OPERATIONAL_USER', 'OPERATIONAL_MANAGER', 'TEAM_LEADER', 'SECTION_HEAD', 'TECH_DIRECTOR'].includes(user.role?.name || '') ||
        [22, 25, 26, 27, 28].includes(user.roleId);

      // استخراج المسارات المستهدفة لفريق المستخدم من إعدادات النظام
      let matchingRoutes: any[] = [];
      try {
        const ticketRoutesSetting = await prisma.systemSetting.findUnique({
          where: { settingKey: 'litc_ticket_routes' }
        });
        if (ticketRoutesSetting?.settingValue) {
          const allRoutes = JSON.parse(ticketRoutesSetting.settingValue);
          if (Array.isArray(allRoutes)) {
            matchingRoutes = allRoutes.filter((r: any) => 
              (r.targetTeamId && userTeamIds.includes(Number(r.targetTeamId))) ||
              (r.targetDivisionId && r.targetDivisionId === user.departmentId) ||
              (!r.targetTeamId && user.departmentId === 1)
            );
          }
        }
      } catch (e) {
        Logger.warn(`[getUserInterface] Failed to parse litc_ticket_routes: ${e}`);
      }

      if (!ui && isOperationalCadre) {
        // إنشاء واجهة تشغيلية ديناميكية تلقائية ومخصصة لفريق ومسارات المستخدم
        const autoInterface = {
          id: `dyn_ops_auto_${user.id}`,
          name: primaryTeam ? `واجهة فريق ${primaryTeam.name}` : `واجهة العمليات - ${user.department?.name || 'الكوادر التشغيلية'}`,
          interfaceType: 'OPERATIONAL',
          departmentId: user.departmentId,
          teamId: primaryTeam?.id || null,
          roleType: user.role?.name || 'OPERATIONAL_USER',
          createdAt: new Date(),
          updatedAt: new Date(),
          configJson: JSON.stringify([
            { id: 'ops_queue', type: 'QUEUE_VIEW', title: 'حوض التذاكر والمهام الواردة' },
            { id: 'ops_analytics', type: 'ANALYTICS_VIEW', title: 'التحليلات والمؤشرات' }
          ]),
          meta: {
            interfaceType: 'OPERATIONAL',
            isAutoAssigned: true,
            isOperational: true,
            teams: teamNames,
            primaryTeamId: primaryTeam?.id || null,
            primaryTeamName: primaryTeam?.name || null,
            assignedRoutes: matchingRoutes.map(r => ({ id: r.id, name: r.name, icon: r.icon, color: r.color }))
          }
        };

        return res.json({
          success: true,
          interface: {
            config: JSON.parse(autoInterface.configJson),
            meta: autoInterface.meta,
            interfaceType: 'OPERATIONAL',
            assignedRoutes: autoInterface.meta.assignedRoutes
          }
        });
      }

      // 5. Fallback Global Functional Interface (للموظفين العاديين فقط غير التشغيليين)
      if (!ui) {
        ui = await prisma.interface.findFirst({
          where: { interfaceType: 'FUNCTIONAL', departmentId: null, userId: null, teamId: null },
          orderBy: { updatedAt: 'desc' }
        });
      }

      // Legacy fallback just in case
      if (!ui) {
        const key = `USER_INTERFACE_${userId}`;
        const setting = await prisma.systemSetting.findUnique({ where: { settingKey: key } });
        if (setting?.settingValue) {
          return res.json({ success: true, interface: JSON.parse(setting.settingValue) });
        }
      }

      const metaObj = ui ? {
        ...(ui as any),
        interfaceType: isOperationalCadre ? 'OPERATIONAL' : (ui.interfaceType || 'FUNCTIONAL'),
        teams: teamNames,
        primaryTeamName: primaryTeam?.name || null,
        assignedRoutes: matchingRoutes.map(r => ({ id: r.id, name: r.name, icon: r.icon, color: r.color }))
      } : null;

      res.json({ 
        success: true, 
        interface: ui ? { 
          config: JSON.parse(ui.configJson || '[]'), 
          meta: metaObj,
          interfaceType: metaObj?.interfaceType || ui.interfaceType,
          assignedRoutes: matchingRoutes
        } : null 
      });
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
