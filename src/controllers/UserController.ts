import { Request, Response, NextFunction } from 'express';

export class UserControllerClass {
  public updateProfileBuilding = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const user = (req as any).user;
      
      if (!user || !user.id) {
        res.status(401).json({ status: 'error', message: 'غير مصرح لك بإجراء هذا التعديل.' });
        return;
      }

      const { buildingId } = req.body;

      if (!buildingId) {
        res.status(400).json({ status: 'error', message: 'Building ID is required' });
        return;
      }

      // Update user in DB
      await prisma.user.update({
        where: { id: parseInt(user.id, 10) },
        data: { buildingId: buildingId }
      });

      // Issue a new token with updated buildingId context
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'fallback_secret';
      
      const payload = {
        id: user.id,
        role: user.role,
        department: user.department,
        buildingId: buildingId, // Updated Context
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24)
      };

      const newToken = jwt.sign(payload, secret);

      res.status(200).json({
        status: 'success',
        message: 'تم تحديث سياق المبنى الشخصي بنجاح.',
        token: newToken
      });
    } catch (error) {
      console.error('[UserController] updateProfileBuilding error:', error);
      next(error);
    }
  };
}

export const UserController = Object.freeze(new UserControllerClass());
