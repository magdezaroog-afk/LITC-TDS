import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../engine/auth/AuthContext';
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
  ArrowRight,
  Server,
  Sparkles,
  Home,
  Sliders,
  Laptop
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

type WorkspaceApp = 'OPERATIONS' | 'ASSET_INVENTORY';

export const WorkModeShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeApp, setActiveApp] = useState<WorkspaceApp>('OPERATIONS');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [satelliteUrl, setSatelliteUrl] = useState<string>('http://localhost:3000');
  const [isSatelliteOnline, setIsSatelliteOnline] = useState<boolean | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check health of the asset inventory server
  const checkSatelliteHealth = async () => {
    try {
      const res = await fetch(`${satelliteUrl}/api/auth/me`, { mode: 'cors' }).catch(() => null);
      // If server responded (even with 401 unauthenticated), it means server is alive!
      if (res && (res.status === 200 || res.status === 401 || res.status === 403)) {
        setIsSatelliteOnline(true);
      } else {
        // Fallback test: attempt image or root fetch
        const pingTest = await fetch(`${satelliteUrl}/images/logo.png`, { method: 'HEAD', mode: 'no-cors' })
          .then(() => true)
          .catch(() => false);
        setIsSatelliteOnline(pingTest);
      }
    } catch {
      setIsSatelliteOnline(false);
    }
  };

  useEffect(() => {
    checkSatelliteHealth();
    const interval = setInterval(checkSatelliteHealth, 15000);
    return () => clearInterval(interval);
  }, [satelliteUrl]);

  const handleRefreshIframe = () => {
    setIsIframeLoading(true);
    setIframeKey(prev => prev + 1);
  };

  return (
    <div 
      className="nexus-workspace-shell"
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        background: '#090d16',
        color: '#f8fafc',
        direction: 'rtl',
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
        overflowX: 'hidden'
      }}
    >
      {/* =========================================================================
          1. SLEEK EXECUTIVE RIGHT-DOCKED WORKSPACE SIDEBAR
          ========================================================================= */}
      <aside
        style={{
          width: isSidebarExpanded ? '240px' : '76px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isSidebarExpanded ? 'stretch' : 'center',
          padding: isSidebarExpanded ? '20px 14px' : '20px 10px',
          transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 50,
          flexShrink: 0,
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)',
          position: 'sticky',
          top: 0,
          height: '100vh'
        }}
      >
        {/* Brand / Mini Logo Header */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarExpanded ? 'space-between' : 'center',
            marginBottom: '28px',
            paddingBottom: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            width: '100%'
          }}
        >
          <div 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              cursor: 'pointer' 
            }}
          >
            <div 
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)',
                flexShrink: 0
              }}
            >
              <Sparkles size={20} color="#ffffff" />
            </div>

            {isSidebarExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
              >
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
                  NEXUS <span style={{ color: '#2dd4bf' }}>OPS</span>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                  منصة التشغيل والمنظومات
                </div>
              </motion.div>
            )}
          </div>

          {/* Toggle Expand / Collapse Arrow */}
          {isSidebarExpanded && (
            <button
              onClick={() => setIsSidebarExpanded(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '8px',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer'
              }}
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* Primary Navigation Item 1: مركز العمليات والطلبات */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
          <button
            onClick={() => setActiveApp('OPERATIONS')}
            title="مركز العمليات والطلبات (حوض التذاكر والتقارير)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              width: '100%',
              padding: isSidebarExpanded ? '12px 14px' : '12px',
              borderRadius: '14px',
              border: activeApp === 'OPERATIONS' 
                ? '1px solid rgba(45, 212, 191, 0.3)' 
                : '1px solid transparent',
              background: activeApp === 'OPERATIONS'
                ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.25), rgba(15, 118, 110, 0.15))'
                : 'transparent',
              color: activeApp === 'OPERATIONS' ? '#2dd4bf' : '#94a3b8',
              cursor: 'pointer',
              justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Layers size={22} color={activeApp === 'OPERATIONS' ? '#2dd4bf' : '#94a3b8'} />
              {activeApp === 'OPERATIONS' && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    left: '-4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#2dd4bf',
                    boxShadow: '0 0 10px #2dd4bf'
                  }} 
                />
              )}
            </div>

            {isSidebarExpanded && (
              <div style={{ textAlign: 'right', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: activeApp === 'OPERATIONS' ? '#f8fafc' : '#cbd5e1' }}>
                  العمليات والطلبات
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  حوض التذاكر والتحليلات
                </div>
              </div>
            )}
          </button>

          {/* Primary Navigation Item 2: منظومة جرد الأصول التقنية */}
          <button
            onClick={() => setActiveApp('ASSET_INVENTORY')}
            title="منظومة جرد الأصول والأنظمة التقنية (Devices & Inventory)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              width: '100%',
              padding: isSidebarExpanded ? '12px 14px' : '12px',
              borderRadius: '14px',
              border: activeApp === 'ASSET_INVENTORY' 
                ? '1px solid rgba(249, 115, 22, 0.4)' 
                : '1px solid transparent',
              background: activeApp === 'ASSET_INVENTORY'
                ? 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(194, 65, 12, 0.15))'
                : 'transparent',
              color: activeApp === 'ASSET_INVENTORY' ? '#fb923c' : '#94a3b8',
              cursor: 'pointer',
              justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
              position: 'relative',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HardDrive size={22} color={activeApp === 'ASSET_INVENTORY' ? '#fb923c' : '#94a3b8'} />
              {/* Server Live Status Dot */}
              <span 
                style={{
                  position: 'absolute',
                  top: '-3px',
                  left: '-3px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: isSatelliteOnline ? '#10b981' : '#f59e0b',
                  boxShadow: `0 0 8px ${isSatelliteOnline ? '#10b981' : '#f59e0b'}`
                }} 
              />
            </div>

            {isSidebarExpanded && (
              <div style={{ textAlign: 'right', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: activeApp === 'ASSET_INVENTORY' ? '#f8fafc' : '#cbd5e1' }}>
                  جرد الأصول والأنظمة
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  743 جهاز • SQLite محلي
                </div>
              </div>
            )}
          </button>
        </div>

        {/* Separator & Future Systems Indicator */}
        <div style={{ flex: 1 }} />

        {/* Bottom Status & Quick Exit to Portal */}
        <div 
          style={{
            width: '100%',
            paddingTop: '16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            alignItems: isSidebarExpanded ? 'stretch' : 'center'
          }}
        >
          {/* Quick Return to User Hub / Portal */}
          <button
            onClick={() => navigate('/hub')}
            title="الرجوع إلى البوابة العامة (Portal Hub)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: isSidebarExpanded ? '10px 14px' : '10px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              justifyContent: isSidebarExpanded ? 'flex-start' : 'center',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            <Home size={18} />
            {isSidebarExpanded && <span>البوابة العامة</span>}
          </button>

          {/* Server Connection Badge */}
          <div 
            title={isSatelliteOnline ? "خادم منظومة الأصول متصل ونشط على المنفذ 3000" : "جاري فحص خادم منظومة الأصول..."}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: isSidebarExpanded ? '8px 12px' : '8px',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              fontSize: '11px',
              color: '#94a3b8',
              justifyContent: isSidebarExpanded ? 'flex-start' : 'center'
            }}
          >
            <div 
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isSatelliteOnline ? '#10b981' : '#f59e0b',
                boxShadow: `0 0 6px ${isSatelliteOnline ? '#10b981' : '#f59e0b'}`,
                flexShrink: 0
              }} 
            />
            {isSidebarExpanded && (
              <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {isSatelliteOnline ? 'خادم الأصول: متصل (3000)' : 'جاري الفحص...'}
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          2. MAIN CONTENT AREA (APP SWITCHER)
          ========================================================================= */}
      <main style={{ flex: 1, minWidth: 0, position: 'relative', overflowY: 'auto', height: '100vh' }}>
        
        {/* ==========================================================
            VIEW 1: OPERATIONS & TICKETS HUB (Current Complete Operational Queue)
            ========================================================== */}
        {activeApp === 'OPERATIONS' && (
          <div className="operational-shell" style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <OperationalQueueView />
          </div>
        )}

        {/* ==========================================================
            VIEW 2: EMBEDDED IT ASSET INVENTORY SATELLITE SYSTEM
            ========================================================== */}
        {activeApp === 'ASSET_INVENTORY' && (
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              height: '100%', 
              background: '#0f172a',
              animation: 'fadeIn 0.25s ease-out'
            }}
          >
            {/* Top Executive Satellite Tool Banner */}
            <div 
              style={{
                padding: '16px 28px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                backdropFilter: 'blur(16px)',
                zIndex: 10
              }}
            >
              {/* Title & Metadata */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div 
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)'
                  }}
                >
                  <Laptop size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                      منظومة جرد الأصول والأنظمة التقنية
                    </h2>
                    <span 
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: '#34d399',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      ● 743 جهاز مسجل
                    </span>
                    <span 
                      style={{
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: '#94a3b8',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      SQLite • Port 3000
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>
                    منظومة مساندة مستقلة مدمجة عبر بوابة UECP v2 الآمنة • الصلاحيات مفعلة لفريق الدعم الفني
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleRefreshIframe}
                  title="إعادة تحميل واجهة المنظومة"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <RefreshCw size={14} />
                  <span>تحديث</span>
                </button>

                <a
                  href={satelliteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #0d9488, #0f766e)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 2px 10px rgba(13, 148, 136, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink size={14} />
                  <span>فتح في نافذة مستقلة</span>
                </a>
              </div>
            </div>

            {/* Embedded Iframe Container */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: 'calc(100vh - 75px)', overflow: 'hidden' }}>
              {isIframeLoading && (
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#090d16',
                    zIndex: 5,
                    gap: '14px',
                    color: '#94a3b8'
                  }}
                >
                  <Loader2 size={36} color="#fb923c" className="animate-spin" />
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                    جاري تحميل منظومة جرد الأصول...
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    الاتصال عبر البوابة الداخلية http://localhost:3000
                  </div>
                </div>
              )}

              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={satelliteUrl}
                title="منظومة جرد الأصول التقنية"
                onLoad={() => setIsIframeLoading(false)}
                sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-downloads"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: '#ffffff',
                  opacity: isIframeLoading ? 0 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
