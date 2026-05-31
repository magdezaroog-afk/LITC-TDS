/**
 * LITC-TS v43.0 - Security Utilities
 * أدوات الأمان وتطهير البيانات لمنع هجمات XSS وحقن النصوص.
 */

export const SecurityUtils = {
  /**
   * تطهير المدخلات النصية لمنع حقن نصوص HTML أو سكربتات خبيثة (XSS Prevention)
   */
  sanitize: (input: string): string => {
    if (typeof input !== 'string') return '';
    
    // استبدال الرموز الخاصة بـ HTML لتعطيل تفسيرها كأكواد برمجية
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * تطهير الكائنات بشكل متداخل (Recursive Object Sanitization)
   */
  sanitizeObject: <T>(obj: T): T => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => SecurityUtils.sanitizeObject(item)) as any;
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = (obj as any)[key];
        if (typeof val === 'string') {
          sanitized[key] = SecurityUtils.sanitize(val);
        } else if (typeof val === 'object') {
          sanitized[key] = SecurityUtils.sanitizeObject(val);
        } else {
          sanitized[key] = val;
        }
      }
    }
    return sanitized as T;
  }
};
