/**
 * LITC-TS v43 — Interface & Satellite Governance Hub
 * =======================================================
 * لوحة الحوكمة المركزية للواجهات والمنظومات المساندة (LEPC Architecture)
 * - حوكمة وتخصيص المنظومات المساندة (جرد الأصول، الموارد البشرية، منظومات الزملاء)
 * - تخصيص الصلاحيات على مستوى: الإدارة، الدور الوظيفي، أو الموظف بالاسم (Zero Fake Data)
 * - إدارة ملفات وتوزيع الواجهات المؤسسية لجميع الإدارات
 * - تصميم فائق الرقي يطابق معايير 2026 وهوية NEXUS الرسمية (Teal #135d79 & Orange #f36c21)
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Server,
  ShieldCheck,
  Building2,
  Users,
  UserCheck,
  UserPlus,
  Activity,
  CheckCircle2,
  XCircle,
  Search,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  AlertCircle,
  Radio,
  Sliders,
  Globe,
  Lock,
  Zap,
  LayoutGrid,
  FileCode,
  FolderOpen
} from 'lucide-react';
import { LayoutLandingView } from './LayoutLandingView';
import { SavedInterface } from './interfaceTypes';

interface SatelliteSystem {
  id: string;
  name: string;
  category: string;
  defaultPort: number;
  targetUrl: string;
  proxyUrl?: string;
  isActive: boolean;
  allowedRoles: string[];
  allowedDepartments: number[];
  allowedUserIds: number[];
  userOverrides?: Array<{
    id: number;
    fullName: string | null;
    username: string;
    email: string | null;
    departmentName?: string;
  }>;
  description: string;
  isOnline: boolean;
  latencyMs: number;
  isProtected?: boolean;
}

interface Department {
  id: number;
  name: string;
}

interface Role {
  id: number;
  name: string;
}

interface UserSearchResult {
  id: number;
  username: string;
  fullName: string | null;
  email: string | null;
  departmentId: number | null;
  department?: { id: number; name: string };
  role?: { id: number; name: string };
}

export function UILayoutEngineTab({ onNavigateToTab }: { onNavigateToTab?: (tabId: string) => void }) {
  // Navigation tabs within Governance
  const [activeGovernanceTab, setActiveGovernanceTab] = useState<'SATELLITES' | 'LAYOUTS'>('SATELLITES');

  // ─── Satellite Governance State ──────────────────────────────────────────
  const [satellites, setSatellites] = useState<SatelliteSystem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedSatelliteId, setSelectedSatelliteId] = useState<string>('asset_inventory');
  const [loadingSatellites, setLoadingSatellites] = useState<boolean>(true);
  const [savingSatellite, setSavingSatellite] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Ping Testing
  const [pingingId, setPingingId] = useState<string | null>(null);

  // User Search for Overrides
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userSearchResults, setUserSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);

  // Add New Satellite Modal
  const [showAddSatelliteModal, setShowAddSatelliteModal] = useState<boolean>(false);

  // Edit Satellite Modal
  const [editingSatellite, setEditingSatellite] = useState<SatelliteSystem | null>(null);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editSatelliteForm, setEditSatelliteForm] = useState({
    name: '',
    targetUrl: '',
    category: 'IT_OPERATIONS',
    description: ''
  });
  const [savingEditSatellite, setSavingEditSatellite] = useState<boolean>(false);

  const handleOpenEditSatelliteModal = (sat: SatelliteSystem) => {
    setEditingSatellite(sat);
    setEditSatelliteForm({
      name: sat.name || '',
      targetUrl: sat.targetUrl || '',
      category: sat.category || 'IT_OPERATIONS',
      description: sat.description || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEditSatellite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSatellite) return;
    setSavingEditSatellite(true);
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch(`/api/v1/satellites/${editingSatellite.id}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(editSatelliteForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccessMsg(`تم تحديث بيانات المنظومة "${editSatelliteForm.name}" بنجاح.`);
        setSatellites(prev => prev.map(s => s.id === editingSatellite.id ? { ...s, ...editSatelliteForm } : s));
        setShowEditModal(false);
        setEditingSatellite(null);
      } else {
        alert(data.error || 'فشل تحديث بيانات المنظومة.');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ في الاتصال بالخادم.');
    } finally {
      setSavingEditSatellite(false);
    }
  };
  const [newSatelliteForm, setNewSatelliteForm] = useState({
    id: '',
    name: '',
    category: 'IT_OPERATIONS',
    defaultPort: 5000,
    targetUrl: 'http://localhost:5000',
    description: '',
    isActive: true
  });
  const [registering, setRegistering] = useState<boolean>(false);

  // ─── Layouts State (Prisma Interface model) ──────────────────────────────
  const [savedInterfaces, setSavedInterfaces] = useState<SavedInterface[]>([]);
  const [loadingLayouts, setLoadingLayouts] = useState<boolean>(false);

  // ─── Fetch Satellite Governance Data ──────────────────────────────────────
  const fetchGovernanceData = async () => {
    setLoadingSatellites(true);
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch('/api/v1/satellites/governance', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setSatellites(data.satellites || []);
        setDepartments(data.departments || []);
        setRoles(data.roles || []);
        if (data.satellites && data.satellites.length > 0 && !selectedSatelliteId) {
          setSelectedSatelliteId(data.satellites[0].id);
        }
      }
    } catch (err) {
      console.error('[UILayoutEngine] Failed to fetch satellite governance data:', err);
    } finally {
      setLoadingSatellites(false);
    }
  };

  // ─── Fetch Interfaces / Layouts ──────────────────────────────────────────
  const fetchLayouts = async () => {
    setLoadingLayouts(true);
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch('/api/v1/layouts/list', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Accept': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.interfaces)) {
        setSavedInterfaces(
          data.interfaces.map((i: any) => ({
            id: i.id,
            name: i.name,
            interfaceType: i.interfaceType || 'OPERATIONAL',
            roleType: i.roleType,
            departmentId: i.departmentId,
            departmentName: i.department?.name,
            lastUpdated: i.updatedAt || i.createdAt || new Date().toISOString()
          }))
        );
      }
    } catch (err) {
      console.error('[UILayoutEngine] Failed to load interfaces:', err);
    } finally {
      setLoadingLayouts(false);
    }
  };

  useEffect(() => {
    fetchGovernanceData();
    fetchLayouts();
  }, []);

  // Currently Selected Satellite
  const currentSatellite = useMemo(() => {
    return satellites.find(s => s.id === selectedSatelliteId) || satellites[0] || null;
  }, [satellites, selectedSatelliteId]);

  // ─── Live Ping Test ───────────────────────────────────────────────────────
  const handlePingSatellite = async (satellite: SatelliteSystem) => {
    setPingingId(satellite.id);
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch('/api/v1/satellites/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ targetUrl: satellite.targetUrl })
      });
      const data = await res.json();
      if (data.success) {
        setSatellites(prev =>
          prev.map(s =>
            s.id === satellite.id
              ? { ...s, isOnline: data.isOnline, latencyMs: data.latencyMs || 0 }
              : s
          )
        );
      }
    } catch (err) {
      console.warn('Ping error:', err);
    } finally {
      setPingingId(null);
    }
  };

  // ─── Toggle Department Access ─────────────────────────────────────────────
  const handleToggleDepartment = (deptId: number) => {
    if (!currentSatellite) return;
    const currentDepts = currentSatellite.allowedDepartments || [];
    const exists = currentDepts.includes(deptId);
    const updated = exists ? currentDepts.filter(id => id !== deptId) : [...currentDepts, deptId];

    setSatellites(prev =>
      prev.map(s => (s.id === currentSatellite.id ? { ...s, allowedDepartments: updated } : s))
    );
  };

  const handleSelectAllDepartments = () => {
    if (!currentSatellite) return;
    const allIds = departments.map(d => d.id);
    setSatellites(prev =>
      prev.map(s => (s.id === currentSatellite.id ? { ...s, allowedDepartments: allIds } : s))
    );
  };

  const handleClearAllDepartments = () => {
    if (!currentSatellite) return;
    setSatellites(prev =>
      prev.map(s => (s.id === currentSatellite.id ? { ...s, allowedDepartments: [] } : s))
    );
  };

  // ─── Toggle Role Access ───────────────────────────────────────────────────
  const handleToggleRole = (roleKey: string) => {
    if (!currentSatellite) return;
    const currentRoles = currentSatellite.allowedRoles || [];
    const exists = currentRoles.includes(roleKey);
    const updated = exists ? currentRoles.filter(r => r !== roleKey) : [...currentRoles, roleKey];

    setSatellites(prev =>
      prev.map(s => (s.id === currentSatellite.id ? { ...s, allowedRoles: updated } : s))
    );
  };

  // ─── User Search & Overrides ──────────────────────────────────────────────
  const handleUserSearchChange = (query: string) => {
    setUserSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (query.trim().length < 2) {
      setUserSearchResults([]);
      setIsSearchingUsers(false);
      return;
    }

    setIsSearchingUsers(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
        const res = await fetch(`/api/v1/satellites/users/search?q=${encodeURIComponent(query.trim())}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': 'application/json'
          }
        });
        const data = await res.json();
        if (data.success) {
          setUserSearchResults(data.users || []);
        }
      } catch (err) {
        console.error('User search error:', err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);
  };

  const handleAddUserOverride = (user: UserSearchResult) => {
    if (!currentSatellite) return;
    const currentUsers = currentSatellite.allowedUserIds || [];
    if (currentUsers.includes(user.id)) return;

    const updatedIds = [...currentUsers, user.id];
    const currentOverrides = currentSatellite.userOverrides || [];
    const updatedOverrides = [
      ...currentOverrides,
      {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        departmentName: user.department?.name
      }
    ];

    setSatellites(prev =>
      prev.map(s =>
        s.id === currentSatellite.id
          ? { ...s, allowedUserIds: updatedIds, userOverrides: updatedOverrides }
          : s
      )
    );

    setUserSearchQuery('');
    setUserSearchResults([]);
  };

  const handleRemoveUserOverride = (userId: number) => {
    if (!currentSatellite) return;
    const updatedIds = (currentSatellite.allowedUserIds || []).filter(id => id !== userId);
    const updatedOverrides = (currentSatellite.userOverrides || []).filter(u => u.id !== userId);

    setSatellites(prev =>
      prev.map(s =>
        s.id === currentSatellite.id
          ? { ...s, allowedUserIds: updatedIds, userOverrides: updatedOverrides }
          : s
      )
    );
  };

  // ─── Save Satellite Configuration to Database ─────────────────────────────
  const handleSaveCurrentSatellite = async () => {
    if (!currentSatellite) return;
    setSavingSatellite(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch(`/api/v1/satellites/${currentSatellite.id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          name: currentSatellite.name,
          targetUrl: currentSatellite.targetUrl,
          isActive: currentSatellite.isActive,
          allowedRoles: currentSatellite.allowedRoles,
          allowedDepartments: currentSatellite.allowedDepartments,
          allowedUserIds: currentSatellite.allowedUserIds,
          description: currentSatellite.description
        })
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(data.message || 'تم حفظ وتطبيق التغييرات بنجاح في قاعدة البيانات.');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } else {
        setSaveErrorMsg(data.error || 'تعذر حفظ البيانات.');
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'فشل الاتصال بالخادم لحفظ الصلاحيات.');
    } finally {
      setSavingSatellite(false);
    }
  };

  // ─── Register New Satellite ───────────────────────────────────────────────
  const handleRegisterNewSatellite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSatelliteForm.id || !newSatelliteForm.name || !newSatelliteForm.targetUrl) {
      alert('يرجى ملء جميع الحقول الإلزامية');
      return;
    }

    setRegistering(true);
    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch('/api/v1/satellites/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(newSatelliteForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddSatelliteModal(false);
        setNewSatelliteForm({
          id: '',
          name: '',
          category: 'IT_OPERATIONS',
          defaultPort: 5000,
          targetUrl: 'http://localhost:5000',
          description: '',
          isActive: true
        });
        await fetchGovernanceData();
        setSelectedSatelliteId(data.satellite?.id || newSatelliteForm.id);
      } else {
        alert(data.error || 'فشل تسجيل المنظومة');
      }
    } catch (err: any) {
      alert(err.message || 'خطأ في الاتصال');
    } finally {
      setRegistering(false);
    }
  };

  // ─── Layouts Handlers ─────────────────────────────────────────────────────
  
  // ─── Delete Satellite ─────────────────────────────────────────────────────
  const handleDeleteSatellite = async (satelliteId: string, satelliteName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (satelliteId === 'asset_inventory') {
      alert('لا يمكن حذف منظومة جرد الأصول الأساسية، يمكن فقط تعطيلها.');
      return;
    }
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف منظومة "${satelliteName}" نهائياً من سجل المنظومات وقاعدة البيانات؟`)) {
      return;
    }

    try {
      const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
      const res = await fetch(`/api/v1/satellites/${satelliteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccessMsg(`تم حذف المنظومة "${satelliteName}" بنجاح.`);
        const updated = satellites.filter(s => s.id !== satelliteId);
        setSatellites(updated);
        if (selectedSatelliteId === satelliteId) {
          setSelectedSatelliteId(updated[0]?.id || '');
        }
      } else {
        setSaveErrorMsg(data.error || 'فشل حذف المنظومة.');
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'خطأ في الاتصال بالخادم.');
    }
  };

  const handleDeleteInterface = async (id: string) => {
    const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
    await fetch(`/api/v1/layouts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : ''
      }
    });
    fetchLayouts();
  };

  const handleStartNewLayout = async (payload: any) => {
    const token = localStorage.getItem('nexus_token') || sessionStorage.getItem('nexus_token');
    await fetch('/api/v1/layouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(payload)
    });
    fetchLayouts();
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', direction: 'rtl', padding: '0 4px', boxSizing: 'border-box' }}>
      {/* ─── Top Main Header ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg, #135d79, #0d3e51)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 14px rgba(19, 93, 121, 0.35)' }}>
              <Layers size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
                حوكمة الواجهات والأنظمة المساندة
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#64748b' }}>
                تخصيص وتوزيع المنظومات المستقلة (جرد الأصول، الموارد البشرية، منظومات الزملاء) وإدارة ملفات الواجهات المؤسسية
              </p>
            </div>
          </div>
        </div>

        {/* Sub-view Switcher */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: 14, gap: 4, border: '1px solid #e2e8f0' }}>
          <button
            onClick={() => setActiveGovernanceTab('SATELLITES')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeGovernanceTab === 'SATELLITES' ? '#135d79' : 'transparent',
              color: activeGovernanceTab === 'SATELLITES' ? '#ffffff' : '#475569',
              boxShadow: activeGovernanceTab === 'SATELLITES' ? '0 4px 12px rgba(19, 93, 121, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Server size={16} />
            حوكمة وتخصيص المنظومات المساندة ({satellites.length})
          </button>

          <button
            onClick={() => setActiveGovernanceTab('LAYOUTS')}
            style={{
              padding: '8px 18px',
              borderRadius: 10,
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeGovernanceTab === 'LAYOUTS' ? '#135d79' : 'transparent',
              color: activeGovernanceTab === 'LAYOUTS' ? '#ffffff' : '#475569',
              boxShadow: activeGovernanceTab === 'LAYOUTS' ? '0 4px 12px rgba(19, 93, 121, 0.3)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <FolderOpen size={16} />
            سجل وتوزيع الواجهات المؤسسية ({savedInterfaces.length})
          </button>
        </div>
      </div>

      {/* ─── TAB 1: SATELLITES GOVERNANCE ───────────────────────────── */}
      {activeGovernanceTab === 'SATELLITES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Quick Status Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <Server size={22} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>إجمالي المنظومات المساندة</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{satellites.length} منظومات</div>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                <Activity size={22} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>المنظومات المتصلة حالياً (Online)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>
                  {satellites.filter(s => s.isOnline).length} / {satellites.length} متصل
                </div>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Zap size={22} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>البوابة العكسية الموحدة (SSO)</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#d97706' }}>نشطة (تدعم العمل من المنزل)</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button
                onClick={() => setShowAddSatelliteModal(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: 68,
                  background: 'linear-gradient(135deg, #f36c21, #d95714)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 16,
                  padding: '16px',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 16px rgba(243, 108, 33, 0.35)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <Plus size={20} />
                تسجيل منظومة مساندة جديدة
              </button>
            </div>
          </div>

          {/* Main Master-Detail Work Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
            {/* Left Rail: Satellites Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#334155', paddingRight: 4 }}>
                اختر المنظومة للتحكم في تخصيصها:
              </div>

              {loadingSatellites ? (
                <div style={{ background: '#fff', borderRadius: 16, padding: 30, textAlign: 'center', color: '#64748b' }}>
                  <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                  جاري جلب إعدادات المنظومات...
                </div>
              ) : (
                satellites.map(sat => {
                  const isSelected = sat.id === selectedSatelliteId;
                  return (
                    <div
                      key={sat.id}
                      onClick={() => setSelectedSatelliteId(sat.id)}
                      style={{
                        background: isSelected ? 'linear-gradient(135deg, #135d79, #0f4a61)' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#1e293b',
                        borderRadius: 16,
                        padding: '16px',
                        border: isSelected ? '1px solid #135d79' : '1px solid #e2e8f0',
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 8px 24px rgba(19, 93, 121, 0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s cubic-bezier(0.28, 0.11, 0.32, 1)',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: sat.isOnline ? '#22c55e' : '#ef4444',
                            boxShadow: sat.isOnline ? '0 0 8px #22c55e' : 'none'
                          }} />
                          <span style={{ fontSize: 14, fontWeight: 700 }}>{sat.name}</span>
                        </div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 8,
                          background: isSelected ? 'rgba(255,255,255,0.2)' : sat.isActive ? '#dcfce7' : '#fee2e2',
                          color: isSelected ? '#fff' : sat.isActive ? '#15803d' : '#b91c1c'
                        }}>
                          {sat.isActive ? 'مفعلة' : 'معطلة'}
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: isSelected ? 'rgba(255,255,255,0.8)' : '#64748b', marginBottom: 12, lineHeight: 1.5 }}>
                        {sat.description}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: isSelected ? 'rgba(255,255,255,0.9)' : '#475569', borderTop: isSelected ? '1px solid rgba(255,255,255,0.15)' : '1px solid #f1f5f9', paddingTop: 8 }}>
                        <span>🏢 {sat.allowedDepartments?.length || 0} إدارات</span>
                        <span>👤 {sat.allowedUserIds?.length || 0} موظف مستثنى</span>
                        <span style={{ color: sat.isOnline ? (isSelected ? '#86efac' : '#16a34a') : (isSelected ? '#fca5a5' : '#dc2626') }}>
                          {sat.isOnline ? `${sat.latencyMs}ms` : 'غير متصل'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Pane: Comprehensive Access Matrix & Assignment for Selected Satellite */}
            {currentSatellite ? (
              <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '24px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                {/* Selected Satellite Header Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 18, marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                        إعدادات وتخصيص: {currentSatellite.name}
                      </h2>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 6, background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                        ID: {currentSatellite.id}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                      الرابط الداخلي: <code style={{ direction: 'ltr', display: 'inline-block', background: '#f8fafc', padding: '2px 6px', borderRadius: 4, color: '#0369a1' }}>{currentSatellite.targetUrl}</code>
                      {currentSatellite.id === 'asset_inventory' && (
                        <span style={{ marginRight: 10, color: '#16a34a', fontWeight: 600 }}>
                          • يعمل عبر البوابة العكسية الموحدة (Proxy Gateway)
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        {/* Edit Satellite Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenEditSatelliteModal(currentSatellite)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1px solid #bae6fd',
                        background: '#f0f9ff',
                        color: '#0369a1',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                      title="تعديل اسم ورابط وبيانات المنظومة"
                    >
                      <Edit3 size={14} />
                      تعديل بيانات المنظومة
                    </button>

                    {/* Delete Satellite Button */}
                    {currentSatellite.id !== 'asset_inventory' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSatellite(currentSatellite.id, currentSatellite.name)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 10,
                          border: '1px solid #fca5a5',
                          background: '#fee2e2',
                          color: '#dc2626',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        title="حذف هذه المنظومة نهائياً"
                      >
                        <Trash2 size={14} />
                        حذف المنظومة
                      </button>
                    )}

                    {/* Ping Button */}
                    <button
                      onClick={() => handlePingSatellite(currentSatellite)}
                      disabled={pingingId === currentSatellite.id}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#334155',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Activity size={14} className={pingingId === currentSatellite.id ? 'animate-spin' : ''} />
                      {pingingId === currentSatellite.id ? 'جاري الفحص...' : 'فحص الاتصال (Ping)'}
                    </button>

                    {/* Active Toggle Switch */}
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#334155', background: '#f8fafc', padding: '6px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <input
                        type="checkbox"
                        checked={currentSatellite.isActive}
                        onChange={e => {
                          const val = e.target.checked;
                          setSatellites(prev => prev.map(s => s.id === currentSatellite.id ? { ...s, isActive: val } : s));
                        }}
                        style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#135d79' }}
                      />
                      تفعيل المنظومة للنظام
                    </label>
                  </div>
                </div>

                {/* Feedback Alerts */}
                {saveSuccessMsg && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '12px 16px', color: '#15803d', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <CheckCircle2 size={18} />
                    {saveSuccessMsg}
                  </motion.div>
                )}
                {saveErrorMsg && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: '12px 16px', color: '#b91c1c', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <AlertCircle size={18} />
                    {saveErrorMsg}
                  </motion.div>
                )}

                {/* Section 1: Department Authorization */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Building2 size={18} color="#135d79" />
                        1. تخصيص للإدارات كاملة (Department Rules)
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        أي إدارة يتم تفعيلها هنا سيتمكن كافة موظفيها من رؤية واستخدام المنظومة فوراً
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handleSelectAllDepartments}
                        style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                      >
                        تحديد كل الإدارات
                      </button>
                      <button
                        onClick={handleClearAllDepartments}
                        style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', cursor: 'pointer', fontWeight: 600 }}
                      >
                        إلغاء تحديد الكل
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #e2e8f0' }}>
                    {departments.map(dept => {
                      const isAllowed = (currentSatellite.allowedDepartments || []).includes(dept.id);
                      return (
                        <div
                          key={dept.id}
                          onClick={() => handleToggleDepartment(dept.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: isAllowed ? '#e0f2fe' : '#ffffff',
                            border: isAllowed ? '1px solid #0284c7' : '1px solid #e2e8f0',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            readOnly
                            style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#0284c7' }}
                          />
                          <span style={{ fontSize: 13, fontWeight: isAllowed ? 700 : 500, color: isAllowed ? '#0369a1' : '#334155' }}>
                            {dept.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Role Authorization */}
                <div style={{ marginBottom: 28 }}>
                  <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={18} color="#135d79" />
                    2. تخصيص للأدوار الوظيفية (Role Rules)
                  </h3>
                  <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
                    الأدوار المصرح لها بفتح المنظومة بغض النظر عن الإدارة (المدراء وأصحاب الصلاحيات القيادية والتشغيلية)
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {[
                      { key: 'super_admin', label: 'مدير عام النظام (Super Admin)' },
                      { key: 'system_director', label: 'مدير النظام (System Director)' },
                      { key: 'co_admin', label: 'مساعد مدير النظام (Co-Admin)' },
                      { key: 'dept_head', label: 'مدراء الإدارات (Dept Heads)' },
                      { key: 'team_leader', label: 'رؤساء الأقسام والفرق' },
                      { key: 'operational_user', label: 'المستخدمون التشغيليون' },
                      { key: 'IT_SUPPORT', label: 'فريق الدعم الفني وتقنية المعلومات' }
                    ].map(r => {
                      const isAllowed = (currentSatellite.allowedRoles || []).map(x => x.toLowerCase()).includes(r.key.toLowerCase());
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => handleToggleRole(r.key)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: 10,
                            border: isAllowed ? '1px solid #135d79' : '1px solid #cbd5e1',
                            background: isAllowed ? '#135d79' : '#ffffff',
                            color: isAllowed ? '#ffffff' : '#475569',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isAllowed ? <CheckCircle2 size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #94a3b8' }} />}
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Individual Employee Overrides (The core requirement requested by user) */}
                <div style={{ marginBottom: 28, background: '#f8fafc', padding: '18px 20px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <UserCheck size={18} color="#f36c21" />
                        3. التخصيص والاستثناء الفردي للموظفين بالاسم (Individual Overrides)
                      </h3>
                      <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>
                        إمكانية إضافة أو حجب موظف بعينه بالاسم (مثل نضال أبو غامجة) بغض النظر عن إدارته أو دوره
                      </p>
                    </div>

                    <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: '#ffedd5', color: '#c2410c' }}>
                      {currentSatellite.allowedUserIds?.length || 0} موظف مستثنى
                    </span>
                  </div>

                  {/* Search Input for adding employee */}
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, padding: '8px 14px', gap: 10 }}>
                      <Search size={16} color="#64748b" />
                      <input
                        type="text"
                        placeholder="ابحث عن موظف بالاسم أو المعرف أو البريد (مثال: نضال)..."
                        value={userSearchQuery}
                        onChange={e => handleUserSearchChange(e.target.value)}
                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: 13, background: 'transparent' }}
                      />
                      {isSearchingUsers && <RefreshCw size={14} className="animate-spin" color="#64748b" />}
                    </div>

                    {/* Search Dropdown Results */}
                    {userSearchResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#ffffff', borderRadius: 12, border: '1px solid #cbd5e1', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 50, maxHeight: 220, overflowY: 'auto' }}>
                        {userSearchResults.map(user => {
                          const alreadyAdded = (currentSatellite.allowedUserIds || []).includes(user.id);
                          return (
                            <div
                              key={user.id}
                              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #f1f5f9', cursor: alreadyAdded ? 'default' : 'pointer' }}
                              onClick={() => !alreadyAdded && handleAddUserOverride(user)}
                              onMouseEnter={e => !alreadyAdded && (e.currentTarget.style.background = '#f8fafc')}
                              onMouseLeave={e => !alreadyAdded && (e.currentTarget.style.background = '#ffffff')}
                            >
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                                  {user.fullName || user.username}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>
                                  {user.department?.name || 'بدون إدارة'} • معرف: #{user.id} {user.email ? `• ${user.email}` : ''}
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={alreadyAdded}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 8,
                                  border: 'none',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: alreadyAdded ? 'default' : 'pointer',
                                  background: alreadyAdded ? '#f1f5f9' : '#135d79',
                                  color: alreadyAdded ? '#94a3b8' : '#ffffff'
                                }}
                              >
                                {alreadyAdded ? 'مضاف مسبقاً' : 'إضافة استثناء +'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* List of currently assigned user overrides */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {currentSatellite.userOverrides && currentSatellite.userOverrides.length > 0 ? (
                      currentSatellite.userOverrides.map(user => (
                        <div
                          key={user.id}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 10,
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                              {user.fullName || user.username}
                            </span>
                            <span style={{ fontSize: 10, color: '#64748b', marginRight: 6 }}>
                              (ID: {user.id}{user.departmentName ? ` - ${user.departmentName}` : ''})
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveUserOverride(user.id)}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                            title="إلغاء الاستثناء"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                        لا يوجد موظفون مستثنون بشكل فردي حالياً. استخدم حقل البحث أعلاه لإضافة أي موظف.
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Sticky Save Action Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, borderTop: '1px solid #f1f5f9', paddingTop: 18 }}>
                  <div>
                    {currentSatellite.id !== 'asset_inventory' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSatellite(currentSatellite.id, currentSatellite.name)}
                        style={{
                          background: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          borderRadius: 12,
                          padding: '12px 20px',
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Trash2 size={16} />
                        حذف هذه المنظومة نهائياً
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCurrentSatellite}
                    disabled={savingSatellite}
                    style={{
                      background: 'linear-gradient(135deg, #135d79, #0d3e51)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 28px',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: savingSatellite ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(19, 93, 121, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Save size={18} />
                    {savingSatellite ? 'جاري الحفظ في قاعدة البيانات...' : 'حفظ التغييرات وتطبيقها فوراً في قاعدة البيانات'}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── TAB 2: INTERFACES & LAYOUTS HUB ───────────────────────── */}
      {activeGovernanceTab === 'LAYOUTS' && (
        <div style={{ background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <LayoutLandingView
            savedInterfaces={savedInterfaces}
            setSavedInterfaces={setSavedInterfaces}
            onLoadInterface={ui => {
              alert(`تم تحديد الواجهة: ${ui.name} (${ui.interfaceType})`);
            }}
            onDeleteInterface={handleDeleteInterface}
            onStartNewLayout={handleStartNewLayout}
          />
        </div>
      )}

      
      {/* ─── MODAL: Edit Existing Satellite System ───────────────── */}
      {showEditModal && editingSatellite && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#ffffff', borderRadius: 20, padding: '28px 32px', width: '100%', maxWidth: 540, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Edit3 size={20} color="#0284c7" />
                تعديل بيانات المنظومة: {editingSatellite.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSatellite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  اسم المنظومة (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم المنظومة"
                  value={editSatelliteForm.name}
                  onChange={e => setEditSatelliteForm({ ...editSatelliteForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  رابط الخدمة المباشر (Target URL) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="http://localhost:4000 or https://hr.internal"
                  value={editSatelliteForm.targetUrl}
                  onChange={e => setEditSatelliteForm({ ...editSatelliteForm, targetUrl: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, direction: 'ltr', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  تصنيف الخدمة
                </label>
                <select
                  value={editSatelliteForm.category}
                  onChange={e => setEditSatelliteForm({ ...editSatelliteForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                >
                  <option value="IT_OPERATIONS">تقنية المعلومات والتشغيل (IT)</option>
                  <option value="HR_SERVICES">الموارد البشرية وشؤون الموظفين</option>
                  <option value="FINANCE">المالية والمحاسبة</option>
                  <option value="COLLEAGUE_SERVICE">خدمات ومنظومات الزملاء</option>
                  <option value="GOVERNANCE">الحوكمة والامتثال</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  الوصف والغرض الإداري
                </label>
                <textarea
                  rows={3}
                  placeholder="وصف مختصر للمنظومة وما تقدمه للموظفين..."
                  value={editSatelliteForm.description}
                  onChange={e => setEditSatelliteForm({ ...editSatelliteForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingEditSatellite}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'linear-gradient(135deg, #135d79, #0d3e51)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: savingEditSatellite ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Save size={16} />
                  {savingEditSatellite ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ─── MODAL: Register New Colleague Satellite ───────────────── */}
      {showAddSatelliteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ background: '#ffffff', borderRadius: 20, padding: '28px 32px', width: '100%', maxWidth: 540, boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="#f36c21" />
                تسجيل منظومة مساندة جديدة
              </h3>
              <button onClick={() => setShowAddSatelliteModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18 }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterNewSatellite} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  المعرّف البرمجي الفريد (System ID - بالإنجليزية) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. warehouse_satellite or fleet_system"
                  value={newSatelliteForm.id}
                  onChange={e => setNewSatelliteForm({ ...newSatelliteForm, id: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, direction: 'ltr', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  اسم المنظومة (بالعربية) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: منظومة إدارة المخازن المركزية"
                  value={newSatelliteForm.name}
                  onChange={e => setNewSatelliteForm({ ...newSatelliteForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    رابط الخدمة المباشر (Target URL) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="http://localhost:5000 أو IP الزميل"
                    value={newSatelliteForm.targetUrl}
                    onChange={e => setNewSatelliteForm({ ...newSatelliteForm, targetUrl: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, direction: 'ltr', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                    المنفذ الافتراضي
                  </label>
                  <input
                    type="number"
                    value={newSatelliteForm.defaultPort}
                    onChange={e => setNewSatelliteForm({ ...newSatelliteForm, defaultPort: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, direction: 'ltr', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 4 }}>
                  الوصف الوظيفي للمنظومة
                </label>
                <textarea
                  rows={2}
                  placeholder="وصف مختصر للوظائف التي تقدمها هذه المنظومة للموظفين..."
                  value={newSatelliteForm.description}
                  onChange={e => setNewSatelliteForm({ ...newSatelliteForm, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddSatelliteModal(false)}
                  style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#135d79', color: '#fff', fontSize: 13, fontWeight: 700, cursor: registering ? 'not-allowed' : 'pointer' }}
                >
                  {registering ? 'جاري التسجيل...' : 'تسجيل المنظومة في السجل'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
