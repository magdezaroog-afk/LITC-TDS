/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Laptop, 
  Wifi, 
  Cpu, 
  KeyRound, 
  Printer, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  Mic, 
  MicOff, 
  Paperclip, 
  MapPin, 
  Clock, 
  Zap, 
  Copy, 
  MessageSquare, 
  HelpCircle,
  HardDrive,
  Monitor,
  RefreshCw,
  Sliders,
  Check
} from 'lucide-react';
import { useHub } from '../context/HubContext';

interface ProblemCategory {
  id: string;
  title: string;
  titleEn: string;
  icon: typeof Laptop;
  color: string;
  bgLight: string;
  bgDark: string;
  symptoms: {
    id: string;
    label: string;
    labelEn: string;
    smartTip: string;
    smartTipEn: string;
  }[];
}

const CATEGORIES: ProblemCategory[] = [
  {
    id: 'hardware',
    title: 'الأجهزة والعتاد',
    titleEn: 'Hardware & Devices',
    icon: Laptop,
    color: 'text-blue-500',
    bgLight: 'bg-blue-50 border-blue-200',
    bgDark: 'dark:bg-blue-950/40 dark:border-blue-800',
    symptoms: [
      { 
        id: 'screen_flicker', 
        label: 'الشاشة سوداء أو تومض باستمرار', 
        labelEn: 'Display is black or flickering',
        smartTip: 'تأكد من إحكام كابل HDMI/DisplayPort، واضغط Win + Ctrl + Shift + B لإعادة تشغيل كرت الشاشة فوراً.',
        smartTipEn: 'Ensure HDMI cable is firm, or press Win + Ctrl + Shift + B to restart GPU drivers.'
      },
      { 
        id: 'laptop_power', 
        label: 'حرارة مرتفعة أو البطارية لا تشحن', 
        labelEn: 'Overheating or battery not charging',
        smartTip: 'افصل الشاحن لـ 30 ثانية ثم أعد التوصيل، وتأكد من عدم انسداد فتحات التهوية السفلية.',
        smartTipEn: 'Unplug power for 30 seconds and ensure bottom air vents are unobstructed.'
      },
      { 
        id: 'keyboard_touchpad', 
        label: 'لوحة المفاتيح أو الماوس لا يستجيبان', 
        labelEn: 'Keyboard or touchpad unresponsive',
        smartTip: 'جرب توصيل الماوس بمنفذ USB آخر، أو اضغط زر الطاقة لـ 10 ثوانٍ لإعادة التشغيل القسري.',
        smartTipEn: 'Try another USB port or long press power button for 10s to cold restart.'
      },
      { 
        id: 'bsod_crash', 
        label: 'توقف مفاجئ أو شاشة زرقاء (BSOD)', 
        labelEn: 'System crash or Blue Screen (BSOD)',
        smartTip: 'التقط صورة لرمز الخطأ أسفل الشاشة الزرقاء (مثل CRITICAL_PROCESS_DIED) لمساعدة الفريق التقني.',
        smartTipEn: 'Take a photo of the stop code at the bottom of the blue screen to accelerate resolution.'
      },
    ]
  },
  {
    id: 'network',
    title: 'الشبكة والـ VPN',
    titleEn: 'Network & VPN',
    icon: Wifi,
    color: 'text-cyan-500',
    bgLight: 'bg-cyan-50 border-cyan-200',
    bgDark: 'dark:bg-cyan-950/40 dark:border-cyan-800',
    symptoms: [
      { 
        id: 'vpn_connect', 
        label: 'فشل الاتصال بـ Cisco AnyConnect VPN', 
        labelEn: 'Cannot connect to Corporate VPN',
        smartTip: 'تأكد من إدخال رمز التحقق الثنائي (OTP) الجديد، وتحقق من اتصال شبكتك المنزلية أولاً.',
        smartTipEn: 'Check that your 2FA OTP is current and test your home internet connection.'
      },
      { 
        id: 'wifi_internal', 
        label: 'انقطاع Wi-Fi الداخلي (LITC-Secure)', 
        labelEn: 'Disconnected from internal Wi-Fi',
        smartTip: 'قم بتعطيل Wi-Fi ثم تفعيله، أو اختر "نسيان الشبكة" وأعد تسجيل الدخول باسم المستخدم المؤسسي.',
        smartTipEn: 'Toggle Wi-Fi off/on or choose "Forget Network" and reconnect with corporate ID.'
      },
      { 
        id: 'shared_folders', 
        label: 'تعذر الوصول للمجلدات والخوادم المشتركة (NAS)', 
        labelEn: 'Shared server drives inaccessible',
        smartTip: 'تأكد من أنك متصل بشبكة المكتب أو أن الـ VPN نشط، وافتح Run واكتب \\\\litc-fs01.',
        smartTipEn: 'Verify VPN or office network is active, then press Win+R and type \\\\litc-fs01.'
      },
      { 
        id: 'slow_speed', 
        label: 'بطء حاد في تحميل الأنظمة السحابية', 
        labelEn: 'Severe latency on cloud systems',
        smartTip: 'أغلق برامج تنزيل الملفات الكبيرة واختبر السرعة عبر fast.com لمقارنة الأداء.',
        smartTipEn: 'Pause background downloads and test bandwidth via speed test tools.'
      },
    ]
  },
  {
    id: 'software',
    title: 'البرمجيات والأنظمة',
    titleEn: 'Software & OS',
    icon: Cpu,
    color: 'text-indigo-500',
    bgLight: 'bg-indigo-50 border-indigo-200',
    bgDark: 'dark:bg-indigo-950/40 dark:border-indigo-800',
    symptoms: [
      { 
        id: 'outlook_sync', 
        label: 'Outlook لا يزامن الرسائل أو التقويم', 
        labelEn: 'Outlook not syncing mail or calendar',
        smartTip: 'تأكد من ظهور عبارة "متصل بالخادم" في الزاوية السفلية، وجرب تشغيل Outlook في الوضع الآمن.',
        smartTipEn: 'Verify "Connected to Exchange" status in bottom bar or launch Outlook in Safe Mode.'
      },
      { 
        id: 'teams_call', 
        label: 'Teams لا يستقبل المكالمات أو الكاميرا', 
        labelEn: 'Teams calls / camera issues',
        smartTip: 'انتقل إلى إعدادات Teams -> الأجهزة (Devices) وافحص صلاحيات الكاميرا والمايكروفون.',
        smartTipEn: 'Go to Teams Settings -> Devices and verify audio/video permissions.'
      },
      { 
        id: 'erp_error', 
        label: 'نظام ERP المؤسسي يعطي رمز خطأ 500', 
        labelEn: 'Internal ERP throwing error code',
        smartTip: 'امسح ذاكرة التخزين المؤقت للمتصفح عبر Ctrl + Shift + Delete أو جرب نافذة التصفح الخفي.',
        smartTipEn: 'Clear browser cache via Ctrl + Shift + Delete or try an incognito window.'
      },
      { 
        id: 'license_expired', 
        label: 'انتهاء ترخيص برنامج مصرح (Adobe / CAD)', 
        labelEn: 'Software license expired (Adobe/CAD)',
        smartTip: 'سجل الخروج من حساب البرنامج ثم أعد الدخول بالبريد المؤسسي (@litc.ly).',
        smartTipEn: 'Sign out of the software and sign back in using corporate SSO (@litc.ly).'
      },
    ]
  },
  {
    id: 'access',
    title: 'الأمان وصلاحيات الدخول',
    titleEn: 'Security & Access',
    icon: KeyRound,
    color: 'text-amber-500',
    bgLight: 'bg-amber-50 border-amber-200',
    bgDark: 'dark:bg-amber-950/40 dark:border-amber-800',
    symptoms: [
      { 
        id: 'account_locked', 
        label: 'الحساب مقفل بسبب محاولات دخول خاطئة', 
        labelEn: 'Domain account locked out',
        smartTip: 'سيتم فك القفل التلقائي خلال 15 دقيقة، أو يمكن لفريق الدعم فكه لك فورياً الآن.',
        smartTipEn: 'Accounts auto-unlock after 15 mins, or support can unlock it instantly.'
      },
      { 
        id: 'mfa_reset', 
        label: 'تغيير الهاتف وفقدان تطبيق Authenticator 2FA', 
        labelEn: 'Lost 2FA Authenticator on new phone',
        smartTip: 'يتطلب ذلك إعادة تعيين رمز QR الأمني للتحقق الثنائي بعد التحقق من هويتك.',
        smartTipEn: 'Requires IT security to re-issue your MFA QR code with verification.'
      },
      { 
        id: 'admin_privilege', 
        label: 'طلب صلاحيات إدارية مؤقتة لتثبيت تطبيق معتمد', 
        labelEn: 'Request temporary Admin elevation',
        smartTip: 'حدد اسم البرنامج وإصدارته الرسمية ليتم منحه تصريح التشغيل المعتمد.',
        smartTipEn: 'Specify the approved application name for automated elevation approval.'
      },
      { 
        id: 'phishing_alert', 
        label: 'الإبلاغ عن بريد إلكتروني مشبوه أو رابط تصيد', 
        labelEn: 'Report suspicious phishing email',
        smartTip: 'ممتاز! لا تنقر على أي روابط وقم بإعادة توجيه الرسالة كملف مرفق لفريق الأمن.',
        smartTipEn: 'Great catch! Do not click links and forward as attachment to security@litc.ly.'
      },
    ]
  },
  {
    id: 'peripherals',
    title: 'الطابعات والملحقات',
    titleEn: 'Printers & Accessories',
    icon: Printer,
    color: 'text-emerald-500',
    bgLight: 'bg-emerald-50 border-emerald-200',
    bgDark: 'dark:bg-emerald-950/40 dark:border-emerald-800',
    symptoms: [
      { 
        id: 'printer_jam', 
        label: 'الطابعة المركزية في الطابق متوقفة أو بها حشر', 
        labelEn: 'Floor printer jammed or offline',
        smartTip: 'افحص شاشة الطابعة لرؤية رقم الدرج العالق، أو جرب الطباعة على طابعة الطابق البديلة.',
        smartTipEn: 'Check printer LCD for drawer tray jam alert or send to secondary floor printer.'
      },
      { 
        id: 'docking_station', 
        label: 'قاعدة التوصيل Docking Station لا تشغل الشاشات', 
        labelEn: 'Docking station not outputting video',
        smartTip: 'افصل سلك Type-C / Thunderbolt من اللابتوب لـ 5 ثوانٍ وأعد توصيله بثبات.',
        smartTipEn: 'Unplug Type-C / Thunderbolt dock cable for 5 seconds and re-seat firmly.'
      },
      { 
        id: 'headset_mic', 
        label: 'سماعة الرأس أو الميكروفون لا يلتقط الصوت', 
        labelEn: 'Headset or microphone not detected',
        smartTip: 'تحقق من زر كتم الصوت الفعلي بالسلك وتأكد من اختيار السماعة كجهاز افتراضي في Windows.',
        smartTipEn: 'Check hardware mute switch and set headset as default device in Sound Settings.'
      },
      { 
        id: 'scanner_card', 
        label: 'قارئ البطاقات الذكية أو الماسح الضوئي معطل', 
        labelEn: 'Smart card reader / Scanner offline',
        smartTip: 'أعد تشغيل خدمة Smart Card في Windows أو جرب تنظيف شريحة البطاقة الذهبية.',
        smartTipEn: 'Restart Smart Card service in Windows or gently clean the smart chip.'
      },
    ]
  }
];

