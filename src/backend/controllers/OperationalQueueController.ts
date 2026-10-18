/**
 * OperationalQueueController.ts
 * ==============================
 * واجهة استقبال الطلبات للكادر التشغيلي (أعوان، رؤساء أقسام، مدراء إدارات)
 * - قائمة الانتظار (My Queue)
 * - الطلبات حسب نطاق الدور
 * - الإجراءات (قبول، إغلاق، تحويل، تصعيد، تعيين)
 * - التعليقات الداخلية والخارجية
 * - إحصائيات Dashboard
 * - التقارير
 */

import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { getEntityMembers } from './FlowGovernanceController';

// ─── بناء فلتر نطاق الدور ────────────────────────────────────────────────────
// كل دور يرى نطاقاً مختلفاً من التذاكر بشكل تلقائي
function buildScopeFilter(roleName: string, userId: number, departmentId: number | null) {
  const base: any = { isDeleted: false };
  const normalized = (roleName || '').trim().toUpperCase();

  switch (normalized) {
    case 'SUPER_ADMIN':
    case 'SYSTEM_ADMIN':
    case 'SYSTEM_DIRECTOR':
    case 'CO_ADMIN':
      return base;

    case 'DEPT_MANAGER':
    case 'SECTION_HEAD':
    case 'DEPT_HEAD':
    case 'UNIT_HEAD':
    case 'TEAM_LEADER':
    case 'OPERATIONAL_MANAGER':
    case 'TECH_DIRECTOR':
    case 'IT_ADMIN':
      // يرون كل طلبات إدارتهم
      if (departmentId) return { ...base, departmentId };
      return base;

    case 'AGENT':
    case 'OPERATIONAL_USER':
      // يرون الطلبات المسندة إليهم أو الطلبات غير المسندة في إدارتهم
      if (departmentId) {
        return {
          ...base,
          departmentId,
          OR: [
            { assignments: { none: { isCurrentActive: true } } },
            { assignments: { some: { assignedTechId: userId, isCurrentActive: true } } }
          ]
        };
      }
      return {
        ...base,
        assignments: { some: { assignedTechId: userId, isCurrentActive: true } }
      };

    default:
      // المستخدم العادي — لا يرى إلا طلباته هو
      return { ...base, creatorId: userId };
  }
}

// ─── خريطة الأدوار ──────────────────────────────────────────────────────────
const ROLE_LEVEL: Record<string, number> = {
  'SUPER_ADMIN': 100,
  'SYSTEM_ADMIN': 100,
  'SYSTEM_DIRECTOR': 100,
  'CO_ADMIN': 100,
  'IT_ADMIN': 90,
  'DEPT_MANAGER': 80,
  'OPERATIONAL_MANAGER': 80,
  'TECH_DIRECTOR': 80,
  'SECTION_HEAD': 60,
  'DEPT_HEAD': 60,
  'UNIT_HEAD': 40,
  'TEAM_LEADER': 40,
  'AGENT': 20,
  'OPERATIONAL_USER': 20,
  'EMPLOYEE': 0,
  'USER': 0,
  'END_USER': 0
};

function canDo(roleName: string, minLevel: number) {
  const normalized = (roleName || '').trim().toUpperCase();
  return (ROLE_LEVEL[normalized] ?? 0) >= minLevel;
}

export class OperationalQueueController {

  // =========================================================================
  // 1. GET /api/v1/ops/queue — قائمة انتظاري الشخصية
  // =========================================================================
  static async getMyQueue(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { cursor, limit = 20, status, priority } = req.query;

      const take = Math.min(Number(limit), 100);

      // فلتر: الطلبات المسندة للموظف الحالي أو المحولة إليه بانتظار قبوله
      const where: any = {
        isDeleted: false,
        OR: [
          { assignments: { some: { assignedTechId: user.id, isCurrentActive: true } } },
          {
            state: { name: 'PENDING_HANDOVER' },
            routingMetadata: { contains: `"toUserId":${user.id}` }
          },
          {
            state: { name: 'PENDING_HANDOVER' },
            routingMetadata: { contains: `"toUserId": ${user.id}` }
          }
        ]
      };
      if (status) where.state = { name: (status as string).toUpperCase() };
      if (priority) where.priority = (priority as string).toUpperCase();
      if (cursor) where.id = { lt: Number(cursor) };

      const tickets = await prisma.ticket.findMany({
        where,
        include: {
          state: true,
          creator: { select: { id: true, fullName: true, avatarUrl: true, department: { select: { name: true } } } },
          departmentObj: { select: { name: true } },
          flowDefinition: { select: { name: true } },
          slaTrackers: { where: { slaStatus: { not: 'COMPLIANT' } }, take: 1 },
          assignments: {
            where: { isCurrentActive: true },
            include: { assignedTech: { select: { id: true, fullName: true, avatarUrl: true } } }
          },
          _count: { select: { comments: true, files: true } }
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: take + 1,
      });

      const hasMore = tickets.length > take;
      const items = hasMore ? tickets.slice(0, take) : tickets;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      res.json({ success: true, data: items.map(formatTicketItem), nextCursor, hasMore });
    } catch (err) {
      console.error('[OpsQueue] getMyQueue error:', err);
      res.status(500).json({ success: false, message: 'فشل تحميل قائمة الانتظار' });
    }
  }

