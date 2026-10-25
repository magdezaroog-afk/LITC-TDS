/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
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
  ListFilter,
  Lock,
  Ban,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  FileText
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
  const { language, rateRequest, darkMode, requests } = useHub();
  const isRtl = language === 'ar';

  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
  const [journeySteps, setJourneySteps] = useState(request?.steps || []);
  const [isSuccessDismissing, setIsSuccessDismissing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'map' | 'audit'>('map');
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 768 : false));

  const getAuthToken = () => {
    return (
      sessionStorage.getItem('litc_token') ||
      sessionStorage.getItem('token') ||
      localStorage.getItem('litc_token') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  // Dynamic route governance policies
  const routeConfig = useMemo(() => {
    if (!request) return null;
    const targetId = (request as any).routeId || (request as any).categoryId;
    let found = (requests || []).find((r: any) => r.id === targetId);
    if (!found && targetId) {
      try {
        const raw = localStorage.getItem('litc_ticket_routes');
        if (raw) {
          const routes = JSON.parse(raw);
          found = routes.find((r: any) => r.id === targetId);
        }
      } catch {}
    }
    return found?.formConfig || (found as any) || null;
  }, [request, requests]);

  const allowDirectCancel = routeConfig?.allowDirectCancelBeforeOpen !== false;
  const allowCancelReq = routeConfig?.allowCancellationRequest !== false;
  const allowPostponeReq = routeConfig?.allowPostponementRequest !== false;

  const cancelReasonsList: string[] = useMemo(() => {
    if (Array.isArray(routeConfig?.cancellationReasons) && routeConfig.cancellationReasons.length > 0) {
      return routeConfig.cancellationReasons;
    }
    return [
      'حُلّت المشكلة ولم أعد بحاجة للطلب',
      'تم تقديم الطلب بالخطأ أو تكرار الطلب',
      'خروج لمهمة خارجية أو اجتماع طارئ',
      'تأخر إنجاز الطلب من قبل المهندس المكلف',
      'أخرى (توضيح السبب يدوياً)'
    ];
  }, [routeConfig]);

  const postponeReasonsList: string[] = useMemo(() => {
    if (Array.isArray(routeConfig?.postponementReasons) && routeConfig.postponementReasons.length > 0) {
      return routeConfig.postponementReasons;
    }
    return [
      'عدم التواجد في المكتب حالياً (إجازة / مهمة عمل)',
      'تأجيل الموعد لوجود اجتماع طارئ',
      'انشغال الجهاز أو الموقع بأعمال تشغيلية حالياً',
      'تأجيل التنسيق لوقت لاحق',
      'أخرى (تحديد يدوي)'
    ];
  }, [routeConfig]);

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

  // Cancellation & Postponement Actions State
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<string>('حُلّت المشكلة ولم أعد بحاجة للطلب');
  const [cancelReasonNote, setCancelReasonNote] = useState<string>('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState<boolean>(false);

  const [showPostponeModal, setShowPostponeModal] = useState<boolean>(false);
  const [selectedPostponeReason, setSelectedPostponeReason] = useState<string>('عدم التواجد في المكتب حالياً (إجازة / مهمة عمل)');
  const [postponeNote, setPostponeNote] = useState<string>('');
  const [expectedPostponeDate, setExpectedPostponeDate] = useState<string>('');
  const [isManualResume, setIsManualResume] = useState<boolean>(true);
  const [isSubmittingPostpone, setIsSubmittingPostpone] = useState<boolean>(false);
  const [isResuming, setIsResuming] = useState<boolean>(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (cancelReasonsList.length > 0 && !cancelReasonsList.includes(selectedCancelReason)) {
      setSelectedCancelReason(cancelReasonsList[0]);
    }
  }, [cancelReasonsList]);

  useEffect(() => {
    if (postponeReasonsList.length > 0 && !postponeReasonsList.includes(selectedPostponeReason)) {
      setSelectedPostponeReason(postponeReasonsList[0]);
    }
  }, [postponeReasonsList]);

  // Parse employee form details and metadata
  const parsedFormDetails = useMemo(() => {
    if (!request) return [];
    const details: { label: string; value: string }[] = [];

    if (request.department) {
      details.push({ label: 'الإدارة المستلمة', value: request.department });
    }
    if ((request as any).building || (request as any).location) {
      details.push({ label: 'المبنى / المقر', value: (request as any).building || (request as any).location });
    }
    if ((request as any).subIssue || (request as any).issueType) {
      details.push({ label: 'تصنيف ونوع المشكلة', value: (request as any).subIssue || (request as any).issueType });
    }
    const reqPriority = (request as any).priority;
    if (reqPriority) {
      const pLabel = reqPriority === 'urgent' ? 'عاجلة جداً' : reqPriority === 'high' ? 'أولوية عالية' : reqPriority === 'normal' ? 'عادية' : 'منخفضة';
      details.push({ label: 'درجة الأولوية', value: pLabel });
    }

    let dict: Record<string, string> = {
      dyn_df_network_type: 'نوع الشبكة',
      dyn_df_device_type: 'نوع الجهاز',
      dyn_df_floor: 'الدور / الطابق',
      dyn_df_room: 'رقم الغرفة / المكتب',
      dyn_df_ip_address: 'عنوان IP',
      dyn_df_asset_tag: 'رقم الأصل / الجهاز',
      dyn_df_printer_model: 'موديل الطابعة',
      dyn_df_app_name: 'اسم المنظومة',
    };
    try {
      const rawDict = localStorage.getItem('litc_dynamic_fields');
      if (rawDict) {
        const parsed = JSON.parse(rawDict);
        if (Array.isArray(parsed)) {
          parsed.forEach((f: any) => { if (f.id && f.label) dict[f.id] = f.label; });
        }
      }
    } catch {}

    const metaFields = (request as any).routingMeta?.fields || (request as any).fields;
    if (metaFields && typeof metaFields === 'object') {
      Object.entries(metaFields).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') return;
        const cleanLabel = dict[k] || k.replace(/^dyn_df_/, '').replace(/^df_/, '').replace(/_/g, ' ');
        const cleanVal = typeof v === 'boolean' ? (v ? 'نعم' : 'لا') : String(v);
        details.push({ label: cleanLabel, value: cleanVal });
      });
    }

    const rawDesc = (request as any).description || '';
    if (rawDesc && (!metaFields || Object.keys(metaFields).length === 0)) {
      const lines = rawDesc.split('\n');
      lines.forEach((line: string) => {
        if (line.includes(':')) {
          const [k, ...v] = line.split(':');
          const cleanK = dict[k.trim()] || k.trim().replace(/^dyn_df_/, '').replace(/^df_/, '').replace(/_/g, ' ');
          const cleanV = v.join(':').trim();
          if (cleanV) details.push({ label: cleanK, value: cleanV });
        }
      });
    }

    return details;
  }, [request]);

  const isPostponed = Boolean(
    (request as any)?.routingMeta?.postponement?.isPostponed ||
    (request as any)?.isPostponed ||
    (request as any)?.status === 'postponed'
  );

  const isDirectCancelAllowed = Boolean(
    allowDirectCancel &&
    (
      request?.status === 'pending' ||
      (request as any)?.statusName === 'PENDING' ||
      (request as any)?.statusName === 'NEW' ||
      (request as any)?.statusName === 'OPEN' ||
      (request as any)?.status === 'new'
    ) &&
    !(request as any)?.assignedToUser
  );

  const handleDirectCancel = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الطلب نهائياً قبل استلامه؟')) return;
    setIsCancelling(true);
    setActionNotice(null);
    try {
      const token = getAuthToken();
      const cleanId = String(request.id).replace(/\D/g, '');
      const res = await fetch(`/api/v1/functional/requests/${cleanId || request.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({ type: 'success', text: 'تم إلغاء الطلب بنجاح ونقله لسجل المعاملات الملغاة' });
        setTimeout(() => {
          onClose();
          window.location.reload();
        }, 1200);
      } else {
        setActionNotice({ type: 'error', text: data.message || 'تعذر إلغاء الطلب' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err?.message || 'حدث خطأ في الشبكة أثناء إلغاء الطلب' });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRequestCancellation = async () => {
    if (!selectedCancelReason) return;
    setIsSubmittingCancel(true);
    setActionNotice(null);
    try {
      const token = getAuthToken();
      const cleanId = String(request.id).replace(/\D/g, '');
      const res = await fetch(`/api/v1/functional/requests/${cleanId || request.id}/request-cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({ reason: selectedCancelReason, note: cancelReasonNote })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({ type: 'success', text: 'تم إرسال طلب إلغاء المعاملة بنجاح إلى الجهة المستلمة' });
        setShowCancelModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setActionNotice({ type: 'error', text: data.message || 'تعذر إرسال طلب الإلغاء' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err?.message || 'حدث خطأ أثناء إرسال طلب الإلغاء' });
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const handlePostpone = async () => {
    if (!selectedPostponeReason) return;
    setIsSubmittingPostpone(true);
    setActionNotice(null);
    try {
      const token = getAuthToken();
      const cleanId = String(request.id).replace(/\D/g, '');
      const res = await fetch(`/api/v1/functional/requests/${cleanId || request.id}/request-postpone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: selectedPostponeReason,
          note: postponeNote,
          expectedCompletionDate: expectedPostponeDate,
          isManualResume
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({ type: 'success', text: 'تم تسجيل طلب تأجيل المعاملة بنجاح' });
        setShowPostponeModal(false);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setActionNotice({ type: 'error', text: data.message || 'تعذر تسجيل التأجيل' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err?.message || 'حدث خطأ أثناء تسجيل طلب التأجيل' });
    } finally {
      setIsSubmittingPostpone(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    setActionNotice(null);
    try {
      const token = getAuthToken();
      const cleanId = String(request.id).replace(/\D/g, '');
      const res = await fetch(`/api/v1/functional/requests/${cleanId || request.id}/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionNotice({ type: 'success', text: 'تم استئناف متابعة المعاملة بنجاح' });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setActionNotice({ type: 'error', text: data.message || 'تعذر استئناف الطلب' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', text: err?.message || 'حدث خطأ أثناء استئناف الطلب' });
    } finally {
      setIsResuming(false);
    }
  };

  // Fetch real journey steps from backend
  useEffect(() => {
    if (isOpen && request?.id) {
      const token = getAuthToken();
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
      ) : !isCompletedOrApproved ? (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
            border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '11.5px', fontWeight: 800 }}>
            <Lock size={13} color="#94a3b8" />
            <span>تقييم الخدمة مقفل حالياً</span>
          </div>
          <p style={{ margin: 0, fontSize: '10.5px', color: darkMode ? '#94a3b8' : '#64748b', lineHeight: 1.5 }}>
            لا يمكن للموظف التقييم إلا بعد أن يتم إغلاق المعاملة وحلها رسمياً من قبل الجهة المستقبلة.
          </p>
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', padding: '4px 0', opacity: 0.35 }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} size={15} color="#64748b" />
            ))}
          </div>
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? '12px' : '8px', padding: '6px 0' }}>
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
                    padding: isMobile ? '6px' : '2px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s ease',
                    transform: isLit ? 'scale(1.2)' : 'scale(1)',
                  }}
                >
                  <Star
                    size={isMobile ? 28 : 22}
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

          {/* Rating label preview */}
          {(hoveredRating || rating) > 0 && (
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#f59e0b',
              textAlign: 'center',
              margin: '2px 0 4px',
            }}>
              {RATING_LABELS[hoveredRating || rating]?.split('—')[1] || RATING_LABELS[hoveredRating || rating]}
            </div>
          )}

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
              padding: isMobile ? '8px 12px' : '6px 10px',
              fontSize: isMobile ? '12px' : '11px',
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
              padding: isMobile ? '10px 14px' : '7px 12px',
              borderRadius: '8px',
              background:
                rating === 0
                  ? (darkMode ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0')
                  : '#135d79',
              border: 'none',
              color: rating === 0 ? '#64748b' : '#ffffff',
              fontSize: isMobile ? '12.5px' : '11.5px',
              fontWeight: 800,
              fontFamily: "'Cairo', sans-serif",
              cursor: rating === 0 || isSubmittingFeedback ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: rating === 0 ? 'none' : '0 4px 14px rgba(19, 93, 121, 0.35)',
              transition: 'all 0.18s ease',
            }}
          >
            {isSubmittingFeedback ? (
              <span>جارٍ الحفظ...</span>
            ) : isSuccessDismissing ? (
              <>
                <Check size={14} color="#34d399" />
                <span>تم اعتماد التقييم ونقل الطلب للأرشيف!</span>
              </>
            ) : (
              <>
                <Send size={14} />
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
            alignItems: isMobile ? 'flex-end' : 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : '16px',
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

          {isMobile ? (
            /* ══════════════════════════════════════════════════════════════════
               MOBILE BOTTOM SHEET (لوحة الهاتف المحمول الذكية المريحة للإبهام)
               ══════════════════════════════════════════════════════════════════ */
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'relative',
                width: '100%',
                maxHeight: '88vh',
                backgroundColor: darkMode ? '#0e172a' : '#ffffff',
                borderRadius: '24px 24px 0 0',
                borderTop: darkMode ? '1.5px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 305,
                overflow: 'hidden',
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              {/* Drag Handle */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: '10px 0 6px', flexShrink: 0 }}>
                <div style={{ width: '42px', height: '4.5px', borderRadius: '3px', backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.22)' : '#cbd5e1' }} />
              </div>

              {/* Mobile Header Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 18px 12px',
                borderBottom: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(19, 93, 121, 0.1)',
                    color: darkMode ? '#38bdf8' : '#135d79',
                    border: darkMode ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(19, 93, 121, 0.2)',
                  }}>
                    #{request.code}
                  </span>
                  <div style={{
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: stamp.bg,
                    border: `1px solid ${stamp.border}`,
                    color: stamp.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: stamp.color, boxShadow: `0 0 6px ${stamp.color}` }} />
                    <span>{stamp.text}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                    border: 'none',
                    color: darkMode ? '#cbd5e1' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Mobile Scrollable Content */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                padding: '14px 16px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}>
                {/* 1. Request Title & Overview */}
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '14.5px',
                    fontWeight: 800,
                    color: darkMode ? '#ffffff' : '#0f172a',
                    fontFamily: "'Tajawal', sans-serif",
                    lineHeight: 1.4,
                  }}>
                    {isRtl ? request.title : request.titleEn || request.title}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                      <Building2 size={13} color="#38bdf8" />
                      <span style={{ fontWeight: 700, color: darkMode ? '#e2e8f0' : '#334155' }}>
                        {request.department || 'إدارة تقنية المعلومات'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                      <Calendar size={13} color="#f59e0b" />
                      <span style={{ fontWeight: 600, color: darkMode ? '#e2e8f0' : '#334155' }}>
                        {request.date || '2026/10/23'}
                      </span>
                    </div>
                  </div>

                  {((request as any).description || (request as any).notes) && (
                    <div style={{
                      marginTop: '4px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.25)' : '#ffffff',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid #e2e8f0',
                      fontSize: '11.5px',
                      color: darkMode ? '#cbd5e1' : '#475569',
                      lineHeight: 1.5,
                    }}>
                      {(request as any).description || (request as any).notes}
                    </div>
                  )}
                </div>

                {/* Parsed Form Details Micro-Cards on Mobile */}
                {parsedFormDetails.length > 0 && (
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc',
                    border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: darkMode ? '#38bdf8' : '#135d79' }}>
                      تفاصيل ومدخلات الطلب:
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {parsedFormDetails.map((detail, idx) => (
                        <div key={idx} style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(0, 0, 0, 0.25)' : '#ffffff',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid #cbd5e1',
                          fontSize: '10.5px'
                        }}>
                          <div style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '9.5px' }}>{detail.label}</div>
                          <div style={{ color: darkMode ? '#ffffff' : '#0f172a', fontWeight: 700 }}>{detail.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mobile Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={handleDirectCancel}
                      disabled={!isDirectCancelAllowed || isCancelling}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: isDirectCancelAllowed ? '1px solid rgba(239, 68, 68, 0.4)' : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                        backgroundColor: isDirectCancelAllowed ? 'rgba(239, 68, 68, 0.12)' : (darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f1f5f9'),
                        color: isDirectCancelAllowed ? '#ef4444' : '#94a3b8',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: isDirectCancelAllowed && !isCancelling ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontFamily: "'Cairo', sans-serif"
                      }}
                    >
                      <Ban size={12} />
                      <span>{isCancelling ? 'جارٍ الإلغاء...' : 'إلغاء الطلب'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCancelModal(true)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: darkMode ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #f59e0b',
                        backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                        color: '#f59e0b',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        fontFamily: "'Cairo', sans-serif"
                      }}
                    >
                      <AlertCircle size={12} />
                      <span>طلب إلغاء الطلب</span>
                    </button>
                  </div>

                  {isPostponed ? (
                    <button
                      type="button"
                      onClick={handleResume}
                      disabled={isResuming}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: isResuming ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontFamily: "'Cairo', sans-serif"
                      }}
                    >
                      <PlayCircle size={14} />
                      <span>{isResuming ? 'جارٍ الاستئناف...' : 'استئناف الطلب الآن'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowPostponeModal(true)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: darkMode ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #38bdf8',
                        backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.08)' : '#f0f9ff',
                        color: darkMode ? '#38bdf8' : '#0284c7',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontFamily: "'Cairo', sans-serif"
                      }}
                    >
                      <PauseCircle size={14} />
                      <span>طلب تأجيل الموعد</span>
                    </button>
                  )}
                </div>

                {/* 2. Rating Box (Immediate Thumb-Access on Mobile) */}
                {renderRatingBox()}

                {/* 3. Concise Vertical Progress Stepper (بديل الخريطة والتعقيد على الموبايل) */}
                <div style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc',
                  border: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#f1f5f9' : '#0f172a' }}>
                      مسار وتطور الإجراءات ({journeySteps.length})
                    </span>
                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                      متابعة فورية ✓
                    </span>
                  </div>

                  {/* Stepper list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0px', position: 'relative' }}>
                    {journeySteps.map((step: any, idx: number) => {
                      const isDone = step.status === 'completed';
                      const isLast = idx === journeySteps.length - 1;

                      return (
                        <div key={step.id || idx} style={{ display: 'flex', gap: '10px', position: 'relative', minHeight: '44px' }}>
                          {!isLast && (
                            <div style={{
                              position: 'absolute',
                              top: '20px',
                              right: '11px',
                              width: '2px',
                              bottom: '-4px',
                              backgroundColor: isDone ? '#10b981' : (darkMode ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1'),
                            }} />
                          )}

                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: isDone
                              ? '#10b981'
                              : (darkMode ? 'rgba(56, 189, 248, 0.2)' : 'rgba(19, 93, 121, 0.15)'),
                            border: isDone ? '2px solid #10b981' : '2px solid #38bdf8',
                            color: isDone ? '#ffffff' : '#38bdf8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            flexShrink: 0,
                          }}>
                            {isDone ? <Check size={13} strokeWidth={3} /> : <Clock size={12} />}
                          </div>

                          <div style={{ flex: 1, paddingBottom: isLast ? '0' : '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: isDone ? (darkMode ? '#f8fafc' : '#0f172a') : '#38bdf8',
                              }}>
                                {step.label}
                              </span>
                              {step.timestamp && (
                                <span style={{ fontSize: '10px', color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                                  {step.timestamp}
                                </span>
                              )}
                            </div>
                            {step.actor && (
                              <div style={{ fontSize: '10.5px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '1px' }}>
                                الجهة / الموظف: <strong style={{ color: darkMode ? '#cbd5e1' : '#334155' }}>{step.actor}</strong>
                              </div>
                            )}
                            {step.notes && (
                              <div style={{ fontSize: '10px', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                                {step.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            /* ══════════════════════════════════════════════════════════════════
               DESKTOP CINEMA TICKET MODAL (تذكرة سينمائية متقدمة للمكتب)
               ══════════════════════════════════════════════════════════════════ */
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              style={{
                position: 'relative',
                width: '1040px',
                maxWidth: '96vw',
                height: '570px',
                maxHeight: '90vh',
                zIndex: 305,
                fontFamily: "'Cairo', sans-serif",
              }}
            >
              <CinemaTicketFrame
                accentColor={stamp.color}
                alwaysGlow={true}
                cornerCutout={14}
                notchRadius={5.5}
                numNotches={3}
                dashIndent={20}
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
                  flexDirection: 'row',
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

                  {/* Meta Pills & Parsed Details (المربع الأحمر: تفاصيل الطلب تامة) */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '5px',
                      maxHeight: '135px',
                      overflowY: 'auto',
                      padding: '2px 1px',
                      marginBottom: '8px',
                    }}
                  >
                    {parsedFormDetails.map((detail, idx) => (
                      <div
                        key={idx}
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
                        <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                          {detail.label}:
                        </span>
                        <span style={{ color: darkMode ? '#f1f5f9' : '#0f172a', fontWeight: 700, textAlign: 'left', wordBreak: 'break-word', maxWidth: '65%' }}>
                          {detail.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Notice message if any */}
                  {actionNotice && (
                    <div
                      style={{
                        padding: '6px 8px',
                        borderRadius: '6px',
                        marginBottom: '6px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        backgroundColor: actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${actionNotice.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        color: actionNotice.type === 'success' ? '#10b981' : '#ef4444',
                        textAlign: 'center'
                      }}
                    >
                      {actionNotice.text}
                    </div>
                  )}

                  {/* Action Buttons: إلغاء الطلب المباشر | طلب إلغاء | تأجيل الموعد أو الاستئناف */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                      {/* 1. Direct Cancel Button (Active only if status === pending) */}
                      <button
                        type="button"
                        onClick={handleDirectCancel}
                        disabled={!isDirectCancelAllowed || isCancelling}
                        title={isDirectCancelAllowed ? 'إلغاء الطلب نهائياً قبل استلامه' : 'لا يمكن الإلغاء المباشر بعد بدء المعالجة - يمكنك تقديم طلب إلغاء'}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: isDirectCancelAllowed
                            ? '1px solid rgba(239, 68, 68, 0.4)'
                            : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                          backgroundColor: isDirectCancelAllowed
                            ? 'rgba(239, 68, 68, 0.12)'
                            : (darkMode ? 'rgba(255, 255, 255, 0.03)' : '#f1f5f9'),
                          color: isDirectCancelAllowed ? '#ef4444' : '#94a3b8',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: isDirectCancelAllowed && !isCancelling ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                          fontFamily: "'Cairo', sans-serif"
                        }}
                      >
                        <Ban size={11} />
                        <span>{isCancelling ? 'جارٍ الإلغاء...' : 'إلغاء الطلب'}</span>
                      </button>

                      {/* 2. Request Cancel Button (Always Available) */}
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '6px',
                          border: darkMode ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #f59e0b',
                          backgroundColor: darkMode ? 'rgba(245, 158, 11, 0.1)' : '#fffbeb',
                          color: '#f59e0b',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                          fontFamily: "'Cairo', sans-serif"
                        }}
                      >
                        <AlertCircle size={11} />
                        <span>طلب إلغاء الطلب</span>
                      </button>
                    </div>

                    {/* 3. Postpone or Resume Button */}
                    {isPostponed ? (
                      <button
                        type="button"
                        onClick={handleResume}
                        disabled={isResuming}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: '#10b981',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: isResuming ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                          fontFamily: "'Cairo', sans-serif"
                        }}
                      >
                        <PlayCircle size={12} />
                        <span>{isResuming ? 'جارٍ الاستئناف...' : 'استئناف الطلب الآن'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowPostponeModal(true)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '6px',
                          border: darkMode ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #38bdf8',
                          backgroundColor: darkMode ? 'rgba(56, 189, 248, 0.08)' : '#f0f9ff',
                          color: darkMode ? '#38bdf8' : '#0284c7',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease',
                          fontFamily: "'Cairo', sans-serif"
                        }}
                      >
                        <PauseCircle size={12} />
                        <span>طلب تأجيل الموعد</span>
                      </button>
                    )}
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
                      NEXUS TDS • TICKETING DYNAMIC SYSTEM • نظام التذاكر الموحد
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
                  {/* Badge: تفاصيل ومكان الطلب الحالي + شعار النظام */}
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: darkMode ? 'rgba(19, 93, 121, 0.12)' : 'rgba(19, 93, 121, 0.07)',
                      border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.28)' : '1.5px solid rgba(19, 93, 121, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '7px',
                          background: 'linear-gradient(135deg, #135d79 0%, #f36c21 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          fontWeight: 900,
                          fontSize: '11px',
                          boxShadow: '0 2px 8px rgba(19, 93, 121, 0.35)',
                          flexShrink: 0
                        }}
                      >
                        N
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#38bdf8' : '#135d79', fontFamily: "'Tajawal', sans-serif" }}>
                          تفاصيل ومكان الطلب الحالي
                        </span>
                        <span style={{ fontSize: '9.5px', color: darkMode ? '#94a3b8' : '#64748b' }}>
                          NEXUS TDS • المتابعة الجغرافية والإجرائية الموحدة
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #cbd5e1',
                          color: darkMode ? '#e2e8f0' : '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <MapPin size={11} color="#38bdf8" />
                        <span>الموقع: {journeySteps[journeySteps.length - 1]?.actor || request.department || 'الجهة المستلمة'}</span>
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
                    بوابة الموظف المركزية • NEXUS TDS TICKETING DYNAMIC SYSTEM
                  </span>
                </div>
              </div>
            </CinemaTicketFrame>
          </motion.div>
          )}

          {/* ══════════════════════════════════════════════════════════
              SUB-MODAL 1: طلب إلغاء المعاملة مع بيان السبب
              ══════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {showCancelModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowCancelModal(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.72)',
                    backdropFilter: 'blur(8px)',
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '440px',
                    borderRadius: '16px',
                    backgroundColor: darkMode ? '#0e1726' : '#ffffff',
                    border: darkMode ? '1.5px solid rgba(245, 158, 11, 0.4)' : '1.5px solid #f59e0b',
                    padding: '20px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    zIndex: 405,
                    fontFamily: "'Cairo', sans-serif",
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <AlertCircle size={18} />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                        تقديم طلب إلغاء المعاملة
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(false)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '11px', color: darkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>
                    سيتم إرسال طلب الإلغاء للجهة المستلمة للموافقة عليه وأرشفة المعاملة رسمياً. يرجى اختيار سبب الإلغاء:
                  </p>

                  {/* Reasons list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {cancelReasonsList.map((reason) => (
                      <label
                        key={reason}
                        onClick={() => setSelectedCancelReason(reason)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: selectedCancelReason === reason
                            ? '1.5px solid #f59e0b'
                            : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                          backgroundColor: selectedCancelReason === reason
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'transparent',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: selectedCancelReason === reason ? '#f59e0b' : (darkMode ? '#e2e8f0' : '#334155'),
                          fontWeight: selectedCancelReason === reason ? 700 : 500,
                        }}
                      >
                        <input
                          type="radio"
                          name="cancelReason"
                          checked={selectedCancelReason === reason}
                          onChange={() => setSelectedCancelReason(reason)}
                          style={{ accentColor: '#f59e0b' }}
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {/* Additional notes */}
                  <textarea
                    value={cancelReasonNote}
                    onChange={(e) => setCancelReasonNote(e.target.value)}
                    placeholder="ملاحظات توضيحية إضافية (اختياري)..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                      backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                      color: darkMode ? '#ffffff' : '#0f172a',
                      fontSize: '11px',
                      fontFamily: "'Cairo', sans-serif",
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={handleRequestCancellation}
                      disabled={isSubmittingCancel}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#f59e0b',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: isSubmittingCancel ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      <Send size={13} />
                      <span>{isSubmittingCancel ? 'جارٍ الإرسال...' : 'إرسال طلب الإلغاء'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelModal(false)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                        backgroundColor: 'transparent',
                        color: darkMode ? '#cbd5e1' : '#64748b',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      تراجع
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ══════════════════════════════════════════════════════════
              SUB-MODAL 2: طلب تأجيل موعد حل المشكلة
              ══════════════════════════════════════════════════════════ */}
          <AnimatePresence>
            {showPostponeModal && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                }}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPostponeModal(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.72)',
                    backdropFilter: 'blur(8px)',
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '440px',
                    borderRadius: '16px',
                    backgroundColor: darkMode ? '#0e1726' : '#ffffff',
                    border: darkMode ? '1.5px solid rgba(56, 189, 248, 0.4)' : '1.5px solid #0284c7',
                    padding: '20px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    zIndex: 405,
                    fontFamily: "'Cairo', sans-serif",
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <PauseCircle size={18} />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: darkMode ? '#ffffff' : '#0f172a' }}>
                        طلب تأجيل موعد المعاملة
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPostponeModal(false)}
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <p style={{ margin: 0, fontSize: '11px', color: darkMode ? '#cbd5e1' : '#64748b', lineHeight: 1.5 }}>
                    يمكنك تأجيل متابعة هذا الطلب مؤقتاً في حال عدم توفرك بمقر العمل أو انشغال الجهاز، مع إمكانية استئنافه لاحقاً.
                  </p>

                  {/* Postpone reasons list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {postponeReasonsList.map((reason) => (
                      <label
                        key={reason}
                        onClick={() => setSelectedPostponeReason(reason)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: selectedPostponeReason === reason
                            ? '1.5px solid #38bdf8'
                            : (darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0'),
                          backgroundColor: selectedPostponeReason === reason
                            ? 'rgba(56, 189, 248, 0.12)'
                            : 'transparent',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: selectedPostponeReason === reason ? '#38bdf8' : (darkMode ? '#e2e8f0' : '#334155'),
                          fontWeight: selectedPostponeReason === reason ? 700 : 500,
                        }}
                      >
                        <input
                          type="radio"
                          name="postponeReason"
                          checked={selectedPostponeReason === reason}
                          onChange={() => setSelectedPostponeReason(reason)}
                          style={{ accentColor: '#38bdf8' }}
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {/* Mode of resumption */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '8px', backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', cursor: 'pointer', color: darkMode ? '#e2e8f0' : '#1e293b' }}>
                      <input
                        type="checkbox"
                        checked={isManualResume}
                        onChange={(e) => setIsManualResume(e.target.checked)}
                        style={{ accentColor: '#38bdf8' }}
                      />
                      <span>استئناف يدوي بضغطة زر عند الجاهزية</span>
                    </label>
                  </div>

                  {!isManualResume && (
                    <div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginBottom: '3px' }}>الموعد المتوقع للعودة / الاستئناف:</div>
                      <input
                        type="date"
                        value={expectedPostponeDate}
                        onChange={(e) => setExpectedPostponeDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                          color: darkMode ? '#ffffff' : '#0f172a',
                          fontSize: '11px',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  )}

                  {/* Additional notes */}
                  <textarea
                    value={postponeNote}
                    onChange={(e) => setPostponeNote(e.target.value)}
                    placeholder="ملاحظات إضافية للفريق الفني (اختياري)..."
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                      backgroundColor: darkMode ? '#1e293b' : '#f8fafc',
                      color: darkMode ? '#ffffff' : '#0f172a',
                      fontSize: '11px',
                      fontFamily: "'Cairo', sans-serif",
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={handlePostpone}
                      disabled={isSubmittingPostpone}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#135d79',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: isSubmittingPostpone ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      <PauseCircle size={13} />
                      <span>{isSubmittingPostpone ? 'جارٍ الحفظ...' : 'تأكيد طلب التأجيل'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPostponeModal(false)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: darkMode ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                        backgroundColor: 'transparent',
                        color: darkMode ? '#cbd5e1' : '#64748b',
                        fontSize: '11.5px',
                        cursor: 'pointer',
                        fontFamily: "'Cairo', sans-serif",
                      }}
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