export function TechnicalSupportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language, user } = useHub();
  const isRtl = language === 'ar';

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState<string>('hardware');
  const [selectedSymptom, setSelectedSymptom] = useState<string>('screen_flicker');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [locationMode, setLocationMode] = useState<'office' | 'remote'>('office');
  
  // Custom notes & voice note recording simulation
  const [customNote, setCustomNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [hasVoiceNote, setHasVoiceNote] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Self-help tip resolved state
  const [tipResolved, setTipResolved] = useState(false);

  // Submission / Ticket Pass state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketNumber: string;
    technicianName: string;
    technicianAvatar: string;
    technicianRole: string;
    estimatedTime: string;
    timestamp: string;
  } | null>(null);

  const activeCategoryObj = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const activeSymptomObj = activeCategoryObj.symptoms.find((s) => s.id === selectedSymptom) || activeCategoryObj.symptoms[0];

  const handleToggleRecord = () => {
    if (isRecording) {
      // Stop recording
      if (timerRef.current) clearInterval(timerRef.current);
      setIsRecording(false);
      setHasVoiceNote(true);
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingSeconds(0);
      setHasVoiceNote(false);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const handleSimulateScreenshot = () => {
    setUploadedFiles((prev) => [
      ...prev,
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400'
    ]);
  };

  const handleSubmitTicket = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedTicket({
        ticketNumber: `#IT-${Math.floor(1000 + Math.random() * 9000)}`,
        technicianName: isRtl ? 'م. خليل المبروك' : 'Eng. Khalil Al-Mabrouk',
        technicianAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
        technicianRole: isRtl ? 'مهندس دعم فني أول • الطابق 4' : 'Senior IT Support Engineer • 4th Floor',
        estimatedTime: urgency === 'high' ? (isRtl ? 'خلال 8 دقائق ⚡' : 'Within 8 mins ⚡') : (isRtl ? 'خلال 15 دقيقة' : 'Within 15 mins'),
        timestamp: isRtl ? 'الآن' : 'Just now'
      });
    }, 1000);
  };

  const handleReset = () => {
    setSubmittedTicket(null);
    setTipResolved(false);
    setSelectedCategory('hardware');
    setSelectedSymptom('screen_flicker');
    setCustomNote('');
    setHasVoiceNote(false);
    setUploadedFiles([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReset}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[260]"
          />

          {/* Modal Content - Modern high-tech drawer / dialog */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className={`fixed inset-x-0 bottom-0 top-6 sm:top-12 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 w-full md:max-w-3xl md:h-[88vh] bg-white dark:bg-slate-900 rounded-t-[32px] md:rounded-[32px] shadow-2xl z-[265] flex flex-col overflow-hidden border border-slate-200/80 dark:border-slate-800 text-start rtl:text-right`}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-500/10 via-accent/10 to-indigo-500/10 dark:from-blue-950/40 dark:via-accent/20 dark:to-indigo-950/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="size-12 rounded-2xl bg-gradient-to-tr from-accent to-blue-600 flex items-center justify-center text-white shadow-lg shadow-accent/25 ring-2 ring-white dark:ring-slate-800 shrink-0">
                  <Cpu className="size-6 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {isRtl ? 'مركز الدعم الفني الذكي' : 'Smart IT Support Hub'}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
                      {isRtl ? 'فوري ومباشر' : 'Live SLA'}
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                    {isRtl ? 'تشخيص بصري تفاعلي للأعطال مع استجابة فورية' : 'Interactive visual triage with rapid resolution'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleReset}
                className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all shadow-xs active:scale-95"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* If ticket has been submitted -> Show Digital Ticket Pass */}
            {submittedTicket ? (
              <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex flex-col items-center justify-center text-center space-y-6 custom-scrollbar">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="size-20 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/10 border-2 border-emerald-500/30"
                >
                  <CheckCircle2 className="size-10" />
                </motion.div>

                <div className="space-y-1 max-w-md">
                  <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-wider">
                    {submittedTicket.ticketNumber}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white pt-2">
                    {isRtl ? 'تم استلام تذكرتك وتكليف الفني!' : 'Ticket Dispatched Successfully!'}
                  </h3>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {isRtl ? 'تم توجيه البلاغ مباشرة للمهندس المناوب وسيتواصل معك فورا' : 'Your request is assigned to the active on-duty engineer'}
                  </p>
                </div>

                {/* Digital Engineer Assignment Card */}
                <div className="w-full max-w-md p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 shadow-sm text-start rtl:text-right space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      {isRtl ? 'المهندس المكلف' : 'Assigned Technician'}
                    </span>
                    <span className="text-[10px] font-black text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                      {submittedTicket.estimatedTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <img
                      src={submittedTicket.technicianAvatar}
                      alt={submittedTicket.technicianName}
                      className="size-12 rounded-2xl object-cover ring-2 ring-accent/30"
                    />
                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-white">
                        {submittedTicket.technicianName}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {submittedTicket.technicianRole}
                      </p>
                    </div>
                  </div>

                  {/* Realtime Status Milestones */}
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        {isRtl ? 'تم فتح التذكرة وإرسال الإشعار' : 'Ticket Created'}
                      </span>
                      <span className="text-slate-400">{submittedTicket.timestamp}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-accent animate-pulse">
                        <span className="size-2 rounded-full bg-accent" />
                        {isRtl ? 'جاري التوجه إلى مكتبك / الاتصال عن بعد' : 'En route to desk / Remote Assist'}
                      </span>
                      <span className="text-accent font-black">{submittedTicket.estimatedTime}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md pt-2">
                  <button
                    onClick={handleReset}
                    className="w-full py-3.5 bg-accent text-white font-black rounded-2xl shadow-lg shadow-accent/25 hover:brightness-105 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <Check className="size-4" />
                    <span>{isRtl ? 'تم، العودة للشاشة الرئيسية' : 'Done, Return to Dashboard'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Form Steps */
              <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">
                
                {/* 1. Verified Device Badge Banner */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Monitor className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                          Lenovo ThinkPad X1 Carbon
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          LITC-IT-8842
                        </span>
                      </div>
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400">
                        {isRtl ? 'المقر الرئيسي • الطابق الرابع • مكتب 412' : 'HQ • 4th Floor • Desk 412'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setLocationMode(locationMode === 'office' ? 'remote' : 'office')}
                      className="px-3 py-1 rounded-xl text-[10px] font-black bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-2xs hover:border-accent transition-all"
                    >
                      <MapPin className="size-3 text-accent" />
                      <span>{locationMode === 'office' ? (isRtl ? 'في المكتب' : 'At Office') : (isRtl ? 'عمل عن بعد' : 'Remote')}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Visual Problem Categories (Horizontal Scrollable Tabs with Icons) */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="size-3.5 text-accent" />
                      <span>{isRtl ? '1. حدد مجال المشكلة التقنية' : '1. Select Issue Category'}</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-400">
                      {isRtl ? 'تصنيف مباشر' : 'Direct triage'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CATEGORIES.map((cat) => {
                      const isActive = selectedCategory === cat.id;
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setSelectedSymptom(cat.symptoms[0].id);
                            setTipResolved(false);
                          }}
                          className={`p-3 rounded-2xl border text-start rtl:text-right flex flex-col items-start gap-2 transition-all cursor-pointer ${
                            isActive
                              ? `bg-accent text-white shadow-lg shadow-accent/25 border-accent scale-[1.02]`
                              : `bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200`
                          }`}
                        >
                          <div className={`size-8 rounded-xl flex items-center justify-center ${
                            isActive ? 'bg-white/20 text-white' : `${cat.color} bg-white dark:bg-slate-700`
                          }`}>
                            <Icon className="size-4" />
                          </div>
                          <span className="text-[11px] font-black leading-tight line-clamp-1">
                            {isRtl ? cat.title : cat.titleEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Diagnostic Symptom Cards (Non-traditional interactive cards) */}
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-accent" />
                    <span>{isRtl ? '2. اختر العطل الأكثر دقة' : '2. Choose Specific Symptom'}</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeCategoryObj.symptoms.map((symptom) => {
                      const isSelected = selectedSymptom === symptom.id;
                      return (
                        <button
                          key={symptom.id}
                          type="button"
                          onClick={() => {
                            setSelectedSymptom(symptom.id);
                            setTipResolved(false);
                          }}
                          className={`p-3.5 rounded-2xl border text-start rtl:text-right flex items-center justify-between gap-3 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-accent/10 dark:bg-accent/20 border-accent text-accent shadow-xs ring-1 ring-accent/30'
                              : 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="text-xs font-bold leading-snug">
                            {isRtl ? symptom.label : symptom.labelEn}
                          </span>
                          <div className={`size-5 rounded-full flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-accent border-accent text-white'
                              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                          }`}>
                            {isSelected && <Check className="size-3" strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Smart Instant AI Self-Fix Tip Box */}
                {activeSymptomObj && !tipResolved && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5 text-slate-800 dark:text-slate-100"
                  >
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <Sparkles className="size-4" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        {isRtl ? 'اقتراح حل ذكي فوري' : 'Instant AI Troubleshooting Tip'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-200">
                      {isRtl ? activeSymptomObj.smartTip : activeSymptomObj.smartTipEn}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setTipResolved(true)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-500/30 rounded-xl text-[11px] font-black text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all shadow-2xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="size-3.5 text-emerald-500" />
                        <span>{isRtl ? 'جربت الحل ونجح (إلغاء الطلب)' : 'Solution Worked (Close)'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* If resolved by tip -> praise banner */}
                {tipResolved && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-300"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="size-5 text-emerald-500" />
                      <span className="text-xs font-black">
                        {isRtl ? 'رائع! تم حل المشكلة ذاتياً وتوفير وقتك 🚀' : 'Great! Resolved through instant self-help 🚀'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs hover:bg-emerald-700"
                    >
                      {isRtl ? 'إغلاق' : 'Close'}
                    </button>
                  </motion.div>
                )}

                {/* 5. Urgency & Impact Selector */}
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="size-3.5 text-accent" />
                    <span>{isRtl ? '3. مستوى أثر المشكلة على العمل' : '3. Work Impact Level'}</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { 
                        id: 'high', 
                        label: isRtl ? 'حرج (عملي متوقف)' : 'Critical (Blocked)', 
                        desc: isRtl ? 'استجابة < 8 دقائق' : '< 8 min response',
                        color: 'border-rose-500 text-rose-600 bg-rose-500/10' 
                      },
                      { 
                        id: 'medium', 
                        label: isRtl ? 'متوسط (متأثر جزئياً)' : 'Medium (Impacted)', 
                        desc: isRtl ? 'استجابة < 15 دقيقة' : '< 15 min response',
                        color: 'border-amber-500 text-amber-600 bg-amber-500/10' 
                      },
                      { 
                        id: 'low', 
                        label: isRtl ? 'اعتيادي / استفسار' : 'Normal Inquiry', 
                        desc: isRtl ? 'خلال يوم العمل' : 'Same day',
                        color: 'border-emerald-500 text-emerald-600 bg-emerald-500/10' 
                      },
                    ].map((lvl) => {
                      const isSelected = urgency === lvl.id;
                      return (
                        <button
                          key={lvl.id}
                          type="button"
                          onClick={() => setUrgency(lvl.id as any)}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? `${lvl.color} shadow-xs ring-1 ring-current font-black scale-[1.02]`
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold'
                          }`}
                        >
                          <span className="block text-xs leading-tight">{lvl.label}</span>
                          <span className="block text-[9px] text-slate-400 mt-1">{lvl.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Multi-Modal Input: Voice Memo & Quick Note & Screenshots */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Mic className="size-3.5 text-accent" />
                    <span>{isRtl ? '4. توضيح المشكلة (صوت، نص، أو لقطة شاشة)' : '4. Evidence & Clarification'}</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Voice Memo Button */}
                    <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                      isRecording 
                        ? 'bg-rose-500/15 border-rose-500 text-rose-600 animate-pulse' 
                        : hasVoiceNote 
                          ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleToggleRecord}
                          className={`size-11 rounded-2xl flex items-center justify-center shadow-xs transition-transform active:scale-90 ${
                            isRecording 
                              ? 'bg-rose-500 text-white' 
                              : hasVoiceNote 
                                ? 'bg-emerald-500 text-white' 
                                : 'bg-accent text-white'
                          }`}
                        >
                          {isRecording ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                        </button>
                        <div>
                          <span className="block text-xs font-black">
                            {isRecording 
                              ? (isRtl ? `جاري التسجيل... 00:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}` : `Recording... 00:${recordingSeconds}`)
                              : hasVoiceNote
                                ? (isRtl ? 'تم إرفاق ملاحظة صوتية 🎧' : 'Voice note attached 🎧')
                                : (isRtl ? 'تسجيل شرح صوتي' : 'Record voice memo')}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-semibold">
                            {isRtl ? 'لشرح المشكلة سريعاً دون كتابة' : 'Quickly explain without typing'}
                          </span>
                        </div>
                      </div>

                      {hasVoiceNote && !isRecording && (
                        <button
                          type="button"
                          onClick={() => setHasVoiceNote(false)}
                          className="text-[10px] font-bold text-rose-500 hover:underline"
                        >
                          {isRtl ? 'حذف' : 'Remove'}
                        </button>
                      )}
                    </div>

                    {/* Screenshot / Image Attachment Trigger */}
                    <div 
                      onClick={handleSimulateScreenshot}
                      className="p-4 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:border-accent hover:bg-accent/5 transition-all cursor-pointer flex items-center gap-3"
                    >
                      <div className="size-11 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-accent shadow-2xs shrink-0">
                        <Paperclip className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-black text-slate-800 dark:text-slate-200 truncate">
                          {uploadedFiles.length > 0 ? (isRtl ? `تم إرفاق ${uploadedFiles.length} صور للخطأ` : `${uploadedFiles.length} screenshot(s) attached`) : (isRtl ? 'إرفاق لقطة شاشة / صورة' : 'Attach screenshot / log')}
                        </span>
                        <span className="block text-[10px] text-slate-400 truncate">
                          {isRtl ? 'انقر للرفع أو لصق (Ctrl+V)' : 'Click to upload or Paste (Ctrl+V)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Optional short note input */}
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder={isRtl ? 'ملاحظة إضافية للفني (اختياري)...' : 'Additional note for the engineer (optional)...'}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-accent focus:bg-white dark:focus:bg-slate-800 transition-all outline-none"
                  />
                </div>

              </div>
            )}

            {/* Modal Bottom Action Bar */}
            {!submittedTicket && (
              <div className="p-5 sm:p-6 bg-slate-50/90 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-bold order-2 sm:order-1">
                  <Clock className="size-4 text-accent" />
                  <span>{isRtl ? 'زمن الاستجابة المتوقع: أقل من 15 دقيقة' : 'Estimated SLA: < 15 minutes'}</span>
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitTicket}
                  className="w-full sm:w-auto px-8 py-3.5 bg-accent text-white font-black rounded-2xl shadow-lg shadow-accent/25 hover:brightness-105 transition-all active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2 order-1 sm:order-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  <span>{isRtl ? 'إرسال التذكرة للدعم الفني' : 'Dispatch IT Ticket'}</span>
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
