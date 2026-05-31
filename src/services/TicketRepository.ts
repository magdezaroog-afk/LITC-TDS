/**
 * LITC-TS v43.0 - Ticket Repository
 * مستودع البيانات المركزي لإدارة التذاكر: وسيط صارم لتطهير البيانات والتعامل مع فشل الشبكة.
 */

import { SecurityUtils } from '../utils/SecurityUtils';
import { Ticket, WorkflowEngine } from '../engine/workflow/WorkflowEngine';

// ذاكرة تخزين مؤقت احتياطية محلياً لضمان العمل عند انقطاع الاتصال (Fault Tolerance Fallback Cache)
const localFallbackCache = new Map<string, Ticket>();

class TicketRepositoryClass {
  private apiBaseUrl = '/api/v1/tickets';

  /**
   * جلب تفاصيل التذكرة بأمان مع تطهير البيانات والحصانة ضد فشل الشبكة
   */
  public async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${ticketId}`);
      
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.statusText}`);
      }

      const rawTicket = await response.json() as Ticket;
      
      // تطهير البيانات القادمة لمنع Stored XSS قبل تمريرها للنظام
      const sanitizedTicket = SecurityUtils.sanitizeObject<Ticket>(rawTicket);
      
      // تحديث الكاش المحلي للحالات الطارئة
      localFallbackCache.set(ticketId, sanitizedTicket);
      
      return sanitizedTicket;
    } catch (error) {
      console.warn(`[TicketRepository] Server fetch failed for ticket ${ticketId}. Falling back to local cache. Error:`, error);
      
      // الحصانة ضد الفشل: إرجاع النسخة الاحتياطية من الكاش المحلي
      const fallback = localFallbackCache.get(ticketId) || WorkflowEngine.getTicket(ticketId);
      return fallback ? SecurityUtils.sanitizeObject<Ticket>(fallback) : null;
    }
  }

  /**
   * تحديث أو تحويل حالة تذكرة بأمان تام مع إدراج الترويسات الأمنية والتطهير المسبق
   */
  public async updateTicketStatus(
    ticketId: string,
    targetStateId: number,
    version: number,
    userId: string,
    authToken: string
  ): Promise<Ticket | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/${ticketId}/transitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'x-user-id': userId
        },
        body: JSON.stringify({ targetStateId, version })
      });

      if (!response.ok) {
        // إذا كان خطأ تعارض تزامني (409) أو صلاحيات (403)
        throw new Error(`Transition failed with status: ${response.status}`);
      }

      const rawTicket = await response.json() as Ticket;
      const sanitizedTicket = SecurityUtils.sanitizeObject<Ticket>(rawTicket);
      
      // تحديث الكاش المحلي
      localFallbackCache.set(ticketId, sanitizedTicket);
      return sanitizedTicket;
    } catch (error) {
      console.error(`[TicketRepository] Transition failed for ticket ${ticketId}:`, error);
      
      // في حالة انقطاع الاتصال المفاجئ، لا ينهار النظام بل يتم الحفاظ على الحالة الحالية بالكاش المحلي لإظهارها
      const fallback = localFallbackCache.get(ticketId) || WorkflowEngine.getTicket(ticketId);
      if (fallback) {
        return SecurityUtils.sanitizeObject<Ticket>(fallback);
      }
      throw error; // دع الخطأ ينتقل للـ ErrorBoundary المركزي ليعالجه
    }
  }

  /**
   * حفظ التذكرة محلياً لتهيئة الكاش
   */
  public cacheTicket(ticket: Ticket): void {
    const sanitized = SecurityUtils.sanitizeObject<Ticket>(ticket);
    localFallbackCache.set(ticket.id, sanitized);
    WorkflowEngine.saveTicket(sanitized);
  }

  /**
   * إنشاء تذكرة جديدة مع تطهير البيانات وحفظها بالكاش وقاعدة بيانات المحرك
   */
  public async createTicket(
    ticketData: Omit<Ticket, 'id' | 'version' | 'workflowPath'>
  ): Promise<Ticket> {
    try {
      const sanitizedData = SecurityUtils.sanitizeObject(ticketData);
      const newTicket: Ticket = {
        ...sanitizedData,
        id: `TKT-${Date.now()}`,
        version: 1,
        workflowPath: []
      } as Ticket;
      
      this.cacheTicket(newTicket);
      return newTicket;
    } catch (error) {
      console.error('[TicketRepository] createTicket failed:', error);
      throw error;
    }
  }

  /**
   * تفريغ الكاش الموك
   */
  public clearCache(): void {
    localFallbackCache.clear();
  }
}

export const TicketRepository = Object.freeze(new TicketRepositoryClass());
