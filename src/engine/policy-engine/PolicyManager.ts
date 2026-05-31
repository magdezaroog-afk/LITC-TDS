/**
 * LITC-TS v43.0 - Secure Policy Engine
 * هذا المحرك يطبق السياسات الأمنية بشكل مركزي وصارم.
 */

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

export class PolicyManager {
  /**
   * التحقق من صلاحية الإسناد مع تسجيل السجلات الأمنية
   */
  public static canAssign(targetDept: string, ticketDept: string): PolicyResult {
    if (!targetDept || !ticketDept) {
      return { allowed: false, reason: 'INVALID_INPUT_PARAMETERS' };
    }

    const isAuthorized = targetDept === ticketDept;

    if (!isAuthorized) {
      // تسجيل محاولة الاختراق (هذا الجزء يربط النظام لاحقاً بنظام الرقابة)
      console.error(`SECURITY_ALERT: Unauthorized assignment attempt. Target: ${targetDept}, Ticket: ${ticketDept}`);
      return { allowed: false, reason: 'DEPARTMENT_MISMATCH' };
    }

    return { allowed: true };
  }
}
