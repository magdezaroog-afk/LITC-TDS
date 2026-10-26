import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../engine/auth/AuthContext';
import { useMobileViewport } from '../../../mobile/hooks/useMobileViewport';
import { OperationalQueueView } from './OperationalQueueView';
import { 
  Layers, 
  HardDrive, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  ChevronLeft,
  Server,
  Sparkles,
  Home,
  Sliders,
  Laptop,
  Plus,
  Globe,
  Settings,
  Activity,
  Wifi,
  WifiOff,
  Info,
  Lock,
  X,
  Trash2
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

  // Active App ID: 'OPERATIONS' or a Satellite System ID (e.g., 'asset_inventory')
  const [activeAppId, setActiveAppId] = useState<string>('OPERATIONS');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  
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

  /**
   * دالة اشتقاق الرابط الموحد عبر البوابة العكسية (Single-Origin Reverse Proxy Gateway)
   * تضمن تشغيل المنظومة تحت نفس رابط النظام من أي دولة ومن أي شبكة دون تعارض
   */
  const resolveSatelliteUrl = (rawTargetUrl: string, clientAdaptedUrl?: string, satelliteId?: string): string => {
    // 1. منظومة جرد الأصول: البوابة العكسية الموحدة (تعمل تحت نفس الدومين تلقائياً)
    if (satelliteId === 'asset_inventory' || rawTargetUrl.includes('localhost:3000') || rawTargetUrl.includes(':3000')) {
      return `/satellites/proxy/asset_inventory/`;
    }

    // 2. منظومات الزملاء المساندة: استخدام الرابط المتكيف شبكياً
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
        // Fallback default if API unavailable
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
        hasAccess: true, // Will be filtered by role check
        isOnline: true,
        latencyMs: 15,
        description: 'إدارة وتتبع الأجهزة والمعدات التقنية والأصول التشغيلية لشركة LITC (743+ جهاز مسجل).'
      }
    ]);
  };

  useEffect(() => {
    fetchSatellites();
    const interval = setInterval(fetchSatellites, 25000); // Poll health every 25 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRefreshIframe = () => {
    setIsIframeLoading(true);
    setIframeKey(prev => prev + 1);
  };

  // Find currently active satellite
  const activeSatellite = satellites.find(s => s.id === activeAppId);
  const activeComputedUrl = activeSatellite 
    ? resolveSatelliteUrl(activeSatellite.targetUrl, activeSatellite.clientAdaptedUrl, activeSatellite.id) 
    : '';

  // Ping Test Handler for modal
  const handlePingHost = async (targetUrl: string) => {
    setPingState({ isPinging: true, result: null });
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
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
    } catch (e: any) {
      setPingState({ isPinging: false, result: { success: false, error: e.message } });
    }
  };

  // Save Satellite Config (Update or Register New Colleague System)
  const handleSaveSatellite = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalFeedback(null);
    const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');

    try {
      if (isAddMode) {
        // Register Colleague System
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
        // Update Existing Satellite
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

  // Delete Satellite (Admins)
  const handleDeleteSatellite = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إزالة هذه المنظومة من شريط المنظومات المركزية؟')) return;
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
      className="nexus-workspace-shell"
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        height: isMobile ? 'calc(100vh - 54px)' : 'calc(100vh - 74px)',
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
          1. INTEGRATED ORBITAL SATELLITE DOCK (Right-Docked Ultra-Sleek Rail - Desktop)
          ========================================================================= */}
      {!isMobile && (
        <aside
          style={{
            width: isSidebarExpanded ? '230px' : '68px',
          background: 'rgba(11, 17, 32, 0.96)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 8px',
          transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 40,
          flexShrink: 0,
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.35)',
          height: '100%'
        }}
      >
        {/* Rail Header / Toggle */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarExpanded ? 'space-between' : 'center',
            width: '100%',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            title="شريط المنظومات والعمليات التشغيلية (انقر للتوسيع)"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              cursor: 'pointer' 
            }}
          >
            <div 
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 12px rgba(13, 148, 136, 0.35)',
                flexShrink: 0
              }}
            >
              <Sparkles size={18} color="#ffffff" />
            </div>

            {isSidebarExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.2px' }}>
                  NEXUS <span style={{ color: '#2dd4bf' }}>OPS</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>
                  المنظومات والعمليات
                </div>
              </motion.div>
            )}
          </div>

          {isSidebarExpanded && (
            <button
              onClick={() => setIsSidebarExpanded(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '6px',
                width: '26px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={15} />
            </button>
          )}
        </div>

        {/* =========================================================================
            SATELLITE ICONS DOCK (Primary Apps & Microservices)
            ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
          
          {/* 1. Core App: مركز العمليات وحوض التذاكر */}
          <button
            onClick={() => setActiveAppId('OPERATIONS')}
            title="مركز العمليات والطلبات (حوض التذاكر والتحليلات)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: isSidebarExpanded ? '10px 12px' : '10px 0',
              borderRadius: '12px',
              border: activeAppId === 'OPERATIONS' 
                ? '1px solid rgba(45, 212, 191, 0.35)' 
                : '1px solid transparent',
              background: activeAppId === 'OPERATIONS'
                ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.28), rgba(15, 118, 110, 0.16))'
                : 'rgba(255, 255, 255, 0.02)',
              color: activeAppId === 'OPERATIONS' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={21} color={activeAppId === 'OPERATIONS' ? '#2dd4bf' : '#94a3b8'} />
              {activeAppId === 'OPERATIONS' && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#2dd4bf',
                    boxShadow: '0 0 8px #2dd4bf'
                  }} 
                />
              )}
            </div>

            {isSidebarExpanded && (
              <div style={{ textAlign: 'right', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: activeAppId === 'OPERATIONS' ? '#f8fafc' : '#cbd5e1' }}>
                  حوض التذاكر
                </div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  العمليات والطلبات
                </div>
              </div>
            )}
          </button>

          {/* 2. Registered Satellite Microservices (Filtered by User Access) */}
          {satellites.map((satellite) => {
            // Check permission: visible only if user has access or is privileged admin
            if (!satellite.hasAccess && !isPrivilegedAdmin) {
              return null; // Invisible to unauthorized users!
            }

            const isActive = activeAppId === satellite.id;
            const isOnline = satellite.isOnline;

            return (
              <button
                key={satellite.id}
                onClick={() => {
                  setActiveAppId(satellite.id);
                  setIsIframeLoading(true);
                }}
                title={`${satellite.name} • ${isOnline ? 'متصل بنجاح' : 'جاري التحقق / غير متاح'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: isSidebarExpanded ? '10px 12px' : '10px 0',
                  borderRadius: '12px',
                  border: isActive 
                    ? '1px solid rgba(249, 115, 22, 0.45)' 
                    : '1px solid transparent',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(194, 65, 12, 0.15))'
                    : 'rgba(255, 255, 255, 0.02)',
                  color: isActive ? '#fb923c' : '#94a3b8',
                  cursor: 'pointer',
                  justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {satellite.id === 'asset_inventory' ? (
                    <Laptop size={21} color={isActive ? '#fb923c' : '#94a3b8'} />
                  ) : (
                    <Server size={21} color={isActive ? '#38bdf8' : '#94a3b8'} />
                  )}

                  {/* Dynamic Status Pulse Bulb */}
                  <span 
                    style={{
                      position: 'absolute',
                      top: '-3px',
                      left: '-3px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isOnline ? '#10b981' : '#f59e0b',
                      boxShadow: `0 0 8px ${isOnline ? '#10b981' : '#f59e0b'}`
                    }} 
                  />
                </div>

                {isSidebarExpanded && (
                  <div style={{ textAlign: 'right', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isActive ? '#f8fafc' : '#cbd5e1' }}>
                      {satellite.id === 'asset_inventory' ? 'جرد الأصول' : satellite.name}
                    </div>
                    <div style={{ fontSize: '10px', color: isOnline ? '#34d399' : '#fbbf24' }}>
                      {isOnline ? 'متصل بالشبكة' : 'في انتظار الاتصال'}
                    </div>
                  </div>
                )}
              </button>
            );
          })}

          {/* 3. Add Colleague System Button (Admins & Project Director Only) */}
          {isPrivilegedAdmin && (
            <button
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
                setPingState({ isPinging: false, result: null });
                setIsConfigModalOpen(true);
              }}
              title="إضافة وربط منظومة مساندة جديدة من أحد الزملاء"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: isSidebarExpanded ? '9px 12px' : '9px 0',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.15)',
                background: 'rgba(255, 255, 255, 0.02)',
                color: '#64748b',
                cursor: 'pointer',
                justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
                transition: 'all 0.2s ease',
                marginTop: '4px'
              }}
            >
              <Plus size={18} />
              {isSidebarExpanded && (
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                  ربط منظومة زميل
                </span>
              )}
            </button>
          )}

        </div>

        {/* Separator */}
        <div style={{ flex: 1 }} />

        {/* Bottom Operational Navigation & Portal Quick Link */}
        <div 
          style={{
            width: '100%',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: 'center'
          }}
        >
          {/* Quick Exit to Portal Hub */}
          <button
            onClick={() => navigate('/hub')}
            title="الرجوع إلى البوابة العامة (Portal Hub)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: isSidebarExpanded ? '8px 12px' : '8px',
              borderRadius: '9px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
              fontSize: '12px',
              fontWeight: 600,
              width: '100%'
            }}
          >
            <Home size={17} />
            {isSidebarExpanded && <span>البوابة العامة</span>}
          </button>
        </div>
      </aside>
      )}

      {/* =========================================================================
          2. MAIN CONTENT VIEWPORT (App Switcher)
          ========================================================================= */}
      <main style={{ flex: 1, minWidth: 0, position: 'relative', overflowY: 'auto', height: '100%', paddingBottom: isMobile ? '72px' : '0' }}>
        
        {/* ==========================================================
            VIEW 1: OPERATIONAL QUEUE (Full Native Ticket Flow System)
            ========================================================== */}
        {activeAppId === 'OPERATIONS' && (
          <div className="operational-shell" style={{ height: '100%', overflowY: 'auto' }}>
            <OperationalQueueView />
          </div>
        )}

        {/* ==========================================================
            VIEW 2: SATELLITE EMBEDDED SYSTEM (Inventory or Colleague Microservice)
            ========================================================== */}
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
            {/* Top Sleek Satellite Command Bar */}
            <div 
              style={{
                padding: isMobile ? '10px 14px' : '12px 24px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.94))',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                backdropFilter: 'blur(16px)',
                zIndex: 10
              }}
            >
              {/* System Title & Live Meta */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div 
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: activeSatellite.id === 'asset_inventory' 
                      ? 'linear-gradient(135deg, #f97316, #ea580c)'
                      : 'linear-gradient(135deg, #0284c7, #0369a1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 3px 12px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  {activeSatellite.id === 'asset_inventory' ? <Laptop size={20} /> : <Server size={20} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                      {activeSatellite.name}
                    </h2>
                    
                    {/* Live Health Badge */}
                    <span 
                      style={{
                        background: activeSatellite.isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: activeSatellite.isOnline ? '#34d399' : '#fbbf24',
                        border: `1px solid ${activeSatellite.isOnline ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                        padding: '1px 8px',
                        borderRadius: '16px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: activeSatellite.isOnline ? '#10b981' : '#f59e0b' }} />
                      {activeSatellite.isOnline ? 'خادم متصل ونشط' : 'بانتظار الاستجابة'}
                    </span>

                    {/* Network URL Tag */}
                    <span 
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: '#94a3b8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        direction: 'ltr'
                      }}
                    >
                      {activeComputedUrl}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    {activeSatellite.description}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isPrivilegedAdmin && (
                  <button
                    onClick={() => {
                      setIsAddMode(false);
                      setEditingSatellite(activeSatellite);
                      setIsConfigModalOpen(true);
                    }}
                    title="تعديل عنوان السيرفر والمنفذ والصلاحيات"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 12px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#cbd5e1',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Settings size={14} />
                    <span>ضبط المنظومة</span>
                  </button>
                )}

                <button
                  onClick={handleRefreshIframe}
                  title="إعادة تحميل واجهة المنظومة"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={13} />
                  <span>تحديث</span>
                </button>

                <a
                  href={activeComputedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 2px 8px rgba(13, 148, 136, 0.25)',
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={13} />
                  <span>فتح مستقل</span>
                </a>
              </div>
            </div>

            {/* Embedded Viewport / Diagnostic Guard Container */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100% - 63px)', overflow: 'hidden' }}>
              
              {/* Spinner while loading */}
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
                  <Loader2 size={34} color="#fb923c" className="animate-spin" />
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#f8fafc' }}>
                    جاري تحميل {activeSatellite.name}...
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', direction: 'ltr' }}>
                    {activeComputedUrl}
                  </div>
                </div>
              )}

              {/* The Sandbox Embedded Micro-Frontend */}
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
                  transition: 'opacity 0.25s ease'
                }}
              />
            </div>
          </div>
        )}

      </main>

      {/* =========================================================================
          3. SATELLITE CONFIGURATION & COLLEAGUE SYSTEM REGISTRATION MODAL
          ========================================================================= */}
      {isConfigModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
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
              width: '540px',
              maxWidth: '96vw',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '18px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
              animation: 'scaleUp 0.2s ease-out'
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
                <Server size={20} color="#38bdf8" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>
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
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveSatellite} style={{ padding: '20px 22px' }}>
              {modalFeedback && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: modalFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: modalFeedback.type === 'success' ? '#34d399' : '#f87171',
                    border: `1px solid ${modalFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                  }}
                >
                  {modalFeedback.message}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {isAddMode && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                      المعرف البرمجي الفريد (System ID - بالإنجليزية)
                    </label>
                    <input
                      type="text"
                      placeholder="مثال: hrms_system, archive_system"
                      value={newSysForm.id}
                      onChange={(e) => setNewSysForm({ ...newSysForm, id: e.target.value })}
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
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    اسم المنظومة المعروض في الشريط
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: منظومة إدارة الكوادر والموارد البشرية"
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
                      عنوان السيرفر والمنفذ (Target URL أو IP جهاز الزميل)
                    </label>
                    <button
                      type="button"
                      onClick={() => handlePingHost(isAddMode ? newSysForm.targetUrl : (editingSatellite?.targetUrl || ''))}
                      disabled={pingState.isPinging}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {pingState.isPinging ? <Loader2 size={12} className="animate-spin" /> : <Activity size={12} />}
                      <span>اختبار الاتصال المباشر (Ping)</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="مثال: http://192.168.1.85:4000 أو http://localhost:3000"
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
                        ? `✓ الجهاز مستجيب ومتصل بنجاح (${pingState.result.latencyMs}ms)`
                        : `✗ تعذر الوصول للجهاز: ${pingState.result.error || 'Timeout'}`}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    * إذا كانت المنظومة على جهاز زميل، أدخل عنوان الـ IP والمنفذ الخاص بجهازه في الشبكة.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}>
                    وصف مختصر
                  </label>
                  <textarea
                    rows={2}
                    placeholder="وصف طبيعة المنظومة واختصاصها..."
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
                  marginTop: '22px',
                  paddingTop: '16px',
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
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#f87171',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={14} />
                    <span>حذف</span>
                  </button>
                ) : <div />}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsConfigModalOpen(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: 'none',
                      color: '#cbd5e1',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    إلغاء
                  </button>

                  <button
                    type="submit"
                    style={{
                      padding: '8px 20px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 10px rgba(13, 148, 136, 0.3)'
                    }}
                  >
                    {isAddMode ? 'اعتماد وتسجيل المنظومة' : 'حفظ التعديلات'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. MOBILE FLOATING THUMB DOCK (شريط الإرساء السفلي لمنطقة الإبهام على الهاتف)
          ========================================================================= */}
      {isMobile && (
        <nav
          className="mobile-ops-bottom-dock"
          style={{
            position: 'fixed',
            bottom: '10px',
            left: '12px',
            right: '12px',
            height: '56px',
            borderRadius: '18px',
            background: 'rgba(11, 17, 32, 0.94)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 16px rgba(45, 212, 191, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '0 8px',
            zIndex: 9999,
            direction: 'rtl'
          }}
        >
          {/* 1. حوض التذاكر (Ops) */}
          <button
            onClick={() => setActiveAppId('OPERATIONS')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: activeAppId === 'OPERATIONS' ? 'rgba(45, 212, 191, 0.16)' : 'transparent',
              border: activeAppId === 'OPERATIONS' ? '1px solid rgba(45, 212, 191, 0.35)' : '1px solid transparent',
              borderRadius: '12px',
              padding: '6px 14px',
              color: activeAppId === 'OPERATIONS' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Layers size={18} />
            <span style={{ fontSize: '10.5px', fontWeight: 800 }}>حوض التذاكر</span>
          </button>

          {/* 2. المنظومات المساندة (جرد الأصول والمنظومات المسجلة) */}
          {satellites.filter(s => s.hasAccess || isPrivilegedAdmin).map(s => {
            const isActive = activeAppId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveAppId(s.id);
                  setIsIframeLoading(true);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  background: isActive ? 'rgba(249, 115, 22, 0.18)' : 'transparent',
                  border: isActive ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid transparent',
                  borderRadius: '12px',
                  padding: '6px 14px',
                  color: isActive ? '#fb923c' : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {s.id === 'asset_inventory' ? <Laptop size={18} /> : <Server size={18} />}
                <span style={{ fontSize: '10.5px', fontWeight: 800 }}>
                  {s.id === 'asset_inventory' ? 'جرد الأصول' : s.name}
                </span>
                <span
                  style={{
                    position: 'absolute',
                    top: '5px',
                    left: '8px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: s.isOnline ? '#10b981' : '#f59e0b',
                    boxShadow: `0 0 6px ${s.isOnline ? '#10b981' : '#f59e0b'}`
                  }}
                />
              </button>
            );
          })}

          {/* 3. إضافة منظومة جديدة (للآدمن فقط) */}
          {isPrivilegedAdmin && (
            <button
              onClick={() => {
                setIsAddMode(true);
                setEditingSatellite(null);
                setNewSysForm({ id: '', name: '', targetUrl: '', category: 'COLLEAGUE_SERVICE', description: '' });
                setPingState({ isPinging: false, result: null });
                setIsConfigModalOpen(true);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                background: 'transparent',
                border: 'none',
                borderRadius: '12px',
                padding: '6px 10px',
                color: '#64748b',
                cursor: 'pointer'
              }}
              title="ربط منظومة مساندة"
            >
              <Plus size={18} />
              <span style={{ fontSize: '10px', fontWeight: 700 }}>ربط منظومة</span>
            </button>
          )}

          {/* 4. البوابة العامة */}
          <button
            onClick={() => navigate('/hub')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'transparent',
              border: 'none',
              borderRadius: '12px',
              padding: '6px 12px',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            <Home size={18} />
            <span style={{ fontSize: '10.5px', fontWeight: 700 }}>البوابة العامة</span>
          </button>
        </nav>
      )}

    </div>
  );
};
