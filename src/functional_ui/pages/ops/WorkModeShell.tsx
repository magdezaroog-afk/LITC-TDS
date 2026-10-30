import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../engine/auth/AuthContext';
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

  // Active App ID: 'OPERATIONS' (حوض الطلبات والعمليات) or a Satellite System ID (e.g., 'asset_inventory')
  const [activeAppId, setActiveAppId] = useState<string>('OPERATIONS');
  
  // Kinetic Launcher / Start Menu State (يفتح من زر القائمة السفلي)
  const [isLauncherOpen, setIsLauncherOpen] = useState<boolean>(false);
  
  // Ops Queue Sub-Tab Synchronization ('POOL' | 'FLOW_SETTINGS' | 'ANALYTICS' | 'COMPARISON')
  const [opsActiveTab, setOpsActiveTab] = useState<'POOL' | 'FLOW_SETTINGS' | 'ANALYTICS' | 'COMPARISON'>('POOL');
  const [liveStats, setLiveStats] = useState<{ openCount: number; poolCount: number }>({ openCount: 0, poolCount: 0 });

  // Satellite Registry State
  const [satellites, setSatellites] = useState<SatelliteSystem[]>([]);
  const [isLoadingSatellites, setIsLoadingSatellites] = useState<boolean>(true);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Colleague System Registration & Config Modal State (For Admins)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [editingSatellite, setEditingSatellite] = useState<SatelliteSystem | null>(null);
  const [isAddMode, setIsAddMode] = useState<boolean>(false);
  const [newSysForm, setNewSysForm] = useState({
    id: '',
    name: '',
    targetUrl: '',
    category: 'COLLEAGUE_SERVICE',
    description: ''
  });
  const [pingState, setPingState] = useState<{ isPinging: boolean; result: any | null }>({ isPinging: false, result: null });
  const [modalFeedback, setModalFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isPrivilegedAdmin = ['super_admin', 'system_director', 'co_admin'].includes(user?.role || '');

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

  // Ping Colleague Host in Realtime
  const handlePingHost = async (targetUrl: string) => {
    setPingState({ isPinging: true, result: null });
    const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/v1/satellites/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ targetUrl })
      });
      const data = await res.json();
      setPingState({ isPinging: false, result: data });
    } catch {
      setPingState({ isPinging: false, result: { isOnline: false, error: 'Connection Failed' } });
    }
  };

  // Save Satellite Config
  const handleSaveSatellite = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback(null);
    const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');

    try {
      if (isAddMode) {
        const res = await fetch('/api/v1/satellites/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(newSysForm)
        });
        const data = await res.json();
        if (data.success) {
          setModalFeedback({ type: 'success', message: data.message });
          await fetchSatellites();
          setTimeout(() => {
            setIsConfigModalOpen(false);
            setModalFeedback(null);
          }, 1200);
        } else {
          setModalFeedback({ type: 'error', message: data.error || 'فشل تسجيل المنظومة.' });
        }
      } else if (editingSatellite) {
        const res = await fetch(`/api/v1/satellites/${editingSatellite.id}/config`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify({
            name: editingSatellite.name,
            targetUrl: editingSatellite.targetUrl,
            isActive: editingSatellite.isActive,
            description: editingSatellite.description
          })
        });
        const data = await res.json();
        if (data.success) {
          setModalFeedback({ type: 'success', message: 'تم تحديث الإعدادات بنجاح.' });
          await fetchSatellites();
          setTimeout(() => {
            setIsConfigModalOpen(false);
            setModalFeedback(null);
          }, 1000);
        } else {
          setModalFeedback({ type: 'error', message: data.error || 'فشل التحديث.' });
        }
      }
    } catch {
      setModalFeedback({ type: 'error', message: 'حدث خطأ في الاتصال بالخادم المركزي.' });
    }
  };

  // Delete Satellite
  const handleDeleteSatellite = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إزالة هذه المنظومة؟')) return;
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch(`/api/v1/satellites/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        if (activeAppId === id) setActiveAppId('OPERATIONS');
        await fetchSatellites();
        setIsConfigModalOpen(false);
      }
    } catch (e) {
      console.error('Failed to delete satellite:', e);
    }
  };

  return (
    <div 
      className="nexus-workmode-root"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'calc(100vh - 54px)' : 'calc(100vh - 68px)',
        width: '100%',
        maxWidth: '100%',
        background: '#070b14',
        color: '#f8fafc',
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
              background: '#090e1a',
              animation: 'fadeIn 0.2s ease-out'
            }}
          >
            {/* Top Sleek Command Strip for Satellite */}
            <div 
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.95))',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
                    background: '#070b14',
                    zIndex: 5,
                    gap: '12px',
                    color: '#94a3b8'
                  }}
                >
                  <RefreshCw size={30} color="#f97316" className="animate-spin" />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-around' : 'center',
          gap: isMobile ? '4px' : '10px',
          padding: isMobile ? '6px 10px calc(6px + env(safe-area-inset-bottom, 0px))' : '8px 18px',
          background: 'rgba(11, 20, 31, 0.88)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          borderRadius: isMobile ? '0' : '26px',
          borderTop: isMobile ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
          border: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          zIndex: 9000,
          direction: 'rtl',
          maxWidth: isMobile ? '100%' : 'fit-content'
        }}
      >
        {/* ── 🚀 MASTER LAUNCHER BUTTON (زر القائمة السفلي الذكي للمنظومات والطلبات) ── */}
        <button
          type="button"
          onClick={() => setIsLauncherOpen(prev => !prev)}
          title="قائمة المنظومات ومراكز العمل (انقر للتبديل)"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '4px' : '8px',
            padding: isMobile ? '6px 12px' : '7px 16px',
            borderRadius: '16px',
            border: isLauncherOpen ? '1.5px solid #f36c21' : '1px solid rgba(243, 108, 33, 0.35)',
            background: isLauncherOpen 
              ? 'linear-gradient(135deg, #f36c21 0%, #ea580c 100%)' 
              : 'rgba(243, 108, 33, 0.15)',
            color: isLauncherOpen ? '#ffffff' : '#fb923c',
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: isMobile ? '11px' : '12.5px',
            boxShadow: isLauncherOpen ? '0 4px 16px rgba(243, 108, 33, 0.45)' : 'none',
            transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0
          }}
        >
          <div style={{
            width: '20px',
            height: '20px',
            borderRadius: '6px',
            background: isLauncherOpen ? 'rgba(255,255,255,0.2)' : '#f36c21',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff'
          }}>
            <Layers size={12} strokeWidth={2.5} />
          </div>
          <span>المنظومات والطلبات</span>
          <ChevronUp size={14} style={{ transform: isLauncherOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {/* ── حالة 1: أزرار حوض الطلبات والتقارير (تظهر فقط عند عرض مركز الطلبات) ── */}
        <AnimatePresence mode="wait">
          {activeAppId === 'OPERATIONS' && (
            <motion.div
              key="operations-buttons"
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 4 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '4px' : '8px' }}
            >
              {/* زر 1: مركز الطلبات والعمليات (مع عداد حي) */}
              <button
                type="button"
                onClick={() => handleSwitchTab('POOL')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '6px 10px' : '7px 14px',
                  borderRadius: '14px',
                  border: opsActiveTab === 'POOL' ? '1.5px solid #0284c7' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: opsActiveTab === 'POOL' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(255, 255, 255, 0.04)',
                  color: opsActiveTab === 'POOL' ? '#ffffff' : '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: opsActiveTab === 'POOL' ? 800 : 600,
                  fontSize: isMobile ? '11px' : '12px',
                  boxShadow: opsActiveTab === 'POOL' ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Inbox size={15} />
                <span>مركز الطلبات</span>
                {liveStats.openCount > 0 && (
                  <span style={{
                    background: opsActiveTab === 'POOL' ? '#ffffff' : '#0284c7',
                    color: opsActiveTab === 'POOL' ? '#0369a1' : '#ffffff',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '1px 6px',
                    borderRadius: '999px'
                  }}>
                    {liveStats.openCount}
                  </span>
                )}
              </button>

              {/* زر 2: خصائص واستقبال الطلبات */}
              <button
                type="button"
                onClick={() => handleSwitchTab('FLOW_SETTINGS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '6px 10px' : '7px 14px',
                  borderRadius: '14px',
                  border: opsActiveTab === 'FLOW_SETTINGS' ? '1.5px solid #d97706' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: opsActiveTab === 'FLOW_SETTINGS' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255, 255, 255, 0.04)',
                  color: opsActiveTab === 'FLOW_SETTINGS' ? '#ffffff' : '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: opsActiveTab === 'FLOW_SETTINGS' ? 800 : 600,
                  fontSize: isMobile ? '11px' : '12px',
                  boxShadow: opsActiveTab === 'FLOW_SETTINGS' ? '0 4px 14px rgba(217, 119, 6, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <Sliders size={15} />
                <span>خصائص واستقبال الطلبات</span>
              </button>

              {/* زر 3: التحليلات والمقارنة والحوكمة */}
              <button
                type="button"
                onClick={() => handleSwitchTab('ANALYTICS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: isMobile ? '6px 10px' : '7px 14px',
                  borderRadius: '14px',
                  border: ['ANALYTICS', 'COMPARISON'].includes(opsActiveTab) ? '1.5px solid #135d79' : '1px solid rgba(255, 255, 255, 0.08)',
                  background: ['ANALYTICS', 'COMPARISON'].includes(opsActiveTab) ? 'linear-gradient(135deg, #135d79 0%, #1a7597 100%)' : 'rgba(255, 255, 255, 0.04)',
                  color: ['ANALYTICS', 'COMPARISON'].includes(opsActiveTab) ? '#ffffff' : '#cbd5e1',
                  cursor: 'pointer',
                  fontWeight: ['ANALYTICS', 'COMPARISON'].includes(opsActiveTab) ? 800 : 600,
                  fontSize: isMobile ? '11px' : '12px',
                  boxShadow: ['ANALYTICS', 'COMPARISON'].includes(opsActiveTab) ? '0 4px 14px rgba(19, 93, 121, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
              >
                <BarChart3 size={15} />
                <span>التحليلات والتقارير</span>
              </button>
            </motion.div>
          )}

          {/* ── حالة 2: كبسولة المنظومة المصاحبة (تختفي أزرار التذاكر تماماً وتظهر هذه فقط) ── */}
          {activeAppId !== 'OPERATIONS' && activeSatellite && (
            <motion.div
              key="satellite-controls"
              initial={{ opacity: 0, scale: 0.92, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 4 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px' }}
            >
              {/* شارة المنظومة الحالية */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#e2e8f0'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSatellite.isOnline ? '#10b981' : '#f59e0b' }} />
                <span>{activeSatellite.name}</span>
              </div>

              {/* زر سريع للرجوع لمركز الطلبات */}
              <button
                type="button"
                onClick={() => setActiveAppId('OPERATIONS')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)'
                }}
              >
                <ArrowRight size={13} />
                <span>العودة لمركز الطلبات</span>
              </button>

              {/* زر التحديث السريع */}
              <button
                type="button"
                onClick={handleRefreshIframe}
                title="تحديث نافذة المنظومة"
                style={{
                  padding: '6px 10px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} className={isIframeLoading ? 'animate-spin' : ''} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* =========================================================================
          3. KINETIC LAUNCHER DRAWER & APP SWITCHER (قائمة المنظومات وحوض التذاكر)
          ========================================================================= */}
      <AnimatePresence>
        {isLauncherOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99998,
              background: 'rgba(7, 11, 20, 0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: isMobile ? 'flex-end' : 'center',
              justifyContent: 'center',
              padding: isMobile ? 0 : '20px'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsLauncherOpen(false);
            }}
          >
            <motion.div
              initial={isMobile ? { y: '100%' } : { scale: 0.94, opacity: 0, y: 15 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.94, opacity: 0, y: 15 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : '680px',
                maxHeight: isMobile ? '86vh' : '82vh',
                background: 'rgba(15, 23, 42, 0.96)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderBottom: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: isMobile ? '24px 24px 0 0' : '28px',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
            >
              {/* Drawer Top Drag Handle (Mobile) */}
              {isMobile && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
                  <div style={{ width: '42px', height: '4px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.2)' }} />
                </div>
              )}

              {/* Launcher Header */}
              <div style={{
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f36c21 0%, #ea580c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 16px rgba(243, 108, 33, 0.35)'
                  }}>
                    <Layers size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16.5px', fontWeight: 800, color: '#f8fafc' }}>
                      بوابة العمليات والمنظومات الموحدة
                    </h3>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      التبديل الفوري بين مركز الطلبات والمنظومات المصاحبة
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLauncherOpen(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Launcher Body Content */}
              <div style={{ padding: '22px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* ── SECTION 1: FLAGSHIP CORE (مركز الطلبات والعمليات المؤسسية) ── */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={14} color="#38bdf8" />
                    <span>المنظومة المركزية الرئيسية</span>
                  </div>

                  <div
                    onClick={() => {
                      setActiveAppId('OPERATIONS');
                      setIsLauncherOpen(false);
                    }}
                    style={{
                      position: 'relative',
                      padding: '18px 20px',
                      borderRadius: '18px',
                      background: activeAppId === 'OPERATIONS'
                        ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(3, 105, 161, 0.12) 100%)'
                        : 'rgba(255, 255, 255, 0.03)',
                      border: activeAppId === 'OPERATIONS'
                        ? '2px solid #0284c7'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      boxShadow: activeAppId === 'OPERATIONS' ? '0 8px 24px rgba(2, 132, 199, 0.25)' : 'none',
                      transition: 'all 0.22s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
                        flexShrink: 0
                      }}>
                        <Inbox size={22} />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                            مركز الطلبات والعمليات المؤسسية
                          </h4>
                          <span style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: '#0284c7',
                            color: '#ffffff'
                          }}>
                            النظام المعتمد
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: '#94a3b8' }}>
                          حوض الطلبات المركزي، مسارات التوجيه، وإدارة التدفقات التشغيلية والحوكمة
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {liveStats.openCount > 0 && (
                        <div style={{ textAlign: 'center', padding: '0 10px' }}>
                          <div style={{ fontSize: '16px', fontWeight: 900, color: '#38bdf8' }}>{liveStats.openCount}</div>
                          <div style={{ fontSize: '10px', color: '#64748b' }}>طلب وارد</div>
                        </div>
                      )}
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: activeAppId === 'OPERATIONS' ? '#0284c7' : 'rgba(255,255,255,0.06)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {activeAppId === 'OPERATIONS' ? <CheckCircle2 size={16} /> : <ArrowLeft size={14} />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: SATELLITE SYSTEMS (المنظومات المصاحبة والمساندة) ── */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Cpu size={14} color="#f97316" />
                      <span>المنظومات المصاحبة والمساندة ({satellites.length})</span>
                    </div>

                    {isPrivilegedAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddMode(true);
                          setEditingSatellite(null);
                          setNewSysForm({
                            id: '',
                            name: '',
                            targetUrl: '',
                            category: 'COLLEAGUE_SERVICE',
                            description: ''
                          });
                          setIsConfigModalOpen(true);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f97316',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={13} />
                        <span>ربط منظومة جديدة</span>
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                    {satellites.map(sat => {
                      const isCurrent = activeAppId === sat.id;
                      return (
                        <div
                          key={sat.id}
                          onClick={() => {
                            setActiveAppId(sat.id);
                            setIsIframeLoading(true);
                            setIsLauncherOpen(false);
                          }}
                          style={{
                            padding: '16px',
                            borderRadius: '16px',
                            background: isCurrent 
                              ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(234, 88, 12, 0.1) 100%)' 
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isCurrent ? '1.5px solid #f97316' : '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: isCurrent ? '0 6px 20px rgba(249, 115, 22, 0.2)' : 'none'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: sat.id === 'asset_inventory' 
                                  ? 'linear-gradient(135deg, #f97316, #ea580c)' 
                                  : 'linear-gradient(135deg, #0284c7, #0369a1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff'
                              }}>
                                {sat.id === 'asset_inventory' ? <Laptop size={18} /> : <Server size={18} />}
                              </div>
                              <div>
                                <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#f8fafc' }}>
                                  {sat.name}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                  {sat.id === 'asset_inventory' ? 'بوابة مدمجة عبر البروكسي الموحد' : sat.category}
                                </div>
                              </div>
                            </div>

                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              background: sat.isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: sat.isOnline ? '#34d399' : '#fbbf24',
                              border: `1px solid ${sat.isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                            }}>
                              {sat.isOnline ? 'نشط' : 'استجابة'}
                            </span>
                          </div>

                          <p style={{ margin: 0, fontSize: '11.5px', color: '#64748b', lineHeight: '1.4' }}>
                            {sat.description}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                            {isPrivilegedAdmin && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSatellite(sat);
                                  setIsAddMode(false);
                                  setIsConfigModalOpen(true);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '4px'
                                }}
                              >
                                <Settings size={14} />
                              </button>
                            )}
                            <div style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: isCurrent ? '#f97316' : '#38bdf8',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span>{isCurrent ? 'معروض حالياً' : 'تشغيل المنظومة'}</span>
                              <ArrowLeft size={13} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Launcher Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                color: '#64748b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} color="#f36c21" />
                  <span>NEXUS Unified Operations Architecture • 2026</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/hub')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Home size={13} />
                  <span>الرجوع للبوابة العامة</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          4. SATELLITE CONFIGURATION & REGISTRATION MODAL
          ========================================================================= */}
      {isConfigModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsConfigModalOpen(false);
          }}
        >
          <div
            style={{
              width: '520px',
              maxWidth: '96vw',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 22px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Server size={18} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
                  {isAddMode ? 'ربط وتسجيل منظومة مساندة جديدة (زميل)' : `ضبط إعدادات ${editingSatellite?.name}`}
                </h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSatellite} style={{ padding: '20px 22px' }}>
              {modalFeedback && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    background: modalFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: modalFeedback.type === 'success' ? '#34d399' : '#fca5a5',
                    border: `1px solid ${modalFeedback.type === 'success' ? '#10b981' : '#ef4444'}`
                  }}
                >
                  {modalFeedback.message}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {isAddMode && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      المعرّف التقني للمنظومة (ID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. oracle_hr أو sap_finance"
                      value={newSysForm.id}
                      onChange={(e) => setNewSysForm({ ...newSysForm, id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#f8fafc',
                        fontSize: '13px',
                        outline: 'none',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    اسم المنظومة المعروض
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: منظومة الشؤون الإدارية أو المشتريات"
                    value={isAddMode ? newSysForm.name : (editingSatellite?.name || '')}
                    onChange={(e) => {
                      if (isAddMode) setNewSysForm({ ...newSysForm, name: e.target.value });
                      else if (editingSatellite) setEditingSatellite({ ...editingSatellite, name: e.target.value });
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>
                      عنوان السيرفر (Target URL أو IP جهاز الزميل)
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePingHost(isAddMode ? newSysForm.targetUrl : (editingSatellite?.targetUrl || ''))}
                      disabled={pingState.isPinging}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Activity size={12} />
                      <span>{pingState.isPinging ? 'جاري الفحص...' : 'فحص الاتصال (Ping)'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="http://192.168.1.50:4000 أو http://localhost:3000"
                    value={isAddMode ? newSysForm.targetUrl : (editingSatellite?.targetUrl || '')}
                    onChange={(e) => {
                      if (isAddMode) setNewSysForm({ ...newSysForm, targetUrl: e.target.value });
                      else if (editingSatellite) setEditingSatellite({ ...editingSatellite, targetUrl: e.target.value });
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '13px',
                      direction: 'ltr',
                      outline: 'none'
                    }}
                  />
                  {pingState.result && (
                    <div 
                      style={{ 
                        marginTop: '6px', 
                        fontSize: '11.5px', 
                        color: pingState.result.isOnline ? '#34d399' : '#f87171' 
                      }}
                    >
                      {pingState.result.isOnline 
                        ? `✓ الجهاز متصل ومستجيب (${pingState.result.latencyMs}ms)`
                        : `✗ تعذر الوصول للجهاز: ${pingState.result.error || 'Timeout'}`}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    وصف مختصر
                  </label>
                  <textarea
                    rows={2}
                    placeholder="وصف اختصاص المنظومة وطبيعة عملها..."
                    value={isAddMode ? newSysForm.description : (editingSatellite?.description || '')}
                    onChange={(e) => {
                      if (isAddMode) setNewSysForm({ ...newSysForm, description: e.target.value });
                      else if (editingSatellite) setEditingSatellite({ ...editingSatellite, description: e.target.value });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: '#f8fafc',
                      fontSize: '12.5px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '20px',
                  paddingTop: '14px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {!isAddMode && editingSatellite && editingSatellite.id !== 'asset_inventory' ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteSatellite(editingSatellite.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                    <span>حذف</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      color: '#cbd5e1',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    style={{
                      padding: '7px 18px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(13, 148, 136, 0.3)'
                    }}
                  >
                    {isAddMode ? 'اعتماد وتسجيل' : 'حفظ التعديلات'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default WorkModeShell;