  // =========================================================================
  // 2. GET /api/v1/ops/tickets — كل الطلبات (حسب نطاق الدور)
  // =========================================================================
  static async getAllTickets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { cursor, limit = 30, status, priority, flowId, search, unassigned } = req.query;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { 
          departmentId: true, 
          role: { select: { name: true } },
          teams: { select: { teamId: true } }
        }
      });

      if (!fullUser) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const isOperationalCadre = (fullUser.teams && fullUser.teams.length > 0);
      const roleName = isOperationalCadre && (!fullUser.role || ['EMPLOYEE', 'Employee', 'USER', 'End_User'].includes(fullUser.role.name))
        ? 'OPERATIONAL_USER'
        : (fullUser.role?.name || 'USER');

      if (!canDo(roleName, 20) && !isOperationalCadre) {
        return res.status(403).json({ success: false, message: 'غير مخول بعرض الطلبات التشغيلية' });
      }

      const take = Math.min(Number(limit), 100);
      let where = buildScopeFilter(roleName, user.id, fullUser.departmentId);

      if (status) where.state = { name: (status as string).toUpperCase() };
      if (priority) where.priority = (priority as string).toUpperCase();
      if (flowId) where.flowDefinitionId = flowId as string;
      if (cursor) where.id = { lt: Number(cursor) };
      if (unassigned === 'true') {
        where.assignments = { none: { isCurrentActive: true } };
      }
      if (search) {
        where.OR = [
          { title: { contains: search as string } },
          { description: { contains: search as string } },
          { id: isNaN(Number(search)) ? undefined : Number(search) }
        ].filter(Boolean);
      }

      const tickets = await prisma.ticket.findMany({
        where,
        include: {
          state: true,
          creator: { select: { id: true, fullName: true, avatarUrl: true, department: { select: { name: true } } } },
          departmentObj: { select: { name: true } },
          flowDefinition: { select: { name: true, icon: true } },
          slaTrackers: { where: { slaStatus: { not: 'COMPLIANT' } }, take: 1 },
          assignments: {
            where: { isCurrentActive: true },
            include: { assignedTech: { select: { id: true, fullName: true, avatarUrl: true } } }
          },
          _count: { select: { comments: true, files: true } }
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: take + 1,
      });

      const hasMore = tickets.length > take;
      const items = hasMore ? tickets.slice(0, take) : tickets;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      res.json({ success: true, data: items.map(formatTicketItem), nextCursor, hasMore });
    } catch (err) {
      console.error('[OpsQueue] getAllTickets error:', err);
      res.status(500).json({ success: false, message: 'فشل تحميل الطلبات' });
    }
  }

  // =========================================================================
  // 3. GET /api/v1/ops/tickets/:id — تفاصيل التذكرة الكاملة
  // =========================================================================
  static async getTicketDetails(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) return res.status(400).json({ success: false, message: 'ID غير صالح' });

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { 
          departmentId: true, 
          role: { select: { name: true } },
          teams: { select: { teamId: true } }
        }
      });
      const isOperationalCadre = (fullUser?.teams && fullUser.teams.length > 0);
      const roleName = isOperationalCadre && (!fullUser?.role || ['EMPLOYEE', 'Employee', 'USER', 'End_User'].includes(fullUser.role.name))
        ? 'OPERATIONAL_USER'
        : (fullUser?.role?.name || 'USER');

      const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, isDeleted: false },
        include: {
          state: true,
          category: true,
          creator: { select: { id: true, fullName: true, email: true, avatarUrl: true, department: { select: { name: true } } } },
          departmentObj: { select: { id: true, name: true } },
          flowDefinition: { select: { id: true, name: true, icon: true, description: true } },
          formData: { orderBy: { fieldKey: 'asc' } },
          flowProgress: {
            include: {
              step: true,
              handledByUser: { select: { id: true, fullName: true, avatarUrl: true } }
            },
            orderBy: { step: { stepOrder: 'asc' } }
          },
          assignments: {
            include: {
              assignedTech: { select: { id: true, fullName: true, avatarUrl: true } },
              assignedTeam: { select: { id: true, name: true } }
            }
          },
          comments: {
            where: canDo(roleName, 20) ? {} : { isInternal: false },
            include: { author: { select: { id: true, fullName: true, avatarUrl: true, role: { select: { name: true } } } } },
            orderBy: { createdAt: 'asc' }
          },
          files: {
            include: { uploadedBy: { select: { id: true, fullName: true } } },
            orderBy: { uploadedAt: 'desc' }
          },
          parentTicket: {
            select: { id: true, title: true, priority: true, state: true }
          },
          subTickets: {
            where: { isDeleted: false },
            include: {
              state: true,
              departmentObj: { select: { id: true, name: true } },
              assignments: {
                where: { isCurrentActive: true },
                include: { assignedTech: { select: { id: true, fullName: true, avatarUrl: true } } }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          slaTrackers: { include: { slaRule: true }, orderBy: { id: 'desc' } },
          logs: { orderBy: { id: 'desc' }, take: 20 },
          rating: true,
        }
      });

      if (!ticket) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

      // التحقق من الصلاحية: هل يحق له رؤية هذه التذكرة؟
      const isSelf = ticket.creatorId === user.id;
      const isSameDept = ticket.departmentId === fullUser?.departmentId;
      const isAgent = canDo(roleName, 20);

      if (!isSelf && !isSameDept && !isAgent) {
        return res.status(403).json({ success: false, message: 'غير مخول بعرض هذا الطلب' });
      }

      // جلب صلاحيات المسار المخصصة والمخولين باعتماد الإغلاق
      let flowId = ticket.flowDefinitionId || ticket.routeId;
      const rawMetadata = (ticket as any).routingMetadata;
      if (!flowId && rawMetadata) {
        try {
          const meta = typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : rawMetadata;
          flowId = meta.routeId || null;
        } catch {}
      }

      let isFlowManager = false;
      let closureApproverIds: number[] = [];
      let transferConfig: any = { directTransferUserIds: [], requireAcceptanceUserIds: [] };
      let subTicketConfig: any = { enabled: true, allowedUserIds: [], userScopes: {} };

      if (flowId) {
        const flowDef = await prisma.flowDefinition.findUnique({
          where: { id: flowId },
          select: { id: true, managerId: true, priorityConfigJson: true }
        });
        if (flowDef) {
          if (flowDef.managerId && String(flowDef.managerId) === String(user.id)) isFlowManager = true;
          if (flowDef.priorityConfigJson) {
            try {
              const parsed = JSON.parse(flowDef.priorityConfigJson);
              if (Array.isArray(parsed.closureApproverIds)) closureApproverIds = parsed.closureApproverIds.map(Number);
              if (parsed.transferConfig) transferConfig = parsed.transferConfig;
              if (parsed.subTicketConfig) subTicketConfig = parsed.subTicketConfig;
            } catch {}
          }
        }

        if (!isFlowManager || closureApproverIds.length === 0) {
          const setting = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
          if (setting?.settingValue) {
            const routes = JSON.parse(setting.settingValue);
            const r = routes.find((x: any) => x.id === flowId);
            if (r) {
              if (r.managerId && String(r.managerId) === String(user.id)) isFlowManager = true;
              if (Array.isArray(r.closureApproverIds) && closureApproverIds.length === 0) {
                closureApproverIds = r.closureApproverIds.map(Number);
              }
              if (r.transferConfig && transferConfig.directTransferUserIds.length === 0) {
                transferConfig = r.transferConfig;
              }
              if (r.subTicketConfig && !subTicketConfig.userScopes) {
                subTicketConfig = r.subTicketConfig;
              }
            }
          }
        }
      }

      const flowPerm = flowId ? await prisma.flowUserPermission.findUnique({
        where: { userId_flowId: { userId: user.id, flowId } }
      }) : null;

      const isAdmin = user.roleId === 1 || user.roleId === 22 || canDo(roleName, 80);
      const isClosureApprover = closureApproverIds.some(id => String(id) === String(user.id)) || isFlowManager || isAdmin;
      const canDirectlyResolve = (flowPerm ? flowPerm.canResolve : canDo(roleName, 20)) || isClosureApprover;

      // تحليل معلومات التحويل المعلق (Handover)
      let handoverInfo: any = null;
      if (ticket.routingMetadata) {
        try {
          const meta = typeof ticket.routingMetadata === 'string' ? JSON.parse(ticket.routingMetadata) : ticket.routingMetadata;
          if (meta.handover) {
            handoverInfo = {
              ...meta.handover,
              isToMe: Number(meta.handover.toUserId) === user.id,
              isFromMe: Number(meta.handover.fromUserId) === user.id
            };
          }
        } catch {}
      }

      const subTicketsList = (ticket as any).subTickets || [];
      const subTicketsTotal = subTicketsList.length;
      const subTicketsCompleted = subTicketsList.filter((s: any) => ['RESOLVED', 'CLOSED'].includes(s.state?.name)).length;

      res.json({
        success: true,
        data: ticket,
        handoverInfo,
        subTicketsSummary: {
          total: subTicketsTotal,
          completed: subTicketsCompleted,
          hasOpenSubTickets: subTicketsTotal > subTicketsCompleted
        },
        permissions: {
          canPull: (flowPerm ? flowPerm.canPull : canDo(roleName, 20)) || isFlowManager || isAdmin,
          canClose: canDirectlyResolve,
          canRequestClosure: !canDirectlyResolve,
          isClosureApprover,
          isFlowManager,
          closureApproverIds,
          canTransfer: (flowPerm ? (flowPerm.canTransferInternal || flowPerm.canTransferExternal) : canDo(roleName, 40)) || isFlowManager || isAdmin,
          canTransferDirect: (Array.isArray(transferConfig.directTransferUserIds) && transferConfig.directTransferUserIds.includes(user.id)) || isFlowManager || isAdmin,
          canTransferWithAcceptance: (Array.isArray(transferConfig.requireAcceptanceUserIds) && transferConfig.requireAcceptanceUserIds.includes(user.id)) || (Array.isArray(transferConfig.directTransferUserIds) && transferConfig.directTransferUserIds.includes(user.id)) || (flowPerm ? flowPerm.canTransferInternal : canDo(roleName, 20)) || isFlowManager || isAdmin,
          canCreateSubTickets: subTicketConfig.enabled !== false && (
            (Array.isArray(subTicketConfig.allowedUserIds) && subTicketConfig.allowedUserIds.length > 0)
              ? subTicketConfig.allowedUserIds.includes(user.id)
              : true
          ),
          subTicketScope: subTicketConfig.userScopes?.[String(user.id)] || (isFlowManager || isAdmin ? 'CROSS_DEPARTMENT' : 'SAME_DEPARTMENT'),
          userDepartmentId: fullUser?.departmentId || null,
          userDepartmentName: (ticket as any).departmentObj?.name || null,
          canReopen: (flowPerm ? flowPerm.canReopen : canDo(roleName, 40)) || isFlowManager || isAdmin,
          canAddInternalComment: (flowPerm ? flowPerm.canAddInternalNotes : canDo(roleName, 20)) || isFlowManager || isAdmin,
          canCalibratePriority: (flowPerm ? flowPerm.canCalibratePriority : canDo(roleName, 40)) || isFlowManager || isAdmin,
          canEscalate: canDo(roleName, 60),
          canAssign: canDo(roleName, 40),
          canViewReports: canDo(roleName, 40),
        }
      });
    } catch (err) {
      console.error('[OpsQueue] getTicketDetails error:', err);
      res.status(500).json({ success: false, message: 'فشل تحميل تفاصيل الطلب' });
    }
  }

  // =========================================================================
  // 4. POST /api/v1/ops/tickets/:id/action — تنفيذ إجراء على التذكرة
  // =========================================================================
  static async executeAction(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = parseInt(req.params.id);
      const { type, note, resolutionNote, targetDeptId, techId, transferTargetType, targetUserId, mode } = req.body;

      if (isNaN(ticketId)) return res.status(400).json({ success: false, message: 'ID غير صالح' });
      if (!type) return res.status(400).json({ success: false, message: 'نوع الإجراء مطلوب' });

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          title: true,
          parentId: true,
          flowDefinitionId: true,
          routeId: true,
          departmentId: true,
          departmentObj: { select: { id: true, name: true } },
          routingMetadata: true,
          resolutionNotes: true,
          state: { select: { name: true } }
        }
      });
      if (!ticket) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { fullName: true, departmentId: true, role: { select: { name: true } } }
      });
      const roleName = fullUser?.role?.name || 'USER';

      // ─── Zero-Trust: التحقق من مصفوفة صلاحيات المسار والمخولين ───
      let flowId = ticket.flowDefinitionId || ticket.routeId;
      const rawMetadata = (ticket as any).routingMetadata;
      if (!flowId && rawMetadata) {
        try {
          const meta = typeof rawMetadata === 'string' ? JSON.parse(rawMetadata) : rawMetadata;
          flowId = meta.routeId || null;
        } catch {}
      }

      let isFlowManager = false;
      let closureApproverIds: number[] = [];
      let transferConfig: any = { directTransferUserIds: [], requireAcceptanceUserIds: [] };
      let flowPerm: any = null;

      if (flowId) {
        const flowDef = await prisma.flowDefinition.findUnique({
          where: { id: flowId },
          select: { id: true, managerId: true, priorityConfigJson: true }
        });
        if (flowDef) {
          if (flowDef.managerId && String(flowDef.managerId) === String(user.id)) isFlowManager = true;
          if (flowDef.priorityConfigJson) {
            try {
              const parsed = JSON.parse(flowDef.priorityConfigJson);
              if (Array.isArray(parsed.closureApproverIds)) closureApproverIds = parsed.closureApproverIds.map(Number);
              if (parsed.transferConfig) transferConfig = parsed.transferConfig;
            } catch {}
          }
        }

        if (!isFlowManager || closureApproverIds.length === 0) {
          const setting = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
          if (setting?.settingValue) {
            const routes = JSON.parse(setting.settingValue);
            const r = routes.find((x: any) => x.id === flowId);
            if (r) {
              if (r.managerId && String(r.managerId) === String(user.id)) isFlowManager = true;
              if (Array.isArray(r.closureApproverIds) && closureApproverIds.length === 0) {
                closureApproverIds = r.closureApproverIds.map(Number);
              }
              if (r.transferConfig && transferConfig.directTransferUserIds.length === 0) {
                transferConfig = r.transferConfig;
              }
            }
          }
        }

        flowPerm = await prisma.flowUserPermission.findUnique({
          where: { userId_flowId: { userId: user.id, flowId } }
        });
      }

      const isAdmin = user.roleId === 1 || user.roleId === 22 || canDo(roleName, 80);
      const isClosureApprover = closureApproverIds.some(id => String(id) === String(user.id)) || isFlowManager || isAdmin;
      const canDirectlyResolve = (flowPerm ? flowPerm.canResolve : canDo(roleName, 20)) || isClosureApprover;

      if (type === 'ACCEPT' && flowPerm && !flowPerm.canPull && !isFlowManager && !isAdmin) {
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية سحب هذا الطلب (Claim) وفق إعدادات المسار' });
      }

      if (type === 'CLOSE' && !canDirectlyResolve) {
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية إغلاق وإنهاء هذا الطلب مباشرة. يرجى استخدام (طلب اعتماد الإغلاق) لإرساله للمعتمدين.' });
      }

      if ((type === 'APPROVE_CLOSURE' || type === 'REJECT_CLOSURE') && !isClosureApprover) {
        return res.status(403).json({ success: false, message: 'غير مخول باعتماد أو رفض إغلاق التذاكر لهذا المسار' });
      }

      if ((type === 'INTERNAL_TRANSFER' || type === 'REASSIGN') && flowPerm && !flowPerm.canTransferInternal && !flowPerm.canTransferExternal && !isFlowManager && !isAdmin) {
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية تحويل هذا الطلب وفق إعدادات المسار' });
      }

      if (type === 'REOPEN' && flowPerm && !flowPerm.canReopen && !isFlowManager && !isAdmin) {
        return res.status(403).json({ success: false, message: 'ليس لديك صلاحية إعادة فتح هذا الطلب وفق إعدادات المسار' });
      }

      await prisma.$transaction(async (tx) => {
        switch (type) {
          case 'ACCEPT': {
            const inProgressState = await getOrCreateState(tx, 'IN_PROGRESS', 'قيد المعالجة');
            await tx.ticketAssignment.updateMany({
              where: { ticketId, isCurrentActive: true },
              data: { isCurrentActive: false }
            });
            await tx.ticketAssignment.create({
              data: { ticketId, assignedTechId: user.id, isCurrentActive: true }
            });
            await tx.ticket.update({ where: { id: ticketId }, data: { stateId: inProgressState.id } });
            await logAction(tx, ticketId, user.id, 'ACCEPT', note || `تم استلام وقبول الطلب من قبل ${fullUser?.fullName}`);
            break;
          }

          case 'CLOSE': {
            await verifyAllSubTicketsClosed(tx, ticketId);
            if (!resolutionNote?.trim()) throw new Error('ملاحظات الحل وتقرير الإنجاز مطلوبة لإغلاق التذكرة');
            const closedState = await getOrCreateState(tx, 'CLOSED', 'مغلقة');
            await tx.ticket.update({
              where: { id: ticketId },
              data: { 
                stateId: closedState.id, 
                resolutionNotes: resolutionNote.trim()
              }
            });
            await logAction(tx, ticketId, user.id, 'CLOSE', `إغلاق مباشر بواسطة ${fullUser?.fullName}: ${resolutionNote.trim()}`);

            // إذا كانت هذه تذكرة فرعية — إشعار التذكرة الأم بإنجاز المهمة وعودتها لمستلم الطلب الرئيسي
            if (ticket.parentId) {
              await notifyParentOnSubTicketClosure(tx, ticket, user.id, fullUser?.fullName, resolutionNote.trim());
            }
            break;
          }

          case 'REQUEST_CLOSURE': {
            await verifyAllSubTicketsClosed(tx, ticketId);
            if (!resolutionNote?.trim()) throw new Error('تقرير الإنجاز والأعمال المنفذة مطلوب لطلب اعتماد الإغلاق');
            const resolvedState = await getOrCreateState(tx, 'RESOLVED', 'تم الإنجاز (بانتظار الاعتماد)');
            await tx.ticket.update({
              where: { id: ticketId },
              data: { 
                stateId: resolvedState.id, 
                resolutionNotes: resolutionNote.trim()
              }
            });
            await logAction(tx, ticketId, user.id, 'REQUEST_CLOSURE', `طلب اعتماد إغلاق التذكرة بواسطة ${fullUser?.fullName}: ${resolutionNote.trim()}`);
            break;
          }

          case 'APPROVE_CLOSURE': {
            await verifyAllSubTicketsClosed(tx, ticketId);
            const closedState = await getOrCreateState(tx, 'CLOSED', 'مغلقة');
            const approvalNote = note?.trim() ? ` [اعتماد: ${note.trim()}]` : '';
            const existingNotes = ticket.resolutionNotes || '';
            const finalNotes = existingNotes ? `${existingNotes}${approvalNote}` : (note?.trim() || 'تم اعتماد الإغلاق');

            await tx.ticket.update({
              where: { id: ticketId },
              data: { 
                stateId: closedState.id, 
                resolutionNotes: finalNotes
              }
            });
            await logAction(tx, ticketId, user.id, 'APPROVE_CLOSURE', `تم اعتماد الإغلاق النهائي بواسطة ${fullUser?.fullName}. ${note || ''}`);

            // إذا كانت هذه تذكرة فرعية — إشعار التذكرة الأم بإنجاز المهمة وعودتها لمستلم الطلب الرئيسي
            if (ticket.parentId) {
              await notifyParentOnSubTicketClosure(tx, ticket, user.id, fullUser?.fullName, finalNotes);
            }
            break;
          }

          case 'REJECT_CLOSURE': {
            if (!note?.trim()) throw new Error('سبب الرفض والملاحظات الإضافية مطلوبة لإعادة المعالجة');
            const inProgressState = await getOrCreateState(tx, 'IN_PROGRESS', 'قيد المعالجة');
            await tx.ticket.update({
              where: { id: ticketId },
              data: { stateId: inProgressState.id }
            });
            await logAction(tx, ticketId, user.id, 'REJECT_CLOSURE', `تم رفض اعتماد الإغلاق وإعادة التذكرة للمعالجة بواسطة ${fullUser?.fullName}. السبب: ${note.trim()}`);
            break;
          }

          case 'INTERNAL_TRANSFER': {
            // التحويل للزميل أو القسم ضمن المسار (Colleague Handover)
            if (transferTargetType === 'COLLEAGUE' || targetUserId) {
              const targetUserNum = Number(targetUserId);
              if (!targetUserNum) throw new Error('الموظف أو الزميل المستهدف مطلوب للتحويل');
              if (targetUserNum === user.id) throw new Error('لا يمكنك تحويل التذكرة إلى نفسك');

              const targetUser = await tx.user.findUnique({
                where: { id: targetUserNum },
                select: { id: true, fullName: true, departmentId: true }
              });
              if (!targetUser) throw new Error('الموظف المستهدف غير موجود');

              // التحقق من صلاحية التحويل المباشر
              const canDirect = isFlowManager || isAdmin || (Array.isArray(transferConfig.directTransferUserIds) && transferConfig.directTransferUserIds.includes(user.id));
              const effectiveMode = (mode === 'DIRECT' && canDirect) ? 'DIRECT' : 'REQUIRE_ACCEPTANCE';

              if (effectiveMode === 'DIRECT') {
                // 1. التحويل المباشر بدون إذن
                const inProgressState = await getOrCreateState(tx, 'IN_PROGRESS', 'قيد المعالجة');
                await tx.ticketAssignment.updateMany({
                  where: { ticketId, isCurrentActive: true },
                  data: { isCurrentActive: false }
                });
                await tx.ticketAssignment.create({
                  data: { ticketId, assignedTechId: targetUserNum, isCurrentActive: true }
                });

                let meta: any = {};
                if (ticket.routingMetadata) {
                  try { meta = typeof ticket.routingMetadata === 'string' ? JSON.parse(ticket.routingMetadata) : ticket.routingMetadata; } catch {}
                }
                delete meta.handover;

                await tx.ticket.update({
                  where: { id: ticketId },
                  data: { stateId: inProgressState.id, routingMetadata: JSON.stringify(meta) }
                });

                await logAction(tx, ticketId, user.id, 'TRANSFER_DIRECT', `تم التحويل المباشر للزميل ${targetUser.fullName}. ${note || ''}`);
                await tx.ticketComment.create({
                  data: {
                    ticketId,
                    authorId: user.id,
                    bodyText: `🔄 تم تحويل التذكرة مباشرة إلى الزميل ${targetUser.fullName}. ملاحظات: ${note || 'لا توجد'}`,
                    isInternal: true
                  }
                });
              } else {
                // 2. التحويل المعلق بانتظار قبول الطرف الآخر
                const pendingHandoverState = await getOrCreateState(tx, 'PENDING_HANDOVER', 'بانتظار قبول التحويل');
                let meta: any = {};
                if (ticket.routingMetadata) {
                  try { meta = typeof ticket.routingMetadata === 'string' ? JSON.parse(ticket.routingMetadata) : ticket.routingMetadata; } catch {}
                }
                meta.handover = {
                  fromUserId: user.id,
                  fromUserName: fullUser?.fullName || `مستخدم #${user.id}`,
                  toUserId: targetUserNum,
                  toUserName: targetUser.fullName || `مستخدم #${targetUserNum}`,
                  requestedAt: new Date().toISOString(),
                  note: note || 'تحويل تذكرة بانتظار قبول الطرف الآخر'
                };

                await tx.ticket.update({
                  where: { id: ticketId },
                  data: { stateId: pendingHandoverState.id, routingMetadata: JSON.stringify(meta) }
                });

                await logAction(tx, ticketId, user.id, 'TRANSFER_PENDING', `طلب تحويل معلق بانتظار قبول الزميل ${targetUser.fullName}. ${note || ''}`);
                await tx.ticketComment.create({
                  data: {
                    ticketId,
                    authorId: user.id,
                    bodyText: `⏳ تم طلب تحويل التذكرة إلى الزميل ${targetUser.fullName} وهي معلقة بانتظار قبوله. ملاحظات: ${note || 'لا توجد'}`,
                    isInternal: true
                  }
                });
              }
            } else {
              // التحويل الخارجي لإدارة أخرى (Department Transfer)
              if (!targetDeptId) throw new Error('الإدارة المستهدفة مطلوبة');
              const pendingState = await getOrCreateState(tx, 'PENDING_TRANSFER', 'بانتظار التحويل');
              await tx.ticket.update({
                where: { id: ticketId },
                data: { departmentId: Number(targetDeptId), stateId: pendingState.id }
              });
              await tx.ticketAssignment.updateMany({
                where: { ticketId, isCurrentActive: true },
                data: { isCurrentActive: false }
              });
              await logAction(tx, ticketId, user.id, 'TRANSFER_DEPT', `تم التحويل الداخلي للإدارة ID:${targetDeptId}. ${note || ''}`);
            }
            break;
          }

          case 'ACCEPT_HANDOVER': {
            let meta: any = {};
            if (ticket.routingMetadata) {
              try { meta = typeof ticket.routingMetadata === 'string' ? JSON.parse(ticket.routingMetadata) : ticket.routingMetadata; } catch {}
            }
            const handover = meta.handover;
            if (!handover) throw new Error('لا يوجد طلب تحويل معلق لهذه التذكرة');
            if (Number(handover.toUserId) !== user.id && !isAdmin && !isFlowManager) {
              throw new Error('غير مصرح لك بقبول استلام هذا التحويل (مخصص لموظف آخر)');
            }

            const inProgressState = await getOrCreateState(tx, 'IN_PROGRESS', 'قيد المعالجة');
            await tx.ticketAssignment.updateMany({
              where: { ticketId, isCurrentActive: true },
              data: { isCurrentActive: false }
            });
            await tx.ticketAssignment.create({
              data: { ticketId, assignedTechId: user.id, isCurrentActive: true }
            });

            delete meta.handover;
            await tx.ticket.update({
              where: { id: ticketId },
              data: { stateId: inProgressState.id, routingMetadata: JSON.stringify(meta) }
            });

            await logAction(tx, ticketId, user.id, 'ACCEPT_HANDOVER', `تم قبول استلام التذكرة من قبل ${fullUser?.fullName}`);
            await tx.ticketComment.create({
              data: {
                ticketId,
                authorId: user.id,
                bodyText: `✅ تم قبول استلام التذكرة من الزميل ${handover.fromUserName} وبدء المعالجة بواسطة ${fullUser?.fullName}.`,
                isInternal: true
              }
            });
            break;
          }

          case 'REJECT_HANDOVER': {
            let meta: any = {};
            if (ticket.routingMetadata) {
              try { meta = typeof ticket.routingMetadata === 'string' ? JSON.parse(ticket.routingMetadata) : ticket.routingMetadata; } catch {}
            }
            const handover = meta.handover;
            if (!handover) throw new Error('لا يوجد طلب تحويل معلق لهذه التذكرة');
            if (Number(handover.toUserId) !== user.id && !isAdmin && !isFlowManager) {
              throw new Error('غير مصرح لك برفض هذا التحويل');
            }

            const inProgressState = await getOrCreateState(tx, 'IN_PROGRESS', 'قيد المعالجة');
            delete meta.handover;

            await tx.ticket.update({
              where: { id: ticketId },
              data: { stateId: inProgressState.id, routingMetadata: JSON.stringify(meta) }
            });

            await logAction(tx, ticketId, user.id, 'REJECT_HANDOVER', `تم رفض استلام التذكرة وإعادتها بواسطة ${fullUser?.fullName}. السبب: ${note || '-'}`);
            await tx.ticketComment.create({
              data: {
                ticketId,
                authorId: user.id,
                bodyText: `❌ تم رفض استلام التذكرة وإعادتها إلى ${handover.fromUserName} من قبل ${fullUser?.fullName}. السبب: ${note || 'لا توجد ملاحظات مرفقة'}`,
                isInternal: true
              }
            });
            break;
          }

          case 'ESCALATE': {
            if (!note) throw new Error('سبب التصعيد مطلوب');
            const escalatedState = await getOrCreateState(tx, 'ESCALATED', 'مُصعَّد');
            await tx.ticket.update({
              where: { id: ticketId },
              data: { stateId: escalatedState.id, priority: 'HIGH' }
            });
            await logAction(tx, ticketId, user.id, 'ESCALATE', note);
            break;
          }

          case 'REASSIGN': {
            if (!techId) throw new Error('الموظف المستهدف مطلوب');
            await tx.ticketAssignment.updateMany({
              where: { ticketId, isCurrentActive: true },
              data: { isCurrentActive: false }
            });
            await tx.ticketAssignment.create({
              data: { ticketId, assignedTechId: Number(techId), isCurrentActive: true }
            });
            await logAction(tx, ticketId, user.id, 'REASSIGN', `تم إعادة التعيين للموظف ID:${techId}. ${note || ''}`);
            break;
          }

          case 'REQUEST_INFO': {
            if (!note) throw new Error('رسالة طلب المعلومات مطلوبة');
            const waitingState = await getOrCreateState(tx, 'WAITING_INFO', 'بانتظار معلومات');
            await tx.ticket.update({ where: { id: ticketId }, data: { stateId: waitingState.id } });
            await tx.ticketComment.create({
              data: { ticketId, authorId: user.id, bodyText: note, isInternal: false }
            });
            await logAction(tx, ticketId, user.id, 'REQUEST_INFO', note);
            break;
          }

          case 'REOPEN': {
            const openState = await getOrCreateState(tx, 'OPEN', 'مفتوح');
            await tx.ticket.update({
              where: { id: ticketId },
              data: { stateId: openState.id }
            });
            await logAction(tx, ticketId, user.id, 'REOPEN', note || `تمت إعادة فتح الطلب بواسطة ${fullUser?.fullName}`);
            break;
          }
        }
      });

      res.json({ success: true, message: `تم تنفيذ الإجراء: ${type} بنجاح` });
    } catch (err: any) {
      console.error('[OpsQueue] executeAction error:', err);
      res.status(400).json({ success: false, message: err.message || 'فشل تنفيذ الإجراء' });
    }
  }

  // =========================================================================
  // 5. POST /api/v1/ops/tickets/:id/comment — إضافة تعليق
  // =========================================================================
  static async addComment(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = parseInt(req.params.id);
      const { bodyText, isInternal = false } = req.body;

      if (!bodyText?.trim()) return res.status(400).json({ success: false, message: 'نص التعليق مطلوب' });

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, flowDefinitionId: true, routeId: true }
      });
      if (!ticket) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: { select: { name: true } } }
      });
      const roleName = fullUser?.role?.name || 'USER';

      // التحقق من صلاحية الملاحظات الداخلية للمسار
      if (isInternal) {
        const flowId = ticket.flowDefinitionId || ticket.routeId;
        if (flowId) {
          const flowPerm = await prisma.flowUserPermission.findUnique({
            where: { userId_flowId: { userId: user.id, flowId } }
          });
          if (flowPerm && !flowPerm.canAddInternalNotes) {
            return res.status(403).json({ success: false, message: 'ليس لديك صلاحية إضافة ملاحظات داخلية سرية لهذا المسار' });
          }
        }
      }

      // التعليقات الداخلية للكادر التشغيلي فقط
      if (isInternal && !canDo(roleName, 20)) {
        return res.status(403).json({ success: false, message: 'غير مخول بإضافة تعليقات داخلية' });
      }

      const comment = await prisma.ticketComment.create({
        data: { ticketId, authorId: user.id, bodyText: bodyText.trim(), isInternal: Boolean(isInternal) },
        include: { author: { select: { id: true, fullName: true, avatarUrl: true, role: { select: { name: true } } } } }
      });

      // سجل تدقيق
      await prisma.ticketLog.create({
        data: {
          ticketId,
          action: `[${isInternal ? 'INTERNAL_COMMENT' : 'PUBLIC_COMMENT'}] by:${user.id} — ${bodyText.slice(0, 100)}`
        }
      });

      res.json({ success: true, data: comment });
    } catch (err) {
      console.error('[OpsQueue] addComment error:', err);
      res.status(500).json({ success: false, message: 'فشل إضافة التعليق' });
    }
  }

  // =========================================================================
  // 6. GET /api/v1/ops/stats — إحصائيات Dashboard للكادر التشغيلي
  // =========================================================================
  static async getDashboardStats(req: Request, res: Response) {
    try {
      const user = (req as any).user;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { 
          departmentId: true, 
          role: { select: { name: true } },
          teams: { select: { teamId: true } }
        }
      });
      const isOperationalCadre = (fullUser?.teams && fullUser.teams.length > 0);
      const roleName = isOperationalCadre && (!fullUser?.role || ['EMPLOYEE', 'Employee', 'USER', 'End_User'].includes(fullUser.role.name))
        ? 'OPERATIONAL_USER'
        : (fullUser?.role?.name || 'USER');

      if (!canDo(roleName, 20) && !isOperationalCadre) {
        return res.status(403).json({ success: false, message: 'غير مخول' });
      }

      const deptFilter = fullUser?.departmentId
        ? { departmentId: fullUser.departmentId }
        : {};

      const [myQueueCount, openCount, inProgressCount, closedTodayCount, slaBreachedCount, avgResolutionMins] = await Promise.all([
        // طلباتي في الانتظار
        prisma.ticket.count({
          where: { isDeleted: false, assignments: { some: { assignedTechId: user.id, isCurrentActive: true } } }
        }),
        // مفتوحة في نطاق الدور
        prisma.ticket.count({
          where: { isDeleted: false, ...deptFilter, state: { name: 'OPEN' } }
        }),
        // قيد التنفيذ
        prisma.ticket.count({
          where: { isDeleted: false, ...deptFilter, state: { name: 'IN_PROGRESS' } }
        }),
        // مغلقة اليوم
        prisma.ticket.count({
          where: {
            isDeleted: false, ...deptFilter,
            state: { name: { in: ['CLOSED', 'RESOLVED'] } },
            updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        }),
        // خرق SLA
        prisma.ticketStatusSlaTracker.count({
          where: { slaStatus: 'BREACHED', ticket: { isDeleted: false, ...deptFilter } }
        }),
        // متوسط وقت الحل (تقريبي)
        Promise.resolve(0) // يُحسب لاحقاً بعملية aggregation
      ]);

      res.json({
        success: true,
        data: {
          myQueueCount,
          openCount,
          inProgressCount,
          closedTodayCount,
          slaBreachedCount,
          avgResolutionMins
        }
      });
    } catch (err) {
      console.error('[OpsQueue] getDashboardStats error:', err);
      res.status(500).json({ success: false, message: 'فشل تحميل الإحصائيات' });
    }
  }

  // =========================================================================
  // 7. GET /api/v1/ops/reports/summary — تقرير تشغيلي ملخص
  // =========================================================================
  static async getSummaryReport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { from, to, deptId } = req.query;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { departmentId: true, role: { select: { name: true } } }
      });
      const roleName = fullUser?.role?.name || 'USER';

      if (!canDo(roleName, 40)) {
        return res.status(403).json({ success: false, message: 'غير مخول بعرض التقارير' });
      }

      const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to as string) : new Date();

      const targetDeptId = deptId
        ? Number(deptId)
        : fullUser?.departmentId;

      const baseWhere: any = {
        isDeleted: false,
        createdAt: { gte: fromDate, lte: toDate }
      };
      if (targetDeptId) baseWhere.departmentId = targetDeptId;

      const [total, byStatus, byPriority, byFlow, topAgents] = await Promise.all([
        prisma.ticket.count({ where: baseWhere }),

        // توزيع حسب الحالة
        prisma.ticket.groupBy({
          by: ['stateId'],
          _count: { id: true },
          where: baseWhere
        }).then(async (rows) => {
          const states = await prisma.ticketState.findMany();
          const stateMap = Object.fromEntries(states.map(s => [s.id, s.label]));
          return rows.map(r => ({ label: stateMap[r.stateId] || 'غير معروف', count: r._count.id }));
        }),

        // توزيع حسب الأولوية
        prisma.ticket.groupBy({
          by: ['priority'],
          _count: { id: true },
          where: baseWhere
        }).then(rows => rows.map(r => ({ priority: r.priority, count: r._count.id }))),

        // توزيع حسب المسار (Flow)
        prisma.ticket.groupBy({
          by: ['flowDefinitionId'],
          _count: { id: true },
          where: { ...baseWhere, flowDefinitionId: { not: null } }
        }).then(async (rows) => {
          const flows = await prisma.flowDefinition.findMany({ select: { id: true, name: true } });
          const flowMap = Object.fromEntries(flows.map(f => [f.id, f.name]));
          return rows
            .filter(r => r.flowDefinitionId)
            .map(r => ({ flow: flowMap[r.flowDefinitionId!] || r.flowDefinitionId, count: r._count.id }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        }),

        // أداء الكادر — أعلى 10 موظفين معالجةً
        prisma.ticketAssignment.groupBy({
          by: ['assignedTechId'],
          _count: { ticketId: true },
          where: { ticket: { ...baseWhere, state: { name: { in: ['CLOSED', 'RESOLVED'] } } } }
        }).then(async (rows) => {
          if (!rows.length) return [];
          const techIds = rows.filter(r => r.assignedTechId).map(r => r.assignedTechId!);
          const techs = await prisma.user.findMany({
            where: { id: { in: techIds } },
            select: { id: true, fullName: true, avatarUrl: true }
          });
          const techMap = Object.fromEntries(techs.map(t => [t.id, t]));
          return rows
            .filter(r => r.assignedTechId && techMap[r.assignedTechId])
            .map(r => ({ tech: techMap[r.assignedTechId!], closed: r._count.ticketId }))
            .sort((a, b) => b.closed - a.closed)
            .slice(0, 10);
        })
      ]);

      res.json({
        success: true,
        data: { period: { from: fromDate, to: toDate }, total, byStatus, byPriority, byFlow, topAgents }
      });
    } catch (err) {
      console.error('[OpsQueue] getSummaryReport error:', err);
      res.status(500).json({ success: false, message: 'فشل إنشاء التقرير' });
    }
  }

  // =========================================================================
  // 8. GET /api/v1/ops/reports/form-data — تقرير بيانات النماذج
  // =========================================================================
  static async getFormDataReport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { flowId, fieldKey, from, to } = req.query;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { departmentId: true, role: { select: { name: true } } }
      });

      if (!canDo(fullUser?.role?.name || 'USER', 40)) {
        return res.status(403).json({ success: false, message: 'غير مخول' });
      }

      const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to as string) : new Date();

      // جلب كل بيانات نماذج المسار المحدد خلال الفترة
      const formData = await prisma.ticketFormData.findMany({
        where: {
          ticket: {
            isDeleted: false,
            ...(fullUser?.departmentId && { departmentId: fullUser.departmentId }),
            ...(flowId && { flowDefinitionId: flowId as string }),
            createdAt: { gte: fromDate, lte: toDate }
          },
          ...(fieldKey && { fieldKey: fieldKey as string })
        },
        include: {
          ticket: {
            select: {
              id: true, title: true, createdAt: true,
              creator: { select: { fullName: true } },
              state: { select: { label: true } }
            }
          }
        },
        orderBy: { ticket: { createdAt: 'desc' } },
        take: 1000
      });

      // تجميع حسب fieldKey للإحصاء
      const aggregated: Record<string, Record<string, number>> = {};
      for (const fd of formData) {
        if (!aggregated[fd.fieldKey]) aggregated[fd.fieldKey] = {};
        const val = fd.fieldValue || 'غير محدد';
        aggregated[fd.fieldKey][val] = (aggregated[fd.fieldKey][val] || 0) + 1;
      }

      res.json({
        success: true,
        data: { raw: formData, aggregated, period: { from: fromDate, to: toDate } }
      });
    } catch (err) {
      console.error('[OpsQueue] getFormDataReport error:', err);
      res.status(500).json({ success: false, message: 'فشل إنشاء تقرير النماذج' });
    }
  }

  // =========================================================================
  // 9. GET /api/v1/ops/departments — الإدارات والأقسام التشغيلية المتاحة للتحويل والمهام الفرعية
  // =========================================================================
  static async getAvailableDepartments(req: Request, res: Response) {
    try {
      const dbDepts = await prisma.department.findMany({
        where: { isDeleted: false },
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
      });

      // إثراء الإدارات بالأقسام التشغيلية (Divisions) من هيكل المنظومة المعتمد
      let operationalDeptsJson: any[] = [];
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
      });
      if (setting?.settingValue) {
        try {
          operationalDeptsJson = JSON.parse(setting.settingValue);
        } catch {}
      }

      const enrichedDepts = dbDepts.map(dept => {
        const opMatch = operationalDeptsJson.find((od: any) =>
          Number(od.id) === dept.id ||
          (od.name && od.name.trim().toLowerCase() === dept.name.trim().toLowerCase())
        );

        const divisions = (opMatch?.divisions || []).map((div: any) => ({
          id: String(div.id),
          name: div.name,
          teams: (div.teams || []).map((t: any) => ({ id: t.id, name: t.name }))
        }));

        return {
          id: dept.id,
          name: dept.name,
          divisions
        };
      });

      res.json({ success: true, data: enrichedDepts });
    } catch (err) {
      console.error('[OpsQueue] getAvailableDepartments error:', err);
      res.status(500).json({ success: false, message: 'فشل تحميل الإدارات والأقسام' });
    }
  }

  // =========================================================================
  // 10. GET /api/v1/ops/agents — الكادر التشغيلي للتعيين
  // =========================================================================
  static async getAvailableAgents(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { departmentId: true }
      });

      // جلب الكادر مع عدد التذاكر النشطة بالاستعلام المنفصل للتوافق
      const agents = await prisma.user.findMany({
        where: {
          isActive: true,
          ...(fullUser?.departmentId && { departmentId: fullUser.departmentId })
        },
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
          departmentId: true,
        },
        orderBy: { fullName: 'asc' }
      });

      // عدد التذاكر النشطة لكل موظف
      const agentIds = agents.map(a => a.id);
      const activeCounts = await prisma.ticketAssignment.groupBy({
        by: ['assignedTechId'],
        _count: { ticketId: true },
        where: { assignedTechId: { in: agentIds }, isCurrentActive: true }
      });
      const countMap = Object.fromEntries(activeCounts.map(c => [c.assignedTechId, c._count.ticketId]));

      res.json({
        success: true,
        data: agents.map(a => ({
          id: a.id,
          name: a.fullName,
          avatar: a.avatarUrl,
          activeTickets: countMap[a.id] || 0
        }))
      });
    } catch (err) {
      res.status(500).json({ success: false, message: 'فشل تحميل قائمة الكادر' });
    }
  }

  // =========================================================================
  // 11. GET /api/v1/ops/tickets/:id/flow-members — الزملاء المؤهلين للتحويل ضمن المسار
  // =========================================================================
  static async getTicketFlowMembers(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) return res.status(400).json({ success: false, message: 'ID غير صالح' });

      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, flowDefinitionId: true, routeId: true, departmentId: true, routingMetadata: true }
      });
      if (!ticket) return res.status(404).json({ success: false, message: 'الطلب غير موجود' });

      let flowId = ticket.flowDefinitionId || ticket.routeId;
      if (!flowId && ticket.routingMetadata) {
        try {
          const meta = typeof ticket.routingMetadata === 'string' ? JSON.parse(ticket.routingMetadata) : ticket.routingMetadata;
          flowId = meta.routeId || null;
        } catch {}
      }

      let members: any[] = [];
      if (flowId) {
        const setting = await prisma.systemSetting.findUnique({ where: { settingKey: 'litc_ticket_routes' } });
        const routes = setting?.settingValue ? JSON.parse(setting.settingValue) : [];
        const route = routes.find((r: any) => r.id === flowId);
        if (route) {
          members = await getEntityMembers(
            Number(route.targetDepartmentId),
            route.targetDivisionId,
            route.targetTeamId
          );
        }
      }

      // Fallback: إذا لم يتوفر مسار، نجلب موظفي إدارة التذكرة
      if (members.length === 0 && ticket.departmentId) {
        members = await getEntityMembers(ticket.departmentId, undefined, undefined);
      }

      // استبعاد المستخدم الحالي (لا يحول لنفسه)
      const eligibleMembers = members.filter(m => m.id !== user.id);

      // جلب عدد التذاكر النشطة لكل موظف
      const memberIds = eligibleMembers.map(m => m.id);
      const activeAssignments = await prisma.ticketAssignment.groupBy({
        by: ['assignedTechId'],
        _count: { ticketId: true },
        where: { assignedTechId: { in: memberIds }, isCurrentActive: true }
      });
      const countMap = Object.fromEntries(activeAssignments.map(a => [a.assignedTechId, a._count.ticketId]));

      res.json({
        success: true,
        data: eligibleMembers.map(m => ({
          id: m.id,
          name: m.name || m.fullName,
          avatar: m.avatar || m.avatarUrl,
          jobTitle: m.jobTitle || 'موظف تشغيلي',
          department: m.department,
          activeTickets: countMap[m.id] || 0
        }))
      });
    } catch (err: any) {
      console.error('[OpsQueue] getTicketFlowMembers error:', err);
      res.status(500).json({ success: false, message: 'فشل تحميل أعضاء المسار للتحويل' });
    }
  }

  // =========================================================================
  // 12. GET /api/v1/ops/tickets/:id/sub-tickets — التذاكر الفرعية للتذكرة
  // =========================================================================
  static async getSubTickets(req: Request, res: Response) {
    try {
      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) return res.status(400).json({ success: false, message: 'ID غير صالح' });

      const subTickets = await prisma.ticket.findMany({
        where: { parentId: ticketId, isDeleted: false },
        include: {
          state: true,
          departmentObj: { select: { id: true, name: true } },
          creator: { select: { id: true, fullName: true, avatarUrl: true } },
          assignments: {
            where: { isCurrentActive: true },
            include: { assignedTech: { select: { id: true, fullName: true, avatarUrl: true } } }
          },
          _count: { select: { comments: true, files: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: subTickets.map(formatTicketItem)
      });
    } catch (err: any) {
      console.error('[OpsQueue] getSubTickets error:', err);
      res.status(500).json({ success: false, message: 'فشل تحميل التذاكر الداخلية الفرعية' });
    }
  }

  // =========================================================================
  // 13. POST /api/v1/ops/tickets/:id/sub-tickets — إنشاء تذكرة ومهمة داخلية فرعية
  // =========================================================================
  static async createSubTicket(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const parentId = parseInt(req.params.id);
      const { title, description, targetDeptId, targetDivisionId, priority } = req.body;

      if (isNaN(parentId)) return res.status(400).json({ success: false, message: 'ID تذكرة غير صالح' });
      if (!title?.trim()) return res.status(400).json({ success: false, message: 'عنوان المهمة الداخلية مطلوب' });
      if (!description?.trim()) return res.status(400).json({ success: false, message: 'تفاصيل العمل المطلوب إنجازه مطلوبة' });
      if (!targetDeptId) return res.status(400).json({ success: false, message: 'الإدارة أو القسم المستهدف مطلوب' });

      const parentTicket = await prisma.ticket.findUnique({
        where: { id: parentId },
        include: { state: true, departmentObj: true }
      });
      if (!parentTicket) return res.status(404).json({ success: false, message: 'التذكرة الأصلية غير موجودة' });

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { fullName: true, departmentId: true, role: { select: { name: true } } }
      });
      const roleName = fullUser?.role?.name || 'USER';
      const isAdmin = user.roleId === 1 || user.roleId === 22 || canDo(roleName, 80);

      // التحقق من حوكمة المسار للتذاكر الفرعية
      let flowId = parentTicket.flowDefinitionId || parentTicket.routeId;
      if (!flowId && parentTicket.routingMetadata) {
        try {
          const meta = typeof parentTicket.routingMetadata === 'string' ? JSON.parse(parentTicket.routingMetadata) : parentTicket.routingMetadata;
          flowId = meta.routeId || null;
        } catch {}
      }

      let isFlowManager = false;
      let subTicketConfig: any = { enabled: true, allowedUserIds: [], userScopes: {} };

      if (flowId) {
        const flowDef = await prisma.flowDefinition.findUnique({ where: { id: flowId } });
        if (flowDef) {
          if (flowDef.managerId && String(flowDef.managerId) === String(user.id)) isFlowManager = true;
          if (flowDef.priorityConfigJson) {
            try {
              const parsed = JSON.parse(flowDef.priorityConfigJson);
              if (parsed.subTicketConfig) subTicketConfig = parsed.subTicketConfig;
            } catch {}
          }
        }
      }

      // التحقق الصارم من حوكمة المسار للتذاكر الفرعية
      if (subTicketConfig.enabled === false && !isAdmin) {
        return res.status(403).json({ success: false, message: 'خاصية فتح التذاكر والمهام الداخلية معطلة لهذا المسار' });
      }

      if (Array.isArray(subTicketConfig.allowedUserIds) && subTicketConfig.allowedUserIds.length > 0) {
        if (!subTicketConfig.allowedUserIds.includes(user.id) && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'غير مصرح لك بفتح تذاكر داخلية فرعية وفق إعدادات حوكمة هذا المسار'
          });
        }
      }

      // فحص النطاق المسموح (Scope Check) - يتم تطبيق النطاق المخصص للموظف بدقة حتى وإن كان مديراً للمسار
      const explicitScope = subTicketConfig.userScopes?.[String(user.id)];
      const effectiveScope = explicitScope || (isFlowManager || isAdmin ? 'CROSS_DEPARTMENT' : 'SAME_DEPARTMENT');
      const targetDeptNum = Number(targetDeptId);
      const userDeptId = fullUser?.departmentId;

      if ((effectiveScope === 'SAME_DEPARTMENT' || effectiveScope === 'SAME_DIVISION') && userDeptId && targetDeptNum !== userDeptId) {
        return res.status(403).json({
          success: false,
          message: 'صلاحيتك المحددة في هذا المسار مقيدة بفتح مهام فرعية ضمن إدارتك التشغيلية فقط ولا تسمح بالتوجيه لإدارة خارجية.'
        });
      }

      // استخراج اسم القسم التشغيلي المستهدف من هيكل المنظومة
      let targetDivisionName: string | null = null;
      if (targetDivisionId) {
        const opJsonSetting = await prisma.systemSetting.findUnique({
          where: { settingKey: 'LITC_OPERATIONAL_DEPARTMENTS_JSON' }
        });
        if (opJsonSetting?.settingValue) {
          try {
            const depts = JSON.parse(opJsonSetting.settingValue);
            const dept = depts.find((d: any) => Number(d.id) === targetDeptNum);
            const div = dept?.divisions?.find((dv: any) => String(dv.id) === String(targetDivisionId));
            if (div) targetDivisionName = div.name;
          } catch {}
        }
      }

      const openState = await getOrCreateState(prisma, 'OPEN', 'مفتوح');

      const createdSubTicket = await prisma.$transaction(async (tx) => {
        const sub = await tx.ticket.create({
          data: {
            title: `[مهمة فرعية] ${title.trim()}`,
            description: description.trim(),
            ticketType: 'SUB_TICKET',
            priority: priority || parentTicket.priority || 'MEDIUM',
            parentId: parentTicket.id,
            categoryId: parentTicket.categoryId,
            departmentId: Number(targetDeptId),
            creatorId: user.id,
            stateId: openState.id,
            routingMetadata: JSON.stringify({
              isSubTicket: true,
              parentTicketId: parentTicket.id,
              parentTicketCode: `REQ-${String(parentTicket.id).padStart(4, '0')}`,
              parentTicketTitle: parentTicket.title,
              targetDivisionId: targetDivisionId || null,
              targetDivisionName: targetDivisionName || null,
              requestedScope: description.trim()
            })
          },
          include: {
            state: true,
            departmentObj: { select: { id: true, name: true } },
            creator: { select: { id: true, fullName: true, avatarUrl: true } }
          }
        });

        const targetLabel = targetDivisionName
          ? `${sub.departmentObj?.name || targetDeptId} - ${targetDivisionName}`
          : (sub.departmentObj?.name || targetDeptId);

        await logAction(
          tx,
          parentTicket.id,
          user.id,
          'CREATE_SUB_TICKET',
          `تم فتح تذكرة داخلية فرعية #${sub.id} موجهة إلى (${targetLabel}) بواسطة ${fullUser?.fullName}: ${title.trim()}`
        );

        await tx.ticketComment.create({
          data: {
            ticketId: parentTicket.id,
            authorId: user.id,
            bodyText: `📌 تم إنشاء مهمة داخلية فرعية #${sub.id} [${title.trim()}] ومشاركتها مع [${targetLabel}] لإنجاز جزء من العمل.`,
            isInternal: true
          }
        });

        return sub;
      });

      res.status(201).json({
        success: true,
        message: 'تم فتح التذكرة الداخلية الفرعية بنجاح',
        data: formatTicketItem(createdSubTicket)
      });
    } catch (err: any) {
      console.error('[OpsQueue] createSubTicket error:', err);
      res.status(500).json({ success: false, message: 'فشل إنشاء التذكرة الداخلية الفرعية' });
    }
  }

  // =========================================================================
  // 14. GET /api/v1/ops/sub-tickets — كافة التذاكر والمهام الداخلية (تبويب مخصص)
  // =========================================================================
  static async getAllSubTickets(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { cursor, limit = 30, status, priority, search } = req.query;

      const fullUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { departmentId: true, role: { select: { name: true } } }
      });
      const roleName = fullUser?.role?.name || 'USER';
      const isAdmin = user.roleId === 1 || user.roleId === 22 || canDo(roleName, 80);

      const take = Math.min(Number(limit), 100);

      const where: any = {
        isDeleted: false,
        parentId: { not: null }
      };

      if (!isAdmin) {
        where.OR = [
          { departmentId: fullUser?.departmentId },
          { creatorId: user.id },
          { assignments: { some: { assignedTechId: user.id, isCurrentActive: true } } },
          { parentTicket: { departmentId: fullUser?.departmentId } }
        ];
      }

      if (status) where.state = { name: (status as string).toUpperCase() };
      if (priority) where.priority = (priority as string).toUpperCase();
      if (cursor) where.id = { lt: Number(cursor) };
      if (search) {
        where.AND = [
          {
            OR: [
              { title: { contains: String(search) } },
              { description: { contains: String(search) } }
            ]
          }
        ];
      }

      const subTickets = await prisma.ticket.findMany({
        where,
        include: {
          state: true,
          creator: { select: { id: true, fullName: true, avatarUrl: true, department: { select: { name: true } } } },
          departmentObj: { select: { id: true, name: true } },
          parentTicket: {
            select: {
              id: true,
              title: true,
              priority: true,
              state: { select: { name: true, label: true } },
              departmentObj: { select: { name: true } }
            }
          },
          assignments: {
            where: { isCurrentActive: true },
            include: { assignedTech: { select: { id: true, fullName: true, avatarUrl: true } } }
          },
          _count: { select: { comments: true, files: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: take + 1
      });

      const hasMore = subTickets.length > take;
      const items = hasMore ? subTickets.slice(0, take) : subTickets;
      const nextCursor = hasMore ? items[items.length - 1].id : null;

      res.json({
        success: true,
        data: items.map(t => ({
          ...formatTicketItem(t),
          parentTicket: t.parentTicket ? {
            id: t.parentTicket.id,
            code: `REQ-${String(t.parentTicket.id).padStart(4, '0')}`,
            title: t.parentTicket.title,
            priority: t.parentTicket.priority,
            state: t.parentTicket.state,
            departmentName: t.parentTicket.departmentObj?.name
          } : null
        })),
        nextCursor,
        hasMore
      });
    } catch (err: any) {
      console.error('[OpsQueue] getAllSubTickets error:', err);
      res.status(500).json({ success: false, message: 'فشل تحميل التذاكر الداخلية' });
    }
  }
}

