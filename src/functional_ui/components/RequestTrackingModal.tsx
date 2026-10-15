/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Star,
  Send,
  MessageSquare,
  Check,
  Ticket,
  Sparkles,
  Layers,
  ShieldCheck,
  GitBranch,
  CornerDownLeft,
  ArrowLeftRight,
  AlertCircle,
  MapPin,
  ListFilter
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { UserRecentRequest } from '../types';
import { CinemaTicketFrame } from './CinemaTicketFrame';
import { RequestJourneyCircuitMap } from './RequestJourneyCircuitMap';

interface RequestTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: UserRecentRequest | null;
}

export function RequestTrackingModal({ isOpen, onClose, request }: RequestTrackingModalProps) {
  const { language, rateRequest, darkMode } = useHub();
  const isRtl = language === 'ar';

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [journeySteps, setJourneySteps] = useState(request?.steps || []);
  const [isSuccessDismissing, setIsSuccessDismissing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map' | 'audit'>('map');
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Synchronize state when request changes
  useEffect(() => {
    if (request) {
      setRating(request.rating || 0);
      setFeedback(request.feedback || '');
      setJourneySteps(request.steps || []);
      setIsSuccessDismissing(false);
      setActiveTab('map');
    }
  }, [request]);

  // Fetch real journey steps from backend
  useEffect(() => {
    if (isOpen && request?.id) {
      const token = localStorage.getItem('litc_token') || localStorage.getItem('token');
      const cleanId = String(request.id).replace(/\D/g, '');
      const ticketId = cleanId ? Number(cleanId) : request.id;

      fetch(`/api/v1/tickets/${ticketId}/journey`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('[JourneyModal] API response for ticket', ticketId, data);
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const apiSteps = data.data.map((step: any, idx: number) => ({
              id: step.id || String(idx),
              label: step.label || step.action || step.stepName || 'إجراء',
              labelEn: step.labelEn || step.action || 'Action',
              status: step.status || (idx === data.data.length - 1 ? 'current' : 'completed'),
              actor: step.actor || step.actorName || 'النظام',
              actorEn: step.actorEn || step.actorName || 'System',
              timestamp: step.timestamp ? new Date(step.timestamp).toLocaleTimeString('ar-LY', {
                hour: '2-digit',
                minute: '2-digit',
              }) : '',
              isSubTicketStep: !!step.isSubTicketStep,
              isReturnToPrimary: !!step.isReturnToPrimary,
              subTicket: step.subTicket,
              notes: step.notes,
            }));
            setJourneySteps(apiSteps);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, request]);

  if (!request) return null;

  const subTicketsList = (request as any)?.subTickets && (request as any).subTickets.length > 0
    ? (request as any).subTickets
    : journeySteps
        .filter((s: any) => s.isSubTicketStep && s.subTicket)
        .reduce((acc: any[], s: any) => {
          if (!acc.find((item: any) => item.id === s.subTicket.id)) acc.push(s.subTicket);
          return acc;
        }, []);

  const hasOpenSubTickets = Boolean(
    (request as any)?.hasOpenSubTickets ||
    ((request as any)?.subTickets && (request as any).subTickets.some((st: any) => !st.isClosed)) ||
    journeySteps.some((s: any) => s.isSubTicketStep && !s.isReturnToPrimary && s.status !== 'completed')
  );

  const primaryAssignee =
    (request as any)?.primaryAssignee ||
    (request as any)?.assignedToUser?.fullName ||
    journeySteps.find((s: any) => s.isReturnToPrimary)?.actor ||
    'مستلم الطلب الرئيسي';

  const handleRateAndClose = async () => {
    if (rating === 0) return;
    setIsSubmittingFeedback(true);
    try {
      await rateRequest(request.id, rating, feedback);
      setIsSuccessDismissing(true);
      setTimeout(() => {
        setIsSubmittingFeedback(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setIsSubmittingFeedback(false);
      onClose();
    }
  };

  const RATING_LABELS: Record<number, string> = {
    5: '★★★★★ ممتاز جداً — تم الإنجاز بسرعة واحترافية عالية',
    4: '★★★★ جيد جداً — خدمة ممتازة وتم إنجاز المطلوب بكفاءة',
    3: '★★★ مقبول — تم إنجاز الطلب بالشكل المطلوب',
    2: '★★ يحتاج إلى تحسين — تأخير أو صعوبة في الإجراءات',
    1: '★ غير مرضٍ — لم يتم الحل بالشكل المأمول',
  };

  const isCompletedOrApproved =
    request.status === 'completed' || request.status === 'approved' || (request as any).statusName === 'CLOSED';

  // Status Styling for Cinema Stamp
  const getStampConfig = () => {
    if (isCompletedOrApproved) {
      return {
        text: 'مكتمل ومغلق ★ CLOSED',
        color: '#34d399',
        border: 'rgba(52, 211, 153, 0.45)',
        bg: 'rgba(16, 185, 129, 0.12)',
      };
    }
    if (request.status === 'rejected') {
      return {
        text: 'مرفوض • REJECTED',
        color: '#f87171',
        border: 'rgba(239, 68, 68, 0.45)',
        bg: 'rgba(239, 68, 68, 0.12)',
      };
    }
    if (request.status === 'in_progress') {
      return {
        text: 'قيد المعالجة • IN PROGRESS',
        color: '#60a5fa',
        border: 'rgba(96, 165, 250, 0.45)',
        bg: 'rgba(37, 99, 235, 0.12)',
      };
    }
    return {
      text: 'قيد الانتظار • PENDING',
      color: '#fbbf24',
      border: 'rgba(251, 191, 36, 0.45)',
      bg: 'rgba(245, 158, 11, 0.12)',
    };
  };

  const stamp = getStampConfig();

  // Reusable Rating & Closure Component (Stub on Desktop, Scrollable Bottom on Mobile)
  const renderRatingBox = () => (
    <div
      style={{
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
        borderRadius: '8px',
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: darkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {request.rating ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#34d399' }}>
              تم التقييم ونقل الطلب للأرشيف
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                style={{
                  fill: s <= request.rating! ? '#fbbf24' : 'transparent',
                  color: s <= request.rating! ? '#fbbf24' : '#475569',
                }}
              />
            ))}
          </div>
          {request.feedback && (
            <p style={{ margin: 0, fontSize: '10.5px', color: darkMode ? '#cbd5e1' : '#475569', fontStyle: 'italic' }}>
              "{request.feedback}"
            </p>
          )}
        </div>
      ) : hasOpenSubTickets ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb',
            border: darkMode ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid #fde68a',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b', fontSize: '11.5px', fontWeight: 800 }}>
            <AlertCircle size={14} />
            <span>المعاملة معلقة بالمهام الفرعية</span>
          </div>
          <p style={{ margin: 0, fontSize: '10.5px', color: darkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>
            توجد مهام فرعية محالة لم يتم إقفالها بعد من الأطراف المستلمة. سيتوفر خيار التقييم والإغلاق فور إنجاز المهام وعودتها لمستلم الطلب الرئيسي.
          </p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: darkMode ? '#ffffff' : '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Star size={13} color="#fbbf24" style={{ fill: '#fbbf24' }} />
              <span>تقييم الخدمة والإغلاق</span>
            </span>
            <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b' }}>
              (إلزامي للإغلاق)
            </span>
          </div>

          {/* 5 Stars Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '4px 0' }}>
            {[1, 2, 3, 4, 5].map((s) => {
              const isLit = s <= (hoveredRating || rating);
              return (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(s)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s ease',
                    transform: isLit ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  <Star
                    size={22}
                    style={{
                      fill: isLit ? '#fbbf24' : 'transparent',
                      color: isLit ? '#fbbf24' : '#475569',
                      filter: isLit ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.6))' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* Feedback Text Input */}
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="ملاحظاتك الإضافية (اختياري)..."
            style={{
              width: '100%',
              backgroundColor: darkMode ? '#0d1424' : '#ffffff',
              borderRadius: '6px',
              border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
              padding: '6px 10px',
              fontSize: '11px',
              fontFamily: "'Cairo', sans-serif",
              color: darkMode ? '#ffffff' : '#0f172a',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          {/* Submit Rate & Close Button */}
          <button
            type="button"
            onClick={handleRateAndClose}
            disabled={rating === 0 || isSubmittingFeedback}
            style={{
              width: '100%',
              padding: '7px 12px',
              borderRadius: '6px',
              background:
                rating === 0
                  ? (darkMode ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0')
                  : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none',
              color: rating === 0 ? '#64748b' : '#ffffff',
              fontSize: '11.5px',
              fontWeight: 700,
              fontFamily: "'Cairo', sans-serif",
              cursor: rating === 0 || isSubmittingFeedback ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: rating === 0 ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.18s ease',
            }}
          >
            {isSubmittingFeedback ? (
              <span>جارٍ الحفظ...</span>
            ) : isSuccessDismissing ? (
              <>
                <Check size={13} color="#34d399" />
                <span>تم اعتماد التقييم ونقل الطلب للأرشيف!</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>اعتماد التقييم وأرشفة الطلب</span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          dir="rtl"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '8px' : '16px',
            overflow: 'hidden',
          }}
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(5, 8, 16, 0.84)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
            }}
          />

          {/* ══════════════════════════════════════════════════════════════════
              ADAPTIVE CINEMA TICKET MODAL (تذكرة سينمائية متجاوبة للمكتب والهاتف)
             ══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            style={{
              position: 'relative',
              width: isMobile ? '100%' : '1040px',
              maxWidth: isMobile ? 'calc(100vw - 16px)' : '96vw',
              height: isMobile ? '92vh' : '570px',
              maxHeight: isMobile ? '94vh' : '90vh',
              zIndex: 305,
              fontFamily: "'Cairo', sans-serif",
            }}
          >
            <CinemaTicketFrame
              accentColor={stamp.color}
              alwaysGlow={true}
              cornerCutout={isMobile ? 10 : 14}
              notchRadius={isMobile ? 4 : 5.5}
              numNotches={3}
              dashIndent={isMobile ? 14 : 20}
              customFill={darkMode ? "#0b1222" : "#ffffff"}
              contentPadding="0px"
              style={{
                width: '100%',
                height: '100%',
              }}
              contentStyle={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                overflow: 'hidden',
              }}
            >
              {/* ──────────────────────────────────────────────────────────
                  1. RIGHT COLUMN (OR TOP ON MOBILE): TICKET STUB (قسيمة التذكرة)
                 ────────────────────────────────────────────────────────── */}
              <div
                style={{
                  width: isMobile ? '100%' : '340px',
                  flexShrink: 0,
                  height: isMobile ? 'auto' : '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: isMobile ? 'flex-start' : 'space-between',
                  padding: isMobile ? '12px 14px' : '20px 24px',
                  boxSizing: 'border-box',
                  background: darkMode
                    ? 'linear-gradient(180deg, rgba(21, 30, 48, 0.6) 0%, rgba(13, 20, 36, 0.4) 100%)'
                    : '#f8fafc',
                  borderLeft: isMobile ? 'none' : (darkMode ? '1.5px dashed rgba(255, 255, 255, 0.14)' : '1.5px dashed #d97706'),
                  borderBottom: isMobile ? (darkMode ? '1.5px dashed rgba(255, 255, 255, 0.14)' : '1.5px dashed #d97706') : 'none',
                  position: 'relative',
                  gap: isMobile ? '8px' : '0',
                }}
              >
                {/* Top of Stub: Ticket Number, Title, Stamp */}
                <div>
                  {/* Stub Top Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? '6px' : '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: isMobile ? '30px' : '34px',
                          height: isMobile ? '30px' : '34px',
                          borderRadius: '8px',
                          backgroundColor: `${stamp.color}18`,
                          border: `1px solid ${stamp.color}45`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: stamp.color,
                        }}
                      >
                        <Ticket size={isMobile ? 16 : 18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>
                          قسيمة المعاملة • STUB
                        </div>
                        <div
                          style={{
                            fontSize: isMobile ? '11.5px' : '12px',
                            fontWeight: 800,
                            color: darkMode ? '#ffffff' : '#1e3a52',
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: '0.02em',
                          }}
                        >
                          № {request.code}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Status Stamp */}
                      <div
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: isMobile ? '9.5px' : '10.5px',
                          fontWeight: 800,
                          backgroundColor: stamp.bg,
                          border: `1px solid ${stamp.border}`,
                          color: stamp.color,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          letterSpacing: '0.02em',
                        }}
                      >
                        <span
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: stamp.color,
                            boxShadow: `0 0 6px ${stamp.color}`,
                          }}
                        />
                        {stamp.text}
                      </div>

                      {/* Mobile Close (X) button */}
                      {isMobile && (
                        <button
                          type="button"
                          onClick={onClose}
                          title="إغلاق"
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#ffffff',
                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                            color: darkMode ? '#94a3b8' : '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      margin: isMobile ? '0 0 6px' : '0 0 12px',
                      fontSize: isMobile ? '13.5px' : '16px',
                      fontWeight: 800,
                      color: darkMode ? '#ffffff' : '#0f172a',
                      fontFamily: "'Tajawal', sans-serif",
                      lineHeight: 1.3,
                    }}
                  >
                    {isRtl ? request.title : request.titleEn || request.title}
                  </h3>

                  {/* Meta Pills */}
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'row' : 'column',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginBottom: isMobile ? '0' : '14px',
                  }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                        fontSize: '10.5px',
                        boxShadow: darkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                    >
                      <span style={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={11} color="#60a5fa" />
                        <span>الإدارة المختصة:</span>
                      </span>
                      <span style={{ color: darkMode ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}>
                        {request.department || 'إدارة تقنية المعلومات'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #e2e8f0',
                        fontSize: '10.5px',
                        boxShadow: darkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                    >
                      <span style={{ color: darkMode ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={11} color="#fbbf24" />
                        <span>تاريخ التقديم:</span>
                      </span>
                      <span style={{ color: darkMode ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}>
                        {request.date || '2026/10/12'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom of Stub on Desktop: Star Rating & Closure Section */}
                {!isMobile && renderRatingBox()}
              </div>

              {/* ──────────────────────────────────────────────────────────
                  2. LEFT COLUMN: MAIN ADMISSION BODY (متن التذكرة وسجل الإجراءات)
                 ────────────────────────────────────────────────────────── */}
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  height: isMobile ? 'auto' : '100%',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: isMobile ? '12px 14px' : '20px 26px',
                  boxSizing: 'border-box',
                }}
              >
                {/* Body Top Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '12px',
                    borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: darkMode ? '#60a5fa' : '#1e3a52', fontWeight: 800, letterSpacing: '0.04em' }}>
                      شركة الاتصالات الدولية الليبية • LIBYAN INTERNATIONAL TELECOM CO.
                    </div>
                    <div style={{ fontSize: isMobile ? '12.5px' : '14px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a', fontFamily: "'Tajawal', sans-serif" }}>
                      سجل المتابعة والاعتمادات الإجرائية • AUDIT TRAIL
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#34d399',
                        fontSize: '10.5px',
                        fontWeight: 700,
                      }}
                    >
                      <ShieldCheck size={13} />
                      <span className="hide-on-mobile">توثيق رسمي معتمد</span>
                    </div>

                    {/* Close Modal Button (Desktop) */}
                    {!isMobile && (
                      <button
                        type="button"
                        onClick={onClose}
                        title="إغلاق النافذة"
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          color: darkMode ? '#94a3b8' : '#64748b',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s',
                          boxShadow: darkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                          e.currentTarget.style.color = '#f87171';
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = darkMode ? 'rgba(255, 255, 255, 0.05)' : '#ffffff';
                          e.currentTarget.style.color = darkMode ? '#94a3b8' : '#64748b';
                          e.currentTarget.style.borderColor = darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1';
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable Center: Details & Journey Stepper */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '12px 2px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* Transaction Details Box */}
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.55)' : '#f8fafc',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.07)' : '1px solid #e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '10.5px', color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 700, marginInlineEnd: '6px' }}>
                        موضوع ومحتوى الطلب:
                      </span>
                      <span style={{ fontSize: '12px', color: darkMode ? '#e2e8f0' : '#1e293b' }}>
                        {(request as any).description || (request as any).notes || 'طلب إجرائي معتمد وفق الضوابط التشغيلية للشركة.'}
                      </span>
                    </div>
                  </div>

                  {/* View Mode Switcher Tabs */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                      paddingBottom: '8px',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveTab('map')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: activeTab === 'map'
                            ? (darkMode ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid #2563eb')
                            : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                          backgroundColor: activeTab === 'map'
                            ? (darkMode ? 'rgba(37, 99, 235, 0.18)' : '#eff6ff')
                            : 'transparent',
                          color: activeTab === 'map'
                            ? (darkMode ? '#60a5fa' : '#1d4ed8')
                            : (darkMode ? '#94a3b8' : '#64748b'),
                          fontSize: '11.5px',
                          fontWeight: activeTab === 'map' ? 800 : 600,
                          cursor: 'pointer',
                          fontFamily: "'Cairo', sans-serif",
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <GitBranch size={13} />
                        <span>خارطة مسار وتفرعات الطلب</span>
                        {subTicketsList.length > 0 && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: hasOpenSubTickets ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                              color: hasOpenSubTickets ? '#f59e0b' : '#10b981',
                              fontWeight: 800,
                            }}
                          >
                            {subTicketsList.length} فرعية
                          </span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('audit')}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: activeTab === 'audit'
                            ? (darkMode ? '1px solid rgba(96, 165, 250, 0.4)' : '1px solid #2563eb')
                            : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                          backgroundColor: activeTab === 'audit'
                            ? (darkMode ? 'rgba(37, 99, 235, 0.18)' : '#eff6ff')
                            : 'transparent',
                          color: activeTab === 'audit'
                            ? (darkMode ? '#60a5fa' : '#1d4ed8')
                            : (darkMode ? '#94a3b8' : '#64748b'),
                          fontSize: '11.5px',
                          fontWeight: activeTab === 'audit' ? 800 : 600,
                          cursor: 'pointer',
                          fontFamily: "'Cairo', sans-serif",
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <ListFilter size={13} />
                        <span>سجل التدقيق والمتابعة ({journeySteps.length})</span>
                      </button>
                    </div>

                    <span style={{ fontSize: '10px', color: '#64748b' }}>
                      تحديث حي للنظام
                    </span>
                  </div>

                  {/* 🗺️ Tab 1: Topological Journey Circuit Map (خارطة مسار ونقاط الطلب وتفرعاته) */}
                  {activeTab === 'map' && (
                    <div style={{ width: '100%' }}>
                      <div
                        style={{
                          width: '100%',
                          overflowX: 'auto',
                          WebkitOverflowScrolling: 'touch',
                          padding: '4px 0',
                        }}
                      >
                        <RequestJourneyCircuitMap
                          request={request}
                          journeySteps={journeySteps}
                          subTickets={subTicketsList}
                          hasOpenSubTickets={hasOpenSubTickets}
                          darkMode={darkMode}
                          primaryAssignee={primaryAssignee}
                        />
                      </div>
                      {isMobile && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            color: '#64748b',
                            marginTop: '2px',
                          }}
                        >
                          <span>↔ اسحب للتمرير عبر كامل تفرعات الخارطة</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 📋 Tab 2: Sub-Tickets Transparency Card & Audit Trail */}
                  {activeTab === 'audit' && (
                    <>
                      {/* Sub-Tickets Transparency Card (تفرعات المهام والطلبات الفرعية) */}
                      {subTicketsList.length > 0 && (
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.65)' : '#ffffff',
                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: darkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11.5px', fontWeight: 800, color: darkMode ? '#f1f5f9' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <GitBranch size={13} color="#818cf8" />
                          <span>المهام والتذاكر الفرعية المحالة ({subTicketsList.length})</span>
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: hasOpenSubTickets ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                            color: hasOpenSubTickets ? '#f59e0b' : '#10b981',
                            border: `1px solid ${hasOpenSubTickets ? 'rgba(245, 158, 11, 0.25)' : 'rgba(16, 185, 129, 0.25)'}`,
                          }}
                        >
                          {hasOpenSubTickets ? '⏳ قيد معالجة الأطراف المستلمة' : '✅ مكتملة — المعاملة لدى المستلم الرئيسي'}
                        </span>
                      </div>

                      {/* Sub-tickets items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {subTicketsList.map((st: any) => {
                          const isDone = st.isClosed || ['CLOSED', 'RESOLVED'].includes(st.statusName);
                          return (
                            <div
                              key={st.id}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                                border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div
                                  style={{
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '6px',
                                    backgroundColor: isDone ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {isDone ? <Check size={12} color="#10b981" /> : <Clock size={12} color="#f59e0b" />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: darkMode ? '#ffffff' : '#0f172a' }}>
                                    #{st.id} • {st.title}
                                  </span>
                                  <span style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                                    الجهة المستلمة: <strong style={{ color: darkMode ? '#e2e8f0' : '#334155' }}>{st.department}</strong>
                                    {st.assignedTech && ` (${st.assignedTech})`}
                                  </span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    color: isDone ? '#10b981' : '#f59e0b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {isDone ? (
                                    <>
                                      <CornerDownLeft size={11} color="#10b981" />
                                      <span>عادت للمستلم الرئيسي</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={11} color="#f59e0b" />
                                      <span>قيد المعالجة لديهم</span>
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Real-time Journey Steps */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontSize: '11.5px', fontWeight: 800, color: darkMode ? '#cbd5e1' : '#334155' }}>
                        تسلسل الإجراءات والاعتمادات ({journeySteps.length} مراحل)
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        تحديث حي للنظام
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {journeySteps.map((step: any, idx: number) => {
                        const isDone = step.status === 'completed';
                        const isSubStep = step.isSubTicketStep;
                        const isReturn = step.isReturnToPrimary;

                        let bg = isDone ? 'rgba(16, 185, 129, 0.06)' : 'rgba(59, 130, 246, 0.06)';
                        let border = isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)';

                        if (isReturn) {
                          bg = isDone ? (darkMode ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5') : 'rgba(16, 185, 129, 0.06)';
                          border = isDone ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.2)';
                        } else if (isSubStep) {
                          bg = isDone ? (darkMode ? 'rgba(99, 102, 241, 0.08)' : '#eef2ff') : (darkMode ? 'rgba(245, 158, 11, 0.08)' : '#fffbeb');
                          border = isDone ? 'rgba(99, 102, 241, 0.3)' : 'rgba(245, 158, 11, 0.3)';
                        }

                        return (
                          <div
                            key={step.id || idx}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              backgroundColor: bg,
                              border: `1px solid ${border}`,
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <div
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    backgroundColor: isReturn
                                      ? '#10b98125'
                                      : isSubStep
                                      ? (isDone ? '#818cf825' : '#f59e0b25')
                                      : (isDone ? '#10b98125' : '#3b82f625'),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {isReturn ? (
                                    <CornerDownLeft size={11} color="#10b981" />
                                  ) : isSubStep ? (
                                    <GitBranch size={11} color={isDone ? "#818cf8" : "#f59e0b"} />
                                  ) : isDone ? (
                                    <Check size={11} color="#10b981" />
                                  ) : (
                                    <Clock size={11} color="#60a5fa" />
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                  {isReturn && (
                                    <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                                      عادت للمستلم الرئيسي
                                    </span>
                                  )}
                                  {isSubStep && !isReturn && (
                                    <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', backgroundColor: isDone ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isDone ? '#818cf8' : '#f59e0b' }}>
                                      {isDone ? 'مهمة فرعية مكتملة' : 'مهمة فرعية جارية'}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: isDone ? (darkMode ? '#ffffff' : '#0f172a') : (darkMode ? '#60a5fa' : '#2563eb') }}>
                                    {step.label}
                                  </span>
                                  {step.actor && (
                                    <span style={{ fontSize: '10.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                                      • {step.actor}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {step.timestamp && (
                                <span style={{ fontSize: '10.5px', color: '#64748b', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                  {step.timestamp}
                                </span>
                              )}
                            </div>

                            {step.notes && (
                              <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', marginInlineStart: '28px', lineHeight: 1.4 }}>
                                {step.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

                {/* On Mobile: Star Rating & Closure Section appears in scrollable body */}
                {isMobile && (
                  <div style={{ marginTop: '14px', marginBottom: '8px' }}>
                    {renderRatingBox()}
                  </div>
                )}

                {/* Footer Barcode & Security Strip */}
                <div
                  style={{
                    paddingTop: '10px',
                    borderTop: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', opacity: 0.65 }}>
                    {[2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 1, 5, 3, 2, 4, 1, 3, 2, 4].map((w, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: `${w}px`,
                          height: '16px',
                          backgroundColor: '#94a3b8',
                          borderRadius: '1px',
                        }}
                      />
                    ))}
                    <span
                      style={{
                        marginInlineStart: '8px',
                        fontSize: '9.5px',
                        fontFamily: "'JetBrains Mono', monospace",
                        color: '#64748b',
                        letterSpacing: '0.06em',
                      }}
                    >
                      AUTH-{request.code}-SECURE
                    </span>
                  </div>

                  <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                    بوابة الموظف المركزية • شركة الاتصالات الدولية الليبية
                  </span>
                </div>
              </div>
            </CinemaTicketFrame>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
