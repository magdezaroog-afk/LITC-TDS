/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Medal, 
  Filter
} from 'lucide-react';
import { useHub } from '../context/HubContext';
import { ChallengeCard } from './ChallengeCard';
import { ChallengeDetailModal } from './ChallengeDetailModal';
import { Challenge } from '../types';

export function ChallengeHubView() {
  const { 
    challenges, 
    user, 
    language, 
    t 
  } = useHub();
  const isRtl = language === 'ar';
  const [filter, setFilter] = useState<'all' | 'active' | 'my' | 'completed'>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  const filteredChallenges = useMemo(() => {
    if (filter === 'all') return challenges;
    if (filter === 'active') return challenges.filter((c) => c.deadline.includes('ينتهي') || c.deadline.includes('مستمر') || c.deadline.includes('Ends') || c.deadline.includes('Active'));
    if (filter === 'my') return challenges.filter((c) => c.userStatus === 'in_progress' || c.userStatus === 'completed');
    if (filter === 'completed') return challenges.filter((c) => c.userStatus === 'completed');
    return challenges;
  }, [challenges, filter]);

  // Leaderboard mock
  const leaderboard = isRtl
    ? [
        { name: 'محمد علي', pts: 2450, role: 'إدارة العمليات', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed', rank: 1 },
        { name: 'سارة خالد', pts: 2100, role: 'إدارة الجودة', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaraK', rank: 2 },
        { name: user.name, pts: user.points, role: user.department, avatar: user.avatar, rank: 3, isMe: true },
        { name: 'فهد محمد', pts: 1450, role: 'أمن المعلومات', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fahad', rank: 4 },
        { name: 'ليلى أحمد', pts: 1320, role: 'الموارد البشرية', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laila', rank: 5 },
      ]
    : [
        { name: 'Mohamed Ali', pts: 2450, role: 'Operations', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed', rank: 1 },
        { name: 'Sara Khaled', pts: 2100, role: 'Quality Assurance', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SaraK', rank: 2 },
        { name: user.name, pts: user.points, role: user.department, avatar: user.avatar, rank: 3, isMe: true },
        { name: 'Fahad Mohammed', pts: 1450, role: 'Cybersecurity', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fahad', rank: 4 },
        { name: 'Layla Ahmed', pts: 1320, role: 'Human Resources', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laila', rank: 5 },
      ];

  return (
    <div className="space-y-6 text-start rtl:text-right">
      <div className="space-y-6">
        {/* Excellence Header Banner */}
        <div className="bg-gradient-to-br from-[#07172b] via-[#0f2d4e] to-[#07172b] rounded-[32px] p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-slate-700/40">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-start rtl:md:text-right max-w-lg">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/15">
                <Sparkles className="size-3.5 text-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-200">
                  {isRtl ? 'برنامج تحديات وتميز موظفي LITC' : 'LITC Employee Challenges & Excellence Program'}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-black leading-tight text-white">
                {isRtl ? (
                  <>شارك في التحديات واكسب <span className="text-yellow-400">نقاط التميز المؤسسية</span></>
                ) : (
                  <>Join Challenges & Earn <span className="text-yellow-400">Excellence Points</span></>
                )}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {isRtl
                  ? 'حقق أهدافك المهنية، شارك إثباتاتك المصورة أو أجب عن الكويزات التفاعلية، ونافس زملاءك في قائمة الشرف.'
                  : 'Achieve work milestones, submit verified proof photos or answer quizzes, and climb the company leaderboard.'}
              </p>
            </div>

            {/* User Points Card */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex-1 md:flex-initial text-center min-w-[120px]">
                <p className="text-2xl sm:text-3xl font-black text-yellow-400">{user.points}</p>
                <p className="text-[10px] text-slate-300 font-bold mt-0.5">{isRtl ? 'نقاط التميز الإدارية' : 'Dept Points'}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex-1 md:flex-initial text-center min-w-[120px]">
                <div className="flex items-center justify-center gap-1">
                  <Medal className="size-4 text-amber-400" />
                  <span className="text-2xl sm:text-3xl font-black text-white">#3</span>
                </div>
                <p className="text-[10px] text-slate-300 font-bold mt-0.5">{isRtl ? 'ترتيبك بالشركة' : 'Rank in Company'}</p>
              </div>
            </div>
          </div>

          {/* Ambient Glows */}
          <div className="absolute -top-10 -left-10 size-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 size-48 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Filter Tabs & Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? `جميع التحديات (${challenges.length})` : `All Challenges (${challenges.length})`}
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'active'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'النشطة 🔥' : 'Active 🔥'}
            </button>
            <button
              onClick={() => setFilter('my')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'my'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl 
                ? `تحدياتي (${challenges.filter((c) => c.userStatus !== 'not_started').length})` 
                : `My Challenges (${challenges.filter((c) => c.userStatus !== 'not_started').length})`}
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                filter === 'completed'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isRtl ? 'المكتملة ✅' : 'Completed ✅'}
            </button>
          </div>
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onOpenDetail={() => setSelectedChallenge(challenge)}
            />
          ))}
        </div>

        {/* Top Leaderboard Strip */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Trophy className="size-4" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm text-slate-900 dark:text-white">
                  {isRtl ? 'لوحة شرف المتصدرين لهذا الشهر' : 'Monthly Excellence Leaderboard'}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold">
                  {isRtl ? 'الموظفون الأكثر جمعاً لنقاط التميز والتحديات' : 'Top employees ranked by points and completed challenges'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
            {leaderboard.map((u, i) => (
              <div
                key={i}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2.5 ${
                  u.isMe
                    ? 'bg-amber-500/10 border-amber-500/30 text-slate-900 dark:text-white'
                    : 'bg-slate-50/70 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <div
                  className={`size-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    i === 0
                      ? 'bg-yellow-400 text-yellow-950 shadow-xs'
                      : i === 1
                      ? 'bg-slate-300 text-slate-800'
                      : i === 2
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200'
                  }`}
                >
                  {u.rank}
                </div>

                <img
                  src={u.avatar}
                  alt={u.name}
                  className="size-8 rounded-full bg-white dark:bg-slate-700 object-cover border border-slate-200 dark:border-slate-600 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate flex items-center gap-1">
                    <span>{u.name}</span>
                    {u.isMe && (
                      <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded-sm font-bold">
                        {isRtl ? 'أنت' : 'You'}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black truncate">
                    {u.pts} {isRtl ? 'نقطة' : 'pts'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Modal */}
      {selectedChallenge && (
        <ChallengeDetailModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
        />
      )}
    </div>
  );
}