// ─── مساعدات داخلية ──────────────────────────────────────────────────────────

async function getOrCreateState(tx: any, name: string, label: string) {
  let state = await tx.ticketState.findFirst({ where: { name } });
  if (!state) {
    state = await tx.ticketState.create({ data: { name, label } });
  }
  return state;
}

async function verifyAllSubTicketsClosed(tx: any, parentTicketId: number) {
  const openSubTickets = await tx.ticket.findMany({
    where: {
      parentId: parentTicketId,
      isDeleted: false,
      state: {
        name: { notIn: ['CLOSED', 'RESOLVED'] }
      }
    },
    include: {
      departmentObj: { select: { name: true } },
      assignments: {
        where: { isCurrentActive: true },
        include: { assignedTech: { select: { fullName: true } } }
      },
      state: { select: { name: true, label: true } }
    }
  });

  if (openSubTickets.length > 0) {
    const list = openSubTickets.map((st: any) => {
      const dept = st.departmentObj?.name || 'قسم غير محدد';
      const tech = st.assignments?.[0]?.assignedTech?.fullName;
      const techStr = tech ? ` (المسؤول: ${tech})` : '';
      const stateLabel = st.state?.label || st.state?.name || 'قيد المعالجة';
      return `• مهمة فرعية #${st.id} [${st.title}] لدى جهة: ${dept}${techStr} — الحالة: ${stateLabel}`;
    }).join('\n');

    throw new Error(
      `لا يمكن إغلاق أو طلب اعتماد اكتمال التذكرة لوجود (${openSubTickets.length}) مهام فرعية ما زالت قيد المعالجة ولم يتم قفلها بعد من الجهات المستلمة:\n${list}\n\nيجب أن يقوم الطرف المستلم لكل تذكرة فرعية بإنجاز عمله وإقفالها من جهته أولاً قبل إغلاق المعاملة الرئيسية.`
    );
  }
}

