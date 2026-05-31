import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    roleId: number;
  };
}

export const authMiddleware = (
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) => {
  // 1. Support custom headers for easy local testing and script simulations
  const userIdHeader = req.headers['x-user-id'];
  const roleIdHeader = req.headers['x-role-id'];

  if (userIdHeader && roleIdHeader) {
    req.user = {
      id: parseInt(userIdHeader as string, 10),
      roleId: parseInt(roleIdHeader as string, 10)
    };
    return next();
  }

  // 2. Standard Bearer JWT token simulation
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    
    // Simulate token decoding
    if (token.startsWith('mock_jwt_token_user_')) {
      const parts = token.split('_');
      const userId = parseInt(parts[4], 10);
      const roleId = parseInt(parts[5], 10);
      req.user = { id: userId, roleId: roleId };
      return next();
    }
    
    if (token === 'system_token_123') {
      req.user = { id: 1, roleId: 1 };
      return next();
    }
  }

  // 3. Reject request if no credentials found
  return res.status(401).json({
    status: 'error',
    statusCode: 401,
    message: 'Unauthorized: Missing or invalid authentication credentials.'
  });
};
