import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { EntraSyncService } from '../services/EntraSyncService';
import { ImmutableLogService } from '../services/ImmutableLogService';
import { SIEMLogger } from '../security/SIEMLogger';

export class IdentityController {

  /**
   * GET /api/v1/identity/config - Get current Entra ID configuration
   */
  static async getConfig(req: Request, res: Response) {
    try {
      const config = await EntraSyncService.getConfig();
      const secretLen = config.clientSecret ? config.clientSecret.length : 0;
      const clientSecretMasked = secretLen > 0
        ? `••••••••••••${config.clientSecret.slice(-4)}`
        : '';

      res.json({
        success: true,
        config: {
          tenantId: config.tenantId,
          clientId: config.clientId,
          clientSecret: clientSecretMasked,
          redirectUri: config.redirectUri,
          isConfigured: !!(config.tenantId && config.clientId && config.clientSecret)
        }
      });
    } catch (error: any) {
      console.error('[IdentityController.getConfig] Error:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل جلب إعدادات الهوية' });
    }
  }

  /**
   * POST /api/v1/identity/config - Save Entra ID configuration
   */
  static async saveConfig(req: Request, res: Response) {
    try {
      const { tenantId, clientId, clientSecret, redirectUri } = req.body;
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress || 'INTERNAL';

      await EntraSyncService.saveConfig({
        tenantId,
        clientId,
        clientSecret,
        redirectUri
      });

      // Immutable Audit Trail & SIEM
      await ImmutableLogService.appendLog(
        'SYSTEM_SETTING',
        0,
        'UPDATE_ENTRA_CONFIG',
        changedBy,
        { tenantId, clientId, redirectUri },
        sourceIp
      );
      SIEMLogger.logEvent('ENTRA_CONFIG_UPDATED', 'WARNING', sourceIp, { tenantId, clientId }, changedBy);

      res.json({
        success: true,
        message: 'تم حفظ إعدادات الربط مع Microsoft Entra ID بنجاح في قاعدة البيانات.'
      });
    } catch (error: any) {
      console.error('[IdentityController.saveConfig] Error:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل حفظ الإعدادات' });
    }
  }

  /**
   * POST /api/v1/identity/test-connection - Test Microsoft Entra ID Graph connection
   */
  static async testConnection(req: Request, res: Response) {
    try {
      const result = await EntraSyncService.testConnection();
      res.json(result);
    } catch (error: any) {
      console.error('[IdentityController.testConnection] Error:', error);
      res.status(400).json({ success: false, error: error.message || 'فشل التحقق من الاتصال بمايكروسوفت' });
    }
  }

  /**
   * POST /api/v1/identity/sync - Execute full user directory sync
   */
  static async syncUsers(req: Request, res: Response) {
    try {
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress || 'INTERNAL';

      const result = await EntraSyncService.syncUsers(changedBy, sourceIp);
      res.json(result);
    } catch (error: any) {
      console.error('[IdentityController.syncUsers] Error:', error);
      res.status(500).json({ success: false, error: error.message || 'فشلت مزامنة دليل الموظفين مع مايكروسوفت' });
    }
  }

  /**
   * PATCH /api/v1/identity/users/:id - Patch user data locally and mark syncStatus as 'overridden'
   */
  static async patchUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, phone, externalAliases, fullName, jobTitle } = req.body;
      const changedBy = (req as any).user?.id || 1;
      const sourceIp = req.ip || req.socket.remoteAddress || 'INTERNAL';
      const userId = parseInt(id, 10);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
      }

      const updates: any = {
        syncStatus: 'overridden' // Lock local changes from automated Entra overwriting
      };

      if (email !== undefined) updates.email = email.trim();
      if (phone !== undefined) updates.phone = phone.trim();
      if (externalAliases !== undefined) updates.externalAliases = typeof externalAliases === 'string' ? externalAliases : JSON.stringify(externalAliases);
      if (fullName !== undefined) updates.fullName = fullName.trim();
      if (jobTitle !== undefined) updates.jobTitle = jobTitle.trim();

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          fullName: true,
          username: true,
          email: true,
          phone: true,
          externalAliases: true,
          syncStatus: true,
          ssoProvider: true
        }
      });

      // Immutable Audit Trail & SIEM
      await ImmutableLogService.appendLog(
        'USER',
        userId,
        'USER_IDENTITY_PATCHED_LOCAL_OVERRIDE',
        changedBy,
        { updates },
        sourceIp
      );
      SIEMLogger.logEvent('USER_IDENTITY_PATCHED', 'INFO', sourceIp, { targetUserId: userId, updates }, changedBy);

      res.json({
        success: true,
        user: updatedUser,
        message: 'تم حفظ تعديلات الهوية وتثبيتها محلياً (overridden) بنجاح لمنع استبدالها بالمزامنة.'
      });
    } catch (error: any) {
      console.error('[IdentityController.patchUser] Error:', error);
      res.status(500).json({ success: false, error: error.message || 'فشل تحديث بيانات المستخدم' });
    }
  }
}

