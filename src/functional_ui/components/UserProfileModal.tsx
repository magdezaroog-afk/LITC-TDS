import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  MessageSquare, 
  Building2
} from 'lucide-react';
import { useHub } from '../context/HubContext';

export function UserProfileModal() {
  const { 
    activeProfileTarget, 
    setActiveProfileTarget, 
    setActiveChatTarget,
    setActiveEmailTarget,
    language 
  } = useHub();

  const isRtl = language === 'ar';

  if (!activeProfileTarget) return null;

  const handleOpenChat = () => {
    const target = activeProfileTarget;
    setActiveProfileTarget(null);
    setActiveChatTarget(target);
  };

  const handleOpenEmail = () => {
    const target = activeProfileTarget;
    setActiveProfileTarget(null);
    setActiveEmailTarget(target);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveProfileTarget(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-6 z-10 overflow-hidden"
        >
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="size-5 text-accent" />
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100">
                {isRtl ? 'بطاقة الموظف المؤسسية' : 'Employee Profile'}
              </h2>
            </div>

            <button
              onClick={() => setActiveProfileTarget(null)}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Profile Overview */}
          <div className="pt-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative shrink-0">
              <img
                src={activeProfileTarget.avatar}
                alt={activeProfileTarget.name}
                className="size-20 sm:size-24 rounded-3xl object-cover border-2 border-white dark:border-slate-700 shadow-md bg-slate-100 dark:bg-slate-800"
              />
              <span className="absolute bottom-1 end-1 size-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800" />
            </div>

            <div className="text-center sm:text-start rtl:sm:text-right flex-1 min-w-0">
              <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                {activeProfileTarget.name}
              </h3>
              <p className="text-xs sm:text-sm font-bold text-accent mt-0.5 truncate">
                {activeProfileTarget.role}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {activeProfileTarget.dept} • شركة الاتصالات الدولية الليبية LITC
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-4">
                <button
                  onClick={handleOpenChat}
                  className="px-4 py-2 rounded-2xl bg-accent text-white hover:bg-accent/90 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <MessageSquare className="size-3.5" />
                  <span>{isRtl ? 'محادثة مباشرة' : 'Direct Chat'}</span>
                </button>

                <button
                  onClick={handleOpenEmail}
                  className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Mail className="size-3.5 text-indigo-500" />
                  <span>{isRtl ? 'إرسال بريد' : 'Send Email'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Extended Details */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <Mail className="size-4 text-slate-400 shrink-0" />
                <span className="truncate">{activeProfileTarget.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <Phone className="size-4 text-slate-400 shrink-0" />
                <span>{activeProfileTarget.phone || '+218 21 000 0000'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <MapPin className="size-4 text-slate-400 shrink-0" />
                <span>{activeProfileTarget.location || (isRtl ? 'المقر الرئيسي، طرابلس' : 'HQ, Tripoli')}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                <Briefcase className="size-4 text-slate-400 shrink-0" />
                <span>{isRtl ? 'موظف مثبت دوام كامل' : 'Full-time Employee'}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
