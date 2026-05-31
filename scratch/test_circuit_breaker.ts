/**
 * LITC-TS v43.3 - Sovereign Circuit Breaker & Offline Queue Integration Test
 * scratch/test_circuit_breaker.ts
 *
 * يُحاكي هذا الاختبار المتكامل:
 * 1. انتقال قاطع الدائرة من CLOSED → OPEN بعد استنفاد 3 إخفاقات متتالية.
 * 2. تخزين العمليات في الطابور (InMemoryQueue) أثناء حالة OPEN.
 * 3. الانتقال OPEN → HALF-OPEN بعد مهلة الانتظار.
 * 4. نجاح Auto-Flush عند العودة لـ CLOSED (HALF-OPEN → CLOSED).
 * 5. التطهير الذاتي التام للـ state بعد كل اختبار.
 * 6. التحقق من بث CIRCUIT_BREAKER_STATE_CHANGED + QUEUE_FLUSHED عبر EventBus.
 */

// =================== محاكاة EventBus ===================
const eventBusListeners: Record<string, Array<(data: any) => void>> = {};
const MockEventBus = {
  on:  (event: string, h: (d: any) => void) => { (eventBusListeners[event] ??= []).push(h); },
  off: (event: string, h: (d: any) => void) => {
    if (eventBusListeners[event]) eventBusListeners[event] = eventBusListeners[event].filter(fn => fn !== h);
  },
  emit: (event: string, data: any) => { (eventBusListeners[event] ?? []).forEach(h => h(data)); }
};

// =================== محاكاة module-scope state (Circuit Breaker) ===================
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

let circuitState: CircuitState = 'CLOSED';
let consecutiveExhaustedFailures = 0;
const CIRCUIT_OPEN_THRESHOLD = 3;
let circuitOpenedAt: string | null = null;
let circuitHalfOpenTimerId: NodeJS.Timeout | null = null;
const HALF_OPEN_DELAY_MS_TEST = 100; // مسرَّع للاختبار

const inMemoryQueue: Array<{ id: string; type: string; payload: any; enqueuedAt: string; retries: number }> = [];
let isFlushing = false;

const FLUSH_EXECUTOR_MAP: Record<string, (payload: any) => Promise<void>> = {};

// =================== وظائف قاطع الدائرة المحاكاة ===================
function emitCircuitState(state: CircuitState, reason?: string): void {
  MockEventBus.emit('CIRCUIT_BREAKER_STATE_CHANGED', {
    state, reason: reason || '', timestamp: new Date().toISOString(), queueSize: inMemoryQueue.length
  });
}

function transitionCircuit(to: CircuitState, reason?: string): void {
  if (circuitState === to) return;
  const from = circuitState;
  circuitState = to;

  if (to === 'OPEN') {
    circuitOpenedAt = new Date().toISOString();
    consecutiveExhaustedFailures = 0;
    if (circuitHalfOpenTimerId) clearTimeout(circuitHalfOpenTimerId);
    circuitHalfOpenTimerId = setTimeout(() => {
      transitionCircuit('HALF-OPEN', 'Probe window opened');
    }, HALF_OPEN_DELAY_MS_TEST);
  } else if (to === 'CLOSED') {
    consecutiveExhaustedFailures = 0;
    circuitOpenedAt = null;
    if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
  } else if (to === 'HALF-OPEN') {
    if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
  }

  console.log(`  [CircuitBreaker] Transition: ${from} → ${to}`);
  emitCircuitState(to, reason);
}

function recordExhaustedFailure(label: string): void {
  if (circuitState === 'OPEN') return;
  consecutiveExhaustedFailures++;
  console.log(`  [CircuitBreaker] Exhausted failure #${consecutiveExhaustedFailures}/${CIRCUIT_OPEN_THRESHOLD} for "${label}"`);
  if (consecutiveExhaustedFailures >= CIRCUIT_OPEN_THRESHOLD) {
    transitionCircuit('OPEN', `${CIRCUIT_OPEN_THRESHOLD} exhausted failures in "${label}"`);
  }
}

function recordSuccess(label: string): void {
  if (circuitState === 'HALF-OPEN') {
    transitionCircuit('CLOSED', `Probe succeeded for "${label}"`);
    scheduleAutoFlush();
  } else if (circuitState === 'CLOSED') {
    consecutiveExhaustedFailures = 0;
  }
}

