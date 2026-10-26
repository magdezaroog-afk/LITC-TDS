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

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is not set in environment variables. Server cannot start securely.');
  process.exit(1);
}

export const authMiddleware = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  const sourceIp = req.ip || req.socket.remoteAddress;

  // 1. Prioritize Authorization Bearer header
  let token: string | undefined;
  if (req.headers['authorization']?.startsWith('Bearer ')) {
    token = req.headers['authorization'].substring(7).trim();
  }

  // 2. Fallback to x-auth-token header
  if (!token && req.headers['x-auth-token']) {
    token = (req.headers['x-auth-token'] as string).trim();
  }

  // 3. Fallback to HttpOnly litc_session Cookie
  if (!token && req.cookies?.litc_session) {
    token = req.cookies.litc_session;
  }

  // 4. Strict Validation: Reject if no token is present
  if (!token) {
    SIEMLogger.logEvent('UNAUTHORIZED_ACCESS_ATTEMPT', 'INFO', sourceIp, { url: req.url, method: req.method });
    return res.status(401).json({ success: false, error: 'Unauthorized: Missing or invalid authentication token.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as any;
    req.user = {
      id: decoded.id,
      roleId: decoded.roleId,
      email: decoded.email
    };
    next();
  } catch (error: any) {
    SIEMLogger.logEvent('INVALID_TOKEN_ATTEMPT', 'WARNING', sourceIp, { url: req.url, method: req.method, error: error.message });
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired token.' });
  }
};

/**
 * Optional Auth Middleware:
 * If a valid token is provided, attaches req.user.
 * If no token is provided or invalid, proceeds without failing with 401.
 * Useful for public catalogs and configuration endpoints needed by employee portal.
 */
export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined;
  if (req.headers['authorization']?.startsWith('Bearer ')) {
    token = req.headers['authorization'].substring(7).trim();
  } else if (req.headers['x-auth-token']) {
    token = (req.headers['x-auth-token'] as string).trim();
  } else if (req.cookies?.litc_session) {
    token = req.cookies.litc_session;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET as string) as any;
      req.user = { id: decoded.id, roleId: decoded.roleId, email: decoded.email };
    } catch {
      // Ignored for optional auth
    }
  }

  next();
};

