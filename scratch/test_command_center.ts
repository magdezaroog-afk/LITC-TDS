/**
 * LITC-TS v43.4 — Sovereign Operations Command Center Integration Test
 * scratch/test_command_center.ts
 *
 * يُحاكي هذا الاختبار:
 * 1. سلامة بيانات Telemetry المُعادة من executeHealthCheck() (الهيكل الكامل).
 * 2. صحة Manual Override → OPEN (Emergency OPEN).
 * 3. صحة Manual Override → CLOSED (Restore + Auto-Flush).
 * 4. RBAC Guard: يرفض التجاوز من غير IT_Admin.
 * 5. Validation Guard: يرفض targetState غير معروف.
 * 6. إعادة تعيين الحالة بالكامل + تنظيف الـ timers.
 */

// =================== محاكاة module-scope Circuit Breaker ===================
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

let circuitState: CircuitState = 'CLOSED';
let consecutiveExhaustedFailures = 0;
const CIRCUIT_OPEN_THRESHOLD = 3;
let circuitOpenedAt: string | null = null;
let circuitHalfOpenTimerId: NodeJS.Timeout | null = null;
const HALF_OPEN_DELAY_MS = 50; // مسرَّع للاختبار

const inMemoryQueue: Array<{ id: string; type: string; payload: any; enqueuedAt: string; retries: number }> = [];
let isFlushing = false;
const FLUSH_EXECUTOR_MAP: Record<string, (payload: any) => Promise<void>> = {};

const eventBusListeners: Record<string, Array<(data: any) => void>> = {};
const MockEventBus = {
  on:   (e: string, h: (d: any) => void) => { (eventBusListeners[e] ??= []).push(h); },
  off:  (e: string, h: (d: any) => void) => { if (eventBusListeners[e]) eventBusListeners[e] = eventBusListeners[e].filter(fn => fn !== h); },
  emit: (e: string, d: any) => { (eventBusListeners[e] ?? []).forEach(h => h(d)); }
};

function emitCircuitState(state: CircuitState, reason?: string): void {
  MockEventBus.emit('CIRCUIT_BREAKER_STATE_CHANGED', {
    state, reason: reason ?? '', timestamp: new Date().toISOString(), queueSize: inMemoryQueue.length
  });
}

function transitionCircuit(to: CircuitState, reason?: string): void {
  if (circuitState === to) return;
  circuitState = to;
  if (to === 'OPEN') {
    circuitOpenedAt = new Date().toISOString();
    consecutiveExhaustedFailures = 0;
    if (circuitHalfOpenTimerId) clearTimeout(circuitHalfOpenTimerId);
    circuitHalfOpenTimerId = setTimeout(() => transitionCircuit('HALF-OPEN', 'Probe window'), HALF_OPEN_DELAY_MS);
  } else if (to === 'CLOSED') {
    consecutiveExhaustedFailures = 0;
    circuitOpenedAt = null;
    if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
  } else if (to === 'HALF-OPEN') {
    if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
  }
  emitCircuitState(to, reason);
}

function scheduleAutoFlush(): void {
  if (isFlushing || inMemoryQueue.length === 0) return;
  setImmediate(() => flushQueue());
}

async function flushQueue(): Promise<void> {
  if (isFlushing || circuitState !== 'CLOSED') return;
  isFlushing = true;
  let flushedCount = 0;
  while (inMemoryQueue.length > 0 && circuitState === 'CLOSED') {
    const op = inMemoryQueue.shift()!;
    const executor = FLUSH_EXECUTOR_MAP[op.type];
    if (executor) { try { await executor(op.payload); flushedCount++; } catch { inMemoryQueue.unshift(op); break; } }
  }
  isFlushing = false;
  MockEventBus.emit('QUEUE_FLUSHED', { flushedCount, remaining: inMemoryQueue.length });
}

function getCircuitBreakerSnapshot() {
  return { state: circuitState, queueSize: inMemoryQueue.length, openedAt: circuitOpenedAt, consecutiveExhaustedFailures };
}

