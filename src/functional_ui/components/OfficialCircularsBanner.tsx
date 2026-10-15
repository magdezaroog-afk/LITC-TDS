import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  FileText, 
  HeartPulse, 
  CreditCard, 
  GraduationCap, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Download, 
  Share2, 
  ExternalLink,
  Lock,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';
import { useHub } from '../context/HubContext';

export interface OfficialCircularStory {
  id: string;
  department: {
    name: string;
    code: string;
    subtext: string;
    avatarBg: string;
    icon: any;
    color: string;
  };
  title: string;
  refNumber: string;
  date: string;
  importance: string;
  badgeBg: string;
  ringColor: string;
  summary: string;
  fullContent: string[];
  attachedDocName?: string;
  acknowledgedCount: number;
}

const OFFICIAL_STORIES_DATA: OfficialCircularStory[] = [
  {
    id: 'c1',
    department: {
      name: 'الإدارة العليا ومجلس الإدارة',
      code: 'EXEC',
      subtext: 'مكتب المدير العام',
      avatarBg: 'bg-amber-900 text-yellow-400',
      icon: Building2,
      color: 'text-yellow-500'
    },
    title: 'قرار إداري رقم (4) بشأن مكافآت التميز والإنتاجية',
    refNumber: 'LITC-EXEC-2026-084',
    date: 'منذ ساعتين',
    importance: 'هام جداً',
    badgeBg: 'bg-amber-600 text-white',
    ringColor: 'from-amber-500 via-yellow-400 to-amber-700',
    summary: 'اعتماد خطة الحوافز التقديرية لكافة الإدارات التشغيلية والتقنية تقديراً للأداء القياسي للربع المنصرم.',
    fullContent: [
      'بناءً على نتائج التقييم الربعي لمؤشرات الأداء الرئيسية (KPIs)، يسر الإدارة العليا الإعلان عن صرف مكافأة التميز الاستثنائية لجميع الفرق.',
      'سيتم إدراج المكافآت مع كشوف المرتبات المعتمدة، مع منح شهادات تقدير للمشاريع الأكثر ابتكاراً.',
      'تثمن الإدارة العليا جهود كافة الزملاء وتؤكد على استمرار دعم الكفاءات الوطنية المتميزة.'
    ],
    attachedDocName: 'قرار_رقم_4_مكافآت_التميز.pdf',
    acknowledgedCount: 142
  },
  {
    id: 'c2',
    department: {
      name: 'إدارة الموارد البشرية (HR)',
      code: 'HR',
      subtext: 'شؤون الموظفين واللوائح',
      avatarBg: 'bg-blue-900 text-blue-300',
      icon: Users,
      color: 'text-sky-400'
    },
    title: 'تعميم مواعيد العمل المرن وتحديث سياسة الإجازات',
    refNumber: 'LITC-HR-2026-112',
    date: 'اليوم',
    importance: 'تنظيمي',
    badgeBg: 'bg-blue-600 text-white',
    ringColor: 'from-blue-600 via-sky-400 to-indigo-600',
    summary: 'تنظيم سياسة الحضور الذكي وساعات العمل المرنة وتسهيل إجراءات تقديم الإجازات السنوية عبر البوابة.',
    fullContent: [
      'يبدأ تطبيق نظام الحضور المرن (من الساعة 8:00 إلى 9:00 صباحاً) مع الالتزام بإتمام الساعات المقررة.',
      'تحديث بوابات تقديم طلبات الإجازات بحيث تصبح الموافقة آلية ومباشرة خلال 24 ساعة للطلبات الاعتيادية.',
      'يرجى من جميع الموظفين مراجعة رصيد الإجازات المتبقي عبر صفحة "طلباتي" في المنظومة.'
    ],
    attachedDocName: 'لائحة_العمل_المرن_المحدثة_2026.pdf',
    acknowledgedCount: 218
  },
  {
    id: 'c3',
    department: {
      name: 'إدارة أمن وسرية المعلومات (Cyber Security)',
      code: 'SEC',
      subtext: 'الأمن الرقمي والامتثال',
      avatarBg: 'bg-emerald-950 text-emerald-400',
      icon: ShieldCheck,
      color: 'text-emerald-400'
    },
    title: 'تنبيه أمني: إلزامية تفعيل المصادقة الثنائية (2FA)',
    refNumber: 'LITC-SEC-2026-049',
    date: 'أمس',
    importance: 'عاجل',
    badgeBg: 'bg-emerald-600 text-white',
    ringColor: 'from-emerald-500 via-teal-400 to-cyan-600',
    summary: 'إلزامية تفعيل المصادقة الثنائية (2FA) لجميع الحسابات والبريد الإلكتروني المؤسسي قبل نهاية الشهر.',
    fullContent: [
      'ضمن خطة تعزيز الأمان السيبراني للشركة، يجب على جميع الموظفين ربط تطبيق المصادقة المعتمد بالبريد الإلكتروني.',
      'الحسابات التي لم يتم تفعيل الحماية الثنائية لها ستتطلب إعادة تعيين كلمة المرور من خلال فريق الدعم الفني.',
      'لأي استفسار أو مساعدة، يرجى فتح تذكرة دعم فني عبر البوابة.'
    ],
    attachedDocName: 'دليل_تفعيل_المصادقة_الثنائية_2FA.pdf',
    acknowledgedCount: 310
  },
  {
    id: 'c4',
    department: {
      name: 'إدارة الرعاية والتأمين الصحي',
      code: 'MED',
      subtext: 'الخدمات الطبية والتكافل',
      avatarBg: 'bg-rose-950 text-rose-400',
      icon: HeartPulse,
      color: 'text-rose-400'
    },
    title: 'توسعة شبكة المستشفيات المعتمدة لعام 2026',
    refNumber: 'LITC-MED-2026-023',
    date: 'منذ يومين',
    importance: 'إشعار رسمي',
    badgeBg: 'bg-rose-600 text-white',
    ringColor: 'from-rose-600 via-pink-500 to-red-600',
    summary: 'إضافة 15 مستشفى ومركزاً تخصصياً جديداً إلى شبكة التأمين الصحي المعتمدة لجميع الموظفين وعائلاتهم.',
    fullContent: [
      'يسر إدارة الخدمات الطبية الإعلان عن انضمام كبرى المستشفيات والعيادات التخصصية ومختبرات التحاليل إلى الشبكة المعتمدة.',
      'يمكن لجميع الموظفين استخدام البطاقة الطبية الرقمية المدمجة في المنظومة مباشرة دون الحاجة للبطاقة البلاستيكية.',
      'التغطية تشمل عيادات الأسنان، النظارات الطبية، والتحاليل الدورية بنسبة تغطية 100% داخل الشبكة.'
    ],
    attachedDocName: 'دليل_المستشفيات_والعيادات_المعتمدة_2026.pdf',
    acknowledgedCount: 184
  },
  {
    id: 'c5',
    department: {
      name: 'الإدارة المالية والمحاسبة',
      code: 'FIN',
      subtext: 'الرواتب والعهد المالية',
      avatarBg: 'bg-indigo-950 text-indigo-400',
      icon: CreditCard,
      color: 'text-indigo-400'
    },
    title: 'إيداع المرتبات الشهرية وبدل التطوير المهني',
    refNumber: 'LITC-FIN-2026-067',
    date: 'منذ 3 أيام',
    importance: 'إشعار رسمي',
    badgeBg: 'bg-indigo-600 text-white',
    ringColor: 'from-indigo-600 via-purple-500 to-violet-700',
    summary: 'إشعار بإتمام تحويل المرتبات الشهرية ومستحقات الدورات التدريبية المعتمدة لجميع الحسابات المصرفية.',
    fullContent: [
      'تم بحمد الله إيداع مرتبات الشهر الحالي في الحسابات المصرفية لجميع الموظفين.',
      'تم تضمين بدلات السفر والانتداب والمستحقات المعتمدة حتى تاريخ 25 من الشهر.',
      'يمكن الاطلاع على قسيمة الراتب الإلكترونية المفصلة عبر البوابة الذاتية للموظف.'
    ],
    attachedDocName: 'إشعار_التحويلات_المالية_الشهرية.pdf',
    acknowledgedCount: 265
  },
  {
    id: 'c6',
    department: {
      name: 'إدارة التدريب والتطوير المؤسسي',
      code: 'L&D',
      subtext: 'برامج القيادة والكفاءات',
      avatarBg: 'bg-amber-950 text-amber-300',
      icon: GraduationCap,
      color: 'text-amber-400'
    },
    title: 'فتح التسجيل في برامج الشهادات المهنية العالمية',
    refNumber: 'LITC-LD-2026-015',
    date: 'هذا الأسبوع',
    importance: 'تنظيمي',
    badgeBg: 'bg-amber-600 text-white',
    ringColor: 'from-orange-500 via-amber-400 to-yellow-600',
    summary: 'إتاحة 50 مقعداً تدريبياً مدعوماً بالكامل في مجالات الذكاء الاصطناعي، إدارة المشاريع PMP، وتحليل البيانات.',
    fullContent: [
      'تعلن إدارة التدريب عن فتح باب الترشح للحصول على الشهادات المهنية المعتمدة دولياً بدعم كامل 100%.',
      'يشمل البرنامج شهادات PMP، AWS Solutions Architect، Data Analytics، والتحول الرقمي المؤسسي.',
      'الأولوية للموظفين الذين أكملوا تحديات التطوير الذاتي في منظومة LITC.'
    ],
    attachedDocName: 'خطة_التدريب_والشهادات_الدولية_2026.pdf',
    acknowledgedCount: 198
  }
];

