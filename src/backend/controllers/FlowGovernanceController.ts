/**
 * FlowGovernanceController.ts
 * =============================
 * وحدة التحكم المركزية لحوكمة مسارات استقبال الطلبات (Flow Reception Governance)
 * - إدارة الصلاحيات التشغيلية المعكوسة (Action Permissions Matrix)
 * - محرك الأتمتة والتوجيه الشرطي (Automated Workflow Engine)
 * - معايرة الأولوية المزدوجة (Dual-Priority Calibration)
 * - سجل تدقيق العمليات (Audit Logging)
 */

import { Request, Response } from 'express';
import { prisma } from '../../db/client';

// Helper: Extract candidate team members from organizational structure for a given target entity
export async function getEntityMembers(deptId: number, divisionId?: string | null, teamId?: string | null) {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
    });
    if (!setting?.settingValue) return [];

    const depts = JSON.parse(setting.settingValue);
    const targetDept = depts.find((d: any) => Number(d.id) === Number(deptId));
    if (!targetDept) return [];

    const membersMap = new Map<number, { id: number; name: string; email: string; role: string; title: string; hierarchyRole: string; isSuggested?: boolean }>();

    // 1. Department Manager
    if (targetDept.managerId) {
      const mid = Number(targetDept.managerId);
      const u = await prisma.user.findUnique({ where: { id: mid }, select: { id: true, fullName: true, email: true, jobTitle: true, role: { select: { name: true } } } });
      if (u) {
        membersMap.set(u.id, {
          id: u.id,
          name: u.fullName || u.email || `مستخدم #${u.id}`,
          email: u.email || '',
          role: u.role?.name || 'OPERATIONAL_MANAGER',
          title: u.jobTitle || 'مدير الإدارة',
          hierarchyRole: 'مدير الإدارة',
          isSuggested: !divisionId && !teamId // First suggested if target is department
        });
      }
    }

    // 2. Divisions & Teams
    const divisions = targetDept.divisions || [];

    for (const div of divisions) {
      const isTargetDiv = divisionId ? String(div.id) === String(divisionId) : true;
      if (divisionId && !isTargetDiv) continue; // Skip non-target divisions

      // Division Head
      if (div.headId) {
        const hid = Number(div.headId);
        const u = await prisma.user.findUnique({ where: { id: hid }, select: { id: true, fullName: true, email: true, jobTitle: true, role: { select: { name: true } } } });
        if (u) {
          membersMap.set(u.id, {
            id: u.id,
            name: u.fullName || u.email || `مستخدم #${u.id}`,
            email: u.email || '',
            role: u.role?.name || 'SECTION_HEAD',
            title: u.jobTitle || 'رئيس قسم',
            hierarchyRole: 'رئيس قسم',
            isSuggested: !!divisionId && !teamId // Suggested if target is this division
          });
        }
      }

      // Teams under this division
      for (const t of (div.teams || [])) {
        const isTargetTeam = teamId ? String(t.id) === String(teamId) : true;
        if (teamId && !isTargetTeam) continue;

        // Team Leader
        if (t.leaderId) {
          const lid = Number(t.leaderId);
          const u = await prisma.user.findUnique({ where: { id: lid }, select: { id: true, fullName: true, email: true, jobTitle: true, role: { select: { name: true } } } });
          if (u) {
            membersMap.set(u.id, {
              id: u.id,
              name: u.fullName || u.email || `مستخدم #${u.id}`,
              email: u.email || '',
              role: u.role?.name || 'TEAM_LEADER',
              title: u.jobTitle || 'رئيس فريق',
              hierarchyRole: 'رئيس فريق',
              isSuggested: !!teamId // Suggested if target is this team
            });
          }
        }

        // Team members
        for (const u of (t.users || [])) {
          const uid = Number(u.id);
          if (!membersMap.has(uid)) {
            membersMap.set(uid, {
              id: uid,
              name: u.name || u.email || `مستخدم #${uid}`,
              email: u.email || '',
              role: u.role || 'OPERATIONAL_USER',
              title: u.positionTitle || 'عضو تشغيلي',
              hierarchyRole: 'عضو فريق'
            });
          }
        }
      }

      // Division unassigned users
      for (const u of (div.unassignedUsers || [])) {
        const uid = Number(u.id);
        if (!membersMap.has(uid) && !teamId) {
          membersMap.set(uid, {
            id: uid,
            name: u.name || u.email || `مستخدم #${uid}`,
            email: u.email || '',
            role: u.role || 'OPERATIONAL_USER',
            title: u.positionTitle || 'موظف بالقسم',
            hierarchyRole: 'عضو بالقسم'
          });
        }
      }
    }

    // Direct Department Teams (if any)
    if (!divisionId) {
      for (const t of (targetDept.teams || [])) {
        if (t.leaderId) {
          const lid = Number(t.leaderId);
          const u = await prisma.user.findUnique({ where: { id: lid }, select: { id: true, fullName: true, email: true, jobTitle: true, role: { select: { name: true } } } });
          if (u) {
            membersMap.set(u.id, {
              id: u.id,
              name: u.fullName || u.email || `مستخدم #${u.id}`,
              email: u.email || '',
              role: u.role?.name || 'TEAM_LEADER',
              title: u.jobTitle || 'رئيس فريق',
              hierarchyRole: 'رئيس فريق'
            });
          }
        }
        for (const u of (t.users || [])) {
          const uid = Number(u.id);
          if (!membersMap.has(uid)) {
            membersMap.set(uid, {
              id: uid,
              name: u.name || u.email || `مستخدم #${uid}`,
              email: u.email || '',
              role: u.role || 'OPERATIONAL_USER',
              title: u.positionTitle || 'عضو تشغيلي',
              hierarchyRole: 'عضو فريق'
            });
          }
        }
      }
    }

    return Array.from(membersMap.values());
  } catch (err) {
    console.error('[FlowGovernance] Error resolving members:', err);
    return [];
  }
}

