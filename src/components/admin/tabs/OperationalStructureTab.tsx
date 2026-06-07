import React, { useState } from 'react';

// ─── Core Roles & Org Structure Interfaces ───
export type CoreRole = 'END_USER' | 'OPERATIONAL_USER' | 'TEAM_LEADER' | 'SECTION_HEAD' | 'OPERATIONAL_MANAGER' | 'SYSTEM_ADMIN' | 'IT_ADMIN';

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: CoreRole;
  positionTitle?: string;
  departmentId?: string;
  divisionId?: string;
  teamId?: string;
}

export interface OrgTeam {
  id: string;
  name: string;
  leaderId?: string;
  assignedInterfaceId?: string;
  users: OrgUser[];
}

export interface OrgDivision {
  id: string;
  name: string;
  headId?: string;
  assignedInterfaceId?: string;
  teams: OrgTeam[];
  unassignedUsers: OrgUser[];
  isIndependent: boolean;
  expanded?: boolean;
}

export interface OrgDepartment {
  id: string;
  name: string;
  managerId?: string;
  assignedInterfaceId?: string;
  divisions: OrgDivision[];
  expanded?: boolean;
}

// ─── Mock Data for Interfaces (UI Engine) ───
export interface AvailableUI {
  id: string;
  name: string;
  roleType: CoreRole;
}
const mockAvailableInterfaces: AvailableUI[] = [
  { id: 'ui_dept_mgr', name: 'لوحة التحكم المركزية للإدارة', roleType: 'OPERATIONAL_MANAGER' },
  { id: 'ui_div_head', name: 'واجهة رؤساء الأقسام', roleType: 'OPERATIONAL_MANAGER' },
  { id: 'ui_team_lead', name: 'شاشة قادة الفرق', roleType: 'OPERATIONAL_USER' },
];

// ─── Mock Data for Org Structure ───
const initialOperationalUsers: OrgUser[] = [
  { id: 'op1', name: 'م. مجدي الزروق', email: 'majdi.alzarrouk@litc.ly', employeeId: 'OP-101', role: 'OPERATIONAL_MANAGER', positionTitle: 'مدير إدارة', departmentId: 'dept_it' },
  { id: 'op2', name: 'أحمد النكوع', email: 'Ahmed.Alnakoua@litc.ly', employeeId: 'OP-102', role: 'SECTION_HEAD', departmentId: 'dept_it', divisionId: 'sec_tech_support' },
  { id: 'op3', name: 'محمود الحمالي', email: 'mahmoud.alahammali@litc.ly', employeeId: 'OP-103', role: 'TEAM_LEADER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_field_support' },
  { id: 'op4', name: 'محمد الزياني', email: 'mohammed.alzayani@litc.ly', employeeId: 'OP-104', role: 'OPERATIONAL_USER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_field_support' },
  { id: 'op5', name: 'محمد الأسطى', email: 'mohamed.alosta@litc.ly', employeeId: 'OP-105', role: 'OPERATIONAL_USER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_field_support' },
  { id: 'op6', name: 'نضال أبو غامجة', email: 'nidhal.abughamja@litc.ly', employeeId: 'OP-106', role: 'TEAM_LEADER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_evaluation_sub' },
  { id: 'op7', name: 'نصر الدين رمضان', email: 'nasruldeen.ramadhan@litc.ly', employeeId: 'OP-107', role: 'OPERATIONAL_USER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_evaluation_sub' },
  { id: 'op8', name: 'أنس بوزيان', email: 'anas.abuzayyan@litc.ly', employeeId: 'OP-108', role: 'SECTION_HEAD', departmentId: 'dept_it', divisionId: 'sec_networking' },
  { id: 'op9', name: 'أحمد المجدي', email: 'Ahmed.almajdi@litc.ly', employeeId: 'OP-109', role: 'TEAM_LEADER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_external_sub' },
  { id: 'op10', name: 'عبد الرحمن راجي', email: 'abdalrahman.ragi@litc.ly', employeeId: 'OP-110', role: 'OPERATIONAL_USER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_external_sub' }
];