export function OfficialCircularsBanner() {
  const { language, t } = useHub();
  const isRtl = language === 'ar';

  const localizedData: OfficialCircularStory[] = useMemo(() => {
    if (language === 'ar') return OFFICIAL_STORIES_DATA;
    return [
      {
        id: 'c1',
        department: {
          name: 'Executive Management & Board',
          code: 'EXEC',
          subtext: 'General Manager Office',
          avatarBg: 'bg-amber-900 text-yellow-400',
          icon: Building2,
          color: 'text-yellow-500',
        },
        title: 'Administrative Decision (4) on Excellence & Productivity Bonuses',
        refNumber: 'LITC-EXEC-2026-084',
        date: '2 hours ago',
        importance: 'Urgent',
        badgeBg: 'bg-amber-600 text-white',
        ringColor: 'from-amber-500 via-yellow-400 to-amber-700',
        summary: 'Adoption of the discretionary incentive plan for all operational and tech departments.',
        fullContent: [
          'Based on quarterly KPI evaluations, Executive Management announces excellence rewards for all teams.',
          'Bonuses will be disbursed with approved payroll, along with certificates of appreciation.',
          'Executive Management praises team dedication to national excellence.',
        ],
        attachedDocName: 'Decision_4_Excellence_Bonuses.pdf',
        acknowledgedCount: 142,
      },
      {
        id: 'c2',
        department: {
          name: 'Human Resources (HR)',
          code: 'HR',
          subtext: 'Employee Affairs & Policies',
          avatarBg: 'bg-blue-900 text-blue-300',
          icon: Users,
          color: 'text-sky-400',
        },
        title: 'Flexible Work Hours Circular & Leave Policy Update',
        refNumber: 'LITC-HR-2026-112',
        date: 'Today',
        importance: 'Policy',
        badgeBg: 'bg-blue-600 text-white',
        ringColor: 'from-blue-600 via-sky-400 to-indigo-600',
        summary: 'Smart attendance policy and flexible schedule management with streamlined annual leave requests.',
        fullContent: [
          'Flexible arrival starts from 8:00 to 9:00 AM while completing mandatory hours.',
          'Leave portal updated for 24-hour expedited approval.',
          'Please review remaining leave balance in My Requests.',
        ],
        attachedDocName: 'Flexible_Work_Policy_2026.pdf',
        acknowledgedCount: 218,
      },
      {
        id: 'c3',
        department: {
          name: 'Cybersecurity & InfoSec',
          code: 'SEC',
          subtext: 'Security & Compliance',
          avatarBg: 'bg-emerald-950 text-emerald-400',
          icon: ShieldCheck,
          color: 'text-emerald-400',
        },
        title: 'Security Notice: Mandatory Two-Factor Authentication (2FA)',
        refNumber: 'LITC-SEC-2026-049',
        date: 'Yesterday',
        importance: 'Urgent',
        badgeBg: 'bg-emerald-600 text-white',
        ringColor: 'from-emerald-500 via-teal-400 to-cyan-600',
        summary: 'Mandatory 2FA activation for all company accounts before month end.',
        fullContent: [
          'All staff must link authenticator apps to enterprise emails.',
          'Unprotected accounts will require IT support password reset.',
          'For questions, submit a support ticket.',
        ],
        attachedDocName: '2FA_Activation_Guide.pdf',
        acknowledgedCount: 310,
      },
      {
        id: 'c4',
        department: {
          name: 'Health Care & Medical Insurance',
          code: 'MED',
          subtext: 'Medical Services',
          avatarBg: 'bg-rose-950 text-rose-400',
          icon: HeartPulse,
          color: 'text-rose-400',
        },
        title: '2026 Approved Healthcare Hospital Network Expansion',
        refNumber: 'LITC-MED-2026-023',
        date: '2 days ago',
        importance: 'Notice',
        badgeBg: 'bg-rose-600 text-white',
        ringColor: 'from-rose-600 via-pink-500 to-red-600',
        summary: 'Added 15 new hospitals & specialized centers to insurance network.',
        fullContent: [
          'Major private clinics, dental centers, and labs now accepted.',
          'Digital medical cards in the app are recognized across all providers.',
          '100% in-network coverage for preventative and urgent treatments.',
        ],
        attachedDocName: 'Approved_Hospitals_Guide_2026.pdf',
        acknowledgedCount: 184,
      },
      {
        id: 'c5',
        department: {
          name: 'Finance & Accounting',
          code: 'FIN',
          subtext: 'Payroll & Allowances',
          avatarBg: 'bg-indigo-950 text-indigo-400',
          icon: CreditCard,
          color: 'text-indigo-400',
        },
        title: 'Monthly Salary Disbursement & Training Allowances',
        refNumber: 'LITC-FIN-2026-067',
        date: '3 days ago',
        importance: 'Official',
        badgeBg: 'bg-indigo-600 text-white',
        ringColor: 'from-indigo-600 via-purple-500 to-violet-700',
        summary: 'Notice of monthly salary transfer to all employee bank accounts.',
        fullContent: [
          'Salaries for current period successfully credited to bank accounts.',
          'Includes approved travel per diems and course allowances.',
          'Payslips accessible in the Self-Service portal.',
        ],
        attachedDocName: 'Payroll_Transfer_Notice.pdf',
        acknowledgedCount: 265,
      },
      {
        id: 'c6',
        department: {
          name: 'Training & Institutional L&D',
          code: 'L&D',
          subtext: 'Leadership Programs',
          avatarBg: 'bg-amber-950 text-amber-300',
          icon: GraduationCap,
          color: 'text-amber-400',
        },
        title: 'Open Registration for Global Professional Certifications',
        refNumber: 'LITC-LD-2026-015',
        date: 'This Week',
        importance: 'Training',
        badgeBg: 'bg-amber-600 text-white',
        ringColor: 'from-orange-500 via-amber-400 to-yellow-600',
        summary: '50 fully sponsored seats for PMP, AWS Cloud, and Data Analytics.',
        fullContent: [
          'Full 100% sponsorship for verified international credentials.',
          'Includes PMP, AWS Solutions Architect, and Enterprise Transformation.',
          'Priority given to active LITC Challenge participants.',
        ],
        attachedDocName: 'L&D_Certification_Plan_2026.pdf',
        acknowledgedCount: 198,
      }
    ];
  }, [language]);

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [acknowledgedMap, setAcknowledgedMap] = useState<Record<string, boolean>>({});
  const [showFeedback, setShowFeedback] = useState<string | null>(null);

  const isModalOpen = activeStoryIndex !== null;
  const currentStory = activeStoryIndex !== null ? localizedData[activeStoryIndex] : null;

  const handleOpenStory = (index: number) => {
    setActiveStoryIndex(index);
    setShowFeedback(null);
  };

  const handleCloseStory = () => {
    setActiveStoryIndex(null);
    setShowFeedback(null);
  };

  const handleNextStory = () => {
    if (activeStoryIndex === null) return;
    const nextIdx = (activeStoryIndex + 1) % localizedData.length;
    setActiveStoryIndex(nextIdx);
    setShowFeedback(null);
  };

  const handlePrevStory = () => {
    if (activeStoryIndex === null) return;
    const prevIdx = (activeStoryIndex - 1 + localizedData.length) % localizedData.length;
    setActiveStoryIndex(prevIdx);
    setShowFeedback(null);
  };

  const handleAcknowledge = (storyId: string) => {
    setAcknowledgedMap((prev) => {
      const already = !!prev[storyId];
      if (!already) {
        setShowFeedback(isRtl ? 'تم تأكيد اطلاعك والالتزام بالتعميم بنجاح ✅' : 'Acknowledged successfully! ✅');
        setTimeout(() => setShowFeedback(null), 3000);
      }
      return { ...prev, [storyId]: true };
    });
  };

  return (
    <section className="relative">
      {/* Label and category indicator */}
      <div className="flex items-center justify-between px-1 mb-1 text-xs">
        <span className="flex items-center gap-1.5 font-black text-slate-800 dark:text-white">
          <Building2 className="size-3.5 text-accent" />
          <span>{isRtl ? 'التعميمات والقرارات الإدارية الرسمية' : 'Official Circulars & Management Directives'}</span>
        </span>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
          {localizedData.length} {isRtl ? 'إدارات وحسابات معتمدة' : 'Verified Departments'}
        </span>
      </div>

      {/* Stories Horizontal Row */}
      <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1">
        {localizedData.map((story, idx) => {
          const IconComp = story.department.icon;
          const isAcked = !!acknowledgedMap[story.id];

          return (
            <motion.button
              key={story.id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleOpenStory(idx)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 focus:outline-none group"
            >
              {/* Avatar Ring Frame */}
              <div className="relative">
                <div
                  className={`size-[68px] sm:size-[72px] p-[2.5px] rounded-full bg-gradient-to-tr ${story.ringColor} shadow-md transition-all group-hover:shadow-lg`}
                >
                  <div className="size-full rounded-full bg-slate-900 p-[2px] overflow-hidden flex items-center justify-center">
                    <div className={`size-full rounded-full ${story.department.avatarBg} flex flex-col items-center justify-center p-1 text-center shadow-inner`}>
                      <IconComp className="size-5 mb-0.5" />
                      <span className="text-[8px] font-black tracking-wider uppercase">
                        {story.department.code}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge Tag at bottom right */}
                <div
                  className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[8px] font-black shadow-xs ${story.badgeBg}`}
                >
                  {story.importance}
                </div>

                {/* Acknowledged Checkmark Indicator */}
                {isAcked && (
                  <div className="absolute top-0 right-0 size-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px]">
                    ✓
                  </div>
                )}
              </div>

              {/* Department Name & Ref */}
              <div className="text-center w-20">
                <p className="text-[11px] font-black text-slate-900 dark:text-white truncate leading-tight">
                  {story.department.name.split(' ')[0]} {story.department.name.split(' ')[1] || ''}
                </p>
                <p className="text-[9px] font-bold text-accent truncate mt-0.5">
                  {story.title.split(' ')[0]} {story.title.split(' ')[1] || ''}...
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Fullscreen Interactive Circular Story Modal */}
      <AnimatePresence>
        {isModalOpen && currentStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] text-start rtl:text-right"
            >
              {/* Header Story Progress Bars */}
              <div className="absolute top-0 inset-x-0 p-3 z-20 flex gap-1.5 bg-gradient-to-b from-black/60 to-transparent">
                {localizedData.map((s, idx) => (
                  <div
                    key={s.id}
                    className="h-1 flex-1 rounded-full overflow-hidden bg-white/30 backdrop-blur-xs"
                  >
                    <div
                      className={`h-full transition-all duration-300 ${
                        idx === activeStoryIndex
                          ? 'bg-yellow-400 w-full'
                          : idx < activeStoryIndex!
                          ? 'bg-white w-full'
                          : 'w-0'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {/* Top Banner with Department Identity */}
              <div className={`p-5 pt-7 bg-gradient-to-br ${currentStory.ringColor} text-white relative`}>
                {/* Close Button */}
                <button
                  onClick={handleCloseStory}
                  className="absolute top-4 start-4 size-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm transition-colors z-20"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="size-13 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex flex-col items-center justify-center p-2 shadow-md">
                    {React.createElement(currentStory.department.icon, { className: 'size-6 text-white' })}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs border border-white/20">
                        {currentStory.department.code}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-black/20 text-yellow-300 text-[10px] font-black">
                        {currentStory.importance}
                      </span>
                    </div>
                    <h3 className="font-display font-black text-base sm:text-lg text-white mt-1 leading-snug">
                      {currentStory.department.name}
                    </h3>
                    <p className="text-[11px] text-white/80 font-medium">
                      {currentStory.department.subtext} • {currentStory.date}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={handlePrevStory}
                className="absolute start-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 dark:bg-slate-800 shadow-lg text-slate-800 dark:text-white flex items-center justify-center hover:bg-white transition-all z-20 active:scale-95"
                aria-label="Previous"
              >
                <ChevronLeft className="size-5 rtl:rotate-180" />
              </button>

              <button
                onClick={handleNextStory}
                className="absolute end-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white/90 dark:bg-slate-800 shadow-lg text-slate-800 dark:text-white flex items-center justify-center hover:bg-white transition-all z-20 active:scale-95"
                aria-label="Next"
              >
                <ChevronRight className="size-5 rtl:rotate-180" />
              </button>

              {/* Content Body - Scrollable */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                {/* Reference Box */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs">
                  <span className="text-slate-400 dark:text-slate-400 font-bold">{isRtl ? 'الرقم المرجعي المعتمد:' : 'Official Ref Number:'}</span>
                  <span className="font-mono font-black text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                    {currentStory.refNumber}
                  </span>
                </div>

                {/* Title */}
                <div>
                  <h4 className="font-display font-black text-lg text-slate-900 dark:text-white leading-tight">
                    {currentStory.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 font-medium leading-relaxed bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/50 dark:border-amber-900/40">
                    {currentStory.summary}
                  </p>
                </div>

                {/* Full Clauses / Bullet points */}
                <div className="space-y-2.5 pt-1">
                  <p className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="size-3.5 text-accent" />
                    <span>{isRtl ? 'بنود وتفاصيل التعميم:' : 'Circular Details & Directives:'}</span>
                  </p>
                  <div className="space-y-2">
                    {currentStory.fullContent.map((clause, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium"
                      >
                        <span className="size-5 rounded-full bg-primary/10 dark:bg-primary/30 text-primary flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{clause}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attached Official Document */}
                {currentStory.attachedDocName && (
                  <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-9 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shrink-0">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentStory.attachedDocName}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">{isRtl ? 'وثيقة رسمية مختومة • PDF' : 'Official Sealed Document • PDF'}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => alert(isRtl ? `جاري تحميل الوثيقة الرسمية: ${currentStory.attachedDocName}` : `Downloading official doc: ${currentStory.attachedDocName}`)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-1.5 shrink-0"
                    >
                      <Download className="size-3.5 text-accent" />
                      <span>{isRtl ? 'تحميل' : 'Download'}</span>
                    </button>
                  </div>
                )}

                {/* Acknowledged statistics */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 px-1">
                  <span className="flex items-center gap-1 font-bold">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    <span>{currentStory.acknowledgedCount} {isRtl ? 'موظفاً أكدوا الاطلاع والالتزام' : 'employees confirmed & acknowledged'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">LITC Official Notice</span>
                </div>
              </div>

              {/* Footer Actions: Acknowledge & Confirmation */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-2.5">
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 bg-emerald-600 text-white text-center text-xs font-bold rounded-xl shadow-xs"
                  >
                    {showFeedback}
                  </motion.div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAcknowledge(currentStory.id)}
                    className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs ${
                      acknowledgedMap[currentStory.id]
                        ? 'bg-emerald-600 text-white'
                        : 'bg-primary text-white hover:brightness-110 active:scale-98'
                    }`}
                  >
                    {acknowledgedMap[currentStory.id] ? (
                      <>
                        <Check className="size-4" />
                        <span>{isRtl ? 'تم الاطلاع وتأكيد الالتزام' : 'Acknowledged & Confirmed'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4 text-emerald-300" />
                        <span>{isRtl ? 'تأكيد الاطلاع والالتزام بالتعميم' : 'Acknowledge & Confirm Directive'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleNextStory}
                    className="px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  >
                    {isRtl ? 'التالي' : 'Next'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
