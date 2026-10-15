import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertCircle, Plus, ChevronLeft, ArrowUpRight, FileText, AlertTriangle, XCircle } from 'lucide-react';
import { useHub } from '../context/HubContext';
import { useMemo, useState } from 'react';
import { RequestTrackingModal } from './RequestTrackingModal';
import { UserRecentRequest } from '../types';

export function RecentRequestsWidget() {
  const { setRequestOpen, setActiveRequest, openTechSupport, userRequests, canCreateRequest, language, t } = useHub();
  const isRtl = language === 'ar';

  const [selectedRequest, setSelectedRequest] = useState<UserRecentRequest | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [blockingError, setBlockingError] = useState<{ message: string; messageEn: string } | null>(null);

  const handleItemClick = (item: UserRecentRequest) => {
    setSelectedRequest(item);
    setIsTrackingOpen(true);
  };

  const handleNewRequest = () => {
    setActiveRequest(null);
    setRequestOpen(true);
  };

  const getStatusBadge = (status: UserRecentRequest['status'], label: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-700/60 uppercase">
            <span className="size-1.5 bg-amber-500 rounded-full animate-pulse" />
            {label}
          </span>
        );
      case 'approved':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-700/60 uppercase">
            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
            {label}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-700/60 uppercase">
            <Clock className="size-3 text-blue-600 dark:text-blue-400" />
            {label}
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-700/60 uppercase">
            <XCircle className="size-3 text-rose-600 dark:text-rose-400" />
            {label}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <section className="glass-card rounded-[32px] p-5 space-y-4 border border-white/70 dark:border-slate-800 shadow-lg text-start rtl:text-right">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shadow-xs">
              <FileText className="size-4.5" />
            </div>
            <div>
              <h3 className="font-display font-black text-slate-900 dark:text-white text-sm tracking-tight">
                {isRtl ? 'حالة طلباتي الأخيرة' : 'Recent Request Status'}
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground">
                {isRtl ? 'متابعة مباشرة لمسار الإجراءات' : 'Live status of internal workflows'}
              </p>
            </div>
          </div>

          <Link
            to="/requests"
            className="inline-flex items-center gap-1 text-[11px] font-black text-accent hover:underline uppercase tracking-tight"
          >
            <span>{isRtl ? 'السجل' : 'History'}</span>
            <ArrowUpRight className="size-3 rtl:rotate-0" />
          </Link>
        </div>

        {/* Requests List */}
        <div className="space-y-2.5">
          {userRequests.map((item) => (
            <div
              key={item.id}
              className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/70 transition-all hover:shadow-sm group cursor-pointer"
              onClick={() => handleItemClick(item)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-primary dark:group-hover:text-accent transition-colors">
                    {isRtl ? item.title : item.titleEn}
                  </p>
                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-400 mt-0.5">
                    {item.code} • {isRtl ? item.department : item.departmentEn}
                  </p>
                </div>
                <div className="shrink-0">
                  {getStatusBadge(item.status, isRtl ? item.statusLabel : item.statusLabelEn)}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                  📍 {isRtl ? item.stage : item.stageEn}
                </span>
                <span className="text-slate-400">{item.date}</span>
              </div>
              
              {/* Rating Prompt Badge if completed and not rated */}
              {item.status === 'completed' && !item.rating && (
                <div className="mt-2 flex items-center gap-1.5 text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-lg border border-rose-100 dark:border-rose-900/30 animate-pulse">
                  <AlertTriangle className="size-3" />
                  {isRtl ? 'بانتظار تقييمك لإغلاق المسار' : 'Pending your rating to close track'}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom CTA for new request */}
        <button
          onClick={handleNewRequest}
          className="w-full py-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-black rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow-sm active:scale-[0.99]"
        >
          <Plus className="size-3.5 text-accent" strokeWidth={3} />
          <span>{isRtl ? 'تقديم طلب إداري أو فني جديد' : 'Submit New Request'}</span>
        </button>
      </section>

      <RequestTrackingModal 
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        request={selectedRequest}
      />
    </>
  );
}
