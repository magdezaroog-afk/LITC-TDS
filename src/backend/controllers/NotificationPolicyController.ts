import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const POLICY_KEY = 'NOTIFICATION_POLICIES';

export class NotificationPolicyController {
  
  static async getPolicies(req: Request, res: Response) {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { settingKey: POLICY_KEY }
      });
      if (setting && setting.settingValue) {
        return res.json(JSON.parse(setting.settingValue));
      }
      return res.json([]);
    } catch (error) {
      console.error('[NotificationPolicyController] getPolicies Error:', error);
      res.status(500).json({ error: 'Failed to fetch notification policies' });
    }
  }

  static async savePolicies(req: Request, res: Response) {
    try {
      const { policies } = req.body;
      if (!Array.isArray(policies)) return res.status(400).json({ error: 'policies array required' });

      await prisma.systemSetting.upsert({
        where: { settingKey: POLICY_KEY },
        update: { settingValue: JSON.stringify(policies) },
        create: { settingKey: POLICY_KEY, settingValue: JSON.stringify(policies), description: 'Global Notification Policies' }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('[NotificationPolicyController] savePolicies Error:', error);
      res.status(500).json({ error: 'Failed to save notification policies' });
    }
  }
}
