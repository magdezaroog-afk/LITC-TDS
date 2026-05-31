/**
 * LITC-TS v43.0 - API Client
 * خدمة الاتصال لجلب إعدادات الصفحات والمكونات.
 */

import { PageLayout } from '../types/component.types';

export const ApiClient = {
  getPageLayout: async (pageId: string): Promise<PageLayout | null> => {
    try {
      // مستقبلاً، هنا سيتم استبدال هذا الرابط برابط الـ API الفعلي الخاص بك
      const response = await fetch(`/api/layout/${pageId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch layout: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API_CLIENT_ERROR:', error);
      return null; // نعيد null لمنع انهيار الواجهة
    }
  }
};
