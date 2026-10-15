import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cake, 
  UserPlus, 
  Award, 
  Heart, 
  Send, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  MessageCircle, 
  Share2 
} from 'lucide-react';
import { useHub } from '../context/HubContext';

export interface MilestoneStory {
  id: string;
  type: 'birthday' | 'new_joiner' | 'condolence' | 'retirement' | 'baby';
  person: {
    name: string;
    role: string;
    department: string;
    avatar: string;
  };
  title: string;
  subtitle: string;
  date: string;
  badgeLabel: string;
  ringColor: string;
  badgeBg: string;
  quickReactions: string[];
  suggestedMsg: string;
  likesCount: number;
}

const STORIES_DATA_AR: MilestoneStory[] = [
  {
    id: 's1',
    type: 'birthday',
    person: {
      name: 'سارة الهاشمي',
      role: 'مصممة واجهات وتجربة مستخدم',
      department: 'إدارة التقنية والابتكار',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    },
    title: 'يوم ميلاد سعيد!',
    subtitle: 'يصادف اليوم عيد ميلاد الزميلة سارة الهاشمي. نتمنى لها عاماً حافلاً بالنجاح والتألق في عائلة LITC ✨',
    date: 'اليوم',
    badgeLabel: '🎂 عيد ميلاد',
    ringColor: 'from-amber-500 via-orange-500 to-rose-500',
    badgeBg: 'bg-amber-500 text-white',
    quickReactions: ['🎂', '🎉', '✨', '👏', '❤️'],
    suggestedMsg: 'كل عام وأنتِ بخير وصحة وسعادة سارة! 🌸',
    likesCount: 34
  },
  {
    id: 's2',
    type: 'new_joiner',
    person: {
      name: 'خالد الفيتوري',
      role: 'مهندس حلول سحابية',
      department: 'إدارة العمليات والشبكات',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    },
    title: 'مرحباً بزميلنا الجديد!',
    subtitle: 'انضم إلينا اليوم المهندس خالد الفيتوري لتعزيز بنية السحابة والشبكات. يسعدنا وجودك معنا في الفريق! 👋',
    date: 'انضم هذا الأسبوع',
    badgeLabel: '🌟 زميل جديد',
    ringColor: 'from-blue-600 via-sky-500 to-indigo-500',
    badgeBg: 'bg-blue-600 text-white',
    quickReactions: ['👋', '🚀', '🌟', '💪', '🤝'],
    suggestedMsg: 'أهلاً وسهلاً بك م. خالد في عائلة LITC! نورت الفريق 🚀',
    likesCount: 42
  },
  {
    id: 's3',
    type: 'condolence',
    person: {
      name: 'طارق الزنتاني',
      role: 'مدير حسابات أول',
      department: 'الإدارة المالية',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200'
    },
    title: 'مواساة وتعزية',
    subtitle: 'ببالغ الحزن والأسى نتقدم بأحر التعازي وصادق المواساة لزميلنا طارق الزنتاني في وفاة المغفور له بإذن الله (والده). إنا لله وإنا إليه راجعون.',
    date: 'عزاء ومواساة',
    badgeLabel: '🎗️ تعزية',
    ringColor: 'from-slate-950 via-slate-800 to-slate-900',
    badgeBg: 'bg-slate-900 text-white',
    quickReactions: ['🤲', '🕊️', '🖤'],
    suggestedMsg: 'عظم الله أجركم وأحسن عزاءكم وغفر للفقيد وأسكنه فسيح جناته.',
    likesCount: 68
  },
  {
    id: 's4',
    type: 'baby',
    person: {
      name: 'أحمد الورفلي',
      role: 'أخصائي أمن سيبراني',
      department: 'إدارة أمن المعلومات',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
    },
    title: 'مبارك المولود الجديد!',
    subtitle: 'رزق زميلنا أحمد الورفلي بمولود جديد. نبارك له ولعائلته ونسأل الله أن ينبته نباتاً حسناً ويجعله قرة عين لوالديه 🍼',
    date: 'منذ يومين',
    badgeLabel: '👶 مولود جديد',
    ringColor: 'from-emerald-500 via-teal-500 to-cyan-500',
    badgeBg: 'bg-emerald-600 text-white',
    quickReactions: ['👶', '🍼', '🎉', '❤️', '🌟'],
    suggestedMsg: 'ألف مبروك المولود الجديد م. أحمد، يتربى في عزكم ودلالكم يا رب!',
    likesCount: 51
  },
  {
    id: 's5',
    type: 'retirement',
    person: {
      name: 'عمر السويحلي',
      role: 'مستشار اتصالات رئيسي',
      department: 'الإدارة العامة للشبكات',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200'
    },
    title: 'تكريم وتقدير مسيرة عطاء',
    subtitle: 'نوجه تحية شكر وامتنان للمستشار عمر السويحلي بمناسبة تقاعده بعد 25 عاماً من الإخلاص والتميز في تطوير شبكات LITC. شكراً لعطائك 🎖️',
    date: 'تكريم تقاعد',
    badgeLabel: '🎖️ تكريم عطاء',
    ringColor: 'from-purple-600 via-violet-500 to-pink-500',
    badgeBg: 'bg-purple-600 text-white',
    quickReactions: ['🎖️', '👏', '💐', '⭐', '❤️'],
    suggestedMsg: 'شكراً جزيلاً أستاذ عمر على كل ما قدمته لنا وللشركة، نتمنى لك حياة حافلة بالهناء والصحة!',
    likesCount: 95
  }
];

