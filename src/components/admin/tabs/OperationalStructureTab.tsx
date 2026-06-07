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
  expanded?: boolean;
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
  const [operationalUsers, setOperationalUsers] = useState<OrgUser[]>(() => {
    const saved = localStorage.getItem('mockOperationalUsers');
    return saved ? JSON.parse(saved) : initialOperationalUsers;
  });
  const [departments, setDepartments] = useState<OrgDepartment[]>(() => {
    const saved = localStorage.getItem('mockDepartments');
    return saved ? JSON.parse(saved) : initialDepartments;
  });

  React.useEffect(() => {
    localStorage.setItem('mockOperationalUsers', JSON.stringify(operationalUsers));
  }, [operationalUsers]);

  React.useEffect(() => {
    localStorage.setItem('mockDepartments', JSON.stringify(departments));
  }, [departments]);
  
  // --- Org Structure Advanced V2 States ---
  const [poolSearchQuery, setPoolSearchQuery] = useState<string>('');
  const [poolFilterStatus, setPoolFilterStatus] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [selectedPoolUsers, setSelectedPoolUsers] = useState<string[]>([]);
  const [profileModalUser, setProfileModalUser] = useState<any>(null);

  const [filterAssignedDeptId, setFilterAssignedDeptId] = useState<string>('');
  const [filterAssignedDivId, setFilterAssignedDivId] = useState<string>('');
  const [filterAssignedTeamId, setFilterAssignedTeamId] = useState<string>('');

  const [profileEditData, setProfileEditData] = useState<any>({});
  const handleOpenProfile = (u: any) => {
     handleOpenProfile(u);
     setProfileEditData({
       name: u.name || '',
       email: u.email || `${u.employeeId}@litc.ly`,
       phone: u.phone || '',
       activeUI: u.activeUI || 'ticket_create',
       status: u.status || 'ACTIVE'
     });
  };

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

  // --- Advanced Delete Team States ---
  const [deleteTeamModalOpen, setDeleteTeamModalOpen] = useState<boolean>(false);
  const [teamToDelete, setTeamToDelete] = useState<any>(null);
  const [divisionOfTeamToDelete, setDivisionOfTeamToDelete] = useState<any>(null);
  const [deleteTeamAction, setDeleteTeamAction] = useState<'UNASSIGN' | 'MOVE_TO_DIVISION' | 'MERGE'>('MOVE_TO_DIVISION');
  const [deleteTeamTargetId, setDeleteTeamTargetId] = useState<string>('');
