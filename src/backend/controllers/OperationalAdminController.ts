import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

export class OperationalAdminController {

  // ==========================================
  // Departments
  // ==========================================
  static async getDepartments(req: Request, res: Response, next: NextFunction) {
    try {
      const depts = await prisma.department.findMany({
        where: { isDeleted: false },
        include: { teams: { where: { isDeleted: false } } }
      });
      res.json(depts);
    } catch (err) { next(err); }
  }

  static async createDepartment(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const dept = await prisma.department.create({ data: { name } });
      res.status(201).json(dept);
    } catch (err) { next(err); }
  }

  // ==========================================
  // Teams
  // ==========================================
  static async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, departmentId } = req.body;
      const team = await prisma.team.create({ data: { name, departmentId: Number(departmentId) } });
      res.status(201).json(team);
    } catch (err) { next(err); }
  }

  // ==========================================
  // Users
  // ==========================================
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, username: true, fullName: true }
      });
      res.json(users);
    } catch (err) { next(err); }
  }

  static async assignUserToTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, teamId } = req.body;
      const userTeam = await prisma.userTeam.create({
        data: { userId: Number(userId), teamId: Number(teamId) }
      });
      res.status(201).json(userTeam);
    } catch (err) { next(err); }
  }

  static async removeUserFromTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, teamId } = req.params;
      await prisma.userTeam.deleteMany({
        where: { userId: Number(userId), teamId: Number(teamId) }
      });
      res.sendStatus(204);
    } catch (err) { next(err); }
  }

  // ==========================================
  // UI Layout Engine (System Settings)
  // ==========================================
  static async getUIConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: 'UI_LAYOUT_CONFIG' }
      });
      if (setting && setting.settingValue) {
        res.json(JSON.parse(setting.settingValue));
      } else {
        res.json({});
      }
    } catch (err) { next(err); }
  }

  static async saveUIConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = req.body;
      const setting = await prisma.systemSetting.upsert({
        where: { settingKey: 'UI_LAYOUT_CONFIG' },
        update: { settingValue: JSON.stringify(config) },
        create: { settingKey: 'UI_LAYOUT_CONFIG', settingValue: JSON.stringify(config) }
      });
      res.json(JSON.parse(setting.settingValue));
    } catch (err) { next(err); }
  }
}