const STORIES_DATA_EN: MilestoneStory[] = [
  {
    id: 's1',
    type: 'birthday',
    person: {
      name: 'Sara Al-Hashemi',
      role: 'UI/UX Designer',
      department: 'Tech & Innovation Dept',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    },
    title: 'Happy Birthday!',
    subtitle: 'Today is Sara Al-Hashemi’s birthday! Wishing her a vibrant year full of joy, creativity, and success at LITC ✨',
    date: 'Today',
    badgeLabel: '🎂 Birthday',
    ringColor: 'from-amber-500 via-orange-500 to-rose-500',
    badgeBg: 'bg-amber-500 text-white',
    quickReactions: ['🎂', '🎉', '✨', '👏', '❤️'],
    suggestedMsg: 'Wishing you a very Happy Birthday Sara! 🌸',
    likesCount: 34
  },
  {
    id: 's2',
    type: 'new_joiner',
    person: {
      name: 'Khaled Al-Fitouri',
      role: 'Cloud Solutions Engineer',
      department: 'Operations & Network Dept',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200'
    },
    title: 'Welcome to the Team!',
    subtitle: 'Eng. Khaled Al-Fitouri has joined us to expand our Cloud and Infrastructure systems. Welcome aboard! 👋',
    date: 'Joined this week',
    badgeLabel: '🌟 New Joiner',
    ringColor: 'from-blue-600 via-sky-500 to-indigo-500',
    badgeBg: 'bg-blue-600 text-white',
    quickReactions: ['👋', '🚀', '🌟', '💪', '🤝'],
    suggestedMsg: 'Welcome to the LITC family Khaled! Excited to have you 🚀',
    likesCount: 42
  },
  {
    id: 's3',
    type: 'condolence',
    person: {
      name: 'Tarek Al-Zintani',
      role: 'Senior Account Manager',
      department: 'Finance Department',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200'
    },
    title: 'Condolences & Sympathy',
    subtitle: 'Our deepest condolences and thoughts are with our colleague Tarek Al-Zintani on the passing of his beloved father. May his soul rest in peace.',
    date: 'Condolences',
    badgeLabel: '🎗️ Condolences',
    ringColor: 'from-slate-950 via-slate-800 to-slate-900',
    badgeBg: 'bg-slate-900 text-white',
    quickReactions: ['🤲', '🕊️', '🖤'],
    suggestedMsg: 'Our deepest condolences to you and your family Tarek.',
    likesCount: 68
  },
  {
    id: 's4',
    type: 'baby',
    person: {
      name: 'Ahmed Al-Warfalli',
      role: 'Cybersecurity Specialist',
      department: 'InfoSec Department',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200'
    },
    title: 'Congratulations on the Newborn!',
    subtitle: 'Ahmed Al-Warfalli has welcomed a newborn baby! Warmest congratulations to him and his family 🍼',
    date: '2 days ago',
    badgeLabel: '👶 Newborn',
    ringColor: 'from-emerald-500 via-teal-500 to-cyan-500',
    badgeBg: 'bg-emerald-600 text-white',
    quickReactions: ['👶', '🍼', '🎉', '❤️', '🌟'],
    suggestedMsg: 'Congratulations on your new blessing Ahmed! Wishing health & happiness.',
    likesCount: 51
  },
  {
    id: 's5',
    type: 'retirement',
    person: {
      name: 'Omar Al-Sweihli',
      role: 'Principal Telecom Consultant',
      department: 'General Network Management',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200'
    },
    title: 'Honoring a Distinguished Career',
    subtitle: 'Saluting Consultant Omar Al-Sweihli on his retirement after 25 years of dedication building LITC telecom network. Thank you! 🎖️',
    date: 'Retirement Honor',
    badgeLabel: '🎖️ Honor',
    ringColor: 'from-purple-600 via-violet-500 to-pink-500',
    badgeBg: 'bg-purple-600 text-white',
    quickReactions: ['🎖️', '👏', '💐', '⭐', '❤️'],
    suggestedMsg: 'Thank you Omar for your years of invaluable contributions and leadership!',
    likesCount: 95
  }
];

