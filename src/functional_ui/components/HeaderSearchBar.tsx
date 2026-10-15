import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Users, Building2, Ticket, Trophy, HeartPulse, Sparkles, ArrowUpLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHub } from '../context/HubContext';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResultItem {
  id: string;
  title: string;
  category: 'circular' | 'user' | 'service' | 'challenge';
  categoryLabel: string;
  badgeColor: string;
  icon: any;
  action: () => void;
}

export function HeaderSearchBar() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiResults, setApiResults] = useState<SearchResultItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { setFeedTab, setRequestOpen, language, t } = useHub();
  const isRtl = language === 'ar';

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchData: SearchResultItem[] = [
    {
      id: 'c1',
      title: isRtl ? 'قرار مكافآت التميز والإنتاجية (الإدارة العليا)' : 'Productivity & Excellence Bonuses (Management)',
      category: 'circular',
      categoryLabel: isRtl ? 'قرار إداري' : 'Circular',
      badgeColor: 'bg-amber-100 text-amber-800',
      icon: Building2,
      action: () => {
        setFeedTab('news');
        navigate('/');
        setIsOpen(false);
      }
    },
    {
      id: 'c2',
      title: isRtl ? 'تعميم مواعيد العمل المرن وسياسة الإجازات (HR)' : 'Flexible Hours & Vacation Policy (HR)',
      category: 'circular',
      categoryLabel: isRtl ? 'الموارد البشرية' : 'HR',
      badgeColor: 'bg-blue-100 text-blue-800',
      icon: Building2,
      action: () => {
        setFeedTab('news');
        navigate('/');
        setIsOpen(false);
      }
    },
    {
      id: 'c3',
      title: isRtl ? 'إلزامية المصادقة الثنائية 2FA (أمن المعلومات)' : 'Mandatory 2FA Authentication (Cybersecurity)',
      category: 'circular',
      categoryLabel: isRtl ? 'الأمن الرقمي' : 'Security',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      icon: Building2,
      action: () => {
        setFeedTab('news');
        navigate('/');
        setIsOpen(false);
      }
    },
    {
      id: 'u1',
      title: isRtl ? 'سارة الهاشمي - مصمم واجهات (التصميم)' : 'Sara Al-Hashemi - UI Designer (Design)',
      category: 'user',
      categoryLabel: isRtl ? 'دليل الزملاء' : 'Directory',
      badgeColor: 'bg-purple-100 text-purple-800',
      icon: Users,
      action: () => {
        navigate('/directory');
        setIsOpen(false);
      }
    },
    {
      id: 'u2',
      title: isRtl ? 'محمد القحطاني - مهندس برمجيات (التقنية)' : 'Mohammed Al-Qahtani - Software Engineer (IT)',
      category: 'user',
      categoryLabel: isRtl ? 'دليل الزملاء' : 'Directory',
      badgeColor: 'bg-purple-100 text-purple-800',
      icon: Users,
      action: () => {
        navigate('/directory');
        setIsOpen(false);
      }
    },
    {
      id: 's1',
      title: isRtl ? 'تقديم طلب إجازة سنوية أو طارئة' : 'Submit annual or emergency leave',
      category: 'service',
      categoryLabel: isRtl ? 'خدمة ذاتية' : 'Service',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      icon: Ticket,
      action: () => {
        setRequestOpen(true);
        setIsOpen(false);
      }
    },
    {
      id: 's2',
      title: isRtl ? 'شبكة المستشفيات والبطاقة الطبية الرقمية' : 'Hospital network & digital medical card',
      category: 'service',
      categoryLabel: isRtl ? 'الرعاية الصحية' : 'Healthcare',
      badgeColor: 'bg-rose-100 text-rose-800',
      icon: HeartPulse,
      action: () => {
        navigate('/healthcare');
        setIsOpen(false);
      }
    },
    {
      id: 'ch1',
      title: isRtl ? 'تحدي المكتب الأخضر والمنظم (+150 نقطة)' : 'Organized Green Desk Challenge (+150 pts)',
      category: 'challenge',
      categoryLabel: isRtl ? 'تحديات' : 'Challenge',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      icon: Trophy,
      action: () => {
        setFeedTab('challenges');
        navigate('/');
        setIsOpen(false);
      }
    },
    {
      id: 'ch2',
      title: isRtl ? 'تحدي 10,000 خطوة يومياً (+200 نقطة)' : '10,000 Steps Daily Challenge (+200 pts)',
      category: 'challenge',
      categoryLabel: isRtl ? 'تحديات' : 'Challenge',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      icon: Trophy,
      action: () => {
        setFeedTab('challenges');
        navigate('/');
        setIsOpen(false);
      }
    }
  ];

  // Debounce the query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results from API
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setApiResults([]);
      setIsLoading(false);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        // Attempt to hit the real API
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(debouncedQuery)}`);
        if (!response.ok) throw new Error('API unavailable');
        const data = await response.json();
        // Assuming data is an array of SearchResultItem, map them appropriately
        // (In a real app, map the raw JSON to the UI interface here)
        setApiResults(data);
      } catch (err) {
        // Fallback to static mock data if backend isn't ready
        const localFiltered = searchData.filter((item) =>
          item.title.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          item.categoryLabel.toLowerCase().includes(debouncedQuery.toLowerCase())
        );
        setApiResults(localFiltered);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery, isRtl]); // isRtl included so that the mock fallback recalculates text

  const displayResults = query.trim() ? apiResults : searchData.slice(0, 5);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Box */}
      <div 
        className={`
          flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-full border transition-all duration-200 backdrop-blur-md
          ${isOpen 
            ? 'bg-white/80 dark:bg-slate-800/80 border-accent shadow-md ring-2 ring-accent/15' 
            : 'bg-slate-100/50 dark:bg-slate-800/40 hover:bg-white/70 dark:hover:bg-slate-800/70 border-white/60 dark:border-white/10 hover:border-slate-300 shadow-2xs'}
        `}
      >
        <Search className={`size-3.5 sm:size-4 shrink-0 transition-colors ${isOpen ? 'text-accent' : 'text-slate-400'}`} />
        
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={t('searchPlaceholder')}
          className="bg-transparent border-none outline-none text-xs w-full text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
        />

        {query ? (
          <button
            onClick={() => setQuery('')}
            className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-400 bg-white dark:bg-slate-700/80 rounded border border-slate-200 dark:border-slate-600 shadow-2xs">
            {isRtl ? 'بحث' : 'Search'}
          </kbd>
        )}
      </div>

      {/* Dropdown Suggestions */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full inset-x-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50 overflow-hidden text-start rtl:text-right"
          >
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 mb-1">
              <span>{query ? (isRtl ? 'نتائج البحث' : 'Search Results') : (isRtl ? 'روابط سريعة ومقترحة' : 'Quick Suggestions')}</span>
              {isLoading ? <Loader2 className="size-3 text-accent animate-spin" /> : <Sparkles className="size-3 text-accent" />}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
              {displayResults.length > 0 ? (
                displayResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors group text-start rtl:text-right"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-accent/10 group-hover:text-accent text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 transition-colors">
                        <item.icon className="size-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-accent transition-colors">
                          {item.title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 mx-2">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.categoryLabel}
                      </span>
                      <ArrowUpLeft className="size-3 text-slate-300 dark:text-slate-500 group-hover:text-accent transition-colors rtl:rotate-0 rotate-90" />
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  {isRtl ? `لا توجد نتائج مطابقة لـ "${query}"` : `No results matching "${query}"`}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
