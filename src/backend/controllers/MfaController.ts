import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Logger from '../infrastructure/Logger';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

const prisma = new PrismaClient();

export class MfaController {

  static async generateMfaSecret(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const targetUserId = authUser?.id || (req.body.userId ? parseInt(req.body.userId, 10) : null);

      if (!targetUserId) {
        res.status(401).json({ error: 'Unauthorized: User ID is required' });
        return;
      }

      // Check authorization: users can only set up MFA for themselves unless they are Admin (roleId === 1)
      if (authUser && authUser.id !== targetUserId && authUser.roleId !== 1) {
        res.status(403).json({ error: 'Forbidden: Cannot configure 2FA for other users' });
        return;
      }

      const secret = speakeasy.generateSecret({ length: 20, name: `LITC-TS (${targetUserId})` });
      
      await prisma.user.update({
        where: { id: targetUserId },
        data: { mfaSecret: secret.base32, mfaEnabled: false } // Only enable upon first verification
      });

      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url!);

      res.status(200).json({
        secret: secret.base32,
        qrCodeUrl
      });
    } catch (error) {
      Logger.error(`Error in generateMfaSecret: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async verifyMfaToken(req: Request, res: Response): Promise<void> {
    try {
      const { userId, token } = req.body;

      if (!userId || !token) {
        res.status(400).json({ error: 'User ID and token are required' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: parseInt(userId, 10) } });
      if (!user || !user.mfaSecret) {
        res.status(404).json({ error: 'User or MFA secret not found' });
        return;
      }

      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token,
        window: 1 // allows +/- 30 seconds for clock drift
      });

      if (verified) {
        if (!user.mfaEnabled) {
          // First time verification, enable MFA
          await prisma.user.update({
            where: { id: parseInt(userId, 10) },
            data: { mfaEnabled: true }
          });
        }
        res.status(200).json({ success: true, message: 'MFA Token verified successfully' });
      } else {
        res.status(401).json({ success: false, error: 'Invalid MFA Token' });
      }
    } catch (error) {
      Logger.error(`Error in verifyMfaToken: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
