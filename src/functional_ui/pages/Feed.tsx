import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useHub } from '../context/HubContext';
import { PostCard } from '../components/PostCard';
import { MilestonesBanner } from '../components/MilestonesBanner';
import { OfficialCircularsBanner } from '../components/OfficialCircularsBanner';
import { CreatePostCard } from '../components/CreatePostCard';
import { ChallengeHubView } from '../components/ChallengeHubView';

// تم حذف tab "reels" — الريلز ممنوعة بالدستور (القسم الخامس)
export const TAB_KEYS = ['news', 'community', 'challenges'] as const;
export type MainFeedTab = typeof TAB_KEYS[number];

export default function FeedPage() {
  const { posts, feedTab, setFeedTab, language, t, activeModules } = useHub();
  const [visible, setVisible] = useState(5);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) setVisible(prev => prev + 5);
    }, { threshold: 0.1 });
    if (loaderRef.current) observerRef.current.observe(loaderRef.current);
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, [feedTab]);

  const isRtl = language === 'ar';
  const activeIndex = useMemo(() => {
    if (feedTab === 'challenges') return 2;
    if (feedTab === 'community') return 1;
    return 0; // 'news'
  }, [feedTab]);

  // Touch & Pointer Real-time Drag State
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startYRef = useRef<number>(0);
  const isHorizontalGesture = useRef<boolean | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastXRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);

  useEffect(() => {
    setDragOffset(0);
    setIsDragging(false);
  }, [feedTab]);

  const handleStart = (clientX: number, clientY: number, target: HTMLElement) => {
    if (
      target.closest('input') || target.closest('textarea') || target.closest('select') ||
      target.closest('.overflow-x-auto') || target.closest('[data-drawer-content="true"]') ||
      target.closest('button.interactive-control')
    ) return;
    startXRef.current = clientX;
    startYRef.current = clientY;
    lastXRef.current = clientX;
    lastTimeRef.current = Date.now();
    velocityRef.current = 0;
    isHorizontalGesture.current = null;
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (startXRef.current === 0 && startYRef.current === 0) return;
    const deltaX = clientX - startXRef.current;
    const deltaY = clientY - startYRef.current;
    if (isHorizontalGesture.current === null) {
      if (Math.abs(deltaX) > 7 || Math.abs(deltaY) > 7) {
        isHorizontalGesture.current = Math.abs(deltaX) > Math.abs(deltaY) * 1.1;
        if (isHorizontalGesture.current) setIsDragging(true);
      }
    }
    if (isHorizontalGesture.current) {
      const now = Date.now();
      const dt = now - lastTimeRef.current || 1;
      velocityRef.current = (clientX - lastXRef.current) / dt;
      lastXRef.current = clientX;
      lastTimeRef.current = now;
      let currentOffset = deltaX;
      if (isRtl) {
        if (activeIndex === 0 && deltaX < 0) currentOffset = deltaX * 0.25;
        else if (activeIndex === TAB_KEYS.length - 1 && deltaX > 0) currentOffset = deltaX * 0.25;
      } else {
        if (activeIndex === 0 && deltaX > 0) currentOffset = deltaX * 0.25;
        else if (activeIndex === TAB_KEYS.length - 1 && deltaX < 0) currentOffset = deltaX * 0.25;
      }
      setDragOffset(currentOffset);
    }
  };

  const handleEnd = () => {
    if (!isHorizontalGesture.current || !containerRef.current) {
      setDragOffset(0); setIsDragging(false);
      startXRef.current = 0; startYRef.current = 0;
      isHorizontalGesture.current = null;
      return;
    }
    const containerWidth = containerRef.current.clientWidth || window.innerWidth || 360;
    const threshold = Math.min(containerWidth * 0.18, 90);
    const velocity = velocityRef.current;
    let targetIndex = activeIndex;
    if (isRtl) {
      if (dragOffset > threshold || velocity > 0.35) { if (activeIndex < TAB_KEYS.length - 1) targetIndex = activeIndex + 1; }
      else if (dragOffset < -threshold || velocity < -0.35) { if (activeIndex > 0) targetIndex = activeIndex - 1; }
    } else {
      if (dragOffset < -threshold || velocity < -0.35) { if (activeIndex < TAB_KEYS.length - 1) targetIndex = activeIndex + 1; }
      else if (dragOffset > threshold || velocity > 0.35) { if (activeIndex > 0) targetIndex = activeIndex - 1; }
    }
    setIsDragging(false); setDragOffset(0);
    startXRef.current = 0; startYRef.current = 0;
    isHorizontalGesture.current = null;
    if (targetIndex !== activeIndex) setFeedTab(TAB_KEYS[targetIndex]);
  };

  const officialPosts = useMemo(() => posts.filter(p => p.type === 'official'), [posts]);
  const communityPosts = useMemo(() => posts.filter(p => p.type === 'community'), [posts]);

  const transformStyle = isRtl
    ? `translate3d(calc(${activeIndex * 100}% + ${dragOffset}px), 0, 0)`
    : `translate3d(calc(-${activeIndex * 100}% + ${dragOffset}px), 0, 0)`;

  const isChallengesActive = activeModules.functional_challenges !== false;
  const isCommunityActive = activeModules.functional_community !== false;

  return (
    <div
      ref={containerRef}
      onTouchStart={e => { if (e.touches.length === 1) handleStart(e.touches[0].clientX, e.touches[0].clientY, e.target as HTMLElement); }}
      onTouchMove={e => { if (e.touches.length === 1) handleMove(e.touches[0].clientX, e.touches[0].clientY); }}
      onTouchEnd={handleEnd} onTouchCancel={handleEnd}
      onMouseDown={e => handleStart(e.clientX, e.clientY, e.target as HTMLElement)}
      onMouseMove={e => { if (isDragging || startXRef.current !== 0) handleMove(e.clientX, e.clientY); }}
      onMouseUp={handleEnd} onMouseLeave={handleEnd}
      className="w-full overflow-hidden select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Horizontal Sliding Track — 3 Slides Only */}
      <div
        className="flex w-full will-change-transform"
        style={{
          transform: transformStyle,
          transition: isDragging ? 'none' : 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
          touchAction: 'pan-y',
        }}
      >
        {/* ===================================================== */}
        {/* SLIDE 0: OFFICIAL NEWS & CIRCULARS (الأخبار الرسمية) */}
        {/* ===================================================== */}
        <div className="w-full min-w-full shrink-0 px-2 sm:px-4 pt-16 sm:pt-20 pb-20 sm:pb-24 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="max-w-4xl mx-auto space-y-6">
            <OfficialCircularsBanner />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
                  {t('newsFeedTitle')}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                  {officialPosts.length} {t('postsCount')}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {officialPosts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 dark:text-slate-600">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-semibold text-sm">لا توجد أخبار رسمية حالياً</p>
                </div>
              ) : (
                officialPosts.slice(0, visible).map(post => <PostCard key={post.id} post={post} />)
              )}
              {visible < officialPosts.length && (
                <div ref={feedTab === 'news' ? loaderRef : null} className="h-10 w-full flex items-center justify-center">
                  <div className="size-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===================================================== */}
        {/* SLIDE 1: COMMUNITY POSTS (منشورات المجتمع)            */}
        {/* ===================================================== */}
        {isCommunityActive ? (
          <div className="w-full min-w-full shrink-0 px-2 sm:px-4 pt-16 sm:pt-20 pb-20 sm:pb-24 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="max-w-4xl mx-auto space-y-6">
              <MilestonesBanner />
              <CreatePostCard />
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-lg font-black text-slate-900 dark:text-white">
                    {t('communityFeedTitle')}
                  </h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 dark:text-slate-400">
                    {communityPosts.length} {t('postsCount')}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                {communityPosts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-600">
                    <div className="text-4xl mb-3">💬</div>
                    <p className="font-semibold text-sm">كن أول من ينشر في مجتمع الشركة</p>
                  </div>
                ) : (
                  communityPosts.slice(0, visible).map(post => <PostCard key={post.id} post={post} />)
                )}
                {visible < communityPosts.length && (
                  <div ref={feedTab === 'community' ? loaderRef : null} className="h-10 w-full flex items-center justify-center">
                    <div className="size-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full min-w-full shrink-0 flex items-center justify-center pt-16 pb-20 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="text-center text-slate-400 dark:text-slate-600">
              <div className="text-4xl mb-3">🔒</div>
              <p className="font-bold text-sm">هذا القسم غير مفعّل حالياً</p>
            </div>
          </div>
        )}

        {/* ===================================================== */}
        {/* SLIDE 2: CHALLENGES & INITIATIVES (التحديات)          */}
        {/* ===================================================== */}
        {isChallengesActive ? (
          <div className="w-full min-w-full shrink-0 px-2 sm:px-4 pt-16 sm:pt-20 pb-20 sm:pb-24 overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="max-w-4xl mx-auto space-y-6">
              <ChallengeHubView />
            </div>
          </div>
        ) : (
          <div className="w-full min-w-full shrink-0 flex items-center justify-center pt-16 pb-20 px-4" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="text-center text-slate-400 dark:text-slate-600">
              <div className="text-4xl mb-3">🔒</div>
              <p className="font-bold text-sm">التحديات غير مفعّلة حالياً</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
