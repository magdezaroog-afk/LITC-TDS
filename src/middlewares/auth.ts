import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { SIEMLogger } from '../backend/security/SIEMLogger';
import { redisManager } from '../backend/infrastructure/RedisClient';
import { prisma } from '../db/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    roleId: number;
    role?: string;
    departmentId?: number | null;
    email?: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is not set in environment variables. Server cannot start securely.');
  process.exit(1);
}

export const authMiddleware = async (
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

  // 5. Zero-Trust Token Blacklist Check (Redis + In-Memory Fallback)
  const isRevoked = await redisManager.isTokenBlacklisted(token);
  if (isRevoked) {
    SIEMLogger.logEvent('REVOKED_TOKEN_ACCESS_ATTEMPT', 'WARNING', sourceIp, { url: req.url, method: req.method });
    return res.status(401).json({ success: false, error: 'Unauthorized: Session terminated or token revoked.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as any;

    // 6. Real-time Account Status Check (Guards against frozen/suspended accounts)
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { 
        id: true, 
        roleId: true, 
        email: true, 
        isActive: true, 
        isFrozen: true,
        departmentId: true,
        role: { select: { name: true } }
      }
    });

    if (!dbUser || !dbUser.isActive || dbUser.isFrozen) {
      SIEMLogger.logEvent('FROZEN_USER_ACCESS_BLOCKED', 'CRITICAL', sourceIp, { userId: decoded.id, url: req.url });
      return res.status(401).json({ success: false, error: 'Unauthorized: Account is suspended or frozen.' });
    }

    req.user = {
      id: dbUser.id,
      roleId: dbUser.roleId,
      role: dbUser.role?.name,
      departmentId: dbUser.departmentId,
      email: dbUser.email || undefined
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
export const optionalAuthMiddleware = async (
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
      const isRevoked = await redisManager.isTokenBlacklisted(token);
      if (!isRevoked) {
        const decoded = jwt.verify(token, JWT_SECRET as string) as any;
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { 
            id: true, 
            roleId: true, 
            email: true, 
            isActive: true, 
            isFrozen: true,
            departmentId: true,
            role: { select: { name: true } }
          }
        });
        if (dbUser && dbUser.isActive && !dbUser.isFrozen) {
          req.user = { 
            id: dbUser.id, 
            roleId: dbUser.roleId, 
            role: dbUser.role?.name,
            departmentId: dbUser.departmentId,
            email: dbUser.email || undefined 
          };
        }
      }
    } catch {
      // Ignored for optional auth
    }
  }

  next();
};
