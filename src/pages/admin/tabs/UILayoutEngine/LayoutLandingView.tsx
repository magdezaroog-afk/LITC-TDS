/**
 * LITC-TS v43 — LayoutLandingView
 * =================================
 * شاشة الهبوط الرئيسية لمخصص الواجهات (بتصميم المجلدات).
 * تعرض الواجهات مجمعة حسب الإدارة أو مخصصة لمستخدمين بعينهم.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { AdminAPI } from '../../../../services/admin.api';
import { SavedInterface, WizardFormState } from './interfaceTypes';
import { CoreRole } from '../../../../types/roles';

const INTERFACE_TYPE_LABELS: Record<string, string> = {
  FUNCTIONAL: 'واجهة وظيفية (للموظف العادي)',
  OPERATIONAL: 'واجهة تشغيلية',
  LEADERSHIP: 'واجهة قيادية',
};

interface LayoutLandingViewProps {
  savedInterfaces: SavedInterface[];
  setSavedInterfaces: (val: SavedInterface[]) => void;
  onLoadInterface: (ui: SavedInterface) => void;
  onDeleteInterface: (id: string) => Promise<void>;
  onStartNewLayout: (payload: {
    name: string;
    interfaceType: SavedInterface['interfaceType'];
    roleType?: string;
    departmentId?: number;
    userId?: number;
    config?: WizardFormState;
  }) => void;
}

export const LayoutLandingView: React.FC<LayoutLandingViewProps> = ({
  savedInterfaces,
  setSavedInterfaces,
  onLoadInterface,
  onDeleteInterface,
  onStartNewLayout,
}) => {
  const [view, setView] = useState<'LANDING' | 'ADD_NEW' | 'LIST'>('LANDING');
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<SavedInterface | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Add Form State
  const [addType, setAddType] = useState<'DEPARTMENT' | 'USER' | 'GLOBAL'>('DEPARTMENT');
  const [addDeptId, setAddDeptId] = useState<number | null>(null);
  const [addUserEmail, setAddUserEmail] = useState('');
  const [addRoleType, setAddRoleType] = useState<CoreRole | ''>('');
  const [addError, setAddError] = useState('');

  useEffect(() => {
    if (view === 'ADD_NEW' && departments.length === 0) {
      setLoadingDepts(true);
      AdminAPI.getOperationalDepartments()
        .then(res => {
          if (res?.departments) setDepartments(res.departments);
        })
        .catch(() => setDepartments([]))
        .finally(() => setLoadingDepts(false));
    }
  }, [view]);

  const handleAddNewSubmit = () => {
    setAddError('');
    if (addType === 'DEPARTMENT' && !addDeptId) { setAddError('يرجى اختيار الإدارة'); return; }
    if (addType === 'DEPARTMENT' && !addRoleType) { setAddError('يرجى اختيار المستوى القيادي/التشغيلي'); return; }
    if (addType === 'USER' && !addUserEmail.trim()) { setAddError('يرجى إدخال البريد الإلكتروني للمستخدم'); return; }

    const deptName = departments.find(d => d.id === addDeptId)?.name || '';
    
    let name = 'واجهة جديدة';
    let interfaceType = 'OPERATIONAL';
    let roleType = addRoleType;

    if (addType === 'GLOBAL') {
      name = 'واجهة وظيفية مشتركة (عامة)';
      interfaceType = 'FUNCTIONAL';
      roleType = 'END_USER';
    } else if (addType === 'USER') {
      name = `واجهة مخصصة — ${addUserEmail}`;
      interfaceType = 'OPERATIONAL';
    } else {
      name = `واجهة ${roleType === 'OPERATIONAL_MANAGER' ? 'مدير' : roleType === 'SECTION_HEAD' ? 'رئيس قسم' : 'تشغيلية'} — ${deptName}`;
      interfaceType = roleType === 'OPERATIONAL_USER' ? 'OPERATIONAL' : 'LEADERSHIP';
    }

    onStartNewLayout({
      name,
      interfaceType: interfaceType as any,
      roleType: roleType || undefined,
      departmentId: addDeptId || undefined,
    });
  };

  const handleDelete = async (ui: SavedInterface) => {
    setDeleting(true);
    try {
      await onDeleteInterface(ui.id);
      setSavedInterfaces(savedInterfaces.filter(i => i.id !== ui.id));
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  // ─── Grouping Logic ───────────────────────────────────────────────────────────
  const groupedInterfaces = useMemo(() => {
    const groups: Record<string, SavedInterface[]> = {
      'الواجهات المشتركة (عامة)': [],
      'واجهات مخصصة لمستخدمين (استثناءات)': [],
    };

    savedInterfaces.forEach(ui => {
      // If we implement userId in the frontend interface in the future
      if ((ui as any).userId) {
        groups['واجهات مخصصة لمستخدمين (استثناءات)'].push(ui);
      } else if (!ui.departmentId && !ui.departmentName) {
        groups['الواجهات المشتركة (عامة)'].push(ui);
      } else {
        const deptFolder = `📁 ${ui.departmentName || 'إدارة غير معروفة'}`;
        if (!groups[deptFolder]) groups[deptFolder] = [];
        groups[deptFolder].push(ui);
      }
    });

    // Filtering
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const filteredGroups: Record<string, SavedInterface[]> = {};
      Object.entries(groups).forEach(([folder, items]) => {
        const matchingItems = items.filter(ui => ui.name.toLowerCase().includes(q) || (ui.roleType || '').toLowerCase().includes(q));
        if (matchingItems.length > 0 || folder.toLowerCase().includes(q)) {
          filteredGroups[folder] = matchingItems.length > 0 ? matchingItems : items;
        }
      });
      return filteredGroups;
    }
    
    return groups;
  }, [savedInterfaces, searchQuery]);

  // ─── Landing ─────────────────────────────────────────────────────────────────
  if (view === 'LANDING') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1D1D1F' }}>مخصص الواجهات (UI Engine)</h2>
          <p style={{ color: '#6E6E73', marginTop: 6, fontSize: 14 }}>صمّم واجهة العمل لكل إدارة ومستخدم في مؤسستك بسهولة</p>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'إضافة واجهة جديدة', icon: '✨', color: '#10b981', shadow: 'rgba(16,185,129,0.3)', action: () => setView('ADD_NEW') },
            { label: `استعراض الواجهات (${savedInterfaces.length})`, icon: '🗂️', color: '#3b82f6', shadow: 'rgba(59,130,246,0.3)', action: () => setView('LIST') },
          ].map(card => (
            <button key={card.label} onClick={card.action} style={{
              width: 240, height: 160, background: `linear-gradient(135deg, ${card.color}, ${card.color}cc)`,
              border: 'none', borderRadius: 20, color: 'white', cursor: 'pointer',
              boxShadow: `0 12px 32px ${card.shadow}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'transform 0.2s, box-shadow 0.2s',
              fontFamily: "inherit",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            >
              <span style={{ fontSize: 40 }}>{card.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{card.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─── Add New Modal/View ───────────────────────────────────────────────────────
  if (view === 'ADD_NEW') {
    return (
      <div style={{ maxWidth: 700, margin: '0 auto', padding: 30 }}>
        <button onClick={() => { setView('LANDING'); setAddError(''); }}
          style={{ background: 'transparent', border: 'none', color: '#6E6E73', cursor: 'pointer', fontSize: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← العودة
        </button>
        <h2 style={{ margin: '0 0 24px', fontSize: 20, fontWeight: 800, color: '#1D1D1F' }}>إضافة واجهة جديدة</h2>

        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { id: 'DEPARTMENT', title: 'لإدارة / قسم', icon: '🏢' },
            { id: 'USER', title: 'لمستخدم محدد (استثناء)', icon: '👤' },
            { id: 'GLOBAL', title: 'واجهة عامة', icon: '🌍' },
          ].map(card => (
            <div key={card.id} onClick={() => { setAddType(card.id as any); setAddError(''); }}
              style={{
                flex: '1 1 150px', padding: 16, borderRadius: 16, cursor: 'pointer', textAlign: 'center',
                background: addType === card.id ? '#e0e7ff' : '#F5F5F7',
                border: `2px solid ${addType === card.id ? '#4f46e5' : 'transparent'}`,
                transition: 'all 0.2s ease',
              }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
              <div style={{ fontWeight: 700, color: addType === card.id ? '#4f46e5' : '#1D1D1F', fontSize: 14 }}>{card.title}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', padding: 24, borderRadius: 14, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            {addType === 'DEPARTMENT' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#6E6E73', marginBottom: 6, fontWeight: 600 }}>الإدارة *</label>
                  {loadingDepts ? (
                    <div style={{ fontSize: 13, color: '#6E6E73' }}>جارٍ التحميل...</div>
                  ) : (
                    <select value={addDeptId || ''} onChange={e => setAddDeptId(parseInt(e.target.value) || null)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', outline: 'none', fontSize: 14 }}>
                      <option value="">-- اختر الإدارة --</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#6E6E73', marginBottom: 6, fontWeight: 600 }}>المستوى الوظيفي (Role) *</label>
                  <select value={addRoleType} onChange={e => setAddRoleType(e.target.value as CoreRole)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', outline: 'none', fontSize: 14 }}>
                    <option value="">-- اختر المستوى --</option>
                    <option value="OPERATIONAL_MANAGER">مدير إدارة (Operational Manager)</option>
                    <option value="SECTION_HEAD">رئيس قسم (Section Head)</option>
                    <option value="TEAM_LEADER">قائد فريق (Team Leader)</option>
                    <option value="OPERATIONAL_USER">موظف تشغيلي (Operational User)</option>
                  </select>
                </div>
              </>
            )}

            {addType === 'USER' && (
              <div>
                <label style={{ display: 'block', fontSize: 13, color: '#6E6E73', marginBottom: 6, fontWeight: 600 }}>البريد الإلكتروني للمستخدم *</label>
                <input type="email" value={addUserEmail} onChange={e => setAddUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.12)', outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />
              </div>
            )}
            
            {addType === 'GLOBAL' && (
              <div style={{ color: '#6E6E73', fontSize: 14, padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                سيتم إنشاء واجهة عامة تشترك فيها جميع الإدارات التي لا تملك واجهات مخصصة.
              </div>
            )}
          </div>

          {addError && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#fee2e2', borderRadius: 8, color: '#dc2626', fontSize: 13 }}>
              ⚠️ {addError}
            </div>
          )}

          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={handleAddNewSubmit}
              style={{ padding: '11px 24px', background: '#5856D6', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 15px rgba(88,86,214,0.35)' }}>
              اعتماد وبدء التصميم ←
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── List Folders ─────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 30 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <button onClick={() => setView('LANDING')}
            style={{ background: 'transparent', border: 'none', color: '#6E6E73', cursor: 'pointer', fontSize: 13, marginBottom: 8, display: 'block' }}>
            ← العودة
          </button>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1D1D1F' }}>استعراض الواجهات والمجلدات</h2>
        </div>
        <button onClick={() => setView('ADD_NEW')}
          style={{ padding: '10px 18px', background: '#5856D6', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          + واجهة جديدة
        </button>
      </div>

      <input type="text" placeholder="ابحث باسم الواجهة أو الإدارة..." value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ width: '100%', marginBottom: 20, padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', outline: 'none', fontSize: 14, boxSizing: 'border-box' }} />

      {Object.keys(groupedInterfaces).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6E6E73' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 600 }}>لا توجد واجهات مطابقة</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(groupedInterfaces).map(([folderName, items]) => {
            if (items.length === 0) return null;
            const isExpanded = expandedFolders[folderName] ?? true; // Default expanded

            return (
              <div key={folderName} style={{ background: 'white', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                {/* Folder Header */}
                <div onClick={() => toggleFolder(folderName)}
                  style={{ padding: '16px 20px', background: '#f8fafc', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{folderName.includes('📁') ? '' : folderName.includes('استثناءات') ? '👤' : '🌍'}</span>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{folderName}</h3>
                    <span style={{ background: '#e2e8f0', color: '#475569', fontSize: 12, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{items.length} واجهات</span>
                  </div>
                  <div style={{ color: '#94a3b8', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</div>
                </div>

                {/* Folder Content */}
                {isExpanded && (
                  <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                    {items.map(ui => (
                      <div key={ui.id} style={{
                        background: '#ffffff', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', padding: 16,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)', position: 'relative'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: '#1D1D1F', marginBottom: 4 }}>
                              {(ui as any).isAutoGenerated ? '⚠️ ' : ''}{ui.name}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{ui.roleType || 'عام'}</div>
                            <span style={{
                              fontSize: 11, padding: '3px 8px', borderRadius: 12,
                              background: ui.interfaceType === 'FUNCTIONAL' ? '#e0f2fe' : ui.interfaceType === 'LEADERSHIP' ? '#ede9fe' : '#d1fae5',
                              color: ui.interfaceType === 'FUNCTIONAL' ? '#0369a1' : ui.interfaceType === 'LEADERSHIP' ? '#7c3aed' : '#047857',
                              fontWeight: 600,
                            }}>
                              {INTERFACE_TYPE_LABELS[ui.interfaceType] || ui.interfaceType}
                            </span>
                          </div>
                          <button onClick={() => setConfirmDelete(ui)}
                            style={{ background: '#fee2e2', border: 'none', width: 28, height: 28, borderRadius: '50%', color: '#ef4444', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            ×
                          </button>
                        </div>
                        <button onClick={() => onLoadInterface(ui)}
                          style={{ width: '100%', padding: '8px 14px', background: '#F5F5F7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, color: '#5856D6', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          تعديل المكونات ✏️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <div style={{ background: 'white', padding: 28, borderRadius: 16, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <h3 style={{ color: '#ef4444', marginTop: 0, fontSize: 17 }}>⚠️ تأكيد الحذف</h3>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
              هل أنت متأكد من حذف الواجهة "<strong>{confirmDelete.name}</strong>"؟ لا يمكن التراجع.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => handleDelete(confirmDelete)} disabled={deleting}
                style={{ flex: 1, padding: 10, background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'جارٍ الحذف...' : 'حذف'}
              </button>
              <button onClick={() => setConfirmDelete(null)} disabled={deleting}
                style={{ flex: 1, padding: 10, background: '#F5F5F7', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
