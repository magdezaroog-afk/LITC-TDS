import React, { useState } from 'react';
import { useAuth } from '../../../engine/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Target, Send, Calendar, Clock, Loader2, Sparkles, CheckCircle2, AlertCircle, Eye, Coins, Star } from 'lucide-react';

export default function ChallengeManagerComponent() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'إنجاز مهام',
    departmentName: 'عام',
    challengeType: 'فردي',
    deadline: '',
    rewardPoints: 100,
    badge: '🏆',
    iconName: 'Target'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBadgeSelect = (badge: string) => {
    setFormData(prev => ({ ...prev, badge }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/v1/functional/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'تم إطلاق التحدي بنجاح' });
        setFormData({ ...formData, title: '', description: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'حدث خطأ أثناء الإطلاق' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'تعذر الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  const badgeOptions = ['🏆', '⭐', '🔥', '🚀', '💡', '🎯', '🏅', '💎'];

  return (
    <div className="w-full flex flex-col xl:flex-row gap-6 rtl:text-right" dir="rtl">
      {/* Editor Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-200/60 dark:border-slate-700/50 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -z-10" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="size-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
            <Trophy className="size-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">إنشاء تحدي جديد</h2>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">حفّز الموظفين من خلال تحديات ومكافآت ذكية</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">اسم التحدي</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} placeholder="مثال: بطل خدمة العملاء..." className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 outline-none transition-all text-sm font-bold shadow-sm" />
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">النقاط (المكافأة)</label>
              <div className="relative">
                <input type="number" name="rewardPoints" required value={formData.rewardPoints} onChange={handleChange} className="w-full p-4 pe-12 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 outline-none transition-all text-sm font-bold shadow-sm" />
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-amber-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">تاريخ الانتهاء</label>
              <input type="datetime-local" name="deadline" required value={formData.deadline} onChange={handleChange} className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 outline-none transition-all text-sm font-bold shadow-sm" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">القسم المستهدف</label>
              <select name="departmentName" value={formData.departmentName} onChange={handleChange} className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 outline-none transition-all text-sm font-bold shadow-sm">
                <option value="عام">عام (الجميع)</option>
                <option value="تقنية المعلومات">تقنية المعلومات</option>
                <option value="الموارد البشرية">الموارد البشرية</option>
                <option value="المالية">المالية</option>
                <option value="خدمة العملاء">خدمة العملاء</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">شرح التحدي</label>
            <textarea name="description" required value={formData.description} onChange={handleChange} placeholder="اشرح ما يجب على الموظف فعله لاجتياز التحدي..." rows={3} className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 outline-none transition-all text-sm font-semibold shadow-sm resize-none" />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">اختر شارة التحدي (Badge)</label>
            <div className="flex flex-wrap gap-3">
              {badgeOptions.map((badge) => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => handleBadgeSelect(badge)}
                  className={`size-12 rounded-2xl text-2xl flex items-center justify-center transition-all ${formData.badge === badge ? 'bg-amber-100 dark:bg-amber-900/40 border-2 border-amber-500 scale-110 shadow-lg shadow-amber-500/20' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'}`}
                >
                  {badge}
                </button>
              ))}
            </div>
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

          <button type="submit" disabled={loading || !formData.title} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2 group shadow-lg shadow-amber-500/20">
            {loading ? <Loader2 className="size-5 animate-spin" /> : (
              <>
                <Sparkles className="size-5" />
                <span>إطلاق التحدي الآن</span>
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
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">معاينة بطاقة التحدي</h3>
        </div>
        
        <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 rounded-[32px] p-4 lg:p-6 border border-slate-200/60 dark:border-slate-700/50 flex flex-col items-center justify-center">
          
          <div className="w-full bg-white dark:bg-slate-900 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-xl group hover:border-amber-500/50 transition-colors relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
            
            <div className="flex items-start justify-between mb-4 relative">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-2xl shadow-inner border border-amber-200 dark:border-amber-800">
                  {formData.badge}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">{formData.title || 'اسم التحدي'}</h4>
                  <p className="text-[10px] font-bold text-amber-600 dark:text-amber-500 mt-0.5 flex items-center gap-1">
                    <Star className="size-3 fill-amber-500" />
                    {formData.rewardPoints || 0} نقطة
                  </p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500">
                {formData.departmentName}
              </div>
            </div>

            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-5 relative">
              {formData.description || 'شرح التحدي وما يجب على الموظف القيام به...'}
            </p>

            <div className="flex items-center justify-between relative">
              <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-bold">
                <Clock className="size-3.5" />
                <span>ينتهي: {formData.deadline ? new Date(formData.deadline).toLocaleDateString('ar-LY') : 'غير محدد'}</span>
              </div>
              <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded-xl hover:scale-105 active:scale-95 transition-all">
                المشاركة الآن
              </button>
            </div>
          </div>

          <div className="mt-8 text-center max-w-xs">
            <Target className="size-6 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">التصميم يعكس ما سيراه الموظف في لوحة "التحديات" الخاصة به.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
