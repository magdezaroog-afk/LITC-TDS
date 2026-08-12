import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SIEMLogger } from '../backend/security/SIEMLogger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    roleId: number;
    email?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_LITC_ENTERPRISE_KEY_2026';

export const authMiddleware = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const sourceIp = req.ip || req.socket.remoteAddress;

  // 1. Look for token in HttpOnly Cookie (Primary Secure Method)
  let token = req.cookies?.litc_session;

  // 2. Fallback to Bearer token in Authorization header (For API / Postman)
  if (!token && req.headers['authorization']?.startsWith('Bearer ')) {
    token = req.headers['authorization'].substring(7);
  }

  // 3. System Override for local CLI testing (Optional: disable in production)
  if (!token && req.headers['x-user-id']) {
    req.user = {
      id: parseInt(req.headers['x-user-id'] as string, 10),
      roleId: parseInt(req.headers['x-role-id'] as string || '1', 10)
    };
    return next();
  }

  if (!token) {
    console.error('[Auth] Token missing completely');
    SIEMLogger.logEvent('UNAUTHORIZED_ACCESS_ATTEMPT', 'INFO', sourceIp, { url: req.url });
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      roleId: decoded.roleId,
      email: decoded.email
    };
    next();
  } catch (error: any) {
    console.error('[Auth] Token validation failed!', error.message, 'Token received:', token);
    SIEMLogger.logEvent('INVALID_TOKEN_ATTEMPT', 'WARNING', sourceIp, { url: req.url });
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token.' });
  }
};
