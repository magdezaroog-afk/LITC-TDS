import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/client';
import { SIEMLogger } from '../security/SIEMLogger';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET is not set. AuthService cannot operate.');
  process.exit(1);
}

export class AuthService {
  
  static async login(email: string, passwordPlain: string, sourceIp: string) {
    const sanitizedIdentifier = (email || '').trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedIdentifier },
          { username: sanitizedIdentifier },
          { email: sanitizedIdentifier.includes('@') ? sanitizedIdentifier : `${sanitizedIdentifier}@litc.ly` }
        ]
      },
      include: { role: true, department: true }
    });
    if (!user) {
      SIEMLogger.logEvent('LOGIN_FAILED', 'WARNING', sourceIp, { email, reason: 'User not found' });
      throw new Error('بيانات الدخول غير صحيحة أو الحساب غير مسجل.');
    }

    // 1. Permanent Administrative Freeze Check (Zero-Trust)
    if (user.isFrozen) {
      SIEMLogger.logEvent('LOGIN_BLOCKED_FROZEN', 'CRITICAL', sourceIp, { email }, user.id);
      throw new Error('تم تجميد هذا الحساب من قبل إدارة الأمن السيبراني. يرجى مراجعة مسؤول النظام.');
    }

    // 2. Policy 13-1-خ: LITC 3-Attempt Account Lockout Check
    if (user.lockoutEnd && user.lockoutEnd > new Date()) {
      const remainingMins = Math.max(1, Math.ceil((user.lockoutEnd.getTime() - Date.now()) / 60000));
      SIEMLogger.logEvent('LOGIN_BLOCKED_LOCKOUT', 'WARNING', sourceIp, { email, remainingMins }, user.id);
      throw new Error(`تم إقفال الحساب مؤقتاً لتجاوز الحد الأقصى للمحاولات (3 محاولات غير صحيحة) بموجب سياسة أمن المعلومات لشركة LITC (المعيار 13-1-خ). يرجى المحاولة بعد ${remainingMins} دقيقة.`);
    }

    if (!user.password) {
      throw new Error('هذا الحساب مهيأ للدخول الموحد (SSO) فقط. كلمة المرور المحلية معطلة.');
    }

    // 3. Verify Argon2 Password Hash
    const isValid = await argon2.verify(user.password, passwordPlain);
    
    if (!isValid) {
      const currentAttempts = (user.failedAttempts || 0) + 1;
      
      // Enforce Lockout at 3 failed attempts (LITC Policy 13-1-خ)
      if (currentAttempts >= 3) {
        const lockoutDurationMins = 30; // 30 minutes lockout window
        const lockoutEnd = new Date(Date.now() + lockoutDurationMins * 60 * 1000);

        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: currentAttempts, lockoutEnd }
        });

        SIEMLogger.logEvent(
          'ACCOUNT_LOCKED_3_FAILED_ATTEMPTS', 
          'CRITICAL', 
          sourceIp, 
          { email, attempts: currentAttempts, lockoutMinutes: lockoutDurationMins }, 
          user.id
        );

        throw new Error('تم إقفال الحساب مؤقتاً لمدة 30 دقيقة لتجاوز 3 محاولات دخول غير صحيحة بموجب سياسة أمن المعلومات لشركة LITC (المعيار 13-1-خ).');
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { failedAttempts: currentAttempts }
        });

        const remaining = 3 - currentAttempts;
        SIEMLogger.logEvent('LOGIN_FAILED', 'WARNING', sourceIp, { email, attempt: currentAttempts, remainingAttempts: remaining }, user.id);
        throw new Error(`كلمة المرور غير صحيحة. متبقي ${remaining} ${remaining === 1 ? 'محاولة واحدة' : 'محاولتان'} قبل قفل الحساب تلقائياً بموجب سياسة LITC.`);
      }
    }

    // 4. Success: Reset Failed Attempts & Lockout
    if (user.failedAttempts > 0 || user.lockoutEnd) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedAttempts: 0, lockoutEnd: null }
      });
    }

    SIEMLogger.logEvent('LOGIN_SUCCESS', 'INFO', sourceIp, { email }, user.id);

    const token = jwt.sign(
      { id: user.id, roleId: user.roleId, email: user.email },
      JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: { select: { name: true } },
        department: { select: { name: true } }
      }
    });

    const sanitizedUser = {
      id: user.id,
      email: user.email!,
      fullName: user.fullName!,
      username: user.username,
      mfaEnabled: user.mfaEnabled,
      mfaSecret: user.mfaSecret,
      role: userWithRole?.role || null,
      department: userWithRole?.department || null,
    };

    return { token, user: sanitizedUser };
  }

  // محاكي الأدوار: توليد Token بالنيابة عن مستخدم آخر (للأدمن فقط)
  static async impersonate(targetUserId: number) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: { select: { name: true } },
        department: { select: { name: true } }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const token = jwt.sign(
      { id: user.id, roleId: user.roleId, email: user.email },
      JWT_SECRET as string,
      { expiresIn: '2h' }
    );

    const sanitizedUser = {
      id: user.id,
      email: user.email!,
      fullName: user.fullName!,
      username: user.username,
      mfaEnabled: user.mfaEnabled,
      mfaSecret: user.mfaSecret,
      role: user.role || null,
      department: user.department || null,
    };

    return { token, user: sanitizedUser };
  }

  // ─── Microsoft Entra ID JIT Login & Session Provisioning ──────────────────
  static async handleMicrosoftLogin(claims: { email: string; oid?: string; name?: string }, sourceIp: string) {
    const rawEmail = (claims.email || '').toLowerCase().trim();
    if (!rawEmail || !rawEmail.includes('@')) {
      throw new Error('لم يتم استلام بريد إلكتروني صالح من حساب مايكروسوفت.');
    }

    const oid = claims.oid || null;
    const name = claims.name || rawEmail.split('@')[0];

    // Find existing user in database by entraObjectId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          ...(oid ? [{ entraObjectId: oid }] : []),
          { email: rawEmail }
        ]
      },
      include: {
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } }
      }
    });

    // JIT Provisioning if user does not exist in local database
    if (!user) {
      let endUserRole = await prisma.role.findFirst({
        where: { name: { in: ['END_USER', 'Employee', 'EMPLOYEE', 'موظف'] } }
      });
      if (!endUserRole) {
        endUserRole = await prisma.role.findFirst({ orderBy: { id: 'desc' } });
      }
      if (!endUserRole) {
        throw new Error('تعذر العثور على دور وظيفي افتراضي للموظف الجديد.');
      }

      const baseUsername = rawEmail.split('@')[0];
      let username = baseUsername;
      const userWithSameUsername = await prisma.user.findUnique({ where: { username } });
      if (userWithSameUsername) {
        username = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      const created = await prisma.user.create({
        data: {
          username,
          email: rawEmail,
          fullName: name,
          jobTitle: 'موظف مؤسسي',
          entraObjectId: oid,
          tenantDomain: rawEmail.split('@')[1],
          ssoProvider: 'Microsoft_SSO',
          ssoRole: 'EMPLOYEE',
          roleId: endUserRole.id,
          password: null,
          isActive: true,
          isFrozen: false,
          syncStatus: 'synced',
          lastSyncedAt: new Date()
        },
        include: {
          role: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } }
        }
      });
      user = created;

      SIEMLogger.logEvent('MICROSOFT_SSO_JIT_REGISTERED', 'INFO', sourceIp, { userId: user.id, email: user.email }, user.id);
    } else {
      // User exists: verify security freeze status
      if (user.isFrozen || !user.isActive) {
        SIEMLogger.logEvent('LOGIN_BLOCKED_FROZEN_SSO', 'CRITICAL', sourceIp, { userId: user.id, email: user.email }, user.id);
        throw new Error('تم تجميد هذا الحساب من قبل إدارة الأمن السيبراني. يرجى مراجعة مسؤول النظام.');
      }

      // Update telemetry
      await prisma.user.update({
        where: { id: user.id },
        data: {
          entraObjectId: oid || user.entraObjectId,
          tenantDomain: rawEmail.split('@')[1],
          lastSyncedAt: new Date(),
          ssoProvider: 'Microsoft_SSO'
        }
      });
    }

    SIEMLogger.logEvent('LOGIN_SUCCESS_MICROSOFT_SSO', 'INFO', sourceIp, { userId: user.id, email: user.email }, user.id);

    const token = jwt.sign(
      { id: user.id, roleId: user.roleId, email: user.email },
      JWT_SECRET as string,
      { expiresIn: '8h' }
    );

    const sanitizedUser = {
      id: user.id,
      email: user.email!,
      fullName: user.fullName || user.username,
      username: user.username,
      mfaEnabled: user.mfaEnabled,
      role: user.role || null,
      department: user.department || null
    };

    return { token, user: sanitizedUser };
  }
}
