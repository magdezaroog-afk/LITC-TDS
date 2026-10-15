/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHub } from '../context/HubContext';
import { 
  Camera, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Settings, 
  Shield, 
  Mail, 
  Phone, 
  Building2, 
  RefreshCw, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Award, 
  Lock, 
  ExternalLink,
  MessageSquare,
  KeyRound,
  FileCheck,
  Globe2,
  Check,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EditProfileModal from '../components/EditProfileModal';

export default function ProfilePage() {
  const { user, syncWithEntra, language, t } = useHub();
  const isRtl = language === 'ar';
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'org' | 'contact' | 'security'>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSync = async () => {
    await syncWithEntra();
    showToast(t('profileSyncedToast'));
  };

  // Direct reports mock list
  const directReports = [
    { name: isRtl ? 'سارة الهاشمي' : 'Sara Al-Hashemi', role: isRtl ? 'مهندسة واجهات' : 'UI Engineer', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
    { name: isRtl ? 'خالد الفيتوري' : 'Khaled Al-Fitouri', role: isRtl ? 'مهندس شبكات' : 'Network Engineer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200' },
    { name: isRtl ? 'طارق الزنتاني' : 'Tarek Al-Zintani', role: isRtl ? 'مسؤول قواعد بيانات' : 'Database Admin', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200' },
    { name: isRtl ? 'أحمد الورفلي' : 'Ahmed Al-Warfalli', role: isRtl ? 'أخصائي أمن سيبراني' : 'Security Analyst', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-start rtl:text-right pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 shadow-2xl border border-white/10 dark:border-slate-800 flex items-center gap-3 backdrop-blur-md"
          >
            <div className="size-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Check className="size-3.5" />
            </div>
            <span className="text-xs font-bold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microsoft Entra Top Sync Banner */}
      <div className="p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-slate-900/95 text-white border border-blue-500/20 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
            <Globe2 className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black tracking-wide">
                Microsoft Entra ID
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 border border-blue-400/30 text-blue-200">
                @{user.tenantDomain || 'litc.ly'}
              </span>
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" title="Teams Presence: Active" />
            </div>
            <p className="text-[11px] text-blue-200/80 font-medium mt-0.5 flex items-center gap-1.5">
              <span>{t('lastSynced')}:</span>
              <span className="font-semibold text-white/90">{user.lastSyncedAt || '09:00 ص'}</span>
              {user.syncStatus === 'overridden' && (
                <span className="ms-1.5 px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-bold">
                  {t('overrideBadge')}
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSync}
            disabled={user.syncStatus === 'syncing'}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${user.syncStatus === 'syncing' ? 'animate-spin text-blue-300' : ''}`} />
            <span>{user.syncStatus === 'syncing' ? t('syncing') : t('syncNow')}</span>
          </button>

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-4 py-2 bg-accent hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Edit3 className="size-3.5" />
            <span>{t('editProfile')}</span>
          </button>
        </div>
      </div>

      {/* Profile Main Card */}
      <div className="glass-card overflow-hidden rounded-[36px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-md">
        {/* Cover Graphic */}
        <div className="h-44 sm:h-52 bg-gradient-to-r from-primary via-indigo-700 to-accent relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-60" />
          
          <div className="absolute top-5 end-5 flex items-center gap-2 z-10">
            <Link 
              to="/settings"
              className="p-3 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-2xl text-white border border-white/20 transition-all shadow-md"
              aria-label={t('systemSettings')}
            >
              <Settings className="size-5" />
            </Link>
          </div>

          <div className="absolute bottom-4 start-6 sm:start-10 text-white/80 text-[11px] font-bold flex items-center gap-2">
            <Building2 className="size-4 text-white/90" />
            <span>{user.company || 'الشركة الليبية للاتصالات وتقنية المعلومات (LITC)'}</span>
          </div>
        </div>
        
        {/* Profile Info Row */}
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 sm:-mt-20 mb-8 gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-start rtl:sm:text-right">
              {/* Avatar with Presence Ring */}
              <div className="relative group shrink-0">
                <div className="size-32 sm:size-36 rounded-3xl bg-white dark:bg-slate-800 p-2 border-2 border-white dark:border-slate-700 shadow-xl relative z-10">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-full h-full object-cover rounded-2xl" 
                  />
                  {/* Real-time Teams presence badge */}
                  <span 
                    className="absolute bottom-3 end-3 size-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-800 shadow-xs ring-2 ring-emerald-400/40"
                    title="Microsoft Teams: Available" 
                  />
                </div>
                <button 
                  onClick={() => setIsEditModalOpen(true)}
                  className="absolute bottom-1 start-1 z-20 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all"
                  aria-label="Upload Avatar"
                >
                  <Camera className="size-3.5" />
                </button>
              </div>

              <div className="pb-1 space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    {user.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    <span>{user.employeeId || 'EMP-84920'}</span>
                  </span>
                </div>

                <p className="text-accent font-black text-xs sm:text-sm tracking-wide">
                  {user.role} • {user.department}
                </p>

                <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center justify-center sm:justify-start gap-2">
                  <Mail className="size-3.5 text-slate-400" />
                  <span>{user.userPrincipalName || user.email || 'ahmed.almohammed@litc.ly'}</span>
                </p>
              </div>
            </div>
            
            {/* Stats badges */}
            <div className="flex gap-4 justify-center sm:justify-end pb-1 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 dark:border-slate-700">
              <div className="text-center px-4">
                <p className="text-2xl sm:text-3xl font-black text-yellow-500">{user.points}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  {t('excellencePoints')}
                </p>
              </div>
              <div className="text-center px-4 border-s border-slate-200 dark:border-slate-700">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">42</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
                  {t('completedTasks')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 gap-2 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-3 px-4 text-xs font-black transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Briefcase className="size-4" />
              <span>{isRtl ? 'نظرة عامة والعمل' : 'Overview & Work'}</span>
            </button>

            <button
              onClick={() => setActiveTab('org')}
              className={`pb-3 px-4 text-xs font-black transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${
                activeTab === 'org'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Users className="size-4" />
              <span>{isRtl ? 'الهيكل والمدير المباشر' : 'Hierarchy & Team'}</span>
            </button>

            <button
              onClick={() => setActiveTab('contact')}
              className={`pb-3 px-4 text-xs font-black transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${
                activeTab === 'contact'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Phone className="size-4" />
              <span>{isRtl ? 'الاتصال والمكتب' : 'Contact & Office'}</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`pb-3 px-4 text-xs font-black transition-colors whitespace-nowrap border-b-2 flex items-center gap-2 ${
                activeTab === 'security'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="size-4" />
              <span>{isRtl ? 'الهوية الرقمية والتراخيص' : 'Identity & Licenses'}</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & WORK */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* About Me Section */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="size-4 text-yellow-500" />
                    <span>{t('aboutMeLabel')}</span>
                  </h3>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="size-3" />
                    <span>{isRtl ? 'تعديل' : 'Edit'}</span>
                  </button>
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                  {user.aboutMe || (isRtl ? 'لم تتم إضافة نبذة بعد.' : 'No bio added yet.')}
                </p>
              </div>

              {/* Work Details & Skills Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employment details */}
                <div className="space-y-3.5">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-700">
                    {t('workInfo')}
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="size-9 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center shrink-0">
                        <Briefcase className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'المسمى والإدارة' : 'Role & Department'}</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.role} - {user.department}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-9 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center shrink-0">
                        <Calendar className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('joinDate')}</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.hireDate || '15 يناير 2022 (منذ سنتين)'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="size-9 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('workLocation')}</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.officeLocation || 'المبنى الإداري والتقني، طرابلس'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Badges */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {t('skillsLabel')}
                    </h3>
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
                    >
                      <Edit3 className="size-3" />
                      <span>{isRtl ? 'إدارة المهارات' : 'Manage'}</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {user.skills && user.skills.length > 0 ? (
                      user.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/70 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 shadow-2xs"
                        >
                          <Award className="size-3.5 text-accent shrink-0" />
                          <span>{skill}</span>
                        </span>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400">{isRtl ? 'لا توجد مهارات مسجلة' : 'No skills recorded'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HIERARCHY & DIRECT MANAGER */}
          {activeTab === 'org' && (
            <div className="space-y-6">
              {/* Direct Manager Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/60 dark:from-slate-800/80 dark:to-slate-800/60 border border-blue-100 dark:border-slate-700">
                <p className="text-[10px] font-black text-accent uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Briefcase className="size-3.5" />
                  <span>{t('directManager')} (Microsoft Graph Manager)</span>
                </p>

                {user.manager ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <img 
                        src={user.manager.avatar} 
                        alt={user.manager.name}
                        className="size-14 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-sm"
                      />
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {user.manager.name}
                        </h4>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          {user.manager.role}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                          {user.manager.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${user.manager.email}`}
                        className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <Mail className="size-3.5 text-blue-500" />
                        <span>Outlook</span>
                      </a>
                      <button
                        onClick={() => showToast(isRtl ? 'جاري فتح محادثة Teams مع المدير...' : 'Opening Teams chat...')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                      >
                        <MessageSquare className="size-3.5" />
                        <span>Teams</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">{isRtl ? 'غير محدد' : 'Not assigned'}</p>
                )}
              </div>

              {/* Direct Reports & Team Members */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="size-4 text-accent" />
                    <span>{t('directReports')} ({directReports.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    {isRtl ? 'فريق العمل التابع' : 'Direct subordinates'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {directReports.map((member, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="size-11 rounded-xl object-cover border border-white dark:border-slate-600 shadow-2xs"
                        />
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white">{member.name}</p>
                          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{member.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => showToast(isRtl ? `جاري فتح محادثة Teams مع ${member.name}...` : `Opening Teams chat with ${member.name}...`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors"
                        title="Teams Chat"
                      >
                        <MessageSquare className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTACT & OFFICE LOCATION */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {t('contactDetails')}
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-[11px] font-bold text-accent hover:underline flex items-center gap-1"
                >
                  <Edit3 className="size-3" />
                  <span>{t('editProfile')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center gap-3.5">
                  <div className="size-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {isRtl ? 'البريد الرسمي (M365)' : 'Corporate Email'}
                    </p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.userPrincipalName || user.email || 'ahmed.almohammed@litc.ly'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center gap-3.5">
                  <div className="size-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('mobilePhone')}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.mobilePhone || '+218 91 384 9201'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center gap-3.5">
                  <div className="size-10 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('businessPhone')}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.businessPhone || '+218 21 360 4022 (تحويلة 4022)'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center gap-3.5">
                  <div className="size-10 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('officeRoom')}</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.officeLocation || 'المبنى الإداري والتقني - الطابق الثالث - مكتب 304'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENTRA ID SECURITY & LICENSES */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-slate-100 dark:border-slate-700 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="size-4 text-blue-500" />
                    <span>{t('entraSecurity')}</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    SSO Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Directory Object ID (GUID)
                    </p>
                    <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 select-all bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      {user.entraObjectId || '8f4c2e11-9a73-4b62-b912-78d91c6e40af'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      Tenant Domain / Authority
                    </p>
                    <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200 select-all bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      login.microsoftonline.com/{user.tenantDomain || 'litc.ly'}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Shield className="size-4.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{t('mfaEnforced')}</span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                    Conditional Access Compliant
                  </span>
                </div>
              </div>

              {/* Microsoft 365 Assigned Licenses */}
              <div className="space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="size-4 text-accent" />
                  <span>{t('licensesLabel')}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(user.licenses || [
                    'Microsoft 365 E5 Enterprise',
                    'Microsoft Entra ID P2',
                    'Microsoft Teams Enterprise Voice',
                    'Power BI Pro'
                  ]).map((license, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 flex items-center gap-2.5 text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      <span>{license}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccessToast={showToast}
      />
    </div>
  );
}
