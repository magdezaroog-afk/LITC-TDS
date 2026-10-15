/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Mail, 
  Paperclip, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Tag
} from 'lucide-react';
import { useHub } from '../context/HubContext';

export function EmailComposerModal() {
  const { 
    activeEmailTarget, 
    setActiveEmailTarget, 
    language 
  } = useHub();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'confidential'>('normal');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const isRtl = language === 'ar';

  if (!activeEmailTarget) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        setActiveEmailTarget(null);
      }, 2000);
    }, 1000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setActiveEmailTarget(null)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 p-6 text-start rtl:text-right"
        >
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Mail className="size-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {isRtl ? 'إرسال بريد إلكتروني رسمي' : 'Send Official In-App Email'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {isRtl ? `إلى: ${activeEmailTarget.name} (${activeEmailTarget.email})` : `To: ${activeEmailTarget.name} (${activeEmailTarget.email})`}
                </p>
              </div>
            </div>

            <button
              onClick={() => setActiveEmailTarget(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {sentSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-8" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {isRtl ? 'تم إرسال البريد بنجاح!' : 'Email Dispatched Successfully!'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRtl ? 'تم توجيه رسالتك عبر نظام البريد الداخلي الموحد لشركة LITC.' : 'Message routed via internal corporate mail system.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isRtl ? 'عنوان الموضوع' : 'Subject'}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={isRtl ? 'أدخل موضوع الرسالة...' : 'Enter email subject...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isRtl ? 'درجة الأولوية' : 'Priority Level'}
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'normal', label: isRtl ? 'عادي' : 'Normal' },
                    { id: 'urgent', label: isRtl ? 'عاجل' : 'Urgent' },
                    { id: 'confidential', label: isRtl ? 'سري' : 'Confidential' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id as any)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        priority === p.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isRtl ? 'نص الرسالة' : 'Message Body'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={isRtl ? 'اكتب تفاصيل الرسالة هنا...' : 'Write message content here...'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs sm:text-sm text-slate-900 dark:text-white outline-hidden focus:ring-2 focus:ring-accent resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveEmailTarget(null)}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className={`size-3.5 ${isRtl ? 'rotate-180' : ''}`} />
                  <span>{isSending ? (isRtl ? 'جاري الإرسال...' : 'Sending...') : (isRtl ? 'إرسال الرسالة' : 'Send Email')}</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
