import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/client';
import { SIEMLogger } from '../security/SIEMLogger';

const JWT_SECRET = process.env.JWT_SECRET || 'SUPER_SECRET_LITC_ENTERPRISE_KEY_2026';

export class AuthService {
  
  static async login(email: string, passwordPlain: string, sourceIp: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      SIEMLogger.logEvent('LOGIN_FAILED', 'WARNING', sourceIp, { email, reason: 'User not found' });
      throw new Error('Invalid credentials');
    }

    if (user.isFrozen) {
      SIEMLogger.logEvent('LOGIN_BLOCKED_FROZEN', 'CRITICAL', sourceIp, { email }, user.id);
      throw new Error('Account is frozen');
    }

    if (!user.password) {
      throw new Error('User relies on SSO, password login disabled');
    }

    const isValid = await argon2.verify(user.password, passwordPlain);
    if (!isValid) {
      SIEMLogger.logEvent('LOGIN_FAILED', 'WARNING', sourceIp, { email, reason: 'Invalid password' }, user.id);
      throw new Error('Invalid credentials');
    }

    SIEMLogger.logEvent('LOGIN_SUCCESS', 'INFO', sourceIp, { email }, user.id);

    const token = jwt.sign(
      { id: user.id, roleId: user.roleId, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const sanitizedUser = {
      id: user.id,
      email: user.email!,
      fullName: user.fullName!,
      mfaEnabled: user.mfaEnabled,
      mfaSecret: user.mfaSecret
    };

    return { token, user: sanitizedUser };
  }
}
