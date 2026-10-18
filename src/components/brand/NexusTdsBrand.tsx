import React from 'react';
import nexusIconTransparent from '../../functional_ui/assets/nexus_official_icon_transparent.png';
import nexusFullLogoTransparent from '../../functional_ui/assets/nexus_official_logo_transparent.png';

export interface NexusTdsBrandProps {
  variant?: 'horizontal' | 'stacked' | 'icon' | 'full';
  theme?: 'dark' | 'light' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * NexusTdsBrand — Official Brand Identity
 * Primary Colors:
 * - Brand Petrol Teal: #135d79
 * - Brand Tangerine Orange: #f36c21
 * - Subtitle: TICKETING DYNAMIC SYSTEM
 */
export const NexusTdsBrand: React.FC<NexusTdsBrandProps> = ({
  variant = 'horizontal',
  theme = 'auto',
  size = 'md',
  showSubtitle = true,
  className = '',
  style = {}
}) => {
  const isDarkAuto =
    theme === 'dark' ||
    (theme === 'auto' &&
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'));

  // Scale map
  const scaleMap = {
    xs: { iconH: 20, fontTitle: 14, fontSub: 7.5, gap: 8 },
    sm: { iconH: 26, fontTitle: 16.5, fontSub: 8.5, gap: 10 },
    md: { iconH: 34, fontTitle: 20, fontSub: 9.5, gap: 12 },
    lg: { iconH: 46, fontTitle: 26, fontSub: 11, gap: 14 },
    xl: { iconH: 64, fontTitle: 34, fontSub: 13, gap: 16 },
  };

  const currentScale = scaleMap[size] || scaleMap.md;

  // Icon Only Variant
  if (variant === 'icon') {
    return (
      <div
        className={`nexus-tds-brand-icon ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: `${currentScale.iconH}px`,
          ...style
        }}
      >
        <img
          src={nexusIconTransparent}
          alt="NEXUS TDS"
          style={{
            height: '100%',
            width: 'auto',
            objectFit: 'contain',
            filter: isDarkAuto ? 'drop-shadow(0 2px 8px rgba(243, 108, 33, 0.35))' : 'drop-shadow(0 1px 4px rgba(19, 93, 121, 0.2))'
          }}
        />
      </div>
    );
  }

  // Stacked / Centered Variant (Ideal for Login Page & Hero Modals)
  if (variant === 'stacked') {
    return (
      <div
        className={`nexus-tds-brand-stacked ${className}`}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          direction: 'ltr',
          textAlign: 'center',
          userSelect: 'none',
          ...style
        }}
      >
        {/* Center Icon */}
        <div style={{ marginBottom: `${currentScale.gap}px` }}>
          <img
            src={nexusIconTransparent}
            alt="NEXUS TDS Icon"
            style={{
              height: `${currentScale.iconH * 1.3}px`,
              width: 'auto',
              objectFit: 'contain',
              filter: isDarkAuto
                ? 'drop-shadow(0 4px 16px rgba(243, 108, 33, 0.35)) drop-shadow(0 0 20px rgba(19, 93, 121, 0.4))'
                : 'drop-shadow(0 3px 10px rgba(19, 93, 121, 0.18))'
            }}
          />
        </div>

        {/* Title: NEXUS TDS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: '6px',
            lineHeight: 1
          }}
        >
          <span
            style={{
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              fontSize: `${currentScale.fontTitle * 1.15}px`,
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: isDarkAuto ? '#38bdf8' : '#135d79',
              transition: 'color 0.2s ease'
            }}
          >
            NEXUS
          </span>
          <span
            style={{
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              fontSize: `${currentScale.fontTitle * 1.15}px`,
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: '#f36c21',
              transition: 'color 0.2s ease'
            }}
          >
            TDS
          </span>
        </div>

        {/* Subtitle: TICKETING DYNAMIC SYSTEM */}
        {showSubtitle && (
          <div
            style={{
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              fontSize: `${currentScale.fontSub}px`,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: isDarkAuto ? '#94a3b8' : '#135d79',
              marginTop: '5px',
              opacity: 0.9
            }}
          >
            TICKETING DYNAMIC SYSTEM
          </div>
        )}
      </div>
    );
  }

  // Horizontal Variant (Default — Ideal for Navigation Bar & Headers)
  return (
    <div
      className={`nexus-tds-brand-horizontal ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        direction: 'ltr',
        gap: `${currentScale.gap}px`,
        userSelect: 'none',
        ...style
      }}
    >
      {/* Icon */}
      <img
        src={nexusIconTransparent}
        alt="NEXUS TDS"
        style={{
          height: `${currentScale.iconH}px`,
          width: 'auto',
          objectFit: 'contain',
          filter: isDarkAuto
            ? 'drop-shadow(0 2px 6px rgba(243, 108, 33, 0.3))'
            : 'drop-shadow(0 1px 3px rgba(19, 93, 121, 0.18))'
        }}
      />

      {/* Typography */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
          <span
            style={{
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              fontSize: `${currentScale.fontTitle}px`,
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: isDarkAuto ? '#38bdf8' : '#135d79'
            }}
          >
            NEXUS
          </span>
          <span
            style={{
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              fontSize: `${currentScale.fontTitle}px`,
              fontWeight: 900,
              letterSpacing: '0.04em',
              color: '#f36c21'
            }}
          >
            TDS
          </span>
        </div>

        {showSubtitle && (
          <span
            style={{
              fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
              fontSize: `${currentScale.fontSub}px`,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: isDarkAuto ? '#94a3b8' : '#135d79',
              marginTop: '2px',
              opacity: 0.85
            }}
          >
            TICKETING DYNAMIC SYSTEM
          </span>
        )}
      </div>
    </div>
  );
};
export default NexusTdsBrand;
