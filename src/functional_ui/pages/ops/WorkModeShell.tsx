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
  Cpu,
  LayoutGrid,
  Pin,
  PinOff,
  Database,
  Globe,
  Shield,
  Smartphone
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
  iconType?: string;
  iconUrl?: string;
}

export const WorkModeShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobileViewport(768);

  // ── Adaptive Dark/Light Mode Theme Listener (Reactive sync with documentElement & localStorage) ──
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return (
        document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') && localStorage.getItem('litc_theme') !== 'light')
      );
    }
    return false;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const checkTheme = () => {
      const dark =
        document.documentElement.classList.contains('dark') ||
        (!document.documentElement.classList.contains('light') && localStorage.getItem('litc_theme') !== 'light');
      setIsDark(dark);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, []);

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

  // ── Pinned Systems State (Persisted in LocalStorage) ──
  const [pinnedSystemIds, setPinnedSystemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pinned_systems');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse pinned systems:', e);
    }
    return ['asset_inventory']; // Default pinned system
  });

  // ── Popover State & Outside Click Detection ──
  const [isSystemsPopoverOpen, setIsSystemsPopoverOpen] = useState<boolean>(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        isSystemsPopoverOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        popoverBtnRef.current &&
        !popoverBtnRef.current.contains(e.target as Node)
      ) {
        setIsSystemsPopoverOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isSystemsPopoverOpen]);

  // ── Dock Magnification Physics (macOS Zero-Jump Proximity) ──
  const dockTrackRef = useRef<HTMLDivElement>(null);
  const [hoveredSysId, setHoveredSysId] = useState<string | null>(null);

  const applyMagnification = (clientX: number) => {
    const track = dockTrackRef.current;
    if (!track) return;
    const buttons = track.querySelectorAll<HTMLButtonElement>('.sys-dock-circle-btn');
    const maxDist = 75;

    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - centerX);

      if (dist < maxDist) {
        const factor = Math.cos((dist / maxDist) * (Math.PI / 2));
        const scale = 1.0 + factor * 0.18; // 1.18x proximity breathing
        btn.style.transform = `scale(${scale.toFixed(3)}) translateY(0)`;
        btn.style.zIndex = '50';
      } else {
        btn.style.transform = 'scale(1) translateY(0)';
        btn.style.zIndex = '1';
      }
    });
  };

  const resetMagnification = () => {
    const track = dockTrackRef.current;
    if (!track) return;
    const buttons = track.querySelectorAll<HTMLButtonElement>('.sys-dock-circle-btn');
    buttons.forEach(btn => {
      btn.style.transform = 'scale(1) translateY(0)';
      btn.style.zIndex = '1';
    });
    setHoveredSysId(null);
  };

  // ── Toast Notification for Pin/Unpin Feedback ──
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2600);
  };

  const togglePinSystem = (sysId: string) => {
    setPinnedSystemIds(prev => {
      const exists = prev.includes(sysId);
      const updated = exists ? prev.filter(id => id !== sysId) : [...prev, sysId];
      try {
        localStorage.setItem('nexus_pinned_systems', JSON.stringify(updated));
      } catch (e) {}
      const sys = satellites.find(s => s.id === sysId);
      const name = sys ? sys.name : sysId;
      showToast(!exists ? `📌 تم تثبيت "${name}" في شريط المهام` : `✕ تم إخفاء "${name}" من شريط المهام`);
      return updated;
    });
  };

  // ── Admin Provisioning State ──
  const [isAdminAddOpen, setIsAdminAddOpen] = useState<boolean>(false);
  const [newSysName, setNewSysName] = useState<string>('');
  const [newSysUrl, setNewSysUrl] = useState<string>('');
  const [newSysCategory, setNewSysCategory] = useState<string>('INFRASTRUCTURE');
  const [newSysIcon, setNewSysIcon] = useState<string>('Server');

  const handleAdminAddSystem = () => {
    if (!newSysName.trim() || !newSysUrl.trim()) {
      showToast('⚠️ يرجى إدخال اسم المنظومة ورابطها');
      return;
    }
    const newId = `custom_sys_${Date.now()}`;
    const newSys: SatelliteSystem = {
      id: newId,
      name: newSysName.trim(),
      category: newSysCategory,
      targetUrl: newSysUrl.trim(),
      isActive: true,
      hasAccess: true,
      isOnline: true,
      description: 'منظومة مرتبطة مضافة من قِبل إدارة النظام.',
      iconType: newSysIcon
    };
    setSatellites(prev => [...prev, newSys]);
    setPinnedSystemIds(prev => {
      const updated = [...prev, newId];
      try {
        localStorage.setItem('nexus_pinned_systems', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setNewSysName('');
    setNewSysUrl('');
    setIsAdminAddOpen(false);
    showToast(`🎉 تم ربط وتثبيت "${newSys.name}" بنجاح!`);
  };

  // ── Helper to Render System Icon ──
  const renderSystemIcon = (sys: SatelliteSystem, size = 18) => {
    if (sys.iconUrl) {
      return (
        <img 
          src={sys.iconUrl} 
          alt={sys.name} 
          style={{ width: `${size}px`, height: `${size}px`, objectFit: 'contain', borderRadius: '4px' }} 
        />
      );
    }
    if (sys.id === 'asset_inventory' || sys.iconType === 'Laptop') return <Laptop size={size} strokeWidth={2.2} />;
    if (sys.iconType === 'Activity') return <Activity size={size} strokeWidth={2.2} />;
    if (sys.iconType === 'Cpu') return <Cpu size={size} strokeWidth={2.2} />;
    if (sys.iconType === 'Database') return <Database size={size} strokeWidth={2.2} />;
    if (sys.iconType === 'Globe') return <Globe size={size} strokeWidth={2.2} />;
    if (sys.iconType === 'Shield') return <Shield size={size} strokeWidth={2.2} />;
    if (sys.iconType === 'Smartphone') return <Smartphone size={size} strokeWidth={2.2} />;
    return <Server size={size} strokeWidth={2.2} />;
  };

  // Pinned Satellites in the Dock
  const pinnedSatellites = satellites.filter(s => pinnedSystemIds.includes(s.id));

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
        height: isMobile ? 'calc(100vh - 54px)' : 'calc(100vh - 74px)',
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
          المحتوى يتدفق بحرية كاملة لكامل قاع الشاشة بدون أي شريط خلفي أو فراغ مقطوع
          ========================================================================= */}
      <main style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
        
        {/* VIEW 1: حوض الطلبات والعمليات المؤسسية */}
        {activeAppId === 'OPERATIONS' && (
          <div className="operational-shell" style={{ height: '100%', width: '100%', overflowY: 'auto', position: 'relative' }}>
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
          الترتيب المؤسسي: زر الأنظمة على اليمين وشريط الأيقونات على اليسار
          كبسولة زجاجية فاخرة شبه شفافة ثابتة على الكمبيوتر والهاتف (Fixed Luxury Dock Capsule)
          ========================================================================= */}
      <nav
        style={{
          position: 'fixed',
          bottom: isMobile ? '10px' : '18px',
          left: isMobile ? '10px' : '50%',
          right: isMobile ? '10px' : 'auto',
          transform: isMobile ? 'none' : 'translateX(-50%)',
          height: isMobile ? '58px' : '62px',
          width: isMobile ? 'calc(100% - 20px)' : 'auto',
          minWidth: isMobile ? 'auto' : '480px',
          maxWidth: isMobile ? 'calc(100% - 20px)' : '780px',
          display: 'flex',
          alignItems: 'center',
          gap: isMobile ? '8px' : '12px',
          padding: isMobile ? '0 10px' : '0 16px',
          background: isDark ? 'rgba(14, 18, 25, 0.82)' : 'rgba(255, 255, 255, 0.72)',
          backdropFilter: 'blur(36px) saturate(200%)',
          WebkitBackdropFilter: 'blur(36px) saturate(200%)',
          borderRadius: isMobile ? '22px' : '28px',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(255, 255, 255, 0.85)',
          boxShadow: isDark 
            ? '0 16px 45px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)' 
            : '0 16px 40px rgba(15, 23, 42, 0.08), inset 0 1px 2px rgba(255, 255, 255, 0.95)',
          zIndex: 9000,
          direction: 'rtl',
          boxSizing: 'border-box'
        }}
      >
        {/* =========================================================================
            SEGMENT 1 (RIGHT SIDE): زر الأنظمة المرتبطة والقائمة المدمجة
            ========================================================================= */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            ref={popoverBtnRef}
            type="button"
            onClick={() => setIsSystemsPopoverOpen(prev => !prev)}
            title="إدارة وعرض الأنظمة المرتبطة"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: isMobile ? '7px 11px' : '8px 14px',
              borderRadius: '16px',
              border: isSystemsPopoverOpen
                ? '1.5px solid #0284c7'
                : (isDark ? '1px solid rgba(255, 255, 255, 0.14)' : '1px solid rgba(15, 23, 42, 0.12)'),
              background: isSystemsPopoverOpen
                ? (isDark ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.28), rgba(3, 105, 161, 0.2))' : 'rgba(2, 132, 199, 0.15)')
                : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)'),
              color: isSystemsPopoverOpen 
                ? (isDark ? '#38bdf8' : '#0284c7') 
                : (isDark ? '#e2e8f0' : '#0f172a'),
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: isMobile ? '12px' : '13px',
              boxShadow: isSystemsPopoverOpen 
                ? '0 0 16px rgba(2, 132, 199, 0.35)' 
                : (isDark ? 'none' : '0 2px 6px rgba(15, 23, 42, 0.04)'),
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              whiteSpace: 'nowrap'
            }}
          >
            <LayoutGrid size={isMobile ? 15 : 16} strokeWidth={2.4} />
            <span>الأنظمة</span>
            <span
              style={{
                background: isSystemsPopoverOpen 
                  ? '#0284c7' 
                  : (isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 132, 199, 0.14)'),
                color: isSystemsPopoverOpen 
                  ? '#ffffff' 
                  : (isDark ? '#38bdf8' : '#0284c7'),
                fontSize: '10px',
                fontWeight: 900,
                padding: '1px 6px',
                borderRadius: '999px',
                fontFamily: 'monospace'
              }}
            >
              {satellites.length}
            </span>
          </button>

          {/* ── القائمة الجانبية المدمجة (Anchored Systems Popover Menu) ── */}
          <AnimatePresence>
            {isSystemsPopoverOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 12px)',
                  right: 0,
                  width: isMobile ? 'calc(100vw - 32px)' : '350px',
                  maxWidth: '360px',
                  maxHeight: '48vh',
                  display: 'flex',
                  flexDirection: 'column',
                  background: isDark ? 'rgba(10, 16, 28, 0.95)' : 'rgba(255, 255, 255, 0.92)',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid rgba(255, 255, 255, 0.85)',
                  borderRadius: '20px',
                  padding: '14px',
                  boxShadow: isDark 
                    ? '0 24px 50px rgba(0, 0, 0, 0.65), 0 0 20px rgba(56, 189, 248, 0.12)' 
                    : '0 20px 45px rgba(15, 23, 42, 0.12), inset 0 1px 2px rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(30px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                  zIndex: 9999,
                  direction: 'rtl'
                }}
              >
                {/* Popover Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '10px',
                    borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.08)',
                    marginBottom: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <LayoutGrid size={16} color={isDark ? '#38bdf8' : '#0284c7'} strokeWidth={2.4} />
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                      الأنظمة المرتبطة بالحساب
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        background: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        fontWeight: 700
                      }}
                    >
                      {pinnedSatellites.length} مثبتة بالشريط
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSystemsPopoverOpen(false)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: isDark ? '#94a3b8' : '#64748b',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Popover Systems List (Scrollable - max-height stops mid-screen) */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingRight: '2px',
                    maxHeight: 'calc(48vh - 120px)'
                  }}
                >
                  {satellites.length === 0 ? (
                    <div style={{ padding: '20px 10px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                      لا توجد أنظمة مرتبطة حالياً
                    </div>
                  ) : (
                    satellites.map(sys => {
                      const isPinned = pinnedSystemIds.includes(sys.id);
                      const isCurrent = activeAppId === sys.id;

                      return (
                        <div
                          key={sys.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: '12px',
                            background: isCurrent
                              ? (isDark ? 'rgba(243, 108, 33, 0.12)' : 'rgba(243, 108, 33, 0.1)')
                              : isPinned
                                ? (isDark ? 'rgba(56, 189, 248, 0.07)' : 'rgba(2, 132, 199, 0.07)')
                                : (isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(15, 23, 42, 0.03)'),
                            border: isCurrent
                              ? '1px solid rgba(243, 108, 33, 0.45)'
                              : isPinned
                                ? (isDark ? '1px solid rgba(56, 189, 248, 0.28)' : '1px solid rgba(2, 132, 199, 0.25)')
                                : (isDark ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(15, 23, 42, 0.06)'),
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* System Identity & Open Click */}
                          <div
                            onClick={() => {
                              setActiveAppId(sys.id);
                              setIsSystemsPopoverOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              minWidth: 0,
                              flex: 1,
                              cursor: 'pointer'
                            }}
                            title="انقر لفتح واستعراض هذه المنظومة"
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isCurrent
                                  ? 'linear-gradient(135deg, #f97316, #ea580c)'
                                  : isPinned
                                    ? (isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)')
                                    : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.06)'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isCurrent 
                                  ? '#ffffff' 
                                  : (isPinned ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b')),
                                flexShrink: 0
                              }}
                            >
                              {renderSystemIcon(sys, 15)}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  color: isDark ? '#f1f5f9' : '#0f172a',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {sys.name}
                              </div>
                              <div
                                style={{
                                  fontSize: '10px',
                                  color: isPinned ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#64748b' : '#94a3b8'),
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <span
                                  style={{
                                    width: '5px',
                                    height: '5px',
                                    borderRadius: '50%',
                                    background: sys.isOnline ? '#10b981' : '#f59e0b'
                                  }}
                                />
                                {isPinned ? 'معروضة بالشريط' : 'مخفية من الشريط'}
                              </div>
                            </div>
                          </div>

                          {/* Direct Pin / Unpin Action Pill */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinSystem(sys.id);
                            }}
                            title={isPinned ? 'إخفاء المنظومة من شريط المهام' : 'تثبيت المنظومة في شريط المهام'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 9px',
                              borderRadius: '999px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              background: isPinned
                                ? (isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(2, 132, 199, 0.12)')
                                : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.04)'),
                              border: isPinned
                                ? (isDark ? '1px solid rgba(56, 189, 248, 0.45)' : '1px solid rgba(2, 132, 199, 0.35)')
                                : (isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(15, 23, 42, 0.12)'),
                              color: isPinned ? (isDark ? '#38bdf8' : '#0284c7') : (isDark ? '#94a3b8' : '#64748b'),
                              flexShrink: 0
                            }}
                          >
                            {isPinned ? (
                              <>
                                <Pin size={11} strokeWidth={2.4} />
                                <span>مثبت بالشريط</span>
                              </>
                            ) : (
                              <>
                                <PinOff size={11} strokeWidth={2} />
                                <span>مخفي</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Popover Footer: Admin Provisioning Accordion */}
                <div
                  style={{
                    paddingTop: '8px',
                    marginTop: '8px',
                    borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(15, 23, 42, 0.08)'
                  }}
                >
                  {!isAdminAddOpen ? (
                    <button
                      type="button"
                      onClick={() => setIsAdminAddOpen(true)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: '10px',
                        background: 'transparent',
                        border: isDark ? '1px dashed rgba(56, 189, 248, 0.35)' : '1px dashed rgba(2, 132, 199, 0.4)',
                        color: isDark ? '#38bdf8' : '#0284c7',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={13} />
                      <span>إضافة / ربط منظومة جديدة (المشرف)</span>
                    </button>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        padding: '8px',
                        background: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(241, 245, 249, 0.7)',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a' }}>
                          ربط منظومة تقنية جديدة
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAdminAddOpen(false)}
                          style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer' }}
                        >
                          <X size={12} />
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder="اسم المنظومة (مثلاً: منظومة الفواتير)"
                        value={newSysName}
                        onChange={(e) => setNewSysName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          color: isDark ? '#ffffff' : '#0f172a',
                          fontSize: '11px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />

                      <input
                        type="url"
                        placeholder="رابط المنظومة (http://...)"
                        value={newSysUrl}
                        onChange={(e) => setNewSysUrl(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 8px',
                          borderRadius: '8px',
                          background: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff',
                          border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid #cbd5e1',
                          color: isDark ? '#ffffff' : '#0f172a',
                          fontSize: '11px',
                          outline: 'none',
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Icon Choices */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', color: isDark ? '#94a3b8' : '#64748b' }}>الأيقونة:</span>
                        {(['Server', 'Laptop', 'Activity', 'Cpu', 'Database', 'Globe'] as const).map(iconName => (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setNewSysIcon(iconName)}
                            style={{
                              padding: '4px',
                              borderRadius: '6px',
                              background: newSysIcon === iconName ? '#0284c7' : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)'),
                              border: 'none',
                              color: newSysIcon === iconName ? '#ffffff' : (isDark ? '#cbd5e1' : '#475569'),
                              cursor: 'pointer'
                            }}
                          >
                            {iconName === 'Server' && <Server size={12} />}
                            {iconName === 'Laptop' && <Laptop size={12} />}
                            {iconName === 'Activity' && <Activity size={12} />}
                            {iconName === 'Cpu' && <Cpu size={12} />}
                            {iconName === 'Database' && <Database size={12} />}
                            {iconName === 'Globe' && <Globe size={12} />}
                          </button>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={handleAdminAddSystem}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                            border: 'none',
                            color: '#ffffff',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          تأكيد الربط والتثبيت
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAdminAddOpen(false)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            background: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.08)',
                            border: 'none',
                            color: isDark ? '#94a3b8' : '#64748b',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* فاصل ناعم بين زر الأنظمة وشريط الأيقونات */}
        <div
          style={{
            width: '1px',
            height: '26px',
            background: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.14)',
            flexShrink: 0
          }}
        />

        {/* =========================================================================
            SEGMENT 2 (LEFT SIDE): شريط الأيقونات الدائرية المتمددة أفقياً (macOS Fluid Dock)
            ========================================================================= */}
        <div
          ref={dockTrackRef}
          onMouseMove={(e) => applyMagnification(e.clientX)}
          onMouseLeave={resetMagnification}
          onTouchMove={(e) => {
            if (e.touches.length > 0) applyMagnification(e.touches[0].clientX);
          }}
          onTouchEnd={resetMagnification}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            overflowX: 'auto',
            overflowY: 'visible',
            scrollbarWidth: 'none',
            padding: '0 4px',
            height: '100%',
            position: 'relative'
          }}
        >
          {/* ── الأيقونة السيادية 1: حوض التذاكر والعمليات ── */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              type="button"
              className="sys-dock-circle-btn"
              onClick={() => setActiveAppId('OPERATIONS')}
              onMouseEnter={() => setHoveredSysId('OPERATIONS')}
              onMouseLeave={() => setHoveredSysId(null)}
              style={{
                width: isMobile ? '40px' : '44px',
                height: isMobile ? '40px' : '44px',
                borderRadius: '50%',
                background: activeAppId === 'OPERATIONS'
                  ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.95), rgba(3, 105, 161, 0.85))'
                  : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)'),
                border: activeAppId === 'OPERATIONS'
                  ? '1.5px solid #38bdf8'
                  : (isDark ? '1.5px solid rgba(255, 255, 255, 0.14)' : '1.5px solid rgba(255, 255, 255, 0.85)'),
                color: activeAppId === 'OPERATIONS' ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: activeAppId === 'OPERATIONS'
                  ? '0 0 16px rgba(56, 189, 248, 0.55)'
                  : (isDark ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(15, 23, 42, 0.05)'),
                transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease',
                position: 'relative',
                transformOrigin: 'center center'
              }}
            >
              <Inbox size={isMobile ? 17 : 19} strokeWidth={2.4} color={activeAppId === 'OPERATIONS' ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155')} />
              {liveStats.openCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    background: '#f97316',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: '999px',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  {liveStats.openCount}
                </span>
              )}
            </button>

            {/* مؤشر النشاط السفلي النظيف */}
            {activeAppId === 'OPERATIONS' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: isMobile ? '-4px' : '-5px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '12px',
                  height: '3px',
                  background: '#38bdf8',
                  borderRadius: '999px',
                  boxShadow: '0 0 8px #38bdf8'
                }}
              />
            )}

            {/* تلميح التسمية عند الوقوف (Tooltip) */}
            {hoveredSysId === 'OPERATIONS' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: isMobile ? '50px' : '54px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: isDark ? 'rgba(10, 16, 28, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                  border: isDark ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(15, 23, 42, 0.15)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: isDark ? '#ffffff' : '#0f172a',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.8)' : '0 8px 24px rgba(15, 23, 42, 0.12)',
                  zIndex: 9999
                }}
              >
                حوض التذاكر والعمليات
              </div>
            )}
          </div>

          {/* ── الأيقونات 2..N: المنظومات الحقيقية المثبتة بالشريط ── */}
          {pinnedSatellites.map(sys => {
            const isCurrent = activeAppId === sys.id;
            const isHovered = hoveredSysId === sys.id;
            const isInventory = sys.id === 'asset_inventory';
            const themeGradient = isInventory
              ? 'linear-gradient(135deg, rgba(243, 108, 33, 0.95), rgba(234, 88, 12, 0.85))'
              : 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.85))';
            const themeBorder = isInventory ? '#fb923c' : '#34d399';

            return (
              <div key={sys.id} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  className="sys-dock-circle-btn"
                  onClick={() => setActiveAppId(sys.id)}
                  onMouseEnter={() => setHoveredSysId(sys.id)}
                  onMouseLeave={() => setHoveredSysId(null)}
                  style={{
                    width: isMobile ? '40px' : '44px',
                    height: isMobile ? '40px' : '44px',
                    borderRadius: '50%',
                    background: isCurrent
                      ? themeGradient
                      : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.65)'),
                    border: isCurrent
                      ? `1.5px solid ${themeBorder}`
                      : (isDark ? '1.5px solid rgba(255, 255, 255, 0.14)' : '1.5px solid rgba(255, 255, 255, 0.85)'),
                    color: isCurrent ? '#ffffff' : (isDark ? '#cbd5e1' : '#334155'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isCurrent
                      ? `0 0 16px ${themeBorder}80`
                      : (isDark ? '0 4px 12px rgba(0, 0, 0, 0.25)' : '0 2px 8px rgba(15, 23, 42, 0.05)'),
                    transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease',
                    position: 'relative',
                    transformOrigin: 'center center'
                  }}
                >
                  {renderSystemIcon(sys, isMobile ? 17 : 19)}

                  {/* Online / Offline status dot */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '0px',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: sys.isOnline ? '#10b981' : '#f59e0b',
                      boxShadow: sys.isOnline ? '0 0 6px #10b981' : 'none',
                      border: '1px solid rgba(0, 0, 0, 0.4)'
                    }}
                  />
                </button>

                {/* مؤشر النشاط السفلي النظيف */}
                {isCurrent && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: isMobile ? '-4px' : '-5px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '12px',
                      height: '3px',
                      background: themeBorder,
                      borderRadius: '999px',
                      boxShadow: `0 0 8px ${themeBorder}`
                    }}
                  />
                )}

                {/* تلميح التسمية عند الوقوف (Tooltip) */}
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: isMobile ? '50px' : '54px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: isDark ? 'rgba(10, 16, 28, 0.96)' : 'rgba(255, 255, 255, 0.96)',
                      border: `1px solid ${themeBorder}`,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: isDark ? '#ffffff' : '#0f172a',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.8)' : '0 8px 24px rgba(15, 23, 42, 0.12)',
                      zIndex: 9999
                    }}
                  >
                    {sys.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Floating Toast Notification for Pin/Unpin */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'fixed',
              bottom: isMobile ? '76px' : '88px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.95)',
              border: isDark ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(2, 132, 199, 0.45)',
              color: isDark ? '#ffffff' : '#0f172a',
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              boxShadow: isDark ? '0 8px 25px rgba(0, 0, 0, 0.65)' : '0 8px 25px rgba(15, 23, 42, 0.12)',
              backdropFilter: 'blur(16px)',
              zIndex: 9999,
              pointerEvents: 'none',
              direction: 'rtl'
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>


    </div>
  );
};
export default WorkModeShell;
