/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  RotateCcw, 
  Briefcase, 
  Phone, 
  MapPin, 
  Building2, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Send,
  CloudCheck
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { User } from '../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

export default function EditProfileModal({ isOpen, onClose, onSuccessToast }: EditProfileModalProps) {
  const { user, updateUserProfile, resetToEntraDefaults, language, t } = useHub();
  const isRtl = language === 'ar';

  const [formData, setFormData] = useState({
    name: user.name || '',
    role: user.role || '',
    department: user.department || '',
    company: user.company || '',
    mobilePhone: user.mobilePhone || '',
    businessPhone: user.businessPhone || '',
    officeLocation: user.officeLocation || '',
    city: user.city || '',
    aboutMe: user.aboutMe || '',
  });

  const [skills, setSkills] = useState<string[]>(user.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [notifyHr, setNotifyHr] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || '',
        role: user.role || '',
        department: user.department || '',
        company: user.company || '',
        mobilePhone: user.mobilePhone || '',
        businessPhone: user.businessPhone || '',
        officeLocation: user.officeLocation || '',
        city: user.city || '',
        aboutMe: user.aboutMe || '',
      });
      setSkills(user.skills || []);
    }
  }, [isOpen, user]);

  const handleAddSkill = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      updateUserProfile({
        name: formData.name,
        role: formData.role,
        department: formData.department,
        company: formData.company,
        mobilePhone: formData.mobilePhone,
        businessPhone: formData.businessPhone,
        officeLocation: formData.officeLocation,
        city: formData.city,
        aboutMe: formData.aboutMe,
        skills: skills,
      });

      setIsSaving(false);
      onClose();
      if (onSuccessToast) {
        onSuccessToast(t('profileUpdatedToast'));
      }
    }, 600);
  };

  const handleResetDefaults = () => {
    resetToEntraDefaults();
    onClose();
    if (onSuccessToast) {
      onSuccessToast(t('profileSyncedToast'));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden z-10 my-8 text-start rtl:text-right"
        >
          {/* Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-accent/10 dark:bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <Briefcase className="size-5.5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('editProfile')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  {t('editProfileDesc')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {/* Sync Alert Banner */}
            <div className="p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-start gap-3">
              <CloudCheck className="size-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-blue-900 dark:text-blue-300">
                  {isRtl ? 'بيانات مسترجعة تلقائياً من Microsoft Entra ID' : 'Synchronized from Microsoft Entra ID'}
                </p>
                <p className="text-blue-700/80 dark:text-blue-400/80 leading-relaxed font-medium">
                  {t('hrCorrectionNote')}
                </p>
              </div>
            </div>

            {/* Section 1: Job Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <Briefcase className="size-4 text-accent" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {t('jobDetails')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isRtl ? 'الاسم الكامل (Display Name)' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isRtl ? 'المسمى الوظيفي (Job Title)' : 'Job Title'}
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isRtl ? 'الإدارة / القسم (Department)' : 'Department'}
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-accent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isRtl ? 'الرقم الوظيفي (Employee ID)' : 'Employee ID'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={user.employeeId || 'EMP-84920'}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <Lock className="size-3.5 text-slate-400 absolute end-3 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Contact & Workplace */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <Phone className="size-4 text-emerald-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {t('contactDetails')}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('mobilePhone')}
                  </label>
                  <input
                    type="text"
                    value={formData.mobilePhone}
                    onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-accent"
                    placeholder="+218 91 000 0000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('businessPhone')}
                  </label>
                  <input
                    type="text"
                    value={formData.businessPhone}
                    onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-accent"
                    placeholder="+218 21 000 0000 (تحويلة 0000)"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {t('officeRoom')}
                  </label>
                  <input
                    type="text"
                    value={formData.officeLocation}
                    onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-accent"
                    placeholder="المبنى الإداري والتقني - الطابق الثالث - مكتب 304"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Bio & Skills */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="size-4 text-yellow-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {t('skillsAndBio')}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('aboutMeLabel')}
                </label>
                <textarea
                  rows={3}
                  value={formData.aboutMe}
                  onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-accent resize-none leading-relaxed"
                  placeholder="اكتب نبذة مختصرة عن مسؤولياتك وخبرتك المهنية..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('skillsLabel')}
                </label>
                
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder={t('addSkillPlaceholder')}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Plus className="size-3.5" />
                    <span>{isRtl ? 'إضافة' : 'Add'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* HR Notification Option */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Send className="size-4 text-accent shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {isRtl ? 'إرسال إشعار طلب تصحيح إلى إدارة الموارد البشرية' : 'Notify HR of Directory Discrepancy'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {isRtl ? 'لتحديث قاعدة بيانات مايكروسوفت انترا المركزية' : 'To sync changes with Microsoft Entra central directory'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={notifyHr}
                onChange={(e) => setNotifyHr(e.target.checked)}
                className="size-4.5 text-accent rounded-md border-slate-300 dark:border-slate-600 focus:ring-accent accent-accent cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="size-3.5" />
                <span>{t('resetDefaults')}</span>
              </button>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('cancel')}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 sm:flex-initial px-6 py-2.5 bg-accent hover:brightness-110 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      <span>{t('saveChanges')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