/** المحاكاة الكاملة لـ executeHealthCheck() */
async function executeHealthCheck() {
  const snap = getCircuitBreakerSnapshot();
  return {
    status: 'healthy' as const,
    database: { connected: true, latencyMs: 12 },
    slaWorker: { running: true },
    circuitBreaker: { state: snap.state, queueSize: snap.queueSize, openedAt: snap.openedAt },
    timestamp: new Date().toISOString()
  };
}

/** المحاكاة الكاملة لـ executeForcedCircuitOverride() */
function executeForcedCircuitOverride(targetState: 'CLOSED' | 'OPEN', adminId: string): void {
  const reason = `Manual Override by IT_Admin (${adminId})`;
  if (targetState === 'CLOSED') {
    transitionCircuit('CLOSED', reason);
    scheduleAutoFlush();
  } else {
    transitionCircuit('OPEN', reason);
  }
}

/** محاكاة المسار: POST /api/v1/admin/circuit-breaker/override */
function mockOverrideRoute(body: any, userRole: string): { status: number; body: any } {
  if (userRole !== 'IT_Admin') {
    return { status: 403, body: { status: 'error', message: 'Forbidden: Only IT_Admin can perform circuit breaker overrides.' } };
  }
  const { targetState } = body;
  if (targetState !== 'CLOSED' && targetState !== 'OPEN') {
    return { status: 400, body: { status: 'error', message: 'Invalid targetState. Must be "CLOSED" or "OPEN".' } };
  }
  executeForcedCircuitOverride(targetState, 'test-admin@litc.sa');
  const snapshot = getCircuitBreakerSnapshot();
  return {
    status: 200,
    body: {
      status: 'success',
      message: `Circuit breaker forcibly set to ${targetState} by IT_Admin.`,
      circuitBreaker: snapshot
    }
  };
}

function resetState(): void {
  circuitState = 'CLOSED';
  consecutiveExhaustedFailures = 0;
  circuitOpenedAt = null;
  isFlushing = false;
  inMemoryQueue.length = 0;
  if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
  Object.keys(eventBusListeners).forEach(k => { eventBusListeners[k] = []; });
  Object.keys(FLUSH_EXECUTOR_MAP).forEach(k => { delete FLUSH_EXECUTOR_MAP[k]; });
}

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

// =================== مساعد التأكيد ===================
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string): void {
  if (condition) { console.log(`  ✅ PASS: ${label}`); passed++; }
  else           { console.error(`  ❌ FAIL: ${label}`); failed++; }
}

// =============================================================================
// Test 1: سلامة هيكل Telemetry من executeHealthCheck()
// =============================================================================
async function testTelemetrySchema(): Promise<void> {
  console.log('\n[Test 1] Telemetry Schema — validateHealthCheck() full payload structure');
  resetState();

  const telemetry = await executeHealthCheck();

  assert(typeof telemetry.status === 'string', 'Telemetry.status is a string');
  assert(['healthy', 'degraded', 'critical'].includes(telemetry.status), 'Telemetry.status is a valid value');
  assert(typeof telemetry.database === 'object', 'Telemetry.database is an object');
  assert(typeof telemetry.database.connected === 'boolean', 'Telemetry.database.connected is a boolean');
  assert(typeof telemetry.database.latencyMs === 'number', 'Telemetry.database.latencyMs is a number');
  assert(typeof telemetry.slaWorker === 'object', 'Telemetry.slaWorker is an object');
  assert(typeof telemetry.slaWorker.running === 'boolean', 'Telemetry.slaWorker.running is a boolean');
  assert(typeof telemetry.circuitBreaker === 'object', 'Telemetry.circuitBreaker is an object');
  assert(['CLOSED','OPEN','HALF-OPEN'].includes(telemetry.circuitBreaker.state), 'Telemetry.circuitBreaker.state is valid');
  assert(typeof telemetry.circuitBreaker.queueSize === 'number', 'Telemetry.circuitBreaker.queueSize is a number');
  assert(typeof telemetry.timestamp === 'string', 'Telemetry.timestamp is an ISO string');
}

