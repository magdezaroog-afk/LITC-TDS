import React, { useRef, useState, useEffect } from 'react';

export function generateTicketPath(
  w: number,
  h: number,
  cr: number = 13,
  nr: number = 5,
  numNotches: number = 3
): string {
  if (w <= 0 || h <= 0) return '';
  const actualCr = Math.min(cr, Math.floor(w / 4), Math.floor(h / 4));
  const availH = h - 2 * actualCr;
  if (availH <= 0) return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;

  const actualNr = Math.min(nr, Math.floor(availH / (numNotches * 3)));
  let d = `M ${actualCr} 0`;

  // Top edge
  d += ` L ${w - actualCr} 0`;

  // Top-right corner (inward concave notch)
  d += ` A ${actualCr} ${actualCr} 0 0 0 ${w} ${actualCr}`;

  // Right edge with notches (going down)
  const step = availH / (numNotches + 1);
  for (let i = 0; i < numNotches; i++) {
    const notchY = actualCr + (i + 1) * step;
    const y1 = notchY - actualNr;
    const y2 = notchY + actualNr;
    d += ` L ${w} ${y1}`;
    d += ` A ${actualNr} ${actualNr} 0 0 0 ${w} ${y2}`;
  }
  d += ` L ${w} ${h - actualCr}`;

  // Bottom-right corner (inward concave notch)
  d += ` A ${actualCr} ${actualCr} 0 0 0 ${w - actualCr} ${h}`;

  // Bottom edge
  d += ` L ${actualCr} ${h}`;

  // Bottom-left corner (inward concave notch)
  d += ` A ${actualCr} ${actualCr} 0 0 0 0 ${h - actualCr}`;

  // Left edge with notches (going up)
  for (let i = numNotches - 1; i >= 0; i--) {
    const notchY = actualCr + (i + 1) * step;
    const y1 = notchY + actualNr;
    const y2 = notchY - actualNr;
    d += ` L 0 ${y1}`;
    d += ` A ${actualNr} ${actualNr} 0 0 0 0 ${y2}`;
  }
  d += ` L 0 ${actualCr}`;

  // Top-left corner (inward concave notch)
  d += ` A ${actualCr} ${actualCr} 0 0 0 ${actualCr} 0`;
  d += ` Z`;

  return d;
}

export interface CinemaTicketFrameProps {
  children: React.ReactNode;
  accentColor?: string;
  isSelected?: boolean;
  alwaysGlow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  contentStyle?: React.CSSProperties;
  contentPadding?: string;
  cornerCutout?: number;
  notchRadius?: number;
  numNotches?: number;
  dashIndent?: number;
  showDashedLines?: boolean;
  customFill?: string;
  role?: string;
  tabIndex?: number;
}

