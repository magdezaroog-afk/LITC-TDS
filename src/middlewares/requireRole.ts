import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { SIEMLogger } from '../backend/security/SIEMLogger';

export const requireRole = (allowedRoleIds: number[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.roleId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No role assigned.' });
    }

    if (!allowedRoleIds.includes(req.user.roleId)) {
      const sourceIp = req.ip || req.socket.remoteAddress;
      SIEMLogger.logEvent(
        'RBAC_VIOLATION_ATTEMPT',
        'WARNING',
        sourceIp,
        { url: req.url, userRoleId: req.user.roleId, requiredRoleIds: allowedRoleIds, method: req.method },
        req.user.id
      );
      return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission to access this resource.' });
    }
    next();
  };
};
