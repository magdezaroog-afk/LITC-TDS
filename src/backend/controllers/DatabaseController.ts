/**
 * LITC-TS v43.4 - Database Controller
 * الطبقة المركزية للاتصال بقاعدة بيانات SQL Server والتحكم بالمعاملات وإدارة الأخطاء.
 * المرحلة v43.2: تضمين سياسة إعادة المحاولة الذكية للأعطال العابرة + Health Check Endpoint.
 * المرحلة v43.3: Tri-State Circuit Breaker + InMemoryQueue + Auto-Flush Engine.
 * المرحلة v43.4: توسيع Telemetry API الكامل + Manual Override لقاطع الدائرة في حالات الطوارئ.
 */

import { Request, Response, NextFunction } from 'express';
import sql from 'mssql';
import { RealTimeSynchronizer } from '../../services/RealTimeSynchronizer';
import { prisma } from '../../db/client';
import { FieldDefinition, FieldType } from '../../types/dynamicFields';
import { NotificationEngine } from '../services/NotificationEngine';

// 1. إعداد الاتصال الآمن (Secure Connection Pool Configuration)
const dbConfig: sql.config = {
  user: 'sa',
  password: '11224433', // الصلاحيات الموثقة
  server: '127.0.0.1',   // الاتصال بالـ IP المباشر لمنع ETIMEOUT
  port: 1433,            // المنفذ الافتراضي
  database: 'LITC_TS_v43',
  options: {
    encrypt: true,                  // تفعيل التشفير الآمن
    trustServerCertificate: true,   // السماح بالشهادات الموقعة ذاتياً في البيئة المحلية
  },
  pool: {
    max: 20,                        // حد أقصى للقنوات لمنع استهلاك الذاكرة
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool: sql.ConnectionPool | null = null;

/**
 * دالة الحصول على حوض الاتصال المشترك (Singleton Connection Pool)
 */
async function getPool(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }
  pool = await new sql.ConnectionPool(dbConfig).connect();
  return pool;
}

/**
 * سياسة إعادة المحاولة الذكية للأعطال العابرة (Transient Fault Retry Policy)
 * تعيد تنفيذ الدالة الممررة تلقائياً حتى 3 مرات بفواصل زمنية متصاعدة:
 * محاولة 1: فوراً، محاولة 2: 200ms، محاولة 3: 500ms، محاولة 4: 1000ms
 * قبل تمرير الخطأ النهائي للطبقة الأعلى.
 */
const RETRY_DELAYS_MS = [200, 500, 1000];

// =========================================================================
// سجل الحوكمة والأحداث الطارئة (Sovereign Governance Ledger)
// =========================================================================
export interface GovernanceAuditLogEntry {
  logId?: string;
  actionBy: string;
  eventType: string;
  timestampMs: number;
  createdAt?: string;
}

/* Dynamic UI Fields In-Memory Map */
const dynamicFieldsMap: Record<string, FieldDefinition[]> = {};

/**
 * Retrieve custom UI fields for a department (runtime).
 */
export async function executeGetDynamicFields(departmentId: string): Promise<FieldDefinition[]> {
  const fields = dynamicFieldsMap[departmentId] ?? [];
  // Deep-freeze returned configuration to block Prototype Pollution
  return Object.freeze(fields.map(f => Object.freeze({
    fieldId: String(f.fieldId),
    type: f.type as FieldType,
    label: String(f.label),
    placeholder: f.placeholder ? String(f.placeholder) : undefined,
    required: Boolean(f.required),
    options: f.options ? Object.freeze(f.options.map(String)) : undefined
  }))) as unknown as FieldDefinition[];
}

/**
 * Set/Update custom UI fields for a department (runtime) and broadcast the change.
 */
export async function executeSetDynamicFields(departmentId: string, fields: FieldDefinition[]): Promise<void> {
  // Prevent Prototype Pollution by sanitizing and deep-freezing elements:
  const sanitized = fields.map(f => {
    const clean = {
      fieldId: String(f.fieldId),
      type: f.type as FieldType,
      label: String(f.label),
      placeholder: f.placeholder ? String(f.placeholder) : undefined,
      required: Boolean(f.required),
      options: f.options ? f.options.map(String) : undefined
    };
    return Object.freeze(clean);
  });
  dynamicFieldsMap[departmentId] = Object.freeze(sanitized) as unknown as FieldDefinition[];
  // Broadcast the updated config to interested clients via RealTimeSynchronizer
  RealTimeSynchronizer.broadcast('CONFIG_UPDATED', { 
    ServiceType: departmentId,
    departmentId, 
    fields: dynamicFieldsMap[departmentId] 
  });
}


const inMemoryGovernanceLogs: GovernanceAuditLogEntry[] = [];

/**
 * تسجيل الأحداث الحركية السيادية فوراً وبشكل غير متزامن لضمان عدم تأثر سرعة استجابة النظام
 */
export function logGovernanceEventAsync(eventType: string, actionBy: string): void {
  const timestampMs = Date.now();
  const entry: GovernanceAuditLogEntry = {
    actionBy,
    eventType,
    timestampMs,
    createdAt: new Date().toISOString()
  };

  // حفر الحدث فورياً في البافر المحلي (محدود بـ 50 عنصر) كبديل متين ومضاد للأعطال رنتايم
  inMemoryGovernanceLogs.unshift(entry);
  if (inMemoryGovernanceLogs.length > 50) {
    inMemoryGovernanceLogs.pop();
  }

  // تسجيل غير متزامن وغير معطل في قاعدة البيانات
  (async () => {
    try {
      const activePool = await getPool();
      const request = activePool.request();
      request.input('ActionBy', sql.NVarChar(150), actionBy);
      request.input('EventType', sql.NVarChar(100), eventType);
      request.input('TimestampMs', sql.BigInt, timestampMs);

      await request.query(`
        INSERT INTO dbo.GovernanceAuditLogs (ActionBy, EventType, TimestampMs)
        VALUES (@ActionBy, @EventType, @TimestampMs)
      `);
      console.log(`[GovernanceLedger] Successfully logged event "${eventType}" asynchronously.`);
    } catch (err: any) {
      console.warn(`[GovernanceLedger] Background SQL logging bypassed (using memory buffer):`, err.message);
    }
  })();
}

// =========================================================================
// قاطع الدائرة الثلاثي (Tri-State Circuit Breaker) — Module-Scope Variables
// يتجنب الـ Prototype Pollution بالكامل إذ لا يُخزن شيء على الكلاس المجمد.
// =========================================================================

/** نوع حالات قاطع الدائرة السيادي */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

/** الحالة الحالية للقاطع — تبدأ CLOSED (الاتصال سليم) */
let circuitState: CircuitState = 'CLOSED';

/** عداد الإخفاقات المتتالية التي استنفدت كل محاولات الـ Retry */
let consecutiveExhaustedFailures = 0;

/** الحد الأقصى للإخفاقات المتتالية قبل الانتقال إلى OPEN */
const CIRCUIT_OPEN_THRESHOLD = 3;

/** مؤقت إعادة الفحص — يُطلق انتقال OPEN → HALF-OPEN بعد 30 ثانية */
let circuitHalfOpenTimerId: NodeJS.Timeout | null = null;

/** الوقت الافتراضي قبل إعادة الفحص (بالميلي ثانية) */
const HALF_OPEN_DELAY_MS = 30_000;

/** طابع زمن آخر تحول للحالة OPEN */
let circuitOpenedAt: string | null = null;

// =========================================================================
// طابور العمليات المعلقة (InMemoryQueue) — FIFO
// =========================================================================

/** نوع العملية المعلقة في الطابور */
export interface QueuedOperation {
  id: string;           // معرف فريد للعملية
  type: string;         // نوع العملية (TRANSFER_TICKET, BROADCAST_CONFIG, إلخ)
  payload: any;         // البيانات الكاملة للعملية
  enqueuedAt: string;   // طابع زمن الإضافة
  retries: number;      // عدد محاولات التنفيذ بعد الـ Flush
}

/** مصفوفة الطابور الداخلي في الذاكرة */
const inMemoryQueue: QueuedOperation[] = [];

/** علامة لمنع تشغيل أكثر من flush متزامن واحد */
let isFlushing = false;

/** EventBus للإشعارات — سيُحقن لاحقاً بعد تهيئة المحرك */
let _EventBus: { emit: (event: string, data: any) => void } | null = null;

/**
 * تهيئة مرجع EventBus لاستخدامه داخل وظائف الموديول
 * يُستدعى مرة واحدة من داخل DatabaseControllerClass
 */
function initEventBus(bus: { emit: (event: string, data: any) => void }): void {
  _EventBus = bus;
}

/**
 * إشعار الـ EventBus بتغيير حالة قاطع الدائرة
 */
function emitCircuitState(state: CircuitState, reason?: string): void {
  if (_EventBus) {
    _EventBus.emit('CIRCUIT_BREAKER_STATE_CHANGED', {
      state,
      reason: reason || '',
      timestamp: new Date().toISOString(),
      queueSize: inMemoryQueue.length
    });
  }
  console.log(`[CircuitBreaker] State → ${state}${reason ? ` (${reason})` : ''} | Queue: ${inMemoryQueue.length}`);
}

/**
 * الانتقال الآمن بين حالات قاطع الدائرة
 */
function transitionCircuit(to: CircuitState, reason?: string): void {
  if (circuitState === to) return; // لا تغيير — تجنب الإشعارات الزائدة

  const from = circuitState;
  circuitState = to;

  if (to === 'OPEN') {
    circuitOpenedAt = new Date().toISOString();
    consecutiveExhaustedFailures = 0; // إعادة العداد بعد الانتقال

    // جدولة الانتقال التلقائي OPEN → HALF-OPEN بعد 30 ثانية
    if (circuitHalfOpenTimerId) clearTimeout(circuitHalfOpenTimerId);
    circuitHalfOpenTimerId = setTimeout(() => {
      transitionCircuit('HALF-OPEN', 'Probe window opened after 30s cooldown');
    }, HALF_OPEN_DELAY_MS);

    // تسجيل تحول الدائرة التلقائي في سجل الأزمات السيادي (إذا لم يكن بطلب تجاوز يدوي)
    if (!reason || !reason.includes('Manual Override')) {
      logGovernanceEventAsync('AUTOMATIC_CIRCUIT_OPEN', 'SYSTEM');
    }

  } else if (to === 'CLOSED') {
    // نجح الاتصال — تطهير العداد والمؤقت
    consecutiveExhaustedFailures = 0;
    circuitOpenedAt = null;
    if (circuitHalfOpenTimerId) {
      clearTimeout(circuitHalfOpenTimerId);
      circuitHalfOpenTimerId = null;
    }
  } else if (to === 'HALF-OPEN') {
    if (circuitHalfOpenTimerId) {
      clearTimeout(circuitHalfOpenTimerId);
      circuitHalfOpenTimerId = null;
    }
  }

  console.log(`[CircuitBreaker] Transition: ${from} → ${to}`);
  emitCircuitState(to, reason);
}

/**
 * تسجيل إخفاق استنفد كل محاولات الـ Retry
 * إذا تكرر CIRCUIT_OPEN_THRESHOLD مرات → انتقال إلى OPEN
 */
function recordExhaustedFailure(label: string): void {
  if (circuitState === 'OPEN') return; // مفتوح بالفعل — لا حاجة للإحصاء

  consecutiveExhaustedFailures++;
  console.warn(
    `[CircuitBreaker] Exhausted failure #${consecutiveExhaustedFailures}/${CIRCUIT_OPEN_THRESHOLD} for "${label}"."`
  );

  if (consecutiveExhaustedFailures >= CIRCUIT_OPEN_THRESHOLD) {
    transitionCircuit(
      'OPEN',
      `${CIRCUIT_OPEN_THRESHOLD} consecutive fully-exhausted failures in "${label}". DB protection activated.`
    );
  }
}

/**
 * تسجيل نجاح العملية — يعيد الدائرة إلى CLOSED إذا كانت HALF-OPEN
 */
function recordSuccess(label: string): void {
  if (circuitState === 'HALF-OPEN') {
    transitionCircuit('CLOSED', `Probe succeeded for "${label}". Circuit restored.`);
    // تشغيل الـ Auto-Flush بعد استعادة الاتصال
    scheduleAutoFlush();
  } else if (circuitState === 'CLOSED') {
    // استعادة بعد إخفاقات غير متتالية — تطهير العداد
    consecutiveExhaustedFailures = 0;
  }
}

/**
 * إضافة عملية معلقة للطابور أثناء حالة OPEN
 */
export function enqueueOperation(type: string, payload: any): QueuedOperation {
  const op: QueuedOperation = {
    id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    enqueuedAt: new Date().toISOString(),
    retries: 0
  };
  inMemoryQueue.push(op);
  console.log(`[InMemoryQueue] Enqueued operation: ${op.type} (id=${op.id}). Queue size: ${inMemoryQueue.length}`);
  emitCircuitState(circuitState, `Operation queued: ${type}`);
  return op;
}

/**
 * محرك الحقن التلقائي (Auto-Flush Engine)
 * يُشغَّل تلقائياً عند انتقال الدائرة من OPEN إلى CLOSED.
 * يسحب العمليات المعلقة بالتسلسل الصارم (FIFO) ويُنفذها.
 */
const FLUSH_EXECUTOR_MAP: Record<string, (payload: any) => Promise<void>> = {};

/**
 * تسجيل منفذ لنوع عملية معين في محرك الـ Auto-Flush
 */
export function registerFlushExecutor(type: string, executor: (payload: any) => Promise<void>): void {
  FLUSH_EXECUTOR_MAP[type] = executor;
}

/**
 * جدولة الـ Auto-Flush في الـ Event Loop التالي (non-blocking)
 */
function scheduleAutoFlush(): void {
  if (isFlushing || inMemoryQueue.length === 0) return;
  // استخدام setImmediate لعدم تعطيل دورة الـ Event Loop
  setImmediate(() => flushQueue());
}

/**
 * تنفيذ الـ Auto-Flush: سحب العمليات وتنفيذها FIFO
 */
async function flushQueue(): Promise<void> {
  if (isFlushing || circuitState !== 'CLOSED') return;
  isFlushing = true;

  console.log(`[AutoFlush] Starting queue flush. ${inMemoryQueue.length} operation(s) pending.`);

  let flushedCount = 0;
  let failedCount = 0;

  while (inMemoryQueue.length > 0 && circuitState === 'CLOSED') {
    const op = inMemoryQueue.shift()!; // FIFO — أخذ أول عملية
    const executor = FLUSH_EXECUTOR_MAP[op.type];

    if (!executor) {
      console.warn(`[AutoFlush] No executor registered for operation type: "${op.type}". Discarding.`);
      failedCount++;
      continue;
    }

    try {
      op.retries++;
      await executor(op.payload);
      flushedCount++;
      console.log(`[AutoFlush] ✓ Flushed: ${op.type} (id=${op.id}) | Remaining: ${inMemoryQueue.length}`);
    } catch (err: any) {
      failedCount++;
      console.error(`[AutoFlush] ✗ Failed to flush: ${op.type} (id=${op.id}):`, err?.message);
      // إعادة العملية للطابور إذا فشلت
      inMemoryQueue.unshift(op);
      break; // وقف الـ Flush — سيحاول مرة أخرى عند الاتصال التالي
    }
  }

  isFlushing = false;
  console.log(`[AutoFlush] Complete. Flushed: ${flushedCount}, Failed: ${failedCount}, Remaining: ${inMemoryQueue.length}`);

  // تسجيل اكتمال إفراغ الطابور بنجاح في سجل الأزمات السيادي
  if (flushedCount > 0) {
    logGovernanceEventAsync('AUTO_FLUSH_COMPLETED', 'SYSTEM');
  }

  if (_EventBus) {
    _EventBus.emit('QUEUE_FLUSHED', {
      flushedCount,
      failedCount,
      remaining: inMemoryQueue.length,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * الحصول على نسخة للقراءة فقط من حالة النظام السيادي (للاختبارات والـ API)
 */
export function getCircuitBreakerSnapshot(): {
  state: CircuitState;
  consecutiveExhaustedFailures: number;
  queueSize: number;
  openedAt: string | null;
} {
  return {
    state: circuitState,
    consecutiveExhaustedFailures,
    queueSize: inMemoryQueue.length,
    openedAt: circuitOpenedAt
  };
}

async function withRetry<T>(operation: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const result = await operation();
      recordSuccess(label); // إشعار قاطع الدائرة بالنجاح
      return result;
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.code === 'ECONNRESET' ||
        err?.code === 'ETIMEOUT' ||
        err?.code === 'ESOCKET' ||
        err?.number === 1205 || // SQL Server deadlock
        err?.number === -2 ||   // SQL Server timeout
        (typeof err?.message === 'string' && (
          err.message.includes('ECONNRESET') ||
          err.message.includes('ETIMEDOUT') ||
          err.message.includes('Connection lost') ||
          err.message.includes('socket hang up')
        ));

      if (isTransient && attempt < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[attempt];
        console.warn(
          `[DatabaseController - RetryPolicy] Transient fault in "${label}". ` +
          `Attempt ${attempt + 1}/${RETRY_DELAYS_MS.length}. Retrying in ${delay}ms...`,
          err?.code || err?.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        if (attempt >= RETRY_DELAYS_MS.length) {
          console.error(
            `[DatabaseController - RetryPolicy] All ${RETRY_DELAYS_MS.length} retry attempts exhausted for "${label}". Propagating final error.`
          );
          // إشعار قاطع الدائرة باستنفاد كل المحاولات
          recordExhaustedFailure(label);
        }
        throw lastError;
      }
    }
  }
  throw lastError;
}

/**
 * فئة الأخطاء المخصصة لخرق حوكمة العمليات
 */
export class WorkflowViolationError extends Error {
  public statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowViolationError';
  }
}

class DatabaseControllerClass {

  constructor() {
    // تهيئة مرجع EventBus داخلياً لاستخدامه في إشعارات قاطع الدائرة
    // يُؤجل الاستيراد لتجنب الدورات الدائرية (circular imports)
    import('../../engine/events/EventBus').then(({ EventBus }) => {
      initEventBus(EventBus);
    }).catch(() => {
      // EventBus غير متاح في بيئة الاختبار — التشغيل بدون إشعارات
    });

    // تسجيل منفذي الـ Auto-Flush للعمليات الحساسة
    registerFlushExecutor('TRANSFER_TICKET', async (payload: any) => {
      await this.executeTransferTicket(payload);
    });
    registerFlushExecutor('BROADCAST_CONFIG', async (payload: any) => {
      const { RealTimeSynchronizer } = await import('../../services/RealTimeSynchronizer');
      RealTimeSynchronizer.broadcast('CONFIG_UPDATED', payload);
    });
  }

  /**
   * أ. إجراء إنشاء التذكرة (dbo.sp_CreateTicket) بأسلوب المعاملات القياسية
   */
  public async executeCreateTicket(payload: {
    title: string;
    description: string;
    creatorId: string;
    department: string;
    building: string;
  }): Promise<any> {
    try {
      const activePool = await getPool();
      const request = activePool.request();

      // تعريف كل حقل استقبال بنوعه الدقيق في الـ SQL لمنع هجمات الحقن
      request.input('Title', sql.NVarChar(255), payload.title);
      request.input('Description', sql.NVarChar(sql.MAX), payload.description);
      request.input('CreatorID', sql.NVarChar(150), payload.creatorId);
      request.input('CurrentDepartment', sql.NVarChar(100), payload.department);
      request.input('Building', sql.NVarChar(150), payload.building);

      const result = await request.execute('dbo.sp_CreateTicket');
      return result.recordset[0];
    } catch (error) {
      console.error('[DatabaseController] executeCreateTicket error:', error);
      throw error;
    }
  }

  /**
   * ب. إجراء تحويل التذكرة وتدوين الأثر (dbo.sp_TransferTicket) بأسلوب المعاملات القياسية
   */
  public async executeTransferTicket(payload: {
    ticketId: string;
    targetDepartment: string;
    user: string;
    transferReason: string;
  }): Promise<void> {
    try {
      const activePool = await getPool();
      const request = activePool.request();

      // استخدام الأنواع الدقيقة للمعاملات
      request.input('TicketID', sql.UniqueIdentifier, payload.ticketId);
      request.input('TargetDepartment', sql.NVarChar(100), payload.targetDepartment);
      request.input('User', sql.NVarChar(150), payload.user);
      request.input('TransferReason', sql.NVarChar(sql.MAX), payload.transferReason);

      await request.execute('dbo.sp_TransferTicket');
    } catch (error) {
      console.error('[DatabaseController] executeTransferTicket error:', error);
      throw error;
    }
  }

  /**
   * ج. إجراء إغلاق التذكرة بقفل التبعية التراكمي (dbo.sp_CloseParentTicket) مع ترجمة الأخطاء
   */
  public async executeCloseParentTicket(ticketId: string): Promise<void> {
    try {
      const activePool = await getPool();
      const request = activePool.request();

      // إدخال المعرف الفريد للتذكرة الرئيسية
      request.input('TicketID', sql.UniqueIdentifier, ticketId);

      await request.execute('dbo.sp_CloseParentTicket');
    } catch (error: any) {
      // ترجمة وحوكمة الأخطاء: التقاط خطأ خرق العمليات وتمريره كـ WorkflowViolationError
      if (error.message && error.message.includes('WORKFLOW_VIOLATION')) {
        throw new WorkflowViolationError(error.message);
      }
      console.error('[DatabaseController] executeCloseParentTicket error:', error);
      throw error;
    }
  }

  /**
   * دالة استعلام آمنة ومعملة لجلب الصلاحيات بناءً على اسم الدور
   */
  public async executeGetPermissions(roleName: string): Promise<{ canTransfer: boolean; canClose: boolean }> {
    if (roleName?.toLowerCase() === 'admin') {
      return { canTransfer: true, canClose: true };
    }

    try {
      const activePool = await getPool();
      const request = activePool.request();

      request.input('RoleName', sql.NVarChar(100), roleName);

      const result = await request.query(
        'SELECT CanTransfer, CanClose FROM dbo.RolePermissions WHERE RoleName = @RoleName'
      );

      if (result.recordset.length === 0) {
        return { canTransfer: false, canClose: false };
      }

      const row = result.recordset[0];
      return {
        canTransfer: !!row.CanTransfer,
        canClose: !!row.CanClose
      };
    } catch (error) {
      console.error('[DatabaseController] executeGetPermissions error:', error);
      throw error;
    }
  }

  /**
   * دالة استعلام آمنة ومعملة لتحديث صلاحيات الدور في جدول dbo.RolePermissions
   */
  public async executeUpdatePermissions(roleName: string, canTransfer: boolean, canClose: boolean): Promise<void> {
    try {
      const activePool = await getPool();
      const request = activePool.request();

      request.input('RoleName', sql.NVarChar(100), roleName);
      request.input('CanTransfer', sql.Bit, canTransfer ? 1 : 0);
      request.input('CanClose', sql.Bit, canClose ? 1 : 0);

      const checkResult = await request.query(
        'SELECT 1 FROM dbo.RolePermissions WHERE RoleName = @RoleName'
      );

      if (checkResult.recordset.length === 0) {
        await request.query(
          'INSERT INTO dbo.RolePermissions (RoleName, CanTransfer, CanClose) VALUES (@RoleName, @CanTransfer, @CanClose)'
        );
      } else {
        await request.query(
          'UPDATE dbo.RolePermissions SET CanTransfer = @CanTransfer, CanClose = @CanClose WHERE RoleName = @RoleName'
        );
      }
    } catch (error) {
      console.error('[DatabaseController] executeUpdatePermissions error:', error);
      throw error;
    }
  }

  /**
   * دالة استعلام آمنة لجلب سجلات تدقيق الحوكمة من dbo.WorkflowAuditLogs
   */
  public async executeGetWorkflowAuditLogs(): Promise<any[]> {
    try {
      const activePool = await getPool();
      const request = activePool.request();
      const result = await request.query(
        'SELECT LogID, TicketID, SourceDepartment, TargetDepartment, [User], Timestamp, TransferReason FROM dbo.WorkflowAuditLogs ORDER BY Timestamp DESC'
      );
      return result.recordset.map(row => ({
        logId: row.LogID,
        ticketId: row.TicketID,
        sourceDepartment: row.SourceDepartment,
        targetDepartment: row.TargetDepartment,
        user: row.User,
        timestamp: row.Timestamp,
        transferReason: row.TransferReason
      }));
    } catch (error) {
      console.error('[DatabaseController] executeGetWorkflowAuditLogs error:', error);
      throw error;
    }
  }

  /**
   * دالة جلب إعدادات حوكمة الـ SLA وقواعد الأتمتة
   */
  public async executeGetSLAConfig(serviceType: string): Promise<{
    serviceType: string;
    isEscalationEnabled: boolean;
    thresholdMinutes: number;
    escalationTargetRole: string;
  } | null> {
    return withRetry(async () => {
      const activePool = await getPool();
      const request = activePool.request();

      request.input('ServiceType', sql.NVarChar(100), serviceType);

      const result = await request.query(
        'SELECT ServiceType, IsEscalationEnabled, ThresholdMinutes, EscalationTargetRole FROM dbo.SLAConfigurations WHERE ServiceType = @ServiceType'
      );

      if (result.recordset.length === 0) {
        return null;
      }

      const row = result.recordset[0];
      return {
        serviceType: row.ServiceType,
        isEscalationEnabled: !!row.IsEscalationEnabled,
        thresholdMinutes: Number(row.ThresholdMinutes),
        escalationTargetRole: row.EscalationTargetRole
      };
    }, 'executeGetSLAConfig');
  }

  /**
   * دالة تحديث/إنشاء إعدادات حوكمة الـ SLA وقواعد الأتمتة
   */
  public async executeUpdateSLAConfig(
    serviceType: string,
    isEscalationEnabled: boolean,
    thresholdMinutes: number,
    escalationTargetRole: string
  ): Promise<void> {
    try {
      const activePool = await getPool();
      const request = activePool.request();

      request.input('ServiceType', sql.NVarChar(100), serviceType);
      request.input('IsEscalationEnabled', sql.Bit, isEscalationEnabled ? 1 : 0);
      request.input('ThresholdMinutes', sql.Int, thresholdMinutes);
      request.input('EscalationTargetRole', sql.NVarChar(100), escalationTargetRole);

      const checkResult = await request.query(
        'SELECT 1 FROM dbo.SLAConfigurations WHERE ServiceType = @ServiceType'
      );

      if (checkResult.recordset.length === 0) {
        await request.query(
          'INSERT INTO dbo.SLAConfigurations (ServiceType, IsEscalationEnabled, ThresholdMinutes, EscalationTargetRole) VALUES (@ServiceType, @IsEscalationEnabled, @ThresholdMinutes, @EscalationTargetRole)'
        );
      } else {
        await request.query(
          'UPDATE dbo.SLAConfigurations SET IsEscalationEnabled = @IsEscalationEnabled, ThresholdMinutes = @ThresholdMinutes, EscalationTargetRole = @EscalationTargetRole WHERE ServiceType = @ServiceType'
        );
      }
    } catch (error) {
      console.error('[DatabaseController] executeUpdateSLAConfig error:', error);
      throw error;
    }
  }

  /**
   * دالة جلب إعدادات قنوات الإشعارات والتحذيرات اللحظية
   */
  public async executeGetNotificationConfig(serviceType: string): Promise<{
    serviceType: string;
    isToastEnabled: boolean;
    isBellEnabled: boolean;
  } | null> {
    return withRetry(async () => {
      const activePool = await getPool();
      const request = activePool.request();

      request.input('ServiceType', sql.NVarChar(100), serviceType);

      const result = await request.query(
        'SELECT ServiceType, IsToastEnabled, IsBellEnabled FROM dbo.NotificationConfigurations WHERE ServiceType = @ServiceType'
      );

      if (result.recordset.length === 0) {
        return null;
      }

      const row = result.recordset[0];
      return {
        serviceType: row.ServiceType,
        isToastEnabled: !!row.IsToastEnabled,
        isBellEnabled: !!row.IsBellEnabled
      };
    }, 'executeGetNotificationConfig');
  }

  /**
   * دالة تحديث/إنشاء إعدادات قنوات الإشعارات والتحذيرات اللحظية
   */
  public async executeUpdateNotificationConfig(
    serviceType: string,
    isToastEnabled: boolean,
    isBellEnabled: boolean
  ): Promise<void> {
    try {
      const activePool = await getPool();
      const request = activePool.request();

      request.input('ServiceType', sql.NVarChar(100), serviceType);
      request.input('IsToastEnabled', sql.Bit, isToastEnabled ? 1 : 0);
      request.input('IsBellEnabled', sql.Bit, isBellEnabled ? 1 : 0);

      const checkResult = await request.query(
        'SELECT 1 FROM dbo.NotificationConfigurations WHERE ServiceType = @ServiceType'
      );

      if (checkResult.recordset.length === 0) {
        await request.query(
          'INSERT INTO dbo.NotificationConfigurations (ServiceType, IsToastEnabled, IsBellEnabled) VALUES (@ServiceType, @IsToastEnabled, @IsBellEnabled)'
        );
      } else {
        await request.query(
          'UPDATE dbo.NotificationConfigurations SET IsToastEnabled = @IsToastEnabled, IsBellEnabled = @IsBellEnabled WHERE ServiceType = @ServiceType'
        );
      }
    } catch (error) {
      console.error('[DatabaseController] executeUpdateNotificationConfig error:', error);
      throw error;
    }
  }

  /**
   * دالة تجميع إحصائيات الـ SLA والخروقات التراكمية ومحاولات السبام
   */
  /**
   * فحص صحة النظام السيادي: التحقق من اتصال قاعدة البيانات واستجابة محرك الـ SLA
   * يُستخدم من مسار GET /api/v1/admin/health
   */
  public async executeHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    database: { connected: boolean; latencyMs: number };
    slaWorker: { running: boolean };
    circuitBreaker: { state: CircuitState; queueSize: number; openedAt: string | null };
    timestamp: string;
  }> {
    const startTime = Date.now();
    let dbConnected = false;
    let dbLatency = -1;

    try {
      const activePool = await getPool();
      await activePool.request().query('SELECT 1 AS HealthCheck');
      dbLatency = Date.now() - startTime;
      dbConnected = true;
    } catch (err) {
      console.warn('[DatabaseController - HealthCheck] Database connectivity check failed:', err);
      dbLatency = Date.now() - startTime;
    }

    let slaWorkerRunning = false;
    try {
      const { SLABackgroundWorker } = await import('../../engine/workflow/WorkflowEngine');
      slaWorkerRunning = !!(SLABackgroundWorker as any)?.isRunning?.();
    } catch {
      slaWorkerRunning = false;
    }

    const cb = getCircuitBreakerSnapshot();
    const status = dbConnected ? 'healthy' : 'critical';

    return {
      status,
      database: { connected: dbConnected, latencyMs: dbLatency },
      slaWorker: { running: slaWorkerRunning },
      circuitBreaker: { state: cb.state, queueSize: cb.queueSize, openedAt: cb.openedAt },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * تنفيذ التجاوز اليدوي السيادي لقاطع الدائرة في حالات الطوارئ (Manual Override)
   * يسمح للمسؤول الأعلى بفرض حالة CLOSED أو OPEN مباشرة
   */
  public executeForcedCircuitOverride(targetState: 'CLOSED' | 'OPEN', adminId: string): void {
    const reason = `Manual Override by IT_Admin (${adminId}) at ${new Date().toISOString()}`;
    if (targetState === 'CLOSED') {
      // إذا كانت الدائرة OPEN أو HALF-OPEN — الإغلاق الفوري وتشغيل Auto-Flush
      transitionCircuit('CLOSED', reason);
      scheduleAutoFlush();
    } else {
      // فتح قسري (Emergency OPEN) — لحماية قاعدة البيانات من الحمل الزائد
      transitionCircuit('OPEN', reason);
    }

    // تسجيل التجاوز اليدوي في سجل الأزمات السيادي
    logGovernanceEventAsync('MANUAL_OVERRIDE', adminId);

    console.log(`[CircuitBreaker - Override] State forced to ${targetState} by admin: ${adminId}`);
  }

  public async executeGetSLAAuditAnalytics(): Promise<{
    slaCompliance: Array<{ department: string; stableTickets: number; escalatedTickets: number }>;
    hourlyViolations: Array<{ hour: number; violationsCount: number; totalTransfers: number }>;
    kpis: {
      totalTickets: number;
      avgClosureTimeMinutes: number;
      totalAuditedActivities: number;
      spamAttempts: number;
    }
  }> {
    try {
      const activePool = await getPool();
      
      // 1. المؤشرات الرئيسية (KPIs)
      const kpiResult = await activePool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM dbo.Tickets) AS TotalTickets,
          (SELECT COALESCE(AVG(DATEDIFF(minute, CreatedAt, UpdatedAt)), 0) FROM dbo.Tickets WHERE Status = 'closed') AS AvgClosureTime,
          (SELECT COUNT(*) FROM dbo.WorkflowAuditLogs) AS TotalAuditLogs,
          (SELECT COUNT(*) FROM dbo.WorkflowAuditLogs WHERE TransferReason LIKE '%violat%' OR TransferReason LIKE '%hacker%' OR TransferReason LIKE '%409%') AS SpamAttempts
      `);
      
      const kpiRow = kpiResult.recordset[0] || {};
      
      // 2. معدلات الالتزام بالـ SLA لكل قسم
      const complianceResult = await activePool.request().query(`
        SELECT 
          COALESCE(s.ServiceType, t.CurrentDepartment) AS Department,
          SUM(CASE WHEN t.Status = 'closed' AND DATEDIFF(minute, t.CreatedAt, t.UpdatedAt) <= COALESCE(s.ThresholdMinutes, 120) THEN 1 
                   WHEN t.Status != 'closed' AND DATEDIFF(minute, t.CreatedAt, SYSUTCDATETIME()) <= COALESCE(s.ThresholdMinutes, 120) THEN 1 
                   ELSE 0 END) AS StableTickets,
          SUM(CASE WHEN t.Status = 'closed' AND DATEDIFF(minute, t.CreatedAt, t.UpdatedAt) > COALESCE(s.ThresholdMinutes, 120) THEN 1 
                   WHEN t.Status != 'closed' AND DATEDIFF(minute, t.CreatedAt, SYSUTCDATETIME()) > COALESCE(s.ThresholdMinutes, 120) THEN 1 
                   ELSE 0 END) AS EscalatedTickets
        FROM dbo.Tickets t
        LEFT JOIN dbo.SLAConfigurations s ON t.CurrentDepartment = s.ServiceType
        GROUP BY COALESCE(s.ServiceType, t.CurrentDepartment)
      `);
      
      // 3. خط تتبع الخروقات التراكمي بالساعات
      const hourlyResult = await activePool.request().query(`
        SELECT 
          DATEPART(hour, Timestamp) AS [Hour],
          COUNT(*) AS TotalTransfers,
          SUM(CASE WHEN TransferReason LIKE '%violat%' OR TransferReason LIKE '%hacker%' OR TransferReason LIKE '%409%' THEN 1 ELSE 0 END) AS ViolationsCount
        FROM dbo.WorkflowAuditLogs
        GROUP BY DATEPART(hour, Timestamp)
        ORDER BY [Hour] ASC
      `);

      const slaCompliance = complianceResult.recordset.map((row: any) => ({
        department: row.Department,
        stableTickets: row.StableTickets || 0,
        escalatedTickets: row.EscalatedTickets || 0
      }));

      // بناء مصفوفة الـ 24 ساعة لضمان عرض اليوم بالكامل
      const hourlyViolations = Array.from({ length: 24 }, (_, i) => {
        const found = hourlyResult.recordset.find((r: any) => r.Hour === i);
        return {
          hour: i,
          violationsCount: found ? found.ViolationsCount || 0 : 0,
          totalTransfers: found ? found.TotalTransfers || 0 : 0
        };
      });

      return {
        slaCompliance,
        hourlyViolations,
        kpis: {
          totalTickets: kpiRow.TotalTickets || 0,
          avgClosureTimeMinutes: kpiRow.AvgClosureTime || 0,
          totalAuditedActivities: kpiRow.TotalAuditLogs || 0,
          spamAttempts: kpiRow.SpamAttempts || 0
        }
      };
    } catch (error) {
      console.error('[DatabaseController] executeGetSLAAuditAnalytics error:', error);
      throw error;
    }
  }

  // =========================================================================
  // مسارات Express للربط بالـ REST API (Express Route Handlers)
  // =========================================================================

  public createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { title, description, creatorId, department, building } = req.body;
      
      if (!title || !description || !creatorId || !department || !building) {
        res.status(400).json({ status: 'error', message: 'Missing required parameters.' });
        return;
      }

      const ticket = await this.executeCreateTicket({ title, description, creatorId, department, building });
      res.status(201).json({ status: 'success', data: ticket });
    } catch (error) {
      next(error);
    }
  };

  public transferTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { targetDepartment, user, transferReason } = req.body;

      if (!id || !targetDepartment || !user || !transferReason) {
        res.status(400).json({ status: 'error', message: 'Missing required parameters.' });
        return;
      }

      await this.executeTransferTicket({ ticketId: id, targetDepartment, user, transferReason });
      RealTimeSynchronizer.broadcast('TICKET_TRANSFERRED', { ticketId: id, department: targetDepartment });
      res.status(200).json({ status: 'success', message: 'Ticket transferred successfully.' });
    } catch (error) {
      next(error);
    }
  };

  public closeParentTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ status: 'error', message: 'Ticket ID is required.' });
        return;
      }

      // v43.5 - Operational Governance: Parent-Child Lock & Final Assignee Check
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const ticketIdNum = parseInt(id, 10);
      if (!isNaN(ticketIdNum)) {
        const ticket = await prisma.ticket.findUnique({
          where: { id: ticketIdNum },
          include: { subTickets: true, assignments: { where: { isCurrentActive: true } } }
        });

        if (ticket) {
          // 1. Parent-Child Lock
          const openSubTickets = ticket.subTickets.filter((st: any) => st.stateId !== 5 && st.stateId !== 6); // Assuming 5/6 are closed/resolved states
          if (openSubTickets.length > 0) {
            throw new WorkflowViolationError(`PARENT_CHILD_LOCK: Cannot close parent ticket ${id} because it has ${openSubTickets.length} active sub-tickets.`);
          }

          // 2. Final Assignee Governance
          const userRole = (req as any).user?.role;
          const userId = (req as any).user?.id;
          
          if (userRole !== 'IT_Admin' && !userRole?.includes('Head')) {
            const activeAssignment = ticket.assignments[0];
            if (activeAssignment && activeAssignment.assignedTechId !== userId) {
              throw new WorkflowViolationError('FINAL_ASSIGNEE_GOVERNANCE: Only the final assigned technician or a department head can close this ticket.');
            }
          }
        }
      }

      await this.executeCloseParentTicket(id);
      res.status(200).json({ status: 'success', message: 'Parent ticket successfully closed.' });
    } catch (error: any) {
      // حوكمة وترجمة الأخطاء إلى HTTP 409 Conflict
      if (error instanceof WorkflowViolationError) {
        res.status(409).json({
          status: 'error',
          statusCode: 409,
          errorName: 'WorkflowViolationError',
          message: error.message
        });
      } else {
        next(error);
      }
    }
  };

  public getPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleName } = req.params;
      if (!roleName) {
        res.status(400).json({ status: 'error', message: 'Role name is required.' });
        return;
      }
      const permissions = await this.executeGetPermissions(roleName);
      res.status(200).json(permissions);
    } catch (error) {
      next(error);
    }
  };

  public updatePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleName, canTransfer, canClose } = req.body;
      if (!roleName) {
        res.status(400).json({ status: 'error', message: 'Role name is required.' });
        return;
      }
      await this.executeUpdatePermissions(roleName, !!canTransfer, !!canClose);
      RealTimeSynchronizer.broadcast('PERMISSIONS_UPDATED', { roleName });
      res.status(200).json({ status: 'success', message: 'Permissions updated successfully.' });
    } catch (error) {
      next(error);
    }
  };

  public getWorkflowAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const logs = await this.executeGetWorkflowAuditLogs();
      res.status(200).json({ status: 'success', data: logs });
    } catch (error) {
      next(error);
    }
  };

  public getSLAConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceType } = req.params;
      if (!serviceType) {
        res.status(400).json({ status: 'error', message: 'Service type is required.' });
        return;
      }
      const config = await this.executeGetSLAConfig(serviceType);
      if (!config) {
        res.status(404).json({ status: 'error', message: `No SLA configuration found for service: ${serviceType}` });
        return;
      }
      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  };

  public updateSLAConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceType, isEscalationEnabled, thresholdMinutes, escalationTargetRole } = req.body;
      if (!serviceType || thresholdMinutes === undefined || !escalationTargetRole) {
        res.status(400).json({ status: 'error', message: 'Missing required parameters.' });
        return;
      }
      await this.executeUpdateSLAConfig(serviceType, !!isEscalationEnabled, Number(thresholdMinutes), escalationTargetRole);
      // بث الحدث التحديثي لإخطار الفرونت-إند بتعديل الإعدادات
      RealTimeSynchronizer.broadcast('PERMISSIONS_UPDATED', { roleName: escalationTargetRole });
      RealTimeSynchronizer.broadcast('CONFIG_UPDATED', {
        ServiceType: serviceType,
        Timestamp: new Date().toISOString(),
        ConfigType: 'SLA'
      });
      res.status(200).json({ status: 'success', message: 'SLA configuration updated successfully.' });
    } catch (error) {
      next(error);
    }
  };

  public getSLAAuditAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = (req as any).user?.roleId;
      if (!roleId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Missing user credentials.' });
        return;
      }

      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role || role.name !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Access restricted to IT_Admin.' });
        return;
      }

      const analytics = await this.executeGetSLAAuditAnalytics();
      res.status(200).json(analytics);
    } catch (error) {
      next(error);
    }
  };

  public getNotificationConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = (req as any).user?.roleId;
      if (!roleId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Missing user credentials.' });
        return;
      }

      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role || role.name !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Access restricted to IT_Admin.' });
        return;
      }

      const { serviceType } = req.params;
      if (!serviceType) {
        res.status(400).json({ status: 'error', message: 'Service type is required.' });
        return;
      }
      const config = await this.executeGetNotificationConfig(serviceType);
      if (!config) {
        res.status(200).json({
          serviceType,
          isToastEnabled: true,
          isBellEnabled: true
        });
        return;
      }
      res.status(200).json(config);
    } catch (error) {
      next(error);
    }
  };

  public updateNotificationConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = (req as any).user?.roleId;
      if (!roleId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Missing user credentials.' });
        return;
      }

      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role || role.name !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Access restricted to IT_Admin.' });
        return;
      }

      const { serviceType, isToastEnabled, isBellEnabled } = req.body;
      if (!serviceType || isToastEnabled === undefined || isBellEnabled === undefined) {
        res.status(400).json({ status: 'error', message: 'Missing required parameters.' });
        return;
      }
      await this.executeUpdateNotificationConfig(serviceType, !!isToastEnabled, !!isBellEnabled);
      RealTimeSynchronizer.broadcast('PERMISSIONS_UPDATED', { roleName: 'IT_Admin' });
      RealTimeSynchronizer.broadcast('CONFIG_UPDATED', {
        ServiceType: serviceType,
        Timestamp: new Date().toISOString(),
        ConfigType: 'NOTIF'
      });
      res.status(200).json({ status: 'success', message: 'Notification configurations updated successfully.' });
    } catch (error) {
      next(error);
    }
  };
  /**
   * معالج مسار فحص السلامة السيادي: GET /api/v1/admin/health
   * v43.4: يعيد Telemetry كامل يتضمن حالة قاطع الدائرة + حجم الطابور
   */
  public getSystemHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = (req as any).user?.roleId;
      if (!roleId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Missing user credentials.' });
        return;
      }
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role || role.name !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Access restricted to IT_Admin.' });
        return;
      }
      const telemetry = await this.executeHealthCheck();
      const httpStatus = telemetry.status === 'healthy' ? 200 : 503;
      res.status(httpStatus).json(telemetry);
    } catch (error) {
      next(error);
    }
  };

  /**
   * معالج مسار حالة قاطع الدائرة: GET /api/v1/admin/circuit-breaker
   */
  public getCircuitBreakerStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = (req as any).user?.roleId;
      if (!roleId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Missing user credentials.' });
        return;
      }
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role || role.name !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Access restricted to IT_Admin.' });
        return;
      }
      const snapshot = getCircuitBreakerSnapshot();
      res.status(200).json({ status: 'success', circuitBreaker: snapshot });
    } catch (error) {
      next(error);
    }
  };

  /**
   * معالج مسار التجاوز اليدوي: POST /api/v1/admin/circuit-breaker/override
   * يسمح للمسؤول الأعلى بفرض حالة CLOSED أو OPEN فورياً في حالات الطوارئ
   */
  public circuitBreakerOverride = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = (req as any).user?.roleId;
      if (!roleId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Missing user credentials.' });
        return;
      }
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role || role.name !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Only IT_Admin can perform circuit breaker overrides.' });
        return;
      }

      const { targetState } = req.body;
      if (targetState !== 'CLOSED' && targetState !== 'OPEN') {
        res.status(400).json({
          status: 'error',
          message: 'Invalid targetState. Must be "CLOSED" or "OPEN".'
        });
        return;
      }

      const adminId = (req as any).user?.email || `role:${roleId}`;
      this.executeForcedCircuitOverride(targetState as 'CLOSED' | 'OPEN', adminId);

      const snapshot = getCircuitBreakerSnapshot();
      res.status(200).json({
        status: 'success',
        message: `Circuit breaker forcibly set to ${targetState} by IT_Admin.`,
        circuitBreaker: snapshot
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * جلب آخر 5 أحداث حوكمة سيادية من جدول قاعدة البيانات أو البافر الداخلي
   */
  public getGovernanceAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = (req as any).user?.roleId;
      if (!roleId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Missing credentials.' });
        return;
      }
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role || role.name !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Restricted to IT_Admin.' });
        return;
      }

      // محاولة استرجاع السجلات من جدول قاعدة البيانات
      try {
        const activePool = await getPool();
        const result = await activePool.request().query(
          'SELECT TOP 5 LogID AS logId, ActionBy AS actionBy, EventType AS eventType, TimestampMs AS timestampMs, CreatedAt AS createdAt FROM dbo.GovernanceAuditLogs ORDER BY CreatedAt DESC'
        );
        const mapped = result.recordset.map((row: any) => ({
          logId: row.logId,
          actionBy: row.actionBy,
          eventType: row.eventType,
          timestampMs: Number(row.timestampMs),
          createdAt: row.createdAt
        }));
        res.status(200).json({ status: 'success', data: mapped });
      } catch (dbErr: any) {
        console.warn(`[DatabaseController] getGovernanceAuditLogs database query failed, falling back to buffer:`, dbErr.message);
        res.status(200).json({ status: 'success', data: inMemoryGovernanceLogs.slice(0, 5) });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * دالة مساعدة لتسجيل الأحداث التشغيلية يدوياً من أي مكون خارجي
   */
  public logGovernanceEvent(eventType: string, actionBy: string): void {
    logGovernanceEventAsync(eventType, actionBy);
  }

  public getDynamicFields = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { departmentId } = req.params;
      if (!departmentId) {
        res.status(400).json({ status: 'error', message: 'Department ID is required.' });
        return;
      }
      const fields = await executeGetDynamicFields(departmentId);
      res.status(200).json({ status: 'success', data: fields });
    } catch (error) {
      next(error);
    }
  };

  public setDynamicFields = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const roleId = (req as any).user?.roleId;
      if (!roleId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized: Missing user credentials.' });
        return;
      }
      const role = await prisma.role.findUnique({ where: { id: roleId } });
      if (!role || role.name !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Access restricted to IT_Admin.' });
        return;
      }

      const { departmentId, fields } = req.body;
      if (!departmentId || !Array.isArray(fields)) {
        res.status(400).json({ status: 'error', message: 'Invalid payload. "departmentId" and "fields" (array) are required.' });
        return;
      }

      await executeSetDynamicFields(departmentId, fields);
      res.status(200).json({ status: 'success', message: 'Dynamic fields updated successfully.' });
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Dynamic System References (Decoupled Units & Trees) - v43.5
  // =========================================================================
  public getSystemReferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const references = await prisma.systemReference.findMany({
        where: { isActive: true },
        include: { children: true }
      });
      res.status(200).json({ status: 'success', data: references });
    } catch (error) {
      console.error('[DatabaseController] getSystemReferences error:', error);
      next(error);
    }
  };

  public createSystemReference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Must be Admin to create units
      const userRole = (req as any).user?.role;
      if (userRole !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required.' });
        return;
      }

      const { name, type, parentId } = req.body;
      if (!name || !type) {
        res.status(400).json({ status: 'error', message: 'name and type are required.' });
        return;
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const newRef = await prisma.systemReference.create({
        data: {
          name,
          type,
          parentId: parentId || null
        }
      });
      res.status(201).json({ status: 'success', data: newRef });
    } catch (error) {
      console.error('[DatabaseController] createSystemReference error:', error);
      next(error);
    }
  };

  public deleteSystemReference = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userRole = (req as any).user?.role;
      if (userRole !== 'IT_Admin') {
        res.status(403).json({ status: 'error', message: 'Forbidden: Admin access required.' });
        return;
      }

      const { id } = req.params;
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        res.status(400).json({ status: 'error', message: 'Invalid ID format.' });
        return;
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // Soft delete: set isActive to false
      await prisma.systemReference.update({
        where: { id: numericId },
        data: { isActive: false }
      });

      res.status(200).json({ status: 'success', message: 'Reference deactivated (soft delete) successfully.' });
    } catch (error) {
      console.error('[DatabaseController] deleteSystemReference error:', error);
      next(error);
    }
  };

  // =========================================================================
  // Sub-Tickets & Operational Flow - v43.5
  // =========================================================================
  public createSubTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parentIdStr = req.params.id;
      const parentId = parseInt(parentIdStr, 10);
      const { title, description, targetDepartment } = req.body;
      const creatorId = (req as any).user?.id || 1;

      if (isNaN(parentId) || !title || !description || !targetDepartment) {
        res.status(400).json({ status: 'error', message: 'Missing required parameters: title, description, targetDepartment' });
        return;
      }

      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();

      // 1. Verify Parent Ticket exists
      const parentTicket = await prisma.ticket.findUnique({ where: { id: parentId } });
      if (!parentTicket) {
        res.status(404).json({ status: 'error', message: 'Parent ticket not found' });
        return;
      }

      // 2. Fetch or create target Department ID
      let dept = await prisma.department.findUnique({ where: { name: targetDepartment } });
      if (!dept) {
        // Fallback: get first division or create
        let division = await prisma.companyDivision.findFirst();
        if (!division) {
          division = await prisma.companyDivision.create({ data: { name: 'Main Division' } });
        }
        dept = await prisma.department.create({
          data: { name: targetDepartment, divisionId: division.id }
        });
      }

      // 3. Find default State and Category
      let state = await prisma.ticketState.findUnique({ where: { name: 'OPEN' } });
      if (!state) {
        state = await prisma.ticketState.create({ data: { name: 'OPEN', label: 'مفتوحة' } });
      }

      let category = await prisma.issueCategory.findFirst();
      if (!category) {
        category = await prisma.issueCategory.create({ data: { name: 'General' } });
      }

      // 4. Create Sub-Ticket using Prisma
      const subTicket = await prisma.ticket.create({
        data: {
          title: `[Sub-Ticket] ${title}`,
          description,
          ticketType: 'SUB_TICKET',
          parentId,
          stateId: state.id,
          categoryId: category.id,
        }
      });

      // 5. Create Assignment
      await prisma.ticketAssignment.create({
        data: {
          ticketId: subTicket.id,
          assignedTechId: creatorId
        }
      });

      // 6. Broadcast SSE Notification to target Department Head
      NotificationEngine.broadcast({
        type: 'INFO',
        message: `تم تحويل تذكرة فرعية جديدة (${subTicket.id}) من التذكرة الأم (${parentId}) إلى قسمكم.`,
        targetDepartment: targetDepartment,
      });

      // 7. Initialize SLA Routing
      const { SLARoutingEngine } = require('../services/SLARoutingEngine');
      const slaEngine = new SLARoutingEngine();
      await slaEngine.initializeSLAAndRouting(subTicket.id, category.id, targetDepartment);

      res.status(201).json({ status: 'success', data: subTicket, message: 'Sub-ticket created successfully.' });
    } catch (error) {
      console.error('[DatabaseController] createSubTicket error:', error);
      next(error);
    }
  };
}

// العزل والتجميد: حماية الكائن رنتايم لمنع عمليات التعديل أو الـ Prototype Pollution
export const DatabaseController = Object.freeze(new DatabaseControllerClass());
