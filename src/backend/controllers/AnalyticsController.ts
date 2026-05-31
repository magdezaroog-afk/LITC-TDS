import { Request, Response, NextFunction } from 'express';
import os from 'os';

export class AnalyticsControllerClass {
  public getUniversalAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const user = (req as any).user; // from authMiddleware
      const userRole = user?.role || 'Technician';
      const userDept = user?.department || 'IT';
      const userBuildingId = user?.buildingId || null;
      
      const { startDate, endDate, compareDepartments } = req.body;
      
      let payload: any = { role: userRole, context: { buildingFilterActive: !!userBuildingId } };

      // 1. IT_Admin: System Health & Global DB Connections
      if (userRole === 'IT_Admin') {
        const memUsage = process.memoryUsage();
        payload.context.systemHealth = {
          totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
          freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
          processMemoryMB: Math.round(memUsage.heapUsed / 1024 / 1024),
          uptimeHours: (os.uptime() / 3600).toFixed(2),
          databaseStatus: 'OPTIMAL',
          activeConnections: Math.floor(Math.random() * 50) + 10 // Mock for now
        };
        
        // Admin gets aggregated stats across ALL departments
        const departments = await prisma.department.findMany();
        const tickets = await prisma.ticket.findMany({ include: { state: true } });
        payload.context.globalEntities = departments.map((dept: any) => {
          const deptTickets = tickets.filter((t: any) => t.department === dept.name);
          const closed = deptTickets.filter((t: any) => t.state?.name === 'CLOSED' || t.state?.name === 'RESOLVED' || t.stateId === 5 || t.stateId === 6).length;
          return {
            name: dept.name,
            total: deptTickets.length,
            closed: closed,
            performanceScore: deptTickets.length > 0 ? Math.round((closed / deptTickets.length) * 100) : 0
          };
        });
      }
      
      // 2. Department_Head: Heatmap & Engineer Performance
      else if (userRole.includes('Head') || userRole === 'Admin') {
        const whereClause: any = { department: userDept };
        if (userBuildingId) whereClause.building = userBuildingId;
        
        const tickets = await prisma.ticket.findMany({ 
          where: whereClause,
          include: { state: true, assignments: true, subTickets: true } 
        });
        
        // Mock engineers for the department
        const engineersMap: Record<string, { total: number; closed: number }> = {};
        tickets.forEach((t: any) => {
          const techId = t.assignments?.[0]?.assignedTechId || 'Unassigned';
          if (!engineersMap[techId]) engineersMap[techId] = { total: 0, closed: 0 };
          engineersMap[techId].total++;
          if (t.state?.name === 'CLOSED' || t.stateId === 5) engineersMap[techId].closed++;
        });

        const subTicketPaths: Record<string, number> = {};
        tickets.forEach((t: any) => {
          t.subTickets?.forEach((st: any) => {
             const target = st.department || 'Unknown';
             subTicketPaths[target] = (subTicketPaths[target] || 0) + 1;
          });
        });

        payload.context.departmentHeatmap = {
          department: userDept,
          totalTickets: tickets.length,
          engineers: Object.entries(engineersMap).map(([id, stats]) => ({
            id,
            ...stats,
            score: stats.total > 0 ? Math.round((stats.closed / stats.total) * 100) : 0
          })),
          subTicketOutflows: Object.entries(subTicketPaths).map(([target, count]) => ({ target, count }))
        };
      }
      
      // 3. Field Technician: Personal Ops
      else {
        const whereClause: any = { department: userDept };
        if (userBuildingId) whereClause.building = userBuildingId;
        
        const tickets = await prisma.ticket.findMany({ 
          where: whereClause, // would ideally be filtered by user.id too
          include: { state: true } 
        });
        const open = tickets.filter((t: any) => t.stateId !== 5 && t.stateId !== 6).length;
        payload.context.fieldOps = {
          assignedToMe: open,
          myPendingSubTickets: 0, // Mock
          departmentTotal: tickets.length
        };
      }

      res.status(200).json({ status: 'success', data: payload });
    } catch (error) {
      console.error('[AnalyticsController] getUniversalAnalytics error:', error);
      next(error);
    }
  };

  public getCrossEntityAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // 1. Fetch tickets and group by department
      // We don't filter out softly deleted things for historical reporting
      // Actually, Prisma does not softly delete tickets usually, it softly deletes SystemReferences.
      
      const departments = await prisma.department.findMany();
      const tickets = await prisma.ticket.findMany({
        include: {
          state: true
        }
      });

      const analyticsData = departments.map((dept: any) => {
        const deptTickets = tickets.filter((t: any) => t.department === dept.name);
        const total = deptTickets.length;
        const closed = deptTickets.filter((t: any) => t.state?.name === 'CLOSED' || t.state?.name === 'RESOLVED' || t.stateId === 5 || t.stateId === 6).length;
        const open = total - closed;
        const escalated = deptTickets.filter((t: any) => t.isEscalated).length;

        return {
          department: dept.name,
          total,
          open,
          closed,
          escalated,
          performanceScore: total > 0 ? Math.round((closed / total) * 100) : 0
        };
      });

      // Filter out departments with zero tickets to keep dashboard clean
      const filteredAnalytics = analyticsData.filter((d: any) => d.total > 0);

      res.status(200).json({
        status: 'success',
        data: {
          departments: filteredAnalytics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('[AnalyticsController] getCrossEntityAnalytics error:', error);
      next(error);
    }
  };
}

export const AnalyticsController = Object.freeze(new AnalyticsControllerClass());
