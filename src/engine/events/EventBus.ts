/**
 * LITC-TS v43.0 - Event Bus (Pub/Sub)
 * ناقل الأحداث المركزي لتسهيل الاتصال غير المباشر وتفادي الاقتران الشديد بين المكونات.
 */

type EventCallback = (data: any) => void;

class EventBusClass {
  private listeners: Record<string, EventCallback[]> = {};

  /**
   * الاشتراك للاستماع لحدث معين
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * إلغاء الاشتراك من حدث معين لمنع تسرب الذاكرة (Memory Leaks)
   */
  public off(event: string, callback: EventCallback): void {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      (listener) => listener !== callback
    );
  }

  /**
   * إرسال وإطلاق حدث لجميع المستمعين له
   */
  public emit(event: string, data?: any): void {
    if (!this.listeners[event]) return;
    
    // عمل نسخة من المستمعين لتجنب المشاكل في حال إلغاء الاشتراك أثناء الإطلاق
    const targets = [...this.listeners[event]];
    targets.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in callback for event "${event}":`, error);
      }
    });
  }

  /**
   * تنظيف كافة المستمعين لحدث معين أو تنظيف الناقل بالكامل
   */
  public clear(event?: string): void {
    if (event) {
      delete this.listeners[event];
    } else {
      this.listeners = {};
    }
  }
}

export const EventBus = new EventBusClass();