const initialDepartments: OrgDepartment[] = [
  {
    id: 'dept_it',
    name: 'إدارة تقنية المعلومات',
    managerId: 'op1',
    expanded: true,
    divisions: [
      {
        id: 'sec_networking',
        name: 'قسم الشبكات',
        isIndependent: false,
        expanded: true,
        headId: 'op8',
        teams: [],
        unassignedUsers: [
           { id: 'op8', name: 'أنس بوزيان', email: 'anas.abuzayyan@litc.ly', employeeId: 'OP-108', role: 'SECTION_HEAD', departmentId: 'dept_it', divisionId: 'sec_networking' }
        ]
      },
      {
        id: 'sec_tech_support',
        name: 'قسم الدعم الفني',
        isIndependent: false,
        expanded: true,
        headId: 'op2',
        teams: [
          { 
            id: 'team_field_support', 
            name: 'فريق الدعم الميداني', 
            leaderId: 'op3',
            users: [
              { id: 'op4', name: 'محمد الزياني', email: 'mohammed.alzayani@litc.ly', employeeId: 'OP-104', role: 'OPERATIONAL_USER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_field_support' },
              { id: 'op5', name: 'محمد الأسطى', email: 'mohamed.alosta@litc.ly', employeeId: 'OP-105', role: 'OPERATIONAL_USER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_field_support' }
            ]
          },
          {
            id: 'team_evaluation_sub',
            name: 'فريق التقييم',
            leaderId: 'op6',
            users: [
              { id: 'op7', name: 'نصر الدين رمضان', email: 'nasruldeen.ramadhan@litc.ly', employeeId: 'OP-107', role: 'OPERATIONAL_USER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_evaluation_sub' }
            ]
          },
          {
            id: 'team_external_sub',
            name: 'فريق الصيانة الخارجية',
            leaderId: 'op9',
            users: [
              { id: 'op10', name: 'عبد الرحمن راجي', email: 'abdalrahman.ragi@litc.ly', employeeId: 'OP-110', role: 'OPERATIONAL_USER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_external_sub' }
            ]
          }
        ],
        unassignedUsers: [
          { id: 'op2', name: 'أحمد النكوع', email: 'Ahmed.Alnakoua@litc.ly', employeeId: 'OP-102', role: 'SECTION_HEAD', departmentId: 'dept_it', divisionId: 'sec_tech_support' },
          { id: 'op3', name: 'محمود الحمالي', email: 'mahmoud.alahammali@litc.ly', employeeId: 'OP-103', role: 'TEAM_LEADER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_field_support' },
          { id: 'op6', name: 'نضال أبو غامجة', email: 'nidhal.abughamja@litc.ly', employeeId: 'OP-106', role: 'TEAM_LEADER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_evaluation_sub' },
          { id: 'op9', name: 'أحمد المجدي', email: 'Ahmed.almajdi@litc.ly', employeeId: 'OP-109', role: 'TEAM_LEADER', departmentId: 'dept_it', divisionId: 'sec_tech_support', teamId: 'team_external_sub' }
        ]
      }
    ]
  }
];