function enqueueOperation(type: string, payload: any): { id: string; type: string; payload: any } {
  const op = {
    id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    type, payload,
    enqueuedAt: new Date().toISOString(),
    retries: 0
  };
  inMemoryQueue.push(op);
  emitCircuitState(circuitState, `Operation queued: ${type}`);
  return op;
}

function scheduleAutoFlush(): void {
  if (isFlushing || inMemoryQueue.length === 0) return;
  setImmediate(() => flushQueue());
}

async function flushQueue(): Promise<void> {
  if (isFlushing || circuitState !== 'CLOSED') return;
  isFlushing = true;
  let flushedCount = 0;
  let failedCount = 0;

  while (inMemoryQueue.length > 0 && circuitState === 'CLOSED') {
    const op = inMemoryQueue.shift()!;
    const executor = FLUSH_EXECUTOR_MAP[op.type];
    if (!executor) { failedCount++; continue; }
    try {
      op.retries++;
      await executor(op.payload);
      flushedCount++;
    } catch {
      failedCount++;
      inMemoryQueue.unshift(op);
      break;
    }
  }

  isFlushing = false;
  MockEventBus.emit('QUEUE_FLUSHED', {
    flushedCount, failedCount, remaining: inMemoryQueue.length, timestamp: new Date().toISOString()
  });
}

/** إعادة تعيين كامل الحالة بين الاختبارات */
function resetState(): void {
  circuitState = 'CLOSED';
  consecutiveExhaustedFailures = 0;
  circuitOpenedAt = null;
  isFlushing = false;
  inMemoryQueue.length = 0;
  if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
  // تنظيف مستمعي EventBus
  Object.keys(eventBusListeners).forEach(k => { eventBusListeners[k] = []; });
  // تنظيف منفذي Flush
  Object.keys(FLUSH_EXECUTOR_MAP).forEach(k => { delete FLUSH_EXECUTOR_MAP[k]; });
}

// =================== مساعد التأكيد ===================
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) { console.log(`  ✅ PASS: ${label}`); passed++; }
  else           { console.error(`  ❌ FAIL: ${label}`); failed++; }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// =============================================================================
// الاختبار 1: الانتقال الصحيح من CLOSED → OPEN بعد 3 إخفاقات متتالية
// =============================================================================
async function testCircuitOpensAfterThresholdFailures(): Promise<void> {
  console.log('\n[Test 1] Circuit Breaker — CLOSED → OPEN after 3 exhausted failures');
  resetState();

  const stateLog: string[] = [];
  MockEventBus.on('CIRCUIT_BREAKER_STATE_CHANGED', (e: any) => stateLog.push(e.state));

  assert(circuitState === 'CLOSED', 'Initial state is CLOSED');

  recordExhaustedFailure('executeGetSLAConfig');
  assert(circuitState === 'CLOSED', 'After 1 failure: still CLOSED');
  assert(consecutiveExhaustedFailures === 1, 'Failure counter = 1');

  recordExhaustedFailure('executeGetSLAConfig');
  assert(circuitState === 'CLOSED', 'After 2 failures: still CLOSED');
  assert(consecutiveExhaustedFailures === 2, 'Failure counter = 2');

  recordExhaustedFailure('executeGetSLAConfig');
  assert(circuitState === 'OPEN', 'After 3 failures: transitioned to OPEN');
  assert(circuitOpenedAt !== null, 'circuitOpenedAt is stamped');
  assert(stateLog.includes('OPEN'), 'CIRCUIT_BREAKER_STATE_CHANGED emitted OPEN');
  assert(consecutiveExhaustedFailures === 0, 'Failure counter reset to 0 after OPEN');

  // تنظيف: إلغاء مؤقت HALF-OPEN
  if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
}

