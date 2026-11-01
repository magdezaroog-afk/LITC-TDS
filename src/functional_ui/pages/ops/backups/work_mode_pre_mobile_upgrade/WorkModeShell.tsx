import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../engine/auth/AuthContext';
import { useThemeEngine } from '../../../engine/ui-loader/ThemeProvider';
import { useMobileViewport } from '../../../mobile/hooks/useMobileViewport';
import { OperationalQueueView } from './OperationalQueueView';
import { 
  Layers, 
  ExternalLink, 
  RefreshCw, 
  Server, 
  Sparkles, 
  Home, 
  Sliders, 
  Laptop, 
  Plus, 
  Settings, 
  Activity, 
  X, 
  Trash2,
  Inbox,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  ArrowLeft,
  ChevronUp,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SatelliteSystem {
  id: string;
  name: string;
  category: string;
  targetUrl: string;
  clientAdaptedUrl?: string;
  isActive: boolean;
  hasAccess: boolean;
  isOnline: boolean;
  latencyMs?: number;
  description: string;
}

export const WorkModeShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobileViewport(768);
  const { mode } = useThemeEngine();
  const isDark = mode === 'dark';

  // Active App ID: 'OPERATIONS' (حوض الطلبات والعمليات) or a Satellite System ID (e.g., 'asset_inventory')
  const [activeAppId, setActiveAppId] = useState<string>('OPERATIONS');
  
  // Ops Horizontal Momentum Scroll Ref
  const opsTabsScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll active tab into view in momentum strip
  useEffect(() => {
    if (opsTabsScrollRef.current) {
      const activeEl = opsTabsScrollRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeAppId]);
  
  // Ops Queue Sub-Tab Synchronization ('POOL' | 'FLOW_SETTINGS' | 'ANALYTICS' | 'COMPARISON')
  const [opsActiveTab, setOpsActiveTab] = useState<'POOL' | 'FLOW_SETTINGS' | 'ANALYTICS' | 'COMPARISON'>('POOL');
  const [liveStats, setLiveStats] = useState<{ openCount: number; poolCount: number }>({ openCount: 0, poolCount: 0 });

  // Satellite Registry State
  const [satellites, setSatellites] = useState<SatelliteSystem[]>([]);
  const [isLoadingSatellites, setIsLoadingSatellites] = useState<boolean>(true);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);


  // ── Sync with Operational Queue Events ──
  useEffect(() => {
    const handleTabChanged = (e: any) => {
      if (e.detail?.tab) setOpsActiveTab(e.detail.tab);
    };
    const handleStatsChanged = (e: any) => {
      if (e.detail) {
        setLiveStats({
          openCount: e.detail.openCount || 0,
          poolCount: e.detail.poolCount || 0
        });
      }
    };

    window.addEventListener('nexus_ops_tab_changed', handleTabChanged);
    window.addEventListener('nexus_ops_stats_changed', handleStatsChanged);

    return () => {
      window.removeEventListener('nexus_ops_tab_changed', handleTabChanged);
      window.removeEventListener('nexus_ops_stats_changed', handleStatsChanged);
    };
  }, []);

  /**
   * دالة اشتقاق الرابط الفعلي لمنظومة جرد الأصول والمنظومات المساندة
   * تضمن فتح المنظومة عبر البوابة العكسية الموحدة (Single-Origin Reverse Proxy Gateway)
   */
  const resolveSatelliteUrl = (rawTargetUrl: string, clientAdaptedUrl?: string, satelliteId?: string): string => {
    if (satelliteId === 'asset_inventory' || rawTargetUrl.includes('localhost:3000') || rawTargetUrl.includes(':3000')) {
      return `/satellites/proxy/asset_inventory/`;
    }

    if (clientAdaptedUrl && !clientAdaptedUrl.includes('localhost') && !clientAdaptedUrl.includes('127.0.0.1')) {
      return clientAdaptedUrl;
    }

    const currentHostname = window.location.hostname;
    if (currentHostname !== 'localhost' && currentHostname !== '127.0.0.1') {
      try {
        const parsed = new URL(rawTargetUrl);
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          parsed.hostname = currentHostname;
          return parsed.toString();
        }
      } catch {
        return rawTargetUrl.replace('localhost', currentHostname).replace('127.0.0.1', currentHostname);
      }
    }

    return rawTargetUrl;
  };

  /**
   * جلب إعدادات المنظومات المساندة وحالتها الحية من البوابة المركزية
   */
  const fetchSatellites = async () => {
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch('/api/v1/satellites/config', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.satellites)) {
          setSatellites(data.satellites);
        }
      } else {
        setupFallbackSatellites();
      }
    } catch (err) {
      console.warn('[WorkModeShell] Failed to fetch satellites, using resilient defaults:', err);
      setupFallbackSatellites();
    } finally {
      setIsLoadingSatellites(false);
    }
  };

  const setupFallbackSatellites = () => {
    const defaultHost = window.location.hostname;
    const resolvedInventoryUrl = defaultHost !== 'localhost' && defaultHost !== '127.0.0.1'
      ? `http://${defaultHost}:3000`
      : 'http://localhost:3000';

    setSatellites([
      {
        id: 'asset_inventory',
        name: 'منظومة جرد الأصول والأنظمة التقنية',
        category: 'IT_OPERATIONS',
        targetUrl: 'http://localhost:3000',
        clientAdaptedUrl: resolvedInventoryUrl,
        isActive: true,
        hasAccess: true,
        isOnline: true,
        latencyMs: 14,
        description: 'إدارة وتتبع الأجهزة والمعدات التقنية والأصول التشغيلية لشركة LITC (743+ جهاز مسجل).'
      }
    ]);
  };

  useEffect(() => {
    fetchSatellites();
    const interval = setInterval(fetchSatellites, 25000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshIframe = () => {
    setIsIframeLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleSwitchTab = (tab: 'POOL' | 'FLOW_SETTINGS' | 'ANALYTICS') => {
    setOpsActiveTab(tab);
    window.dispatchEvent(new CustomEvent('nexus_ops_switch_tab', { detail: { tab } }));
  };

  // Find currently active satellite
  const activeSatellite = satellites.find(s => s.id === activeAppId);
  const activeComputedUrl = activeSatellite 
    ? resolveSatelliteUrl(activeSatellite.targetUrl, activeSatellite.clientAdaptedUrl, activeSatellite.id) 
    : '';


  return (
    <div 
      className="nexus-workmode-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'calc(100vh - 54px)' : 'calc(100vh - 68px)',
        width: '100%',
        maxWidth: '100%',
        background: isDark
          ? 'radial-gradient(circle at 50% 0%, #161920 0%, #0c0e12 60%, #07080a 100%)'
          : 'radial-gradient(ellipse at 50% -10%, #ffffff 0%, #f5f7fa 50%, #eaedf3 100%)',
        color: isDark ? '#f8fafc' : '#0f172a',
        direction: 'rtl',
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* =========================================================================
          1. MAIN APPLICATION CANVAS (Full-Bleed 100% Screen Freedom)
          ========================================================================= */}
      <main style={{ flex: 1, minWidth: 0, position: 'relative', overflowY: 'auto', height: '100%', paddingBottom: isMobile ? '68px' : '84px' }}>
        
        {/* VIEW 1: حوض الطلبات والعمليات المؤسسية */}
        {activeAppId === 'OPERATIONS' && (
          <div className="operational-shell" style={{ height: '100%', overflowY: 'auto' }}>
            <OperationalQueueView hideInternalDock={true} />
          </div>
        )}

        {/* VIEW 2: المنظومة المصاحبة (Satellite Embedded Microservice) */}
        {activeAppId !== 'OPERATIONS' && activeSatellite && (
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%', 
              background: isDark ? '#0c0e13' : '#f8fafc',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Top Sleek Command Strip for Satellite */}
            <div 
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                background: isDark
                  ? 'linear-gradient(135deg, rgba(18, 22, 29, 0.98), rgba(24, 28, 38, 0.95))'
                  : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(245, 247, 250, 0.95))',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                backdropFilter: 'blur(20px)',
                zIndex: 10
              }}
            >
              {/* Title & Live Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: activeSatellite.id === 'asset_inventory' 
                      ? 'linear-gradient(135deg, #f97316, #ea580c)'
                      : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {activeSatellite.id === 'asset_inventory' ? <Laptop size={17} /> : <Server size={17} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                      {activeSatellite.name}
                    </h2>
                    
                    <span 
                      style={{
                        background: activeSatellite.isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: activeSatellite.isOnline ? '#34d399' : '#fbbf24',
                        border: `1px solid ${activeSatellite.isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        padding: '1px 7px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: activeSatellite.isOnline ? '#10b981' : '#f59e0b' }} />
                      {activeSatellite.isOnline ? 'خادم نشط' : 'بانتظار الاستجابة'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveAppId('OPERATIONS')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'rgba(2, 132, 199, 0.18)',
                    border: '1px solid rgba(2, 132, 199, 0.35)',
                    color: '#38bdf8',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <ArrowRight size={13} />
                  <span>العودة لحوض الطلبات</span>
                </button>

                <button
                  onClick={handleRefreshIframe}
                  title="إعادة تحميل المنظومة"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} className={isIframeLoading ? 'animate-spin' : ''} />
                  <span>تحديث</span>
                </button>

                <a
                  href={activeComputedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={12} />
                  <span>نافذة مستقلة</span>
                </a>
              </div>
            </div>

            {/* Micro-Frontend Iframe */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100% - 50px)', overflow: 'hidden' }}>
              {isIframeLoading && (
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isDark ? '#0c0e13' : '#ffffff',
                    zIndex: 5,
                    gap: '12px',
                    color: isDark ? '#94a3b8' : '#64748b'
                  }}
                >
                  <RefreshCw size={30} color="#f97316" className="animate-spin" />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>
                    جاري تحميل {activeSatellite.name}...
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', direction: 'ltr' }}>
                    {activeComputedUrl}
                  </div>
                </div>
              )}

              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={activeComputedUrl}
                title={activeSatellite.name}
                onLoad={() => setIsIframeLoading(false)}
                onError={() => setIsIframeLoading(false)}
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#ffffff',
                  opacity: isIframeLoading ? 0 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              />
            </div>
          </div>
        )}

      </main>

      {/* =========================================================================
          2. THE CONTEXTUAL SMART TASKBAR (الشريط السفلي التفاعلي الموحد)
          ========================================================================= */}
      <nav
        style={{
          position: 'fixed',
          bottom: isMobile ? 0 : '18px',
          left: isMobile ? 0 : '50%',
          right: isMobile ? 0 : 'auto',
          transform: isMobile ? 'none' : 'translateX(-50%)',
          height: isMobile ? '58px' : 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '6px' : '10px',
          padding: isMobile ? '0 8px calc(env(safe-area-inset-bottom, 0px) + 2px)' : '8px 18px',
          background: isDark ? 'rgba(12, 16, 23, 0.95)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          borderRadius: isMobile ? '0' : '26px',
          borderTop: isMobile ? (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.08)') : 'none',
          border: isMobile ? 'none' : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.08)'),
          boxShadow: isDark 
            ? '0 16px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
            : '0 16px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
          zIndex: 9000,
          direction: 'rtl',
          width: isMobile ? '100%' : 'auto',
          maxWidth: isMobile ? '100%' : 'fit-content',
          boxSizing: 'border-box'
        }}
      >
        {/* Horizontal Momentum Scrollable Tabs Strip with edge fading */}
        <div
          ref={opsTabsScrollRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '6px' : '8px',
            overflowX: 'auto',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
            width: '100%',
            padding: '2px 4px',
            maskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)'
          }}
        >
          {/* ── 📥 تبويب 1: حوض التذاكر والعمليات المؤسسية ── */}
          <button
            type="button"
            data-active={activeAppId === 'OPERATIONS' ? 'true' : 'false'}
            onClick={() => setActiveAppId('OPERATIONS')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '6px 14px' : '8px 18px',
              borderRadius: '14px',
              border: activeAppId === 'OPERATIONS'
                ? '1.5px solid #0284c7'
                : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)'),
              background: activeAppId === 'OPERATIONS'
                ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)'),
              color: activeAppId === 'OPERATIONS' ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
              cursor: 'pointer',
              fontWeight: activeAppId === 'OPERATIONS' ? 800 : 600,
              fontSize: isMobile ? '11.5px' : '12.5px',
              boxShadow: activeAppId === 'OPERATIONS' ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              height: isMobile ? '38px' : '40px'
            }}
          >
            <Inbox size={15} strokeWidth={2.4} />
            <span>حوض التذاكر</span>
            {liveStats.openCount > 0 && (
              <span
                style={{
                  background: activeAppId === 'OPERATIONS' ? 'rgba(255, 255, 255, 0.25)' : '#0284c7',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: '999px'
                }}
              >
                {liveStats.openCount}
              </span>
            )}
          </button>

          {/* ── 💻 تبويبات 2..N: منظومة جرد الأصول وكافة الأنظمة المصاحبة المضافة ── */}
          {satellites.map((sys) => {
            const isCurrent = activeAppId === sys.id;
            const isInventory = sys.id === 'asset_inventory';
            const label = isInventory ? 'جرد الأصول' : sys.name;
            const themeColor = isInventory ? '#f36c21' : '#10b981';

            return (
              <button
                key={sys.id}
                type="button"
                data-active={isCurrent ? 'true' : 'false'}
                onClick={() => setActiveAppId(sys.id)}
                title={sys.description || sys.name}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '6px 14px' : '8px 18px',
                  borderRadius: '14px',
                  border: isCurrent
                    ? `1.5px solid ${themeColor}`
                    : (isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(15, 23, 42, 0.08)'),
                  background: isCurrent
                    ? `linear-gradient(135deg, ${themeColor} 0%, ${isInventory ? '#ea580c' : '#059669'} 100%)`
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)'),
                  color: isCurrent ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                  cursor: 'pointer',
                  fontWeight: isCurrent ? 800 : 600,
                  fontSize: isMobile ? '11.5px' : '12.5px',
                  boxShadow: isCurrent ? `0 4px 14px ${themeColor}40` : 'none',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  height: isMobile ? '38px' : '40px'
                }}
              >
                {isInventory ? <Laptop size={15} strokeWidth={2.4} /> : <Server size={15} strokeWidth={2.4} />}
                <span>{label}</span>
                {/* Status Indicator Dot */}
                <span
                  title={sys.isOnline ? 'المنظومة متصلة ونشطة' : 'في انتظار الاتصال'}
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: sys.isOnline ? '#10b981' : '#f59e0b',
                    boxShadow: sys.isOnline ? '0 0 6px #10b981' : 'none',
                    flexShrink: 0
                  }}
                />
              </button>
            );
          })}


        </div>
      </nav>


    </div>
  );
};
export default WorkModeShell;
