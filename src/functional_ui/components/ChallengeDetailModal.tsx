import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trophy, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Camera, 
  Upload, 
  Heart, 
  MessageSquare, 
  Flame, 
  Users, 
  Award,
  ArrowRight,
  ArrowLeft,
  Send,
  Star,
  Gift,
  ShieldCheck,
  Zap,
  BookOpen,
  FileText,
  HelpCircle,
  AlertCircle,
  Coins,
  Check,
  RefreshCw,
  Share2
} from 'lucide-react';
import { Challenge } from '../types';
import { useHub } from '../context/HubContext';

interface ChallengeDetailModalProps {
  challenge: Challenge | null;
  onClose: () => void;
}

export function ChallengeDetailModal({ challenge, onClose }: ChallengeDetailModalProps) {
  const { user, joinChallenge, submitChallengeProof, completeChallengeQuiz, language, t } = useHub();
  const isRtl = language === 'ar';

  const [activeTab, setActiveTab] = useState<'material' | 'challenge' | 'submissions'>('material');
  
  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [attemptsCount, setAttemptsCount] = useState(1);
  const [isFirstTry, setIsFirstTry] = useState(true);

  // Proof state
  const [proofNote, setProofNote] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [earnedBreakdown, setEarnedBreakdown] = useState<{
    base: number;
    accuracy: number;
    earlyBird: number;
    total: number;
  } | null>(null);

  const [likedSubmissions, setLikedSubmissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (challenge) {
      if (challenge.userStatus === 'completed') {
        setActiveTab('submissions');
      } else if (challenge.userStatus === 'in_progress') {
        setActiveTab('challenge');
      } else {
        setActiveTab('material');
      }
    }
  }, [challenge?.id, challenge?.userStatus]);

  if (!challenge) return null;

  const isEarlyBirdAvailable = (challenge.earlyBirdClaimed || 0) < (challenge.earlyBirdQuota || 10);
  const earlyBirdSlotsLeft = Math.max(0, (challenge.earlyBirdQuota || 10) - (challenge.earlyBirdClaimed || 0));

  const handleStartChallenge = () => {
    joinChallenge(challenge.id);
    setActiveTab('challenge');
  };

  const handleSelectQuizAnswer = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleCheckQuiz = () => {
    if (!challenge.quizQuestions) return;
    
    let correctCount = 0;
    challenge.quizQuestions.forEach(q => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const percent = Math.round((correctCount / challenge.quizQuestions.length) * 100);
    setQuizScore(percent);
    setQuizSubmitted(true);

    if (percent === 100) {
      // Perfect score - calculate reward
      const basePts = challenge.rewardPoints;
      const accuracyBonus = isFirstTry ? (challenge.firstTryBonus || 50) : 0;
      const earlyBirdBonus = isEarlyBirdAvailable ? (challenge.earlyBirdBonus || 50) : 0;
      const total = basePts + accuracyBonus + earlyBirdBonus;

      setEarnedBreakdown({
        base: basePts,
        accuracy: accuracyBonus,
        earlyBird: earlyBirdBonus,
        total
      });

      // Submit to context
      completeChallengeQuiz(challenge.id, percent, isFirstTry, attemptsCount, isEarlyBirdAvailable);
      setShowCelebration(true);
    }
  };

  const handleRetryQuiz = () => {
    setUserAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    setIsFirstTry(false);
    setAttemptsCount(prev => prev + 1);
  };

  const handleSubmitProof = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const basePts = challenge.rewardPoints;
      const earlyBirdBonus = isEarlyBirdAvailable ? (challenge.earlyBirdBonus || 40) : 0;
      const total = basePts + earlyBirdBonus;

      setEarnedBreakdown({
        base: basePts,
        accuracy: 0,
        earlyBird: earlyBirdBonus,
        total
      });

      submitChallengeProof(
        challenge.id,
        selectedImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
        proofNote || (isRtl ? 'تم إنجاز التحدي وإرفاق التوثيق بنجاح!' : 'Challenge completed and verified successfully!')
      );
      setIsSubmitting(false);
      setShowCelebration(true);
    }, 600);
  };

  const toggleLike = (participantId: string) => {
    setLikedSubmissions((prev) => ({
      ...prev,
      [participantId]: !prev[participantId]
    }));
  };

  const sampleProofImages = isRtl
    ? [
        { label: 'مكتب صحي ومرتب', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600' },
        { label: '10,000 خطوة رياضية', url: 'https://images.unsplash.com/photo-1510519138161-58474ebf8993?auto=format&fit=crop&q=80&w=600' },
        { label: 'مقترح أتمتة الجودة', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600' },
        { label: 'إعدادات أمان الحساب', url: 'https://images.unsplash.com/photo-1589330694653-dad6d3240a91?auto=format&fit=crop&q=80&w=600' }
      ]
    : [
        { label: 'Ergonomic Desk', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600' },
        { label: '10,000 Steps Tracker', url: 'https://images.unsplash.com/photo-1510519138161-58474ebf8993?auto=format&fit=crop&q=80&w=600' },
        { label: 'Quality Automation', url: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=600' },
        { label: 'Security Config', url: 'https://images.unsplash.com/photo-1589330694653-dad6d3240a91?auto=format&fit=crop&q=80&w=600' }
      ];

  const allSubmissions = [
    ...challenge.activeParticipants.filter((p) => p.submissionImage || p.proofNote),
    ...challenge.completedBy.filter((p) => p.submissionImage || p.proofNote)
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl z-10 border border-white/40 dark:border-slate-800 flex flex-col max-h-[92vh] text-start rtl:text-right"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-slate-950 via-[#0a233f] to-slate-950 text-white p-6 relative overflow-hidden shrink-0 border-b border-slate-800">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 size-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 size-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between relative z-10 gap-3">
              <div className="space-y-2 max-w-xl">
                {/* Badges strip */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-black border border-cyan-400/30 flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    {isRtl ? challenge.department : challenge.departmentEn}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-yellow-300 text-[11px] font-black border border-yellow-500/30 flex items-center gap-1">
                    <Coins className="size-3.5" />
                    +{challenge.rewardPoints} {isRtl ? 'نقطة أساسية' : 'Base Pts'}
                  </span>
                  {isEarlyBirdAvailable && (
                    <span className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-black border border-orange-400/30 flex items-center gap-1 animate-pulse">
                      <Zap className="size-3" />
                      {isRtl ? `مكافأة الأوائل +${challenge.earlyBirdBonus || 50}ن (متبقي ${earlyBirdSlotsLeft})` : `Early-Bird +${challenge.earlyBirdBonus || 50}pts`}
                    </span>
                  )}
                </div>

                <h2 className="font-display text-xl sm:text-2xl font-black text-white leading-snug">
                  {isRtl ? challenge.title : (challenge.titleEn || challenge.title)}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {isRtl ? challenge.description : (challenge.descriptionEn || challenge.description)}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="size-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Official Real Prize Notification Box in Header */}
            {challenge.realReward && (
              <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-transparent border border-amber-400/40 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-md">
                    <Gift className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                      {isRtl ? 'الجائزة العينية المادية المعتمدة من الإدارة' : 'Official Material Department Prize'}
                    </p>
                    <p className="text-xs font-black text-white">
                      {isRtl ? challenge.realReward.title : challenge.realReward.titleEn}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-amber-200 font-bold border border-white/20 shrink-0">
                  {challenge.realReward.valueText}
                </span>
              </div>
            )}

            {/* Tabs */}
            <div className="flex items-center gap-2 mt-5 border-b border-slate-700/60 pb-0">
              <button
                onClick={() => setActiveTab('material')}
                className={`pb-2.5 px-3 text-xs font-black transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'material' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>{isRtl ? '1. المحتوى والتقرير التوعوي' : '1. Brief & Materials'}</span>
                {activeTab === 'material' && (
                  <motion.div layoutId="challengeTabIndicator" className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('challenge')}
                className={`pb-2.5 px-3 text-xs font-black transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'challenge' ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="size-3.5" />
                <span>{isRtl ? (challenge.challengeType === 'quiz_learning' ? '2. خوض الاختبار التفاعلي' : '2. تقديم التوثيق والإثبات') : '2. Challenge Action'}</span>
                {activeTab === 'challenge' && (
                  <motion.div layoutId="challengeTabIndicator" className="absolute bottom-0 inset-x-0 h-0.5 bg-yellow-400 rounded-full" />
                )}
              </button>

              <button
                onClick={() => setActiveTab('submissions')}
                className={`pb-2.5 px-3 text-xs font-black transition-colors relative flex items-center gap-1.5 ${
                  activeTab === 'submissions' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="size-3.5" />
                <span>{isRtl ? `3. مشاركات الزملاء (${allSubmissions.length})` : `3. Submissions (${allSubmissions.length})`}</span>
                {activeTab === 'submissions' && (
                  <motion.div layoutId="challengeTabIndicator" className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50 dark:bg-slate-900/50">
            {/* TAB 1: Material & Brief */}
            {activeTab === 'material' && (
              <div className="space-y-6">
                {/* Material Presentation Box */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                      <FileText className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-slate-900 dark:text-white text-base">
                        {isRtl ? challenge.materialTitle : (challenge.materialTitleEn || challenge.materialTitle)}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isRtl ? `صادر عن: ${challenge.department}` : `Issued by: ${challenge.departmentEn}`}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {isRtl ? challenge.materialSummary : (challenge.materialSummaryEn || challenge.materialSummary)}
                  </div>

                  {/* Highlighted criteria */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Star className="size-4 text-amber-500 fill-amber-500" />
                      {isRtl ? 'كيفية احتساب النقاط وتوزيع الجوائز في هذا التحدي:' : 'Scoring & Rewards Criteria:'}
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      <li className="flex items-start gap-2">
                        <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{isRtl ? `النقاط الأساسية لاجتياز التحدي: +${challenge.rewardPoints} نقطة.` : `Base completion points: +${challenge.rewardPoints} pts.`}</span>
                      </li>
                      {challenge.firstTryBonus && (
                        <li className="flex items-start gap-2">
                          <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{isRtl ? `مكافأة الإجابة الصحيحة 100% من أول محاولة: +${challenge.firstTryBonus} نقطة إضافية.` : `First-attempt 100% accuracy bonus: +${challenge.firstTryBonus} pts.`}</span>
                        </li>
                      )}
                      {challenge.earlyBirdBonus && (
                        <li className="flex items-start gap-2">
                          <Check className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{isRtl ? `مكافأة السرعة والأوائل لأول 10 موظفين: +${challenge.earlyBirdBonus} نقطة إضافية.` : `Speed bonus for first 10 participants: +${challenge.earlyBirdBonus} pts.`}</span>
                        </li>
                      )}
                      {challenge.realReward && (
                        <li className="flex items-start gap-2 text-amber-700 dark:text-amber-300 font-bold">
                          <Gift className="size-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span>{isRtl ? `المكافأة المادية: ${challenge.realReward.title} تقدم فورياً من الإدارة.` : `Material prize: ${challenge.realReward.titleEn}`}</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Bottom CTA to start */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl bg-gradient-to-r from-cyan-500/10 via-accent/10 to-transparent border border-cyan-500/20">
                  <div>
                    <p className="font-display font-black text-sm text-slate-900 dark:text-white">
                      {isRtl ? 'هل أنت مستعد لبدء التحدي؟' : 'Ready to start the challenge?'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isRtl ? 'أنهِ التحدي واكسب رصيدك من النقاط والمكافأة المعتمدة' : 'Complete the task to claim your points and rewards.'}
                    </p>
                  </div>

                  <button
                    onClick={handleStartChallenge}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-accent hover:brightness-105 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                  >
                    <span>{isRtl ? 'فهمت المحتوى • الانتقال للتحدي الآن' : 'I Understood • Go to Challenge'}</span>
                    {isRtl ? <ArrowLeft className="size-4" /> : <ArrowRight className="size-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Challenge Action (Quiz OR Proof Upload) */}
            {activeTab === 'challenge' && (
              <div className="space-y-6">
                {/* Case 1: Quiz Challenge */}
                {challenge.challengeType === 'quiz_learning' && challenge.quizQuestions && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <h4 className="font-display font-black text-sm text-slate-900 dark:text-white">
                          {isRtl ? 'الأسئلة التفاعلية ودراسات الحالة' : 'Interactive Assessment Questions'}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {isRtl ? `عدد الأسئلة: ${challenge.quizQuestions.length} أسئلة • المحاولة: رقم ${attemptsCount}` : `${challenge.quizQuestions.length} Questions • Attempt #${attemptsCount}`}
                        </p>
                      </div>
                      {isFirstTry && (
                        <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-black border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="size-3" />
                          {isRtl ? 'المحاولة الأولى نشطة (مكافأة الدقة متاحة)' : 'First Attempt (Bonus Active)'}
                        </span>
                      )}
                    </div>

                    {/* Question Cards */}
                    <div className="space-y-4">
                      {challenge.quizQuestions.map((q, qIndex) => {
                        const selectedOption = userAnswers[q.id];
                        const isAnswered = selectedOption !== undefined;
                        const isCorrect = isAnswered && selectedOption === q.correctIndex;

                        return (
                          <div
                            key={q.id}
                            className={`p-5 rounded-3xl bg-white dark:bg-slate-800 border transition-all ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                                  : 'border-rose-500/50 bg-rose-50/20 dark:bg-rose-950/20'
                                : 'border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="size-7 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center justify-center shrink-0">
                                {qIndex + 1}
                              </span>
                              <div className="space-y-3 flex-1">
                                <h5 className="font-display font-black text-sm text-slate-900 dark:text-white leading-relaxed">
                                  {isRtl ? q.question : (q.questionEn || q.question)}
                                </h5>

                                {/* Options */}
                                <div className="space-y-2">
                                  {(isRtl ? q.options : (q.optionsEn || q.options)).map((opt, optIndex) => {
                                    const isThisSelected = selectedOption === optIndex;
                                    const isThisCorrect = q.correctIndex === optIndex;

                                    let optionStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200';
                                    
                                    if (quizSubmitted) {
                                      if (isThisCorrect) {
                                        optionStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 font-bold';
                                      } else if (isThisSelected && !isThisCorrect) {
                                        optionStyle = 'border-rose-500 bg-rose-500/10 text-rose-900 dark:text-rose-300 line-through';
                                      }
                                    } else if (isThisSelected) {
                                      optionStyle = 'border-accent bg-accent/10 text-accent font-bold ring-2 ring-accent/30';
                                    }

                                    return (
                                      <button
                                        key={optIndex}
                                        type="button"
                                        disabled={quizSubmitted}
                                        onClick={() => handleSelectQuizAnswer(q.id, optIndex)}
                                        className={`w-full p-3.5 rounded-2xl border text-xs text-start rtl:text-right flex items-center justify-between gap-3 transition-all cursor-pointer ${optionStyle}`}
                                      >
                                        <span>{opt}</span>
                                        <div className={`size-5 rounded-full border flex items-center justify-center shrink-0 ${
                                          isThisSelected ? 'border-accent bg-accent text-white' : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                          {isThisSelected && <Check className="size-3 stroke-[3]" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Explanation after submission */}
                                {quizSubmitted && (
                                  <div className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                                    isCorrect 
                                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300/40 text-emerald-900 dark:text-emerald-200' 
                                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300/40 text-rose-900 dark:text-rose-200'
                                  }`}>
                                    <p className="font-black mb-1 flex items-center gap-1">
                                      {isCorrect ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <AlertCircle className="size-3.5 text-rose-500" />}
                                      {isCorrect ? (isRtl ? 'إجابة صحيحة ومطابقة للمعايير:' : 'Correct Answer:') : (isRtl ? 'إجابة غير دقيقة، التوضيح الرسمي:' : 'Incorrect, explanation:')}
                                    </p>
                                    <p>{isRtl ? q.explanation : (q.explanationEn || q.explanation)}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quiz Action Footer */}
                    <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                      <div>
                        {quizSubmitted ? (
                          <div>
                            <p className="font-display font-black text-sm text-slate-900 dark:text-white">
                              {quizScore === 100 
                                ? (isRtl ? '🎉 ممتاز! أحرزت درجة كاملة 100%' : '🎉 Outstanding! Perfect 100%') 
                                : (isRtl ? `حققت ${quizScore}% - راجع التوضيحات وأعد المحاولة` : `Score: ${quizScore}% - Review and retry`)}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {quizScore === 100 
                                ? (isRtl ? 'تم اعتماد نقاط التميز والمكافأة في رصيدك' : 'Rewards added to your profile')
                                : (isRtl ? 'تحتاج 100% للحصول على المكافأة والدرع' : '100% required for full reward')}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-display font-black text-sm text-slate-900 dark:text-white">
                              {isRtl ? 'تحقق من إجاباتك' : 'Review your answers'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {isRtl ? `أجبت على ${Object.keys(userAnswers).length} من أصل ${challenge.quizQuestions.length} أسئلة` : `Answered ${Object.keys(userAnswers).length}/${challenge.quizQuestions.length}`}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {quizSubmitted && quizScore !== 100 && (
                          <button
                            type="button"
                            onClick={handleRetryQuiz}
                            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="size-4" />
                            <span>{isRtl ? 'إعادة المحاولة' : 'Retry Quiz'}</span>
                          </button>
                        )}

                        {!quizSubmitted && (
                          <button
                            type="button"
                            disabled={Object.keys(userAnswers).length < challenge.quizQuestions.length}
                            onClick={handleCheckQuiz}
                            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-accent hover:brightness-105 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md"
                          >
                            <CheckCircle2 className="size-4" />
                            <span>{isRtl ? 'تصحيح واعتماد النتيجة' : 'Submit & Check Score'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Case 2: Field Proof Upload Challenge */}
                {challenge.challengeType === 'field_proof' && (
                  <div className="space-y-6">
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                      <div>
                        <h4 className="font-display font-black text-sm text-slate-900 dark:text-white mb-1">
                          {isRtl ? 'متطلبات التوثيق والإثبات المصور' : 'Verification Proof Guidelines'}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          {isRtl ? challenge.proofRequiredText : (challenge.proofRequiredTextEn || challenge.proofRequiredText)}
                        </p>
                      </div>

                      {/* Image Upload Box */}
                      <div className="space-y-3">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                          {isRtl ? '1. ارفع صورة أو لقطة شاشة توثق الإنجاز:' : '1. Upload proof photo or screenshot:'}
                        </label>
                        
                        {selectedImage ? (
                          <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 h-48 bg-slate-900 group">
                            <img src={selectedImage} alt="Proof" className="size-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setSelectedImage(null)}
                              className="absolute top-3 right-3 size-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-all"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-6 text-center hover:border-accent transition-colors bg-slate-50/50 dark:bg-slate-900/50">
                            <Camera className="size-8 mx-auto text-slate-400 mb-2" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {isRtl ? 'اسحب وأفلت الصورة هنا أو اختر من النماذج الجاهزة' : 'Drag & drop photo here or choose sample'}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 10MB</p>
                          </div>
                        )}

                        {/* Sample Quick Proof Selector */}
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {isRtl ? 'نماذج إثباتات سريعة للتجربة:' : 'Quick sample proofs for testing:'}
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {sampleProofImages.map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedImage(s.url)}
                                className={`p-2 rounded-xl border text-[11px] font-bold text-start truncate transition-all ${
                                  selectedImage === s.url
                                    ? 'border-accent bg-accent/10 text-accent ring-2 ring-accent/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notes Input */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-700 dark:text-slate-300 block">
                          {isRtl ? '2. ملاحظاتك أو تفاصيل المبادرة:' : '2. Notes or initiative details:'}
                        </label>
                        <textarea
                          rows={3}
                          value={proofNote}
                          onChange={(e) => setProofNote(e.target.value)}
                          placeholder={isRtl ? 'اكتب نبذة عن كيفية إنجازك للتحدي أو ملخص الفكرة...' : 'Describe how you completed the challenge...'}
                          className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-accent/40"
                        />
                      </div>

                      {/* Submit Button */}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleSubmitProof}
                        className="w-full py-3 rounded-2xl bg-accent hover:brightness-105 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
                      >
                        {isSubmitting ? (
                          <span>{isRtl ? 'جاري التحقق والإرسال...' : 'Submitting...'}</span>
                        ) : (
                          <>
                            <Send className="size-4" />
                            <span>{isRtl ? 'إرسال الإثبات واعتماد المكافأة والنقاط' : 'Submit Proof & Claim Reward'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Submissions & Colleagues */}
            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Trophy className="size-5 text-amber-500" />
                    <div>
                      <h4 className="font-display font-black text-sm text-slate-900 dark:text-white">
                        {isRtl ? 'لوحة الشرف وتوثيقات الزملاء المعتمدة' : 'Verified Submissions Wall'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isRtl ? 'شاهد إنجازات فريق العمل وبارك لهم تميزهم' : 'Celebrate peers achievements'}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-black border border-emerald-500/20">
                    {allSubmissions.length} {isRtl ? 'مشاركات معتمدة' : 'Verified'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allSubmissions.map((p) => {
                    const isLiked = likedSubmissions[p.id];
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={p.avatar}
                              alt={p.name}
                              className="size-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div>
                              <p className="text-xs font-black text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.department || (isRtl ? 'LITC' : 'LITC')}</p>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] font-black flex items-center gap-1">
                            <CheckCircle2 className="size-3" />
                            {p.status === 'completed' ? (isRtl ? 'أنهى التحدي' : 'Completed') : (isRtl ? 'قيد الإنجاز' : 'In Progress')}
                          </span>
                        </div>

                        {p.submissionImage && (
                          <div className="rounded-2xl overflow-hidden h-36 bg-slate-900">
                            <img src={p.submissionImage} alt="" className="size-full object-cover" />
                          </div>
                        )}

                        {p.proofNote && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            "{p.proofNote}"
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
                          <span>{p.completedAt || p.startedAt || (isRtl ? 'اليوم' : 'Today')}</span>
                          <button
                            type="button"
                            onClick={() => toggleLike(p.id)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full transition-colors ${
                              isLiked ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 font-bold' : 'text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Heart className={`size-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                            <span>{isLiked ? (p.likesCount || 0) + 1 : (p.likesCount || 0)}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* CELEBRATION MODAL OVERLAY */}
      {showCelebration && earnedBreakdown && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] p-6 text-center shadow-2xl border border-amber-400/50 space-y-5 relative overflow-hidden"
          >
            <div className="size-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 mx-auto flex items-center justify-center shadow-xl shadow-amber-400/20 text-slate-950 animate-bounce">
              <Trophy className="size-10 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-display text-xl font-black text-slate-900 dark:text-white">
                {isRtl ? '🎉 مبارك! تم إنجاز التحدي بنجاح' : '🎉 Congratulations! Challenge Completed'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isRtl ? `تم اعتماد مكافآتك من قِبل ${challenge.department}` : `Rewards approved by ${challenge.departmentEn}`}
              </p>
            </div>

            {/* Points Breakdown Receipt */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-start rtl:text-right">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span>{isRtl ? 'النقاط الأساسية للمهمة:' : 'Base points:'}</span>
                <span className="font-black text-slate-900 dark:text-white">+{earnedBreakdown.base}</span>
              </div>
              {earnedBreakdown.accuracy > 0 && (
                <div className="flex justify-between items-center text-amber-700 dark:text-amber-400 font-bold">
                  <span>{isRtl ? '🌟 مكافأة الدقة (المحاولة الأولى 100%):' : '🌟 First Attempt Bonus:'}</span>
                  <span className="font-black">+{earnedBreakdown.accuracy}</span>
                </div>
              )}
              {earnedBreakdown.earlyBird > 0 && (
                <div className="flex justify-between items-center text-orange-700 dark:text-orange-400 font-bold">
                  <span>{isRtl ? '⚡ مكافأة سرعة الاستجابة (الأوائل):' : '⚡ Early-Bird Speed Bonus:'}</span>
                  <span className="font-black">+{earnedBreakdown.earlyBird}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-sm font-black text-accent">
                <span>{isRtl ? 'إجمالي النقاط المكتسبة:' : 'Total Earned Points:'}</span>
                <span className="text-base text-amber-500">+{earnedBreakdown.total} {isRtl ? 'نقطة' : 'pts'}</span>
              </div>
            </div>

            {/* Tangible Reward Seal */}
            {challenge.realReward && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/10 border border-amber-400/50 flex items-center gap-3 text-start rtl:text-right">
                <div className="size-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shrink-0">
                  <Gift className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">
                    {isRtl ? 'المكافأة العينية المستحقة' : 'Claimable Physical Prize'}
                  </p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {isRtl ? challenge.realReward.title : challenge.realReward.titleEn}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isRtl ? 'تم تسجيل اسمك لدى الإدارة المعنية للاستلام الرسمي' : 'Registered at issuing department'}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowCelebration(false);
                setActiveTab('submissions');
              }}
              className="w-full py-3 rounded-2xl bg-accent hover:brightness-105 text-white font-black text-xs shadow-lg active:scale-98 transition-all"
            >
              {isRtl ? 'رائع! استعراض لوحة الإنجازات' : 'Awesome! View Leaderboard'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