// =============================================================================
// الاختبار 2: تخزين العمليات في InMemoryQueue أثناء OPEN
// =============================================================================
async function testOperationsQueuedWhenCircuitOpen(): Promise<void> {
  console.log('\n[Test 2] InMemoryQueue — Operations stored when circuit is OPEN');
  resetState();

  // نقل مباشر للـ OPEN
  circuitState = 'OPEN';
  circuitOpenedAt = new Date().toISOString();

  const op1 = enqueueOperation('TRANSFER_TICKET', { ticketId: 'T001', targetDepartment: 'IT' });
  const op2 = enqueueOperation('TRANSFER_TICKET', { ticketId: 'T002', targetDepartment: 'HR' });
  const op3 = enqueueOperation('BROADCAST_CONFIG', { ServiceType: 'Maintenance' });

  assert(inMemoryQueue.length === 3, 'Queue contains 3 operations');
  assert(op1.type === 'TRANSFER_TICKET', 'Op1 type is TRANSFER_TICKET');
  assert(op2.payload.targetDepartment === 'HR', 'Op2 payload is correct');
  assert(op3.type === 'BROADCAST_CONFIG', 'Op3 type is BROADCAST_CONFIG');
  assert(inMemoryQueue[0].id === op1.id, 'FIFO order: Op1 is first in queue');
}

// =============================================================================
// الاختبار 3: الانتقال OPEN → HALF-OPEN بعد مهلة الانتظار
// =============================================================================
async function testAutoTransitionToHalfOpen(): Promise<void> {
  console.log('\n[Test 3] Circuit Breaker — OPEN → HALF-OPEN auto-transition after delay');
  resetState();

  const stateLog: string[] = [];
  MockEventBus.on('CIRCUIT_BREAKER_STATE_CHANGED', (e: any) => stateLog.push(e.state));

  transitionCircuit('OPEN', 'Test: force open');
  assert(circuitState === 'OPEN', 'Circuit is OPEN');

  // انتظار مهلة الـ HALF-OPEN (100ms في وضع الاختبار)
  await sleep(HALF_OPEN_DELAY_MS_TEST + 50);

  assert(circuitState === 'HALF-OPEN', 'Circuit auto-transitioned to HALF-OPEN after delay');
  assert(stateLog.includes('HALF-OPEN'), 'CIRCUIT_BREAKER_STATE_CHANGED emitted HALF-OPEN');
  assert(circuitHalfOpenTimerId === null, 'HALF-OPEN timer cleared after transition');
}

// =============================================================================
// الاختبار 4: نجاح الـ Auto-Flush بعد الانتقال HALF-OPEN → CLOSED
// =============================================================================
async function testAutoFlushAfterCircuitCloses(): Promise<void> {
  console.log('\n[Test 4] Auto-Flush Engine — Queue drained in FIFO order after CLOSED');
  resetState();

  const executionLog: string[] = [];
  FLUSH_EXECUTOR_MAP['TRANSFER_TICKET'] = async (payload: any) => {
    executionLog.push(`TRANSFER:${payload.ticketId}`);
  };
  FLUSH_EXECUTOR_MAP['BROADCAST_CONFIG'] = async (payload: any) => {
    executionLog.push(`BROADCAST:${payload.ServiceType}`);
  };

  // وضع الدائرة في OPEN وإضافة عمليات للطابور
  circuitState = 'OPEN';
  enqueueOperation('TRANSFER_TICKET', { ticketId: 'T-ALPHA' });
  enqueueOperation('BROADCAST_CONFIG', { ServiceType: 'IT' });
  enqueueOperation('TRANSFER_TICKET', { ticketId: 'T-BETA' });

  const flushEvents: any[] = [];
  MockEventBus.on('QUEUE_FLUSHED', (e: any) => flushEvents.push(e));

  assert(inMemoryQueue.length === 3, 'Queue has 3 operations before flush');

  // محاكاة انتقال HALF-OPEN → CLOSED (نجاح الـ probe)
  circuitState = 'HALF-OPEN';
  recordSuccess('executeGetSLAConfig'); // هذا يُشغّل scheduleAutoFlush()

  assert(circuitState === 'CLOSED', 'Circuit transitioned HALF-OPEN → CLOSED on success');

  // انتظار setImmediate + تنفيذ الـ flush
  await sleep(50);

  assert(inMemoryQueue.length === 0, 'Queue is empty after Auto-Flush');
  assert(executionLog.length === 3, `All 3 operations were executed (got ${executionLog.length})`);
  assert(executionLog[0] === 'TRANSFER:T-ALPHA', 'FIFO: T-ALPHA executed first');
  assert(executionLog[1] === 'BROADCAST:IT', 'FIFO: IT broadcast executed second');
  assert(executionLog[2] === 'TRANSFER:T-BETA', 'FIFO: T-BETA executed last');
  assert(flushEvents.length > 0, 'QUEUE_FLUSHED event was emitted');
  assert(flushEvents[0].flushedCount === 3, 'QUEUE_FLUSHED reports flushedCount = 3');
  assert(flushEvents[0].remaining === 0, 'QUEUE_FLUSHED reports remaining = 0');
}

