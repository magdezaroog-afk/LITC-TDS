/**
 * LITC-TS v43.0 - System Observer
 * نظام المراقبة المركزي: لتسجيل أداء المكونات ورصد أزمنة التحميل (Latency Tracking) وحصر أخطاء الانهيار.
 * مصمم ليكون خفيف الوزن (Zero-Performance Impact) باستخدام الجدولة غير المتزامنة.
 */

export interface RenderLog {
  componentId: string;
  durationMs: number;
  timestamp: number;
}

export interface ErrorLog {
  componentId: string;
  errorName: string;
  errorMessage: string;
  stack?: string;
  timestamp: number;
}

class SystemObserverClass {
  private renderLogs: RenderLog[] = [];
  private errorLogs: ErrorLog[] = [];

  /**
   * تسجيل عملية بناء ورسم المكون ومعدل الاستغراق الزمني (الكمون)
   */
  public logRender(componentId: string, duration: number): void {
    // تشغيل غير متزامن لتفادي حظر الواجهة الرئيسية
    setTimeout(() => {
      const logEntry: RenderLog = {
        componentId,
        durationMs: duration,
        timestamp: Date.now()
      };
      this.renderLogs.push(logEntry);
      
      // طباعة السجل لأغراض التطوير والمراقبة الفورية
      console.log(`[Observer - RENDER] Component: "${componentId}" | Duration: ${duration.toFixed(2)}ms`);
      
      // حد أقصى لذاكرة التخزين المؤقت للسجلات لتجنب امتلاء الذاكرة
      if (this.renderLogs.length > 1000) {
        this.renderLogs.shift();
      }
    }, 0);
  }

  /**
   * تسجيل الأخطاء التي يتم التقاطها عبر ErrorBoundary في سجل الأخطاء المركزي
   */
  public logError(componentId: string, error: Error): void {
    setTimeout(() => {
      const logEntry: ErrorLog = {
        componentId,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        timestamp: Date.now()
      };
      this.errorLogs.push(logEntry);
      
      console.error(`[Observer - CRASH] Component "${componentId}" failed: ${error.name} - ${error.message}`);
      
      if (this.errorLogs.length > 500) {
        this.errorLogs.shift();
      }
    }, 0);
  }

  /**
   * جلب السجلات المخزنة (مستقبلاً يتم إرسالها دورياً إلى لوحة مراقبة مركزية)
   */
  public getRenderLogs(): RenderLog[] {
    return this.renderLogs;
  }

  public getErrorLogs(): ErrorLog[] {
    return this.errorLogs;
  }
}

export const SystemObserver = new SystemObserverClass();
