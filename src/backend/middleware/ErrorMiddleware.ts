/**
 * LITC-TS v43.0 - Global Error Middleware
 * وسيط معالجة الأخطاء المركزي المعزول والآمن لحماية خوادم النظام من تسريب البيانات.
 */

import { Request, Response, NextFunction } from 'express';
import { WorkflowViolationError } from '../controllers/DatabaseController';

/**
 * وسيط معالجة الأخطاء الشامل والمجمد أمنياً
 */
const errorMiddlewareHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // 1. التدوين الأمني الصارم بسجلات السيرفر مع طابع زمني دقيق
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [SERVER_ERROR_MONITOR] Unhandled Exception:`, err);

  // 2. التقاط وحوكمة استثناءات خرق العمليات (WorkflowViolationError)
  if (err instanceof WorkflowViolationError || (err && err.name === 'WorkflowViolationError')) {
    res.status(409).json({
      status: 'error',
      statusCode: 409,
      errorName: 'WorkflowViolationError',
      message: err.message
    });
    return;
  }

  // 3. حجب تفاصيل الإنتاج لمنع استغلال الثغرات البرمجية (Production Masking)
  res.status(500).json({
    status: 'error',
    statusCode: 500,
    errorName: 'InternalServerError',
    message: 'Internal Server Error - Transaction Blocked'
  });
};

// التجميد البرمجي لمنع التعديل أثناء التشغيل (Runtime Immutability)
export const ErrorMiddleware = Object.freeze(errorMiddlewareHandler);