// =============================================================================
// الاختبار 5: إخفاقات متكررة لا تزيد عداد الـ OPEN المفتوحة بالفعل
// =============================================================================
async function testNoDoubleOpenTransition(): Promise<void> {
  console.log('\n[Test 5] Circuit Breaker — No double-open from failures while already OPEN');
  resetState();

  const stateLog: string[] = [];
  MockEventBus.on('CIRCUIT_BREAKER_STATE_CHANGED', (e: any) => stateLog.push(e.state));

  // انتقال مباشر للـ OPEN
  transitionCircuit('OPEN', 'Test: force open');
  const openEvents = stateLog.filter(s => s === 'OPEN').length;

  // تسجيل إخفاقات إضافية (يجب ألا تُحدث انتقالاً جديداً)
  recordExhaustedFailure('executeGetNotificationConfig');
  recordExhaustedFailure('executeGetNotificationConfig');
  recordExhaustedFailure('executeGetNotificationConfig');

  assert(circuitState === 'OPEN', 'Circuit remains OPEN (no re-open transition)');
  assert(stateLog.filter(s => s === 'OPEN').length === openEvents, 'No duplicate OPEN state emitted');
  assert(consecutiveExhaustedFailures === 0, 'Failure counter reset to 0 after OPEN (guarded)');

  if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
}

// =============================================================================
// الاختبار 6: عدم تشغيل flush متزامن مزدوج (isFlushing guard)
// =============================================================================
async function testNoDoubleFlush(): Promise<void> {
  console.log('\n[Test 6] Auto-Flush — No concurrent double-flush (isFlushing guard)');
  resetState();

  let callCount = 0;
  FLUSH_EXECUTOR_MAP['DUMMY_OP'] = async () => {
    await sleep(20); // تبطيء الـ executor
    callCount++;
  };

  circuitState = 'CLOSED';
  inMemoryQueue.push({ id: 'op1', type: 'DUMMY_OP', payload: {}, enqueuedAt: new Date().toISOString(), retries: 0 });
  inMemoryQueue.push({ id: 'op2', type: 'DUMMY_OP', payload: {}, enqueuedAt: new Date().toISOString(), retries: 0 });

  // تشغيل flush مرتين في نفس الوقت
  const flush1 = flushQueue();
  const flush2 = flushQueue(); // يجب أن يُتجاهل
  await Promise.all([flush1, flush2]);

  assert(callCount === 2, `All queued operations flushed exactly once (callCount = ${callCount})`);
  assert(inMemoryQueue.length === 0, 'Queue is empty after concurrent flush protection');
}

// =============================================================================
// الاختبار 7: إعادة تعيين الـ state الكاملة بين الاختبارات (التطهير الذاتي)
// =============================================================================
async function testStateSelfCleansUp(): Promise<void> {
  console.log('\n[Test 7] Self-Cleanup — All state resets cleanly between tests');
  resetState();

  assert(circuitState === 'CLOSED', 'circuitState reset to CLOSED');
  assert(consecutiveExhaustedFailures === 0, 'consecutiveExhaustedFailures reset to 0');
  assert(inMemoryQueue.length === 0, 'inMemoryQueue is empty');
  assert(isFlushing === false, 'isFlushing reset to false');
  assert(circuitOpenedAt === null, 'circuitOpenedAt reset to null');
  assert(circuitHalfOpenTimerId === null, 'No dangling timers after reset');
}

