import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

export class LocationController {
  
  static async getAllLocations(req: Request, res: Response, next: NextFunction) {
    try {
      const locations = await prisma.ticketLocation.findMany({
        where: { isDeleted: false },
        orderBy: { name: 'asc' }
      });
      res.json(locations);
    } catch (err) { next(err); }
  }

  static async createLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, building, department, office } = req.body;
      const location = await prisma.ticketLocation.create({
        data: { name, building, department, office }
      });
      res.status(201).json(location);
    } catch (err) { next(err); }
  }

  static async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { name, building, department, office, isDeleted } = req.body;
      
      const location = await prisma.ticketLocation.update({
        where: { id },
        data: { name, building, department, office, isDeleted }
      });
      res.json(location);
    } catch (err) { next(err); }
  }

  static async deleteLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      
      const location = await prisma.ticketLocation.update({
        where: { id },
        data: { isDeleted: true }
      });
      res.json(location);
    } catch (err) { next(err); }
  }
}
