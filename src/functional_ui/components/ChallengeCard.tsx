import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Users, 
  ArrowLeft, 
  ArrowRight,
  Flame, 
  Camera, 
  Gift,
  Award,
  ShieldCheck,
  Zap,
  BookOpen,
  Check,
  Coins
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Challenge } from '../types';
import { ChallengeDetailModal } from './ChallengeDetailModal';
import { useHub } from '../context/HubContext';

interface ChallengeCardProps {
  challenge: Challenge;
  onOpenDetail?: () => void;
  key?: React.Key;
}

export function ChallengeCard({ challenge, onOpenDetail }: ChallengeCardProps) {
  const { language, t } = useHub();
  const isRtl = language === 'ar';
  const [modalOpen, setModalOpen] = useState(false);

  const activeCount = challenge.activeParticipants.length;
  const completedCount = challenge.completedBy.length;
  const totalEngaged = activeCount + completedCount;

  const earlyBirdLeft = challenge.earlyBirdQuota && challenge.earlyBirdClaimed !== undefined
    ? Math.max(0, challenge.earlyBirdQuota - challenge.earlyBirdClaimed)
    : 0;

  const handleCardClick = () => {
    if (onOpenDetail) {
      onOpenDetail();
    } else {
      setModalOpen(true);
    }
  };

  // Get department theme colors
  const getDeptColor = (dept: string) => {
    if (dept.includes('الأمن') || dept.includes('Cyber')) return 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20';
    if (dept.includes('الموارد') || dept.includes('Human')) return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    if (dept.includes('الجودة') || dept.includes('Quality')) return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    if (dept.includes('الابتكار') || dept.includes('Innovation')) return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
    return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
  };

  return (
    <>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
        className="glass-card flex flex-col rounded-[28px] p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-xl transition-all cursor-pointer group bg-white/95 dark:bg-slate-800/95 text-start rtl:text-right relative overflow-hidden"
      >
        {/* Top Department Badge & Deadline */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-black border flex items-center gap-1 ${getDeptColor(challenge.department)}`}>
              <ShieldCheck className="size-3.5 shrink-0" />
              <span>{isRtl ? challenge.department : challenge.departmentEn}</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
              {challenge.challengeType === 'quiz_learning' 
                ? (isRtl ? '📝 تقرير واختبار تفاعلي' : '📝 Report & Quiz')
                : (isRtl ? '📸 توثيق وإثبات مصور' : '📸 Proof Upload')}
            </span>
          </div>

          <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold flex items-center gap-1 shrink-0">
            <Clock className="size-3" />
            {isRtl ? challenge.deadline : (challenge.deadlineEn || challenge.deadline)}
          </span>
        </div>

        {/* Title and Description */}
        <div className="mt-3.5 space-y-1.5 flex-1">
          <h3 className="font-display font-black text-base text-slate-900 dark:text-white group-hover:text-accent transition-colors leading-snug">
            {isRtl ? challenge.title : (challenge.titleEn || challenge.title)}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 font-medium">
            {isRtl ? challenge.description : (challenge.descriptionEn || challenge.description)}
          </p>
        </div>

        {/* Real Tangible Prize & Points Banner */}
        <div className="mt-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-amber-950/20 border border-amber-400/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="size-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Gift className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  {isRtl ? 'المكافأة العينية من الإدارة' : 'Official Material Reward'}
                </p>
                <p className="text-xs font-black text-slate-900 dark:text-amber-100 truncate">
                  {challenge.realReward ? (isRtl ? challenge.realReward.title : challenge.realReward.titleEn) : (isRtl ? 'درع وشهادة تميز' : 'Excellence Certificate')}
                </p>
              </div>
            </div>

            <div className="text-end rtl:text-left shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1 shadow-xs">
                <Coins className="size-3.5" />
                <span>+{challenge.rewardPoints} {isRtl ? 'ن' : 'pts'}</span>
              </span>
            </div>
          </div>

          {/* Early bird alert if active */}
          {earlyBirdLeft > 0 && challenge.userStatus !== 'completed' && (
            <div className="flex items-center justify-between text-[10px] bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-xl border border-amber-300/40 text-amber-900 dark:text-amber-200 font-bold">
              <span className="flex items-center gap-1">
                <Zap className="size-3 text-amber-500 animate-pulse" />
                <span>{isRtl ? `مكافأة الأوائل: +${challenge.earlyBirdBonus || 40} نقطة إضافية` : `Early-Bird Bonus: +${challenge.earlyBirdBonus || 40} pts`}</span>
              </span>
              <span className="font-black text-amber-600 dark:text-amber-400">
                {isRtl ? `متبقي ${earlyBirdLeft} مقاعد` : `${earlyBirdLeft} slots left`}
              </span>
            </div>
          )}
        </div>

        {/* Participants Progress Strip */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-700/70 grid grid-cols-2 gap-2 text-xs">
          {/* Active participants */}
          <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">
                {isRtl ? 'يخوضون التحدي ⏳' : 'In Progress ⏳'}
              </span>
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.2 rounded-full">
                {activeCount}
              </span>
            </div>
            <div className="flex items-center -space-x-1.5 rtl:space-x-reverse overflow-hidden pt-0.5">
              {challenge.activeParticipants.slice(0, 3).map((p) => (
                <img
                  key={p.id}
                  src={p.avatar}
                  alt={p.name}
                  title={`${p.name}`}
                  className="size-6 rounded-full border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-800 object-cover shadow-xs"
                />
              ))}
              {activeCount === 0 && (
                <span className="text-[9px] text-slate-400 font-medium">{isRtl ? 'كن أول مشارك!' : 'Be first to start!'}</span>
              )}
            </div>
          </div>

          {/* Completed participants */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/40">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300">
                {isRtl ? 'حققوا المكافأة ✅' : 'Completed ✅'}
              </span>
              <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded-full">
                {completedCount}
              </span>
            </div>
            <div className="flex items-center -space-x-1.5 rtl:space-x-reverse overflow-hidden pt-0.5">
              {challenge.completedBy.slice(0, 3).map((p) => (
                <img
                  key={p.id}
                  src={p.avatar}
                  alt={p.name}
                  title={`${p.name}`}
                  className="size-6 rounded-full border-2 border-white dark:border-slate-800 bg-white dark:bg-slate-800 object-cover shadow-xs"
                />
              ))}
              {completedCount === 0 && (
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">{isRtl ? 'المكافأة بانتظارك' : 'Rewards waiting!'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCardClick();
          }}
          className={`mt-4 w-full py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 active:scale-98 shadow-xs ${
            challenge.userStatus === 'completed'
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : challenge.userStatus === 'in_progress'
              ? 'bg-amber-500 hover:bg-amber-600 text-white'
              : 'bg-accent hover:brightness-105 text-white'
          }`}
        >
          {challenge.userStatus === 'completed' ? (
            <>
              <Check className="size-4" />
              <span>{isRtl ? 'تم إنجاز التحدي • عرض نتيجتك والمكافأة' : 'Completed • View Results & Prize'}</span>
            </>
          ) : challenge.userStatus === 'in_progress' ? (
            <>
              <Zap className="size-4 text-yellow-300" />
              <span>{isRtl ? 'متابعة التحدي وتقديم الإجابة' : 'Continue Challenge & Submit'}</span>
            </>
          ) : (
            <>
              <Trophy className="size-4 text-yellow-300" />
              <span>{isRtl ? 'بدء التحدي وخوض الاختبار / التوثيق' : 'Start Challenge & Earn Reward'}</span>
              {isRtl ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
            </>
          )}
        </button>
      </motion.div>

      {/* Detail Modal */}
      {modalOpen && (
        <ChallengeDetailModal
          challenge={challenge}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