export const OperationalStructureTab: React.FC = () => {
  const [operationalUsers, setOperationalUsers] = useState<OrgUser[]>(initialOperationalUsers);
  const [departments, setDepartments] = useState<OrgDepartment[]>(initialDepartments);
  
  // --- Org Structure Advanced V2 States ---
  const [poolSearchQuery, setPoolSearchQuery] = useState<string>('');
  const [poolFilterStatus, setPoolFilterStatus] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [selectedPoolUsers, setSelectedPoolUsers] = useState<string[]>([]);
  const [profileModalUser, setProfileModalUser] = useState<OrgUser | null>(null);
  const [assignUsersModalOpen, setAssignUsersModalOpen] = useState<boolean>(false);
  
  // --- Universal Edit Entity Modal States ---
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editEntityType, setEditEntityType] = useState<'DEPARTMENT' | 'DIVISION' | 'TEAM' | null>(null);
  const [editEntityId, setEditEntityId] = useState<string | null>(null);
  const [editEntityName, setEditEntityName] = useState<string>('');
  const [editEntityLeaderId, setEditEntityLeaderId] = useState<string>('');
  const [editEntityUiId, setEditEntityUiId] = useState<string>('');
  const [availableUIs, setAvailableUIs] = useState<AvailableUI[]>(mockAvailableInterfaces);
  
  // Advanced Dropdown & Warning States
  const [editEntityLeaderSearchTerm, setEditEntityLeaderSearchTerm] = useState<string>('');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [pendingReassignment, setPendingReassignment] = useState<{ userId: string, oldRoleName: string, newRoleName: string } | null>(null);

  // --- Computed Pool Data ---
  const filteredPool = operationalUsers.filter(u => {
    if (poolSearchQuery.trim() !== '') {
      const q = poolSearchQuery.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.employeeId.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    const isAssigned = !!u.departmentId;
    if (poolFilterStatus === 'ASSIGNED' && !isAssigned) return false;
    if (poolFilterStatus === 'UNASSIGNED' && isAssigned) return false;
    return true;
  });

  // --- Handlers ---
  const handleOpenEditModal = (type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', entity: any) => {
    setEditEntityType(type);
    setEditEntityId(entity.id);
    setEditEntityName(entity.name);
    
    const leaderId = entity.managerId || entity.headId || entity.leaderId || '';
    setEditEntityLeaderId(leaderId);
    setEditEntityUiId(entity.assignedInterfaceId || '');
    
    setEditEntityLeaderSearchTerm('');
    if (leaderId) {
      const u = operationalUsers.find(x => x.id === leaderId);
      if (u) setEditEntityLeaderSearchTerm(u.name);
    }
    setDropdownOpen(false);
    setPendingReassignment(null);
    setEditModalOpen(true);
  };

  const executeSaveEntity = (leaderIdToSave: string) => {
    // If we reassigned, we should clear the old role. Since that is complex,
    // the system will just let the user save it here, and in a real DB it would cascade.
    // For the UI, we just update the target entity.
    setDepartments(prev => {
      // Deep clone to strip old leader
      const next = JSON.parse(JSON.stringify(prev)) as OrgDepartment[];
      
      // Clear old leader if it exists somewhere else
      if (leaderIdToSave) {
        next.forEach(d => {
          if (d.managerId === leaderIdToSave && (editEntityType !== 'DEPARTMENT' || d.id !== editEntityId)) d.managerId = undefined;
          d.divisions.forEach(dv => {
            if (dv.headId === leaderIdToSave && (editEntityType !== 'DIVISION' || dv.id !== editEntityId)) dv.headId = undefined;
            dv.unassignedUsers = dv.unassignedUsers.filter(u => u.id !== leaderIdToSave);
            dv.teams.forEach(t => {
              if (t.leaderId === leaderIdToSave && (editEntityType !== 'TEAM' || t.id !== editEntityId)) t.leaderId = undefined;
              t.users = t.users.filter(u => u.id !== leaderIdToSave);
            });
          });
        });
      }

      // Now set it in the new place
      return next.map(dept => {
        if (editEntityType === 'DEPARTMENT' && dept.id === editEntityId) {
          return { ...dept, name: editEntityName, managerId: leaderIdToSave, assignedInterfaceId: editEntityUiId };
        }
        if (editEntityType === 'DIVISION' || editEntityType === 'TEAM') {
          return {
            ...dept,
            divisions: dept.divisions.map(div => {
              if (editEntityType === 'DIVISION' && div.id === editEntityId) {
                return { ...div, name: editEntityName, headId: leaderIdToSave, assignedInterfaceId: editEntityUiId };
              }
              if (editEntityType === 'TEAM') {
                return {
                  ...div,
                  teams: div.teams.map(team => {
                    if (team.id === editEntityId) {
                      return { ...team, name: editEntityName, leaderId: leaderIdToSave, assignedInterfaceId: editEntityUiId };
                    }
                    return team;
                  })
                };
              }
              return div;
            })
          };
        }
        return dept;
      });
    });
    setPendingReassignment(null);
    setEditModalOpen(false);
  };

  const handleSaveEntity = () => {
    if (!editEntityLeaderId) {
      executeSaveEntity('');
      return;
    }

    // Check if the chosen leader is already holding a role somewhere else
    let conflictRoleName = '';
    
    departments.forEach(d => {
      if (d.managerId === editEntityLeaderId && (editEntityType !== 'DEPARTMENT' || d.id !== editEntityId)) {
        conflictRoleName = `مدير إدارة التابعة لـ (${d.name})`;
      }
      d.divisions.forEach(dv => {
        if (dv.headId === editEntityLeaderId && (editEntityType !== 'DIVISION' || dv.id !== editEntityId)) {
          conflictRoleName = `رئيس قسم التابعة لـ (${dv.name})`;
        }
        if (dv.unassignedUsers.some(u => u.id === editEntityLeaderId) && conflictRoleName === '') {
           // Might be just unassigned in division
           const uRole = dv.unassignedUsers.find(u => u.id === editEntityLeaderId)?.role;
           if (uRole === 'OPERATIONAL_USER') conflictRoleName = `عضو فريق غير منسب التابعة لـ (${dv.name})`;
        }
        dv.teams.forEach(t => {
          if (t.leaderId === editEntityLeaderId && (editEntityType !== 'TEAM' || t.id !== editEntityId)) {
            conflictRoleName = `قائد فريق التابعة لـ (${t.name})`;
          }
          if (t.users.some(u => u.id === editEntityLeaderId) && conflictRoleName === '') {
             conflictRoleName = `عضو فريق التابعة لـ (${t.name})`;
          }
        });
      });
    });

    if (conflictRoleName) {
      const targetRole = editEntityType === 'DEPARTMENT' ? 'مدير إدارة' : editEntityType === 'DIVISION' ? 'رئيس قسم' : 'قائد فريق';
      setPendingReassignment({
        userId: editEntityLeaderId,
        oldRoleName: conflictRoleName,
        newRoleName: `${targetRole} (${editEntityName})`
      });
    } else {
      executeSaveEntity(editEntityLeaderId);
    }
  };

  const handleCreateNewUI = () => {
    const newUiId = 'ui_custom_' + Date.now();
    const roleTypeMap: Record<string, CoreRole> = {
      'DEPARTMENT': 'OPERATIONAL_MANAGER',
      'DIVISION': 'OPERATIONAL_MANAGER',
      'TEAM': 'OPERATIONAL_USER'
    };
    
    setAvailableUIs(prev => [...prev, {
      id: newUiId,
      name: `واجهة ${editEntityName} (جديدة)`,
      roleType: roleTypeMap[editEntityType!] || 'OPERATIONAL_USER'
    }]);
    setEditEntityUiId(newUiId);
    
    // Cross-tab Routing Event to move to UILayoutEngineTab using DOM manipulation (respecting the strict no-touch shell rule)
    setEditModalOpen(false);
    
    // Slight delay to ensure state updates
    setTimeout(() => {
      const allDivs = Array.from(document.querySelectorAll('div'));
      // Find the tab that contains "UI Layout Engine"
      const uiTab = allDivs.find(div => div.textContent && div.textContent.includes('UI Layout Engine') && div.onclick == null && div.style.cursor === 'pointer');
      
      if (uiTab) {
        (uiTab as HTMLElement).click();
      } else {
        // Fallback broad search
        const fallbackTab = allDivs.find(div => div.textContent && div.textContent.includes('UI Layout Engine'));
        if (fallbackTab) (fallbackTab as HTMLElement).click();
      }
    }, 100);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px', textAlign: 'start' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '15px 30px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)'}}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '5px' }}>🏢 الإدارة الشاملة للهيكل التشغيلي</h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>المصفوفة التنظيمية المتقدمة لتعيين وتوزيع المهندسين والموظفين التشغيليين.</p>
        </div>
      </div>

      {/* Main Content Area: Split Top/Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflow: 'hidden' }}>
        
        {/* TOP PANEL: Hierarchical Tree View */}
        <div style={{ flex: '1.2', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(148, 163, 184, 0.1)', paddingBottom: '15px' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <span style={{ background: '#3b82f6', color: '#fff', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '16px' }}>🌳</span>
              شجرة الإدارات التشغيلية
            </h3>
            <button style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}>➕ إضافة إدارة جديدة</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '15px' }} className="scrollbar-thin">
            {departments.map(dept => (
              <div key={dept.id} style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.05)', padding: '15px 20px', borderRadius: '12px', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }} onClick={() => {
                  setDepartments(prev => prev.map(d => d.id === dept.id ? { ...d, expanded: !d.expanded } : d));
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '18px', transform: dept.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#3b82f6' }}>▶</span>
                    <span style={{ fontWeight: '900', fontSize: '16px', color: '#f8fafc' }}>{dept.name}</span>
                    {dept.managerId && (
                      <span onClick={(e) => { e.stopPropagation(); setProfileModalUser(operationalUsers.find(u => u.id === dept.managerId) || null); }} style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid rgba(59,130,246,0.3)' }}>
                        مدير الإدارة: {operationalUsers.find(u => u.id === dept.managerId)?.name}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleOpenEditModal('DEPARTMENT', dept)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ تعديل</button>
                    <button style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ حذف</button>
                  </div>
                </div>
                
                {dept.expanded && (
                  <div style={{ paddingRight: '25px', marginTop: '12px', borderRight: '2px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dept.divisions.map(div => (
                      <div key={div.id}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px 18px', borderRadius: '10px', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.05)' }} onClick={() => {
                          setDepartments(prev => prev.map(d => d.id === dept.id ? {
                            ...d, divisions: d.divisions.map(dv => dv.id === div.id ? { ...dv, expanded: !dv.expanded } : dv)
                          } : d));
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '14px', transform: div.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#64748b' }}>▶</span>
                            <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#cbd5e1' }}>{div.name}</span>
                            {div.headId && (
                              <span onClick={(e) => { e.stopPropagation(); setProfileModalUser(operationalUsers.find(u => u.id === div.headId) || null); }} style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(99,102,241,0.3)' }}>
                                رئيس القسم: {operationalUsers.find(u => u.id === div.headId)?.name}
                              </span>
                            )}
                            {div.isIndependent && <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.3)' }}>مستقل</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                             <button onClick={() => handleOpenEditModal('DIVISION', div)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✏️ تعديل</button>
                             <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>➕ إضافة فريق</button>
                             <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🔄 نقل</button>
                          </div>
                        </div>
                        
                        {div.expanded && (
                          <div style={{ paddingRight: '30px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {div.teams.map(team => (
                              <div key={team.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <span style={{ fontSize: '14px' }}>🛡️</span>
                                  <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 'bold' }}>{team.name}</span>
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>({team.users.length} أعضاء)</span>
                                  {team.leaderId && (
                                    <span onClick={(e) => { e.stopPropagation(); setProfileModalUser(operationalUsers.find(u => u.id === team.leaderId) || null); }} style={{ fontSize: '10px', background: 'rgba(236, 72, 153, 0.2)', color: '#fbcfe8', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(236,72,153,0.3)' }}>
                                      قائد الفريق: {operationalUsers.find(u => u.id === team.leaderId)?.name}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                                   <button onClick={() => handleOpenEditModal('TEAM', team)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>✏️ تعديل</button>
                                   <button style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>حذف</button>
                                </div>
                              </div>
                            ))}
                            
                            {div.unassignedUsers.map(u => (
                              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '8px 15px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <span style={{ fontSize: '14px' }}>👤</span>
                                <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setProfileModalUser(u)}>{u.name}</span>
                                <span style={{ fontSize: '10px', color: '#64748b' }}>({u.employeeId})</span>
                              </div>
                            ))}

                            {div.teams.length === 0 && div.unassignedUsers.length === 0 && <div style={{ fontSize: '12px', color: '#64748b', padding: '5px 10px' }}>لا توجد بيانات تابعة.</div>}
                          </div>
                        )}
                      </div>
                    ))}
                    <button style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed #3b82f6', color: '#3b82f6', padding: '10px 16px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>➕ إضافة قسم فرعي هنا</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM PANEL: Advanced User Pool */}
        <div style={{ flex: '1', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: '#38bdf8', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontSize: '14px' }}>👥</span>
              دليل الكوادر التشغيلية (User Pool)
            </h3>
            
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="بحث بالاسم، الرقم الوظيفي، الإيميل..." 
                value={poolSearchQuery}
                onChange={e => setPoolSearchQuery(e.target.value)}
                style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '13px', width: '250px', outline: 'none' }}
              />
              <select 
                value={poolFilterStatus}
                onChange={e => setPoolFilterStatus(e.target.value as any)}
                style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#cbd5e1', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="ALL">كل الموظفين التشغيليين</option>
                <option value="ASSIGNED">المنسبين للهيكل فقط</option>
                <option value="UNASSIGNED">غير المنسبين (متاحين للتعيين)</option>
              </select>
              
              {selectedPoolUsers.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', marginLeft: '10px' }}>
                  <button style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setAssignUsersModalOpen(true)}>
                    تنسيب المحددين ({selectedPoolUsers.length})
                  </button>
                  <button style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                    إرجاع كمستخدمين عاديين
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="scrollbar-thin">
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#f8fafc' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                <tr>
                  <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <input type="checkbox" onChange={e => {
                      if (e.target.checked) setSelectedPoolUsers(filteredPool.map(u => u.id));
                      else setSelectedPoolUsers([]);
                    }} checked={selectedPoolUsers.length === filteredPool.length && filteredPool.length > 0} />
                  </th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>الرقم الوظيفي</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>الاسم</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>البريد الإلكتروني</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>الرتبة والدور</th>
                  <th style={{ padding: '12px 15px', textAlign: 'right', fontSize: '13px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>حالة التنسيب</th>
                </tr>
              </thead>
              <tbody>
                {filteredPool.map(user => {
                  const isAssigned = !!user.departmentId;
                  let assignmentText = 'غير منسب';
                  if (isAssigned) {
                    const dept = departments.find(d => d.id === user.departmentId);
                    if (user.divisionId) {
                      const div = dept?.divisions.find(dv => dv.id === user.divisionId);
                      assignmentText = `${dept?.name} - ${div?.name}`;
                    } else {
                      assignmentText = `${dept?.name}`;
                    }
                  }
                  
                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: selectedPoolUsers.includes(user.id) ? 'rgba(56, 189, 248, 0.1)' : 'transparent', transition: 'background 0.2s' }}>
                      <td style={{ padding: '12px 15px' }}>
                        <input type="checkbox" checked={selectedPoolUsers.includes(user.id)} onChange={e => {
                          if (e.target.checked) setSelectedPoolUsers(prev => [...prev, user.id]);
                          else setSelectedPoolUsers(prev => prev.filter(id => id !== user.id));
                        }} />
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '13px', color: '#cbd5e1' }}>{user.employeeId}</td>
                      <td style={{ padding: '12px 15px', fontSize: '14px', fontWeight: 'bold', color: '#f8fafc', cursor: 'pointer' }} onClick={() => setProfileModalUser(user)}>{user.name}</td>
                      <td style={{ padding: '12px 15px', fontSize: '13px', color: '#94a3b8' }}>{user.email}</td>
                      <td style={{ padding: '12px 15px', fontSize: '12px' }}>
                        <span style={{ background: user.role === 'OPERATIONAL_MANAGER' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(2, 132, 199, 0.2)', color: user.role === 'OPERATIONAL_MANAGER' ? '#c4b5fd' : '#bae6fd', padding: '4px 8px', borderRadius: '4px', border: user.role === 'OPERATIONAL_MANAGER' ? '1px solid #8b5cf6' : '1px solid #0284c7' }}>
                          {user.role === 'OPERATIONAL_MANAGER' ? 'مسؤول تشغيلي' : 'مستخدم تشغيلي'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 15px', fontSize: '12px' }}>
                        {isAssigned ? (
                          <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>✓ {assignmentText}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>- غير منسب -</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredPool.length === 0 && <div style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', padding: '40px' }}>لا يوجد مستخدمين يطابقون شروط البحث الحالية.</div>}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {profileModalUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.95)', padding: '40px', borderRadius: '20px', width: '450px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#fff', fontWeight: 'bold' }}>
                  {profileModalUser.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ color: '#f8fafc', fontSize: '22px', marginBottom: '5px', margin: 0 }}>{profileModalUser.name}</h3>
                  <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>{profileModalUser.employeeId}</p>
                </div>
              </div>
              <button onClick={() => setProfileModalUser(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>البريد الإلكتروني</div>
                <div style={{ color: '#e2e8f0', fontSize: '14px' }}>{profileModalUser.email}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>الدور الحالي</div>
                <div style={{ color: profileModalUser.role === 'OPERATIONAL_MANAGER' ? '#c4b5fd' : '#bae6fd', fontSize: '14px', fontWeight: 'bold' }}>
                  {profileModalUser.role === 'OPERATIONAL_MANAGER' ? 'مسؤول تشغيلي (Operational Manager)' : 'مستخدم تشغيلي (Operational User)'}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '10px' }}>
                <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '5px' }}>موقع التنسيب</div>
                <div style={{ color: '#e2e8f0', fontSize: '14px' }}>
                  {profileModalUser.departmentId ? (
                    <>
                      إدارة: {departments.find(d => d.id === profileModalUser.departmentId)?.name}
                      {profileModalUser.divisionId ? ` / قسم: ${departments.find(d => d.id === profileModalUser.departmentId)?.divisions.find(dv => dv.id === profileModalUser.divisionId)?.name}` : ''}
                    </>
                  ) : 'غير منسب حالياً'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Universal Edit Entity Modal */}
      {editModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.95)', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '20px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
              ✏️ تعديل {editEntityType === 'DEPARTMENT' ? 'إدارة' : editEntityType === 'DIVISION' ? 'قسم' : 'فريق'}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>الاسم والمسمى</label>
              <input 
                type="text" 
                value={editEntityName}
                onChange={e => setEditEntityName(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>الكوادر التشغيلية (تحديد المسؤول)</label>
              
              <div 
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: '#fff', fontSize: '14px', cursor: 'text', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onClick={() => setDropdownOpen(true)}
              >
                <input 
                  type="text" 
                  value={editEntityLeaderSearchTerm}
                  onChange={e => {
                    setEditEntityLeaderSearchTerm(e.target.value);
                    setDropdownOpen(true);
                    if (e.target.value === '') setEditEntityLeaderId('');
                  }}
                  placeholder="ابحث عن مسؤول (بالاسم أو الرقم)..."
                  style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '14px' }}
                />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>▼</span>
              </div>
              
              {dropdownOpen && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '5px', maxHeight: '200px', overflowY: 'auto', zIndex: 10 }}>
                  <div 
                    style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8', fontSize: '13px' }}
                    onClick={() => {
                      setEditEntityLeaderId('');
                      setEditEntityLeaderSearchTerm('');
                      setDropdownOpen(false);
                    }}
                  >
                    -- بدون مسؤول حالياً --
                  </div>
                  {operationalUsers
                    .filter(u => u.name.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) || u.employeeId.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(editEntityLeaderSearchTerm.toLowerCase()))
                    .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
                    .map(u => (
                      <div 
                        key={u.id} 
                        style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: editEntityLeaderId === u.id ? '#38bdf8' : '#e2e8f0', background: editEntityLeaderId === u.id ? 'rgba(56,189,248,0.1)' : 'transparent' }}
                        onClick={() => {
                          setEditEntityLeaderId(u.id);
                          setEditEntityLeaderSearchTerm(u.name);
                          setDropdownOpen(false);
                        }}
                      >
                        {u.name} ({u.employeeId})
                      </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '30px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 'bold' }}>تخصيص الواجهة المخصصة لهذا المنصب</label>
              <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '10px' }}>الواجهة التي سيتم عرضها لهذا المسؤول بمجرد تسجيل دخوله</p>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={editEntityUiId}
                  onChange={e => setEditEntityUiId(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)', color: '#38bdf8', fontSize: '13px', outline: 'none', fontWeight: 'bold' }}
                >
                  <option value="">-- الواجهة الافتراضية --</option>
                  {availableUIs.map(ui => (
                    <option key={ui.id} value={ui.id}>🖥️ {ui.name}</option>
                  ))}
                </select>
                <button onClick={handleCreateNewUI} style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  ➕ إنشاء واجهة جديدة
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setEditModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>إلغاء</button>
              <button onClick={handleSaveEntity} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>حفظ التعديلات</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal for Reassignment */}
      {pendingReassignment && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.95)', padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(239, 68, 68, 0.5)', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)' }}>
            <h3 style={{ color: '#fca5a5', fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> تحذير: شاغر تشغيلي محتمل!
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '25px' }}>
              المستخدم المحدد يشغل حالياً صفة <strong>{pendingReassignment.oldRoleName}</strong>. 
              <br/><br/>
              هل أنت متأكد أنك ستقوم بنقل هذا الاسم لصفة <strong>{pendingReassignment.newRoleName}</strong> داخل الهيكل التشغيلي؟
              <br/><br/>
              موافقتك ستعني نقله وإفراغ مكانه السابق.
              <br/><br/>
              هل أنت متأكد من رغبتك في إتمام النقل؟
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setPendingReassignment(null)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء التعيين</button>
              <button onClick={() => executeSaveEntity(pendingReassignment.userId)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>نعم، أتمم النقل وأفرغ المنصب القديم</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
