import React, { useState } from 'react';
import { useAuth } from '../../../engine/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Image as ImageIcon, Send, Pin, Eye, Calendar, Clock, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function NewsManagerComponent() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/functional/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, body, isPublished, isPinned, coverImage })
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'تم نشر الخبر بنجاح' });
        setTitle('');
        setBody('');
        setIsPublished(false);
        setIsPinned(false);
        setCoverImage('');
      } else {
        setMessage({ type: 'error', text: data.error || 'حدث خطأ أثناء النشر' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 rtl:text-right" dir="rtl">
      {/* Editor Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-700/50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-accent to-orange-600 flex items-center justify-center text-white shadow-lg shadow-accent/30">
            <Megaphone className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">نشر خبر رسمي</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">قم بإنشاء وتعميم الأخبار على مستوى المؤسسة</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">عنوان الخبر</label>
            <input 
              type="text" 
              required 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="مثال: ترقية نظام الموارد البشرية الجديد..."
              className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:border-accent dark:focus:border-accent outline-none transition-all text-sm font-bold shadow-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">التفاصيل الكاملة</label>
            <textarea 
              required 
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="اكتب تفاصيل الخبر هنا..."
              rows={6}
              className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:border-accent dark:focus:border-accent outline-none transition-all text-sm font-semibold leading-relaxed shadow-sm resize-none custom-scrollbar"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">صورة الغلاف (اختياري)</label>
            <div className="relative group cursor-pointer">
              <input 
                type="text" 
                value={coverImage} 
                onChange={e => setCoverImage(e.target.value)} 
                placeholder="رابط الصورة (URL)..."
                className="w-full p-4 pe-12 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:border-accent outline-none transition-all text-sm font-semibold shadow-sm"
              />
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-accent transition-colors" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isPublished ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
              <div className={`size-6 rounded-md flex items-center justify-center transition-colors ${isPublished ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'}`}>
                <CheckCircle2 className="size-4" />
              </div>
              <input type="checkbox" className="hidden" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
              <div>
                <span className={`block text-sm font-black ${isPublished ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>نشر فوراً</span>
                <span className="text-[10px] text-slate-500 font-bold">يظهر للموظفين مباشرة</span>
              </div>
            </label>

            <label className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${isPinned ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
              <div className={`size-6 rounded-md flex items-center justify-center transition-colors ${isPinned ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-transparent'}`}>
                <Pin className="size-4" />
              </div>
              <input type="checkbox" className="hidden" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} />
              <div>
                <span className={`block text-sm font-black ${isPinned ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>تثبيت في الأعلى</span>
                <span className="text-[10px] text-slate-500 font-bold">يبقى في الواجهة الرئيسية</span>
              </div>
            </label>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 rounded-2xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 border border-rose-100 dark:border-rose-900/30'}`}
              >
                {message.type === 'success' ? <CheckCircle2 className="size-5" /> : <AlertCircle className="size-5" />}
                <span className="text-sm font-bold">{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            disabled={loading || !title || !body}
            className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-accent dark:hover:bg-accent hover:text-white hover:shadow-lg hover:shadow-accent/30 rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <>
                <Send className="size-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform rtl:group-hover:-translate-x-1" />
                <span>اعتماد ونشر الخبر</span>
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Live Preview Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full xl:w-[400px] flex flex-col"
      >
        <div className="flex items-center gap-2 mb-4 px-2">
          <Eye className="size-4 text-slate-400" />
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">معاينة حية للموظف</h3>
        </div>
        
        <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-[32px] p-4 lg:p-6 border border-slate-200/60 dark:border-slate-700/50 flex flex-col items-center justify-start">
          {/* Mock Phone/Card outline */}
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col group relative">
            
            {isPinned && (
              <div className="absolute top-3 right-3 z-10 bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <Pin className="size-3" />
                مثبت
              </div>
            )}

            {coverImage ? (
              <div className="w-full h-40 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400/f8fafc/94a3b8?text=Image+Error')} />
              </div>
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
                <Megaphone className="size-10 text-slate-300 dark:text-slate-700 absolute opacity-50 rotate-12" />
              </div>
            )}

            <div className="p-5 flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="px-2 py-1 rounded-md bg-accent/10 text-accent text-[9px] font-black uppercase">
                  {isPublished ? 'تم النشر' : 'مسودة'}
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-[9px] font-bold">
                  <Clock className="size-3" />
                  الآن
                </div>
              </div>
              
              <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">
                {title || 'عنوان الخبر سيظهر هنا...'}
              </h4>
              
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4">
                {body || 'تفاصيل الخبر ومحتواه سيظهر في هذه المساحة بشكل منسق...'}
              </p>

              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] font-bold text-slate-500">{user?.name || 'الإدارة'}</span>
                </div>
                <button className="text-[10px] font-black text-accent flex items-center gap-1 hover:gap-2 transition-all">
                  اقرأ المزيد
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center max-w-xs">
            <Sparkles className="size-6 text-amber-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">التصميم يعكس ما سيراه الموظف على الشاشة الرئيسية تماماً بنظام Glassmorphism</p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
