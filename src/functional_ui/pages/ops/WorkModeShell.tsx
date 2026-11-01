import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Laptop, 
  Plus, 
  Activity, 
  X, 
  Inbox, 
  ArrowRight, 
  Grid,
  Pin,
  Check,
  ChevronDown,
  Palette,
  Eye,
  EyeOff
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
  customIcon?: string;
}

export type EnterpriseBgMode = 'mesh_webgl' | 'spline_3d' | 'cyber_grid' | 'sovereign_dark';

export const WorkModeShell: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobileViewport(768);
  const { mode } = useThemeEngine();
  const isDark = mode === 'dark';

  // Active App ID: 'OPERATIONS' or a Satellite System ID (e.g., 'asset_inventory')
  const [activeAppId, setActiveAppId] = useState<string>('OPERATIONS');
  
  // Satellite Registry State
  const [satellites, setSatellites] = useState<SatelliteSystem[]>([]);
  const [isLoadingSatellites, setIsLoadingSatellites] = useState<boolean>(true);
  const [isIframeLoading, setIsIframeLoading] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Live Stats from Queue
  const [liveStats, setLiveStats] = useState<{ openCount: number; poolCount: number }>({ openCount: 0, poolCount: 0 });

  // Pinned Systems in Bottom Dock (Persisted in LocalStorage)
  const [pinnedSystemIds, setPinnedSystemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_pinned_systems');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse pinned systems:', e);
    }
    return ['asset_inventory']; // Default pinned
  });

  // Background Mode (Persisted in LocalStorage)
  const [activeBgMode, setActiveBgMode] = useState<EnterpriseBgMode>(() => {
    try {
      const saved = localStorage.getItem('nexus_ops_bg_mode');
      if (saved && ['mesh_webgl', 'spline_3d', 'cyber_grid', 'sovereign_dark'].includes(saved)) {
        return saved as EnterpriseBgMode;
      }
    } catch (e) {}
    return 'mesh_webgl';
  });

  // UI Modals & Popovers
  const [isSystemsPopoverOpen, setIsSystemsPopoverOpen] = useState<boolean>(false);
  const [isBgModalOpen, setIsBgModalOpen] = useState<boolean>(false);
  const [isAdminAddOpen, setIsAdminAddOpen] = useState<boolean>(false);
  const [newSysName, setNewSysName] = useState<string>('');
  const [newSysUrl, setNewSysUrl] = useState<string>('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Sync pinned systems to localStorage
  const togglePinSystem = useCallback((sysId: string) => {
    setPinnedSystemIds(prev => {
      const exists = prev.includes(sysId);
      const updated = exists ? prev.filter(id => id !== sysId) : [...prev, sysId];
      try {
        localStorage.setItem('nexus_pinned_systems', JSON.stringify(updated));
      } catch (e) {}
      const sys = satellites.find(s => s.id === sysId);
      const name = sys ? sys.name : sysId;
      showToast(!exists ? `📌 تم تثبيت ${name} في شريط المهام` : `✕ تم إخفاء ${name} من شريط المهام`);
      return updated;
    });
  }, [satellites, showToast]);

  // Set Background Mode
  const handleSelectBgMode = useCallback((mode: EnterpriseBgMode, name: string) => {
    setActiveBgMode(mode);
    try {
      localStorage.setItem('nexus_ops_bg_mode', mode);
    } catch (e) {}
    showToast(`🎨 تم تفعيل خلفية: ${name}`);
    setTimeout(() => setIsBgModalOpen(false), 200);
  }, [showToast]);

  // ── Sync with Operational Queue Events ──
  useEffect(() => {
    const handleStatsChanged = (e: any) => {
      if (e.detail) {
        setLiveStats({
          openCount: e.detail.openCount || 0,
          poolCount: e.detail.poolCount || 0
        });
      }
    };

    window.addEventListener('nexus_ops_stats_changed', handleStatsChanged);
    return () => {
      window.removeEventListener('nexus_ops_stats_changed', handleStatsChanged);
    };
  }, []);

  // Resolve Satellite URLs
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

  // Fetch Satellites
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
      },
      {
        id: 'telecom_nodes',
        name: 'بوابة مراقبة مقاسم الاتصالات',
        category: 'TELECOM',
        targetUrl: 'http://localhost:3001',
        isActive: true,
        hasAccess: true,
        isOnline: true,
        latencyMs: 18,
        description: 'متابعة حية لغرف التوزيع ومقاسم الألياف البصرية في طرابلس وبنغازي.'
      },
      {
        id: 'power_grid_monitor',
        name: 'نظام إدارة طاقة محطات الإرسال',
        category: 'INFRASTRUCTURE',
        targetUrl: 'http://localhost:3002',
        isActive: true,
        hasAccess: true,
        isOnline: false,
        latencyMs: 0,
        description: 'مراقبة المولدات الاحتياطية وبطاريات الليثيوم في المحطات المركزية.'
      }
    ]);
  };

  useEffect(() => {
    fetchSatellites();
    const interval = setInterval(fetchSatellites, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshIframe = () => {
    setIsIframeLoading(true);
    setIframeKey(prev => prev + 1);
  };

  // Add custom system (Admin quick provisioning)
  const handleQuickAddSystem = () => {
    if (!newSysName.trim()) {
      showToast('⚠️ يرجى إدخال اسم المنظومة');
      return;
    }
    const newId = 'custom_' + Date.now();
    const newSys: SatelliteSystem = {
      id: newId,
      name: newSysName.trim(),
      category: 'ENTERPRISE',
      targetUrl: newSysUrl.trim() || 'http://localhost:3000',
      isActive: true,
      hasAccess: true,
      isOnline: true,
      description: 'منظومة مرتبطة مضافة من قِبل المشرف.'
    };
    setSatellites(prev => [...prev, newSys]);
    setPinnedSystemIds(prev => [...prev, newId]);
    setNewSysName('');
    setNewSysUrl('');
    setIsAdminAddOpen(false);
    showToast(`🎉 تم ربط وتثبيت ${newSys.name} بنجاح!`);
  };

  // =========================================================================
  // CANVAS BACKGROUND ENGINE (4 Enterprise Modes)
  // =========================================================================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const touchPosRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const render = () => {
      t += 0.014;
      const width = canvas.width;
      const height = canvas.height;
      const touch = touchPosRef.current;

      if (activeBgMode === 'mesh_webgl') {
        // Mode 1: Stripe & Vercel Living Silk Mesh (Ultra-Clear)
        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, width, height);

        const x1 = width * 0.35 + Math.sin(t * 0.35) * (width * 0.2);
        const y1 = height * 0.28 + Math.cos(t * 0.28) * (height * 0.15);
        const r1 = Math.max(width, height) * 0.75;
        const g1 = ctx.createRadialGradient(x1, y1, 10, x1, y1, r1);
        g1.addColorStop(0, 'rgba(13, 57, 75, 0.65)');
        g1.addColorStop(0.5, 'rgba(13, 57, 75, 0.22)');
        g1.addColorStop(1, 'rgba(6, 9, 19, 0)');
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, width, height);

        const x2 = width * 0.72 + Math.cos(t * 0.42) * (width * 0.18);
        const y2 = height * 0.65 + Math.sin(t * 0.38) * (height * 0.18);
        const r2 = Math.max(width, height) * 0.85;
        const g2 = ctx.createRadialGradient(x2, y2, 10, x2, y2, r2);
        g2.addColorStop(0, 'rgba(21, 30, 54, 0.75)');
        g2.addColorStop(0.5, 'rgba(21, 30, 54, 0.25)');
        g2.addColorStop(1, 'rgba(6, 9, 19, 0)');
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, width, height);

        const x3 = width * 0.5 + Math.sin(t * 0.5) * (width * 0.15);
        const y3 = height * 0.85 + Math.cos(t * 0.45) * (height * 0.12);
        const r3 = Math.max(width, height) * 0.55;
        const g3 = ctx.createRadialGradient(x3, y3, 10, x3, y3, r3);
        g3.addColorStop(0, 'rgba(74, 28, 6, 0.38)');
        g3.addColorStop(0.6, 'rgba(74, 28, 6, 0.08)');
        g3.addColorStop(1, 'rgba(6, 9, 19, 0)');
        ctx.fillStyle = g3;
        ctx.fillRect(0, 0, width, height);

      } else if (activeBgMode === 'spline_3d') {
        // Mode 2: Spline 3D Kinetic Topology
        ctx.fillStyle = '#060913';
        ctx.fillRect(0, 0, width, height);

        const cx = width * 0.5;
        const cy = height * 0.42;
        const fov = 320;
        const angleX = t * 0.35 + (touch.y - cy) * 0.0012;
        const angleY = t * 0.45 + (touch.x - cx) * 0.0012;

        const segments = 32;
        const rMajor = Math.min(width, height) * 0.28;
        const rMinor = rMajor * 0.45;

        ctx.save();
        ctx.translate(cx, cy);

        for (let i = 0; i < segments; i += 2) {
          const u = (i / segments) * Math.PI * 2;
          const x0 = (rMajor + rMinor * Math.cos(u * 2)) * Math.cos(u);
          const y0 = (rMajor + rMinor * Math.cos(u * 2)) * Math.sin(u);
          const z0 = rMinor * Math.sin(u * 2);

          const xRot = x0 * Math.cos(angleY) + z0 * Math.sin(angleY);
          const zRot = -x0 * Math.sin(angleY) + z0 * Math.cos(angleY);

          const yRot = y0 * Math.cos(angleX) - zRot * Math.sin(angleX);
          const zFinal = y0 * Math.sin(angleX) + zRot * Math.cos(angleX);

          const scale = fov / (fov + zFinal + 200);
          const px = xRot * scale;
          const py = yRot * scale;

          const alpha = Math.max(0.15, Math.min(0.85, (zFinal + rMajor) / (2 * rMajor)));
          ctx.beginPath();
          ctx.arc(px, py, 3.2 * scale, 0, Math.PI * 2);
          ctx.fillStyle = (i % 4 === 0) ? `rgba(243, 108, 33, ${alpha})` : `rgba(56, 189, 248, ${alpha})`;
          ctx.fill();
        }
        ctx.restore();

      } else if (activeBgMode === 'cyber_grid') {
        // Mode 3: Palantir Foundry Cyber-Grid
        ctx.fillStyle = '#050811';
        ctx.fillRect(0, 0, width, height);

        const horizonY = height * 0.25;
        const hGrad = ctx.createLinearGradient(0, horizonY - 60, 0, horizonY + 120);
        hGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
        hGrad.addColorStop(0.5, 'rgba(19, 93, 121, 0.18)');
        hGrad.addColorStop(1, 'rgba(5, 8, 17, 0)');
        ctx.fillStyle = hGrad;
        ctx.fillRect(0, horizonY - 60, width, 180);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;

        const vpX = width * 0.5;
        const vpY = horizonY;

        for (let x = -width; x <= width * 2; x += 40) {
          ctx.beginPath();
          ctx.moveTo(vpX, vpY);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        let currentY = vpY + 14;
        let step = 8;
        while (currentY < height) {
          ctx.beginPath();
          ctx.moveTo(0, currentY);
          ctx.lineTo(width, currentY);
          ctx.stroke();
          currentY += step;
          step *= 1.14;
        }

      } else if (activeBgMode === 'sovereign_dark') {
        // Mode 4: Sovereign Minimalist Focus
        ctx.fillStyle = '#06080e';
        ctx.fillRect(0, 0, width, height);

        const x = touch.x || width * 0.5;
        const y = touch.y || height * 0.35;
        const spot = ctx.createRadialGradient(x, y, 0, x, y, 420);
        spot.addColorStop(0, 'rgba(19, 93, 121, 0.16)');
        spot.addColorStop(0.5, 'rgba(19, 93, 121, 0.04)');
        spot.addColorStop(1, 'rgba(6, 8, 14, 0)');
        ctx.fillStyle = spot;
        ctx.fillRect(0, 0, width, height);
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [activeBgMode]);

  // Touch & Pointer Tracking for Background
  const handlePointerMove = (e: React.PointerEvent) => {
    touchPosRef.current = { x: e.clientX, y: e.clientY, active: true };
  };

  // Close Popover on Outside Click
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

  // =========================================================================
  // MACOS DOCK MAGNIFICATION PHYSICS (Zero Upward Jump, Pure Horizontal Breathing)
  // =========================================================================
  const dockTrackRef = useRef<HTMLDivElement>(null);
  const [hoveredSysId, setHoveredSysId] = useState<string | null>(null);

  const applyMagnification = (clientX: number) => {
    const track = dockTrackRef.current;
    if (!track) return;
    const buttons = track.querySelectorAll<HTMLButtonElement>('.sys-dock-circle-btn');
    const maxDist = 80;

    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const dist = Math.abs(clientX - centerX);

      if (dist < maxDist) {
        const factor = Math.cos((dist / maxDist) * (Math.PI / 2));
        const scale = 1.0 + factor * 0.18; // Elegant 1.18x expansion
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

  // Pinned Satellites in the Dock
  const pinnedSatellites = satellites.filter(s => pinnedSystemIds.includes(s.id));
  const activeSatellite = satellites.find(s => s.id === activeAppId);
  const activeComputedUrl = activeSatellite 
    ? resolveSatelliteUrl(activeSatellite.targetUrl, activeSatellite.clientAdaptedUrl, activeSatellite.id) 
    : '';

  const bgNamesMap: Record<EnterpriseBgMode, string> = {
    'mesh_webgl': 'سديم WebGL المائع',
    'spline_3d': 'توبولوجيا 3D التفاعلية',
    'cyber_grid': 'الشبكة السيبرانية الهندسية',
    'sovereign_dark': 'الزجاج السيادي المركز'
  };

  return (
    <div 
      className="nexus-workmode-root"
      onPointerMove={handlePointerMove}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? '100dvh' : 'calc(100vh - 68px)',
        width: '100%',
        maxWidth: '100%',
        background: '#05070d',
        color: '#f8fafc',
        direction: 'rtl',
        fontFamily: "'Cairo', 'Tajawal', sans-serif",
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* ── Background Canvas Layer ── */}
      <canvas 
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* ── Floating Haptic Toast Alert ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              top: isMobile ? '14px' : '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(10, 16, 28, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              color: '#ffffff',
              padding: '8px 18px',
              borderRadius: '999px',
              fontSize: '12.5px',
              fontWeight: 800,
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 16px rgba(56, 189, 248, 0.35)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top Visor Command Bar ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '8px 12px' : '10px 20px',
          background: 'rgba(10, 14, 24, 0.75)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 40,
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #135d79 0%, #0ea5e9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
                NEXUS TDS
              </span>
              
              {/* Background Selector Pill */}
              <button
                type="button"
                onClick={() => setIsBgModalOpen(true)}
                title="تغيير نمط خلفية بيئة العمل"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  backdropFilter: 'blur(12px)',
                  transition: 'all 0.18s ease'
                }}
              >
                <Palette size={11} />
                <span>{bgNamesMap[activeBgMode]}</span>
                <ChevronDown size={10} style={{ opacity: 0.7 }} />
              </button>
            </div>
            <div style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 600 }}>
              «سعادة مدير المشروع — م. مجدي الزروق»
            </div>
          </div>
        </div>

        {/* Return to pool button if currently viewing a satellite */}
        {activeAppId !== 'OPERATIONS' && (
          <button
            type="button"
            onClick={() => setActiveAppId('OPERATIONS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(19, 93, 121, 0.8), rgba(14, 165, 233, 0.6))',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.25)'
            }}
          >
            <ArrowRight size={14} />
            <span>العودة لحوض الطلبات</span>
          </button>
        )}
      </header>

      {/* =========================================================================
          1. MAIN APPLICATION CANVAS (Full-Bleed 100% Screen Freedom)
          ========================================================================= */}
      <main 
        style={{ 
          flex: 1, 
          minWidth: 0, 
          position: 'relative', 
          overflowY: 'auto', 
          height: '100%', 
          paddingBottom: isMobile ? '74px' : '90px',
          zIndex: 10
        }}
      >
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
              background: '#0c0e13'
            }}
          >
            {/* Top Command Strip for Satellite */}
            <div 
              style={{
                padding: isMobile ? '8px 12px' : '10px 20px',
                background: 'rgba(15, 23, 42, 0.85)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                backdropFilter: 'blur(20px)'
              }}
            >
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
                    color: '#ffffff'
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
                      {activeSatellite.isOnline ? 'خادم متصل' : 'بانتظار الاستجابة'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleRefreshIframe}
                  title="إعادة تحميل المنظومة"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
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
                    background: '#0c0e13',
                    zIndex: 5,
                    gap: '12px',
                    color: '#94a3b8'
                  }}
                >
                  <RefreshCw size={28} color="#0ea5e9" className="animate-spin" />
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                    جاري تحميل {activeSatellite.name}...
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
          2. THE SPLIT DUAL BOTTOM DOCK (macOS Physics + Anchored Systems Popover)
          ========================================================================= */}
      <nav
        style={{
          position: 'fixed',
          bottom: isMobile ? 0 : '16px',
          left: isMobile ? 0 : '50%',
          right: isMobile ? 0 : 'auto',
          transform: isMobile ? 'none' : 'translateX(-50%)',
          height: isMobile ? '64px' : '68px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: isMobile ? '0 10px calc(env(safe-area-inset-bottom, 0px) + 2px)' : '0 14px',
          background: 'rgba(10, 15, 26, 0.94)',
          backdropFilter: 'blur(32px) saturate(180%)',
          WebkitBackdropFilter: 'blur(32px) saturate(180%)',
          borderRadius: isMobile ? '0' : '28px',
          borderTop: isMobile ? '1px solid rgba(255, 255, 255, 0.12)' : 'none',
          border: isMobile ? 'none' : '1px solid rgba(56, 189, 248, 0.25)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(19, 93, 121, 0.25)',
          zIndex: 9000,
          direction: 'rtl',
          width: isMobile ? '100%' : 'auto',
          maxWidth: isMobile ? '100%' : '620px',
          boxSizing: 'border-box'
        }}
      >
        {/* SEGMENT A: Large Segment (macOS Fluid Magnification Track) */}
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
            gap: isMobile ? '10px' : '14px',
            overflowX: 'auto',
            overflowY: 'visible',
            scrollbarWidth: 'none',
            padding: '0 4px',
            height: '100%',
            position: 'relative'
          }}
        >
          {/* Sovereign Icon 1: Operations Workbench */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="sys-dock-circle-btn"
              onClick={() => setActiveAppId('OPERATIONS')}
              onMouseEnter={() => setHoveredSysId('OPERATIONS')}
              onMouseLeave={() => setHoveredSysId(null)}
              style={{
                width: isMobile ? '42px' : '46px',
                height: isMobile ? '42px' : '46px',
                borderRadius: '50%',
                background: activeAppId === 'OPERATIONS'
                  ? 'linear-gradient(135deg, rgba(19, 93, 121, 0.95), rgba(14, 165, 233, 0.8))'
                  : 'rgba(255, 255, 255, 0.05)',
                border: activeAppId === 'OPERATIONS'
                  ? '1.5px solid #38bdf8'
                  : '1.5px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: activeAppId === 'OPERATIONS'
                  ? '0 0 16px rgba(56, 189, 248, 0.6)'
                  : '0 4px 12px rgba(0,0,0,0.4)',
                transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease',
                position: 'relative',
                transformOrigin: 'center center'
              }}
            >
              <Inbox size={isMobile ? 18 : 20} strokeWidth={2.4} />
              {liveStats.openCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    left: '-3px',
                    background: '#f97316',
                    color: '#ffffff',
                    fontSize: '9.5px',
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: '999px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                  }}
                >
                  {liveStats.openCount}
                </span>
              )}
            </button>

            {/* Active Indicator Bar */}
            {activeAppId === 'OPERATIONS' && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: isMobile ? '4px' : '6px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '14px',
                  height: '3px',
                  background: '#38bdf8',
                  borderRadius: '999px',
                  boxShadow: '0 0 8px #38bdf8'
                }} 
              />
            )}

            {/* Floating Tooltip Pill */}
            {hoveredSysId === 'OPERATIONS' && (
              <div 
                style={{
                  position: 'absolute',
                  bottom: isMobile ? '52px' : '58px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(10, 16, 28, 0.96)',
                  border: '1px solid rgba(56, 189, 248, 0.5)',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#ffffff',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
                }}
              >
                حوض التذاكر والعمليات
              </div>
            )}
          </div>

          {/* Icons 2..N: Pinned Satellites */}
          {pinnedSatellites.map(sys => {
            const isCurrent = activeAppId === sys.id;
            const isHovered = hoveredSysId === sys.id;

            return (
              <div key={sys.id} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="sys-dock-circle-btn"
                  onClick={() => setActiveAppId(sys.id)}
                  onMouseEnter={() => setHoveredSysId(sys.id)}
                  onMouseLeave={() => setHoveredSysId(null)}
                  style={{
                    width: isMobile ? '42px' : '46px',
                    height: isMobile ? '42px' : '46px',
                    borderRadius: '50%',
                    background: isCurrent
                      ? 'linear-gradient(135deg, rgba(243, 108, 33, 0.9), rgba(234, 88, 12, 0.8))'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: isCurrent
                      ? '1.5px solid #fb923c'
                      : '1.5px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: isCurrent
                      ? '0 0 16px rgba(251, 146, 60, 0.6)'
                      : '0 4px 12px rgba(0,0,0,0.4)',
                    transition: 'transform 0.18s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.2s ease',
                    position: 'relative',
                    transformOrigin: 'center center'
                  }}
                >
                  {sys.id === 'asset_inventory' ? (
                    <Laptop size={isMobile ? 18 : 20} strokeWidth={2.4} />
                  ) : (
                    <Server size={isMobile ? 18 : 20} strokeWidth={2.4} />
                  )}
                </button>

                {/* Active Indicator Bar */}
                {isCurrent && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: isMobile ? '4px' : '6px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: '14px',
                      height: '3px',
                      background: '#fb923c',
                      borderRadius: '999px',
                      boxShadow: '0 0 8px #fb923c'
                    }} 
                  />
                )}

                {/* Floating Tooltip Pill */}
                {isHovered && (
                  <div 
                    style={{
                      position: 'absolute',
                      bottom: isMobile ? '52px' : '58px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(10, 16, 28, 0.96)',
                      border: '1px solid rgba(251, 146, 60, 0.5)',
                      padding: '3px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 800,
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.8)'
                    }}
                  >
                    {sys.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '28px', background: 'rgba(255, 255, 255, 0.12)', flexShrink: 0 }} />

        {/* SEGMENT B: Compact Anchor Button (الأنظمة) */}
        <div style={{ position: 'relative' }}>
          <button
            ref={popoverBtnRef}
            type="button"
            onClick={() => setIsSystemsPopoverOpen(prev => !prev)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: isMobile ? '42px' : '46px',
              padding: isMobile ? '0 12px' : '0 16px',
              borderRadius: '20px',
              background: isSystemsPopoverOpen 
                ? 'rgba(56, 189, 248, 0.2)' 
                : 'rgba(255, 255, 255, 0.06)',
              border: isSystemsPopoverOpen 
                ? '1.5px solid #38bdf8' 
                : '1.5px solid rgba(255, 255, 255, 0.14)',
              color: isSystemsPopoverOpen ? '#38bdf8' : '#e2e8f0',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.18s ease',
              flexShrink: 0
            }}
          >
            <Grid size={15} />
            <span>الأنظمة</span>
            <span 
              style={{
                background: 'rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                padding: '1px 5px',
                borderRadius: '999px',
                fontSize: '10px'
              }}
            >
              {satellites.length}
            </span>
          </button>

          {/* ── COMPACT ANCHORED SYSTEMS POPOVER MENU (Max 48vh) ── */}
          <AnimatePresence>
            {isSystemsPopoverOpen && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  bottom: isMobile ? '70px' : '82px',
                  left: isMobile ? '12px' : 'auto',
                  right: isMobile ? '12px' : 'auto',
                  width: isMobile ? 'calc(100vw - 24px)' : '320px',
                  maxHeight: '48vh',
                  background: 'rgba(10, 16, 28, 0.96)',
                  backdropFilter: 'blur(28px)',
                  WebkitBackdropFilter: 'blur(28px)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: '20px',
                  boxShadow: '0 25px 70px rgba(0, 0, 0, 0.85), 0 0 30px rgba(19, 93, 121, 0.35)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  zIndex: 99999,
                  overflow: 'hidden'
                }}
              >
                {/* Popover Header */}
                <div 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    paddingBottom: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Grid size={14} color="#38bdf8" />
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
                      الأنظمة المرتبطة
                    </span>
                  </div>
                  <span 
                    style={{
                      fontSize: '11px',
                      color: '#38bdf8',
                      background: 'rgba(56, 189, 248, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      fontWeight: 700
                    }}
                  >
                    {pinnedSatellites.length} معروضة بالشريط
                  </span>
                </div>

                {/* Popover Systems List (Scrollable) */}
                <div 
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    paddingRight: '2px',
                    maxHeight: 'calc(48vh - 110px)'
                  }}
                >
                  {satellites.map(sys => {
                    const isPinned = pinnedSystemIds.includes(sys.id);
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
                          background: isPinned ? 'rgba(56, 189, 248, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                          border: isPinned ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                          <div 
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.08)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isPinned ? '#38bdf8' : '#94a3b8',
                              flexShrink: 0
                            }}
                          >
                            {sys.id === 'asset_inventory' ? <Laptop size={14} /> : <Server size={14} />}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sys.name}
                            </div>
                            <div style={{ fontSize: '10px', color: isPinned ? '#38bdf8' : '#64748b' }}>
                              {isPinned ? 'معروضة في شريط المهام' : 'مخفية من شريط المهام'}
                            </div>
                          </div>
                        </div>

                        {/* Direct Pin / Unpin Action Pill */}
                        <button
                          type="button"
                          onClick={() => togglePinSystem(sys.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            background: isPinned ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: isPinned ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
                            color: isPinned ? '#38bdf8' : '#94a3b8',
                            flexShrink: 0
                          }}
                        >
                          {isPinned ? (
                            <>
                              <Pin size={11} />
                              <span>مثبت بالشريط</span>
                            </>
                          ) : (
                            <>
                              <X size={11} />
                              <span>مخفي</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Admin Quick Add Accordion Trigger */}
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsAdminAddOpen(prev => !prev)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px dashed rgba(255, 255, 255, 0.15)',
                      color: '#cbd5e1',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>إضافة منظومة للمشرفين</span>
                  </button>

                  {isAdminAddOpen && (
                    <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <input 
                        type="text"
                        placeholder="اسم المنظومة (مثال: ألياف مقسم السراج)..."
                        value={newSysName}
                        onChange={(e) => setNewSysName(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: 'rgba(15, 23, 42, 0.8)',
                          border: '1px solid rgba(255, 255, 255, 0.14)',
                          color: '#fff',
                          fontSize: '11px',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddSystem}
                        style={{
                          width: '100%',
                          padding: '6px',
                          borderRadius: '8px',
                          background: '#0ea5e9',
                          border: 'none',
                          color: '#fff',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        ✓ حفظ وتثبيت بالشريط
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* =========================================================================
          3. EXECUTIVE BACKGROUND SELECTOR MODAL (4 World-Class 2026 Modes)
          ========================================================================= */}
      <AnimatePresence>
        {isBgModalOpen && (
          <div 
            onClick={() => setIsBgModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(16px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '500px',
                maxHeight: '88vh',
                overflowY: 'auto',
                background: 'rgba(11, 17, 30, 0.96)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '24px',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(19, 93, 121, 0.4)',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Modal Header */}
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#ffffff' }}>
                    محرك خلفيات المنظومة المؤسسية 2026
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                    خلفيات رصينة بدون تشتيت بصري، بأعلى درجات التباين والوضوح
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBgModalOpen(false)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#cbd5e1',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* 4 Background Options Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                
                {/* 1. Stripe/Vercel Living Silk Mesh */}
                <div 
                  onClick={() => handleSelectBgMode('mesh_webgl', 'سديم WebGL المائع')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: activeBgMode === 'mesh_webgl' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: activeBgMode === 'mesh_webgl' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div 
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #070b14 0%, #0d394b 50%, #4a1c06 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      flexShrink: 0
                    }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>
                      1. سديم WebGL المائع الحقيقي (Stripe / Vercel Mesh)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.5, marginTop: '2px' }}>
                      تدرجات سائلة عميقة بألوان بترولية وكحلية هادئة بدون جزيئات. تضمن راحة تامة للعين وأعلى وضوح للنصوص.
                    </div>
                  </div>
                  <div style={{ color: activeBgMode === 'mesh_webgl' ? '#38bdf8' : '#64748b' }}>
                    {activeBgMode === 'mesh_webgl' ? <Check size={18} strokeWidth={3} /> : '○'}
                  </div>
                </div>

                {/* 2. Spline 3D Kinetic Topology */}
                <div 
                  onClick={() => handleSelectBgMode('spline_3d', 'توبولوجيا 3D التفاعلية')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: activeBgMode === 'spline_3d' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: activeBgMode === 'spline_3d' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div 
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'radial-gradient(circle, #38bdf8 0%, #1e293b 80%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      flexShrink: 0
                    }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>
                      2. توبولوجيا 3D التفاعلية (Spline 3D Geometry)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.5, marginTop: '2px' }}>
                      كتلة هندسية زجاجية ثلاثية الأبعاد تدور بنعومة فيزيائية وتتفاعل مع إيماءات اللمس وحركة المؤشر.
                    </div>
                  </div>
                  <div style={{ color: activeBgMode === 'spline_3d' ? '#38bdf8' : '#64748b' }}>
                    {activeBgMode === 'spline_3d' ? <Check size={18} strokeWidth={3} /> : '○'}
                  </div>
                </div>

                {/* 3. Palantir Cyber Grid */}
                <div 
                  onClick={() => handleSelectBgMode('cyber_grid', 'الشبكة السيبرانية الهندسية')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: activeBgMode === 'cyber_grid' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: activeBgMode === 'cyber_grid' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div 
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(56, 189, 248, 0.3) 4px, rgba(56, 189, 248, 0.3) 5px), #080c14',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      flexShrink: 0
                    }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>
                      3. الشبكة السيبرانية الهندسية (Palantir Matrix Grid)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.5, marginTop: '2px' }}>
                      شبكة متجهات فائقة الدقة بنمط الألياف البصرية والبنى التحتية الوطنية تطلق نبضات ضوئية خافتة عند اللمس.
                    </div>
                  </div>
                  <div style={{ color: activeBgMode === 'cyber_grid' ? '#38bdf8' : '#64748b' }}>
                    {activeBgMode === 'cyber_grid' ? <Check size={18} strokeWidth={3} /> : '○'}
                  </div>
                </div>

                {/* 4. Sovereign Minimalist Dark */}
                <div 
                  onClick={() => handleSelectBgMode('sovereign_dark', 'الزجاج السيادي المركز')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '16px',
                    background: activeBgMode === 'sovereign_dark' ? 'rgba(14, 165, 233, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    border: activeBgMode === 'sovereign_dark' ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease'
                  }}
                >
                  <div 
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'radial-gradient(circle at center, #1e293b 0%, #06080e 90%)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      flexShrink: 0
                    }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#f1f5f9' }}>
                      4. الزجاج السيادي المركز (Sovereign Minimalist Focus)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.5, marginTop: '2px' }}>
                      شاشة داكنة ومطلقة التباين بإضاءة موضعية خافتة تتبع مكان العمل، خالية 100% من أي حركة للتركيز التام.
                    </div>
                  </div>
                  <div style={{ color: activeBgMode === 'sovereign_dark' ? '#38bdf8' : '#64748b' }}>
                    {activeBgMode === 'sovereign_dark' ? <Check size={18} strokeWidth={3} /> : '○'}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkModeShell;
