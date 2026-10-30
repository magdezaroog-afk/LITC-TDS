import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from './AuthService';
import { EntraSyncService } from '../services/EntraSyncService';
import { SIEMLogger } from '../security/SIEMLogger';
import { redisManager } from '../infrastructure/RedisClient';
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

      // Set HttpOnly Secure Cookie (Primary authentication method)
      res.cookie('litc_session', result.token, {
        httpOnly: true,
        secure: false, // Fix for localhost HTTP testing (set to true in production with HTTPS)
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      // Also return the token in the JSON response body.
      // This allows the frontend to store it in localStorage as a Bearer fallback
      // (useful in environments where cookie propagation is unreliable, e.g., dev proxies).
      res.json({
        success: true,
        token: result.token,  // ✅ Added: needed for localStorage Bearer fallback
        user: result.user
      });
    } catch (error: any) {
      res.status(401).json({ success: false, error: error.message });
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    const sourceIp = req.ip || req.socket.remoteAddress || 'UNKNOWN';
    const userId = (req as any).user?.id;

    // Extract token to invalidate it immediately in Redis Blacklist
    let token: string | undefined;
    if (req.headers['authorization']?.startsWith('Bearer ')) {
      token = req.headers['authorization'].substring(7).trim();
    } else if (req.cookies?.litc_session) {
      token = req.cookies.litc_session;
    }

    if (token) {
      try {
        const decoded = jwt.decode(token) as any;
        const nowSec = Math.floor(Date.now() / 1000);
        const expSec = decoded?.exp || (nowSec + 8 * 3600);
        const ttl = Math.max(1, expSec - nowSec);
        await redisManager.blacklistToken(token, ttl);
      } catch {
        await redisManager.blacklistToken(token, 8 * 3600);
      }
    }

    SIEMLogger.logEvent('LOGOUT_SUCCESS', 'INFO', sourceIp, { userId });
    res.clearCookie('litc_session');
    res.json({ success: true, message: 'Logged out successfully. Token revoked.' });
  }

  // جلب بيانات المستخدم الحالي
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      if (!user || !user.id) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          role: { select: { name: true } },
          department: { select: { name: true } }
        }
      });

      if (!dbUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: dbUser.id,
          email: dbUser.email!,
          fullName: dbUser.fullName!,
          username: dbUser.username,
          mfaEnabled: dbUser.mfaEnabled,
          role: dbUser.role || null,
          department: dbUser.department || null,
        }
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  // محاكي بيئة العمل الحقيقية (Impersonation)
  async impersonate(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUser = (req as any).user;
      const { targetUserId } = req.body;
      const sourceIp = req.ip || req.socket.remoteAddress || 'UNKNOWN';

      if (!targetUserId) {
        return res.status(400).json({ success: false, error: 'targetUserId is required' });
      }

      const result = await AuthService.impersonate(Number(targetUserId));
      
      SIEMLogger.logEvent('IMPERSONATION_STARTED', 'WARNING', sourceIp, { 
        adminId: adminUser.id, 
        targetUserId 
      });

      res.json({
        success: true,
        token: result.token,
        user: result.user
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
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

  // ─── Microsoft Entra ID SSO ───────────────────────────────────────────────
  async microsoftAuth(req: Request, res: Response, next: NextFunction) {
    try {
      const host = req.get('host');
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const redirectUri = `${protocol}://${host}/api/v1/auth/microsoft/callback`;

      const authUrl = await EntraSyncService.getAuthCodeUrl(redirectUri);
      res.redirect(authUrl);
    } catch (error: any) {
      console.error('[Microsoft SSO Error]:', error);
      res.redirect(`/login?error=${encodeURIComponent(error.message || 'فشل الاتصال بخدمة Microsoft SSO')}`);
    }
  }

  async microsoftCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, error, error_description } = req.query;
      const sourceIp = req.ip || req.socket.remoteAddress || 'UNKNOWN';

      if (error) {
        const errorMsg = (error_description as string) || (error as string) || 'تم إلغاء عملية الدخول عبر مايكروسوفت';
        return res.redirect(`/login?error=${encodeURIComponent(errorMsg)}`);
      }

      if (!code || typeof code !== 'string') {
        return res.redirect('/login?error=Invalid_Auth_Code');
      }

      const host = req.get('host');
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const redirectUri = `${protocol}://${host}/api/v1/auth/microsoft/callback`;

      const tokenResponse = await EntraSyncService.acquireTokenByCode(code, redirectUri);
      const claims: any = tokenResponse?.idTokenClaims || {};
      const email = claims.email || claims.preferred_username || claims.upn || tokenResponse?.account?.username;
      const oid = claims.oid || claims.sub || tokenResponse?.account?.homeAccountId?.split('.')[0];
      const name = claims.name || tokenResponse?.account?.name;

      const result = await AuthService.handleMicrosoftLogin({ email, oid, name }, sourceIp);

      // Set HttpOnly Secure Cookie
      res.cookie('litc_session', result.token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      });

      // Deliver token and redirect to application
      const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>جاري تحضير الجلسة...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #f8fafc; }
    .loader { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .spinner { width: 44px; height: 44px; border: 4px solid rgba(255,255,255,0.15); border-top-color: #f36c21; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <div style="font-size: 16px; font-weight: 700;">تم التحقق من هوية مايكروسوفت بنجاح • جاري توجيهك...</div>
  </div>
  <script>
    try {
      localStorage.setItem('litc_token', '${result.token}');
      localStorage.setItem('token', '${result.token}');
      sessionStorage.setItem('litc_token', '${result.token}');
      sessionStorage.setItem('token', '${result.token}');
    } catch (e) {
      console.error(e);
    }
    window.location.href = '/';
  </script>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error: any) {
      console.error('[Microsoft Callback Error]:', error);
      res.redirect(`/login?error=${encodeURIComponent(error.message || 'فشلت المصادقة عبر مايكروسوفت')}`);
    }
  }
}
