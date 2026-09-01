import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import Logger from '../infrastructure/Logger';

export class LayoutController {
  
  private static async resolveRoleId(roleParam: string): Promise<number | null> {
    const numericId = parseInt(roleParam, 10);
    if (!isNaN(numericId)) {
      const role = await prisma.role.findUnique({ where: { id: numericId } });
      if (role) return role.id;
    }
    
    // Lookup by role name
    let role = await prisma.role.findFirst({
      where: { name: { equals: roleParam } }
    });

    if (!role) {
      // Auto-create role definition if missing
      try {
        role = await prisma.role.create({
          data: { name: roleParam, defaultCanViewInternal: false }
        });
      } catch (err) {
        role = await prisma.role.findFirst({ where: { name: roleParam } });
      }
    }

    return role ? role.id : null;
  }

  static async getLayoutForRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      if (!roleId) {
        res.status(400).json({ error: 'Role identifier is required' });
        return;
      }

      const resolvedId = await LayoutController.resolveRoleId(roleId);
      if (!resolvedId) {
        res.status(404).json({ error: 'Role not found' });
        return;
      }

      const layoutRecord = await prisma.dynamicLayout.findUnique({
        where: { roleId: resolvedId }
      });

      if (!layoutRecord) {
        res.status(200).json({ success: true, layout: null, components: [] });
        return;
      }

      const parsed = JSON.parse(layoutRecord.layoutJson);
      res.status(200).json({ 
        success: true, 
        layout: parsed,
        components: parsed.components || parsed 
      });
    } catch (error) {
      Logger.error(`Error in getLayoutForRole: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async saveLayoutForRole(req: Request, res: Response): Promise<void> {
    try {
      const { roleId } = req.params;
      const layoutData = req.body.layout || req.body.components ? req.body : req.body;

      if (!roleId || !layoutData) {
        res.status(400).json({ error: 'Role ID and layout data are required' });
        return;
      }

      const resolvedId = await LayoutController.resolveRoleId(roleId);
      if (!resolvedId) {
        res.status(404).json({ error: 'Role could not be resolved or created' });
        return;
      }

      const layoutJsonStr = typeof layoutData === 'string' ? layoutData : JSON.stringify(layoutData);

      const savedLayout = await prisma.dynamicLayout.upsert({
        where: { roleId: resolvedId },
        update: { layoutJson: layoutJsonStr },
        create: {
          roleId: resolvedId,
          layoutJson: layoutJsonStr
        }
      });

      Logger.info(`Layout updated for role ${roleId} (ID: ${resolvedId})`);
      const parsed = JSON.parse(savedLayout.layoutJson);
      res.status(200).json({ 
        success: true, 
        layout: parsed,
        components: parsed.components || parsed
      });
    } catch (error) {
      Logger.error(`Error in saveLayoutForRole: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