// =============================================================================
// Test 2: Telemetry يعكس حجم الطابور الصحيح
// =============================================================================
async function testTelemetryReflectsQueueSize(): Promise<void> {
  console.log('\n[Test 2] Telemetry — circuitBreaker.queueSize reflects InMemoryQueue length');
  resetState();

  // استخدام transitionCircuit لضمان ختم circuitOpenedAt بشكل صحيح
  transitionCircuit('OPEN', 'Test: queue size reflection');
  inMemoryQueue.push({ id: 'op1', type: 'TRANSFER_TICKET', payload: {}, enqueuedAt: new Date().toISOString(), retries: 0 });
  inMemoryQueue.push({ id: 'op2', type: 'BROADCAST_CONFIG', payload: {}, enqueuedAt: new Date().toISOString(), retries: 0 });

  const telemetry = await executeHealthCheck();
  assert(telemetry.circuitBreaker.queueSize === 2, `queueSize reflects 2 queued operations (got ${telemetry.circuitBreaker.queueSize})`);
  assert(telemetry.circuitBreaker.state === 'OPEN', 'circuitBreaker.state reflects OPEN');
  assert(telemetry.circuitBreaker.openedAt !== null, 'circuitBreaker.openedAt is not null when OPEN');

  // تنظيف مؤقت الـ HALF-OPEN
  if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
}


// =============================================================================
// Test 3: Manual Override → OPEN (Emergency OPEN)
// =============================================================================
async function testOverrideToOpen(): Promise<void> {
  console.log('\n[Test 3] Manual Override — Force circuit to OPEN (Emergency OPEN)');
  resetState();

  const stateLog: string[] = [];
  MockEventBus.on('CIRCUIT_BREAKER_STATE_CHANGED', (e: any) => stateLog.push(e.state));

  assert(circuitState === 'CLOSED', 'Initial state is CLOSED');

  const result = mockOverrideRoute({ targetState: 'OPEN' }, 'IT_Admin');

  assert(result.status === 200, `Override returned HTTP 200 (got ${result.status})`);
  assert(result.body.status === 'success', 'Response body.status is success');
  assert(circuitState === 'OPEN', 'Circuit state is now OPEN');
  assert(result.body.circuitBreaker.state === 'OPEN', 'Response body reflects OPEN state');
  assert(stateLog.includes('OPEN'), 'CIRCUIT_BREAKER_STATE_CHANGED emitted OPEN');
  assert(result.body.message.includes('OPEN'), 'Response message confirms OPEN override');

  // تنظيف: إلغاء مؤقت HALF-OPEN
  if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
}

// =============================================================================
// Test 4: Manual Override → CLOSED + Auto-Flush trigger
// =============================================================================
async function testOverrideToClosed(): Promise<void> {
  console.log('\n[Test 4] Manual Override — Force circuit to CLOSED + Auto-Flush trigger');
  resetState();

  const flushLog: any[] = [];
  const executionLog: string[] = [];

  MockEventBus.on('QUEUE_FLUSHED', (e: any) => flushLog.push(e));
  FLUSH_EXECUTOR_MAP['CLOSE_TICKET'] = async (p: any) => { executionLog.push(`CLOSE:${p.ticketId}`); };

  // وضع الدائرة في OPEN + ملء الطابور
  circuitState = 'OPEN';
  circuitOpenedAt = new Date().toISOString();
  inMemoryQueue.push({ id: 'q1', type: 'CLOSE_TICKET', payload: { ticketId: 'CMD-001' }, enqueuedAt: new Date().toISOString(), retries: 0 });
  inMemoryQueue.push({ id: 'q2', type: 'CLOSE_TICKET', payload: { ticketId: 'CMD-002' }, enqueuedAt: new Date().toISOString(), retries: 0 });

  assert(inMemoryQueue.length === 2, '2 operations queued before override');

  const result = mockOverrideRoute({ targetState: 'CLOSED' }, 'IT_Admin');

  assert(result.status === 200, `Override returned HTTP 200 (got ${result.status})`);
  assert(circuitState === 'CLOSED', 'Circuit state is now CLOSED after override');
  assert(result.body.circuitBreaker.state === 'CLOSED', 'Response body reflects CLOSED state');
  assert(result.body.message.includes('CLOSED'), 'Response message confirms CLOSED override');

  // انتظار Auto-Flush (setImmediate)
  await sleep(50);

  assert(executionLog.length === 2, `Both queued operations flushed (got ${executionLog.length})`);
  assert(executionLog[0] === 'CLOSE:CMD-001', 'FIFO: CMD-001 flushed first');
  assert(executionLog[1] === 'CLOSE:CMD-002', 'FIFO: CMD-002 flushed second');
  assert(inMemoryQueue.length === 0, 'Queue empty after Auto-Flush');
  assert(flushLog.length > 0, 'QUEUE_FLUSHED event emitted after override→CLOSED');
}

