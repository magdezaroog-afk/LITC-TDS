/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, Phone, MessageSquare, Filter, UserPlus, UserX, Sparkles, Lock } from 'lucide-react';
import { useHub } from '../context/HubContext';

const EMPLOYEES_AR = [
  { name: 'سارة الهاشمي', role: 'مصمم واجهة وتجربة مستخدم', dept: 'التصميم والابتكار', email: 'sara.hashemi@litc.ly', phone: '+218 91 123 4567', location: 'المقر الرئيسي، طرابلس', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { name: 'محمد القحطاني', role: 'مهندس بنية سحابية', dept: 'تقنية المعلومات', email: 'mo.qahtani@litc.ly', phone: '+218 92 234 5678', location: 'مركز البيانات، جنزور', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { name: 'نورة العتيبي', role: 'مدير منتجات رئيسي', dept: 'العمليات والتشغيل', email: 'noura.otaibi@litc.ly', phone: '+218 91 345 6789', location: 'المقر الرئيسي، طرابلس', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=200' },
  { name: 'خالد العنزي', role: 'كبير محللي البيانات', dept: 'تقنية المعلومات', email: 'khaled.enezi@litc.ly', phone: '+218 94 456 7890', location: 'فرع بنغازي', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
  { name: 'ريم السعدي', role: 'أخصائية فعاليات وتطوير', dept: 'الموارد البشرية', email: 'reem.saadi@litc.ly', phone: '+218 91 567 8901', location: 'المقر الرئيسي، طرابلس', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { name: 'عبدالله الشمري', role: 'مهندس أمن سيبراني', dept: 'الأمن الرقمي', email: 'abdullah.shammari@litc.ly', phone: '+218 92 678 9012', location: 'مركز العمليات الأمنية SOC', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
];

const EMPLOYEES_EN = [
  { name: 'Sara Al-Hashemi', role: 'UI/UX Designer', dept: 'Design & Innovation', email: 'sara.hashemi@litc.ly', phone: '+218 91 123 4567', location: 'Tripoli HQ', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { name: 'Mohammed Al-Qahtani', role: 'Cloud Infrastructure Engineer', dept: 'Information Technology', email: 'mo.qahtani@litc.ly', phone: '+218 92 234 5678', location: 'Data Center, Janzour', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
  { name: 'Noura Al-Otaibi', role: 'Lead Product Manager', dept: 'Operations & Strategy', email: 'noura.otaibi@litc.ly', phone: '+218 91 345 6789', location: 'Tripoli HQ', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=200' },
  { name: 'Khaled Al-Enezi', role: 'Senior Data Analyst', dept: 'Information Technology', email: 'khaled.enezi@litc.ly', phone: '+218 94 456 7890', location: 'Benghazi Branch', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
  { name: 'Reem Al-Saadi', role: 'Events & Engagement Specialist', dept: 'Human Resources', email: 'reem.saadi@litc.ly', phone: '+218 91 567 8901', location: 'Tripoli HQ', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { name: 'Abdullah Al-Shammari', role: 'Cybersecurity Engineer', dept: 'Digital Security', email: 'abdullah.shammari@litc.ly', phone: '+218 92 678 9012', location: 'SOC Center', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
];

export default function DirectoryPage() {
  const { 
    language, 
    t, 
    setActiveChatTarget, 
    setActiveEmailTarget, 
    setActiveProfileTarget 
  } = useHub();
  const isRtl = language === 'ar';
  const [searchTerm, setSearchTerm] = useState('');

  const employees = useMemo(() => {
    const list = isRtl ? EMPLOYEES_AR : EMPLOYEES_EN;
    if (!searchTerm.trim()) return list;
    return list.filter((emp) => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.dept.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [isRtl, searchTerm]);

  const handleChatClick = (emp: typeof EMPLOYEES_AR[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveChatTarget(emp);
  };

  const handleEmailClick = (emp: typeof EMPLOYEES_AR[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveEmailTarget(emp);
  };

  const handleProfileClick = (emp: typeof EMPLOYEES_AR[0]) => {
    setActiveProfileTarget(emp);
  };

  return (
    <div className="space-y-8 text-start rtl:text-right">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            {t('directoryTitle')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm">
            {t('directorySub')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 md:w-80 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 shadow-xs focus-within:border-accent transition-all">
            <Search className="size-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchColleaguesPlaceholder')} 
              className="bg-transparent border-none outline-hidden text-xs w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white font-medium" 
            />
          </div>
          <button 
            className="p-3 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shadow-xs transition-all"
            aria-label={isRtl ? 'تصفية' : 'Filter'}
          >
            <Filter className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {employees.map((emp, i) => {
          return (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleProfileClick(emp)}
              className="glass-card p-6 group relative overflow-hidden rounded-3xl border transition-all cursor-pointer border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex items-start gap-4 sm:gap-6 relative z-10">
                <div className="relative shrink-0">
                  <img 
                    src={emp.avatar} 
                    alt={emp.name} 
                    className="size-16 sm:size-20 rounded-2xl bg-slate-50 dark:bg-slate-700 border-2 border-white dark:border-slate-700 shadow-md transition-transform duration-300 group-hover:scale-105 object-cover" 
                  />
                  <div className="absolute -bottom-1 -end-1 size-4 rounded-full border-2 border-white dark:border-slate-800 shadow-sm bg-green-500" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-accent transition-colors truncate">
                          {emp.name}
                        </h3>
                      </div>
                      <p className="text-xs text-accent font-bold mt-0.5 truncate">
                        {emp.role}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700/80 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600">
                        <span className="size-1.5 bg-accent rounded-full" />
                        <span>{emp.dept}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                    <button 
                      onClick={(e) => handleEmailClick(emp, e)}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-center flex items-center justify-center gap-1.5 text-xs font-bold"
                      title={emp.email}
                    >
                      <Mail className="size-4" />
                      <span className="hidden sm:inline">{isRtl ? 'بريد' : 'Email'}</span>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(emp);
                      }}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-900 hover:text-white dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                      title={isRtl ? 'الملف الوظيفي' : 'Profile'}
                    >
                      <Phone className="size-4" />
                      <span className="hidden sm:inline">{isRtl ? 'الملف' : 'Profile'}</span>
                    </button>
                    <button 
                      onClick={(e) => handleChatClick(emp, e)}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-accent hover:text-white dark:hover:bg-accent transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                      title={isRtl ? 'محادثة مباشرة' : 'Direct Chat'}
                    >
                      <MessageSquare className="size-4" />
                      <span className="hidden sm:inline">{isRtl ? 'محادثة' : 'Chat'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
