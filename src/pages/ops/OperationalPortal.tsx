/**
 * OperationalPortal.tsx
 * =====================
 * بوابة الكادر التشغيلي — واجهة استقبال الطلبات والعمل عليها
 * تتكيف تلقائياً حسب دور المستخدم (AGENT / UNIT_HEAD / SECTION_HEAD / DEPT_MANAGER)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { OpsAPI } from '../../services/ops.api';

// ─── الأنواع ────────────────────────────────────────────────────────────────
interface TicketItem {
  id: number;
  code: string;
  title: string;
  description: string;
  priority: string;
  state: { name: string; label: string };
  creator: { id: number; fullName: string; avatarUrl: string; department: { name: string } } | null;
  targetDept: string;
  flow: { name: string; icon: string } | null;
  assignedTo: { id: number; fullName: string; avatarUrl: string } | null;
  slaBreached: boolean;
  commentsCount: number;
  filesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  myQueueCount: number;
  openCount: number;
  inProgressCount: number;
  closedTodayCount: number;
  slaBreachedCount: number;
}

// ─── ألوان الأولوية ──────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  CRITICAL: { bg: '#fef2f2', text: '#b91c1c', label: 'حرج' },
  HIGH:     { bg: '#fff7ed', text: '#c2410c', label: 'عالي' },
  MEDIUM:   { bg: '#fefce8', text: '#a16207', label: 'متوسط' },
  LOW:      { bg: '#f0fdf4', text: '#166534', label: 'منخفض' },
};

// ─── ألوان الحالة ────────────────────────────────────────────────────────────
const STATE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  OPEN:           { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  IN_PROGRESS:    { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  PENDING_TRANSFER: { bg: '#faf5ff', text: '#7e22ce', dot: '#a855f7' },
  ESCALATED:      { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  WAITING_INFO:   { bg: '#fffbeb', text: '#92400e', dot: '#f59e0b' },
  CLOSED:         { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' },
  RESOLVED:       { bg: '#f0fdf4', text: '#166534', dot: '#4ade80' },
  REJECTED:       { bg: '#fef2f2', text: '#7f1d1d', dot: '#f87171' },
};

// ─── المكون الرئيسي ──────────────────────────────────────────────────────────
export function OperationalPortal({ settings }: { settings?: any }) {
  const [activeTab, setActiveTab] = useState<'queue' | 'all' | 'reports'>('queue');
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchTimeout = useRef<any>(null);

  // جلب الإحصائيات
  useEffect(() => {
    OpsAPI.getStats()
      .then(r => setStats(r.data))
      .catch(err => console.error('[OpsPortal] stats error:', err));
  }, []);

  // جلب الطلبات
  const fetchTickets = useCallback(async (reset = true) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = {
        limit: 25,
        ...(filterStatus && { status: filterStatus }),
        ...(filterPriority && { priority: filterPriority }),
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(showUnassigned && { unassigned: true }),
        ...(!reset && nextCursor && { cursor: nextCursor }),
      };

      let res;
      if (activeTab === 'queue') {
        res = await OpsAPI.getMyQueue(params);
      } else {
        res = await OpsAPI.getAllTickets(params);
      }

      if (reset) {
        setTickets(res.data);
      } else {
        setTickets(prev => [...prev, ...res.data]);
      }
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err: any) {
      setError(err.message || 'فشل تحميل الطلبات');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, filterStatus, filterPriority, searchQuery, showUnassigned, nextCursor]);

  useEffect(() => { fetchTickets(true); }, [activeTab, filterStatus, filterPriority, showUnassigned]);

  const handleSearch = (v: string) => {
    setSearchQuery(v);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchTickets(true), 500);
  };

  return (
    <div style={{
      width: '100%', background: 'transparent', direction: 'rtl',
      fontFamily: "'Segoe UI', Tahoma, sans-serif"
    }}>
      {/* ─── Header ─── */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
        padding: '16px 24px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '18px' }}>📥</span>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>لوحة استقبال ومعالجة الطلبات</h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>إدارة الطلبات والمهام للفريق التشغيلي</p>
          </div>
        </div>

        {/* إحصائيات سريعة */}
        {stats && (
          <div style={{ display: 'flex', gap: '16px' }}>
              <StatBadge label="في قائمتي" value={stats.myQueueCount} color="#6366f1" />
              <StatBadge label="مفتوحة" value={stats.openCount} color="#3b82f6" />
              <StatBadge label="قيد التنفيذ" value={stats.inProgressCount} color="#22c55e" />
              <StatBadge label="مغلقة اليوم" value={stats.closedTodayCount} color="#64748b" />
              {stats.slaBreachedCount > 0 && (
                <StatBadge label="تجاوز SLA" value={stats.slaBreachedCount} color="#ef4444" urgent />
              )}
            </div>
          )}
      </div>

      <div>
        {/* ─── Tabs ─── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
          {(['queue', 'all', 'reports'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '13px', transition: 'all 0.2s',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? '#0f172a' : '#64748b',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {tab === 'queue' ? '📋 قائمتي' : tab === 'all' ? '📂 جميع الطلبات' : '📊 التقارير'}
            </button>
          ))}
        </div>

        {activeTab === 'reports' ? (
          <ReportsView />
        ) : (
          <>
            {/* ─── شريط الفلاتر والبحث ─── */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="بحث برقم الطلب أو العنوان..."
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 40px 10px 16px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none',
                    boxSizing: 'border-box', background: '#fff'
                  }}
                />
              </div>

              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer' }}>
                <option value="">كل الحالات</option>
                <option value="OPEN">مفتوح</option>
                <option value="IN_PROGRESS">قيد التنفيذ</option>
                <option value="ESCALATED">مُصعَّد</option>
                <option value="WAITING_INFO">بانتظار معلومات</option>
                <option value="CLOSED">مغلق</option>
              </select>

              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', background: '#fff', cursor: 'pointer' }}>
                <option value="">كل الأولويات</option>
                <option value="CRITICAL">حرج</option>
                <option value="HIGH">عالي</option>
                <option value="MEDIUM">متوسط</option>
                <option value="LOW">منخفض</option>
              </select>

              {activeTab === 'all' && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', userSelect: 'none' }}>
                  <input type="checkbox" checked={showUnassigned} onChange={e => setShowUnassigned(e.target.checked)} />
                  غير مُسندة فقط
                </label>
              )}

              <button onClick={() => fetchTickets(true)} style={{
                padding: '10px 16px', borderRadius: '8px', border: 'none',
                background: '#6366f1', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}>
                تحديث
              </button>
            </div>

            {/* ─── قائمة الطلبات ─── */}
            {error && (
              <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#b91c1c', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {isLoading && tickets.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ height: '80px', background: '#f1f5f9', borderRadius: '12px', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>لا توجد طلبات في هذا النطاق</div>
              </motion.div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <AnimatePresence>
                  {tickets.map((ticket, index) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <TicketCard
                        ticket={ticket}
                        isSelected={selectedTicket === ticket.id}
                        onClick={() => setSelectedTicket(ticket.id === selectedTicket ? null : ticket.id)}
                        onActionDone={() => fetchTickets(true)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {hasMore && (
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fetchTickets(false)}
                    disabled={isLoading}
                    style={{
                      padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1',
                      background: 'transparent', color: '#6366f1', fontWeight: 600,
                      cursor: 'pointer', marginTop: '8px', transition: 'background 0.2s'
                    }}
                  >
                    {isLoading ? 'جاري التحميل...' : 'تحميل المزيد'}
                  </motion.button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── بطاقة التذكرة ────────────────────────────────────────────────────────────
function TicketCard({ ticket, isSelected, onClick, onActionDone }: {
  ticket: TicketItem;
  isSelected: boolean;
  onClick: () => void;
  onActionDone: () => void;
}) {
  const priority = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.MEDIUM;
  const stateColor = STATE_COLORS[ticket.state.name] || STATE_COLORS.OPEN;

  return (
    <motion.div
      layout
      onClick={onClick}
      style={{
        background: '#fff', border: `1px solid ${isSelected ? '#6366f1' : '#e2e8f0'}`,
        borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
        boxShadow: isSelected ? '0 0 0 3px rgba(99,102,241,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* ─── صف التذكرة الرئيسي ─── */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* مؤشر SLA */}
        {ticket.slaBreached && (
          <div style={{ width: '4px', alignSelf: 'stretch', background: '#ef4444', borderRadius: '2px', flexShrink: 0 }} title="تجاوز SLA" />
        )}

        {/* الكود + الأولوية */}
        <div style={{ minWidth: '80px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>{ticket.code}</div>
          <span style={{
            display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '20px',
            background: priority.bg, color: priority.text, fontSize: '10px', fontWeight: 700
          }}>
            {priority.label}
          </span>
        </div>

        {/* العنوان والمعلومات */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            {ticket.flow && <span style={{ fontSize: '14px' }}>{ticket.flow.icon || '📋'}</span>}
            <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {ticket.title}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {ticket.creator && <span>👤 {ticket.creator.fullName}</span>}
            {ticket.flow && <span>📁 {ticket.flow.name}</span>}
            {ticket.targetDept && <span>🏢 {ticket.targetDept}</span>}
            <span>🕐 {new Date(ticket.createdAt).toLocaleDateString('ar-LY')}</span>
          </div>
        </div>

        {/* الحالة + المُكلَّف */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', minWidth: '140px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px',
            background: stateColor.bg, color: stateColor.text, fontSize: '11px', fontWeight: 700
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: stateColor.dot, flexShrink: 0 }} />
            {ticket.state.label}
          </span>

          {ticket.assignedTo ? (
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              🧑‍💼 {ticket.assignedTo.fullName}
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>⚠️ غير مُسند</span>
          )}

          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#94a3b8' }}>
            {ticket.commentsCount > 0 && <span>💬 {ticket.commentsCount}</span>}
            {ticket.filesCount > 0 && <span>📎 {ticket.filesCount}</span>}
          </div>
        </div>
      </div>

      {/* ─── لوحة الإجراءات السريعة (تظهر عند التحديد) ─── */}
      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}
          >
            <TicketActions ticketId={ticket.id} stateName={ticket.state.name} onDone={onActionDone} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── لوحة الإجراءات السريعة ─────────────────────────────────────────────────
function TicketActions({ ticketId, stateName, onDone }: { ticketId: number; stateName: string; onDone: () => void }) {
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');
  const [techId, setTechId] = useState('');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [agents, setAgents] = useState<{ id: number; name: string; activeTickets: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (activeAction === 'INTERNAL_TRANSFER') {
      OpsAPI.getDepartments().then(r => setDepartments(r.data)).catch(() => {});
    }
    if (activeAction === 'REASSIGN') {
      OpsAPI.getAgents().then(r => setAgents(r.data)).catch(() => {});
    }
  }, [activeAction]);

  const handleExecute = async () => {
    if (!activeAction) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await OpsAPI.executeAction(ticketId, {
        type: activeAction as any,
        note: note || undefined,
        resolutionNote: activeAction === 'CLOSE' ? note : undefined,
        targetDeptId: targetDeptId ? Number(targetDeptId) : undefined,
        techId: techId ? Number(techId) : undefined,
      });
      setFeedback({ type: 'success', msg: 'تم تنفيذ الإجراء بنجاح' });
      setTimeout(() => { setActiveAction(null); setNote(''); onDone(); }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err.message || 'فشل الإجراء' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAlreadyClosed = ['CLOSED', 'RESOLVED'].includes(stateName);

  return (
    <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px', background: '#fafbfc' }}>
      {feedback && (
        <div style={{
          padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', fontWeight: 600,
          background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: feedback.type === 'success' ? '#16a34a' : '#b91c1c',
          border: `1px solid ${feedback.type === 'success' ? '#bbf7d0' : '#fca5a5'}`
        }}>
          {feedback.type === 'success' ? '✅' : '❌'} {feedback.msg}
        </div>
      )}

      {/* أزرار الإجراءات */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: activeAction ? '14px' : 0 }}>
        {!isAlreadyClosed && (
          <>
            {stateName === 'OPEN' && (
              <ActionBtn label="✅ قبول" color="#16a34a" active={activeAction === 'ACCEPT'} onClick={() => setActiveAction(activeAction === 'ACCEPT' ? null : 'ACCEPT')} />
            )}
            <ActionBtn label="🔒 إغلاق" color="#475569" active={activeAction === 'CLOSE'} onClick={() => setActiveAction(activeAction === 'CLOSE' ? null : 'CLOSE')} />
            <ActionBtn label="🔄 تحويل داخلي" color="#7c3aed" active={activeAction === 'INTERNAL_TRANSFER'} onClick={() => setActiveAction(activeAction === 'INTERNAL_TRANSFER' ? null : 'INTERNAL_TRANSFER')} />
            <ActionBtn label="↗️ تصعيد" color="#c2410c" active={activeAction === 'ESCALATE'} onClick={() => setActiveAction(activeAction === 'ESCALATE' ? null : 'ESCALATE')} />
            <ActionBtn label="🧑‍💼 تعيين" color="#1d4ed8" active={activeAction === 'REASSIGN'} onClick={() => setActiveAction(activeAction === 'REASSIGN' ? null : 'REASSIGN')} />
            <ActionBtn label="❓ طلب معلومات" color="#a16207" active={activeAction === 'REQUEST_INFO'} onClick={() => setActiveAction(activeAction === 'REQUEST_INFO' ? null : 'REQUEST_INFO')} />
          </>
        )}
        <ActionBtn label="💬 تعليق" color="#0369a1" active={activeAction === 'COMMENT'} onClick={() => setActiveAction(activeAction === 'COMMENT' ? null : 'COMMENT')} />
      </div>

      {/* حقل الإدخال حسب الإجراء */}
      {activeAction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeAction === 'INTERNAL_TRANSFER' && (
            <select value={targetDeptId} onChange={e => setTargetDeptId(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}>
              <option value="" disabled>اختر الإدارة المستهدفة...</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}

          {activeAction === 'REASSIGN' && (
            <select value={techId} onChange={e => setTechId(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}>
              <option value="" disabled>اختر الموظف...</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.activeTickets} طلب نشط)
                </option>
              ))}
            </select>
          )}

          {activeAction !== 'ACCEPT' && (
            <textarea
              rows={3}
              placeholder={
                activeAction === 'CLOSE' ? 'ملاحظة الإغلاق ووصف الحل... (مطلوب)' :
                activeAction === 'ESCALATE' ? 'سبب التصعيد... (مطلوب)' :
                activeAction === 'REQUEST_INFO' ? 'اكتب رسالتك للمُرسِل...' :
                activeAction === 'COMMENT' ? 'اكتب تعليقك...' : 'ملاحظة اختيارية...'
              }
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{
                padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                fontSize: '13px', resize: 'vertical', outline: 'none', fontFamily: 'inherit'
              }}
            />
          )}

          {/* خيار تعليق داخلي */}
          {activeAction === 'COMMENT' && (
            <CommentPanel ticketId={ticketId} onDone={onDone} />
          )}

          {activeAction !== 'COMMENT' && (
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setActiveAction(null); setNote(''); setFeedback(null); }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#e2e8f0', color: '#475569', fontWeight: 600, cursor: 'pointer' }}>
                إلغاء
              </button>
              <button onClick={handleExecute} disabled={isSubmitting}
                style={{
                  padding: '8px 20px', borderRadius: '8px', border: 'none',
                  background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer',
                  opacity: isSubmitting ? 0.7 : 1
                }}>
                {isSubmitting ? 'جاري التنفيذ...' : 'تأكيد'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── لوحة التعليقات ────────────────────────────────────────────────────────
function CommentPanel({ ticketId, onDone }: { ticketId: number; onDone: () => void }) {
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!text.trim()) return;
    setIsSending(true);
    try {
      await OpsAPI.addComment(ticketId, text, isInternal);
      setText('');
      onDone();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea rows={3} placeholder="اكتب تعليقك..." value={text} onChange={e => setText(e.target.value)}
        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: isInternal ? '#7c3aed' : '#64748b' }}>
          <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} />
          🔒 تعليق داخلي (لكادر العمل فقط)
        </label>
        <button onClick={handleSend} disabled={isSending || !text.trim()}
          style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: !text.trim() ? 0.5 : 1 }}>
          {isSending ? 'إرسال...' : 'إرسال'}
        </button>
      </div>
    </div>
  );
}

// ─── عرض التقارير ──────────────────────────────────────────────────────────
function ReportsView() {
  const [report, setReport] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const r = await OpsAPI.getSummaryReport({ from: fromDate, to: toDate });
      setReport(r.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  return (
    <div>
      {/* فلاتر التقرير */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <label style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
          من: <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
        </label>
        <label style={{ fontSize: '13px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
          إلى: <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
        </label>
        <button onClick={fetchReport} disabled={isLoading}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#6366f1', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
          {isLoading ? 'جاري...' : '🔄 توليد التقرير'}
        </button>
      </div>

      {report && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* إجمالي */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', fontWeight: 600 }}>إجمالي الطلبات</h3>
            <div style={{ fontSize: '48px', fontWeight: 800, color: '#6366f1' }}>{report.total}</div>
          </div>

          {/* حسب الحالة */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', fontWeight: 600 }}>توزيع حسب الحالة</h3>
            {report.byStatus?.map((s: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#334155' }}>{s.label}</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>{s.count}</span>
              </div>
            ))}
          </div>

          {/* حسب المسار */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', fontWeight: 600 }}>أكثر المسارات استخداماً</h3>
            {report.byFlow?.slice(0, 5).map((f: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                <span style={{ color: '#334155' }}>{f.flow}</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>{f.count}</span>
              </div>
            ))}
          </div>

          {/* أداء الكادر */}
          {report.topAgents?.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#475569', fontWeight: 600 }}>أداء الكادر التشغيلي</h3>
              {report.topAgents.map((a: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#6366f1' }}>
                      {i + 1}
                    </div>
                    <span>{a.tech?.fullName}</span>
                  </div>
                  <span style={{ fontWeight: 700, color: '#16a34a' }}>{a.closed} مغلقة</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── مكونات مساعدة ────────────────────────────────────────────────────────
function StatBadge({ label, value, color, urgent }: { label: string; value: number; color: string; urgent?: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '6px 14px', borderRadius: '8px',
      background: urgent ? '#fef2f2' : '#f8fafc',
      border: `1px solid ${urgent ? '#fca5a5' : '#e2e8f0'}`,
      animation: urgent && value > 0 ? 'pulse 2s infinite' : 'none'
    }}>
      <span style={{ fontSize: '18px', fontWeight: 800, color: urgent ? '#ef4444' : color }}>{value}</span>
      <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function ActionBtn({ label, color, active, onClick }: { label: string; color: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: '8px', border: `1px solid ${active ? color : '#e2e8f0'}`,
      background: active ? color : '#fff', color: active ? '#fff' : '#475569',
      fontWeight: 600, fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s'
    }}>
      {label}
    </button>
  );
}