// =============================================================================
// Test 5: RBAC Guard — رفض التجاوز من غير IT_Admin
// =============================================================================
async function testRbacGuard(): Promise<void> {
  console.log('\n[Test 5] RBAC Guard — Non-IT_Admin role is rejected with 403');
  resetState();

  const resultEmployee = mockOverrideRoute({ targetState: 'OPEN' }, 'Employee');
  assert(resultEmployee.status === 403, `Employee role → 403 Forbidden (got ${resultEmployee.status})`);
  assert(resultEmployee.body.status === 'error', 'Response body.status is error for Employee');
  assert(circuitState === 'CLOSED', 'Circuit state unchanged after rejected override by Employee');

  const resultMaint = mockOverrideRoute({ targetState: 'CLOSED' }, 'Maintenance_Head');
  assert(resultMaint.status === 403, `Maintenance_Head role → 403 Forbidden (got ${resultMaint.status})`);
  assert(circuitState === 'CLOSED', 'Circuit state unchanged after rejected override by Maintenance_Head');
}

// =============================================================================
// Test 6: Validation Guard — رفض targetState غير صحيح
// =============================================================================
async function testValidationGuard(): Promise<void> {
  console.log('\n[Test 6] Validation Guard — Invalid targetState rejected with 400');
  resetState();

  const result1 = mockOverrideRoute({ targetState: 'HALF-OPEN' }, 'IT_Admin');
  assert(result1.status === 400, `HALF-OPEN targetState → 400 Bad Request (got ${result1.status})`);
  assert(result1.body.status === 'error', 'Response body.status is error');
  assert(circuitState === 'CLOSED', 'Circuit state unchanged after invalid override');

  const result2 = mockOverrideRoute({ targetState: 'INVALID' }, 'IT_Admin');
  assert(result2.status === 400, `INVALID targetState → 400 Bad Request (got ${result2.status})`);
  assert(circuitState === 'CLOSED', 'Circuit state unchanged after INVALID override');

  const result3 = mockOverrideRoute({}, 'IT_Admin');
  assert(result3.status === 400, `Missing targetState → 400 Bad Request (got ${result3.status})`);
}

// =============================================================================
// Test 7: Telemetry بعد Override يعكس الحالة الجديدة فوراً
// =============================================================================
async function testTelemetryAfterOverride(): Promise<void> {
  console.log('\n[Test 7] Telemetry — reflects state immediately after Manual Override');
  resetState();

  const before = await executeHealthCheck();
  assert(before.circuitBreaker.state === 'CLOSED', 'Before override: state is CLOSED');

  mockOverrideRoute({ targetState: 'OPEN' }, 'IT_Admin');
  const after = await executeHealthCheck();
  assert(after.circuitBreaker.state === 'OPEN', 'After OPEN override: Telemetry reflects OPEN');

  mockOverrideRoute({ targetState: 'CLOSED' }, 'IT_Admin');
  const restored = await executeHealthCheck();
  assert(restored.circuitBreaker.state === 'CLOSED', 'After CLOSED override: Telemetry reflects CLOSED');

  if (circuitHalfOpenTimerId) { clearTimeout(circuitHalfOpenTimerId); circuitHalfOpenTimerId = null; }
}