async function notifyParentOnSubTicketClosure(tx: any, subTicket: any, closerUserId: number, closerFullName?: string, completionNotes?: string) {
  if (!subTicket.parentId) return;

  const parentTicket = await tx.ticket.findUnique({
    where: { id: subTicket.parentId },
    include: {
      departmentObj: { select: { id: true, name: true } },
      assignments: {
        where: { isCurrentActive: true },
        include: { assignedTech: { select: { id: true, fullName: true } } }
      }
    }
  });

  if (!parentTicket) return;

  const targetDeptName = subTicket.departmentObj?.name || 'الجهة المستلمة للمهمة الفرعية';
  const closerName = closerFullName || `مستخدم #${closerUserId}`;
  const primaryAssigneeName = parentTicket.assignments?.[0]?.assignedTech?.fullName || parentTicket.departmentObj?.name || 'مستلم الطلب الرئيسي';

  // حساب المهام الفرعية المتبقية المفتوحة للتذكرة الأم
  const remainingOpenCount = await tx.ticket.count({
    where: {
      parentId: subTicket.parentId,
      id: { not: subTicket.id },
      isDeleted: false,
      state: { name: { notIn: ['CLOSED', 'RESOLVED'] } }
    }
  });

  const statusDetail = remainingOpenCount === 0
    ? `✅ اكتملت كافة المهام والتذاكر الفرعية بالكامل! المعاملة الآن جاهزة للمتابعة والإغلاق النهائي لدى مستلم الطلب الرئيسي (${primaryAssigneeName}).`
    : `⏳ متبقي (${remainingOpenCount}) مهمة فرعية أخرى قيد المعالجة لدى جهات أخرى قبل إمكانية إغلاق الطلب الرئيسي.`;

  await logAction(
    tx,
    subTicket.parentId,
    closerUserId,
    'SUB_TICKET_COMPLETED',
    `تم إنجاز وقفل المهمة الفرعية #${subTicket.id} (${subTicket.title}) من قبل الطرف المستلم [${targetDeptName} - ${closerName}]. المعاملة الآن لدى مستلم الطلب الرئيسي (${primaryAssigneeName}). ${statusDetail}`
  );

  await tx.ticketComment.create({
    data: {
      ticketId: subTicket.parentId,
      authorId: closerUserId,
      bodyText: `📌 إشعار إنجاز مهمة فرعية:\nتم إقفال المهمة الفرعية #${subTicket.id} [${subTicket.title}] بالكامل من طرف (${targetDeptName} - ${closerName}).\nملاحظات الإنجاز: ${completionNotes || 'تم تنفيذ المطلوب بنجاح'}.\n📍 المعاملة الآن لدى مستلم الطلب الرئيسي (${primaryAssigneeName}).\n${statusDetail}`,
      isInternal: true
    }
  });
}