// Helper: Check if user is allowed to govern this flow
async function verifyFlowGovernanceAccess(flowId: string, user: any): Promise<boolean> {
  if (!user) return false;
  const uid = String(user.id);
  // Admins have universal governance access
  if (user.roleId === 1 || user.roleId === 22 || user.role?.name === 'SYSTEM_ADMIN' || user.role?.name === 'SUPER_ADMIN') {
    return true;
  }

  // Check if flow manager in DB
  const flow = await prisma.flowDefinition.findUnique({
    where: { id: flowId },
    select: { managerId: true }
  });
  if (flow && flow.managerId && String(flow.managerId) === uid) return true;

  // Also check litc_ticket_routes snapshot
  const setting = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
  if (setting?.settingValue) {
    const routes = JSON.parse(setting.settingValue);
    const matched = routes.find((r: any) => r.id === flowId);
    if (matched && matched.managerId && String(matched.managerId) === uid) return true;
  }

  return false;
}

export class FlowGovernanceController {

  /** GET /api/v1/flow-governance/candidate-managers - Fetch candidates for Flow Manager during route creation */
  static async getCandidateManagers(req: Request, res: Response) {
    try {
      const { departmentId, divisionId, teamId } = req.query;
      if (!departmentId) {
        return res.status(400).json({ success: false, message: 'departmentId is required' });
      }

      const members = await getEntityMembers(
        Number(departmentId),
        divisionId ? String(divisionId) : null,
        teamId ? String(teamId) : null
      );

      // Sort: isSuggested first, then by role prominence
      members.sort((a, b) => {
        if (a.isSuggested && !b.isSuggested) return -1;
        if (!a.isSuggested && b.isSuggested) return 1;
        return a.name.localeCompare(b.name, 'ar');
      });

      return res.json({ success: true, candidates: members });
    } catch (err: any) {
      console.error('[FlowGovernance] getCandidateManagers error:', err);
      return res.status(500).json({ success: false, message: 'فشل جلب المرشحين لقيادة المسار' });
    }
  }