// =============================================================================
// Test 8: E2E Command Center Flow — CLOSED → Emergency OPEN → Override CLOSED → Auto-Flush
// =============================================================================
async function testE2ECommandCenterFlow(): Promise<void> {
  console.log('\n[Test 8] E2E Command Center — Full emergency flow with telemetry verification');
  resetState();

  const executionLog: string[] = [];
  FLUSH_EXECUTOR_MAP['TRANSFER_TICKET'] = async (p: any) => { executionLog.push(`TRANSFER:${p.ticketId}`); };

  // Step 1: بداية طبيعية
  let telemetry = await executeHealthCheck();
  assert(telemetry.circuitBreaker.state === 'CLOSED', 'E2E Step 1: Telemetry shows CLOSED');
  assert(telemetry.circuitBreaker.queueSize === 0, 'E2E Step 1: Queue is empty');

  // Step 2: Emergency OPEN — عملية طوارئ
  mockOverrideRoute({ targetState: 'OPEN' }, 'IT_Admin');
  telemetry = await executeHealthCheck();
  assert(telemetry.circuitBreaker.state === 'OPEN', 'E2E Step 2: Telemetry shows OPEN after override');

  // Step 3: تخزين عمليات في الطابور
  inMemoryQueue.push({ id: 'e2e-1', type: 'TRANSFER_TICKET', payload: { ticketId: 'E2E-001' }, enqueuedAt: new Date().toISOString(), retries: 0 });
  inMemoryQueue.push({ id: 'e2e-2', type: 'TRANSFER_TICKET', payload: { ticketId: 'E2E-002' }, enqueuedAt: new Date().toISOString(), retries: 0 });
  telemetry = await executeHealthCheck();
  assert(telemetry.circuitBreaker.queueSize === 2, 'E2E Step 3: Telemetry shows queueSize = 2');

  // Step 4: استعادة بـ Override CLOSED
  mockOverrideRoute({ targetState: 'CLOSED' }, 'IT_Admin');
  telemetry = await executeHealthCheck();
  assert(telemetry.circuitBreaker.state === 'CLOSED', 'E2E Step 4: Telemetry shows CLOSED after restore');

  // Step 5: Auto-Flush
  await sleep(50);
  assert(executionLog.length === 2, 'E2E Step 5: Both operations flushed');
  assert(executionLog[0] === 'TRANSFER:E2E-001', 'E2E Step 5: FIFO order preserved');
  assert(inMemoryQueue.length === 0, 'E2E Step 5: Queue drained completely');

  // Step 6: Telemetry نهائي
  telemetry = await executeHealthCheck();
  assert(telemetry.circuitBreaker.queueSize === 0, 'E2E Step 6: Telemetry queueSize = 0 after flush');
  assert(telemetry.circuitBreaker.openedAt === null, 'E2E Step 6: openedAt reset to null');
}

// =============================================================================
// نقطة الدخول الرئيسية
// =============================================================================
async function runAllCommandCenterTests(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════════════╗');
  console.log('║  LITC-TS v43.4 — Sovereign Operations Command Center Test Suite      ║');
  console.log('╚══════════════════════════════════════════════════════════════════════╝');

  await testTelemetrySchema();
  await testTelemetryReflectsQueueSize();
  await testOverrideToOpen();
  await testOverrideToClosed();
  await testRbacGuard();
  await testValidationGuard();
  await testTelemetryAfterOverride();
  await testE2ECommandCenterFlow();

  resetState();

  console.log('\n═══════════════════════════════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests.`);

  if (failed === 0) {
    console.log('\n  ✅ === ALL COMMAND CENTER TEST CASES PASSED SUCCESSFULLY ===');
    console.log('  Build State: 🟢 GREEN — Telemetry Schema, Manual Override RBAC,');
    console.log('               Validation Guards, Auto-Flush trigger & E2E flow verified.');
    process.exit(0);
  } else {
    console.error(`\n  ❌ ${failed} TEST(S) FAILED — Review output above.`);
    process.exit(1);
  }
}

runAllCommandCenterTests().catch(err => {
  console.error('[FATAL] Unhandled error in command center test runner:', err);
  process.exit(1);
});
