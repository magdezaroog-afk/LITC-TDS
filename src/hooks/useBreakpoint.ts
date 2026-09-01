import { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────
   Breakpoint Tokens — World-Class 2026 Responsive System
   Mobile  : < 768px
   Tablet  : 768px – 1024px
   Desktop : > 1024px
   ───────────────────────────────────────────────────────────── */

export type BreakpointType = 'mobile' | 'tablet' | 'desktop';

const getBreakpoint = (width: number): BreakpointType => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const useBreakpoint = (): BreakpointType => {
  const [bp, setBp] = useState<BreakpointType>(() =>
    getBreakpoint(window.innerWidth)
  );

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setBp(getBreakpoint(window.innerWidth));
    });
    observer.observe(document.documentElement);
    return () => observer.disconnect();
  }, []);

  return bp;
};

export const useIsMobile   = () => useBreakpoint() === 'mobile';
export const useIsTablet   = () => useBreakpoint() === 'tablet';
export const useIsDesktop  = () => useBreakpoint() === 'desktop';