async function logAction(tx: any, ticketId: number, userId: number, action: string, changes: string) {
  await tx.ticketLog.create({
    data: {
      ticketId,
      action: `[${action}] by:${userId} — ${changes.slice(0, 490)}`
    }
  });
}

function formatTicketItem(t: any) {
  const hasSlaBreached = t.slaTrackers?.length > 0;
  let parsedRoutingMeta: any = null;
  try {
    parsedRoutingMeta = typeof t.routingMetadata === 'string' ? JSON.parse(t.routingMetadata) : t.routingMetadata;
  } catch {}

  const handoverInfo = parsedRoutingMeta?.handover || null;

  return {
    id: t.id,
    code: `REQ-${String(t.id).padStart(4, '0')}`,
    title: t.title,
    subject: t.title,
    description: t.description,
    priority: t.priority,
    requesterPriority: t.requesterPriority || t.priority,
    businessPriority: t.businessPriority || t.priority,
    calibratedById: t.calibratedById,
    calibratedAt: t.calibratedAt,
    urgency: t.urgency,
    state: { name: t.state?.name, label: t.state?.label },
    creator: t.creator,
    creatorName: t.creator?.fullName,
    departmentName: t.departmentObj?.name,
    targetDept: t.departmentObj?.name,
    targetDeptId: t.departmentId,
    targetDivisionId: parsedRoutingMeta?.targetDivisionId || null,
    targetDivisionName: parsedRoutingMeta?.targetDivisionName || null,
    parentId: t.parentId,
    isSubTicket: !!t.parentId,
    flow: t.flowDefinition ? { name: t.flowDefinition.name, icon: t.flowDefinition.icon } : null,
    flowDefinitionName: t.flowDefinition?.name,
    flowDefinitionId: t.flowDefinitionId,
    assignedTo: t.assignments?.[0]?.assignedTech || null,
    isUnassigned: !t.assignments || t.assignments.length === 0,
    routingMetadata: parsedRoutingMeta,
    handoverInfo,
    isPendingHandover: t.state?.name === 'PENDING_HANDOVER',
    slaBreached: hasSlaBreached,
    commentsCount: t._count?.comments || 0,
    filesCount: t._count?.files || 0,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  };
}