export function MilestonesStories() {
  const { language } = useHub();
  const isRtl = language === 'ar';

  const stories = useMemo(() => {
    return isRtl ? STORIES_DATA_AR : STORIES_DATA_EN;
  }, [isRtl]);

  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [reactedStories, setReactedStories] = useState<Record<string, boolean>>({});
  const [customMsg, setCustomMsg] = useState('');
  const [sentNotification, setSentNotification] = useState<string | null>(null);

  const isModalOpen = activeStoryIndex !== null;
  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  const handleOpenStory = (index: number) => {
    setActiveStoryIndex(index);
    setCustomMsg(stories[index].suggestedMsg);
    setSentNotification(null);
  };

  const handleCloseStory = () => {
    setActiveStoryIndex(null);
    setSentNotification(null);
  };

  const handleNextStory = () => {
    if (activeStoryIndex === null) return;
    const nextIdx = (activeStoryIndex + 1) % stories.length;
    setActiveStoryIndex(nextIdx);
    setCustomMsg(stories[nextIdx].suggestedMsg);
    setSentNotification(null);
  };

  const handlePrevStory = () => {
    if (activeStoryIndex === null) return;
    const prevIdx = (activeStoryIndex - 1 + stories.length) % stories.length;
    setActiveStoryIndex(prevIdx);
    setCustomMsg(stories[prevIdx].suggestedMsg);
    setSentNotification(null);
  };

  const toggleReact = (storyId: string) => {
    setReactedStories((prev) => ({
      ...prev,
      [storyId]: !prev[storyId]
    }));
  };

  const handleSendMsg = () => {
    if (!customMsg.trim()) return;
    setSentNotification(isRtl ? 'تم إرسال تهنئتك ومشاركتك بنجاح! 💌' : 'Message sent successfully! 💌');
    setCustomMsg('');
    setTimeout(() => {
      setSentNotification(null);
    }, 2500);
  };

  return (
    <section className="relative">
      {/* Stories Horizontal Row */}
      <div className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto no-scrollbar py-2 px-1">
        {stories.map((story, idx) => {
          const isCondolence = story.type === 'condolence';

          return (
            <motion.button
              key={story.id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleOpenStory(idx)}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 focus:outline-none group"
            >
              {/* Avatar with colored category ring */}
              <div className="relative">
                {/* Gradient Ring Frame */}
                <div
                  className={`size-[68px] sm:size-[72px] p-[2.5px] rounded-full bg-gradient-to-tr ${story.ringColor} shadow-md transition-all group-hover:shadow-lg`}
                >
                  <div className="size-full rounded-full bg-white dark:bg-slate-800 p-[2px] overflow-hidden">
                    <img
                      src={story.person.avatar}
                      alt={story.person.name}
                      className={`size-full rounded-full object-cover bg-slate-50 dark:bg-slate-900 transition-transform duration-300 group-hover:scale-105 ${
                        isCondolence ? 'grayscale contrast-125' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Badge Icon on ring bottom */}
                <div
                  className={`absolute -bottom-1 -right-1 size-5 sm:size-5.5 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-[10px] shadow-xs ${story.badgeBg}`}
                >
                  {story.type === 'birthday' && '🎂'}
                  {story.type === 'new_joiner' && '🌟'}
                  {story.type === 'condolence' && '🎗️'}
                  {story.type === 'baby' && '👶'}
                  {story.type === 'retirement' && '🎖️'}
                </div>

                {/* Subtle condolence ribbon corner if bereavement */}
                {isCondolence && (
                  <div className="absolute top-0 right-0 size-3 bg-black rounded-full border border-white" />
                )}
              </div>

              {/* Name & Milestone tag */}
              <div className="text-center w-20">
                <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {story.person.name.split(' ')[0]} {story.person.name.split(' ')[1] || ''}
                </p>
                <p
                  className={`text-[9px] font-semibold truncate mt-0.5 ${
                    isCondolence
                      ? 'text-slate-500'
                      : story.type === 'birthday'
                      ? 'text-amber-600'
                      : story.type === 'new_joiner'
                      ? 'text-blue-600'
                      : 'text-purple-600'
                  }`}
                >
                  {story.type === 'birthday' && (isRtl ? 'عيد ميلاد 🎂' : 'Birthday 🎂')}
                  {story.type === 'new_joiner' && (isRtl ? 'منضم جديد 🌟' : 'New Joiner 🌟')}
                  {story.type === 'condolence' && (isRtl ? 'مواساة 🖤' : 'Condolence 🖤')}
                  {story.type === 'baby' && (isRtl ? 'مولود جديد 👶' : 'New Baby 👶')}
                  {story.type === 'retirement' && (isRtl ? 'تكريم 🎖️' : 'Honored 🎖️')}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Full Immersive Story Modal */}
      <AnimatePresence>
        {isModalOpen && currentStory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseStory}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
            />

            {/* Story Modal Card */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 260 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl z-10 border border-white/40 dark:border-slate-800 flex flex-col max-h-[90vh] text-start rtl:text-right"
            >
              {/* Progress bar and Close button */}
              <div className="p-4 pb-2 bg-gradient-to-b from-black/60 to-transparent absolute top-0 inset-x-0 z-20 flex flex-col gap-2">
                {/* Segments Indicator */}
                <div className="flex items-center gap-1.5 w-full">
                  {stories.map((s, i) => (
                    <div
                      key={s.id}
                      className="h-1 flex-1 rounded-full overflow-hidden bg-white/30"
                    >
                      <div
                        className={`h-full transition-all duration-300 ${
                          i === activeStoryIndex
                            ? 'bg-white w-full'
                            : i < (activeStoryIndex || 0)
                            ? 'bg-white w-full'
                            : 'w-0'
                        }`}
                      />
                    </div>
                  ))}
                </div>

                {/* Top Bar Header */}
                <div className="flex items-center justify-between mt-1 text-white">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentStory.person.avatar}
                      alt=""
                      className={`size-8 rounded-full border border-white/80 bg-white object-cover ${
                        currentStory.type === 'condolence' ? 'grayscale' : ''
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold leading-tight">{currentStory.person.name}</p>
                      <p className="text-[10px] text-white/80 font-medium">{currentStory.date}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseStory}
                    className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Story Visual Area */}
              <div
                className={`pt-24 pb-8 px-6 text-center flex flex-col items-center justify-center relative overflow-hidden ${
                  currentStory.type === 'condolence'
                    ? 'bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white'
                    : currentStory.type === 'birthday'
                    ? 'bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-white dark:to-slate-900 text-slate-900 dark:text-white'
                    : currentStory.type === 'new_joiner'
                    ? 'bg-gradient-to-b from-blue-500/20 via-sky-500/10 to-white dark:to-slate-900 text-slate-900 dark:text-white'
                    : 'bg-gradient-to-b from-purple-500/20 via-pink-500/10 to-white dark:to-slate-900 text-slate-900 dark:text-white'
                }`}
              >
                {/* Big Avatar */}
                <div className="relative mb-4">
                  <div
                    className={`size-24 rounded-full p-1 bg-gradient-to-tr ${currentStory.ringColor} shadow-xl`}
                  >
                    <img
                      src={currentStory.person.avatar}
                      alt={currentStory.person.name}
                      className={`size-full rounded-full bg-white object-cover ${
                        currentStory.type === 'condolence' ? 'grayscale contrast-125' : ''
                      }`}
                    />
                  </div>
                  <span
                    className={`absolute bottom-0 right-0 px-2.5 py-0.5 rounded-full text-xs font-black shadow-md border-2 border-white ${currentStory.badgeBg}`}
                  >
                    {currentStory.badgeLabel}
                  </span>
                </div>

                {/* Title & Body */}
                <h3 className="font-display font-black text-lg tracking-tight">
                  {currentStory.title}
                </h3>
                <p
                  className={`mt-1 text-xs font-bold ${
                    currentStory.type === 'condolence' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {currentStory.person.name} • {currentStory.person.role} (
                  {currentStory.person.department})
                </p>

                <p
                  className={`mt-3 text-xs leading-relaxed max-w-sm font-medium ${
                    currentStory.type === 'condolence' ? 'text-slate-200' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {currentStory.subtitle}
                </p>

                {/* Quick Emoji Reactions */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {currentStory.quickReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setCustomMsg((prev) => prev + ' ' + emoji);
                      }}
                      className="size-9 rounded-2xl bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-base flex items-center justify-center shadow-xs hover:scale-115 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Story Nav arrows on desktop */}
                <button
                  onClick={handlePrevStory}
                  className="absolute start-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-current backdrop-blur-xs transition-all hidden sm:flex items-center justify-center"
                  aria-label="Previous"
                >
                  <ChevronLeft className="size-5 rtl:rotate-180" />
                </button>
                <button
                  onClick={handleNextStory}
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 text-current backdrop-blur-xs transition-all hidden sm:flex items-center justify-center"
                  aria-label="Next"
                >
                  <ChevronRight className="size-5 rtl:rotate-180" />
                </button>
              </div>

              {/* Bottom Interactive Message Bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customMsg}
                    onChange={(e) => setCustomMsg(e.target.value)}
                    placeholder={
                      currentStory.type === 'condolence'
                        ? (isRtl ? 'اكتب رسالة تعزية ومواساة...' : 'Write condolences & sympathy...')
                        : (isRtl ? 'اكتب كلمة تهنئة للزميل...' : 'Send congratulations & warm wishes...')
                    }
                    className="flex-1 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-medium rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-accent text-slate-800 dark:text-white shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMsg();
                    }}
                  />
                  <button
                    onClick={handleSendMsg}
                    disabled={!customMsg.trim()}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                      currentStory.type === 'condolence'
                        ? 'bg-slate-900 hover:bg-black text-white'
                        : 'bg-accent hover:brightness-105 text-white'
                    }`}
                  >
                    <Send className="size-3.5 rtl:rotate-0 rotate-180" />
                    <span>{isRtl ? 'إرسال' : 'Send'}</span>
                  </button>
                </div>

                {/* Sent notification feedback */}
                {sentNotification && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2 bg-emerald-500 text-white text-center text-xs font-bold rounded-xl shadow-xs"
                  >
                    {sentNotification}
                  </motion.div>
                )}

                {/* Footer Reactions info */}
                <div className="flex items-center justify-between pt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
                  <button
                    onClick={() => toggleReact(currentStory.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                      reactedStories[currentStory.id]
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Heart
                      className={`size-3.5 ${
                        reactedStories[currentStory.id] ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span>{currentStory.likesCount} {isRtl ? 'تفاعل' : 'Reactions'}</span>
                  </button>

                  <span className="text-slate-400 dark:text-slate-500">{isRtl ? 'اسحب أو انقر للتنقل' : 'Swipe or click to browse'}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

export { MilestonesStories as MilestonesBanner };