export function CinemaTicketFrame({
  children,
  accentColor = '#38bdf8',
  isSelected = false,
  alwaysGlow = false,
  onClick,
  style,
  className,
  contentStyle,
  contentPadding,
  cornerCutout = 13,
  notchRadius = 5.5,
  numNotches = 3,
  dashIndent = 20,
  showDashedLines = true,
  customFill,
  role,
  tabIndex,
}: CinemaTicketFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
      }
    };
    updateSize();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setSize({ width: Math.round(width), height: Math.round(height) });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const [isLight, setIsLight] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('light'));

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => setIsLight(document.documentElement.classList.contains('light'));
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const pathD =
    size.width > 0 && size.height > 0
      ? generateTicketPath(size.width, size.height, cornerCutout, notchRadius, numNotches)
      : '';

  const isLit = isSelected || alwaysGlow;

  // Adaptive Styling: LITC Corporate Navy (#1E3A52) + Desert Amber Gold (#D97706) in Light Mode
  const strokeColor = isLight
    ? (isLit ? accentColor : isHovered ? accentColor : '#cbd5e1')
    : (isLit ? accentColor : isHovered ? `${accentColor}75` : `${accentColor}30`);

  const fillColor = customFill
    ? customFill
    : isLight
    ? (isLit ? '#f0f7ff' : isHovered ? '#f8fafc' : '#ffffff')
    : (isLit ? '#111c34' : isHovered ? '#10182c' : '#0c1324');

  const filterStyle = isLight
    ? (isLit
        ? `drop-shadow(0 0 6px ${accentColor}40) drop-shadow(0 4px 14px rgba(30, 58, 82, 0.12))`
        : isHovered
        ? `drop-shadow(0 0 6px ${accentColor}25) drop-shadow(0 4px 12px rgba(30, 58, 82, 0.08))`
        : 'drop-shadow(0 2px 8px rgba(30, 58, 82, 0.05))')
    : (isLit
        ? `drop-shadow(0 0 6px ${accentColor}90) drop-shadow(0 0 16px ${accentColor}35) drop-shadow(0 8px 24px rgba(0,0,0,0.6))`
        : isHovered
        ? `drop-shadow(0 0 8px ${accentColor}25) drop-shadow(0 6px 20px rgba(0, 0, 0, 0.5))`
        : 'drop-shadow(0 4px 16px rgba(0, 0, 0, 0.45))');

  const dashStroke = isLight
    ? (isLit ? '#d97706' : '#cbd5e1') // LITC brand amber-gold signature accent
    : (isLit ? `${accentColor}95` : `${accentColor}35`);

  const paddingVal = contentPadding || `12px ${showDashedLines ? dashIndent + 12 : 18}px`;

  return (
    <div
      ref={containerRef}
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered && onClick && !isSelected ? 'translateY(-2px)' : 'none',
        outline: 'none',
        ...style,
      }}
    >
      {/* Background SVG Canvas with Exact Ticket Contour & Vertical Dashed Lines */}
      {size.width > 0 && size.height > 0 && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: size.width,
            height: size.height,
            pointerEvents: 'none',
            zIndex: 1,
            filter: filterStyle,
            transition: 'filter 0.25s ease',
          }}
        >
          {/* Main Ticket Contour */}
          <path
            d={pathD}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={isLit ? 1.8 : 1.3}
            strokeLinejoin="round"
            style={{ transition: 'all 0.25s ease' }}
          />

          {/* Left Vertical Dashed Perforation Line */}
          {showDashedLines && (
            <line
              x1={dashIndent}
              y1={cornerCutout + 4}
              x2={dashIndent}
              y2={size.height - cornerCutout - 4}
              stroke={dashStroke}
              strokeDasharray="4 4"
              strokeWidth="1.2"
              style={{ transition: 'stroke 0.25s ease' }}
            />
          )}

          {/* Right Vertical Dashed Perforation Line */}
          {showDashedLines && (
            <line
              x1={size.width - dashIndent}
              y1={cornerCutout + 4}
              x2={size.width - dashIndent}
              y2={size.height - cornerCutout - 4}
              stroke={dashStroke}
              strokeDasharray="4 4"
              strokeWidth="1.2"
              style={{ transition: 'stroke 0.25s ease' }}
            />
          )}
        </svg>
      )}

      {/* Foreground Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          padding: paddingVal,
          width: '100%',
          boxSizing: 'border-box',
          ...contentStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TICKET CODE BADGE (شارة كود المعاملة بتصميم التذكرة المصغرة)
// ══════════════════════════════════════════════════════════════
export interface TicketCodeBadgeProps {
  code: string;
  color?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  compact?: boolean;
}

export function TicketCodeBadge({
  code,
  color = '#60a5fa',
  onClick,
  style,
  className,
  compact = false,
}: TicketCodeBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const w = compact ? 64 : 88;
  const h = compact ? 19 : 24;
  const cr = compact ? 2.5 : 3.5;
  const nr = compact ? 1.5 : 2;
  const dashIndent = compact ? 6 : 8;

  const d = `
    M ${cr} 0
    L ${w - cr} 0
    A ${cr} ${cr} 0 0 0 ${w} ${cr}
    L ${w} ${h / 2 - nr}
    A ${nr} ${nr} 0 0 0 ${w} ${h / 2 + nr}
    L ${w} ${h - cr}
    A ${cr} ${cr} 0 0 0 ${w - cr} ${h}
    L ${cr} ${h}
    A ${cr} ${cr} 0 0 0 0 ${h - cr}
    L 0 ${h / 2 + nr}
    A ${nr} ${nr} 0 0 0 0 ${h / 2 - nr}
    L 0 ${cr}
    A ${cr} ${cr} 0 0 0 ${cr} 0
    Z
  `;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${w}px`,
        height: `${h}px`,
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        filter: isHovered
          ? `drop-shadow(0 0 6px ${color}80)`
          : `drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4))`,
        transition: 'filter 0.2s ease, transform 0.2s ease',
        transform: isHovered ? 'scale(1.04)' : 'scale(1)',
        ...style,
      }}
    >
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <path
          d={d}
          fill={isHovered ? `${color}25` : `${color}14`}
          stroke={color}
          strokeWidth={isHovered ? 1.4 : 1.1}
          strokeOpacity={isHovered ? 0.95 : 0.65}
          style={{ transition: 'all 0.2s ease' }}
        />
        {/* Left vertical perforation */}
        <line
          x1={dashIndent}
          y1={cr + 1}
          x2={dashIndent}
          y2={h - cr - 1}
          stroke={color}
          strokeOpacity={isHovered ? 0.8 : 0.4}
          strokeDasharray="2 2"
          strokeWidth="0.9"
        />
        {/* Right vertical perforation */}
        <line
          x1={w - dashIndent}
          y1={cr + 1}
          x2={w - dashIndent}
          y2={h - cr - 1}
          stroke={color}
          strokeOpacity={isHovered ? 0.8 : 0.4}
          strokeDasharray="2 2"
          strokeWidth="0.9"
        />
      </svg>
      <span
        style={{
          position: 'relative',
          zIndex: 2,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontWeight: 700,
          fontSize: compact ? '9px' : '11px',
          color: isHovered ? '#ffffff' : color,
          letterSpacing: '0.02em',
          fontVariantNumeric: 'tabular-nums',
          transition: 'color 0.2s ease',
        }}
      >
        {code}
      </span>
    </div>
  );
}