// =============================================================================
// الاختبار 8: محاكاة إغلاق التذكرة وبثها للطابور عند OPEN (التدفق الكامل E2E)
// =============================================================================
async function testEndToEndOfflineQueueFlow(): Promise<void> {
  console.log('\n[Test 8] E2E — Full offline queue flow: CLOSED → OPEN → queue → HALF-OPEN → CLOSED → flush');
  resetState();

  const stateLog: string[] = [];
  const flushLog: any[] = [];
  const executionLog: string[] = [];

  MockEventBus.on('CIRCUIT_BREAKER_STATE_CHANGED', (e: any) => stateLog.push(e.state));
  MockEventBus.on('QUEUE_FLUSHED', (e: any) => flushLog.push(e));

  FLUSH_EXECUTOR_MAP['CLOSE_TICKET'] = async (p: any) => {
    executionLog.push(`CLOSE:${p.ticketId}`);
  };

  // 1. الدائرة مغلقة بشكل طبيعي
  assert(circuitState === 'CLOSED', 'E2E Step 1: CLOSED initially');

  // 2. 3 إخفاقات متتالية → OPEN
  recordExhaustedFailure('executeCloseParentTicket');
  recordExhaustedFailure('executeCloseParentTicket');
  recordExhaustedFailure('executeCloseParentTicket');
  assert(circuitState === 'OPEN', 'E2E Step 2: OPEN after 3 exhausted failures');

  // 3. إضافة عملية للطابور أثناء OPEN
  enqueueOperation('CLOSE_TICKET', { ticketId: 'TICKET-99' });
  assert(inMemoryQueue.length === 1, 'E2E Step 3: 1 operation in queue while OPEN');

  // 4. انتظار HALF-OPEN التلقائي
  await sleep(HALF_OPEN_DELAY_MS_TEST + 50);
  assert(circuitState === 'HALF-OPEN', 'E2E Step 4: Auto-transitioned to HALF-OPEN');

  // 5. نجاح الـ probe → CLOSED
  recordSuccess('executeCloseParentTicket');
  assert(circuitState === 'CLOSED', 'E2E Step 5: Probe succeeded → CLOSED');

  // 6. Auto-Flush ينفذ العملية المعلقة
  await sleep(50);
  assert(executionLog.length === 1, 'E2E Step 6: 1 operation flushed');
  assert(executionLog[0] === 'CLOSE:TICKET-99', 'E2E Step 6: Correct ticket closed from queue');
  assert(inMemoryQueue.length === 0, 'E2E Step 6: Queue is empty after flush');
  assert(flushLog.length > 0, 'E2E Step 6: QUEUE_FLUSHED event emitted');

  // 7. التحقق من تسلسل الحالات المبثوثة
  assert(stateLog.includes('OPEN'), 'E2E: OPEN state was broadcast');
  assert(stateLog.includes('HALF-OPEN'), 'E2E: HALF-OPEN state was broadcast');
  assert(stateLog.includes('CLOSED'), 'E2E: CLOSED state was broadcast');
}

// =============================================================================
// نقطة الدخول الرئيسية
// =============================================================================
async function runAllCircuitBreakerTests(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  LITC-TS v43.3 — Sovereign Circuit Breaker & Offline Queue Suite  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  await testCircuitOpensAfterThresholdFailures();
  await testOperationsQueuedWhenCircuitOpen();
  await testAutoTransitionToHalfOpen();
  await testAutoFlushAfterCircuitCloses();
  await testNoDoubleOpenTransition();
  await testNoDoubleFlush();
  await testStateSelfCleansUp();
  await testEndToEndOfflineQueueFlow();

  // تنظيف ذاتي نهائي
  resetState();

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);

  if (failed === 0) {
    console.log('\n  ✅ === ALL CIRCUIT BREAKER TEST CASES PASSED SUCCESSFULLY ===');
    console.log('  Build State: 🟢 GREEN — Tri-State Circuit Breaker, InMemoryQueue,');
    console.log('               FIFO Auto-Flush & EventBus Integration all verified.');
    process.exit(0);
  } else {
    console.error(`\n  ❌ ${failed} TEST(S) FAILED — Review output above for details.`);
    process.exit(1);
  }
}

runAllCircuitBreakerTests().catch(err => {
  console.error('[FATAL] Unhandled error in circuit breaker test runner:', err);
  process.exit(1);
});
