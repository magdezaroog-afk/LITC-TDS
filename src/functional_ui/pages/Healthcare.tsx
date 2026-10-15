/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'framer-motion';
import { 
  HeartPulse, 
  Stethoscope, 
  Pill, 
  MapPin, 
  PhoneCall, 
  Search, 
  ChevronLeft,
  ChevronRight,
  Shield,
  FileCheck
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { useMemo } from 'react';

export default function HealthcarePage() {
  const { language, t } = useHub();
  const isRtl = language === 'ar';

  const clinics = useMemo(() => {
    return isRtl
      ? [
          { name: 'مجمع العيادات العام الاستشاري', type: 'عيادات تخصصية', distance: '1.2 كم', status: 'مفتوح الآن' },
          { name: 'مركز الرعاية والمستشفى الدولي', type: 'مستشفى عام', distance: '3.5 كم', status: 'مفتوح 24 ساعة' },
          { name: 'صيدلية الشفاء المعتمدة للتأمين', type: 'صيدلية شبكة معتمدة', distance: '0.8 كم', status: 'مفتوح الآن' },
        ]
      : [
          { name: 'General Specialist Consultative Clinic', type: 'Specialized Clinic', distance: '1.2 km', status: 'Open Now' },
          { name: 'International Care Medical Center', type: 'General Hospital', distance: '3.5 km', status: 'Open 24/7' },
          { name: 'Al-Shifa Accredited Network Pharmacy', type: 'Network Pharmacy', distance: '0.8 km', status: 'Open Now' },
        ];
  }, [isRtl]);

  const quickServices = useMemo(() => [
    { label: t('bookAppointment'), icon: Stethoscope, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40' },
    { label: t('approvedMeds'), icon: Pill, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40' },
    { label: t('medicalClaims'), icon: HeartPulse, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40' },
  ], [t]);

  return (
    <div className="space-y-8 text-start rtl:text-right">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15 mb-4">
            <HeartPulse className="size-4 text-emerald-300" />
            <span className="text-[10px] font-black uppercase tracking-wider">Health & Wellness</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black mb-3 leading-tight">
            {t('healthcareTitle')}
          </h1>
          <p className="text-teal-50 text-xs sm:text-sm opacity-90 leading-relaxed mb-6 max-w-lg">
            {t('healthcareSub')}
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="bg-white text-teal-800 px-5 py-2.5 rounded-2xl font-black flex items-center gap-2 text-xs shadow-md hover:bg-teal-50 transition-all">
              <PhoneCall className="size-4" />
              <span>{t('emergency247')}</span>
            </button>
            <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-white/20 transition-all">
              {t('fullMedicalGuide')}
            </button>
          </div>
        </div>
        <div className="absolute top-0 end-0 size-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Quick Services */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickServices.map((item, idx) => (
          <motion.button
            key={idx}
            whileHover={{ y: -4 }}
            className="glass-card p-6 flex flex-col items-center gap-3 group cursor-pointer rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 shadow-xs hover:shadow-md transition-all"
          >
            <div className={`size-14 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105`}>
              <item.icon className="size-7" />
            </div>
            <div className="text-center">
              <span className="block font-black text-slate-900 dark:text-white text-sm mb-0.5">{item.label}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider">
                {isRtl ? 'عرض التفاصيل' : 'View Details'}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Near Clinics */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            {t('accreditedClinics')}
          </h2>
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-2xl px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 shadow-xs w-full sm:w-80 group focus-within:border-teal-500 transition-all">
            <Search className="size-4 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder={isRtl ? 'بحث بالمنطقة أو التخصص...' : 'Search by area or specialty...'} 
              className="bg-transparent border-none outline-none text-xs px-2.5 w-full font-medium text-slate-900 dark:text-white placeholder:text-slate-400" 
            />
          </div>
        </div>

        <div className="grid gap-3">
          {clinics.map((clinic, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group cursor-pointer hover:border-teal-500/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 shadow-xs transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className="size-12 bg-teal-50 dark:bg-teal-950/40 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                    {clinic.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{clinic.type}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs font-bold text-teal-600 dark:text-teal-400">{clinic.distance}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-[10px] font-black border border-emerald-200 dark:border-emerald-700/60">
                  {clinic.status}
                </span>
                <div className="size-8 bg-slate-50 dark:bg-slate-700 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                  {isRtl ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
