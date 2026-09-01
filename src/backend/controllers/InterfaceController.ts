import { Request, Response, NextFunction } from 'express';
import { InterfaceService } from '../services/InterfaceService';
import { Logger } from '../infrastructure/Logger';

export class InterfaceController {
  async getInterfaces(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, interfaceType } = req.query;
      const deptId = departmentId ? parseInt(departmentId as string) : undefined;
      const interfaces = await InterfaceService.listInterfaces(deptId, interfaceType as string);
      res.json({ success: true, interfaces });
    } catch (error) {
      Logger.error('[InterfaceController] getInterfaces error', error);
      res.status(500).json({ success: false, message: 'فشل استرجاع الواجهات', error: (error as Error).message });
    }
  }

  async createInterface(req: Request, res: Response, next: NextFunction) {
    try {
      const newInterface = await InterfaceService.createInterface(req.body);
      res.status(201).json({ success: true, interface: newInterface });
    } catch (error) {
      Logger.error('[InterfaceController] createInterface error', error);
      res.status(400).json({ success: false, message: 'فشل إنشاء الواجهة', error: (error as Error).message });
    }
  }

  async updateInterface(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updatedInterface = await InterfaceService.updateInterface(id, req.body);
      res.json({ success: true, interface: updatedInterface });
    } catch (error) {
      Logger.error('[InterfaceController] updateInterface error', error);
      res.status(400).json({ success: false, message: 'فشل تحديث الواجهة', error: (error as Error).message });
    }
  }

  async deleteInterface(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await InterfaceService.deleteInterface(id);
      res.json({ success: true, message: 'تم حذف الواجهة بنجاح' });
    } catch (error) {
      Logger.error('[InterfaceController] deleteInterface error', error);
      res.status(400).json({ success: false, message: 'فشل حذف الواجهة', error: (error as Error).message });
    }
  }
}