// --- Advanced Universal Assignment States ---
  const [conflictModalOpen, setConflictModalOpen] = useState<boolean>(false);
  const [conflictUsersList, setConflictUsersList] = useState<OrgUser[]>([]);
  
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState<boolean>(false);
  const [bulkAssignUsers, setBulkAssignUsers] = useState<string[]>([]);
  
  const [singleMoveModalOpen, setSingleMoveModalOpen] = useState<boolean>(false);
  const [singleMoveUser, setSingleMoveUser] = useState<OrgUser | null>(null);

  const [targetDeptId, setTargetDeptId] = useState<string>('');
  const [targetDivId, setTargetDivId] = useState<string>('');
  const [targetTeamId, setTargetTeamId] = useState<string>('');

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



  const handleOpenDeleteTeamModal = (team: any, division: any) => {
    if (team.users.length === 0 && !team.leaderId) {
       handleDeleteEntity('TEAM', team.id, team.name);
       return;
    }
    setTeamToDelete(team);
    setDivisionOfTeamToDelete(division);
    setDeleteTeamAction('MOVE_TO_DIVISION');
    setDeleteTeamTargetId('');
    setDeleteTeamModalOpen(true);
  };


  const executeUniversalMove = (usersToMoveIds: string[], action: 'UNASSIGN' | 'ASSIGN', destDeptId?: string, destDivId?: string, destTeamId?: string) => {
     setDepartments(prev => {
       let next = JSON.parse(JSON.stringify(prev)) as OrgDepartment[];
       
       next.forEach(dept => {
          if (dept.managerId && usersToMoveIds.includes(dept.managerId)) dept.managerId = undefined;
          dept.divisions.forEach(div => {
             if (div.headId && usersToMoveIds.includes(div.headId)) div.headId = undefined;
             div.unassignedUsers = div.unassignedUsers.filter((u: any) => !usersToMoveIds.includes(u.id));
             div.teams.forEach(team => {
                if (team.leaderId && usersToMoveIds.includes(team.leaderId)) team.leaderId = undefined;
                team.users = team.users.filter((u: any) => !usersToMoveIds.includes(u.id));
             });
          });
       });

       if (action === 'ASSIGN' && destDeptId && destDivId) {
          const usersObjs = operationalUsers.filter(u => usersToMoveIds.includes(u.id)).map(u => ({...u, role: 'OPERATIONAL_USER' as CoreRole, departmentId: destDeptId, divisionId: destDivId, teamId: destTeamId}));
          const dept = next.find(d => d.id === destDeptId);
          if (dept) {
             const div = dept.divisions.find(d => d.id === destDivId);
             if (div) {
                if (destTeamId) {
                   const team = div.teams.find(t => t.id === destTeamId);
                   if (team) team.users.push(...usersObjs);
                } else {
                   div.unassignedUsers.push(...usersObjs);
                }
             }
          }
       }
       return next;
     });

     setOperationalUsers(prev => prev.map(u => {
        if (usersToMoveIds.includes(u.id)) {
           if (action === 'UNASSIGN') {
              return { ...u, role: 'OPERATIONAL_USER', departmentId: undefined, divisionId: undefined, teamId: undefined, positionTitle: undefined };
           } else {
              return { ...u, role: 'OPERATIONAL_USER', departmentId: destDeptId, divisionId: destDivId, teamId: destTeamId, positionTitle: undefined };
           }
        }
        return u;
     }));
  };

  const handleBulkAssignClick = () => {
     const conflicts = operationalUsers.filter(u => selectedPoolUsers.includes(u.id) && !!u.departmentId);
     if (conflicts.length > 0) {
        setConflictUsersList(conflicts);
        setConflictModalOpen(true);
     } else {
        setBulkAssignUsers(selectedPoolUsers);
        setTargetDeptId(''); setTargetDivId(''); setTargetTeamId('');
        setBulkAssignModalOpen(true);
     }
  };

  const handleBulkUnassignClick = () => {
     if (window.confirm('هل أنت متأكد من إرجاع المحددين كمستخدمين عاديين وتجريدهم من انتمائهم الحالي؟')) {
        executeUniversalMove(selectedPoolUsers, 'UNASSIGN');
        setSelectedPoolUsers([]);
     }
  };

  const executeAdvancedDeleteTeam = () => {
    const usersToMove: any[] = [...teamToDelete.users];
    
    let leaderObj = null;
    if (teamToDelete.leaderId) {
       leaderObj = operationalUsers.find(u => u.id === teamToDelete.leaderId);
    }

    setDepartments(prev => {
      return prev.map(dept => {
        return {
          ...dept,
          divisions: dept.divisions.map(div => {
            if (div.id === divisionOfTeamToDelete.id) {
               const newDiv = { ...div };
               
               if (deleteTeamAction === 'UNASSIGN') {
                  // They become unassigned globally, removed from structure
               } 
               else if (deleteTeamAction === 'MOVE_TO_DIVISION') {
                  newDiv.unassignedUsers = [...newDiv.unassignedUsers, ...usersToMove.map(u => ({...u, role: 'OPERATIONAL_USER', teamId: undefined}))];
                  if (leaderObj && !newDiv.unassignedUsers.some((u: any) => u.id === leaderObj.id)) {
                     newDiv.unassignedUsers.push({...leaderObj, role: 'OPERATIONAL_USER', teamId: undefined});
                  }
               }
               else if (deleteTeamAction === 'MERGE') {
                  newDiv.teams = newDiv.teams.map((t: any) => {
                     if (t.id === deleteTeamTargetId) {
                        const tUsers = [...t.users, ...usersToMove.map(u => ({...u, teamId: t.id}))];
                        if (leaderObj && !tUsers.some((u:any) => u.id === leaderObj.id)) {
                           tUsers.push({...leaderObj, role: 'OPERATIONAL_USER', teamId: t.id});
                        }
                        return { ...t, users: tUsers };
                     }
                     return t;
                  });
               }
               newDiv.teams = newDiv.teams.filter((t: any) => t.id !== teamToDelete.id);
               return newDiv;
            }
            return div;
          })
        };
      });
    });

    setOperationalUsers(prev => prev.map(u => {
      const isMember = usersToMove.some((mu: any) => mu.id === u.id);
      const isLeader = leaderObj && leaderObj.id === u.id;
      
      if (isMember || isLeader) {
         if (deleteTeamAction === 'UNASSIGN') {
            return { ...u, departmentId: undefined, divisionId: undefined, teamId: undefined, role: 'OPERATIONAL_USER', positionTitle: undefined };
         }
         if (deleteTeamAction === 'MOVE_TO_DIVISION') {
            return { ...u, teamId: undefined, role: 'OPERATIONAL_USER' };
         }
         if (deleteTeamAction === 'MERGE') {
            return { ...u, teamId: deleteTeamTargetId, role: 'OPERATIONAL_USER' };
         }
      }
      return u;
    }));

    setDeleteTeamModalOpen(false);
  };

  const handleDeleteEntity = (type: 'DEPARTMENT' | 'DIVISION' | 'TEAM', id: string, name: string) => {
    if (!window.confirm(`هل أنت متأكد من رغبتك في حذف (${name})؟ لا يمكن التراجع عن هذا الإجراء.`)) return;

    setDepartments(prev => {
      if (type === 'DEPARTMENT') {
        return prev.filter(d => d.id !== id);
      }
      return prev.map(dept => {
        if (type === 'DIVISION') {
          return { ...dept, divisions: dept.divisions.filter(dv => dv.id !== id) };
        }
        if (type === 'TEAM') {
          return {
            ...dept,
            divisions: dept.divisions.map(div => ({
              ...div,
              teams: div.teams.filter(t => t.id !== id)
            }))
          };
        }
        return dept;
      });
    });
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
                      <span onClick={(e) => { e.stopPropagation(); handleOpenProfile(operationalUsers.find(u => u.id === dept.managerId) || null); }} style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', border: '1px solid rgba(59,130,246,0.3)' }}>
                        مدير الإدارة: {operationalUsers.find(u => u.id === dept.managerId)?.name}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleOpenEditModal('DEPARTMENT', dept)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ تعديل</button>
                    <button onClick={() => handleDeleteEntity('DEPARTMENT', dept.id, dept.name)} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ حذف</button>
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
                              <span onClick={(e) => { e.stopPropagation(); handleOpenProfile(operationalUsers.find(u => u.id === div.headId) || null); }} style={{ fontSize: '10px', background: 'rgba(99, 102, 241, 0.2)', color: '#c7d2fe', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(99,102,241,0.3)' }}>
                                رئيس القسم: {operationalUsers.find(u => u.id === div.headId)?.name}
                              </span>
                            )}
                            {div.isIndependent && <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', padding: '3px 6px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.3)' }}>مستقل</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                             <button onClick={() => handleOpenEditModal('DIVISION', div)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✏️ تعديل</button>
                             <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>➕ إضافة فريق</button>
                             <button onClick={() => handleDeleteEntity('DIVISION', div.id, div.name)} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🗑️ حذف</button>
                          </div>
                        </div>
                        
                        {div.expanded && (
                          <div style={{ paddingRight: '30px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {div.teams.map(team => (
                              <div key={team.id}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '10px 15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => {
                                  setDepartments(prev => prev.map(d => d.id === dept.id ? {
                                    ...d, divisions: d.divisions.map(dv => dv.id === div.id ? {
                                      ...dv, teams: dv.teams.map(t => t.id === team.id ? { ...t, expanded: !t.expanded } : t)
                                    } : dv)
                                  } : d));
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '12px', transform: team.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#64748b' }}>▶</span>
                                    <span style={{ fontSize: '14px' }}>🛡️</span>
                                    <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: 'bold' }}>{team.name}</span>
                                    <span style={{ fontSize: '11px', color: '#64748b' }}>({team.users.length} أعضاء)</span>
                                    {team.leaderId && (
                                      <span onClick={(e) => { e.stopPropagation(); handleOpenProfile(operationalUsers.find(u => u.id === team.leaderId) || null); }} style={{ fontSize: '10px', background: 'rgba(236, 72, 153, 0.2)', color: '#fbcfe8', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', border: '1px solid rgba(236,72,153,0.3)' }}>
                                        قائد الفريق: {operationalUsers.find(u => u.id === team.leaderId)?.name}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ display: 'flex', gap: '5px' }} onClick={e => e.stopPropagation()}>
                                     <button onClick={() => handleOpenEditModal('TEAM', team)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>✏️ تعديل</button>
                                     <button onClick={() => handleOpenDeleteTeamModal(team, div)} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>🗑️ حذف</button>
                                  </div>
                                </div>
                                {team.expanded && (
                                  <div style={{ paddingRight: '25px', marginTop: '5px', display: 'flex', flexDirection: 'column', gap: '5px', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                                    {team.users.map(u => (
                                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.01)', padding: '6px 15px', borderRadius: '6px', border: '1px dotted rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                           <span style={{ fontSize: '12px' }}>👤</span>
                                           <span style={{ fontSize: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleOpenProfile(u)}>{u.name}</span>
                                           <span style={{ fontSize: '10px', color: '#64748b' }}>({u.employeeId})</span>
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setSingleMoveUser(u); setTargetDeptId(''); setTargetDivId(''); setTargetTeamId(''); setSingleMoveModalOpen(true); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>⚙️ إدارة</button>
                                      </div>
                                    ))}
                                    {team.users.length === 0 && <div style={{ fontSize: '11px', color: '#64748b', padding: '5px 10px' }}>لا يوجد أعضاء في هذا الفريق.</div>}
                                  </div>
                                )}
                              </div>
                            ))}
                            
                            {div.unassignedUsers.map(u => (
                              <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '8px 15px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                   <span style={{ fontSize: '14px' }}>👤</span>
                                   <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleOpenProfile(u)}>{u.name}</span>
                                   <span style={{ fontSize: '10px', color: '#64748b' }}>({u.employeeId})</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); setSingleMoveUser(u); setTargetDeptId(''); setTargetDivId(''); setTargetTeamId(''); setSingleMoveModalOpen(true); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>⚙️ إدارة</button>
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
                  <button style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }} onClick={handleBulkAssignClick}>
                    تنسيب المحددين ({selectedPoolUsers.length})
                  </button>
                  <button onClick={handleBulkUnassignClick} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
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
                      <td style={{ padding: '12px 15px', fontSize: '14px', fontWeight: 'bold', color: '#f8fafc', cursor: 'pointer' }} onClick={() => handleOpenProfile(user)}>{user.name}</td>
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


      {/* Delete Team Advanced Modal */}
      {deleteTeamModalOpen && teamToDelete && divisionOfTeamToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.95)', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid rgba(239, 68, 68, 0.5)', boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.3)' }}>
            <h3 style={{ color: '#fca5a5', fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> خيارات حذف فريق ({teamToDelete.name})
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
              يحتوي هذا الفريق على <strong>{teamToDelete.users.length + (teamToDelete.leaderId ? 1 : 0)}</strong> مستخدمين (بما في ذلك قائد الفريق). يرجى تحديد مصير هؤلاء الكوادر التشغيلية قبل إتمام عملية الحذف.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: deleteTeamAction === 'MOVE_TO_DIVISION' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', cursor: 'pointer', border: deleteTeamAction === 'MOVE_TO_DIVISION' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.05)' }}>
                <input type="radio" name="deleteAction" checked={deleteTeamAction === 'MOVE_TO_DIVISION'} onChange={() => setDeleteTeamAction('MOVE_TO_DIVISION')} />
                <div>
                  <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '14px' }}>إرجاعهم تحت القسم بدون فريق</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>سيصبحون أفراداً عاديين متاحين للتعيين تحت "{divisionOfTeamToDelete.name}"</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: deleteTeamAction === 'MERGE' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', cursor: 'pointer', border: deleteTeamAction === 'MERGE' ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255,255,255,0.05)' }}>
                <input type="radio" name="deleteAction" checked={deleteTeamAction === 'MERGE'} onChange={() => setDeleteTeamAction('MERGE')} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '14px' }}>نقلهم ودمجهم مع فريق آخر داخل القسم</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>سيتم نقلهم جميعاً كأعضاء عاديين للفريق المختار</div>
                  {deleteTeamAction === 'MERGE' && (
                     <select 
                       value={deleteTeamTargetId} 
                       onChange={e => setDeleteTeamTargetId(e.target.value)} 
                       style={{ marginTop: '10px', width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
                     >
                        <option value="">-- اختر الفريق الوجهة --</option>
                        {divisionOfTeamToDelete.teams.filter((t: any) => t.id !== teamToDelete.id).map((t: any) => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                     </select>
                  )}
                </div>
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: deleteTeamAction === 'UNASSIGN' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', cursor: 'pointer', border: deleteTeamAction === 'UNASSIGN' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.05)' }}>
                <input type="radio" name="deleteAction" checked={deleteTeamAction === 'UNASSIGN'} onChange={() => setDeleteTeamAction('UNASSIGN')} />
                <div>
                  <div style={{ color: '#fca5a5', fontWeight: 'bold', fontSize: '14px' }}>تسريح إلى دليل الكوادر (خارج الهيكل)</div>
                  <div style={{ color: '#94a3b8', fontSize: '12px' }}>سيتم تجريدهم من انتمائهم بالكامل ونقلهم لحوض الموظفين غير المنسبين</div>
                </div>
              </label>

            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setDeleteTeamModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
              <button disabled={deleteTeamAction === 'MERGE' && !deleteTeamTargetId} onClick={executeAdvancedDeleteTeam} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: deleteTeamAction === 'MERGE' && !deleteTeamTargetId ? 'not-allowed' : 'pointer', opacity: deleteTeamAction === 'MERGE' && !deleteTeamTargetId ? 0.5 : 1, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}>
                 تنفيذ الإجراء والحذف
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ---------------- Advanced Assignment Modals ---------------- */}

      {/* Conflict Modal */}
      {conflictModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.95)', padding: '30px', borderRadius: '16px', width: '550px', border: '1px solid rgba(245, 158, 11, 0.5)', boxShadow: '0 25px 50px -12px rgba(245, 158, 11, 0.3)' }}>
            <h3 style={{ color: '#fcd34d', fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚠️</span> تحذير: ارتباطات تشغيلية متعارضة
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
              بعض الأسماء المحددة تشغل بالفعل وظائف وتنسيبات داخل الهيكل التشغيلي:
            </p>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }} className="scrollbar-thin">
               {conflictUsersList.map(u => {
                  let roleDesc = u.role === 'OPERATIONAL_MANAGER' ? 'مدير' : u.role === 'SECTION_HEAD' ? 'رئيس قسم' : u.role === 'TEAM_LEADER' ? 'قائد فريق' : 'عضو منسب';
                  let loc = departments.find(d => d.id === u.departmentId)?.name || '';
                  if (u.divisionId) loc += ` / ` + departments.find(d => d.id === u.departmentId)?.divisions.find(dv => dv.id === u.divisionId)?.name;
                  if (u.teamId) loc += ` / ` + departments.find(d => d.id === u.departmentId)?.divisions.find(dv => dv.id === u.divisionId)?.teams.find(t => t.id === u.teamId)?.name;
                  return (
                     <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '13px' }}>{u.name}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{roleDesc} في ({loc})</span>
                     </div>
                  )
               })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button onClick={() => setConflictModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء الإجراء</button>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                 <button onClick={() => {
                    const noConflicts = selectedPoolUsers.filter(id => !conflictUsersList.some(cu => cu.id === id));
                    if (noConflicts.length === 0) {
                       alert('لا يوجد أي مستخدم غير متعارض لنقله.');
                       setConflictModalOpen(false);
                    } else {
                       setBulkAssignUsers(noConflicts);
                       setTargetDeptId(''); setTargetDivId(''); setTargetTeamId('');
                       setConflictModalOpen(false);
                       setBulkAssignModalOpen(true);
                    }
                 }} style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid rgba(59, 130, 246, 0.5)', color: '#93c5fd', padding: '10px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                    استبعاد المتعارضين ونقل الباقي
                 </button>
                 <button onClick={() => {
                    setBulkAssignUsers(selectedPoolUsers);
                    setTargetDeptId(''); setTargetDivId(''); setTargetTeamId('');
                    setConflictModalOpen(false);
                    setBulkAssignModalOpen(true);
                 }} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)' }}>
                    تجاوز وإفراغ ونقل الجميع
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Destination Modal */}
      {bulkAssignModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.95)', padding: '30px', borderRadius: '16px', width: '500px', border: '1px solid rgba(56, 189, 248, 0.5)', boxShadow: '0 25px 50px -12px rgba(56, 189, 248, 0.3)' }}>
            <h3 style={{ color: '#38bdf8', fontSize: '20px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🎯</span> تحديد وجهة النقل لـ ({bulkAssignUsers.length}) مستخدم
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
               <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>الإدارة الوجهة</label>
                  <select value={targetDeptId} onChange={e => { setTargetDeptId(e.target.value); setTargetDivId(''); setTargetTeamId(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                     <option value="">-- اختر الإدارة --</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
               </div>
               
               {targetDeptId && (
                  <div>
                     <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>القسم الوجهة</label>
                     <select value={targetDivId} onChange={e => { setTargetDivId(e.target.value); setTargetTeamId(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">-- اختر القسم --</option>
                        {departments.find(d => d.id === targetDeptId)?.divisions.map(dv => <option key={dv.id} value={dv.id}>{dv.name}</option>)}
                     </select>
                  </div>
               )}

               {targetDivId && (
                  <div>
                     <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '5px' }}>الفريق الوجهة (اختياري)</label>
                     <select value={targetTeamId} onChange={e => setTargetTeamId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="">-- تنسيب كعضو قسم بدون فريق --</option>
                        {departments.find(d => d.id === targetDeptId)?.divisions.find(dv => dv.id === targetDivId)?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  </div>
               )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setBulkAssignModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء</button>
              <button disabled={!targetDeptId || !targetDivId} onClick={() => {
                 executeUniversalMove(bulkAssignUsers, 'ASSIGN', targetDeptId, targetDivId, targetTeamId);
                 setBulkAssignModalOpen(false);
                 setSelectedPoolUsers([]);
              }} style={{ background: '#38bdf8', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: (!targetDeptId || !targetDivId) ? 'not-allowed' : 'pointer', opacity: (!targetDeptId || !targetDivId) ? 0.5 : 1, boxShadow: '0 4px 15px rgba(56, 189, 248, 0.4)' }}>
                 تأكيد وتنسيب الجميع كأعضاء عاديين
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Move / Manage Modal for Division Unassigned */}
      {singleMoveModalOpen && singleMoveUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }}>
          <div style={{ background: 'rgba(30, 41, 59, 0.95)', padding: '30px', borderRadius: '16px', width: '450px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>⚙️</span> خيارات العضو ({singleMoveUser.name})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
               <button onClick={() => {
                  executeUniversalMove([singleMoveUser.id], 'UNASSIGN');
                  setSingleMoveModalOpen(false);
               }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'right', fontWeight: 'bold' }}>
                  تسريح وإرجاع لحوض الكوادر كمستخدم عادي
               </button>
               
               <div style={{ marginTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                  <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>أو نقله إلى مكان آخر:</div>
                  <select value={targetDeptId} onChange={e => { setTargetDeptId(e.target.value); setTargetDivId(''); setTargetTeamId(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '10px' }}>
                     <option value="">-- اختر الإدارة --</option>
                     {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {targetDeptId && (
                     <select value={targetDivId} onChange={e => { setTargetDivId(e.target.value); setTargetTeamId(''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '10px' }}>
                        <option value="">-- اختر القسم --</option>
                        {departments.find(d => d.id === targetDeptId)?.divisions.map(dv => <option key={dv.id} value={dv.id}>{dv.name}</option>)}
                     </select>
                  )}
                  {targetDivId && (
                     <select value={targetTeamId} onChange={e => setTargetTeamId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '15px' }}>
                        <option value="">-- تنسيب كعضو قسم بدون فريق --</option>
                        {departments.find(d => d.id === targetDeptId)?.divisions.find(dv => dv.id === targetDivId)?.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                  )}
                  <button disabled={!targetDeptId || !targetDivId} onClick={() => {
                     executeUniversalMove([singleMoveUser.id], 'ASSIGN', targetDeptId, targetDivId, targetTeamId);
                     setSingleMoveModalOpen(false);
                  }} style={{ width: '100%', background: '#38bdf8', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: (!targetDeptId || !targetDivId) ? 'not-allowed' : 'pointer', opacity: (!targetDeptId || !targetDivId) ? 0.5 : 1 }}>
                     تنفيذ النقل
                  </button>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
               <button onClick={() => setSingleMoveModalOpen(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#cbd5e1', padding: '8px 15px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>إغلاق</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