  /** GET /api/v1/flow-governance/my-flows - List flows managed by the current user */
  static async getMyFlows(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const isAdmin = user.roleId === 1 || user.roleId === 22 || user.role?.name === 'SYSTEM_ADMIN' || user.role?.name === 'SUPER_ADMIN';

      // 1. Primary: Load managed flows from relational FlowDefinition table
      const flowDefs = await prisma.flowDefinition.findMany({
        where: isAdmin ? { isActive: true } : { managerId: user.id, isActive: true },
        include: { manager: { select: { id: true, fullName: true } } }
      });

      // 2. Load routes from litc_ticket_routes snapshot for metadata
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });
      const routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      const routeMap = new Map<string, any>(routes.map((r: any) => [r.id, r]));

      const flowList: any[] = [];
      const seenIds = new Set<string>();

      for (const fd of flowDefs) {
        seenIds.add(fd.id);
        const meta = routeMap.get(fd.id) || {};
        flowList.push({
          id: fd.id,
          name: fd.name,
          description: fd.description || meta.description || '',
          icon: fd.icon || meta.icon || 'Monitor',
          color: meta.color || '#007AFF',
          targetDepartmentId: meta.targetDepartmentId || fd.departmentId,
          targetDepartmentName: meta.targetDepartmentName || '',
          targetDivisionId: meta.targetDivisionId || '',
          targetDivisionName: meta.targetDivisionName || '',
          targetTeamId: meta.targetTeamId || '',
          targetTeamName: meta.targetTeamName || '',
          managerId: fd.managerId,
          managerName: fd.manager?.fullName || meta.managerName || '',
          isActive: fd.isActive
        });
      }

      // Also include any route from snapshot where managerId matches if not already in flowDefs
      for (const r of routes) {
        if (!seenIds.has(r.id) && (isAdmin || Number(r.managerId) === user.id)) {
          seenIds.add(r.id);
          flowList.push(r);
        }
      }

      // Fetch active ticket counts and rule counts per flow
      const enrichedFlows = await Promise.all(flowList.map(async (r: any) => {
        const [activeTicketsCount, rulesCount] = await Promise.all([
          prisma.ticket.count({
            where: {
              OR: [{ routeId: r.id }, { flowDefinitionId: r.id }],
              isDeleted: false,
              state: { name: { notIn: ['CLOSED', 'RESOLVED'] } }
            }
          }).catch(() => 0),
          prisma.flowRoutingRule.count({
            where: { flowId: r.id, isActive: true }
          }).catch(() => 0)
        ]);

        return {
          id: r.id,
          name: r.name,
          description: r.description,
          icon: r.icon || 'Monitor',
          color: r.color || '#007AFF',
          targetDepartmentId: r.targetDepartmentId,
          targetDepartmentName: r.targetDepartmentName,
          targetDivisionId: r.targetDivisionId,
          targetDivisionName: r.targetDivisionName,
          targetTeamId: r.targetTeamId,
          targetTeamName: r.targetTeamName,
          managerId: r.managerId,
          managerName: r.managerName,
          isActive: r.isActive !== false,
          activeTicketsCount,
          rulesCount
        };
      }));

      return res.json({ success: true, flows: enrichedFlows });
    } catch (err: any) {
      console.error('[FlowGovernance] getMyFlows error:', err);
      return res.status(500).json({ success: false, message: 'فشل تحميل المسارات المُدارة' });
    }
  }

  /** GET /api/v1/flow-governance/:flowId/details - Comprehensive details for Flow Governance Bento view */
  static async getFlowDetails(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId } = req.params;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'غير مخول بإدارة خصائص هذا المسار' });
      }

      // Load route configuration
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_ticket_routes' }
      });
      const routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      const route = routes.find((r: any) => r.id === flowId);

      if (!route) {
        return res.status(404).json({ success: false, message: 'المسار غير موجود' });
      }

      // Ensure FlowDefinition row exists in DB
      const flowDef = await prisma.flowDefinition.upsert({
        where: { id: flowId },
        update: {
          name: route.name,
          description: route.description,
          icon: route.icon,
          departmentId: isNaN(Number(route.targetDepartmentId)) ? undefined : Number(route.targetDepartmentId),
          managerId: route.managerId ? Number(route.managerId) : undefined,
          isActive: route.isActive !== false
        },
        create: {
          id: flowId,
          name: route.name,
          description: route.description,
          icon: route.icon,
          departmentId: isNaN(Number(route.targetDepartmentId)) ? undefined : Number(route.targetDepartmentId),
          managerId: route.managerId ? Number(route.managerId) : undefined,
          isActive: route.isActive !== false
        }
      });

      // 1. Get eligible team members
      const members = await getEntityMembers(
        Number(route.targetDepartmentId),
        route.targetDivisionId || null,
        route.targetTeamId || null
      );

      // 2. Get existing user permissions
      const permissions = await prisma.flowUserPermission.findMany({
        where: { flowId },
        include: { user: { select: { id: true, fullName: true, email: true } } }
      });

      // 3. Get rules
      const rules = await prisma.flowRoutingRule.findMany({
        where: { flowId },
        orderBy: { ruleOrder: 'asc' }
      });

      // 4. Get audit logs
      const auditLogs = await prisma.flowAuditLog.findMany({
        where: { flowId },
        include: { actor: { select: { id: true, fullName: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30
      });

      // 5. Dynamic fields for this route (to populate dropdowns in Rule Builder)
      const dynamicFieldsSetting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'litc_dynamic_fields' }
      });
      const allFields = dynamicFieldsSetting?.settingValue ? JSON.parse(dynamicFieldsSetting.settingValue) : [];
      const attachedFieldIds = (route.formConfig?.routeDynamicFields || []).map((rf: any) => rf.fieldId);
      const routeFields = allFields.filter((f: any) => attachedFieldIds.includes(f.id));

      // Building reference if location field is active
      let buildings: any[] = [];
      if (route.formConfig?.showBuildingField) {
        buildings = await prisma.systemReference.findMany({
          where: { type: { in: ['BUILDING', 'LOCATION'] }, isActive: true },
          select: { id: true, globalId: true, name: true }
        });
      }

      let parsedPriorityConfig: any = {
        allowAutoEscalate: false,
        escalateAfterHours: 4,
        escalateTo: 'HIGH',
        closureApproverIds: []
      };
      if (flowDef.priorityConfigJson) {
        try {
          parsedPriorityConfig = JSON.parse(flowDef.priorityConfigJson);
        } catch {}
      }

      const closureApproverIds: number[] = Array.isArray(parsedPriorityConfig.closureApproverIds)
        ? parsedPriorityConfig.closureApproverIds
        : (Array.isArray(route.closureApproverIds) ? route.closureApproverIds : []);

      const transferConfig = parsedPriorityConfig.transferConfig || {
        directTransferUserIds: [],
        requireAcceptanceUserIds: []
      };

      const subTicketConfig = parsedPriorityConfig.subTicketConfig || {
        enabled: true,
        allowedUserIds: [],
        userScopes: {}
      };

      return res.json({
        success: true,
        flow: {
          ...route,
          closureApproverIds,
          transferConfig,
          subTicketConfig,
          priorityConfig: parsedPriorityConfig
        },
        closureApproverIds,
        transferConfig,
        subTicketConfig,
        members,
        permissions,
        rules: rules.map(r => ({
          ...r,
          conditions: JSON.parse(r.conditionsJson || '[]'),
          targetUserIds: JSON.parse(r.targetUserIds || '[]')
        })),
        auditLogs,
        formFields: routeFields,
        buildings
      });
    } catch (err: any) {
      console.error('[FlowGovernance] getFlowDetails error:', err);
      return res.status(500).json({ success: false, message: 'فشل تحميل تفاصيل المسار' });
    }
  }

  /** POST /api/v1/flow-governance/:flowId/permissions - Update permissions matrix (Inverted action badges) */
  static async updatePermissions(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId } = req.params;
      const { actionType, userIds, applyToAll } = req.body;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'غير مخول بتعديل صلاحيات هذا المسار' });
      }

      // Valid action keys
      const validActions = ['canPull', 'canResolve', 'canTransferInternal', 'canTransferExternal', 'canReopen', 'canAddInternalNotes', 'canCalibratePriority'];
      if (!validActions.includes(actionType)) {
        return res.status(400).json({ success: false, message: `إجراء غير صالح: ${actionType}` });
      }

      // Load members for this route
      const setting = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
      const routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
      const route = routes.find((r: any) => r.id === flowId);
      if (!route) return res.status(404).json({ success: false, message: 'المسار غير موجود' });

      const members = await getEntityMembers(Number(route.targetDepartmentId), route.targetDivisionId, route.targetTeamId);
      const allMemberIds = members.map(m => m.id);

      const targetIds = applyToAll ? allMemberIds : (Array.isArray(userIds) ? userIds.map(Number) : []);

      await prisma.$transaction(async (tx) => {
        // Upsert permission rows for all members
        for (const mid of allMemberIds) {
          const isAllowed = applyToAll ? true : targetIds.includes(mid);
          await tx.flowUserPermission.upsert({
            where: { userId_flowId: { userId: mid, flowId } },
            update: {
              [actionType]: isAllowed,
              grantedById: user.id
            },
            create: {
              userId: mid,
              flowId,
              [actionType]: isAllowed,
              grantedById: user.id
            }
          });
        }

        // Add audit log
        await tx.flowAuditLog.create({
          data: {
            flowId,
            actorId: user.id,
            actionType: 'PERMISSION_UPDATE',
            details: JSON.stringify({
              actionType,
              applyToAll: !!applyToAll,
              authorizedCount: targetIds.length,
              timestamp: new Date().toISOString()
            })
          }
        });
      });

      return res.json({ success: true, message: 'تم تحديث الصلاحيات بنجاح' });
    } catch (err: any) {
      console.error('[FlowGovernance] updatePermissions error:', err);
      return res.status(500).json({ success: false, message: 'فشل تحديث الصلاحيات' });
    }
  }

  /** POST /api/v1/flow-governance/:flowId/rules - Add or Update a Workflow Routing Rule */
  static async saveRule(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId } = req.params;
      const { id, name, conditions, actionType, targetUserIds, isActive = true } = req.body;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) {
        return res.status(403).json({ success: false, message: 'غير مخول بإدارة قواعد هذا المسار' });
      }

      if (!name?.trim()) return res.status(400).json({ success: false, message: 'اسم القاعدة مطلوب' });
      if (!Array.isArray(conditions) || conditions.length === 0) {
        return res.status(400).json({ success: false, message: 'يجب تحديد شرط واحد على الأقل' });
      }
      if (!['VISIBILITY_FILTER', 'DIRECT_ASSIGN', 'ROUND_ROBIN'].includes(actionType)) {
        return res.status(400).json({ success: false, message: 'نوع الإجراء غير صالح' });
      }
      if (!Array.isArray(targetUserIds) || targetUserIds.length === 0) {
        return res.status(400).json({ success: false, message: 'يجب اختيار الموظفين المعنيين بالإجراء' });
      }

      // Check max limit (10 rules)
      if (!id) {
        const existingCount = await prisma.flowRoutingRule.count({ where: { flowId } });
        if (existingCount >= 10) {
          return res.status(400).json({
            success: false,
            message: 'وصلت إلى الحد الأقصى المسموح به لقواعد التوجيه (10 قواعد نشطة). يرجى حذف أو تعديل القواعد السابقة للحفاظ على كفاءة النظام.'
          });
        }
      }

      const rule = await prisma.$transaction(async (tx) => {
        let savedRule;
        if (id) {
          savedRule = await tx.flowRoutingRule.update({
            where: { id },
            data: {
              name: name.trim(),
              conditionsJson: JSON.stringify(conditions),
              actionType,
              targetUserIds: JSON.stringify(targetUserIds.map(Number)),
              isActive: !!isActive
            }
          });
        } else {
          const count = await tx.flowRoutingRule.count({ where: { flowId } });
          savedRule = await tx.flowRoutingRule.create({
            data: {
              flowId,
              name: name.trim(),
              ruleOrder: count + 1,
              conditionsJson: JSON.stringify(conditions),
              actionType,
              targetUserIds: JSON.stringify(targetUserIds.map(Number)),
              isActive: true
            }
          });
        }

        await tx.flowAuditLog.create({
          data: {
            flowId,
            actorId: user.id,
            actionType: id ? 'RULE_UPDATE' : 'RULE_CREATE',
            details: JSON.stringify({ ruleId: savedRule.id, name: savedRule.name, actionType })
          }
        });

        return savedRule;
      });

      return res.status(id ? 200 : 201).json({
        success: true,
        message: id ? 'تم تحديث قاعدة التوجيه' : 'تم إنشاء قاعدة التوجيه بنجاح',
        rule: {
          ...rule,
          conditions,
          targetUserIds
        }
      });
    } catch (err: any) {
      console.error('[FlowGovernance] saveRule error:', err);
      return res.status(500).json({ success: false, message: 'فشل حفظ قاعدة التوجيه' });
    }
  }

  /** PATCH /api/v1/flow-governance/:flowId/rules/:ruleId/toggle - Toggle rule ON/OFF */
  static async toggleRule(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId, ruleId } = req.params;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) return res.status(403).json({ success: false, message: 'غير مخول' });

      const rule = await prisma.flowRoutingRule.findUnique({ where: { id: ruleId } });
      if (!rule || rule.flowId !== flowId) return res.status(404).json({ success: false, message: 'القاعدة غير موجودة' });

      const updated = await prisma.$transaction(async (tx) => {
        const r = await tx.flowRoutingRule.update({
          where: { id: ruleId },
          data: { isActive: !rule.isActive }
        });
        await tx.flowAuditLog.create({
          data: {
            flowId,
            actorId: user.id,
            actionType: 'RULE_TOGGLE',
            details: JSON.stringify({ ruleId, name: r.name, isActive: r.isActive })
          }
        });
        return r;
      });

      return res.json({ success: true, isActive: updated.isActive });
    } catch (err: any) {
      console.error('[FlowGovernance] toggleRule error:', err);
      return res.status(500).json({ success: false, message: 'فشل تبديل حالة القاعدة' });
    }
  }

  /** DELETE /api/v1/flow-governance/:flowId/rules/:ruleId - Delete rule */
  static async deleteRule(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId, ruleId } = req.params;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) return res.status(403).json({ success: false, message: 'غير مخول' });

      await prisma.$transaction(async (tx) => {
        const rule = await tx.flowRoutingRule.findUnique({ where: { id: ruleId } });
        await tx.flowRoutingRule.delete({ where: { id: ruleId } });
        await tx.flowAuditLog.create({
          data: {
            flowId,
            actorId: user.id,
            actionType: 'RULE_DELETE',
            details: JSON.stringify({ ruleId, name: rule?.name })
          }
        });
      });

      return res.json({ success: true, message: 'تم حذف قاعدة التوجيه بنجاح' });
    } catch (err: any) {
      console.error('[FlowGovernance] deleteRule error:', err);
      return res.status(500).json({ success: false, message: 'فشل حذف القاعدة' });
    }
  }

  /** POST /api/v1/flow-governance/:flowId/priority-config - Save Dual-Priority Calibration Settings */
  static async savePriorityConfig(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId } = req.params;
      const { allowAutoEscalate, escalateAfterHours, escalateTo } = req.body;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) return res.status(403).json({ success: false, message: 'غير مخول' });

      // Load existing priorityConfigJson to preserve closure approvers
      const flowDef = await prisma.flowDefinition.findUnique({ where: { id: flowId } });
      const currentConfig = flowDef?.priorityConfigJson ? JSON.parse(flowDef.priorityConfigJson) : {};

      const configJson = JSON.stringify({
        ...currentConfig,
        allowAutoEscalate: !!allowAutoEscalate,
        escalateAfterHours: Number(escalateAfterHours) || 4,
        escalateTo: escalateTo || 'HIGH'
      });

      await prisma.$transaction(async (tx) => {
        await tx.flowDefinition.upsert({
          where: { id: flowId },
          update: { priorityConfigJson: configJson },
          create: {
            id: flowId,
            name: flowId,
            priorityConfigJson: configJson
          }
        });
        await tx.flowAuditLog.create({
          data: {
            flowId,
            actorId: user.id,
            actionType: 'PRIORITY_CONFIG',
            details: configJson
          }
        });
      });

      return res.json({ success: true, message: 'تم حفظ إعدادات معايرة الأولوية والترقية بنجاح' });
    } catch (err: any) {
      console.error('[FlowGovernance] savePriorityConfig error:', err);
      return res.status(500).json({ success: false, message: 'فشل حفظ إعدادات الأولوية' });
    }
  }

  /** POST /api/v1/flow-governance/:flowId/closure-approvers - Save Designated Closure Approvers */
  static async saveClosureApprovers(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId } = req.params;
      const { approverIds } = req.body;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) return res.status(403).json({ success: false, message: 'غير مخول بإدارة خصائص هذا المسار' });

      if (!Array.isArray(approverIds)) {
        return res.status(400).json({ success: false, message: 'approverIds must be an array of user IDs' });
      }

      // Load existing priorityConfigJson to preserve escalation settings
      const flowDef = await prisma.flowDefinition.findUnique({ where: { id: flowId } });
      const currentConfig = flowDef?.priorityConfigJson ? JSON.parse(flowDef.priorityConfigJson) : {};
      
      const newConfig = {
        ...currentConfig,
        closureApproverIds: approverIds.map(Number)
      };
      const configJson = JSON.stringify(newConfig);

      await prisma.$transaction(async (tx) => {
        await tx.flowDefinition.upsert({
          where: { id: flowId },
          update: { priorityConfigJson: configJson },
          create: {
            id: flowId,
            name: flowId,
            priorityConfigJson: configJson
          }
        });

        // Also sync into litc_ticket_routes snapshot
        const setting = await tx.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
        if (setting?.settingValue) {
          const routes = JSON.parse(setting.settingValue);
          const idx = routes.findIndex((r: any) => r.id === flowId);
          if (idx !== -1) {
            routes[idx].closureApproverIds = approverIds.map(Number);
            await tx.systemSetting.update({
              where: { settingKey: 'litc_ticket_routes' },
              data: { settingValue: JSON.stringify(routes) }
            });
          }
        }

        await tx.flowAuditLog.create({
          data: {
            flowId,
            actorId: user.id,
            actionType: 'CLOSURE_APPROVERS_UPDATE',
            details: JSON.stringify({ approverIds })
          }
        });
      });

      return res.json({ success: true, message: 'تم حفظ قائمة المخولين باعتماد إغلاق التذاكر بنجاح', approverIds });
    } catch (err: any) {
      console.error('[FlowGovernance] saveClosureApprovers error:', err);
      return res.status(500).json({ success: false, message: 'فشل حفظ قائمة المخولين بالاعتماد' });
    }
  }

  /** POST /api/v1/flow-governance/:flowId/transfer-config - Save Transfer Governance Configuration */
  static async saveTransferConfig(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId } = req.params;
      const { directTransferUserIds, requireAcceptanceUserIds } = req.body;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) return res.status(403).json({ success: false, message: 'غير مخول بإدارة خصائص هذا المسار' });

      const flowDef = await prisma.flowDefinition.findUnique({ where: { id: flowId } });
      const currentConfig = flowDef?.priorityConfigJson ? JSON.parse(flowDef.priorityConfigJson) : {};

      const transferConfig = {
        directTransferUserIds: Array.isArray(directTransferUserIds) ? directTransferUserIds.map(Number) : [],
        requireAcceptanceUserIds: Array.isArray(requireAcceptanceUserIds) ? requireAcceptanceUserIds.map(Number) : []
      };

      const newConfig = {
        ...currentConfig,
        transferConfig
      };
      const configJson = JSON.stringify(newConfig);

      await prisma.$transaction(async (tx) => {
        await tx.flowDefinition.upsert({
          where: { id: flowId },
          update: { priorityConfigJson: configJson },
          create: { id: flowId, name: flowId, priorityConfigJson: configJson }
        });

        const setting = await tx.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
        if (setting?.settingValue) {
          const routes = JSON.parse(setting.settingValue);
          const idx = routes.findIndex((r: any) => r.id === flowId);
          if (idx !== -1) {
            routes[idx].transferConfig = transferConfig;
            await tx.systemSetting.update({
              where: { settingKey: 'litc_ticket_routes' },
              data: { settingValue: JSON.stringify(routes) }
            });
          }
        }

        await tx.flowAuditLog.create({
          data: {
            flowId,
            actorId: user.id,
            actionType: 'TRANSFER_CONFIG_UPDATE',
            details: JSON.stringify(transferConfig)
          }
        });
      });

      return res.json({ success: true, message: 'تم حفظ إعدادات حوكمة تحويل التذاكر بنجاح', transferConfig });
    } catch (err: any) {
      console.error('[FlowGovernance] saveTransferConfig error:', err);
      return res.status(500).json({ success: false, message: 'فشل حفظ إعدادات التحويل' });
    }
  }

  /** POST /api/v1/flow-governance/:flowId/sub-ticket-config - Save Sub-Ticket Governance Configuration */
  static async saveSubTicketConfig(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId } = req.params;
      const { enabled, allowedUserIds, userScopes } = req.body;

      const hasAccess = await verifyFlowGovernanceAccess(flowId, user);
      if (!hasAccess) return res.status(403).json({ success: false, message: 'غير مخول بإدارة خصائص هذا المسار' });

      const flowDef = await prisma.flowDefinition.findUnique({ where: { id: flowId } });
      const currentConfig = flowDef?.priorityConfigJson ? JSON.parse(flowDef.priorityConfigJson) : {};

      const subTicketConfig = {
        enabled: enabled !== false,
        allowedUserIds: Array.isArray(allowedUserIds) ? allowedUserIds.map(Number) : [],
        userScopes: typeof userScopes === 'object' && userScopes !== null ? userScopes : {}
      };

      const newConfig = {
        ...currentConfig,
        subTicketConfig
      };
      const configJson = JSON.stringify(newConfig);

      await prisma.$transaction(async (tx) => {
        await tx.flowDefinition.upsert({
          where: { id: flowId },
          update: { priorityConfigJson: configJson },
          create: { id: flowId, name: flowId, priorityConfigJson: configJson }
        });

        const setting = await tx.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
        if (setting?.settingValue) {
          const routes = JSON.parse(setting.settingValue);
          const idx = routes.findIndex((r: any) => r.id === flowId);
          if (idx !== -1) {
            routes[idx].subTicketConfig = subTicketConfig;
            await tx.systemSetting.update({
              where: { settingKey: 'litc_ticket_routes' },
              data: { settingValue: JSON.stringify(routes) }
            });
          }
        }

        await tx.flowAuditLog.create({
          data: {
            flowId,
            actorId: user.id,
            actionType: 'SUB_TICKET_CONFIG_UPDATE',
            details: JSON.stringify(subTicketConfig)
          }
        });
      });

      return res.json({ success: true, message: 'تم حفظ إعدادات حوكمة التذاكر الداخلية بنجاح', subTicketConfig });
    } catch (err: any) {
      console.error('[FlowGovernance] saveSubTicketConfig error:', err);
      return res.status(500).json({ success: false, message: 'فشل حفظ إعدادات التذاكر الداخلية' });
    }
  }

  /** PATCH /api/v1/flow-governance/tickets/:ticketId/calibrate-priority - Calibrate Official Business Priority */
  static async calibrateTicketPriority(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = Number(req.params.ticketId);
      const { businessPriority, note } = req.body;

      if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'URGENT'].includes(businessPriority)) {
        return res.status(400).json({ success: false, message: 'مستوى الأولوية غير صالح' });
      }

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, flowDefinitionId: true, routeId: true, departmentId: true }
      });
      if (!ticket) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

      const flowId = ticket.flowDefinitionId || ticket.routeId;

      // Check permission: Is Admin, or Flow Manager, or has canCalibratePriority
      const isAdmin = user.roleId === 1 || user.roleId === 22;
      let isAuthorized = isAdmin;

      if (!isAuthorized && flowId) {
        const isManager = await verifyFlowGovernanceAccess(flowId, user);
        if (isManager) isAuthorized = true;
        else {
          const perm = await prisma.flowUserPermission.findUnique({
            where: { userId_flowId: { userId: user.id, flowId } }
          });
          if (perm?.canCalibratePriority) isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'غير مخول بتعديل أولوية الإدارة الرسمية لهذا الطلب' });
      }

      await prisma.$transaction(async (tx) => {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            priority: businessPriority, // Official priority used in queues
            businessPriority,
            calibratedById: user.id,
            calibratedAt: new Date()
          }
        });

        await tx.ticketLog.create({
          data: {
            ticketId,
            action: `CALIBRATE_PRIORITY: تم تعديل أولوية الإدارة إلى [${businessPriority}] بواسطة ${user.fullName || user.username}. ${note || ''}`
          }
        });
      });

      return res.json({ success: true, message: 'تمت معايرة أولوية الإدارة بنجاح', businessPriority });
    } catch (err: any) {
      console.error('[FlowGovernance] calibrateTicketPriority error:', err);
      return res.status(500).json({ success: false, message: 'فشل معايرة أولوية الإدارة' });
    }
  }
}
