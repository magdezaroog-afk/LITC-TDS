import { Request, Response, NextFunction } from 'express';
import { AuthService } from './AuthService';
import { SIEMLogger } from '../security/SIEMLogger';
import { prisma } from '../../db/client';
import qrcode from 'qrcode';

// @ts-ignore
const { authenticator } = require('otplib');

export class AuthController {
  
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, totpCode } = req.body;
      const sourceIp = req.ip || req.socket.remoteAddress || 'UNKNOWN';

      const result = await AuthService.login(email, password, sourceIp);
      const user = result.user;

      // 2FA Verification
      if (user.mfaEnabled) {
        if (!totpCode) {
          return res.status(403).json({ error: '2FA code required', requiresMfa: true });
        }
        
        const isValid = authenticator.verify({ token: totpCode, secret: user.mfaSecret! });
        if (!isValid) {
          SIEMLogger.logEvent('LOGIN_FAILED_2FA', 'WARNING', sourceIp, { userId: user.id });
          return res.status(401).json({ error: 'Invalid 2FA code' });
        }
      }

      // Set HttpOnly Secure Cookie
      res.cookie('litc_session', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      res.json({ success: true, user: result.user });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const sourceIp = req.ip || req.socket.remoteAddress || 'UNKNOWN';
    SIEMLogger.logEvent('LOGOUT', 'INFO', sourceIp, { userId: (req as any).user?.id });
    
    res.clearCookie('litc_session');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  // 2FA Setup
  async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || parseInt(req.headers['x-user-id'] as string, 10);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Generate a secret
      const secret = authenticator.generateSecret();
      const otpauth = authenticator.keyuri(user.username, 'LITC_System', secret);
      const qrCodeUrl = await qrcode.toDataURL(otpauth);

      // Save secret temporarily
      await prisma.user.update({
        where: { id: userId },
        data: { mfaSecret: secret }
      });

      res.json({ secret, qrCodeUrl });
    } catch (error) {
      next(error);
    }
  }

  async enable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || parseInt(req.headers['x-user-id'] as string, 10);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      const { code } = req.body;
      
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.mfaSecret) return res.status(400).json({ error: 'MFA setup not initialized' });

      const isValid = authenticator.verify({ token: code, secret: user.mfaSecret });
      if (!isValid) return res.status(401).json({ error: 'Invalid code' });

      await prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true }
      });

      res.json({ success: true, message: '2FA enabled successfully' });
    } catch (error) {
      next(error);
    }
  }
}
